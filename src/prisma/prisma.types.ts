import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

// Reusable type so repositories can work with the global Prisma client
// or with the transaction client received inside prisma.$transaction().
export type PrismaExecutor = PrismaService | Prisma.TransactionClient;
