import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyCodeDTO {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Код повинен бути довжиною 6 символів' })
  code: string;
}
