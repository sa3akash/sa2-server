import { CurrentUser } from '@auth/controllers/current-user';
import { authMiddleware } from '@global/helpers/auth-middleware';
import express, { Router } from 'express';

class CurrentRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public getCurrentUser(): Router {
    this.router.get('/current-user', authMiddleware.checkAuthentication, CurrentUser.prototype.get);
    return this.router;
  }
}

export const currentRoutes: CurrentRoutes = new CurrentRoutes();
