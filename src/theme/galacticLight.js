import { createGalacticDark } from './galacticDark';

export function createGalacticLight(fontSizes) {
  const foundation = createGalacticDark(fontSizes);

  return {
    ...foundation,
    id: 'galactic-light',
    name: 'Galactic Light',
    mode: 'light',
    colors: {
      ...foundation.colors,
      bg: '#f4f7fb',
      sunken: '#ffffff',
      card: '#ffffff',
      raised: '#e9eef5',
      hover: '#dde5ef',
      track: '#d9e1ec',
      starOff: '#c6cfdb',
      border: '#cbd5e1',
      borderStrong: '#94a3b8',
      gold: '#9a6700',
      blue: '#0369a1',
      green: '#15803d',
      red: '#c62828',
      purple: '#7e22ce',
      text: '#172033',
      muted: '#526176',
      dim: '#718096',
      body: '#334155',
      primary: '#16753a',
      primaryHover: '#11612f',
      glowBlue: 'rgba(3, 105, 161, 0.08)',
      glowGold: 'rgba(154, 103, 0, 0.06)',
      focus: 'rgba(3, 105, 161, 0.18)',
      sharedBg: 'rgba(3, 105, 161, 0.1)',
      sharedBorder: 'rgba(3, 105, 161, 0.35)',
      recommendedBg: 'rgba(154, 103, 0, 0.1)',
      recommendedText: '#854d0e',
      recommendedBorder: 'rgba(154, 103, 0, 0.35)',
      relicBg: 'rgba(126, 34, 206, 0.08)',
      relicBorder: 'rgba(126, 34, 206, 0.3)',
      successBg: 'rgba(21, 128, 61, 0.09)',
      successBorder: 'rgba(21, 128, 61, 0.3)',
      successSoft: 'rgba(21, 128, 61, 0.1)',
      warningSoft: 'rgba(154, 103, 0, 0.11)',
      dangerSoft: 'rgba(198, 40, 40, 0.09)',
      infoSoft: 'rgba(3, 105, 161, 0.1)',
      header: 'rgba(255, 255, 255, 0.88)',
      themeColor: '#ffffff',
      gradientEnd: '#f7f9fc',
      saberCore: '#fbfdff',
      saberRed: '#e01b1b',
      saberRedGlow: 'rgba(224, 27, 27, 0.6)',
      saberBlue: '#0b6fd8',
      saberBlueGlow: 'rgba(11, 111, 216, 0.6)',
      saberHilt: 'linear-gradient(180deg, #f1f5f9, #94a3b8 45%, #334155 55%, #cbd5e1)',
      saberHiltEdge: '#1e293b'
    },
    shadows: {
      card: '0 1px 3px rgba(15, 23, 42, 0.1)',
      header: '0 4px 18px rgba(15, 23, 42, 0.12)',
      lift: '0 10px 28px rgba(15, 23, 42, 0.16)'
    }
  };
}
