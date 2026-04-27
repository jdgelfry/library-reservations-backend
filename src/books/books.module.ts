import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { BooksRepository } from './books.repository';
import { BooksResolver } from './books.resolver';
import { BooksService } from './books.service';

@Module({
  imports: [AuditModule, forwardRef(() => ReservationsModule)],
  providers: [BooksResolver, BooksService, BooksRepository],
  exports: [BooksRepository],
})
export class BooksModule {}
