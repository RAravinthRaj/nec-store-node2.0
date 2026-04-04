/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '@/src/database/sequelize';

export default class Counter extends Model<
  InferAttributes<Counter>,
  InferCreationAttributes<Counter>
> {
  declare id: string;
  declare sequenceValue: number;
}

Counter.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    sequenceValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sequence_value',
    },
  },
  {
    sequelize,
    tableName: 'counters',
    timestamps: false,
  },
);
