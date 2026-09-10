# SpendS — Smart Spending

A full-stack financial statement intelligence platform. Upload a bank/credit card statement (PDF) and SpendS extracts, categorizes, and explains your spending with a focus on one core question: **what changed since last month, and why?**

**Live app:** https://spends-frontend.onrender.com
**API docs:** https://spends-backend.onrender.com/docs

---

## The problem

Bank statements give you raw transaction data. They don't tell you why your spending went up, which merchants drove the increase, whether a purchase is unusual for you, or which subscriptions you're quietly paying for every month. SpendS automates that analysis instead of leaving it to a spreadsheet.

## Core features

- **PDF statement upload** — extraction via a modular parser (pdfplumber + regex-based line parsing), with a mandatory human review step before anything is saved (never auto-imports unreviewed data)
- **Transaction categorization** — rule-based baseline, upgraded to a TF-IDF + Logistic Regression classifier trained on the app's own labeled data, with automatic fallback to rules if no model is trained yet
- **Monthly comparison with drill-down** — total → category → merchant → individual transactions, answering "why did I spend more" at every level of granularity
- **Recurring payment detection** — purely algorithmic (consistent amount + consistent ~monthly interval), no hardcoded list of known subscription services
- **Anomaly detection** — IQR-based statistical outlier flagging, per category
- **Spending forecasting** — moving-average projection with honest, backtested accuracy reporting
- **Full auth & authorization** — JWT-based, every query scoped to the authenticated user, verified with an automated test proving one user's data is invisible to another
- **Dark mode, responsive design, and scroll-triggered animations** — a custom design system built around the app's brand identity

---

## Architecture

```
React (Vite) ──REST──▶ FastAPI ──▶ PostgreSQL
                          │
                          ├── PDF parsing (pdfplumber)
                          ├── Rule-based + ML categorization (scikit-learn)
                          ├── Comparison / drill-down engine (pandas-style aggregation)
                          ├── Recurring payment detector (statistical)
                          ├── Anomaly detector (IQR)
                          └── Forecaster (moving average)
```

Deployed as two independent services (frontend static site + backend Docker web service) plus a managed PostgreSQL database, all on Render.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React, Tailwind CSS, Vite |
| Backend | FastAPI, Pydantic |
| Database | PostgreSQL + SQLAlchemy + Alembic migrations |
| ML | scikit-learn (TF-IDF + Logistic Regression) |
| PDF processing | pdfplumber |
| Testing | Pytest |
| Containerization | Docker + Docker Compose |
| CI | GitHub Actions |
| Deployment | Render (Docker web service + static site + managed Postgres) |

---

## Setup

### Local development

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
# create a .env file — see Environment Variables below
alembic upgrade head
python -m app.seed_categories
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Database (via Docker):**
```bash
docker run --name spends-db \
  -e POSTGRES_USER=spends_user \
  -e POSTGRES_PASSWORD=spends_pass \
  -e POSTGRES_DB=spends \
  -p 5432:5432 \
  -d postgres:16
```

### Full stack via Docker Compose

```bash
docker compose up --build
```

Runs all three services (database, backend, frontend) together, matching the production architecture.

### Environment variables

`backend/.env`:
```
DATABASE_URL=postgresql://spends_user:spends_pass@localhost:5432/spends
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
ACCESS_TOKEN_EXPIRE_MINUTES=60
ENVIRONMENT=development
```

`frontend/.env` (only needed for production builds):
```
VITE_API_BASE_URL=https://your-backend-url.com
```

---

## Testing

```bash
cd backend
pytest -v
```

Covers:
- Rule-based categorization logic
- Recurring payment detection (consistent vs. inconsistent patterns)
- Anomaly detection (outliers vs. normal variation, credit exclusion)
- Authentication (register, login, wrong-password rejection)
- **Authorization** — an explicit test proving one user cannot see another user's transactions, the core security guarantee of the app

Scope note: this is a deliberately lean suite covering business logic and the most security-critical path, not exhaustive endpoint coverage — a scope decision made explicitly rather than an oversight.

---

## ML methodology

**Why rule-based before ML:** the rule-based categorizer ships first, giving every transaction a label immediately and generating the labeled training data the ML model needs — there's no chicken-and-egg problem of needing labeled data before you have any transactions.

**Training data:** a synthetic, multi-month dataset (250 transactions across 6 months) generated to serve two purposes at once — ML training data and Demo Mode seed data. Real transactions from actual statement uploads are combined with this synthetic set for training.

**Result:** ~98% accuracy on a held-out test split. **This number is honestly caveated**: the synthetic data uses clean, distinct merchant vocabulary per category, so this reflects that the pipeline is built correctly — not a claim about real-world accuracy, which would be lower given messier, more ambiguous real statement data. The one category with visibly lower recall (Travel, ~75%) is explained by having the fewest training examples — a legitimate, explainable weak spot rather than a hidden one.

**Fallback behavior:** if no model has been trained yet, categorization automatically falls back to the rule-based method — the app never has a case where categorization simply doesn't work.

---

## Known limitations

Documented honestly, not hidden:

- **Anomaly detection uses category-level baselines**, which can create false positives when a category mixes distinct sub-patterns (e.g. "Entertainment" containing both cheap subscriptions and pricier one-off game purchases) — a per-merchant baseline would be more precise but requires more repeat transactions per merchant than most categories have.
- **Recurring detection can misfire when a one-time transaction coincidentally shares a merchant name with a real subscription** — found and confirmed during development (a duplicate test-data upload broke detection for Netflix/Adobe until the underlying data was cleaned).
- **No real "Demo Mode"** — the "Try Demo" concept from the original design was replaced with a normal account-creation flow; a true zero-signup demo account is a natural next feature, not yet built.
- **JWTs cannot be revoked server-side** — a leaked token remains valid until natural expiry (60 minutes).
- **No rate limiting** on authentication endpoints.
- **Render's free-tier database has no automated backups.**
- **PDF parsing is scoped to one demonstrated statement layout**, not a general solver for arbitrary bank formats — extensible via the modular parser-profile design, but only one profile is implemented.

## Future improvements

- True demo mode (pre-seeded account, no signup required)
- Per-merchant anomaly/recurring baselines with graceful fallback to category-level when a merchant lacks history
- Additional PDF parser profiles for more statement formats
- Rate limiting on auth endpoints
- Continuous model retraining incorporating user category corrections

---

## Project background

Built as a portfolio project to demonstrate full-stack, ML, and DevOps capability for Software Engineering, AI/ML, and backend-focused internship applications. Developed in 22 phases, from initial architecture through deployment, with an emphasis on defensible, explainable decisions over impressive-sounding but unverified claims, every metric cited in this README comes from an actual measured run, not an estimate.
