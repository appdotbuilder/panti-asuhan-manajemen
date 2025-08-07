
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type CreateActivityInput, type Activity } from '../schema';

export const createActivity = async (input: CreateActivityInput): Promise<Activity> => {
  try {
    // Insert activity record
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
      })
      .returning()
      .execute();

    const activity = result[0];
    return {
      ...activity,
      // Convert dates to proper Date objects
      scheduled_date: new Date(activity.scheduled_date),
      end_date: activity.end_date ? new Date(activity.end_date) : null,
      created_at: new Date(activity.created_at),
      updated_at: activity.updated_at ? new Date(activity.updated_at) : null,
    };
  } catch (error) {
    console.error('Activity creation failed:', error);
    throw error;
  }
};
