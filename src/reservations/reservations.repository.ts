import { Injectable } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaExecutor } from '../prisma/prisma.types';
import { CreateReservationInput, ReservationDateFilterInput } from './dto';

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: PrismaExecutor): PrismaExecutor {
    return tx ?? this.prisma;
  }

  create(input: CreateReservationInput, tx?: PrismaExecutor) {
    return this.client(tx).reservation.create({ data: input });
  }

  countActiveByUser(userId: string, tx?: PrismaExecutor) {
    return this.client(tx).reservation.count({
      where: { userId, status: ReservationStatus.ACTIVE },
    });
  }

  findActiveByBook(bookId: string, tx?: PrismaExecutor) {
    return this.client(tx).reservation.findFirst({
      where: { bookId, status: ReservationStatus.ACTIVE },
      include: { user: true, book: true },
    });
  }

  findActiveById(id: string, tx?: PrismaExecutor) {
    return this.client(tx).reservation.findFirst({
      where: { id, status: ReservationStatus.ACTIVE },
      include: { user: true, book: true },
    });
  }

  findByIdWithRelations(id: string, tx?: PrismaExecutor) {
    return this.client(tx).reservation.findUnique({
      where: { id },
      include: { user: true, book: true },
    });
  }

  findByBook(bookId: string, filter?: ReservationDateFilterInput) {
    return this.prisma.reservation.findMany({
      where: { bookId, ...this.buildDateWhere(filter) },
      include: { user: true, book: true },
      orderBy: { reservationDate: 'desc' },
    });
  }

  findByUser(userId: string, filter?: ReservationDateFilterInput) {
    return this.prisma.reservation.findMany({
      where: { userId, ...this.buildDateWhere(filter) },
      include: { user: true, book: true },
      orderBy: { reservationDate: 'desc' },
    });
  }

  returnBook(id: string, returnedAt: Date, tx?: PrismaExecutor) {
    return this.client(tx).reservation.update({
      where: { id },
      data: { returnedAt, status: ReservationStatus.RETURNED },
      include: { user: true, book: true },
    });
  }

  private buildDateWhere(filter?: ReservationDateFilterInput): Prisma.ReservationWhereInput {
    if (!filter?.from && !filter?.to) return {};

    // Date filtering is implemented as range overlap:
    // a reservation appears if its reservation/return window intersects the requested window.
    const where: Prisma.ReservationWhereInput = {};

    if (filter.from) {
      where.returnDate = { gte: filter.from };
    }

    if (filter.to) {
      where.reservationDate = { lte: filter.to };
    }

    return where;
  }
}
