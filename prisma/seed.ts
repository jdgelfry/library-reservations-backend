import { PrismaClient, ReservationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ana@example.com' },
      update: {},
      create: { name: 'Ana Gómez', email: 'ana@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'carlos@example.com' },
      update: {},
      create: { name: 'Carlos Ruiz', email: 'carlos@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'laura@example.com' },
      update: {},
      create: { name: 'Laura Torres', email: 'laura@example.com' },
    }),
  ]);

  const books = await Promise.all([
    prisma.book.upsert({
      where: { isbn: '9780132350884' },
      update: {},
      create: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedYear: 2008,
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780134494166' },
      update: {},
      create: {
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        isbn: '9780134494166',
        publishedYear: 2017,
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780201633610' },
      update: {},
      create: {
        title: 'Design Patterns',
        author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
        isbn: '9780201633610',
        publishedYear: 1994,
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9781491950296' },
      update: {},
      create: {
        title: 'Building Microservices',
        author: 'Sam Newman',
        isbn: '9781491950296',
        publishedYear: 2021,
      },
    }),
  ]);

  // One returned reservation to show historical data in the filters.
  const returnedReservationId = 'seed-returned-reservation';
  await prisma.reservation.upsert({
    where: { id: returnedReservationId },
    update: {},
    create: {
      id: returnedReservationId,
      userId: users[1].id,
      bookId: books[2].id,
      reservationDate: new Date('2026-04-01T10:00:00.000Z'),
      returnDate: new Date('2026-04-10T23:59:59.000Z'),
      returnedAt: new Date('2026-04-05T12:00:00.000Z'),
      status: ReservationStatus.RETURNED,
    },
  });

  // One active reservation to test the availability rule.
  const activeReservationId = 'seed-active-reservation';
  const existingActive = await prisma.reservation.findFirst({
    where: { bookId: books[1].id, status: ReservationStatus.ACTIVE },
  });

  if (!existingActive) {
    await prisma.reservation.create({
      data: {
        id: activeReservationId,
        userId: users[0].id,
        bookId: books[1].id,
        reservationDate: new Date('2026-04-20T10:00:00.000Z'),
        returnDate: new Date('2026-05-05T23:59:59.000Z'),
        status: ReservationStatus.ACTIVE,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      entity: 'Seed',
      entityId: 'initial-data',
      action: 'SEED_EXECUTED',
      payload: { users: users.length, books: books.length },
    },
  });

  console.log('Seed completed: users, books and sample reservations were created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
