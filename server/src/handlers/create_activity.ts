
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type CreateActivityInput, type Activity } from '../schema';

export const createActivity = async (input: CreateActivityInput): Promise<Activity> => {
  try {
    const result = await db.insert(activitiesTable)
      .values({
        title: input.title,
        description: input.description,
        type: input.type,
        scheduled_date: input.scheduled_date,
        end_date: input.end_date,
        location: input.location,
        participants: input.participants,
        photos: input.photos,
        created_by: input.created_by,
        status: 'planned' // Default status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Activity creation failed:', error);
    throw error;
  }
};
