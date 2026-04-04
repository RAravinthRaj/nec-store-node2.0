/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { ConnectionOptions } from 'bullmq';
import { Worker } from 'bullmq';
import { MailService } from '@/src/services/mail.service';
import ExcelJS from 'exceljs';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { config } from '@/src/config/config';
import logger from '@/src/utils/logger';

export const redisConnection: ConnectionOptions = {
  host: config.redisHost,
  port: config.redisPort,
  username: config.redisUserName || undefined,
  password: config.redisPassword || undefined,
  db: config.redisDBType,
};

export function startReportWorker() {
  try {
    const worker = new Worker(
      'report-queue',
      async (job: any) => {
        const { userEmail, userName, reportData, startDate, endDate, reportType } = job.data;
        const isIncomingStockReport = reportType === 'incoming-stock';
        const isTransactionsReport = reportType === 'payment-transactions';
        const sheetName = isIncomingStockReport
          ? 'Incoming Stock Report'
          : isTransactionsReport
            ? 'Transactions Report'
            : 'Sales Report';
        const reportLabel = isIncomingStockReport
          ? 'Incoming Stock'
          : isTransactionsReport
            ? 'Transactions'
            : 'Sales';
        const attachmentName = isIncomingStockReport
          ? 'incoming-stock-report.xlsx'
          : isTransactionsReport
            ? 'transactions-report.xlsx'
            : 'sales-report.xlsx';

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(sheetName);

        if (!reportData?.items || reportData?.items.length == 0) {
          throw new Error('Requested report not found.');
        }

        const formatDate = (value?: string) => {
          if (!value) return '-';
          return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(new Date(value));
        };

        sheet.addRow(['Report Type', reportLabel]);
        if (isIncomingStockReport) {
          sheet.columns = [
            { header: 'Category', key: 'category', width: 24 },
            { header: 'Title', key: 'title', width: 32 },
            { header: 'Quantity Added', key: 'quantityAdded', width: 18 },
            { header: 'Buying Price Added', key: 'buyingPriceAdded', width: 18 },
            { header: 'Previous Quantity', key: 'previousQuantity', width: 18 },
            { header: 'Current Quantity', key: 'currentQuantity', width: 18 },
            { header: 'Added On', key: 'createdAt', width: 18 },
          ];

          reportData.items.forEach((item: any) => {
            sheet.addRow({
              category: item.product?.category?.name || 'N/A',
              title: item.product?.title || '',
              quantityAdded: item.quantityAdded ?? 0,
              buyingPriceAdded: item.buyingPriceAdded ?? 0,
              previousQuantity: item.previousQuantity ?? 0,
              currentQuantity: item.currentQuantity ?? 0,
              createdAt: formatDate(item.createdAt),
            });
          });
        } else if (isTransactionsReport) {
          sheet.columns = [
            { header: 'Razorpay Transaction ID', key: 'razorpayPaymentId', width: 28 },
            { header: 'User Roll Number', key: 'rollNumber', width: 22 },
            { header: 'Order ID', key: 'orderId', width: 18 },
            { header: 'Amount', key: 'amount', width: 16 },
            { header: 'Status', key: 'status', width: 16 },
            { header: 'Transaction Date', key: 'transactionDate', width: 20 },
          ];

          reportData.items.forEach((item: any) => {
            sheet.addRow({
              razorpayPaymentId: item.razorpayPaymentId || '-',
              rollNumber: item.rollNumber || '-',
              orderId: item.orderId || '-',
              amount: item.amount ?? 0,
              status: item.status || '-',
              transactionDate: formatDate(item.transactionDate || item.createdAt),
            });
          });
        } else {
          sheet.columns = [
            { header: 'Category', key: 'category', width: 25 },
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Sold', key: 'sold', width: 15 },
            { header: 'Left', key: 'left', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Updated On', key: 'updatedAt', width: 18 },
          ];

          reportData.items.forEach((item: any) => {
            sheet.addRow({
              category: item.category?.name || 'N/A',
              title: item.title || '',
              sold: item.sold ?? 0,
              left: item.left ?? 0,
              totalAmount: item.totalPrice ?? 0,
              updatedAt: formatDate(item.updatedAt || item.createdAt),
            });
          });
        }

        sheet.getRow(6).font = { bold: true };

        const filePrefix = isIncomingStockReport
          ? 'incoming-stock'
          : isTransactionsReport
            ? 'transactions'
            : 'sales';
        const filePath = path.join(os.tmpdir(), `${filePrefix}-${Date.now()}.xlsx`);
        await workbook.xlsx.writeFile(filePath);

        logger.info(startDate + ' ' + endDate);

        await MailService.getInstance().sendReport({
          email: userEmail,
          userName,
          startDate,
          endDate,
          attachmentPath: filePath,
          subject: `${sheetName}`,
          attachmentName,
        });

        await fs.unlink(filePath);
      },
      {
        connection: redisConnection,
      },
    );

    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    worker.on('progress', (job, progress) => {
      logger.info(`Job ${job.id} progress: ${progress}%`);
    });

    worker.on('error', (err) => {
      logger.error(`Worker error: ${err.message}`);
    });
  } catch (err: any) {
    logger.error('Error in startReportWorker:', err);
    throw err;
  }
}
