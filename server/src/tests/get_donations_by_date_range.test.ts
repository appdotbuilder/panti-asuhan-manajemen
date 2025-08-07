
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { donorsTable, donationsTable } from '../db/schema';
import { type GetDonationsByDateRangeInput, type CreateDonorInput, type CreateDonationInput } from '../schema';
import { getDonationsByDateRange } from '../handlers/get_donations_by_date_range';

describe('getDonationsByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return donations within date range', async () => {
    // Create test donor first
    const testDonor: CreateDonorInput = {
      full_name: 'Test Donor',
      email: 'donor@test.com',
      phone: '081234567890',
      address: 'Test Address',
      user_id: null,
    };

    const donorResult = await db.insert(donorsTable)
      .values(testDonor)
      .returning()
      .execute();
    const donor = donorResult[0];

    // Create test donations with different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const testDonations: CreateDonationInput[] = [
      {
        donor_id: donor.id,
        type: 'uang',
        amount: 100000,
        item_description: null,
        item_quantity: null,
        donation_date: yesterday,
        notes: 'Yesterday donation',
      },
      {
        donor_id: donor.id,
        type: 'uang',
        amount: 200000,
        item_description: null,
        item_quantity: null,
        donation_date: today,
        notes: 'Today donation',
      },
      {
        donor_id: donor.id,
        type: 'barang',
        amount: null,
        item_description: 'Test Item',
        item_quantity: 5,
        donation_date: tomorrow,
        notes: 'Tomorrow donation',
      },
    ];

    // Insert donations with proper date and numeric conversion
    for (const donation of testDonations) {
      await db.insert(donationsTable)
        .values({
          ...donation,
          amount: donation.amount?.toString() || null,
          donation_date: donation.donation_date.toISOString().split('T')[0], // Convert Date to string
        })
        .execute();
    }

    // Test date range query
    const input: GetDonationsByDateRangeInput = {
      start_date: yesterday,
      end_date: tomorrow,
    };

    const results = await getDonationsByDateRange(input);

    // Should return all three donations
    expect(results).toHaveLength(3);
    
    // Verify numeric conversion
    const moneyDonations = results.filter(d => d.type === 'uang');
    expect(moneyDonations).toHaveLength(2);
    moneyDonations.forEach(donation => {
      expect(typeof donation.amount).toBe('number');
      expect(donation.amount).toBeGreaterThan(0);
    });

    // Verify item donation
    const itemDonation = results.find(d => d.type === 'barang');
    expect(itemDonation).toBeDefined();
    expect(itemDonation?.amount).toBeNull();
    expect(itemDonation?.item_description).toBe('Test Item');
    expect(itemDonation?.item_quantity).toBe(5);

    // Verify dates are returned as Date objects
    results.forEach(donation => {
      expect(donation.donation_date).toBeInstanceOf(Date);
    });
  });

  it('should filter donations by donor_id when provided', async () => {
    // Create two test donors
    const donor1Result = await db.insert(donorsTable)
      .values({
        full_name: 'Donor One',
        email: 'donor1@test.com',
        phone: null,
        address: null,
        user_id: null,
      })
      .returning()
      .execute();
    
    const donor2Result = await db.insert(donorsTable)
      .values({
        full_name: 'Donor Two',
        email: 'donor2@test.com',
        phone: null,
        address: null,
        user_id: null,
      })
      .returning()
      .execute();

    const donor1 = donor1Result[0];
    const donor2 = donor2Result[0];

    const today = new Date();

    // Create donations for both donors
    await db.insert(donationsTable)
      .values({
        donor_id: donor1.id,
        type: 'uang',
        amount: '100000',
        item_description: null,
        item_quantity: null,
        donation_date: today.toISOString().split('T')[0],
        notes: 'Donor 1 donation',
      })
      .execute();

    await db.insert(donationsTable)
      .values({
        donor_id: donor2.id,
        type: 'uang',
        amount: '200000',
        item_description: null,
        item_quantity: null,
        donation_date: today.toISOString().split('T')[0],
        notes: 'Donor 2 donation',
      })
      .execute();

    // Query with donor filter
    const input: GetDonationsByDateRangeInput = {
      start_date: today,
      end_date: today,
      donor_id: donor1.id,
    };

    const results = await getDonationsByDateRange(input);

    // Should only return donations from donor1
    expect(results).toHaveLength(1);
    expect(results[0].donor_id).toBe(donor1.id);
    expect(results[0].notes).toBe('Donor 1 donation');
    expect(typeof results[0].amount).toBe('number');
    expect(results[0].amount).toBe(100000);
    expect(results[0].donation_date).toBeInstanceOf(Date);
  });

  it('should return empty array when no donations match criteria', async () => {
    // Create test donor
    const donorResult = await db.insert(donorsTable)
      .values({
        full_name: 'Test Donor',
        email: 'donor@test.com',
        phone: null,
        address: null,
        user_id: null,
      })
      .returning()
      .execute();

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 10);

    // Query for dates with no donations
    const input: GetDonationsByDateRangeInput = {
      start_date: futureDate,
      end_date: futureDate,
    };

    const results = await getDonationsByDateRange(input);
    expect(results).toHaveLength(0);
  });

  it('should handle date range boundaries correctly', async () => {
    // Create test donor
    const donorResult = await db.insert(donorsTable)
      .values({
        full_name: 'Test Donor',
        email: 'donor@test.com',
        phone: null,
        address: null,
        user_id: null,
      })
      .returning()
      .execute();
    const donor = donorResult[0];

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const beforeRange = new Date('2023-12-31');
    const afterRange = new Date('2024-02-01');

    // Create donations: one before range, two within range, one after range
    const donations = [
      { date: beforeRange, amount: '50000', notes: 'Before range' },
      { date: startDate, amount: '100000', notes: 'Start date' },
      { date: endDate, amount: '150000', notes: 'End date' },
      { date: afterRange, amount: '200000', notes: 'After range' },
    ];

    for (const donation of donations) {
      await db.insert(donationsTable)
        .values({
          donor_id: donor.id,
          type: 'uang',
          amount: donation.amount,
          item_description: null,
          item_quantity: null,
          donation_date: donation.date.toISOString().split('T')[0],
          notes: donation.notes,
        })
        .execute();
    }

    const input: GetDonationsByDateRangeInput = {
      start_date: startDate,
      end_date: endDate,
    };

    const results = await getDonationsByDateRange(input);

    // Should return only donations within range (inclusive boundaries)
    expect(results).toHaveLength(2);
    const notes = results.map(r => r.notes);
    expect(notes).toContain('Start date');
    expect(notes).toContain('End date');
    expect(notes).not.toContain('Before range');
    expect(notes).not.toContain('After range');

    // Verify dates are properly converted
    results.forEach(donation => {
      expect(donation.donation_date).toBeInstanceOf(Date);
    });
  });
});
