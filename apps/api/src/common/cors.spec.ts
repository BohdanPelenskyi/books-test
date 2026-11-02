import { buildAllowedOrigins } from './cors';

describe('buildAllowedOrigins', () => {
  it('allows both loopback names when the web app runs locally', () => {
    expect(buildAllowedOrigins('http://localhost:3000')).toEqual([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
    expect(buildAllowedOrigins('http://127.0.0.1:3000')).toEqual([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
  });

  it('allows only the configured origin for a real host', () => {
    expect(buildAllowedOrigins('https://books.example.com/')).toEqual([
      'https://books.example.com',
    ]);
  });
});
