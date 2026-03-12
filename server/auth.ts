import type { Request, Response, NextFunction } from "express";

/** Default user ID used when auth is disabled */
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * No-op auth middleware — allows all requests through with a default user ID.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  (req as any).userId = DEFAULT_USER_ID;
  next();
}

/**
 * Returns the user ID from the request (always the default user).
 */
export function getUserId(req: Request): string {
  return (req as any).userId ?? DEFAULT_USER_ID;
}
