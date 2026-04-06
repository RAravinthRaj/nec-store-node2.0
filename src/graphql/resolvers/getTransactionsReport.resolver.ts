/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Queue } from 'bullmq';
import { Role } from '../../config/enum.config';
import { getTransactions, GetTransactionsContext } from './getTransactions.resolver';
import logger from '../../utils/logger';
import { redisConnection } from '../../workers/report.worker';

interface GetTransactionsReportArgs {
  input: {
    from: string;
    to: string;
    status?: string;
    search?: string;
  };
}

const reportQueue = new Queue('report-queue', {
  connection: redisConnection,
});

export const getTransactionsReport = async (
  _: any,
  args: GetTransactionsReportArgs,
  context: GetTransactionsContext,
) => {
  try {
    const user = (context.req as any)?.user;
    if (!user?.role) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (user.role !== Role.Retailer) {
      throw new Error("You don't have enough permission to perform this operation.");
    }

    const { from, to, status, search } = args.input;
    if (!from?.trim() || !to?.trim()) {
      throw new Error('Please provide both from and to dates to generate the transactions report.');
    }

    if (new Date(from).getTime() > new Date(to).getTime()) {
      throw new Error('The from date cannot be later than the to date.');
    }

    const transactionsReport = await getTransactions(
      _,
      {
        input: {
          from,
          to,
          status,
          search,
          skip: 0,
        },
      },
      context,
    );

    await reportQueue.add('generate-transactions-report', {
      userEmail: user.email,
      userName: user.name,
      reportType: 'payment-transactions',
      reportData: transactionsReport,
      startDate: from,
      endDate: to,
    });

    return {
      message:
        'Your request has been added to the queue. The requested Transactions Report will be emailed to you shortly.',
    };
  } catch (err: any) {
    logger.error(`Error in getTransactionsReport: ${err.message || err}`);
    throw err;
  }
};
