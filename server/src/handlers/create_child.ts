
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type CreateChildInput, type Child } from '../schema';

export const createChild = async (input: CreateChildInput): Promise<Child> => {
  try {
    // Insert child record - convert Date to string for date column
    const result = await db.insert(childrenTable)
      .values({
        full_name: input.full_name,
        birth_date: input.birth_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: input.gender,
        education_status: input.education_status,
        health_history: input.health_history,
        guardian_info: input.guardian_info,
        notes: input.notes
        // is_active defaults to true in schema
        // created_at defaults to now() in schema
        // updated_at defaults to null
      })
      .returning()
      .execute();

    // Convert birth_date back to Date object before returning
    const child = result[0];
    return {
      ...child,
      birth_date: new Date(child.birth_date + 'T00:00:00.000Z') // Convert string back to Date
    };
  } catch (error) {
    console.error('Child creation failed:', error);
    throw error;
  }
};
