
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type Child } from '../schema';
import { eq } from 'drizzle-orm';

export const getChildren = async (): Promise<Child[]> => {
  try {
    const results = await db.select()
      .from(childrenTable)
      .where(eq(childrenTable.is_active, true))
      .execute();

    // Convert date strings to Date objects to match schema
    return results.map(child => ({
      ...child,
      birth_date: new Date(child.birth_date),
    }));
  } catch (error) {
    console.error('Failed to get children:', error);
    throw error;
  }
};
