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

### Recommended split

- Frontend: Vercel
- Backend API: Render
- Database: Render Postgres

### Frontend on Vercel

- Import the same GitHub repository into Vercel
- Set `Root Directory` to `frontend`
- Framework preset: `Vite`
- Build command: leave Vercel default or use `npm run build`
- Output directory: leave Vercel default or use `dist`
- Add environment variable `VITE_API_BASE_URL=https://your-render-backend.onrender.com`

### Backend on Render

- Use the root-level `render.yaml` Blueprint or create a Web Service manually
- If creating manually:
- Root directory: `backend`
- Runtime: `Docker`
- Dockerfile path: `backend/Dockerfile`
- Health check path: `/health`
- Set `DATABASE_URL` from your Render Postgres instance
- Set `CORS_ORIGINS` to your deployed Vercel frontend URL, for example `https://your-project.vercel.app`

### Database on Render

- Create a free Render Postgres instance
- Copy its internal or external connection string into `DATABASE_URL`
- Keep the backend and database in the same region when possible

## Deliverables Status

- GitHub repository link: pending account access
- Docker Hub backend image link: pending Docker Hub access
- Live frontend deployment URL: pending hosting account access
- Live backend API URL: pending hosting account access
