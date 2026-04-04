/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Sequelize } from 'sequelize';
import { config } from '@/src/config/config';
import logger from '@/src/utils/logger';

export const sequelize = new Sequelize(
  config.mysqlDatabase,
  config.mysqlUser,
  config.mysqlPassword,
  {
    host: config.mysqlHost,
    port: config.mysqlPort,
    dialect: 'mysql',
    logging: config.nodeEnv === 'development' ? (message) => logger.debug(message) : false,
    define: {
      underscored: true,
      freezeTableName: false,
      timestamps: true,
    },
  },
);
