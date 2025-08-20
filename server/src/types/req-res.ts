import { ObjectId } from 'mongoose';

export interface JwtPayload {
  userId: ObjectId;
  email: string;
}

export interface AuthContext {
  auth?: JwtPayload;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: unknown;
}

export type PostStatus = 'draft' | 'published' | 'archived' | 'failed' | 'scheduled';

export interface JwtPayload {
  userId: ObjectId;
  email: string;
}

export interface AuthContext {
  auth?: JwtPayload;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: unknown;
}

export type PostStatus = 'draft' | 'published' | 'archived' | 'failed' | 'scheduled';