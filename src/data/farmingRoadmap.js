const CHAR_PATH = `${import.meta.env.BASE_URL}assets/characters/`;
const SHIP_PATH = `${import.meta.env.BASE_URL}assets/ships/`;

export const farmingRoadmap = [
  {
    category: '🚀 Phase 1: Executor Fleet Priority (#1 Focus)',
    characters: [
      { name: 'Admiral Piett', id: 'ADMIRALPIETT', alignment: 'dark', targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Admiral Piett.png` },
      { name: 'Boba Fett', id: 'BOBAFETT', alignment: 'dark', targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Boba Fett.png` },
      { name: 'Darth Vader', id: 'VADER', alignment: 'dark', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Darth Vader.png` },
      { name: 'Dengar', id: 'DENGAR', alignment: 'dark', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Dengar.png` },
      { name: 'IG-88', id: 'IG88', alignment: 'dark', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}IG-88.png` },
      { name: 'Bossk', id: 'BOSSK', alignment: 'dark', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Bossk.png` },
      { name: 'TIE Fighter Pilot', id: 'TIEFIGHTERPILOT', alignment: 'dark', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}TIE Fighter Pilot.png` }
    ],
    ships: [
      { name: 'Razor Crest', id: 'RAZORCREST', targetStars: 7, icon: `${SHIP_PATH}RAZORCREST.webp` },
      { name: 'TIE Advanced x1', id: 'TIEADVANCED', targetStars: 7, icon: `${SHIP_PATH}TIEADVANCED.webp` },
      { name: 'Imperial TIE Bomber', id: 'TIEBOMBERIMPERIAL', targetStars: 7, icon: `${SHIP_PATH}TIEBOMBERIMPERIAL.webp` },
      { name: "Hound's Tooth", id: 'HOUNDSTOOTH', targetStars: 7, icon: `${SHIP_PATH}HOUNDSTOOTH.webp` },
      { name: 'Slave I', id: 'SLAVE1', targetStars: 7, icon: `${SHIP_PATH}SLAVE1.webp` },
      { name: 'IG-2000', id: 'IG2000', targetStars: 7, icon: `${SHIP_PATH}IG2000.webp` },
      { name: 'Imperial TIE Fighter', id: 'TIEFIGHTERIMPERIAL', targetStars: 7, icon: `${SHIP_PATH}TIEFIGHTERIMPERIAL.webp` }
    ]
  },
  {
    category: '👑 Phase 2: Galactic Legend Leia Organa',
    characters: [
      { name: 'Captain Rex', id: 'CAPTAINREX', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Captain Rex.png` },
      { name: 'Princess Kneesaa', id: 'PRINCESSKNEESAA', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Princess Kneesaa.png` },
      { name: 'Wicket', id: 'WICKET', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Wicket.png` },
      { name: 'Lando Calrissian', id: 'ADMINISTRATORLANDO', alignment: 'light', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Lando Calrissian.png` },
      { name: 'Admiral Ackbar', id: 'ADMIRALACKBAR', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Admiral Ackbar.png` },
      { name: 'Scout Trooper', id: 'SCOUTTROOPER_V3', alignment: 'dark', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Scout Trooper.png` },
      { name: 'R2-D2', id: 'R2D2_LEGENDARY', alignment: 'light', targetR: 8, targetStars: 7, icon: `${CHAR_PATH}R2-D2.png` },
      { name: 'Captain Han Solo', id: 'HOTHHAN', alignment: 'light', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Captain Han Solo.png` },
      { name: 'Rebel Officer Leia Organa', id: 'HOTHLEIA', alignment: 'light', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Rebel Officer Leia Organa.png` },
      { name: 'Chief Chirpa', id: 'CHIEFCHIRPA', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Chief Chirpa.png` },
      { name: 'Captain Drogan', id: 'CAPTAINDROGAN', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Captain Drogan.png` },
      { name: 'Commander Luke Skywalker', id: 'COMMANDERLUKESKYWALKER', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Commander Luke Skywalker.png` },
      { name: 'Boushh (Leia Organa)', id: 'BOUSHH', alignment: 'light', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Boushh (Leia Organa).png` },
      { name: 'Threepio & Chewie', id: 'C3POCHEWBACCA', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Threepio & Chewie.png` },
      { name: 'Lobot', id: 'LOBOT', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Lobot.png` }
    ],
    ships: []
  },
  {
    category: '🧸 Prerequisite: C-3PO Event (Any 5 Ewoks)',
    characters: [
      { name: 'Princess Kneesaa', id: 'PRINCESSKNEESAA', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Princess Kneesaa.png` },
      { name: 'Chief Chirpa', id: 'CHIEFCHIRPA', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Chief Chirpa.png` },
      { name: 'Wicket', id: 'WICKET', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Wicket.png` },
      { name: 'Ewok Elder', id: 'EWOKELDER', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Ewok Elder.png` },
      { name: 'Logray', id: 'LOGRAY', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Logray.png` },
      { name: 'Paploo', id: 'PAPLOO', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Paploo.png` },
      { name: 'Teebo', id: 'TEEBO', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Teebo.png` },
      { name: 'Ewok Scout', id: 'EWOKSCOUT', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Ewok Scout.png` }
    ],
    ships: []
  },
  {
    category: '⚔️ Phase 3: Jedi Knight Luke Skywalker (JKL)',
    characters: [
      { name: 'Wampa', id: 'WAMPA', alignment: 'dark', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Wampa.png` },
      { name: 'Commander Luke Skywalker', id: 'COMMANDERLUKESKYWALKER', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Commander Luke Skywalker.png` },
      { name: 'C-3PO', id: 'C3POLEGENDARY', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}C-3PO.png` },
      { name: 'Captain Han Solo', id: 'HOTHHAN', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Captain Han Solo.png` },
      { name: 'Chewbacca', id: 'CHEWBACCALEGENDARY', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Chewbacca.png` },
      { name: 'Rebel Officer Leia Organa', id: 'HOTHLEIA', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Rebel Officer Leia Organa.png` },
      { name: 'Hermit Yoda', id: 'HERMITYODA', alignment: 'neutral', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Hermit Yoda.png` },
      { name: 'Lando Calrissian', id: 'ADMINISTRATORLANDO', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Lando Calrissian.png` },
      { name: 'Darth Vader', id: 'VADER', alignment: 'dark', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Darth Vader.png` }
    ],
    ships: [
      { name: "Han's Millennium Falcon", id: 'MILLENNIUMFALCON', targetStars: 7, icon: `${SHIP_PATH}MILLENNIUMFALCON.webp` },
      { name: "Wedge's X-wing", id: 'XWINGRED3', targetStars: 7, icon: `${SHIP_PATH}XWINGRED3.webp` }
    ]
  },
  {
    category: '🐷 Phase 4: Galactic Legend Jabba The Hutt',
    characters: [
      { name: 'Han Solo', id: 'HANSOLO', alignment: 'light', targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Han Solo.png` },
      { name: 'Greedo', id: 'GREEDO', alignment: 'dark', targetR: 6, targetStars: 7, icon: `${CHAR_PATH}Greedo.png` },
      { name: 'Krrsantan', id: 'KRRSANTAN', alignment: 'dark', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Krrsantan.png` },
      { name: 'Gamorrean Guard', id: 'GAMORREANGUARD', alignment: 'dark', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Gamorrean Guard.png` },
      { name: 'Jedi Knight Luke Skywalker', id: 'JEDIKNIGHTLUKE', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Jedi Knight Luke Skywalker.png` },
      { name: 'C-3PO', id: 'C3POLEGENDARY', alignment: 'light', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}C-3PO.png` },
      { name: 'Skiff Guard (Lando Calrissian)', id: 'UNDERCOVERLANDO', alignment: 'light', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Skiff Guard (Lando Calrissian).png` },
      { name: "URoRRuR'R'R", id: 'URORRURRR', alignment: 'dark', targetR: 4, targetStars: 7, icon: `${CHAR_PATH}URoRRuRRR.png` },
      { name: 'Jawa', id: 'JAWA', alignment: 'light', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Jawa.png` },
      { name: 'Fennec Shand', id: 'FENNECSHAND', alignment: 'dark', targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Fennec Shand.png` },
      { name: 'Boba Fett', id: 'BOBAFETT', alignment: 'dark', targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Boba Fett.png` },
      { name: 'Aurra Sing', id: 'AURRA_SING', alignment: 'dark', targetR: 6, targetStars: 7, icon: `${CHAR_PATH}Aurra Sing.png` },
      { name: 'Boushh (Leia Organa)', id: 'BOUSHH', alignment: 'light', targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Boushh (Leia Organa).png` },
      { name: 'Mob Enforcer', id: 'HUMANTHUG', alignment: 'dark', targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Mob Enforcer.png` }
    ],
    ships: [
      { name: 'Outrider', id: 'OUTRIDER', targetStars: 7, icon: `${SHIP_PATH}OUTRIDER.webp` }
    ]
  }
];
