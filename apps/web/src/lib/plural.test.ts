import { describe, expect, it } from 'vitest';
import { pluralize } from './plural';

const FORMS = ['запит', 'запити', 'запитів'] as const;

describe('pluralize', () => {
  it.each([
    [1, 'запит'],
    [2, 'запити'],
    [4, 'запити'],
    [5, 'запитів'],
    [11, 'запитів'],
    [14, 'запитів'],
    [21, 'запит'],
    [22, 'запити'],
    [25, 'запитів'],
    [100, 'запитів'],
    [101, 'запит'],
  ])('uses the right form for %i', (count, expected) => {
    expect(pluralize(count, FORMS)).toBe(expected);
  });
});
