/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import logger from '../utils/logger';
import Counter from '../models/counter.model';
import { sequelize } from '../models';

export class IdService {
  private static instance: IdService;

  private constructor() {}

  public static getInstance(): IdService {
    if (!IdService.instance) {
      IdService.instance = new IdService();
    }

    return IdService.instance;
  }

  public async getNextOrderId() {
    try {
      const count = await sequelize.transaction(async (transaction) => {
        const counter = await Counter.findByPk('orderId', {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!counter) {
          const createdCounter = await Counter.create(
            { id: 'orderId', sequenceValue: 1 },
            { transaction },
          );
          return createdCounter.sequenceValue;
        }

        counter.sequenceValue += 1;
        await counter.save({ transaction });
        return counter.sequenceValue;
      });

      return `NEC${String(count).padStart(4, '0')}`;
    } catch (err: any) {
      logger.error('Error in getNextOrderId:', err);
      throw err;
    }
  }
}
