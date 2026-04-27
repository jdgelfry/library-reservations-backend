import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { UsersRepository } from './users.repository';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [AuditModule],
  providers: [UsersResolver, UsersService, UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
