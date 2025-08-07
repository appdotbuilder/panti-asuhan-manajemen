
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable, usersTable } from '../db/schema';
import { type UpdateActivityInput, type CreateUserInput, type CreateActivityInput } from '../schema';
import { updateActivity } from '../handlers/update_activity';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (): Promise<number> => {
  const userInput: CreateUserInput = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    full_name: 'Test User',
    phone: '1234567890',
    role: 'admin'
  };

  const userResult = await db.insert(usersTable)
    .values({
      username: userInput.username,
      email: userInput.email,
      password_hash: 'hashed_password',
      full_name: userInput.full_name,
      phone: userInput.phone,
      role: userInput.role
    })
    .returning()
    .execute();

  return userResult[0].id;
};

// Helper function to create a test activity
const createTestActivity = async (userId: number): Promise<number> => {
  const activityInput: CreateActivityInput = {
    title: 'Original Activity',
    description: 'Original description',
    type: 'harian',
    scheduled_date: new Date('2024-01-01'),
    end_date: null,
    location: 'Original location',
    participants: 'Original participants',
    photos: null,
    created_by: userId
  };

  const activityResult = await db.insert(activitiesTable)
    .values({
      title: activityInput.title,
      description: activityInput.description,
      type: activityInput.type,
      scheduled_date: activityInput.scheduled_date,
      end_date: activityInput.end_date,
      location: activityInput.location,
      participants: activityInput.participants,
      photos: activityInput.photos,
      created_by: activityInput.created_by
    })
    .returning()
    .execute();

  return activityResult[0].id;
};

describe('updateActivity', () => {
  let userId: number;
  let activityId: number;

  beforeEach(async () => {
    await createDB();
    userId = await createTestUser();
    activityId = await createTestActivity(userId);
  });

  afterEach(resetDB);

  it('should update activity title', async () => {
    const input: UpdateActivityInput = {
      id: activityId,
      title: 'Updated Activity Title'
    };

    const result = await updateActivity(input);

    expect(result.id).toEqual(activityId);
    expect(result.title).toEqual('Updated Activity Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdateActivityInput = {
      id: activityId,
      title: 'New Title',
      description: 'New description',
      type: 'mingguan',
      location: 'New location',
      status: 'completed'
    };

    const result = await updateActivity(input);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.type).toEqual('mingguan');
    expect(result.location).toEqual('New location');
    expect(result.status).toEqual('completed');
    expect(result.participants).toEqual('Original participants'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update activity dates correctly', async () => {
    const newScheduledDate = new Date('2024-06-15');
    const newEndDate = new Date('2024-06-16');

    const input: UpdateActivityInput = {
      id: activityId,
      scheduled_date: newScheduledDate,
      end_date: newEndDate
    };

    const result = await updateActivity(input);

    expect(result.scheduled_date).toEqual(newScheduledDate);
    expect(result.end_date).toEqual(newEndDate);
  });

  it('should set nullable fields to null', async () => {
    const input: UpdateActivityInput = {
      id: activityId,
      description: null,
      end_date: null,
      location: null
    };

    const result = await updateActivity(input);

    expect(result.description).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.location).toBeNull();
  });

  it('should save changes to database', async () => {
    const input: UpdateActivityInput = {
      id: activityId,
      title: 'Database Test Title',
      status: 'ongoing'
    };

    await updateActivity(input);

    // Verify changes were saved
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activityId))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].title).toEqual('Database Test Title');
    expect(activities[0].status).toEqual('ongoing');
    expect(activities[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when activity does not exist', async () => {
    const input: UpdateActivityInput = {
      id: 99999,
      title: 'Non-existent Activity'
    };

    await expect(updateActivity(input)).rejects.toThrow(/activity not found/i);
  });

  it('should update only provided fields and leave others unchanged', async () => {
    const input: UpdateActivityInput = {
      id: activityId,
      participants: 'New participants list'
    };

    const result = await updateActivity(input);

    // Check updated field
    expect(result.participants).toEqual('New participants list');
    
    // Check unchanged fields
    expect(result.title).toEqual('Original Activity');
    expect(result.description).toEqual('Original description');
    expect(result.type).toEqual('harian');
    expect(result.location).toEqual('Original location');
    expect(result.status).toEqual('planned');
  });
});
