import 'server-only';
import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { User } from './types';

// This is the modern way to use iron-session.
// See https://www.npmjs.com/package/iron-session#nextjs-app-router-and-server-actions
export function getSession(): Promise<IronSession<User>> {
  return getIronSession<User>(cookies(), {
    password:
      process.env.SECRET_COOKIE_PASSWORD ||
      'complex_password_at_least_32_characters_long',
    cookieName: 'timaocord-session',
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  });
}
