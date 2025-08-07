
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

// Test user for foreign key reference
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  full_name: 'Test User',
  phone: '+1234567890',
  role: 'admin' as const,
  is_active: true
};

// Simple test input
const testInput: CreateExpenseInput = {
  category: 'makanan',
  description: 'Pembelian beras untuk anak asuh',
  amount: 150000,
  expense_date: new Date('2024-01-15'),
  receipt_url: 'https://example.com/receipt.jpg',
  notes: 'Pembelian bulanan',
  created_by: 1 // Will be set after user creation
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
    
    const userId = userResult[0].id;
    const input = { ...testInput, created_by: userId };

    const result = await createExpense(input);

    // Basic field validation
    expect(result.category).toEqual('makanan');
    expect(result.description).toEqual('Pembelian beras untuk anak asuh');
    expect(result.amount).toEqual(150000);
    expect(typeof result.amount).toEqual('number');
    expect(result.expense_date).toEqual(new Date('2024-01-15'));
    expect(result.receipt_url).toEqual('https://example.com/receipt.jpg');
    expect(result.notes).toEqual('Pembelian bulanan');
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const input = { ...testInput, created_by: userId };

    const result = await createExpense(input);

    // Query using proper drizzle syntax
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].category).toEqual('makanan');
    expect(expenses[0].description).toEqual('Pembelian beras untuk anak asuh');
    expect(parseFloat(expenses[0].amount)).toEqual(150000);
    expect(expenses[0].expense_date).toEqual('2024-01-15'); // Database stores as string
    expect(expenses[0].receipt_url).toEqual('https://example.com/receipt.jpg');
    expect(expenses[0].notes).toEqual('Pembelian bulanan');
    expect(expenses[0].created_by).toEqual(userId);
    expect(expenses[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle expenses with null optional fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const input: CreateExpenseInput = {
      category: 'operasional',
      description: 'Listrik bulanan',
      amount: 250000,
      expense_date: new Date('2024-02-01'),
      receipt_url: null,
      notes: null,
      created_by: userId
    };

    const result = await createExpense(input);

    expect(result.receipt_url).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.amount).toEqual(250000);
    expect(typeof result.amount).toEqual('number');
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...testInput, created_by: 999 }; // Non-existent user ID

    await expect(createExpense(input)).rejects.toThrow(/User with ID 999 not found/i);
  });

  it('should handle different expense categories', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const categories = ['makanan', 'pendidikan', 'kesehatan', 'operasional', 'lainnya'] as const;
    
    for (const category of categories) {
      const input: CreateExpenseInput = {
        category,
        description: `Test ${category} expense`,
        amount: 100000,
        expense_date: new Date('2024-01-01'),
        receipt_url: null,
        notes: null,
        created_by: userId
      };

      const result = await createExpense(input);
      expect(result.category).toEqual(category);
    }
  });
});
