import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite://"

from app.database import Base, get_db
from app.main import app


SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_product_crud_and_unique_sku(client: TestClient) -> None:
    response = client.post(
        "/products",
        json={
            "name": "Wireless Mouse",
            "sku": "WM-001",
            "price": "24.99",
            "quantity_in_stock": 20,
        },
    )
    assert response.status_code == 201
    product_id = response.json()["id"]

    duplicate = client.post(
        "/products",
        json={
            "name": "Another Mouse",
            "sku": "WM-001",
            "price": "29.99",
            "quantity_in_stock": 5,
        },
    )
    assert duplicate.status_code == 409

    update = client.put(
        f"/products/{product_id}",
        json={
            "name": "Wireless Mouse Pro",
            "sku": "WM-002",
            "price": "34.99",
            "quantity_in_stock": 15,
        },
    )
    assert update.status_code == 200
    assert update.json()["sku"] == "WM-002"


def test_customer_unique_email(client: TestClient) -> None:
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone_number": "1234567890",
    }
    assert client.post("/customers", json=payload).status_code == 201
    assert client.post("/customers", json=payload).status_code == 409


def test_order_creation_reduces_inventory_and_calculates_total(client: TestClient) -> None:
    product = client.post(
        "/products",
        json={
            "name": "Keyboard",
            "sku": "KB-001",
            "price": "49.50",
            "quantity_in_stock": 10,
        },
    ).json()
    customer = client.post(
        "/customers",
        json={
            "full_name": "John Smith",
            "email": "john@example.com",
            "phone_number": "555-1000",
        },
    ).json()

    order = client.post(
        "/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 2}],
        },
    )
    assert order.status_code == 201
    body = order.json()
    assert body["total_amount"] == "99.00"
    assert body["items"][0]["line_total"] == "99.00"

    refreshed_product = client.get(f"/products/{product['id']}").json()
    assert refreshed_product["quantity_in_stock"] == 8


def test_order_fails_when_inventory_is_insufficient(client: TestClient) -> None:
    product = client.post(
        "/products",
        json={
            "name": "Monitor",
            "sku": "MN-001",
            "price": "199.99",
            "quantity_in_stock": 1,
        },
    ).json()
    customer = client.post(
        "/customers",
        json={
            "full_name": "Ava Lee",
            "email": "ava@example.com",
            "phone_number": "555-1001",
        },
    ).json()

    response = client.post(
        "/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 3}],
        },
    )
    assert response.status_code == 400
    assert "Insufficient inventory" in response.json()["detail"]


def test_cancelling_order_restores_inventory(client: TestClient) -> None:
    product = client.post(
        "/products",
        json={
            "name": "Webcam",
            "sku": "WC-001",
            "price": "70.00",
            "quantity_in_stock": 7,
        },
    ).json()
    customer = client.post(
        "/customers",
        json={
            "full_name": "Sam Carter",
            "email": "sam@example.com",
            "phone_number": "555-1002",
        },
    ).json()
    order = client.post(
        "/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 4}],
        },
    ).json()

    cancel = client.delete(f"/orders/{order['id']}")
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"

    refreshed_product = client.get(f"/products/{product['id']}").json()
    assert refreshed_product["quantity_in_stock"] == 7
