
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type UpdateChildInput, type Child } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChild = async (input: UpdateChildInput): Promise<Child> => {
  try {
    // Check if child exists
    const existingChild = await db.select()
      .from(childrenTable)
      .where(eq(childrenTable.id, input.id))
      .execute();

    if (existingChild.length === 0) {
      throw new Error(`Child with id ${input.id} not found`);
    }

    // Build update data - only include fields that are provided
    const updateData: Partial<typeof childrenTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }
    if (input.birth_date !== undefined) {
      // Convert Date to string for date column
      updateData.birth_date = input.birth_date.toISOString().split('T')[0];
    }
    if (input.gender !== undefined) {
      updateData.gender = input.gender;
    }
    if (input.education_status !== undefined) {
      updateData.education_status = input.education_status;
    }
    if (input.health_history !== undefined) {
      updateData.health_history = input.health_history;
    }
    if (input.guardian_info !== undefined) {
      updateData.guardian_info = input.guardian_info;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update child record
    const result = await db.update(childrenTable)
      .set(updateData)
      .where(eq(childrenTable.id, input.id))
      .returning()
      .execute();

    // Convert date string back to Date object for the return type
    const child = result[0];
    return {
      ...child,
      birth_date: new Date(child.birth_date)
    };
  } catch (error) {
    console.error('Child update failed:', error);
    throw error;
  }
};
