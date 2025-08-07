
import { db } from '../db';
import { donationsTable, expensesTable } from '../db/schema';
import { type GetDonationsByDateRangeInput } from '../schema';
import { between, eq, sum, and, gte, lte } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export interface FinancialReport {
  period: string;
  total_donations: number;
  total_expenses: number;
  balance: number;
  donations_by_type: {
    uang: number;
    barang: number;
  };
  expenses_by_category: {
    makanan: number;
    pendidikan: number;
    kesehatan: number;
    operasional: number;
    lainnya: number;
  };
}

export const getFinancialReport = async (input: GetDonationsByDateRangeInput): Promise<FinancialReport> => {
  try {
    const { start_date, end_date, donor_id } = input;

    // Convert dates to strings for comparison with date columns
    const startDateStr = start_date.toISOString().split('T')[0];
    const endDateStr = end_date.toISOString().split('T')[0];

    // Build date conditions
    const dateConditions: SQL<unknown>[] = [
      gte(donationsTable.donation_date, startDateStr),
      lte(donationsTable.donation_date, endDateStr)
    ];

    const expenseDateConditions: SQL<unknown>[] = [
      gte(expensesTable.expense_date, startDateStr),
      lte(expensesTable.expense_date, endDateStr)
    ];

    // Add donor filter if provided
    if (donor_id !== undefined) {
      dateConditions.push(eq(donationsTable.donor_id, donor_id));
    }

    // Get total donations (money only)
    const allDonationConditions = [
      ...dateConditions,
      eq(donationsTable.type, 'uang')
    ];

    const donationsResult = await db.select({
      total: sum(donationsTable.amount)
    })
    .from(donationsTable)
    .where(and(...allDonationConditions))
    .execute();

    const total_donations = parseFloat(donationsResult[0]?.total || '0');

    // Get donations by type (money)
    const moneyResult = await db.select({
      total: sum(donationsTable.amount)
    })
    .from(donationsTable)
    .where(and(...allDonationConditions))
    .execute();

    const money_donations = parseFloat(moneyResult[0]?.total || '0');

    // Get item donations count (we can't sum amounts for items, so we count items)
    const itemConditions = [
      ...dateConditions,
      eq(donationsTable.type, 'barang')
    ];

    const itemResult = await db.select({
      total: sum(donationsTable.item_quantity)
    })
    .from(donationsTable)
    .where(and(...itemConditions))
    .execute();

    const item_donations = parseInt(itemResult[0]?.total || '0');

    // Get total expenses
    const expensesResult = await db.select({
      total: sum(expensesTable.amount)
    })
    .from(expensesTable)
    .where(and(...expenseDateConditions))
    .execute();

    const total_expenses = parseFloat(expensesResult[0]?.total || '0');

    // Get expenses by category
    const expenseCategories = ['makanan', 'pendidikan', 'kesehatan', 'operasional', 'lainnya'] as const;
    const expenses_by_category = {
      makanan: 0,
      pendidikan: 0,
      kesehatan: 0,
      operasional: 0,
      lainnya: 0,
    };

    for (const category of expenseCategories) {
      const categoryConditions = [
        ...expenseDateConditions,
        eq(expensesTable.category, category)
      ];

      const categoryResult = await db.select({
        total: sum(expensesTable.amount)
      })
      .from(expensesTable)
      .where(and(...categoryConditions))
      .execute();

      expenses_by_category[category] = parseFloat(categoryResult[0]?.total || '0');
    }

    // Calculate balance
    const balance = total_donations - total_expenses;

    return {
      period: `${startDateStr} - ${endDateStr}`,
      total_donations,
      total_expenses,
      balance,
      donations_by_type: {
        uang: money_donations,
        barang: item_donations,
      },
      expenses_by_category,
    };
  } catch (error) {
    console.error('Financial report generation failed:', error);
    throw error;
  }
};
