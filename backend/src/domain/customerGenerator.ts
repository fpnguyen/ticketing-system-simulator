import { faker } from '@faker-js/faker';
import type { Customer } from './types.js';

export function generateCustomer(): Customer {
  const dateOfBirth = faker.date.birthdate({ min: 18, max: 85, mode: 'age' });
  return {
    fullName: faker.person.fullName(),
    dateOfBirth: dateOfBirth.toISOString().slice(0, 10),
  };
}
