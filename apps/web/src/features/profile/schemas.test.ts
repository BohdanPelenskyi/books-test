import { describe, expect, it } from 'vitest';
import { changePasswordSchema, profileSchema } from './schemas';

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'Old12345!',
    newPassword: 'NewSecret123!',
    confirmPassword: 'NewSecret123!',
  };

  it('accepts matching passwords', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('reports a mismatch on the confirmation field', () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'different' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('rejects a too short new password', () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      newPassword: 'short',
      confirmPassword: 'short',
    });

    expect(result.success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('trims the name and rejects an empty one', () => {
    expect(profileSchema.parse({ name: '  Anna ', email: 'anna@example.com' }).name).toBe('Anna');
    expect(profileSchema.safeParse({ name: '   ', email: 'anna@example.com' }).success).toBe(false);
  });
});
