import { Injectable } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaExecutor } from '../prisma/prisma.types';
import { CreateBookInput, UpdateBookInput } from './dto';

@Injectable()
export class BooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: PrismaExecutor): PrismaExecutor {
    return tx ?? this.prisma;
  }

  create(input: CreateBookInput, tx?: PrismaExecutor) {
    return this.client(tx).book.create({ data: input });
  }

  findAll() {
    return this.prisma.book.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAvailable() {
    return this.prisma.book.findMany({
      where: {
        isDeleted: false,
        reservations: { none: { status: ReservationStatus.ACTIVE } },
      },
      orderBy: { title: 'asc' },
    });
  }

  findById(id: string, tx?: PrismaExecutor) {
    return this.client(tx).book.findUnique({ where: { id } });
  }

  update(input: UpdateBookInput, tx?: PrismaExecutor) {
    const { id, ...data } = input;
    return this.client(tx).book.update({ where: { id }, data });
  }

  softDelete(id: string, tx?: PrismaExecutor) {
    return this.client(tx).book.update({ where: { id }, data: { isDeleted: true } });
  }
}
