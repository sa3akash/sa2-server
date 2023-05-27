import { Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '@root/config';
import HTTP_STATUS from 'http-status-codes';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth-services';
import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { emailSchema, passwordSchema } from '@auth/schemas/password';
import { IAuthDocument } from '@auth/interfaces/auth-interface';
import { forgotPassword } from '@service/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@service/queues/email-queue';
import { IResetPasswordParams } from '@user/interfaces/user-interface';
import ip from 'ip';
import moment from 'moment';
import { resetPassword } from '@service/emails/templates/reset-pasword/reset-password-temptale';

export class Password {
  @joiValidation(emailSchema)
  public async sendResetEmail(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const existUser: IAuthDocument = await authService.getAuthUserByEmail(email);
    if (!existUser) {
      throw new BadRequestError('User not found.');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');

    await authService.updatePasswordToken(`${existUser._id}`, randomCharacters, Date.now() * 1000 * 60 * 60);

    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;

    const template: string = forgotPassword.passwordForgotTemplate(existUser.username, resetLink);

    emailQueue.addEmailJob('forgotPassword', {
      receiverEmail: email,
      template,
      subject: 'Reset Your Password.'
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email was sent successfully.' });
  }

  @joiValidation(passwordSchema)
  public async updatePassword(req: Request, res: Response): Promise<void> {
    const { password } = req.body;
    const { token } = req.params;

    const existUser: IAuthDocument = await authService.getUserByPasswordToken(token);

    if (!existUser) {
      throw new BadRequestError('Reset token has expired.');
    }

    existUser.password = password;
    existUser.passwordResetExpires = undefined;
    existUser.passwordResetToken = undefined;
    await existUser.save();

    const templateParams: IResetPasswordParams = {
      username: existUser.username,
      email: existUser.email,
      ipaddress: ip.address(),
      date: moment().format('DD/MM/YYYY HH:mm')
    };

    const template = resetPassword.passwordResetTemplate(templateParams);

    emailQueue.addEmailJob('forgotPassword', {
      receiverEmail: existUser.email,
      template,
      subject: 'Password Reset Confirmation.'
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated.' });
  }
}
