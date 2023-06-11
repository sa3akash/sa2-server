import { IFileImageDocument } from '@image/interfaces/images-interface';
import { imageService } from '@service/db/image-services';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class GetImages {
  public async images(req: Request, res: Response): Promise<void> {
    const images: IFileImageDocument[] = await imageService.getImages(req.params.userId);
    res.status(HTTP_STATUS.OK).json({ message: 'User images', images });
  }
}
