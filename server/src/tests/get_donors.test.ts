
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { donorsTable, usersTable } from '../db/schema';
import { type CreateDonorInput, type CreateUserInput } from '../schema';
import { getDonors } from '../handlers/get_donors';

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
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: '123 Main St',
          user_id: null,
        },
        {
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '098-765-4321',
          address: '456 Oak Ave',
          user_id: null,
        }
      ])
      .execute();

    const result = await getDonors();

    expect(result).toHaveLength(2);
    expect(result[0].full_name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].phone).toEqual('123-456-7890');
    expect(result[0].address).toEqual('123 Main St');
    expect(result[0].user_id).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].full_name).toEqual('Jane Smith');
    expect(result[1].email).toEqual('jane@example.com');
    expect(result[1].phone).toEqual('098-765-4321');
    expect(result[1].address).toEqual('456 Oak Ave');
    expect(result[1].user_id).toBeNull();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return donors with associated user information', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        phone: '555-0123',
        role: 'donatur',
        is_active: true,
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create donor linked to user
    await db.insert(donorsTable)
      .values({
        full_name: 'Test Donor',
        email: 'donor@example.com',
        phone: '555-0456',
        address: '789 Pine St',
        user_id: userId,
      })
      .execute();

    const result = await getDonors();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Test Donor');
    expect(result[0].email).toEqual('donor@example.com');
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle donors with nullable fields', async () => {
    await db.insert(donorsTable)
      .values({
        full_name: 'Minimal Donor',
        email: null,
        phone: null,
        address: null,
        user_id: null,
      })
      .execute();

    const result = await getDonors();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Minimal Donor');
    expect(result[0].email).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].user_id).toBeNull();
    expect(result[0].updated_at).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
