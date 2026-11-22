/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateCaseFromSeed, getDailySeedString } from './caseGenerator';
import { getLinkedClueIdsForTopic, getLinkedTopicIdsForClue } from './interrogationSync';
import {
  getCharacterInterviewStatus,
  getLocationMapStatus,
  getUnlockedTopicIdsForCharacter
} from './mapStatus';
import {
  buildBoardStringEdges,
  filterBoardEdgesForMode,
  getDiscoveredBoardPeople,
  getDiscoveredBoardWeapons,
  getEffectiveHiddenNodeKeys,
  getRelevantBoardClues,
  isClueCharacterLinkVisible
} from './boardGraph';
import {
  AGENCY_FULL_NAME,
  AGENCY_NAME,
  MASTER_CHARACTERS,
  MASTER_LOCATIONS,
  MASTER_MOTIVES,
  MASTER_WEAPONS
} from './templates';
import {
  AMBIENT_POI_CLUES,
  MOTIVE_HOOK_CLUES,
  WEAPON_CLUES,
  calculateRoadTravelMinutes,
  describeAttireFibers,
  findShortestRoadPath,
  getCharacterClueHook,
  getDirectRoadMinutes,
  getLocationLeadHook
} from './fragments';
import { LOCATION_SCENE_PROFILES } from './locationClueProfiles';
import { LOCATION_EVIDENCE_ITEMS } from './locationEvidenceItems';
import {
  DEFAULT_INVESTIGATION_START_MINUTES,
  formatInvestigationClock,
  getNextOpeningTotalMinutes,
  isCharacterPresentAt,
  isLocationOpenAt
} from './timeUtils';
import { getLocationBackground, LOCATION_BACKGROUNDS } from '../utils/locationImages';
import { CHARACTER_MUGSHOTS, getCharacterMugshot } from '../utils/characterImages';
import { getWeaponImage, WEAPON_IMAGES } from '../utils/weaponImages';

function runSeededEngineTests() {
  console.log('Running Seeded Detective Engine verification suite...');

  assert.ok(MASTER_WEAPONS.length >= 20, `Expected >=20 MASTER_WEAPONS, got ${MASTER_WEAPONS.length}`);
  assert.ok(MASTER_MOTIVES.length >= 10, `Expected >=10 MASTER_MOTIVES, got ${MASTER_MOTIVES.length}`);
  assert.ok(MASTER_LOCATIONS.length >= 50, `Expected >=50 MASTER_LOCATIONS, got ${MASTER_LOCATIONS.length}`);
  assert.ok(MASTER_CHARACTERS.length >= 100, `Expected >=100 MASTER_CHARACTERS, got ${MASTER_CHARACTERS.length}`);

  // Verify every location has an explicit, existing, strictly unique background asset mapping
  const locationBgsSeen = new Set<string>();
  for (const loc of MASTER_LOCATIONS) {
    assert.ok(LOCATION_BACKGROUNDS[loc.id], `Missing explicit LOCATION_BACKGROUNDS entry for ${loc.id}`);
    const bg = getLocationBackground(loc.id, loc.locationTags);
    assert.ok(bg && bg.startsWith('/src/assets/images/loc_'), `Invalid background path for ${loc.id}: ${bg}`);
    assert.ok(fs.existsSync(path.join('.', bg)), `Missing background asset file on disk for ${loc.id}: ${bg}`);
    assert.ok(
      !locationBgsSeen.has(bg),
      `Location ${loc.id} (${loc.name}) shares background ${bg} with another location`
    );
    locationBgsSeen.add(bg);
  }

  // Verify every character has a valid mugshot mapping, asset on disk,
  // and strictly unique 1-to-1 mugshot across every person in the game
  const mugshotsSeen = new Set<string>();
  for (const ch of MASTER_CHARACTERS) {
    assert.ok(CHARACTER_MUGSHOTS[ch.id], `Missing explicit CHARACTER_MUGSHOTS entry for ${ch.id}`);
    const mug = getCharacterMugshot(ch);
    assert.ok(
      mug && mug.startsWith('/src/assets/images/') && (mug.includes('/mug_') || mug.includes('_portrait_')),
      `Invalid portrait path for ${ch.id}: ${mug}`
    );
    assert.ok(fs.existsSync(path.join('.', mug)), `Missing mugshot asset file on disk for ${ch.id}: ${mug}`);
    assert.ok(
      !mugshotsSeen.has(mug),
      `Character ${ch.id} (${ch.name}) shares mugshot ${mug} with another character`
    );
    mugshotsSeen.add(mug);
  }

  // Verify every weapon has a valid forensic image mapping, asset on disk,
  // and strictly unique 1-to-1 image across all 28 weapons in MASTER_WEAPONS
  const weaponImgsSeen = new Set<string>();
  for (const w of MASTER_WEAPONS) {
    assert.ok(WEAPON_IMAGES[w.id], `Missing explicit WEAPON_IMAGES entry for ${w.id}`);
    const wImg = getWeaponImage(w);
    assert.ok(wImg && wImg.startsWith('/src/assets/images/wpn_'), `Invalid weapon image path for ${w.id}: ${wImg}`);
    assert.ok(fs.existsSync(path.join('.', wImg)), `Missing weapon image file on disk for ${w.id}: ${wImg}`);
    assert.ok(
      !weaponImgsSeen.has(wImg),
      `Weapon ${w.id} (${w.name}) shares forensic photo ${wImg} with another weapon`
    );
    weaponImgsSeen.add(wImg);
  }

  // Verify every public location has >= 1 assigned staff character
  const publicLocations = MASTER_LOCATIONS.filter((l) => l.isPublic !== false);
  for (const loc of publicLocations) {
    const staffHere = MASTER_CHARACTERS.filter(
      (c) => c.characterKind === 'staff' && c.assignedLocationId === loc.id
    );
    assert.ok(
      staffHere.length >= 1,
      `Public location ${loc.id} (${loc.name}) must have at least 1 assigned staff character`
    );
  }

  // Verify multi-staff venues (restaurant, nightclub/cabaret, bakery, church)
  const restaurantStaff = MASTER_CHARACTERS.filter((c) => c.assignedLocationId === 'harborview_restaurant');
  assert.ok(restaurantStaff.length >= 2, `Expected multi-staff restaurant, got ${restaurantStaff.length}`);
  const cabaretStaff = MASTER_CHARACTERS.filter((c) => c.assignedLocationId === 'crimson_cabaret');
  assert.ok(cabaretStaff.length >= 3, `Expected multi-staff cabaret, got ${cabaretStaff.length}`);
  const velvetStaff = MASTER_CHARACTERS.filter((c) => c.assignedLocationId === 'velvet_lounge');
  assert.ok(velvetStaff.length >= 2, `Expected multi-staff nightclub, got ${velvetStaff.length}`);
  const churchStaff = MASTER_CHARACTERS.filter((c) => c.assignedLocationId === 'trinity_baptist');
  assert.ok(churchStaff.length >= 2, `Expected multi-staff church, got ${churchStaff.length}`);

  // Verify agency branding matches frosted office door ('Hudson Detective Agency') with no lingering NPCs
  const agency = MASTER_LOCATIONS.find((l) => l.id === 'agency')!;
  assert.equal(agency.name, AGENCY_FULL_NAME, 'Agency location name must match AGENCY_FULL_NAME');
  assert.equal(AGENCY_NAME, 'Hudson Detective Agency');
  assert.ok(!agency.name.toLowerCase().includes('blackbird'), 'Stale agency name should not remain');
  assert.equal(agency.isPublic, false, 'Detective agency must remain non-public');
  assert.equal(
    MASTER_CHARACTERS.filter((c) => c.assignedLocationId === 'agency').length,
    0,
    'Agency must have zero assigned lingering NPCs'
  );

  // Verify complete static clue coverage across all locations, weapons, motives & hooks, and characters
  for (const loc of MASTER_LOCATIONS) {
    const pois = loc.pointsOfInterest || [];
    assert.ok(pois.length >= 1, `Location ${loc.id} must have >=1 authored POI`);
    const cluePois = pois.filter((poi) => poi.clueRewardId);
    assert.ok(cluePois.length >= 1, `Location ${loc.id} must have >=1 POI with a clueRewardId`);
    for (const poi of cluePois) {
      assert.ok(
        AMBIENT_POI_CLUES[poi.clueRewardId!],
        `Location ${loc.id} POI "${poi.label}" must reference a defined AMBIENT_POI_CLUES entry (got ${poi.clueRewardId})`
      );
    }
    const leadHook = getLocationLeadHook(loc);
    assert.ok(leadHook.shortSummary.includes(loc.name), `Location lead hook missing name for ${loc.id}`);
  }
  assert.equal(MASTER_WEAPONS.length, 30, `Expected 30 MASTER_WEAPONS, got ${MASTER_WEAPONS.length}`);
  const weaponIdsSet = new Set(MASTER_WEAPONS.map((w) => w.id));
  for (const w of MASTER_WEAPONS) {
    assert.ok(WEAPON_CLUES[w.id], `Missing WEAPON_CLUES entry for weapon ${w.id}`);
  }
  for (const loc of MASTER_LOCATIONS) {
    for (const wId of loc.naturalWeapons) {
      assert.ok(weaponIdsSet.has(wId), `Location ${loc.id} references orphan naturalWeapon "${wId}"`);
    }
    for (const wId of loc.neverNaturalWeapons) {
      assert.ok(weaponIdsSet.has(wId), `Location ${loc.id} references orphan neverNaturalWeapon "${wId}"`);
    }
    const validNaturals = MASTER_WEAPONS.filter(
      (w) =>
        !w.neverNaturallyAvailableAt.includes(loc.id) &&
        !loc.neverNaturalWeapons.includes(w.id) &&
        (w.usuallyAvailableAt.includes(loc.id) || loc.naturalWeapons.includes(w.id))
    );
    assert.ok(
      validNaturals.length >= 4,
      `Location ${loc.id} (${loc.name}) must have >=4 valid natural weapons, got ${validNaturals.length}`
    );
  }
  for (const m of MASTER_MOTIVES) {
    for (const hook of m.clueHooks) {
      assert.ok(MOTIVE_HOOK_CLUES[hook], `Missing MOTIVE_HOOK_CLUES entry for "${hook}" on motive ${m.id}`);
    }
  }
  for (const ch of MASTER_CHARACTERS) {
    const charHook = getCharacterClueHook(ch);
    assert.ok(charHook.clueTitle.includes(ch.name), `Character clue hook missing name for ${ch.id}`);
    const fiberDesc = describeAttireFibers(ch.avatarStyle.collar);
    assert.ok(
      fiberDesc.startsWith('stray ') &&
        fiberDesc !== 'stray cloth fibers' &&
        !/wrench fibers|briefcase fibers|spectacles fibers|ring of keys fibers|reading chain fibers|lantern fibers|cane fibers|whistle fibers|torch fibers|loupe fibers/i.test(
          fiberDesc
        ),
      `Character ${ch.id} (${ch.avatarStyle.collar}) produced awkward or generic fiber description: "${fiberDesc}"`
    );
  }
  assert.equal(
    Object.keys(LOCATION_SCENE_PROFILES).length,
    MASTER_LOCATIONS.length,
    `LOCATION_SCENE_PROFILES must cover all ${MASTER_LOCATIONS.length} locations`
  );
  for (const loc of MASTER_LOCATIONS) {
    assert.ok(LOCATION_SCENE_PROFILES[loc.id], `Missing LOCATION_SCENE_PROFILES entry for ${loc.id}`);
    const pool = LOCATION_EVIDENCE_ITEMS[loc.id];
    assert.ok(pool && pool.length >= 3, `Location ${loc.id} must have >=3 room evidence items in LOCATION_EVIDENCE_ITEMS`);
    const uniqueNames = new Set(pool.map((item) => item.name));
    assert.equal(uniqueNames.size, pool.length, `Location ${loc.id} has duplicate evidence item names`);
  }

  // Verify normal family members with occasional multi-location visits
  const familyVisitors = MASTER_CHARACTERS.filter((c) => c.characterKind === 'family_visitor');
  assert.ok(familyVisitors.length >= 24, `Expected >=24 family visitors, got ${familyVisitors.length}`);
  for (const fv of familyVisitors) {
    assert.ok(fv.familyName, `Family visitor ${fv.id} missing familyName`);
    assert.ok(fv.routine.length >= 2, `Family visitor ${fv.id} must visit multiple locations`);
    assert.ok(
      fv.routine.every((r) => r.frequency === 'occasional' && (r.durationMinutes || 0) <= 85),
      `Family visitor ${fv.id} must have occasional shorter visits`
    );
  }

  // Verify overnight opening hours helper behavior & Day 1 investigation clock start
  assert.equal(isLocationOpenAt({ open: '18:00', close: '03:00' }, 1440 + 9 * 60), false);
  assert.equal(isLocationOpenAt({ open: '18:00', close: '03:00' }, 1440 + 21 * 60), true);
  assert.equal(isLocationOpenAt({ open: '18:00', close: '03:00' }, 1440 + 1 * 60), true);
  assert.equal(getNextOpeningTotalMinutes({ open: '18:00', close: '03:00' }, 1440 + 9 * 60), 1440 + 18 * 60);
  assert.equal(formatInvestigationClock(DEFAULT_INVESTIGATION_START_MINUTES), 'Day 1 · 09:00');
  assert.equal(formatInvestigationClock(DEFAULT_INVESTIGATION_START_MINUTES + 1440), 'Day 2 · 09:00');

  // 1. Determinism: Same seed produces byte-for-byte identical CaseInstance
  const seedA1 = generateCaseFromSeed('NOIR-1947');
  const seedA2 = generateCaseFromSeed('NOIR-1947');
  assert.equal(
    JSON.stringify(seedA1),
    JSON.stringify(seedA2),
    'Identical seed must produce byte-for-byte identical CaseInstance JSON'
  );

  // 2. Daily seed equivalence (loading daily string via custom case yields identical case)
  const dailySeed = getDailySeedString();
  const daily1 = generateCaseFromSeed(dailySeed);
  const daily2 = generateCaseFromSeed(dailySeed);
  assert.equal(JSON.stringify(daily1), JSON.stringify(daily2), 'Daily seed must replay identically');
  assert.equal(daily1.seed, dailySeed);

  // 3. Variety + 60-seed Stress Validation Gate Check
  const testSeeds = [
    dailySeed,
    'CASE-1001',
    'CASE-4092',
    'COLD-HARBOR',
    'HUDSON-7',
    'VELVET-RAIN',
    'PIER-FOUR',
    'MORTUARY-9',
    ...Array.from({ length: 52 }, (_, i) => `SEED-${100 + i * 37}`)
  ];

  const culpritsSeen = new Set<string>();
  const weaponsSeen = new Set<string>();
  const motivesSeen = new Set<string>();
  const scenesSeen = new Set<string>();
  const titlesSeen = new Set<string>();
  const decisiveProofNamesSeen = new Set<string>();
  const redHerringNamesSeen = new Set<string>();
  const alibiBreakNamesSeen = new Set<string>();
  const leadLoc1NamesSeen = new Set<string>();
  const secretVenuesSeen = new Set<string>();
  const crimeTimesSeen = new Set<string>();
  const perRoomRoleTracker: Record<string, { decisive: Set<string>; redHerring: Set<string> }> = {};

  for (const s of testSeeds) {
    const c = generateCaseFromSeed(s);

    assert.equal(
      c.validationReport.passed,
      true,
      `Seed ${s} failed validation: ${c.validationReport.checks
        .filter((chk) => !chk.passed)
        .map((chk) => `${chk.id}: ${chk.detail}`)
        .join('; ')}`
    );

    // Verify dual-timeline schedules link shiftHours & openingHours cleanly (zero 24-hour shifts!)
    for (const [charId, wins] of Object.entries(c.schedules)) {
      for (const win of wins) {
        const dur = win.endMinutes - win.startMinutes;
        assert.ok(
          dur > 0 && dur < 18 * 60,
          `Seed ${s}: character ${charId} has unrealistic ${dur}m window (${win.startStr}-${win.endStr}) at ${win.locationId}`
        );
      }
    }

    const staffChars = c.witnesses.filter((w) => w.role === 'staff');
    assert.ok(staffChars.length >= 3, `Seed ${s}: expected dedicated staff across public locations`);
    for (const st of staffChars) {
      const loc = c.locations[st.currentLocationId];
      assert.ok(loc, `Staff ${st.id} placed in unknown location`);
      const effectiveHours = st.shiftHours || loc.openingHours;
      const nextShiftStart = getNextOpeningTotalMinutes(effectiveHours, c.investigationStartMinutes);
      assert.equal(
        isCharacterPresentAt(c.schedules, st.id, loc.id, nextShiftStart, loc.openingHours, 'investigation_day'),
        true,
        `Seed ${s}: staff ${st.id} must be present when their shift opens at ${nextShiftStart}`
      );
      const murderTimeAbs = 21 * 60 + 30;
      const onShiftAtMurder = isLocationOpenAt(effectiveHours, murderTimeAbs) && isLocationOpenAt(loc.openingHours, murderTimeAbs);
      assert.equal(
        isCharacterPresentAt(c.schedules, st.id, loc.id, murderTimeAbs, loc.openingHours, 'murder_night'),
        onShiftAtMurder,
        `Seed ${s}: staff ${st.id} murder-night presence must match shift hours at ${loc.id}`
      );
    }

    // Specifically verify Night Watchman at Warehouse No. 6 only works night hours (18:00-06:00) when on regular staff duty
    if (c.locations['harbor_warehouse']) {
      const watchman = c.witnesses.find((w) => w.id === 'staff_warehouse_watchman' && w.role === 'staff');
      if (watchman) {
        assert.equal(isCharacterPresentAt(c.schedules, 'staff_warehouse_watchman', 'harbor_warehouse', 1440 + 9 * 60, c.locations['harbor_warehouse'].openingHours, 'investigation_day'), false, 'Night Watchman must NOT be present at 09:00');
        assert.equal(isCharacterPresentAt(c.schedules, 'staff_warehouse_watchman', 'harbor_warehouse', 1440 + 12 * 60, c.locations['harbor_warehouse'].openingHours, 'investigation_day'), false, 'Night Watchman must NOT be present at 12:00');
        assert.equal(isCharacterPresentAt(c.schedules, 'staff_warehouse_watchman', 'harbor_warehouse', 1440 + 21 * 60 + 30, c.locations['harbor_warehouse'].openingHours, 'investigation_day'), true, 'Night Watchman MUST be present at 21:30');
        assert.equal(isCharacterPresentAt(c.schedules, 'staff_warehouse_watchman', 'harbor_warehouse', 1440 + 24 * 60 + 2 * 60, c.locations['harbor_warehouse'].openingHours, 'investigation_day'), true, 'Night Watchman MUST be present at 02:00');
      }
    }

    // Specifically verify Victor Malone (Proprietor of The Velvet Lounge) works Velvet Lounge hours and only visits elsewhere briefly
    const allLivingInCase = [c.culprit, ...c.suspects, ...c.witnesses];
    const victor = allLivingInCase.find((ch) => ch.id === 'victor_malone');
    if (victor) {
      assert.ok(c.locations['velvet_lounge'], `Seed ${s}: velvet_lounge must be present whenever Victor Malone is in the case`);
      const victorInvWins = (c.schedules['victor_malone'] || []).filter((w) => w.timelinePhase === 'investigation_day');
      const velvetShift = victorInvWins.find((w) => w.locationId === 'velvet_lounge' && w.kind === 'shift');
      assert.ok(velvetShift, `Seed ${s}: Victor Malone must have a regular shift at Velvet Lounge`);
      assert.equal(velvetShift.startStr, '18:00', `Seed ${s}: Victor Malone Velvet Lounge shift must open at 18:00`);
      assert.equal(velvetShift.endStr, '03:00', `Seed ${s}: Victor Malone Velvet Lounge shift must close at 03:00`);
      for (const otherWin of victorInvWins.filter((w) => w.locationId !== 'velvet_lounge')) {
        assert.equal(otherWin.kind, 'visit', `Seed ${s}: Victor Malone at ${otherWin.locationId} must be a visit, not a shift`);
        assert.ok(
          otherWin.endMinutes - otherWin.startMinutes <= 90,
          `Seed ${s}: Victor Malone visit at ${otherWin.locationId} must be short (got ${otherWin.endMinutes - otherWin.startMinutes}m)`
        );
      }
    }

    // Verify ambient family visitors in case have shorter visits than shifts
    const caseVisitors = c.witnesses.filter((w) => w.characterKind === 'family_visitor' && !w.isPrimaryCast);
    assert.ok(caseVisitors.length >= 1, `Seed ${s}: expected at least 1 family visitor`);
    for (const fv of caseVisitors) {
      const invWindows = (c.schedules[fv.id] || []).filter((w) => w.timelinePhase === 'investigation_day');
      assert.ok(invWindows.length >= 1, `Seed ${s}: visitor ${fv.id} must have investigation_day schedule`);
      for (const win of invWindows) {
        const dur = win.endMinutes - win.startMinutes;
        assert.ok(dur >= 30 && dur <= 85, `Seed ${s}: visitor ${fv.id} duration ${dur}m out of short-visit range`);
      }
    }

    // Ensure candidate pools meet >= 20 weapons and >= 10 motives to choose from
    assert.ok(c.candidateWeapons.length >= 20, `Seed ${s}: expected >=20 candidateWeapons, got ${c.candidateWeapons.length}`);
    assert.ok(c.candidateMotives.length >= 10, `Seed ${s}: expected >=10 candidateMotives, got ${c.candidateMotives.length}`);
    assert.ok(c.candidateWeapons.some((w) => w.id === c.hiddenSolution.weaponId));
    assert.ok(c.candidateMotives.some((m) => m.id === c.hiddenSolution.motiveId));

    // Ensure symmetric two-stage gating on decisive proof and both red herrings plus locked confrontation topics
    assert.equal(
      c.clues['clue_decisive_proof']?.requiresContextToInterpret,
      'heard_culprit_alibi',
      `Seed ${s}: decisive proof must require heard_culprit_alibi context`
    );
    const rhSuspect = c.suspects.find((sp) => sp.isRedHerring)!;
    const secondSuspectInCase = c.suspects.find((sp) => !sp.isRedHerring)!;
    assert.equal(
      c.clues['clue_red_herring']?.requiresContextToInterpret,
      `heard_${rhSuspect.id}_whereabouts`,
      `Seed ${s}: clue_red_herring must require heard_${rhSuspect.id}_whereabouts`
    );
    assert.equal(
      c.clues['clue_red_herring_2']?.requiresContextToInterpret,
      `heard_${secondSuspectInCase.id}_whereabouts`,
      `Seed ${s}: clue_red_herring_2 must require heard_${secondSuspectInCase.id}_whereabouts`
    );

    const culpritTopics = c.dialogueMap[c.culprit.id] || [];
    const confrontTopic = culpritTopics.find((t) => t.id === 'topic_confront_alibi');
    const trapTopic = culpritTopics.find((t) => t.id === 'topic_confession_trap');
    assert.ok(confrontTopic && !confrontTopic.unlocked, 'topic_confront_alibi must start locked');
    assert.ok(trapTopic && !trapTopic.unlocked, 'topic_confession_trap must start locked');

    // Ensure no boilerplate/default POI labels appear anywhere in the case
    const forbiddenDefaultPOIs = [
      'Overturned Marble Ashtray',
      'Back Corner Booth',
      'Coat Check & Dispatcher Stand',
      'Inventory & Storeroom Ledger',
      'Back-Office Telephone Desk',
      'Precinct Beat Incident Card',
      'Side-Room Ledger & Coat Tag',
      'Signed Appointment Spike',
      'Counter Dispatch & Routing Tray',
      'Venue Duty Roster & Sign-In Book',
      'Front Counter Shift Book',
      'Reception Ledger & Receipt Spike',
      'Side Stand Calling Tray',
      'Discarded Envelope Blotter'
    ];
    for (const loc of Object.values(c.locations)) {
      for (const poi of loc.pointsOfInterest) {
        assert.ok(
          !forbiddenDefaultPOIs.includes(poi.label),
          `Seed ${s}: Location ${loc.id} still uses forbidden boilerplate POI "${poi.label}"`
        );
        assert.ok(
          !/stray cloth fibers|loose fabric fibers/i.test(poi.description) &&
            !/stray cloth fibers|loose fabric fibers/i.test(poi.noticedNoticeText || ''),
          `Seed ${s}: POI ${poi.id} at ${loc.id} still uses generic undescribed cloth fibers: "${poi.description}"`
        );
        const normalizedSentences = poi.description
          .toLowerCase()
          .replace(/\b(st|no|mr|mrs|dr)\.\s+/g, '$1_dot_ ')
          .split(/\.\s+/)
          .map((part) => part.replace(/_dot_/g, '.').replace(/[.!?]+$/, '').trim())
          .filter((part) => part.length > 0);
        for (let i = 0; i < normalizedSentences.length; i++) {
          for (let j = i + 1; j < normalizedSentences.length; j++) {
            assert.ok(
              !normalizedSentences[i].includes(normalizedSentences[j]) &&
                !normalizedSentences[j].includes(normalizedSentences[i]),
              `Seed ${s}: POI ${poi.id} at ${loc.id} repeats sentence text: "${poi.description}"`
            );
          }
        }
      }
    }

    // Verify all 3 crime-scene physical clues carry the specific suspect attire fiber description on POI + noticed text + clue details
    const scenePois = c.locations[c.crimeSceneLocationId].pointsOfInterest;
    const rhSuspectForFiber = c.suspects.find((sp) => sp.isRedHerring)!;
    const ssSuspectForFiber = c.suspects.find((sp) => !sp.isRedHerring)!;
    const fiberSpotExpectations: Array<{ poiId: string; clueId: string; expectedFiber: string }> = [
      { poiId: 'poi_window', clueId: 'clue_decisive_proof', expectedFiber: describeAttireFibers(c.culprit.avatarStyle.collar) },
      { poiId: 'poi_scene_red_herring', clueId: 'clue_red_herring', expectedFiber: describeAttireFibers(rhSuspectForFiber.avatarStyle.collar) },
      { poiId: 'poi_scene_red_herring_2', clueId: 'clue_red_herring_2', expectedFiber: describeAttireFibers(ssSuspectForFiber.avatarStyle.collar) }
    ];
    for (const exp of fiberSpotExpectations) {
      const poi = scenePois.find((p) => p.id === exp.poiId)!;
      const clue = c.clues[exp.clueId]!;
      assert.ok(poi.description.includes(exp.expectedFiber), `Seed ${s}: ${exp.poiId} description missing "${exp.expectedFiber}"`);
      assert.ok((poi.noticedNoticeText || '').includes(exp.expectedFiber), `Seed ${s}: ${exp.poiId} noticedNoticeText missing "${exp.expectedFiber}"`);
      assert.ok(clue.shortSummary.includes(exp.expectedFiber), `Seed ${s}: ${exp.clueId} shortSummary missing "${exp.expectedFiber}"`);
      assert.ok(clue.detailedInspection.includes(exp.expectedFiber), `Seed ${s}: ${exp.clueId} detailedInspection missing "${exp.expectedFiber}"`);
    }

    // Verify off-duty staff (including Day Shift Foreman at Warehouse No. 6) state they were NOT present at crimeTime
    const [crimeH, crimeM] = c.crimeTime.split(':').map(Number);
    const crimeAbs = crimeH * 60 + crimeM;
    for (const st of staffChars) {
      const loc = c.locations[st.currentLocationId];
      const onDutyAtCrime = isCharacterPresentAt(c.schedules, st.id, loc.id, crimeAbs, loc.openingHours, 'murder_night');
      const sightingTopic = (c.dialogueMap[st.id] || []).find((t) => t.id === `topic_${st.id}_sightings`);
      assert.ok(sightingTopic, `Seed ${s}: staff ${st.id} missing sighting topic`);
      if (!onDutyAtCrime) {
        assert.ok(
          /wasn't at/i.test(sightingTopic.response),
          `Seed ${s}: off-duty staff ${st.id} (${st.title}) must state they were not at ${loc.id} at ${c.crimeTime}, got: "${sightingTopic.response}"`
        );
      }
    }
    if (c.locations['harbor_warehouse']) {
      const foreman = c.witnesses.find((w) => w.id === 'staff_warehouse_foreman' && w.role === 'staff');
      if (foreman) {
        const foremanSighting = (c.dialogueMap[foreman.id] || []).find((t) => t.id === `topic_${foreman.id}_sightings`)!;
        assert.ok(
          /wasn't at/i.test(foremanSighting.response) && /18:00/.test(foremanSighting.response),
          `Seed ${s}: Day Shift Foreman must clarify he clocked out at 18:00 and was not present at ${c.crimeTime}`
        );
      }
    }

    // Verify family visitors who were NOT at their current venue at crimeTime state they were elsewhere/home
    for (const fv of caseVisitors) {
      const fvLoc = c.locations[fv.currentLocationId];
      const atCurrentAtCrime = isCharacterPresentAt(c.schedules, fv.id, fvLoc.id, crimeAbs, fvLoc.openingHours, 'murder_night');
      const mnTopic = (c.dialogueMap[fv.id] || []).find((t) => t.id === `topic_${fv.id}_murder_night`)!;
      if (!atCurrentAtCrime) {
        assert.ok(
          /wasn't at/i.test(mnTopic.response),
          `Seed ${s}: off-site family visitor ${fv.id} must state they were not at ${fvLoc.id} at ${c.crimeTime}`
        );
      }
    }

    // Verify embarrassing/incriminating secrets & undiscovered meeting topics stay locked until proven
    const redHerringChar = c.suspects.find((sp) => sp.isRedHerring)!;
    const secondSuspectChar = c.suspects.find((sp) => !sp.isRedHerring)!;
    const rhTopics = c.dialogueMap[redHerringChar.id] || [];
    const rhAlibiTopic = rhTopics.find((t) => t.id === `topic_${redHerringChar.id}_alibi`);
    assert.ok(
      rhAlibiTopic &&
        !rhAlibiTopic.unlocked &&
        rhAlibiTopic.requiresFactId === `heard_${redHerringChar.id}_whereabouts` &&
        !(rhAlibiTopic.requiresAnyClueIds || []).includes('clue_lead_loc3'),
      `Seed ${s}: red herring meeting topic must stay locked until their whereabouts are heard`
    );
    const rhDisputeTopic = rhTopics.find((t) => t.id === 'topic_dispute_note');
    assert.ok(
      rhDisputeTopic &&
        !rhDisputeTopic.unlocked &&
        rhDisputeTopic.requiresClueId === 'clue_red_herring' &&
        (rhDisputeTopic.requiresAllFactIds?.includes(`heard_${redHerringChar.id}_whereabouts`) ?? false),
      'topic_dispute_note must start locked and require heard whereabouts alongside clue_red_herring'
    );
    for (const t of rhTopics.filter((x) => x.unlocked)) {
      assert.ok(!t.response.includes(c.culprit.name), `Seed ${s}: Red Herring unlocked topic ${t.id} must not freely reveal culprit`);
    }

    const ssTopics = c.dialogueMap[secondSuspectChar.id] || [];
    const ssSecretTopic = ssTopics.find((t) => t.id === 'topic_confront_secret_visit');
    assert.ok(
      ssSecretTopic && !ssSecretTopic.unlocked && ssSecretTopic.requiresClueId === 'clue_second_suspect_record',
      `Seed ${s}: topic_confront_secret_visit must start locked and require clue_second_suspect_record`
    );
    const ssSceneItemTopic = ssTopics.find((t) => t.id === 'topic_second_suspect_scene_item');
    assert.ok(
      ssSceneItemTopic &&
        !ssSceneItemTopic.unlocked &&
        ssSceneItemTopic.requiresClueId === 'clue_red_herring_2' &&
        (ssSceneItemTopic.requiresAllFactIds?.includes(`heard_${secondSuspectChar.id}_whereabouts`) ?? false),
      `Seed ${s}: topic_second_suspect_scene_item must start locked and require clue_red_herring_2 plus heard whereabouts`
    );
    for (const t of ssTopics.filter((x) => x.unlocked)) {
      assert.ok(!t.response.includes(c.culprit.name), `Seed ${s}: Second suspect unlocked topic ${t.id} must not freely reveal culprit`);
    }

    // Verify follow-up / evidence-dependent questions start locked until their reason/evidence is discovered
    const culpritMotiveTopic = culpritTopics.find((t) => t.id === 'topic_motive');
    const culpritSceneTopic = culpritTopics.find((t) => t.id === 'topic_crime_scene');
    assert.ok(
      culpritMotiveTopic && !culpritMotiveTopic.unlocked && (culpritMotiveTopic.requiresAnyClueIds?.length || 0) >= 1,
      `Seed ${s}: culprit topic_motive must start locked until motive paperwork is discovered`
    );
    assert.ok(
      culpritSceneTopic && !culpritSceneTopic.unlocked && culpritSceneTopic.requiresFactId === 'heard_culprit_alibi',
      `Seed ${s}: culprit topic_crime_scene must start locked until culprit whereabouts are heard`
    );
    assert.ok(
      confrontTopic && confrontTopic.requiresAllFactIds?.includes('heard_culprit_alibi'),
      `Seed ${s}: topic_confront_alibi must require heard_culprit_alibi`
    );
    assert.ok(
      trapTopic && trapTopic.requiresAllFactIds?.includes('alibi_confronted'),
      `Seed ${s}: topic_confession_trap must require alibi_confronted`
    );
    const culpritExcusePhrases = [
      'estate papers',
      'burn the leverage',
      'back-room list',
      'overdue markers',
      'private letters',
      'old score'
    ];
    for (const cTopic of [culpritMotiveTopic, confrontTopic, trapTopic]) {
      assert.ok(cTopic, `Seed ${s}: missing culprit topic`);
      assert.ok(
        !/warrant|used the/i.test(cTopic.response),
        `Seed ${s}: culprit topic ${cTopic.id} must not give away murder via warrant/weapon confession: "${cTopic.response}"`
      );
    }
    assert.ok(
      culpritExcusePhrases.some((p) => confrontTopic!.response.includes(p)) &&
        culpritExcusePhrases.some((p) => trapTopic!.response.includes(p)),
      `Seed ${s}: culprit confrontation excuses must come from the shared liar motive-excuse group`
    );
    assert.ok(
      c.clues['clue_alibi_break']?.detailedInspection.includes(c.culprit.avatarStyle.collar) &&
        c.clues['clue_decisive_proof']?.relatedCharacterId === c.culprit.id &&
        c.clues['clue_motive_document']?.relatedCharacterId === c.culprit.id,
      `Seed ${s}: combination of independent clues must still uniquely point to culprit`
    );

    const primaryWitness = c.witnesses.find((w) => w.isPrimaryCast && w.role === 'witness')!;
    const witnessTopics = c.dialogueMap[primaryWitness.id] || [];
    const witnessSighting = witnessTopics.find((t) => t.id === `topic_${primaryWitness.id}_sighting`);
    const witnessDetails = witnessTopics.find((t) => t.id === 'topic_witness_details');
    const witnessVictim = witnessTopics.find((t) => t.id === `topic_${primaryWitness.id}_victim`);
    assert.ok(
      witnessSighting &&
        !witnessSighting.unlocked &&
        witnessSighting.requiresFactId === `heard_${primaryWitness.id}_whereabouts` &&
        !(witnessSighting.requiresAnyClueIds || []).includes('clue_witness_report_slip'),
      `Seed ${s}: witness observation topic must stay locked until witness whereabouts are heard`
    );
    assert.ok(
      witnessDetails && !witnessDetails.unlocked && witnessDetails.requiresFactId === 'heard_witness_sighting',
      `Seed ${s}: topic_witness_details must stay locked until sighting is heard`
    );
    assert.ok(
      witnessVictim && !witnessVictim.unlocked && witnessVictim.requiresFactId === `heard_${primaryWitness.id}_whereabouts`,
      `Seed ${s}: witness victim demeanor topic must stay locked until witness whereabouts are heard`
    );

    const corroboratorChar = c.witnesses.find((w) => w.role === 'corroborator')!;
    const corrTopics = c.dialogueMap[corroboratorChar.id] || [];
    const corrAlibi = corrTopics.find((t) => t.id === 'topic_corroborate_alibi');
    const corrRel = corrTopics.find((t) => t.id === 'topic_corroborator_relation');
    const corrVenue = corrTopics.find((t) => t.id === 'topic_corroborator_venue');
    assert.ok(
      corrAlibi && !corrAlibi.unlocked && !(corrAlibi.requiresAnyClueIds || []).includes('clue_lead_loc3'),
      `Seed ${s}: topic_corroborate_alibi must not unlock prematurely from clue_lead_loc3`
    );
    assert.ok(
      corrRel && !corrRel.unlocked && !(corrRel.requiresAnyClueIds || []).includes('clue_red_herring'),
      `Seed ${s}: topic_corroborator_relation must not unlock prematurely from clue_red_herring`
    );
    assert.ok(corrVenue && !corrVenue.unlocked, `Seed ${s}: topic_corroborator_venue must start locked`);

    for (const st of staffChars) {
      const wTopic = (c.dialogueMap[st.id] || []).find((t) => t.id === `topic_${st.id}_weapon_check`);
      const locWeaponClueId = `clue_loc_weapon_${st.currentLocationId}`;
      const expectedLocWeaponId = c.clues[locWeaponClueId]?.relatedWeaponId;
      assert.ok(
        wTopic &&
          !wTopic.unlocked &&
          Boolean(expectedLocWeaponId) &&
          wTopic.relatedWeaponId === expectedLocWeaponId &&
          (wTopic.requiresAnyClueIds?.includes(locWeaponClueId) ?? false) &&
          !(wTopic.requiresAnyClueIds?.includes('clue_murder_weapon') ?? false),
        `Seed ${s}: staff weapon check ${st.id} must unlock from ${locWeaponClueId} and target ${expectedLocWeaponId}`
      );
      if (wTopic && c.clues[locWeaponClueId]) {
        const discoveredCopy = { ...c.clues, [locWeaponClueId]: { ...c.clues[locWeaponClueId], status: 'interpreted' as const } };
        assert.deepEqual(
          getLinkedClueIdsForTopic(wTopic, discoveredCopy),
          [locWeaponClueId],
          `Seed ${s}: staff weapon check ${st.id} must sync to ${locWeaponClueId}`
        );
        assert.deepEqual(
          getLinkedTopicIdsForClue(st, c.dialogueMap[st.id] || [], discoveredCopy[locWeaponClueId], false),
          [wTopic.id],
          `Seed ${s}: presenting ${locWeaponClueId} to ${st.id} must sync to ${wTopic.id}`
        );
      }
    }

    // Verify bidirectional topic <-> clue synchronization across culprit, suspects, and corroborator
    const discoveredAllClues = Object.fromEntries(
      Object.entries(c.clues).map(([id, cl]) => [id, { ...cl, status: 'interpreted' as const }])
    );
    assert.deepEqual(
      getLinkedTopicIdsForClue(c.culprit, culpritTopics, discoveredAllClues['clue_alibi_break'], false),
      [],
      `Seed ${s}: premature alibi break presentation must not check off topic_confront_alibi before whereabouts are heard`
    );
    assert.deepEqual(
      getLinkedTopicIdsForClue(c.culprit, culpritTopics, discoveredAllClues['clue_alibi_break'], true),
      ['topic_confront_alibi'],
      `Seed ${s}: presenting clue_alibi_break after whereabouts must check off topic_confront_alibi`
    );
    assert.deepEqual(
      getLinkedClueIdsForTopic(confrontTopic, discoveredAllClues),
      ['clue_alibi_break'],
      `Seed ${s}: asking topic_confront_alibi must check off clue_alibi_break`
    );
    assert.deepEqual(
      getLinkedTopicIdsForClue(c.culprit, culpritTopics, discoveredAllClues['clue_decisive_proof'], true),
      ['topic_confession_trap'],
      `Seed ${s}: presenting clue_decisive_proof after whereabouts must check off topic_confession_trap`
    );
    assert.deepEqual(
      getLinkedClueIdsForTopic(trapTopic, discoveredAllClues),
      ['clue_decisive_proof'],
      `Seed ${s}: asking topic_confession_trap must check off clue_decisive_proof`
    );
    assert.deepEqual(
      getLinkedTopicIdsForClue(redHerringChar, rhTopics, discoveredAllClues['clue_red_herring'], false),
      ['topic_dispute_note'],
      `Seed ${s}: presenting clue_red_herring must check off topic_dispute_note`
    );
    assert.deepEqual(
      getLinkedClueIdsForTopic(rhDisputeTopic, discoveredAllClues),
      ['clue_red_herring'],
      `Seed ${s}: asking topic_dispute_note must check off clue_red_herring`
    );
    assert.deepEqual(
      getLinkedTopicIdsForClue(secondSuspectChar, ssTopics, discoveredAllClues['clue_second_suspect_record'], false),
      ['topic_confront_secret_visit'],
      `Seed ${s}: presenting clue_second_suspect_record must check off topic_confront_secret_visit`
    );
    assert.deepEqual(
      getLinkedClueIdsForTopic(ssSecretTopic, discoveredAllClues),
      ['clue_second_suspect_record'],
      `Seed ${s}: asking topic_confront_secret_visit must check off clue_second_suspect_record`
    );
    assert.deepEqual(
      getLinkedTopicIdsForClue(corroboratorChar, corrTopics, discoveredAllClues['clue_corroborator_record'], false),
      ['topic_corroborate_alibi'],
      `Seed ${s}: presenting clue_corroborator_record must check off topic_corroborate_alibi`
    );
    assert.deepEqual(
      getLinkedClueIdsForTopic(corrAlibi, discoveredAllClues),
      ['clue_corroborator_record'],
      `Seed ${s}: asking topic_corroborate_alibi must check off clue_corroborator_record`
    );
    assert.deepEqual(
      getLinkedClueIdsForTopic(corrVenue, discoveredAllClues),
      [],
      `Seed ${s}: topic_corroborator_venue must not auto-check clue_corroborator_record`
    );

    // Verify city map location status rules: current vs unvisited vs visited vs updated clue / updated suspect
    const sceneLoc = c.locations[c.crimeSceneLocationId];
    const otherDiscoveredLoc = Object.values(c.locations).find(
      (l) => l.discovered && l.id !== c.crimeSceneLocationId
    );
    const livingList = [c.culprit, ...c.suspects, ...c.witnesses];
    const sceneStatus = getLocationMapStatus(sceneLoc, {
      currentLocationId: c.crimeSceneLocationId,
      visitedLocationIds: [c.crimeSceneLocationId],
      livingCharacters: livingList,
      dialogueMap: c.dialogueMap,
      interviewStates: c.interviewStates,
      clues: c.clues,
      revealedFacts: [],
      seenUnlockedTopicsByChar: {},
      schedules: c.schedules,
      investigationMinutes: c.investigationStartMinutes ?? 540
    });
    assert.equal(sceneStatus.isCurrent, true, `Seed ${s}: crime scene must be current`);
    assert.equal(sceneStatus.visited, true, `Seed ${s}: crime scene must be visited`);

    if (otherDiscoveredLoc) {
      const unvisitedStatus = getLocationMapStatus(otherDiscoveredLoc, {
        currentLocationId: c.crimeSceneLocationId,
        visitedLocationIds: [c.crimeSceneLocationId],
        livingCharacters: livingList,
        dialogueMap: c.dialogueMap,
        interviewStates: c.interviewStates,
        clues: c.clues,
        revealedFacts: [],
        seenUnlockedTopicsByChar: {},
        schedules: c.schedules,
        investigationMinutes: c.investigationStartMinutes ?? 540
      });
      assert.equal(unvisitedStatus.visited, false, `Seed ${s}: other location must start unvisited`);
      assert.equal(unvisitedStatus.isUpdated, false, `Seed ${s}: unvisited location must not be flagged updated`);
    }

    // Updated clue at a visited location marks it updated
    const locWithPoi = {
      ...sceneLoc,
      pointsOfInterest: sceneLoc.pointsOfInterest.map((p, idx) =>
        idx === 0 ? { ...p, inspected: true, clueUpdated: true } : p
      )
    };
    const clueUpdatedStatus = getLocationMapStatus(locWithPoi, {
      currentLocationId: c.culprit.currentLocationId,
      visitedLocationIds: [c.crimeSceneLocationId, c.culprit.currentLocationId],
      livingCharacters: livingList,
      dialogueMap: c.dialogueMap,
      interviewStates: c.interviewStates,
      clues: c.clues,
      revealedFacts: [],
      seenUnlockedTopicsByChar: {},
      schedules: c.schedules,
      investigationMinutes: c.investigationStartMinutes ?? 540
    });
    assert.equal(clueUpdatedStatus.hasUpdatedClue, true, `Seed ${s}: updated POI clue must mark location updated`);

    // Newly unlocked motive topic for culprit after visiting their venue marks culprit's venue updated
    const culpritLoc = c.locations[c.culprit.currentLocationId];
    if (culpritLoc && c.culprit.currentLocationId !== c.crimeSceneLocationId) {
      const culpritWindow = c.schedules?.[c.culprit.id]?.find(
        (w) => w.timelinePhase === 'investigation_day' && w.locationId === culpritLoc.id
      );
      const culpritPresentMinutes = culpritWindow
        ? culpritWindow.startMinutes
        : (c.investigationStartMinutes ?? 540);
      const baselineSeen = {
        [c.culprit.id]: getUnlockedTopicIdsForCharacter(
          c.culprit,
          culpritTopics,
          c.interviewStates[c.culprit.id],
          c.clues,
          []
        )
      };
      // Also record any other living characters present at culpritLoc during that window so baselineSeen mirrors leaving the venue
      for (const otherChar of livingList) {
        if (otherChar.id === c.culprit.id) continue;
        const present = c.schedules?.[otherChar.id]
          ? isCharacterPresentAt(c.schedules, otherChar.id, culpritLoc.id, culpritPresentMinutes, culpritLoc.openingHours, 'investigation_day')
          : otherChar.currentLocationId === culpritLoc.id;
        if (present) {
          baselineSeen[otherChar.id] = getUnlockedTopicIdsForCharacter(
            otherChar,
            c.dialogueMap[otherChar.id] || [],
            c.interviewStates[otherChar.id],
            c.clues,
            []
          );
        }
      }
      const cleanVisited = getLocationMapStatus(culpritLoc, {
        currentLocationId: c.crimeSceneLocationId,
        visitedLocationIds: [c.crimeSceneLocationId, culpritLoc.id],
        livingCharacters: livingList,
        dialogueMap: c.dialogueMap,
        interviewStates: {
          ...c.interviewStates,
          [c.culprit.id]: {
            ...c.interviewStates[c.culprit.id],
            statementsHeard: [`topic_${c.culprit.id}_whereabouts`]
          }
        },
        clues: c.clues,
        revealedFacts: ['heard_culprit_alibi'],
        seenUnlockedTopicsByChar: baselineSeen,
        schedules: c.schedules,
        investigationMinutes: culpritPresentMinutes
      });
      // When motive clue is discovered after leaving culpritLoc, culpritLoc turns orange
      const motiveClueId = culpritMotiveTopic?.requiresAnyClueIds?.[0];
      if (motiveClueId && c.clues[motiveClueId]) {
        const updatedCluesMap = {
          ...c.clues,
          [motiveClueId]: { ...c.clues[motiveClueId], status: 'interpreted' as const }
        };
        const updatedSuspectStatus = getLocationMapStatus(culpritLoc, {
          currentLocationId: c.crimeSceneLocationId,
          visitedLocationIds: [c.crimeSceneLocationId, culpritLoc.id],
          livingCharacters: livingList,
          dialogueMap: c.dialogueMap,
          interviewStates: {
            ...c.interviewStates,
            [c.culprit.id]: {
              ...c.interviewStates[c.culprit.id],
              statementsHeard: [`topic_${c.culprit.id}_whereabouts`]
            }
          },
          clues: updatedCluesMap,
          revealedFacts: ['heard_culprit_alibi'],
          seenUnlockedTopicsByChar: baselineSeen,
          schedules: c.schedules,
          investigationMinutes: culpritPresentMinutes
        });
        assert.equal(
          updatedSuspectStatus.hasUpdatedSuspect,
          true,
          `Seed ${s}: newly unlocked suspect topic must mark visited location updated (clean was ${cleanVisited.hasUpdatedSuspect})`
        );

        // Also verify character-level interview color indicator (not_interviewed -> interviewed -> updated -> interviewed)
        assert.equal(
          getCharacterInterviewStatus(c.culprit, culpritTopics, c.interviewStates[c.culprit.id], c.clues, []),
          'not_interviewed',
          `Seed ${s}: culprit with 0 heard topics must be not_interviewed`
        );
        const initialUnlocked = getUnlockedTopicIdsForCharacter(
          c.culprit,
          culpritTopics,
          c.interviewStates[c.culprit.id],
          c.clues,
          ['heard_culprit_alibi']
        );
        const fullInitialInterviewState = {
          ...c.interviewStates[c.culprit.id],
          statementsHeard: initialUnlocked
        };
        assert.equal(
          getCharacterInterviewStatus(c.culprit, culpritTopics, fullInitialInterviewState, c.clues, ['heard_culprit_alibi']),
          'interviewed',
          `Seed ${s}: culprit with all unlocked topics heard must be interviewed`
        );
        assert.equal(
          getCharacterInterviewStatus(c.culprit, culpritTopics, fullInitialInterviewState, updatedCluesMap, ['heard_culprit_alibi']),
          'updated',
          `Seed ${s}: culprit with newly unlocked motive topic must be updated`
        );
        const afterMotiveState = {
          ...fullInitialInterviewState,
          statementsHeard: [...initialUnlocked, culpritMotiveTopic!.id]
        };
        assert.equal(
          getCharacterInterviewStatus(c.culprit, culpritTopics, afterMotiveState, updatedCluesMap, ['heard_culprit_alibi']),
          'interviewed',
          `Seed ${s}: culprit returns to interviewed once new motive topic is heard`
        );
      }
    }

    // Ensure clue_murder_weapon records post-mortem wound profile without spoiling the exact weapon name or ID on Turn 1
    const woundClue = c.clues['clue_murder_weapon'];
    assert.ok(woundClue, `Seed ${s}: missing clue_murder_weapon`);
    assert.equal(woundClue.relatedWeaponId, undefined, `Seed ${s}: clue_murder_weapon must not spoil relatedWeaponId on Turn 1`);
    assert.ok(
      !woundClue.name.includes(c.weapon.name) && !woundClue.detailedInspection.includes(c.weapon.name),
      `Seed ${s}: clue_murder_weapon must not leak exact weapon name "${c.weapon.name}"`
    );

    // Every active location must yield exactly 1 unique natural weapon, and no weapon may appear in >1 location
    const activeLocIds = Object.keys(c.locations);
    const assignedLocWeapons: string[] = [];
    const weaponLocationsSeen: Record<string, Set<string>> = {};
    for (const locId of activeLocIds) {
      const loc = c.locations[locId];
      const wClue = c.clues[`clue_loc_weapon_${locId}`];
      assert.ok(wClue && wClue.relatedWeaponId, `Seed ${s}: location ${locId} missing weapon clue`);
      assert.ok(
        loc.pointsOfInterest.some((poi) => poi.clueRewardId === wClue.id),
        `Seed ${s}: location ${locId} missing POI for ${wClue.id}`
      );
      const wTpl = MASTER_WEAPONS.find((w) => w.id === wClue.relatedWeaponId)!;
      assert.ok(wTpl, `Seed ${s}: unknown weapon ${wClue.relatedWeaponId} at ${locId}`);
      assert.ok(
        !wTpl.neverNaturallyAvailableAt.includes(loc.id) &&
          !loc.neverNaturalWeapons.includes(wTpl.id) &&
          (wTpl.usuallyAvailableAt.includes(loc.id) || loc.naturalWeapons.includes(wTpl.id)),
        `Seed ${s}: weapon ${wTpl.id} is not naturally available at ${loc.id}`
      );
      assignedLocWeapons.push(wClue.relatedWeaponId);
    }
    assert.equal(
      new Set(assignedLocWeapons).size,
      activeLocIds.length,
      `Seed ${s}: duplicate weapon found across active locations (${assignedLocWeapons.join(', ')})`
    );
    assert.ok(
      assignedLocWeapons.includes(c.weapon.id),
      `Seed ${s}: murder weapon ${c.weapon.id} must be placed in one active location`
    );
    for (const clue of Object.values(c.clues)) {
      if (!clue.relatedWeaponId) continue;
      if (!weaponLocationsSeen[clue.relatedWeaponId]) weaponLocationsSeen[clue.relatedWeaponId] = new Set();
      weaponLocationsSeen[clue.relatedWeaponId].add(clue.locationFoundId);
    }
    for (const [wId, locsSet] of Object.entries(weaponLocationsSeen)) {
      assert.ok(
        locsSet.size <= 1,
        `Seed ${s}: weapon ${wId} appeared in multiple locations: ${Array.from(locsSet).join(', ')}`
      );
    }

    // Even when multiple churches appear in a single game, brass_candlestick can appear in at most 1
    const churchLocIds = ['st_judes', 'riverside_chapel', 'trinity_baptist'].filter((id) => Boolean(c.locations[id]));
    if (churchLocIds.length >= 2) {
      const candlestickChurches = churchLocIds.filter(
        (id) => c.clues[`clue_loc_weapon_${id}`]?.relatedWeaponId === 'brass_candlestick'
      );
      assert.ok(
        candlestickChurches.length <= 1,
        `Seed ${s}: brass_candlestick appeared in multiple churches: ${candlestickChurches.join(', ')}`
      );
    }

    if (c.clues['clue_weapon_transfer']) {
      assert.equal(
        c.clues['clue_weapon_transfer'].relatedWeaponId,
        c.weapon.id,
        `Seed ${s}: clue_weapon_transfer must reference weapon ${c.weapon.id}`
      );
    } else {
      assert.ok(c.clues['clue_weapon_provenance'], `Seed ${s}: missing weapon provenance clue`);
      assert.equal(
        c.clues['clue_weapon_provenance'].relatedWeaponId,
        undefined,
        `Seed ${s}: clue_weapon_provenance must not duplicate weapon ${c.weapon.id} in a second location`
      );
    }

    // Ensure no spoiler phrasing or space-era "sector" word leaks into clues
    for (const clue of Object.values(c.clues)) {
      const combined = `${clue.name} ${clue.shortSummary} ${clue.detailedInspection}`.toLowerCase();
      assert.ok(!combined.includes('sector'), `Clue ${clue.id} contains "sector"`);
      assert.ok(
        !combined.includes('contradicting their claimed alibi'),
        `Clue ${clue.id} contains premature alibi contradiction spoiler`
      );
    }

    // Verify agency branding in dispatch & minimum 3 dialogue topics for every living character
    assert.ok(
      c.dispatchMemo.includes(AGENCY_FULL_NAME.toUpperCase()),
      `Seed ${s}: dispatchMemo must address ${AGENCY_FULL_NAME.toUpperCase()}`
    );
    assert.ok(
      !c.dispatchMemo.toLowerCase().includes('blackbird detective agency'),
      `Seed ${s}: dispatchMemo contains stale agency branding`
    );
    for (const ch of [c.culprit, ...c.suspects, ...c.witnesses]) {
      const topics = c.dialogueMap[ch.id] || [];
      assert.ok(
        topics.length >= 3,
        `Seed ${s}: character ${ch.id} (${ch.role}) should have >=3 dialogue topics, got ${topics.length}`
      );
      assert.ok(
        !/\btonight\b/i.test(ch.alibiClaim),
        `Seed ${s}: character ${ch.id} alibiClaim must not use "tonight" on Day 2 morning: "${ch.alibiClaim}"`
      );
      for (const topic of topics) {
        assert.ok(
          !/\btonight\b/i.test(topic.prompt) && !/\btonight\b/i.test(topic.response),
          `Seed ${s}: topic ${topic.id} on ${ch.id} must not use "tonight": "${topic.prompt}" / "${topic.response}"`
        );
      }
    }

    // Verify topic_crime_scene is past-tense and workplace-aware when culprit works at crime scene
    assert.ok(culpritSceneTopic, `Seed ${s}: missing culprit topic_crime_scene`);
    if (c.culprit.assignedLocationId === c.crimeSceneLocationId) {
      assert.ok(
        /regular workplace/i.test(culpritSceneTopic.prompt),
        `Seed ${s}: workplace topic_crime_scene must acknowledge culprit works at scene, got "${culpritSceneTopic.prompt}"`
      );
      assert.ok(
        !/broad daylight/i.test(culpritSceneTopic.response),
        `Seed ${s}: workplace culprit must not claim they merely passed their own workplace in broad daylight`
      );
    }

    // Verify murder_night schedule windows for culprit, redHerring, corroborator never overlap each other
    for (const coreChar of [c.culprit, rhSuspect, corroboratorChar]) {
      const mnWins = (c.schedules[coreChar.id] || [])
        .filter((w) => w.timelinePhase === 'murder_night')
        .sort((a, b) => a.startMinutes - b.startMinutes);
      for (let idx = 1; idx < mnWins.length; idx++) {
        assert.ok(
          mnWins[idx - 1].endMinutes <= mnWins[idx].startMinutes,
          `Seed ${s}: overlapping murder_night schedule windows for ${coreChar.id}: ${mnWins[idx - 1].startStr}-${mnWins[idx - 1].endStr} vs ${mnWins[idx].startStr}-${mnWins[idx].endStr}`
        );
      }
    }

    culpritsSeen.add(c.culprit.id);
    weaponsSeen.add(c.weapon.id);
    motivesSeen.add(c.motive.id);
    scenesSeen.add(c.crimeSceneLocationId);
    titlesSeen.add(c.caseTitle);

    const dpName = c.clues['clue_decisive_proof']?.name;
    const rh1Name = c.clues['clue_red_herring']?.name;
    const rh2Name = c.clues['clue_red_herring_2']?.name;
    const abName = c.clues['clue_alibi_break']?.name;
    const l1Name = c.clues['clue_lead_loc1']?.name;
    const secVenue = c.clues['clue_second_suspect_record']?.locationFoundId;
    if (dpName) decisiveProofNamesSeen.add(dpName);
    if (rh1Name) redHerringNamesSeen.add(rh1Name);
    if (rh2Name) redHerringNamesSeen.add(rh2Name);
    if (abName) alibiBreakNamesSeen.add(abName);
    if (l1Name) leadLoc1NamesSeen.add(l1Name);
    if (secVenue) secretVenuesSeen.add(secVenue);
    crimeTimesSeen.add(c.crimeTime);

    const roomPool = LOCATION_EVIDENCE_ITEMS[c.crimeSceneLocationId];
    assert.ok(roomPool, `Crime scene ${c.crimeSceneLocationId} missing from LOCATION_EVIDENCE_ITEMS`);
    const roomPoolNames = new Set(roomPool.map((i) => i.name));
    assert.ok(dpName && roomPoolNames.has(dpName), `Seed ${s}: decisive proof "${dpName}" must come from ${c.crimeSceneLocationId} pool`);
    assert.ok(rh1Name && roomPoolNames.has(rh1Name), `Seed ${s}: red herring 1 "${rh1Name}" must come from ${c.crimeSceneLocationId} pool`);
    assert.ok(rh2Name && roomPoolNames.has(rh2Name), `Seed ${s}: red herring 2 "${rh2Name}" must come from ${c.crimeSceneLocationId} pool`);
    assert.equal(new Set([dpName, rh1Name, rh2Name]).size, 3, `Seed ${s}: crime scene evidence items must be 3 distinct room items`);

    if (!perRoomRoleTracker[c.crimeSceneLocationId]) {
      perRoomRoleTracker[c.crimeSceneLocationId] = { decisive: new Set(), redHerring: new Set() };
    }
    perRoomRoleTracker[c.crimeSceneLocationId].decisive.add(dpName!);
    perRoomRoleTracker[c.crimeSceneLocationId].redHerring.add(rh1Name!);
    perRoomRoleTracker[c.crimeSceneLocationId].redHerring.add(rh2Name!);

    // Cork board graph invariants & spoiler safety
    const alibiBreakClue = c.clues['clue_alibi_break'];
    if (alibiBreakClue) {
      assert.equal(
        isClueCharacterLinkVisible(
          { ...alibiBreakClue, status: 'interpreted' },
          c.culprit
        ),
        false,
        `Seed ${s}: uncorroborated clue_alibi_break must not leak culprit via cork board string`
      );
      assert.equal(
        isClueCharacterLinkVisible(
          { ...alibiBreakClue, status: 'corroborated' },
          c.culprit
        ),
        true,
        `Seed ${s}: corroborated clue_alibi_break must link to culprit on cork board`
      );
    }

    const weaponTransferClue = c.clues['clue_weapon_transfer'];
    if (weaponTransferClue) {
      assert.equal(
        isClueCharacterLinkVisible(
          { ...weaponTransferClue, status: 'interpreted' },
          c.culprit
        ),
        false,
        `Seed ${s}: uncorroborated clue_weapon_transfer must not leak culprit via cork board string`
      );
    }

    const dpClue = c.clues['clue_decisive_proof'];
    if (dpClue && dpClue.requiresContextToInterpret) {
      assert.equal(
        isClueCharacterLinkVisible({ ...dpClue, status: 'noticed' }, c.culprit),
        false,
        `Seed ${s}: noticed clue_decisive_proof must not reveal culprit link prematurely`
      );
      assert.equal(
        isClueCharacterLinkVisible({ ...dpClue, status: 'interpreted' }, c.culprit),
        true,
        `Seed ${s}: interpreted clue_decisive_proof must reveal culprit link`
      );
    }

    const sceneWeaponClue = c.clues[`clue_loc_weapon_${c.crimeSceneLocationId}`];
    assert.ok(sceneWeaponClue, `Seed ${s}: missing crime scene weapon clue`);
    const discoveredSampleClues = [
      { ...woundClue, status: 'interpreted' as const },
      { ...sceneWeaponClue, status: 'interpreted' as const },
      ...(alibiBreakClue ? [{ ...alibiBreakClue, status: 'interpreted' as const }] : []),
      ...(c.clues['clue_lead_loc1'] ? [{ ...c.clues['clue_lead_loc1'], status: 'interpreted' as const }] : [])
    ];
    const discoveredBoardWeapons = getDiscoveredBoardWeapons({
      caseWeapons: c.candidateWeapons,
      discoveredClues: [
        { ...sceneWeaponClue, status: 'noticed' as const },
        { ...woundClue, status: 'interpreted' as const }
      ],
      selectedWeaponId: null
    });
    assert.equal(
      discoveredBoardWeapons.length,
      0,
      `Seed ${s}: noticed weapon clues and wound profile without relatedWeaponId must not put weapons on board`
    );

    const activeBoardWeapons = getDiscoveredBoardWeapons({
      caseWeapons: c.candidateWeapons,
      discoveredClues: discoveredSampleClues,
      selectedWeaponId: c.weapon.id
    });
    assert.ok(
      activeBoardWeapons.some((bw) => bw.weapon.id === sceneWeaponClue.relatedWeaponId),
      `Seed ${s}: interpreted location weapon clue must put weapon on cork board`
    );

    const boardLocations = Object.fromEntries(
      Object.entries(c.locations).map(([id, loc]) => [
        id,
        id === c.culprit.currentLocationId ? { ...loc, discovered: true } : loc
      ])
    );
    const boardPeople = getDiscoveredBoardPeople({
      livingCharacters: livingList,
      visitedLocationIds: [c.crimeSceneLocationId, c.culprit.currentLocationId],
      interviewStates: c.interviewStates,
      discoveredClues: discoveredSampleClues,
      accusedCulpritId: c.culprit.id
    });
    const relevantClues = getRelevantBoardClues(discoveredSampleClues, 'all');
    const edges = buildBoardStringEdges({
      activeCase: c,
      locations: boardLocations,
      boardPeople,
      boardWeapons: activeBoardWeapons,
      boardClues: relevantClues,
      submission: {
        accusedCulpritId: c.culprit.id,
        selectedWeaponId: c.weapon.id,
        selectedMotiveId: c.motive.id,
        selectedDecisiveProofId: sceneWeaponClue.id,
        selectedAlibiBreakPinId: null
      }
    });
    assert.ok(
      edges.some(
        (e) =>
          e.kind === 'clue' &&
          e.from === `clue:${sceneWeaponClue.id}` &&
          e.to === `weapon:${sceneWeaponClue.relatedWeaponId}`
      ),
      `Seed ${s}: weapon clue must connect to its discovered weapon pin`
    );
    assert.ok(
      edges.some(
        (e) =>
          e.kind === 'clue' &&
          e.from === `clue:${sceneWeaponClue.id}` &&
          e.to === `loc:${c.crimeSceneLocationId}`
      ),
      `Seed ${s}: weapon clue must connect to its discovery location pin`
    );
    assert.ok(
      edges.some((e) => e.kind === 'theory' && e.to === 'motive:active'),
      `Seed ${s}: accused culprit + selected motive must connect via theory string`
    );

    // Hidden node exclusion & Focus-first string filtering invariants
    const hiddenWpnKey = `weapon:${sceneWeaponClue.relatedWeaponId}` as const;
    const rawHidden = new Set([hiddenWpnKey, `clue:${sceneWeaponClue.id}` as const]);
    const effectiveHidden = getEffectiveHiddenNodeKeys(rawHidden, {
      accusedCulpritId: c.culprit.id,
      selectedWeaponId: null,
      selectedMotiveId: c.motive.id,
      selectedDecisiveProofId: sceneWeaponClue.id,
      selectedAlibiBreakPinId: null
    });
    assert.equal(
      effectiveHidden.has(`clue:${sceneWeaponClue.id}`),
      false,
      `Seed ${s}: pinned decisive proof must automatically stay visible in effectiveHidden`
    );
    assert.equal(
      effectiveHidden.has(hiddenWpnKey),
      true,
      `Seed ${s}: unpinned hidden weapon must remain excluded`
    );
    const filteredOutEdges = buildBoardStringEdges({
      activeCase: c,
      locations: boardLocations,
      boardPeople,
      boardWeapons: activeBoardWeapons,
      boardClues: relevantClues,
      submission: {
        accusedCulpritId: c.culprit.id,
        selectedWeaponId: null,
        selectedMotiveId: c.motive.id,
        selectedDecisiveProofId: sceneWeaponClue.id,
        selectedAlibiBreakPinId: null
      },
      hiddenNodeKeys: effectiveHidden
    });
    assert.equal(
      filteredOutEdges.some((e) => e.from === hiddenWpnKey || e.to === hiddenWpnKey),
      false,
      `Seed ${s}: edges referencing a hidden weapon must be suppressed`
    );
    const focusedNoSelection = filterBoardEdgesForMode(edges, 'focused', null);
    assert.ok(
      focusedNoSelection.every((e) => e.kind === 'theory'),
      `Seed ${s}: focused mode with no selected node must show only theory edges`
    );
    const focusedLocEdges = filterBoardEdgesForMode(edges, 'focused', `loc:${c.crimeSceneLocationId}`);
    assert.ok(
      focusedLocEdges.some(
        (e) => e.from === `loc:${c.crimeSceneLocationId}` || e.to === `loc:${c.crimeSceneLocationId}`
      ),
      `Seed ${s}: focused mode with selected location must include edges attached to that location`
    );

    // Pinned motive clue protection + theory string edge + initial undiscovered suspects
    const motiveClue = c.clues['clue_motive_document'];
    const discoveredMotiveClue = { ...motiveClue, status: 'noticed' as const };
    const motiveEdges = buildBoardStringEdges({
      activeCase: c,
      locations: boardLocations,
      boardPeople,
      boardWeapons: activeBoardWeapons,
      boardClues: [...relevantClues, discoveredMotiveClue],
      submission: {
        accusedCulpritId: c.culprit.id,
        selectedWeaponId: null,
        selectedMotiveId: null,
        selectedMotiveClueId: motiveClue.id,
        selectedDecisiveProofId: sceneWeaponClue.id,
        selectedAlibiBreakPinId: null
      }
    });
    assert.ok(
      motiveEdges.some(
        (e) => e.kind === 'theory' && e.from === `char:${c.culprit.id}` && e.to === `clue:${motiveClue.id}`
      ),
      `Seed ${s}: accused culprit + pinned motive clue must connect via theory string`
    );
    const motiveEffectiveHidden = getEffectiveHiddenNodeKeys(
      new Set([`clue:${motiveClue.id}` as const]),
      {
        accusedCulpritId: c.culprit.id,
        selectedWeaponId: null,
        selectedMotiveId: null,
        selectedMotiveClueId: motiveClue.id,
        selectedDecisiveProofId: null,
        selectedAlibiBreakPinId: null
      }
    );
    assert.equal(
      motiveEffectiveHidden.has(`clue:${motiveClue.id}`),
      false,
      `Seed ${s}: pinned motive clue must automatically stay visible in effectiveHidden`
    );

    const startDiscoveredPeople = getDiscoveredBoardPeople({
      livingCharacters: livingList,
      visitedLocationIds: ['agency'],
      interviewStates: c.interviewStates,
      discoveredClues: [],
      accusedCulpritId: null
    });
    const startDiscoveredSuspectIds = new Set(startDiscoveredPeople.map((p) => p.id));
    assert.equal(
      [c.culprit, ...c.suspects].some((sp) => startDiscoveredSuspectIds.has(sp.id)),
      false,
      `Seed ${s}: before investigating, no prime suspects should be pre-discovered at agency`
    );
  }

  assert.ok(culpritsSeen.size >= 3, `Expected >=3 culprits across seeds, got ${culpritsSeen.size}`);
  assert.ok(weaponsSeen.size >= 10, `Expected >=10 distinct weapons chosen across seeds, got ${weaponsSeen.size}`);
  assert.ok(motivesSeen.size >= 8, `Expected >=8 distinct motives chosen across seeds, got ${motivesSeen.size}`);
  assert.ok(scenesSeen.size >= 8, `Expected >=8 crime scenes across seeds, got ${scenesSeen.size}`);
  assert.ok(titlesSeen.size >= 40, `Expected >=40 distinct noir case titles across seeds, got ${titlesSeen.size}`);
  assert.ok(!titlesSeen.has('No Alibi After Midnight'), 'Misleading static title "No Alibi After Midnight" must not appear');
  assert.ok(!titlesSeen.has('The Dead Man’s Timepiece'), 'Misleading static title "The Dead Man’s Timepiece" must not appear');
  assert.ok(decisiveProofNamesSeen.size >= 15, `Expected >=15 distinct decisive proof items across seeds, got ${decisiveProofNamesSeen.size}`);
  assert.ok(redHerringNamesSeen.size >= 15, `Expected >=15 distinct red herring items across seeds, got ${redHerringNamesSeen.size}`);
  assert.ok(alibiBreakNamesSeen.size >= 4, `Expected >=4 distinct alibi-break formats across seeds, got ${alibiBreakNamesSeen.size}`);
  assert.ok(leadLoc1NamesSeen.size >= 8, `Expected >=8 distinct location-1 lead names across seeds, got ${leadLoc1NamesSeen.size}`);
  assert.ok(secretVenuesSeen.size >= 4, `Expected >=4 distinct compromising venues across seeds, got ${secretVenuesSeen.size}`);
  assert.ok(crimeTimesSeen.size >= 4, `Expected >=4 distinct crime times across seeds, got ${crimeTimesSeen.size}`);

  // Verify the decisiveProof from one game appears as a redHerring in another game for the same room
  let swappedRoleFound = false;
  for (const tracker of Object.values(perRoomRoleTracker)) {
    for (const itemName of tracker.decisive) {
      if (tracker.redHerring.has(itemName)) {
        swappedRoleFound = true;
        break;
      }
    }
    if (swappedRoleFound) break;
  }
  assert.ok(
    swappedRoleFound,
    'Expected at least one room item to serve as decisiveProof in one seed and redHerring in another seed'
  );

  // 5. Symmetric road travel distances, spacing, neighborhood grouping & indirect routing across all 54 locations
  const routeMinutesSeen = new Set<number>();
  const directEdgeMinutesSeen = new Set<number>();
  const locById = Object.fromEntries(MASTER_LOCATIONS.map((l) => [l.id, l]));

  // Check unified Industrial Docklands naming & neighborhood spacing
  for (let i = 0; i < MASTER_LOCATIONS.length; i++) {
    const a = MASTER_LOCATIONS[i];
    assert.notEqual(
      a.district,
      'Industrial Docks',
      `Location ${a.id} still uses legacy split district name "Industrial Docks"`
    );
    for (const neighborId of a.connectedRoads) {
      const b = locById[neighborId];
      assert.ok(b, `Unknown road neighbor "${neighborId}" referenced by ${a.id}`);
      assert.ok(
        b.connectedRoads.includes(a.id),
        `Asymmetric connectedRoads definition: ${a.id} -> ${neighborId} missing reverse`
      );
      directEdgeMinutesSeen.add(getDirectRoadMinutes(a, b));
    }

    for (let j = i + 1; j < MASTER_LOCATIONS.length; j++) {
      const b = MASTER_LOCATIONS[j];
      const dist = Math.hypot(a.mapCoords.x - b.mapCoords.x, a.mapCoords.y - b.mapCoords.y);
      assert.ok(
        dist >= 10.5,
        `Locations ${a.id} (${a.mapCoords.x},${a.mapCoords.y}) and ${b.id} (${b.mapCoords.x},${b.mapCoords.y}) are too close (${dist.toFixed(2)})`
      );
      const dy = Math.abs(a.mapCoords.y - b.mapCoords.y);
      const dx = Math.abs(a.mapCoords.x - b.mapCoords.x);
      assert.ok(
        !(dy <= 4 && dx < 12),
        `Locations ${a.id} and ${b.id} crowd on the same horizontal row (dx=${dx}, dy=${dy})`
      );
    }
  }

  for (let i = 0; i < MASTER_LOCATIONS.length; i++) {
    for (let j = i + 1; j < MASTER_LOCATIONS.length; j++) {
      const a = MASTER_LOCATIONS[i].id;
      const b = MASTER_LOCATIONS[j].id;
      const ab = calculateRoadTravelMinutes(MASTER_LOCATIONS, a, b);
      const ba = calculateRoadTravelMinutes(MASTER_LOCATIONS, b, a);
      assert.equal(ab, ba, `Asymmetric travel time between ${a} and ${b}: ${ab} vs ${ba}`);
      assert.ok(ab > 0, `Non-positive travel time between ${a} and ${b}: ${ab}`);
      routeMinutesSeen.add(ab);

      const pathAB = findShortestRoadPath(MASTER_LOCATIONS, a, b);
      const pathBA = findShortestRoadPath(MASTER_LOCATIONS, b, a);
      assert.deepEqual(
        pathAB.path,
        [...pathBA.path].reverse(),
        `Asymmetric shortest path nodes between ${a} and ${b}`
      );
      assert.equal(pathAB.totalMinutes, ab);
    }
  }

  assert.ok(
    directEdgeMinutesSeen.size >= 8,
    `Expected >=8 distinct direct road travel times across the city, got ${directEdgeMinutesSeen.size}`
  );
  assert.ok(
    routeMinutesSeen.size >= 15,
    `Expected >=15 distinct route travel times across the city, got ${routeMinutesSeen.size}`
  );

  // Verify indirect connection via an intermediate location (e.g., civic_cemetery -> bookshop passes through marigold_florist)
  const indirectSample = findShortestRoadPath(MASTER_LOCATIONS, 'civic_cemetery', 'bookshop');
  assert.ok(
    indirectSample.path.length >= 3,
    `Expected civic_cemetery -> bookshop to connect through an intermediate location, got ${indirectSample.path.join(' -> ')}`
  );

  // 6. Difficulty tiers (easy: 0-1, medium: 1-3, hard: 2-4 random extra liars across any living role)
  const difficultyRanges: Record<'easy' | 'medium' | 'hard', { min: number; max: number }> = {
    easy: { min: 0, max: 1 },
    medium: { min: 1, max: 3 },
    hard: { min: 2, max: 4 }
  };
  const difficultySeeds = testSeeds.slice(0, 24);
  const liarRolesSeen = new Set<string>();
  const liarKindsSeen = new Set<string>();
  let relocatedPortableCount = 0;
  let nonRelocatedPortableCount = 0;
  let cumbersomeCaseCount = 0;
  let culpritNotFirstAlphabeticalCount = 0;

  let sceneTraceForExtraLiarCount = 0;
  let totalExtraLiarsVerified = 0;

  for (const diff of ['easy', 'medium', 'hard'] as const) {
    const extraCountsSeen = new Set<number>();
    const range = difficultyRanges[diff];

    for (const s of difficultySeeds) {
      const c = generateCaseFromSeed(s, diff);
      assert.equal(c.difficulty, diff, `Seed ${s}: expected difficulty ${diff}, got ${c.difficulty}`);
      assert.equal(
        c.validationReport.passed,
        true,
        `Seed ${s} (${diff}) failed validation: ${c.validationReport.checks
          .filter((chk) => !chk.passed)
          .map((chk) => `${chk.id}: ${chk.detail}`)
          .join('; ')}`
      );
      assert.equal(c.culprit.isLying, true, `Seed ${s} (${diff}): culprit must be lying`);

      const allLiving = [c.culprit, ...c.suspects, ...c.witnesses];
      const extraLiars = allLiving.filter((ch) => ch.id !== c.culprit.id && ch.isLying);
      extraCountsSeen.add(extraLiars.length);
      assert.ok(
        extraLiars.length >= range.min && extraLiars.length <= range.max,
        `Seed ${s} (${diff}): expected ${range.min}-${range.max} extra liars, got ${extraLiars.length}`
      );

      const discoveredAllClues = Object.fromEntries(
        Object.entries(c.clues).map(([id, cl]) => [id, { ...cl, status: 'interpreted' as const }])
      );

      // Verify discoverable street gossip clues point to crime-scene hearsay sightings without leaking the true culprit
      for (const gossipClueId of ['clue_gossip_street_tip', 'clue_gossip_party_line'] as const) {
        const gClue = c.clues[gossipClueId];
        assert.ok(gClue, `Seed ${s} (${diff}): missing ${gossipClueId}`);
        assert.equal(gClue.supports, 'witness_account');
        assert.ok(
          gClue.relatedCharacterId && gClue.relatedCharacterId !== c.culprit.id,
          `Seed ${s} (${diff}): ${gossipClueId} must not freely target the culprit`
        );
        assert.ok(
          !/\b${c.culprit.name}\b/i.test(gClue.detailedInspection) && !gClue.detailedInspection.includes(c.culprit.name),
          `Seed ${s} (${diff}): ${gossipClueId} must never leak culprit name`
        );
        assert.ok(
          /heard someone saw|spotted/i.test(gClue.shortSummary + ' ' + gClue.detailedInspection),
          `Seed ${s} (${diff}): ${gossipClueId} must contain hearsay sighting phrasing`
        );
        const gPoi = (c.locations[gClue.locationFoundId]?.pointsOfInterest || []).find(
          (p) => p.clueRewardId === gossipClueId
        );
        assert.ok(gPoi, `Seed ${s} (${diff}): ${gossipClueId} must be attached to a reachable POI`);
      }

      // Verify witness & corroborator hearsay topics report someone saw a named person at/outside crime scene (never culprit)
      const primaryWit = c.witnesses.find((w) => w.isPrimaryCast && w.role === 'witness')!;
      const witHearsay = (c.dialogueMap[primaryWit.id] || []).find((t) => t.id === `topic_${primaryWit.id}_hearsay`);
      const corrChar = c.witnesses.find((w) => w.role === 'corroborator')!;
      const corrGossip = (c.dialogueMap[corrChar.id] || []).find((t) => t.id === 'topic_corroborator_gossip');
      assert.ok(witHearsay && witHearsay.unlocked, `Seed ${s} (${diff}): witness hearsay topic missing or locked`);
      assert.ok(corrGossip && corrGossip.unlocked, `Seed ${s} (${diff}): corroborator gossip topic missing or locked`);
      assert.ok(
        /saw|spotted/i.test(witHearsay.response) && !witHearsay.response.includes(c.culprit.name),
        `Seed ${s} (${diff}): witness hearsay must reference a sighting and not name culprit`
      );
      assert.ok(
        /saw|spotted/i.test(corrGossip.response) && !corrGossip.response.includes(c.culprit.name),
        `Seed ${s} (${diff}): corroborator gossip must reference a sighting and not name culprit`
      );

      const seenLiarMotiveTitles = new Set<string>();
      const seenConfessionExcuses = new Set<string>();

      for (const liar of extraLiars) {
        totalExtraLiarsVerified++;
        liarRolesSeen.add(liar.role);
        if (liar.characterKind) liarKindsSeen.add(liar.characterKind);

        const liarTopics = c.dialogueMap[liar.id] || [];
        const contraTopics = liarTopics.filter((t) => t.revealsContradiction);
        assert.ok(
          contraTopics.length >= 1,
          `Seed ${s} (${diff}): extra liar ${liar.id} (${liar.role}/${liar.characterKind || 'core'}) must have >=1 revealsContradiction topic`
        );
        for (const ct of contraTopics) {
          assert.ok(
            !/side wager|locker IOU|late family gossip/i.test(ct.response),
            `Seed ${s} (${diff}): extra liar ${liar.id} still uses generic boilerplate lie reason: "${ct.response}"`
          );
          seenConfessionExcuses.add(ct.response);
        }

        // Verify extra liar has a unique non-culprit motive clue + topic
        const liarMotiveClue = c.clues[`clue_liar_motive_${liar.id}`];
        assert.ok(liarMotiveClue, `Seed ${s} (${diff}): extra liar ${liar.id} missing motive clue`);
        assert.equal(liarMotiveClue.supports, 'motive_hook');
        assert.equal(liarMotiveClue.relatedCharacterId, liar.id);
        assert.ok(
          c.locations[liarMotiveClue.locationFoundId]?.pointsOfInterest.some((p) => p.clueRewardId === liarMotiveClue.id),
          `Seed ${s} (${diff}): ${liarMotiveClue.id} must sit at a reachable POI`
        );
        const liarMotiveTopic = liarTopics.find((t) => t.id === `topic_${liar.id}_motive`);
        assert.ok(liarMotiveTopic && !liarMotiveTopic.unlocked, `Seed ${s} (${diff}): topic_${liar.id}_motive missing or unlocked`);
        assert.ok(
          !liarMotiveTopic.title.includes(c.motive.name),
          `Seed ${s} (${diff}): extra liar ${liar.id} motive (${liarMotiveTopic.title}) must differ from culprit motive (${c.motive.name})`
        );
        seenLiarMotiveTitles.add(liarMotiveTopic.title);

        // Verify extra liar has an initialed physical trace clue + topic
        const liarTraceClue = c.clues[`clue_liar_trace_${liar.id}`];
        assert.ok(liarTraceClue, `Seed ${s} (${diff}): extra liar ${liar.id} missing initialed trace clue`);
        assert.equal(liarTraceClue.relatedCharacterId, liar.id);
        const nameParts = liar.name.trim().split(/\s+/);
        const expectedInitials = `${nameParts[0]?.[0] || 'M'}.${nameParts[nameParts.length - 1]?.[0] || 'N'}`;
        assert.ok(
          liarTraceClue.shortSummary.includes(`"${expectedInitials}"`) &&
            liarTraceClue.detailedInspection.includes(`"${expectedInitials}"`),
          `Seed ${s} (${diff}): ${liarTraceClue.id} missing initials "${expectedInitials}"`
        );
        assert.ok(
          c.locations[liarTraceClue.locationFoundId]?.pointsOfInterest.some((p) => p.clueRewardId === liarTraceClue.id),
          `Seed ${s} (${diff}): ${liarTraceClue.id} must sit at a reachable POI`
        );
        if (liarTraceClue.locationFoundId === c.crimeSceneLocationId) {
          sceneTraceForExtraLiarCount++;
        }
        const liarTraceTopic = liarTopics.find((t) => t.id === `topic_${liar.id}_trace`);
        assert.ok(
          liarTraceTopic &&
            !liarTraceTopic.unlocked &&
            liarTraceTopic.requiresClueId === liarTraceClue.id &&
            (liarTraceTopic.requiresAllFactIds?.includes(`heard_${liar.id}_whereabouts`) ?? false),
          `Seed ${s} (${diff}): topic_${liar.id}_trace must start locked behind clue + heard whereabouts`
        );

        const linkedTopicWithClues = contraTopics.find(
          (t) => getLinkedClueIdsForTopic(t, discoveredAllClues).length > 0
        );
        assert.ok(
          linkedTopicWithClues,
          `Seed ${s} (${diff}): extra liar ${liar.id} contradiction topic must link to a discoverable clue`
        );

        const contradictionClueId = getLinkedClueIdsForTopic(linkedTopicWithClues, discoveredAllClues)[0];
        const contradictionClue = discoveredAllClues[contradictionClueId];
        assert.ok(contradictionClue, `Missing contradiction clue ${contradictionClueId}`);

        const gatedLinked = getLinkedTopicIdsForClue(liar, liarTopics, contradictionClue, true, false);
        assert.equal(
          gatedLinked.includes(linkedTopicWithClues.id),
          false,
          `Seed ${s} (${diff}): extra liar ${liar.id} contradiction topic must not sync before their whereabouts are heard`
        );

        const unlockedLinked = getLinkedTopicIdsForClue(liar, liarTopics, contradictionClue, true, true);
        assert.ok(
          unlockedLinked.includes(linkedTopicWithClues.id),
          `Seed ${s} (${diff}): presenting ${contradictionClueId} after whereabouts must sync to ${linkedTopicWithClues.id}`
        );
      }

      if (extraLiars.length >= 2) {
        assert.equal(
          seenLiarMotiveTitles.size,
          extraLiars.length,
          `Seed ${s} (${diff}): each extra liar must get a distinct motive`
        );
        assert.equal(
          seenConfessionExcuses.size,
          extraLiars.length,
          `Seed ${s} (${diff}): each extra liar must have a distinct motive-tied confession excuse`
        );
      }

      if (diff === 'easy') {
        if (c.weapon.portability === 'Cumbersome') {
          cumbersomeCaseCount++;
          assert.equal(
            c.hiddenSolution.weaponRelocated,
            false,
            `Seed ${s}: Cumbersome weapon ${c.weapon.id} must stay at the crime scene`
          );
          assert.equal(
            c.clues[`clue_loc_weapon_${c.crimeSceneLocationId}`]?.relatedWeaponId,
            c.weapon.id,
            `Seed ${s}: Cumbersome murder weapon must be the natural weapon found at the crime scene`
          );
        } else if (c.hiddenSolution.weaponRelocated) {
          relocatedPortableCount++;
          assert.ok(
            c.hiddenSolution.weaponHostLocationId &&
              c.hiddenSolution.weaponHostLocationId !== c.crimeSceneLocationId,
            `Seed ${s}: relocated weapon must sit at a non-scene venue`
          );
          assert.equal(
            c.clues['clue_weapon_transfer']?.locationFoundId,
            c.hiddenSolution.weaponHostLocationId,
            `Seed ${s}: clue_weapon_transfer must be at weaponHostLocationId`
          );
          assert.notEqual(
            c.clues[`clue_loc_weapon_${c.crimeSceneLocationId}`]?.relatedWeaponId,
            c.weapon.id,
            `Seed ${s}: crime scene must hold a distinct innocent natural weapon when murder weapon is relocated`
          );
        } else {
          nonRelocatedPortableCount++;
        }

        const fullBoardPeople = getDiscoveredBoardPeople({
          livingCharacters: allLiving,
          visitedLocationIds: Object.keys(c.locations),
          interviewStates: c.interviewStates,
          discoveredClues: Object.values(discoveredAllClues),
          accusedCulpritId: null
        });
        for (let idx = 1; idx < fullBoardPeople.length; idx++) {
          assert.ok(
            fullBoardPeople[idx - 1].name.localeCompare(fullBoardPeople[idx].name) <= 0,
            `Seed ${s}: board people not sorted alphabetically (${fullBoardPeople[idx - 1].name} vs ${fullBoardPeople[idx].name})`
          );
        }
        if (fullBoardPeople.length > 0 && fullBoardPeople[0].id !== c.culprit.id) {
          culpritNotFirstAlphabeticalCount++;
        }
      }
    }

    assert.ok(
      extraCountsSeen.size >= 2,
      `Expected varied random extra liar counts for difficulty ${diff}, only saw [${Array.from(extraCountsSeen).join(', ')}]`
    );
  }

  assert.ok(
    totalExtraLiarsVerified > 0 && sceneTraceForExtraLiarCount >= 10,
    `Expected extra liar initialed traces to also turn up at the crime scene, got ${sceneTraceForExtraLiarCount}/${totalExtraLiarsVerified}`
  );
  assert.ok(
    liarKindsSeen.has('staff'),
    `Expected venue staff to appear among random extra liars across difficulties, saw kinds: [${Array.from(liarKindsSeen).join(', ')}]`
  );
  assert.ok(
    liarKindsSeen.has('family_visitor'),
    `Expected bystander family visitors to appear among random extra liars across difficulties, saw kinds: [${Array.from(liarKindsSeen).join(', ')}]`
  );
  assert.ok(
    liarRolesSeen.has('suspect') && liarRolesSeen.has('witness') && liarRolesSeen.has('corroborator'),
    `Expected suspects, witnesses, and corroborators to appear among extra liars, saw roles: [${Array.from(liarRolesSeen).join(', ')}]`
  );
  assert.ok(relocatedPortableCount >= 8, `Expected multiple relocated portable weapon cases, got ${relocatedPortableCount}`);
  assert.ok(
    nonRelocatedPortableCount + cumbersomeCaseCount >= 2,
    `Expected some non-relocated weapon cases too, got portableNonRelocated=${nonRelocatedPortableCount}, cumbersome=${cumbersomeCaseCount}`
  );
  assert.ok(
    culpritNotFirstAlphabeticalCount >= 10,
    `Expected alphabetical sorting to place culprit outside leftmost slot in most cases, got ${culpritNotFirstAlphabeticalCount}`
  );

  // Universal 117-Character Cast Distribution & Workplace Absence Note Verification (120 seeds)
  const victimKindsSeen = new Set<string>();
  const culpritKindsSeen = new Set<string>();
  const suspectKindsSeen = new Set<string>();
  const corroboratorKindsSeen = new Set<string>();
  const witnessKindsSeen = new Set<string>();
  const allVictimsPool = new Set<string>();
  const allCulpritsPool = new Set<string>();
  let victimAbsenceCheckedCount = 0;
  let promotedBoardCheckedCount = 0;

  for (let i = 0; i < 120; i++) {
    const seed = `universal-cast-${i}`;
    const c = generateCaseFromSeed(seed, i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard');
    assert.equal(
      c.validationReport.passed,
      true,
      `Universal cast seed ${seed} failed validation: ${c.validationReport.checks
        .filter((chk) => !chk.passed)
        .map((chk) => `${chk.id}: ${chk.detail}`)
        .join('; ')}`
    );

    allVictimsPool.add(c.victim.id);
    allCulpritsPool.add(c.culprit.id);
    victimKindsSeen.add(c.victim.characterKind || 'core');
    culpritKindsSeen.add(c.culprit.characterKind || 'core');
    for (const sp of c.suspects) suspectKindsSeen.add(sp.characterKind || 'core');
    const primaryCorr = c.witnesses.find((w) => w.isPrimaryCast && w.role === 'corroborator');
    const primaryWit = c.witnesses.find((w) => w.isPrimaryCast && w.role === 'witness');
    if (primaryCorr) corroboratorKindsSeen.add(primaryCorr.characterKind || 'core');
    if (primaryWit) witnessKindsSeen.add(primaryWit.characterKind || 'core');

    // Verify dynamic victim topic never leaks "tonight", "warrant", or "used the"
    const victimTopic = (c.dialogueMap[c.culprit.id] || []).find((t) => t.id === 'topic_victim');
    assert.ok(victimTopic, `Seed ${seed}: culprit missing topic_victim`);
    assert.ok(
      !/\btonight\b|warrant|used the/i.test(`${victimTopic.prompt} ${victimTopic.response}`),
      `Seed ${seed}: dynamic topic_victim leaked forbidden phrasing: "${victimTopic.response}"`
    );

    // Verify promoted staff / family visitors appear on the Case Board when their venue is visited
    const promotedStaffOrVisitor = [c.culprit, ...c.suspects, ...c.witnesses.filter((w) => w.isPrimaryCast)].find(
      (ch) => ch.characterKind === 'staff' || ch.characterKind === 'family_visitor'
    );
    if (promotedStaffOrVisitor) {
      promotedBoardCheckedCount++;
      const boardPeople = getDiscoveredBoardPeople({
        livingCharacters: [c.culprit, ...c.suspects, ...c.witnesses],
        visitedLocationIds: [promotedStaffOrVisitor.currentLocationId],
        interviewStates: c.interviewStates,
        discoveredClues: [],
        accusedCulpritId: null
      });
      assert.ok(
        boardPeople.some((p) => p.id === promotedStaffOrVisitor.id),
        `Seed ${seed}: promoted ${promotedStaffOrVisitor.characterKind} (${promotedStaffOrVisitor.name}) must appear on Case Board when their venue is visited`
      );
    }

    // Verify workplace absence note + unattended-post POI when regular venue worker is cast as victim
    if (c.victim.assignedLocationId) {
      victimAbsenceCheckedCount++;
      const vHome = c.locations[c.victim.assignedLocationId];
      assert.ok(vHome, `Seed ${seed}: victim ${c.victim.name}'s workplace ${c.victim.assignedLocationId} must be present on active map`);
      const notice = (vHome.absenceNotices || []).find((n) => n.characterId === c.victim.id);
      assert.ok(notice, `Seed ${seed}: workplace ${vHome.id} must display a WorkplaceAbsenceNotice for deceased worker ${c.victim.name}`);
      assert.ok(notice.clueId && c.clues[notice.clueId], `Seed ${seed}: victim absence notice must reference a valid clue`);
      assert.ok(
        vHome.pointsOfInterest.some((p) => p.clueRewardId === notice.clueId),
        `Seed ${seed}: victim absence clue ${notice.clueId} must be attached to a POI at ${vHome.id}`
      );
    }
  }

  for (const [label, kindSet] of [
    ['victim', victimKindsSeen],
    ['culprit', culpritKindsSeen],
    ['suspect', suspectKindsSeen],
    ['corroborator', corroboratorKindsSeen],
    ['primary witness', witnessKindsSeen]
  ] as const) {
    assert.ok(
      kindSet.has('core') && kindSet.has('staff') && kindSet.has('family_visitor'),
      `Expected core, staff, and family_visitor all to appear as ${label} across 120 seeds; saw [${Array.from(kindSet).join(', ')}]`
    );
  }
  assert.ok(
    allVictimsPool.size >= 45 && allCulpritsPool.size >= 45,
    `Expected broad 117-character diversity across 120 seeds, got ${allVictimsPool.size} unique victims and ${allCulpritsPool.size} unique culprits`
  );
  assert.ok(victimAbsenceCheckedCount >= 30, `Expected >=30 victim workplace absence checks, got ${victimAbsenceCheckedCount}`);
  assert.ok(promotedBoardCheckedCount >= 80, `Expected >=80 promoted board parity checks, got ${promotedBoardCheckedCount}`);

  // 7. Bottleneck Removal & After-Hours Keyholder Crime Scene Coverage (350 seeds)
  const auditScenesSeen = new Set<string>();
  const auditWeaponsSeen = new Set<string>();
  const closedKeyholderScenesSeen = new Set<string>();
  let closedKeyholderCaseCount = 0;

  for (let i = 0; i < 350; i++) {
    const seed = `bottleneck-audit-${i}`;
    const c = generateCaseFromSeed(seed, i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard');
    assert.equal(
      c.validationReport.passed,
      true,
      `Audit seed ${seed} failed validation: ${c.validationReport.checks
        .filter((chk) => !chk.passed)
        .map((chk) => `${chk.id}: ${chk.detail}`)
        .join('; ')}`
    );

    auditScenesSeen.add(c.crimeSceneLocationId);
    auditWeaponsSeen.add(c.weapon.id);

    const sceneLoc = MASTER_LOCATIONS.find((l) => l.id === c.crimeSceneLocationId)!;
    const [ch, cm] = c.crimeTime.split(':').map(Number);
    const crimeAbs = ch * 60 + cm;
    const sceneOpenAtCrime = isLocationOpenAt(sceneLoc.openingHours, crimeAbs);

    const culpritTopicsAll = c.dialogueMap[c.culprit.id] || [];
    for (const ct of culpritTopicsAll) {
      assert.ok(
        !/\btonight\b|warrant|used the/i.test(`${ct.prompt} ${ct.response}`),
        `Audit seed ${seed}: culprit topic ${ct.id} leaked forbidden phrasing: "${ct.response}"`
      );
    }

    if (!sceneOpenAtCrime) {
      closedKeyholderCaseCount++;
      closedKeyholderScenesSeen.add(sceneLoc.id);
      assert.ok(
        c.victim.assignedLocationId === sceneLoc.id || c.culprit.assignedLocationId === sceneLoc.id,
        `Audit seed ${seed}: closed crime scene ${sceneLoc.id} at ${c.crimeTime} must involve an assigned keyholder worker (victim=${c.victim.assignedLocationId}, culprit=${c.culprit.assignedLocationId})`
      );
      assert.ok(
        /staff keyholder/i.test(c.dispatchMemo),
        `Audit seed ${seed}: closed keyholder crime scene dispatch must note staff keyholder access`
      );
      if (c.culprit.assignedLocationId === sceneLoc.id) {
        const sceneTopic = culpritTopicsAll.find((t) => t.id === 'topic_crime_scene');
        assert.ok(
          sceneTopic && !/took last night off/i.test(sceneTopic.response),
          `Audit seed ${seed}: culprit working at closed daytime scene ${sceneLoc.id} must not claim "took last night off": "${sceneTopic?.response}"`
        );
      }
    }
  }

  assert.equal(
    auditWeaponsSeen.size,
    MASTER_WEAPONS.length,
    `Expected all ${MASTER_WEAPONS.length} weapons to appear across 350 seeds, got ${auditWeaponsSeen.size} (missing: ${MASTER_WEAPONS.filter((w) => !auditWeaponsSeen.has(w.id)).map((w) => w.id).join(', ')})`
  );
  assert.ok(
    auditScenesSeen.size >= 48,
    `Expected >=48 non-agency crime-scene locations across 350 seeds, got ${auditScenesSeen.size} (missing: ${MASTER_LOCATIONS.filter((l) => l.id !== 'agency' && !auditScenesSeen.has(l.id)).map((l) => l.id).join(', ')})`
  );
  assert.ok(
    closedKeyholderCaseCount >= 30 && closedKeyholderScenesSeen.size >= 12,
    `Expected closed-hours keyholder crime scenes across daytime venues, got ${closedKeyholderCaseCount} cases across ${closedKeyholderScenesSeen.size} venues`
  );

  console.log(
    `All assertions passed! Tested ${testSeeds.length} core seeds + 120 universal-cast seeds + 350 bottleneck-audit seeds (${auditScenesSeen.size}/53 scenes, ${closedKeyholderCaseCount} after-hours keyholder cases across ${closedKeyholderScenesSeen.size} closed venues, ${auditWeaponsSeen.size}/30 weapons, ${MASTER_CHARACTERS.length} characters).`
  );
}

runSeededEngineTests();
