
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { donorsTable, usersTable } from '../db/schema';
import { type CreateDonorInput } from '../schema';
import { createDonor } from '../handlers/create_donor';
import { eq } from 'drizzle-orm';

const testUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password',
  full_name: 'Test User',
  phone: '081234567890',
  role: 'admin' as const,
  is_active: true,
};

const testDonorInput: CreateDonorInput = {
  full_name: 'Test Donor',
  email: 'donor@example.com',
  phone: '087654321098',
  address: 'Jakarta, Indonesia',
  user_id: null,
};

describe('createDonor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a donor without user_id', async () => {
    const result = await createDonor(testDonorInput);

    expect(result.full_name).toEqual('Test Donor');
    expect(result.email).toEqual('donor@example.com');
    expect(result.phone).toEqual('087654321098');
    expect(result.address).toEqual('Jakarta, Indonesia');
    expect(result.user_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
  });

  it('should create a donor with valid user_id', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    const user = userResult[0];
    const donorInputWithUser: CreateDonorInput = {
      ...testDonorInput,
      user_id: user.id,
    };

    const result = await createDonor(donorInputWithUser);

    expect(result.full_name).toEqual('Test Donor');
    expect(result.user_id).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save donor to database', async () => {
    const result = await createDonor(testDonorInput);

    const donors = await db.select()
      .from(donorsTable)
      .where(eq(donorsTable.id, result.id))
      .execute();

    expect(donors).toHaveLength(1);
    expect(donors[0].full_name).toEqual('Test Donor');
    expect(donors[0].email).toEqual('donor@example.com');
    expect(donors[0].phone).toEqual('087654321098');
    expect(donors[0].address).toEqual('Jakarta, Indonesia');
    expect(donors[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user_id does not exist', async () => {
    const donorInputWithInvalidUser: CreateDonorInput = {
      ...testDonorInput,
      user_id: 99999, // Non-existent user ID
    };

    expect(createDonor(donorInputWithInvalidUser)).rejects.toThrow(/User with id 99999 does not exist/i);
  });

  it('should create donor with minimal required fields', async () => {
    const minimalInput: CreateDonorInput = {
      full_name: 'Minimal Donor',
      email: null,
      phone: null,
      address: null,
      user_id: null,
    };

    const result = await createDonor(minimalInput);

    expect(result.full_name).toEqual('Minimal Donor');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.user_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
