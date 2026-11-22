/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CharacterCaseInstance,
  CharacterScheduleWindow,
  ClueInstance,
  DialogueTopic,
  InterviewState,
  LocationCaseInstance
} from '../types/game';
import { isCharacterPresentAt, isLocationOpenAt } from './timeUtils';

export interface LocationMapStatus {
  visited: boolean;
  isCurrent: boolean;
  isOpen: boolean;
  hasUpdatedClue: boolean;
  hasUpdatedSuspect: boolean;
  isUpdated: boolean;
}

export type CharacterInterviewStatus = 'not_interviewed' | 'interviewed' | 'updated';

export function getUnlockedTopicIdsForCharacter(
  char: CharacterCaseInstance,
  charTopics: DialogueTopic[],
  interviewState: InterviewState | undefined,
  clues: Record<string, ClueInstance>,
  revealedFacts: string[]
): string[] {
  const knownFacts = new Set([
    ...revealedFacts,
    ...(interviewState?.revealedFacts || [])
  ]);
  const discoveredClueIds = new Set(
    Object.values(clues)
      .filter((c) => c.status !== 'undiscovered')
      .map((c) => c.id)
  );
  const unlockedSet = new Set(interviewState?.topicsUnlocked || []);
  const ids = [`topic_${char.id}_whereabouts`];

  for (const t of charTopics) {
    if (t.requiresAllFactIds && !t.requiresAllFactIds.every((f) => knownFacts.has(f))) {
      continue;
    }
    const isUnlocked =
      t.unlocked ||
      unlockedSet.has(t.id) ||
      Boolean(t.requiresClueId && discoveredClueIds.has(t.requiresClueId)) ||
      Boolean(t.requiresFactId && knownFacts.has(t.requiresFactId)) ||
      Boolean(t.requiresAnyClueIds?.some((id) => discoveredClueIds.has(id))) ||
      Boolean(t.requiresAnyFactIds?.some((id) => knownFacts.has(id)));
    if (isUnlocked && !ids.includes(t.id)) {
      ids.push(t.id);
    }
  }

  return ids;
}

export function getCharactersPresentAtLocation(
  loc: LocationCaseInstance,
  livingCharacters: CharacterCaseInstance[],
  schedules: Record<string, CharacterScheduleWindow[]> | undefined,
  investigationMinutes: number
): CharacterCaseInstance[] {
  return livingCharacters.filter((c) => {
    if (schedules && schedules[c.id]) {
      return isCharacterPresentAt(
        schedules,
        c.id,
        loc.id,
        investigationMinutes,
        loc.openingHours,
        'investigation_day'
      );
    }
    return c.currentLocationId === loc.id;
  });
}

export function getLocationMapStatus(
  loc: LocationCaseInstance,
  params: {
    currentLocationId: string;
    visitedLocationIds: string[];
    livingCharacters: CharacterCaseInstance[];
    dialogueMap: Record<string, DialogueTopic[]>;
    interviewStates: Record<string, InterviewState>;
    clues: Record<string, ClueInstance>;
    revealedFacts: string[];
    seenUnlockedTopicsByChar: Record<string, string[]>;
    schedules?: Record<string, CharacterScheduleWindow[]>;
    investigationMinutes: number;
  }
): LocationMapStatus {
  const {
    currentLocationId,
    visitedLocationIds,
    livingCharacters,
    dialogueMap,
    interviewStates,
    clues,
    revealedFacts,
    seenUnlockedTopicsByChar,
    schedules,
    investigationMinutes
  } = params;

  const isCurrent = loc.id === currentLocationId;
  const visited = isCurrent || visitedLocationIds.includes(loc.id);
  const isOpen = isLocationOpenAt(loc.openingHours, investigationMinutes);

  if (!visited) {
    return {
      visited: false,
      isCurrent: false,
      isOpen,
      hasUpdatedClue: false,
      hasUpdatedSuspect: false,
      isUpdated: false
    };
  }

  const hasUpdatedClue = loc.pointsOfInterest.some(
    (p) => p.inspected && Boolean(p.clueUpdated)
  );

  let hasUpdatedSuspect = false;
  const presentHere = getCharactersPresentAtLocation(
    loc,
    livingCharacters,
    schedules,
    investigationMinutes
  );

  for (const char of presentHere) {
    const charTopics = dialogueMap[char.id] || [];
    const iState = interviewStates[char.id];
    const heardSet = new Set(iState?.statementsHeard || []);
    const unlockedIds = getUnlockedTopicIdsForCharacter(
      char,
      charTopics,
      iState,
      clues,
      revealedFacts
    );
    const seenArr = seenUnlockedTopicsByChar[char.id];

    if (seenArr !== undefined) {
      const seenSet = new Set(seenArr);
      const hasNewUnlockedTopic = unlockedIds.some(
        (tId) => !heardSet.has(tId) && !seenSet.has(tId)
      );
      if (hasNewUnlockedTopic) {
        hasUpdatedSuspect = true;
        break;
      }
    } else {
      // Never acknowledged/seen at a previously visited location (e.g., visited while closed or suspect arrived later)
      const isCoreCast =
        char.isPrimaryCast ??
        (char.characterKind !== 'family_visitor' && char.role !== 'staff');
      if (isCoreCast && heardSet.size === 0) {
        hasUpdatedSuspect = true;
        break;
      }
      if (char.role === 'staff') {
        const hasNewConditionalTopic = unlockedIds.some((tId) => {
          if (heardSet.has(tId)) return false;
          const t = charTopics.find((item) => item.id === tId);
          return Boolean(t && !t.unlocked);
        });
        if (hasNewConditionalTopic) {
          hasUpdatedSuspect = true;
          break;
        }
      }
    }
  }

  return {
    visited: true,
    isCurrent,
    isOpen,
    hasUpdatedClue,
    hasUpdatedSuspect,
    isUpdated: hasUpdatedClue || hasUpdatedSuspect
  };
}

export function getCharacterInterviewStatus(
  char: CharacterCaseInstance,
  charTopics: DialogueTopic[],
  interviewState: InterviewState | undefined,
  clues: Record<string, ClueInstance>,
  revealedFacts: string[]
): CharacterInterviewStatus {
  const heardSet = new Set(interviewState?.statementsHeard || []);
  const evidencePresentedCount = interviewState?.evidencePresented?.length ?? 0;

  if (heardSet.size === 0 && evidencePresentedCount === 0) {
    return 'not_interviewed';
  }

  const unlockedIds = getUnlockedTopicIdsForCharacter(
    char,
    charTopics,
    interviewState,
    clues,
    revealedFacts
  );
  const hasUnheardUnlockedTopic = unlockedIds.some((tId) => !heardSet.has(tId));
  return hasUnheardUnlockedTopic ? 'updated' : 'interviewed';
}
