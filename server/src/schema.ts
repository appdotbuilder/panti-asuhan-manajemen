
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['admin', 'pengurus', 'donatur']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Gender enum
export const genderSchema = z.enum(['laki-laki', 'perempuan']);
export type Gender = z.infer<typeof genderSchema>;

// Education status enum
export const educationStatusSchema = z.enum(['belum_sekolah', 'tk', 'sd', 'smp', 'sma', 'kuliah', 'lulus']);
export type EducationStatus = z.infer<typeof educationStatusSchema>;

// Donation type enum
export const donationTypeSchema = z.enum(['uang', 'barang']);
export type DonationType = z.infer<typeof donationTypeSchema>;

// Expense category enum
export const expenseCategorySchema = z.enum(['makanan', 'pendidikan', 'kesehatan', 'operasional', 'lainnya']);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

// Activity type enum
export const activityTypeSchema = z.enum(['harian', 'mingguan', 'bulanan', 'khusus']);
export type ActivityType = z.infer<typeof activityTypeSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
});

export type User = z.infer<typeof userSchema>;

// Child schema
export const childSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  birth_date: z.coerce.date(),
  gender: genderSchema,
  education_status: educationStatusSchema,
  health_history: z.string().nullable(),
  guardian_info: z.string().nullable(),
  notes: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
});

export type Child = z.infer<typeof childSchema>;

// Donor schema
export const donorSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  user_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
});

export type Donor = z.infer<typeof donorSchema>;

// Donation schema
export const donationSchema = z.object({
  id: z.number(),
  donor_id: z.number(),
  type: donationTypeSchema,
  amount: z.number().nullable(),
  item_description: z.string().nullable(),
  item_quantity: z.number().int().nullable(),
  donation_date: z.coerce.date(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Donation = z.infer<typeof donationSchema>;

// Expense schema
export const expenseSchema = z.object({
  id: z.number(),
  category: expenseCategorySchema,
  description: z.string(),
  amount: z.number(),
  expense_date: z.coerce.date(),
  receipt_url: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
});

export type Expense = z.infer<typeof expenseSchema>;

// Activity schema
export const activitySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  type: activityTypeSchema,
  scheduled_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  location: z.string().nullable(),
  participants: z.string().nullable(),
  photos: z.string().nullable(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
});

export type Activity = z.infer<typeof activitySchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createChildInputSchema = z.object({
  full_name: z.string(),
  birth_date: z.coerce.date(),
  gender: genderSchema,
  education_status: educationStatusSchema,
  health_history: z.string().nullable(),
  guardian_info: z.string().nullable(),
  notes: z.string().nullable(),
});

export type CreateChildInput = z.infer<typeof createChildInputSchema>;

export const createDonorInputSchema = z.object({
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  user_id: z.number().nullable(),
});

export type CreateDonorInput = z.infer<typeof createDonorInputSchema>;

export const createDonationInputSchema = z.object({
  donor_id: z.number(),
  type: donationTypeSchema,
  amount: z.number().positive().nullable(),
  item_description: z.string().nullable(),
  item_quantity: z.number().int().positive().nullable(),
  donation_date: z.coerce.date(),
  notes: z.string().nullable(),
});

export type CreateDonationInput = z.infer<typeof createDonationInputSchema>;

export const createExpenseInputSchema = z.object({
  category: expenseCategorySchema,
  description: z.string(),
  amount: z.number().positive(),
  expense_date: z.coerce.date(),
  receipt_url: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.number(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

export const createActivityInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  type: activityTypeSchema,
  scheduled_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  location: z.string().nullable(),
  participants: z.string().nullable(),
  photos: z.string().nullable(),
  created_by: z.number(),
});

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Update schemas
export const updateChildInputSchema = z.object({
  id: z.number(),
  full_name: z.string().optional(),
  birth_date: z.coerce.date().optional(),
  gender: genderSchema.optional(),
  education_status: educationStatusSchema.optional(),
  health_history: z.string().nullable().optional(),
  guardian_info: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateChildInput = z.infer<typeof updateChildInputSchema>;

export const updateActivityInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  type: activityTypeSchema.optional(),
  scheduled_date: z.coerce.date().optional(),
  end_date: z.coerce.date().nullable().optional(),
  location: z.string().nullable().optional(),
  participants: z.string().nullable().optional(),
  photos: z.string().nullable().optional(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional(),
});

export type UpdateActivityInput = z.infer<typeof updateActivityInputSchema>;

// Query schemas
export const getDonationsByDateRangeSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  donor_id: z.number().optional(),
});

export type GetDonationsByDateRangeInput = z.infer<typeof getDonationsByDateRangeSchema>;

export const getExpensesByDateRangeSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  category: expenseCategorySchema.optional(),
});

export type GetExpensesByDateRangeInput = z.infer<typeof getExpensesByDateRangeSchema>;

export const getActivitiesByDateRangeSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  type: activityTypeSchema.optional(),
});

export type GetActivitiesByDateRangeInput = z.infer<typeof getActivitiesByDateRangeSchema>;
