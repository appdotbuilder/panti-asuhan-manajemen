
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { donorsTable, usersTable } from '../db/schema';
import { type CreateDonorInput, type CreateUserInput } from '../schema';
import { getDonors } from '../handlers/get_donors';

// Test user input for creating donors with user references
const testUserInput: CreateUserInput = {
  username: 'testdonor',
  email: 'donor@test.com',
  password: 'password123',
  full_name: 'Test Donor User',
  phone: '+1234567890',
  role: 'donatur'
};

// Test donor inputs
const testDonorInput: CreateDonorInput = {
  full_name: 'John Donor',
  email: 'john@donor.com',
  phone: '+1234567890',
  address: '123 Donor Street',
  user_id: null
};

const testDonorWithUserInput: CreateDonorInput = {
  full_name: 'Jane User Donor',
  email: 'jane@userdonor.com',
  phone: '+0987654321',
  address: '456 User Avenue',
  user_id: 1 // Will be set after user creation
};

describe('getDonors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no donors exist', async () => {
    const result = await getDonors();
    expect(result).toEqual([]);
  });

  it('should return all donors', async () => {
    // Create test donors
    await db.insert(donorsTable)
      .values([
        {
          full_name: testDonorInput.full_name,
          email: testDonorInput.email,
          phone: testDonorInput.phone,
          address: testDonorInput.address,
          user_id: testDonorInput.user_id
        },
        {
          full_name: 'Second Donor',
          email: 'second@donor.com',
          phone: '+1111111111',
          address: '789 Second Street',
          user_id: null
        }
      ])
      .execute();

    const result = await getDonors();

    expect(result).toHaveLength(2);
    
    // Check first donor
    expect(result[0].full_name).toEqual('John Donor');
    expect(result[0].email).toEqual('john@donor.com');
    expect(result[0].phone).toEqual('+1234567890');
    expect(result[0].address).toEqual('123 Donor Street');
    expect(result[0].user_id).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second donor
    expect(result[1].full_name).toEqual('Second Donor');
    expect(result[1].email).toEqual('second@donor.com');
    expect(result[1].phone).toEqual('+1111111111');
    expect(result[1].address).toEqual('789 Second Street');
    expect(result[1].user_id).toBeNull();
  });

  it('should return donors with user_id when linked to users', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
        password_hash: 'hashed_' + testUserInput.password,
        full_name: testUserInput.full_name,
        phone: testUserInput.phone,
        role: testUserInput.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create donor linked to user
    await db.insert(donorsTable)
      .values({
        full_name: testDonorWithUserInput.full_name,
        email: testDonorWithUserInput.email,
        phone: testDonorWithUserInput.phone,
        address: testDonorWithUserInput.address,
        user_id: userId
      })
      .execute();

    const result = await getDonors();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Jane User Donor');
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].email).toEqual('jane@userdonor.com');
    expect(result[0].phone).toEqual('+0987654321');
    expect(result[0].address).toEqual('456 User Avenue');
  });

  it('should handle donors with null values correctly', async () => {
    // Create donor with minimal information
    await db.insert(donorsTable)
      .values({
        full_name: 'Minimal Donor',
        email: null,
        phone: null,
        address: null,
        user_id: null
      })
      .execute();

    const result = await getDonors();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Minimal Donor');
    expect(result[0].email).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].user_id).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeNull();
  });
});
