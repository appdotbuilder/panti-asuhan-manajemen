
import { db } from '../db';
import { donorsTable, usersTable } from '../db/schema';
import { type Donor } from '../schema';
import { eq } from 'drizzle-orm';

export const getDonors = async (): Promise<Donor[]> => {
  try {
    // Get all donors with optional user information
    const results = await db.select({
      id: donorsTable.id,
      full_name: donorsTable.full_name,
      email: donorsTable.email,
      phone: donorsTable.phone,
      address: donorsTable.address,
      user_id: donorsTable.user_id,
      created_at: donorsTable.created_at,
      updated_at: donorsTable.updated_at,
    })
      .from(donorsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Get donors failed:', error);
    throw error;
  }
};
