
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, donorsTable, donationsTable, expensesTable } from '../db/schema';
import { type GetDonationsByDateRangeInput } from '../schema';
import { getFinancialReport } from '../handlers/get_financial_report';

describe('getFinancialReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate basic financial report', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test donor
    const donorResult = await db.insert(donorsTable)
      .values({
        full_name: 'Test Donor',
        email: 'donor@example.com'
      })
      .returning()
      .execute();

    const donorId = donorResult[0].id;

    // Create test donations
    await db.insert(donationsTable)
      .values([
        {
          donor_id: donorId,
          type: 'uang',
          amount: '1000000.00',
          donation_date: '2024-01-15'
        },
        {
          donor_id: donorId,
          type: 'barang',
          item_description: 'Beras 10kg',
          item_quantity: 5,
          donation_date: '2024-01-20'
        }
      ])
      .execute();

    // Create test expenses
    await db.insert(expensesTable)
      .values([
        {
          category: 'makanan',
          description: 'Beli beras',
          amount: '500000.00',
          expense_date: '2024-01-25',
          created_by: userId
        },
        {
          category: 'pendidikan',
          description: 'Buku sekolah',
          amount: '200000.00',
          expense_date: '2024-01-30',
          created_by: userId
        }
      ])
      .execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialReport(input);

    expect(result.period).toEqual('2024-01-01 - 2024-01-31');
    expect(result.total_donations).toEqual(1000000);
    expect(result.total_expenses).toEqual(700000);
    expect(result.balance).toEqual(300000);
    expect(result.donations_by_type.uang).toEqual(1000000);
    expect(result.donations_by_type.barang).toEqual(5);
    expect(result.expenses_by_category.makanan).toEqual(500000);
    expect(result.expenses_by_category.pendidikan).toEqual(200000);
    expect(result.expenses_by_category.kesehatan).toEqual(0);
  });

  it('should filter by donor when donor_id provided', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create two test donors
    const donorResults = await db.insert(donorsTable)
      .values([
        { full_name: 'Donor 1', email: 'donor1@example.com' },
        { full_name: 'Donor 2', email: 'donor2@example.com' }
      ])
      .returning()
      .execute();

    const donor1Id = donorResults[0].id;
    const donor2Id = donorResults[1].id;

    // Create donations from both donors
    await db.insert(donationsTable)
      .values([
        {
          donor_id: donor1Id,
          type: 'uang',
          amount: '1000000.00',
          donation_date: '2024-01-15'
        },
        {
          donor_id: donor2Id,
          type: 'uang',
          amount: '500000.00',
          donation_date: '2024-01-20'
        }
      ])
      .execute();

    // Create expense (should not be filtered by donor)
    await db.insert(expensesTable)
      .values({
        category: 'makanan',
        description: 'Beli beras',
        amount: '300000.00',
        expense_date: '2024-01-25',
        created_by: userId
      })
      .execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      donor_id: donor1Id
    };

    const result = await getFinancialReport(input);

    // Should only include donations from donor 1, but all expenses
    expect(result.total_donations).toEqual(1000000);
    expect(result.total_expenses).toEqual(300000);
    expect(result.balance).toEqual(700000);
  });

  it('should return zeros for empty date range', async () => {
    const input: GetDonationsByDateRangeInput = {
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31')
    };

    const result = await getFinancialReport(input);

    expect(result.period).toEqual('2025-01-01 - 2025-01-31');
    expect(result.total_donations).toEqual(0);
    expect(result.total_expenses).toEqual(0);
    expect(result.balance).toEqual(0);
    expect(result.donations_by_type.uang).toEqual(0);
    expect(result.donations_by_type.barang).toEqual(0);
    
    // All expense categories should be zero
    Object.values(result.expenses_by_category).forEach(amount => {
      expect(amount).toEqual(0);
    });
  });

  it('should handle multiple categories correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create expenses in different categories
    await db.insert(expensesTable)
      .values([
        {
          category: 'makanan',
          description: 'Beli beras',
          amount: '1000000.00',
          expense_date: '2024-01-15',
          created_by: userId
        },
        {
          category: 'makanan',
          description: 'Beli sayur',
          amount: '500000.00',
          expense_date: '2024-01-20',
          created_by: userId
        },
        {
          category: 'kesehatan',
          description: 'Obat-obatan',
          amount: '300000.00',
          expense_date: '2024-01-25',
          created_by: userId
        }
      ])
      .execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialReport(input);

    expect(result.total_expenses).toEqual(1800000);
    expect(result.expenses_by_category.makanan).toEqual(1500000);
    expect(result.expenses_by_category.kesehatan).toEqual(300000);
    expect(result.expenses_by_category.pendidikan).toEqual(0);
    expect(result.expenses_by_category.operasional).toEqual(0);
    expect(result.expenses_by_category.lainnya).toEqual(0);
  });
});
