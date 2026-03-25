import { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'dg_auth_session';

export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

const ADMIN_USERS = ['datareusx', 'mtu'] as const;

export type AdminUsername = (typeof ADMIN_USERS)[number];

export type SessionPayload = {
  username: AdminUsername;
  role: 'admin';
  iat: number;
};

function isAdminUsername(value: string): value is AdminUsername {
  return ADMIN_USERS.includes(value as AdminUsername);
}

function readSecret(): string | null {
  const secret = process.env.AUTH_SESSION_SECRET;
  return secret && secret.trim() ? secret.trim() : null;
}

function readExpectedPassword(username: AdminUsername): string | null {
  const value =
    username === 'datareusx'
      ? process.env.AUTH_PASSWORD_DATAREUSX
      : process.env.AUTH_PASSWORD_MTU;
  return value && value.length > 0 ? value : null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function toBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const bytes = fromBase64(padded);
  return new TextDecoder().decode(bytes);
}

async function signPayload(payloadBase64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadBase64));
  return toBase64(new Uint8Array(sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function validateCredentials(username: string, password: string): username is AdminUsername {
  const normalizedUsername = username.trim();
  if (!isAdminUsername(normalizedUsername)) {
    return false;
  }

  const expectedPassword = readExpectedPassword(normalizedUsername);
  if (!expectedPassword) {
    return false;
  }

  return timingSafeEqual(expectedPassword, password);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = readSecret();
  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET ist nicht gesetzt.');
  }

  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = await signPayload(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export async function readSessionFromToken(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  const secret = readSecret();
  if (!secret) {
    return null;
  }

  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) {
    return null;
  }

  const expectedSignature = await signPayload(payloadBase64, secret);
  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadBase64)) as SessionPayload;
  } catch {
    return null;
  }

  if (!payload || !isAdminUsername(payload.username) || payload.role !== 'admin') {
    return null;
  }

  if (!Number.isInteger(payload.iat)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.iat > now + 60) {
    return null;
  }
  if (now - payload.iat > SESSION_TTL_SECONDS) {
    return null;
  }

  return payload;
}

export async function readSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return readSessionFromToken(token);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}
