import { authMiddleware } from '@global/helpers/auth-middleware';
import { CreatePost } from '@post/controllers/create-post';
import { DeletePost } from '@post/controllers/delete-post';
import { GetPosts } from '@post/controllers/get-posts';
import { UpdatePost } from '@post/controllers/update-post';
import express, { Router } from 'express';

class PostRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public getPostRoutes(): Router {
    this.router.post('/post', authMiddleware.checkAuthentication, CreatePost.prototype.create);
    this.router.post('/post/image', authMiddleware.checkAuthentication, CreatePost.prototype.postWithImage);

    this.router.get('/post/all/:page', authMiddleware.checkAuthentication, GetPosts.prototype.getPosts);
    this.router.get('/post/images/:page', authMiddleware.checkAuthentication, GetPosts.prototype.postsWithImages);

    this.router.put('/post/:postId', authMiddleware.checkAuthentication, UpdatePost.prototype.posts);
    this.router.put('/post/image/:postId', authMiddleware.checkAuthentication, UpdatePost.prototype.postWithImage);

    this.router.delete('/post/:postId', authMiddleware.checkAuthentication, DeletePost.prototype.deletePost);

    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
