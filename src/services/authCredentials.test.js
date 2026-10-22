import { assertAuthCredentials, publicAuthMessage } from './authCredentials';

describe('auth credentials', () => {
  it('rejects malformed emails and extreme passwords before they are sent', () => {
    expect(() => assertAuthCredentials({ email: 'not-an-email', password: 'password123' }))
      .toThrow(/valid email/i);
    expect(() => assertAuthCredentials({ email: 'player@example.com', password: 'short' }))
      .toThrow(/6 to 72/);
    expect(() => assertAuthCredentials({
      email: 'player@example.com',
      password: 'x'.repeat(73)
    })).toThrow(/6 to 72/);

    expect(assertAuthCredentials({ email: ' player@example.com ', password: 'password123' }))
      .toEqual({ email: 'player@example.com', password: 'password123' });
  });

  it('keeps auth errors short and strips markup', () => {
    expect(publicAuthMessage('Email not confirmed')).toBe('Email not confirmed');
    expect(publicAuthMessage(`<script>alert(1)</script>${'x'.repeat(300)}`)).not.toMatch(/[<>]/);
    expect(publicAuthMessage(`<script>alert(1)</script>${'x'.repeat(300)}`).length).toBeLessThanOrEqual(180);
  });
});
