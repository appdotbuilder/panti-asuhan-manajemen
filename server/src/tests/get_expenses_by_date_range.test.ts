
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, expensesTable } from '../db/schema';
import { type GetExpensesByDateRangeInput } from '../schema';
import { getExpensesByDateRange } from '../handlers/get_expenses_by_date_range';
import { eq } from 'drizzle-orm';

describe('getExpensesByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return expenses within date range', async () => {
    // Create test user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        phone: '1234567890',
        role: 'admin'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create expenses with different dates
    const yesterday = new Date('2024-01-14');
    const today = new Date('2024-01-15');
    const tomorrow = new Date('2024-01-16');
    const nextWeek = new Date('2024-01-22');

    await db.insert(expensesTable).values([
      {
        category: 'makanan',
        description: 'Test expense 1',
        amount: '150.75',
        expense_date: yesterday.toISOString().split('T')[0],
        receipt_url: null,
        notes: 'Test notes',
        created_by: user.id
      },
      {
        category: 'makanan',
        description: 'Test expense 2',
        amount: '200.50',
        expense_date: today.toISOString().split('T')[0],
        receipt_url: null,
        notes: 'Test notes',
        created_by: user.id
      },
      {
        category: 'makanan',
        description: 'Test expense 3',
        amount: '100.25',
        expense_date: tomorrow.toISOString().split('T')[0],
        receipt_url: null,
        notes: 'Test notes',
        created_by: user.id
      },
      {
        category: 'makanan',
        description: 'Test expense 4',
        amount: '300.00',
        expense_date: nextWeek.toISOString().split('T')[0],
        receipt_url: null,
        notes: 'Test notes',
        created_by: user.id
      }
    ]).execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: yesterday,
      end_date: tomorrow
    };

    const result = await getExpensesByDateRange(input);

    // Should return 3 expenses (yesterday, today, tomorrow) but not next week
    expect(result).toHaveLength(3);
    expect(result.every(expense => expense.expense_date >= yesterday && expense.expense_date <= tomorrow)).toBe(true);
    
    // Verify numeric conversion - results are ordered by date then id
    expect(typeof result[0].amount).toBe('number');
    
    // Find the expense by description to avoid order dependencies
    const expense1 = result.find(exp => exp.description === 'Test expense 1');
    const expense2 = result.find(exp => exp.description === 'Test expense 2');
    const expense3 = result.find(exp => exp.description === 'Test expense 3');
    
    expect(expense1).toBeDefined();
    expect(expense1!.amount).toBe(150.75);
    expect(expense2).toBeDefined();
    expect(expense2!.amount).toBe(200.50);
    expect(expense3).toBeDefined();
    expect(expense3!.amount).toBe(100.25);
    
    // Verify date conversion
    expect(result[0].expense_date).toBeInstanceOf(Date);
    
    // Verify required fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].category).toBe('makanan');
    expect(result[0].created_by).toBe(user.id);
  });

  it('should filter by category when provided', async () => {
    // Create test user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User 2',
        phone: '1234567890',
        role: 'admin'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const testDate = new Date('2024-01-15');
    
    // Create expenses with different categories
    await db.insert(expensesTable).values([
      {
        category: 'makanan',
        description: 'Food expense 1',
        amount: '150.75',
        expense_date: testDate.toISOString().split('T')[0],
        receipt_url: null,
        notes: 'Test notes',
        created_by: user.id
      },
      {
        category: 'pendidikan',
        description: 'Education expense',
        amount: '250.00',
        expense_date: testDate.toISOString().split('T')[0],
        receipt_url: null,
        notes: 'Test notes',
        created_by: user.id
      },
      {
        category: 'makanan',
        description: 'Food expense 2',
        amount: '75.25',
        expense_date: testDate.toISOString().split('T')[0],
        receipt_url: null,
        notes: 'Test notes',
        created_by: user.id
      }
    ]).execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: testDate,
      end_date: testDate,
      category: 'makanan'
    };

    const result = await getExpensesByDateRange(input);

    // Should return only 2 expenses with 'makanan' category
    expect(result).toHaveLength(2);
    expect(result.every(expense => expense.category === 'makanan')).toBe(true);
  });

  it('should return empty array when no expenses in date range', async () => {
    // Create test user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser3',
        email: 'test3@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User 3',
        phone: '1234567890',
        role: 'admin'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create expense outside date range
    const oldDate = new Date('2024-01-01');
    await db.insert(expensesTable).values({
      category: 'makanan',
      description: 'Old expense',
      amount: '100.00',
      expense_date: oldDate.toISOString().split('T')[0],
      receipt_url: null,
      notes: 'Test notes',
      created_by: user.id
    }).execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-20')
    };

    const result = await getExpensesByDateRange(input);
    expect(result).toHaveLength(0);
  });

  it('should handle single day date range', async () => {
    // Create test user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser4',
        email: 'test4@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User 4',
        phone: '1234567890',
        role: 'admin'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const testDate = new Date('2024-01-15');
    await db.insert(expensesTable).values({
      category: 'makanan',
      description: 'Single day expense',
      amount: '125.50',
      expense_date: testDate.toISOString().split('T')[0],
      receipt_url: null,
      notes: 'Test notes',
      created_by: user.id
    }).execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: testDate,
      end_date: testDate
    };

    const result = await getExpensesByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].expense_date.toDateString()).toBe(testDate.toDateString());
  });

  it('should include creator information through join', async () => {
    // Create test user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser5',
        email: 'test5@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User 5',
        phone: '1234567890',
        role: 'admin'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const testDate = new Date('2024-01-15');
    await db.insert(expensesTable).values({
      category: 'makanan',
      description: 'Joined expense',
      amount: '175.25',
      expense_date: testDate.toISOString().split('T')[0],
      receipt_url: null,
      notes: 'Test notes',
      created_by: user.id
    }).execute();

    const input: GetExpensesByDateRangeInput = {
      start_date: testDate,
      end_date: testDate
    };

    const result = await getExpensesByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].created_by).toBe(user.id);
    
    // Verify the join worked by ensuring created_by references valid user
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result[0].created_by))
      .execute();
    
    expect(userExists).toHaveLength(1);
    expect(userExists[0].full_name).toBe('Test User 5');
  });
});
