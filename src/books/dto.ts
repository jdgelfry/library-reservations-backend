import { Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';
import { IsInt, IsISBN, IsOptional, IsString, Length, Max, Min } from 'class-validator';

@InputType()
export class CreateBookInput {
  @Field()
  @IsString()
  @Length(1, 160)
  title: string;

  @Field()
  @IsString()
  @Length(1, 120)
  author: string;

  @Field()
  @IsISBN()
  isbn: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3000)
  publishedYear?: number;
}

@InputType()
export class UpdateBookInput extends PartialType(CreateBookInput) {
  @Field(() => ID)
  id: string;
}
