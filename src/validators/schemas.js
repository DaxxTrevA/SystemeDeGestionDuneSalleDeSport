import { z } from 'zod';

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(8).max(72);
const date = z.coerce.date();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email,
  password,
  phone: z.string().trim().max(30).optional().default(''),
  dateOfBirth: date.optional()
});

export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

export const memberSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email,
  phone: z.string().trim().max(30).optional().default(''),
  dateOfBirth: date.optional().nullable()
});

export const subscriptionSchema = z.object({
  member: z.string().regex(/^[a-f\d]{24}$/i),
  startDate: date,
  durationMonths: z.coerce.number().int().min(1).max(36),
  status: z.enum(['pending', 'active', 'expired', 'suspended', 'rejected']).optional().default('active')
});

export const subscriptionRequestSchema = z.object({
  durationMonths: z.coerce.number().int().min(1).max(36)
});

export const groupClassSchema = z.object({
  title: z.string().trim().min(2).max(100),
  coach: z.string().trim().min(2).max(100),
  startsAt: date,
  durationMinutes: z.coerce.number().int().min(15).max(240),
  capacity: z.coerce.number().int().min(1).max(100)
});

const presetList = z.array(z.string().trim().min(2).max(60)).min(1).max(30)
  .refine((values) => new Set(values.map((value) => value.toLowerCase())).size === values.length);

export const clubSettingsSchema = z.object({
  courseTypes: presetList,
  coaches: presetList,
  monthlyPriceAr: z.coerce.number().int().min(1000).max(10000000).default(22000)
});

export const createAdminSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password
});

export const adminCredentialsSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  email: email.optional(),
  newPassword: password.optional()
}).refine(({ email: nextEmail, newPassword }) => Boolean(nextEmail || newPassword));

export const deleteMemberSchema = z.object({
  adminPassword: z.string().min(1).max(72)
});