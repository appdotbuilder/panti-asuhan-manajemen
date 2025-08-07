
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type CreateChildInput, type UpdateChildInput } from '../schema';
import { updateChild } from '../handlers/update_child';
import { eq } from 'drizzle-orm';

const testChildInput: CreateChildInput = {
  full_name: 'Test Child',
  birth_date: new Date('2015-01-01'),
  gender: 'laki-laki',
  education_status: 'sd',
  health_history: 'No known allergies',
  guardian_info: 'Parent: John Doe',
  notes: 'Active child',
};

describe('updateChild', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update child information', async () => {
    // Create a child first
    const created = await db.insert(childrenTable)
      .values({
        ...testChildInput,
        birth_date: testChildInput.birth_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const childId = created[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      full_name: 'Updated Child Name',
      education_status: 'smp',
      notes: 'Updated notes'
    };

    const result = await updateChild(updateInput);

    expect(result.id).toEqual(childId);
    expect(result.full_name).toEqual('Updated Child Name');
    expect(result.education_status).toEqual('smp');
    expect(result.notes).toEqual('Updated notes');
    expect(result.gender).toEqual('laki-laki'); // Should remain unchanged
    expect(result.birth_date).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create a child first
    const created = await db.insert(childrenTable)
      .values({
        ...testChildInput,
        birth_date: testChildInput.birth_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const childId = created[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      full_name: 'Partially Updated Name'
    };

    const result = await updateChild(updateInput);

    expect(result.full_name).toEqual('Partially Updated Name');
    expect(result.gender).toEqual('laki-laki'); // Should remain unchanged
    expect(result.education_status).toEqual('sd'); // Should remain unchanged
    expect(result.health_history).toEqual('No known allergies'); // Should remain unchanged
    expect(result.birth_date).toBeInstanceOf(Date);
  });

  it('should update child birth date', async () => {
    // Create a child first
    const created = await db.insert(childrenTable)
      .values({
        ...testChildInput,
        birth_date: testChildInput.birth_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const childId = created[0].id;
    const newBirthDate = new Date('2016-05-15');

    const updateInput: UpdateChildInput = {
      id: childId,
      birth_date: newBirthDate
    };

    const result = await updateChild(updateInput);

    expect(result.birth_date).toBeInstanceOf(Date);
    expect(result.birth_date.getFullYear()).toEqual(2016);
    expect(result.birth_date.getMonth()).toEqual(4); // May is month 4 (0-indexed)
    expect(result.birth_date.getDate()).toEqual(15);
  });

  it('should update child status to inactive', async () => {
    // Create a child first
    const created = await db.insert(childrenTable)
      .values({
        ...testChildInput,
        birth_date: testChildInput.birth_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const childId = created[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      is_active: false
    };

    const result = await updateChild(updateInput);

    expect(result.is_active).toBe(false);
    expect(result.full_name).toEqual('Test Child'); // Should remain unchanged
    expect(result.birth_date).toBeInstanceOf(Date);
  });

  it('should save updated data to database', async () => {
    // Create a child first
    const created = await db.insert(childrenTable)
      .values({
        ...testChildInput,
        birth_date: testChildInput.birth_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const childId = created[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      full_name: 'Database Updated Name',
      education_status: 'sma'
    };

    await updateChild(updateInput);

    // Verify in database
    const children = await db.select()
      .from(childrenTable)
      .where(eq(childrenTable.id, childId))
      .execute();

    expect(children).toHaveLength(1);
    expect(children[0].full_name).toEqual('Database Updated Name');
    expect(children[0].education_status).toEqual('sma');
    expect(children[0].updated_at).toBeInstanceOf(Date);
    expect(children[0].birth_date).toBeDefined();
  });

  it('should throw error when child not found', async () => {
    const updateInput: UpdateChildInput = {
      id: 99999,
      full_name: 'Non-existent Child'
    };

    await expect(updateChild(updateInput)).rejects.toThrow(/Child with id 99999 not found/);
  });

  it('should handle nullable fields correctly', async () => {
    // Create a child first
    const created = await db.insert(childrenTable)
      .values({
        ...testChildInput,
        birth_date: testChildInput.birth_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const childId = created[0].id;

    const updateInput: UpdateChildInput = {
      id: childId,
      health_history: null,
      guardian_info: null,
      notes: null
    };

    const result = await updateChild(updateInput);

    expect(result.health_history).toBeNull();
    expect(result.guardian_info).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.birth_date).toBeInstanceOf(Date);
  });
});
