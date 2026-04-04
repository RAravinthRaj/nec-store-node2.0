/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request, Response, CookieOptions } from 'express';
import { config } from '@/src/config/config';

export const AUTH_COOKIE_NAME = 'nec_store_auth';
export const SIGN_IN_COOKIE_NAME = 'nec_store_signin';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: config.cookieSameSite,
  secure: config.nodeEnv === 'production',
  path: '/',
};

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie(AUTH_COOKIE_NAME, token, baseCookieOptions);
};

export const setSignInCookie = (res: Response, token: string) => {
  res.cookie(SIGN_IN_COOKIE_NAME, token, baseCookieOptions);
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...baseCookieOptions });
  res.clearCookie(SIGN_IN_COOKIE_NAME, { ...baseCookieOptions });
};

export const clearSignInCookie = (res: Response) => {
  res.clearCookie(SIGN_IN_COOKIE_NAME, { ...baseCookieOptions });
};

const parseCookieHeader = (cookieHeader?: string) => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const item of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rawValue.join('='));
  }

  return cookies;
};

export const getCookieValue = (req: Request, name: string) => {
  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies[name];
};
