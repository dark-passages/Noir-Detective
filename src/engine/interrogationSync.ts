/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterCaseInstance, ClueInstance, DialogueTopic } from '../types/game';

/**
 * Returns the discovered clue IDs that directly correspond to asking `topic`
 * in Inquire Topics so both Inquire Topics and Present Clue stay synchronized.
 */
export function getLinkedClueIdsForTopic(
  topic: DialogueTopic | undefined,
  clues: Record<string, ClueInstance>
): string[] {
  if (!topic) return [];
  // Secondary follow-up questions unlocked by a clue (not the clue confrontation itself)
  if (topic.id === 'topic_corroborator_venue') return [];

  const linked: string[] = [];
  if (
    topic.requiresClueId &&
    clues[topic.requiresClueId] &&
    clues[topic.requiresClueId].status !== 'undiscovered'
  ) {
    linked.push(topic.requiresClueId);
  }

  if (topic.requiresAnyClueIds && topic.requiresAnyClueIds.length > 0) {
    for (const cId of topic.requiresAnyClueIds) {
      const clue = clues[cId];
      if (!clue || clue.status === 'undiscovered') continue;
      // Keep weapon-transfer slip distinct from general inventory/weapon checks
      if (
        clue.supports === 'weapon_transfer' &&
        (topic.id === 'topic_suspect_weapon_check' || topic.id.endsWith('_weapon_check'))
      ) {
        continue;
      }
      if (!linked.includes(cId)) {
        linked.push(cId);
      }
    }
  }

  return linked;
}

/**
 * Returns the Inquire Topic IDs for `character` that correspond directly to
 * confronting them with `clue` in Present Clue.
 */
export function getLinkedTopicIdsForClue(
  character: CharacterCaseInstance,
  charTopics: DialogueTopic[],
  clue: ClueInstance,
  hasHeardCulpritAlibi: boolean,
  hasHeardCharacterWhereabouts = true
): string[] {
  if (
    character.role === 'culprit' &&
    (clue.supports === 'alibi_break' || clue.supports === 'culprit') &&
    !hasHeardCulpritAlibi
  ) {
    return [];
  }

  const linked: string[] = [];
  for (const topic of charTopics) {
    if (topic.id === 'topic_corroborator_venue') continue;
    if (
      character.isLying &&
      !hasHeardCharacterWhereabouts &&
      (topic.revealsContradiction ||
        topic.requiresAllFactIds?.includes(`heard_${character.id}_whereabouts`) ||
        topic.requiresFactId === `heard_${character.id}_whereabouts`)
    ) {
      continue;
    }
    const matchesDirect = topic.requiresClueId === clue.id;
    const matchesAny = Boolean(topic.requiresAnyClueIds?.includes(clue.id));
    if (matchesDirect || matchesAny) {
      if (!linked.includes(topic.id)) {
        linked.push(topic.id);
      }
    }
  }
  return linked;
}
