export class LoginEmailDTO {
  email: string;
  name: string;
  code: string;
  template = 'login-email';

  constructor(data: Partial<LoginEmailDTO>) {
    Object.assign(this, data);
  }
}
