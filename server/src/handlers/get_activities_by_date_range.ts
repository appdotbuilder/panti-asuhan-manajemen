
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type GetActivitiesByDateRangeInput, type Activity } from '../schema';
import { and, gte, lte, eq, type SQL } from 'drizzle-orm';

export const getActivitiesByDateRange = async (input: GetActivitiesByDateRangeInput): Promise<Activity[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Add date range filters
    conditions.push(gte(activitiesTable.scheduled_date, input.start_date));
    conditions.push(lte(activitiesTable.scheduled_date, input.end_date));

    // Add optional type filter
    if (input.type) {
      conditions.push(eq(activitiesTable.type, input.type));
    }

    // Build and execute query
    const results = await db.select()
      .from(activitiesTable)
      .where(and(...conditions))
      .execute();

    // Return results (no numeric conversions needed for activities table)
    return results;
  } catch (error) {
    console.error('Failed to get activities by date range:', error);
    throw error;
  }
};
