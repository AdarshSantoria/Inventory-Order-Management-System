from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, engine, get_db
from app.models import Customer, Product
from app.schemas import (
    CustomerCreate,
    CustomerRead,
    DashboardSummary,
    OrderCancelResponse,
    OrderCreate,
    OrderRead,
    ProductCreate,
    ProductRead,
    ProductUpdate,
)
from app.services import (
    build_order_response,
    cancel_order,
    create_customer,
    create_order,
    create_product,
    fetch_order_or_404,
    get_dashboard_summary,
    list_orders as fetch_orders,
    update_product,
)


settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
def dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    return DashboardSummary(**get_dashboard_summary(db))


@app.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED, tags=["Products"])
def add_product(payload: ProductCreate, db: Session = Depends(get_db)) -> ProductRead:
    return ProductRead.model_validate(create_product(db, payload))


@app.get("/products", response_model=list[ProductRead], tags=["Products"])
def list_products(db: Session = Depends(get_db)) -> list[ProductRead]:
    products = db.execute(select(Product).order_by(Product.created_at.desc())).scalars().all()
    return [ProductRead.model_validate(product) for product in products]


@app.get("/products/{product_id}", response_model=ProductRead, tags=["Products"])
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductRead:
    product = db.get(Product, product_id)
    if not product:
        return _not_found("Product not found.")
    return ProductRead.model_validate(product)


@app.put("/products/{product_id}", response_model=ProductRead, tags=["Products"])
def edit_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)) -> ProductRead:
    product = db.get(Product, product_id)
    if not product:
        return _not_found("Product not found.")
    return ProductRead.model_validate(update_product(db, product, payload))


@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Products"])
def remove_product(product_id: int, db: Session = Depends(get_db)) -> Response:
    product = db.get(Product, product_id)
    if not product:
        return _not_found("Product not found.")
    db.delete(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _conflict("Product cannot be deleted while it is referenced by existing orders.") from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/customers", response_model=CustomerRead, status_code=status.HTTP_201_CREATED, tags=["Customers"])
def add_customer(payload: CustomerCreate, db: Session = Depends(get_db)) -> CustomerRead:
    return CustomerRead.model_validate(create_customer(db, payload))


@app.get("/customers", response_model=list[CustomerRead], tags=["Customers"])
def list_customers(db: Session = Depends(get_db)) -> list[CustomerRead]:
    customers = db.execute(select(Customer).order_by(Customer.created_at.desc())).scalars().all()
    return [CustomerRead.model_validate(customer) for customer in customers]


@app.get("/customers/{customer_id}", response_model=CustomerRead, tags=["Customers"])
def get_customer(customer_id: int, db: Session = Depends(get_db)) -> CustomerRead:
    customer = db.get(Customer, customer_id)
    if not customer:
        return _not_found("Customer not found.")
    return CustomerRead.model_validate(customer)


@app.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Customers"])
def remove_customer(customer_id: int, db: Session = Depends(get_db)) -> Response:
    customer = db.get(Customer, customer_id)
    if not customer:
        return _not_found("Customer not found.")
    db.delete(customer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _conflict("Customer cannot be deleted while they are referenced by existing orders.") from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def add_order(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderRead:
    order = create_order(db, payload)
    hydrated = fetch_order_or_404(db, order.id)
    return OrderRead(**build_order_response(hydrated))


@app.get("/orders", response_model=list[OrderRead], tags=["Orders"])
def list_orders(db: Session = Depends(get_db)) -> list[OrderRead]:
    return [OrderRead(**build_order_response(order)) for order in fetch_orders(db)]


@app.get("/orders/{order_id}", response_model=OrderRead, tags=["Orders"])
def get_order(order_id: int, db: Session = Depends(get_db)) -> OrderRead:
    return OrderRead(**build_order_response(fetch_order_or_404(db, order_id)))


@app.delete("/orders/{order_id}", response_model=OrderCancelResponse, tags=["Orders"])
def delete_order(order_id: int, db: Session = Depends(get_db)) -> OrderCancelResponse:
    order = fetch_order_or_404(db, order_id)
    cancelled_order = cancel_order(db, order)
    return OrderCancelResponse(
        message="Order cancelled and inventory restored.",
        order_id=cancelled_order.id,
        status=cancelled_order.status,
    )


def _not_found(detail: str):
    from fastapi import HTTPException

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _conflict(detail: str):
    from fastapi import HTTPException

    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
