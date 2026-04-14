import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { logger } from "./logger";

const JWT_SECRET = process.env.SESSION_SECRET ?? "clinicians-unchained-secret";

export interface JwtPayload {
  patientId: number;
  email: string;
}

/**
 * Signs a JWT token for a patient. Long-lived (1 year).
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "365d" });
}

/**
 * Verifies and decodes a JWT token.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Express middleware that enforces JWT authentication.
 * Attaches decoded payload to req.patientPayload.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    (req as Request & { patientPayload: JwtPayload }).patientPayload = payload;
    next();
  } catch (err) {
    logger.warn({ err }, "JWT verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
