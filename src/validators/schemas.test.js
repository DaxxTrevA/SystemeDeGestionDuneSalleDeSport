import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adminCredentialsSchema, clubSettingsSchema, createAdminSchema, deleteMemberSchema,
  registerSchema, subscriptionRequestSchema, subscriptionSchema
} from './schemas.js';

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

test('clubSettingsSchema accepts course and coach presets', () => {
  const result = clubSettingsSchema.safeParse({
    courseTypes: ['HIIT', 'Yoga'],
    coaches: ['Doda']
  });

  assert.equal(result.success, true);
});

test('clubSettingsSchema rejects duplicate presets', () => {
  const result = clubSettingsSchema.safeParse({
    courseTypes: ['Yoga', 'yoga'],
    coaches: ['Doda']
  });

  assert.equal(result.success, false);
});

test('createAdminSchema normalizes the admin email', () => {
  const result = createAdminSchema.parse({
    name: ' Coach Admin ',
    email: ' ADMIN@example.com ',
    password: 'LongPassword123!'
  });

  assert.equal(result.name, 'Coach Admin');
  assert.equal(result.email, 'admin@example.com');
});

test('adminCredentialsSchema requires an email or new password', () => {
  assert.equal(adminCredentialsSchema.safeParse({ currentPassword: 'Existing123!' }).success, false);
  assert.equal(adminCredentialsSchema.safeParse({
    currentPassword: 'Existing123!',
    newPassword: 'UpdatedPassword123!'
  }).success, true);
});

test('deleteMemberSchema requires the admin password', () => {
  assert.equal(deleteMemberSchema.safeParse({}).success, false);
  assert.equal(deleteMemberSchema.safeParse({ adminPassword: 'AdminSecret123!' }).success, true);
});

test('subscriptionRequestSchema accepts month durations from 1 to 36', () => {
  assert.equal(subscriptionRequestSchema.parse({ durationMonths: '3' }).durationMonths, 3);
  assert.equal(subscriptionRequestSchema.safeParse({ durationMonths: 37 }).success, false);
});

test('clubSettingsSchema defaults the monthly membership offer to 22000 Ar', () => {
  const result = clubSettingsSchema.parse({ courseTypes: ['HIIT'], coaches: ['Doda'] });

  assert.equal(result.monthlyPriceAr, 22000);
});