# Production-Ready Containerized Inventory & Order Management System

Full-stack inventory and order management application built with React, FastAPI, PostgreSQL, Docker, and Docker Compose.

## Stack

- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL
- Containerization: Docker
- Orchestration: Docker Compose

## Features

- Product CRUD with unique SKU validation
- Customer creation/listing/deletion with unique email validation
- Order creation with multiple line items
- Automatic stock deduction on order creation
- Order cancellation with stock restoration
- Dashboard summary for products, customers, orders, and low-stock alerts
- Responsive frontend with inline success and error handling

## Project Structure

```text
.
├── backend
│   ├── app
│   ├── tests
│   └── Dockerfile
├── frontend
│   ├── public
│   ├── src
│   └── Dockerfile
└── docker-compose.yml
```

## API Endpoints

### Products

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`

### Customers

- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `DELETE /customers/{id}`

### Orders

- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `DELETE /orders/{id}`

### Dashboard

- `GET /dashboard/summary`
- `GET /health`

## Local Development

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set `DATABASE_URL` first if you want to run against SQLite locally, for example:

```bash
set DATABASE_URL=sqlite:///./inventory.db
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` when the backend is hosted somewhere other than `http://localhost:8000`.

## Docker Compose

1. Copy `.env.example` to `.env`
2. Review the PostgreSQL credentials
3. Start the stack:

```bash
docker compose up --build
```

Application URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Test Commands

### Backend tests

```bash
cd backend
pytest
```

### Frontend quality checks

```bash
cd frontend
npm run lint
npm run build
```

## Deployment Guide

### Backend on Render / Railway / Fly.io

- Build from the `backend` directory
- Dockerfile path: `backend/Dockerfile`
- Set `DATABASE_URL` to your managed PostgreSQL connection string
- Set `CORS_ORIGINS` to your deployed frontend URL

### Frontend on Vercel / Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_BASE_URL` or runtime `API_BASE_URL` to the deployed backend URL

## Deliverables Status

- GitHub repository link: pending account access
- Docker Hub backend image link: pending Docker Hub access
- Live frontend deployment URL: pending hosting account access
- Live backend API URL: pending hosting account access
