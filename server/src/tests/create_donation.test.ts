
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
  phone: '08123456789',
  address: 'Test Address',
  user_id: null
};

// Test input for money donation
const moneyDonationInput: CreateDonationInput = {
  donor_id: 1, // Will be set after creating donor
  type: 'uang',
  amount: 500000,
  item_description: null,
  item_quantity: null,
  donation_date: new Date('2024-01-15'),
  notes: 'Test money donation'
};

// Test input for goods donation
const goodsDonationInput: CreateDonationInput = {
  donor_id: 1, // Will be set after creating donor
  type: 'barang',
  amount: null,
  item_description: 'Buku pelajaran',
  item_quantity: 20,
  donation_date: new Date('2024-01-16'),
  notes: 'Test goods donation'
};

describe('createDonation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a money donation', async () => {
    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    const donor = donorResult[0];
    const input = { ...moneyDonationInput, donor_id: donor.id };

    const result = await createDonation(input);

    // Basic field validation
    expect(result.donor_id).toEqual(donor.id);
    expect(result.type).toEqual('uang');
    expect(result.amount).toEqual(500000);
    expect(typeof result.amount).toEqual('number');
    expect(result.item_description).toBeNull();
    expect(result.item_quantity).toBeNull();
    expect(result.donation_date).toEqual(new Date('2024-01-15'));
    expect(result.notes).toEqual('Test money donation');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a goods donation', async () => {
    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    const donor = donorResult[0];
    const input = { ...goodsDonationInput, donor_id: donor.id };

    const result = await createDonation(input);

    // Basic field validation
    expect(result.donor_id).toEqual(donor.id);
    expect(result.type).toEqual('barang');
    expect(result.amount).toBeNull();
    expect(result.item_description).toEqual('Buku pelajaran');
    expect(result.item_quantity).toEqual(20);
    expect(result.donation_date).toEqual(new Date('2024-01-16'));
    expect(result.notes).toEqual('Test goods donation');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save donation to database', async () => {
    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    const donor = donorResult[0];
    const input = { ...moneyDonationInput, donor_id: donor.id };

    const result = await createDonation(input);

    // Query using proper drizzle syntax
    const donations = await db.select()
      .from(donationsTable)
      .where(eq(donationsTable.id, result.id))
      .execute();

    expect(donations).toHaveLength(1);
    expect(donations[0].donor_id).toEqual(donor.id);
    expect(donations[0].type).toEqual('uang');
    expect(parseFloat(donations[0].amount!)).toEqual(500000);
    expect(new Date(donations[0].donation_date)).toEqual(new Date('2024-01-15'));
    expect(donations[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when donor does not exist', async () => {
    const input = { ...moneyDonationInput, donor_id: 999 };

    await expect(() => createDonation(input))
      .toThrow(/donor not found/i);
  });

  it('should throw error when amount is missing for money donation', async () => {
    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    const donor = donorResult[0];
    const input = { 
      ...moneyDonationInput, 
      donor_id: donor.id,
      amount: null 
    };

    await expect(() => createDonation(input))
      .toThrow(/amount is required for money donations/i);
  });

  it('should throw error when amount is zero for money donation', async () => {
    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    const donor = donorResult[0];
    const input = { 
      ...moneyDonationInput, 
      donor_id: donor.id,
      amount: 0 
    };

    await expect(() => createDonation(input))
      .toThrow(/amount must be positive for money donations/i);
  });

  it('should throw error when item description is missing for goods donation', async () => {
    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    const donor = donorResult[0];
    const input = { 
      ...goodsDonationInput, 
      donor_id: donor.id,
      item_description: null 
    };

    await expect(() => createDonation(input))
      .toThrow(/item description is required for goods donations/i);
  });

  it('should throw error when item quantity is missing for goods donation', async () => {
    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    const donor = donorResult[0];
    const input = { 
      ...goodsDonationInput, 
      donor_id: donor.id,
      item_quantity: null 
    };

    await expect(() => createDonation(input))
      .toThrow(/item quantity must be positive for goods donations/i);
  });

  it('should throw error when item quantity is zero for goods donation', async () => {
    // Create prerequisite donor
    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    
    const donor = donorResult[0];
    const input = { 
      ...goodsDonationInput, 
      donor_id: donor.id,
      item_quantity: 0 
    };

    await expect(() => createDonation(input))
      .toThrow(/item quantity must be positive for goods donations/i);
  });
});
