import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { PostCache } from '@service/redis/post-cache';
import { IPostDocument } from '@post/interfaces/post-interface';
import { postServices } from '@service/db/post-services';

const postCache: PostCache = new PostCache();
const PAGE_SIZE = 10;

export class GetPosts {
  public async getPosts(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    // pagination
    const skip: number = (+page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);
    const newSkip: number = skip === 0 ? skip : skip + 1;

    let posts: IPostDocument[] = [];
    let totalPosts = 0;

    // get posts from cache
    const cachedPosts: IPostDocument[] = await postCache.getPostFromCache('post', newSkip.toString(), limit.toString());

      
    if (cachedPosts.length) {
      posts = cachedPosts;
      totalPosts = await postCache.getNumberOfPostFromCache();
    } else {
      posts = await postServices.getPosts({}, skip, limit, { createdAt: -1 });
      totalPosts = await postServices.postsCount();
      // save posts in cache
      // if (posts.length) {
      //   posts.forEach(async (post) => {
      //     // if data not save in redis then save post to redis database
      //     await postCache.savePostToCache({
      //       key: `${post._id}`,
      //       currentUserId: `${req.currentUser!.userId}`,
      //       uId: `${req.currentUser!.uId}`,
      //       createdPost: post
      //     });
      //   });
      // }
    }

    res.status(HTTP_STATUS.OK).json({ message: 'All posts', posts, totalPosts });
  }

  public async postsWithImages(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);
    const newSkip: number = skip === 0 ? skip : skip + 1;
    // post with image
    let posts: IPostDocument[] = [];
    const cachedPosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache('post', newSkip, limit);

    if (cachedPosts.length) {
      posts = cachedPosts;
    } else {
      await postServices.getPosts({ imgId: '$ne', gifUrl: '$ne' }, skip, limit, { createdAt: -1 });
      // if (posts.length) {
      //   posts.forEach(async (post) => {
      //     // if data not save in redis then save post to redis database
      //     await postCache.savePostToCache({
      //       key: `${post._id}`,
      //       currentUserId: `${req.currentUser!.userId}`,
      //       uId: `${req.currentUser!.uId}`,
      //       createdPost: post
      //     });
      //   });
      // }
    }

    res.status(HTTP_STATUS.OK).json({ message: 'All posts with images.', posts });
  }
}
