/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CaseInstance,
  CharacterCaseInstance,
  ClueInstance,
  IndictmentSubmission,
  InterviewState,
  LocationCaseInstance,
  MethodTemplate
} from '../types/game';
import { MASTER_WEAPONS } from './templates';

export type BoardNodeKey =
  | `loc:${string}`
  | `char:${string}`
  | `weapon:${string}`
  | `clue:${string}`
  | 'motive:active';

export type BoardEdgeKind = 'theory' | 'clue' | 'tie';

export interface BoardStringEdge {
  id: string;
  from: BoardNodeKey;
  to: BoardNodeKey;
  kind: BoardEdgeKind;
  label: string;
}

/**
 * Determines whether a discovered clue's link to `relatedCharacterId` is already
 * known to the detective (without spoiling hidden engine culprit links prematurely).
 */
export function isClueCharacterLinkVisible(
  clue: ClueInstance,
  char: CharacterCaseInstance | undefined
): boolean {
  if (!char || clue.status === 'undiscovered') return false;
  if (clue.relatedCharacterId !== char.id) return false;
  if (clue.status === 'corroborated') return true;
  if (clue.supports === 'alibi_break' || clue.supports === 'weapon_transfer') {
    return false;
  }
  if (clue.status === 'interpreted' && Boolean(clue.requiresContextToInterpret)) {
    return true;
  }
  const haystack = `${clue.name} ${clue.shortSummary} ${clue.detailedInspection} ${clue.interpretationNote || ''}`.toLowerCase();
  return haystack.includes(char.name.toLowerCase());
}

export function getDiscoveredBoardPeople(params: {
  livingCharacters: CharacterCaseInstance[];
  visitedLocationIds: string[];
  interviewStates: Record<string, InterviewState>;
  discoveredClues: ClueInstance[];
  accusedCulpritId: string | null;
}): CharacterCaseInstance[] {
  const {
    livingCharacters,
    visitedLocationIds,
    interviewStates,
    discoveredClues,
    accusedCulpritId
  } = params;
  const visitedSet = new Set(visitedLocationIds);
  const byId = Object.fromEntries(livingCharacters.map((c) => [c.id, c]));

  const clueLinkedCharIds = new Set<string>();
  for (const clue of discoveredClues) {
    if (clue.relatedCharacterId) {
      const target = byId[clue.relatedCharacterId];
      if (isClueCharacterLinkVisible(clue, target)) {
        clueLinkedCharIds.add(clue.relatedCharacterId);
      }
    }
  }

  return livingCharacters
    .filter((char) => {
      const iState = interviewStates[char.id];
      const hasInteracted =
        (iState?.statementsHeard?.length ?? 0) > 0 ||
        (iState?.evidencePresented?.length ?? 0) > 0;
      const isCoreCast =
        char.isPrimaryCast ??
        (char.characterKind !== 'staff' && char.characterKind !== 'family_visitor');

      if (char.id === accusedCulpritId) return true;
      if (hasInteracted) return true;
      if (clueLinkedCharIds.has(char.id)) return true;
      if (isCoreCast && visitedSet.has(char.currentLocationId)) return true;
      return false;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDiscoveredBoardWeapons(params: {
  caseWeapons: MethodTemplate[];
  discoveredClues: ClueInstance[];
  selectedWeaponId: string | null;
}): { weapon: MethodTemplate; foundAtLocationIds: string[] }[] {
  const { caseWeapons, discoveredClues, selectedWeaponId } = params;
  const weaponLookup = new Map<string, MethodTemplate>();
  for (const w of MASTER_WEAPONS) weaponLookup.set(w.id, w);
  for (const w of caseWeapons) weaponLookup.set(w.id, w);

  const locsByWeapon = new Map<string, Set<string>>();

  for (const clue of discoveredClues) {
    if (clue.status === 'noticed' || !clue.relatedWeaponId) continue;
    if (!locsByWeapon.has(clue.relatedWeaponId)) {
      locsByWeapon.set(clue.relatedWeaponId, new Set());
    }
    if (clue.locationFoundId) {
      locsByWeapon.get(clue.relatedWeaponId)!.add(clue.locationFoundId);
    }
  }

  if (selectedWeaponId && !locsByWeapon.has(selectedWeaponId)) {
    locsByWeapon.set(selectedWeaponId, new Set());
  }

  const results: { weapon: MethodTemplate; foundAtLocationIds: string[] }[] = [];
  for (const [wId, locSet] of locsByWeapon.entries()) {
    const w = weaponLookup.get(wId);
    if (w) {
      results.push({
        weapon: w,
        foundAtLocationIds: Array.from(locSet)
      });
    }
  }
  return results;
}

export function getRelevantBoardClues(
  discoveredClues: ClueInstance[],
  filter: 'all' | 'leads' | 'weapons' = 'all'
): ClueInstance[] {
  const relevanceRank = (c: ClueInstance): number => {
    if (c.status === 'corroborated') return 0;
    switch (c.supports) {
      case 'culprit':
      case 'alibi_break':
        return 1;
      case 'motive':
      case 'motive_hook':
        return 2;
      case 'weapon':
      case 'weapon_transfer':
        return 3;
      case 'red_herring':
      case 'corroboration':
      case 'witness_account':
        return 4;
      case 'location_lead':
        return 5;
      case 'roster':
      case 'suspect_alibi':
        return 6;
      default:
        return 7;
    }
  };

  return discoveredClues
    .filter((c) => c.status !== 'undiscovered')
    .filter((c) => {
      if (filter === 'weapons') {
        return (
          Boolean(c.relatedWeaponId) ||
          c.supports === 'weapon' ||
          c.supports === 'weapon_transfer'
        );
      }
      if (filter === 'leads') {
        return c.supports !== 'ambient';
      }
      return true;
    })
    .sort((a, b) => relevanceRank(a) - relevanceRank(b));
}

export type BoardStringMode = 'focused' | 'theory' | 'all';

/**
 * Returns hidden node keys minus any nodes currently pinned into the active
 * indictment submission so the active theory can never point to invisible nodes.
 */
export function getEffectiveHiddenNodeKeys(
  hiddenNodeKeys: ReadonlySet<BoardNodeKey>,
  submission: IndictmentSubmission
): Set<BoardNodeKey> {
  const effective = new Set<BoardNodeKey>(hiddenNodeKeys);
  if (submission.accusedCulpritId) {
    effective.delete(`char:${submission.accusedCulpritId}`);
  }
  if (submission.selectedWeaponId) {
    effective.delete(`weapon:${submission.selectedWeaponId}`);
  }
  if (submission.selectedDecisiveProofId) {
    effective.delete(`clue:${submission.selectedDecisiveProofId}`);
  }
  if (submission.selectedMotiveClueId) {
    effective.delete(`clue:${submission.selectedMotiveClueId}`);
  }
  return effective;
}

/**
 * Filters board string edges according to the active focus mode:
 * - 'focused': renders active crimson theory cords plus edges incident to focused/hovered node
 * - 'theory': renders only crimson theory cords
 * - 'all': renders every active edge on the board
 */
export function filterBoardEdgesForMode(
  edges: BoardStringEdge[],
  mode: BoardStringMode,
  activeHighlightNode: BoardNodeKey | null
): BoardStringEdge[] {
  if (mode === 'all') return edges;
  if (mode === 'theory') {
    return edges.filter((edge) => edge.kind === 'theory');
  }
  return edges.filter(
    (edge) =>
      edge.kind === 'theory' ||
      (activeHighlightNode !== null &&
        (edge.from === activeHighlightNode || edge.to === activeHighlightNode))
  );
}

export function buildBoardStringEdges(params: {
  activeCase: CaseInstance;
  locations: Record<string, LocationCaseInstance>;
  boardPeople: CharacterCaseInstance[];
  boardWeapons: { weapon: MethodTemplate; foundAtLocationIds: string[] }[];
  boardClues: ClueInstance[];
  submission: IndictmentSubmission;
  hiddenNodeKeys?: ReadonlySet<BoardNodeKey>;
}): BoardStringEdge[] {
  const {
    locations,
    boardPeople,
    boardWeapons,
    boardClues,
    submission,
    hiddenNodeKeys
  } = params;

  const edges: BoardStringEdge[] = [];
  const seenEdgeIds = new Set<string>();
  const addEdge = (
    from: BoardNodeKey,
    to: BoardNodeKey,
    kind: BoardEdgeKind,
    label: string
  ) => {
    if (from === to) return;
    if (hiddenNodeKeys && (hiddenNodeKeys.has(from) || hiddenNodeKeys.has(to))) {
      return;
    }
    const canonical =
      from < to ? `${kind}:${from}->${to}` : `${kind}:${to}->${from}`;
    if (seenEdgeIds.has(canonical)) return;
    seenEdgeIds.add(canonical);
    edges.push({ id: canonical, from, to, kind, label });
  };

  const peopleById = Object.fromEntries(boardPeople.map((c) => [c.id, c]));
  const weaponIds = new Set(boardWeapons.map((bw) => bw.weapon.id));
  const discoveredLocIds = new Set(
    Object.values(locations)
      .filter((l) => l.discovered)
      .map((l) => l.id)
  );

  // 1. People -> Locations & People <-> People known relationships
  for (let i = 0; i < boardPeople.length; i++) {
    const person = boardPeople[i];
    if (discoveredLocIds.has(person.currentLocationId)) {
      addEdge(
        `char:${person.id}`,
        `loc:${person.currentLocationId}`,
        'tie',
        `${person.name} located at ${locations[person.currentLocationId]?.name || person.currentLocationId}`
      );
    }

    for (const rel of person.relationships || []) {
      if (peopleById[rel.characterId]) {
        addEdge(
          `char:${person.id}`,
          `char:${rel.characterId}`,
          'tie',
          `${person.name} ↔ ${peopleById[rel.characterId].name} (${rel.relationshipType})`
        );
      }
    }
  }

  // Link corroborator <-> red herring once a corroboration clue is corroborated
  const corrClue = boardClues.find(
    (c) => c.supports === 'corroboration' && c.status === 'corroborated'
  );
  if (corrClue) {
    const corr = boardPeople.find((c) => c.role === 'corroborator');
    const rh = boardPeople.find((c) => c.isRedHerring);
    if (corr && rh) {
      addEdge(
        `char:${corr.id}`,
        `char:${rh.id}`,
        'tie',
        `${corr.name} corroborated ${rh.name}'s alibi`
      );
    }
  }

  // 2. Discovered Weapons -> Locations where found
  for (const { weapon, foundAtLocationIds } of boardWeapons) {
    for (const locId of foundAtLocationIds) {
      if (discoveredLocIds.has(locId)) {
        addEdge(
          `weapon:${weapon.id}`,
          `loc:${locId}`,
          'tie',
          `${weapon.name} found at ${locations[locId]?.name || locId}`
        );
      }
    }
  }

  // 3. Clue Cards -> Locations, Weapons, and People they refer to
  for (const clue of boardClues) {
    const clueKey: BoardNodeKey = `clue:${clue.id}`;
    if (clue.locationFoundId && discoveredLocIds.has(clue.locationFoundId)) {
      addEdge(
        clueKey,
        `loc:${clue.locationFoundId}`,
        'clue',
        `${clue.name} recovered at ${locations[clue.locationFoundId]?.name || clue.locationFoundId}`
      );
    }
    if (clue.leadsToLocationId && discoveredLocIds.has(clue.leadsToLocationId)) {
      addEdge(
        clueKey,
        `loc:${clue.leadsToLocationId}`,
        'clue',
        `${clue.name} points to ${locations[clue.leadsToLocationId]?.name || clue.leadsToLocationId}`
      );
    }
    if (
      clue.status !== 'noticed' &&
      clue.relatedWeaponId &&
      weaponIds.has(clue.relatedWeaponId)
    ) {
      addEdge(
        clueKey,
        `weapon:${clue.relatedWeaponId}`,
        'clue',
        `${clue.name} refers to weapon`
      );
    }
    if (clue.relatedCharacterId && peopleById[clue.relatedCharacterId]) {
      const targetChar = peopleById[clue.relatedCharacterId];
      if (isClueCharacterLinkVisible(clue, targetChar)) {
        addEdge(
          clueKey,
          `char:${targetChar.id}`,
          'clue',
          `${clue.name} refers to ${targetChar.name}`
        );
      }
    }
  }

  // 4. Active Red-String Indictment Theory Links
  const accusedId = submission.accusedCulpritId;
  if (accusedId && peopleById[accusedId]) {
    if (submission.selectedWeaponId && weaponIds.has(submission.selectedWeaponId)) {
      addEdge(
        `char:${accusedId}`,
        `weapon:${submission.selectedWeaponId}`,
        'theory',
        'Accused suspect ↔ Pinned murder weapon'
      );
    }
    if (submission.selectedMotiveId) {
      addEdge(
        `char:${accusedId}`,
        'motive:active',
        'theory',
        'Accused suspect ↔ Pinned motive'
      );
    }
    if (
      submission.selectedMotiveClueId &&
      boardClues.some((c) => c.id === submission.selectedMotiveClueId)
    ) {
      addEdge(
        `char:${accusedId}`,
        `clue:${submission.selectedMotiveClueId}`,
        'theory',
        'Accused suspect ↔ Pinned motive clue'
      );
    }
    if (
      submission.selectedDecisiveProofId &&
      boardClues.some((c) => c.id === submission.selectedDecisiveProofId)
    ) {
      addEdge(
        `char:${accusedId}`,
        `clue:${submission.selectedDecisiveProofId}`,
        'theory',
        'Accused suspect ↔ Pinned decisive proof'
      );
    }
  }

  return edges;
}
