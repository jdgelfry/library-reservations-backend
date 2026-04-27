import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Book } from './book.model';
import { BooksService } from './books.service';
import { CreateBookInput, UpdateBookInput } from './dto';

@Resolver(() => Book)
export class BooksResolver {
  constructor(private readonly booksService: BooksService) {}

  @Query(() => [Book])
  books() {
    return this.booksService.findAll();
  }

  @Query(() => [Book])
  availableBooks() {
    return this.booksService.findAvailable();
  }

  @Mutation(() => Book)
  createBook(@Args('input') input: CreateBookInput) {
    return this.booksService.create(input);
  }

  @Mutation(() => Book)
  updateBook(@Args('input') input: UpdateBookInput) {
    return this.booksService.update(input);
  }

  @Mutation(() => Book)
  deleteBook(@Args('id', { type: () => ID }) id: string) {
    return this.booksService.remove(id);
  }
}
