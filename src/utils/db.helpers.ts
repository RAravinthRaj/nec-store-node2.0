/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Includeable, Op } from 'sequelize';
import { Department, Role, UserStatus } from '@/src/config/enum.config';
import {
  Category,
  Order,
  OrderItem,
  Product,
  RecentProduct,
  User,
  UserRole,
} from '@/src/models';

export const userRoleInclude: Includeable = {
  model: UserRole,
  as: 'userRoles',
  attributes: ['role'],
};

export const productCategoryInclude: Includeable = {
  model: Category,
  as: 'category',
};

export const orderProductsInclude: Includeable = {
  model: OrderItem,
  as: 'products',
  include: [
    {
      model: Category,
      as: 'category',
      required: false,
    },
  ],
};

export const orderUserInclude: Includeable = {
  model: User,
  as: 'user',
  include: [userRoleInclude],
};

export const userRecentInclude: Includeable = {
  model: RecentProduct,
  as: 'recentProducts',
  attributes: ['productId', 'updatedAt'],
};

export const getUserRoles = (user: User): Role[] => {
  return (
    user.userRoles
      ?.map((userRole) => userRole.role)
      .filter((role): role is Role => Boolean(role))
      .sort() ?? []
  );
};

export const serializeCategory = (category: Category | null | undefined) => ({
  id: category?.id ?? '',
  name: category?.name ?? '',
  createdAt: category?.createdAt?.toISOString() ?? new Date(0).toISOString(),
  updatedAt: category?.updatedAt?.toISOString() ?? new Date(0).toISOString(),
});

export const serializeProduct = (product: Product) => ({
  id: product.id,
  title: product.title,
  category: serializeCategory(product.category),
  quantity: Number(product.quantity),
  price: String(product.sellingPrice),
  buyingPrice: String(product.buyingPrice),
  sellingPrice: String(product.sellingPrice),
  productImage: product.productImage,
  isDeleted: Boolean(product.isDeleted),
  createdAt: product.createdAt?.toISOString(),
  updatedAt: product.updatedAt?.toISOString(),
});

export const serializeOrderItem = (item: OrderItem) => ({
  id: item.productId ?? item.id,
  title: item.title,
  category: item.category
    ? serializeCategory(item.category)
    : {
        id: item.categoryId ?? '',
        name: item.categoryName,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),
  },
  quantity: Number(item.quantity),
  buyingPrice: String(item.price),
  productImage: item.productImage,
  createdAt: item.createdAt?.toISOString(),
  updatedAt: item.updatedAt?.toISOString(),
});

export const serializeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  rollNumber: user.rollNumber,
  name: user.name,
  roles: getUserRoles(user),
  department: user.department as Department,
  profilePicture: user.profilePicture,
  status: user.status as UserStatus,
  recents:
    user.recentProducts
      ?.slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((item) => item.productId) ?? [],
  createdAt: user.createdAt?.toISOString(),
  updatedAt: user.updatedAt?.toISOString(),
});

export const serializeOrder = (order: Order) => ({
  id: order.id,
  orderBy: order.orderBy,
  orderId: order.orderId,
  rollNumber: order.rollNumber,
  products: order.products?.map(serializeOrderItem) ?? [],
  totalAmount: Number(order.totalAmount),
  razorpayOrderId: order.razorpayOrderId ?? null,
  razorpayPaymentId: order.razorpayPaymentId ?? null,
  deliveryStatus: order.deliveryStatus,
  paidStatus: order.paidStatus,
  orderStatus: order.orderStatus,
  createdAt: order.createdAt?.toISOString(),
  updatedAt: order.updatedAt?.toISOString(),
});

export const serializeNotification = (notification: {
  id: string;
  title: string | null;
  message: string;
  role: Role | null;
  isRead: boolean;
  createdAt?: Date;
}) => ({
  _id: notification.id,
  title: notification.title ?? '',
  message: notification.message,
  role: notification.role ?? '',
  isRead: notification.isRead,
  createdAt: notification.createdAt?.toISOString(),
});

export const findUsersByRole = (role: Role) =>
  User.findAll({
    include: [
      {
        ...userRoleInclude,
        where: { role },
      },
    ],
  });

export const likeStartsWith = (value: string) => ({ [Op.like]: `${value}%` });
export const likeContains = (value: string) => ({ [Op.like]: `%${value}%` });
