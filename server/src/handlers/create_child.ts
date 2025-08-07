
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type CreateChildInput, type Child } from '../schema';

export const createChild = async (input: CreateChildInput): Promise<Child> => {
  try {
    // Insert child record
    const result = await db.insert(childrenTable)
      .values({
        full_name: input.full_name,
        birth_date: input.birth_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: input.gender,
        education_status: input.education_status,
        health_history: input.health_history,
        guardian_info: input.guardian_info,
        notes: input.notes,
      })
      .returning()
      .execute();

    // Convert birth_date string back to Date for the return type
    const child = result[0];
    return {
      ...child,
      birth_date: new Date(child.birth_date), // Convert string back to Date
    };
  } catch (error) {
    console.error('Child creation failed:', error);
    throw error;
  }
};
