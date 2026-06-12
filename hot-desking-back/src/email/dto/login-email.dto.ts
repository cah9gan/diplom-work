export class LoginEmailDTO {
  email: string;
  name: string;
  code: string;
  template = 'login-email'; // 👈 Имя файла шаблона (без .hbs)

  constructor(data: Partial<LoginEmailDTO>) {
    Object.assign(this, data);
  }
}
