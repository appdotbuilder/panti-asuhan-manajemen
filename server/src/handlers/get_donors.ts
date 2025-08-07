
import { db } from '../db';
import { donorsTable, usersTable } from '../db/schema';
import { type Donor } from '../schema';
import { eq } from 'drizzle-orm';

export const getDonors = async (): Promise<Donor[]> => {
  try {
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
    .leftJoin(usersTable, eq(donorsTable.user_id, usersTable.id))
    .execute();

    return results.map(result => ({
      id: result.id,
      full_name: result.full_name,
      email: result.email,
      phone: result.phone,
      address: result.address,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    }));
  } catch (error) {
    console.error('Get donors failed:', error);
    throw error;
  }
};
