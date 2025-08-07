
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  phone: '+628123456789',
  role: 'donatur',
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.phone).toEqual('+628123456789');
    expect(result.role).toEqual('donatur');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();

    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(10);

    // Verify password hash is valid using Bun's password verification
    const isValidHash = await Bun.password.verify('password123', result.password_hash);
    expect(isValidHash).toBe(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].full_name).toEqual('Test User');
    expect(users[0].role).toEqual('donatur');
    expect(users[0].is_active).toBe(true);
    expect(users[0].created_at).toBeInstanceOf(Date);

    // Verify stored password is hashed correctly
    const isValidHash = await Bun.password.verify('password123', users[0].password_hash);
    expect(isValidHash).toBe(true);
  });

  it('should create user with null phone', async () => {
    const inputWithoutPhone: CreateUserInput = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password123',
      full_name: 'Test User 2',
      phone: null,
      role: 'pengurus',
    };

    const result = await createUser(inputWithoutPhone);

    expect(result.phone).toBeNull();
    expect(result.role).toEqual('pengurus');
  });

  it('should handle different user roles', async () => {
    const adminInput: CreateUserInput = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'adminpass123',
      full_name: 'Admin User',
      phone: '+628987654321',
      role: 'admin',
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('admin');
    expect(result.username).toEqual('admin');
  });

  it('should reject duplicate usernames', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with the same username
    const duplicateInput: CreateUserInput = {
      ...testInput,
      email: 'different@example.com',
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate|unique/i);
  });

  it('should reject duplicate emails', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with the same email
    const duplicateInput: CreateUserInput = {
      ...testInput,
      username: 'differentuser',
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate|unique/i);
  });
});
