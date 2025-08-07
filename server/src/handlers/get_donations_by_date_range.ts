
import { db } from '../db';
import { donationsTable, donorsTable } from '../db/schema';
import { type GetDonationsByDateRangeInput, type Donation } from '../schema';
import { gte, lte, eq, and, type SQL, asc } from 'drizzle-orm';

export const getDonationsByDateRange = async (input: GetDonationsByDateRangeInput): Promise<Donation[]> => {
  try {
    // Base query with join to get donor information
    let query = db.select({
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
    .innerJoin(donorsTable, eq(donationsTable.donor_id, donorsTable.id));

    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Date range filters - convert dates to ISO strings for comparison
    conditions.push(gte(donationsTable.donation_date, input.start_date.toISOString().split('T')[0]));
    conditions.push(lte(donationsTable.donation_date, input.end_date.toISOString().split('T')[0]));
    
    // Optional donor filter
    if (input.donor_id !== undefined) {
      conditions.push(eq(donationsTable.donor_id, input.donor_id));
    }

    // Apply conditions
    const conditionedQuery = query.where(and(...conditions));

    // Order by donation date ascending for better reporting
    const orderedQuery = conditionedQuery.orderBy(asc(donationsTable.donation_date));

    const results = await orderedQuery.execute();

    // Convert numeric amounts back to numbers and convert date strings to Date objects
    return results.map(result => ({
      id: result.id,
      donor_id: result.donor_id,
      type: result.type,
      amount: result.amount ? parseFloat(result.amount) : null,
      item_description: result.item_description,
      item_quantity: result.item_quantity,
      donation_date: new Date(result.donation_date), // Convert string to Date
      notes: result.notes,
      created_at: result.created_at,
    }));
  } catch (error) {
    console.error('Failed to get donations by date range:', error);
    throw error;
  }
};
