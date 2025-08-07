
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, donorsTable, donationsTable, expensesTable } from '../db/schema';
import { type GetDonationsByDateRangeInput } from '../schema';
import { getFinancialReport } from '../handlers/get_financial_report';

describe('getFinancialReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testDonorId: number;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        phone: '1234567890',
        role: 'admin'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;

    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values({
        full_name: 'Test Donor',
        email: 'donor@example.com',
        phone: '0987654321',
        address: 'Test Address'
      })
      .returning()
      .execute();

    testDonorId = donorResult[0].id;
  });

  it('should generate financial report with donations and expenses', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    // Create test donations - using string dates for date columns
    await db.insert(donationsTable)
      .values([
        {
          donor_id: testDonorId,
          type: 'uang',
          amount: '1000000',
          donation_date: '2024-01-15'
        },
        {
          donor_id: testDonorId,
          type: 'barang',
          item_description: 'Test Item',
          item_quantity: 5,
          donation_date: '2024-01-20'
        },
        {
          donor_id: testDonorId,
          type: 'uang',
          amount: '500000',
          donation_date: '2024-01-25'
        }
      ])
      .execute();

    // Create test expenses - using string dates for date columns
    await db.insert(expensesTable)
      .values([
        {
          category: 'makanan',
          description: 'Groceries',
          amount: '300000',
          expense_date: '2024-01-10',
          created_by: testUserId
        },
        {
          category: 'pendidikan',
          description: 'School supplies',
          amount: '200000',
          expense_date: '2024-01-20',
          created_by: testUserId
        }
      ])
      .execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: startDate,
      end_date: endDate
    };

    const result = await getFinancialReport(input);

    // Verify report structure
    expect(result.period).toEqual('2024-01-01 - 2024-01-31');
    expect(result.total_donations).toEqual(1500000);
    expect(result.total_expenses).toEqual(500000);
    expect(result.balance).toEqual(1000000);

    // Verify donations by type
    expect(result.donations_by_type.uang).toEqual(1500000);
    expect(result.donations_by_type.barang).toEqual(0);

    // Verify expenses by category
    expect(result.expenses_by_category.makanan).toEqual(300000);
    expect(result.expenses_by_category.pendidikan).toEqual(200000);
    expect(result.expenses_by_category.kesehatan).toEqual(0);
    expect(result.expenses_by_category.operasional).toEqual(0);
    expect(result.expenses_by_category.lainnya).toEqual(0);
  });

  it('should return zero values for empty date range', async () => {
    const startDate = new Date('2024-06-01');
    const endDate = new Date('2024-06-30');

    const input: GetDonationsByDateRangeInput = {
      start_date: startDate,
      end_date: endDate
    };

    const result = await getFinancialReport(input);

    expect(result.period).toEqual('2024-06-01 - 2024-06-30');
    expect(result.total_donations).toEqual(0);
    expect(result.total_expenses).toEqual(0);
    expect(result.balance).toEqual(0);

    // All categories should be zero
    expect(result.donations_by_type.uang).toEqual(0);
    expect(result.donations_by_type.barang).toEqual(0);
    expect(result.expenses_by_category.makanan).toEqual(0);
    expect(result.expenses_by_category.pendidikan).toEqual(0);
    expect(result.expenses_by_category.kesehatan).toEqual(0);
    expect(result.expenses_by_category.operasional).toEqual(0);
    expect(result.expenses_by_category.lainnya).toEqual(0);
  });

  it('should filter data correctly by date range', async () => {
    // Create donations and expenses in different months - using string dates
    await db.insert(donationsTable)
      .values([
        {
          donor_id: testDonorId,
          type: 'uang',
          amount: '1000000',
          donation_date: '2024-01-15' // Inside range
        },
        {
          donor_id: testDonorId,
          type: 'uang',
          amount: '2000000',
          donation_date: '2024-02-15' // Outside range
        }
      ])
      .execute();

    await db.insert(expensesTable)
      .values([
        {
          category: 'makanan',
          description: 'Groceries January',
          amount: '500000',
          expense_date: '2024-01-20', // Inside range
          created_by: testUserId
        },
        {
          category: 'makanan',
          description: 'Groceries February',
          amount: '600000',
          expense_date: '2024-02-20', // Outside range
          created_by: testUserId
        }
      ])
      .execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialReport(input);

    // Should only include January data
    expect(result.total_donations).toEqual(1000000);
    expect(result.total_expenses).toEqual(500000);
    expect(result.balance).toEqual(500000);
  });

  it('should handle all expense categories correctly', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    // Create expenses in all categories - using string dates
    await db.insert(expensesTable)
      .values([
        {
          category: 'makanan',
          description: 'Food',
          amount: '100000',
          expense_date: '2024-01-10',
          created_by: testUserId
        },
        {
          category: 'pendidikan',
          description: 'Education',
          amount: '200000',
          expense_date: '2024-01-15',
          created_by: testUserId
        },
        {
          category: 'kesehatan',
          description: 'Health',
          amount: '300000',
          expense_date: '2024-01-20',
          created_by: testUserId
        },
        {
          category: 'operasional',
          description: 'Operations',
          amount: '400000',
          expense_date: '2024-01-25',
          created_by: testUserId
        },
        {
          category: 'lainnya',
          description: 'Other',
          amount: '500000',
          expense_date: '2024-01-30',
          created_by: testUserId
        }
      ])
      .execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: startDate,
      end_date: endDate
    };

    const result = await getFinancialReport(input);

    expect(result.total_expenses).toEqual(1500000);
    expect(result.expenses_by_category.makanan).toEqual(100000);
    expect(result.expenses_by_category.pendidikan).toEqual(200000);
    expect(result.expenses_by_category.kesehatan).toEqual(300000);
    expect(result.expenses_by_category.operasional).toEqual(400000);
    expect(result.expenses_by_category.lainnya).toEqual(500000);
  });
});
