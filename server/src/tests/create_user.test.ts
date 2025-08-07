
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// Test input with all required fields
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  phone: '081234567890',
  role: 'donatur'
};

// Helper function to verify password
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [hash, salt] = hashedPassword.split(':');
  const verifyHash = createHash('sha256').update(password + salt).digest('hex');
  return hash === verifyHash;
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
    expect(result.phone).toEqual('081234567890');
    expect(result.role).toEqual('donatur');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();

    // Password should be hashed, not plain text
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash).toContain(':'); // Contains salt separator
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].full_name).toEqual('Test User');
    expect(users[0].phone).toEqual('081234567890');
    expect(users[0].role).toEqual('donatur');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash password correctly', async () => {
    const result = await createUser(testInput);

    // Verify password was hashed and can be verified
    const isValidPassword = verifyPassword('password123', result.password_hash);
    expect(isValidPassword).toBe(true);

    // Verify wrong password fails
    const isInvalidPassword = verifyPassword('wrongpassword', result.password_hash);
    expect(isInvalidPassword).toBe(false);
  });

  it('should create user with null phone', async () => {
    const inputWithNullPhone: CreateUserInput = {
      ...testInput,
      phone: null
    };

    const result = await createUser(inputWithNullPhone);

    expect(result.phone).toBeNull();
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
  });

  it('should create users with different roles', async () => {
    const adminInput: CreateUserInput = {
      ...testInput,
      username: 'admin_user',
      email: 'admin@example.com',
      role: 'admin'
    };

    const pengurusInput: CreateUserInput = {
      ...testInput,
      username: 'pengurus_user',
      email: 'pengurus@example.com',
      role: 'pengurus'
    };

    const adminResult = await createUser(adminInput);
    const pengurusResult = await createUser(pengurusInput);

    expect(adminResult.role).toEqual('admin');
    expect(pengurusResult.role).toEqual('pengurus');
  });

  it('should generate unique password hashes for same password', async () => {
    const input1: CreateUserInput = {
      ...testInput,
      username: 'user1',
      email: 'user1@example.com'
    };

    const input2: CreateUserInput = {
      ...testInput,
      username: 'user2',
      email: 'user2@example.com'
    };

    const result1 = await createUser(input1);
    const result2 = await createUser(input2);

    // Same password should produce different hashes due to different salts
    expect(result1.password_hash).not.toEqual(result2.password_hash);
    
    // But both should verify correctly
    expect(verifyPassword('password123', result1.password_hash)).toBe(true);
    expect(verifyPassword('password123', result2.password_hash)).toBe(true);
  });
});
