import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Book } from '../books/book.model';
import { User } from '../users/user.model';
import { ReservationStatusEnum } from './reservation-status.enum';

@ObjectType()
export class Reservation {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  bookId!: string;

  @Field(() => GraphQLISODateTime)
  reservationDate!: Date;

  @Field(() => GraphQLISODateTime)
  returnDate!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  returnedAt?: Date | null;

  @Field(() => ReservationStatusEnum)
  status!: ReservationStatusEnum;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Book, { nullable: true })
  book?: Book;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;

  constructor(data?: Partial<Reservation>) {
    if (data) Object.assign(this, data);
  }
}
