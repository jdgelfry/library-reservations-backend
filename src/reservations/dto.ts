import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateReservationInput {
  @Field(() => ID)
  @IsUUID()
  userId!: string;

  @Field(() => ID)
  @IsUUID()
  bookId!: string;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  @IsDate()
  reservationDate!: Date;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  @IsDate()
  returnDate!: Date;
}

@InputType()
export class ReservationDateFilterInput {
  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
