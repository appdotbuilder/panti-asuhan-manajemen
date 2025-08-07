
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type GetActivitiesByDateRangeInput, type Activity } from '../schema';
import { and, gte, lte, eq } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getActivitiesByDateRange = async (input: GetActivitiesByDateRangeInput): Promise<Activity[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Date range filtering - using scheduled_date for range comparison
    conditions.push(gte(activitiesTable.scheduled_date, input.start_date));
    conditions.push(lte(activitiesTable.scheduled_date, input.end_date));

    // Optional type filter
    if (input.type) {
      conditions.push(eq(activitiesTable.type, input.type));
    }

    // Build and execute query
    const results = await db.select()
      .from(activitiesTable)
      .where(and(...conditions))
      .orderBy(activitiesTable.scheduled_date)
      .execute();

    // Convert dates properly and return
    return results.map(activity => ({
      ...activity,
      scheduled_date: new Date(activity.scheduled_date),
      end_date: activity.end_date ? new Date(activity.end_date) : null,
      created_at: new Date(activity.created_at),
      updated_at: activity.updated_at ? new Date(activity.updated_at) : null,
    }));
  } catch (error) {
    console.error('Failed to get activities by date range:', error);
    throw error;
  }
};
