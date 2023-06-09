import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { Helpers } from '@global/helpers/helpers';
import { UserCache } from '@service/redis/user-cache';
import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { addImageSchema } from '@image/schemas/images-schema';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { IUserDocument } from '@user/interfaces/user-interface';
import { socketIOImageObject } from '@socket/image-socket';
import { imageQueue } from '@service/queues/image-queue';
import { IBgUploadResponse } from '@image/interfaces/images-interface';
import { config } from '@root/config';

const userCache: UserCache = new UserCache();

export class AddImage {
  @joiValidation(addImageSchema)
  /**
   *
   * update profile image
   *
   */
  public async profileImage(req: Request, res: Response): Promise<void> {
    const path = `${config.FOLDFR}/${req.currentUser!.userId}/profile-picture`;

    const result: UploadApiResponse = (await uploads(
      req.body.image,
      `${req.currentUser!.userId}-profile-pic`,
      true,
      true,
      path
    )) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError('File upload: Error occurred. Try again.');
    }

    const url = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;

    const cachedUser: IUserDocument = (await userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'profilePicture',
      url
    )) as IUserDocument;

    socketIOImageObject.emit('update-user', cachedUser);

    imageQueue.addImageJob('addUserProfileImageToDB', {
      key: `${req.currentUser!.userId}`,
      value: url,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  /**
   *
   *  background image
   *
   */

  @joiValidation(addImageSchema)
  public async backgroundImage(req: Request, res: Response): Promise<void> {
    // save image
    const { version, publicId }: IBgUploadResponse = await AddImage.prototype.backgroundUpload(req.body.image, req.currentUser!.userId);

    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      publicId
    ) as Promise<IUserDocument>;

    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      version
    ) as Promise<IUserDocument>;

    const response: [IUserDocument, IUserDocument] = (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];

    socketIOImageObject.emit('update-user', {
      bgImageId: publicId,
      bgImageVersion: version,
      userId: response[0]
    });

    imageQueue.addImageJob('updateBGImageInDB', {
      key: `${req.currentUser!.userId}`,
      imgId: publicId,
      imgVersion: version.toString()
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  /**
   *
   *  background image upload
   *
   */

  private async backgroundUpload(image: string, userId: string): Promise<IBgUploadResponse> {
    const isDataURL = Helpers.isDataURL(image);
    let version = '';
    let publicId = '';

    if (isDataURL) {
      const path = `${config.FOLDFR}/${userId}/backgroundImage`;

      const result: UploadApiResponse = (await uploads(image, `${path}-backgroundImage`, false, false, path)) as UploadApiResponse;
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      } else {
        version = result.version.toString();
        publicId = result.public_id;
      }
    } else {
      const value = image.split('/');
      version = value[value.length - 5];
      publicId = `${value[value.length - 4]}/${value[value.length - 3]}/${value[value.length - 2]}/${value[value.length - 1]}`;
    }

    return { version: version.replace(/v/g, ''), publicId };
  }
}
