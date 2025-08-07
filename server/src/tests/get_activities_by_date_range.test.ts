
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable } from '../db/schema';
import { type GetActivitiesByDateRangeInput, type CreateUserInput } from '../schema';
import { getActivitiesByDateRange } from '../handlers/get_activities_by_date_range';

// Test user for creating activities
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  phone: '081234567890',
  role: 'admin'
};

describe('getActivitiesByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return activities within date range', async () => {
    // Create test user first
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

    // Create test activities with different dates
    const baseDate = new Date('2024-01-15T10:00:00Z');
    const withinRangeDate = new Date('2024-01-20T14:00:00Z');
    const outsideRangeDate = new Date('2024-02-01T16:00:00Z');

    await db.insert(activitiesTable)
      .values([
        {
          title: 'Activity 1',
          description: 'First activity',
          type: 'harian',
          scheduled_date: baseDate,
          location: 'Location 1',
          created_by: userId
        },
        {
          title: 'Activity 2',
          description: 'Second activity',
          type: 'mingguan',
          scheduled_date: withinRangeDate,
          location: 'Location 2',
          created_by: userId
        },
        {
          title: 'Activity 3',
          description: 'Third activity',
          type: 'bulanan',
          scheduled_date: outsideRangeDate,
          location: 'Location 3',
          created_by: userId
        }
      ])
      .execute();

    // Query activities within range
    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getActivitiesByDateRange(input);

    // Should return 2 activities within the date range
    expect(results).toHaveLength(2);
    
    // Verify the returned activities
    expect(results[0].title).toEqual('Activity 1');
    expect(results[0].scheduled_date).toBeInstanceOf(Date);
    expect(results[0].scheduled_date.getTime()).toEqual(baseDate.getTime());
    
    expect(results[1].title).toEqual('Activity 2');
    expect(results[1].scheduled_date).toBeInstanceOf(Date);
    expect(results[1].scheduled_date.getTime()).toEqual(withinRangeDate.getTime());

    // Verify activities are ordered by scheduled_date
    expect(results[0].scheduled_date <= results[1].scheduled_date).toBe(true);
  });

  it('should filter activities by type when specified', async () => {
    // Create test user
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

    // Create activities with different types
    const testDate = new Date('2024-01-15T10:00:00Z');

    await db.insert(activitiesTable)
      .values([
        {
          title: 'Daily Activity',
          type: 'harian',
          scheduled_date: testDate,
          created_by: userId
        },
        {
          title: 'Weekly Activity',
          type: 'mingguan',
          scheduled_date: testDate,
          created_by: userId
        },
        {
          title: 'Monthly Activity',
          type: 'bulanan',
          scheduled_date: testDate,
          created_by: userId
        }
      ])
      .execute();

    // Query with type filter
    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      type: 'harian'
    };

    const results = await getActivitiesByDateRange(input);

    // Should return only 1 activity with type 'harian'
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Daily Activity');
    expect(results[0].type).toEqual('harian');
    expect(results[0].scheduled_date).toBeInstanceOf(Date);
  });

  it('should return empty array when no activities in date range', async () => {
    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getActivitiesByDateRange(input);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle end_date and updated_at null values correctly', async () => {
    // Create test user
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

    // Create activity without end_date (should be null)
    await db.insert(activitiesTable)
      .values({
        title: 'Activity without end date',
        type: 'khusus',
        scheduled_date: new Date('2024-01-15T10:00:00Z'),
        created_by: userId
      })
      .execute();

    const input: GetActivitiesByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getActivitiesByDateRange(input);

    expect(results).toHaveLength(1);
    expect(results[0].end_date).toBeNull();
    expect(results[0].updated_at).toBeNull();
    expect(results[0].created_at).toBeInstanceOf(Date);
  });
});
