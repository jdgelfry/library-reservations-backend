import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  constructor(data?: Partial<User>) {
    if (data) Object.assign(this, data);
  }
}
