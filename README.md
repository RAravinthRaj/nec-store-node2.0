NEC Store – Inventory Management System

Project Overview

NEC Store is an inventory management system with REST authentication endpoints and a GraphQL API for users, products, orders, notifications, and reporting.

Database

This project now uses MySQL with Sequelize associations instead of MongoDB.

Core relational tables:

- `users`
- `user_roles`
- `categories`
- `products`
- `orders`
- `order_items`
- `recent_products`
- `notifications`
- `otps`
- `counters`

Local MySQL setup

Create a local MySQL database, for example `nec_store`, then configure these environment variables:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=nec_store
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_SYNC_ALTER=true
REST_PORT=3000
GRAPHQL_PORT=3001
JWT_SECRET=change_me
FRONTEND_URL=http://localhost:5174
```

`MYSQL_SYNC_ALTER=true` lets Sequelize auto-sync tables during development. For safer production deployments, disable it and use migrations.

Run

```bash
yarn install
yarn dev
```
