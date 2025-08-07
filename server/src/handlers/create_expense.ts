
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { type CreateExpenseInput, type Expense } from '../schema';
import { eq } from 'drizzle-orm';

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
  try {
    // Verify that the creating user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Insert expense record
    const result = await db.insert(expensesTable)
      .values({
        category: input.category,
        description: input.description,
        amount: input.amount.toString(), // Convert number to string for numeric column
        expense_date: input.expense_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        receipt_url: input.receipt_url,
        notes: input.notes,
        created_by: input.created_by,
      })
      .returning()
      .execute();

    // Convert fields back to expected types before returning
    const expense = result[0];
    return {
      ...expense,
      amount: parseFloat(expense.amount), // Convert string back to number
      expense_date: new Date(expense.expense_date), // Convert string back to Date
    };
  } catch (error) {
    console.error('Expense creation failed:', error);
    throw error;
  }
};
