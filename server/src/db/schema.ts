
import { serial, text, pgTable, timestamp, numeric, integer, boolean, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'pengurus', 'donatur']);
export const genderEnum = pgEnum('gender', ['laki-laki', 'perempuan']);
export const educationStatusEnum = pgEnum('education_status', ['belum_sekolah', 'tk', 'sd', 'smp', 'sma', 'kuliah', 'lulus']);
export const donationTypeEnum = pgEnum('donation_type', ['uang', 'barang']);
export const expenseCategoryEnum = pgEnum('expense_category', ['makanan', 'pendidikan', 'kesehatan', 'operasional', 'lainnya']);
export const activityTypeEnum = pgEnum('activity_type', ['harian', 'mingguan', 'bulanan', 'khusus']);
export const activityStatusEnum = pgEnum('activity_status', ['planned', 'ongoing', 'completed', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at'),
});

// Children table
export const childrenTable = pgTable('children', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  birth_date: date('birth_date').notNull(),
  gender: genderEnum('gender').notNull(),
  education_status: educationStatusEnum('education_status').notNull(),
  health_history: text('health_history'),
  guardian_info: text('guardian_info'),
  notes: text('notes'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at'),
});

// Donors table
export const donorsTable = pgTable('donors', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  user_id: integer('user_id').references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at'),
});

// Donations table
export const donationsTable = pgTable('donations', {
  id: serial('id').primaryKey(),
  donor_id: integer('donor_id').notNull().references(() => donorsTable.id),
  type: donationTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  item_description: text('item_description'),
  item_quantity: integer('item_quantity'),
  donation_date: date('donation_date').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Expenses table
export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  category: expenseCategoryEnum('category').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  expense_date: date('expense_date').notNull(),
  receipt_url: text('receipt_url'),
  notes: text('notes'),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Activities table
export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: activityTypeEnum('type').notNull(),
  scheduled_date: timestamp('scheduled_date').notNull(),
  end_date: timestamp('end_date'),
  location: text('location'),
  participants: text('participants'),
  photos: text('photos'),
  status: activityStatusEnum('status').notNull().default('planned'),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at'),
});

// Relations
export const usersRelations = relations(usersTable, ({ many, one }) => ({
  donor: one(donorsTable),
  expenses: many(expensesTable),
  activities: many(activitiesTable),
}));

export const donorsRelations = relations(donorsTable, ({ many, one }) => ({
  user: one(usersTable, {
    fields: [donorsTable.user_id],
    references: [usersTable.id],
  }),
  donations: many(donationsTable),
}));

export const donationsRelations = relations(donationsTable, ({ one }) => ({
  donor: one(donorsTable, {
    fields: [donationsTable.donor_id],
    references: [donorsTable.id],
  }),
}));

export const expensesRelations = relations(expensesTable, ({ one }) => ({
  createdBy: one(usersTable, {
    fields: [expensesTable.created_by],
    references: [usersTable.id],
  }),
}));

export const activitiesRelations = relations(activitiesTable, ({ one }) => ({
  createdBy: one(usersTable, {
    fields: [activitiesTable.created_by],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the tables
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Child = typeof childrenTable.$inferSelect;
export type NewChild = typeof childrenTable.$inferInsert;
export type Donor = typeof donorsTable.$inferSelect;
export type NewDonor = typeof donorsTable.$inferInsert;
export type Donation = typeof donationsTable.$inferSelect;
export type NewDonation = typeof donationsTable.$inferInsert;
export type Expense = typeof expensesTable.$inferSelect;
export type NewExpense = typeof expensesTable.$inferInsert;
export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  children: childrenTable,
  donors: donorsTable,
  donations: donationsTable,
  expenses: expensesTable,
  activities: activitiesTable,
};
