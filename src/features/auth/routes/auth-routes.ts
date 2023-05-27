import { Password } from '@auth/controllers/password';
import { SignIn } from '@auth/controllers/signin';
import { SignOut } from '@auth/controllers/signout';
import { SignUp } from '@auth/controllers/signup';
import express, { Router } from 'express';

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', SignUp.prototype.create);
    this.router.post('/signin', SignIn.prototype.login);
    this.router.post('/forgot-password', Password.prototype.sendResetEmail);
    this.router.post('/reset-password/:token', Password.prototype.updatePassword);

    return this.router;
  }
  public signOutRoute(): Router {
    this.router.get('/signout', SignOut.prototype.logout);
    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
