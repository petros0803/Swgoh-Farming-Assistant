const breakpoints = {
  phone: '768px',
  tablet: '1100px',
  narrow: '390px'
};

function galacticDark(fontSizes) {
  return {
    id: 'galactic-dark',
    name: 'Galactic Dark',
    mode: 'dark',
    colors: {
      bg: '#090c10',
      sunken: '#0d1117',
      card: '#161b22',
      raised: '#1c2128',
      hover: '#22272e',
      track: '#21262d',
      starOff: '#262d36',
      border: '#30363d',
      borderStrong: '#484f58',
      gold: '#f5c518',
      blue: '#38bdf8',
      green: '#4ade80',
      red: '#f87171',
      purple: '#c084fc',
      text: '#f0f6fc',
      muted: '#8b949e',
      dim: '#6e7681',
      body: '#c9d1d9',
      onPrimary: '#ffffff',
      primary: '#238636',
      primaryHover: '#2ea043',
      glowBlue: 'rgba(56, 189, 248, 0.07)',
      glowGold: 'rgba(245, 197, 24, 0.06)',
      focus: 'rgba(56, 189, 248, 0.15)',
      sharedBg: 'rgba(56, 139, 253, 0.16)',
      sharedBorder: 'rgba(56, 139, 253, 0.4)',
      recommendedBg: 'rgba(187, 128, 9, 0.18)',
      recommendedText: '#e3b341',
      recommendedBorder: 'rgba(187, 128, 9, 0.4)',
      relicBg: 'rgba(192, 132, 252, 0.12)',
      relicBorder: 'rgba(192, 132, 252, 0.35)',
      successBg: 'rgba(74, 222, 128, 0.12)',
      successBorder: 'rgba(74, 222, 128, 0.35)',
      successSoft: 'rgba(74, 222, 128, 0.14)',
      warningSoft: 'rgba(245, 197, 24, 0.15)',
      dangerSoft: 'rgba(248, 113, 113, 0.15)',
      infoSoft: 'rgba(56, 189, 248, 0.14)',
      header: 'rgba(13, 17, 23, 0.85)',
      themeColor: '#0d1117',
      gradientEnd: '#12171e',
      saberCore: '#ffffff',
      saberRed: '#ff3434',
      saberRedGlow: 'rgba(255, 52, 52, 0.75)',
      saberBlue: '#2f9bff',
      saberBlueGlow: 'rgba(47, 155, 255, 0.75)',
      saberHilt: 'linear-gradient(180deg, #e2e8f0, #64748b 45%, #1e293b 55%, #94a3b8)',
      saberHiltEdge: '#0f172a'
    },
    fonts: {
      heading: "'Exo 2', sans-serif",
      body: "'Inter', sans-serif"
    },
    fontSizes,
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extraBold: 800
    },
    lineHeights: {
      tight: 1,
      snug: 1.25,
      heading: 1.4,
      body: 1.5,
      relaxed: 1.6
    },
    letterSpacing: {
      tight: '0.4px',
      label: '0.5px',
      wide: '1.2px',
      heading: '1px'
    },
    space: {
      1: '2px',
      2: '4px',
      3: '6px',
      4: '8px',
      5: '10px',
      6: '12px',
      7: '14px',
      8: '16px',
      9: '18px',
      10: '20px',
      11: '22px',
      12: '24px',
      13: '26px',
      14: '30px',
      15: '34px',
      16: '40px',
      17: '60px'
    },
    radii: {
      xs: '2px',
      sm: '6px',
      md: '10px',
      lg: '14px',
      pill: '999px',
      round: '50%'
    },
    shadows: {
      card: '0 1px 2px rgba(0, 0, 0, 0.4)',
      header: '0 4px 20px rgba(0, 0, 0, 0.5)',
      lift: '0 10px 28px rgba(0, 0, 0, 0.45)'
    },
    sizes: {
      tap: '44px',
      portrait: '46px',
      spinner: '15px',
      swatch: '10px',
      inputMin: '180px',
      inputIconOffset: '38px',
      contentText: '600px',
      track: '6px',
      trackLg: '9px',
      phaseTrack: '110px',
      content: '1300px',
      tip: '260px',
      saber: '29px',
      saberHiltWidth: '8px',
      saberHiltHeight: '5px',
      saberBladeWidth: '21px',
      saberBladeHeight: '3px'
    },
    borders: {
      thin: '1px',
      medium: '2px',
      accent: '3px'
    },
    zIndex: {
      header: 100,
      tip: 20
    },
    angles: {
      saberRest: '-34deg'
    },
    motion: {
      saberSpin: '620ms',
      saberSpinEase: 'cubic-bezier(0.34, 1.06, 0.4, 1)',
      saberColor: '260ms',
      saberColorDelay: '200ms'
    },
    breakpoints,
    media: {
      tablet: `@media (max-width: ${breakpoints.tablet})`,
      phone: `@media (max-width: ${breakpoints.phone})`,
      narrow: `@media (max-width: ${breakpoints.narrow})`,
      phoneLandscape: `@media (max-width: ${breakpoints.phone}) and (orientation: landscape)`
    }
  };
}

export function createGalacticDark(fontSizes) {
  return galacticDark(fontSizes);
}
