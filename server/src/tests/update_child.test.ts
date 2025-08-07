
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type UpdateChildInput } from '../schema';
import { updateChild } from '../handlers/update_child';
import { eq } from 'drizzle-orm';

const testCreateInput = {
  full_name: 'Test Child',
  birth_date: '2010-05-15', // Use string for date column
  gender: 'laki-laki' as const,
  education_status: 'sd' as const,
  health_history: 'No issues',
  guardian_info: 'Parent contact info',
  notes: 'Initial notes',
};

describe('updateChild', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update child information', async () => {
    // Create a child first
    const childResult = await db.insert(childrenTable)
      .values(testCreateInput)
      .returning()
      .execute();
    const childId = childResult[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      full_name: 'Updated Child Name',
      education_status: 'smp',
      health_history: 'Updated health info',
      is_active: false,
    };

    const result = await updateChild(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(childId);
    expect(result.full_name).toEqual('Updated Child Name');
    expect(result.education_status).toEqual('smp');
    expect(result.health_history).toEqual('Updated health info');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify unchanged fields
    expect(result.birth_date).toEqual(new Date('2010-05-15'));
    expect(result.gender).toEqual('laki-laki');
    expect(result.guardian_info).toEqual('Parent contact info');
    expect(result.notes).toEqual('Initial notes');
  });

  it('should update only provided fields', async () => {
    // Create a child first
    const childResult = await db.insert(childrenTable)
      .values(testCreateInput)
      .returning()
      .execute();
    const childId = childResult[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      full_name: 'Partially Updated Name',
    };

    const result = await updateChild(updateInput);

    // Verify only full_name is updated
    expect(result.full_name).toEqual('Partially Updated Name');
    expect(result.education_status).toEqual('sd'); // unchanged
    expect(result.health_history).toEqual('No issues'); // unchanged
    expect(result.is_active).toEqual(true); // unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated child to database', async () => {
    // Create a child first
    const childResult = await db.insert(childrenTable)
      .values(testCreateInput)
      .returning()
      .execute();
    const childId = childResult[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      full_name: 'Database Test Child',
      gender: 'perempuan',
    };

    await updateChild(updateInput);

    // Query database directly to verify changes
    const children = await db.select()
      .from(childrenTable)
      .where(eq(childrenTable.id, childId))
      .execute();

    expect(children).toHaveLength(1);
    expect(children[0].full_name).toEqual('Database Test Child');
    expect(children[0].gender).toEqual('perempuan');
    expect(children[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create a child first
    const childResult = await db.insert(childrenTable)
      .values(testCreateInput)
      .returning()
      .execute();
    const childId = childResult[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      health_history: null,
      notes: null,
    };

    const result = await updateChild(updateInput);

    expect(result.health_history).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.guardian_info).toEqual('Parent contact info'); // unchanged
  });

  it('should update birth_date correctly', async () => {
    // Create a child first
    const childResult = await db.insert(childrenTable)
      .values(testCreateInput)
      .returning()
      .execute();
    const childId = childResult[0].id;

    const newBirthDate = new Date('2011-06-20');
    const updateInput: UpdateChildInput = {
      id: childId,
      birth_date: newBirthDate,
    };

    const result = await updateChild(updateInput);

    expect(result.birth_date).toEqual(newBirthDate);
    expect(result.birth_date).toBeInstanceOf(Date);
  });

  it('should throw error when child not found', async () => {
    const updateInput: UpdateChildInput = {
      id: 99999, // non-existent id
      full_name: 'Non-existent Child',
    };

    expect(updateChild(updateInput)).rejects.toThrow(/child with id 99999 not found/i);
  });
});
