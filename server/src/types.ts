export interface JwtPayload {
  userId: number;
  email: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export type AuthenticatedRequest = import("express").Request & { userId: number };
