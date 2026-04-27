import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateReservationInput, ReservationDateFilterInput } from './dto';
import { Reservation } from './reservation.model';
import { ReservationsService } from './reservations.service';

@Resolver(() => Reservation)
export class ReservationsResolver {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Query(() => [Reservation])
  reservationsByBook(
    @Args('bookId', { type: () => ID }) bookId: string,
    @Args('filter', { nullable: true }) filter?: ReservationDateFilterInput,
  ) {
    return this.reservationsService.findByBook(bookId, filter);
  }

  @Query(() => [Reservation])
  reservationsByUser(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('filter', { nullable: true }) filter?: ReservationDateFilterInput,
  ) {
    return this.reservationsService.findByUser(userId, filter);
  }

  @Mutation(() => Reservation)
  createReservation(@Args('input') input: CreateReservationInput) {
    return this.reservationsService.create(input);
  }

  @Mutation(() => Reservation)
  returnBook(@Args('reservationId', { type: () => ID }) reservationId: string) {
    return this.reservationsService.returnBook(reservationId);
  }
}
