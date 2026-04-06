/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/config';

export const rate_limiter = rateLimit({
  windowMs: config.rateLimitMinutes * 60 * 1000,
  max: config.rateLimitRequests,
  message: 'Too many requests, please try again later.',
  keyGenerator: (req: Request) => (req.headers.authorization as string) || req.ip || '',
});
