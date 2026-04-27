import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaExecutor } from '../prisma/prisma.types';

export type AuditLogInput = {
  entity: string;
  entityId: string;
  action: string;
  payload: Prisma.InputJsonValue;
};

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: PrismaExecutor): PrismaExecutor {
    return tx ?? this.prisma;
  }

  create(input: AuditLogInput, tx?: PrismaExecutor) {
    return this.client(tx).auditLog.create({ data: input });
  }
}
