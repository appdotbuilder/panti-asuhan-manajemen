
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { type GetExpensesByDateRangeInput, type Expense } from '../schema';
import { gte, lte, eq, and, type SQL, asc } from 'drizzle-orm';

export const getExpensesByDateRange = async (input: GetExpensesByDateRangeInput): Promise<Expense[]> => {
  try {
    // Build conditions array for date range filtering
    const conditions: SQL<unknown>[] = [];

    // Convert dates to strings for comparison with date column
    const startDateStr = input.start_date.toISOString().split('T')[0];
    const endDateStr = input.end_date.toISOString().split('T')[0];

    // Add date range conditions
    conditions.push(gte(expensesTable.expense_date, startDateStr));
    conditions.push(lte(expensesTable.expense_date, endDateStr));

    // Add optional category filter
    if (input.category) {
      conditions.push(eq(expensesTable.category, input.category));
    }

    // Build the complete query with all conditions
    const results = await db.select({
      id: expensesTable.id,
      category: expensesTable.category,
      description: expensesTable.description,
      amount: expensesTable.amount,
      expense_date: expensesTable.expense_date,
      receipt_url: expensesTable.receipt_url,
      notes: expensesTable.notes,
      created_by: expensesTable.created_by,
      created_at: expensesTable.created_at,
    })
      .from(expensesTable)
      .innerJoin(usersTable, eq(expensesTable.created_by, usersTable.id))
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(asc(expensesTable.expense_date))
      .execute();

    // Convert numeric and date fields back to proper types for return
    return results.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount), // Convert numeric string to number
      expense_date: new Date(expense.expense_date), // Convert date string to Date
    }));
  } catch (error) {
    console.error('Get expenses by date range failed:', error);
    throw error;
  }
};
