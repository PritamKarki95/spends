def register_and_login(client, email, password="testpass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    response = client.post("/auth/login", json={"email": email, "password": password})
    return response.json()["access_token"]


def test_user_can_register_and_login(client):
    response = client.post(
        "/auth/register", json={"email": "alice@example.com", "password": "pass123"}
    )
    assert response.status_code == 201

    response = client.post(
        "/auth/login", json={"email": "alice@example.com", "password": "pass123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_fails_with_wrong_password(client):
    client.post(
        "/auth/register", json={"email": "bob@example.com", "password": "correctpass"}
    )
    response = client.post(
        "/auth/login", json={"email": "bob@example.com", "password": "wrongpass"}
    )
    assert response.status_code == 401


def test_protected_route_rejects_missing_token(client):
    response = client.get("/transactions")
    assert response.status_code in (
        401,
        403,
    )  # FastAPI's HTTPBearer returns 403 when no header at all


def test_user_cannot_see_another_users_transactions(client):
    """The core security guarantee of the whole app: one user's data is invisible to another."""
    token_alice = register_and_login(client, "alice2@example.com")
    token_bob = register_and_login(client, "bob2@example.com")

    # Alice creates a transaction
    client.post(
        "/transactions",
        json={
            "date": "2026-08-01",
            "description": "Alice's secret purchase",
            "merchant": "Test",
            "amount": 50.00,
            "type": "debit",
        },
        headers={"Authorization": f"Bearer {token_alice}"},
    )

    # Bob lists his transactions — should NOT include Alice's
    response = client.get(
        "/transactions", headers={"Authorization": f"Bearer {token_bob}"}
    )
    assert response.status_code == 200
    descriptions = [t["description"] for t in response.json()]
    assert "Alice's secret purchase" not in descriptions

    # Alice's own list SHOULD include it
    response = client.get(
        "/transactions", headers={"Authorization": f"Bearer {token_alice}"}
    )
    descriptions = [t["description"] for t in response.json()]
    assert "Alice's secret purchase" in descriptions
