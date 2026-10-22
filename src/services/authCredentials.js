const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertAuthCredentials({ email, password } = {}) {
  const trimmedEmail = String(email ?? '').trim();
  if (!EMAIL.test(trimmedEmail) || trimmedEmail.length > 254) {
    throw new Error('Enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 72) {
    throw new Error('Password must be 6 to 72 characters.');
  }
  return { email: trimmedEmail, password };
}

export function publicAuthMessage(message) {
  const text = [...String(message || 'Could not sign in.')]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && char !== '<' && char !== '>';
    })
    .join('')
    .trim();
  return (text || 'Could not sign in.').slice(0, 180);
}
