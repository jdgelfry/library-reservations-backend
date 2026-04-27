import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditRepository } from '../audit/audit.repository';
import { BooksRepository } from '../books/books.repository';
import { businessError, notFoundError } from '../common/business-exception';
import { PrismaService } from '../prisma/prisma.service';
import { UsersRepository } from '../users/users.repository';
import { CreateReservationInput, ReservationDateFilterInput } from './dto';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsRepository: ReservationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly booksRepository: BooksRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  findByBook(bookId: string, filter?: ReservationDateFilterInput) {
    return this.reservationsRepository.findByBook(bookId, filter);
  }

  findByUser(userId: string, filter?: ReservationDateFilterInput) {
    return this.reservationsRepository.findByUser(userId, filter);
  }

  async create(input: CreateReservationInput) {
    this.validateReservationDates(input.reservationDate, input.returnDate);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const [user, book] = await Promise.all([
            this.usersRepository.findById(input.userId, tx),
            this.booksRepository.findById(input.bookId, tx),
          ]);

          if (!user) throw notFoundError('Usuario');
          if (!book || book.isDeleted) throw notFoundError('Libro');

          const activeReservationForBook = await this.reservationsRepository.findActiveByBook(input.bookId, tx);
          if (activeReservationForBook) {
            throw businessError('El libro ya tiene una reserva activa.');
          }

          const activeReservationsForUser = await this.reservationsRepository.countActiveByUser(input.userId, tx);
          if (activeReservationsForUser >= 3) {
            throw businessError('El usuario ya tiene el máximo de 3 libros reservados al mismo tiempo.');
          }

          const created = await this.reservationsRepository.create(input, tx);
          await this.auditRepository.create(
            {
              entity: 'Reservation',
              entityId: created.id,
              action: 'CREATE_RESERVATION',
              payload: {
                userId: input.userId,
                bookId: input.bookId,
                reservationDate: input.reservationDate.toISOString(),
                returnDate: input.returnDate.toISOString(),
              },
            },
            tx,
          );

          return this.reservationsRepository.findByIdWithRelations(created.id, tx);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      // The partial unique index also protects us if two users reserve the same book at the same time.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw businessError('El libro ya tiene una reserva activa.');
      }
      throw error;
    }
  }

  async returnBook(reservationId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const activeReservation = await this.reservationsRepository.findActiveById(reservationId, tx);
        if (!activeReservation) {
          throw notFoundError('Reserva activa');
        }

        const returnedAt = new Date();
        const reservation = await this.reservationsRepository.returnBook(reservationId, returnedAt, tx);

        await this.auditRepository.create(
          {
            entity: 'Reservation',
            entityId: reservationId,
            action: 'RETURN_BOOK',
            payload: {
              returnedAt: returnedAt.toISOString(),
              previousReturnDate: activeReservation.returnDate.toISOString(),
            },
          },
          tx,
        );

        return reservation;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private validateReservationDates(reservationDate: Date, returnDate: Date) {
    if (Number.isNaN(reservationDate.getTime()) || Number.isNaN(returnDate.getTime())) {
      throw new BadRequestException('Las fechas de reserva y devolución son obligatorias y deben ser válidas.');
    }

    if (returnDate <= reservationDate) {
      throw new BadRequestException('La fecha de devolución debe ser posterior a la fecha de reserva.');
    }
  }
}
