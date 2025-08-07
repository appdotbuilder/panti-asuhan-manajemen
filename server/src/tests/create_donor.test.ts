
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { donorsTable, usersTable } from '../db/schema';
import { type CreateDonorInput } from '../schema';
import { createDonor } from '../handlers/create_donor';
import { eq } from 'drizzle-orm';

// Test input without user_id
const testInput: CreateDonorInput = {
  full_name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '08123456789',
  address: 'Jl. Merdeka No. 123',
  user_id: null,
};

describe('createDonor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a donor without user_id', async () => {
    const result = await createDonor(testInput);

    expect(result.full_name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('08123456789');
    expect(result.address).toEqual('Jl. Merdeka No. 123');
    expect(result.user_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
  });

  it('should save donor to database', async () => {
    const result = await createDonor(testInput);

    const donors = await db.select()
      .from(donorsTable)
      .where(eq(donorsTable.id, result.id))
      .execute();

    expect(donors).toHaveLength(1);
    expect(donors[0].full_name).toEqual('John Doe');
    expect(donors[0].email).toEqual('john.doe@example.com');
    expect(donors[0].phone).toEqual('08123456789');
    expect(donors[0].address).toEqual('Jl. Merdeka No. 123');
    expect(donors[0].user_id).toBeNull();
    expect(donors[0].created_at).toBeInstanceOf(Date);
  });

  it('should create a donor with valid user_id', async () => {
    // First create a user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        phone: '08111111111',
        role: 'donatur',
      })
      .returning()
      .execute();

    const inputWithUserId: CreateDonorInput = {
      ...testInput,
      user_id: user[0].id,
    };

    const result = await createDonor(inputWithUserId);

    expect(result.full_name).toEqual('John Doe');
    expect(result.user_id).toEqual(user[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user_id does not exist', async () => {
    const inputWithInvalidUserId: CreateDonorInput = {
      ...testInput,
      user_id: 99999, // Non-existent user ID
    };

    await expect(createDonor(inputWithInvalidUserId))
      .rejects
      .toThrow(/User with id 99999 not found/i);
  });

  it('should create donor with minimal fields', async () => {
    const minimalInput: CreateDonorInput = {
      full_name: 'Jane Smith',
      email: null,
      phone: null,
      address: null,
      user_id: null,
    };

    const result = await createDonor(minimalInput);

    expect(result.full_name).toEqual('Jane Smith');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.user_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
