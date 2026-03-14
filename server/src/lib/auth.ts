import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { config } from "./config.js";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, config.jwtSecret) as AuthUser;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function getTokenFromRequest(request: Request) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length);
}
