import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@root/config';
import { UnAuthorizeError } from './error-handler';
import { AuthPayload } from '@auth/interfaces/auth-interface';

export class AuthMiddleware {
  public verifyUser(req: Request, res: Response, next: NextFunction): void {
    if (!req.session?.token) {
      throw new UnAuthorizeError('Authentication is required, Please login again.');
    }

    try {
      const payload: AuthPayload = jwt.verify(req.session?.token, config.JWT_SEC!) as AuthPayload;
      req.currentUser = payload;
    } catch (err) {
      throw new UnAuthorizeError('Invalid token, Please login again.');
    }
    next();
  }

  public checkAuthentication(req: Request, res: Response, next: NextFunction): void {
    if (!req.session?.token) {
      throw new UnAuthorizeError('Authentication is required, Please login again.');
    }
    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
