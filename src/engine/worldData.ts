/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CharacterRelationship,
  CharacterRole,
  CharacterRoutineEntry,
  CharacterTemplate,
  CharacterVoice,
  LocationTemplate
} from '../types/game';

interface StaffSpec {
  id: string;
  name: string;
  alias: string;
  title: string;
  locationId: string;
  shiftHours?: { open: string; close: string };
  ageBand?: CharacterTemplate['ageBand'];
  voice?: CharacterVoice;
  collar: string;
  tint: string;
  silhouette: string;
  hat?: string;
  persona: string;
  bio: string;
  preferred?: string[];
  avoided?: string[];
  eligibility?: CharacterRole[];
}

interface FamilyMemberSpec {
  id: string;
  name: string;
  alias: string;
  title: string;
  familyName: string;
  ageBand?: CharacterTemplate['ageBand'];
  voice?: CharacterVoice;
  collar: string;
  tint: string;
  silhouette: string;
  hat?: string;
  persona: string;
  bio: string;
  routine: CharacterRoutineEntry[];
  relationships: CharacterRelationship[];
  preferred?: string[];
  avoided?: string[];
  eligibility?: CharacterRole[];
}

const VOICE_DEFAULTS: Record<CharacterVoice, CharacterTemplate['dialogueVoice']> = {
  cynical: {
    formality: 'clipped',
    verbosity: 'terse',
    vocabulary: 'streetwise, dry, pragmatic',
    verbalHabits: 'Glances toward the door before speaking.'
  },
  posh: {
    formality: 'formal',
    verbosity: 'measured',
    vocabulary: 'polite, refined, careful',
    verbalHabits: 'Straightens cuffs when pressed on details.'
  },
  defensive: {
    formality: 'formal',
    verbosity: 'measured',
    vocabulary: 'guarded, duty-bound, conscientious',
    verbalHabits: 'Folds hands tightly and sticks strictly to what was witnessed.'
  },
  nervous: {
    formality: 'clipped',
    verbosity: 'effusive',
    vocabulary: 'anxious, apologetic, detail-oriented',
    verbalHabits: 'Checks the wall clock twice mid-sentence.'
  },
  gruff: {
    formality: 'street',
    verbosity: 'terse',
    vocabulary: 'blunt, working-class, direct',
    verbalHabits: 'Speaks plainly without wasting breath.'
  }
};

const VOICE_PREFERRED_METHODS: Record<CharacterVoice, string[]> = {
  posh: [
    'brandy_poison',
    'silk_garrote',
    'letter_opener',
    'brass_candlestick',
    'pocket_derringer',
    'arsenic_tonic',
    'bone_dagger'
  ],
  gruff: [
    'heavy_pipe',
    'iron_crowbar',
    'bar_bottle',
    'hammer',
    'wrench',
    'snub_revolver',
    'service_automatic',
    'dock_hook',
    'training_dumbbell',
    'jump_rope'
  ],
  cynical: [
    'bone_dagger',
    'electrical_cable',
    'bar_ice_pick',
    'utility_knife',
    'pocket_derringer',
    'silk_garrote',
    'fillet_knife',
    'surgical_scalpel',
    'bone_saw'
  ],
  nervous: [
    'arsenic_tonic',
    'morphine_overdose',
    'surgical_scalpel',
    'kitchen_knife',
    'letter_opener',
    'brandy_poison',
    'bone_saw',
    'jump_rope'
  ],
  defensive: [
    'fire_poker',
    'brass_lamp',
    'kitchen_cleaver',
    'fillet_knife',
    'heavy_desk_ornament',
    'heavy_typewriter',
    'brass_candlestick'
  ]
};

const VOICE_DEFAULT_AVOIDED: Record<CharacterVoice, string[]> = {
  posh: ['dock_hook'],
  gruff: ['arsenic_tonic'],
  cynical: ['brass_candlestick'],
  nervous: ['training_dumbbell'],
  defensive: ['bone_saw']
};

function mergeVoicePreferredMethods(
  voice: CharacterVoice,
  customPreferred: string[] | undefined,
  avoided: string[]
): string[] {
  const combined = [...(customPreferred || []), ...(VOICE_PREFERRED_METHODS[voice] || [])];
  return Array.from(new Set(combined.filter((w) => !avoided.includes(w))));
}

const UNIVERSAL_MAIN_ROLES: CharacterRole[] = [
  'victim',
  'culprit',
  'suspect',
  'witness',
  'corroborator'
];

function makeStaffCharacter(spec: StaffSpec): CharacterTemplate {
  const voice = spec.voice || 'gruff';
  const avoided = spec.avoided || VOICE_DEFAULT_AVOIDED[voice];
  return {
    id: spec.id,
    name: spec.name,
    alias: spec.alias,
    title: spec.title,
    ageBand: spec.ageBand || 'middle_aged',
    publicPersona: spec.persona,
    biography: spec.bio,
    traits: ['observant', 'routine-bound', 'local-fixture'],
    goals: [`Keep shift duties orderly at ${spec.title}`],
    fears: ['Police shutdown costing weekly wages'],
    personalCode: ['Notice faces, clock the hour, and stay out of trouble'],
    skills: ['local_knowledge', 'shift_observation'],
    resources: ['venue_keys', 'shift_log'],
    routineLocations: [spec.locationId],
    routine: [
      {
        locationId: spec.locationId,
        timeWindow: spec.shiftHours ? `${spec.shiftHours.open}-${spec.shiftHours.close}` : 'shift',
        frequency: 'nightly',
        visitReason: `Assigned duty shift as ${spec.title}`
      }
    ],
    preferredMethods: mergeVoicePreferredMethods(voice, spec.preferred, avoided),
    avoidedMethods: avoided,
    relationships: [],
    voice,
    dialogueVoice: VOICE_DEFAULTS[voice],
    roleEligibility: Array.from(
      new Set<CharacterRole>(['staff', ...UNIVERSAL_MAIN_ROLES, ...(spec.eligibility || [])])
    ),
    secrets: [`Knows regular patrons who pass through ${spec.locationId}`],
    characterKind: 'staff',
    assignedLocationId: spec.locationId,
    ...(spec.shiftHours ? { shiftHours: spec.shiftHours } : {}),
    avatarStyle: {
      collar: spec.collar,
      tint: spec.tint,
      silhouette: spec.silhouette,
      ...(spec.hat ? { hat: spec.hat } : {})
    }
  };
}

function makeFamilyVisitor(spec: FamilyMemberSpec): CharacterTemplate {
  const voice = spec.voice || 'defensive';
  const avoided = spec.avoided || VOICE_DEFAULT_AVOIDED[voice];
  return {
    id: spec.id,
    name: spec.name,
    alias: spec.alias,
    title: spec.title,
    ageBand: spec.ageBand || 'middle_aged',
    publicPersona: spec.persona,
    biography: spec.bio,
    traits: ['family-oriented', 'observant', 'habitual'],
    goals: [`Look after the ${spec.familyName} household affairs`],
    fears: ['Neighborhood scandal reaching home'],
    personalCode: ['Mind your family first and keep honest hours'],
    skills: ['neighborhood_memory', 'errand_timing'],
    resources: ['household_ledger', 'transit_pass'],
    routineLocations: spec.routine.map((r) => r.locationId),
    routine: spec.routine,
    preferredMethods: mergeVoicePreferredMethods(voice, spec.preferred, avoided),
    avoidedMethods: avoided,
    relationships: spec.relationships,
    voice,
    dialogueVoice: VOICE_DEFAULTS[voice],
    roleEligibility: Array.from(
      new Set<CharacterRole>([...UNIVERSAL_MAIN_ROLES, ...(spec.eligibility || [])])
    ),
    secrets: [`Private ${spec.familyName} family errand kept off the parlor table`],
    characterKind: 'family_visitor',
    familyName: spec.familyName,
    avatarStyle: {
      collar: spec.collar,
      tint: spec.tint,
      silhouette: spec.silhouette,
      ...(spec.hat ? { hat: spec.hat } : {})
    }
  };
}

export const EXTRA_LOCATIONS: LocationTemplate[] = [
  {
    id: 'trinity_baptist',
    name: 'Trinity Baptist Church',
    district: 'Cathedral Heights',
    description: 'Red-brick sanctuary with tall oak doors, varnished choir pews, and a basement parish kitchen smelled faintly of wax polish and hymnals.',
    mapCoords: { x: 7, y: 21 },
    openingHours: { open: '07:00', close: '21:30' },
    accessRules: ['parish_sanctuary'],
    staffRoles: ['Pastor', 'Church Organist'],
    regularVisitorTags: ['family', 'choir'],
    naturalWeapons: ['brass_candlestick', 'fire_poker', 'brass_lamp', 'letter_opener', 'heavy_desk_ornament'],
    neverNaturalWeapons: ['snub_revolver', 'morphine_overdose'],
    connectedRoads: ['civic_cemetery', 'public_library', 'st_judes'],
    locationTags: ['church', 'public', 'cathedral'],
    isPublic: true,
    icon: 'Church',
    pointsOfInterest: [
      { coords: { top: 44, left: 40 }, label: 'Vestry Offering Desk', description: 'Envelopes sit stacked beside an open brass-bound collection ledger.', clueRewardId: 'sunday_offering_ledger' },
      { coords: { top: 68, left: 72 }, label: 'Organ Bench', description: 'Hymn numbers are clipped in pencil above the pedalboard.' }
    ]
  },
  {
    id: 'golden_crust_bakery',
    name: 'Golden Crust Bakery',
    district: 'Old Quarter',
    description: 'Warm yeast and charred hearth flour drift through steaming display windows packed with rye loaves, cinnamon twists, and waxed paper parcels.',
    mapCoords: { x: 7, y: 42 },
    openingHours: { open: '05:00', close: '17:00' },
    accessRules: ['public_shop'],
    staffRoles: ['Master Baker', 'Counter Clerk'],
    regularVisitorTags: ['family', 'commuter'],
    naturalWeapons: ['kitchen_cleaver', 'kitchen_knife', 'heavy_pipe', 'fire_poker'],
    neverNaturalWeapons: ['snub_revolver', 'morphine_overdose'],
    connectedRoads: ['st_judes', 'rosie_deli', 'blackwood_antiquities', 'riverside_chapel'],
    locationTags: ['bakery', 'market', 'shop', 'public'],
    isPublic: true,
    icon: 'Store',
    pointsOfInterest: [
      { coords: { top: 48, left: 52 }, label: 'Flour Sack Scale', description: 'A stamped wholesale invoice pokes out beneath the brass counterweight.', clueRewardId: 'flour_delivery_receipt' },
      { coords: { top: 72, left: 26 }, label: 'Pastry Counter Bell', description: 'Sticky sugar smudges frame the register drawer.' }
    ]
  },
  {
    id: 'silver_spoon_diner',
    name: 'The Silver Spoon 24h Diner',
    district: 'Midtown District',
    description: 'Chrome-trimmed railcar booths glowing with neon coffee steam at all hours, frequented by night-shift cabbies, nurses, and insomniacs.',
    mapCoords: { x: 39, y: 34 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['public_diner'],
    staffRoles: ['Short-Order Cook', 'Night Waitress'],
    regularVisitorTags: ['cabbie', 'family', 'reporter'],
    naturalWeapons: ['kitchen_knife', 'kitchen_cleaver', 'bar_bottle', 'bar_ice_pick'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    connectedRoads: ['university_hall', 'grand_hotel', 'mercer_apothecary', 'pendelton_clinic', 'agency'],
    locationTags: ['restaurant', 'diner', 'midtown', 'public'],
    isPublic: true,
    icon: 'Utensils',
    pointsOfInterest: [
      { coords: { top: 55, left: 38 }, label: 'Counter Order Spindle', description: 'A coffee-ringed guest check carries an unfamiliar time notation.', clueRewardId: 'stained_counter_check' },
      { coords: { top: 32, left: 74 }, label: 'Corner Jukebox', description: 'Two nickels sit untouched on the chrome coin ledge.' }
    ]
  },
  {
    id: 'harborview_restaurant',
    name: 'The Harborview Chop House',
    district: 'Midtown Promenade',
    description: 'White linen tables, silver chafing dishes, and a mahogany cocktail bar overlooking the evening harbor lights.',
    mapCoords: { x: 76, y: 56 },
    openingHours: { open: '11:00', close: '23:30' },
    accessRules: ['public_dining'],
    staffRoles: ['Head Waiter', 'Cocktail Bartender', 'Executive Chef'],
    regularVisitorTags: ['socialite', 'family', 'politician'],
    naturalWeapons: ['kitchen_knife', 'kitchen_cleaver', 'bar_bottle', 'bar_ice_pick', 'brandy_poison'],
    neverNaturalWeapons: ['morphine_overdose', 'bone_saw'],
    connectedRoads: ['laundry_works', 'starlight_radio', 'blue_dahlia_club', 'velvet_lounge'],
    locationTags: ['restaurant', 'nightlife', 'midtown', 'public'],
    isPublic: true,
    icon: 'Utensils',
    pointsOfInterest: [
      { coords: { top: 44, left: 60 }, label: 'Maitre d’ Reservation Stand', description: 'One dinner reservation chit has been crossed out in heavy red crayon.', clueRewardId: 'reserved_table_chit' },
      { coords: { top: 68, left: 26 }, label: 'Service Bar Ice Bin', description: 'An empty crystal cordial glass sits beside the cocktail shaker rack.' }
    ]
  },
  {
    id: 'rosie_deli',
    name: 'Rosie’s Corner Delicatessen',
    district: 'Old Quarter',
    description: 'Hanging salamis, brine barrels, and a marble slicing counter where neighborhood households pick up evening supper provisions.',
    mapCoords: { x: 22, y: 42 },
    openingHours: { open: '06:30', close: '19:30' },
    accessRules: ['public_shop'],
    staffRoles: ['Deli Proprietor'],
    regularVisitorTags: ['family', 'tenant'],
    naturalWeapons: ['kitchen_knife', 'kitchen_cleaver', 'fillet_knife', 'utility_knife', 'bone_saw'],
    neverNaturalWeapons: ['morphine_overdose', 'snub_revolver'],
    connectedRoads: ['st_judes', 'golden_crust_bakery', 'blackwood_antiquities', 'pendelton_clinic'],
    locationTags: ['shop', 'market', 'old_quarter', 'public'],
    isPublic: true,
    icon: 'Store',
    pointsOfInterest: [
      { coords: { top: 52, left: 46 }, label: 'Twine & Butcher Paper Roll', description: 'A scrap of brown wrapping paper lists three initials and an hour.', clueRewardId: 'butcher_paper_note' }
    ]
  },
  {
    id: 'crimson_cabaret',
    name: 'The Crimson Garter Cabaret',
    district: 'Downtown Theatre Row',
    description: 'Velvet curtains, feather fans, and a brass stage pit. Backstage dressing rooms hum with powder smoke while waiters weave between smoky cabaret tables.',
    mapCoords: { x: 91, y: 67 },
    openingHours: { open: '19:00', close: '03:30' },
    accessRules: ['club_reservation'],
    staffRoles: ['Head Bartender', 'Burlesque Dancer', 'Chorus Stripper', 'Stage Bouncer'],
    regularVisitorTags: ['mobster', 'entertainer', 'gambler'],
    naturalWeapons: ['silk_garrote', 'bar_bottle', 'bar_ice_pick', 'pocket_derringer'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    connectedRoads: ['blue_dahlia_club', 'velvet_lounge', 'opera_house'],
    locationTags: ['nightclub', 'cabaret', 'nightlife', 'public'],
    isPublic: true,
    icon: 'Music',
    pointsOfInterest: [
      { coords: { top: 38, left: 66 }, label: 'Backstage Call Board', description: 'A dancer’s curtain-time slot is scratched out and replaced with "OUT EARLY".', clueRewardId: 'backstage_call_sheet' },
      { coords: { top: 66, left: 32 }, label: 'Stage-Side Bar', description: 'Several champagne coupes stand half-empty behind the mirrored rail.' }
    ]
  },
  {
    id: 'copper_kettle_tavern',
    name: 'The Copper Kettle Taproom',
    district: 'The Gutters',
    description: 'Sawdust floors, chipped oak booths, and draft beer taps frequented by mill hands and longshoremen off shift.',
    mapCoords: { x: 34, y: 78 },
    openingHours: { open: '14:00', close: '02:00' },
    accessRules: ['public_tavern'],
    staffRoles: ['Taproom Bartender', 'Barback'],
    regularVisitorTags: ['dockworker', 'gambler'],
    naturalWeapons: ['bar_bottle', 'heavy_pipe', 'utility_knife', 'kitchen_knife'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    connectedRoads: ['blackwood_antiquities', 'boxing_gym', 'ace_pawnshop', 'city_morgue', 'service_alley'],
    locationTags: ['nightclub', 'tavern', 'gutters', 'public'],
    isPublic: true,
    icon: 'Wine',
    pointsOfInterest: [
      { coords: { top: 45, left: 48 }, label: 'Chalkboard Tab Slate', description: 'One patron’s weekly drink tally has been wiped out with a damp rag.', clueRewardId: 'chalkboard_tab_slate' }
    ]
  },
  {
    id: 'mercer_apothecary',
    name: 'Mercer & Sons Apothecary',
    district: 'Midtown District',
    description: 'Rows of amber glass tincture jars behind mahogany shelving, scented with camphor, peppermint, and prescription compounding.',
    mapCoords: { x: 55, y: 35 },
    openingHours: { open: '08:00', close: '20:00' },
    accessRules: ['public_pharmacy'],
    staffRoles: ['Licensed Pharmacist'],
    regularVisitorTags: ['family', 'physician'],
    naturalWeapons: ['arsenic_tonic', 'morphine_overdose', 'surgical_scalpel', 'brandy_poison'],
    neverNaturalWeapons: ['dock_hook', 'heavy_typewriter'],
    connectedRoads: ['savile_tailors', 'continental_bank', 'central_railway', 'silver_spoon_diner', 'agency', 'taxi_garage'],
    locationTags: ['medical', 'pharmacy', 'midtown', 'public'],
    isPublic: true,
    icon: 'FlaskConical',
    pointsOfInterest: [
      { coords: { top: 42, left: 50 }, label: 'Poison Register Ledger', description: 'A signature line at the bottom bears smeared violet fountain ink.', clueRewardId: 'poison_register_page' }
    ]
  },
  {
    id: 'savile_tailors',
    name: 'Savile & Finch Bespoke Tailors',
    district: 'Uptown Promenade',
    description: 'Bolts of British worsted wool, brass measuring tapes, and chalk-marked coat lapels hanging beneath tall mirrors.',
    mapCoords: { x: 52, y: 23 },
    openingHours: { open: '09:00', close: '18:30' },
    accessRules: ['public_shop'],
    staffRoles: ['Master Tailor'],
    regularVisitorTags: ['socialite', 'family'],
    naturalWeapons: ['silk_garrote', 'letter_opener', 'utility_knife', 'brass_lamp'],
    neverNaturalWeapons: ['dock_hook', 'morphine_overdose'],
    connectedRoads: ['bookshop', 'grand_hotel', 'continental_bank', 'mercer_apothecary'],
    locationTags: ['shop', 'uptown', 'public'],
    isPublic: true,
    icon: 'Scissors',
    pointsOfInterest: [
      { coords: { top: 50, left: 44 }, label: 'Alterations Fitting Rack', description: 'A dark overcoat cuff tag demands "Urgent repair — torn near latch".', clueRewardId: 'chalked_suit_tag' }
    ]
  },
  {
    id: 'marigold_florist',
    name: 'Marigold Corner Florist',
    district: 'Uptown Promenade',
    description: 'Mist-beaded glass cases brimming with white lilies, gardenias, and mourning wreaths bound in black silk ribbon.',
    mapCoords: { x: 40, y: 9 },
    openingHours: { open: '07:30', close: '18:00' },
    accessRules: ['public_shop'],
    staffRoles: ['Head Florist'],
    regularVisitorTags: ['family', 'socialite'],
    naturalWeapons: ['utility_knife', 'kitchen_knife', 'silk_garrote', 'arsenic_tonic'],
    neverNaturalWeapons: ['snub_revolver', 'morphine_overdose'],
    connectedRoads: ['civic_cemetery', 'botanical_conservatory', 'bookshop', 'grand_hotel'],
    locationTags: ['shop', 'uptown', 'public'],
    isPublic: true,
    icon: 'Store',
    pointsOfInterest: [
      { coords: { top: 54, left: 52 }, label: 'Delivery Ribbon Spindle', description: 'A handwritten enclosure card was torn halfway through a name.', clueRewardId: 'ribbon_order_card' }
    ]
  },
  {
    id: 'ace_pawnshop',
    name: 'Ace Loan & Pawnshop',
    district: 'The Gutters',
    description: 'Brass-barred display windows cluttered with pocket watches, saxophones, wedding bands, and unclaimed leather valises.',
    mapCoords: { x: 48, y: 78 },
    openingHours: { open: '09:30', close: '20:00' },
    accessRules: ['public_shop'],
    staffRoles: ['Pawnbroker'],
    regularVisitorTags: ['gambler', 'collector'],
    naturalWeapons: ['snub_revolver', 'pocket_derringer', 'iron_crowbar', 'bone_dagger'],
    neverNaturalWeapons: ['morphine_overdose', 'kitchen_cleaver'],
    connectedRoads: ['tenement_court', 'copper_kettle_tavern', 'pool_hall', 'harbor_warehouse'],
    locationTags: ['shop', 'underworld', 'gutters', 'public'],
    isPublic: true,
    icon: 'KeyRound',
    pointsOfInterest: [
      { coords: { top: 46, left: 40 }, label: 'Pledge Ticket Drawer', description: 'A pink pawn stub marks a silver timepiece pledged below value.', clueRewardId: 'pawn_ticket_stub' }
    ]
  },
  {
    id: 'crown_barbershop',
    name: 'Crown Shave & Tonsorial Parlor',
    district: 'Midtown District',
    description: 'Spinning red-white-and-blue pole, steamed towels, bay rum bottles, and leather chairs where neighborhood gossip flows faster than lather.',
    mapCoords: { x: 42, y: 57 },
    openingHours: { open: '08:00', close: '19:30' },
    accessRules: ['public_shop'],
    staffRoles: ['Master Barber'],
    regularVisitorTags: ['family', 'mobster', 'police'],
    naturalWeapons: ['surgical_scalpel', 'utility_knife', 'silk_garrote', 'brass_lamp'],
    neverNaturalWeapons: ['dock_hook', 'brass_candlestick'],
    connectedRoads: ['pendelton_clinic', 'agency', 'laundry_works', 'boxing_gym', 'tenement_court'],
    locationTags: ['shop', 'midtown', 'public'],
    isPublic: true,
    icon: 'Scissors',
    pointsOfInterest: [
      { coords: { top: 48, left: 58 }, label: 'Chair Two Washbasin', description: 'A freshly stropped straight razor rests outside its sterilization tray.', clueRewardId: 'straight_razor_strop' }
    ]
  },
  {
    id: 'continental_bank',
    name: 'Continental Trust & Savings',
    district: 'Civic Centre',
    description: 'Imposing limestone columns, brass tellers’ cages, and an armored safe-deposit vault guarded under crisp federal time locks.',
    mapCoords: { x: 65, y: 20 },
    openingHours: { open: '08:30', close: '16:30' },
    accessRules: ['bank_lobby'],
    staffRoles: ['Branch Manager', 'Head Teller'],
    regularVisitorTags: ['family', 'socialite', 'lawyer'],
    naturalWeapons: ['service_automatic', 'heavy_desk_ornament', 'letter_opener', 'heavy_typewriter'],
    neverNaturalWeapons: ['dock_hook', 'kitchen_cleaver'],
    connectedRoads: ['savile_tailors', 'courthouse', 'city_hall', 'central_railway', 'mercer_apothecary'],
    locationTags: ['bank', 'civic', 'finance', 'public'],
    isPublic: true,
    icon: 'Landmark',
    pointsOfInterest: [
      { coords: { top: 44, left: 50 }, label: 'Safe-Deposit Sign-In Desk', description: 'Box #219 was accessed just before closing bell without the second signature.', clueRewardId: 'vault_entry_slip' }
    ]
  },
  {
    id: 'liberty_theater',
    name: 'The Liberty Picture Palace',
    district: 'Downtown Theatre Row',
    description: 'Marquee bulbs spelling out double features over crimson velvet seats and a projection booth humming with celluloid reels.',
    mapCoords: { x: 76, y: 78 },
    openingHours: { open: '12:00', close: '23:59' },
    accessRules: ['ticket_booth'],
    staffRoles: ['Ticket Cashier', 'Projectionist'],
    regularVisitorTags: ['family', 'entertainer'],
    naturalWeapons: ['electrical_cable', 'silk_garrote', 'heavy_pipe', 'utility_knife'],
    neverNaturalWeapons: ['dock_hook', 'morphine_overdose'],
    connectedRoads: ['pool_hall', 'velvet_lounge', 'opera_house', 'pier_four'],
    locationTags: ['theater', 'nightlife', 'public'],
    isPublic: true,
    icon: 'Film',
    pointsOfInterest: [
      { coords: { top: 56, left: 42 }, label: 'Ticket Chopper Box', description: 'Half of a balcony ticket stub bears a hasty grease-pencil note.', clueRewardId: 'torn_matinee_stub' }
    ]
  },
  {
    id: 'precinct_four',
    name: 'Precinct 4 Desk & Lockup',
    district: 'Civic Centre',
    description: 'Scuffed oak duty desk under caged bulbs, clattering teletype machines, and holding cells ringing the basement corridor.',
    mapCoords: { x: 80, y: 8 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['police_precinct'],
    staffRoles: ['Desk Sergeant', 'Evidence Clerk'],
    regularVisitorTags: ['police', 'lawyer'],
    naturalWeapons: ['snub_revolver', 'service_automatic', 'heavy_desk_ornament', 'heavy_typewriter'],
    neverNaturalWeapons: ['brandy_poison', 'kitchen_cleaver'],
    connectedRoads: ['courthouse', 'post_office', 'city_hall'],
    locationTags: ['police', 'civic', 'public'],
    isPublic: true,
    icon: 'Shield',
    pointsOfInterest: [
      { coords: { top: 46, left: 48 }, label: 'Precinct Call Blotter', description: 'An anonymous midnight tip was logged without a badge number.', clueRewardId: 'precinct_blotter_copy' }
    ]
  },
  {
    id: 'public_library',
    name: 'New Bay Carnegie Library',
    district: 'Cathedral Heights',
    description: 'Green banker lamps gleaming along walnut reading tables, whispering microfiche stacks, and city street directories.',
    mapCoords: { x: 20, y: 19 },
    openingHours: { open: '09:00', close: '21:00' },
    accessRules: ['public_library'],
    staffRoles: ['Head Librarian'],
    regularVisitorTags: ['family', 'reporter', 'student'],
    naturalWeapons: ['heavy_desk_ornament', 'letter_opener', 'brass_lamp', 'heavy_typewriter'],
    neverNaturalWeapons: ['snub_revolver', 'dock_hook'],
    connectedRoads: ['botanical_conservatory', 'trinity_baptist', 'st_judes', 'university_hall'],
    locationTags: ['civic', 'library', 'cathedral', 'public'],
    isPublic: true,
    icon: 'BookOpen',
    pointsOfInterest: [
      { coords: { top: 50, left: 52 }, label: 'Circulation Stamp Tray', description: 'A municipal harbor-engineering volume was checked out yesterday afternoon.', clueRewardId: 'library_borrower_card' }
    ]
  },
  {
    id: 'post_office',
    name: 'Central Post & Telegraph Annex',
    district: 'Civic Centre',
    description: 'Brass sorting pigeonholes, clicking Western Union keys, and waxed mailbags stacked for the midnight coastal train.',
    mapCoords: { x: 93, y: 10 },
    openingHours: { open: '07:00', close: '20:00' },
    accessRules: ['public_post'],
    staffRoles: ['Postmaster'],
    regularVisitorTags: ['family', 'commuter'],
    naturalWeapons: ['letter_opener', 'heavy_typewriter', 'heavy_desk_ornament', 'utility_knife'],
    neverNaturalWeapons: ['dock_hook', 'morphine_overdose'],
    connectedRoads: ['precinct_four', 'clarion_newsroom'],
    locationTags: ['civic', 'transit', 'public'],
    isPublic: true,
    icon: 'Mail',
    pointsOfInterest: [
      { coords: { top: 44, left: 54 }, label: 'Telegraph Hold Basket', description: 'A sealed wire marked "URGENT PICKUP" went unclaimed at closing.', clueRewardId: 'undelivered_telegram' }
    ]
  },
  {
    id: 'bus_depot',
    name: 'Greyhound Bayside Bus Depot',
    district: 'Civic Centre',
    description: 'Diesel exhaust curling beneath departure boards, wooden waiting benches, and coin-operated luggage lockers.',
    mapCoords: { x: 88, y: 33 },
    openingHours: { open: '05:00', close: '23:30' },
    accessRules: ['public_terminal'],
    staffRoles: ['Depot Dispatcher'],
    regularVisitorTags: ['traveler', 'family'],
    naturalWeapons: ['utility_knife', 'heavy_pipe', 'wrench', 'iron_crowbar', 'hammer'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    connectedRoads: ['clarion_newsroom', 'central_railway', 'grand_hotel2'],
    locationTags: ['transit', 'public'],
    isPublic: true,
    icon: 'Train',
    pointsOfInterest: [
      { coords: { top: 58, left: 46 }, label: 'Baggage Claim Counter', description: 'A yellow claim tag matches an overnight suitcase left behind.', clueRewardId: 'baggage_claim_tag' }
    ]
  },
  {
    id: 'taxi_garage',
    name: 'Yellow Cab Central Garage',
    district: 'Midtown District',
    description: 'Oil-stained concrete bays lined with checkered sedans, ticking dispatch radios, and clipboards of night fares.',
    mapCoords: { x: 63, y: 45 },
    openingHours: { open: '00:00', close: '23:59' },
    accessRules: ['garage_bay'],
    staffRoles: ['Night Dispatcher', 'Fleet Mechanic'],
    regularVisitorTags: ['cabbie', 'traveler'],
    naturalWeapons: ['wrench', 'iron_crowbar', 'heavy_pipe', 'hammer'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    connectedRoads: ['central_railway', 'mercer_apothecary', 'agency', 'laundry_works', 'starlight_radio'],
    locationTags: ['transit', 'garage', 'midtown', 'public'],
    isPublic: true,
    icon: 'Car',
    pointsOfInterest: [
      { coords: { top: 48, left: 50 }, label: 'Dispatch Sheet Clipboard', description: 'Carbon sheets record every Midtown pickup between 20:00 and midnight.', clueRewardId: 'grease_stained_trip_log' }
    ]
  },
  {
    id: 'foundry_works',
    name: 'Ironworks & Marine Foundry',
    district: 'Industrial Docklands',
    description: 'Soot-blackened brick foundry bays ringing with sledgehammers, cooling pig-iron molds, and overhead gantry hooks.',
    mapCoords: { x: 6, y: 88 },
    openingHours: { open: '06:00', close: '22:00' },
    accessRules: ['yard_gate'],
    staffRoles: ['Foundry Foreman'],
    regularVisitorTags: ['dockworker', 'laborer'],
    naturalWeapons: ['hammer', 'wrench', 'iron_crowbar', 'heavy_pipe', 'fire_poker', 'training_dumbbell', 'dock_hook'],
    neverNaturalWeapons: ['brandy_poison', 'morphine_overdose'],
    connectedRoads: ['dry_dock', 'textile_mill'],
    locationTags: ['industrial', 'docks', 'public'],
    isPublic: true,
    icon: 'Hammer',
    pointsOfInterest: [
      { coords: { top: 50, left: 52 }, label: 'Forging Tool Rack', description: 'One heavy iron peg stands empty above a fresh trail of soot.', clueRewardId: 'slag_hammer_rack' }
    ]
  },
  {
    id: 'textile_mill',
    name: 'Bayfront Spinning & Textile Mill',
    district: 'Industrial Docklands',
    description: 'Clattering mechanical looms, lint-dusted beams, and dye vats coloring heavy winter woolens.',
    mapCoords: { x: 19, y: 89 },
    openingHours: { open: '06:00', close: '20:00' },
    accessRules: ['mill_gate'],
    staffRoles: ['Mill Forewoman'],
    regularVisitorTags: ['family', 'laborer'],
    naturalWeapons: ['silk_garrote', 'utility_knife', 'electrical_cable', 'wrench'],
    neverNaturalWeapons: ['snub_revolver', 'morphine_overdose'],
    connectedRoads: ['city_morgue', 'foundry_works', 'service_alley'],
    locationTags: ['industrial', 'docks', 'public'],
    isPublic: true,
    icon: 'Warehouse',
    pointsOfInterest: [
      { coords: { top: 46, left: 48 }, label: 'Dye-Lot Sample Shelf', description: 'A midnight-blue wool bobbin matches fabric from recent winter coats.', clueRewardId: 'dyed_bobbin_sample' }
    ]
  },
  {
    id: 'botanical_conservatory',
    name: 'Glasshouse Botanical Conservatory',
    district: 'Cathedral Heights',
    description: 'Steamed iron-and-glass domes sheltering night-blooming orchids, wet gravel walkways, and locked greenhouse sheds.',
    mapCoords: { x: 25, y: 8 },
    openingHours: { open: '08:00', close: '19:00' },
    accessRules: ['public_park'],
    staffRoles: ['Head Botanist'],
    regularVisitorTags: ['family', 'socialite'],
    naturalWeapons: ['arsenic_tonic', 'utility_knife', 'iron_crowbar', 'heavy_pipe'],
    neverNaturalWeapons: ['snub_revolver', 'heavy_typewriter'],
    connectedRoads: ['civic_cemetery', 'public_library', 'marigold_florist'],
    locationTags: ['park', 'cathedral', 'public'],
    isPublic: true,
    icon: 'Compass',
    pointsOfInterest: [
      { coords: { top: 52, left: 46 }, label: 'Potting Shed Hook', description: 'A brass shed key hangs beside torn gardener’s twine.', clueRewardId: 'pruning_shed_key' }
    ]
  },
  {
    id: 'civic_cemetery',
    name: 'St. Sebastian Memorial Cemetery',
    district: 'Cathedral Heights',
    description: 'Mossy marble angels, iron cemetery gates, and gravel lanes winding between old New Bay family mausoleums.',
    mapCoords: { x: 10, y: 9 },
    openingHours: { open: '06:30', close: '18:30' },
    accessRules: ['public_grounds'],
    staffRoles: ['Cemetery Groundskeeper'],
    regularVisitorTags: ['family', 'clergy'],
    naturalWeapons: ['iron_crowbar', 'heavy_pipe', 'hammer', 'wrench'],
    neverNaturalWeapons: ['bar_bottle', 'heavy_typewriter'],
    connectedRoads: ['botanical_conservatory', 'trinity_baptist', 'marigold_florist'],
    locationTags: ['church', 'park', 'cathedral', 'public'],
    isPublic: true,
    icon: 'Landmark',
    pointsOfInterest: [
      { coords: { top: 48, left: 50 }, label: 'Sexton’s Tool Shed', description: 'A plot map bears a fresh pencil circle near the northern wall.', clueRewardId: 'sexton_burial_map' }
    ]
  },
  {
    id: 'university_hall',
    name: 'St. Sebastian Chemistry Hall',
    district: 'Cathedral Heights',
    description: 'Tiered lecture benches, slate chalkboards scrawled with alkaloid formulas, and locked glass reagent cupboards.',
    mapCoords: { x: 27, y: 29 },
    openingHours: { open: '08:00', close: '21:00' },
    accessRules: ['campus_hall'],
    staffRoles: ['Chemistry Professor'],
    regularVisitorTags: ['student', 'physician'],
    naturalWeapons: ['arsenic_tonic', 'brandy_poison', 'surgical_scalpel', 'heavy_desk_ornament', 'morphine_overdose'],
    neverNaturalWeapons: ['dock_hook', 'training_dumbbell'],
    connectedRoads: ['public_library', 'st_judes', 'grand_hotel', 'silver_spoon_diner'],
    locationTags: ['medical', 'academic', 'cathedral', 'public'],
    isPublic: true,
    icon: 'FlaskConical',
    pointsOfInterest: [
      { coords: { top: 46, left: 54 }, label: 'Reagent Supply Cabinet', description: 'An inventory card notes missing potassium salts signed out Tuesday.', clueRewardId: 'reagent_inventory_card' }
    ]
  },
  {
    id: 'courthouse',
    name: 'Municipal Criminal Courthouse',
    district: 'Civic Centre',
    description: 'Soaring limestone rotunda echoing with clerks’ footsteps, oak courtroom benches, and grand jury docket boards.',
    mapCoords: { x: 67, y: 8 },
    openingHours: { open: '08:00', close: '18:00' },
    accessRules: ['public_court'],
    staffRoles: ['Court Bailiff', 'Court Stenographer'],
    regularVisitorTags: ['lawyer', 'police', 'family'],
    naturalWeapons: ['heavy_desk_ornament', 'letter_opener', 'heavy_typewriter', 'brass_lamp'],
    neverNaturalWeapons: ['dock_hook', 'kitchen_cleaver'],
    connectedRoads: ['bookshop', 'precinct_four', 'continental_bank'],
    locationTags: ['civic', 'government', 'public'],
    isPublic: true,
    icon: 'Scale',
    pointsOfInterest: [
      { coords: { top: 50, left: 48 }, label: 'Probate & Subpoena Board', description: 'A scheduled morning hearing notice has been torn from its brass tack.', clueRewardId: 'subpoena_docket_copy' }
    ]
  },
  {
    id: 'opera_house',
    name: 'The Lyric Grand Opera House',
    district: 'Downtown Theatre Row',
    description: 'Gilt balconies, crimson box curtains, and labyrinthine backstage catwalks smelling of rosin and greasepaint.',
    mapCoords: { x: 92, y: 78 },
    openingHours: { open: '13:00', close: '23:30' },
    accessRules: ['box_office'],
    staffRoles: ['Stage Manager'],
    regularVisitorTags: ['socialite', 'entertainer'],
    naturalWeapons: ['silk_garrote', 'brass_lamp', 'electrical_cable', 'pocket_derringer'],
    neverNaturalWeapons: ['dock_hook', 'morphine_overdose'],
    connectedRoads: ['crimson_cabaret', 'liberty_theater', 'customs_house', 'ferry_terminal'],
    locationTags: ['theater', 'luxury', 'nightlife', 'public'],
    isPublic: true,
    icon: 'Music',
    pointsOfInterest: [
      { coords: { top: 44, left: 50 }, label: 'Box Four Dressing Table', description: 'A crumpled floral telegram warns of a midnight confrontation.', clueRewardId: 'dressing_room_telegram' }
    ]
  },
  {
    id: 'customs_house',
    name: 'Federal Port Customs House',
    district: 'Industrial Docklands',
    description: 'Salt-weathered granite counters stacked with shipping manifests, seized contraband tags, and brass weigh-scales.',
    mapCoords: { x: 83, y: 89 },
    openingHours: { open: '07:00', close: '21:00' },
    accessRules: ['customs_desk'],
    staffRoles: ['Customs Inspector'],
    regularVisitorTags: ['smuggler', 'dockworker'],
    naturalWeapons: ['service_automatic', 'heavy_desk_ornament', 'letter_opener', 'iron_crowbar'],
    neverNaturalWeapons: ['morphine_overdose', 'kitchen_cleaver'],
    connectedRoads: ['opera_house', 'pier_four', 'ferry_terminal'],
    locationTags: ['civic', 'docks', 'public'],
    isPublic: true,
    icon: 'Landmark',
    pointsOfInterest: [
      { coords: { top: 46, left: 44 }, label: 'Contraband Cage Log', description: 'A bonded cargo manifest shows mismatched crate weights.', clueRewardId: 'seized_manifest_carbon' }
    ]
  },
  {
    id: 'ferry_terminal',
    name: 'North Slip Ferry Terminal',
    district: 'Industrial Docklands',
    description: 'Weathered timber turnstiles shaking with arriving commuter ferries, brass fog bells, and damp newsstands.',
    mapCoords: { x: 95, y: 89 },
    openingHours: { open: '05:30', close: '23:00' },
    accessRules: ['public_terminal'],
    staffRoles: ['Ferry Ticketmaster'],
    regularVisitorTags: ['commuter', 'family', 'traveler'],
    naturalWeapons: ['dock_hook', 'heavy_pipe', 'utility_knife', 'hammer', 'jump_rope'],
    neverNaturalWeapons: ['morphine_overdose', 'brass_candlestick'],
    connectedRoads: ['opera_house', 'customs_house'],
    locationTags: ['transit', 'docks', 'public'],
    isPublic: true,
    icon: 'Anchor',
    pointsOfInterest: [
      { coords: { top: 52, left: 48 }, label: 'Pierhead Watch Box', description: 'The night crossing tally notes a lone passenger boarding in the fog.', clueRewardId: 'deckhand_watch_log' }
    ]
  },
  {
    id: 'pool_hall',
    name: 'Eight-Ball Billiards Parlor',
    district: 'The Gutters',
    description: 'Low green lamps hanging over torn baize tables, chalk dust, and men trading hushed tips between racks.',
    mapCoords: { x: 62, y: 78 },
    openingHours: { open: '11:00', close: '02:00' },
    accessRules: ['public_parlor'],
    staffRoles: ['Rack Steward'],
    regularVisitorTags: ['gambler', 'enforcer'],
    naturalWeapons: ['heavy_pipe', 'bar_bottle', 'snub_revolver', 'pocket_derringer'],
    neverNaturalWeapons: ['morphine_overdose', 'surgical_scalpel'],
    connectedRoads: ['cobblestone_alley', 'ace_pawnshop', 'liberty_theater', 'union_hall'],
    locationTags: ['nightlife', 'gutters', 'underworld', 'public'],
    isPublic: true,
    icon: 'Dumbbell',
    pointsOfInterest: [
      { coords: { top: 48, left: 52 }, label: 'Steward’s Chalk Tray', description: 'A folded IOU slip sits hidden under blue billiard chalk.', clueRewardId: 'chalked_break_ledger' }
    ]
  },
  {
    id: 'laundry_works',
    name: 'Pearl Steam Laundry Works',
    district: 'Midtown District',
    description: 'Hissing collar presses, starch steam, and wicker baskets tagged with hotel room numbers and household names.',
    mapCoords: { x: 58, y: 56 },
    openingHours: { open: '07:00', close: '20:00' },
    accessRules: ['public_shop'],
    staffRoles: ['Press Operator'],
    regularVisitorTags: ['family', 'hotel'],
    naturalWeapons: ['silk_garrote', 'heavy_pipe', 'electrical_cable', 'wrench'],
    neverNaturalWeapons: ['snub_revolver', 'morphine_overdose'],
    connectedRoads: ['agency', 'taxi_garage', 'crown_barbershop', 'tenement_court', 'cobblestone_alley', 'harborview_restaurant'],
    locationTags: ['shop', 'midtown', 'public'],
    isPublic: true,
    icon: 'Store',
    pointsOfInterest: [
      { coords: { top: 46, left: 46 }, label: 'Rush Collar Press', description: 'A stained dress-shirt tag marks an overnight rush cleaning order.', clueRewardId: 'collared_shirt_claim' }
    ]
  },
  {
    id: 'bookshop',
    name: 'Folio & Spine Rare Books',
    district: 'Uptown Promenade',
    description: 'Floor-to-ceiling cedar shelves smelling of calfskin bindings, old maps, and quiet private collectors.',
    mapCoords: { x: 53, y: 11 },
    openingHours: { open: '10:00', close: '19:30' },
    accessRules: ['public_shop'],
    staffRoles: ['Rare Book Dealer'],
    regularVisitorTags: ['antiquarian', 'family'],
    naturalWeapons: ['letter_opener', 'heavy_desk_ornament', 'brass_lamp', 'heavy_typewriter'],
    neverNaturalWeapons: ['dock_hook', 'training_dumbbell'],
    connectedRoads: ['marigold_florist', 'savile_tailors', 'courthouse'],
    locationTags: ['shop', 'uptown', 'antiques', 'public'],
    isPublic: true,
    icon: 'BookOpen',
    pointsOfInterest: [
      { coords: { top: 48, left: 50 }, label: 'First-Edition Display Case', description: 'A freshly penciled bookplate names a prominent estate library.', clueRewardId: 'ex_libris_bookplate' }
    ]
  }
];

export const EXTRA_CHARACTERS: CharacterTemplate[] = [
  // =========================================================================
  // DEDICATED STAFF FOR ALL 51 PUBLIC LOCATIONS (76 staff characters total)
  // =========================================================================

  // Multi-staff: Churches
  makeStaffCharacter({
    id: 'staff_trinity_pastor',
    name: 'Pastor Isaiah Brooks',
    alias: 'The Baptist Pastor',
    title: 'Senior Pastor at Trinity Baptist',
    locationId: 'trinity_baptist',
    voice: 'defensive',
    collar: 'Black Clerical Coat',
    tint: '#374151',
    silhouette: 'man_priest',
    persona: 'Steadfast neighborhood minister who knows every family in Cathedral Heights.',
    bio: 'Has led Trinity Baptist for eighteen years, counseling parishioners through hard times.',
    eligibility: ['staff', 'witness', 'corroborator', 'suspect']
  }),
  makeStaffCharacter({
    id: 'staff_trinity_organist',
    name: 'Clara Whitfield',
    alias: 'The Church Organist',
    title: 'Choir Organist at Trinity Baptist',
    locationId: 'trinity_baptist',
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Lace Collar Cardigan',
    tint: '#6B7280',
    silhouette: 'woman_glamour',
    persona: 'Precise choir director with an uncanny memory for who attended evening vespers.',
    bio: 'Keeps the hymn schedules and notices every stranger slipping into the back pews.'
  }),
  makeStaffCharacter({
    id: 'staff_st_judes_sexton',
    name: 'Barnaby Shaw',
    alias: 'The Belltower Sexton',
    title: 'Caretaker at St. Jude’s',
    locationId: 'st_judes',
    ageBand: 'elder',
    voice: 'gruff',
    collar: 'Wool Vest & Keys',
    tint: '#4B5563',
    silhouette: 'man_beard',
    persona: 'Quiet sexton who tends the brass candelabras and locks the belltower gate.',
    bio: 'Maintains St. Jude’s sanctuary during daylight and evening services.'
  }),
  makeStaffCharacter({
    id: 'staff_riverside_sexton',
    name: 'Sister Agnes Moran',
    alias: 'The Harbor Matron',
    title: 'Parish Sexton at Last Harbor Chapel',
    locationId: 'riverside_chapel',
    voice: 'defensive',
    collar: 'Simple Gray Habit',
    tint: '#475569',
    silhouette: 'woman_reporter',
    persona: 'Compassionate parish matron keeping soup and candles lit for dockside families.',
    bio: 'Remains in the chapel vestry from morning matins until evening closing.'
  }),

  // Multi-staff: Bakeries & Delis
  makeStaffCharacter({
    id: 'staff_bakery_baker',
    name: 'Otto Lindemann',
    alias: 'The Master Baker',
    title: 'Head Baker at Golden Crust Bakery',
    locationId: 'golden_crust_bakery',
    voice: 'gruff',
    collar: 'Flour-Dusted Apron',
    tint: '#D97706',
    silhouette: 'man_beard',
    persona: 'Early-rising breadmaker whose ovens roar before sunrise.',
    bio: 'Starts the sourdough batches at five sharp and chats with regulars through the counter pass.',
    eligibility: ['staff', 'witness', 'corroborator', 'suspect']
  }),
  makeStaffCharacter({
    id: 'staff_bakery_clerk',
    name: 'Penny Carmichael',
    alias: 'The Pastry Clerk',
    title: 'Counter Clerk at Golden Crust Bakery',
    locationId: 'golden_crust_bakery',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Gingham Apron',
    tint: '#F59E0B',
    silhouette: 'woman_reporter',
    persona: 'Quick-fingered counter clerk wrapping morning loaves and remembering every regular order.',
    bio: 'Works the register and front window throughout daytime bakery hours.'
  }),
  makeStaffCharacter({
    id: 'staff_rosie_deli',
    name: 'Rosie Abramowitz',
    alias: 'The Deli Proprietor',
    title: 'Owner of Rosie’s Corner Delicatessen',
    locationId: 'rosie_deli',
    voice: 'gruff',
    collar: 'Butcher Apron & Pencil',
    tint: '#92400E',
    silhouette: 'woman_glamour',
    persona: 'No-nonsense neighborhood grocer who tracks credit tabs to the penny.',
    bio: 'Slices cold cuts from dawn to supper and hears all Old Quarter gossip.'
  }),

  // Multi-staff: Restaurants & Diners
  makeStaffCharacter({
    id: 'staff_harborview_waiter',
    name: 'Henri Moreau',
    alias: 'The Chop House Waiter',
    title: 'Head Waiter at Harborview Chop House',
    locationId: 'harborview_restaurant',
    voice: 'posh',
    collar: 'White Dinner Jacket',
    tint: '#64748B',
    silhouette: 'man_glasses',
    persona: 'Impeccable dining room waiter who memorizes reservation tables and liquor orders.',
    bio: 'Manages the main floor booths from lunch service until closing bell.',
    eligibility: ['staff', 'witness', 'corroborator', 'suspect']
  }),
  makeStaffCharacter({
    id: 'staff_harborview_bartender',
    name: 'Gideon Vance-Pryce',
    alias: 'The Chop House Bartender',
    title: 'Cocktail Bartender at Harborview Chop House',
    locationId: 'harborview_restaurant',
    voice: 'cynical',
    collar: 'Pinstripe Vest & Bowtie',
    tint: '#1E293B',
    silhouette: 'man_fedora',
    persona: 'Sharp-eared barman mixing dry martinis while catching indiscreet whispered deals.',
    bio: 'Works the mahogany rail every lunch and dinner service.'
  }),
  makeStaffCharacter({
    id: 'staff_harborview_chef',
    name: 'Chef Marco Bellini',
    alias: 'The Line Chef',
    title: 'Executive Chef at Harborview Chop House',
    locationId: 'harborview_restaurant',
    voice: 'gruff',
    collar: 'Double-Breasted Chef Whites',
    tint: '#94A3B8',
    silhouette: 'man_beard',
    persona: 'Fierce kitchen perfectionist who watches the alley kitchen door like a hawk.',
    bio: 'Oversees every cut of beef and kitchen cleaver in the chop house.'
  }),
  makeStaffCharacter({
    id: 'staff_diner_cook',
    name: 'Alfonso "Al" Ruiz',
    alias: 'The Grill Cook',
    title: 'Day Grill Cook at Silver Spoon Diner',
    locationId: 'silver_spoon_diner',
    shiftHours: { open: '06:00', close: '18:00' },
    voice: 'gruff',
    collar: 'Grease-Spotted Whites',
    tint: '#78716C',
    silhouette: 'man_cop',
    persona: 'Steady grill man flipping hash and watching cabbies come through the chrome doors.',
    bio: 'Runs the daytime and supper grill from six in the morning until six.'
  }),
  makeStaffCharacter({
    id: 'staff_diner_waitress',
    name: 'Dolly Henderson',
    alias: 'The Diner Waitress',
    title: 'Night Counter Waitress at Silver Spoon Diner',
    locationId: 'silver_spoon_diner',
    shiftHours: { open: '16:00', close: '04:00' },
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Turquoise Diner Uniform',
    tint: '#0EA5E9',
    silhouette: 'woman_singer',
    persona: 'Wisecracking waitress balancing three coffee pots and noticing muddy shoes.',
    bio: 'Covers the swing and late-night coffee rush until four in the morning.'
  }),

  // Multi-staff: Nightclubs, Cabarets & Taverns (bartenders + strippers/burlesque dancers + bouncers)
  makeStaffCharacter({
    id: 'staff_cabaret_bartender',
    name: 'Sal "Two-Pour" Ferraro',
    alias: 'The Cabaret Bartender',
    title: 'Head Bartender at Crimson Garter Cabaret',
    locationId: 'crimson_cabaret',
    voice: 'cynical',
    collar: 'Black Satin Vest',
    tint: '#881337',
    silhouette: 'man_fedora',
    persona: 'Veteran bartender guarding the house register and backstage drink orders.',
    bio: 'Has worked Theatre Row bars for fifteen years without dropping a glass.'
  }),
  makeStaffCharacter({
    id: 'staff_cabaret_dancer1',
    name: 'Scarlett "Ruby" Delacroix',
    alias: 'The Crimson Headliner',
    title: 'Featured Stripper & Burlesque Dancer at Crimson Garter',
    locationId: 'crimson_cabaret',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Sequin Feather Wrap',
    tint: '#BE123C',
    silhouette: 'woman_glamour',
    persona: 'Glamorous burlesque stripper who sees high-rolling bosses when they think nobody is watching.',
    bio: 'Headlines the ten o’clock and midnight cabaret shows.',
    eligibility: ['staff', 'witness', 'corroborator', 'suspect']
  }),
  makeStaffCharacter({
    id: 'staff_cabaret_dancer2',
    name: 'Lola Marlowe',
    alias: 'The Chorus Stripper',
    title: 'Burlesque Stripper at Crimson Garter Cabaret',
    locationId: 'crimson_cabaret',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Velvet Stage Robe',
    tint: '#9F1239',
    silhouette: 'woman_singer',
    persona: 'Sharp-eyed chorus performer who tracks who slips backstage through the alley door.',
    bio: 'Dances both midnight sets and shares dressing table gossip.'
  }),
  makeStaffCharacter({
    id: 'staff_cabaret_bouncer',
    name: 'Moose Kowalczyk',
    alias: 'The Stage Door Bouncer',
    title: 'Floor Bouncer at Crimson Garter Cabaret',
    locationId: 'crimson_cabaret',
    voice: 'gruff',
    collar: 'Tight Tuxedo Coat',
    tint: '#334155',
    silhouette: 'man_cop',
    persona: 'Broad-shouldered doorman checking guest lists and throwing out rowdy drunks.',
    bio: 'Stands watch between the stage door and velvet rope every night.'
  }),
  makeStaffCharacter({
    id: 'staff_velvet_bartender',
    name: 'Louie Mercer',
    alias: 'The Velvet Mixologist',
    title: 'Night Bartender at The Velvet Lounge',
    locationId: 'velvet_lounge',
    voice: 'cynical',
    collar: 'Burgundy Bar Jacket',
    tint: '#7F1D1D',
    silhouette: 'man_glasses',
    persona: 'Quiet barman pouring smoky rye behind Malone’s red curtains.',
    bio: 'Knows which regulars drink alone and which booths take envelopes.'
  }),
  makeStaffCharacter({
    id: 'staff_velvet_dancer',
    name: 'Yvonne "Fifi" Laurent',
    alias: 'The Velvet Dancer',
    title: 'Burlesque Stripper at The Velvet Lounge',
    locationId: 'velvet_lounge',
    ageBand: 'young_adult',
    voice: 'posh',
    collar: 'Black Satin Gloves',
    tint: '#A21CAF',
    silhouette: 'woman_glamour',
    persona: 'Cool-headed exotic dancer performing late numbers under amber spotlights.',
    bio: 'Notices every pocket watch and cigar brand in the front booths.'
  }),
  makeStaffCharacter({
    id: 'staff_velvet_bouncer',
    name: 'Bruno DeLuca',
    alias: 'The Velvet Doorman',
    title: 'Speakeasy Bouncer at The Velvet Lounge',
    locationId: 'velvet_lounge',
    voice: 'gruff',
    collar: 'Heavy Wool Overcoat',
    tint: '#1F2937',
    silhouette: 'man_fedora',
    persona: 'Unblinking doorman guarding the downstairs speakeasy peephole.',
    bio: 'Checks coats, umbrellas, and sidearms at Malone’s entrance.'
  }),
  makeStaffCharacter({
    id: 'staff_dahlia_waiter',
    name: 'Maurice Chevalier-Dupont',
    alias: 'The Dahlia Head Waiter',
    title: 'Head Waiter at Blue Dahlia Supper Club',
    locationId: 'blue_dahlia_club',
    voice: 'posh',
    collar: 'Tailcoat & White Gloves',
    tint: '#1D4ED8',
    silhouette: 'man_glasses',
    persona: 'Smooth supper-club maitre d’ seating uptown patrons in private booths.',
    bio: 'Manages the dining room floor and private reservations.'
  }),
  makeStaffCharacter({
    id: 'staff_dahlia_bartender',
    name: 'Teddy Rourke',
    alias: 'The Dahlia Barman',
    title: 'Bartender at Blue Dahlia Supper Club',
    locationId: 'blue_dahlia_club',
    voice: 'cynical',
    collar: 'Midnight Blue Vest',
    tint: '#1E3A8A',
    silhouette: 'man_cop',
    persona: 'Fast-handed cocktail man keeping track of bar tabs and kitchen exits.',
    bio: 'Works every set from opening until last call.'
  }),
  makeStaffCharacter({
    id: 'staff_dahlia_dancer',
    name: 'Nadia Rostova',
    alias: 'The Dahlia Fan Dancer',
    title: 'Cabaret Dancer at Blue Dahlia Supper Club',
    locationId: 'blue_dahlia_club',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Silk Fringe Shawl',
    tint: '#4338CA',
    silhouette: 'woman_singer',
    persona: 'Striking late-night club performer with sharp instincts for nervous patrons.',
    bio: 'Performs between jazz sets and watches the service corridor.'
  }),
  makeStaffCharacter({
    id: 'staff_copper_bartender',
    name: 'Seamus McBride',
    alias: 'The Taproom Publican',
    title: 'Bartender at Copper Kettle Taproom',
    locationId: 'copper_kettle_tavern',
    voice: 'gruff',
    collar: 'Rolled Flannel Sleeves',
    tint: '#B45309',
    silhouette: 'man_beard',
    persona: 'Stout tavern keeper pulling stout and keeping dockworkers civil.',
    bio: 'Stands behind the copper taps every afternoon until two.'
  }),
  makeStaffCharacter({
    id: 'staff_copper_barback',
    name: 'Mickey O’Shea',
    alias: 'The Barback',
    title: 'Taproom Barback at Copper Kettle',
    locationId: 'copper_kettle_tavern',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Canvas Bar Apron',
    tint: '#78350F',
    silhouette: 'man_cop',
    persona: 'Hardworking cellar runner hauling ice and scrubbing bar mugs.',
    bio: 'Watches the back bottle alley between barrel deliveries.'
  }),

  // Shops, Medical, Civic, Hotels & Media Staff
  makeStaffCharacter({
    id: 'staff_grand_hotel_concierge',
    name: 'Reginald Ashworth',
    alias: 'The St. Moritz Concierge',
    title: 'Day Concierge at Grand St. Moritz Hotel',
    locationId: 'grand_hotel',
    shiftHours: { open: '07:00', close: '20:00' },
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Gold-Braided Morning Coat',
    tint: '#A16207',
    silhouette: 'man_glasses',
    persona: 'Discreet concierge who notes every guest’s key drop and carriage arrival.',
    bio: 'Oversees the Uptown lobby desk and private suite mail from morning until evening.'
  }),
  makeStaffCharacter({
    id: 'staff_grand_hotel_maid',
    name: 'Nora Gallagher',
    alias: 'The Floor Maid',
    title: 'Head Housekeeper at Grand St. Moritz Hotel',
    locationId: 'grand_hotel',
    shiftHours: { open: '07:00', close: '17:00' },
    voice: 'defensive',
    collar: 'Pressed Apron Dress',
    tint: '#4B5563',
    silhouette: 'woman_reporter',
    persona: 'Observant housekeeper who notices switched glasses and disturbed drapes.',
    bio: 'Tends suites across the St. Moritz promenade during daytime rounds.'
  }),
  makeStaffCharacter({
    id: 'staff_grand_hotel_nightclerk',
    name: 'Edmund Carmichael',
    alias: 'The St. Moritz Night Clerk',
    title: 'Night Desk Clerk at Grand St. Moritz Hotel',
    locationId: 'grand_hotel',
    shiftHours: { open: '20:00', close: '07:00' },
    voice: 'posh',
    collar: 'Midnight Brass-Buttoned Coat',
    tint: '#78350F',
    silhouette: 'man_glasses',
    persona: 'Quiet night deskman watching late guests slip keys under the mezzanine.',
    bio: 'Takes over the Grand St. Moritz front desk at eight every evening.'
  }),
  makeStaffCharacter({
    id: 'staff_starlight_manager',
    name: 'Julian Vance-Sterling',
    alias: 'The Starlight Night Manager',
    title: 'Night Manager at Starlight Grand Hotel',
    locationId: 'grand_hotel2',
    shiftHours: { open: '18:00', close: '06:00' },
    voice: 'posh',
    collar: 'Charcoal Double-Breasted',
    tint: '#6D28D9',
    silhouette: 'man_fedora',
    persona: 'Suave hotel manager keeping VIP suites quiet through the night shift.',
    bio: 'Logs evening guest check-ins and late service elevator traffic from six to dawn.'
  }),
  makeStaffCharacter({
    id: 'staff_starlight_concierge',
    name: 'Beatrice-Anne Greer',
    alias: 'The Starlight Day Clerk',
    title: 'Day Receptionist at Starlight Grand Hotel',
    locationId: 'grand_hotel2',
    shiftHours: { open: '06:00', close: '18:00' },
    voice: 'posh',
    collar: 'Tailored Navy Suit',
    tint: '#4F46E5',
    silhouette: 'woman_glamour',
    persona: 'Crisp daytime receptionist handling telegrams and hotel safekeeping keys.',
    bio: 'Minds the Starlight marble front desk from six in the morning till six.'
  }),
  makeStaffCharacter({
    id: 'staff_antiquities_clerk',
    name: 'Hester Finch',
    alias: 'The Curio Clerk',
    title: 'Shop Assistant at Blackwood Antiquities',
    locationId: 'blackwood_antiquities',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Tweedy Smock & Spectacles',
    tint: '#7C2D12',
    silhouette: 'woman_reporter',
    persona: 'Careful cataloguer dusting clockwork relics and rare knives.',
    bio: 'Manages daytime counter sales for Silas Thorne.'
  }),
  makeStaffCharacter({
    id: 'staff_pier_dockmaster',
    name: 'Captain Gus Halloway',
    alias: 'The Pier 4 Dockmaster',
    title: 'Day Dockmaster at Waterfront Pier 4',
    locationId: 'pier_four',
    shiftHours: { open: '06:00', close: '19:00' },
    ageBand: 'elder',
    voice: 'gruff',
    collar: 'Oilskin Pea Coat',
    tint: '#0F766E',
    silhouette: 'man_beard',
    hat: 'Watch Cap',
    persona: 'Salt-crusted harbor veteran logging every daytime barge tie-up.',
    bio: 'Watches the boathouse hoists and loading slips from dawn until seven in the evening.'
  }),
  makeStaffCharacter({
    id: 'staff_pier_watchman',
    name: 'Barney Muldoon',
    alias: 'The Pier 4 Night Watchman',
    title: 'Night Wharf Watchman at Waterfront Pier 4',
    locationId: 'pier_four',
    shiftHours: { open: '19:00', close: '06:00' },
    ageBand: 'elder',
    voice: 'cynical',
    collar: 'Storm Lantern & Oilskin',
    tint: '#115E59',
    silhouette: 'man_fedora',
    persona: 'Lantern-carrying night watchman listening for oars slapping the pilings after dark.',
    bio: 'Takes the Pier 4 boathouse watch strictly from seven at night until dawn.'
  }),
  makeStaffCharacter({
    id: 'staff_clinic_nurse',
    name: 'Nurse Clara Holloway',
    alias: 'The Dispensary Nurse',
    title: 'Head Nurse at Pendelton Dispensary',
    locationId: 'pendelton_clinic',
    voice: 'defensive',
    collar: 'Starched White Cap & Coat',
    tint: '#0369A1',
    silhouette: 'woman_reporter',
    persona: 'Sharp clinical nurse who keeps strict count of morphine vials and patient charts.',
    bio: 'Assists Dr. Pendelton during clinic hours and locks the narcotics cabinet.'
  }),
  makeStaffCharacter({
    id: 'staff_clarion_editor',
    name: 'Wallace "Wally" Riggs',
    alias: 'The Night Copy Editor',
    title: 'Night Copy Editor at Daily Clarion',
    locationId: 'clarion_newsroom',
    shiftHours: { open: '16:00', close: '04:00' },
    voice: 'cynical',
    collar: 'Green Visor & Garters',
    tint: '#3F6212',
    silhouette: 'man_glasses',
    persona: 'Ink-stained desk editor barking deadlines over roaring Linotype presses.',
    bio: 'Runs the evening and late-night editions from four in the afternoon till four a.m.'
  }),
  makeStaffCharacter({
    id: 'staff_clarion_pressman',
    name: 'Milo Kowal',
    alias: 'The Day Pressman',
    title: 'Day Press Operator at Daily Clarion',
    locationId: 'clarion_newsroom',
    shiftHours: { open: '06:00', close: '16:00' },
    voice: 'gruff',
    collar: 'Ink-Stained Work Apron',
    tint: '#365314',
    silhouette: 'man_cop',
    persona: 'Daytime press operator stripping old plates and watching couriers drop off tips.',
    bio: 'Works the morning and afternoon press floor before the night desk arrives.'
  }),
  makeStaffCharacter({
    id: 'staff_railway_master',
    name: 'Arthur Bradshaw',
    alias: 'The Station Master',
    title: 'Station Master at Central Railway Terminal',
    locationId: 'central_railway',
    shiftHours: { open: '08:00', close: '22:00' },
    voice: 'defensive',
    collar: 'Brass-Buttoned Uniform',
    tint: '#1E40AF',
    silhouette: 'man_cop',
    hat: 'Station Cap',
    persona: 'Punctual rail official running concourse clocks and luggage lockers by the second.',
    bio: 'Oversees daytime and evening express departures at the concourse.'
  }),
  makeStaffCharacter({
    id: 'staff_boxing_trainer',
    name: 'Marty Doyle',
    alias: 'The Cut Man',
    title: 'Gym Trainer at Ninth-Round Boxing Club',
    locationId: 'boxing_gym',
    ageBand: 'elder',
    voice: 'gruff',
    collar: 'Sweatshirt & Towel',
    tint: '#9A3412',
    silhouette: 'man_beard',
    persona: 'Pugnacious trainer taping knuckles and watching gamblers linger by the ring.',
    bio: 'Runs sparring sessions and locks the medicine cabinet every night.'
  }),
  makeStaffCharacter({
    id: 'staff_morgue_examiner',
    name: 'Dr. Leonard Kroll',
    alias: 'The Night Coroner',
    title: 'Night Medical Examiner at Municipal Morgue',
    locationId: 'city_morgue',
    shiftHours: { open: '18:00', close: '06:00' },
    voice: 'posh',
    collar: 'Rubberized Surgical Apron',
    tint: '#334155',
    silhouette: 'man_glasses',
    persona: 'Detached pathologist speaking in cold anatomical precision.',
    bio: 'Works the 18:00–06:00 night basement shift examining unexplained deaths.'
  }),
  makeStaffCharacter({
    id: 'staff_morgue_attendant',
    name: 'Simon Phipps',
    alias: 'The Day Morgue Orderly',
    title: 'Day Morgue Attendant at Municipal Morgue',
    locationId: 'city_morgue',
    shiftHours: { open: '06:00', close: '18:00' },
    voice: 'nervous',
    collar: 'Grey Canvas Lab Coat',
    tint: '#475569',
    silhouette: 'man_cop',
    persona: 'Quiet daytime attendant logging coroner case folders and specimen trays.',
    bio: 'Maintains the basement intake ledger from six in the morning until six.'
  }),
  makeStaffCharacter({
    id: 'staff_fish_monger',
    name: 'Salvadore Greco',
    alias: 'The Quay Fishmonger',
    title: 'Stall Boss at Gull Point Fish Market',
    locationId: 'fish_market',
    voice: 'gruff',
    collar: 'Rubberized Apron',
    tint: '#0E7490',
    silhouette: 'man_beard',
    persona: 'Loud-voiced seafood dealer cutting ice blocks and filleting morning catch.',
    bio: 'Opens the market stalls at 04:00 sharp and tracks crate buyers.'
  }),
  makeStaffCharacter({
    id: 'staff_drydock_foreman',
    name: 'Red Callahan-Voss',
    alias: 'The Yard Foreman',
    title: 'Day Welding Foreman at Pier Nine Dry Dock',
    locationId: 'dry_dock',
    shiftHours: { open: '06:00', close: '18:00' },
    voice: 'gruff',
    collar: 'Riveted Leather Jacket',
    tint: '#7C2D12',
    silhouette: 'man_cop',
    persona: 'Tough shipyard boss tracking daytime tools, cranes, and hull crews.',
    bio: 'Runs the Pier Nine repair basins through daylight shift until six.'
  }),
  makeStaffCharacter({
    id: 'staff_drydock_guard',
    name: 'Hector "Sparks" Delgado',
    alias: 'The Dry Dock Night Guard',
    title: 'Night Yard Guard at Pier Nine Dry Dock',
    locationId: 'dry_dock',
    shiftHours: { open: '18:00', close: '06:00' },
    voice: 'cynical',
    collar: 'Heavy Dock Coat & Torch',
    tint: '#431407',
    silhouette: 'man_fedora',
    persona: 'Steady night watch guard patrolling the oil-slick cranes after welding shuts down.',
    bio: 'Guards the Pier Nine dry dock gates strictly through the night shift.'
  }),
  makeStaffCharacter({
    id: 'staff_warehouse_watchman',
    name: 'Chester Gable',
    alias: 'The Cargo Watchman',
    title: 'Night Watchman at Warehouse No. 6',
    locationId: 'harbor_warehouse',
    shiftHours: { open: '18:00', close: '06:00' },
    ageBand: 'elder',
    voice: 'nervous',
    collar: 'Watchman Jacket & Lantern',
    tint: '#4D7C0F',
    silhouette: 'man_fedora',
    persona: 'Jittery lantern guard punching brass time-clocks among cargo crates after dark.',
    bio: 'Works the 18:00–06:00 night watch only, patrolling Blackwater Warehouse stacks every hour.'
  }),
  makeStaffCharacter({
    id: 'staff_warehouse_foreman',
    name: 'Mack Dugan',
    alias: 'The Day Freight Foreman',
    title: 'Day Warehouse Foreman at Warehouse No. 6',
    locationId: 'harbor_warehouse',
    shiftHours: { open: '06:00', close: '18:00' },
    voice: 'gruff',
    collar: 'Canvas Freight Jacket',
    tint: '#3F6212',
    silhouette: 'man_beard',
    persona: 'No-nonsense freight boss tallying crates and signing out stock during daylight hours.',
    bio: 'Runs Blackwater Warehouse No. 6 loading bays from six in the morning until night watch takes over.'
  }),
  makeStaffCharacter({
    id: 'staff_union_steward',
    name: 'Big John Donovan',
    alias: 'The Union Steward',
    title: 'Local 88 Steward at Union Hall',
    locationId: 'union_hall',
    voice: 'gruff',
    collar: 'Work Jacket & Union Pin',
    tint: '#B91C1C',
    silhouette: 'man_beard',
    persona: 'Commanding dock organizer guarding membership ledgers and strike funds.',
    bio: 'Keeps the hall open from 07:00 until eleven for longshoremen.'
  }),
  makeStaffCharacter({
    id: 'staff_tenement_super',
    name: 'Mrs. Olga Kaczmarek',
    alias: 'The Cinder Court Super',
    title: 'Superintendent at Cinder Court Tenement',
    locationId: 'tenement_court',
    shiftHours: { open: '07:00', close: '22:30' },
    ageBand: 'elder',
    voice: 'cynical',
    collar: 'Knitted Shawl & Ring of Keys',
    tint: '#6B21A8',
    silhouette: 'woman_glamour',
    persona: 'Sharp-eyed landlady watching the courtyard pump and fire escapes until late evening.',
    bio: 'Knows every tenant’s rent arrears and locks her apartment door after half past ten.'
  }),
  makeStaffCharacter({
    id: 'staff_cityhall_clerk',
    name: 'Percival Graves',
    alias: 'The Records Clerk',
    title: 'Deputy Registrar at Hall of Records',
    locationId: 'city_hall',
    voice: 'posh',
    collar: 'Pinstripe Suit & Sleeve Protectors',
    tint: '#374151',
    silhouette: 'man_glasses',
    persona: 'By-the-book civic archivist guarding deed binders and rubber stamps.',
    bio: 'Works the marble counters during city hall hours.'
  }),
  makeStaffCharacter({
    id: 'staff_radio_announcer',
    name: 'Dexter "Velvet" Cole',
    alias: 'The Midnight Announcer',
    title: 'Program Host at Starlight Radio',
    locationId: 'starlight_radio',
    shiftHours: { open: '16:00', close: '01:00' },
    voice: 'posh',
    collar: 'Camel Hair Jacket & Ascot',
    tint: '#9333EA',
    silhouette: 'man_fedora',
    persona: 'Silver-tongued broadcaster filling the evening and midnight airwaves with jazz and news bulletins.',
    bio: 'Broadcasts from Studio B from 16:00 until sign-off at 01:00.'
  }),
  makeStaffCharacter({
    id: 'staff_mercer_pharmacist',
    name: 'Dr. Eugene Mercer',
    alias: 'The Apothecary',
    title: 'Licensed Pharmacist at Mercer & Sons',
    locationId: 'mercer_apothecary',
    ageBand: 'elder',
    voice: 'nervous',
    collar: 'White Apothecary Coat',
    tint: '#0F766E',
    silhouette: 'man_glasses',
    persona: 'Meticulous chemist recording every poison and sedative buyer by name.',
    bio: 'Compounds tinctures and guards the locked glass cabinet.'
  }),
  makeStaffCharacter({
    id: 'staff_savile_tailor',
    name: 'Albert Finch',
    alias: 'The Bespoke Tailor',
    title: 'Master Tailor at Savile & Finch',
    locationId: 'savile_tailors',
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Measuring Tape & Waistcoat',
    tint: '#475569',
    silhouette: 'man_beard',
    persona: 'Discerning clothier who recognizes coat threads, buttons, and lapel cuts at ten paces.',
    bio: 'Fittings by appointment throughout business hours.'
  }),
  makeStaffCharacter({
    id: 'staff_marigold_florist',
    name: 'Iris Vance-Bloom',
    alias: 'The Corner Florist',
    title: 'Head Florist at Marigold Corner Florist',
    locationId: 'marigold_florist',
    voice: 'defensive',
    collar: 'Waxed Floral Apron',
    tint: '#059669',
    silhouette: 'woman_glamour',
    persona: 'Gentle florist arranging bouquets and discreet anonymous deliveries.',
    bio: 'Opens at 07:30 with fresh market stems.'
  }),
  makeStaffCharacter({
    id: 'staff_ace_pawnbroker',
    name: 'Soloman "Sol" Katz',
    alias: 'The Pawnbroker',
    title: 'Proprietor at Ace Loan & Pawnshop',
    locationId: 'ace_pawnshop',
    ageBand: 'elder',
    voice: 'cynical',
    collar: 'Loupe & Wool Cardigan',
    tint: '#B45309',
    silhouette: 'man_glasses',
    persona: 'Cautious pawnbroker who spots stolen silver and desperate gamblers immediately.',
    bio: 'Sits behind the brass grill until eight every evening.'
  }),
  makeStaffCharacter({
    id: 'staff_crown_barber',
    name: 'Vito Santoro',
    alias: 'The Master Barber',
    title: 'Barber at Crown Shave Parlor',
    locationId: 'crown_barbershop',
    voice: 'gruff',
    collar: 'Crisp White Barber Coat',
    tint: '#DC2626',
    silhouette: 'man_fedora',
    persona: 'Cheerful neighborhood barber who hears every Midtown rumor in the chair.',
    bio: 'Stropping razors from eight in the morning till dusk.'
  }),
  makeStaffCharacter({
    id: 'staff_bank_manager',
    name: 'Harrison Sterling-Grant',
    alias: 'The Bank Manager',
    title: 'Branch Manager at Continental Trust',
    locationId: 'continental_bank',
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Three-Piece Banker Suit',
    tint: '#1E293B',
    silhouette: 'man_glasses',
    persona: 'Formal financier guarding time-locked safe deposit records and wire transfers.',
    bio: 'Runs Continental Trust strictly within banking hours.',
    eligibility: ['staff', 'witness', 'corroborator', 'suspect']
  }),
  makeStaffCharacter({
    id: 'staff_bank_teller',
    name: 'Miriam Levy',
    alias: 'The Head Teller',
    title: 'Head Teller at Continental Trust',
    locationId: 'continental_bank',
    voice: 'nervous',
    collar: 'Crisp Blouse & Brass Badge',
    tint: '#334155',
    silhouette: 'woman_reporter',
    persona: 'Accurate cage teller who tracks large cash withdrawals and late wire drafts.',
    bio: 'Works Window 1 from opening bell to four-thirty.'
  }),
  makeStaffCharacter({
    id: 'staff_theater_cashier',
    name: 'Peggy Dolan',
    alias: 'The Box Office Cashier',
    title: 'Ticket Cashier at Liberty Picture Palace',
    locationId: 'liberty_theater',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Maroon Usher Jacket',
    tint: '#991B1B',
    silhouette: 'woman_singer',
    persona: 'Matinee cashier who spots solo ticket buyers slipping out before the newsreel.',
    bio: 'Works the brass ticket booth from noon until midnight.'
  }),
  makeStaffCharacter({
    id: 'staff_theater_projectionist',
    name: 'Buster Halvorsen',
    alias: 'The Projectionist',
    title: 'Chief Projectionist at Liberty Picture Palace',
    locationId: 'liberty_theater',
    voice: 'gruff',
    collar: 'Rolled Shirtsleeves',
    tint: '#475569',
    silhouette: 'man_cop',
    persona: 'Reel operator peering down through the balcony slit at the audience.',
    bio: 'Tends the twin carbon-arc projectors until closing.'
  }),
  makeStaffCharacter({
    id: 'staff_precinct_sergeant',
    name: 'Sergeant Dan Callahan-Burke',
    alias: 'The Desk Sergeant',
    title: 'Day Watch Sergeant at Precinct 4',
    locationId: 'precinct_four',
    shiftHours: { open: '06:00', close: '18:00' },
    voice: 'gruff',
    collar: 'Precinct Sergeant Stripes',
    tint: '#1E3A8A',
    silhouette: 'man_cop',
    hat: 'Police Visor',
    persona: 'Veteran watch commander taking blotter calls and dispatching patrolmen.',
    bio: 'Holds the Precinct 4 oak desk from six in the morning until six in the evening.'
  }),
  makeStaffCharacter({
    id: 'staff_precinct_clerk',
    name: 'Corporal Ray Novak',
    alias: 'The Evidence Clerk',
    title: 'Night Evidence Clerk at Precinct 4',
    locationId: 'precinct_four',
    shiftHours: { open: '16:00', close: '04:00' },
    voice: 'cynical',
    collar: 'Uniform Shirt & Tie',
    tint: '#1D4ED8',
    silhouette: 'man_glasses',
    persona: 'Meticulous clerk logging tagged exhibits and confiscated firearms.',
    bio: 'Guards the evidence cage door through swing and late-night precinct watches.'
  }),
  makeStaffCharacter({
    id: 'staff_library_librarian',
    name: 'Eleanor Pym',
    alias: 'The Head Librarian',
    title: 'Reference Librarian at Carnegie Library',
    locationId: 'public_library',
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Tweed Suit & Reading Chain',
    tint: '#5B21B6',
    silhouette: 'woman_glamour',
    persona: 'Quiet scholar tracking who pulled municipal blueprints and old clippings.',
    bio: 'Guards the reference desk until nine in the evening.'
  }),
  makeStaffCharacter({
    id: 'staff_post_master',
    name: 'Wilbur Finchley',
    alias: 'The Postmaster',
    title: 'Postmaster at Central Post Annex',
    locationId: 'post_office',
    voice: 'defensive',
    collar: 'Postal Uniform Coat',
    tint: '#1D4ED8',
    silhouette: 'man_glasses',
    persona: 'Precise telegraph and mail chief checking postmarks to the quarter hour.',
    bio: 'Supervises sorting tables and Western Union wires.'
  }),
  makeStaffCharacter({
    id: 'staff_bus_dispatcher',
    name: 'Carl "Clutch" Kowal',
    alias: 'The Depot Dispatcher',
    title: 'Bay Dispatcher at Greyhound Depot',
    locationId: 'bus_depot',
    shiftHours: { open: '07:00', close: '22:00' },
    voice: 'gruff',
    collar: 'Leather Dispatcher Cap',
    tint: '#4B5563',
    silhouette: 'man_cop',
    persona: 'Whistle-blowing bus dispatcher noting every late baggage claim.',
    bio: 'Calls coach departures during main daytime and evening schedules.'
  }),
  makeStaffCharacter({
    id: 'staff_taxi_dispatcher',
    name: 'Sammy "Speed" Shapiro',
    alias: 'The Yellow Cab Dispatcher',
    title: 'Night Dispatcher at Yellow Cab Garage',
    locationId: 'taxi_garage',
    shiftHours: { open: '18:00', close: '06:00' },
    voice: 'cynical',
    collar: 'Oil-Stained Sweater Vest',
    tint: '#CA8A04',
    silhouette: 'man_fedora',
    persona: 'Rapid-fire radio dispatcher knowing every cabbie’s pickup and drop-off.',
    bio: 'Logs night-shift trip carbons inside the garage booth from six till dawn.'
  }),
  makeStaffCharacter({
    id: 'staff_taxi_mechanic',
    name: 'Dutch Lindqvist',
    alias: 'The Fleet Mechanic',
    title: 'Day Fleet Mechanic at Yellow Cab Garage',
    locationId: 'taxi_garage',
    shiftHours: { open: '06:00', close: '18:00' },
    voice: 'gruff',
    collar: 'Grease Coveralls',
    tint: '#374151',
    silhouette: 'man_beard',
    persona: 'Quiet wrench-turner inspecting dented fenders and wet tires during day watch.',
    bio: 'Services the yellow fleet from six in the morning until six at dusk.'
  }),
  makeStaffCharacter({
    id: 'staff_foundry_foreman',
    name: 'Hank Kowalski',
    alias: 'The Foundry Boss',
    title: 'Shift Foreman at Marine Foundry',
    locationId: 'foundry_works',
    voice: 'gruff',
    collar: 'Scorched Canvas Jacket',
    tint: '#9A3412',
    silhouette: 'man_beard',
    persona: 'Iron-voiced foreman keeping track of molten pours and missing heavy tools.',
    bio: 'Runs daylight and swing shifts at the foundry.'
  }),
  makeStaffCharacter({
    id: 'staff_mill_forewoman',
    name: 'Martha Zielinski',
    alias: 'The Mill Forewoman',
    title: 'Floor Forewoman at Textile Mill',
    locationId: 'textile_mill',
    voice: 'defensive',
    collar: 'Wool Cardigan & Whistle',
    tint: '#4F46E5',
    silhouette: 'woman_reporter',
    persona: 'Sharp-eyed floor supervisor matching stray coat threads to exact dye batches.',
    bio: 'Walks the spinning floor from six to eight.'
  }),
  makeStaffCharacter({
    id: 'staff_conservatory_botanist',
    name: 'Dr. Evelyn Crane',
    alias: 'The Head Botanist',
    title: 'Curator at Botanical Conservatory',
    locationId: 'botanical_conservatory',
    voice: 'posh',
    collar: 'Linen Field Coat',
    tint: '#15803D',
    silhouette: 'woman_glamour',
    persona: 'Cool-mannered botanist knowing toxic nightshades from decorative blooms.',
    bio: 'Tends the glasshouses during daylight visiting hours.'
  }),
  makeStaffCharacter({
    id: 'staff_cemetery_keeper',
    name: 'Old Eli Mercer',
    alias: 'The Groundskeeper',
    title: 'Groundskeeper at Memorial Cemetery',
    locationId: 'civic_cemetery',
    ageBand: 'elder',
    voice: 'gruff',
    collar: 'Mud-Cuffed Coat',
    tint: '#3F6212',
    silhouette: 'man_beard',
    persona: 'Stoic caretaker who notices fresh tire tracks along the cemetery gravel.',
    bio: 'Unlocks the iron gates at dawn and locks up at dusk.'
  }),
  makeStaffCharacter({
    id: 'staff_university_prof',
    name: 'Prof. Simon Ash',
    alias: 'The Chemistry Don',
    title: 'Chemistry Professor at St. Sebastian Hall',
    locationId: 'university_hall',
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Tweed Jacket & Chalk',
    tint: '#0F766E',
    silhouette: 'man_glasses',
    persona: 'Analytical lecturer tracking lab reagents and late-evening library visitors.',
    bio: 'Holds afternoon labs and evening office hours.'
  }),
  makeStaffCharacter({
    id: 'staff_courthouse_bailiff',
    name: 'Bailiff Patrick Byrne',
    alias: 'The Court Bailiff',
    title: 'Head Bailiff at Criminal Courthouse',
    locationId: 'courthouse',
    voice: 'defensive',
    collar: 'Court Officer Coat',
    tint: '#1E293B',
    silhouette: 'man_cop',
    persona: 'Solemn courtroom officer guarding dockets and probate clerks.',
    bio: 'Stands at Courtroom Two doors throughout weekday sessions.'
  }),
  makeStaffCharacter({
    id: 'staff_courthouse_steno',
    name: 'Ruthie Caldwell',
    alias: 'The Stenographer',
    title: 'Official Stenographer at Criminal Courthouse',
    locationId: 'courthouse',
    voice: 'nervous',
    collar: 'Tailored Silk Blouse',
    tint: '#475569',
    silhouette: 'woman_reporter',
    persona: 'Fast-typing court reporter who catches every slipped threat in closed hearings.',
    bio: 'Records testimony and subpoena filings all day.'
  }),
  makeStaffCharacter({
    id: 'staff_opera_manager',
    name: 'Claude Beaumont',
    alias: 'The Opera Stage Manager',
    title: 'Stage Manager at Lyric Opera House',
    locationId: 'opera_house',
    voice: 'posh',
    collar: 'Velvet Cravat & Blazer',
    tint: '#7E22CE',
    silhouette: 'man_fedora',
    persona: 'Theatrical organizer guarding box patrons and backstage rope drops.',
    bio: 'Calls matinee and evening curtain cues.'
  }),
  makeStaffCharacter({
    id: 'staff_customs_inspector',
    name: 'Inspector Bernard Vance-Cole',
    alias: 'The Port Customs Chief',
    title: 'Customs Inspector at Federal Customs House',
    locationId: 'customs_house',
    voice: 'cynical',
    collar: 'Federal Trenchcoat',
    tint: '#1E3A8A',
    silhouette: 'man_fedora',
    persona: 'Hard-nosed harbor inspector hunting mismatched manifests and bribed tallymen.',
    bio: 'Works waterfront customs desks from morning shift to nine.'
  }),
  makeStaffCharacter({
    id: 'staff_ferry_ticketmaster',
    name: 'Mitch Donovan',
    alias: 'The Ferry Ticketmaster',
    title: 'Turnstile Chief at North Slip Ferry',
    locationId: 'ferry_terminal',
    voice: 'gruff',
    collar: 'Pea Coat & Ticket Punch',
    tint: '#0369A1',
    silhouette: 'man_cop',
    persona: 'Observant ferryman watching commuter hats in the fog.',
    bio: 'Punches pier tickets from first boat to last crossing.'
  }),
  makeStaffCharacter({
    id: 'staff_pool_steward',
    name: 'Chalky White',
    alias: 'The Billiards Steward',
    title: 'Rack Steward at Eight-Ball Parlor',
    locationId: 'pool_hall',
    voice: 'cynical',
    collar: 'Rolled Vest & Chalk',
    tint: '#15803D',
    silhouette: 'man_glasses',
    persona: 'Sly pool-hall steward holding side bets and spotting corner whispers.',
    bio: 'Racks eight-ball tables from eleven until two.'
  }),
  makeStaffCharacter({
    id: 'staff_laundry_operator',
    name: 'Mei-Ling Wu',
    alias: 'The Laundry Operator',
    title: 'Press Operator at Pearl Steam Laundry',
    locationId: 'laundry_works',
    voice: 'defensive',
    collar: 'Starched Linen Smock',
    tint: '#0284C7',
    silhouette: 'woman_reporter',
    persona: 'Diligent press operator spotting bloodstains, lipstick, and hotel tags on dropped collars.',
    bio: 'Handles rush hotel and household bundles all day.'
  }),
  makeStaffCharacter({
    id: 'staff_bookshop_dealer',
    name: 'Barnaby Locke',
    alias: 'The Rare Bookman',
    title: 'Proprietor at Folio & Spine Rare Books',
    locationId: 'bookshop',
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Corduroy Jacket & Spectacles',
    tint: '#78350F',
    silhouette: 'man_beard',
    persona: 'Gentleman bibliophile familiar with private estate stamps and forged codicils.',
    bio: 'Appraises manuscripts and minds the shop until evening.'
  }),

  // =========================================================================
  // NORMAL FAMILY MEMBERS — OCCASIONAL MULTI-LOCATION VISITORS (32 characters)
  // =========================================================================

  // Family 1: The Millers (Midtown / Cathedral working family)
  makeFamilyVisitor({
    id: 'fam_miller_thomas',
    name: 'Thomas Miller',
    alias: 'The Telegraph Clerk Father',
    title: 'Neighborhood Father (Miller Family)',
    familyName: 'Miller',
    voice: 'defensive',
    collar: 'Brown Tweed Overcoat',
    tint: '#78716C',
    silhouette: 'man_glasses',
    persona: 'Punctual family father picking up morning bread before checking bank and post errands.',
    bio: 'Married to Clara Miller; takes pride in an orderly household routine.',
    routine: [
      { locationId: 'golden_crust_bakery', timeWindow: '07:15-08:00', frequency: 'occasional', durationMinutes: 45, visitReason: 'Picking up fresh rye loaves for breakfast' },
      { locationId: 'post_office', timeWindow: '10:30-11:15', frequency: 'occasional', durationMinutes: 45, visitReason: 'Posting money order receipts' },
      { locationId: 'continental_bank', timeWindow: '13:30-14:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Depositing weekly household savings' }
    ],
    relationships: [
      { characterId: 'fam_miller_clara', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_miller_grace', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_miller_eddie', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_miller_clara',
    name: 'Clara Miller',
    alias: 'The Parish Mother',
    title: 'Homemaker (Miller Family)',
    familyName: 'Miller',
    voice: 'posh',
    collar: 'Wool Cloak & Brooch',
    tint: '#64748B',
    silhouette: 'woman_glamour',
    persona: 'Caring mother running neighborhood errands between church, deli, and library.',
    bio: 'Active in Trinity Baptist charity circles and keeps close track of Cathedral Heights.',
    routine: [
      { locationId: 'rosie_deli', timeWindow: '09:15-10:00', frequency: 'occasional', durationMinutes: 45, visitReason: 'Shopping for supper cold cuts and pickles' },
      { locationId: 'public_library', timeWindow: '11:30-12:30', frequency: 'occasional', durationMinutes: 60, visitReason: 'Returning mystery novels' },
      { locationId: 'trinity_baptist', timeWindow: '17:00-18:00', frequency: 'occasional', durationMinutes: 60, visitReason: 'Choir rehearsal and altar flowers' }
    ],
    relationships: [
      { characterId: 'fam_miller_thomas', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_miller_grace', relationshipType: 'family', strength: 10 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_miller_grace',
    name: 'Grace Miller',
    alias: 'The Nursing Student Daughter',
    title: 'Student Nurse (Miller Family)',
    familyName: 'Miller',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Navy Cape & Satchel',
    tint: '#1E40AF',
    silhouette: 'woman_reporter',
    persona: 'Earnest nursing student picking up prescriptions and grabbing coffee near campus.',
    bio: 'Studies chemistry notes between clinic errands and diner suppers.',
    routine: [
      { locationId: 'mercer_apothecary', timeWindow: '09:45-10:30', frequency: 'occasional', durationMinutes: 45, visitReason: 'Picking up grandmother’s tonic bottle' },
      { locationId: 'university_hall', timeWindow: '14:00-15:00', frequency: 'occasional', durationMinutes: 60, visitReason: 'Attending afternoon pharmacology seminar' },
      { locationId: 'silver_spoon_diner', timeWindow: '19:30-20:25', frequency: 'occasional', durationMinutes: 55, visitReason: 'Quick bowl of soup between study shifts' }
    ],
    relationships: [
      { characterId: 'fam_miller_clara', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_miller_eddie', relationshipType: 'family', strength: 8 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_miller_eddie',
    name: 'Eddie Miller',
    alias: 'The Errand Son',
    title: 'Apprentice Printer (Miller Family)',
    familyName: 'Miller',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Cloth Cap & Ink Cuffs',
    tint: '#3F6212',
    silhouette: 'man_cop',
    persona: 'Street-smart young printer making deliveries and catching late newsreels.',
    bio: 'Youngest Miller son who sneaks over to Liberty Picture Palace after dropping laundry.',
    routine: [
      { locationId: 'laundry_works', timeWindow: '10:00-10:45', frequency: 'occasional', durationMinutes: 45, visitReason: 'Dropping father’s Sunday dress shirts' },
      { locationId: 'clarion_newsroom', timeWindow: '15:15-16:05', frequency: 'occasional', durationMinutes: 50, visitReason: 'Delivering ink rollers to press floor' },
      { locationId: 'liberty_theater', timeWindow: '20:15-21:30', frequency: 'occasional', durationMinutes: 75, visitReason: 'Evening newsreel double feature' }
    ],
    relationships: [
      { characterId: 'fam_miller_thomas', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_miller_grace', relationshipType: 'family', strength: 8 }
    ]
  }),

  // Family 2: The Kowalskis (Dockside / Industrial family)
  makeFamilyVisitor({
    id: 'fam_kowalski_stan',
    name: 'Stanley Kowalski',
    alias: 'The Dockside Father',
    title: 'Crane Rigger (Kowalski Family)',
    familyName: 'Kowalski',
    voice: 'gruff',
    collar: 'Heavy Peacoat',
    tint: '#334155',
    silhouette: 'man_beard',
    persona: 'Blunt waterfront father stopping by the union hall, tavern, and fish market.',
    bio: 'Longtime Local 88 member raising three kids near the docks.',
    routine: [
      { locationId: 'fish_market', timeWindow: '08:30-09:15', frequency: 'occasional', durationMinutes: 45, visitReason: 'Buying Friday cod for family supper' },
      { locationId: 'union_hall', timeWindow: '12:15-13:10', frequency: 'occasional', durationMinutes: 55, visitReason: 'Paying monthly union dues' },
      { locationId: 'copper_kettle_tavern', timeWindow: '19:45-20:45', frequency: 'occasional', durationMinutes: 60, visitReason: 'One pint with dock mates before curfew' }
    ],
    relationships: [
      { characterId: 'fam_kowalski_helena', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_kowalski_frank', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_kowalski_helena',
    name: 'Helena Kowalski',
    alias: 'The Mill Mother',
    title: 'Seamstress (Kowalski Family)',
    familyName: 'Kowalski',
    voice: 'defensive',
    collar: 'Headscarf & Wool Coat',
    tint: '#6D28D9',
    silhouette: 'woman_reporter',
    persona: 'Hardworking mother visiting the chapel, bakery, and tenement courtyard.',
    bio: 'Never misses morning candles at Last Harbor Chapel.',
    routine: [
      { locationId: 'riverside_chapel', timeWindow: '09:00-09:50', frequency: 'occasional', durationMinutes: 50, visitReason: 'Lighting morning votive candle' },
      { locationId: 'golden_crust_bakery', timeWindow: '11:00-11:40', frequency: 'occasional', durationMinutes: 40, visitReason: 'Buying poppyseed rolls' },
      { locationId: 'textile_mill', timeWindow: '15:30-16:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Picking up spare wool remnants' }
    ],
    relationships: [
      { characterId: 'fam_kowalski_stan', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_kowalski_sofia', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_kowalski_frank',
    name: 'Frankie Kowalski',
    alias: 'The Amateur Boxer Brother',
    title: 'Machinist Apprentice (Kowalski Family)',
    familyName: 'Kowalski',
    ageBand: 'young_adult',
    voice: 'gruff',
    collar: 'Leather Flight Jacket',
    tint: '#9A3412',
    silhouette: 'man_cop',
    persona: 'Scrappy younger brother splitting evenings between boxing gym and pool hall.',
    bio: 'Trains at Marty Doyle’s gym and occasionally checks on his cousin at the foundry.',
    routine: [
      { locationId: 'foundry_works', timeWindow: '10:30-11:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Dropping lunch pail for uncle' },
      { locationId: 'boxing_gym', timeWindow: '17:30-18:30', frequency: 'occasional', durationMinutes: 60, visitReason: 'Evening heavy-bag sparring session' },
      { locationId: 'pool_hall', timeWindow: '20:30-21:25', frequency: 'occasional', durationMinutes: 55, visitReason: 'Two racks of eight-ball' }
    ],
    relationships: [
      { characterId: 'fam_kowalski_stan', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_kowalski_sofia', relationshipType: 'family', strength: 8 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_kowalski_sofia',
    name: 'Sofia Kowalski',
    alias: 'The Ferry Commuter Sister',
    title: 'Typist Clerk (Kowalski Family)',
    familyName: 'Kowalski',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Belted Gabardine Coat',
    tint: '#0284C7',
    silhouette: 'woman_glamour',
    persona: 'Observant typist taking the ferry and stopping by barber/diner corners.',
    bio: 'Notices hurried passengers crowding North Slip turnstiles.',
    routine: [
      { locationId: 'ferry_terminal', timeWindow: '08:45-09:30', frequency: 'occasional', durationMinutes: 45, visitReason: 'Morning ferry crossing' },
      { locationId: 'city_hall', timeWindow: '12:45-13:35', frequency: 'occasional', durationMinutes: 50, visitReason: 'Filing municipal tax stamp' },
      { locationId: 'silver_spoon_diner', timeWindow: '18:00-18:50', frequency: 'occasional', durationMinutes: 50, visitReason: 'Supper blue-plate special' }
    ],
    relationships: [
      { characterId: 'fam_kowalski_helena', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_kowalski_frank', relationshipType: 'family', strength: 8 }
    ]
  }),

  // Family 3: The Delgados (Old Quarter & Midtown family)
  makeFamilyVisitor({
    id: 'fam_delgado_mateo',
    name: 'Mateo Delgado',
    alias: 'The Barber Shop Patron',
    title: 'Watch Repairman (Delgado Family)',
    familyName: 'Delgado',
    voice: 'posh',
    collar: 'Vested Suit & Loupe',
    tint: '#B45309',
    silhouette: 'man_glasses',
    persona: 'Gentleman watchmaker checking antique timepieces and pawned heirlooms.',
    bio: 'Frequents Blackwood Antiquities and Ace Pawnshop searching for rare mainsprings.',
    routine: [
      { locationId: 'crown_barbershop', timeWindow: '09:30-10:15', frequency: 'occasional', durationMinutes: 45, visitReason: 'Morning shave and neighborhood talk' },
      { locationId: 'blackwood_antiquities', timeWindow: '13:00-13:55', frequency: 'occasional', durationMinutes: 55, visitReason: 'Inspecting mantel clock gears' },
      { locationId: 'ace_pawnshop', timeWindow: '16:30-17:15', frequency: 'occasional', durationMinutes: 45, visitReason: 'Appraising broken pocket watches' }
    ],
    relationships: [
      { characterId: 'fam_delgado_rosa', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_delgado_carlos', relationshipType: 'family', strength: 9 }
    ],
    eligibility: ['witness', 'corroborator', 'victim', 'suspect']
  }),
  makeFamilyVisitor({
    id: 'fam_delgado_rosa',
    name: 'Rosa Delgado',
    alias: 'The Florist Regular',
    title: 'Piano Teacher (Delgado Family)',
    familyName: 'Delgado',
    voice: 'posh',
    collar: 'Embroidered Cardigan',
    tint: '#059669',
    silhouette: 'woman_glamour',
    persona: 'Warm music teacher picking up sheet music, fresh lilies, and parish hymns.',
    bio: 'Teaches neighborhood children and visits the conservatory on sunny afternoons.',
    routine: [
      { locationId: 'marigold_florist', timeWindow: '10:15-10:55', frequency: 'occasional', durationMinutes: 40, visitReason: 'Picking up parlor carnations' },
      { locationId: 'botanical_conservatory', timeWindow: '14:15-15:10', frequency: 'occasional', durationMinutes: 55, visitReason: 'Sketching conservatory ferns' },
      { locationId: 'st_judes', timeWindow: '18:30-19:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Practicing evening sanctuary organ' }
    ],
    relationships: [
      { characterId: 'fam_delgado_mateo', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_delgado_lucia', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_delgado_carlos',
    name: 'Carlos Delgado',
    alias: 'The Cabby Brother',
    title: 'Relief Driver (Delgado Family)',
    familyName: 'Delgado',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Checkered Cap & Jacket',
    tint: '#CA8A04',
    silhouette: 'man_fedora',
    persona: 'Talkative relief cab driver knowing every shortcut between Midtown and the Gutters.',
    bio: 'Checks fares at Yellow Cab Garage and eats dinner at Harborview or Silver Spoon.',
    routine: [
      { locationId: 'taxi_garage', timeWindow: '09:00-09:45', frequency: 'occasional', durationMinutes: 45, visitReason: 'Turning in morning fare log' },
      { locationId: 'bus_depot', timeWindow: '14:00-14:45', frequency: 'occasional', durationMinutes: 45, visitReason: 'Waiting on coach passenger queue' },
      { locationId: 'silver_spoon_diner', timeWindow: '20:45-21:40', frequency: 'occasional', durationMinutes: 55, visitReason: 'Late dinner pie and black coffee' }
    ],
    relationships: [
      { characterId: 'fam_delgado_mateo', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_delgado_lucia', relationshipType: 'family', strength: 8 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_delgado_lucia',
    name: 'Lucia Delgado',
    alias: 'The Bookshop Niece',
    title: 'Library Assistant (Delgado Family)',
    familyName: 'Delgado',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Pleated Skirt & Cardigan',
    tint: '#78350F',
    silhouette: 'woman_reporter',
    persona: 'Bookish niece browsing Folio & Spine and mailing postcards home.',
    bio: 'Works part-time indexing newspapers and loves theater matinees.',
    routine: [
      { locationId: 'bookshop', timeWindow: '11:00-11:50', frequency: 'occasional', durationMinutes: 50, visitReason: 'Hunting out-of-print travel books' },
      { locationId: 'post_office', timeWindow: '15:00-15:40', frequency: 'occasional', durationMinutes: 40, visitReason: 'Mailing registered parcel' },
      { locationId: 'opera_house', timeWindow: '19:30-20:40', frequency: 'occasional', durationMinutes: 70, visitReason: 'Listening from upper gallery seat' }
    ],
    relationships: [
      { characterId: 'fam_delgado_rosa', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_delgado_carlos', relationshipType: 'family', strength: 8 }
    ]
  }),

  // Family 4: The O'Connors (Cathedral Heights & Civic family)
  makeFamilyVisitor({
    id: 'fam_oconnor_patrick',
    name: 'Patrick O’Connor',
    alias: 'The Retired Inspector Cousin',
    title: 'Retired Patrolman (O’Connor Family)',
    familyName: 'O’Connor',
    ageBand: 'elder',
    voice: 'gruff',
    collar: 'Tweed Coat & Cane',
    tint: '#1E3A8A',
    silhouette: 'man_beard',
    persona: 'Old-school retiree chatting with precinct clerks, cemetery keepers, and parish priests.',
    bio: 'Still drops by Precinct 4 to read the morning blotter and visit family graves.',
    routine: [
      { locationId: 'precinct_four', timeWindow: '09:15-10:05', frequency: 'occasional', durationMinutes: 50, visitReason: 'Visiting old watch sergeants' },
      { locationId: 'civic_cemetery', timeWindow: '13:30-14:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Placing flowers on family plot' },
      { locationId: 'copper_kettle_tavern', timeWindow: '17:30-18:25', frequency: 'occasional', durationMinutes: 55, visitReason: 'Evening whiskey and pipe' }
    ],
    relationships: [
      { characterId: 'fam_oconnor_bridget', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_oconnor_liam', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_oconnor_bridget',
    name: 'Bridget O’Connor',
    alias: 'The Parish Matron',
    title: 'Shopper & Grandmother (O’Connor Family)',
    familyName: 'O’Connor',
    ageBand: 'elder',
    voice: 'defensive',
    collar: 'Tartan Scarf & Basket',
    tint: '#0F766E',
    silhouette: 'woman_glamour',
    persona: 'Alert grandmother making early rounds between bakery, apothecary, and church.',
    bio: 'Remembers every coat color and carriage plate on her morning walk.',
    routine: [
      { locationId: 'golden_crust_bakery', timeWindow: '08:15-08:55', frequency: 'occasional', durationMinutes: 40, visitReason: 'Buying soda bread' },
      { locationId: 'mercer_apothecary', timeWindow: '11:15-11:55', frequency: 'occasional', durationMinutes: 40, visitReason: 'Refilling cough drops' },
      { locationId: 'st_judes', timeWindow: '16:15-17:10', frequency: 'occasional', durationMinutes: 55, visitReason: 'Afternoon rosary' }
    ],
    relationships: [
      { characterId: 'fam_oconnor_patrick', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_oconnor_maeve', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_oconnor_liam',
    name: 'Liam O’Connor',
    alias: 'The Law Clerk Nephew',
    title: 'Junior Solicitor (O’Connor Family)',
    familyName: 'O’Connor',
    ageBand: 'young_adult',
    voice: 'posh',
    collar: 'Briefcase & Felt Homburg',
    tint: '#374151',
    silhouette: 'man_glasses',
    persona: 'Ambitious young lawyer shuttling probate papers between courthouse and bank.',
    bio: 'Dines occasionally at Harborview Chop House with senior partners.',
    routine: [
      { locationId: 'courthouse', timeWindow: '10:00-10:55', frequency: 'occasional', durationMinutes: 55, visitReason: 'Filing probate docket petition' },
      { locationId: 'continental_bank', timeWindow: '14:15-15:00', frequency: 'occasional', durationMinutes: 45, visitReason: 'Notarizing estate trust signatures' },
      { locationId: 'harborview_restaurant', timeWindow: '20:00-21:10', frequency: 'occasional', durationMinutes: 70, visitReason: 'Late business supper' }
    ],
    relationships: [
      { characterId: 'fam_oconnor_patrick', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_oconnor_maeve', relationshipType: 'family', strength: 8 }
    ],
    eligibility: ['witness', 'corroborator', 'victim', 'suspect']
  }),
  makeFamilyVisitor({
    id: 'fam_oconnor_maeve',
    name: 'Maeve O’Connor',
    alias: 'The Radio Fan Sister',
    title: 'Switchboard Operator (O’Connor Family)',
    familyName: 'O’Connor',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Coral Wool Coat',
    tint: '#BE123C',
    silhouette: 'woman_singer',
    persona: 'Chatty telephone operator dropping by tailors, radio studio, and train concourse.',
    bio: 'Knows when trunk calls were patched across Midtown.',
    routine: [
      { locationId: 'savile_tailors', timeWindow: '12:00-12:45', frequency: 'occasional', durationMinutes: 45, visitReason: 'Picking up mended coat hem' },
      { locationId: 'starlight_radio', timeWindow: '18:00-18:50', frequency: 'occasional', durationMinutes: 50, visitReason: 'Watching live evening studio broadcast' },
      { locationId: 'central_railway', timeWindow: '21:15-22:00', frequency: 'occasional', durationMinutes: 45, visitReason: 'Meeting sister off the express train' }
    ],
    relationships: [
      { characterId: 'fam_oconnor_bridget', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_oconnor_liam', relationshipType: 'family', strength: 8 }
    ]
  }),

  // Family 5: The Goldsteins (Old Quarter & Civic merchants)
  makeFamilyVisitor({
    id: 'fam_goldstein_morris',
    name: 'Morris Goldstein',
    alias: 'The Textile Merchant',
    title: 'Cloth Jobber (Goldstein Family)',
    familyName: 'Goldstein',
    voice: 'posh',
    collar: 'Double-Breasted Worsted',
    tint: '#4338CA',
    silhouette: 'man_glasses',
    persona: 'Experienced wool jobber visiting tailors, textile mills, and his neighborhood deli.',
    bio: 'Supplies fine coat linings to Savile & Finch and checks Customs manifests.',
    routine: [
      { locationId: 'textile_mill', timeWindow: '09:30-10:25', frequency: 'occasional', durationMinutes: 55, visitReason: 'Inspecting winter tweed bolts' },
      { locationId: 'savile_tailors', timeWindow: '13:15-14:05', frequency: 'occasional', durationMinutes: 50, visitReason: 'Delivering charcoal wool samples' },
      { locationId: 'rosie_deli', timeWindow: '17:30-18:15', frequency: 'occasional', durationMinutes: 45, visitReason: 'Picking up rye and smoked brisket' }
    ],
    relationships: [
      { characterId: 'fam_goldstein_esther', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_goldstein_david', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_goldstein_esther',
    name: 'Esther Goldstein',
    alias: 'The Bookshop Patroness',
    title: 'Community Volunteer (Goldstein Family)',
    familyName: 'Goldstein',
    voice: 'posh',
    collar: 'Pearl Clip & Navy Coat',
    tint: '#1D4ED8',
    silhouette: 'woman_glamour',
    persona: 'Cultured volunteer dividing her week among library, opera house, and bookshop.',
    bio: 'Organizes charity matinees and tracks rare folio auctions.',
    routine: [
      { locationId: 'bookshop', timeWindow: '10:15-11:05', frequency: 'occasional', durationMinutes: 50, visitReason: 'Collecting reserved biography' },
      { locationId: 'public_library', timeWindow: '15:00-15:55', frequency: 'occasional', durationMinutes: 55, visitReason: 'Charity committee meeting' },
      { locationId: 'opera_house', timeWindow: '20:00-21:15', frequency: 'occasional', durationMinutes: 75, visitReason: 'Attending evening soprano aria' }
    ],
    relationships: [
      { characterId: 'fam_goldstein_morris', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_goldstein_rebecca', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_goldstein_david',
    name: 'David Goldstein',
    alias: 'The Customs Broker Son',
    title: 'Import Clerk (Goldstein Family)',
    familyName: 'Goldstein',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Gabardine Trench',
    tint: '#0F766E',
    silhouette: 'man_fedora',
    persona: 'Sharp port clerk clearing bonded shipments at Customs House and Pier 4.',
    bio: 'Spots tampered seals faster than most federal inspectors.',
    routine: [
      { locationId: 'customs_house', timeWindow: '09:15-10:10', frequency: 'occasional', durationMinutes: 55, visitReason: 'Stamping woolen freight clearances' },
      { locationId: 'harbor_warehouse', timeWindow: '14:30-15:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Verifying crate numbers' },
      { locationId: 'grand_hotel2', timeWindow: '20:30-21:30', frequency: 'occasional', durationMinutes: 60, visitReason: 'Meeting visiting shipping buyer' }
    ],
    relationships: [
      { characterId: 'fam_goldstein_morris', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_goldstein_rebecca', relationshipType: 'family', strength: 8 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_goldstein_rebecca',
    name: 'Rebecca Goldstein',
    alias: 'The Chemistry Student',
    title: 'Graduate Researcher (Goldstein Family)',
    familyName: 'Goldstein',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Tweed Blazer & Glasses',
    tint: '#0369A1',
    silhouette: 'woman_reporter',
    persona: 'Observant chemistry student visiting Pendelton clinic, lab hall, and dispensary.',
    bio: 'Notices missing alkaloid reagents on campus shelves.',
    routine: [
      { locationId: 'university_hall', timeWindow: '09:30-10:30', frequency: 'occasional', durationMinutes: 60, visitReason: 'Running morning titration notes' },
      { locationId: 'pendelton_clinic', timeWindow: '13:45-14:30', frequency: 'occasional', durationMinutes: 45, visitReason: 'Delivering lab assay report' },
      { locationId: 'continental_bank', timeWindow: '15:30-16:10', frequency: 'occasional', durationMinutes: 40, visitReason: 'Cashing scholarship stipend' }
    ],
    relationships: [
      { characterId: 'fam_goldstein_esther', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_goldstein_david', relationshipType: 'family', strength: 8 }
    ]
  }),

  // Family 6: The Bellinis (Theatre Row & Chop House family)
  makeFamilyVisitor({
    id: 'fam_bellini_angela',
    name: 'Angela Bellini',
    alias: 'The Chef’s Wife',
    title: 'Pantry Buyer (Bellini Family)',
    familyName: 'Bellini',
    voice: 'defensive',
    collar: 'Black Coat & Market Tote',
    tint: '#9F1239',
    silhouette: 'woman_glamour',
    persona: 'Practical matriarch shopping morning fish stalls and delivering linens to Harborview.',
    bio: 'Wife of Harborview Executive Chef Marco Bellini.',
    routine: [
      { locationId: 'fish_market', timeWindow: '07:45-08:30', frequency: 'occasional', durationMinutes: 45, visitReason: 'Selecting fresh sea bass for supper' },
      { locationId: 'laundry_works', timeWindow: '11:30-12:10', frequency: 'occasional', durationMinutes: 40, visitReason: 'Collecting starched kitchen aprons' },
      { locationId: 'harborview_restaurant', timeWindow: '16:30-17:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Dropping off family spice tins' }
    ],
    relationships: [
      { characterId: 'staff_harborview_chef', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_bellini_tony', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_bellini_tony',
    name: 'Anthony "Tony" Bellini',
    alias: 'The Cabaret Musician Son',
    title: 'Jazz Trumpeter (Bellini Family)',
    familyName: 'Bellini',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Sharp Lounge Suit',
    tint: '#7F1D1D',
    silhouette: 'man_fedora',
    persona: 'Late-night brass player sitting in at Blue Dahlia and Crimson Cabaret.',
    bio: 'Checks his pawned mute before hitting midnight nightclub sets.',
    routine: [
      { locationId: 'ace_pawnshop', timeWindow: '14:00-14:45', frequency: 'occasional', durationMinutes: 45, visitReason: 'Redeeming brass trumpet mute' },
      { locationId: 'blue_dahlia_club', timeWindow: '19:30-20:35', frequency: 'occasional', durationMinutes: 65, visitReason: 'Rehearsing early horn charts' },
      { locationId: 'crimson_cabaret', timeWindow: '21:15-22:20', frequency: 'occasional', durationMinutes: 65, visitReason: 'Guest horn solo on midnight bill' }
    ],
    relationships: [
      { characterId: 'fam_bellini_angela', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_bellini_gina', relationshipType: 'family', strength: 8 }
    ],
    eligibility: ['witness', 'corroborator', 'victim', 'suspect']
  }),
  makeFamilyVisitor({
    id: 'fam_bellini_gina',
    name: 'Gina Bellini',
    alias: 'The Theater Seamstress',
    title: 'Costume Mender (Bellini Family)',
    familyName: 'Bellini',
    ageBand: 'young_adult',
    voice: 'nervous',
    collar: 'Pin-Cushion Shawl',
    tint: '#6D28D9',
    silhouette: 'woman_singer',
    persona: 'Nimble costume seamstress mending evening gowns across Theatre Row.',
    bio: 'Delivers hemmed satin wraps to dancers and sopranos.',
    routine: [
      { locationId: 'marigold_florist', timeWindow: '10:45-11:25', frequency: 'occasional', durationMinutes: 40, visitReason: 'Buying silk corsage ribbon' },
      { locationId: 'opera_house', timeWindow: '15:30-16:25', frequency: 'occasional', durationMinutes: 55, visitReason: 'Fitting chorus wardrobe' },
      { locationId: 'crimson_cabaret', timeWindow: '19:15-20:05', frequency: 'occasional', durationMinutes: 50, visitReason: 'Delivering mended burlesque wrap' }
    ],
    relationships: [
      { characterId: 'fam_bellini_tony', relationshipType: 'family', strength: 8 },
      { characterId: 'fam_bellini_vincenzo', relationshipType: 'family', strength: 8 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_bellini_vincenzo',
    name: 'Vincenzo Bellini',
    alias: 'The Shipyard Uncle',
    title: 'Boiler Inspector (Bellini Family)',
    familyName: 'Bellini',
    ageBand: 'elder',
    voice: 'gruff',
    collar: 'Wool Cap & Wrench',
    tint: '#475569',
    silhouette: 'man_beard',
    persona: 'Sturdy uncle inspecting boilers across Pier Nine and foundry bays.',
    bio: 'Unwinds with a quiet haircut and harbor stroll.',
    routine: [
      { locationId: 'dry_dock', timeWindow: '08:30-09:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Checking tugboat boiler gauge' },
      { locationId: 'crown_barbershop', timeWindow: '13:30-14:15', frequency: 'occasional', durationMinutes: 45, visitReason: 'Afternoon trim and shave' },
      { locationId: 'pier_four', timeWindow: '18:15-19:00', frequency: 'occasional', durationMinutes: 45, visitReason: 'Inspecting boathouse pump seal' }
    ],
    relationships: [
      { characterId: 'fam_bellini_angela', relationshipType: 'family', strength: 8 },
      { characterId: 'fam_bellini_gina', relationshipType: 'family', strength: 8 }
    ]
  }),

  // Family 7: The Sterlings (Uptown Society family)
  makeFamilyVisitor({
    id: 'fam_sterling_arthur',
    name: 'Arthur Sterling',
    alias: 'The Trust Trustee',
    title: 'Estate Trustee (Sterling Family)',
    familyName: 'Sterling',
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Chesterfield Velvet Collar',
    tint: '#A16207',
    silhouette: 'man_glasses',
    hat: 'Homburg',
    persona: 'Patrician trustee auditing bank vaults, hotel lounges, and rare manuscripts.',
    bio: 'Related to Continental Trust manager Harrison Sterling-Grant.',
    routine: [
      { locationId: 'continental_bank', timeWindow: '10:30-11:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Inspecting estate bond box' },
      { locationId: 'grand_hotel', timeWindow: '17:30-18:30', frequency: 'occasional', durationMinutes: 60, visitReason: 'Evening sherry in mezzanine lounge' },
      { locationId: 'harborview_restaurant', timeWindow: '20:30-21:40', frequency: 'occasional', durationMinutes: 70, visitReason: 'Private club dinner meeting' }
    ],
    relationships: [
      { characterId: 'fam_sterling_beatrice', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_sterling_edward', relationshipType: 'family', strength: 9 }
    ],
    eligibility: ['witness', 'corroborator', 'victim', 'suspect']
  }),
  makeFamilyVisitor({
    id: 'fam_sterling_beatrice',
    name: 'Beatrice Sterling',
    alias: 'The Conservatory Patron',
    title: 'Society Patroness (Sterling Family)',
    familyName: 'Sterling',
    ageBand: 'elder',
    voice: 'posh',
    collar: 'Fox Fur Collar',
    tint: '#7E22CE',
    silhouette: 'woman_glamour',
    persona: 'Poised society dowager rotating among conservatory, florist, and Starlight Grand.',
    bio: 'Knows old family scandals that predate Prohibition.',
    routine: [
      { locationId: 'botanical_conservatory', timeWindow: '10:00-10:55', frequency: 'occasional', durationMinutes: 55, visitReason: 'Orchid society viewing' },
      { locationId: 'marigold_florist', timeWindow: '14:30-15:10', frequency: 'occasional', durationMinutes: 40, visitReason: 'Ordering dinner centerpiece' },
      { locationId: 'grand_hotel2', timeWindow: '19:00-20:00', frequency: 'occasional', durationMinutes: 60, visitReason: 'Lobby tea before opera curtain' }
    ],
    relationships: [
      { characterId: 'fam_sterling_arthur', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_sterling_claire', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_sterling_edward',
    name: 'Edward Sterling',
    alias: 'The Wayward Heir',
    title: 'Shipping Heir (Sterling Family)',
    familyName: 'Sterling',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Silk Scarf & Tuxedo',
    tint: '#991B1B',
    silhouette: 'man_fedora',
    persona: 'Restless heir frequenting pool halls, speakeasies, and bespoke tailors.',
    bio: 'Owes markers across Midtown and avoids his father’s bank desk.',
    routine: [
      { locationId: 'savile_tailors', timeWindow: '11:30-12:15', frequency: 'occasional', durationMinutes: 45, visitReason: 'Measuring evening dinner jacket' },
      { locationId: 'pool_hall', timeWindow: '16:00-17:00', frequency: 'occasional', durationMinutes: 60, visitReason: 'High-stakes nine-ball wager' },
      { locationId: 'velvet_lounge', timeWindow: '21:00-22:15', frequency: 'occasional', durationMinutes: 75, visitReason: 'Backroom highball and card game' }
    ],
    relationships: [
      { characterId: 'fam_sterling_arthur', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_sterling_claire', relationshipType: 'family', strength: 8 }
    ],
    eligibility: ['witness', 'corroborator', 'victim', 'suspect']
  }),
  makeFamilyVisitor({
    id: 'fam_sterling_claire',
    name: 'Claire Sterling',
    alias: 'The Opera Debutante',
    title: 'Arts Columnist (Sterling Family)',
    familyName: 'Sterling',
    ageBand: 'young_adult',
    voice: 'posh',
    collar: 'Velvet Evening Wrap',
    tint: '#4338CA',
    silhouette: 'woman_singer',
    persona: 'Articulate debutante reviewing radio programs, rare books, and gallery nights.',
    bio: 'Drops society notes directly at Clarion newsroom.',
    routine: [
      { locationId: 'bookshop', timeWindow: '12:30-13:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Browsing theater monographs' },
      { locationId: 'clarion_newsroom', timeWindow: '16:30-17:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Submitting arts column copy' },
      { locationId: 'blue_dahlia_club', timeWindow: '20:30-21:40', frequency: 'occasional', durationMinutes: 70, visitReason: 'Late supper after symphony' }
    ],
    relationships: [
      { characterId: 'fam_sterling_beatrice', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_sterling_edward', relationshipType: 'family', strength: 8 }
    ]
  }),

  // Family 8: The Chos (Midtown Laundry & Railway family)
  makeFamilyVisitor({
    id: 'fam_cho_kenji',
    name: 'Henry Cho',
    alias: 'The Railway Steward Father',
    title: 'Dining Car Steward (Cho Family)',
    familyName: 'Cho',
    voice: 'defensive',
    collar: 'Steward Jacket & Pocket Watch',
    tint: '#0E7490',
    silhouette: 'man_glasses',
    persona: 'Courteous dining-car steward tracking train schedules and ferry arrivals.',
    bio: 'Related to Pearl Steam Laundry’s Mei-Ling Wu.',
    routine: [
      { locationId: 'central_railway', timeWindow: '09:00-09:50', frequency: 'occasional', durationMinutes: 50, visitReason: 'Signing dining car provision sheet' },
      { locationId: 'laundry_works', timeWindow: '13:00-13:45', frequency: 'occasional', durationMinutes: 45, visitReason: 'Picking up starched table linens' },
      { locationId: 'bus_depot', timeWindow: '18:00-18:45', frequency: 'occasional', durationMinutes: 45, visitReason: 'Meeting incoming cousin from coast' }
    ],
    relationships: [
      { characterId: 'fam_cho_evelyn', relationshipType: 'family', strength: 10 },
      { characterId: 'staff_laundry_operator', relationshipType: 'family', strength: 8 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_cho_evelyn',
    name: 'Grace Cho',
    alias: 'The Midtown Florist Customer',
    title: 'Seamstress (Cho Family)',
    familyName: 'Cho',
    voice: 'nervous',
    collar: 'Silk Collar Cardigan',
    tint: '#059669',
    silhouette: 'woman_reporter',
    persona: 'Quietly observant Midtown mother who notices late deliveries at shops and clinics.',
    bio: 'Maintains brisk morning rounds across Midtown streets.',
    routine: [
      { locationId: 'rosie_deli', timeWindow: '08:30-09:10', frequency: 'occasional', durationMinutes: 40, visitReason: 'Shopping morning greens and bread' },
      { locationId: 'mercer_apothecary', timeWindow: '12:15-12:55', frequency: 'occasional', durationMinutes: 40, visitReason: 'Collecting herbal liniment' },
      { locationId: 'public_library', timeWindow: '16:30-17:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Reading evening periodicals' }
    ],
    relationships: [
      { characterId: 'fam_cho_kenji', relationshipType: 'family', strength: 10 },
      { characterId: 'fam_cho_daniel', relationshipType: 'family', strength: 9 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_cho_daniel',
    name: 'Daniel Cho',
    alias: 'The Med Student Brother',
    title: 'Hospital Intern (Cho Family)',
    familyName: 'Cho',
    ageBand: 'young_adult',
    voice: 'posh',
    collar: 'White Intern Coat',
    tint: '#0369A1',
    silhouette: 'man_glasses',
    persona: 'Tired medical intern rotating between municipal morgue, clinic, and silver spoon diner.',
    bio: 'Knows coroner arrival logs and dispensary hours by heart.',
    routine: [
      { locationId: 'city_morgue', timeWindow: '10:00-10:55', frequency: 'occasional', durationMinutes: 55, visitReason: 'Attending morning pathology briefing' },
      { locationId: 'pendelton_clinic', timeWindow: '15:30-16:20', frequency: 'occasional', durationMinutes: 50, visitReason: 'Borrowing medical reference texts' },
      { locationId: 'silver_spoon_diner', timeWindow: '21:00-21:50', frequency: 'occasional', durationMinutes: 50, visitReason: 'Midnight coffee between hospital rounds' }
    ],
    relationships: [
      { characterId: 'fam_cho_evelyn', relationshipType: 'family', strength: 9 },
      { characterId: 'fam_cho_iris', relationshipType: 'family', strength: 8 }
    ]
  }),
  makeFamilyVisitor({
    id: 'fam_cho_iris',
    name: 'Iris Cho',
    alias: 'The Radio Pianist Sister',
    title: 'Accompanist (Cho Family)',
    familyName: 'Cho',
    ageBand: 'young_adult',
    voice: 'cynical',
    collar: 'Velvet Blazer',
    tint: '#9333EA',
    silhouette: 'woman_singer',
    persona: 'Poised studio pianist rehearsing between Starlight Radio, Trinity Church, and Liberty Theater.',
    bio: 'Watches guests enter broadcast booths late in the evening.',
    routine: [
      { locationId: 'trinity_baptist', timeWindow: '11:00-11:50', frequency: 'occasional', durationMinutes: 50, visitReason: 'Rehearsing charity recital piece' },
      { locationId: 'liberty_theater', timeWindow: '16:15-17:10', frequency: 'occasional', durationMinutes: 55, visitReason: 'Playing intermission organ set' },
      { locationId: 'starlight_radio', timeWindow: '20:15-21:15', frequency: 'occasional', durationMinutes: 60, visitReason: 'Live nine o’clock jazz transcription' }
    ],
    relationships: [
      { characterId: 'fam_cho_daniel', relationshipType: 'family', strength: 8 },
      { characterId: 'fam_cho_kenji', relationshipType: 'family', strength: 9 }
    ]
  })
];
