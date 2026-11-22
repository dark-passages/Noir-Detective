/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CaseHiddenSolution,
  CaseInstance,
  CharacterCaseInstance,
  CharacterScheduleWindow,
  CharacterTemplate,
  ClueInstance,
  DialogueTopic,
  Difficulty,
  DiscoveryGraphEdge,
  InterviewState,
  LocationCaseInstance,
  LocationTemplate,
  MethodTemplate,
  MotiveTemplate,
  PointOfInterest,
  TimelineEntry,
  ValidationCheckResult,
  ValidationReport,
  WorkplaceAbsenceNotice
} from '../types/game';
import { SeededRNG, hashString } from './prng';
import {
  AGENCY_FULL_NAME,
  MASTER_CHARACTERS,
  MASTER_LOCATIONS,
  MASTER_MOTIVES,
  MASTER_WEAPONS,
  RULESET_VERSION
} from './templates';
import {
  AMBIENT_POI_CLUES,
  MOTIVE_HOOK_CLUES,
  WEAPON_CLUES,
  buildAlibiBreakClueSpec,
  buildDynamicVictimTie,
  buildSymmetricRoadGraph,
  calculateRoadTravelMinutes,
  describeAttireFibers,
  getCharacterClueHook,
  getCorroboratorRecordSpec,
  getLocationLeadHook,
  getLocationWeaponSpotSpec,
  interpolateFragment,
  pickVoiceFragment
} from './fragments';
import {
  COMPROMISING_VENUE_IDS,
  LOCATION_SCENE_PROFILES
} from './locationClueProfiles';
import {
  LOCATION_EVIDENCE_ITEMS,
  RoomEvidenceOption
} from './locationEvidenceItems';
import {
  DEFAULT_INVESTIGATION_START_MINUTES,
  INVESTIGATION_DAY_BASE,
  formatMinutesHHMM,
  getOperatingWindowOnDay,
  isCharacterPresentAt,
  isLocationOpenAt,
  parseHHMM
} from './timeUtils';

function parseDeterministicDate(seedString: string, rng: SeededRNG): string {
  const dailyMatch = /^DAILY-(\d{4})-(\d{2})-(\d{2})$/.exec(seedString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (dailyMatch) {
    const year = dailyMatch[1];
    const monthIdx = Math.max(0, Math.min(11, Number(dailyMatch[2]) - 1));
    const day = Number(dailyMatch[3]);
    return `${months[monthIdx]} ${day}, ${year}`;
  }
  const month = rng.pick(['Oct', 'Nov', 'Dec', 'Jan', 'Feb']);
  const day = rng.int(1, 28);
  return `${month} ${day}, 1947`;
}

function addMinutesToTime(timeStr: string, minsToAdd: number): string {
  const [hStr, mStr] = timeStr.split(':');
  const total = Number(hStr) * 60 + Number(mStr) + minsToAdd;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isWeaponNaturallyAvailableAt(weapon: MethodTemplate, loc: LocationTemplate): boolean {
  if (weapon.neverNaturallyAvailableAt.includes(loc.id)) return false;
  if (loc.neverNaturalWeapons.includes(weapon.id)) return false;
  return weapon.usuallyAvailableAt.includes(loc.id) || loc.naturalWeapons.includes(weapon.id);
}

function buildValidatedCaseAttempt(
  seedString: string,
  attemptNonce: number,
  difficulty: Difficulty = 'easy'
): CaseInstance {
  const compositeSeed =
    attemptNonce === 0
      ? `${seedString}|${RULESET_VERSION}`
      : `${seedString}|${RULESET_VERSION}|retry-${attemptNonce}`;

  const seedHash = hashString(compositeSeed);
  const baseRng = new SeededRNG(compositeSeed);

  // Derive independent deterministic sub-streams so modifying dialogue or difficulty doesn't reroll culprit or map
  const solutionRng = baseRng.subStream('solution');
  const castRng = baseRng.subStream('cast');
  const mapRng = baseRng.subStream('map');
  const timelineRng = baseRng.subStream('timeline');
  const clueRng = baseRng.subStream('clues');
  const dialogueRng = baseRng.subStream('dialogue');
  const liarRng = new SeededRNG(`${compositeSeed}|liars|${difficulty}`);

  // STAGE A: Case Frame Selection (victim, culprit, motive, weapon, murder-night time)
  const crimeTimeMinutes = solutionRng.pick([
    21 * 60 + 15,
    21 * 60 + 25,
    21 * 60 + 35,
    21 * 60 + 45,
    22 * 60 + 5,
    22 * 60 + 15
  ]);
  const crimeTime = formatMinutesHHMM(crimeTimeMinutes);

  const eligibleVictims = MASTER_CHARACTERS.filter(
    (c) => c.roleEligibility.includes('victim')
  );
  const shuffledVictims = castRng.shuffle(eligibleVictims);
  const victimTemplate = shuffledVictims[0];

  // Uniform culprit & motive selection across all remaining New Bay characters
  const eligibleCulprits = MASTER_CHARACTERS.filter(
    (c) => c.id !== victimTemplate.id && c.roleEligibility.includes('culprit')
  );
  const culpritTemplate = castRng.pick(eligibleCulprits);

  const motive: MotiveTemplate = solutionRng.pick(MASTER_MOTIVES);

  // Distractor motives for Murder Board (at least 10 motives so rich alternative theories can be tested)
  const otherMotives = solutionRng.shuffle(MASTER_MOTIVES.filter((m) => m.id !== motive.id));
  const candidateMotives = solutionRng.shuffle([motive, ...otherMotives]);

  // Pick crime scene location: any open non-agency venue OR a closed venue where the victim or culprit works (staff key access)
  const allNonAgencyLocations = MASTER_LOCATIONS.filter((l) => l.id !== 'agency');
  const openCrimeLocations = allNonAgencyLocations.filter((l) =>
    isLocationOpenAt(l.openingHours, crimeTimeMinutes)
  );
  const closedKeyholderLocations = allNonAgencyLocations.filter(
    (l) =>
      !isLocationOpenAt(l.openingHours, crimeTimeMinutes) &&
      (victimTemplate.assignedLocationId === l.id || culpritTemplate.assignedLocationId === l.id)
  );
  const useClosedKeyholderScene = closedKeyholderLocations.length > 0 && mapRng.float() < 0.5;
  const crimeLocationTemplate: LocationTemplate = useClosedKeyholderScene
    ? mapRng.pick(closedKeyholderLocations)
    : mapRng.pick(openCrimeLocations.length > 0 ? openCrimeLocations : allNonAgencyLocations);
  const crimeLocOpenAtCrime = isLocationOpenAt(crimeLocationTemplate.openingHours, crimeTimeMinutes);
  const victimWorksAtScene = victimTemplate.assignedLocationId === crimeLocationTemplate.id;
  const culpritWorksAtScene = culpritTemplate.assignedLocationId === crimeLocationTemplate.id;
  const sceneCloseStr = crimeLocationTemplate.openingHours?.close || 'closing';
  const dynamicTie = buildDynamicVictimTie(
    dialogueRng,
    victimTemplate,
    culpritTemplate,
    motive,
    MASTER_LOCATIONS,
    crimeLocationTemplate
  );

  // Pick weapon compatible with culprit's skills/preferences & crime scene transport rules
  // Cumbersome weapons can ONLY be used if naturally available at the crime scene.
  const eligibleWeapons = MASTER_WEAPONS.filter((w) => {
    if (culpritTemplate.avoidedMethods.includes(w.id)) return false;
    const naturalHere = isWeaponNaturallyAvailableAt(w, crimeLocationTemplate);
    if (!naturalHere && w.portability === 'Cumbersome') return false;
    return true;
  });
  const preferredEligible = eligibleWeapons.filter((w) =>
    culpritTemplate.preferredMethods.includes(w.id)
  );
  const baseWeaponPool =
    preferredEligible.length > 0 && solutionRng.float() < 0.5 ? preferredEligible : eligibleWeapons;
  const weightedWeaponPool = baseWeaponPool.flatMap((w) => {
    const naturalHere = isWeaponNaturallyAvailableAt(w, crimeLocationTemplate);
    if (naturalHere && w.portability === 'Cumbersome') return [w, w, w, w];
    if (naturalHere) return [w, w];
    return [w];
  });
  const weapon: MethodTemplate =
    weightedWeaponPool.length > 0 ? solutionRng.pick(weightedWeaponPool) : solutionRng.pick(MASTER_WEAPONS);

  // Distractor weapons for Murder Board (at least 20 weapons to choose from)
  const otherWeapons = solutionRng.shuffle(MASTER_WEAPONS.filter((w) => w.id !== weapon.id));
  const candidateWeapons = solutionRng.shuffle([weapon, ...otherWeapons]);

  const weaponNaturallyAtScene = isWeaponNaturallyAvailableAt(weapon, crimeLocationTemplate);
  const naturalWeaponHostLocations = MASTER_LOCATIONS.filter(
    (l) => l.id !== crimeLocationTemplate.id && l.id !== 'agency' && isWeaponNaturallyAvailableAt(weapon, l)
  );
  const preferredWeaponSources = weapon.usuallyAvailableAt.filter(
    (id) =>
      id !== crimeLocationTemplate.id &&
      id !== 'agency' &&
      naturalWeaponHostLocations.some((l) => l.id === id)
  );
  const extraWeaponSources = naturalWeaponHostLocations
    .map((l) => l.id)
    .filter((id) => !preferredWeaponSources.includes(id));
  const orderedWeaponSources = [...preferredWeaponSources, ...extraWeaponSources];
  const weaponSourceLocationId = weaponNaturallyAtScene
    ? crimeLocationTemplate.id
    : orderedWeaponSources.length > 0
      ? solutionRng.pick(orderedWeaponSources)
      : crimeLocationTemplate.id;

  // STAGE C (pre-selection of primary living cast across all 117 New Bay characters)
  const remainingCast = castRng.shuffle(
    MASTER_CHARACTERS.filter(
      (c) => c.id !== victimTemplate.id && c.id !== culpritTemplate.id
    )
  );
  const redHerringTemplate =
    remainingCast.find((c) => c.roleEligibility.includes('suspect')) || remainingCast[0];
  const secondSuspectTemplate =
    remainingCast.find((c) => c.id !== redHerringTemplate.id && c.roleEligibility.includes('suspect')) ||
    remainingCast[1];
  const corroboratorTemplate =
    remainingCast.find(
      (c) =>
        c.id !== redHerringTemplate.id &&
        c.id !== secondSuspectTemplate.id &&
        c.roleEligibility.includes('corroborator')
    ) || remainingCast[2];
  const witnessTemplate =
    remainingCast.find(
      (c) =>
        c.id !== redHerringTemplate.id &&
        c.id !== secondSuspectTemplate.id &&
        c.id !== corroboratorTemplate.id &&
        c.roleEligibility.includes('witness')
    ) || remainingCast[3];

  // STAGE B: Select Subset of Locations (Fixed coordinates & districts; select 9-10 interconnected locations)
  const soloRequiredWeaponSource =
    !weaponNaturallyAtScene && orderedWeaponSources.length <= 1 ? weaponSourceLocationId : null;
  const eligibleSec1RoutineRaw = culpritTemplate.routineLocations.filter((l) => {
    const tpl = MASTER_LOCATIONS.find((x) => x.id === l);
    return l !== crimeLocationTemplate.id && l !== 'agency' && isLocationOpenAt(tpl?.openingHours, crimeTimeMinutes);
  });
  const eligibleSec1Routine =
    soloRequiredWeaponSource && eligibleSec1RoutineRaw.some((l) => l !== soloRequiredWeaponSource)
      ? eligibleSec1RoutineRaw.filter((l) => l !== soloRequiredWeaponSource)
      : eligibleSec1RoutineRaw;
  const eligibleSec1FallbackRaw = mapRng.shuffle(
    MASTER_LOCATIONS.filter(
      (l) =>
        l.id !== crimeLocationTemplate.id &&
        l.id !== 'agency' &&
        l.isPublic !== false &&
        isLocationOpenAt(l.openingHours, crimeTimeMinutes)
    )
  );
  const eligibleSec1Fallback =
    soloRequiredWeaponSource && eligibleSec1FallbackRaw.some((l) => l.id !== soloRequiredWeaponSource)
      ? eligibleSec1FallbackRaw.filter((l) => l.id !== soloRequiredWeaponSource)
      : eligibleSec1FallbackRaw;
  const secondaryLocationId1 =
    eligibleSec1Routine.length > 0
      ? mapRng.pick(eligibleSec1Routine)
      : eligibleSec1Fallback[0]?.id || 'velvet_lounge';

  const eligibleAltWeaponSources = orderedWeaponSources.filter(
    (l) => l !== crimeLocationTemplate.id && l !== secondaryLocationId1 && l !== 'agency'
  );
  const auditStopFallbacks = mapRng.shuffle(
    MASTER_LOCATIONS.filter(
      (l) =>
        l.id !== 'agency' &&
        l.isPublic !== false &&
        l.id !== crimeLocationTemplate.id &&
        l.id !== secondaryLocationId1
    ).map((l) => l.id)
  );
  const secondaryLocationId2 =
    !weaponNaturallyAtScene
      ? weaponSourceLocationId !== crimeLocationTemplate.id &&
        weaponSourceLocationId !== secondaryLocationId1 &&
        weaponSourceLocationId !== 'agency'
        ? weaponSourceLocationId
        : eligibleAltWeaponSources.length > 0
          ? mapRng.pick(eligibleAltWeaponSources)
          : auditStopFallbacks[0] || 'blackwood_antiquities'
      : eligibleAltWeaponSources.length > 0
        ? mapRng.pick(eligibleAltWeaponSources)
        : auditStopFallbacks[0] || 'blackwood_antiquities';

  const corrWindow = timelineRng.pick([
    { start: '20:15', end: '22:00' },
    { start: '20:25', end: '22:10' },
    { start: '20:30', end: '22:15' },
    { start: '20:40', end: '22:25' }
  ]);
  const corrStartMinutes = parseHHMM(corrWindow.start);

  const eligibleSec3Routine = redHerringTemplate.routineLocations.filter((l) => {
    const tpl = MASTER_LOCATIONS.find((x) => x.id === l);
    return (
      l !== crimeLocationTemplate.id &&
      l !== secondaryLocationId1 &&
      l !== secondaryLocationId2 &&
      l !== 'agency' &&
      isLocationOpenAt(tpl?.openingHours, corrStartMinutes + 15)
    );
  });
  const eligibleSec3Fallback = mapRng.shuffle(
    MASTER_LOCATIONS.filter(
      (l) =>
        l.id !== 'agency' &&
        l.id !== crimeLocationTemplate.id &&
        l.id !== secondaryLocationId1 &&
        l.id !== secondaryLocationId2 &&
        isLocationOpenAt(l.openingHours, corrStartMinutes + 15)
    )
  );
  const secondaryLocationId3 =
    eligibleSec3Routine.length > 0
      ? mapRng.pick(eligibleSec3Routine)
      : eligibleSec3Fallback[0]?.id || 'silver_spoon_diner';

  // Pick 4 extra road-connected public locations (blending evening venues & daytime businesses like bakeries, churches, banks)
  const symmetricRoads = buildSymmetricRoadGraph(MASTER_LOCATIONS);
  const coreIds = new Set<string>([
    'agency',
    crimeLocationTemplate.id,
    secondaryLocationId1,
    secondaryLocationId2,
    secondaryLocationId3
  ]);
  const bonusPool = mapRng.shuffle(
    MASTER_LOCATIONS.filter(
      (l) =>
        !coreIds.has(l.id) &&
        l.isPublic !== false &&
        (symmetricRoads[crimeLocationTemplate.id]?.includes(l.id) ||
          symmetricRoads[secondaryLocationId1]?.includes(l.id) ||
          symmetricRoads[secondaryLocationId2]?.includes(l.id) ||
          symmetricRoads[secondaryLocationId3]?.includes(l.id))
    )
  );
  const fallbackBonusPool = mapRng.shuffle(
    MASTER_LOCATIONS.filter((l) => !coreIds.has(l.id) && l.isPublic !== false)
  );
  const combinedBonus = [...bonusPool, ...fallbackBonusPool];
  const bonusLocationIds: string[] = [];

  // Prioritize public home establishments of primary cast & victim (so missing-shift notices render at their workplaces)
  const coreCastHomeIds = [
    victimTemplate,
    culpritTemplate,
    redHerringTemplate,
    secondSuspectTemplate,
    corroboratorTemplate,
    witnessTemplate
  ]
    .map((t) => t.assignedLocationId)
    .filter(
      (id): id is string =>
        typeof id === 'string' &&
        !coreIds.has(id) &&
        MASTER_LOCATIONS.some((l) => l.id === id && l.isPublic !== false)
    );
  for (const homeId of coreCastHomeIds) {
    if (!coreIds.has(homeId)) {
      coreIds.add(homeId);
      bonusLocationIds.push(homeId);
    }
  }

  // Ensure at least one compromising nightlife/pawn venue (e.g. Crimson Garter Burlesque) is present when eligible
  const hasSecretVenue = Array.from(coreIds).some(
    (id) =>
      id !== 'agency' &&
      id !== crimeLocationTemplate.id &&
      id !== secondSuspectTemplate.assignedLocationId &&
      (COMPROMISING_VENUE_IDS as readonly string[]).includes(id)
  );
  if (!hasSecretVenue) {
    const secretCandidates = (COMPROMISING_VENUE_IDS as readonly string[]).filter(
      (id) =>
        !coreIds.has(id) &&
        id !== crimeLocationTemplate.id &&
        id !== secondSuspectTemplate.assignedLocationId &&
        MASTER_LOCATIONS.some((l) => l.id === id)
    );
    const chosenSecretVenue = secretCandidates.length > 0 ? mapRng.pick(secretCandidates) : undefined;
    if (chosenSecretVenue) {
      coreIds.add(chosenSecretVenue);
      bonusLocationIds.push(chosenSecretVenue);
    }
  }

  for (const cand of combinedBonus) {
    if (bonusLocationIds.length >= 4) break;
    if (!coreIds.has(cand.id)) {
      coreIds.add(cand.id);
      bonusLocationIds.push(cand.id);
    }
  }
  const bonusLocationId1 = bonusLocationIds[0];

  const selectedTemplates = MASTER_LOCATIONS.filter((l) => coreIds.has(l.id));
  const locations: Record<string, LocationCaseInstance> = {};

  for (const loc of selectedTemplates) {
    const isAgency = loc.id === 'agency';
    const isCrimeScene = loc.id === crimeLocationTemplate.id;
    locations[loc.id] = {
      ...loc,
      connectedRoads: symmetricRoads[loc.id] || loc.connectedRoads,
      discovered: isAgency || isCrimeScene,
      discoveredReason: isAgency
        ? 'Your headquarters'
        : isCrimeScene
          ? 'Primary Crime Scene dispatched by telephone'
          : undefined,
      pointsOfInterest: [],
      absenceNotices: []
    };
  }

  // Assign a strictly unique natural weapon to every active location (1 weapon per location max).
  // Portable weapons (Pocket / Concealable) are usually stashed/kept at another reachable venue (~65% chance when already natural at the scene, 100% when sourced off-site),
  // whereas Cumbersome weapons are too hard to move unseen and remain at the crime scene.
  const altNaturalWeaponLocIds = Object.values(locations)
    .filter(
      (l) =>
        l.id !== crimeLocationTemplate.id &&
        l.id !== 'agency' &&
        isWeaponNaturallyAvailableAt(weapon, l)
    )
    .map((l) => l.id);
  const canRelocateWeapon = weapon.portability !== 'Cumbersome' && altNaturalWeaponLocIds.length > 0;
  const wantsRelocation = !weaponNaturallyAtScene || solutionRng.float() < 0.65;
  const weaponRelocatedAway = canRelocateWeapon && wantsRelocation;

  const murderWeaponHostLocId = weaponRelocatedAway
    ? altNaturalWeaponLocIds.includes(secondaryLocationId2)
      ? secondaryLocationId2
      : altNaturalWeaponLocIds.includes(secondaryLocationId1)
        ? secondaryLocationId1
        : solutionRng.pick(altNaturalWeaponLocIds)
    : crimeLocationTemplate.id;
  const assignedWeaponByLocation: Record<string, MethodTemplate> = {};
  const usedWeaponIds = new Set<string>();
  assignedWeaponByLocation[murderWeaponHostLocId] = weapon;
  usedWeaponIds.add(weapon.id);

  const remainingLocsForWeapons = Object.values(locations)
    .filter((loc) => loc.id !== murderWeaponHostLocId)
    .map((loc) => ({
      loc,
      candidates: clueRng.shuffle(
        MASTER_WEAPONS.filter((w) => isWeaponNaturallyAvailableAt(w, loc))
      )
    }))
    .sort((a, b) => a.candidates.length - b.candidates.length);

  const assignUniqueLocationWeapons = (idx: number): boolean => {
    if (idx >= remainingLocsForWeapons.length) return true;
    const { loc, candidates } = remainingLocsForWeapons[idx];
    for (const cand of candidates) {
      if (usedWeaponIds.has(cand.id)) continue;
      usedWeaponIds.add(cand.id);
      assignedWeaponByLocation[loc.id] = cand;
      if (assignUniqueLocationWeapons(idx + 1)) return true;
      usedWeaponIds.delete(cand.id);
      delete assignedWeaponByLocation[loc.id];
    }
    return false;
  };
  assignUniqueLocationWeapons(0);
  for (const loc of Object.values(locations)) {
    if (!assignedWeaponByLocation[loc.id]) {
      const fallback = MASTER_WEAPONS.find((w) => !usedWeaponIds.has(w.id));
      if (fallback) {
        usedWeaponIds.add(fallback.id);
        assignedWeaponByLocation[loc.id] = fallback;
      }
    }
  }

  // Pick a compromising secret venue visited by secondSuspect (preferring Crimson Garter strip club when available)
  const secondSuspectHomeLoc =
    secondSuspectTemplate.assignedLocationId && locations[secondSuspectTemplate.assignedLocationId]
      ? locations[secondSuspectTemplate.assignedLocationId]
      : null;
  const availableSecretVenues = (COMPROMISING_VENUE_IDS as readonly string[]).filter(
    (id) =>
      Boolean(locations[id]) &&
      id !== crimeLocationTemplate.id &&
      id !== secondSuspectHomeLoc?.id
  );
  const secondSuspectSecretLocId =
    availableSecretVenues.length > 0
      ? solutionRng.pick(availableSecretVenues)
      : locations[secondaryLocationId2] &&
          secondaryLocationId2 !== crimeLocationTemplate.id &&
          secondaryLocationId2 !== secondSuspectHomeLoc?.id
        ? secondaryLocationId2
        : secondaryLocationId1;
  const secondSuspectLocId = secondSuspectSecretLocId;
  const secondSuspectSecretLoc = locations[secondSuspectSecretLocId];
  const secondSuspectHasSeparateHome = Boolean(
    secondSuspectHomeLoc && secondSuspectHomeLoc.id !== secondSuspectSecretLocId
  );

  // STAGE D & E: Build Clues (observational, zero spoilers) and Discovery Graph
  const clues: Record<string, ClueInstance> = {};
  const discoveryGraph: DiscoveryGraphEdge[] = [];

  const decisiveProofId = 'clue_decisive_proof';
  const alibiBreakId = 'clue_alibi_break';
  const motiveClueId = 'clue_motive_document';
  const murderWeaponClueId = 'clue_murder_weapon';
  const redHerringClueId = 'clue_red_herring';
  const redHerring2ClueId = 'clue_red_herring_2';
  const weaponTransferClueId = 'clue_weapon_transfer';

  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] || 'M';
    const last = parts[parts.length - 1]?.[0] || 'N';
    return `${first}.${last}`;
  };
  const culpritInitials = getInitials(culpritTemplate.name);
  const redHerringInitials = getInitials(redHerringTemplate.name);
  const secondSuspectInitials = getInitials(secondSuspectTemplate.name);

  const weaponClueMeta = WEAPON_CLUES[weapon.id];
  clues[murderWeaponClueId] = {
    id: murderWeaponClueId,
    name: 'Post-Mortem Wound & Trace Examination',
    category: 'forensic',
    shortSummary: weaponRelocatedAway
      ? `${weapon.category} trauma on ${victimTemplate.name}: ${weapon.evidenceSignature} (Implement missing from scene)`
      : `${weapon.category} trauma on ${victimTemplate.name}: ${weapon.evidenceSignature}`,
    detailedInspection: weaponRelocatedAway
      ? `Forensic examination of ${victimTemplate.name} indicates fatal trauma consistent with ${weapon.category.toLowerCase()} (${weapon.portability.toLowerCase()} class): ${weapon.evidenceSignature} No matching implement was left beside the body—smudged exit tracks suggest the killer carried the portable weapon off-site to stash elsewhere.`
      : `Forensic examination of ${victimTemplate.name} indicates fatal trauma consistent with ${weapon.category.toLowerCase()} (${weapon.portability.toLowerCase()} class): ${weapon.evidenceSignature}`,
    locationFoundId: crimeLocationTemplate.id,
    status: 'undiscovered',
    supports: 'weapon'
  };

  const primaryMotiveHookId = motive.clueHooks[0];
  const primaryMotiveHook = primaryMotiveHookId ? MOTIVE_HOOK_CLUES[primaryMotiveHookId] : undefined;
  const secondaryMotiveHookId = motive.clueHooks[1];
  const secondaryMotiveHook = secondaryMotiveHookId ? MOTIVE_HOOK_CLUES[secondaryMotiveHookId] : undefined;
  const motiveHookVars = {
    victimName: victimTemplate.name,
    culpritName: culpritTemplate.name,
    motiveDesc: motive.description,
    crimeLocation: crimeLocationTemplate.name
  };

  clues[motiveClueId] = {
    id: motiveClueId,
    name: primaryMotiveHook ? primaryMotiveHook.name : 'Disputed Documents',
    category: primaryMotiveHook?.category || 'document',
    shortSummary: primaryMotiveHook ? primaryMotiveHook.shortSummary : motive.evidenceClueSnippet,
    detailedInspection: primaryMotiveHook
      ? `${interpolateFragment(primaryMotiveHook.detailTemplate, motiveHookVars)} ${motive.evidenceClueSnippet} ${dynamicTie.motiveDetailBridge}`
      : `Found among the victim’s papers: legal correspondence and financial notes regarding ${motive.description}. ${dynamicTie.motiveDetailBridge}`,
    locationFoundId: crimeLocationTemplate.id,
    status: 'undiscovered',
    supports: 'motive',
    relatedCharacterId: culpritTemplate.id
  };

  const motiveHook2Id = 'clue_motive_hook_2';
  clues[motiveHook2Id] = {
    id: motiveHook2Id,
    name: secondaryMotiveHook ? secondaryMotiveHook.name : `${motive.category} Corroboration Memo`,
    category: secondaryMotiveHook?.category || 'document',
    shortSummary: secondaryMotiveHook
      ? secondaryMotiveHook.shortSummary
      : `Corroborating correspondence tied to ${motive.name}.`,
    detailedInspection: secondaryMotiveHook
      ? `${interpolateFragment(secondaryMotiveHook.detailTemplate, motiveHookVars)} ${dynamicTie.motiveDetailBridge}`
      : `Supporting ledger notice confirming the escalating dispute between ${victimTemplate.name} and ${culpritTemplate.name} regarding ${motive.name}. ${dynamicTie.motiveDetailBridge}`,
    locationFoundId: secondaryLocationId1,
    status: 'undiscovered',
    supports: 'motive_hook',
    relatedCharacterId: culpritTemplate.id
  };

  const travelHangoutToScene = calculateRoadTravelMinutes(
    MASTER_LOCATIONS,
    secondaryLocationId1,
    crimeLocationTemplate.id
  );
  const desiredDropLeadMins = timelineRng.pick([6, 9, 12]);
  const cabPickUpMinutes = Math.max(
    20 * 60 + 20,
    crimeTimeMinutes - travelHangoutToScene - desiredDropLeadMins
  );
  const cabPickUpTime = formatMinutesHHMM(cabPickUpMinutes);
  const cabDropTime = addMinutesToTime(cabPickUpTime, travelHangoutToScene);
  const alibiStartTime = timelineRng.pick(['19:45', '20:00', '20:15']);
  const alibiWindowStart = timelineRng.pick(['20:45', '21:00']);
  const victimMeetStart = timelineRng.pick(['19:45', '19:55', '20:00', '20:10']);
  const victimMeetEnd = timelineRng.pick(['20:20', '20:30', '20:35']);
  const victimReturnTime = addMinutesToTime(victimMeetEnd, Math.max(10, Math.min(25, travelHangoutToScene)));
  const weaponTransferTime = formatMinutesHHMM(cabPickUpMinutes - timelineRng.pick([18, 24, 30]));
  const culpritPrepStart = formatMinutesHHMM(parseHHMM(weaponTransferTime) - timelineRng.pick([10, 15]));
  const settlementTime = timelineRng.pick(['14:30', '15:15', '16:00', '16:45', '17:20']);
  const settlementMethod = timelineRng.pick([
    'bank wire transfer',
    'counter cashier’s check',
    'stamped promissory discharge',
    'certified bank draft',
    'signed cash settlement receipt'
  ]);
  const secondSuspectErrandTime = timelineRng.pick(['13:45', '14:20', '15:10', '16:05']);

  const alibiBreakSpec = buildAlibiBreakClueSpec(
    clueRng,
    locations[secondaryLocationId1],
    crimeLocationTemplate,
    cabPickUpTime,
    cabDropTime,
    culpritTemplate.avatarStyle.collar || 'dark coat'
  );

  clues[alibiBreakId] = {
    id: alibiBreakId,
    name: alibiBreakSpec.name,
    category: 'forensic',
    shortSummary: alibiBreakSpec.shortSummary,
    detailedInspection: alibiBreakSpec.detailedInspection,
    locationFoundId: secondaryLocationId1,
    status: 'undiscovered',
    supports: 'alibi_break',
    relatedCharacterId: culpritTemplate.id
  };

  const crimeSceneProfile = LOCATION_SCENE_PROFILES[crimeLocationTemplate.id];
  const crimeExitFeature = crimeSceneProfile?.exitFeature || `${crimeLocationTemplate.name} rear exit latch`;

  // Shared multi-option room evidence pool: decisive proof & red herrings draw from the SAME venue item pool
  const roomEvidencePool: RoomEvidenceOption[] = LOCATION_EVIDENCE_ITEMS[crimeLocationTemplate.id] || [
    {
      id: `${crimeLocationTemplate.id}_fallback_1`,
      name: `Monogrammed Silver Case & Cloth Fiber`,
      shortLabel: 'monogrammed silver case',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: `caught near the ${crimeExitFeature}`,
      itemFeature: 'an engraved pocket case snagged with loose outer-coat thread'
    },
    {
      id: `${crimeLocationTemplate.id}_fallback_2`,
      name: `Initialed Brass Key Fob & Thread`,
      shortLabel: 'brass key fob',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: `wedged beside the ${crimeSceneProfile?.discardSpot.label || crimeLocationTemplate.name}`,
      itemFeature: 'a weighted brass key tag bearing scratched initials'
    },
    {
      id: `${crimeLocationTemplate.id}_fallback_3`,
      name: `Signed Counter Slip & Cuff Lint`,
      shortLabel: 'signed counter slip',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: `slipped under the ${crimeSceneProfile?.recordSpot.label || crimeLocationTemplate.name}`,
      itemFeature: 'a folded counter carbon smudged with street damp'
    }
  ];
  const shuffledRoomItems = clueRng.shuffle(roomEvidencePool);
  const decisiveItem = shuffledRoomItems[0];
  const redHerringItem1 = shuffledRoomItems[1] || shuffledRoomItems[0];
  const redHerringItem2 = shuffledRoomItems[2] || shuffledRoomItems[1] || shuffledRoomItems[0];

  const culpritFiberDesc = describeAttireFibers(culpritTemplate.avatarStyle.collar);
  const redHerringFiberDesc = describeAttireFibers(redHerringTemplate.avatarStyle.collar);
  const secondSuspectFiberDesc = describeAttireFibers(secondSuspectTemplate.avatarStyle.collar);

  clues[decisiveProofId] = {
    id: decisiveProofId,
    name: decisiveItem.name,
    category: decisiveItem.category,
    shortSummary: `Marked "${culpritInitials}" with ${culpritFiberDesc} at ${crimeLocationTemplate.name}.`,
    detailedInspection: `Recovered ${decisiveItem.recoverySpotDetail} at ${crimeLocationTemplate.name}: ${decisiveItem.itemFeature}, marked with the initials "${culpritInitials}" and catching ${culpritFiberDesc}. ${decisiveItem.category === 'document' ? 'Ink smudges and damp street grit suggest hurried handling.' : 'Surface scuffs and faint thumbprints point to hasty handling.'}`,
    locationFoundId: crimeLocationTemplate.id,
    status: 'undiscovered',
    requiresContextToInterpret: 'heard_culprit_alibi',
    corroboratedNote: `Contradiction Corroborated: ${culpritTemplate.name} admitted stopping at ${crimeLocationTemplate.name}, and this ${decisiveItem.shortLabel} ties them directly to the scene.`,
    supports: 'culprit',
    relatedCharacterId: culpritTemplate.id
  };

  clues[redHerringClueId] = {
    id: redHerringClueId,
    name: redHerringItem1.name,
    category: redHerringItem1.category,
    shortSummary: `Marked "${redHerringInitials}" with ${redHerringFiberDesc} at ${crimeLocationTemplate.name}.`,
    detailedInspection: `Recovered ${redHerringItem1.recoverySpotDetail} at ${crimeLocationTemplate.name}: ${redHerringItem1.itemFeature}, marked with the initials "${redHerringInitials}" and catching ${redHerringFiberDesc}. ${redHerringItem1.category === 'document' ? 'Ink smudges and damp street grit suggest hurried handling.' : 'Surface scuffs and faint thumbprints point to hasty handling.'}`,
    locationFoundId: crimeLocationTemplate.id,
    status: 'undiscovered',
    requiresContextToInterpret: `heard_${redHerringTemplate.id}_whereabouts`,
    corroboratedNote: `Alibi Verified: ${redHerringTemplate.name} explained leaving this ${redHerringItem1.shortLabel} during an earlier ${settlementTime} settlement (${settlementMethod}), backed up by ${corroboratorTemplate.name} at ${locations[secondaryLocationId3].name} (${corrWindow.start}–${corrWindow.end}).`,
    supports: 'red_herring',
    relatedCharacterId: redHerringTemplate.id
  };

  clues[redHerring2ClueId] = {
    id: redHerring2ClueId,
    name: redHerringItem2.name,
    category: redHerringItem2.category,
    shortSummary: `Marked "${secondSuspectInitials}" with ${secondSuspectFiberDesc} at ${crimeLocationTemplate.name}.`,
    detailedInspection: `Recovered ${redHerringItem2.recoverySpotDetail} at ${crimeLocationTemplate.name}: ${redHerringItem2.itemFeature}, marked with the initials "${secondSuspectInitials}" and catching ${secondSuspectFiberDesc}. ${redHerringItem2.category === 'document' ? 'Ink smudges and damp street grit suggest hurried handling.' : 'Surface scuffs and faint thumbprints point to hasty handling.'}`,
    locationFoundId: crimeLocationTemplate.id,
    status: 'undiscovered',
    requiresContextToInterpret: `heard_${secondSuspectTemplate.id}_whereabouts`,
    corroboratedNote: `Daytime Errand Verified: ${secondSuspectTemplate.name} left this ${redHerringItem2.shortLabel} during a brief ${secondSuspectErrandTime} afternoon stop—hours before the ${crimeTime} murder (though their later evening movements still need checking).`,
    supports: 'red_herring',
    relatedCharacterId: secondSuspectTemplate.id
  };

  const weaponParcelStyle = clueRng.pick([
    'wrapped hastily in brown butcher paper',
    'tucked under a folded wool overcoat',
    'carried out inside a canvas utility satchel',
    'concealed within a leather dispatch folio'
  ]);

  if (weaponRelocatedAway) {
    const stashVenueName = locations[murderWeaponHostLocId]?.name || 'another venue';
    clues[weaponTransferClueId] = {
      id: weaponTransferClueId,
      name: weaponClueMeta ? weaponClueMeta.transferSlipTitle : `Parcel & Equipment Sign-Out Slip`,
      category: 'forensic',
      shortSummary: weaponNaturallyAtScene
        ? `Stockroom & parcel log noting a ${weapon.name.toLowerCase()} stashed at ${stashVenueName} last night.`
        : weaponClueMeta
          ? weaponClueMeta.stockistSummary
          : `Log entry noting a ${weapon.name.toLowerCase()} removed last night.`,
      detailedInspection: weaponNaturallyAtScene
        ? `An ink-smudged back-room chit from ${stashVenueName}: records someone wearing a ${culpritTemplate.avatarStyle.collar} arriving in a hurry after the murder hour to stash a ${weapon.name.toLowerCase()} ${weaponParcelStyle}.`
        : `An ink-smudged storeroom chit from ${stashVenueName}: records the removal of a ${weapon.name.toLowerCase()} ${weaponParcelStyle} at ${weaponTransferTime} by someone wearing a ${culpritTemplate.avatarStyle.collar}.`,
      locationFoundId: murderWeaponHostLocId,
      status: 'undiscovered',
      supports: 'weapon_transfer',
      relatedCharacterId: culpritTemplate.id,
      relatedWeaponId: weapon.id
    };
  } else {
    clues['clue_weapon_provenance'] = {
      id: 'clue_weapon_provenance',
      name: 'District Hardware & Stockist Audit',
      category: 'document',
      shortSummary: `Vendor registry confirming ${crimeLocationTemplate.name} keeps ${weapon.category.toLowerCase()} equipment on site.`,
      detailedInspection: `Trade inventory audit at ${locations[secondaryLocationId2]?.name} confirms ${crimeLocationTemplate.name} naturally stocks ${weapon.category.toLowerCase()} gear matching venue records—no cross-town transfer was required.`,
      locationFoundId: secondaryLocationId2,
      status: 'undiscovered',
      supports: 'weapon_transfer'
    };
  }

  // Location Discovery Lead Clues (varied per room & seed; guarantee every selected location is reachable!)
  const loc1Hook = getLocationLeadHook(locations[secondaryLocationId1], clueRng, 'culprit_hangout');
  const leadToLocation1Id = 'clue_lead_loc1';
  const weaponTrailSuffixSec1 =
    weaponRelocatedAway && murderWeaponHostLocId === secondaryLocationId1
      ? ` Witnesses outside also noticed a hurriedly wrapped ${weapon.portability.toLowerCase()} parcel tucked under an arm heading toward ${locations[secondaryLocationId1].name}.`
      : '';
  clues[leadToLocation1Id] = {
    id: leadToLocation1Id,
    name: loc1Hook.clueName,
    category: 'lead',
    shortSummary: loc1Hook.shortSummary,
    detailedInspection: `${loc1Hook.detailedInspection}${weaponTrailSuffixSec1}`,
    locationFoundId: crimeLocationTemplate.id,
    status: 'undiscovered',
    supports: 'location_lead',
    leadsToLocationId: secondaryLocationId1
  };
  discoveryGraph.push({
    fromLocationId: crimeLocationTemplate.id,
    toLocationId: secondaryLocationId1,
    viaClueOrTopicId: leadToLocation1Id,
    label: clues[leadToLocation1Id].name
  });

  const loc2Hook = getLocationLeadHook(locations[secondaryLocationId2], clueRng, 'weapon_source');
  const leadToLocation2Id = 'clue_lead_loc2';
  const weaponTrailSuffixSec2 =
    weaponRelocatedAway && murderWeaponHostLocId === secondaryLocationId2
      ? ` A penciled parcel-routing tag points to a ${weapon.portability.toLowerCase()} hardware bundle moved between ${locations[secondaryLocationId2].name} and the crime scene.`
      : '';
  clues[leadToLocation2Id] = {
    id: leadToLocation2Id,
    name: loc2Hook.clueName,
    category: 'lead',
    shortSummary: loc2Hook.shortSummary,
    detailedInspection: `${loc2Hook.detailedInspection}${weaponTrailSuffixSec2}`,
    locationFoundId: secondaryLocationId1,
    status: 'undiscovered',
    supports: 'location_lead',
    leadsToLocationId: secondaryLocationId2
  };
  discoveryGraph.push({
    fromLocationId: secondaryLocationId1,
    toLocationId: secondaryLocationId2,
    viaClueOrTopicId: leadToLocation2Id,
    label: clues[leadToLocation2Id].name
  });

  const loc3Hook = getLocationLeadHook(locations[secondaryLocationId3], clueRng, 'corroborator_meet');
  const leadToLocation3Id = 'clue_lead_loc3';
  clues[leadToLocation3Id] = {
    id: leadToLocation3Id,
    name: loc3Hook.clueName,
    category: 'lead',
    shortSummary: loc3Hook.shortSummary,
    detailedInspection: `${loc3Hook.detailedInspection} Initialed beside the margin by ${redHerringTemplate.name}.`,
    locationFoundId: crimeLocationTemplate.id,
    status: 'undiscovered',
    supports: 'location_lead',
    leadsToLocationId: secondaryLocationId3
  };
  discoveryGraph.push({
    fromLocationId: crimeLocationTemplate.id,
    toLocationId: secondaryLocationId3,
    viaClueOrTopicId: leadToLocation3Id,
    label: clues[leadToLocation3Id].name
  });

  const bonusLeadClueIds: string[] = [];
  const bonusLeadHooks: Record<string, ReturnType<typeof getLocationLeadHook>> = {};
  bonusLocationIds.forEach((bId, idx) => {
    const targetLoc = locations[bId];
    if (!targetLoc) return;
    const targetLeadHook = getLocationLeadHook(targetLoc, clueRng, 'bonus');
    const sourceCandidate =
      idx === 0
        ? secondaryLocationId2
        : idx === 1
          ? secondaryLocationId3
          : bonusLocationIds[idx - 2];
    const fromId = sourceCandidate && locations[sourceCandidate] ? sourceCandidate : secondaryLocationId1;
    const leadId = idx === 0 ? 'clue_lead_bonus1' : `clue_lead_bonus${idx + 1}`;
    const bonusWeaponTrail =
      weaponRelocatedAway && murderWeaponHostLocId === bId
        ? ` Margin notes track a concealed ${weapon.portability.toLowerCase()} parcel dropped inside ${targetLoc.name}.`
        : '';
    bonusLeadClueIds.push(leadId);
    bonusLeadHooks[leadId] = targetLeadHook;
    clues[leadId] = {
      id: leadId,
      name: targetLeadHook.clueName,
      category: 'lead',
      shortSummary: targetLeadHook.shortSummary,
      detailedInspection: `${targetLeadHook.detailedInspection}${bonusWeaponTrail}`,
      locationFoundId: fromId,
      status: 'undiscovered',
      supports: 'location_lead',
      leadsToLocationId: bId
    };
    discoveryGraph.push({
      fromLocationId: fromId,
      toLocationId: bId,
      viaClueOrTopicId: leadId,
      label: clues[leadId].name
    });
  });

  // Attach each location's own authored POIs (preserving manually tuned coordinates)
  for (const loc of selectedTemplates) {
    const locPOIs: PointOfInterest[] = [];
    if (loc.pointsOfInterest && loc.pointsOfInterest.length > 0) {
      loc.pointsOfInterest.forEach((tplPoi, idx) => {
        const rewardId = tplPoi.clueRewardId;
        if (rewardId && AMBIENT_POI_CLUES[rewardId] && !clues[rewardId]) {
          const def = AMBIENT_POI_CLUES[rewardId];
          clues[rewardId] = {
            id: rewardId,
            name: def.name,
            category: def.category,
            shortSummary: def.shortSummary,
            detailedInspection: def.detailedInspection,
            locationFoundId: loc.id,
            status: 'undiscovered',
            supports: 'ambient'
          };
        }
        locPOIs.push({
          id: tplPoi.id || `poi_${loc.id}_tpl_${idx}`,
          label: tplPoi.label,
          description: tplPoi.description,
          coords: tplPoi.coords,
          clueRewardId: rewardId,
          inspected: false
        });
      });
    }
    locations[loc.id].pointsOfInterest = locPOIs;
  }

  // Helper to attach plot clues onto each location's own bespoke architectural/forensic spots (never overwriting authored POI coords)
  type ProfileSpotKey = 'recordSpot' | 'discardSpot' | 'exitSpot' | 'leadSpot';
  const usedProfileSpotsByLoc: Record<string, Set<string>> = {};

  const allocateNonOverlappingCoords = (
    loc: LocationCaseInstance,
    desired: { top: number; left: number }
  ): { top: number; left: number } => {
    const occupied = loc.pointsOfInterest.map((p) => p.coords);
    const isClear = (c: { top: number; left: number }) =>
      occupied.every((o) => Math.abs(o.top - c.top) >= 9 || Math.abs(o.left - c.left) >= 11);
    if (isClear(desired)) return desired;
    for (let top = 22; top <= 82; top += 14) {
      for (let left = 15; left <= 85; left += 16) {
        const candidate = { top, left };
        if (isClear(candidate)) return candidate;
      }
    }
    return desired;
  };

  const attachClueToProfileSpot = (
    locId: string,
    preferredKeys: ProfileSpotKey[],
    clueId: string,
    poiId: string,
    options?: {
      descriptionSuffix?: string;
      fallbackLabel?: string;
      fallbackDescription?: string;
      requiresClueOrTopicToNotice?: string;
      noticedNoticeText?: string;
    }
  ) => {
    const loc = locations[locId];
    if (!loc) return;
    const profile = LOCATION_SCENE_PROFILES[locId];
    if (!usedProfileSpotsByLoc[locId]) usedProfileSpotsByLoc[locId] = new Set();
    const used = usedProfileSpotsByLoc[locId];
    const chosenKey = preferredKeys.find((k) => !used.has(k));
    const spotDef = chosenKey && profile ? profile[chosenKey] : undefined;
    if (chosenKey) used.add(chosenKey);

    const label = spotDef
      ? spotDef.label
      : options?.fallbackLabel || `${loc.name} — ${loc.district} Desk`;
    const baseDescription = spotDef
      ? spotDef.description
      : options?.fallbackDescription || `Checked station inside ${loc.name} (${loc.district}).`;
    const suffix = options?.descriptionSuffix?.trim();
    const hasDuplicateSuffix =
      Boolean(suffix) &&
      baseDescription.toLowerCase().includes(suffix!.replace(/[.!?]+$/, '').toLowerCase());
    const description =
      suffix && !hasDuplicateSuffix ? `${baseDescription} ${suffix}` : baseDescription;
    const coords = allocateNonOverlappingCoords(
      loc,
      spotDef ? spotDef.coords : { top: 52, left: 68 }
    );

    loc.pointsOfInterest.push({
      id: poiId,
      label,
      description,
      coords,
      clueRewardId: clueId,
      requiresClueOrTopicToNotice: options?.requiresClueOrTopicToNotice,
      noticedNoticeText: options?.noticedNoticeText,
      inspected: false
    });
  };

  // Attach Crime Scene clues strictly onto Crime Scene's own LOCATION_SCENE_PROFILES spots
  const crimeSceneLoc = locations[crimeLocationTemplate.id];
  crimeSceneLoc.pointsOfInterest.push({
    id: 'poi_body',
    label: `Victim’s Remains — ${victimTemplate.name} (${crimeSceneProfile?.bodySpotLabel || crimeLocationTemplate.name})`,
    description: `${crimeSceneProfile?.bodySpotDescription || `Scene floor of ${crimeLocationTemplate.name}.`} The body of ${victimTemplate.name} lies here; rigor places time of death near ${crimeTime}.`,
    coords: allocateNonOverlappingCoords(
      crimeSceneLoc,
      crimeSceneProfile?.bodyCoords || { top: 54, left: 46 }
    ),
    clueRewardId: murderWeaponClueId,
    inspected: false
  });

  attachClueToProfileSpot(crimeLocationTemplate.id, ['recordSpot', 'discardSpot'], motiveClueId, 'poi_scene_motive', {
    descriptionSuffix: `Scattered financial papers and personal correspondence of ${victimTemplate.name} lie open.`
  });
  attachClueToProfileSpot(crimeLocationTemplate.id, ['leadSpot', 'discardSpot'], leadToLocation1Id, 'poi_scene_lead1', {
    descriptionSuffix: loc1Hook.poiHint
  });
  attachClueToProfileSpot(crimeLocationTemplate.id, decisiveItem.preferredSpots, decisiveProofId, 'poi_window', {
    fallbackLabel: `${crimeLocationTemplate.name} — ${crimeSceneProfile?.[decisiveItem.preferredSpots[0]]?.label || crimeExitFeature}`,
    fallbackDescription: `Checked surface ${decisiveItem.recoverySpotDetail} inside ${crimeLocationTemplate.name}.`,
    descriptionSuffix: `A misplaced ${decisiveItem.shortLabel} snagged with ${culpritFiberDesc} sits tucked near the surface.`,
    requiresClueOrTopicToNotice: 'heard_culprit_alibi',
    noticedNoticeText: `You bag the ${decisiveItem.shortLabel} and ${culpritFiberDesc} for comparison against suspect attire.`
  });
  attachClueToProfileSpot(crimeLocationTemplate.id, redHerringItem1.preferredSpots, redHerringClueId, 'poi_scene_red_herring', {
    fallbackLabel: `${crimeLocationTemplate.name} — ${crimeSceneProfile?.[redHerringItem1.preferredSpots[0]]?.label || 'Side Fixture'}`,
    fallbackDescription: `Checked surface ${redHerringItem1.recoverySpotDetail} inside ${crimeLocationTemplate.name}.`,
    descriptionSuffix: `A misplaced ${redHerringItem1.shortLabel} snagged with ${redHerringFiberDesc} sits tucked near the surface.`,
    requiresClueOrTopicToNotice: `heard_${redHerringTemplate.id}_whereabouts`,
    noticedNoticeText: `You bag the ${redHerringItem1.shortLabel} and ${redHerringFiberDesc} for comparison against suspect attire.`
  });
  attachClueToProfileSpot(crimeLocationTemplate.id, redHerringItem2.preferredSpots, redHerring2ClueId, 'poi_scene_red_herring_2', {
    fallbackLabel: `${crimeLocationTemplate.name} — ${crimeSceneProfile?.[redHerringItem2.preferredSpots[0]]?.label || 'Corner Alcove'}`,
    fallbackDescription: `Checked surface ${redHerringItem2.recoverySpotDetail} inside ${crimeLocationTemplate.name}.`,
    descriptionSuffix: `A misplaced ${redHerringItem2.shortLabel} snagged with ${secondSuspectFiberDesc} sits tucked near the surface.`,
    requiresClueOrTopicToNotice: `heard_${secondSuspectTemplate.id}_whereabouts`,
    noticedNoticeText: `You bag the ${redHerringItem2.shortLabel} and ${secondSuspectFiberDesc} for comparison against suspect attire.`
  });
  attachClueToProfileSpot(crimeLocationTemplate.id, ['leadSpot', 'recordSpot', 'discardSpot'], leadToLocation3Id, 'poi_scene_lead3', {
    fallbackLabel: `${crimeLocationTemplate.name} Vestibule Steward Tray`,
    fallbackDescription: `Near the ${crimeLocationTemplate.district} entrance vestibule of ${crimeLocationTemplate.name}, a brass calling tray sits beside the door spindle.`,
    descriptionSuffix: loc3Hook.poiHint
  });

  // Secondary Location 1 clues onto sec1's own LOCATION_SCENE_PROFILES spots
  attachClueToProfileSpot(secondaryLocationId1, ['leadSpot', 'exitSpot'], alibiBreakId, 'poi_sec1_alibi_break', {
    descriptionSuffix: alibiBreakSpec.poiHint
  });
  attachClueToProfileSpot(secondaryLocationId1, ['discardSpot', 'recordSpot'], leadToLocation2Id, 'poi_sec1_lead2', {
    descriptionSuffix: loc2Hook.poiHint
  });
  attachClueToProfileSpot(secondaryLocationId1, ['recordSpot', 'discardSpot'], motiveHook2Id, 'poi_sec1_motive_hook', {
    descriptionSuffix: `An overlooked correspondence slip tied to the recent dispute was tucked into the ledger leaves.`
  });

  // Attach weapon provenance or stash slip onto the stash venue (or secondaryLocationId2 audit desk)
  if (weaponRelocatedAway) {
    attachClueToProfileSpot(
      murderWeaponHostLocId,
      ['recordSpot', 'discardSpot', 'leadSpot'],
      weaponTransferClueId,
      murderWeaponHostLocId === secondaryLocationId2 ? 'poi_sec2_weapon_log' : 'poi_weapon_stash_log',
      {
        fallbackLabel: `${locations[murderWeaponHostLocId]?.name} Stock & Stash Spindle`,
        fallbackDescription: `Back-room property spindle and hardware audit slip inside ${locations[murderWeaponHostLocId]?.name}.`,
        descriptionSuffix: `Property chits and equipment stock logs inside ${locations[murderWeaponHostLocId]?.name} track hardware of ${weapon.name.toLowerCase()} specifications.`
      }
    );
  } else {
    attachClueToProfileSpot(
      secondaryLocationId2,
      ['recordSpot', 'discardSpot'],
      'clue_weapon_provenance',
      'poi_sec2_weapon_log',
      {
        descriptionSuffix: `District hardware audit sheets inside ${locations[secondaryLocationId2]?.name} record standard ${weapon.category.toLowerCase()} stock across New Bay venues.`
      }
    );
  }
  if (bonusLocationId1) {
    attachClueToProfileSpot(secondaryLocationId2, ['leadSpot', 'exitSpot'], 'clue_lead_bonus1', 'poi_sec2_bonus_lead', {
      descriptionSuffix: bonusLeadHooks['clue_lead_bonus1']?.poiHint || `An evening call & courier slip notes traffic heading toward ${locations[bonusLocationId1]?.name}.`
    });
  }

  // Remaining bonus discovery leads attached onto each source location's own LOCATION_SCENE_PROFILES spot
  bonusLeadClueIds.forEach((leadId, idx) => {
    if (idx === 0) return; // already attached on secondaryLocationId2
    const clue = clues[leadId];
    if (!clue) return;
    attachClueToProfileSpot(
      clue.locationFoundId,
      ['leadSpot', 'exitSpot', 'discardSpot', 'recordSpot'],
      leadId,
      `poi_bonus_lead_${idx}`,
      {
        fallbackLabel: `${locations[clue.locationFoundId]?.name} (${locations[clue.locationFoundId]?.district}) Courier Tray`,
        fallbackDescription: `Pigeonholed courier tray beside the front desk inside ${locations[clue.locationFoundId]?.name || 'the venue'}.`,
        descriptionSuffix: bonusLeadHooks[leadId]?.poiHint || `An evening dispatch slip points directly toward ${locations[clue.leadsToLocationId!]?.name || 'another venue'}.`
      }
    );
  });

  // Attach each active location's unique natural weapon POI & discoverable exhibit clue
  for (const loc of Object.values(locations)) {
    const locWeapon = assignedWeaponByLocation[loc.id];
    if (!locWeapon) continue;
    const locWeaponClueId = `clue_loc_weapon_${loc.id}`;
    const locWeaponClueMeta = WEAPON_CLUES[locWeapon.id];
    const spotSpec = getLocationWeaponSpotSpec(loc, locWeapon);
    clues[locWeaponClueId] = {
      id: locWeaponClueId,
      name: locWeapon.name,
      category: 'physical',
      shortSummary: locWeaponClueMeta
        ? `${locWeaponClueMeta.forensicNote} (Examined at ${loc.name})`
        : `${locWeapon.description} Examined at ${loc.name}.`,
      detailedInspection: `Examined at ${loc.name} (${spotSpec.label}): ${locWeapon.description} Class: ${locWeapon.category} (${locWeapon.portability}). Forensic profile: ${locWeapon.evidenceSignature}`,
      locationFoundId: loc.id,
      status: 'undiscovered',
      supports: 'ambient',
      relatedWeaponId: locWeapon.id
    };
    loc.pointsOfInterest.push({
      id: `poi_loc_weapon_${loc.id}`,
      label: spotSpec.label,
      description: spotSpec.description,
      coords: allocateNonOverlappingCoords(loc, {
        top: clueRng.int(28, 72),
        left: clueRng.int(18, 82)
      }),
      clueRewardId: locWeaponClueId,
      inspected: false
    });
  }

  // STAGE C (Finalize Cast Placement — all placed inside reachable selected locations!)
  const victimCaseInstance: CharacterCaseInstance = {
    ...victimTemplate,
    role: 'victim',
    currentLocationId: crimeLocationTemplate.id,
    alibiClaim: 'Deceased',
    actualLocationIdAtMurder: crimeLocationTemplate.id,
    isLying: false,
    reasonPresent: !crimeLocOpenAtCrime
      ? victimWorksAtScene
        ? `Used their staff key to unlock ${crimeLocationTemplate.name} after closing (${sceneCloseStr}) for a private meeting.`
        : `Met an inside staff keyholder who unlocked ${crimeLocationTemplate.name} after closing (${sceneCloseStr}).`
      : `Scheduled to meet a private contact at ${crimeLocationTemplate.name}.`,
    personalGoal: 'Confront debtor and reclaim leverage before midnight.',
    interviewNotes: [],
    perjuryExposed: false,
    demeanor: 'Distraught'
  };

  const culpritHomeLoc =
    culpritTemplate.assignedLocationId && locations[culpritTemplate.assignedLocationId]
      ? locations[culpritTemplate.assignedLocationId]
      : null;

  const alibiLoc = locations[secondaryLocationId1];
  const alibiLocOpenMin = alibiLoc?.openingHours ? parseHHMM(alibiLoc.openingHours.open) : 0;
  const alibiLocCloseMin = alibiLoc?.openingHours ? parseHHMM(alibiLoc.openingHours.close) : 1439;
  const alibiLocIsLateOr24h =
    !alibiLoc?.openingHours ||
    (alibiLocOpenMin === 0 && alibiLocCloseMin >= 1439) ||
    alibiLocCloseMin < alibiLocOpenMin ||
    alibiLocCloseMin >= 23 * 60 + 30;
  const alibiEndPhrase = alibiLocIsLateOr24h
    ? 'straight past midnight'
    : `until closing at ${alibiLoc.openingHours!.close}`;

  interface MurderNightShiftPlan {
    shiftAction: 'none' | 'normal' | 'early_sign_out' | 'evening_off';
    adjustedEndMinutes?: number;
    clockOutStr?: string;
    shiftClause: string;
    rosterNote?: string;
  }

  const planMurderNightShiftAdjustment = (
    charTpl: CharacterTemplate,
    awayLocId: string,
    awayStartMin: number,
    awayEndMin: number
  ): MurderNightShiftPlan => {
    const homeLoc =
      charTpl.assignedLocationId && locations[charTpl.assignedLocationId]
        ? locations[charTpl.assignedLocationId]
        : null;
    if (!homeLoc || homeLoc.id === awayLocId) {
      return { shiftAction: 'none', shiftClause: '' };
    }
    const shiftHours = charTpl.shiftHours || homeLoc.openingHours;
    const mnShift = getOperatingWindowOnDay(shiftHours, 0);
    if (!(mnShift.start < awayEndMin && mnShift.end > awayStartMin)) {
      return { shiftAction: 'normal', shiftClause: '' };
    }
    const primaryCastIds = new Set([
      victimTemplate.id,
      culpritTemplate.id,
      redHerringTemplate.id,
      secondSuspectTemplate.id,
      corroboratorTemplate.id,
      witnessTemplate.id
    ]);
    const hasHomeCoworkers = MASTER_CHARACTERS.some(
      (c) =>
        c.characterKind === 'staff' &&
        c.assignedLocationId === homeLoc.id &&
        !primaryCastIds.has(c.id)
    );
    const coverageClause = hasHomeCoworkers
      ? 'evening floor covered by house coworkers'
      : 'no substitute clerk assigned; post left unattended';
    const normalCloseStr = shiftHours?.close || formatMinutesHHMM(mnShift.end);
    if (awayStartMin - mnShift.start >= 180) {
      const adjustedEnd = awayStartMin - 30;
      const clockOutStr = formatMinutesHHMM(adjustedEnd);
      return {
        shiftAction: 'early_sign_out',
        adjustedEndMinutes: adjustedEnd,
        clockOutStr,
        shiftClause: `Although my regular hours at ${homeLoc.name} run until ${normalCloseStr}, I closed out early at ${clockOutStr} last night. `,
        rosterNote: `${charTpl.name} signed out early at ${clockOutStr} last night (${coverageClause})`
      };
    }
    return {
      shiftAction: 'evening_off',
      shiftClause: `I took the evening off from my usual shift at ${homeLoc.name} last night. `,
      rosterNote: `${charTpl.name} took last night off duty (${coverageClause})`
    };
  };

  const culpritShiftPlan = planMurderNightShiftAdjustment(
    culpritTemplate,
    secondaryLocationId1,
    parseHHMM(alibiStartTime),
    crimeTimeMinutes + 30
  );
  const culpritSceneKeyOpen = !crimeLocOpenAtCrime && culpritWorksAtScene;
  const alibiSceneDenial = culpritWorksAtScene
    ? culpritSceneKeyOpen
      ? `I locked ${crimeLocationTemplate.name} up at ${sceneCloseStr} and never touched my staff key to go back inside.`
      : culpritShiftPlan.shiftAction === 'early_sign_out'
        ? `I never set foot back inside ${crimeLocationTemplate.name} after signing out at ${culpritShiftPlan.clockOutStr}.`
        : `I never set foot inside ${crimeLocationTemplate.name} last night.`
    : `I didn't step foot anywhere near ${crimeLocationTemplate.name}.`;
  const culpritWorkplaceSceneDeny = culpritSceneKeyOpen
    ? `We lock ${crimeLocationTemplate.name} tight at ${sceneCloseStr}, and I went straight over to ${locations[secondaryLocationId1].name}—I never unlocked the place after closing around ${crimeTime} last night!`
    : culpritShiftPlan.shiftAction === 'early_sign_out'
      ? `I finished my daytime duties and closed up early at ${culpritShiftPlan.clockOutStr} before heading to ${locations[secondaryLocationId1].name}—I never set foot back inside ${crimeLocationTemplate.name} around ${crimeTime} last night!`
      : `I took last night off from ${crimeLocationTemplate.name} and wasn't anywhere near the place around ${crimeTime}!`;

  const culpritCaseInstance: CharacterCaseInstance = {
    ...culpritTemplate,
    role: 'culprit',
    isPrimaryCast: true,
    currentLocationId: culpritHomeLoc ? culpritHomeLoc.id : secondaryLocationId1,
    alibiClaim: `${culpritShiftPlan.shiftClause}I never left ${locations[secondaryLocationId1].name} from ${alibiStartTime} ${alibiEndPhrase}! Check with anyone there—${alibiSceneDenial}`,
    actualLocationIdAtMurder: crimeLocationTemplate.id,
    isLying: true,
    reasonPresent: culpritHomeLoc && culpritHomeLoc.id !== secondaryLocationId1
      ? `On regular ${culpritTemplate.title} duty at ${culpritHomeLoc.name}, with a claimed evening stop at ${locations[secondaryLocationId1].name}.`
      : `Returned to ${locations[secondaryLocationId1].name} to re-establish an alibi after the crime.`,
    personalGoal: `Deflect suspicion and destroy links to ${motive.name}.`,
    motiveDetails: motive.description,
    interviewNotes: [],
    perjuryExposed: false,
    demeanor: 'Guarded'
  };

  const redHerringHomeLoc =
    redHerringTemplate.assignedLocationId && locations[redHerringTemplate.assignedLocationId]
      ? locations[redHerringTemplate.assignedLocationId]
      : null;
  const redHerringShiftPlan = planMurderNightShiftAdjustment(
    redHerringTemplate,
    secondaryLocationId3,
    corrStartMinutes,
    parseHHMM(corrWindow.end)
  );
  const redHerringInstance: CharacterCaseInstance = {
    ...redHerringTemplate,
    role: 'suspect',
    isPrimaryCast: true,
    isRedHerring: true,
    currentLocationId: redHerringHomeLoc ? redHerringHomeLoc.id : secondaryLocationId3,
    alibiClaim: `${redHerringShiftPlan.shiftClause}I was at ${locations[secondaryLocationId3].name} from ${corrWindow.start} onward with ${corroboratorTemplate.name}. Whatever private accounts passed between ${victimTemplate.name} and me stay my business unless you have proof on paper.`,
    actualLocationIdAtMurder: secondaryLocationId3,
    isLying: false,
    reasonPresent: redHerringHomeLoc && redHerringHomeLoc.id !== secondaryLocationId3
      ? `Works at ${redHerringHomeLoc.name}; kept a brief evening appointment at ${locations[secondaryLocationId3].name}.`
      : `Keeping an evening appointment at ${locations[secondaryLocationId3].name}.`,
    personalGoal: 'Clear their name without exposing unrelated private finances.',
    interviewNotes: [],
    perjuryExposed: false,
    demeanor: 'Defiant'
  };

  const secondSuspectHomeShift = secondSuspectHomeLoc
    ? secondSuspectTemplate.shiftHours || secondSuspectHomeLoc.openingHours
    : undefined;
  const secondSuspectShiftOpen = secondSuspectHomeShift?.open || '08:00';
  const secondSuspectShiftClose = secondSuspectHomeShift?.close || '20:00';
  const secondSuspectLateShift =
    parseHHMM(secondSuspectShiftClose) < parseHHMM(secondSuspectShiftOpen) ||
    parseHHMM(secondSuspectShiftClose) >= 23 * 60;
  const secondSuspectShiftPlan: MurderNightShiftPlan = { shiftAction: 'normal', shiftClause: '' };

  const secondSuspectInstance: CharacterCaseInstance = {
    ...secondSuspectTemplate,
    role: 'suspect',
    isPrimaryCast: true,
    currentLocationId: secondSuspectHomeLoc ? secondSuspectHomeLoc.id : secondSuspectSecretLocId,
    alibiClaim: secondSuspectHasSeparateHome
      ? secondSuspectLateShift
        ? `I tended to my regular duties at ${secondSuspectHomeLoc!.name} through my shift (${secondSuspectShiftOpen}–${secondSuspectShiftClose}) last night—I didn't set foot inside places like ${secondSuspectSecretLoc.name}.`
        : `I worked my regular hours at ${secondSuspectHomeLoc!.name} (${secondSuspectShiftOpen}–${secondSuspectShiftClose}) and turned in straight afterward last night—I didn't set foot inside places like ${secondSuspectSecretLoc.name}.`
      : `I kept a quiet evening indoors after dusk last night, detective. You won't tie me to any backstreet spots like ${secondSuspectSecretLoc.name}.`,
    actualLocationIdAtMurder: secondSuspectSecretLocId,
    isLying: false,
    reasonPresent: secondSuspectHasSeparateHome
      ? `Regular duty at ${secondSuspectHomeLoc!.name}; discreetly slipped into ${secondSuspectSecretLoc.name} off-hours.`
      : `Discreet private visit to ${secondSuspectSecretLoc.name}.`,
    personalGoal: `Conceal their embarrassing visit to ${secondSuspectSecretLoc.name} unless confronted with hard proof.`,
    interviewNotes: [],
    perjuryExposed: false,
    demeanor: 'Nervous'
  };

  const corroboratorHomeLoc =
    corroboratorTemplate.assignedLocationId && locations[corroboratorTemplate.assignedLocationId]
      ? locations[corroboratorTemplate.assignedLocationId]
      : null;
  const corroboratorShiftPlan = planMurderNightShiftAdjustment(
    corroboratorTemplate,
    secondaryLocationId3,
    corrStartMinutes,
    parseHHMM(corrWindow.end)
  );
  const corroboratorInstance: CharacterCaseInstance = {
    ...corroboratorTemplate,
    role: 'corroborator',
    isPrimaryCast: true,
    currentLocationId: corroboratorHomeLoc ? corroboratorHomeLoc.id : secondaryLocationId3,
    alibiClaim: `${corroboratorShiftPlan.shiftClause}I met ${redHerringTemplate.name} at ${locations[secondaryLocationId3].name} at ${corrWindow.start} and stayed until ${corrWindow.end}.`,
    actualLocationIdAtMurder: secondaryLocationId3,
    isLying: false,
    reasonPresent: corroboratorHomeLoc && corroboratorHomeLoc.id !== secondaryLocationId3
      ? `Stationed at ${corroboratorHomeLoc.name}; stepped over to ${locations[secondaryLocationId3].name} to meet ${redHerringTemplate.name}.`
      : `Evening meeting with ${redHerringTemplate.name}.`,
    personalGoal: 'Give accurate testimony without implicating themselves.',
    interviewNotes: [],
    perjuryExposed: false,
    demeanor: 'Cooperative'
  };

  const witnessHomeLoc =
    witnessTemplate.assignedLocationId && locations[witnessTemplate.assignedLocationId]
      ? locations[witnessTemplate.assignedLocationId]
      : null;
  const witnessIsPatrolBeat = witnessTemplate.id === 'officer_omalley';
  const witnessShiftPlan: MurderNightShiftPlan = witnessIsPatrolBeat
    ? { shiftAction: 'normal', shiftClause: '' }
    : planMurderNightShiftAdjustment(
        witnessTemplate,
        crimeLocationTemplate.id,
        Math.max(19 * 60, crimeTimeMinutes - 30),
        crimeTimeMinutes + 20
      );
  const witnessInstance: CharacterCaseInstance = {
    ...witnessTemplate,
    role: 'witness',
    isPrimaryCast: true,
    currentLocationId: witnessHomeLoc ? witnessHomeLoc.id : crimeLocationTemplate.id,
    alibiClaim: witnessIsPatrolBeat
      ? `I was walking my evening precinct patrol near ${crimeLocationTemplate.name} and passed the entrance around ${crimeTime} when I heard shouting inside.`
      : `${witnessShiftPlan.shiftClause}I passed ${crimeLocationTemplate.name} earlier in the evening and walked past again around ${crimeTime} when I heard shouting inside.`,
    actualLocationIdAtMurder: crimeLocationTemplate.id,
    isLying: false,
    reasonPresent: witnessHomeLoc && witnessHomeLoc.id !== crimeLocationTemplate.id
      ? witnessIsPatrolBeat
        ? `Stationed at ${witnessHomeLoc.name}; walked past ${crimeLocationTemplate.name} on evening patrol rounds.`
        : `Regularly works at ${witnessHomeLoc.name}; passed ${crimeLocationTemplate.name} during an evening errand.`
      : `Passing near ${crimeLocationTemplate.name} during their evening routine.`,
    personalGoal: 'Report what they glimpsed in the rain without getting mixed up in gang violence.',
    interviewNotes: [],
    perjuryExposed: false,
    demeanor: 'Cooperative'
  };

  const alreadyCastIds = new Set<string>([
    victimTemplate.id,
    culpritTemplate.id,
    redHerringTemplate.id,
    secondSuspectTemplate.id,
    corroboratorTemplate.id,
    witnessTemplate.id
  ]);

  // Assign EVERY dedicated staff character whose assignedLocationId is among selected public locations
  const assignedStaffInstances: CharacterCaseInstance[] = [];
  for (const loc of Object.values(locations)) {
    if (loc.isPublic === false) continue;
    const staffForLoc = MASTER_CHARACTERS.filter(
      (c) =>
        c.characterKind === 'staff' &&
        c.assignedLocationId === loc.id &&
        !alreadyCastIds.has(c.id)
    );
    for (const sTpl of staffForLoc) {
      alreadyCastIds.add(sTpl.id);
      const effectiveHours = sTpl.shiftHours || loc.openingHours;
      const openStr = effectiveHours?.open || '08:00';
      const closeStr = effectiveHours?.close || '20:00';
      assignedStaffInstances.push({
        ...sTpl,
        role: 'staff',
        isPrimaryCast: false,
        currentLocationId: loc.id,
        alibiClaim: `On regular shift at ${loc.name} (${openStr}–${closeStr}).`,
        actualLocationIdAtMurder: loc.id,
        isLying: false,
        reasonPresent: `Assigned ${sTpl.title} shift at ${loc.name} (${openStr}–${closeStr}).`,
        personalGoal: 'Keep the venue orderly and honest with precinct investigators.',
        interviewNotes: [],
        perjuryExposed: false,
        demeanor: 'Cooperative'
      });
    }
  }

  // Pick 8 occasional family visitors whose multi-location routines intersect our selected locations
  const familyCandidates = castRng.shuffle(
    MASTER_CHARACTERS.filter(
      (c) =>
        c.characterKind === 'family_visitor' &&
        !alreadyCastIds.has(c.id) &&
        c.routine.some((r) => Boolean(locations[r.locationId]))
    )
  ).slice(0, 8);

  const familyVisitorInstances: CharacterCaseInstance[] = familyCandidates.map((fTpl) => {
    alreadyCastIds.add(fTpl.id);
    const matchingRoutine = fTpl.routine.find((r) => Boolean(locations[r.locationId])) || fTpl.routine[0];
    const visitLoc = locations[matchingRoutine.locationId];
    return {
      ...fTpl,
      role: 'witness',
      isPrimaryCast: false,
      currentLocationId: matchingRoutine.locationId,
      alibiClaim: `Brief family errand at ${visitLoc?.name || 'town'} (${matchingRoutine.timeWindow}) — ${matchingRoutine.visitReason}.`,
      actualLocationIdAtMurder: matchingRoutine.locationId,
      isLying: false,
      reasonPresent: `Occasional family visit (${fTpl.familyName} family): ${matchingRoutine.visitReason}.`,
      personalGoal: `Finish ${fTpl.familyName} family errands and return home safely.`,
      interviewNotes: [],
      perjuryExposed: false,
      demeanor: 'Cooperative'
    };
  });

  const suspects: CharacterCaseInstance[] = [redHerringInstance, secondSuspectInstance];
  const witnesses: CharacterCaseInstance[] = [
    witnessInstance,
    corroboratorInstance,
    ...assignedStaffInstances,
    ...familyVisitorInstances
  ];

  // Difficulty-scaled random additional liars across ANY non-culprit living cast member
  // (including suspects, witnesses, corroborator, venue staff, and neighborhood/family visitors)
  const extraLiarCountByDifficulty: Record<Difficulty, number[]> = {
    easy: [0, 1],
    medium: [1, 2, 3],
    hard: [2, 3, 4]
  };
  const desiredExtraLiars = liarRng.pick(extraLiarCountByDifficulty[difficulty] || [0, 1]);
  const eligibleExtraLiars = [
    redHerringInstance,
    secondSuspectInstance,
    witnessInstance,
    corroboratorInstance,
    ...assignedStaffInstances,
    ...familyVisitorInstances
  ];
  const chosenExtraLiars = liarRng
    .shuffle(eligibleExtraLiars)
    .slice(0, Math.min(desiredExtraLiars, eligibleExtraLiars.length));
  const extraLiarIds = new Set(chosenExtraLiars.map((ch) => ch.id));

  const activeVenuePoolForLiars = [
    crimeLocationTemplate.id,
    secondaryLocationId1,
    secondaryLocationId2,
    secondaryLocationId3,
    ...bonusLocationIds
  ].filter(
    (id, idx, arr) =>
      Boolean(locations[id]) &&
      locations[id].isPublic !== false &&
      id !== 'agency' &&
      arr.indexOf(id) === idx
  );

  const extraLiarMotivesPool = liarRng.shuffle(
    MASTER_MOTIVES.filter((m) => m.id !== motive.id)
  );

  const buildMotiveSpecificExcuse = (
    char: CharacterCaseInstance,
    liarMotive: MotiveTemplate,
    locName: string
  ): { secretActionExcuse: string; motiveAdmissionLine: string } => {
    const vName = victimTemplate.name;
    switch (liarMotive.category) {
      case 'Inheritance':
        return {
          secretActionExcuse: `retrieve a draft copy of ${vName}'s estate papers tied to ${liarMotive.name.toLowerCase()} before probate officers saw my name on it`,
          motiveAdmissionLine: `Yes, I stood to lose a fortune under ${liarMotive.name}—and any precinct clerk would squint at those estate papers around ${locName}—but fighting over probate isn't murder, detective!`
        };
      case 'Blackmail':
        return {
          secretActionExcuse: `track down and burn the leverage ${vName} was holding over me for ${liarMotive.name.toLowerCase()}`,
          motiveAdmissionLine: `Nobody wants ${vName}'s blackmail files over ${liarMotive.name} dragged onto a police blotter, detective—wanting a private scandal buried isn't the same as taking a life!`
        };
      case 'Mob Silencing':
        return {
          secretActionExcuse: `pull my name off the back-room list tied to ${liarMotive.name.toLowerCase()} before syndicate enforcers or precinct dicks showed up`,
          motiveAdmissionLine: `If syndicate gossip links me to ${liarMotive.name}, I'm a marked soul! Having my name tangled in those back-room papers doesn't mean I touched ${vName}!`
        };
      case 'Debt':
        return {
          secretActionExcuse: `collect or tear up overdue markers tied to ${liarMotive.name.toLowerCase()} before ${vName} seized my livelihood`,
          motiveAdmissionLine: `I owed ${vName} plenty under ${liarMotive.name}, and I knew how ugly those markers looked on paper—but financial trouble isn't proof of murder, detective!`
        };
      case 'Jealousy':
        return {
          secretActionExcuse: `reclaim private letters and clear my reputation from ${liarMotive.name.toLowerCase()} before the story hit morning print`,
          motiveAdmissionLine: `Folks in our circle knew ${vName} and I had bitter words over ${liarMotive.name}, and I dreaded the scandal—having a fierce quarrel doesn't make someone a killer!`
        };
      case 'Revenge':
      default:
        return {
          secretActionExcuse: `settle an old score over ${liarMotive.name.toLowerCase()} and wipe my name off ${vName}'s papers`,
          motiveAdmissionLine: `I made no secret of hating what ${vName} did regarding ${liarMotive.name}, and I knew folks would whisper—having an old grudge isn't the same as killing someone!`
        };
    }
  };
  const culpritExcuseSpec = buildMotiveSpecificExcuse(
    culpritCaseInstance,
    motive,
    crimeLocationTemplate.name
  );
  const culpritEarlierVisitTime = addMinutesToTime(crimeTime, -90);

  const traceItemTemplates: Array<{
    name: string;
    shortLabel: string;
    feature: string;
    spotHint: string;
  }> = [
    {
      name: 'Monogrammed Cigarette Case & Thread',
      shortLabel: 'monogrammed cigarette case',
      feature: 'a tarnished silver cigarette case',
      spotHint: 'A tarnished cigarette case with scratched initials rests wedged along the baseboard.'
    },
    {
      name: 'Initialed Linen Handkerchief & Fiber',
      shortLabel: 'initialed handkerchief',
      feature: 'a damp monogrammed linen handkerchief',
      spotHint: 'A folded linen handkerchief bearing stitched initials lies tucked beside the corner.'
    },
    {
      name: 'Engraved Brass Match Safe & Lint',
      shortLabel: 'engraved match safe',
      feature: 'a pocket brass match safe',
      spotHint: 'A pocket brass match safe engraved with two initials sits behind the trim.'
    },
    {
      name: 'Initialed Leather Key Tag & Thread',
      shortLabel: 'initialed key tag',
      feature: 'a stamped leather luggage and locker key tag',
      spotHint: 'A stamped leather key tag marked with initials lies slipped under the edge.'
    },
    {
      name: 'Monogrammed Pocket Memorandum Stub',
      shortLabel: 'pocket memorandum stub',
      feature: 'a torn leather-bound memorandum leaf',
      spotHint: 'A torn pocket notebook sheet initialed in fountain ink sticks out beneath the counter.'
    }
  ];

  interface ExtraLiarSpec {
    motive: MotiveTemplate;
    motiveClueId: string;
    motiveLocId: string;
    traceClueId: string;
    traceLocId: string;
    traceItemName: string;
    traceItemShort: string;
    initials: string;
    fiberDesc: string;
    nearTime: string;
    secretActionExcuse: string;
    motiveAdmissionLine: string;
    traceExcuse: string;
  }
  const extraLiarSpecs: Record<string, ExtraLiarSpec> = {};

  chosenExtraLiars.forEach((liar, idx) => {
    const liarMotive = extraLiarMotivesPool[idx % extraLiarMotivesPool.length] || MASTER_MOTIVES[0];
    const liarInitials = getInitials(liar.name);
    const liarFiberDesc = describeAttireFibers(liar.avatarStyle.collar);
    const homeOrVenueName = locations[liar.currentLocationId]?.name || crimeLocationTemplate.name;
    const { secretActionExcuse, motiveAdmissionLine } = buildMotiveSpecificExcuse(
      liar,
      liarMotive,
      homeOrVenueName
    );

    const motiveLocId =
      activeVenuePoolForLiars[(idx + 1) % activeVenuePoolForLiars.length] || crimeLocationTemplate.id;
    const motiveHookKey = liarMotive.clueHooks[idx % liarMotive.clueHooks.length];
    const motiveHookMeta = motiveHookKey ? MOTIVE_HOOK_CLUES[motiveHookKey] : undefined;
    const motiveClueId = `clue_liar_motive_${liar.id}`;
    const liarMotiveVars = {
      victimName: victimTemplate.name,
      culpritName: liar.name,
      motiveDesc: liarMotive.description,
      crimeLocation: crimeLocationTemplate.name
    };

    clues[motiveClueId] = {
      id: motiveClueId,
      name: motiveHookMeta ? `${motiveHookMeta.name} — ${liar.name}` : `${liarMotive.name} Paperwork — ${liar.name}`,
      category: motiveHookMeta?.category || 'document',
      shortSummary: motiveHookMeta
        ? `${motiveHookMeta.shortSummary} (Cites ${liar.name})`
        : `${liarMotive.evidenceClueSnippet} (Cites ${liar.name})`,
      detailedInspection: motiveHookMeta
        ? `${interpolateFragment(motiveHookMeta.detailTemplate, liarMotiveVars)} ${liarMotive.evidenceClueSnippet}`
        : `Private record tying ${liar.name} and ${victimTemplate.name} to a fierce dispute over ${liarMotive.name}: ${liarMotive.description}`,
      locationFoundId: motiveLocId,
      status: 'undiscovered',
      supports: 'motive_hook',
      relatedCharacterId: liar.id
    };
    attachClueToProfileSpot(
      motiveLocId,
      ['recordSpot', 'discardSpot', 'leadSpot', 'exitSpot'],
      motiveClueId,
      `poi_liar_motive_${liar.id}`,
      {
        fallbackLabel: `${locations[motiveLocId].name} Filed Correspondence Tray`,
        fallbackDescription: `Side-drawer correspondence stack tucked inside ${locations[motiveLocId].name}.`,
        descriptionSuffix: `Folded dispute papers marked in connection with ${liarMotive.category.toLowerCase()} business sit tucked inside.`
      }
    );

    // Place physical initialed traces at the crime scene for at least one non-suspect liar, and rotate across reachable venues
    const traceLocId =
      idx === 0 || (liar.role !== 'suspect' && idx % 2 === 0)
        ? crimeLocationTemplate.id
        : activeVenuePoolForLiars[(idx + 2) % activeVenuePoolForLiars.length] || crimeLocationTemplate.id;
    const traceTpl = traceItemTemplates[(idx + clueRng.int(0, traceItemTemplates.length - 1)) % traceItemTemplates.length];
    const traceClueId = `clue_liar_trace_${liar.id}`;
    const earlierVisitTime = addMinutesToTime(crimeTime, -(95 + idx * 25));
    clues[traceClueId] = {
      id: traceClueId,
      name: traceTpl.name,
      category: 'physical',
      shortSummary: `Marked "${liarInitials}" with ${liarFiberDesc} recovered at ${locations[traceLocId].name}.`,
      detailedInspection: `Recovered inside ${locations[traceLocId].name}: ${traceTpl.feature} engraved with the initials "${liarInitials}" and catching ${liarFiberDesc}. Margin wear suggests someone dropped it hastily while handling ${liarMotive.category.toLowerCase()} business.`,
      locationFoundId: traceLocId,
      status: 'undiscovered',
      supports: 'red_herring',
      relatedCharacterId: liar.id
    };
    attachClueToProfileSpot(
      traceLocId,
      ['discardSpot', 'exitSpot', 'leadSpot', 'recordSpot'],
      traceClueId,
      `poi_liar_trace_${liar.id}`,
      {
        fallbackLabel: `${locations[traceLocId].name} Side Alcove Fixture`,
        fallbackDescription: `Dimly lit side alcove along the wainscoting inside ${locations[traceLocId].name}.`,
        descriptionSuffix: `${traceTpl.spotHint} Stray ${liarFiberDesc} cling along the edge.`
      }
    );

    const nearTime = addMinutesToTime(crimeTime, liarRng.pick([-20, -12, 8, 15]));
    const traceExcuse =
      traceLocId === crimeLocationTemplate.id
        ? `(Swallows hard as you hold up the ${traceTpl.shortLabel}) ...Yes, "${liarInitials}" is mine, and those ${liarFiberDesc} match my coat! I slipped into ${crimeLocationTemplate.name} earlier around ${earlierVisitTime} to confront ${victimTemplate.name} over ${liarMotive.name.toLowerCase()}, dropped it in the rush, and cleared out long before ${crimeTime}. I swear I didn't kill anyone!`
        : `(Winces over the ${traceTpl.shortLabel}) ...All right, "${liarInitials}" belongs to me. I dropped it at ${locations[traceLocId].name} around ${earlierVisitTime} while trying to ${secretActionExcuse}—and panicked when news of the murder broke!`;

    extraLiarSpecs[liar.id] = {
      motive: liarMotive,
      motiveClueId,
      motiveLocId,
      traceClueId,
      traceLocId,
      traceItemName: traceTpl.name,
      traceItemShort: traceTpl.shortLabel,
      initials: liarInitials,
      fiberDesc: liarFiberDesc,
      nearTime,
      secretActionExcuse,
      motiveAdmissionLine,
      traceExcuse
    };
  });

  if (extraLiarIds.has(secondSuspectInstance.id)) {
    secondSuspectInstance.isLying = true;
  }

  if (extraLiarIds.has(redHerringInstance.id)) {
    redHerringInstance.isLying = true;
    redHerringInstance.alibiClaim = `${redHerringShiftPlan.shiftClause}I was with ${corroboratorTemplate.name} at ${locations[secondaryLocationId3].name} from ${corrWindow.start} onward—and I haven't stepped inside ${crimeLocationTemplate.name} at all recently, so don't try tying anything in that room to me!`;
  }

  if (extraLiarIds.has(witnessInstance.id)) {
    const wSpec = extraLiarSpecs[witnessInstance.id];
    witnessInstance.isLying = true;
    witnessInstance.demeanor = 'Nervous';
    witnessInstance.alibiClaim = wSpec
      ? `I stayed clear of ${crimeLocationTemplate.name} after dusk last night, detective—folks who keep clear of ${wSpec.motive.category.toLowerCase()} trouble stay blocks away once voices rise.`
      : `I stayed clear of ${crimeLocationTemplate.name} after dusk last night, detective—folks in this neighborhood keep their heads down and stay blocks away when voices get raised.`;
  }

  if (extraLiarIds.has(corroboratorInstance.id)) {
    const cSpec = extraLiarSpecs[corroboratorInstance.id];
    corroboratorInstance.isLying = true;
    corroboratorInstance.demeanor = 'Guarded';
    corroboratorInstance.alibiClaim = corroboratorHomeLoc && corroboratorHomeLoc.id !== secondaryLocationId3
      ? `I tended to my usual station at ${corroboratorHomeLoc.name} last night and didn't go trotting across town to ${locations[secondaryLocationId3].name} for anyone's ${cSpec ? cSpec.motive.category.toLowerCase() : 'private'} business.`
      : `I kept indoors to myself last night and didn't sit through anyone's late ${cSpec ? cSpec.motive.category.toLowerCase() : 'private'} settlements at ${locations[secondaryLocationId3].name}.`;
  }

  interface StaffLiarSpec {
    earlyClaimTime?: string;
    workedThroughCrime: boolean;
    rosterLogLine: string;
    sightingLieResponse: string;
    admissionResponse: string;
  }
  const staffLiarSpecs: Record<string, StaffLiarSpec> = {};
  for (const staff of assignedStaffInstances) {
    if (!extraLiarIds.has(staff.id)) continue;
    staff.isLying = true;
    staff.demeanor = liarRng.pick(['Nervous', 'Guarded', 'Defiant']);
    const loc = locations[staff.currentLocationId];
    const effectiveHours = staff.shiftHours || loc.openingHours;
    const shiftClose = effectiveHours?.close || '20:00';
    const staffSpec = extraLiarSpecs[staff.id];
    const staffExcuse = staffSpec
      ? staffSpec.secretActionExcuse
      : 'retrieve personal papers from the back room';
    const staffMotiveName = staffSpec ? staffSpec.motive.name : 'a private dispute';
    const onDutyAroundCrime =
      isLocationOpenAt(effectiveHours, crimeTimeMinutes) &&
      isLocationOpenAt(loc.openingHours, crimeTimeMinutes);
    if (onDutyAroundCrime) {
      const earlyClaimTime = addMinutesToTime(crimeTime, -45);
      staffLiarSpecs[staff.id] = {
        earlyClaimTime,
        workedThroughCrime: true,
        rosterLogLine: `${crimeTime} — ${staff.name} (${staff.title}) initialed the late cash-drawer tape & side latch check at ${loc.name} (no early sign-out entered).`,
        sightingLieResponse: `I wasn't on the floor around ${crimeTime}, detective—I felt a chill coming on, clocked out early at ${earlyClaimTime}, and went straight home.`,
        admissionResponse: `(Winces as you tap the time-stamped column) ...All right, don't breathe it to management! I never knocked off at ${earlyClaimTime}. I ducked into the back room at ${loc.name} around ${crimeTime} to ${staffExcuse} because of ${staffMotiveName}—I feared it looked like murder motive, but I swear I never harmed ${victimTemplate.name}!`
      };
      staff.alibiClaim = `I felt unwell and clocked out early from ${loc.name} at ${earlyClaimTime} last night—never set foot inside after that.`;
    } else {
      const returnTime = addMinutesToTime(crimeTime, -15);
      staffLiarSpecs[staff.id] = {
        workedThroughCrime: false,
        rosterLogLine: `${returnTime} — ${staff.name} (${staff.title}) signed the night key sheet back out at ${loc.name} for an unscheduled rear-office stop.`,
        sightingLieResponse: `I wasn't at ${loc.name} around ${crimeTime}, detective—I locked up sharp at ${shiftClose} and went straight home to bed.`,
        admissionResponse: `(Clears throat uneasily) ...All right, keep it off my personnel folder, detective. I did slip back into ${loc.name} around ${returnTime} to ${staffExcuse} tied to ${staffMotiveName}—I panicked when I heard ${victimTemplate.name} turned up dead, had nothing at all to do with the killing.`
      };
      staff.alibiClaim = `I clocked out sharp at ${shiftClose} and headed straight home last night—never returned to ${loc.name} anywhere near ${crimeTime}.`;
    }
  }

  interface FamilyVisitorLiarSpec {
    visitLocId: string;
    visitLocName: string;
    loggedTimeStr: string;
    rosterLogLine: string;
    admissionResponse: string;
  }
  const familyVisitorLiarSpecs: Record<string, FamilyVisitorLiarSpec> = {};
  for (const fv of familyVisitorInstances) {
    if (!extraLiarIds.has(fv.id)) continue;
    fv.isLying = true;
    fv.demeanor = 'Nervous';
    const visitLoc = locations[fv.currentLocationId];
    const matchingRoutine =
      fv.routine.find((r) => r.locationId === fv.currentLocationId) || fv.routine[0];
    const loggedTimeStr = matchingRoutine?.timeWindow || addMinutesToTime(crimeTime, -25);
    const visitReason = matchingRoutine?.visitReason || 'private errand';
    const fvSpec = extraLiarSpecs[fv.id];
    const fvExcuse = fvSpec
      ? fvSpec.secretActionExcuse
      : 'settle a private household matter';
    const fvMotiveName = fvSpec ? fvSpec.motive.name : 'a private dispute';
    fv.alibiClaim = `I stayed indoors with the ${fv.familyName} family all evening last night—never stepped foot into ${visitLoc.name} or out after dark.`;
    familyVisitorLiarSpecs[fv.id] = {
      visitLocId: visitLoc.id,
      visitLocName: visitLoc.name,
      loggedTimeStr,
      rosterLogLine: `${loggedTimeStr} — ${fv.name} (${fv.familyName} family) countersigned the evening door book at ${visitLoc.name} (${visitReason}).`,
      admissionResponse: `(Flushes and lowers voice) ...Please keep it quiet from the ${fv.familyName} elders, detective! I slipped over to ${visitLoc.name} (${loggedTimeStr}: ${visitReason}) trying to ${fvExcuse} over ${fvMotiveName}—I hid it because I feared being framed, not because I murdered ${victimTemplate.name}.`
    };
  }

  // Discoverable Street Gossip Clues & Hearsay Crime-Scene Sighting Leads (never naming the real culprit)
  const gossipTargetPool = [
    ...chosenExtraLiars,
    redHerringInstance,
    secondSuspectInstance
  ].filter((ch, idx, arr) => ch.id !== culpritTemplate.id && arr.findIndex((x) => x.id === ch.id) === idx);
  const gossipTarget1 = gossipTargetPool[0] || redHerringInstance;
  const gossipTarget2 = gossipTargetPool[1] || secondSuspectInstance;
  const gossipTime1 = extraLiarSpecs[gossipTarget1.id]?.nearTime || addMinutesToTime(crimeTime, -14);
  const gossipTime2 = extraLiarSpecs[gossipTarget2.id]?.nearTime || addMinutesToTime(crimeTime, 11);
  const gossipTarget1Spec = extraLiarSpecs[gossipTarget1.id];
  const gossipTarget2Spec = extraLiarSpecs[gossipTarget2.id];

  const gossipClue1Id = 'clue_gossip_street_tip';
  const gossipLoc1Id = locations[secondaryLocationId1] ? secondaryLocationId1 : crimeLocationTemplate.id;
  clues[gossipClue1Id] = {
    id: gossipClue1Id,
    name: 'Counter Regular’s Whispered Gossip Note',
    category: 'testimony',
    shortSummary: `Second-hand street gossip saying someone saw ${gossipTarget1.name} near ${crimeLocationTemplate.name} around ${gossipTime1}.`,
    detailedInspection: `Jotted back-counter rumor collected at ${locations[gossipLoc1Id].name}: a night newsboy told patrons he heard someone saw ${gossipTarget1.name} (wearing a ${gossipTarget1.avatarStyle.collar}) hurrying past ${crimeLocationTemplate.name} around ${gossipTime1}. Regulars also whispered that ${gossipTarget1.name} and ${victimTemplate.name} had recent friction${gossipTarget1Spec ? ` over ${gossipTarget1Spec.motive.name.toLowerCase()}` : ''}.`,
    locationFoundId: gossipLoc1Id,
    status: 'undiscovered',
    supports: 'witness_account',
    relatedCharacterId: gossipTarget1.id
  };
  attachClueToProfileSpot(
    gossipLoc1Id,
    ['discardSpot', 'leadSpot', 'recordSpot'],
    gossipClue1Id,
    'poi_gossip_street_tip',
    {
      fallbackLabel: `${locations[gossipLoc1Id].name} Counter Tip Jar & Blotter`,
      fallbackDescription: `Corner counter blotter scribbled with phone messages and neighborhood chatter at ${locations[gossipLoc1Id].name}.`,
      descriptionSuffix: `A folded scrap notes street gossip about who was seen near ${crimeLocationTemplate.name} last night.`
    }
  );

  const gossipClue2Id = 'clue_gossip_party_line';
  const gossipLoc2Id = locations[secondaryLocationId2] ? secondaryLocationId2 : crimeLocationTemplate.id;
  clues[gossipClue2Id] = {
    id: gossipClue2Id,
    name: 'Switchboard & Parlor Rumor Scrap',
    category: 'testimony',
    shortSummary: `Overheard gossip claiming a cabbie spotted ${gossipTarget2.name} outside ${crimeLocationTemplate.name} near ${gossipTime2}.`,
    detailedInspection: `Neighborhood hearsay noted at ${locations[gossipLoc2Id].name}: an off-duty driver claimed he heard someone saw ${gossipTarget2.name} (${gossipTarget2.avatarStyle.collar}) lingering across the street from ${crimeLocationTemplate.name} around ${gossipTime2}${gossipTarget2Spec ? `, amid rumors of bad blood tied to ${gossipTarget2Spec.motive.name.toLowerCase()}` : ''}.`,
    locationFoundId: gossipLoc2Id,
    status: 'undiscovered',
    supports: 'witness_account',
    relatedCharacterId: gossipTarget2.id
  };
  attachClueToProfileSpot(
    gossipLoc2Id,
    ['leadSpot', 'recordSpot', 'discardSpot'],
    gossipClue2Id,
    'poi_gossip_party_line',
    {
      fallbackLabel: `${locations[gossipLoc2Id].name} Telephone Stand Ledger`,
      fallbackDescription: `Payphone ledge and message pad tucked beside the vestibule at ${locations[gossipLoc2Id].name}.`,
      descriptionSuffix: `Hasty booth gossip scribbles mention a figure overheard spotted outside ${crimeLocationTemplate.name}.`
    }
  );

  // STAGE D-2: Person-Specific Discoverable Clues (using location-specific spots, never generic defaults)
  const witnessHook = getCharacterClueHook(witnessTemplate);
  const witnessClueId = 'clue_witness_report_slip';
  clues[witnessClueId] = {
    id: witnessClueId,
    name: `Precinct Bystander Card — ${witnessTemplate.name}`,
    category: 'testimony',
    shortSummary: `Beat log noting ${witnessTemplate.name} overheard shouting near ${crimeLocationTemplate.name} at ${crimeTime}.`,
    detailedInspection: `${witnessHook.detailTemplate} Beat patrolman noted ${witnessTemplate.name} stopped near ${crimeLocationTemplate.name} in ${crimeLocationTemplate.district} around ${crimeTime} after hearing raised voices inside.`,
    locationFoundId: crimeLocationTemplate.id,
    status: 'undiscovered',
    supports: 'witness_account',
    relatedCharacterId: witnessTemplate.id
  };
  attachClueToProfileSpot(crimeLocationTemplate.id, ['exitSpot', 'leadSpot'], witnessClueId, 'poi_witness_report', {
    fallbackLabel: `${crimeLocationTemplate.district} Threshold Outside ${crimeLocationTemplate.name}`,
    fallbackDescription: `Rain-spotted patrolman card logged along the curb outside ${crimeLocationTemplate.name} (${crimeLocationTemplate.district}).`
  });

  const secondSuspectHook = getCharacterClueHook(secondSuspectTemplate);
  const secondSuspectClueId = 'clue_second_suspect_record';
  const secretVisitStart = timelineRng.pick(['20:15', '20:25', '20:35', '20:45']);
  const secretVisitEnd = addMinutesToTime(secretVisitStart, 50);
  if (!secondSuspectInstance.isLying) {
    secondSuspectInstance.alibiClaim = secondSuspectHasSeparateHome
      ? `I worked my regular hours at ${secondSuspectHomeLoc!.name} (${secondSuspectShiftOpen}–${secondSuspectShiftClose}) and stepped briefly into ${secondSuspectSecretLoc.name} around ${secretVisitStart} on private business—nowhere near ${crimeLocationTemplate.name}.`
      : `I stopped briefly at ${secondSuspectSecretLoc.name} around ${secretVisitStart} on private business last night—never went near ${crimeLocationTemplate.name}.`;
  }
  const secretSlipNo = clueRng.int(204, 899);
  const isStripClubSecret = secondSuspectSecretLocId === 'crimson_cabaret';
  const isNightclubSecret =
    isStripClubSecret ||
    secondSuspectSecretLocId === 'velvet_lounge' ||
    secondSuspectSecretLocId === 'blue_dahlia_club';
  const isTavernOrPoolSecret =
    secondSuspectSecretLocId === 'copper_kettle_tavern' || secondSuspectSecretLocId === 'pool_hall';
  const isPawnSecret = secondSuspectSecretLocId === 'ace_pawnshop';
  clues[secondSuspectClueId] = {
    id: secondSuspectClueId,
    name: isStripClubSecret
      ? `Crimson Garter VIP Check #${secretSlipNo} — ${secondSuspectTemplate.name}`
      : isNightclubSecret
        ? `${secondSuspectSecretLoc.name} Back-Booth Check #${secretSlipNo} — ${secondSuspectTemplate.name}`
        : isTavernOrPoolSecret
          ? `${secondSuspectSecretLoc.name} Back-Table IOU #${secretSlipNo} — ${secondSuspectTemplate.name}`
          : isPawnSecret
            ? `${secondSuspectSecretLoc.name} Pledge Stub #${secretSlipNo} — ${secondSuspectTemplate.name}`
            : secondSuspectHook.clueTitle,
    category: 'document',
    shortSummary: isStripClubSecret
      ? `Signed backstage bottle & coat-check slip proving ${secondSuspectTemplate.name} slipped into ${secondSuspectSecretLoc.name} around ${secretVisitStart}.`
      : isPawnSecret
        ? `Cash-settled collateral slip proving ${secondSuspectTemplate.name} visited ${secondSuspectSecretLoc.name} around ${secretVisitStart}.`
        : `Signed private house slip proving ${secondSuspectTemplate.name} visited ${secondSuspectSecretLoc.name} around ${secretVisitStart}.`,
    detailedInspection: isStripClubSecret
      ? `${secondSuspectHook.detailTemplate} Time-stamped champagne & coatroom slip inside ${secondSuspectSecretLoc.name} bears ${secondSuspectTemplate.name}’s hasty initials from ${secretVisitStart} with a scribble: "Cash settled — keep off front guest book."`
      : `${secondSuspectHook.detailTemplate} Time-stamped private slip at ${secondSuspectSecretLoc.name} proves ${secondSuspectTemplate.name} spent the ${secretVisitStart}–${secretVisitEnd} hour on the premises despite leaving it out of their statement.`,
    locationFoundId: secondSuspectSecretLocId,
    status: 'undiscovered',
    supports: 'suspect_alibi',
    relatedCharacterId: secondSuspectTemplate.id
  };
  attachClueToProfileSpot(
    secondSuspectSecretLocId,
    ['discardSpot', 'recordSpot', 'leadSpot'],
    secondSuspectClueId,
    'poi_second_suspect_ledger',
    {
      fallbackLabel: `${secondSuspectSecretLoc.name} Back-Room Cloak & Tab Spike`,
      fallbackDescription: `Back-room cloak rail and counter spindle tucked away from the main floor at ${secondSuspectSecretLoc.name}.`,
      descriptionSuffix: `A crumpled cash slip and private duplicate tucked behind the fixtures bears a familiar signature.`
    }
  );

  const corroboratorHook = getCharacterClueHook(corroboratorTemplate);
  const corroboratorClueId = 'clue_corroborator_record';
  const corrRecordSpec = getCorroboratorRecordSpec(
    clueRng,
    locations[secondaryLocationId3],
    corroboratorTemplate.name,
    redHerringTemplate.name,
    corrWindow.start,
    corrWindow.end
  );
  clues[corroboratorClueId] = {
    id: corroboratorClueId,
    name: corrRecordSpec.name,
    category: 'document',
    shortSummary: corrRecordSpec.shortSummary,
    detailedInspection: `${corroboratorHook.detailTemplate} Two-signature evening voucher at ${locations[secondaryLocationId3].name} confirming ${corroboratorTemplate.name} and ${redHerringTemplate.name} met from ${corrWindow.start} to ${corrWindow.end}.`,
    locationFoundId: secondaryLocationId3,
    status: 'undiscovered',
    supports: 'corroboration',
    relatedCharacterId: corroboratorTemplate.id
  };
  attachClueToProfileSpot(
    secondaryLocationId3,
    ['recordSpot', 'leadSpot', 'discardSpot'],
    corroboratorClueId,
    'poi_corroborator_receipt',
    {
      fallbackLabel: `${locations[secondaryLocationId3].name} Evening Appointment Spike`,
      fallbackDescription: `Evening appointment desk and brass receipt spindle inside ${locations[secondaryLocationId3].name}.`,
      descriptionSuffix: corrRecordSpec.poiHint
    }
  );

  // Build Dual-Timeline Schedules (Murder Night Day 1 + Investigation Day 2) linked to Opening Hours & Staff Shifts
  const schedules: Record<string, CharacterScheduleWindow[]> = {};
  const addScheduleWindow = (win: CharacterScheduleWindow) => {
    if (!schedules[win.characterId]) schedules[win.characterId] = [];
    schedules[win.characterId].push(win);
  };

  // Helper to clamp a visit window inside a location's open hours on a given dayBase
  const buildClampedVisitWindow = (
    charId: string,
    locId: string,
    routineEntry: { timeWindow: string; durationMinutes?: number; visitReason: string },
    dayBase: number,
    phase: 'murder_night' | 'investigation_day',
    idx: number
  ): CharacterScheduleWindow | null => {
    const loc = locations[locId];
    if (!loc) return null;
    const parts = routineEntry.timeWindow.split('-');
    const rawStart = parseHHMM(parts[0] || '10:00');
    const desiredDur = Math.max(30, Math.min(85, routineEntry.durationMinutes || 45));
    const op = getOperatingWindowOnDay(loc.openingHours, dayBase);
    let startAbs = dayBase + rawStart;
    if (startAbs < op.start) {
      // If venue is overnight wrap (e.g., 18:00-03:00) and visit starts after midnight
      if (rawStart < 360 && op.end > dayBase + 1440) {
        startAbs = dayBase + 1440 + rawStart;
      } else {
        startAbs = op.start + 15;
      }
    }
    if (startAbs + desiredDur > op.end) {
      startAbs = Math.max(op.start, op.end - desiredDur);
    }
    const endAbs = Math.min(op.end, startAbs + desiredDur);
    if (endAbs <= startAbs) return null;
    return {
      id: `sched_${charId}_${phase}_${locId}_${idx}`,
      characterId: charId,
      locationId: locId,
      timelinePhase: phase,
      kind: 'visit',
      startMinutes: startAbs,
      endMinutes: endAbs,
      startStr: formatMinutesHHMM(startAbs),
      endStr: formatMinutesHHMM(endAbs),
      purpose: routineEntry.visitReason
    };
  };

  // Helper to place a timed short visit window inside a location's opening hours, avoiding a primary shift when possible
  const buildTimedVisitWindow = (
    charId: string,
    locId: string,
    dayBase: number,
    phase: 'murder_night' | 'investigation_day',
    preferredOffsets: number[],
    durationMins: number,
    purpose: string,
    avoidWindow: { start: number; end: number } | null,
    tag: string
  ): CharacterScheduleWindow | null => {
    const loc = locations[locId];
    if (!loc) return null;
    const op = getOperatingWindowOnDay(loc.openingHours, dayBase);
    const dur = Math.min(durationMins, Math.max(30, op.end - op.start));
    const candidateOffsets = [
      ...preferredOffsets,
      10 * 60 + 30,
      12 * 60,
      14 * 60,
      16 * 60,
      19 * 60 + 30,
      21 * 60
    ];

    let chosenStart: number | null = null;
    let chosenEnd: number | null = null;
    const minVisitDur = Math.min(30, dur);
    for (const offset of candidateOffsets) {
      let s = dayBase + offset;
      if (s < op.start) {
        if (offset < 360 && op.end > dayBase + 1440) {
          s = dayBase + 1440 + offset;
        } else {
          s = op.start;
        }
      }
      if (
        avoidWindow &&
        s >= avoidWindow.start &&
        s < avoidWindow.end &&
        op.end - avoidWindow.end >= minVisitDur
      ) {
        s = avoidWindow.end;
      }
      if (s + dur > op.end) {
        s =
          avoidWindow && op.end - avoidWindow.end >= minVisitDur
            ? Math.max(op.start, avoidWindow.end)
            : Math.max(op.start, op.end - dur);
      }
      const e = Math.min(op.end, s + dur);
      if (e - s < minVisitDur || s < op.start) continue;
      if (!avoidWindow || e <= avoidWindow.start || s >= avoidWindow.end) {
        chosenStart = s;
        chosenEnd = e;
        break;
      }
    }

    if (chosenStart === null || chosenEnd === null) {
      if (avoidWindow) return null;
      let s = dayBase + (preferredOffsets[0] ?? 10 * 60 + 30);
      if (s < op.start) s = op.start;
      if (s + dur > op.end) s = Math.max(op.start, op.end - dur);
      chosenStart = s;
      chosenEnd = Math.min(op.end, chosenStart + dur);
    }

    if (chosenEnd <= chosenStart) return null;
    return {
      id: `sched_${charId}_${phase}_${tag}`,
      characterId: charId,
      locationId: locId,
      timelinePhase: phase,
      kind: 'visit',
      startMinutes: chosenStart,
      endMinutes: chosenEnd,
      startStr: formatMinutesHHMM(chosenStart),
      endStr: formatMinutesHHMM(chosenEnd),
      purpose
    };
  };

  // Staff schedules: respect individual shiftHours (day/night shifts) falling back to venue openingHours
  for (const staff of assignedStaffInstances) {
    const loc = locations[staff.currentLocationId];
    if (!loc) continue;
    const effectiveHours = staff.shiftHours || loc.openingHours;
    const mn = getOperatingWindowOnDay(effectiveHours, 0);
    addScheduleWindow({
      id: `sched_${staff.id}_mn`,
      characterId: staff.id,
      locationId: loc.id,
      timelinePhase: 'murder_night',
      kind: 'shift',
      startMinutes: mn.start,
      endMinutes: mn.end,
      startStr: formatMinutesHHMM(mn.start),
      endStr: formatMinutesHHMM(mn.end),
      purpose: `${staff.title} shift`
    });
    const inv = getOperatingWindowOnDay(effectiveHours, INVESTIGATION_DAY_BASE);
    addScheduleWindow({
      id: `sched_${staff.id}_inv`,
      characterId: staff.id,
      locationId: loc.id,
      timelinePhase: 'investigation_day',
      kind: 'shift',
      startMinutes: inv.start,
      endMinutes: inv.end,
      startStr: formatMinutesHHMM(inv.start),
      endStr: formatMinutesHHMM(inv.end),
      purpose: `${staff.title} shift`
    });
  }

  // Family visitor schedules: shorter occasional visits (35-85m) across selected locations on both timelines
  for (const fv of familyVisitorInstances) {
    fv.routine.forEach((r, idx) => {
      if (!locations[r.locationId]) return;
      const mnWin = buildClampedVisitWindow(fv.id, r.locationId, r, 0, 'murder_night', idx);
      if (mnWin) addScheduleWindow(mnWin);
      const invWin = buildClampedVisitWindow(fv.id, r.locationId, r, INVESTIGATION_DAY_BASE, 'investigation_day', idx);
      if (invWin) addScheduleWindow(invWin);
    });
  }

  // Core cast schedules: tie venue-linked personnel to their establishment's hours + short timed visits elsewhere
  const murderNightRosterNotes: Record<string, string[]> = {};
  for (const staff of assignedStaffInstances) {
    const spec = staffLiarSpecs[staff.id];
    if (spec) {
      if (!murderNightRosterNotes[staff.currentLocationId]) murderNightRosterNotes[staff.currentLocationId] = [];
      murderNightRosterNotes[staff.currentLocationId].push(spec.rosterLogLine);
    }
  }
  for (const fv of familyVisitorInstances) {
    const spec = familyVisitorLiarSpecs[fv.id];
    if (spec) {
      if (!murderNightRosterNotes[spec.visitLocId]) murderNightRosterNotes[spec.visitLocId] = [];
      murderNightRosterNotes[spec.visitLocId].push(spec.rosterLogLine);
    }
  }
  const coreScheduleConfigs: {
    char: CharacterCaseInstance;
    plotLocationId: string;
    invPreferredOffsets: number[];
    mnPreferredOffsets: number[];
    shiftPlan: MurderNightShiftPlan;
  }[] = [
    {
      char: culpritCaseInstance,
      plotLocationId: secondaryLocationId1,
      invPreferredOffsets: [10 * 60 + 30, 14 * 60, 19 * 60],
      mnPreferredOffsets: [parseHHMM(alibiStartTime), 17 * 60 + 15],
      shiftPlan: culpritShiftPlan
    },
    {
      char: redHerringInstance,
      plotLocationId: secondaryLocationId3,
      invPreferredOffsets: [11 * 60, 15 * 60, 20 * 60],
      mnPreferredOffsets: [corrStartMinutes, 17 * 60 + 15],
      shiftPlan: redHerringShiftPlan
    },
    {
      char: secondSuspectInstance,
      plotLocationId: secondSuspectSecretLocId,
      invPreferredOffsets: [19 * 60 + 30, 21 * 60, 14 * 60, 16 * 60],
      mnPreferredOffsets: [parseHHMM(secretVisitStart), 21 * 60, 17 * 60],
      shiftPlan: secondSuspectShiftPlan
    },
    {
      char: corroboratorInstance,
      plotLocationId: secondaryLocationId3,
      invPreferredOffsets: [11 * 60, 15 * 60, 20 * 60],
      mnPreferredOffsets: [corrStartMinutes, 17 * 60 + 15],
      shiftPlan: corroboratorShiftPlan
    },
    {
      char: witnessInstance,
      plotLocationId: crimeLocationTemplate.id,
      invPreferredOffsets: [9 * 60 + 15, 13 * 60, 18 * 60 + 30],
      mnPreferredOffsets: [crimeTimeMinutes - 15, 21 * 60],
      shiftPlan: witnessShiftPlan
    }
  ];

  // Record Victim's Workplace Absence Notice & discoverable unattended-post POI when regular worker is the victim
  if (victimTemplate.assignedLocationId && locations[victimTemplate.assignedLocationId]) {
    const vHomeLoc = locations[victimTemplate.assignedLocationId];
    const vHasCoworkers = assignedStaffInstances.some((st) => st.currentLocationId === vHomeLoc.id);
    const victimAbsenceClueId = 'clue_absence_victim';
    const victimAbsencePoiId = 'poi_absence_victim';
    const atOwnWorkplace = vHomeLoc.id === crimeLocationTemplate.id;
    const reasonLabel = atOwnWorkplace
      ? 'Post Sealed — Victim Struck Down on Premises'
      : 'Shift Unattended — Victim Deceased';
    const timelineLabel = atOwnWorkplace
      ? `Fatal attack around ${crimeTime} last night; post unstaffed today`
      : `Absent since ${victimMeetStart} last night; deceased ${crimeTime}`;
    const detail = atOwnWorkplace
      ? `${victimTemplate.name} (${victimTemplate.title}) held regular duty at ${vHomeLoc.name}, leaving the post unattended since the fatal attack around ${crimeTime}${vHasCoworkers ? ' while house coworkers locked down the desk' : ' with no substitute clerk assigned'}.`
      : `${victimTemplate.name} (${victimTemplate.title}) left ${vHomeLoc.name} prior to ${victimMeetStart} last night and was killed at ${crimeTime}, leaving their shift unattended today${vHasCoworkers ? ' while house staff minded the main floor' : ' with no substitute clerk assigned'}.`;

    clues[victimAbsenceClueId] = {
      id: victimAbsenceClueId,
      name: `${vHomeLoc.name} Unattended Shift Notice — ${victimTemplate.name}`,
      category: 'document',
      shortSummary: `Precinct absence slate for ${victimTemplate.name} (${victimTemplate.title}) — ${timelineLabel}.`,
      detailedInspection: `${detail} Signed shift log and unpunched timecard confirm no relief clerk was scheduled to replace ${victimTemplate.name}.`,
      locationFoundId: vHomeLoc.id,
      status: 'undiscovered',
      supports: 'roster',
      relatedCharacterId: victimTemplate.id
    };
    attachClueToProfileSpot(
      vHomeLoc.id,
      ['recordSpot', 'leadSpot', 'discardSpot'],
      victimAbsenceClueId,
      victimAbsencePoiId,
      {
        fallbackLabel: `${vHomeLoc.name} Unattended Post Notice — ${victimTemplate.name}`,
        fallbackDescription: `Unpunched timecard rack and desk slate inside ${vHomeLoc.name} (${vHomeLoc.district}).`,
        descriptionSuffix: `A chalked precinct notice marks ${victimTemplate.name}’s regular shift vacant since ${crimeTime} with no relief clerk.`
      }
    );
    vHomeLoc.absenceNotices = [
      ...(vHomeLoc.absenceNotices || []),
      {
        characterId: victimTemplate.id,
        characterName: victimTemplate.name,
        characterTitle: victimTemplate.title,
        reasonLabel,
        timelineLabel,
        detail,
        clueId: victimAbsenceClueId,
        poiId: victimAbsencePoiId
      }
    ];
    if (!murderNightRosterNotes[vHomeLoc.id]) murderNightRosterNotes[vHomeLoc.id] = [];
    murderNightRosterNotes[vHomeLoc.id].push(
      `${victimTemplate.name} (${victimTemplate.title}) failed to finish shift (${timelineLabel})`
    );
  }

  for (const { char, plotLocationId, invPreferredOffsets, mnPreferredOffsets, shiftPlan } of coreScheduleConfigs) {
    const homeLocId = char.assignedLocationId && locations[char.assignedLocationId] ? char.assignedLocationId : null;
    const homeLoc = homeLocId ? locations[homeLocId] : null;
    const plotLoc = locations[plotLocationId];

    if (homeLoc) {
      const shiftHrs = char.shiftHours || homeLoc.openingHours;
      const baseMnShift = getOperatingWindowOnDay(shiftHrs, 0);
      const hasOtherHomeStaff = assignedStaffInstances.some((st) => st.currentLocationId === homeLoc.id);
      if (shiftPlan.rosterNote) {
        if (!murderNightRosterNotes[homeLoc.id]) murderNightRosterNotes[homeLoc.id] = [];
        murderNightRosterNotes[homeLoc.id].push(shiftPlan.rosterNote);
      }

      if (shiftPlan.shiftAction === 'early_sign_out' || shiftPlan.shiftAction === 'evening_off') {
        const timelineLabel =
          shiftPlan.shiftAction === 'early_sign_out'
            ? `Clocked out early at ${shiftPlan.clockOutStr} last night`
            : `Off duty during last night's shift (${formatMinutesHHMM(baseMnShift.start)}–${formatMinutesHHMM(baseMnShift.end)})`;
        const notice: WorkplaceAbsenceNotice = {
          characterId: char.id,
          characterName: char.name,
          characterTitle: char.title,
          reasonLabel:
            shiftPlan.shiftAction === 'early_sign_out'
              ? 'Early Murder-Night Sign-Out'
              : 'Unfilled Murder-Night Shift',
          timelineLabel,
          detail: `${char.name} (${char.title}) left their regular station ${
            shiftPlan.shiftAction === 'early_sign_out'
              ? `early at ${shiftPlan.clockOutStr}`
              : 'unoccupied last night'
          }; ${hasOtherHomeStaff ? 'house coworkers minded the floor' : 'no substitute clerk covered the post'}.`,
          clueId: `clue_roster_${homeLoc.id}`,
          poiId: `poi_roster_${homeLoc.id}`
        };
        homeLoc.absenceNotices = [...(homeLoc.absenceNotices || []), notice];
      }

      let mnAvoidWindow: { start: number; end: number } | null = null;
      if (shiftPlan.shiftAction === 'early_sign_out' && shiftPlan.adjustedEndMinutes && shiftPlan.adjustedEndMinutes > baseMnShift.start) {
        const trimmedMnShift = { start: baseMnShift.start, end: shiftPlan.adjustedEndMinutes };
        mnAvoidWindow = trimmedMnShift;
        addScheduleWindow({
          id: `sched_${char.id}_mn_shift`,
          characterId: char.id,
          locationId: homeLoc.id,
          timelinePhase: 'murder_night',
          kind: 'shift',
          startMinutes: trimmedMnShift.start,
          endMinutes: trimmedMnShift.end,
          startStr: formatMinutesHHMM(trimmedMnShift.start),
          endStr: formatMinutesHHMM(trimmedMnShift.end),
          purpose: `${char.title} shift at ${homeLoc.name} (signed out early at ${shiftPlan.clockOutStr})`
        });
      } else if (shiftPlan.shiftAction !== 'evening_off') {
        mnAvoidWindow = baseMnShift;
        addScheduleWindow({
          id: `sched_${char.id}_mn_shift`,
          characterId: char.id,
          locationId: homeLoc.id,
          timelinePhase: 'murder_night',
          kind: 'shift',
          startMinutes: baseMnShift.start,
          endMinutes: baseMnShift.end,
          startStr: formatMinutesHHMM(baseMnShift.start),
          endStr: formatMinutesHHMM(baseMnShift.end),
          purpose: `${char.title} shift at ${homeLoc.name}`
        });
      }

      const invShift = getOperatingWindowOnDay(shiftHrs, INVESTIGATION_DAY_BASE);
      addScheduleWindow({
        id: `sched_${char.id}_inv_shift`,
        characterId: char.id,
        locationId: homeLoc.id,
        timelinePhase: 'investigation_day',
        kind: 'shift',
        startMinutes: invShift.start,
        endMinutes: invShift.end,
        startStr: formatMinutesHHMM(invShift.start),
        endStr: formatMinutesHHMM(invShift.end),
        purpose: `${char.title} shift at ${homeLoc.name}`
      });

      if (plotLoc && plotLoc.id !== homeLoc.id) {
        const invVisit = buildTimedVisitWindow(
          char.id,
          plotLoc.id,
          INVESTIGATION_DAY_BASE,
          'investigation_day',
          invPreferredOffsets,
          70,
          `Brief visit to ${plotLoc.name}`,
          invShift,
          `visit_${plotLoc.id}`
        );
        if (invVisit) {
          addScheduleWindow(invVisit);
          if (invVisit.startMinutes < invShift.end && invVisit.endMinutes > invShift.start) {
            homeLoc.absenceNotices = [
              ...(homeLoc.absenceNotices || []),
              {
                characterId: char.id,
                characterName: char.name,
                characterTitle: char.title,
                reasonLabel: 'Temporary Daytime Absence',
                timelineLabel: `Away from post ${invVisit.startStr}–${invVisit.endStr} today`,
                detail: `${char.name} (${char.title}) stepped out of ${homeLoc.name} from ${invVisit.startStr} to ${invVisit.endStr} today for an errand at ${plotLoc.name}${hasOtherHomeStaff ? ' while coworkers watched the door' : ', leaving a return slate on the empty counter'}.`,
                clueId: `clue_roster_${homeLoc.id}`,
                poiId: `poi_roster_${homeLoc.id}`
              }
            ];
          }
        }

        const mnVisit = buildTimedVisitWindow(
          char.id,
          plotLoc.id,
          0,
          'murder_night',
          mnPreferredOffsets,
          60,
          char.alibiClaim,
          mnAvoidWindow,
          `visit_${plotLoc.id}`
        );
        if (mnVisit) addScheduleWindow(mnVisit);
      }
    } else if (plotLoc) {
      // Unaffiliated characters spend bounded 2-3 hour visits rather than camping 24 hours at a venue
      const invVisit = buildTimedVisitWindow(
        char.id,
        plotLoc.id,
        INVESTIGATION_DAY_BASE,
        'investigation_day',
        invPreferredOffsets,
        150,
        char.reasonPresent,
        null,
        `inv_${plotLoc.id}`
      );
      if (invVisit) addScheduleWindow(invVisit);

      const mnVisit = buildTimedVisitWindow(
        char.id,
        plotLoc.id,
        0,
        'murder_night',
        mnPreferredOffsets,
        105,
        char.alibiClaim,
        null,
        `mn_${plotLoc.id}`
      );
      if (mnVisit) addScheduleWindow(mnVisit);
    }
  }

  // Build discoverable venue roster clues AFTER schedules so every scheduled staff shift & visit appears accurately
  const allScheduledCast: CharacterCaseInstance[] = [
    culpritCaseInstance,
    redHerringInstance,
    secondSuspectInstance,
    corroboratorInstance,
    witnessInstance,
    ...assignedStaffInstances,
    ...familyVisitorInstances
  ];
  for (const loc of Object.values(locations)) {
    if (loc.isPublic === false) continue;
    const entriesAtLoc: { char: CharacterCaseInstance; win: CharacterScheduleWindow }[] = [];
    for (const ch of allScheduledCast) {
      const dayWins = (schedules[ch.id] || []).filter(
        (w) => w.locationId === loc.id && w.timelinePhase === 'investigation_day'
      );
      for (const win of dayWins) {
        entriesAtLoc.push({ char: ch, win });
      }
    }
    if (entriesAtLoc.length === 0) continue;

    entriesAtLoc.sort((a, b) => a.win.startMinutes - b.win.startMinutes);
    const formatBulletList = (items: string[]) =>
      items
        .map((item, idx) => `* ${item}${idx < items.length - 1 ? ';' : '.'}`)
        .join('\n');

    const shiftLines = entriesAtLoc
      .filter((e) => e.win.kind === 'shift')
      .map(
        (e) =>
          `${e.win.startStr}–${e.win.endStr}, ${e.char.name} (${e.char.title}, ${e.char.avatarStyle.collar})`
      );
    const visitLines = entriesAtLoc
      .filter((e) => e.win.kind === 'visit')
      .map(
        (e) =>
          `${e.win.startStr}–${e.win.endStr}, ${e.char.name} (${e.char.familyName ? `${e.char.familyName} family` : e.char.title})`
      );
    const mnNotes = murderNightRosterNotes[loc.id] || [];

    const inspectionSections: string[] = [
      `Venue hours ${loc.openingHours?.open || '08:00'}–${loc.openingHours?.close || '20:00'}.`
    ];
    if (shiftLines.length > 0) {
      inspectionSections.push(`Scheduled staff shifts:\n${formatBulletList(shiftLines)}`);
    }
    if (visitLines.length > 0) {
      inspectionSections.push(`Timed visitor arrivals logged:\n${formatBulletList(visitLines)}`);
    }
    if (mnNotes.length > 0) {
      inspectionSections.push(`Last night's sign-out log:\n${formatBulletList(mnNotes)}`);
    }

    const extraRosterNames = allScheduledCast
      .filter(
        (ch) =>
          (staffLiarSpecs[ch.id] && ch.currentLocationId === loc.id) ||
          familyVisitorLiarSpecs[ch.id]?.visitLocId === loc.id
      )
      .map((ch) => ch.name);
    const uniqueNames = Array.from(new Set([...entriesAtLoc.map((e) => e.char.name), ...extraRosterNames]));
    const rosterClueId = `clue_roster_${loc.id}`;
    clues[rosterClueId] = {
      id: rosterClueId,
      name: `${loc.name} Shift & Visitor Sign-In Sheet`,
      category: 'document',
      shortSummary: `Daily duty & errand log naming ${uniqueNames.join(', ')}.`,
      detailedInspection: inspectionSections.join('\n\n'),
      locationFoundId: loc.id,
      status: 'undiscovered',
      supports: 'roster',
      relatedCharacterId: entriesAtLoc[0]?.char.id
    };
    attachClueToProfileSpot(loc.id, ['recordSpot', 'leadSpot', 'discardSpot'], rosterClueId, `poi_roster_${loc.id}`, {
      fallbackLabel: `${loc.name} Duty & Door Sheet`,
      fallbackDescription: `Countertop reception blotter and wall-mounted key rack at ${loc.name} (${loc.district}).`,
      descriptionSuffix: `An ink-logged attendance book records scheduled shifts and signed visitor stops at ${loc.name}.`
    });
  }

  // STAGE D: Construct Full Timeline with Road Travel Validation & Provenance
  const travelSourceToScene = weaponRelocatedAway
    ? calculateRoadTravelMinutes(MASTER_LOCATIONS, murderWeaponHostLocId, crimeLocationTemplate.id)
    : 0;

  const timeline: TimelineEntry[] = [
    {
      characterId: victimTemplate.id,
      timeSlot: victimMeetStart,
      timeEnd: victimMeetEnd,
      locationId: secondaryLocationId1,
      claimedAction: 'Met with contacts',
      actualAction: `Confronted ${culpritTemplate.name} briefly at ${locations[secondaryLocationId1].name}.`,
      isAlibiFalse: false,
      confidence: 'confirmed',
      provenance: 'itinerary',
      travelMinutesFromPrev: 0
    },
    {
      characterId: victimTemplate.id,
      timeSlot: victimReturnTime,
      timeEnd: crimeTime,
      locationId: crimeLocationTemplate.id,
      claimedAction: 'Returned to scene',
      actualAction: !crimeLocOpenAtCrime
        ? victimWorksAtScene
          ? `Unlocked ${crimeLocationTemplate.name} after closing (${sceneCloseStr}) with a staff key expecting settlement.`
          : `Entered locked ${crimeLocationTemplate.name} after closing (${sceneCloseStr}) via ${culpritTemplate.name}'s staff key expecting settlement.`
        : `Arrived at ${crimeLocationTemplate.name} expecting settlement.`,
      isAlibiFalse: false,
      confidence: 'confirmed',
      provenance: 'itinerary',
      travelMinutesFromPrev: travelHangoutToScene
    },
    {
      characterId: culpritTemplate.id,
      timeSlot: culpritPrepStart,
      timeEnd: cabPickUpTime,
      locationId: !weaponNaturallyAtScene && weaponRelocatedAway ? murderWeaponHostLocId : secondaryLocationId1,
      claimedAction: `Remaining at ${locations[secondaryLocationId1].name}`,
      actualAction:
        !weaponNaturallyAtScene && weaponRelocatedAway
          ? `Obtained ${weapon.name} from ${locations[murderWeaponHostLocId].name} and boarded ${alibiBreakSpec.transportPhrase}.`
          : weaponRelocatedAway
            ? `Left ${locations[secondaryLocationId1].name} via the back exit, planning to carry off and stash the ${weapon.name.toLowerCase()} at ${locations[murderWeaponHostLocId].name}.`
            : `Left ${locations[secondaryLocationId1].name} via the back exit.`,
      isAlibiFalse: false,
      confidence: 'confirmed',
      provenance: !weaponNaturallyAtScene && weaponRelocatedAway ? 'physical_record' : 'itinerary',
      travelMinutesFromPrev: travelSourceToScene
    },
    {
      characterId: culpritTemplate.id,
      timeSlot: cabDropTime,
      timeEnd: addMinutesToTime(crimeTime, 15),
      locationId: crimeLocationTemplate.id,
      claimedAction: `Still seated inside ${locations[secondaryLocationId1].name}`,
      actualAction: weaponRelocatedAway
        ? `Arrived at ${crimeLocationTemplate.name} at ${cabDropTime} (${alibiBreakSpec.timelineAction}), committed murder at ${crimeTime}, and fled with the ${weapon.name.toLowerCase()} toward ${locations[murderWeaponHostLocId].name}.`
        : `Arrived at ${crimeLocationTemplate.name} at ${cabDropTime} (${alibiBreakSpec.timelineAction}), committed murder at ${crimeTime}, and fled via ${crimeExitFeature}.`,
      isAlibiFalse: true,
      confidence: 'confirmed',
      provenance: 'physical_record',
      travelMinutesFromPrev: travelHangoutToScene,
      refutingClueId: alibiBreakId
    },
    {
      characterId: redHerringTemplate.id,
      timeSlot: corrWindow.start,
      timeEnd: corrWindow.end,
      locationId: secondaryLocationId3,
      claimedAction: `Meeting ${corroboratorTemplate.name} at ${locations[secondaryLocationId3].name}`,
      actualAction: `Verified present at ${locations[secondaryLocationId3].name} with ${corroboratorTemplate.name}.`,
      isAlibiFalse: false,
      confidence: 'confirmed',
      provenance: 'witness_sighting',
      travelMinutesFromPrev: 0
    },
    {
      characterId: witnessTemplate.id,
      timeSlot: addMinutesToTime(crimeTime, 5),
      timeEnd: addMinutesToTime(crimeTime, 15),
      locationId: crimeLocationTemplate.id,
      claimedAction: 'Observed fleeing figure outside venue',
      actualAction: `Saw a silhouette in a ${culpritTemplate.avatarStyle.collar} rush from the rear exit toward ${alibiBreakSpec.witnessMention}.`,
      isAlibiFalse: false,
      confidence: 'approximate',
      provenance: 'witness_sighting',
      travelMinutesFromPrev: 0
    }
  ];

  // STAGE F: Voice-Driven Topic Dialogue & Persistent Interview States
  const dialogueMap: Record<string, DialogueTopic[]> = {};
  const interviewStates: Record<string, InterviewState> = {};

  const templateVars: Record<string, string> = {
    victimName: victimTemplate.name,
    culpritName: culpritTemplate.name,
    alibiLocation: locations[secondaryLocationId1].name,
    alibiStartTime,
    alibiEndPhrase,
    culpritShiftNote: culpritShiftPlan.shiftClause,
    corroboratorShiftNote: corroboratorShiftPlan.shiftClause,
    alibiSceneDenial,
    culpritWorkplaceSceneDeny,
    alibiWindowStart,
    cabDropTime,
    alibiBreakEvidence: alibiBreakSpec.evidencePhrase,
    alibiBreakTransport: alibiBreakSpec.transportPhrase,
    fleeTransport: alibiBreakSpec.witnessMention,
    decisiveProofItem: decisiveItem.name.toLowerCase(),
    decisiveProofShort: decisiveItem.shortLabel,
    decisiveProofContext: decisiveItem.recoverySpotDetail,
    redHerringItem: redHerringItem1.name.toLowerCase(),
    redHerringShort: redHerringItem1.shortLabel,
    redHerringInitials,
    redHerringCollar: redHerringTemplate.avatarStyle.collar,
    redHerringFiberDesc,
    redHerringContext: redHerringItem1.recoverySpotDetail,
    settlementTime,
    settlementMethod,
    corrStart: corrWindow.start,
    corrEnd: corrWindow.end,
    crimeLocation: crimeLocationTemplate.name,
    crimeTime,
    exitFeature: crimeExitFeature,
    motiveName: motive.name,
    motiveCategory: motive.category.toLowerCase(),
    culpritMotiveDefenseLine: culpritExcuseSpec.motiveAdmissionLine,
    culpritSecretActionExcuse: culpritExcuseSpec.secretActionExcuse,
    culpritEarlierVisitTime,
    culpritCollar: culpritTemplate.avatarStyle.collar,
    culpritFiberDesc,
    weaponName: weapon.name.toLowerCase(),
    initials: culpritInitials,
    redHerringName: redHerringTemplate.name,
    corroboratorName: corroboratorTemplate.name,
    corroboratorLocation: locations[secondaryLocationId3].name
  };

  const buildFromFrag = (
    topicId: string,
    title: string,
    fallbackPrompt: string,
    fallbackResponse: string,
    char: CharacterTemplate,
    role: CharacterCaseInstance['role'],
    extra: Partial<DialogueTopic> = {}
  ): DialogueTopic => {
    const frag = pickVoiceFragment(dialogueRng, topicId, char.voice, role);
    return {
      id: topicId,
      title,
      prompt: frag ? interpolateFragment(frag.promptTemplate, templateVars) : fallbackPrompt,
      response: frag ? interpolateFragment(frag.responseTemplate, templateVars) : fallbackResponse,
      unlocked: true,
      truthMode: frag?.truthMode || 'truthful',
      followUps: frag?.followUps,
      ...extra
    } as DialogueTopic;
  };

  dialogueMap[culpritTemplate.id] = [
    {
      id: 'topic_victim',
      title: `Relationship with ${victimTemplate.name}`,
      prompt: dynamicTie.victimTopicPrompt,
      response: dynamicTie.victimTopicResponse,
      unlocked: true,
      truthMode: 'deceptive'
    },
    {
      ...buildFromFrag(
        culpritWorksAtScene ? 'topic_crime_scene_workplace' : 'topic_crime_scene',
        culpritWorksAtScene ? `Hours at ${crimeLocationTemplate.name} last night` : `Visits to ${crimeLocationTemplate.name}`,
        culpritWorksAtScene
          ? `We know ${crimeLocationTemplate.name} is your regular workplace—did you return or stay inside around ${crimeTime} last night?`
          : `Did you set foot inside ${crimeLocationTemplate.name} over the past few days, or anywhere near it last night?`,
        culpritWorksAtScene
          ? culpritWorkplaceSceneDeny
          : `Not last night, I didn't. Oh, I walked past ${crimeLocationTemplate.name} once or twice earlier in the week in broad daylight—but I wasn't inside that place last night.`,
        culpritTemplate,
        'culprit',
        { unlocked: false, requiresFactId: 'heard_culprit_alibi' }
      ),
      id: 'topic_crime_scene'
    },
    buildFromFrag(
      'topic_motive',
      `Inquire about ${motive.name}`,
      `We found paperwork linking you to ${motive.name}. Care to explain?`,
      culpritExcuseSpec.motiveAdmissionLine,
      culpritTemplate,
      'culprit',
      { unlocked: false, requiresAnyClueIds: [motiveClueId, motiveHook2Id] }
    ),
    buildFromFrag(
      'topic_confront_alibi',
      alibiBreakSpec.topicTitle,
      `We have a ${alibiBreakSpec.evidencePhrase} logging a passenger matching you arriving at ${crimeLocationTemplate.name} at ${cabDropTime}!`,
      `(Winces, caught in a lie) ...All right, I shouldn't have claimed I stayed at ${locations[secondaryLocationId1].name} all night! I slipped over to ${crimeLocationTemplate.name} around ${cabDropTime} via ${alibiBreakSpec.transportPhrase} trying to ${culpritExcuseSpec.secretActionExcuse}, panicked when news of the killing broke, and cleared out before ${crimeTime}—I swear I never touched ${victimTemplate.name}!`,
      culpritTemplate,
      'culprit',
      {
        unlocked: false,
        requiresClueId: alibiBreakId,
        requiresAllFactIds: ['heard_culprit_alibi'],
        unlocksFactId: 'alibi_confronted',
        unlocksTopicIds: ['topic_confession_trap'],
        revealsContradiction: true
      }
    ),
    buildFromFrag(
      'topic_confession_trap',
      `Press on ${decisiveItem.name}`,
      `Explain how a ${decisiveItem.name.toLowerCase()} with initials "${culpritInitials}" and ${culpritFiberDesc} turned up ${decisiveItem.recoverySpotDetail}!`,
      `(Swallows hard as you hold up the ${decisiveItem.shortLabel}) ...Yes, "${culpritInitials}" is mine, and those ${culpritFiberDesc} match my coat! I slipped into ${crimeLocationTemplate.name} earlier around ${culpritEarlierVisitTime} trying to ${culpritExcuseSpec.secretActionExcuse} over ${motive.name}, dropped it there in the rush, and cleared out before ${crimeTime}. Having a bitter grievance with ${victimTemplate.name} isn't murder, detective!`,
      culpritTemplate,
      'culprit',
      {
        unlocked: false,
        requiresClueId: decisiveProofId,
        requiresAllFactIds: ['heard_culprit_alibi', 'alibi_confronted'],
        revealsContradiction: true
      }
    )
  ];

  const buildExtraLiarTopics = (char: CharacterCaseInstance): DialogueTopic[] => {
    const spec = extraLiarSpecs[char.id];
    if (!spec) return [];
    const traceLocName = locations[spec.traceLocId]?.name || crimeLocationTemplate.name;
    return [
      {
        id: `topic_${char.id}_motive`,
        title: `Dispute over ${spec.motive.name}`,
        prompt: `We found ${clues[spec.motiveClueId]?.name || 'paperwork'} linking you and ${victimTemplate.name} to ${spec.motive.name}—did that push you to act?`,
        response: spec.motiveAdmissionLine,
        unlocked: false,
        requiresAnyClueIds: [spec.motiveClueId],
        unlocksFactId: `liar_motive_discussed_${char.id}`,
        truthMode: 'truthful'
      },
      {
        id: `topic_${char.id}_trace`,
        title: `Ask about ${spec.traceItemShort} ("${spec.initials}")`,
        prompt: `We recovered a ${spec.traceItemShort} marked "${spec.initials}" with ${spec.fiberDesc} at ${traceLocName}. How did it end up there?`,
        response: spec.traceExcuse,
        unlocked: false,
        requiresClueId: spec.traceClueId,
        requiresAllFactIds: [`heard_${char.id}_whereabouts`],
        unlocksFactId: `liar_trace_explained_${char.id}`,
        truthMode: 'truthful'
      }
    ];
  };

  // Red herring suspect (withholds earlier settlement explanation & never gives away culprit for free)
  const redHerringAwayFromHome = Boolean(redHerringHomeLoc && redHerringHomeLoc.id !== secondaryLocationId3);
  const rhExtraSpec = extraLiarSpecs[redHerringInstance.id];
  dialogueMap[redHerringTemplate.id] = [
    {
      id: `topic_${redHerringTemplate.id}_victim`,
      title: `Opinion of ${victimTemplate.name}`,
      prompt: `How well did you know ${victimTemplate.name}?`,
      response: `We crossed paths in business circles now and then—nothing more than anyone else in New Bay. (${redHerringTemplate.dialogueVoice.verbalHabits}) Unless you have hard paperwork or physical proof tied to me, detective, I'm not discussing private accounts.`,
      unlocked: true,
      truthMode: 'truthful'
    },
    {
      id: `topic_${redHerringTemplate.id}_alibi`,
      title: `Evening meeting with ${corroboratorTemplate.name}`,
      prompt: `You named ${corroboratorTemplate.name} at ${locations[secondaryLocationId3].name}—can anyone back up your exact hours there?`,
      response: redHerringAwayFromHome
        ? `${redHerringShiftPlan.shiftClause}I wasn't at ${redHerringHomeLoc!.name} around ${crimeTime} last night—I was over at ${locations[secondaryLocationId3].name} from ${corrWindow.start} onward with ${corroboratorTemplate.name}. Ask them yourself or check the signed counter voucher.`
        : `Yes—I was right here at ${locations[secondaryLocationId3].name} from ${corrWindow.start} onward last night with ${corroboratorTemplate.name}. Ask them yourself or check the signed counter voucher.`,
      unlocked: false,
      requiresFactId: `heard_${redHerringTemplate.id}_whereabouts`,
      truthMode: 'truthful'
    },
    buildFromFrag(
      'topic_suspect_rumors',
      `Tension in ${victimTemplate.name}’s circle`,
      `Did you notice anyone else having trouble with ${victimTemplate.name} recently?`,
      `New Bay’s full of quiet grudges after dark, detective, and I don't trade names just to buy favor. Check the time-stamped ledgers if you want hard leads.`,
      redHerringTemplate,
      'suspect'
    ),
    buildFromFrag(
      'topic_suspect_weapon_check',
      `Ask about the ${weapon.name.toLowerCase()}`,
      `Do you handle or recognize anything like a ${weapon.name.toLowerCase()}?`,
      `Never touched one last night. Check the storeroom ledgers and stockists where items like that are signed out.`,
      redHerringTemplate,
      'suspect',
      {
        unlocked: false,
        relatedWeaponId: weapon.id,
        requiresAnyClueIds: !weaponRelocatedAway
          ? [`clue_loc_weapon_${murderWeaponHostLocId}`]
          : [`clue_loc_weapon_${murderWeaponHostLocId}`, weaponTransferClueId]
      }
    ),
    buildFromFrag(
      'topic_dispute_note',
      `Ask about the ${redHerringItem1.name}`,
      `Explain this ${redHerringItem1.name.toLowerCase()} bearing "${redHerringInitials}" recovered at ${crimeLocationTemplate.name}.`,
      redHerringInstance.isLying
        ? `(Winces, caught in a lie) ...All right, I shouldn't have claimed I stayed clear of ${crimeLocationTemplate.name}! That ${redHerringItem1.shortLabel} is mine—I stopped there earlier at ${settlementTime} trying to ${rhExtraSpec ? rhExtraSpec.secretActionExcuse : `settle an overdue balance via ${settlementMethod}`}${rhExtraSpec ? ` tied to ${rhExtraSpec.motive.name}` : ''}, and cleared out before dusk! Ask ${corroboratorTemplate.name} at ${locations[secondaryLocationId3].name}—we were together from ${corrWindow.start} to ${corrWindow.end} last night!`
        : `All right—that ${redHerringItem1.shortLabel} is mine. I met ${victimTemplate.name} there yesterday at ${settlementTime} to settle an overdue balance via ${settlementMethod}, and left in a rush before dusk! Ask ${corroboratorTemplate.name} at ${locations[secondaryLocationId3].name}—we were together from ${corrWindow.start} to ${corrWindow.end} last night!`,
      redHerringTemplate,
      'suspect',
      {
        unlocked: false,
        requiresClueId: redHerringClueId,
        requiresAllFactIds: [`heard_${redHerringTemplate.id}_whereabouts`],
        unlocksFactId: 'red_herring_explained',
        revealsContradiction: redHerringInstance.isLying,
        truthMode: redHerringInstance.isLying ? 'confession' : undefined
      }
    ),
    ...buildExtraLiarTopics(redHerringInstance)
  ];

  // Second innocent suspect (withholds daytime errand item + secret visit when lying)
  const ssExtraSpec = extraLiarSpecs[secondSuspectInstance.id];
  dialogueMap[secondSuspectTemplate.id] = [
    {
      id: `topic_${secondSuspectTemplate.id}_victim`,
      title: `Opinion of ${victimTemplate.name}`,
      prompt: `What did you make of ${victimTemplate.name}?`,
      response: `Trouble follows folks who play both sides. I stayed clear of ${victimTemplate.name} last night—don't try pulling me into street rumors without evidence.`,
      unlocked: true,
      truthMode: 'truthful'
    },
    {
      id: `topic_${secondSuspectTemplate.id}_alibi`,
      title: `Why mention ${secondSuspectSecretLoc.name}?`,
      prompt: `Why bring up ${secondSuspectSecretLoc.name} when I asked for your evening whereabouts around ${crimeTime}?`,
      response: secondSuspectInstance.isLying
        ? secondSuspectHasSeparateHome
          ? `Because I know how precinct talk runs after dark! I worked my regular hours at ${secondSuspectHomeLoc!.name} and kept out of the rain afterward—nobody saw me anywhere near ${secondSuspectSecretLoc.name}.`
          : `Because I know how street rumors spread! I kept indoors away from the rain and nowhere near ${secondSuspectSecretLoc.name}. Check your own beat logs if you don't believe me.`
        : `Just keeping my evening errands straight, detective—I stepped briefly into ${secondSuspectSecretLoc.name} on private business and kept well clear of ${crimeLocationTemplate.name}.`,
      unlocked: false,
      requiresAnyFactIds: [`heard_${secondSuspectTemplate.id}_whereabouts`],
      truthMode: secondSuspectInstance.isLying ? 'deceptive' : 'truthful'
    },
    buildFromFrag(
      'topic_suspect_rumors',
      `Other visitors & neighborhood talk`,
      `Did you notice anyone else having trouble with ${victimTemplate.name} recently?`,
      `I mind my own business, detective, and folks who value their reputation don't gossip without hard paper in front of them.`,
      secondSuspectTemplate,
      'suspect'
    ),
    buildFromFrag(
      'topic_suspect_weapon_check',
      `Access to ${weapon.name.toLowerCase()}`,
      `Do you handle or recognize anything like a ${weapon.name.toLowerCase()}?`,
      `Not my line of work, detective. Ask the staff who keep track of stockroom chits and sign-out slips.`,
      secondSuspectTemplate,
      'suspect',
      {
        unlocked: false,
        relatedWeaponId: weapon.id,
        requiresAnyClueIds: !weaponRelocatedAway
          ? [`clue_loc_weapon_${murderWeaponHostLocId}`]
          : [`clue_loc_weapon_${murderWeaponHostLocId}`, weaponTransferClueId]
      }
    ),
    {
      id: 'topic_second_suspect_scene_item',
      title: `Ask about the ${redHerringItem2.name}`,
      prompt: `We found a ${redHerringItem2.name.toLowerCase()} marked "${secondSuspectInitials}" at ${crimeLocationTemplate.name}. How did it get there?`,
      response: `Yes, that ${redHerringItem2.shortLabel} belongs to me—I stopped by ${crimeLocationTemplate.name} on a quick daytime errand around ${secondSuspectErrandTime} yesterday afternoon and must have dropped it then! That was hours before anyone was killed at ${crimeTime}, detective.`,
      unlocked: false,
      truthMode: 'truthful',
      requiresClueId: redHerring2ClueId,
      requiresAllFactIds: [`heard_${secondSuspectTemplate.id}_whereabouts`],
      unlocksFactId: 'red_herring_2_explained'
    },
    {
      id: 'topic_confront_secret_visit',
      title: `Confront with Proof from ${secondSuspectSecretLoc.name}`,
      prompt: `Explain this signed evening slip placing you inside ${secondSuspectSecretLoc.name} last night!`,
      response: secondSuspectInstance.isLying && ssExtraSpec
        ? `(Lowers voice, glancing uneasily toward the door) ...Keep my name out of the society columns, detective! I slipped into ${secondSuspectSecretLoc.name} around ${secretVisitStart} trying to ${ssExtraSpec.secretActionExcuse} over ${ssExtraSpec.motive.name}—that's why I panicked and lied! Since you already caught me: while stepping out the side door near ${cabDropTime}, I saw ${culpritTemplate.name} in a ${culpritTemplate.avatarStyle.collar} muttering furiously over ${motive.category.toLowerCase()} with ${victimTemplate.name} and heading straight toward ${crimeLocationTemplate.name}!`
        : `(Lowers voice, glancing uneasily toward the door) ...Keep my name out of the society columns, detective! All right—I slipped into ${secondSuspectSecretLoc.name} around ${secretVisitStart} on the quiet last night, and I didn't want that pinned to my chest. Since you already caught me: while stepping out the side door near ${cabDropTime}, I saw ${culpritTemplate.name} in a ${culpritTemplate.avatarStyle.collar} muttering furiously over ${motive.category.toLowerCase()} with ${victimTemplate.name} and heading straight toward ${crimeLocationTemplate.name}!`,
      unlocked: false,
      truthMode: secondSuspectInstance.isLying ? 'confession' : 'truthful',
      requiresClueId: secondSuspectClueId,
      unlocksFactId: 'second_suspect_confessed_visit',
      revealsContradiction: secondSuspectInstance.isLying
    },
    ...buildExtraLiarTopics(secondSuspectInstance)
  ];

  // Witness (follow-up observations stay locked until witness confirms passing near scene in Whereabouts / Alibi)
  const wExtraSpec = extraLiarSpecs[witnessInstance.id];
  const witnessHearsayTarget = gossipTargetPool.find((ch) => ch.id !== witnessInstance.id) || gossipTarget1;
  const witnessHearsayTime = extraLiarSpecs[witnessHearsayTarget.id]?.nearTime || gossipTime1;
  dialogueMap[witnessTemplate.id] = [
    ...(witnessInstance.isLying
      ? [
          {
            id: 'topic_confront_witness_presence',
            title: `Confront with Precinct Bystander Card`,
            prompt: `This beat patrol card places you right outside ${crimeLocationTemplate.name} around ${crimeTime} last night—why claim you stayed blocks away?`,
            response: wExtraSpec
              ? `(Lowers gaze, swallowing nervously) ...Please keep my name clean on the blotter, detective! I really was outside ${crimeLocationTemplate.name} at ${crimeTime} trying to ${wExtraSpec.secretActionExcuse} over ${wExtraSpec.motive.name}, and lied so I wouldn't be blamed for the murder—go ahead and ask what I saw fleeing into the rain.`
              : `(Lowers gaze, swallowing nervously) ...Please keep my name away from the mob boys, detective! Yes, I was right outside ${crimeLocationTemplate.name} at ${crimeTime} and lied because I didn't want retaliation—go ahead and ask what I saw fleeing into the rain.`,
            unlocked: false,
            requiresClueId: witnessClueId,
            requiresAllFactIds: [`heard_${witnessTemplate.id}_whereabouts`],
            unlocksFactId: 'witness_presence_admitted',
            revealsContradiction: true,
            truthMode: 'confession' as const
          }
        ]
      : []),
    {
      id: `topic_${witnessTemplate.id}_hearsay`,
      title: `Overheard rumors near ${crimeLocationTemplate.name}`,
      prompt: `Did you hear any street gossip about someone else being seen around ${crimeLocationTemplate.name} last night?`,
      response: `Word up and down the block this morning is a night newsboy swore he saw ${witnessHearsayTarget.name} (wearing that ${witnessHearsayTarget.avatarStyle.collar}) right outside ${crimeLocationTemplate.name} near ${witnessHearsayTime}—folks say there was bad blood brewing with ${victimTemplate.name}.`,
      unlocked: true,
      truthMode: 'truthful'
    },
    {
      id: `topic_${witnessTemplate.id}_sighting`,
      title: `Observations around ${crimeTime}`,
      prompt: `Since you were passing ${crimeLocationTemplate.name} around ${crimeTime}, did you notice anyone leaving?`,
      response: `Hard rain blurs everything, detective, so give or take five minutes around ${addMinutesToTime(
        crimeTime,
        10
      )}, I saw someone sprint out the back toward ${alibiBreakSpec.witnessMention}. Couldn't swear to their face, only a distinct ${culpritTemplate.avatarStyle.collar}.`,
      unlocked: false,
      requiresFactId: `heard_${witnessTemplate.id}_whereabouts`,
      truthMode: 'mistaken',
      unlocksFactId: 'heard_witness_sighting'
    },
    buildFromFrag(
      'topic_witness_details',
      `First sound heard outside ${crimeLocationTemplate.name}`,
      `What caught your eye first when you saw that figure bolt outside ${crimeLocationTemplate.name}?`,
      `A sharp latch snapping and hurried footsteps pounding toward the curb. Whoever it was wore a distinct ${culpritTemplate.avatarStyle.collar} and vanished toward ${alibiBreakSpec.witnessMention}.`,
      witnessTemplate,
      'witness',
      { unlocked: false, requiresFactId: 'heard_witness_sighting' }
    ),
    {
      id: `topic_${witnessTemplate.id}_victim`,
      title: `Victim’s demeanor earlier`,
      prompt: witnessIsPatrolBeat
        ? `While patrolling near ${crimeLocationTemplate.name} earlier in the evening, did ${victimTemplate.name} seem rattled?`
        : `You mentioned passing ${crimeLocationTemplate.name} earlier too—did ${victimTemplate.name} seem rattled?`,
      response: `Pacing like a caged lion, muttering about settling ${motive.name.toLowerCase()} once and for all.`,
      unlocked: false,
      requiresFactId: `heard_${witnessTemplate.id}_whereabouts`,
      truthMode: 'truthful'
    },
    ...buildExtraLiarTopics(witnessInstance)
  ];

  // Corroborator (only ask about confirming redHerring / dispute / venue once whereabouts or corroborating record reveals them)
  const corroboratorAwayFromMeet = Boolean(corroboratorHomeLoc && corroboratorHomeLoc.id !== secondaryLocationId3);
  const corrExtraSpec = extraLiarSpecs[corroboratorInstance.id];
  const corrHearsayTarget = gossipTargetPool.find((ch) => ch.id !== corroboratorInstance.id) || gossipTarget2;
  const corrHearsayTime = extraLiarSpecs[corrHearsayTarget.id]?.nearTime || gossipTime2;
  dialogueMap[corroboratorTemplate.id] = [
    buildFromFrag(
      'topic_corroborate_alibi',
      `Confirm ${redHerringTemplate.name}’s evening whereabouts`,
      `Did you spend the evening with ${redHerringTemplate.name}?`,
      corroboratorInstance.isLying
        ? `(Sighs, cornered by the signed voucher) ...Fine, I lied because I didn't want police digging into my ${corrExtraSpec ? `${corrExtraSpec.motive.name.toLowerCase()} trouble—I was trying to ${corrExtraSpec.secretActionExcuse}` : 'debt ledgers'}! I really WAS over at ${locations[secondaryLocationId3].name} with ${redHerringTemplate.name} from ${corrWindow.start} past ${corrWindow.end} last night! Earlier at ${settlementTime}, ${victimTemplate.name} settled their balance via ${settlementMethod}.`
        : corroboratorAwayFromMeet
          ? `${corroboratorShiftPlan.shiftClause}I wasn't at ${corroboratorHomeLoc!.name} around ${crimeTime} last night—I met ${redHerringTemplate.name} over at ${locations[secondaryLocationId3].name} from ${corrWindow.start} past ${corrWindow.end}. Earlier at ${settlementTime}, ${victimTemplate.name} settled their balance via ${settlementMethod}.`
          : `Yes, we were together right here at ${locations[secondaryLocationId3].name} from ${corrWindow.start} past ${corrWindow.end} last night. And I saw ${victimTemplate.name} settle their balance with ${redHerringTemplate.name} via ${settlementMethod} at ${settlementTime}.`,
      corroboratorTemplate,
      'corroborator',
      {
        unlocked: false,
        requiresAnyFactIds: [`heard_${corroboratorTemplate.id}_whereabouts`, `heard_${redHerringTemplate.id}_whereabouts`],
        requiresAnyClueIds: [corroboratorClueId],
        unlocksFactId: 'red_herring_corroborated',
        revealsContradiction: corroboratorInstance.isLying,
        truthMode: corroboratorInstance.isLying ? 'confession' : undefined
      }
    ),
    {
      id: 'topic_corroborator_gossip',
      title: `Overheard talk about ${crimeLocationTemplate.name}`,
      prompt: `Have any acquaintances told you who they heard was near ${crimeLocationTemplate.name} around ${crimeTime}?`,
      response: `A bartender friend told me he heard a late cabbie saw ${corrHearsayTarget.name} lurking outside ${crimeLocationTemplate.name} around ${corrHearsayTime}—though you know how parlor rumors exaggerate things.`,
      unlocked: true,
      truthMode: 'truthful'
    },
    buildFromFrag(
      'topic_corroborator_relation',
      `History between ${redHerringTemplate.name} and ${victimTemplate.name}`,
      `What was the nature of the dispute between ${redHerringTemplate.name} and ${victimTemplate.name}?`,
      `An overdue private balance on paper—settled in full via ${settlementMethod} at ${settlementTime}.`,
      corroboratorTemplate,
      'corroborator',
      {
        unlocked: false,
        requiresAnyFactIds: ['red_herring_corroborated', 'red_herring_explained']
      }
    ),
    buildFromFrag(
      'topic_corroborator_venue',
      `Evening activity at ${locations[secondaryLocationId3].name}`,
      `Was ${locations[secondaryLocationId3].name} busy while you two were there?`,
      `Normal evening crowd during open hours; check the signed voucher on the desk at ${locations[secondaryLocationId3].name} if you want time verification.`,
      corroboratorTemplate,
      'corroborator',
      {
        unlocked: false,
        requiresAnyFactIds: [`heard_${corroboratorTemplate.id}_whereabouts`, 'red_herring_corroborated'],
        requiresAnyClueIds: [corroboratorClueId]
      }
    ),
    ...buildExtraLiarTopics(corroboratorInstance)
  ];

  // Dedicated Public Location Staff Dialogue (accents exact personal shift vs venue hours, off-duty responses, & liar confrontation when selected)
  assignedStaffInstances.forEach((staff, staffIdx) => {
    const loc = locations[staff.currentLocationId];
    const staffHours = staff.shiftHours || loc.openingHours;
    const staffHoursStr = `${staffHours?.open || '08:00'}–${staffHours?.close || '20:00'}`;
    const coworkers = assignedStaffInstances
      .filter((other) => other.currentLocationId === loc.id && other.id !== staff.id)
      .map((other) => `${other.name} (${other.title}, ${other.shiftHours ? `${other.shiftHours.open}–${other.shiftHours.close}` : 'full hours'})`);
    const nightDutyCoworkers = assignedStaffInstances
      .filter(
        (other) =>
          other.currentLocationId === loc.id &&
          other.id !== staff.id &&
          isCharacterPresentAt(schedules, other.id, loc.id, crimeTimeMinutes, loc.openingHours, 'murder_night')
      )
      .map((other) => `${other.name} (${other.title})`);
    const localVisitors = familyVisitorInstances
      .filter((fv) => fv.routine.some((r) => r.locationId === loc.id))
      .map((fv) => {
        const entry = fv.routine.find((r) => r.locationId === loc.id)!;
        return `${fv.name} (${entry.timeWindow})`;
      });
    const hoursStr = `${loc.openingHours?.open || '08:00'}–${loc.openingHours?.close || '20:00'}`;
    const locWeapon = assignedWeaponByLocation[loc.id] || weapon;
    const locWeaponClueId = `clue_loc_weapon_${loc.id}`;
    const staffWeaponUnlockIds =
      weaponRelocatedAway && loc.id === murderWeaponHostLocId
        ? [locWeaponClueId, weaponTransferClueId]
        : [locWeaponClueId];
    const onDutyAtCrimeTime = isCharacterPresentAt(
      schedules,
      staff.id,
      loc.id,
      crimeTimeMinutes,
      loc.openingHours,
      'murder_night'
    );
    const locOpenAtCrimeTime = isLocationOpenAt(loc.openingHours, crimeTimeMinutes);
    const liarSpec = staffLiarSpecs[staff.id];
    const staffGossipCandidates = gossipTargetPool.filter((ch) => ch.id !== staff.id);
    const staffGossipTarget =
      staffGossipCandidates.length > 0
        ? staffGossipCandidates[staffIdx % staffGossipCandidates.length]
        : gossipTarget1;
    const staffGossipTime = extraLiarSpecs[staffGossipTarget.id]?.nearTime || gossipTime1;
    const staffHearsayReply =
      staffIdx % 2 === 0
        ? `Patrons have been trading gossip all morning, detective—a delivery driver told me he heard someone saw ${staffGossipTarget.name} near ${crimeLocationTemplate.name} around ${staffGossipTime} in a ${staffGossipTarget.avatarStyle.collar}. Check our daily door sign-in ledger and counter spots here at ${loc.name} too.`
        : `Word at the counter is a regular heard someone spotted ${staffGossipTarget.name} arguing outside ${crimeLocationTemplate.name} before ${crimeTime}. Take street talk with a grain of salt, though—check the physical spots here at ${loc.name} and the door sign-in book for hard timestamps.`;

    dialogueMap[staff.id] = [
      {
        id: `topic_${staff.id}_hours`,
        title: `Operating hours & duty roster`,
        prompt: `What are your hours here at ${loc.name}, and who else works this floor?`,
        response: `${loc.name} keeps hours ${hoursStr}, and my own shift runs ${staffHoursStr}. ${
          coworkers.length > 0
            ? `The other shift staff assigned here are ${coworkers.join(', ')}. `
            : `I mind the counter myself through my full shift. `
        }${
          localVisitors.length > 0
            ? `Neighborhood regulars dropping in briefly include ${localVisitors.join(', ')}.`
            : `Quiet overall, though foot traffic picks up toward dusk.`
        }`,
        unlocked: true,
        truthMode: 'truthful'
      },
      {
        id: `topic_${staff.id}_sightings`,
        title: `Last night around ${crimeTime}`,
        prompt: `Were you on duty at ${loc.name} around ${crimeTime} last night, and did you notice anyone hurried or out of place?`,
        response: liarSpec
          ? liarSpec.sightingLieResponse
          : onDutyAtCrimeTime
            ? `We were open and I was right on duty at ${loc.name} at ${crimeTime}. Plenty of coat collars coming and going in the rain—if somebody slipped out early, check our cab call notes or counter logs.`
            : !locOpenAtCrimeTime
              ? loc.id === crimeLocationTemplate.id
                ? `I wasn't at ${loc.name} at ${crimeTime}, detective—we locked the doors sharp at ${loc.openingHours?.close || staffHours?.close || 'closing'} and I headed straight home. With the deadbolts intact, only someone holding a staff key could have unlocked the building after hours.`
                : `I wasn't at ${loc.name} at ${crimeTime}, detective—we locked the doors sharp at ${loc.openingHours?.close || staffHours?.close || 'closing'} and I headed straight home. Nobody was inside after closing bell.`
              : `I wasn't at ${loc.name} around ${crimeTime} last night, detective—my shift runs ${staffHoursStr}, so I clocked out at ${staffHours?.close || '18:00'} well before then. ${
                  nightDutyCoworkers.length > 0
                    ? `You'll have to ask ${nightDutyCoworkers.join(', ')}, who took over the night floor during those hours.`
                    : `Whoever covered the evening watch after I knocked off would be the one to ask.`
                }`,
        unlocked: true,
        truthMode: liarSpec ? 'deceptive' : 'truthful'
      },
      {
        id: `topic_${staff.id}_weapon_check`,
        title: `Inventory check: ${locWeapon.name.toLowerCase()}`,
        prompt: `I noticed a ${locWeapon.name.toLowerCase()} kept here at ${loc.name}—does it belong to your stock, and has anyone disturbed it?`,
        response:
          weaponRelocatedAway && loc.id === murderWeaponHostLocId
            ? `Yes, that ${locWeapon.name.toLowerCase()} belongs in our ${loc.name} stockroom—check our storeroom sign-out slip to see who handled or stashed it last night.`
            : `Yes, detective—a ${locWeapon.name.toLowerCase()} is standard gear kept right here at ${loc.name}. As far as our staff knows, it stays right where it belongs.`,
        unlocked: false,
        relatedWeaponId: locWeapon.id,
        requiresAnyClueIds: staffWeaponUnlockIds,
        truthMode: 'truthful'
      },
      {
        id: `topic_${staff.id}_regulars`,
        title: `Street gossip & items left behind`,
        prompt: `Heard any street gossip about who was seen near ${crimeLocationTemplate.name}, or seen odd items left behind today?`,
        response: staffHearsayReply,
        unlocked: true,
        truthMode: 'truthful'
      },
      ...(liarSpec
        ? [
            {
              id: `topic_${staff.id}_confront_lie`,
              title: `Confront with ${loc.name} Sign-In Sheet`,
              prompt: `This ${loc.name} shift & sign-out log records you still signing the counter log around ${crimeTime}—why claim you left straight for home?`,
              response: liarSpec.admissionResponse,
              unlocked: false,
              requiresClueId: `clue_roster_${loc.id}`,
              requiresAllFactIds: [`heard_${staff.id}_whereabouts`],
              unlocksFactId: `perjury_exposed_${staff.id}`,
              revealsContradiction: true,
              truthMode: 'confession' as const
            }
          ]
        : []),
      ...buildExtraLiarTopics(staff)
    ];
  });

  // Occasional Family Visitor Dialogue (explicitly states off-site/home if not present at crimeTime, or lies when selected as extra liar)
  familyVisitorInstances.forEach((fv, fvIdx) => {
    const stops = fv.routine
      .map((r) => {
        const locName = locations[r.locationId]?.name || MASTER_LOCATIONS.find((m) => m.id === r.locationId)?.name || r.locationId;
        return `${locName} (${r.timeWindow}: ${r.visitReason})`;
      })
      .join('; ');
    const relNames = fv.relationships
      .map((r) => MASTER_CHARACTERS.find((c) => c.id === r.characterId)?.name)
      .filter(Boolean)
      .join(', ');
    const currentVenueName = locations[fv.currentLocationId]?.name || 'this street';
    const mnWindows = (schedules[fv.id] || []).filter((w) => w.timelinePhase === 'murder_night');
    const activeMnWindow = mnWindows.find(
      (w) =>
        crimeTimeMinutes >= w.startMinutes &&
        crimeTimeMinutes < w.endMinutes &&
        isLocationOpenAt(locations[w.locationId]?.openingHours, crimeTimeMinutes)
    );
    const mnSummary = mnWindows
      .map((w) => `${locations[w.locationId]?.name || w.locationId} (${w.startStr}–${w.endStr})`)
      .join(', ');

    const fvLiarSpec = familyVisitorLiarSpecs[fv.id];
    const fvGossipCandidates = gossipTargetPool.filter((ch) => ch.id !== fv.id);
    const fvGossipTarget =
      fvGossipCandidates.length > 0
        ? fvGossipCandidates[fvIdx % fvGossipCandidates.length]
        : gossipTarget2;
    const fvGossipTime = extraLiarSpecs[fvGossipTarget.id]?.nearTime || gossipTime2;
    const mnAnswer = fvLiarSpec
      ? `I wasn't at ${currentVenueName} around ${crimeTime}, detective—I stayed indoors with the ${fv.familyName} family all evening last night and didn't go anywhere after dark.`
      : activeMnWindow && activeMnWindow.locationId === fv.currentLocationId
        ? `I happened to be running an errand right here at ${currentVenueName} (${activeMnWindow.startStr}–${activeMnWindow.endStr}) around ${crimeTime}. Folks were hurrying out of the rain—check with the counter staff too, they watch the door all shift.`
        : activeMnWindow
          ? `I wasn't at ${currentVenueName} around ${crimeTime}, detective—at that hour I was across town at ${locations[activeMnWindow.locationId]?.name || activeMnWindow.locationId} (${activeMnWindow.startStr}–${activeMnWindow.endStr}). I couldn't tell you who came or went here then.`
          : `I wasn't at ${currentVenueName}—or out on the street at all—around ${crimeTime} last night, detective. ${
              mnSummary
                ? `My brief errands wrapped up earlier (${mnSummary}), and I was home indoors after that.`
                : 'I stayed indoors for the evening.'
            } Ask the staff who held the late shift.`;

    dialogueMap[fv.id] = [
      {
        id: `topic_${fv.id}_route`,
        title: `Errands & visiting schedule`,
        prompt: `What brings you to ${currentVenueName} today?`,
        response: `Just my usual ${fv.familyName} family rounds—short stops only. My schedule runs through ${stops}.${
          relNames ? ` Ask ${relNames} in our family if you need to double-check the hour.` : ''
        }`,
        unlocked: true,
        truthMode: 'truthful'
      },
      {
        id: `topic_${fv.id}_murder_night`,
        title: `Activity last night around ${crimeTime}`,
        prompt: `Were you near ${currentVenueName} around ${crimeTime} last night, or notice anything unusual?`,
        response: mnAnswer,
        unlocked: true,
        truthMode: fvLiarSpec ? 'deceptive' : 'truthful'
      },
      {
        id: `topic_${fv.id}_hearsay`,
        title: `Neighborhood gossip & overheard sightings`,
        prompt: `Heard any street talk around ${locations[fv.currentLocationId]?.district || 'the district'} about who was seen near ${crimeLocationTemplate.name}?`,
        response: `Neighbors down the block were whispering all morning that someone saw ${fvGossipTarget.name} near ${crimeLocationTemplate.name} around ${fvGossipTime} wearing a ${fvGossipTarget.avatarStyle.collar}—though parlor gossip flies fast, so verify it against the ${currentVenueName} sign-in book.`,
        unlocked: true,
        truthMode: 'truthful'
      },
      ...(fvLiarSpec
        ? [
            {
              id: `topic_${fv.id}_confront_lie`,
              title: `Confront with ${fvLiarSpec.visitLocName} Sign-In Sheet`,
              prompt: `This ${fvLiarSpec.visitLocName} visitor log shows you signing in last night (${fvLiarSpec.loggedTimeStr})—why tell me you stayed indoors with the ${fv.familyName} family?`,
              response: fvLiarSpec.admissionResponse,
              unlocked: false,
              requiresClueId: `clue_roster_${fvLiarSpec.visitLocId}`,
              requiresAllFactIds: [`heard_${fv.id}_whereabouts`],
              unlocksFactId: `perjury_exposed_${fv.id}`,
              revealsContradiction: true,
              truthMode: 'confession' as const
            }
          ]
        : []),
      ...buildExtraLiarTopics(fv)
    ];
  });

  const allLiving = [culpritCaseInstance, ...suspects, ...witnesses];
  for (const ch of allLiving) {
    const chTopics = dialogueMap[ch.id] || [];
    interviewStates[ch.id] = {
      characterId: ch.id,
      topicsUnlocked: chTopics.filter((t) => t.unlocked).map((t) => t.id),
      statementsHeard: [],
      evidencePresented: [],
      trustState: ch.role === 'culprit' ? -1 : ch.role === 'witness' || ch.role === 'corroborator' ? 1 : 0,
      pressureState: 0,
      revealedFacts: [],
      followUpsAvailable: []
    };
  }

  const sceneAccessPhrase = !crimeLocOpenAtCrime
    ? culpritWorksAtScene
      ? `let themselves into closed ${crimeLocationTemplate.name} using a staff key and slipped out the ${crimeExitFeature}`
      : `met inside closed ${crimeLocationTemplate.name} (opened after hours with ${victimTemplate.name}'s staff key) and slipped out the ${crimeExitFeature}`
    : `forced the ${crimeExitFeature}`;

  const hiddenSolution: CaseHiddenSolution = {
    culpritId: culpritTemplate.id,
    weaponId: weapon.id,
    motiveId: motive.id,
    crimeLocationId: crimeLocationTemplate.id,
    crimeTime,
    decisiveProofClueId: decisiveProofId,
    alibiBreakClueId: alibiBreakId,
    weaponRelocated: weaponRelocatedAway,
    weaponHostLocationId: murderWeaponHostLocId,
    truthSummary: weaponRelocatedAway
      ? `${culpritTemplate.name} murdered ${victimTemplate.name} at ${crimeLocationTemplate.name} around ${crimeTime} using a ${weapon.name}, then stashed the weapon at ${locations[murderWeaponHostLocId].name}. Driven by ${motive.name}, ${culpritTemplate.name} slipped out of ${locations[secondaryLocationId1].name} via ${alibiBreakSpec.transportPhrase}, ${sceneAccessPhrase}, and left behind a ${decisiveItem.shortLabel} and ${culpritFiberDesc}.`
      : `${culpritTemplate.name} murdered ${victimTemplate.name} at ${crimeLocationTemplate.name} around ${crimeTime} using a ${weapon.name}. Driven by ${motive.name}, ${culpritTemplate.name} slipped out of ${locations[secondaryLocationId1].name} via ${alibiBreakSpec.transportPhrase}, ${sceneAccessPhrase}, and left behind a ${decisiveItem.shortLabel} and ${culpritFiberDesc}.`,
    stepByStepChronology: [
      {
        time: victimMeetStart,
        event: `${victimTemplate.name} and ${culpritTemplate.name} clashed fiercely over ${motive.name}.`
      },
      {
        time: !weaponNaturallyAtScene && weaponRelocatedAway ? weaponTransferTime : cabPickUpTime,
        event: !weaponNaturallyAtScene && weaponRelocatedAway
          ? `${culpritTemplate.name} acquired the ${weapon.name} at ${locations[murderWeaponHostLocId].name}.`
          : `${culpritTemplate.name} slipped out the rear exit of ${locations[secondaryLocationId1].name}.`
      },
      {
        time: cabDropTime,
        event: `${alibiBreakSpec.timelineAction} discharged ${culpritTemplate.name} outside ${crimeLocationTemplate.name}.`
      },
      {
        time: crimeTime,
        event: `Fatal confrontation: ${culpritTemplate.name} struck down ${victimTemplate.name} with ${weapon.name}.`
      },
      {
        time: addMinutesToTime(crimeTime, 10),
        event: weaponRelocatedAway
          ? `${culpritTemplate.name} fled via the ${crimeExitFeature}—leaving a ${decisiveItem.shortLabel} and ${culpritFiberDesc} ${decisiveItem.recoverySpotDetail}—and stashed the ${weapon.name.toLowerCase()} at ${locations[murderWeaponHostLocId].name}.`
          : `${culpritTemplate.name} fled via the ${crimeExitFeature}, leaving behind a ${decisiveItem.shortLabel} and ${culpritFiberDesc} ${decisiveItem.recoverySpotDetail}.`
      }
    ]
  };

  const caseNumber = seedString;
  const victimNameParts = victimTemplate.name.trim().split(/\s+/);
  const victimSurname = victimNameParts[victimNameParts.length - 1] || victimTemplate.name;
  const crimeHourFloor = Math.floor(crimeTimeMinutes / 60);
  const crimeHourLabel = crimeHourFloor >= 22 ? 'Ten O’Clock' : 'Nine O’Clock';
  const cleanSceneName = crimeLocationTemplate.name.replace(/^The\s+/i, '');
  const cleanDistrict = crimeLocationTemplate.district.replace(/^The\s+/i, '');
  const weaponCategoryTitles: Record<MethodTemplate['category'], string[]> = {
    'Blunt Force': [
      `A Heavy Hand at ${crimeLocationTemplate.name}`,
      `The Silent Blow in ${crimeLocationTemplate.district}`,
      `Shattered Glass in ${crimeLocationTemplate.district}`
    ],
    'Edged Weapon': [
      `Cold Steel at ${crimeLocationTemplate.name}`,
      `The Blade on the ${cleanDistrict} Beat`,
      `A Sharp Farewell at ${crimeLocationTemplate.name}`
    ],
    Firearm: [
      `Gunsmoke Over ${crimeLocationTemplate.district}`,
      `A Shot in the Rain at ${crimeLocationTemplate.name}`,
      `Powder Burns in ${crimeLocationTemplate.district}`
    ],
    Poison: [
      `A Bitter Draught at ${crimeLocationTemplate.name}`,
      `The Last Toast in ${crimeLocationTemplate.district}`,
      `Dark Dosage at ${crimeLocationTemplate.name}`
    ],
    Strangulation: [
      `No Cry from ${crimeLocationTemplate.name}`,
      `Silent Hands in ${crimeLocationTemplate.district}`,
      `The Choked Call at ${crimeLocationTemplate.name}`
    ]
  };
  const caseTitles = [
    `The Shadow Over ${crimeLocationTemplate.name}`,
    `Death in ${crimeLocationTemplate.district}`,
    `The Bloodstained Ledger of ${crimeLocationTemplate.district}`,
    `Rain on ${crimeLocationTemplate.district}`,
    `Ashes at ${crimeLocationTemplate.name}`,
    `Murder on the ${cleanDistrict} Beat`,
    `Last Call at ${crimeLocationTemplate.name}`,
    `Behind Locked Doors at ${crimeLocationTemplate.name}`,
    `Fog Over ${crimeLocationTemplate.district}`,
    `The ${cleanSceneName} Affair`,
    `Darkness Along ${crimeLocationTemplate.district}`,
    `The ${victimSurname} Homicide`,
    `An Appointment with ${victimSurname}`,
    `Who Silenced ${victimTemplate.name}?`,
    `The ${crimeTime} Dispatch`,
    `The ${crimeHourLabel} Murder at ${crimeLocationTemplate.name}`,
    `Dead Before Midnight in ${crimeLocationTemplate.district}`,
    `No Alibi After ${crimeHourLabel}`,
    `No Alibi in ${crimeLocationTemplate.district}`,
    `The ${cleanDistrict} Indictment`,
    `Last Train Through ${crimeLocationTemplate.district}`,
    `Frosted Glass at ${crimeLocationTemplate.name}`,
    `Crossfire Over ${victimSurname}’s Affairs`,
    ...(weaponCategoryTitles[weapon.category] || [])
  ];
  const caseTitle = solutionRng.pick(caseTitles);
  const deterministicDate = parseDeterministicDate(seedString, solutionRng);

  const dispatchMemo = `TELETYPE DISPATCH // NEW BAY POLICE DEPT // IMMEDIATE ATTENTION
CASE NUMBER / SEED: ${caseNumber}
TO: ${AGENCY_FULL_NAME.toUpperCase()}
FROM: INSPECTOR J. FLANAGAN, HOMICIDE SQUAD

Body of ${victimTemplate.name} discovered at ${crimeLocationTemplate.name} (${crimeLocationTemplate.district}). Estimated time of demise: between ${String(crimeHourFloor).padStart(2, '0')}:00 and ${String(crimeHourFloor + 1).padStart(2, '0')}:00 hours. Signs of foul play evident. Coroner indicates trauma consistent with ${weapon.category.toLowerCase()}.${!crimeLocOpenAtCrime ? ` Venue locked after ${sceneCloseStr} closing with no forced entry; staff keyholder access suspected.` : ''}

Unusual hostility reported surrounding the victim's recent affairs. Suspects are tightening up. Unpick their alibis before the morning edition hits the newsstands.

PROCEED TO CRIME SCENE IMMEDIATELY.`;

  const autopsyReport = `CORONER’S POST-MORTEM REPORT // PRELIMINARY FINDINGS
VICTIM: ${victimTemplate.name} (${victimTemplate.publicPersona})
LOCATION OF RECOVERY: ${crimeLocationTemplate.name}
CAUSE OF DEATH: ${weapon.evidenceSignature}
ESTIMATED TIME OF OCCURRENCE: Approximately ${crimeTime} hrs.
DEFENSIVE WOUNDS: Present on hands; signs of struggle.
NOTE: Traces of foreign material recovered from lapels and window frame. Evidence submitted to precinct locker.`;

  const candidateCase: CaseInstance = {
    caseId: `case_${seedHash.toString(16)}`,
    seed: seedString,
    seedNumber: seedHash,
    rulesetVersion: RULESET_VERSION,
    difficulty,
    caseTitle,
    caseNumber,
    dateStr: deterministicDate,
    victim: victimCaseInstance,
    culprit: culpritCaseInstance,
    suspects,
    witnesses,
    candidateWeapons,
    candidateMotives,
    motive,
    weapon,
    crimeSceneLocationId: crimeLocationTemplate.id,
    crimeTime,
    investigationStartMinutes: DEFAULT_INVESTIGATION_START_MINUTES,
    schedules,
    dispatchMemo,
    autopsyReport,
    locations,
    clues,
    timeline,
    dialogueMap,
    interviewStates,
    discoveryGraph,
    validationReport: { passed: true, attempts: attemptNonce + 1, checks: [] },
    hiddenSolution
  };

  candidateCase.validationReport = validateCaseInstance(candidateCase, attemptNonce + 1);
  return candidateCase;
}

/**
 * Section 5: Programmatic Case Validation Gates
 */
export function validateCaseInstance(c: CaseInstance, attempts = 1): ValidationReport {
  const checks: ValidationCheckResult[] = [];

  const sceneLoc = MASTER_LOCATIONS.find((l) => l.id === c.crimeSceneLocationId)!;
  const crimeAbsMinutes = parseHHMM(c.crimeTime);
  const crimeSceneOpenOrKeyholder =
    isLocationOpenAt(sceneLoc.openingHours, crimeAbsMinutes) ||
    c.victim.assignedLocationId === sceneLoc.id ||
    c.culprit.assignedLocationId === sceneLoc.id;

  // 1. Solution coherence (distinct victim/culprit, culprit doesn't avoid weapon, scene open or staff keyholder involved)
  const solutionValid =
    c.victim.id !== c.culprit.id &&
    !c.culprit.avoidedMethods.includes(c.weapon.id) &&
    crimeSceneOpenOrKeyholder;
  checks.push({
    id: 'solution_coherence',
    label: 'Coherent motive, capability, access, and opportunity',
    passed: solutionValid,
    detail: solutionValid ? 'Victim, culprit, motive, and weapon satisfy eligibility.' : 'Incompatible pairing.'
  });

  // 2. Weapon plausibility & explained movement
  const naturalAtScene = isWeaponNaturallyAvailableAt(c.weapon, sceneLoc);
  const weaponHostLocId = Object.keys(c.locations).find(
    (id) => c.clues[`clue_loc_weapon_${id}`]?.relatedWeaponId === c.weapon.id
  );
  const weaponAtScene = weaponHostLocId === c.crimeSceneLocationId;
  const transferExplained = weaponAtScene
    ? naturalAtScene
    : c.weapon.portability !== 'Cumbersome' &&
      Boolean(weaponHostLocId) &&
      Boolean(c.clues['clue_weapon_transfer']);
  checks.push({
    id: 'weapon_provenance',
    label: 'Weapon plausible at source and any movement explained',
    passed: transferExplained,
    detail: weaponAtScene
      ? 'Weapon naturally available and recovered at crime scene.'
      : 'Portable weapon relocated to another reachable venue with documented stash/transfer slip.'
  });

  // 3. No double-booking & travel times fit timeline
  const culpritEntries = c.timeline.filter((e) => e.characterId === c.culprit.id);
  const noOverlap = culpritEntries.every((entry, idx) => {
    if (idx === 0) return true;
    const prevEnd = culpritEntries[idx - 1].timeEnd || culpritEntries[idx - 1].timeSlot;
    return entry.timeSlot >= prevEnd;
  });
  checks.push({
    id: 'timeline_consistency',
    label: 'Events fit travel times and no person occupies two places at once',
    passed: noOverlap,
    detail: noOverlap ? 'All timeline intervals and road transits are non-overlapping.' : 'Timeline overlap detected.'
  });

  // 4. All living characters are placed at selected reachable locations
  const allLiving = [c.culprit, ...c.suspects, ...c.witnesses];
  const allPlacedInSelected = allLiving.every((ch) => Boolean(c.locations[ch.currentLocationId]));
  checks.push({
    id: 'cast_placement',
    label: 'Required people present at selected city locations',
    passed: allPlacedInSelected,
    detail: allPlacedInSelected ? 'All cast members occupy active case locations.' : 'Missing location for cast member.'
  });

  // 5. Reachability: Every selected location either starts discovered or has an obtainable discovery lead
  const reachable = new Set<string>(
    Object.values(c.locations)
      .filter((l) => l.discovered)
      .map((l) => l.id)
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of c.discoveryGraph) {
      if (reachable.has(edge.fromLocationId) && !reachable.has(edge.toLocationId)) {
        reachable.add(edge.toLocationId);
        changed = true;
      }
    }
  }
  const allReachable = Object.keys(c.locations).every((locId) => reachable.has(locId));
  checks.push({
    id: 'location_reachability',
    label: 'Every required location has an obtainable discovery lead',
    passed: allReachable,
    detail: allReachable
      ? `All ${Object.keys(c.locations).length} selected locations reachable from start.`
      : 'Unreachable location detected.'
  });

  // 6. Fair evidence path for all 4 indictment pillars
  const hasWeaponClue = Boolean(c.clues['clue_murder_weapon'] && reachable.has(c.clues['clue_murder_weapon'].locationFoundId));
  const hasMotiveClue = Boolean(c.clues['clue_motive_document'] && reachable.has(c.clues['clue_motive_document'].locationFoundId));
  const hasAlibiBreak = Boolean(c.clues['clue_alibi_break'] && reachable.has(c.clues['clue_alibi_break'].locationFoundId));
  const hasDecisiveProof = Boolean(c.clues['clue_decisive_proof'] && reachable.has(c.clues['clue_decisive_proof'].locationFoundId));
  const fairEvidence = hasWeaponClue && hasMotiveClue && hasAlibiBreak && hasDecisiveProof;
  checks.push({
    id: 'evidence_path',
    label: 'Every essential deduction has an obtainable evidence path',
    passed: fairEvidence,
    detail: fairEvidence ? 'Weapon, motive, alibi break, and decisive proof are all reachable.' : 'Missing evidence path.'
  });

  // 7. Red herrings & lies have discoverable explanations
  const redHerringExplained =
    Boolean(c.clues['clue_red_herring']) &&
    Boolean(c.clues['clue_red_herring_2']) &&
    c.witnesses.some((w) => w.role === 'corroborator');
  checks.push({
    id: 'misdirection_fairness',
    label: 'Red herrings and lies have discoverable explanations',
    passed: redHerringExplained,
    detail: 'Red herring artifacts have corroborator testimony, settlement records, and daytime errand explanations.'
  });

  // 8. Alternative theories can be tested on the Murder Board
  const alternativeTheoriesExist =
    c.suspects.length >= 2 && c.candidateWeapons.length >= 20 && c.candidateMotives.length >= 10;
  checks.push({
    id: 'alternative_theories',
    label: 'Alternative theories can be tested and eliminated by evidence',
    passed: alternativeTheoriesExist,
    detail: `${c.suspects.length + 1} suspects, ${c.candidateWeapons.length} weapons, ${c.candidateMotives.length} motives available.`
  });

  // 9. Every selected public location has assigned staff or a documented absence notice, realistic shifts, night staff work night-only, & primary home venues respected
  const publicLocs = Object.values(c.locations).filter((l) => l.isPublic !== false);
  const allPublicHaveStaff = publicLocs.every(
    (loc) =>
      allLiving.some((ch) => ch.role === 'staff' && ch.currentLocationId === loc.id) ||
      allLiving.some(
        (ch) =>
          ch.isPrimaryCast &&
          ch.assignedLocationId === loc.id &&
          (c.schedules[ch.id] || []).some((w) => w.locationId === loc.id && w.kind === 'shift')
      ) ||
      (loc.absenceNotices?.length ?? 0) > 0
  );
  const visitorWindowsValid = allLiving
    .filter((ch) => ch.characterKind === 'family_visitor' && !ch.isPrimaryCast)
    .every((fv) => {
      const wins = c.schedules[fv.id] || [];
      return wins.length > 0 && wins.every((w) => w.kind === 'visit' && w.endMinutes - w.startMinutes <= 90);
    });
  const noMarathonShifts = Object.values(c.schedules).every((wins) =>
    wins.every((w) => w.endMinutes - w.startMinutes < 18 * 60)
  );
  const nightStaffOnlyAtNight = allLiving
    .filter((ch) => ch.role === 'staff' && /\bnight\b/i.test(ch.title))
    .every((ns) => {
      const invWins = (c.schedules[ns.id] || []).filter((w) => w.timelinePhase === 'investigation_day');
      const midday = INVESTIGATION_DAY_BASE + 12 * 60;
      return (
        invWins.length > 0 &&
        invWins.every((w) => w.startMinutes % 1440 >= 16 * 60 && !(midday >= w.startMinutes && midday < w.endMinutes))
      );
    });
  const coreHomeShiftsRespected = [
    c.culprit,
    ...c.suspects,
    ...c.witnesses.filter((w) => Boolean(w.isPrimaryCast))
  ].every((ch) => {
    if (!ch.assignedLocationId || !c.locations[ch.assignedLocationId]) return true;
    const invWins = (c.schedules[ch.id] || []).filter((w) => w.timelinePhase === 'investigation_day');
    const hasHomeShift = invWins.some((w) => w.locationId === ch.assignedLocationId && w.kind === 'shift');
    const otherVisitsBounded = invWins
      .filter((w) => w.locationId !== ch.assignedLocationId)
      .every((w) => w.kind === 'visit' && w.endMinutes - w.startMinutes <= 120);
    return hasHomeShift && otherVisitsBounded;
  });
  const scheduleGatePassed =
    allPublicHaveStaff &&
    visitorWindowsValid &&
    noMarathonShifts &&
    nightStaffOnlyAtNight &&
    coreHomeShiftsRespected;
  checks.push({
    id: 'public_staffing_and_schedules',
    label: 'All public locations staffed or accounted for with realistic day/night shifts and bounded visits',
    passed: scheduleGatePassed,
    detail: scheduleGatePassed
      ? `${publicLocs.length} public locations staffed or covered by absence notices with realistic shifts and short visits.`
      : 'Detected unrealistic 24h shift, off-hours night staff, or missing proprietor shift/absence notice.'
  });

  // 10. Complete discoverable clue coverage for every selected location, weapon, motive, victim, and living person
  const attachedClueIds = new Set<string>();
  for (const loc of Object.values(c.locations)) {
    for (const poi of loc.pointsOfInterest) {
      if (poi.clueRewardId && c.clues[poi.clueRewardId]) {
        attachedClueIds.add(poi.clueRewardId);
      }
    }
  }
  const allLocationsHaveCluePOI = Object.values(c.locations).every(
    (loc) => reachable.has(loc.id) && loc.pointsOfInterest.some((p) => Boolean(p.clueRewardId && c.clues[p.clueRewardId]))
  );
  const allLivingHaveClue = allLiving.every((ch) =>
    Object.values(c.clues).some(
      (clue) =>
        attachedClueIds.has(clue.id) &&
        reachable.has(clue.locationFoundId) &&
        (clue.relatedCharacterId === ch.id ||
          clue.detailedInspection.includes(ch.name) ||
          clue.shortSummary.includes(ch.name))
    )
  );
  const activeLocationIds = Object.keys(c.locations);
  const locWeaponIds: string[] = [];
  const weaponToLocsMap: Record<string, Set<string>> = {};
  for (const clue of Object.values(c.clues)) {
    if (clue.relatedWeaponId) {
      if (!weaponToLocsMap[clue.relatedWeaponId]) weaponToLocsMap[clue.relatedWeaponId] = new Set();
      weaponToLocsMap[clue.relatedWeaponId].add(clue.locationFoundId);
    }
  }
  const allLocationsHaveUniqueNaturalWeapon =
    activeLocationIds.every((locId) => {
      const loc = c.locations[locId];
      const wc = c.clues[`clue_loc_weapon_${locId}`];
      const wId = wc?.relatedWeaponId;
      if (!wc || !wId || !attachedClueIds.has(wc.id)) return false;
      const wTpl = MASTER_WEAPONS.find((w) => w.id === wId);
      if (!wTpl || !isWeaponNaturallyAvailableAt(wTpl, loc)) return false;
      locWeaponIds.push(wId);
      return true;
    }) &&
    new Set(locWeaponIds).size === activeLocationIds.length &&
    locWeaponIds.includes(c.weapon.id) &&
    Object.values(weaponToLocsMap).every((locsSet) => locsSet.size <= 1);

  const weaponCluesAttached =
    attachedClueIds.has('clue_murder_weapon') &&
    (attachedClueIds.has('clue_weapon_transfer') || attachedClueIds.has('clue_weapon_provenance'));
  const motiveCluesAttached =
    attachedClueIds.has('clue_motive_document') && attachedClueIds.has('clue_motive_hook_2');
  const completeCoverage =
    allLocationsHaveCluePOI &&
    allLivingHaveClue &&
    weaponCluesAttached &&
    motiveCluesAttached &&
    allLocationsHaveUniqueNaturalWeapon;

  checks.push({
    id: 'complete_clue_coverage',
    label: 'Clues cover every active location, unique natural weapon, character, and motive',
    passed: completeCoverage,
    detail: completeCoverage
      ? `All ${activeLocationIds.length} locations (each with 1 unique natural weapon) and ${allLiving.length} cast members covered.`
      : 'Missing discoverable clue reference or duplicate/non-natural location weapon detected.'
  });

  // 11. Difficulty liar count within tier range and every liar is deterministically exposable
  const expectedExtraRange: Record<Difficulty, [number, number]> = {
    easy: [0, 1],
    medium: [1, 3],
    hard: [2, 4]
  };
  const [minExtra, maxExtra] = expectedExtraRange[c.difficulty] || [0, 1];
  const extraLiars = allLiving.filter((ch) => ch.isLying && ch.id !== c.culprit.id);
  const liarCountValid =
    c.culprit.isLying &&
    extraLiars.length >= minExtra &&
    extraLiars.length <= maxExtra;
  const allLiarsExposable = allLiving
    .filter((ch) => ch.isLying)
    .every((ch) => {
      const chTopics = c.dialogueMap[ch.id] || [];
      return chTopics.some((t) => {
        if (!t.revealsContradiction) return false;
        const clueIds: string[] = [];
        if (t.requiresClueId) clueIds.push(t.requiresClueId);
        if (t.requiresAnyClueIds) clueIds.push(...t.requiresAnyClueIds);
        return clueIds.some(
          (id) => c.clues[id] && attachedClueIds.has(id) && reachable.has(c.clues[id].locationFoundId)
        );
      });
    });
  checks.push({
    id: 'difficulty_liars_valid',
    label: 'All lying cast members within difficulty range have reachable contradiction clues',
    passed: liarCountValid && allLiarsExposable,
    detail:
      liarCountValid && allLiarsExposable
        ? `Difficulty ${c.difficulty}: ${1 + extraLiars.length} liars (1 culprit + ${extraLiars.length} extra), all exposable.`
        : `Invalid liar count (${extraLiars.length} extra for ${c.difficulty}) or unexposable liar.`
  });

  return {
    passed: checks.every((chk) => chk.passed),
    attempts,
    checks
  };
}

export function generateCaseFromSeed(
  seedInput: string | number,
  difficulty: Difficulty = 'easy'
): CaseInstance {
  const seedString = String(seedInput).trim();
  const maxAttempts = 8;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = buildValidatedCaseAttempt(seedString, attempt, difficulty);
    if (candidate.validationReport.passed || attempt === maxAttempts - 1) {
      return candidate;
    }
  }
  return buildValidatedCaseAttempt(seedString, 0, difficulty);
}

/**
 * Generates the daily mystery case seed based on the current calendar date
 */
export function getDailySeedString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `DAILY-${y}-${m}-${d}`;
}
