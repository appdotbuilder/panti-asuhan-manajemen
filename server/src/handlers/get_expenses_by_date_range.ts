
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { type GetExpensesByDateRangeInput, type Expense } from '../schema';
import { gte, lte, eq, and, SQL, asc } from 'drizzle-orm';

export const getExpensesByDateRange = async (input: GetExpensesByDateRangeInput): Promise<Expense[]> => {
  try {
    // Start with a base query including creator join for audit purposes
    let query = db.select({
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
    .innerJoin(usersTable, eq(expensesTable.created_by, usersTable.id));

    // Build conditions array
    const conditions: SQL<unknown>[] = [
      gte(expensesTable.expense_date, input.start_date.toISOString().split('T')[0]),
      lte(expensesTable.expense_date, input.end_date.toISOString().split('T')[0])
    ];

    // Add optional category filter
    if (input.category) {
      conditions.push(eq(expensesTable.category, input.category));
    }

    // Apply where clause and order by expense_date for consistent results
    const finalQuery = query.where(and(...conditions)).orderBy(asc(expensesTable.expense_date), asc(expensesTable.id));

    const results = await finalQuery.execute();

    // Convert numeric amount fields back to numbers and date strings back to dates
    return results.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount),
      expense_date: new Date(expense.expense_date)
    }));
  } catch (error) {
    console.error('Get expenses by date range failed:', error);
    throw error;
  }
};
