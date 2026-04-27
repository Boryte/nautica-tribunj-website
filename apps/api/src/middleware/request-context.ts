/* eslint-disable @typescript-eslint/no-namespace */
import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      adminSession?: {
        authenticated: boolean;
        csrfToken: string | null;
        user: null | {
          id: number;
          email: string;
          role: string;
          displayName: string;
        };
      };
    }
  }
}

export const attachRequestContext = (request: Request, response: Response, next: NextFunction) => {
  request.requestId = request.header('x-request-id') ?? crypto.randomUUID();
  response.setHeader('x-request-id', request.requestId);
  next();
};
