/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { isValidDepartment } from '../utils/utils';
import { Role, UserStatus, Department } from '../config/enum.config';
import { sequelize } from '../database/sequelize';
import UserRole from './userRole.model';
import RecentProduct from './recentProduct.model';

export default class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare rollNumber: string;
  declare name: string;
  declare department: Department;
  declare profilePicture: string | null;
  declare status: CreationOptional<UserStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare userRoles?: NonAttribute<UserRole[]>;
  declare recentProducts?: NonAttribute<RecentProduct[]>;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value: string) {
        this.setDataValue('email', value?.trim().toLowerCase());
      },
    },
    rollNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
      set(value: string) {
        this.setDataValue('rollNumber', value?.trim());
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      set(value: string) {
        this.setDataValue('name', value?.trim());
      },
    },
    department: {
      type: DataTypes.ENUM(...Object.values(Department)),
      allowNull: false,
      validate: {
        isValidDepartment(value: string) {
          if (!isValidDepartment(value)) {
            throw new Error(`${value} is not a valid department`);
          }
        },
      },
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      field: 'profile_picture',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      allowNull: false,
      defaultValue: UserStatus.Active,
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
    tableName: 'users',
  },
);
