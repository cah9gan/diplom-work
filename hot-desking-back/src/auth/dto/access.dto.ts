import { ViewProfileDTO } from '../../users/dto';

export class AccessDTO extends ViewProfileDTO {
  token: string;
}
