
import { db } from '../db';
import { donationsTable, expensesTable } from '../db/schema';
import { type GetDonationsByDateRangeInput } from '../schema';
import { eq, gte, lte, and, sum } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

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
    const { start_date, end_date } = input;

    // Convert dates to ISO date strings for date columns
    const startDateStr = start_date.toISOString().split('T')[0];
    const endDateStr = end_date.toISOString().split('T')[0];

    // Base date range condition
    const dateCondition = and(
      gte(donationsTable.donation_date, startDateStr),
      lte(donationsTable.donation_date, endDateStr)
    );

    const expenseDateCondition = and(
      gte(expensesTable.expense_date, startDateStr),
      lte(expensesTable.expense_date, endDateStr)
    );

    // Get total donations (only money donations have amounts)
    const totalDonationsResult = await db.select({
      total: sum(donationsTable.amount)
    })
    .from(donationsTable)
    .where(and(
      dateCondition,
      eq(donationsTable.type, 'uang')
    ))
    .execute();

    // Get donations by type
    const donationsByTypeResult = await db.select({
      type: donationsTable.type,
      total: sum(donationsTable.amount)
    })
    .from(donationsTable)
    .where(dateCondition)
    .groupBy(donationsTable.type)
    .execute();

    // Get total expenses
    const totalExpensesResult = await db.select({
      total: sum(expensesTable.amount)
    })
    .from(expensesTable)
    .where(expenseDateCondition)
    .execute();

    // Get expenses by category
    const expensesByCategoryResult = await db.select({
      category: expensesTable.category,
      total: sum(expensesTable.amount)
    })
    .from(expensesTable)
    .where(expenseDateCondition)
    .groupBy(expensesTable.category)
    .execute();

    // Process results and handle numeric conversions
    const totalDonations = totalDonationsResult[0]?.total ? parseFloat(totalDonationsResult[0].total) : 0;
    const totalExpenses = totalExpensesResult[0]?.total ? parseFloat(totalExpensesResult[0].total) : 0;

    // Initialize donations by type
    const donationsByType = {
      uang: 0,
      barang: 0,
    };

    // Process donations by type
    donationsByTypeResult.forEach(result => {
      if (result.type === 'uang' && result.total) {
        donationsByType.uang = parseFloat(result.total);
      } else if (result.type === 'barang') {
        // For barang donations, we could count quantity or just mark as received
        // Since amount is null for barang, we'll keep it as 0 for monetary calculations
        donationsByType.barang = 0;
      }
    });

    // Initialize expenses by category
    const expensesByCategory = {
      makanan: 0,
      pendidikan: 0,
      kesehatan: 0,
      operasional: 0,
      lainnya: 0,
    };

    // Process expenses by category
    expensesByCategoryResult.forEach(result => {
      if (result.total) {
        expensesByCategory[result.category as keyof typeof expensesByCategory] = parseFloat(result.total);
      }
    });

    return {
      period: `${startDateStr} - ${endDateStr}`,
      total_donations: totalDonations,
      total_expenses: totalExpenses,
      balance: totalDonations - totalExpenses,
      donations_by_type: donationsByType,
      expenses_by_category: expensesByCategory,
    };
  } catch (error) {
    console.error('Financial report generation failed:', error);
    throw error;
  }
};
