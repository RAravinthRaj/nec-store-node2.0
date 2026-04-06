/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { DeliveryStatus, OrderStatus, PaidStatus } from '@/src/config/enum.config';
import { sequelize } from '@/src/database/sequelize';
import User from '@/src/models/user.model';
import OrderItem from '@/src/models/orderItem.model';

export default class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<string>;
  declare orderId: string;
  declare orderBy: ForeignKey<User['id']>;
  declare rollNumber: string;
  declare totalAmount: number;
  declare razorpayOrderId: CreationOptional<string | null>;
  declare razorpayPaymentId: CreationOptional<string | null>;
  declare razorpaySignature: CreationOptional<string | null>;
  declare deliveryStatus: CreationOptional<DeliveryStatus>;
  declare paidStatus: CreationOptional<PaidStatus>;
  declare orderStatus: CreationOptional<OrderStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare products?: NonAttribute<OrderItem[]>;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'order_id_code',
    },
    orderBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_by',
    },
    rollNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'roll_number',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
    },
    razorpayOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'razorpay_order_id',
    },
    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'razorpay_payment_id',
    },
    razorpaySignature: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'razorpay_signature',
    },
    deliveryStatus: {
      type: DataTypes.ENUM(...Object.values(DeliveryStatus)),
      allowNull: false,
      defaultValue: DeliveryStatus.NOT_DELIVERED,
      field: 'delivery_status',
    },
    paidStatus: {
      type: DataTypes.ENUM(...Object.values(PaidStatus)),
      allowNull: false,
      defaultValue: PaidStatus.UNPAID,
      field: 'paid_status',
    },
    orderStatus: {
      type: DataTypes.ENUM(...Object.values(OrderStatus)),
      allowNull: false,
      defaultValue: OrderStatus.CREATED,
      field: 'order_status',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'orders',
  },
);
