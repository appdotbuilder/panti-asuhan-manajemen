
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type CreateChildInput } from '../schema';
import { getChildren } from '../handlers/get_children';

const testChild1: CreateChildInput = {
  full_name: 'Andi Susanto',
  birth_date: new Date('2015-03-15'),
  gender: 'laki-laki',
  education_status: 'sd',
  health_history: 'Sehat, tidak ada riwayat penyakit',
  guardian_info: 'Nenek - Siti Aminah (081234567890)',
  notes: 'Anak yang aktif dan ceria',
};

const testChild2: CreateChildInput = {
  full_name: 'Sari Dewi',
  birth_date: new Date('2013-07-22'),
  gender: 'perempuan',
  education_status: 'smp',
  health_history: null,
  guardian_info: null,
  notes: null,
};

describe('getChildren', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active children', async () => {
    // Create test children
    await db.insert(childrenTable)
      .values([
        {
          ...testChild1,
          birth_date: testChild1.birth_date.toISOString().split('T')[0],
        },
        {
          ...testChild2,
          birth_date: testChild2.birth_date.toISOString().split('T')[0],
        }
      ])
      .execute();

    const result = await getChildren();

    expect(result).toHaveLength(2);
    
    // Check first child
    const child1 = result.find(c => c.full_name === 'Andi Susanto');
    expect(child1).toBeDefined();
    expect(child1!.gender).toEqual('laki-laki');
    expect(child1!.education_status).toEqual('sd');
    expect(child1!.health_history).toEqual('Sehat, tidak ada riwayat penyakit');
    expect(child1!.guardian_info).toEqual('Nenek - Siti Aminah (081234567890)');
    expect(child1!.is_active).toBe(true);
    expect(child1!.created_at).toBeInstanceOf(Date);

    // Check second child
    const child2 = result.find(c => c.full_name === 'Sari Dewi');
    expect(child2).toBeDefined();
    expect(child2!.gender).toEqual('perempuan');
    expect(child2!.education_status).toEqual('smp');
    expect(child2!.health_history).toBeNull();
    expect(child2!.guardian_info).toBeNull();
    expect(child2!.is_active).toBe(true);
  });

  it('should not return inactive children', async () => {
    // Create one active and one inactive child
    await db.insert(childrenTable)
      .values([
        {
          ...testChild1,
          birth_date: testChild1.birth_date.toISOString().split('T')[0],
          is_active: true,
        },
        {
          ...testChild2,
          birth_date: testChild2.birth_date.toISOString().split('T')[0],
          is_active: false,
        }
      ])
      .execute();

    const result = await getChildren();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Andi Susanto');
    expect(result[0].is_active).toBe(true);
  });

  it('should return empty array when no active children exist', async () => {
    // Create only inactive children
    await db.insert(childrenTable)
      .values({
        ...testChild1,
        birth_date: testChild1.birth_date.toISOString().split('T')[0],
        is_active: false,
      })
      .execute();

    const result = await getChildren();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no children exist', async () => {
    const result = await getChildren();

    expect(result).toHaveLength(0);
  });

  it('should return children with proper date conversion', async () => {
    await db.insert(childrenTable)
      .values({
        ...testChild1,
        birth_date: testChild1.birth_date.toISOString().split('T')[0],
      })
      .execute();

    const result = await getChildren();

    expect(result).toHaveLength(1);
    expect(result[0].birth_date).toBeInstanceOf(Date);
    expect(result[0].birth_date.getFullYear()).toEqual(2015);
    expect(result[0].birth_date.getMonth()).toEqual(2); // March (0-indexed)
    expect(result[0].birth_date.getDate()).toEqual(15);
  });
});
