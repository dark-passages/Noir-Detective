/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterTemplate, LocationTemplate, MethodTemplate, MotiveTemplate } from '../types/game';
import { EXTRA_CHARACTERS, EXTRA_LOCATIONS } from './worldData';

export const RULESET_VERSION = '1.1.0';
export const AGENCY_NAME = 'Hudson Detective Agency';
export const AGENCY_FULL_NAME = 'The Hudson Detective Agency';

export const CORE_CHARACTERS: CharacterTemplate[] = [
  {
    id: 'mara_vance',
    name: 'Mara Vance',
    alias: 'The Heiress',
    title: 'High Society Heiress',
    ageBand: 'young_adult',
    publicPersona: 'A charming socialite known for extravagant parties and sudden engagements to wealthy suitors.',
    biography: 'Mara grew up in old money that vanished after the crash. She navigates elite society with poise, hunting for financial security through wills and inheritances. She avoids physical violence and prefers discreet methods.',
    traits: ['calculating', 'poised', 'status-conscious', 'evasive'],
    goals: ['Secure an undisputed inheritance', 'Keep creditors away from her family name'],
    fears: ['Public bankruptcy', 'Scandal in the society pages'],
    personalCode: ['Never dirty your own gloves if money or poison can do the work'],
    skills: ['social_engineering', 'poison_handling', 'document_forgery'],
    resources: ['private_suite_key', 'society_connections', 'trust_account'],
    routineLocations: ['grand_hotel', 'grand_hotel2', 'blue_dahlia_club', 'velvet_lounge'],
    routine: [
      { locationId: 'grand_hotel', timeWindow: '19:30-21:00', frequency: 'nightly', visitReason: 'Evening cocktail hour in the mezzanine lounge' },
      { locationId: 'blue_dahlia_club', timeWindow: '21:00-23:30', frequency: 'frequent', visitReason: 'Private supper booth with wealthy benefactors' }
    ],
    preferredMethods: ['brandy_poison', 'silk_garrote', 'arsenic_tonic', 'pocket_derringer', 'letter_opener'],
    avoidedMethods: ['brass_candlestick', 'snub_revolver'],
    relationships: [
      { characterId: 'victor_malone', relationshipType: 'creditor', strength: 8 },
      { characterId: 'silas_thorne', relationshipType: 'confidant', strength: 6 },
      { characterId: 'beatrice_fontaine', relationshipType: 'rival', strength: 7 }
    ],
    voice: 'posh',
    dialogueVoice: {
      formality: 'formal',
      verbosity: 'measured',
      vocabulary: 'refined, aristocratic, subtly condescending',
      verbalHabits: 'Refers to detectives as "my good man" and sighs before answering pointed questions.'
    },
    roleEligibility: ['victim', 'culprit', 'suspect', 'witness', 'corroborator'],
    secrets: ['Deeply in debt to loan sharks', 'Falsified her family trust papers'],
    avatarStyle: {
      collar: 'Fur Stole',
      tint: '#D4AF37',
      silhouette: 'woman_glamour',
      hat: 'Cloche Hat'
    }
  },
  {
    id: 'victor_malone',
    name: 'Victor "Slick" Malone',
    alias: 'The Club Owner',
    title: 'Proprietor of The Velvet Lounge',
    ageBand: 'middle_aged',
    publicPersona: 'Smooth-talking nightclub boss who claims his business is 100% legitimate.',
    biography: 'Malone worked his way up from dockworker to nightclub impresario. He knows every corrupt alderman in the city and runs high-stakes poker games in the cellar. Quick with a threat when crossed.',
    traits: ['intimidating', 'territorial', 'pragmatic', 'sharp-eyed'],
    goals: ['Protect syndicate cash flow', 'Silence federal informants'],
    fears: ['A federal indictment', 'Loosing control of the Waterfront rackets'],
    personalCode: ['Debts are paid in cash or in blood; never talk to a cop without leverage'],
    skills: ['marksmanship', 'intimidation', 'street_smarts', 'lock_bypass'],
    resources: ['speakeasy_safe', 'unregistered_firearm', 'bouncer_retinue'],
    voice: 'gruff',
    assignedLocationId: 'velvet_lounge',
    shiftHours: { open: '18:00', close: '03:00' },
    routineLocations: ['velvet_lounge', 'harbor_warehouse', 'pier_four', 'boxing_gym', 'blue_dahlia_club'],
    routine: [
      { locationId: 'velvet_lounge', timeWindow: '18:00-03:00', frequency: 'nightly', visitReason: 'Running evening bar receipts and backroom tables at The Velvet Lounge' },
      { locationId: 'harbor_warehouse', timeWindow: '10:30-11:30', frequency: 'occasional', visitReason: 'Checking imported liquor crates stored at Warehouse No. 6' },
      { locationId: 'pier_four', timeWindow: '22:30-23:45', frequency: 'occasional', visitReason: 'Inspecting imported liquor crates off the river barges' }
    ],
    preferredMethods: ['snub_revolver', 'brass_candlestick', 'service_automatic', 'bar_bottle', 'dock_hook', 'heavy_pipe', 'iron_crowbar'],
    avoidedMethods: ['brandy_poison', 'morphine_overdose'],
    relationships: [
      { characterId: 'beatrice_fontaine', relationshipType: 'accomplice', strength: 9 },
      { characterId: 'officer_omalley', relationshipType: 'informant', strength: 8 },
      { characterId: 'mara_vance', relationshipType: 'creditor', strength: 7 }
    ],
    dialogueVoice: {
      formality: 'street',
      verbosity: 'terse',
      vocabulary: 'clipped underworld slang, blunt warnings',
      verbalHabits: 'Calls people "pal" or "gumshoe" and deflects with dry sarcasm.'
    },
    roleEligibility: ['victim', 'culprit', 'suspect', 'witness', 'corroborator'],
    secrets: ['Laundering syndicate counterfeit cash', 'Bribing precinct captains'],
    avatarStyle: {
      collar: 'Double-breasted Suit',
      tint: '#9B1B30',
      silhouette: 'man_fedora',
      hat: 'Fedora'
    }
  },
  {
    id: 'dr_arthur_pendelton',
    name: 'Dr. Arthur Pendelton',
    alias: 'The Disgraced Doctor',
    title: 'Surgeon & Dispensary Owner',
    ageBand: 'elder',
    publicPersona: 'A nervous, aging physician whose hand sometimes shakes when writing prescriptions.',
    biography: 'Once the chief surgeon at General Hospital, Pendelton was quietly pushed out after a prominent patient died on his table. He now runs a dingy back-alley clinic treating people who cannot go to police hospitals.',
    traits: ['anxious', 'pedantic', 'secretive', 'medical'],
    goals: ['Keep his medical dispensary license', 'Hide past surgical negligence'],
    fears: ['State medical board investigation', 'Withdrawal from tinctures'],
    personalCode: ['Keep clinical records locked and avoid loud confrontations'],
    skills: ['pharmacology', 'anatomy', 'toxicology', 'sedation'],
    resources: ['narcotics_cabinet', 'clinic_keys', 'medical_bag'],
    routineLocations: ['pendelton_clinic', 'city_morgue', 'velvet_lounge'],
    routine: [
      { locationId: 'pendelton_clinic', timeWindow: '18:00-21:00', frequency: 'nightly', visitReason: 'Closing evening dispensary inventory' },
      { locationId: 'city_morgue', timeWindow: '21:00-22:30', frequency: 'occasional', visitReason: 'Consulting old hospital colleagues on death certificates' }
    ],
    preferredMethods: ['morphine_overdose', 'brandy_poison', 'arsenic_tonic', 'surgical_scalpel', 'bone_saw'],
    avoidedMethods: ['brass_candlestick', 'snub_revolver'],
    relationships: [
      { characterId: 'evelyn_cross', relationshipType: 'blackmailer', strength: 8 },
      { characterId: 'father_callahan', relationshipType: 'confidant', strength: 6 }
    ],
    voice: 'nervous',
    dialogueVoice: {
      formality: 'academic',
      verbosity: 'effusive',
      vocabulary: 'clinical terminology, hesitant apologies',
      verbalHabits: 'Adjusts spectacles and repeats "I assure you, strictly therapeutic."'
    },
    assignedLocationId: 'pendelton_clinic',
    shiftHours: { open: '08:00', close: '22:00' },
    roleEligibility: ['victim', 'culprit', 'suspect', 'witness', 'corroborator'],
    secrets: ['Addicted to his own medicinal tinctures', 'Forged death certificates for money'],
    avatarStyle: {
      collar: 'Lab Coat & Vest',
      tint: '#4A6984',
      silhouette: 'man_glasses'
    }
  },
  {
    id: 'evelyn_cross',
    name: 'Evelyn Cross',
    alias: 'The Clarion Reporter',
    title: 'Investigative Journalist',
    ageBand: 'young_adult',
    publicPersona: 'Sharp-tongued reporter with ink on her cuffs and a smoke perpetually lit.',
    biography: 'Evelyn has broken the city’s dirtiest scandals. She carries a notebook crammed with blackmail and police wiretaps. She has no patience for phonies and will cross legal boundaries for a front-page scoop.',
    traits: ['inquisitive', 'cynical', 'resourceful', 'ambitious'],
    goals: ['Break the city corruption front-page story', 'Protect her confidential informants'],
    fears: ['Being scooped or silenced by the syndicate', 'Losing her press credentials'],
    personalCode: ['Every alibi has a crack if you press hard enough'],
    skills: ['investigation', 'stealth', 'wiretapping', 'close_quarters'],
    resources: ['press_pass', 'city_hall_leaks', 'camera_and_notes'],
    routineLocations: ['clarion_newsroom', 'starlight_radio', 'city_hall', 'cobblestone_alley'],
    routine: [
      { locationId: 'clarion_newsroom', timeWindow: '18:30-21:00', frequency: 'nightly', visitReason: 'Filing midnight edition galley proofs' },
      { locationId: 'city_hall', timeWindow: '21:00-22:30', frequency: 'frequent', visitReason: 'Checking public property ledgers with late clerks' }
    ],
    preferredMethods: ['bone_dagger', 'silk_garrote', 'letter_opener', 'electrical_cable', 'bar_ice_pick', 'heavy_typewriter', 'heavy_desk_ornament'],
    avoidedMethods: ['morphine_overdose'],
    relationships: [
      { characterId: 'dr_arthur_pendelton', relationshipType: 'blackmailer', strength: 8 },
      { characterId: 'officer_omalley', relationshipType: 'rival', strength: 7 }
    ],
    voice: 'cynical',
    dialogueVoice: {
      formality: 'clipped',
      verbosity: 'terse',
      vocabulary: 'newsroom jargon, punchy cynicism',
      verbalHabits: 'Checks her wristwatch and replies with counter-questions.'
    },
    assignedLocationId: 'clarion_newsroom',
    shiftHours: { open: '10:00', close: '22:00' },
    roleEligibility: ['victim', 'culprit', 'suspect', 'witness', 'corroborator'],
    secrets: ['Blackmailing city hall officials', 'Stole police evidence room logs'],
    avatarStyle: {
      collar: 'Trenchcoat Lapel',
      tint: '#7E827A',
      silhouette: 'woman_reporter',
      hat: 'Fedora with Press Tag'
    }
  },
  {
    id: 'silas_thorne',
    name: 'Silas Thorne',
    alias: 'The Antiquarian',
    title: 'Owner of Blackwood Antiquities',
    ageBand: 'elder',
    publicPersona: 'Eccentric collector of rare relics, pre-war clocks, and sacred curiosities.',
    biography: 'Thorne speaks in whispers and appraises private collections. Behind closed doors, he acts as a fence for stolen jewelry, heirlooms, and historical artifacts smuggled from transatlantic liners.',
    traits: ['meticulous', 'secretive', 'cultured', 'opportunistic'],
    goals: ['Acquire rare estate collections before probate', 'Conceal smuggled freight provenance'],
    fears: ['Customs seizure of his vault', 'Exposure of forged estate appraisals'],
    personalCode: ['Everything has a price and an older provenance'],
    skills: ['appraisal', 'smuggling_logistics', 'blade_handling', 'document_forgery'],
    resources: ['antique_vault', 'customs_contacts', 'private_ledgers'],
    routineLocations: ['blackwood_antiquities', 'st_judes', 'harbor_warehouse'],
    routine: [
      { locationId: 'blackwood_antiquities', timeWindow: '18:00-20:45', frequency: 'nightly', visitReason: 'Cataloguing estate consignments after shop hours' },
      { locationId: 'st_judes', timeWindow: '21:00-22:00', frequency: 'occasional', visitReason: 'Inspecting parish brass and vestry restoration pieces' }
    ],
    preferredMethods: ['bone_dagger', 'brass_candlestick', 'letter_opener', 'brass_lamp', 'heavy_desk_ornament', 'fillet_knife', 'kitchen_cleaver'],
    avoidedMethods: ['snub_revolver', 'morphine_overdose'],
    relationships: [
      { characterId: 'mara_vance', relationshipType: 'confidant', strength: 6 },
      { characterId: 'father_callahan', relationshipType: 'creditor', strength: 7 }
    ],
    voice: 'posh',
    dialogueVoice: {
      formality: 'formal',
      verbosity: 'measured',
      vocabulary: 'archaic, curatorial metaphors',
      verbalHabits: 'Pauses to admire craftsmanship and speaks in hushed tones.'
    },
    assignedLocationId: 'blackwood_antiquities',
    shiftHours: { open: '09:00', close: '21:30' },
    roleEligibility: ['victim', 'culprit', 'suspect', 'witness', 'corroborator'],
    secrets: ['Possesses stolen museum relics', 'Holding forged will documents'],
    avatarStyle: {
      collar: 'Velvet Smoking Jacket',
      tint: '#614051',
      silhouette: 'man_beard',
      hat: 'Bowler'
    }
  },
  {
    id: 'father_callahan',
    name: 'Father Thomas Callahan',
    alias: 'The Parish Priest',
    title: 'Curate of St. Jude’s',
    ageBand: 'middle_aged',
    publicPersona: 'A somber priest who walks the foggy docks offering prayers to the destitute.',
    biography: 'Callahan’s church is drowning in debt. He hears everyone’s confessions, including mobsters seeking absolution. He carries a heavy burden and knows secrets that could burn down half the municipal council.',
    traits: ['burdened', 'solemn', 'guarded', 'observant'],
    goals: ['Save the parish building from foreclosure', 'Protect his brother from dockside debts'],
    fears: ['Violating the seal of confession', 'Foreclosure by private creditors'],
    personalCode: ['Confession is sacred, even when it stains your own conscience'],
    skills: ['pastoral_trust', 'dock_navigation', 'heavy_blunt'],
    resources: ['church_vestry_keys', 'dockworker_goodwill'],
    routineLocations: ['st_judes', 'riverside_chapel', 'pier_four', 'union_hall'],
    routine: [
      { locationId: 'st_judes', timeWindow: '18:00-20:30', frequency: 'nightly', visitReason: 'Evening vespers and locking the sanctuary' },
      { locationId: 'riverside_chapel', timeWindow: '20:45-22:15', frequency: 'frequent', visitReason: 'Harbor parish outreach near the docks' }
    ],
    preferredMethods: ['brass_candlestick', 'silk_garrote', 'fire_poker', 'wrench', 'fillet_knife'],
    avoidedMethods: ['morphine_overdose', 'snub_revolver'],
    relationships: [
      { characterId: 'silas_thorne', relationshipType: 'creditor', strength: 7 },
      { characterId: 'dr_arthur_pendelton', relationshipType: 'confidant', strength: 6 }
    ],
    voice: 'defensive',
    dialogueVoice: {
      formality: 'formal',
      verbosity: 'measured',
      vocabulary: 'moralistic, measured cadence',
      verbalHabits: 'Folds his hands and murmurs "God forgive us" when pressed.'
    },
    assignedLocationId: 'st_judes',
    shiftHours: { open: '06:00', close: '22:30' },
    roleEligibility: ['victim', 'culprit', 'suspect', 'witness', 'corroborator'],
    secrets: ['Embezzled parish renovation funds to pay brother’s debt', 'Concealing a confession of murder'],
    avatarStyle: {
      collar: 'Clerical Collar',
      tint: '#3C4048',
      silhouette: 'man_priest'
    }
  },
  {
    id: 'beatrice_fontaine',
    name: 'Beatrice Fontaine',
    alias: 'The Torch Singer',
    title: 'Headliner at The Velvet Lounge',
    ageBand: 'young_adult',
    publicPersona: 'A sultry jazz vocalist whose voice draws the city’s wealthiest and most dangerous men.',
    biography: 'Beatrice has seen too much and trusted too many men. She keeps a locked diary of lovers and contracts. When pushed into a corner, she protects herself with fierce desperation.',
    traits: ['guarded', 'perceptive', 'fierce', 'charismatic'],
    goals: ['Break free from Malone’s exclusive contract', 'Safeguard her private ledger'],
    fears: ['Syndicate retaliation', 'Blackmail over her secret marriage'],
    personalCode: ['Never trust a man in a custom suit when the lights go dim'],
    skills: ['social_engineering', 'poison_handling', 'stealth'],
    resources: ['backstage_access', 'locked_diary', 'high_society_patrons'],
    routineLocations: ['velvet_lounge', 'starlight_radio', 'blue_dahlia_club', 'grand_hotel'],
    routine: [
      { locationId: 'velvet_lounge', timeWindow: '20:00-22:30', frequency: 'nightly', visitReason: 'Headlining the nine-thirty and eleven o’clock sets' },
      { locationId: 'starlight_radio', timeWindow: '18:30-19:45', frequency: 'occasional', visitReason: 'Late evening radio transcription session' }
    ],
    preferredMethods: ['brandy_poison', 'silk_garrote', 'pocket_derringer', 'bar_ice_pick', 'electrical_cable', 'bar_bottle'],
    avoidedMethods: ['brass_candlestick', 'snub_revolver'],
    relationships: [
      { characterId: 'victor_malone', relationshipType: 'accomplice', strength: 9 },
      { characterId: 'mara_vance', relationshipType: 'rival', strength: 7 }
    ],
    voice: 'cynical',
    dialogueVoice: {
      formality: 'street',
      verbosity: 'terse',
      vocabulary: 'smoky nightclub wit, sharp metaphors',
      verbalHabits: 'Exhales smoke slowly before delivering a cutting remark.'
    },
    assignedLocationId: 'velvet_lounge',
    shiftHours: { open: '19:30', close: '02:00' },
    roleEligibility: ['victim', 'culprit', 'suspect', 'witness', 'corroborator'],
    secrets: ['Secretly married to the syndicate financier', 'Extorting an oil tycoon lover'],
    avatarStyle: {
      collar: 'Silk Halter & Pearls',
      tint: '#9E4770',
      silhouette: 'woman_singer'
    }
  },
  {
    id: 'officer_omalley',
    name: 'Officer Frank O’Malley',
    alias: 'The Beat Cop',
    title: 'Precinct 4 Patrolman',
    ageBand: 'middle_aged',
    publicPersona: 'Burly beat cop twirling a nightstick, greeting shopkeepers along the avenue.',
    biography: 'Twenty years on the force has taught O’Malley when to look away and when to collect his weekly envelope from Malone. He knows every alleyway, back door, and garbage route in the district.',
    traits: ['observant', 'corruptible', 'methodical', 'blunt'],
    goals: ['Protect his precinct pension', 'Hide his back-alley payoffs'],
    fears: ['Internal Affairs audit', 'Being tied to a syndicate homicide'],
    personalCode: ['Keep the beat quiet and keep your badge clean on paper'],
    skills: ['marksmanship', 'heavy_blunt', 'alley_navigation', 'patrol_logs'],
    resources: ['service_revolver', 'precinct_keys', 'dispatch_access'],
    routineLocations: ['cobblestone_alley', 'service_alley', 'central_railway', 'clarion_newsroom'],
    routine: [
      { locationId: 'cobblestone_alley', timeWindow: '20:00-21:45', frequency: 'nightly', visitReason: 'Walking the Midtown-to-Gutters foot patrol beat' },
      { locationId: 'central_railway', timeWindow: '22:00-23:00', frequency: 'frequent', visitReason: 'Checking late-night concourse lockups' }
    ],
    preferredMethods: ['brass_candlestick', 'snub_revolver', 'service_automatic', 'heavy_pipe', 'iron_crowbar', 'utility_knife', 'training_dumbbell', 'jump_rope'],
    avoidedMethods: ['morphine_overdose', 'brandy_poison'],
    relationships: [
      { characterId: 'victor_malone', relationshipType: 'informant', strength: 8 },
      { characterId: 'evelyn_cross', relationshipType: 'rival', strength: 7 }
    ],
    voice: 'gruff',
    dialogueVoice: {
      formality: 'clipped',
      verbosity: 'terse',
      vocabulary: 'police procedural slang, brusque authority',
      verbalHabits: 'Taps his nightstick on his palm and cites precinct regulation numbers.'
    },
    assignedLocationId: 'precinct_four',
    shiftHours: { open: '16:00', close: '02:00' },
    roleEligibility: ['victim', 'culprit', 'suspect', 'witness', 'corroborator', 'staff'],
    secrets: ['Moonlighting as an enforcer for Malone', 'Tampered with police dispatch logs'],
    avatarStyle: {
      collar: 'Police Badge & Coat',
      tint: '#1C3144',
      silhouette: 'man_cop',
      hat: 'Police Visor'
    }
  }
];

export const MASTER_CHARACTERS: CharacterTemplate[] = [
  ...CORE_CHARACTERS,
  ...EXTRA_CHARACTERS
];

export const CORE_LOCATIONS: LocationTemplate[] = [
  {
    id: 'agency',
    name: AGENCY_FULL_NAME,
    district: 'Midtown District',
    description: 'Your second-floor private detective office in Suite 312. The frosted glass door bearing "Hudson Detective Agency" rattles with the elevated train, and street rain streaks the venetian blinds.',
    mapCoords: { x: 49, y: 45 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['detective_key'],
    staffRoles: ['Private Detective'],
    regularVisitorTags: ['client', 'informant'],
    naturalWeapons: ['snub_revolver', 'letter_opener', 'heavy_desk_ornament', 'heavy_typewriter', 'service_automatic'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    pointsOfInterest: [
      { coords: { top: 36, left: 95 }, label: 'Case File Cabinet', description: 'One drawer stands open a finger’s width; a card has been removed from the alphabetical index.', clueRewardId: 'missing_case_card' },
      { coords: { top: 60, left: 90 }, label: 'Visitor’s Chair', description: 'A damp crescent on the seat suggests someone waited here in a rain-soaked coat.' },
      { coords: { top: 65, left: 10 }, label: 'Window Ledge', description: 'A cigarette stub rests in the ash, though the agency forbids smoking indoors.' }
    ],
    connectedRoads: ['grand_hotel', 'silver_spoon_diner', 'mercer_apothecary', 'pendelton_clinic', 'taxi_garage', 'crown_barbershop', 'laundry_works', 'velvet_lounge'],
    locationTags: ['office', 'midtown', 'headquarters'],
    isPublic: false,
    icon: 'Briefcase'
  },
  {
    id: 'grand_hotel',
    name: 'The Grand St. Moritz Hotel',
    district: 'Uptown Promenade',
    description: 'A gilded luxury hotel catering to industrialists and foreign diplomats. Heavy velvet drapes and polished Italian marble mask private indiscretions.',
    mapCoords: { x: 39, y: 22 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['public_lobby', 'guest_register'],
    staffRoles: ['Concierge', 'Maid'],
    regularVisitorTags: ['socialite', 'reporter', 'diplomat'],
    naturalWeapons: ['brandy_poison', 'silk_garrote', 'brass_lamp', 'fire_poker', 'pocket_derringer'],
    neverNaturalWeapons: ['morphine_overdose', 'bone_dagger'],
    pointsOfInterest: [
      { coords: { top: 44, left: 34 }, label: 'Concierge Key Pigeonholes', description: 'A brass suite key sits misaligned in Slot 408 beside a torn register corner.', clueRewardId: 'hotel_ledger_key' },
      { coords: { top: 64, left: 72 }, label: 'Mezzanine Palm Planter', description: 'Discarded foil from an expensive brand of cognac rests behind the urn.' }
    ],
    connectedRoads: ['university_hall', 'marigold_florist', 'savile_tailors', 'silver_spoon_diner', 'agency', 'central_railway'],
    locationTags: ['hotel', 'uptown', 'luxury'],
    icon: 'Building'
  },
  {
    id: 'grand_hotel2',
    name: 'The Starlight Grand Hotel',
    district: 'Midtown Promenade',
    description: 'A chandeliered lobby gleams with polished marble and soft golden light, masking the stale perfume of the night before. Elevators glide soundlessly past a bar where the piano player knows when not to ask questions.',
    icon: 'Hotel',
    mapCoords: { x: 91, y: 44 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['public_lobby'],
    connectedRoads: ['bus_depot', 'starlight_radio', 'blue_dahlia_club'],
    staffRoles: ['Night Manager', 'Bellhop', 'Elevator Operator', 'Housekeeper', 'Bartender'],
    regularVisitorTags: ['socialite', 'entertainer'],
    naturalWeapons: ['brandy_poison', 'silk_garrote', 'bar_ice_pick', 'brass_lamp', 'bar_bottle', 'pocket_derringer'],
    neverNaturalWeapons: ['dock_hook', 'morphine_overdose'],
    locationTags: ['hotel', 'midtown', 'nightlife'],
    pointsOfInterest: [
      { coords: { top: 38, left: 30 }, label: 'Room 614 Writing Desk', description: 'The blotter is clean except for a shallow impression left by a note written on the sheet above.', clueRewardId: 'impressed_note' },
      { coords: { top: 65, left: 74 }, label: 'Service Elevator', description: 'A smear of dark grease marks the brass rail, and the floor indicator sticks between levels.' },
      { coords: { top: 24, left: 52 }, label: 'Lobby Coat Check', description: 'A claim ticket has been torn in half; the matching stub is nowhere in the rack.' }
    ]
  },
  {
    id: 'velvet_lounge',
    name: 'The Velvet Lounge',
    district: 'Downtown Theatre Row',
    description: 'A subterranean speakeasy filled with cigarette smoke, jazz saxophone riffs, and frosted highballs. Behind the red curtain lies Malone’s private office.',
    mapCoords: { x: 76, y: 67 },
    openingHours: { open: '18:00', close: '03:00' },
    accessRules: ['speakeasy_door'],
    staffRoles: ['Bartender', 'Bouncer'],
    regularVisitorTags: ['mobster', 'singer', 'socialite'],
    naturalWeapons: ['brandy_poison', 'snub_revolver', 'silk_garrote', 'bar_bottle', 'bar_ice_pick', 'pocket_derringer'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    connectedRoads: ['agency', 'harborview_restaurant', 'cobblestone_alley', 'crimson_cabaret', 'liberty_theater'],
    locationTags: ['nightclub', 'speakeasy', 'underworld'],
    pointsOfInterest: [
      { coords: { top: 46, left: 32 }, label: 'Red Curtain Service Rail', description: 'A bartender’s stamped highball tally bears an unpaid private booth initial.', clueRewardId: 'velvet_backroom_chit' },
      { coords: { top: 68, left: 68 }, label: 'Stage Piano Bench', description: 'Fresh piano-tuner rosin and a scratched brass cufflink clasp mark the varnish.' }
    ],
    icon: 'Wine'
  },
  {
    id: 'st_judes',
    name: 'St. Jude’s Belltower & Chapel',
    district: 'Cathedral Heights',
    description: 'A gothic stone church with towering stained glass and a drafty belltower. Heavy brass votives and candelabras illuminate the quiet shadows.',
    mapCoords: { x: 13, y: 31 },
    openingHours: { open: '06:00', close: '22:30' },
    accessRules: ['parish_sanctuary'],
    staffRoles: ['Caretaker', 'Organist'],
    regularVisitorTags: ['clergy', 'antiquarian'],
    naturalWeapons: ['brass_candlestick', 'fire_poker', 'brass_lamp', 'letter_opener', 'heavy_desk_ornament'],
    neverNaturalWeapons: ['snub_revolver', 'morphine_overdose'],
    pointsOfInterest: [
      { coords: { top: 38, left: 46 }, label: 'Belfry Stairwell Hook', description: 'Coarse hemp rope fibers cling to an iron sconce leading up to the tower.', clueRewardId: 'st_judes_bell_rope' },
      { coords: { top: 68, left: 72 }, label: 'Vestry Donation Box', description: 'A brass padlock hangs scratched around the keyhole.' }
    ],
    connectedRoads: ['trinity_baptist', 'public_library', 'university_hall', 'golden_crust_bakery', 'rosie_deli'],
    locationTags: ['church', 'historic', 'quiet'],
    icon: 'Church'
  },
  {
    id: 'blackwood_antiquities',
    name: 'Blackwood Antiquities & Curios',
    district: 'Old Quarter',
    description: 'A cramped shop packed with grandfather clocks, renaissance manuscripts, and glass display cases filled with heirloom silver and carved artifacts.',
    mapCoords: { x: 15, y: 53 },
    openingHours: { open: '09:00', close: '21:30' },
    accessRules: ['shop_key_after_hours'],
    staffRoles: ['Shop Assistant'],
    regularVisitorTags: ['antiquarian', 'collector'],
    naturalWeapons: ['brass_candlestick', 'bone_dagger', 'letter_opener', 'brass_lamp', 'heavy_desk_ornament', 'fire_poker'],
    neverNaturalWeapons: ['snub_revolver', 'brandy_poison'],
    pointsOfInterest: [
      { coords: { top: 44, left: 52 }, label: 'Velvet Curio Vitrine', description: 'An appraisal string tag hangs loose where a heavy display piece stood.', clueRewardId: 'antiquities_appraisal_tag' },
      { coords: { top: 68, left: 26 }, label: 'Back-Counter Clock Bench', description: 'Jeweler’s loupe and brass tweezers lie set aside in mid-repair.' }
    ],
    connectedRoads: ['golden_crust_bakery', 'rosie_deli', 'pendelton_clinic', 'riverside_chapel', 'fish_market', 'copper_kettle_tavern'],
    locationTags: ['curios', 'antiques', 'commerce'],
    icon: 'Compass'
  },
  {
    id: 'pier_four',
    name: 'Waterfront Pier 4 & Boathouse',
    district: 'Industrial Docklands',
    description: 'Creaking wooden pilings and oily saltwater shrouded in heavy river mist. Crates of imported freight and rusty chain hoists line the fog.',
    mapCoords: { x: 71, y: 89 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['dock_gate'],
    staffRoles: ['Dockmaster', 'Watchman'],
    regularVisitorTags: ['smuggler', 'dockworker', 'clergy'],
    naturalWeapons: ['dock_hook', 'bone_dagger', 'fillet_knife', 'hammer', 'iron_crowbar'],
    neverNaturalWeapons: ['brass_candlestick', 'brandy_poison', 'morphine_overdose'],
    pointsOfInterest: [
      { coords: { top: 52, left: 38 }, label: 'Boathouse Bollard Clipboard', description: 'A salt-speckled wharf tally logs late launch departures.', clueRewardId: 'pier_four_manifest' },
      { coords: { top: 30, left: 72 }, label: 'Rusty Chain Hoist', description: 'Oily tar smudges mark the iron hook above the tide line.' }
    ],
    connectedRoads: ['liberty_theater', 'union_hall', 'customs_house'],
    locationTags: ['docks', 'waterfront', 'smuggling'],
    icon: 'Anchor'
  },
  {
    id: 'pendelton_clinic',
    name: 'Pendelton Dispensary & Surgery',
    district: 'Midtown District',
    description: 'A discreet medical office with frosted apothecary jars, ether fumes, and surgical steel trays behind green curtains.',
    mapCoords: { x: 35, y: 46 },
    openingHours: { open: '08:00', close: '22:00' },
    accessRules: ['clinic_door'],
    staffRoles: ['Nurse', 'Orderly'],
    regularVisitorTags: ['physician', 'patient'],
    naturalWeapons: ['morphine_overdose', 'surgical_scalpel', 'arsenic_tonic', 'brandy_poison'],
    neverNaturalWeapons: ['brass_candlestick', 'snub_revolver', 'bone_dagger'],
    pointsOfInterest: [
      { coords: { top: 46, left: 48 }, label: 'Locked Apothecary Register', description: 'A torn carbon prescription stub pokes out beneath the brass latch.', clueRewardId: 'clinic_prescription_stub' },
      { coords: { top: 68, left: 74 }, label: 'Surgical Instrument Autoclave', description: 'Ether cotton swabs fill a frosted glass basin beside the curtain.' }
    ],
    connectedRoads: ['rosie_deli', 'blackwood_antiquities', 'silver_spoon_diner', 'agency', 'crown_barbershop'],
    locationTags: ['medical', 'clinic', 'pharmacy'],
    icon: 'Stethoscope'
  },
  {
    id: 'clarion_newsroom',
    name: 'The Daily Clarion Press Room',
    district: 'Civic Centre',
    description: 'Deafening Linotype printing presses roaring in the basement, desks littered with ash, telegraph tapes, and freshly typed headlines.',
    mapCoords: { x: 92, y: 22 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['press_lobby'],
    staffRoles: ['Copy Editor', 'Press Operator'],
    regularVisitorTags: ['reporter', 'informant'],
    naturalWeapons: ['silk_garrote', 'letter_opener', 'heavy_typewriter', 'heavy_desk_ornament', 'electrical_cable'],
    neverNaturalWeapons: ['brass_candlestick', 'morphine_overdose', 'dock_hook'],
    pointsOfInterest: [
      { coords: { top: 26, left: 61 }, label: 'Editor’s In-Tray', description: 'A proof sheet bears a pencilled correction in a hand unlike the editor’s.', clueRewardId: 'altered_proof' },
      { coords: { top: 72, left: 28 }, label: 'Reporter’s Desk', description: 'A damp matchbook and a half-written address are wedged beneath the blotter.' },
      { coords: { top: 44, left: 82 }, label: 'City Room Switchboard', description: 'One extension has been disconnected, though its indicator still flashes intermittently.', clueRewardId: 'disconnected_extension' }
    ],
    connectedRoads: ['post_office', 'city_hall', 'bus_depot'],
    locationTags: ['press', 'civic', 'information'],
    icon: 'Newspaper'
  },
  {
    id: 'central_railway',
    name: 'St. Sebastian Central Railway Terminal',
    district: 'Civic Centre',
    description: 'A cavernous Art Deco terminal breathes steam, coal smoke, and the damp wool of late arrivals. Brass clocks glimmer through the haze above a concourse where every footstep seems in a hurry.',
    icon: 'Train',
    mapCoords: { x: 72, y: 32 },
    openingHours: { open: '05:00', close: '01:00' },
    accessRules: ['public_concourse'],
    connectedRoads: ['grand_hotel', 'continental_bank', 'city_hall', 'bus_depot', 'mercer_apothecary', 'taxi_garage', 'starlight_radio', 'blue_dahlia_club'],
    staffRoles: ['Station Master', 'Luggage Porter', 'Ticket Inspector', 'Newsstand Vendor'],
    regularVisitorTags: ['traveler', 'commuter'],
    naturalWeapons: ['heavy_pipe', 'utility_knife', 'silk_garrote', 'wrench', 'iron_crowbar'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    locationTags: ['transit', 'civic', 'public'],
    pointsOfInterest: [
      { coords: { top: 34, left: 24 }, label: 'Victim’s Luggage Locker', description: 'A lock hangs bent outward; inside, a ticket stub is tucked beneath a folded newspaper.', clueRewardId: 'railway_ticket_stub' },
      { coords: { top: 18, left: 72 }, label: 'Brass Arrival Clock', description: 'The clock has stopped several minutes behind the stationmaster’s official time.' },
      { coords: { top: 68, left: 49 }, label: 'Platform Ashtray', description: 'A fresh lipstick mark rims one cigarette butt among a drift of cold ash.', clueRewardId: 'lipstick_cigarette' }
    ]
  },
  {
    id: 'blue_dahlia_club',
    name: 'The Blue Dahlia Supper Club',
    district: 'Midtown Promenade',
    description: 'Blue spotlights wash the dance floor while a trumpet sighs through curtains of cigarette smoke. Behind the velvet booths, a narrow service corridor leads to the kitchen and the alley beyond.',
    icon: 'Music',
    mapCoords: { x: 92, y: 56 },
    openingHours: { open: '18:00', close: '02:30' },
    accessRules: ['club_reservation'],
    connectedRoads: ['central_railway', 'grand_hotel2', 'harborview_restaurant', 'crimson_cabaret'],
    staffRoles: ['Club Owner', 'Band Leader', 'Head Waiter', 'Cloakroom Attendant', 'Dishwasher'],
    regularVisitorTags: ['socialite', 'entertainer', 'mobster'],
    naturalWeapons: ['brandy_poison', 'silk_garrote', 'bar_bottle', 'kitchen_cleaver', 'kitchen_knife', 'bar_ice_pick', 'pocket_derringer'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    locationTags: ['nightclub', 'supper_club', 'midtown'],
    pointsOfInterest: [
      { coords: { top: 42, left: 36 }, label: 'Velvet Booth Seven', description: 'A torn dance card lies beneath the seat, with one name circled twice.', clueRewardId: 'marked_dance_card' },
      { coords: { top: 76, left: 68 }, label: 'Kitchen Service Door', description: 'The door’s latch is freshly scratched, and a damp shoeprint points toward the alley.' },
      { coords: { top: 28, left: 81 }, label: 'Bandstand Music Stand', description: 'A set list has been altered in pencil; the final number was crossed out after midnight.' }
    ]
  },
  {
    id: 'boxing_gym',
    name: 'Marty Doyle’s Ninth-Round Boxing Club',
    district: 'The Gutters',
    description: 'Bare bulbs swing over a canvas ring stained with sweat and old blood. The air is thick with liniment, damp leather, and the hard silence of men waiting for their turn.',
    icon: 'Dumbbell',
    mapCoords: { x: 34, y: 67 },
    openingHours: { open: '07:00', close: '23:00' },
    accessRules: ['gym_membership'],
    connectedRoads: ['crown_barbershop', 'tenement_court', 'copper_kettle_tavern', 'riverside_chapel', 'fish_market'],
    staffRoles: ['Promoter', 'Trainer', 'Cut Man', 'Boxer', 'Doorman'],
    regularVisitorTags: ['enforcer', 'gambler'],
    naturalWeapons: ['training_dumbbell', 'jump_rope', 'heavy_pipe', 'iron_crowbar', 'snub_revolver'],
    neverNaturalWeapons: ['morphine_overdose', 'brandy_poison'],
    locationTags: ['sports', 'gutters', 'underworld'],
    pointsOfInterest: [
      { coords: { top: 46, left: 50 }, label: 'Ring Corner Stool', description: 'A stool leg is freshly splintered; a fleck of pale paint clings to the break.' },
      { coords: { top: 72, left: 23 }, label: 'Trainer’s Medicine Cabinet', description: 'Liniment bottles stand in neat rows, but one compartment has been wiped clean.', clueRewardId: 'empty_medicine_slot' },
      { coords: { top: 24, left: 76 }, label: 'Locker 12', description: 'The locker door is ajar. Inside, a clean shirt hides a folded betting slip.' }
    ]
  },
  {
    id: 'service_alley',
    name: 'Morrow Street Service Alley',
    district: 'Industrial Docklands',
    description: 'Rainwater runs black between the cobbles beneath fire escapes and sagging telephone wires. A single amber security lamp leaves the loading bays in deep, convenient shadow.',
    icon: 'Footprints',
    mapCoords: { x: 32, y: 89 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['public_alley'],
    connectedRoads: ['copper_kettle_tavern', 'textile_mill', 'harbor_warehouse'],
    staffRoles: ['Night Watchman', 'Delivery Driver', 'Dock Labourer', 'Sanitation Collector'],
    regularVisitorTags: ['patrol', 'smuggler'],
    naturalWeapons: ['iron_crowbar', 'heavy_pipe', 'hammer', 'utility_knife', 'silk_garrote'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    locationTags: ['alley', 'docks', 'cutthrough'],
    isPublic: false,
    pointsOfInterest: [
      { coords: { top: 63, left: 31 }, label: 'Loading-Bay Drain', description: 'A thread of dark fabric is caught in the grate above a fresh streak of mud.', clueRewardId: 'fabric_in_drain' },
      { coords: { top: 30, left: 70 }, label: 'Fire-Escape Landing', description: 'Dust on the landing is broken by one clean shoeprint and a rusty smear on the rail.' },
      { coords: { top: 78, left: 82 }, label: 'Ash-Barrel', description: 'Among wet cinders sits a matchbook from a club several districts away.' }
    ]
  },
  {
    id: 'cobblestone_alley',
    name: 'Raven’s Court Cobblestone Alley',
    district: 'The Gutters',
    description: 'A rain-slicked brick alleyway between Midtown and the docks. Steam vents hiss from manholes, and rusted fire escapes crisscross overhead.',
    mapCoords: { x: 62, y: 67 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['public_alley'],
    staffRoles: ['Street Sweeper'],
    regularVisitorTags: ['patrol', 'reporter'],
    naturalWeapons: ['silk_garrote', 'snub_revolver', 'utility_knife', 'iron_crowbar', 'heavy_pipe'],
    neverNaturalWeapons: ['brass_candlestick', 'brandy_poison'],
    connectedRoads: ['laundry_works', 'tenement_court', 'pool_hall', 'velvet_lounge'],
    locationTags: ['alley', 'gutters', 'cutthrough'],
    isPublic: false,
    pointsOfInterest: [
      { coords: { top: 58, left: 42 }, label: 'Puddle-Stained Cobble Curb', description: 'Fresh taxi tire treads stop sharply beside the recessed rear service door.', clueRewardId: 'alley_cab_tire_track' },
      { coords: { top: 28, left: 68 }, label: 'Steam Grate & Fire Escape', description: 'Water drips steadily from the lower iron rung toward the manhole.' }
    ],
    icon: 'Footprints'
  },
  {
    id: 'city_morgue',
    name: 'St. Sebastian Municipal Morgue',
    district: 'Industrial Docklands',
    description: 'White tile and humming fluorescent tubes lend the basement an exhausted, bluish pallor. Disinfectant cannot quite cover the smell of wet stone and the river beyond the loading doors.',
    icon: 'Building',
    mapCoords: { x: 21, y: 76 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['police_clearance'],
    connectedRoads: ['copper_kettle_tavern', 'fish_market', 'dry_dock', 'textile_mill'],
    staffRoles: ['Medical Examiner', 'Morgue Attendant', 'Coroner’s Clerk', 'Orderly'],
    regularVisitorTags: ['physician', 'police'],
    naturalWeapons: ['morphine_overdose', 'surgical_scalpel', 'bone_saw', 'arsenic_tonic'],
    neverNaturalWeapons: ['silk_garrote', 'brass_candlestick'],
    locationTags: ['medical', 'municipal', 'forensics'],
    pointsOfInterest: [
      { coords: { top: 36, left: 54 }, label: 'Examination Table', description: 'A small brass button rests near the drain, missed during the hurried cleanup.', clueRewardId: 'brass_button' },
      { coords: { top: 22, left: 25 }, label: 'Coroner’s Case File', description: 'The time of death has been overwritten, leaving the original entry faintly visible beneath.', clueRewardId: 'altered_time_of_death' },
      { coords: { top: 70, left: 78 }, label: 'Instrument Cabinet', description: 'One instrument slot is empty; the dust outline suggests it was removed recently.' }
    ]
  },
  {
    id: 'riverside_chapel',
    name: 'Our Lady of the Last Harbor Chapel',
    district: 'Industrial Docklands',
    description: 'Candlelight trembles over chipped saints and rows of varnished pews, fighting the gray daylight filtering through salt-streaked glass. The little nave smells of incense, wet wool, and river fog.',
    icon: 'Church',
    mapCoords: { x: 7, y: 63 },
    openingHours: { open: '06:00', close: '22:30' },
    accessRules: ['parish_sanctuary'],
    connectedRoads: ['golden_crust_bakery', 'blackwood_antiquities', 'boxing_gym', 'fish_market', 'dry_dock'],
    staffRoles: ['Parish Priest', 'Sexton', 'Choir Director', 'Caretaker'],
    regularVisitorTags: ['clergy', 'dockworker'],
    naturalWeapons: ['brass_candlestick', 'fire_poker', 'brass_lamp', 'heavy_desk_ornament', 'letter_opener'],
    neverNaturalWeapons: ['snub_revolver', 'morphine_overdose'],
    locationTags: ['church', 'docks', 'historic'],
    pointsOfInterest: [
      { coords: { top: 29, left: 51 }, label: 'Votive Candle Stand', description: 'A candle has burned down to a puddle of wax around a fresh match head.' },
      { coords: { top: 70, left: 36 }, label: 'Confessional Screen', description: 'A narrow strip of blue cloth is caught in the carved lattice.', clueRewardId: 'blue_cloth_thread' },
      { coords: { top: 44, left: 83 }, label: 'Sexton’s Key Board', description: 'The hook for the vestry key is empty, though the other keys hang in order.' }
    ]
  },
  {
    id: 'fish_market',
    name: 'Gull Point Municipal Fish Market',
    district: 'Industrial Docklands',
    description: 'The market’s iron roof traps the briny stink of fish, wet sawdust, and diesel fumes. Under hard white lamps, vendors shout over clattering carts and the slap of water against the quay.',
    icon: 'Fish',
    mapCoords: { x: 21, y: 64 },
    openingHours: { open: '04:00', close: '20:00' },
    accessRules: ['public_quay'],
    connectedRoads: ['blackwood_antiquities', 'boxing_gym', 'riverside_chapel', 'city_morgue'],
    staffRoles: ['Fishmonger', 'Market Inspector', 'Cart Driver', 'Ice Handler'],
    regularVisitorTags: ['dockworker', 'vendor'],
    naturalWeapons: ['fillet_knife', 'bone_dagger', 'kitchen_cleaver', 'kitchen_knife', 'dock_hook', 'bone_saw'],
    neverNaturalWeapons: ['brass_candlestick', 'silk_garrote'],
    locationTags: ['market', 'docks', 'public'],
    pointsOfInterest: [
      { coords: { top: 53, left: 42 }, label: 'Clearing Station', description: 'A clean patch interrupts the fish scales and water; something heavy was recently dragged away.' },
      { coords: { top: 31, left: 78 }, label: 'Vendor’s Ledger', description: 'A delivery entry is marked paid, but the buyer’s name has been carefully scraped out.', clueRewardId: 'scraped_market_ledger' },
      { coords: { top: 77, left: 19 }, label: 'Ice Cart', description: 'A trail of meltwater leads from the cart toward a side entrance, against the floor’s natural slope.' }
    ]
  },
  {
    id: 'dry_dock',
    name: 'Pier Nine Dry Dock and Repair Yard',
    district: 'Industrial Docklands',
    description: 'Crane booms cross the sky above a cavernous basin of rusted hulls and puddled oil. Work lamps cast long shadows over chains, scaffolding, and tools left where the shift ended.',
    icon: 'Anchor',
    mapCoords: { x: 8, y: 75 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['yard_gate'],
    connectedRoads: ['riverside_chapel', 'city_morgue', 'foundry_works'],
    staffRoles: ['Shipwright', 'Rigger', 'Welding Foreman', 'Dock Guard', 'Boilermaker'],
    regularVisitorTags: ['dockworker', 'enforcer'],
    naturalWeapons: ['hammer', 'wrench', 'iron_crowbar', 'heavy_pipe', 'bone_dagger'],
    neverNaturalWeapons: ['brass_candlestick', 'silk_garrote', 'morphine_overdose'],
    locationTags: ['docks', 'industrial', 'shipyard'],
    pointsOfInterest: [
      { coords: { top: 47, left: 57 }, label: 'Hull Scaffolding', description: 'A plank bears a fresh crescent dent and a smear of red primer.', clueRewardId: 'red_primer_smear' },
      { coords: { top: 22, left: 31 }, label: 'Foreman’s Tool Chest', description: 'The inventory is chalked on the lid; a heavy wrench is missing from the list.' },
      { coords: { top: 73, left: 81 }, label: 'Winch Controls', description: 'The brake lever is wet with oil, but the rest of the control panel is dry.' }
    ]
  },
  {
    id: 'harbor_warehouse',
    name: 'Blackwater Harbor Warehouse No. 6',
    district: 'Industrial Docklands',
    description: 'High windows admit thin bars of dusty light between towering cargo stacks. The air is all burlap, salt, and machine grease, with the harbor’s foghorn sounding like a warning through the walls.',
    icon: 'Warehouse',
    mapCoords: { x: 45, y: 89 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['watchman_gate'],
    connectedRoads: ['ace_pawnshop', 'service_alley', 'union_hall'],
    staffRoles: ['Warehouse Foreman', 'Forklift Operator', 'Customs Checker', 'Night Watchman'],
    regularVisitorTags: ['smuggler', 'antiquarian'],
    naturalWeapons: ['dock_hook', 'iron_crowbar', 'wrench', 'hammer', 'utility_knife', 'bone_dagger'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    locationTags: ['docks', 'warehouse', 'smuggling'],
    pointsOfInterest: [
      { coords: { top: 25, left: 65 }, label: 'Crate Stack C-14', description: 'One crate is stencilled for a different port; its seal has been replaced with fresh twine.', clueRewardId: 'replaced_cargo_seal' },
      { coords: { top: 22, left: 27 }, label: 'Loading Scale', description: 'The needle rests above zero despite the empty platform, as if recently overloaded.' },
      { coords: { top: 12, left: 35 }, label: 'Watchman’s Booth', description: 'A wall clock runs eleven minutes fast, but the logbook entries follow another time.' }
    ]
  },
  {
    id: 'union_hall',
    name: 'Longshoremen’s Local 88 Union Hall',
    district: 'Industrial Docklands',
    description: 'A scarred meeting table fills the lamplit room beneath framed photographs of men who look harder than their years. Smoke hangs low, and the radiator knocks like someone demanding to be let in.',
    icon: 'Users',
    mapCoords: { x: 58, y: 89 },
    openingHours: { open: '07:00', close: '23:00' },
    accessRules: ['union_card'],
    connectedRoads: ['pool_hall', 'harbor_warehouse', 'pier_four'],
    staffRoles: ['Union Steward', 'Membership Clerk', 'Organizer', 'Caretaker'],
    regularVisitorTags: ['dockworker', 'organizer'],
    naturalWeapons: ['fire_poker', 'snub_revolver', 'service_automatic', 'heavy_desk_ornament', 'heavy_pipe'],
    neverNaturalWeapons: ['morphine_overdose', 'brandy_poison'],
    locationTags: ['union', 'docks', 'civic'],
    pointsOfInterest: [
      { coords: { top: 41, left: 53 }, label: 'Membership Ledger', description: 'A page has been cut out cleanly, leaving only a narrow paper fringe.', clueRewardId: 'removed_union_ledger_page' },
      { coords: { top: 69, left: 20 }, label: 'Coat Rack', description: 'A work coat drips rainwater though the evening has been dry for hours.' },
      { coords: { top: 25, left: 82 }, label: 'Meeting Noticeboard', description: 'A pinned notice has been turned around; its reverse carries a hastily written address.' }
    ]
  },
  {
    id: 'tenement_court',
    name: 'Cinder Court Tenement House',
    district: 'The Gutters',
    description: 'A cramped courtyard rises through a canyon of fire escapes, laundry lines, and cracked brick. Window radios compete with a baby’s cry, while a single bare bulb flickers over the shared pump.',
    icon: 'Building2',
    mapCoords: { x: 48, y: 67 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['public_courtyard'],
    connectedRoads: ['crown_barbershop', 'laundry_works', 'boxing_gym', 'cobblestone_alley', 'ace_pawnshop'],
    staffRoles: ['Superintendent', 'Laundry Woman', 'Milk Deliveryman', 'Resident Seamstress'],
    regularVisitorTags: ['tenant', 'informant'],
    naturalWeapons: ['kitchen_knife', 'kitchen_cleaver', 'silk_garrote', 'arsenic_tonic', 'heavy_pipe', 'iron_crowbar', 'jump_rope'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    locationTags: ['residential', 'gutters', 'tenement'],
    pointsOfInterest: [
      { coords: { top: 55, left: 50 }, label: 'Courtyard Pump', description: 'The handle is damp and cold, but a clean crescent on the stone shows it was recently moved.' },
      { coords: { top: 28, left: 25 }, label: 'Third-Floor Fire Escape', description: 'A button lies on the landing, and the dust marks show someone climbed down in a hurry.', clueRewardId: 'fire_escape_button' },
      { coords: { top: 74, left: 78 }, label: 'Laundry Line', description: 'One wet garment is missing from a row of evenly spaced clothespins.' }
    ]
  },
  {
    id: 'city_hall',
    name: 'St. Sebastian Municipal Hall of Records',
    district: 'Civic Centre',
    description: 'Marble corridors echo beneath a domed ceiling painted with the city’s grand old promises. Behind the public counters, file rooms smell of paste, dust, and the quiet power of a rubber stamp.',
    icon: 'Landmark',
    mapCoords: { x: 78, y: 20 },
    openingHours: { open: '08:00', close: '21:00' },
    accessRules: ['civic_records_pass'],
    connectedRoads: ['precinct_four', 'continental_bank', 'clarion_newsroom', 'central_railway'],
    staffRoles: ['Records Clerk', 'Deputy Registrar', 'Custodian', 'City Auditor'],
    regularVisitorTags: ['official', 'reporter', 'lawyer'],
    naturalWeapons: ['letter_opener', 'heavy_desk_ornament', 'heavy_typewriter', 'silk_garrote'],
    neverNaturalWeapons: ['bone_dagger', 'morphine_overdose'],
    locationTags: ['civic', 'government', 'records'],
    pointsOfInterest: [
      { coords: { top: 34, left: 38 }, label: 'Property Register Desk', description: 'A deed has been refiled under the wrong street, with fresh glue still tacky at the spine.', clueRewardId: 'misfiled_property_deed' },
      { coords: { top: 61, left: 74 }, label: 'Basement Archive Door', description: 'The lock is intact, but pale paper fibers cling to the jamb as if a document was pulled through.' },
      { coords: { top: 23, left: 58 }, label: 'Public Counter Bell', description: 'The bell is silent, yet a faint thumbprint in ink marks its polished rim.' }
    ]
  },
  {
    id: 'starlight_radio',
    name: 'WSSB Starlight Radio Studios',
    district: 'Midtown Promenade',
    description: 'Red recording lamps glow over a maze of soundproof booths and cables, while a velvet-voiced announcer sells the city a brighter version of itself. The control room smells of hot valves, face powder, and burnt coffee.',
    icon: 'Radio',
    mapCoords: { x: 76, y: 44 },
    openingHours: { open: '06:00', close: '01:00' },
    accessRules: ['studio_pass'],
    connectedRoads: ['central_railway', 'taxi_garage', 'grand_hotel2', 'harborview_restaurant'],
    staffRoles: ['Announcer', 'Sound Engineer', 'Studio Pianist', 'Program Director', 'Switchboard Operator'],
    regularVisitorTags: ['entertainer', 'reporter'],
    naturalWeapons: ['electrical_cable', 'silk_garrote', 'heavy_typewriter', 'brass_lamp', 'letter_opener'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    locationTags: ['media', 'midtown', 'broadcast'],
    pointsOfInterest: [
      { coords: { top: 37, left: 49 }, label: 'On-Air Microphone', description: 'The microphone grille is smudged with powder, and the mute switch bears a fresh nick.' },
      { coords: { top: 68, left: 25 }, label: 'Control-Room Log', description: 'A late-night broadcast is logged, though the station’s master tape has been removed.', clueRewardId: 'missing_broadcast_tape' },
      { coords: { top: 24, left: 79 }, label: 'Guest Dressing Mirror', description: 'A lipstick message has been wiped away, leaving only a backward red stroke at the edge.' }
    ]
  }
];

export const MASTER_LOCATIONS: LocationTemplate[] = [
  ...CORE_LOCATIONS.map((loc) => ({
    ...loc,
    isPublic: loc.isPublic !== undefined ? loc.isPublic : true
  })),
  ...EXTRA_LOCATIONS
];

export const MASTER_WEAPONS: MethodTemplate[] = [
  {
    id: 'brass_candlestick',
    name: 'Heavy Brass Candlestick',
    category: 'Blunt Force',
    description: 'A solid cast-brass altar candlestick, weighing six pounds with sharp octagonal base ridges.',
    requirements: ['Physical strength', 'Access to chapel or antique store'],
    evidenceSignature: 'Depressed cranial fracture with distinctive octagonal stamp bruising; brass micro-shards.',
    usuallyAvailableAt: ['st_judes', 'blackwood_antiquities', 'riverside_chapel', 'trinity_baptist', 'bookshop'],
    neverNaturallyAvailableAt: ['pier_four', 'velvet_lounge', 'pendelton_clinic', 'blue_dahlia_club', 'city_morgue'],
    portability: 'Cumbersome',
    accessRules: ['parish_sanctuary', 'shop_key_after_hours'],
    compatibleSkills: ['heavy_blunt', 'appraisal', 'pastoral_trust', 'intimidation'],
    preferenceTags: ['traditional', 'improvised_heavy'],
    avoidTags: ['subtle', 'chemical'],
    icon: 'Hammer'
  },
  {
    id: 'brandy_poison',
    name: 'Cyanide-Laced Brandy Flask',
    category: 'Poison',
    description: 'An engraved silver pocket flask containing vintage cognac infused with lethal potassium cyanide.',
    requirements: ['Access to chemical toxins', 'Opportunity to slip poison into drink'],
    evidenceSignature: 'Cherry-red lividity on skin, bitter almond scent detected during autopsy; clean toxicology swab.',
    usuallyAvailableAt: ['velvet_lounge', 'grand_hotel', 'grand_hotel2', 'blue_dahlia_club', 'pendelton_clinic'],
    neverNaturallyAvailableAt: ['st_judes', 'pier_four', 'riverside_chapel', 'dry_dock', 'boxing_gym'],
    portability: 'Pocket',
    accessRules: ['speakeasy_door', 'public_lobby', 'narcotics_cabinet'],
    compatibleSkills: ['poison_handling', 'pharmacology', 'social_engineering'],
    preferenceTags: ['subtle', 'chemical'],
    avoidTags: ['brawler'],
    icon: 'FlaskConical'
  },
  {
    id: 'snub_revolver',
    name: 'Snub-Nose .38 Revolver',
    category: 'Firearm',
    description: 'A snub-nosed Colt Detective Special with custom checkered walnut grips, loaded with lead round-nose rounds.',
    requirements: ['Marksmanship or point-blank range', 'Ability to conceal firearm'],
    evidenceSignature: 'Close-contact powder burns (stippling) on victim’s lapel; extracted .38 calibre lead slug.',
    usuallyAvailableAt: ['agency', 'velvet_lounge', 'boxing_gym', 'union_hall', 'cobblestone_alley'],
    neverNaturallyAvailableAt: ['st_judes', 'pendelton_clinic', 'riverside_chapel', 'blackwood_antiquities'],
    portability: 'Concealable',
    accessRules: ['unregistered_firearm', 'service_revolver'],
    compatibleSkills: ['marksmanship', 'intimidation'],
    preferenceTags: ['direct', 'underworld'],
    avoidTags: ['pacifist', 'silent'],
    icon: 'Crosshair'
  },
  {
    id: 'bone_dagger',
    name: 'Carved Bone Stiletto',
    category: 'Edged Weapon',
    description: 'An antique sailor’s scrimshaw bodkin knife, honed to a needle point with a carved narwhal handle.',
    requirements: ['Stealth and close proximity', 'Access to rare curio or dock trade'],
    evidenceSignature: 'Narrow puncture wound penetrating the third intercostal space; clean triangular blade entry.',
    usuallyAvailableAt: ['blackwood_antiquities', 'pier_four', 'fish_market', 'harbor_warehouse', 'dry_dock'],
    neverNaturallyAvailableAt: ['pendelton_clinic', 'grand_hotel', 'city_hall'],
    portability: 'Concealable',
    accessRules: ['shop_key_after_hours', 'dock_gate'],
    compatibleSkills: ['blade_handling', 'stealth', 'close_quarters'],
    preferenceTags: ['silent', 'edged'],
    avoidTags: ['clumsy'],
    icon: 'Sword'
  },
  {
    id: 'morphine_overdose',
    name: 'Concentrated Morphine Syringe',
    category: 'Poison',
    description: 'A clinical glass syringe loaded with a lethal dose of concentrated morphine tartrate.',
    requirements: ['Medical access or pharmacopeia key', 'Administration while victim was incapacitated'],
    evidenceSignature: 'Microscopic puncture mark behind the left earlobe; pinpoint pupils and respiratory paralysis.',
    usuallyAvailableAt: ['pendelton_clinic', 'city_morgue', 'mercer_apothecary', 'university_hall'],
    neverNaturallyAvailableAt: ['velvet_lounge', 'st_judes', 'pier_four', 'boxing_gym', 'riverside_chapel'],
    portability: 'Pocket',
    accessRules: ['narcotics_cabinet', 'police_clearance'],
    compatibleSkills: ['pharmacology', 'sedation', 'anatomy'],
    preferenceTags: ['clinical', 'silent'],
    avoidTags: ['brawler'],
    icon: 'Syringe'
  },
  {
    id: 'silk_garrote',
    name: 'Braided Silk Garrote Cord',
    category: 'Strangulation',
    description: 'A high-tensile braided piano wire wrapped in black opera silk with lead weighted toggle handles.',
    requirements: ['Element of surprise from behind', 'Concealment in coat pocket'],
    evidenceSignature: 'Horizontal ligature furrow above thyroid cartilage; textile weave impressions on epidermis.',
    usuallyAvailableAt: ['grand_hotel', 'grand_hotel2', 'velvet_lounge', 'clarion_newsroom', 'starlight_radio', 'cobblestone_alley'],
    neverNaturallyAvailableAt: ['st_judes', 'riverside_chapel', 'fish_market', 'dry_dock'],
    portability: 'Pocket',
    accessRules: ['backstage_access', 'public_alley'],
    compatibleSkills: ['stealth', 'close_quarters', 'social_engineering'],
    preferenceTags: ['silent', 'concealable'],
    avoidTags: ['public_brawl'],
    icon: 'Link'
  },
  {
    id: 'bar_ice_pick',
    name: 'Steel Bar Ice Pick',
    category: 'Edged Weapon',
    description: 'A slender tempered-steel ice pick with a turned hardwood handle taken from behind a cocktail bar.',
    requirements: ['Close range', 'Precision strike'],
    evidenceSignature: 'Deep circular puncture wound with minimal surface bleeding; subtle wood-splinter traces.',
    usuallyAvailableAt: ['grand_hotel2', 'velvet_lounge', 'blue_dahlia_club'],
    neverNaturallyAvailableAt: ['st_judes', 'riverside_chapel', 'city_hall'],
    portability: 'Pocket',
    accessRules: ['speakeasy_door', 'public_lobby'],
    compatibleSkills: ['close_quarters', 'stealth'],
    preferenceTags: ['silent', 'concealable'],
    avoidTags: ['heavy_blunt'],
    icon: 'Sword'
  },
  {
    id: 'brass_lamp',
    name: 'Weighted Brass Table Lamp',
    category: 'Blunt Force',
    description: 'An Art Deco hotel table lamp with a heavy cast-brass plinth and frayed cloth cord.',
    requirements: ['Immediate physical proximity', 'Spontaneous or cornered strike'],
    evidenceSignature: 'Curved temporal skull fracture with tarnished brass lacquer flecks in the laceration.',
    usuallyAvailableAt: ['grand_hotel2', 'grand_hotel', 'trinity_baptist', 'bookshop', 'public_library', 'opera_house'],
    neverNaturallyAvailableAt: ['pier_four', 'dry_dock', 'service_alley'],
    portability: 'Cumbersome',
    accessRules: ['public_lobby'],
    compatibleSkills: ['heavy_blunt', 'intimidation'],
    preferenceTags: ['improvised_heavy'],
    avoidTags: ['subtle'],
    icon: 'Hammer'
  },
  {
    id: 'dock_hook',
    name: 'Rusted Longshoreman’s Hook',
    category: 'Edged Weapon',
    description: 'A curved iron baling hook worn smooth at the wooden T-handle from hauling harbor cargo.',
    requirements: ['Upper-body strength', 'Waterfront access'],
    evidenceSignature: 'Deep hooked laceration with coarse iron oxide and salt-tar residue along the wound edge.',
    usuallyAvailableAt: ['pier_four', 'harbor_warehouse', 'dry_dock', 'ferry_terminal', 'customs_house'],
    neverNaturallyAvailableAt: ['grand_hotel', 'grand_hotel2', 'clarion_newsroom', 'pendelton_clinic'],
    portability: 'Concealable',
    accessRules: ['dock_gate', 'watchman_gate'],
    compatibleSkills: ['dock_navigation', 'intimidation', 'close_quarters'],
    preferenceTags: ['underworld', 'brutal'],
    avoidTags: ['subtle', 'clinical'],
    icon: 'Sword'
  },
  {
    id: 'letter_opener',
    name: 'Monogrammed Steel Letter Opener',
    category: 'Edged Weapon',
    description: 'A double-edged desk stiletto forged of Sheffield steel, kept razor-sharp on executive blotters.',
    requirements: ['Office or civic desk access', 'Sudden close strike'],
    evidenceSignature: 'Clean symmetrical double-edged stab wound; faint engraving impressions near the hilt guard.',
    usuallyAvailableAt: ['clarion_newsroom', 'city_hall', 'agency'],
    neverNaturallyAvailableAt: ['pier_four', 'dry_dock', 'boxing_gym'],
    portability: 'Pocket',
    accessRules: ['press_lobby', 'civic_records_pass'],
    compatibleSkills: ['stealth', 'investigation', 'blade_handling'],
    preferenceTags: ['silent', 'edged'],
    avoidTags: ['heavy_blunt'],
    icon: 'Sword'
  },
  {
    id: 'heavy_typewriter',
    name: 'Cast-Iron Underwood Typewriter',
    category: 'Blunt Force',
    description: 'A thirty-pound black enamel newsroom typewriter capable of crushing bone in a single drop.',
    requirements: ['Substantial strength', 'Victim pinned or seated below'],
    evidenceSignature: 'Broad rectangular skull trauma accompanied by black enamel paint chips and inked key-bar marks.',
    usuallyAvailableAt: ['clarion_newsroom', 'agency', 'city_hall', 'courthouse', 'public_library', 'post_office', 'continental_bank'],
    neverNaturallyAvailableAt: ['pier_four', 'service_alley', 'riverside_chapel'],
    portability: 'Cumbersome',
    accessRules: ['press_lobby'],
    compatibleSkills: ['heavy_blunt', 'investigation'],
    preferenceTags: ['improvised_heavy'],
    avoidTags: ['subtle', 'concealable'],
    icon: 'Hammer'
  },
  {
    id: 'heavy_pipe',
    name: 'Galvanized Steam Pipe',
    category: 'Blunt Force',
    description: 'An eighteen-inch section of threaded iron steam pipe wrapped at one end with friction tape.',
    requirements: ['Close physical ambush', 'Solid grip'],
    evidenceSignature: 'Linear crushing contusion with parallel thread-grooves and dark machine-grease transfer.',
    usuallyAvailableAt: ['central_railway', 'service_alley', 'dry_dock'],
    neverNaturallyAvailableAt: ['grand_hotel', 'st_judes', 'starlight_radio'],
    portability: 'Concealable',
    accessRules: ['public_concourse', 'public_alley'],
    compatibleSkills: ['heavy_blunt', 'intimidation', 'street_smarts'],
    preferenceTags: ['underworld', 'direct'],
    avoidTags: ['clinical'],
    icon: 'Hammer'
  },
  {
    id: 'utility_knife',
    name: 'Porter’s Folding Utility Knife',
    category: 'Edged Weapon',
    description: 'A heavy brass-bolstered clasp knife used by railway porters for cutting trunk straps.',
    requirements: ['Close quarters', 'Concealment in pocket'],
    evidenceSignature: 'Single-edged slash and thrust wound with slight sawtooth hesitation marks at the entry.',
    usuallyAvailableAt: ['central_railway', 'harbor_warehouse', 'cobblestone_alley'],
    neverNaturallyAvailableAt: ['grand_hotel', 'st_judes'],
    portability: 'Pocket',
    accessRules: ['public_concourse', 'watchman_gate'],
    compatibleSkills: ['blade_handling', 'street_smarts'],
    preferenceTags: ['concealable', 'edged'],
    avoidTags: ['clinical'],
    icon: 'Sword'
  },
  {
    id: 'bar_bottle',
    name: 'Heavy Champagne Magnum',
    category: 'Blunt Force',
    description: 'A thick-walled green glass bottle still half-full, swung by the neck in close quarters.',
    requirements: ['Bar or club access', 'Sudden close-range swing'],
    evidenceSignature: 'Irregular cranial depression with microscopic green bottle-glass splinters and alcohol residue.',
    usuallyAvailableAt: ['blue_dahlia_club', 'velvet_lounge', 'grand_hotel2'],
    neverNaturallyAvailableAt: ['city_morgue', 'riverside_chapel', 'dry_dock'],
    portability: 'Concealable',
    accessRules: ['club_reservation', 'speakeasy_door'],
    compatibleSkills: ['intimidation', 'street_smarts'],
    preferenceTags: ['improvised_heavy', 'underworld'],
    avoidTags: ['clinical'],
    icon: 'Hammer'
  },
  {
    id: 'kitchen_cleaver',
    name: 'Butcher’s Heavy Cleaver',
    category: 'Edged Weapon',
    description: 'A broad high-carbon steel kitchen cleaver balanced for chopping through bone.',
    requirements: ['Kitchen or market access', 'Decisive overhead swing'],
    evidenceSignature: 'Deep wedge-shaped incised fracture penetrating cleanly into bone without splintering.',
    usuallyAvailableAt: ['blue_dahlia_club', 'fish_market', 'tenement_court'],
    neverNaturallyAvailableAt: ['starlight_radio', 'city_hall', 'st_judes'],
    portability: 'Concealable',
    accessRules: ['club_reservation', 'public_quay'],
    compatibleSkills: ['blade_handling', 'intimidation'],
    preferenceTags: ['brutal', 'edged'],
    avoidTags: ['subtle'],
    icon: 'Sword'
  },
  {
    id: 'training_dumbbell',
    name: 'Cast-Iron Training Dumbbell',
    category: 'Blunt Force',
    description: 'A twelve-pound knurled iron gym dumbbell dulled by decades of sweat and chalk.',
    requirements: ['Physical strength', 'Gymnasium access'],
    evidenceSignature: 'Circular concave skull impact accompanied by white magnesium gym-chalk dust.',
    usuallyAvailableAt: ['boxing_gym', 'foundry_works', 'dry_dock'],
    neverNaturallyAvailableAt: ['grand_hotel', 'pendelton_clinic', 'city_hall', 'university_hall'],
    portability: 'Cumbersome',
    accessRules: ['gym_membership'],
    compatibleSkills: ['heavy_blunt', 'intimidation'],
    preferenceTags: ['brawler', 'improvised_heavy'],
    avoidTags: ['subtle'],
    icon: 'Hammer'
  },
  {
    id: 'jump_rope',
    name: 'Weighted Leather Speed Rope',
    category: 'Strangulation',
    description: 'A braided rawhide boxer’s skipping rope fitted with ball-bearing hardwood grips.',
    requirements: ['Element of surprise from behind', 'Strength to hold tension'],
    evidenceSignature: 'Distinctive diagonal leather-braid ligature mark with chafed abrasion along the jawline.',
    usuallyAvailableAt: ['boxing_gym', 'tenement_court', 'ferry_terminal'],
    neverNaturallyAvailableAt: ['grand_hotel', 'city_morgue', 'city_hall'],
    portability: 'Pocket',
    accessRules: ['gym_membership'],
    compatibleSkills: ['close_quarters', 'intimidation'],
    preferenceTags: ['silent', 'brawler'],
    avoidTags: ['clinical'],
    icon: 'Link'
  },
  {
    id: 'iron_crowbar',
    name: 'Forged Alley Pry Bar',
    category: 'Blunt Force',
    description: 'A scarred hexagonal steel crowbar kept for wedging stuck freight doors in dark alleys.',
    requirements: ['Alley or dock access', 'Hard overhead strike'],
    evidenceSignature: 'Twin parallel split bruising from the forked claw end alongside rust flecks.',
    usuallyAvailableAt: ['service_alley', 'harbor_warehouse', 'dry_dock'],
    neverNaturallyAvailableAt: ['grand_hotel', 'st_judes', 'pendelton_clinic'],
    portability: 'Concealable',
    accessRules: ['public_alley', 'watchman_gate'],
    compatibleSkills: ['heavy_blunt', 'lock_bypass', 'alley_navigation'],
    preferenceTags: ['underworld', 'direct'],
    avoidTags: ['clinical'],
    icon: 'Hammer'
  },
  {
    id: 'surgical_scalpel',
    name: 'Stainless Surgical Scalpel',
    category: 'Edged Weapon',
    description: 'A gleaming #10 surgical blade locked onto an engraved medical handle.',
    requirements: ['Medical or morgue access', 'Anatomical precision'],
    evidenceSignature: 'Razor-clean carotid incision with zero jagged tearing; surgical precision.',
    usuallyAvailableAt: ['city_morgue', 'pendelton_clinic'],
    neverNaturallyAvailableAt: ['boxing_gym', 'pier_four', 'velvet_lounge'],
    portability: 'Pocket',
    accessRules: ['police_clearance', 'clinic_door'],
    compatibleSkills: ['anatomy', 'blade_handling', 'stealth'],
    preferenceTags: ['clinical', 'silent'],
    avoidTags: ['brawler'],
    icon: 'Sword'
  },
  {
    id: 'bone_saw',
    name: 'Autopsy Steel Bone Saw',
    category: 'Edged Weapon',
    description: 'A ribbed municipal pathology saw with fine hardened teeth and a chrome grip.',
    requirements: ['Morgue clearance', 'Overpowering victim'],
    evidenceSignature: 'Serrated kerf striations across bone and cartilage consistent with surgical pathology steel.',
    usuallyAvailableAt: ['city_morgue', 'fish_market', 'rosie_deli', 'pendelton_clinic'],
    neverNaturallyAvailableAt: ['grand_hotel', 'blue_dahlia_club', 'starlight_radio'],
    portability: 'Cumbersome',
    accessRules: ['police_clearance'],
    compatibleSkills: ['anatomy', 'blade_handling'],
    preferenceTags: ['clinical', 'brutal'],
    avoidTags: ['concealable'],
    icon: 'Sword'
  },
  {
    id: 'fillet_knife',
    name: 'Dockside Fillet Knife',
    category: 'Edged Weapon',
    description: 'A flexible seven-inch fishmonger’s blade slick with brine and oiled ashwood grip.',
    requirements: ['Waterfront access', 'Quick close thrust'],
    evidenceSignature: 'Deep curved blade track with trace marine salt crystals inside the wound.',
    usuallyAvailableAt: ['fish_market', 'pier_four', 'rosie_deli', 'harborview_restaurant'],
    neverNaturallyAvailableAt: ['grand_hotel', 'city_hall', 'starlight_radio'],
    portability: 'Concealable',
    accessRules: ['public_quay', 'dock_gate'],
    compatibleSkills: ['blade_handling', 'dock_navigation'],
    preferenceTags: ['edged', 'silent'],
    avoidTags: ['clinical'],
    icon: 'Sword'
  },
  {
    id: 'wrench',
    name: 'Heavy Pipefitter’s Monkey Wrench',
    category: 'Blunt Force',
    description: 'A forged eighteen-inch shipyard Stillson wrench stained with marine grease and red primer.',
    requirements: ['Physical strength', 'Shipyard or utility access'],
    evidenceSignature: 'Stepped jaw indentation on the skull accompanied by flakes of red hull primer.',
    usuallyAvailableAt: ['dry_dock', 'harbor_warehouse'],
    neverNaturallyAvailableAt: ['grand_hotel', 'pendelton_clinic', 'riverside_chapel'],
    portability: 'Concealable',
    accessRules: ['yard_gate', 'watchman_gate'],
    compatibleSkills: ['heavy_blunt', 'intimidation'],
    preferenceTags: ['direct', 'improvised_heavy'],
    avoidTags: ['subtle'],
    icon: 'Hammer'
  },
  {
    id: 'fire_poker',
    name: 'Wrought-Iron Hearth Poker',
    category: 'Blunt Force',
    description: 'A heavy twisted-iron fireplace poker topped with a brass finial from the union hall hearth.',
    requirements: ['Interior access', 'Close-quarters struggle'],
    evidenceSignature: 'Narrow linear skull fracture paired with soot and ash traces in the hair.',
    usuallyAvailableAt: ['union_hall', 'grand_hotel'],
    neverNaturallyAvailableAt: ['city_morgue', 'fish_market', 'pendelton_clinic'],
    portability: 'Concealable',
    accessRules: ['union_card', 'public_lobby'],
    compatibleSkills: ['heavy_blunt', 'intimidation'],
    preferenceTags: ['traditional', 'improvised_heavy'],
    avoidTags: ['clinical'],
    icon: 'Hammer'
  },
  {
    id: 'heavy_desk_ornament',
    name: 'Bronze Civic Paperweight',
    category: 'Blunt Force',
    description: 'A solid five-pound bronze eagle paperweight commemorating the 1928 Harbor Dedication.',
    requirements: ['Civic office access', 'Close-range strike'],
    evidenceSignature: 'Angular talon-shaped depression in the cranium with subtle green bronze verdigris.',
    usuallyAvailableAt: ['city_hall', 'agency', 'clarion_newsroom'],
    neverNaturallyAvailableAt: ['pier_four', 'dry_dock', 'boxing_gym'],
    portability: 'Concealable',
    accessRules: ['civic_records_pass', 'detective_key'],
    compatibleSkills: ['heavy_blunt', 'investigation'],
    preferenceTags: ['traditional', 'improvised_heavy'],
    avoidTags: ['chemical'],
    icon: 'Hammer'
  },
  {
    id: 'electrical_cable',
    name: 'Braided Studio Power Cable',
    category: 'Strangulation',
    description: 'A thick rubber-sheathed broadcast microphone cable stripped of its brass jack.',
    requirements: ['Surprise from behind', 'Radio or stage access'],
    evidenceSignature: 'Broad smooth rubber-burn ligature band encircling the neck without textile weave.',
    usuallyAvailableAt: ['starlight_radio', 'blue_dahlia_club', 'clarion_newsroom'],
    neverNaturallyAvailableAt: ['riverside_chapel', 'fish_market', 'dry_dock'],
    portability: 'Pocket',
    accessRules: ['studio_pass', 'press_lobby'],
    compatibleSkills: ['stealth', 'wiretapping', 'close_quarters'],
    preferenceTags: ['silent', 'concealable'],
    avoidTags: ['brawler'],
    icon: 'Link'
  },
  {
    id: 'arsenic_tonic',
    name: 'Arsenic-Tainted Apothecary Tonic',
    category: 'Poison',
    description: 'A brown glass patent-medicine bottle spiked with tasteless white arsenic trioxide.',
    requirements: ['Dispensary or apothecary access', 'Opportunity to dose victim’s tea or tonic'],
    evidenceSignature: 'Acute gastric inflammation and white crystalline residue confirmed via Reinsch toxicology test.',
    usuallyAvailableAt: ['pendelton_clinic', 'tenement_court', 'grand_hotel'],
    neverNaturallyAvailableAt: ['pier_four', 'boxing_gym', 'dry_dock'],
    portability: 'Pocket',
    accessRules: ['clinic_door', 'narcotics_cabinet'],
    compatibleSkills: ['poison_handling', 'pharmacology', 'toxicology'],
    preferenceTags: ['subtle', 'chemical'],
    avoidTags: ['brawler'],
    icon: 'FlaskConical'
  },
  {
    id: 'pocket_derringer',
    name: '.32 Pearl-Grip Derringer',
    category: 'Firearm',
    description: 'A palm-sized two-shot Remington over-and-under derringer favored by high-stakes gamblers.',
    requirements: ['Concealment inside sleeve or clutch', 'Point-blank range'],
    evidenceSignature: 'Small-calibre .32 entry wound with faint scorched powder halo and intact jacketed slug.',
    usuallyAvailableAt: ['grand_hotel', 'grand_hotel2', 'blue_dahlia_club', 'velvet_lounge'],
    neverNaturallyAvailableAt: ['st_judes', 'riverside_chapel', 'dry_dock', 'city_morgue'],
    portability: 'Pocket',
    accessRules: ['speakeasy_door', 'club_reservation'],
    compatibleSkills: ['marksmanship', 'social_engineering'],
    preferenceTags: ['concealable', 'direct'],
    avoidTags: ['pacifist'],
    icon: 'Crosshair'
  },
  {
    id: 'service_automatic',
    name: '.45 Colt Service Automatic',
    category: 'Firearm',
    description: 'A heavy matte-blued Colt M1911 automatic pistol with brass shell casings.',
    requirements: ['Firearms proficiency', 'Underworld or veteran contact'],
    evidenceSignature: 'Large-calibre .45 exit trauma and spent brass casing stamped with wartime lot numbers.',
    usuallyAvailableAt: ['agency', 'union_hall', 'harbor_warehouse', 'pier_four'],
    neverNaturallyAvailableAt: ['st_judes', 'pendelton_clinic', 'riverside_chapel'],
    portability: 'Concealable',
    accessRules: ['service_revolver', 'unregistered_firearm'],
    compatibleSkills: ['marksmanship', 'intimidation'],
    preferenceTags: ['direct', 'underworld'],
    avoidTags: ['pacifist', 'silent'],
    icon: 'Crosshair'
  },
  {
    id: 'hammer',
    name: 'Forged Dockyard Ball-Peen Hammer',
    category: 'Blunt Force',
    description: 'A scarred two-pound machinist’s ball-peen hammer with an ashwood handle stained in hull grease.',
    requirements: ['Physical strength', 'Shipyard or workshop access'],
    evidenceSignature: 'Concentrated circular cranial depression matched by round peen impact and iron scale dust.',
    usuallyAvailableAt: ['dry_dock', 'foundry_works', 'harbor_warehouse', 'pier_four', 'taxi_garage', 'service_alley'],
    neverNaturallyAvailableAt: ['grand_hotel', 'grand_hotel2', 'pendelton_clinic', 'st_judes', 'riverside_chapel'],
    portability: 'Concealable',
    accessRules: ['yard_gate', 'watchman_gate'],
    compatibleSkills: ['heavy_blunt', 'intimidation'],
    preferenceTags: ['direct', 'improvised_heavy'],
    avoidTags: ['subtle'],
    icon: 'Hammer'
  },
  {
    id: 'kitchen_knife',
    name: 'Eight-Inch Steel Chef’s Knife',
    category: 'Edged Weapon',
    description: 'A balanced eight-inch high-carbon culinary blade riveted to dark rosewood scales.',
    requirements: ['Kitchen or pantry access', 'Close-range strike'],
    evidenceSignature: 'Deep flat-ground single-edge stab track tapering cleanly toward the point.',
    usuallyAvailableAt: ['harborview_restaurant', 'silver_spoon_diner', 'blue_dahlia_club', 'tenement_court', 'rosie_deli', 'golden_crust_bakery'],
    neverNaturallyAvailableAt: ['st_judes', 'riverside_chapel', 'city_hall', 'continental_bank'],
    portability: 'Concealable',
    accessRules: ['public_dining', 'public_diner', 'public_shop'],
    compatibleSkills: ['blade_handling', 'close_quarters', 'stealth'],
    preferenceTags: ['edged', 'concealable'],
    avoidTags: ['clinical'],
    icon: 'Sword'
  }
];

export const MASTER_MOTIVES: MotiveTemplate[] = [
  {
    id: 'inheritance_greed',
    name: 'The Secret Will & Disinheritance',
    category: 'Inheritance',
    description: 'The victim intended to alter their testament within 24 hours, completely cutting the culprit out of a family fortune.',
    evidenceClueSnippet: 'A torn carbon copy of a codicil drafting an immediate bequest revocation.',
    eligibleRelationshipTags: ['family', 'confidant', 'creditor'],
    requiredFacts: ['trust_papers', 'will_dispute'],
    clueHooks: ['codicil_carbon', 'probate_appointment']
  },
  {
    id: 'blackmail_exposure',
    name: 'Blackmail over Stolen Bearer Bonds',
    category: 'Blackmail',
    description: 'The victim was shaking down the culprit with photographic proof of bond embezzlement from city vaults.',
    evidenceClueSnippet: 'Negative photo strips showing stolen bond ledgers hidden in a safety deposit box.',
    eligibleRelationshipTags: ['blackmailer', 'rival', 'informant'],
    requiredFacts: ['bond_ledger', 'blackmail_demand'],
    clueHooks: ['negative_strips', 'deposit_key']
  },
  {
    id: 'gangland_silencing',
    name: 'Silencing a Federal Informant',
    category: 'Mob Silencing',
    description: 'The victim was subpoenaed to testify before the Special Grand Jury regarding illegal syndicate kickbacks.',
    evidenceClueSnippet: 'A stamped federal subpoena folded tightly inside a pocket watch case.',
    eligibleRelationshipTags: ['accomplice', 'informant', 'creditor'],
    requiredFacts: ['subpoena_order', 'syndicate_payoff'],
    clueHooks: ['federal_subpoena', 'precinct_payoff']
  },
  {
    id: 'medical_malpractice',
    name: 'Threat to Expose Malpractice & Tincture Tampering',
    category: 'Debt',
    description: 'The victim possessed signed affidavits confirming botched illicit operations and narcotics tampering.',
    evidenceClueSnippet: 'An attorney’s formal demand letter with affidavits from grieving family members.',
    eligibleRelationshipTags: ['blackmailer', 'rival', 'confidant'],
    requiredFacts: ['affidavit_file', 'dispensary_audit'],
    clueHooks: ['attorney_demand', 'narcotics_audit']
  },
  {
    id: 'romantic_betrayal',
    name: 'Scorned Passion & Ruined Reputation',
    category: 'Jealousy',
    description: 'The victim flaunted an affair while threatening to ruin the culprit’s social standing with public letters.',
    evidenceClueSnippet: 'Perfumed letters detailing secret rendezvous and explicit financial threats.',
    eligibleRelationshipTags: ['rival', 'confidant', 'accomplice'],
    requiredFacts: ['private_letters', 'scandal_threat'],
    clueHooks: ['perfumed_letters', 'hotel_register']
  },
  {
    id: 'unpaid_gambling_marker',
    name: 'Defaulted High-Stakes Gambling Marker',
    category: 'Debt',
    description: 'The victim called in a crippling cellar-club IOU and threatened to seize the culprit’s livelihood at dawn.',
    evidenceClueSnippet: 'A red-inked promissory marker stamped "FINAL NOTICE — DEFAULT" for ten thousand dollars.',
    eligibleRelationshipTags: ['creditor', 'rival', 'accomplice'],
    requiredFacts: ['poker_marker', 'collection_ultimatum'],
    clueHooks: ['promissory_marker', 'club_iou']
  },
  {
    id: 'smuggled_cargo_double_cross',
    name: 'Double-Cross on Pier Contraband',
    category: 'Revenge',
    description: 'The victim tipped off customs inspectors after skimming the culprit’s share of a nocturnal harbor shipment.',
    evidenceClueSnippet: 'A water-stained bill of lading with freight manifests altered in two different inks.',
    eligibleRelationshipTags: ['accomplice', 'informant', 'rival'],
    requiredFacts: ['cargo_manifest', 'customs_tipoff'],
    clueHooks: ['altered_manifest', 'warehouse_receipt']
  },
  {
    id: 'embezzled_trust_audit',
    name: 'Foreclosure & Embezzled Trust Funds',
    category: 'Blackmail',
    description: 'An imminent independent audit uncovered that the victim held proof of missing parish and union endowment money.',
    evidenceClueSnippet: 'A dual-entry bank reconciliation sheet showing forty thousand dollars siphoned to numbered accounts.',
    eligibleRelationshipTags: ['confidant', 'creditor', 'blackmailer'],
    requiredFacts: ['audit_ledger', 'wire_transfer'],
    clueHooks: ['reconciliation_sheet', 'bank_draft']
  },
  {
    id: 'syndicate_turf_usurpation',
    name: 'Hostile Takeover of Midtown Rackets',
    category: 'Mob Silencing',
    description: 'The victim brokered a rival syndicate alliance to squeeze the culprit out of Midtown protection routes.',
    evidenceClueSnippet: 'An unsigned territorial pact dividing theatre-row venues among competing bosses.',
    eligibleRelationshipTags: ['rival', 'accomplice', 'informant'],
    requiredFacts: ['territory_map', 'rival_pact'],
    clueHooks: ['unsigned_pact', 'precinct_envelope']
  },
  {
    id: 'ruined_career_vendetta',
    name: 'Decade-Old Ruined Career Vendetta',
    category: 'Revenge',
    description: 'Years ago the victim framed the culprit for professional disgrace; that evening they refused to sign a retraction.',
    evidenceClueSnippet: 'A yellowed 1938 tribunal clipping annotated with furious red marginalia and a draft retraction.',
    eligibleRelationshipTags: ['rival', 'family', 'blackmailer'],
    requiredFacts: ['old_tribunal_record', 'unsigned_retraction'],
    clueHooks: ['tribunal_clipping', 'retraction_draft']
  },
  {
    id: 'forged_provenance_fraud',
    name: 'Counterfeit Estate & Relic Provenance',
    category: 'Blackmail',
    description: 'The victim threatened to publish laboratory proof that the culprit’s prized museum consignments were forgeries.',
    evidenceClueSnippet: 'An insurance appraiser’s telegram flagging counterfeit hallmarks on three auctioned heirlooms.',
    eligibleRelationshipTags: ['confidant', 'blackmailer', 'creditor'],
    requiredFacts: ['appraisal_telegram', 'forged_certificate'],
    clueHooks: ['appraiser_wire', 'auction_catalogue']
  },
  {
    id: 'concealed_marriage_claim',
    name: 'Concealed Marriage & Estate Claim',
    category: 'Inheritance',
    description: 'The victim held an unrecorded marriage certificate that would invalidate the culprit’s claim to a shipping fortune.',
    evidenceClueSnippet: 'A folded out-of-state marriage license tucked inside an estate solicitor’s letter.',
    eligibleRelationshipTags: ['family', 'confidant', 'rival'],
    requiredFacts: ['marriage_license', 'solicitor_memo'],
    clueHooks: ['registry_extract', 'estate_memo']
  }
];
