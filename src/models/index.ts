/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { sequelize } from '../database/sequelize';
import User from './user.model';
import UserRole from './userRole.model';
import Category from './category.model';
import Product from './product.model';
import Order from './order.model';
import OrderItem from './orderItem.model';
import Notification from './notifications.model';
import RecentProduct from './recentProduct.model';
import Counter from './counter.model';
import { OtpModel } from './Otp.model';
import PaymentTransaction from './paymentTransaction.model';
import AddStock from './addStock.model';
import { config } from '../config/config';
import logger from '../utils/logger';

User.hasMany(UserRole, { foreignKey: 'userId', as: 'userRoles', onDelete: 'CASCADE' });
UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'orderBy', as: 'orders', onDelete: 'RESTRICT' });
Order.belongsTo(User, { foreignKey: 'orderBy', as: 'user' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'products', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems', onDelete: 'SET NULL' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Category.hasMany(OrderItem, { foreignKey: 'categoryId', as: 'orderItems', onDelete: 'SET NULL' });
OrderItem.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(RecentProduct, { foreignKey: 'userId', as: 'recentProducts', onDelete: 'CASCADE' });
RecentProduct.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Product.hasMany(RecentProduct, { foreignKey: 'productId', as: 'recentUsers', onDelete: 'CASCADE' });
RecentProduct.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(PaymentTransaction, {
  foreignKey: 'userId',
  as: 'paymentTransactions',
  onDelete: 'CASCADE',
});
PaymentTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasMany(PaymentTransaction, {
  foreignKey: 'orderId',
  as: 'paymentTransactions',
  onDelete: 'SET NULL',
});
PaymentTransaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(AddStock, { foreignKey: 'productId', as: 'stockEntries', onDelete: 'CASCADE' });
AddStock.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(AddStock, { foreignKey: 'userId', as: 'stockEntries', onDelete: 'CASCADE' });
AddStock.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  sequelize,
  User,
  UserRole,
  Category,
  Product,
  Order,
  OrderItem,
  Notification,
  RecentProduct,
  PaymentTransaction,
  AddStock,
  Counter,
  OtpModel,
};

export const syncDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: config.mysqlSyncAlter });
  logger.info('Database connected successfully');
};
