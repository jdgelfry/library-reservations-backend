import { BadRequestException, NotFoundException } from '@nestjs/common';

export const businessError = (message: string) => new BadRequestException(message);
export const notFoundError = (entity: string) => new NotFoundException(`${entity} no encontrado.`);
