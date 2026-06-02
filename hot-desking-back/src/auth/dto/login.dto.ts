import { IsEmail, IsStrongPassword } from 'class-validator';

export class loginDTO {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
