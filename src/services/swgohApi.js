import { isValidAllyCode, normalizeAllyCode } from '../utils/format';

export async function fetchPlayerRoster(allyCode) {
  const code = normalizeAllyCode(allyCode);

  if (!isValidAllyCode(code)) {
    throw new Error('Please enter a valid 9-digit SWGoH Ally Code.');
  }

  const response = await fetch(`https://swgoh.gg/api/player/${code}/`);

  if (!response.ok) {
    throw new Error('Unable to locate profile. Verify your Ally Code on SWGoH.gg.');
  }

  const data = await response.json();
  if (!data || !data.data) {
    throw new Error('Unexpected roster response from SWGoH.gg.');
  }

  return data;
}
