
import { db } from '../db';
import { donationsTable, donorsTable } from '../db/schema';
import { type CreateDonationInput, type Donation } from '../schema';
import { eq } from 'drizzle-orm';

export const createDonation = async (input: CreateDonationInput): Promise<Donation> => {
  try {
    // Validate that the donor exists
    const donor = await db.select()
      .from(donorsTable)
      .where(eq(donorsTable.id, input.donor_id))
      .execute();

    if (donor.length === 0) {
      throw new Error('Donor not found');
    }

    // Validate donation data consistency
    if (input.type === 'uang') {
      if (input.amount === null || input.amount === undefined) {
        throw new Error('Amount is required for money donations');
      }
      if (input.amount <= 0) {
        throw new Error('Amount must be positive for money donations');
      }
    } else if (input.type === 'barang') {
      if (!input.item_description || input.item_description.trim() === '') {
        throw new Error('Item description is required for goods donations');
      }
      if (input.item_quantity === null || input.item_quantity === undefined || input.item_quantity <= 0) {
        throw new Error('Item quantity must be positive for goods donations');
      }
    }

    // Insert donation record
    const result = await db.insert(donationsTable)
      .values({
        donor_id: input.donor_id,
        type: input.type,
        amount: input.amount !== null ? input.amount.toString() : null, // Convert number to string for numeric column
        item_description: input.item_description,
        item_quantity: input.item_quantity,
        donation_date: input.donation_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert fields back to expected types before returning
    const donation = result[0];
    return {
      ...donation,
      amount: donation.amount !== null ? parseFloat(donation.amount) : null, // Convert string back to number
      donation_date: new Date(donation.donation_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Donation creation failed:', error);
    throw error;
  }
};
