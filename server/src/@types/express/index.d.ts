import { Types } from 'mongoose';

export interface AuthenticatedUser {
  _id: Types.ObjectId;
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Response {
      deliver<T = unknown>(data?: T): this;
    }
    
    interface Request {
      auth?: {
        userId: string;
        email: string;
      };
      user?: AuthenticatedUser;
    }
  }
}