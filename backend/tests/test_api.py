"""Run from backend: .venv/Scripts/python.exe -m unittest discover -s tests -v.

Real HTTP requests, JWT authentication, PDF extraction, and an isolated SQLite DB.
Never connects to the configured application database.
"""
import json
import socket
import tempfile
import threading
import time
import unittest
from datetime import date
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import uvicorn
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app import models
from app.auth import create_access_token
from app.database import Base, get_db
from app.routers import statements


def sample_pdf():
    stream = b'BT /F1 12 Tf 40 750 Td (08/01/2026 STARBUCKS -$12.50) Tj ET'
    objects = [b'<< /Type /Catalog /Pages 2 0 R >>',
               b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
               b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
               b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
               b'<< /Length ' + str(len(stream)).encode() + b' >>\nstream\n' + stream + b'\nendstream']
    data = b'%PDF-1.4\n'; offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(data)); data += f'{i} 0 obj\n'.encode() + obj + b'\nendobj\n'
    offset = len(data)
    data += b'xref\n0 6\n0000000000 65535 f \n'
    data += b''.join(f'{n:010d} 00000 n \n'.encode() for n in offsets[1:])
    return data + f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{offset}\n%%EOF'.encode()


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        def isolated_db():
            with Session(cls.engine) as db:
                yield db
        app.dependency_overrides[get_db] = isolated_db
        cls.temp = tempfile.TemporaryDirectory()
        cls.old_upload = statements.UPLOAD_DIR
        statements.UPLOAD_DIR = cls.temp.name
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
        cls.base = f'http://127.0.0.1:{port}'
        cls.server = uvicorn.Server(uvicorn.Config(app, host='127.0.0.1', port=port, log_level='critical'))
        cls.thread = threading.Thread(target=cls.server.run, daemon=True); cls.thread.start()
        for _ in range(100):
            if cls.server.started: break
            time.sleep(.05)
        assert cls.server.started

    @classmethod
    def tearDownClass(cls):
        cls.server.should_exit = True; cls.thread.join(5)
        app.dependency_overrides.clear()
        statements.UPLOAD_DIR = cls.old_upload
        cls.temp.cleanup(); cls.engine.dispose()

    def setUp(self):
        Base.metadata.drop_all(self.engine); Base.metadata.create_all(self.engine)
        with Session(self.engine) as db:
            for uid in (1, 2):
                db.add(models.User(id=uid, email=f'user{uid}@example.com', hashed_password='unused'))
            for i, name in enumerate(['Food', 'Entertainment', 'Other'], 1):
                db.add(models.Category(id=i, name=name))
            db.add(models.Category(id=4, name='Private', is_default=False, user_id=2))
            for uid in (1, 2):
                for i, amount in enumerate([10, 11, 12, 13, 14, 100]):
                    db.add(models.Transaction(user_id=uid, category_id=1, date=date(2026, 8, i+1), description='STARBUCKS', merchant='Cafe', amount=amount, type='debit'))
                for month in (6, 7, 8):
                    db.add(models.Transaction(user_id=uid, category_id=2, date=date(2026, month, 1), description='NETFLIX', merchant='Netflix', amount=20, type='debit'))
                db.add(models.Statement(id=uid, user_id=uid, filename='fixture.pdf', status='processed'))
            db.commit()

    def request(self, path, method='GET', data=None, user=1, headers=None, raw=None):
        h = dict(headers or {})
        if user: h['Authorization'] = 'Bearer ' + create_access_token({'sub': str(user)})
        if data is not None:
            raw = json.dumps(data).encode(); h['Content-Type'] = 'application/json'
        try: response = urlopen(Request(self.base + path, method=method, data=raw, headers=h), timeout=10)
        except HTTPError as e: response = e
        body = response.read().decode()
        try: body = json.loads(body)
        except (ValueError, TypeError): pass
        return response.status, body

    def test_auth_and_profile(self):
        self.assertEqual(self.request('/auth/me', user=None)[0], 401)
        self.assertEqual(self.request('/auth/me')[1], {'id': 1, 'email': 'user1@example.com'})
        data = {'email': 'new@example.com', 'password': 'test-password-123'}
        self.assertEqual(self.request('/auth/register', 'POST', data, user=None)[0], 201)
        self.assertEqual(self.request('/auth/register', 'POST', data, user=None)[0], 400)
        status, result = self.request('/auth/login', 'POST', data, user=None)
        self.assertEqual(status, 200); self.assertIn('access_token', result)
        self.assertEqual(self.request('/auth/login', 'POST', {**data, 'password': 'wrong'}, user=None)[0], 401)

    def test_crud_and_filters(self):
        status, tx = self.request('/transactions', 'POST', {'date': '2026-08-31', 'description': 'STARBUCKS', 'amount': 8, 'type': 'debit'})
        self.assertEqual(status, 201); self.assertEqual(tx['category'], 'Food')
        path = '/transactions/' + str(tx['id'])
        self.assertEqual(self.request(path, 'PATCH', {'amount': 9})[1]['amount'], 9)
        self.assertEqual(self.request(path, 'DELETE', user=2)[0], 404)
        self.assertEqual(self.request('/transactions?date_from=2026-08-31&date_to=2026-08-31')[1][0]['id'], tx['id'])
        self.assertEqual(len(self.request('/transactions?search=Netflix')[1]), 3)
        self.assertEqual(self.request(path, 'DELETE')[0], 204)

    def test_invalid_transaction(self):
        for changes in [{'date': '2026-02-31'}, {'amount': -1}, {'type': 'invalid'}]:
            payload = {'date': '2026-08-01', 'description': 'Test', 'amount': 8, 'type': 'debit', **changes}
            self.assertEqual(self.request('/transactions', 'POST', payload)[0], 422, changes)

    def test_private_category_cannot_be_assigned(self):
        self.assertEqual(self.request('/transactions/1', 'PATCH', {'category_id': 4})[0], 404)

    def test_clear_all_is_scoped(self):
        self.request('/subscriptions/detect', 'POST'); self.request('/subscriptions/detect', 'POST', user=2)
        self.assertEqual(self.request('/transactions/all', 'DELETE', user=None)[0], 401)
        self.assertEqual(self.request('/transactions/all', 'DELETE'), (200, {'deleted_count': 9}))
        self.assertEqual(self.request('/transactions')[1], [])
        self.assertEqual(self.request('/subscriptions')[1], [])
        self.assertEqual(len(self.request('/transactions', user=2)[1]), 9)
        self.assertEqual(len(self.request('/subscriptions', user=2)[1]), 1)
        self.assertEqual(self.request('/transactions/all', 'DELETE')[1], {'deleted_count': 0})

    def test_comparison_and_details(self):
        root = '/comparisons/months/2026/8/2026/7'
        self.assertEqual(self.request(root)[1]['current_total'], 180)
        self.assertEqual(self.request(root + '/category/Food')[1]['merchants'][0]['current_amount'], 160)
        self.assertEqual(len(self.request('/comparisons/months/2026/8/category/Food/merchant/Cafe')[1]), 6)

    def test_anomaly_forecast_and_recurring(self):
        self.assertEqual([a['amount'] for a in self.request('/anomalies')[1]], [100])
        self.assertEqual(self.request('/forecast')[1]['forecast']['projection'], 73.33)
        self.assertEqual(self.request('/subscriptions/detect', 'POST')[1]['detected_count'], 1)
        self.assertEqual(self.request('/subscriptions')[1][0]['merchant'], 'Netflix')

    def test_confirm_import_once(self):
        payload = {'transactions': [{'date': '2026-08-01', 'description': 'STARBUCKS', 'merchant': 'Cafe', 'amount': 4, 'type': 'debit'}]}
        self.assertEqual(self.request('/statements/2/confirm', 'POST', payload)[0], 404)
        self.assertEqual(self.request('/statements/1/confirm', 'POST', payload)[1]['imported_count'], 1)
        self.assertEqual(self.request('/statements/1/confirm', 'POST', payload)[0], 409)

    def test_pdf_upload(self):
        boundary = 'spends-test-boundary'
        def upload(content, mime):
            body = f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="statement.pdf"\r\nContent-Type: {mime}\r\n\r\n'.encode() + content + f'\r\n--{boundary}--\r\n'.encode()
            return self.request('/statements/upload', 'POST', headers={'Content-Type': 'multipart/form-data; boundary=' + boundary}, raw=body)
        self.assertEqual(upload(b'not pdf', 'text/plain')[0], 400)
        self.assertEqual(upload(b'', 'application/pdf')[0], 400)
        self.assertEqual(upload(b'invalid', 'application/pdf')[0], 422)
        status, data = upload(sample_pdf(), 'application/pdf')
        self.assertEqual(status, 200); self.assertEqual(data['transaction_count'], 1)
        self.assertEqual(data['transactions'][0]['amount'], 12.5)

    def test_docs_and_cors(self):
        self.assertEqual(self.request('/docs', user=None)[0], 200)
        paths = self.request('/openapi.json', user=None)[1]['paths']
        for path in ('/transactions/all', '/transactions/{transaction_id}'):
            self.assertIn('delete', paths[path])
        self.assertEqual(self.request('/transactions', 'OPTIONS', user=None, headers={'Origin': 'http://localhost:5173', 'Access-Control-Request-Method': 'DELETE', 'Access-Control-Request-Headers': 'authorization'})[0], 200)


if __name__ == '__main__': unittest.main()
