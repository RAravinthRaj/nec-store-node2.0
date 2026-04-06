/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { config } from '../config/config';
import cors from 'cors';
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      ...config.frontendURLs,
      'https://nec.edu.in/necstoreapp',
      ...(config.nodeEnv === 'development' ? ['http://localhost:5173', 'http://localhost:5174'] : []),
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  credentials: true,
});
