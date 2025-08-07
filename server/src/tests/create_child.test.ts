
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { childrenTable } from '../db/schema';
import { type CreateChildInput } from '../schema';
import { createChild } from '../handlers/create_child';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateChildInput = {
  full_name: 'Ahmad Rizki',
  birth_date: new Date('2015-05-15'),
  gender: 'laki-laki',
  education_status: 'sd',
  health_history: 'Sehat, tidak ada riwayat penyakit khusus',
  guardian_info: 'Wali: Ibu Siti - Hubungan: Nenek - HP: 081234567890',
  notes: 'Anak yang aktif dan cerdas'
};

describe('createChild', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a child with all required fields', async () => {
    const result = await createChild(testInput);

    // Basic field validation
    expect(result.full_name).toEqual('Ahmad Rizki');
    expect(result.birth_date).toEqual(new Date('2015-05-15'));
    expect(result.gender).toEqual('laki-laki');
    expect(result.education_status).toEqual('sd');
    expect(result.health_history).toEqual('Sehat, tidak ada riwayat penyakit khusus');
    expect(result.guardian_info).toEqual('Wali: Ibu Siti - Hubungan: Nenek - HP: 081234567890');
    expect(result.notes).toEqual('Anak yang aktif dan cerdas');
    expect(result.id).toBeDefined();
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
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
    expect(children[0].birth_date).toEqual('2015-05-15'); // Database stores as string
    expect(children[0].gender).toEqual('laki-laki');
    expect(children[0].education_status).toEqual('sd');
    expect(children[0].health_history).toEqual('Sehat, tidak ada riwayat penyakit khusus');
    expect(children[0].guardian_info).toEqual('Wali: Ibu Siti - Hubungan: Nenek - HP: 081234567890');
    expect(children[0].notes).toEqual('Anak yang aktif dan cerdas');
    expect(children[0].is_active).toBe(true);
    expect(children[0].created_at).toBeInstanceOf(Date);
  });

  it('should create child with null optional fields', async () => {
    const minimalInput: CreateChildInput = {
      full_name: 'Fatimah Sari',
      birth_date: new Date('2018-03-20'),
      gender: 'perempuan',
      education_status: 'tk',
      health_history: null,
      guardian_info: null,
      notes: null
    };

    const result = await createChild(minimalInput);

    expect(result.full_name).toEqual('Fatimah Sari');
    expect(result.birth_date).toEqual(new Date('2018-03-20'));
    expect(result.gender).toEqual('perempuan');
    expect(result.education_status).toEqual('tk');
    expect(result.health_history).toBeNull();
    expect(result.guardian_info).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
  });

  it('should handle different education statuses', async () => {
    const educationStatuses = ['belum_sekolah', 'tk', 'sd', 'smp', 'sma', 'kuliah', 'lulus'] as const;

    for (const status of educationStatuses) {
      const input: CreateChildInput = {
        full_name: `Child with ${status}`,
        birth_date: new Date('2010-01-01'),
        gender: 'laki-laki',
        education_status: status,
        health_history: null,
        guardian_info: null,
        notes: null
      };

      const result = await createChild(input);
      expect(result.education_status).toEqual(status);
    }
  });

  it('should handle different genders', async () => {
    const genders = ['laki-laki', 'perempuan'] as const;

    for (const gender of genders) {
      const input: CreateChildInput = {
        full_name: `Child ${gender}`,
        birth_date: new Date('2015-01-01'),
        gender: gender,
        education_status: 'sd',
        health_history: null,
        guardian_info: null,
        notes: null
      };

      const result = await createChild(input);
      expect(result.gender).toEqual(gender);
    }
  });

  it('should handle date conversion correctly', async () => {
    const testDate = new Date('2020-12-25');
    const input: CreateChildInput = {
      full_name: 'Date Test Child',
      birth_date: testDate,
      gender: 'laki-laki',
      education_status: 'sd',
      health_history: null,
      guardian_info: null,
      notes: null
    };

    const result = await createChild(input);
    
    // Verify that birth_date is properly converted back to Date object
    expect(result.birth_date).toBeInstanceOf(Date);
    expect(result.birth_date.getFullYear()).toEqual(2020);
    expect(result.birth_date.getMonth()).toEqual(11); // December = 11 in JS
    expect(result.birth_date.getDate()).toEqual(25);
  });
});
