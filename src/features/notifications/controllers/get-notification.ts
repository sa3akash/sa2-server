import { INotificationDocument } from '@notification/interfaces/notifications-interfaces';
import { notificationService } from '@service/db/notification-services';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class GetNotification {
  public async notifications(req: Request, res: Response): Promise<void> {
    const notifications: INotificationDocument[] = await notificationService.getNotifications(req.currentUser!.userId);

    res.status(HTTP_STATUS.OK).json({ message: 'User notifications', notifications });
  }
}
