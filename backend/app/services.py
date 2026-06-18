from collections import Counter
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import Customer, Order, OrderItem, OrderStatus, Product
from app.schemas import CustomerCreate, OrderCreate, ProductCreate, ProductUpdate


LOW_STOCK_THRESHOLD = 5


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    return _commit_or_raise(
        db,
        product,
        conflict_message="A product with this SKU already exists.",
    )


def update_product(db: Session, product: Product, payload: ProductUpdate) -> Product:
    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    return _commit_or_raise(
        db,
        product,
        conflict_message="A product with this SKU already exists.",
    )


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    customer = Customer(**payload.model_dump())
    db.add(customer)
    return _commit_or_raise(
        db,
        customer,
        conflict_message="A customer with this email already exists.",
    )


def create_order(db: Session, payload: OrderCreate) -> Order:
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    product_ids = [item.product_id for item in payload.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Each product can only appear once in an order.",
        )

    products = db.execute(
        select(Product).where(Product.id.in_(product_ids)).with_for_update()
    ).scalars().all()
    products_by_id = {product.id: product for product in products}

    missing_product_ids = [product_id for product_id in product_ids if product_id not in products_by_id]
    if missing_product_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product(s) not found: {', '.join(str(item) for item in missing_product_ids)}",
        )

    quantity_by_product = Counter({item.product_id: item.quantity for item in payload.items})
    for product_id, ordered_quantity in quantity_by_product.items():
        product = products_by_id[product_id]
        if product.quantity_in_stock < ordered_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product '{product.name}'.",
            )

    total_amount = Decimal("0.00")
    order = Order(customer_id=payload.customer_id, total_amount=Decimal("0.00"))
    db.add(order)
    db.flush()

    for item in payload.items:
        product = products_by_id[item.product_id]
        product.quantity_in_stock -= item.quantity
        line_total = product.price * item.quantity
        total_amount += line_total
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
                line_total=line_total,
            )
        )

    order.total_amount = total_amount
    return _commit_or_raise(db, order)


def cancel_order(db: Session, order: Order) -> Order:
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled.",
        )

    for item in order.items:
        product = db.get(Product, item.product_id)
        if product:
            product.quantity_in_stock += item.quantity

    order.status = OrderStatus.CANCELLED
    return _commit_or_raise(db, order)


def fetch_order_or_404(db: Session, order_id: int) -> Order:
    order = db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
    ).unique().scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order


def list_orders(db: Session) -> list[Order]:
    return (
        db.execute(
            select(Order)
            .order_by(Order.created_at.desc())
            .options(
                joinedload(Order.customer),
                joinedload(Order.items).joinedload(OrderItem.product),
            )
        )
        .unique()
        .scalars()
        .all()
    )


def build_order_response(order: Order) -> dict:
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name,
        "customer_email": order.customer.email,
        "status": order.status,
        "total_amount": order.total_amount,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name,
                "product_sku": item.product.sku,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.line_total,
            }
            for item in order.items
        ],
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


def get_dashboard_summary(db: Session) -> dict:
    total_products = db.scalar(select(func.count(Product.id))) or 0
    total_customers = db.scalar(select(func.count(Customer.id))) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0
    low_stock_products = db.execute(
        select(Product).where(Product.quantity_in_stock <= LOW_STOCK_THRESHOLD).order_by(Product.quantity_in_stock)
    ).scalars().all()

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products,
    }


def _commit_or_raise(db: Session, instance, conflict_message: str | None = None):
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if conflict_message:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=conflict_message) from exc
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to complete the request.",
        ) from exc

    db.refresh(instance)
    return instance
