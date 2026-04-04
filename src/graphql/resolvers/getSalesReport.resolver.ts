/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Queue } from 'bullmq';
import { redisConnection } from '@/src/workers/report.worker';
import { Role } from '@/src/config/enum.config';
import logger from '@/src/utils/logger';
import { getSales, GetSalesContext } from '@/src/graphql/resolvers/getSales.resolver';
interface GetSalesReportArgs {
  input: {
    from: string;
    to: string;
    categoryId?: string;
    title?: string;
  };
}
const reportQueue = new Queue('report-queue', {
  connection: redisConnection,
});

export const getSalesReport = async (
  _: any,
  args: GetSalesReportArgs,
  context: GetSalesContext,
) => {
  try {
    const user = (context.req as any)?.user;
    if (!user?.role) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (user?.role !== Role.Retailer) {
      throw new Error("You don't have enough permission to perform this operation.");
    }

    const { from, to, categoryId, title } = args.input;

    const salesReport = await getSales(
      _,
      {
        input: {
          from,
          to,
          categoryId,
          title,
          skip: 0,
        },
      },
      context,
    );

    logger.info(from + ' ' + to);

    await reportQueue.add('generate-sales-report', {
      userEmail: user?.email,
      userName: user?.name,
      reportData: salesReport,
      startDate: from,
      endDate: to,
    });

    return {
      message: `Your request has been added to the queue. The requested Sales Report will be emailed to you shortly.`,
    };
  } catch (err: any) {
    logger.error(`Error in getSalesReport: ${err.message || err}`);
    throw err;
  }
};
