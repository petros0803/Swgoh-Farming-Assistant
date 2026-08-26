// Local relative base paths for your downloaded assets
const CHAR_PATH = "swgoh_characters/";
const SHIP_PATH = "swgoh_ships/";

const farmingRoadmap = [
  {
    category: "🚀 Phase 1: Executor Fleet Priority (#1 Focus)",
    characters: [
      { name: "Darth Vader", id: "VADER", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Darth Vader.png` },
      { name: "Admiral Piett", id: "ADMIRALPIETT", targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Admiral Piett.png` },
      { name: "Boba Fett", id: "BOBAFETT", targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Boba Fett.png` },
      { name: "TIE Fighter Pilot", id: "TIEFIGHTERPILOT", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}TIE Fighter Pilot.png` },
      { name: "Bossk", id: "BOSSK", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Bossk.png` },
      { name: "IG-88", id: "IG88", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}IG-88.png` },
      { name: "Dengar", id: "DENGAR", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Dengar.png` }
    ],
    ships: [
      { name: "Razor Crest", id: "RAZORCREST", targetStars: 7, icon: `${SHIP_PATH}RAZORCREST.webp` },
      { name: "Slave I", id: "SLAVE1", targetStars: 7, icon: `${SHIP_PATH}SLAVE1.webp` },
      { name: "IG-2000", id: "IG2000", targetStars: 7, icon: `${SHIP_PATH}IG2000.webp` },
      { name: "Hound's Tooth", id: "HOUNDSTOOTH", targetStars: 7, icon: `${SHIP_PATH}HOUNDSTOOTH.webp` },
      { name: "Imperial TIE Bomber", id: "IMPERIALTIEBOMBER", targetStars: 7, icon: `${SHIP_PATH}TIEBOMBERIMPERIAL.webp` },
      { name: "TIE Advanced x1", id: "TIEADVANCED", targetStars: 7, icon: `${SHIP_PATH}TIEADVANCED.webp` },
      { name: "Imperial TIE Fighter", id: "TIEFIGHTER", targetStars: 7, icon: `${SHIP_PATH}TIEFIGHTERIMPERIAL.webp` }
    ]
  },
  {
    category: "👑 Phase 2: Galactic Legend Leia Organa",
    characters: [
      { name: "Captain Rex", id: "CAPTAINREX", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Captain Rex.png` },
      { name: "Captain Drogan", id: "DROGAN", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Captain Drogan.png` },
      { name: "Princess Kneesaa", id: "PRINCESSKNEESAA", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Princess Kneesaa.png` },
      { name: "Scout Trooper", id: "SCOUTTROOPER", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Scout Trooper.png` },
      { name: "Chewbacca & 3PO", id: "CHEWBACCA_C3PO", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Threepio & Chewie.png` },
      { name: "Boushh (Leia Organa)", id: "BOUSHH", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Boushh (Leia Organa).png` },
      { name: "Lobot", id: "LOBOT", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Lobot.png` },
      { name: "Admiral Ackbar", id: "ADMIRALACKBAR", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Admiral Ackbar.png` },
      { name: "Lando Calrissian", id: "ADMINISTRATORLANDO", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Lando Calrissian.png` },
      { name: "R2-D2", id: "R2D2_LEGENDARY", targetR: 8, targetStars: 7, icon: `${CHAR_PATH}R2-D2.png` },
      { name: "C-3PO", id: "C3POLEGENDARY", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}C-3PO.png` },
      { name: "Han Solo", id: "HANSOLO", targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Han Solo.png` },
      { name: "Wedge Antilles", id: "WEDGEANTILLES", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Wedge Antilles.png` },
      { name: "Chirrut Îmwe", id: "CHIRRUTIMWE", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Chirrut Imwe.png` },
      { name: "Rebel Officer Leia Organa", id: "ROLO", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Rebel Officer Leia Organa.png` }
    ],
    ships: []
  },
  {
    category: "⚔️ Phase 3: Jedi Knight Luke Skywalker (JKL)",
    characters: [
      { name: "Chief Chirpa", id: "CHIEFCHIRPA", targetStars: 7, icon: `${CHAR_PATH}Chief Chirpa.png` },
      { name: "Wicket", id: "WICKET", targetStars: 7, icon: `${CHAR_PATH}Wicket.png` },
      { name: "Ewok Elder", id: "EWOKELDER", targetStars: 7, icon: `${CHAR_PATH}Ewok Elder.png` },
      { name: "Logray", id: "LOGRAY", targetStars: 7, icon: `${CHAR_PATH}Logray.png` },
      { name: "Paploo", id: "PAPLOO", targetStars: 7, icon: `${CHAR_PATH}Paploo.png` },
      { name: "Commander Luke Skywalker", id: "COMMANDERLUKESKYWALKER", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Commander Luke Skywalker.png` },
      { name: "Chewbacca", id: "CHEWBACCA", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Chewbacca.png` },
      { name: "Han Solo", id: "HANSOLO", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Han Solo.png` },
      { name: "C-3PO", id: "C3POLEGENDARY", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}C-3PO.png` },
      { name: "Lando Calrissian", id: "ADMINISTRATORLANDO", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Lando Calrissian.png` },
      { name: "Rebel Officer Leia Organa", id: "ROLO", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Rebel Officer Leia Organa.png` },
      { name: "Captain Han Solo", id: "CHANKSOLO", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Captain Han Solo.png` },
      { name: "Hermit Yoda", id: "HERMITYODA", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Hermit Yoda.png` },
      { name: "Wampa", id: "WAMPA", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Wampa.png` },
      { name: "Darth Vader", id: "VADER", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Darth Vader.png` }
    ],
    ships: [
      { name: "Han's Millennium Falcon", id: "MILLENNIUMFALCON", targetStars: 7, icon: `${SHIP_PATH}MILLENNIUMFALCON.webp` },
      { name: "Wedge's X-wing", id: "XWINGRED3", targetStars: 7, icon: `${SHIP_PATH}XWINGRED3.webp` }
    ]
  },
  {
    category: "🐷 Phase 4: Galactic Legend Jabba The Hutt",
    characters: [
      { name: "Jedi Knight Luke Skywalker", id: "JEDIKNIGHTLUKE", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Jedi Knight Luke Skywalker.png` },
      { name: "Boba Fett", id: "BOBAFETT", targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Boba Fett.png` },
      { name: "Han Solo", id: "HANSOLO", targetR: 8, targetStars: 7, icon: `${CHAR_PATH}Han Solo.png` },
      { name: "Fennec Shand", id: "FENNECSHAND", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}Fennec Shand.png` },
      { name: "Boushh (Leia Organa)", id: "BOUSHH", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Boushh (Leia Organa).png` },
      { name: "Aurra Sing", id: "AURRASING", targetR: 6, targetStars: 7, icon: `${CHAR_PATH}Aurra Sing.png` },
      { name: "Greedo", id: "GREEDO", targetR: 6, targetStars: 7, icon: `${CHAR_PATH}Greedo.png` },
      { name: "Skiff Guard (Lando Calrissian)", id: "SKIFGUARD", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Skiff Guard (Lando Calrissian).png` },
      { name: "Krrsantan", id: "KRRSANTAN", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Krrsantan.png` },
      { name: "Gamorrean Guard", id: "GAMORREANGUARD", targetR: 5, targetStars: 7, icon: `${CHAR_PATH}Gamorrean Guard.png` },
      { name: "Jawa", id: "JAWA", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Jawa.png` },
      { name: "URoRRuR'R'R", id: "URORRURRR", targetR: 4, targetStars: 7, icon: `${CHAR_PATH}URoRRuRRR.png` },
      { name: "C-3PO", id: "C3POLEGENDARY", targetR: 7, targetStars: 7, icon: `${CHAR_PATH}C-3PO.png` },
      { name: "Mob Enforcer", id: "MOBENFORCER", targetR: 3, targetStars: 7, icon: `${CHAR_PATH}Mob Enforcer.png` }
    ],
    ships: [
      { name: "Outrider", id: "OUTRIDER", targetStars: 7, icon: `${SHIP_PATH}OUTRIDER.webp` }
    ]
  }
];