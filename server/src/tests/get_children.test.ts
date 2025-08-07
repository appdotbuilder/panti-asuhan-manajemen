
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type CreateChildInput } from '../schema';
import { getChildren } from '../handlers/get_children';

const testChild: CreateChildInput = {
  full_name: 'Ahmad Fadli',
  birth_date: new Date('2015-05-15'),
  gender: 'laki-laki',
  education_status: 'sd',
  health_history: 'Sehat, tidak ada riwayat penyakit',
  guardian_info: 'Nenek: Siti Aminah, Alamat: Jl. Mawar No. 10',
  notes: 'Anak yang aktif dan ceria'
};

const inactiveChild: CreateChildInput = {
  full_name: 'Sari Dewi',
  birth_date: new Date('2016-08-20'),
  gender: 'perempuan',
  education_status: 'tk',
  health_history: null,
  guardian_info: null,
  notes: null
};

describe('getChildren', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no children exist', async () => {
    const result = await getChildren();
    expect(result).toEqual([]);
  });

  it('should return all active children', async () => {
    // Create test children - convert Date to string for database
    await db.insert(childrenTable)
      .values([
        {
          full_name: testChild.full_name,
          birth_date: testChild.birth_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          gender: testChild.gender,
          education_status: testChild.education_status,
          health_history: testChild.health_history,
          guardian_info: testChild.guardian_info,
          notes: testChild.notes,
          is_active: true
        },
        {
          full_name: inactiveChild.full_name,
          birth_date: inactiveChild.birth_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          gender: inactiveChild.gender,
          education_status: inactiveChild.education_status,
          health_history: inactiveChild.health_history,
          guardian_info: inactiveChild.guardian_info,
          notes: inactiveChild.notes,
          is_active: true
        }
      ])
      .execute();

    const result = await getChildren();

    expect(result).toHaveLength(2);
    expect(result[0].full_name).toEqual('Ahmad Fadli');
    expect(result[0].gender).toEqual('laki-laki');
    expect(result[0].education_status).toEqual('sd');
    expect(result[0].is_active).toBe(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].birth_date).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    expect(result[1].full_name).toEqual('Sari Dewi');
    expect(result[1].gender).toEqual('perempuan');
    expect(result[1].education_status).toEqual('tk');
    expect(result[1].is_active).toBe(true);
    expect(result[1].birth_date).toBeInstanceOf(Date);
  });

  it('should exclude inactive children', async () => {
    // Create one active and one inactive child
    await db.insert(childrenTable)
      .values([
        {
          full_name: testChild.full_name,
          birth_date: testChild.birth_date.toISOString().split('T')[0],
          gender: testChild.gender,
          education_status: testChild.education_status,
          health_history: testChild.health_history,
          guardian_info: testChild.guardian_info,
          notes: testChild.notes,
          is_active: true
        },
        {
          full_name: inactiveChild.full_name,
          birth_date: inactiveChild.birth_date.toISOString().split('T')[0],
          gender: inactiveChild.gender,
          education_status: inactiveChild.education_status,
          health_history: inactiveChild.health_history,
          guardian_info: inactiveChild.guardian_info,
          notes: inactiveChild.notes,
          is_active: false // This child should be excluded
        }
      ])
      .execute();

    const result = await getChildren();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Ahmad Fadli');
    expect(result[0].is_active).toBe(true);
  });

  it('should return children with correct date types', async () => {
    await db.insert(childrenTable)
      .values({
        full_name: testChild.full_name,
        birth_date: testChild.birth_date.toISOString().split('T')[0], // Convert Date to string
        gender: testChild.gender,
        education_status: testChild.education_status,
        health_history: testChild.health_history,
        guardian_info: testChild.guardian_info,
        notes: testChild.notes,
        is_active: true
      })
      .execute();

    const result = await getChildren();

    expect(result).toHaveLength(1);
    expect(result[0].birth_date).toEqual(new Date('2015-05-15'));
    expect(result[0].birth_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeNull();
  });
});
