
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password',
  full_name: 'Test User',
  role: 'admin' as const,
};

// Test expense input
const testInput: CreateExpenseInput = {
  category: 'makanan',
  description: 'Pembelian beras untuk anak-anak',
  amount: 150000,
  expense_date: new Date('2024-01-15'),
  receipt_url: 'https://example.com/receipt.jpg',
  notes: 'Beras 50kg untuk kebutuhan sebulan',
  created_by: 1, // Will be set after user creation
};

describe('createExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an expense', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const updatedInput = {
      ...testInput,
      created_by: userResult[0].id,
    };

    const result = await createExpense(updatedInput);

    // Basic field validation
    expect(result.category).toEqual('makanan');
    expect(result.description).toEqual('Pembelian beras untuk anak-anak');
    expect(result.amount).toEqual(150000);
    expect(typeof result.amount).toBe('number');
    expect(result.expense_date).toEqual(new Date('2024-01-15'));
    expect(result.receipt_url).toEqual('https://example.com/receipt.jpg');
    expect(result.notes).toEqual('Beras 50kg untuk kebutuhan sebulan');
    expect(result.created_by).toEqual(userResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const updatedInput = {
      ...testInput,
      created_by: userResult[0].id,
    };

    const result = await createExpense(updatedInput);

    // Query using proper drizzle syntax
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].category).toEqual('makanan');
    expect(expenses[0].description).toEqual('Pembelian beras untuk anak-anak');
    expect(parseFloat(expenses[0].amount)).toEqual(150000);
    expect(new Date(expenses[0].expense_date)).toEqual(new Date('2024-01-15'));
    expect(expenses[0].created_by).toEqual(userResult[0].id);
    expect(expenses[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const invalidInput = {
      ...testInput,
      created_by: 999, // Non-existent user ID
    };

    await expect(createExpense(invalidInput)).rejects.toThrow(/user not found/i);
  });

  it('should handle nullable fields correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const minimalInput: CreateExpenseInput = {
      category: 'operasional',
      description: 'Biaya listrik',
      amount: 200000,
      expense_date: new Date('2024-01-16'),
      receipt_url: null,
      notes: null,
      created_by: userResult[0].id,
    };

    const result = await createExpense(minimalInput);

    expect(result.category).toEqual('operasional');
    expect(result.description).toEqual('Biaya listrik');
    expect(result.amount).toEqual(200000);
    expect(result.receipt_url).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
  });
});
