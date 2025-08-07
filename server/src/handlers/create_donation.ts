
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

    // Validate donation data consistency based on type
    if (input.type === 'uang') {
      if (!input.amount || input.amount <= 0) {
        throw new Error('Amount is required and must be positive for money donations');
      }
    } else if (input.type === 'barang') {
      if (!input.item_description || !input.item_quantity || input.item_quantity <= 0) {
        throw new Error('Item description and positive quantity are required for goods donations');
      }
    }

    // Convert date to string format for date column
    const donationDateString = input.donation_date.toISOString().split('T')[0];

    // Insert donation record
    const result = await db.insert(donationsTable)
      .values({
        donor_id: input.donor_id,
        type: input.type,
        amount: input.amount ? input.amount.toString() : null, // Convert number to string for numeric column
        item_description: input.item_description,
        item_quantity: input.item_quantity,
        donation_date: donationDateString, // Convert Date to string
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert fields back to expected types before returning
    const donation = result[0];
    return {
      ...donation,
      amount: donation.amount ? parseFloat(donation.amount) : null, // Convert string back to number
      donation_date: new Date(donation.donation_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Donation creation failed:', error);
    throw error;
  }
};
