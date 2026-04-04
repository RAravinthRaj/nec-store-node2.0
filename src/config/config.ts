/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  restPort: number;
  graphqlPort: number;

  frontendURL: string;
  frontendURLs: string[];

  nodeEnv: string;
  mysqlHost: string;
  mysqlPort: number;
  mysqlDatabase: string;
  mysqlUser: string;
  mysqlPassword: string;
  mysqlSyncAlter: boolean;

  smtpUserName: string;
  smtpPassword: string;

  jwtSecretKey: string;
  jwtExpiryTime: any;
  jwtSignInExpiryTime: any;

  imageApiKey: string;

  rateLimitMinutes: number;
  rateLimitRequests: number;

  // redisOtpUrl: string;
  // redisOtpToken: string;

  redisHost: string;
  redisPort: number;
  redisUserName: string;
  redisPassword: string;
  redisDBType: number;

  threshold: number;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  cookieSameSite: 'lax' | 'strict' | 'none';
}

const parseFrontendURLs = (value?: string) => {
  const urls = (value || 'http://localhost:5174')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  return urls.length > 0 ? urls : ['http://localhost:5174'];
};

const frontendURLs = parseFrontendURLs(process.env.FRONTEND_URL);
const cookieSameSite =
  (process.env.COOKIE_SAME_SITE?.toLowerCase() as 'lax' | 'strict' | 'none' | undefined) ||
  (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
const mysqlSyncAlter =
  process.env.MYSQL_SYNC_ALTER !== undefined
    ? process.env.MYSQL_SYNC_ALTER === 'true'
    : process.env.NODE_ENV !== 'production';

export const config: Config = {
  restPort: Number(process.env.REST_PORT) || 3000,
  graphqlPort: Number(process.env.GRAPHQL_PORT) || 3001,

  frontendURL: frontendURLs[0],
  frontendURLs,

  nodeEnv: process.env.NODE_ENV || 'development',
  mysqlHost: process.env.MYSQL_HOST || '127.0.0.1',
  mysqlPort: Number(process.env.MYSQL_PORT) || 3306,
  mysqlDatabase: process.env.MYSQL_DATABASE || 'nec_store',
  mysqlUser: process.env.MYSQL_USER || 'root',
  mysqlPassword: process.env.MYSQL_PASSWORD || '',
  mysqlSyncAlter,

  smtpUserName: process.env.SMTP_USER_NAME || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',

  jwtSecretKey: process.env.JWT_SECRET || '',
  jwtExpiryTime: process.env.JWT_EXPIRES_IN || ' ',
  jwtSignInExpiryTime: process.env.JWT_SIGN_IN_EXPIRES_IN || ' ',

  imageApiKey: process.env.IMG_BB_API_KEY || '',

  rateLimitMinutes: Number(process.env.RATE_LIMIT_MINUTES) || 15,
  rateLimitRequests: Number(process.env.RATE_LIMIT_MAX_REQUEST) || 100,

  redisHost: process.env.REDIS_HOST || '',
  redisPort: Number(process.env.REDIS_PORT) || 3002,
  redisUserName: process.env.REDIS_USERNAME || '',
  redisPassword: process.env.REDIS_PASSWORD || '',
  redisDBType: Number(process.env.REDIS_DB) || 0,

  threshold: 10,

  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  cookieSameSite,
};

export const validateConfig = () => {
  const requiredInAllEnvs: Array<[string, string | number]> = [
    ['JWT_SECRET', config.jwtSecretKey],
    ['MYSQL_HOST', config.mysqlHost],
    ['MYSQL_DATABASE', config.mysqlDatabase],
    ['MYSQL_USER', config.mysqlUser],
  ];

  const missing = requiredInAllEnvs
    .filter(([, value]) => String(value ?? '').trim() === '')
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment configuration: ${missing.join(', ')}`);
  }

  if (config.cookieSameSite === 'none' && config.nodeEnv !== 'production') {
    throw new Error('COOKIE_SAME_SITE=none requires a secure production deployment.');
  }

  if (config.nodeEnv === 'production') {
    if (config.jwtSecretKey.trim().length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }

    const nonHttpsOrigins = config.frontendURLs.filter((origin) => !origin.startsWith('https://'));
    if (nonHttpsOrigins.length > 0) {
      throw new Error(
        `FRONTEND_URL must use https in production. Invalid origins: ${nonHttpsOrigins.join(', ')}`,
      );
    }

    if (config.mysqlSyncAlter) {
      throw new Error('MYSQL_SYNC_ALTER must be false in production. Use migrations for schema changes.');
    }

    const requiredInProduction: Array<[string, string | number]> = [
      ['REDIS_HOST', config.redisHost],
      ['SMTP_USER_NAME', config.smtpUserName],
      ['SMTP_PASSWORD', config.smtpPassword],
      ['RAZORPAY_KEY_ID', config.razorpayKeyId],
      ['RAZORPAY_KEY_SECRET', config.razorpayKeySecret],
    ];

    const missingProduction = requiredInProduction
      .filter(([, value]) => String(value ?? '').trim() === '')
      .map(([key]) => key);

    if (missingProduction.length > 0) {
      throw new Error(
        `Missing required production configuration: ${missingProduction.join(', ')}`,
      );
    }
  }
};
