
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type UpdateChildInput, type Child } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChild = async (input: UpdateChildInput): Promise<Child> => {
  try {
    // First check if child exists
    const existing = await db.select()
      .from(childrenTable)
      .where(eq(childrenTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Child with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }
    if (input.birth_date !== undefined) {
      updateData.birth_date = input.birth_date;
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

    // Set updated_at timestamp
    updateData.updated_at = new Date();

    // Update the child record
    const result = await db.update(childrenTable)
      .set(updateData)
      .where(eq(childrenTable.id, input.id))
      .returning()
      .execute();

    // Convert date fields from string to Date objects before returning
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
