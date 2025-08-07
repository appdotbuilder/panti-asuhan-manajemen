
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type CreateChildInput } from '../schema';
import { createChild } from '../handlers/create_child';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateChildInput = {
  full_name: 'Ahmad Rizki',
  birth_date: new Date('2015-06-15'),
  gender: 'laki-laki',
  education_status: 'sd',
  health_history: 'Sehat, tidak ada riwayat penyakit serius',
  guardian_info: 'Nenek - Siti Aminah, Jl. Mawar No. 10',
  notes: 'Anak yang aktif dan ceria',
};

// Test input with minimal required fields
const minimalTestInput: CreateChildInput = {
  full_name: 'Sari Dewi',
  birth_date: new Date('2018-03-20'),
  gender: 'perempuan',
  education_status: 'tk',
  health_history: null,
  guardian_info: null,
  notes: null,
};

describe('createChild', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a child with all fields', async () => {
    const result = await createChild(testInput);

    // Basic field validation
    expect(result.full_name).toEqual('Ahmad Rizki');
    expect(result.birth_date).toEqual(new Date('2015-06-15'));
    expect(result.gender).toEqual('laki-laki');
    expect(result.education_status).toEqual('sd');
    expect(result.health_history).toEqual('Sehat, tidak ada riwayat penyakit serius');
    expect(result.guardian_info).toEqual('Nenek - Siti Aminah, Jl. Mawar No. 10');
    expect(result.notes).toEqual('Anak yang aktif dan ceria');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
  });

  it('should create a child with minimal fields', async () => {
    const result = await createChild(minimalTestInput);

    expect(result.full_name).toEqual('Sari Dewi');
    expect(result.birth_date).toEqual(new Date('2018-03-20'));
    expect(result.gender).toEqual('perempuan');
    expect(result.education_status).toEqual('tk');
    expect(result.health_history).toBeNull();
    expect(result.guardian_info).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save child to database', async () => {
    const result = await createChild(testInput);

    // Query using proper drizzle syntax
    const children = await db.select()
      .from(childrenTable)
      .where(eq(childrenTable.id, result.id))
      .execute();

    expect(children).toHaveLength(1);
    expect(children[0].full_name).toEqual('Ahmad Rizki');
    expect(new Date(children[0].birth_date)).toEqual(new Date('2015-06-15'));
    expect(children[0].gender).toEqual('laki-laki');
    expect(children[0].education_status).toEqual('sd');
    expect(children[0].health_history).toEqual('Sehat, tidak ada riwayat penyakit serius');
    expect(children[0].is_active).toEqual(true);
    expect(children[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different education statuses', async () => {
    const educationStatuses = ['belum_sekolah', 'tk', 'sd', 'smp', 'sma', 'kuliah', 'lulus'] as const;

    for (const status of educationStatuses) {
      const input: CreateChildInput = {
        full_name: `Anak ${status}`,
        birth_date: new Date('2010-01-01'),
        gender: 'laki-laki',
        education_status: status,
        health_history: null,
        guardian_info: null,
        notes: null,
      };

      const result = await createChild(input);
      expect(result.education_status).toEqual(status);
      expect(result.full_name).toEqual(`Anak ${status}`);
    }
  });

  it('should handle different genders', async () => {
    const genders = ['laki-laki', 'perempuan'] as const;

    for (const gender of genders) {
      const input: CreateChildInput = {
        full_name: `Anak ${gender}`,
        birth_date: new Date('2015-01-01'),
        gender: gender,
        education_status: 'sd',
        health_history: null,
        guardian_info: null,
        notes: null,
      };

      const result = await createChild(input);
      expect(result.gender).toEqual(gender);
      expect(result.full_name).toEqual(`Anak ${gender}`);
    }
  });

  it('should handle birth date conversion correctly', async () => {
    const birthDate = new Date('2020-12-25');
    const input: CreateChildInput = {
      full_name: 'Test Child',
      birth_date: birthDate,
      gender: 'perempuan',
      education_status: 'belum_sekolah',
      health_history: null,
      guardian_info: null,
      notes: null,
    };

    const result = await createChild(input);
    
    // Verify the birth_date is properly converted
    expect(result.birth_date).toEqual(birthDate);
    expect(result.birth_date).toBeInstanceOf(Date);
    
    // Check that the date matches what we stored
    expect(result.birth_date.getFullYear()).toEqual(2020);
    expect(result.birth_date.getMonth()).toEqual(11); // December is month 11 (0-indexed)
    expect(result.birth_date.getDate()).toEqual(25);
  });
});
