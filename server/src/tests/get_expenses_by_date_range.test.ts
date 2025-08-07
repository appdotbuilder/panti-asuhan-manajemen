
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, expensesTable } from '../db/schema';
import { type GetExpensesByDateRangeInput, type CreateUserInput, type CreateExpenseInput } from '../schema';
import { getExpensesByDateRange } from '../handlers/get_expenses_by_date_range';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  phone: '123456789',
  role: 'admin',
};

const testExpense1: Omit<CreateExpenseInput, 'created_by'> = {
  category: 'makanan',
  description: 'Pembelian beras',
  amount: 50000,
  expense_date: new Date('2024-01-15'),
  receipt_url: 'https://example.com/receipt1.jpg',
  notes: 'Untuk konsumsi anak-anak',
};

const testExpense2: Omit<CreateExpenseInput, 'created_by'> = {
  category: 'pendidikan',
  description: 'Pembelian buku tulis',
  amount: 25000,
  expense_date: new Date('2024-01-20'),
  receipt_url: null,
  notes: null,
};

const testExpense3: Omit<CreateExpenseInput, 'created_by'> = {
  category: 'kesehatan',
  description: 'Obat-obatan',
  amount: 75000,
  expense_date: new Date('2024-02-05'),
  receipt_url: null,
  notes: 'Vitamin untuk anak-anak',
};

describe('getExpensesByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get expenses within date range', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test expenses - convert dates to strings for database insertion
    await db.insert(expensesTable)
      .values([
        {
          ...testExpense1,
          amount: testExpense1.amount.toString(),
          expense_date: testExpense1.expense_date.toISOString().split('T')[0],
          created_by: userId,
        },
        {
          ...testExpense2,
          amount: testExpense2.amount.toString(),
          expense_date: testExpense2.expense_date.toISOString().split('T')[0],
          created_by: userId,
        },
        {
          ...testExpense3,
          amount: testExpense3.amount.toString(),
          expense_date: testExpense3.expense_date.toISOString().split('T')[0],
          created_by: userId,
        },
      ])
      .execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
    };

    const result = await getExpensesByDateRange(input);

    // Should return only expenses from January (2 expenses)
    expect(result).toHaveLength(2);
    expect(result[0].description).toEqual('Pembelian beras');
    expect(result[1].description).toEqual('Pembelian buku tulis');
    
    // Verify numeric conversion
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].amount).toEqual(50000);
    expect(result[1].amount).toEqual(25000);

    // Verify date conversion
    expect(result[0].expense_date).toBeInstanceOf(Date);
    expect(result[1].expense_date).toBeInstanceOf(Date);

    // Verify all required fields are present
    result.forEach(expense => {
      expect(expense.id).toBeDefined();
      expect(expense.category).toBeDefined();
      expect(expense.description).toBeDefined();
      expect(expense.amount).toBeDefined();
      expect(expense.expense_date).toBeInstanceOf(Date);
      expect(expense.created_by).toEqual(userId);
      expect(expense.created_at).toBeInstanceOf(Date);
    });
  });

  it('should filter by category when provided', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test expenses
    await db.insert(expensesTable)
      .values([
        {
          ...testExpense1,
          amount: testExpense1.amount.toString(),
          expense_date: testExpense1.expense_date.toISOString().split('T')[0],
          created_by: userId,
        },
        {
          ...testExpense2,
          amount: testExpense2.amount.toString(),
          expense_date: testExpense2.expense_date.toISOString().split('T')[0],
          created_by: userId,
        },
      ])
      .execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      category: 'makanan',
    };

    const result = await getExpensesByDateRange(input);

    // Should return only food category expense
    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual('makanan');
    expect(result[0].description).toEqual('Pembelian beras');
    expect(result[0].amount).toEqual(50000);
  });

  it('should return empty array when no expenses in date range', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create expense outside date range
    await db.insert(expensesTable)
      .values({
        ...testExpense3,
        amount: testExpense3.amount.toString(),
        expense_date: testExpense3.expense_date.toISOString().split('T')[0],
        created_by: userId,
      })
      .execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
    };

    const result = await getExpensesByDateRange(input);

    expect(result).toHaveLength(0);
  });

  it('should handle single day date range', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create expense on specific date
    await db.insert(expensesTable)
      .values({
        ...testExpense1,
        amount: testExpense1.amount.toString(),
        expense_date: testExpense1.expense_date.toISOString().split('T')[0],
        created_by: userId,
      })
      .execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15'),
    };

    const result = await getExpensesByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual('Pembelian beras');
  });

  it('should return expenses ordered by expense_date', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create expenses with different dates
    const laterExpense = {
      category: 'operasional' as const,
      description: 'Later expense',
      amount: '30000',
      expense_date: '2024-01-25',
      receipt_url: null,
      notes: null,
      created_by: userId,
    };

    await db.insert(expensesTable)
      .values([
        {
          ...testExpense1,
          amount: testExpense1.amount.toString(),
          expense_date: testExpense1.expense_date.toISOString().split('T')[0],
          created_by: userId,
        },
        laterExpense,
        {
          ...testExpense2,
          amount: testExpense2.amount.toString(),
          expense_date: testExpense2.expense_date.toISOString().split('T')[0],
          created_by: userId,
        },
      ])
      .execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
    };

    const result = await getExpensesByDateRange(input);

    expect(result).toHaveLength(3);
    
    // Verify ordering by expense_date (ascending)
    expect(result[0].expense_date.getTime()).toBeLessThanOrEqual(result[1].expense_date.getTime());
    expect(result[1].expense_date.getTime()).toBeLessThanOrEqual(result[2].expense_date.getTime());
  });
});
