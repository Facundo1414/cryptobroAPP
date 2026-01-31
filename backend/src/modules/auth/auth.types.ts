/**
 * Authentication Types and Interfaces
 * Defines all authentication-related types for the system
 */

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  createdAt?: Date;
  lastLogin?: Date;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: AuthUser;
  tokens: AuthTokens;
  message: string;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  PREMIUM = "premium",
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}
