import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Length } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  @Length(2, 80)
  name!: string;

  @Field()
  @IsEmail()
  email!: string;
}
