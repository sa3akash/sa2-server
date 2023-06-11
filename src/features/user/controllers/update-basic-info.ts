import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { userQueue } from '@service/queues/user-queue';
import { UserCache } from '@service/redis/user-cache';
import { basicInfoSchema, socialLinksSchema } from '@user/schemas/info';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const userCache: UserCache = new UserCache();

export class EditBasicInfo {
  /**
   *
   * edit basic info
   *
   */
  @joiValidation(basicInfoSchema)
  public async editInfo(req: Request, res: Response): Promise<void> {
    for (const [key, value] of Object.entries(req.body)) {
      await userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, key, `${value}`);
    }
    userQueue.addUserJob('updateBasicInfoInDB', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }
  /**
   *
   * update social links
   *
   */
  @joiValidation(socialLinksSchema)
  public async editSocial(req: Request, res: Response): Promise<void> {
    await userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, 'social', req.body);
    userQueue.addUserJob('updateSocialLinksInDB', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }
}
