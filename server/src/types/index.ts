import { Request, Response } from 'express';
import { Document } from 'mongoose';
import { IUserDocument } from '../models/User';
import { IPost } from './models';

export interface JwtPayload {
  userId: string;
  email: string;
}

export type AppResponse<T = unknown> = Response & {
  deliver(data?: T): Promise<Response>;
};

export type AuthRequest = Request & {
  auth?: JwtPayload;
  user?: IUserDocument;
};

export interface JobData {
  postId: string;
  userId: string;
  platforms: string[];
  caption: string;
  media?: string[];
}

export interface BrowserAutomationResult {
  success: boolean;
  platform: string;
  message: string;
  error?: string;
  analytics?: {
    reach: number;
    likes: number;
    comments: number;
    impressions: number;
  };
}

export interface SocialAccount {
  platform: string;
  username: string;
  isConnected: boolean;
  credentials?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };
  lastUsed?: Date;
}

export interface AutomationSettings {
  userId: string;
  isEnabled: boolean;
  browserType: 'puppeteer' | 'playwright';
  headlessMode: boolean;
  retryAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

// Post Model from models.ts
export type { IPost };
export type PostDocument = IPost & Document;

// Route-specific interfaces
export interface PostParams {
  id: string;
}

export interface PostListQuery {
  status?: 'draft' | 'published';
  limit?: string;
  offset?: string;
}

// Automation Settings
export interface IAutomationSettings {
  enabled: boolean;
  startTime: Date;
}
