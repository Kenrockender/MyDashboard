import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';

export async function validateBody<T extends object>(cls: ClassConstructor<T>, raw: unknown): Promise<T> {
  const instance = plainToInstance(cls, raw);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length > 0) {
    const message = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new BadRequestException(message);
  }
  return instance;
}
