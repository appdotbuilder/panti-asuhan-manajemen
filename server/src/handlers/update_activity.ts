
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type UpdateActivityInput, type Activity } from '../schema';
import { eq } from 'drizzle-orm';

export const updateActivity = async (input: UpdateActivityInput): Promise<Activity> => {
  try {
    // Check if activity exists
    const existingActivity = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, input.id))
      .execute();

    if (existingActivity.length === 0) {
      throw new Error(`Activity with id ${input.id} not found`);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.scheduled_date !== undefined) updateData.scheduled_date = input.scheduled_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.participants !== undefined) updateData.participants = input.participants;
    if (input.photos !== undefined) updateData.photos = input.photos;
    if (input.status !== undefined) updateData.status = input.status;

    // Update activity
    const result = await db.update(activitiesTable)
      .set(updateData)
      .where(eq(activitiesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Activity update failed:', error);
    throw error;
  }
};
