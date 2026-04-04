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
import { sequelize } from '@/src/database/sequelize';
import Product from '@/src/models/product.model';
import User from '@/src/models/user.model';

export default class AddStock extends Model<
  InferAttributes<AddStock>,
  InferCreationAttributes<AddStock>
> {
  declare id: CreationOptional<string>;
  declare productId: ForeignKey<Product['id']>;
  declare userId: ForeignKey<User['id']>;
  declare quantityAdded: number;
  declare buyingPriceAdded: number;
  declare previousQuantity: number;
  declare previousBuyingPrice: number;
  declare previousSellingPrice: number;
  declare currentQuantity: number;
  declare currentBuyingPrice: number;
  declare currentSellingPrice: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare product?: NonAttribute<Product>;
  declare user?: NonAttribute<User>;
}

AddStock.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    quantityAdded: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'quantity_added',
      validate: {
        min: 1,
      },
    },
    buyingPriceAdded: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'buying_price_added',
      validate: {
        min: 0,
      },
    },
    previousQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'previous_quantity',
      validate: {
        min: 0,
      },
    },
    previousBuyingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'previous_buying_price',
      validate: {
        min: 0,
      },
    },
    previousSellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'previous_selling_price',
      validate: {
        min: 0,
      },
    },
    currentQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'current_quantity',
      validate: {
        min: 0,
      },
    },
    currentBuyingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'current_buying_price',
      validate: {
        min: 0,
      },
    },
    currentSellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'current_selling_price',
      validate: {
        min: 0,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'add_stock',
  },
);
