import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditRepository } from '../audit/audit.repository';
import { notFoundError, businessError } from '../common/business-exception';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsRepository } from '../reservations/reservations.repository';
import { CreateBookInput, UpdateBookInput } from './dto';
import { BooksRepository } from './books.repository';

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly booksRepository: BooksRepository,
    private readonly reservationsRepository: ReservationsRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  findAll() {
    return this.booksRepository.findAll();
  }

  findAvailable() {
    return this.booksRepository.findAvailable();
  }

  async create(input: CreateBookInput) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const book = await this.booksRepository.create(input, tx);
        await this.auditRepository.create(
          {
            entity: 'Book',
            entityId: book.id,
            action: 'CREATE_BOOK',
            payload: {
              title: input.title,
              author: input.author,
              isbn: input.isbn,
              publishedYear: input.publishedYear ?? null,
            },
          },
          tx,
        );
        return book;
      });
    } catch (error) {
      this.handleUniqueIsbn(error);
      throw error;
    }
  }

  async update(input: UpdateBookInput) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await this.booksRepository.findById(input.id, tx);
        if (!current || current.isDeleted) throw notFoundError('Libro');

        const book = await this.booksRepository.update(input, tx);
        await this.auditRepository.create(
          {
            entity: 'Book',
            entityId: book.id,
            action: 'UPDATE_BOOK',
            payload: {
              id: input.id,
              title: input.title ?? null,
              author: input.author ?? null,
              isbn: input.isbn ?? null,
              publishedYear: input.publishedYear ?? null,
            },
          },
          tx,
        );
        return book;
      });
    } catch (error) {
      this.handleUniqueIsbn(error);
      throw error;
    }
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.booksRepository.findById(id, tx);
      if (!current || current.isDeleted) throw notFoundError('Libro');

      const activeReservation = await this.reservationsRepository.findActiveByBook(id, tx);
      if (activeReservation) {
        throw businessError('No se puede eliminar un libro con una reserva activa. Primero debe retornarse.');
      }

      const book = await this.booksRepository.softDelete(id, tx);
      await this.auditRepository.create(
        { entity: 'Book', entityId: id, action: 'DELETE_BOOK', payload: { softDelete: true } },
        tx,
      );
      return book;
    });
  }

  private handleUniqueIsbn(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Ya existe un libro con ese ISBN.');
    }
  }
}
