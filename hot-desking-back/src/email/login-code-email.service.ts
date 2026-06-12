import { Injectable } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import { EmailService } from './email.service';
import { LoginEmailDTO } from './dto';

@Injectable()
export class LoginCodeEmailService {
  constructor(
    private readonly templates: EmailTemplateService,
    private readonly email: EmailService,
  ) {}

  public async send(data: {
    email: string;
    name: string;
    code: string;
  }): Promise<void> {
    const subject = 'Код підтвердження для входу'; // Заголовок письма

    const input = new LoginEmailDTO(data);
    const html = await this.templates.render(input);

    await this.email.send({
      to: data.email,
      subject,
      html,
    });
  }
}
