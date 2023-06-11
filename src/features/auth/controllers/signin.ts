import { Request, Response } from 'express';
import { config } from '@root/config';
import jwt from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { loginSchema } from '@auth/schemas/signin';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth-services';
import { IAuthDocument } from '@auth/interfaces/auth-interface';
import { IUserDocument } from '@user/interfaces/user-interface';
import { userService } from '@service/db/user-services';

export class SignIn {
  @joiValidation(loginSchema)
  public async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const checkUser: IAuthDocument = await authService.getAuthUserByUsername(username);

    if (!checkUser) {
      throw new BadRequestError('Wrong credentials.');
    }

    const passwordMatch: boolean = await checkUser.comparePassword(password);
    if (!passwordMatch) {
      throw new BadRequestError('Wrong credentials.');
    }

    const user: IUserDocument = await userService.getUserByAuthId(`${checkUser._id}`);

    const jwtToken: string = jwt.sign(
      {
        userId: user._id,
        uId: checkUser.uId,
        email: checkUser.email,
        username: checkUser.username,
        avatarColor: checkUser.avatarColor
      },
      config.JWT_SEC!
    );

    req.session = { token: jwtToken };

    res.status(HTTP_STATUS.OK).json({ message: 'Login successful.', user, token: jwtToken });
  }
}
