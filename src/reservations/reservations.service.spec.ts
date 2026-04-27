import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditRepository } from '../audit/audit.repository';
import { BooksRepository } from '../books/books.repository';
import { PrismaService } from '../prisma/prisma.service';
import { UsersRepository } from '../users/users.repository';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: { $transaction: jest.Mock };
  let reservationsRepository: jest.Mocked<ReservationsRepository>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let booksRepository: jest.Mocked<BooksRepository>;
  let auditRepository: jest.Mocked<AuditRepository>;

  const tx = {} as Prisma.TransactionClient;
  const validInput = {
    userId: '81fbfd78-959b-4f9a-a668-486f3dc87b01',
    bookId: 'a3b6c2f0-9f21-40fa-b18a-5d6d011e22d5',
    reservationDate: new Date('2026-04-26T10:00:00.000Z'),
    returnDate: new Date('2026-05-02T10:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: (tx: Prisma.TransactionClient) => Promise<unknown>) => callback(tx)),
    };

    reservationsRepository = {
      create: jest.fn(),
      countActiveByUser: jest.fn(),
      findActiveByBook: jest.fn(),
      findActiveById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findByBook: jest.fn(),
      findByUser: jest.fn(),
      returnBook: jest.fn(),
    } as unknown as jest.Mocked<ReservationsRepository>;

    usersRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    booksRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<BooksRepository>;

    auditRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<AuditRepository>;

    service = new ReservationsService(
      prisma as unknown as PrismaService,
      reservationsRepository,
      usersRepository,
      booksRepository,
      auditRepository,
    );
  });

  it('creates a reservation inside a transaction when business rules pass', async () => {
    usersRepository.findById.mockResolvedValue({ id: validInput.userId, name: 'Ana', email: 'ana@example.com' } as any);
    booksRepository.findById.mockResolvedValue({ id: validInput.bookId, title: 'Clean Code', isDeleted: false } as any);
    reservationsRepository.findActiveByBook.mockResolvedValue(null);
    reservationsRepository.countActiveByUser.mockResolvedValue(2);
    reservationsRepository.create.mockResolvedValue({ id: 'new-reservation-id', ...validInput } as any);
    reservationsRepository.findByIdWithRelations.mockResolvedValue({ id: 'new-reservation-id', ...validInput } as any);

    const result = await service.create(validInput);

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(reservationsRepository.create).toHaveBeenCalledWith(validInput, tx);
    expect(auditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE_RESERVATION', entity: 'Reservation' }),
      tx,
    );
    expect(result).toMatchObject({ id: 'new-reservation-id' });
  });

  it('rejects a reservation when the book already has an active reservation', async () => {
    usersRepository.findById.mockResolvedValue({ id: validInput.userId } as any);
    booksRepository.findById.mockResolvedValue({ id: validInput.bookId, isDeleted: false } as any);
    reservationsRepository.findActiveByBook.mockResolvedValue({ id: 'active-reservation' } as any);

    await expect(service.create(validInput)).rejects.toThrow('El libro ya tiene una reserva activa.');
    expect(reservationsRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a reservation when the user already has 3 active reservations', async () => {
    usersRepository.findById.mockResolvedValue({ id: validInput.userId } as any);
    booksRepository.findById.mockResolvedValue({ id: validInput.bookId, isDeleted: false } as any);
    reservationsRepository.findActiveByBook.mockResolvedValue(null);
    reservationsRepository.countActiveByUser.mockResolvedValue(3);

    await expect(service.create(validInput)).rejects.toThrow(
      'El usuario ya tiene el máximo de 3 libros reservados al mismo tiempo.',
    );
    expect(reservationsRepository.create).not.toHaveBeenCalled();
  });

  it('rejects invalid date ranges', async () => {
    await expect(
      service.create({ ...validInput, returnDate: new Date('2026-04-25T10:00:00.000Z') }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns a book before the original return date and stores audit trace', async () => {
    reservationsRepository.findActiveById.mockResolvedValue({
      id: 'reservation-id',
      returnDate: new Date('2026-05-10T10:00:00.000Z'),
    } as any);
    reservationsRepository.returnBook.mockResolvedValue({ id: 'reservation-id', status: 'RETURNED' } as any);

    const result = await service.returnBook('reservation-id');

    expect(reservationsRepository.returnBook).toHaveBeenCalledWith('reservation-id', expect.any(Date), tx);
    expect(auditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RETURN_BOOK', entityId: 'reservation-id' }),
      tx,
    );
    expect(result).toMatchObject({ status: 'RETURNED' });
  });
});
