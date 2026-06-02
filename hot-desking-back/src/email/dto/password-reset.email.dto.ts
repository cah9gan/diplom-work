export type PasswordResetEmailDTO = {
  email: string;
  name: string;
  expiresAt: Date;
  code: string;
};
