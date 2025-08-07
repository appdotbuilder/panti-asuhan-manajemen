
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { donationsTable, donorsTable } from '../db/schema';
import { type CreateDonationInput } from '../schema';
import { createDonation } from '../handlers/create_donation';
import { eq } from 'drizzle-orm';

// Test donor data
const testDonor = {
  full_name: 'Test Donor',
  email: 'donor@test.com',
  phone: '123456789',
  address: 'Test Address',
  user_id: null
};

// Test donation inputs
const moneyDonationInput: CreateDonationInput = {
  donor_id: 1, // Will be set after donor creation
  type: 'uang',
  amount: 500000,
  item_description: null,
  item_quantity: null,
  donation_date: new Date('2024-01-15'),
  notes: 'Monthly donation'
};

const goodsDonationInput: CreateDonationInput = {
  donor_id: 1, // Will be set after donor creation
  type: 'barang',
  amount: null,
  item_description: 'Rice bags',
  item_quantity: 10,
  donation_date: new Date('2024-01-15'),
  notes: 'Food donation'
};

describe('createDonation', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test donor
    const donor = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    moneyDonationInput.donor_id = donor[0].id;
    goodsDonationInput.donor_id = donor[0].id;
  });
  
  afterEach(resetDB);

  it('should create a money donation', async () => {
    const result = await createDonation(moneyDonationInput);

    // Basic field validation
    expect(result.donor_id).toEqual(moneyDonationInput.donor_id);
    expect(result.type).toEqual('uang');
    expect(result.amount).toEqual(500000);
    expect(typeof result.amount).toEqual('number'); // Ensure numeric conversion
    expect(result.item_description).toBeNull();
    expect(result.item_quantity).toBeNull();
    expect(result.donation_date).toEqual(moneyDonationInput.donation_date);
    expect(result.notes).toEqual('Monthly donation');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a goods donation', async () => {
    const result = await createDonation(goodsDonationInput);

    // Basic field validation
    expect(result.donor_id).toEqual(goodsDonationInput.donor_id);
    expect(result.type).toEqual('barang');
    expect(result.amount).toBeNull();
    expect(result.item_description).toEqual('Rice bags');
    expect(result.item_quantity).toEqual(10);
    expect(result.donation_date).toEqual(goodsDonationInput.donation_date);
    expect(result.notes).toEqual('Food donation');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save donation to database', async () => {
    const result = await createDonation(moneyDonationInput);

    // Query using proper drizzle syntax
    const donations = await db.select()
      .from(donationsTable)
      .where(eq(donationsTable.id, result.id))
      .execute();

    expect(donations).toHaveLength(1);
    expect(donations[0].donor_id).toEqual(moneyDonationInput.donor_id);
    expect(donations[0].type).toEqual('uang');
    expect(parseFloat(donations[0].amount!)).toEqual(500000); // Convert string back to number for comparison
    expect(new Date(donations[0].donation_date)).toEqual(moneyDonationInput.donation_date);
    expect(donations[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent donor', async () => {
    const invalidInput = {
      ...moneyDonationInput,
      donor_id: 999 // Non-existent donor ID
    };

    await expect(createDonation(invalidInput)).rejects.toThrow(/donor not found/i);
  });

  it('should validate money donation requires amount', async () => {
    const invalidInput = {
      ...moneyDonationInput,
      amount: null
    };

    await expect(createDonation(invalidInput)).rejects.toThrow(/amount is required.*money donations/i);
  });

  it('should validate money donation requires positive amount', async () => {
    const invalidInput = {
      ...moneyDonationInput,
      amount: -100
    };

    await expect(createDonation(invalidInput)).rejects.toThrow(/amount.*must be positive.*money donations/i);
  });

  it('should validate goods donation requires item description', async () => {
    const invalidInput = {
      ...goodsDonationInput,
      item_description: null
    };

    await expect(createDonation(invalidInput)).rejects.toThrow(/item description.*required.*goods donations/i);
  });

  it('should validate goods donation requires positive quantity', async () => {
    const invalidInput = {
      ...goodsDonationInput,
      item_quantity: 0
    };

    await expect(createDonation(invalidInput)).rejects.toThrow(/positive quantity.*required.*goods donations/i);
  });
});
