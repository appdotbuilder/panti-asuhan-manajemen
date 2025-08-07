
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { donorsTable, donationsTable } from '../db/schema';
import { type GetDonationsByDateRangeInput, type CreateDonorInput } from '../schema';
import { getDonationsByDateRange } from '../handlers/get_donations_by_date_range';

// Test data
const testDonor: CreateDonorInput = {
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '08123456789',
  address: 'Jakarta',
  user_id: null,
};

const testDonor2: CreateDonorInput = {
  full_name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '08198765432',
  address: 'Bandung',
  user_id: null,
};

describe('getDonationsByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get donations within date range', async () => {
    // Create test donors
    const [donor1, donor2] = await db.insert(donorsTable)
      .values([testDonor, testDonor2])
      .returning()
      .execute();

    // Create test donations with different dates (using string format for date columns)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    await db.insert(donationsTable).values([
      {
        donor_id: donor1.id,
        type: 'uang',
        amount: '100000.00',
        donation_date: today.toISOString().split('T')[0], // Convert Date to string
        notes: 'First donation',
      },
      {
        donor_id: donor2.id,
        type: 'barang',
        item_description: 'Rice',
        item_quantity: 10,
        donation_date: tomorrow.toISOString().split('T')[0], // Convert Date to string
        notes: 'Second donation',
      },
      {
        donor_id: donor1.id,
        type: 'uang',
        amount: '50000.00',
        donation_date: dayAfter.toISOString().split('T')[0], // Convert Date to string
        notes: 'Third donation - outside range',
      }
    ]).execute();

    // Test: Get donations for today and tomorrow only
    const input: GetDonationsByDateRangeInput = {
      start_date: today,
      end_date: tomorrow,
    };

    const result = await getDonationsByDateRange(input);

    // Should return 2 donations within the date range
    expect(result).toHaveLength(2);

    // Verify first donation
    const firstDonation = result.find(d => d.notes === 'First donation');
    expect(firstDonation).toBeDefined();
    expect(firstDonation!.donor_id).toEqual(donor1.id);
    expect(firstDonation!.type).toEqual('uang');
    expect(firstDonation!.amount).toEqual(100000);
    expect(typeof firstDonation!.amount).toEqual('number');
    expect(firstDonation!.donation_date).toBeInstanceOf(Date);
    expect(firstDonation!.donation_date.toISOString().split('T')[0]).toEqual(today.toISOString().split('T')[0]);

    // Verify second donation
    const secondDonation = result.find(d => d.notes === 'Second donation');
    expect(secondDonation).toBeDefined();
    expect(secondDonation!.donor_id).toEqual(donor2.id);
    expect(secondDonation!.type).toEqual('barang');
    expect(secondDonation!.item_description).toEqual('Rice');
    expect(secondDonation!.item_quantity).toEqual(10);
    expect(secondDonation!.amount).toBeNull();
    expect(secondDonation!.donation_date).toBeInstanceOf(Date);
    expect(secondDonation!.donation_date.toISOString().split('T')[0]).toEqual(tomorrow.toISOString().split('T')[0]);

    // Third donation should not be included (outside date range)
    const thirdDonation = result.find(d => d.notes === 'Third donation - outside range');
    expect(thirdDonation).toBeUndefined();
  });

  it('should filter donations by specific donor', async () => {
    // Create test donors
    const [donor1, donor2] = await db.insert(donorsTable)
      .values([testDonor, testDonor2])
      .returning()
      .execute();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create donations from both donors
    await db.insert(donationsTable).values([
      {
        donor_id: donor1.id,
        type: 'uang',
        amount: '100000.00',
        donation_date: todayStr,
        notes: 'Donor 1 donation',
      },
      {
        donor_id: donor2.id,
        type: 'uang',
        amount: '200000.00',
        donation_date: todayStr,
        notes: 'Donor 2 donation',
      }
    ]).execute();

    // Test: Get donations from donor1 only
    const input: GetDonationsByDateRangeInput = {
      start_date: today,
      end_date: today,
      donor_id: donor1.id,
    };

    const result = await getDonationsByDateRange(input);

    // Should return only 1 donation from donor1
    expect(result).toHaveLength(1);
    expect(result[0].donor_id).toEqual(donor1.id);
    expect(result[0].notes).toEqual('Donor 1 donation');
    expect(result[0].amount).toEqual(100000);
  });

  it('should return empty array when no donations found', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const input: GetDonationsByDateRangeInput = {
      start_date: today,
      end_date: tomorrow,
    };

    const result = await getDonationsByDateRange(input);

    expect(result).toHaveLength(0);
  });

  it('should handle single-day date range', async () => {
    // Create test donor
    const [donor] = await db.insert(donorsTable)
      .values([testDonor])
      .returning()
      .execute();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Create donations on different days
    await db.insert(donationsTable).values([
      {
        donor_id: donor.id,
        type: 'uang',
        amount: '100000.00',
        donation_date: yesterdayStr,
        notes: 'Yesterday donation',
      },
      {
        donor_id: donor.id,
        type: 'uang',
        amount: '200000.00',
        donation_date: todayStr,
        notes: 'Today donation',
      }
    ]).execute();

    // Test: Get donations for today only
    const input: GetDonationsByDateRangeInput = {
      start_date: today,
      end_date: today,
    };

    const result = await getDonationsByDateRange(input);

    // Should return only today's donation
    expect(result).toHaveLength(1);
    expect(result[0].notes).toEqual('Today donation');
    expect(result[0].donation_date.toISOString().split('T')[0]).toEqual(todayStr);
  });

  it('should verify donation data types', async () => {
    // Create test donor
    const [donor] = await db.insert(donorsTable)
      .values([{
        full_name: 'Test Donor',
        email: 'test@donor.com',
        phone: '08111222333',
        address: 'Test Address',
        user_id: null,
      }])
      .returning()
      .execute();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create donation
    await db.insert(donationsTable).values([{
      donor_id: donor.id,
      type: 'uang',
      amount: '500000.00',
      donation_date: todayStr,
      notes: 'Test donation',
    }]).execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: today,
      end_date: today,
    };

    const result = await getDonationsByDateRange(input);

    expect(result).toHaveLength(1);
    
    const donation = result[0];
    expect(donation.donor_id).toEqual(donor.id);
    expect(typeof donation.amount).toEqual('number');
    expect(donation.amount).toEqual(500000);
    expect(donation.donation_date).toBeInstanceOf(Date);
    expect(donation.created_at).toBeInstanceOf(Date);
    expect(donation.type).toEqual('uang');
    expect(donation.notes).toEqual('Test donation');
  });

  it('should handle null amount for item donations', async () => {
    // Create test donor
    const [donor] = await db.insert(donorsTable)
      .values([testDonor])
      .returning()
      .execute();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create item donation without amount
    await db.insert(donationsTable).values([{
      donor_id: donor.id,
      type: 'barang',
      item_description: 'Books',
      item_quantity: 20,
      donation_date: todayStr,
      notes: 'Book donation',
    }]).execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: today,
      end_date: today,
    };

    const result = await getDonationsByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toEqual('barang');
    expect(result[0].amount).toBeNull();
    expect(result[0].item_description).toEqual('Books');
    expect(result[0].item_quantity).toEqual(20);
  });

  it('should handle edge case with no donor_id filter', async () => {
    // Create test donor
    const [donor] = await db.insert(donorsTable)
      .values([testDonor])
      .returning()
      .execute();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create donation
    await db.insert(donationsTable).values([{
      donor_id: donor.id,
      type: 'uang',
      amount: '300000.00',
      donation_date: todayStr,
      notes: 'No filter test',
    }]).execute();

    const input: GetDonationsByDateRangeInput = {
      start_date: today,
      end_date: today,
      // donor_id is undefined - should include all donors
    };

    const result = await getDonationsByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].donor_id).toEqual(donor.id);
    expect(result[0].amount).toEqual(300000);
    expect(result[0].notes).toEqual('No filter test');
  });
});
