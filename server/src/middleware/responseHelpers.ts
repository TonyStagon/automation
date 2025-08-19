/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';

export const responseHelpers = (req: Request, res: Response, next: NextFunction): void => {
  // Use bracket notation to bypass TypeScript checks
  (res as any).deliver = function(data?: any) {
    this.header('Content-Type', 'application/json');
    return this.send(JSON.stringify({
      success: true, 
      data: data || {}
    }));
  };

  return next();
};