import { describe, expect, it } from 'vitest';
import { buildUserFormSchema } from './schemas';

const validUser = { name: 'Anna', email: 'anna@example.com', role: 'USER' as const };

describe('buildUserFormSchema', () => {
  it('requires a password when creating a user', () => {
    const result = buildUserFormSchema(false).safeParse({ ...validUser, password: '' });

    expect(result.success).toBe(false);
  });

  it('accepts an empty password when editing, meaning "keep the current one"', () => {
    expect(buildUserFormSchema(true).safeParse({ ...validUser, password: '' }).success).toBe(true);
  });

  it('still validates a password that is provided while editing', () => {
    expect(buildUserFormSchema(true).safeParse({ ...validUser, password: 'short' }).success).toBe(
      false,
    );
  });

  it('rejects an invalid email and an unknown role', () => {
    const schema = buildUserFormSchema(false);

    expect(schema.safeParse({ ...validUser, email: 'nope', password: 'Secret123!' }).success).toBe(
      false,
    );
    expect(schema.safeParse({ ...validUser, role: 'ROOT', password: 'Secret123!' }).success).toBe(
      false,
    );
  });
});
