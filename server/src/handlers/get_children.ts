
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Child } from '../schema';

export const getChildren = async (): Promise<Child[]> => {
  try {
    const results = await db.select()
      .from(childrenTable)
      .where(eq(childrenTable.is_active, true))
      .execute();

    // Convert birth_date string to Date object to match Zod schema
    return results.map(child => ({
      ...child,
      birth_date: new Date(child.birth_date)
    }));
  } catch (error) {
    console.error('Failed to fetch children:', error);
    throw error;
  }
};
