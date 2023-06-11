import { authMiddleware } from '@global/helpers/auth-middleware';
import { DeleteNotification } from '@notification/controllers/delete-notification';
import { GetNotification } from '@notification/controllers/get-notification';
import { UpdateNotification } from '@notification/controllers/update-notification';
import express, { Router } from 'express';

class NotificationRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/notifications', authMiddleware.checkAuthentication, GetNotification.prototype.notifications);
    this.router.put('/notification/:notificationId', authMiddleware.checkAuthentication, UpdateNotification.prototype.notification);
    this.router.delete('/notification/:notificationId', authMiddleware.checkAuthentication, DeleteNotification.prototype.notification);

    return this.router;
  }
}

export const notificationRoutes: NotificationRoutes = new NotificationRoutes();
