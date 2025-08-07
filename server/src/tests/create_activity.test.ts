
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable, usersTable } from '../db/schema';
import { type CreateActivityInput } from '../schema';
import { createActivity } from '../handlers/create_activity';
import { eq } from 'drizzle-orm';

describe('createActivity', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first (required for created_by foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'admin',
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateActivityInput = {
    title: 'Kegiatan Belajar Mengajar',
    description: 'Kegiatan rutin belajar mengajar anak-anak',
    type: 'harian',
    scheduled_date: new Date('2024-01-15T09:00:00Z'),
    end_date: new Date('2024-01-15T11:00:00Z'),
    location: 'Ruang Kelas A',
    participants: 'Anak-anak dan guru',
    photos: null,
    created_by: 0, // Will be set in tests
  };

  it('should create an activity', async () => {
    const input = { ...testInput, created_by: testUserId };
    const result = await createActivity(input);

    // Basic field validation
    expect(result.title).toEqual('Kegiatan Belajar Mengajar');
    expect(result.description).toEqual(input.description);
    expect(result.type).toEqual('harian');
    expect(result.scheduled_date).toEqual(input.scheduled_date);
    expect(result.end_date).toEqual(input.end_date);
    expect(result.location).toEqual('Ruang Kelas A');
    expect(result.participants).toEqual('Anak-anak dan guru');
    expect(result.photos).toBeNull();
    expect(result.status).toEqual('planned'); // Default status
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
  });

  it('should save activity to database', async () => {
    const input = { ...testInput, created_by: testUserId };
    const result = await createActivity(input);

    // Query using proper drizzle syntax
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    const savedActivity = activities[0];
    expect(savedActivity.title).toEqual('Kegiatan Belajar Mengajar');
    expect(savedActivity.description).toEqual(input.description);
    expect(savedActivity.type).toEqual('harian');
    expect(savedActivity.status).toEqual('planned');
    expect(savedActivity.created_by).toEqual(testUserId);
    expect(savedActivity.created_at).toBeInstanceOf(Date);
  });

  it('should create activity with minimal required fields', async () => {
    const minimalInput: CreateActivityInput = {
      title: 'Kegiatan Minimal',
      description: null,
      type: 'khusus',
      scheduled_date: new Date('2024-02-01T10:00:00Z'),
      end_date: null,
      location: null,
      participants: null,
      photos: null,
      created_by: testUserId,
    };

    const result = await createActivity(minimalInput);

    expect(result.title).toEqual('Kegiatan Minimal');
    expect(result.description).toBeNull();
    expect(result.type).toEqual('khusus');
    expect(result.end_date).toBeNull();
    expect(result.location).toBeNull();
    expect(result.participants).toBeNull();
    expect(result.photos).toBeNull();
    expect(result.status).toEqual('planned');
    expect(result.id).toBeDefined();
  });

  it('should handle different activity types correctly', async () => {
    const weeklyInput = { 
      ...testInput, 
      created_by: testUserId,
      type: 'mingguan' as const,
      title: 'Kegiatan Mingguan'
    };
    
    const result = await createActivity(weeklyInput);

    expect(result.type).toEqual('mingguan');
    expect(result.title).toEqual('Kegiatan Mingguan');
  });

  it('should fail when created_by user does not exist', async () => {
    const input = { ...testInput, created_by: 99999 }; // Non-existent user ID
    
    await expect(createActivity(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
