import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { HelloEmailService } from './hello-email.service';
import { EmailTemplateService } from './email-template.service';
import { FakeEmailService } from './fake-email.service';
import { config } from '../common';
import { RealEmailService } from './real-email.service';
import { LoginCodeEmailService } from './login-code-email.service';

@Module({
  providers: [
    {
      provide: EmailService,
      useClass: config.email.disabled ? FakeEmailService : RealEmailService,
    },
    EmailTemplateService,
    HelloEmailService,
    LoginCodeEmailService,
  ],
  exports: [HelloEmailService, LoginCodeEmailService],
})
export class EmailModule {}
