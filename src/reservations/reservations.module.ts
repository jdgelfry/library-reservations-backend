import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { BooksModule } from '../books/books.module';
import { UsersModule } from '../users/users.module';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsResolver } from './reservations.resolver';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [AuditModule, UsersModule, forwardRef(() => BooksModule)],
  providers: [ReservationsResolver, ReservationsService, ReservationsRepository],
  exports: [ReservationsRepository],
})
export class ReservationsModule {}
