import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

interface TokenPayload {
  userId: string;
}

export function authenticate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  const authorization = request.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined;
  const token = request.cookies?.linguapro_token || bearerToken;

  if (!token) {
    response.status(401).json({ message: "Please sign in to continue." });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    response.status(500).json({ message: "Authentication is not configured." });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as TokenPayload;

    if (!mongoose.isValidObjectId(payload.userId)) {
      response.status(401).json({ message: "Invalid session." });
      return;
    }

    request.userId = payload.userId;
    next();
  } catch {
    response.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}