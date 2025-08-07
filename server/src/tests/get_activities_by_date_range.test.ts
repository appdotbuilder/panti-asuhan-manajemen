
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable } from '../db/schema';
import { type CreateUserInput, type CreateActivityInput, type GetActivitiesByDateRangeInput } from '../schema';
import { getActivitiesByDateRange } from '../handlers/get_activities_by_date_range';

// Test user for foreign key requirement
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  phone: '+1234567890',
  role: 'admin'
};

// Test activities data
const testActivity1: CreateActivityInput = {
  title: 'Morning Exercise',
  description: 'Daily morning exercise for children',
  type: 'harian',
  scheduled_date: new Date('2024-01-15T08:00:00Z'),
  end_date: new Date('2024-01-15T09:00:00Z'),
  location: 'Main Hall',
  participants: 'All children',
  photos: null,
  created_by: 1 // Will be set after user creation
};

const testActivity2: CreateActivityInput = {
  title: 'Weekly Meeting',
  description: 'Staff weekly meeting',
  type: 'mingguan',
  scheduled_date: new Date('2024-01-20T10:00:00Z'),
  end_date: new Date('2024-01-20T11:00:00Z'),
  location: 'Office',
  participants: 'Staff members',
  photos: null,
  created_by: 1 // Will be set after user creation
};

const testActivity3: CreateActivityInput = {
  title: 'Special Event',
  description: 'Birthday celebration',
  type: 'khusus',
  scheduled_date: new Date('2024-02-01T14:00:00Z'),
  end_date: new Date('2024-02-01T16:00:00Z'),
  location: 'Garden',
  participants: 'Birthday child and friends',
  photos: null,
  created_by: 1 // Will be set after user creation
};

describe('getActivitiesByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get activities within date range', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        phone: testUser.phone,
        role: testUser.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test activities
    await db.insert(activitiesTable)
      .values([
        { ...testActivity1, created_by: userId },
        { ...testActivity2, created_by: userId },
        { ...testActivity3, created_by: userId }
      ])
      .execute();

    // Test date range that includes first two activities
    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getActivitiesByDateRange(input);

    expect(result).toHaveLength(2);
    
    const titles = result.map(activity => activity.title).sort();
    expect(titles).toEqual(['Morning Exercise', 'Weekly Meeting']);

    // Verify activity properties
    const morningExercise = result.find(a => a.title === 'Morning Exercise');
    expect(morningExercise).toBeDefined();
    expect(morningExercise!.type).toEqual('harian');
    expect(morningExercise!.location).toEqual('Main Hall');
    expect(morningExercise!.scheduled_date).toBeInstanceOf(Date);
    expect(morningExercise!.created_by).toEqual(userId);
  });

  it('should filter activities by type', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        phone: testUser.phone,
        role: testUser.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test activities
    await db.insert(activitiesTable)
      .values([
        { ...testActivity1, created_by: userId },
        { ...testActivity2, created_by: userId },
        { ...testActivity3, created_by: userId }
      ])
      .execute();

    // Test filtering by type
    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      type: 'mingguan'
    };

    const result = await getActivitiesByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Weekly Meeting');
    expect(result[0].type).toEqual('mingguan');
  });

  it('should return empty array when no activities in date range', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        phone: testUser.phone,
        role: testUser.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test activities
    await db.insert(activitiesTable)
      .values([
        { ...testActivity1, created_by: userId }
      ])
      .execute();

    // Test date range that excludes all activities
    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-03-31')
    };

    const result = await getActivitiesByDateRange(input);

    expect(result).toHaveLength(0);
  });

  it('should handle activities at date range boundaries', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        phone: testUser.phone,
        role: testUser.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create activity exactly at start date
    const boundaryActivity: CreateActivityInput = {
      title: 'Boundary Activity',
      description: 'Activity at boundary',
      type: 'khusus',
      scheduled_date: new Date('2024-01-15T00:00:00Z'),
      end_date: null,
      location: null,
      participants: null,
      photos: null,
      created_by: userId
    };

    await db.insert(activitiesTable)
      .values([boundaryActivity])
      .execute();

    // Test date range starting exactly at activity date
    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const result = await getActivitiesByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Boundary Activity');
  });
});
