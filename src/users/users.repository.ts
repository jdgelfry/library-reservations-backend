import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto';
import { PrismaExecutor } from '../prisma/prisma.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: PrismaExecutor): PrismaExecutor {
    return tx ?? this.prisma;
  }

  create(input: CreateUserInput, tx?: PrismaExecutor) {
    return this.client(tx).user.create({ data: input });
  }

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string, tx?: PrismaExecutor) {
    return this.client(tx).user.findUnique({ where: { id } });
  }
}
