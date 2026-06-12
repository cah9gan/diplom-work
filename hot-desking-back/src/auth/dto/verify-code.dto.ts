import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyCodeDTO {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Код должен состоять из 6 символов' })
  code: string;
}
