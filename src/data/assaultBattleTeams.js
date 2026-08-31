/**
 * Community strategy is deliberately separate from generated game data.
 * Rankings describe reliability and investment, not an official guarantee.
 */
export const assaultBattleTeams = {
  NODE_EVENT_ASSAULT_EWOK: [
    {
      category: 'Most used',
      name: 'Veers Imperial Troopers',
      units: units([
        ['VEERS', 'General Veers'],
        ['ADMIRALPIETT', 'Admiral Piett'],
        ['RANGETROOPER', 'Range Trooper'],
        ['DARKTROOPER', 'Dark Trooper'],
        ['COLONELSTARCK', 'Colonel Starck']
      ]),
      tierFit: 'Proven through Challenge Tier III',
      strategy: 'Build Emperor’s Trap quickly, carry turn meter between waves, and control Teebo before his opening attack.',
      sources: [
        source('SWGOH Wiki strategy and videos', 'https://swgoh.wiki/wiki/Forest_Moon'),
        source('Assault Battle video library', 'https://swgoh4.life/assault-battles/')
      ]
    },
    {
      category: 'Easiest',
      name: 'Saxon super-commandos',
      units: units([
        ['VEERS', 'General Veers'],
        ['ADMIRALPIETT', 'Admiral Piett'],
        ['RANGETROOPER', 'Range Trooper'],
        ['GARSAXON', 'Gar Saxon'],
        ['IMPERIALSUPERCOMMANDO', 'Imperial Super Commando']
      ]),
      tierFit: 'Low-investment Challenge Tier III clear',
      strategy: 'The Mandalorian assists amplify the Trooper turn-meter loop; focus dangerous Ewoks before they move.',
      sources: [
        source('New School Gaming CT3 guide', 'https://www.youtube.com/watch?v=uhKykNc22Hg')
      ]
    },
    {
      category: 'Strongest',
      name: 'Lord Vader Empire',
      units: units([
        ['LORDVADER', 'Lord Vader'],
        ['ADMIRALPIETT', 'Admiral Piett'],
        ['GRANDADMIRALTHRAWN', 'Grand Admiral Thrawn'],
        ['ROYALGUARD', 'Royal Guard'],
        ['VADER', 'Darth Vader']
      ]),
      tierFit: 'Overqualified end-game option',
      strategy: 'A safe high-investment clear. Use fracture and ability blocks to prevent burst damage while Lord Vader ramps.',
      caveat: 'Reliable, but far more expensive than the Imperial Trooper solutions.',
      sources: [
        source('Forest Moon community guide index', 'https://swgoh.wiki/wiki/Forest_Moon')
      ]
    },
    {
      category: 'Budget',
      name: 'Grievous Separatist Droids',
      units: units([
        ['GRIEVOUS', 'General Grievous'],
        ['B1BATTLEDROIDV2', 'B1 Battle Droid'],
        ['B2SUPERBATTLEDROID', 'B2 Super Battle Droid'],
        ['MAGNAGUARD', 'IG-100 MagnaGuard'],
        ['DROIDEKA', 'Droideka']
      ]),
      tierFit: 'Accessible alternative for early and mid tiers',
      strategy: 'Use B2 and Grievous for repeated area damage, save Droideka’s burst for priority Ewoks, and let MagnaGuard protect the damage dealers.',
      caveat: 'Imperial Troopers remain the more efficient Challenge Tier III solution.',
      sources: [
        source('Forest Moon eligible teams and mechanics', 'https://swgoh.wiki/wiki/Forest_Moon')
      ]
    }
  ],

  NODE_EVENT_ASSAULT_EMPIRE: [
    {
      category: 'Strongest',
      name: 'CLS Rebels',
      units: units([
        ['COMMANDERLUKESKYWALKER', 'Commander Luke Skywalker'],
        ['HANSOLO', 'Han Solo'],
        ['CHEWBACCALEGENDARY', 'Chewbacca'],
        ['C3POLEGENDARY', 'C-3PO'],
        ['C3POCHEWBACCA', 'Threepio & Chewie']
      ]),
      tierFit: 'Fast, reliable Challenge Tier III clear',
      strategy: 'Open with Han’s stun, keep exposes and assists flowing, and keep Emperor Palpatine controlled.',
      sources: [
        source('SWGOH Wiki strategy and videos', 'https://swgoh.wiki/wiki/Military_Might'),
        source('Community Assault Battle compilation', 'https://www.youtube.com/watch?v=uhKykNc22Hg')
      ]
    },
    {
      category: 'Most used',
      name: 'Captain Rex Phoenix',
      units: units([
        ['HERASYNDULLAS3', 'Hera Syndulla'],
        ['CAPTAINREX', 'Captain Rex'],
        ['KANANJARRUSS3', 'Kanan Jarrus'],
        ['CHOPPERS3', 'Chopper'],
        ['SABINEWRENS3', 'Sabine Wren']
      ]),
      tierFit: 'Comfortable early tiers; high tiers need investment',
      strategy: 'Rex turns Phoenix assists into sustained control. Preserve the event counter stance for incoming Imperial turns.',
      sources: [
        source('Military Might community guides', 'https://swgoh.wiki/wiki/Military_Might')
      ]
    },
    {
      category: 'Budget',
      name: 'Bad Batch Clones',
      units: units([
        ['BADBATCHHUNTER', 'Hunter'],
        ['BADBATCHECHO', 'Echo'],
        ['BADBATCHWRECKER', 'Wrecker'],
        ['BADBATCHTECH', 'Tech'],
        ['BADBATCHOMEGA', 'Omega']
      ]),
      tierFit: 'Useful through Challenge Tier I–II',
      strategy: 'Use Echo and Tech to control waves, then let Hunter and Wrecker cycle the squad’s exposes and protection.',
      caveat: 'Not the preferred Challenge Tier III team.',
      sources: [
        source('Military Might event reference', 'https://swgoh.gg/events/EVENT_ASSAULT_EMPIRE/')
      ]
    },
    {
      category: 'Easiest',
      name: 'Mon Mothma Rebel Fighters',
      units: units([
        ['MONMOTHMA', 'Mon Mothma'],
        ['KYLEKATARN', 'Kyle Katarn'],
        ['PAO', 'Pao'],
        ['HOTHREBELSCOUT', 'Hoth Rebel Scout'],
        ['CARADUNE', 'Cara Dune']
      ]),
      tierFit: 'Comfortable sustain for early and mid tiers',
      strategy: 'Chain Rebel Fighter assists to control turn meter and repeatedly revive fallen allies while Kyle builds Force Connection.',
      caveat: 'The long fights make CLS the better choice for the highest Challenge tiers.',
      sources: [
        source('Military Might eligible factions and mechanics', 'https://swgoh.wiki/wiki/Military_Might')
      ]
    }
  ],

  NODE_EVENT_ASSAULT_SEPARATIST: [
    {
      category: 'Strongest',
      name: 'Jedi Knight Luke control',
      units: units([
        ['JEDIKNIGHTLUKE', 'Jedi Knight Luke Skywalker'],
        ['JEDIKNIGHTREVAN', 'Jedi Knight Revan'],
        ['GRANDMASTERYODA', 'Grand Master Yoda'],
        ['HERMITYODA', 'Hermit Yoda'],
        ['JOLEEBINDO', 'Jolee Bindo']
      ]),
      tierFit: 'Most reliable Challenge Tier III core',
      strategy: 'Luke’s lead suppresses enemy speed. End each wave with Hero’s Arise and key cooldowns ready.',
      sources: [
        source('Ground War CT3 walkthrough', 'https://www.youtube.com/watch?v=rzBFOyi9QgY'),
        source('SWGOH Wiki strategy and videos', 'https://swgoh.wiki/wiki/Ground_War')
      ]
    },
    {
      category: 'Most used',
      name: 'Jedi Knight Revan',
      units: units([
        ['JEDIKNIGHTREVAN', 'Jedi Knight Revan'],
        ['GRANDMASTERYODA', 'Grand Master Yoda'],
        ['GENERALKENOBI', 'General Kenobi'],
        ['HERMITYODA', 'Hermit Yoda'],
        ['JOLEEBINDO', 'Jolee Bindo']
      ]),
      tierFit: 'Reliable through Challenge Tier II',
      strategy: 'Mark priority targets, spread buffs with Yoda, and use Jolee’s revive to stabilize difficult waves.',
      sources: [
        source('Ground War community guides', 'https://swgoh.wiki/wiki/Ground_War')
      ]
    },
    {
      category: 'Easiest',
      name: 'Bastila Jedi',
      units: units([
        ['BASTILASHAN', 'Bastila Shan'],
        ['GRANDMASTERYODA', 'Grand Master Yoda'],
        ['GENERALKENOBI', 'General Kenobi'],
        ['EZRABRIDGERS3', 'Ezra Bridger'],
        ['BARRISSOFFEE', 'Barriss Offee']
      ]),
      tierFit: 'Accessible lower-tier team',
      strategy: 'Bastila’s opening protection and Yoda’s shared buffs make the early tiers forgiving.',
      caveat: 'This is not a Challenge Tier III recommendation.',
      sources: [
        source('Ground War lower-tier video index', 'https://swgoh.wiki/wiki/Ground_War')
      ]
    },
    {
      category: 'Budget',
      name: 'Chirpa Ewoks',
      units: units([
        ['CHIEFCHIRPA', 'Chief Chirpa'],
        ['PAPLOO', 'Paploo'],
        ['WICKET', 'Wicket'],
        ['LOGRAY', 'Logray'],
        ['EWOKELDER', 'Ewok Elder']
      ]),
      tierFit: 'Lower tiers only',
      strategy: 'Use the Ewok turn-meter loop and Elder’s revive, but expect a sharp ceiling before Challenge tiers.',
      sources: [
        source('Ground War eligibility and guides', 'https://swgoh.wiki/wiki/Ground_War')
      ]
    }
  ],

  NODE_EVENT_ASSAULT_JEDI: [
    {
      category: 'Strongest',
      name: 'Palpatine Sith control',
      units: units([
        ['EMPERORPALPATINE', 'Emperor Palpatine'],
        ['VADER', 'Darth Vader'],
        ['DARTHMALAK', 'Darth Malak'],
        ['BASTILASHANDARK', 'Bastila Shan (Fallen)'],
        ['DARTHNIHILUS', 'Darth Nihilus']
      ]),
      tierFit: 'Low-cost, reliable Challenge Tier III clear',
      strategy: 'Chain shocks, stuns, and Vader turns. Nihilus removes durable Jedi while Malak absorbs pressure.',
      sources: [
        source('Places of Power community guide', 'https://swgoh.miraheze.org/wiki/Assault_battles'),
        source('SWGOH Wiki strategy and videos', 'https://swgoh.wiki/wiki/Places_of_Power')
      ]
    },
    {
      category: 'Most used',
      name: 'Sith Empire',
      units: units([
        ['DARTHMALGUS', 'Darth Malgus'],
        ['DARTHREVAN', 'Darth Revan'],
        ['DARTHMALAK', 'Darth Malak'],
        ['BASTILASHANDARK', 'Bastila Shan (Fallen)'],
        ['SITHTROOPER', 'Sith Empire Trooper']
      ]),
      tierFit: 'High-investment Challenge Tier team',
      strategy: 'Fear and Malgus’s durability make this safe, although its turn cycle is slower than Palpatine/Vader.',
      sources: [
        source('Places of Power guide index', 'https://swgoh.wiki/wiki/Places_of_Power')
      ]
    },
    {
      category: 'Easiest',
      name: 'Kylo Ren Unmasked First Order',
      units: units([
        ['KYLORENUNMASKED', 'Kylo Ren (Unmasked)'],
        ['GENERALHUX', 'General Hux'],
        ['FIRSTORDERTROOPER', 'First Order Stormtrooper'],
        ['FOSITHTROOPER', 'Sith Trooper'],
        ['FIRSTORDEREXECUTIONER', 'First Order Executioner']
      ]),
      tierFit: 'Straightforward early and middle tiers',
      strategy: 'KRU tanks while Hux prevents turn-meter gain and Sith Trooper supplies assists and burst damage.',
      caveat: 'Sith squads are normally faster and cheaper for Challenge Tier III.',
      sources: [
        source('Places of Power eligibility and videos', 'https://swgoh.wiki/wiki/Places_of_Power')
      ]
    },
    {
      category: 'Budget',
      name: 'Early Palpatine Sith',
      units: units([
        ['EMPERORPALPATINE', 'Emperor Palpatine'],
        ['VADER', 'Darth Vader'],
        ['DARTHSIDIOUS', 'Darth Sidious'],
        ['MAUL', 'Darth Maul'],
        ['KYLORENUNMASKED', 'Kylo Ren (Unmasked)']
      ]),
      tierFit: 'Bonus and Mythic tiers',
      strategy: 'Lean on Palpatine’s stun train and Vader’s Merciless Massacre; the fifth slot mainly protects the core.',
      sources: [
        source('Places of Power lower-tier guides', 'https://swgoh.wiki/wiki/Places_of_Power')
      ]
    }
  ],

  NODE_EVENT_ASSAULT_DARKSIDE: [
    {
      category: 'Strongest',
      name: 'Great Mothers Nightsisters',
      units: units([
        ['GREATMOTHERS', 'Great Mothers'],
        ['MORGANELSBETH', 'Morgan Elsbeth'],
        ['NIGHTSISTERZOMBIE', 'Nightsister Zombie'],
        ['NIGHTTROOPER', 'Night Trooper'],
        ['DEATHTROOPERPERIDEA', 'Death Trooper (Peridea)']
      ]),
      tierFit: 'Best current Challenge Tier III option',
      strategy: 'Use the newer Nightsister core’s Plague and revive mechanics to survive Sidious in wave four.',
      sources: [
        source('Great Mothers CT3 guide', 'https://www.youtube.com/watch?v=PfOQuiAVgxA'),
        source('Secrets and Shadows reference', 'https://swgoh.wiki/wiki/Secrets_and_Shadows')
      ]
    },
    {
      category: 'Most used',
      name: 'Classic Merrin Nightsisters',
      units: units([
        ['MOTHERTALZIN', 'Mother Talzin'],
        ['DAKA', 'Old Daka'],
        ['ASAJVENTRESS', 'Asajj Ventress'],
        ['NIGHTSISTERZOMBIE', 'Nightsister Zombie'],
        ['MERRIN', 'Merrin']
      ]),
      tierFit: 'Proven Challenge Tier III, high RNG',
      strategy: 'Stack Daka’s health and crit avoidance so she survives Sidious’s AOE, then rebuild the team through revives.',
      sources: [
        source('Gaming Fans CT3 walkthrough', 'https://gaming-fans.com/2023/11/swgoh-assault-battles-secrets-shadows-challenge-tier-3-tips-walkthrough/'),
        source('Classic Nightsister guide', 'https://www.rgamereview.com/news/swgoh-secrets-and-shadows')
      ]
    },
    {
      category: 'Easiest',
      name: 'Captain Rex Phoenix',
      units: units([
        ['HERASYNDULLAS3', 'Hera Syndulla'],
        ['CAPTAINREX', 'Captain Rex'],
        ['KANANJARRUSS3', 'Kanan Jarrus'],
        ['CHOPPERS3', 'Chopper'],
        ['SABINEWRENS3', 'Sabine Wren']
      ]),
      tierFit: 'Strong lower-tier option',
      strategy: 'Rex’s assists and dazes make normal waves easy, but Sidious remains a major high-tier wall.',
      caveat: 'Not a reliable Challenge Tier III recommendation.',
      sources: [
        source('Secrets and Shadows community videos', 'https://swgoh.wiki/wiki/Secrets_and_Shadows')
      ]
    },
    {
      category: 'Budget',
      name: 'Talzin Nightsisters',
      units: units([
        ['MOTHERTALZIN', 'Mother Talzin'],
        ['DAKA', 'Old Daka'],
        ['ASAJVENTRESS', 'Asajj Ventress'],
        ['NIGHTSISTERZOMBIE', 'Nightsister Zombie'],
        ['NIGHTSISTERSPIRIT', 'Nightsister Spirit']
      ]),
      tierFit: 'Mythic and early Challenge tiers',
      strategy: 'Plague and repeated revives beat lower waves; invest survivability in Daka first.',
      sources: [
        source('Secrets and Shadows guide index', 'https://swgoh.wiki/wiki/Secrets_and_Shadows')
      ]
    }
  ],

  NODE_EVENT_ASSAULT_REBEL: [
    {
      category: 'Strongest',
      name: 'Veers Imperial Troopers',
      units: units([
        ['VEERS', 'General Veers'],
        ['ADMIRALPIETT', 'Admiral Piett'],
        ['RANGETROOPER', 'Range Trooper'],
        ['DARKTROOPER', 'Dark Trooper'],
        ['COLONELSTARCK', 'Colonel Starck']
      ]),
      tierFit: 'Preferred Challenge Tier III team',
      strategy: 'Use the event ability and Emperor’s Trap to start a turn-meter train that carries between waves.',
      sources: [
        source('Rebel Roundup strategy and videos', 'https://swgoh.wiki/wiki/Rebel_Roundup'),
        source('Assault Battle video library', 'https://swgoh4.life/assault-battles/')
      ]
    },
    {
      category: 'Most used',
      name: 'Modern Bounty Hunters',
      units: units([
        ['BOSSK', 'Bossk'],
        ['BOBAFETT', 'Boba Fett'],
        ['JANGOFETT', 'Jango Fett'],
        ['DENGAR', 'Dengar'],
        ['THEMANDALORIAN', 'The Mandalorian']
      ]),
      tierFit: 'Challenge tiers with substantially more investment',
      strategy: 'Reach contract quickly, use Bossk’s recovery to stabilize, and save Mandalorian’s disintegrate for key threats.',
      sources: [
        source('Rebel Roundup Bounty Hunter guides', 'https://swgoh.wiki/wiki/Rebel_Roundup')
      ]
    },
    {
      category: 'Easiest',
      name: 'Early Imperial Troopers',
      units: units([
        ['VEERS', 'General Veers'],
        ['ADMIRALPIETT', 'Admiral Piett'],
        ['RANGETROOPER', 'Range Trooper'],
        ['COLONELSTARCK', 'Colonel Starck'],
        ['SNOWTROOPER', 'Snowtrooper']
      ]),
      tierFit: 'Can reach Challenge Tier I at modest gear',
      strategy: 'Speed on Piett starts the loop. Mark Dark Trooper or Starck and avoid allowing a Rebel counterattack.',
      sources: [
        source('Rebel Roundup community guide index', 'https://swgoh.wiki/wiki/Rebel_Roundup')
      ]
    },
    {
      category: 'Budget',
      name: 'Legacy Bounty Hunters',
      units: units([
        ['BOSSK', 'Bossk'],
        ['BOBAFETT', 'Boba Fett'],
        ['DENGAR', 'Dengar'],
        ['IG88', 'IG-88'],
        ['GREEDO', 'Greedo']
      ]),
      tierFit: 'Bonus and Mythic tiers',
      strategy: 'Bossk’s leadership sustains the squad; use Boba and Dengar to control dangerous Rebels.',
      caveat: 'Requires much more gear than Troopers to push Challenge tiers.',
      sources: [
        source('Rebel Roundup legacy guides', 'https://swgoh.wiki/wiki/Rebel_Roundup')
      ]
    }
  ],

  NODE_EVENT_ASSAULT_INQUISITOR: [
    {
      category: 'Strongest',
      name: 'Reva Inquisitorius',
      units: units([
        ['THIRDSISTER', 'Third Sister'],
        ['GRANDINQUISITOR', 'Grand Inquisitor'],
        ['SEVENTHSISTER', 'Seventh Sister'],
        ['FIFTHBROTHER', 'Fifth Brother'],
        ['NINTHSISTER', 'Ninth Sister']
      ]),
      tierFit: 'Safest Challenge Tier III option',
      strategy: 'Reva absorbs the opening pressure while the squad stacks Purge and controls each wave.',
      caveat: 'Powerful but not necessary; Grand Inquisitor can clear without Reva.',
      sources: [
        source('Fanatical Devotion event reference', 'https://swgoh.wiki/wiki/Fanatical_Devotion')
      ]
    },
    {
      category: 'Most used',
      name: 'Grand Inquisitor squad',
      units: units([
        ['GRANDINQUISITOR', 'Grand Inquisitor'],
        ['SECONDSISTER', 'Second Sister'],
        ['FIFTHBROTHER', 'Fifth Brother'],
        ['SEVENTHSISTER', 'Seventh Sister'],
        ['NINTHSISTER', 'Ninth Sister']
      ]),
      tierFit: 'Proven Challenge Tier III clear',
      strategy: 'Feed finishing blows to Grand Inquisitor with the event ability so permanent offense stacks across waves.',
      sources: [
        source('Grand Inquisitor CT3 guide', 'https://www.youtube.com/watch?v=olHtrhmx8Yg'),
        source('Fanatical Devotion reference', 'https://swgoh.gg/events/EVENT_ASSAULT_INQUISITOR/')
      ]
    },
    {
      category: 'Budget',
      name: 'Tusken tribe',
      units: units([
        ['TUSKENCHIEFTAIN', 'Tusken Chieftain'],
        ['TUSKENHUNTRESS', 'Tusken Warrior'],
        ['TUSKENRAIDER', 'Tusken Raider'],
        ['TUSKENSHAMAN', 'Tusken Shaman'],
        ['URORRURRR', 'URoRRuR’R’R']
      ]),
      tierFit: 'Community clears through Challenge Tier II',
      strategy: 'Build momentum stacks and damage-over-time effects while Chieftain keeps the tribe moving.',
      caveat: 'A dependable Challenge Tier III clear is not established.',
      sources: [
        source('Fanatical Devotion community guides', 'https://swgoh.wiki/wiki/Fanatical_Devotion')
      ]
    },
    {
      category: 'Easiest',
      name: 'Fifth Brother Inquisitorius',
      units: units([
        ['FIFTHBROTHER', 'Fifth Brother'],
        ['SECONDSISTER', 'Second Sister'],
        ['SEVENTHSISTER', 'Seventh Sister'],
        ['EIGHTHBROTHER', 'Eighth Brother'],
        ['NINTHSISTER', 'Ninth Sister']
      ]),
      tierFit: 'Pre–Grand Inquisitor option for early tiers',
      strategy: 'Stack Purge, use the event ability to take bonus turns, and let Ninth Sister absorb pressure while the attackers ramp.',
      caveat: 'Grand Inquisitor or Reva is recommended for the Challenge tiers.',
      sources: [
        source('Fanatical Devotion requirements and mechanics', 'https://swgoh.wiki/wiki/Fanatical_Devotion')
      ]
    }
  ],

  NODE_EVENT_ASSAULT_DUEL_OF_THE_FATES: [
    {
      category: 'Required',
      name: 'Duel duo',
      units: units([
        ['PADAWANOBIWAN', 'Padawan Obi-Wan'],
        ['MASTERQUIGON', 'Master Qui-Gon']
      ]),
      tierFit: 'Fixed composition; Tier VI requires Relic 9',
      strategy: 'Use strong speed and offense mods, cleanse Maul’s debuffs, and carry key cooldowns into each wave.',
      caveat: 'The battle category can also admit Qui-Gon Jinn, but tier access is tied to the featured duo’s progression.',
      sources: [
        source('Launch notes and rewards', 'https://swgoh.gg/news/update-620-duel-of-fates-assault-battle/'),
        source('First-look strategy guide', 'https://www.youtube.com/watch?v=a3lY5vzMFO0'),
        source('SWGOH Wiki event reference', 'https://swgoh.wiki/wiki/Duel_of_the_Fates')
      ]
    }
  ],

  NODE_EVENT_ASSAULT_PERIDEA_PATROL: [
    {
      category: 'Required',
      name: 'Peridea trio',
      units: units([
        ['CAPTAINENOCH', 'Captain Enoch'],
        ['DEATHTROOPERPERIDEA', 'Death Trooper (Peridea)'],
        ['NIGHTTROOPER', 'Night Trooper']
      ]),
      tierFit: 'Fixed composition; Tier VI requires Relic 9',
      strategy: 'Prioritize speed and potency, build Blight deliberately, and time Enoch’s recovery around enemy cleanses.',
      caveat: 'Community reports describe heavy RNG and inconsistent Blight interactions.',
      sources: [
        source('Peridea Patrol event reference', 'https://swgoh.wiki/wiki/Peridea_Patrol'),
        source('Blight interaction report', 'https://forums.ea.com/idea/swgoh-bug-reports-en/peridea-assault-battle-tier-1/12552627'),
        source('Tier VI reward-odds discussion', 'https://forums.ea.com/discussions/swgoh-general-discussion-en/can-cg-please-confirm-the-drop-rates-for-tier-6-peridea-patrol-assault-battles/5047201')
      ]
    }
  ]
};

function units(entries) {
  return entries.map(([id, name]) => ({ id, name }));
}

function source(label, url) {
  return { label, url };
}
