import { registerEnumType } from '@nestjs/graphql';

export enum ReservationStatusEnum {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
}

registerEnumType(ReservationStatusEnum, {
  name: 'ReservationStatus',
});
