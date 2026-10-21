import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User";
import type { AuthenticatedRequest } from "../middleware/authenticate";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

function createSessionToken(userId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

function setSessionCookie(response: Response, token: string): void {
  response.cookie("linguapro_token", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export async function register(request: Request, response: Response): Promise<void> {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Enter a valid name, email, and password of at least 8 characters." });
    return;
  }

  const email = parsed.data.email.toLowerCase();

  if (await User.findOne({ email })) {
    response.status(409).json({ message: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({ name: parsed.data.name, email, passwordHash });
  setSessionCookie(response, createSessionToken(user.id));

  response.status(201).json({ message: "Account created successfully.", data: { user: user.toJSON() } });
}

export async function login(request: Request, response: Response): Promise<void> {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Enter a valid email and password." });
    return;
  }

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    response.status(401).json({ message: "Email or password is incorrect." });
    return;
  }

  setSessionCookie(response, createSessionToken(user.id));
  response.json({ message: "Signed in successfully.", data: { user: user.toJSON() } });
}

export function logout(_request: Request, response: Response): void {
  response.clearCookie("linguapro_token", {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
  });

  response.json({ message: "Signed out successfully." });
}

export async function currentUser(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const user = await User.findById(request.userId);

  if (!user) {
    response.status(404).json({ message: "Account not found." });
    return;
  }

  response.json({ data: { user: user.toJSON() } });
}