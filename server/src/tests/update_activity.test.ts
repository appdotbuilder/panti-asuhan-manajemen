
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activitiesTable } from '../db/schema';
import { type UpdateActivityInput, type CreateUserInput, type CreateActivityInput } from '../schema';
import { updateActivity } from '../handlers/update_activity';
import { eq } from 'drizzle-orm';

describe('updateActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update activity fields', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        title: 'Original Activity',
        description: 'Original description',
        type: 'harian',
        scheduled_date: new Date('2024-01-01'),
        location: 'Original location',
        status: 'planned',
        created_by: userId
      })
      .returning()
      .execute();

    const activityId = activityResult[0].id;

    // Update activity
    const updateInput: UpdateActivityInput = {
      id: activityId,
      title: 'Updated Activity',
      description: 'Updated description',
      type: 'mingguan',
      location: 'Updated location',
      status: 'ongoing'
    };

    const result = await updateActivity(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(activityId);
    expect(result.title).toEqual('Updated Activity');
    expect(result.description).toEqual('Updated description');
    expect(result.type).toEqual('mingguan');
    expect(result.location).toEqual('Updated location');
    expect(result.status).toEqual('ongoing');
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify unchanged fields
    expect(result.created_by).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        title: 'Original Activity',
        description: 'Original description',
        type: 'harian',
        scheduled_date: new Date('2024-01-01'),
        location: 'Original location',
        participants: 'Original participants',
        status: 'planned',
        created_by: userId
      })
      .returning()
      .execute();

    const activityId = activityResult[0].id;

    // Update only title and status
    const updateInput: UpdateActivityInput = {
      id: activityId,
      title: 'Updated Title Only',
      status: 'completed'
    };

    const result = await updateActivity(updateInput);

    // Verify updated fields
    expect(result.title).toEqual('Updated Title Only');
    expect(result.status).toEqual('completed');
    
    // Verify unchanged fields
    expect(result.description).toEqual('Original description');
    expect(result.type).toEqual('harian');
    expect(result.location).toEqual('Original location');
    expect(result.participants).toEqual('Original participants');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create activity
    const activityResult = await db.insert(activitiesTable)
      .values({
        title: 'Original Activity',
        type: 'harian',
        scheduled_date: new Date('2024-01-01'),
        status: 'planned',
        created_by: userId
      })
      .returning()
      .execute();

    const activityId = activityResult[0].id;

    // Update activity
    const updateInput: UpdateActivityInput = {
      id: activityId,
      title: 'Database Updated Activity',
      type: 'bulanan'
    };

    await updateActivity(updateInput);

    // Verify changes in database
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activityId))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].title).toEqual('Database Updated Activity');
    expect(activities[0].type).toEqual('bulanan');
    expect(activities[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when activity does not exist', async () => {
    const updateInput: UpdateActivityInput = {
      id: 999,
      title: 'Non-existent Activity'
    };

    expect(updateActivity(updateInput)).rejects.toThrow(/Activity with id 999 not found/i);
  });

  it('should handle null values correctly', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create activity with non-null values
    const activityResult = await db.insert(activitiesTable)
      .values({
        title: 'Original Activity',
        description: 'Original description',
        type: 'harian',
        scheduled_date: new Date('2024-01-01'),
        location: 'Original location',
        participants: 'Original participants',
        photos: 'original-photo.jpg',
        status: 'planned',
        created_by: userId
      })
      .returning()
      .execute();

    const activityId = activityResult[0].id;

    // Update with null values
    const updateInput: UpdateActivityInput = {
      id: activityId,
      description: null,
      location: null,
      participants: null,
      photos: null
    };

    const result = await updateActivity(updateInput);

    // Verify null values were set
    expect(result.description).toBeNull();
    expect(result.location).toBeNull();
    expect(result.participants).toBeNull();
    expect(result.photos).toBeNull();
    
    // Verify unchanged fields
    expect(result.title).toEqual('Original Activity');
    expect(result.type).toEqual('harian');
  });
});
