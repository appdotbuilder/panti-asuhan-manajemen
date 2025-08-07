
import { db } from '../db';
import { donorsTable, usersTable } from '../db/schema';
import { type CreateDonorInput, type Donor } from '../schema';
import { eq } from 'drizzle-orm';

export const createDonor = async (input: CreateDonorInput): Promise<Donor> => {
  try {
    // If user_id is provided, verify the user exists
    if (input.user_id) {
      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.user_id))
        .limit(1)
        .execute();
      
      if (user.length === 0) {
        throw new Error(`User with id ${input.user_id} not found`);
      }
    }

    // Insert donor record
    const result = await db.insert(donorsTable)
      .values({
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        user_id: input.user_id,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Donor creation failed:', error);
    throw error;
  }
};
