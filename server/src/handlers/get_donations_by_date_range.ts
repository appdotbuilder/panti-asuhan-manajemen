
import { db } from '../db';
import { donationsTable, donorsTable } from '../db/schema';
import { type GetDonationsByDateRangeInput, type Donation } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export const getDonationsByDateRange = async (input: GetDonationsByDateRangeInput): Promise<Donation[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Date range filtering - convert Date objects to strings for date columns
    const startDateStr = input.start_date.toISOString().split('T')[0];
    const endDateStr = input.end_date.toISOString().split('T')[0];
    
    conditions.push(gte(donationsTable.donation_date, startDateStr));
    conditions.push(lte(donationsTable.donation_date, endDateStr));

    // Optional donor filtering
    if (input.donor_id !== undefined) {
      conditions.push(eq(donationsTable.donor_id, input.donor_id));
    }

    // Build and execute the query
    const results = await db.select({
      id: donationsTable.id,
      donor_id: donationsTable.donor_id,
      type: donationsTable.type,
      amount: donationsTable.amount,
      item_description: donationsTable.item_description,
      item_quantity: donationsTable.item_quantity,
      donation_date: donationsTable.donation_date,
      notes: donationsTable.notes,
      created_at: donationsTable.created_at,
    })
    .from(donationsTable)
    .innerJoin(donorsTable, eq(donationsTable.donor_id, donorsTable.id))
    .where(and(...conditions))
    .orderBy(donationsTable.donation_date)
    .execute();

    // Convert data to match Donation schema
    return results.map(result => ({
      id: result.id,
      donor_id: result.donor_id,
      type: result.type,
      amount: result.amount ? parseFloat(result.amount) : null,
      item_description: result.item_description,
      item_quantity: result.item_quantity,
      donation_date: new Date(result.donation_date), // Convert string back to Date
      notes: result.notes,
      created_at: result.created_at,
    }));
  } catch (error) {
    console.error('Failed to get donations by date range:', error);
    throw error;
  }
};
