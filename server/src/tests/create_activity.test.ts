
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable, usersTable } from '../db/schema';
import { type CreateActivityInput } from '../schema';
import { createActivity } from '../handlers/create_activity';
import { eq } from 'drizzle-orm';

describe('createActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first (required for foreign key constraint)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;
  });

  const baseTestInput: CreateActivityInput = {
    title: 'Test Activity',
    description: 'A test activity for children',
    type: 'harian',
    scheduled_date: new Date('2024-01-15T10:00:00Z'),
    end_date: new Date('2024-01-15T12:00:00Z'),
    location: 'Test Location',
    participants: 'Group A children',
    photos: 'photo1.jpg,photo2.jpg',
    created_by: 0 // Will be set in tests
  };

  it('should create an activity', async () => {
    const testInput = { ...baseTestInput, created_by: testUserId };
    
    const result = await createActivity(testInput);

    expect(result.title).toEqual('Test Activity');
    expect(result.description).toEqual('A test activity for children');
    expect(result.type).toEqual('harian');
    expect(result.scheduled_date).toEqual(testInput.scheduled_date);
    expect(result.end_date).toEqual(testInput.end_date);
    expect(result.location).toEqual('Test Location');
    expect(result.participants).toEqual('Group A children');
    expect(result.photos).toEqual('photo1.jpg,photo2.jpg');
    expect(result.status).toEqual('planned');
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
  });

  it('should save activity to database', async () => {
    const testInput = { ...baseTestInput, created_by: testUserId };
    
    const result = await createActivity(testInput);

    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].title).toEqual('Test Activity');
    expect(activities[0].description).toEqual('A test activity for children');
    expect(activities[0].type).toEqual('harian');
    expect(activities[0].scheduled_date).toEqual(testInput.scheduled_date);
    expect(activities[0].end_date).toEqual(testInput.end_date);
    expect(activities[0].location).toEqual('Test Location');
    expect(activities[0].participants).toEqual('Group A children');
    expect(activities[0].photos).toEqual('photo1.jpg,photo2.jpg');
    expect(activities[0].status).toEqual('planned');
    expect(activities[0].created_by).toEqual(testUserId);
    expect(activities[0].created_at).toBeInstanceOf(Date);
  });

  it('should create activity with minimal data', async () => {
    const minimalInput: CreateActivityInput = {
      title: 'Minimal Activity',
      description: null,
      type: 'khusus',
      scheduled_date: new Date('2024-02-01T14:00:00Z'),
      end_date: null,
      location: null,
      participants: null,
      photos: null,
      created_by: testUserId
    };

    const result = await createActivity(minimalInput);

    expect(result.title).toEqual('Minimal Activity');
    expect(result.description).toBeNull();
    expect(result.type).toEqual('khusus');
    expect(result.scheduled_date).toEqual(minimalInput.scheduled_date);
    expect(result.end_date).toBeNull();
    expect(result.location).toBeNull();
    expect(result.participants).toBeNull();
    expect(result.photos).toBeNull();
    expect(result.status).toEqual('planned');
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
  });

  it('should handle different activity types', async () => {
    const weeklyInput = { ...baseTestInput, type: 'mingguan' as const, created_by: testUserId };
    
    const result = await createActivity(weeklyInput);

    expect(result.type).toEqual('mingguan');
    expect(result.status).toEqual('planned');
  });
});
