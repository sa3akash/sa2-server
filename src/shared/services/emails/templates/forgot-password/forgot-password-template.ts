import fs from 'fs';
import ejs from 'ejs';

class ForgotPasswordTemplate {
  public passwordForgotTemplate(username: string, resetLink: string): string {
    return ejs.render(fs.readFileSync(__dirname + '/forgot-password-template.ejs', 'utf8'), {
      username: username,
      resetLink: resetLink,
      image_url: 'https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png'
    });
  }
}

export const forgotPassword: ForgotPasswordTemplate = new ForgotPasswordTemplate();
