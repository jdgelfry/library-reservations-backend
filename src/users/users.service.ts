import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditRepository } from '../audit/audit.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepository: UsersRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  findAll() {
    return this.usersRepository.findAll();
  }

  async create(input: CreateUserInput) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await this.usersRepository.create(input, tx);

        await this.auditRepository.create(
          {
            entity: 'User',
            entityId: user.id,
            action: 'CREATE_USER',
            payload: { email: user.email, name: user.name },
          },
          tx,
        );

        return user;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese correo.');
      }
      throw error;
    }
  }
}
