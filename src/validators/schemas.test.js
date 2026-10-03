import assert from 'node:assert/strict';
import test from 'node:test';
import { registerSchema, subscriptionSchema } from './schemas.js';

test('registerSchema normalizes email and defaults the phone number', () => {
  const result = registerSchema.parse({
    name: ' Samira Benali ',
    firstName: 'Samira',
    lastName: 'Benali',
    email: ' SAMIRA@example.com ',
    password: 'MotDePasse123!'
  });

  assert.equal(result.name, 'Samira Benali');
  assert.equal(result.email, 'samira@example.com');
  assert.equal(result.phone, '');
});

test('subscriptionSchema rejects durations above 36 months', () => {
  const result = subscriptionSchema.safeParse({
    member: '507f1f77bcf86cd799439011',
    startDate: '2026-10-03',
    durationMonths: 37
  });

  assert.equal(result.success, false);
});