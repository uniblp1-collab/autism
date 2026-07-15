import { IsEmail } from "class-validator";

export class CreateParentDto {
  @IsEmail()
  email: string;
}
