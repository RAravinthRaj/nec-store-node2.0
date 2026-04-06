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
import { sequelize } from '../database/sequelize';
import User from './user.model';
import Order from './order.model';
import { PaymentTransactionStatus } from '../config/enum.config';

export default class PaymentTransaction extends Model<
  InferAttributes<PaymentTransaction>,
  InferCreationAttributes<PaymentTransaction>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User['id']>;
  declare orderId: CreationOptional<ForeignKey<Order['id']> | null>;
  declare gateway: string;
  declare status: PaymentTransactionStatus;
  declare amount: number;
  declare currency: string;
  declare razorpayOrderId: CreationOptional<string | null>;
  declare razorpayPaymentId: CreationOptional<string | null>;
  declare razorpaySignature: CreationOptional<string | null>;
  declare failureReason: CreationOptional<string | null>;
  declare metadata: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare order?: NonAttribute<Order>;
}

PaymentTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'order_id',
    },
    gateway: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'razorpay',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentTransactionStatus)),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'INR',
    },
    razorpayOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'razorpay_order_id',
    },
    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'razorpay_payment_id',
    },
    razorpaySignature: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'razorpay_signature',
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'failure_reason',
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'payment_transactions',
    indexes: [
      {
        unique: true,
        fields: ['razorpay_payment_id'],
      },
      {
        unique: true,
        fields: ['razorpay_order_id'],
      },
    ],
  },
);
