/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  ChevronRight,
  CheckCircle2,
  Lock,
  Sparkles,
  ZoomIn
} from 'lucide-react';
import {
  CharacterCaseInstance,
  ClueInstance,
  DialogueTopic,
  InterviewState,
  MethodTemplate,
  getDemeanorStyle
} from '../types/game';
import { noirAudio } from '../utils/audio';
import { useModalScrollLock } from '../utils/modalScrollLock';
import { getCharacterMugshot } from '../utils/characterImages';
import { getWeaponImage } from '../utils/weaponImages';
import { MugshotModal } from './MugshotModal';
import { WeaponModal } from './WeaponModal';
import { MASTER_WEAPONS } from '../engine/templates';

interface InterrogationModalProps {
  character: CharacterCaseInstance;
  victimName?: string;
  caseWeapon?: MethodTemplate;
  weapons?: MethodTemplate[];
  getLocationName?: (locationId: string) => string;
  topics: DialogueTopic[];
  interviewState: InterviewState;
  discoveredClues: ClueInstance[];
  revealedFacts?: string[];
  onClose: () => void;
  onTopicAsked: (topicId: string) => void;
  onConfrontEvidence: (clueId: string) => void;
  perjuryExposed: boolean;
}

export const InterrogationModal: React.FC<InterrogationModalProps> = ({
  character,
  victimName = 'the victim',
  caseWeapon,
  weapons = [],
  getLocationName = (id) => id,
  topics,
  interviewState,
  discoveredClues,
  revealedFacts = [],
  onClose,
  onTopicAsked,
  onConfrontEvidence,
  perjuryExposed
}) => {
  const [activeTab, setActiveTab] = useState<'topics' | 'evidence'>('topics');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [showPortrait, setShowPortrait] = useState(false);
  useModalScrollLock(true);
  const [inspectedWeapon, setInspectedWeapon] = useState<{
    weapon: MethodTemplate;
    contextLabel?: string;
  } | null>(null);

  const whereaboutsTopicId = `topic_${character.id}_whereabouts`;
  const whereaboutsTopic: DialogueTopic = useMemo(
    () => ({
      id: whereaboutsTopicId,
      title: 'Whereabouts / Alibi',
      prompt: `Give me your official whereabouts statement for last night, ${character.name}.`,
      response: character.alibiClaim,
      unlocked: true,
      truthMode: character.isLying ? 'deceptive' : 'truthful'
    }),
    [whereaboutsTopicId, character.name, character.alibiClaim, character.isLying]
  );

  const discoveredClueIds = useMemo(
    () => new Set(discoveredClues.map((c) => c.id)),
    [discoveredClues]
  );

  const knownFacts = useMemo(
    () => new Set([...revealedFacts, ...interviewState.revealedFacts]),
    [revealedFacts, interviewState.revealedFacts]
  );

  const unlockedTopics = useMemo(
    () => [
      whereaboutsTopic,
      ...topics.filter((t) => {
        if (t.requiresAllFactIds && !t.requiresAllFactIds.every((f) => knownFacts.has(f))) {
          return false;
        }
        return (
          t.unlocked ||
          interviewState.topicsUnlocked.includes(t.id) ||
          (t.requiresClueId && discoveredClueIds.has(t.requiresClueId)) ||
          (t.requiresFactId && knownFacts.has(t.requiresFactId)) ||
          Boolean(t.requiresAnyClueIds?.some((id) => discoveredClueIds.has(id))) ||
          Boolean(t.requiresAnyFactIds?.some((id) => knownFacts.has(id)))
        );
      })
    ],
    [whereaboutsTopic, topics, interviewState.topicsUnlocked, discoveredClueIds, knownFacts]
  );

  const lockedTopicCount = topics.length - (unlockedTopics.length - 1);

  const handleSelectTopic = (topic: DialogueTopic) => {
    const alreadyHeard = interviewState.statementsHeard.includes(topic.id);
    if (alreadyHeard) {
      noirAudio.playPaperRustle();
      setActiveTopicId((prev) => (prev === topic.id ? null : topic.id));
      return;
    }
    noirAudio.playTypewriterKey();
    setActiveTopicId(topic.id);
    onTopicAsked(topic.id);
  };

  const hasHeardCharacterWhereabouts =
    knownFacts.has(`heard_${character.id}_whereabouts`) ||
    interviewState.statementsHeard.includes(whereaboutsTopicId);

  const getConfrontationResponse = (clue: ClueInstance): string => {
    const foundAtName = getLocationName(clue.locationFoundId);
    const leadsToName = clue.leadsToLocationId ? getLocationName(clue.leadsToLocationId) : null;
    const hereName = getLocationName(character.currentLocationId);
    const habit = character.dialogueVoice?.verbalHabits ? ` (${character.dialogueVoice.verbalHabits})` : '';

    if (character.role === 'culprit' && (clue.supports === 'alibi_break' || clue.supports === 'culprit')) {
      if (!hasHeardCharacterWhereabouts) {
        return `${character.name} glances coolly at ${clue.name}${habit}: "Take my whereabouts statement on the record first, detective, before waving paperwork in my face."`;
      }
      const confrontTopicId = clue.supports === 'alibi_break' ? 'topic_confront_alibi' : 'topic_confession_trap';
      const confrontTopic = topics.find((t) => t.id === confrontTopicId);
      return confrontTopic
        ? `${character.name} falters as you present ${clue.name}${habit}: "${confrontTopic.response}"`
        : `${character.name} swallows hard as you present ${clue.name}${habit}: "I hid that visit to keep my name out of a bitter dispute with ${victimName}, detective—that doesn't make me a killer!"`;
    }

    const matchingContradictionTopic = topics.find(
      (t) =>
        Boolean(t.revealsContradiction) &&
        (t.requiresClueId === clue.id || Boolean(t.requiresAnyClueIds?.includes(clue.id)))
    );
    if (matchingContradictionTopic && character.isLying) {
      if (!hasHeardCharacterWhereabouts) {
        return `${character.name} glances coolly at ${clue.name}${habit}: "Take my whereabouts statement on the record first, detective, before waving paperwork in my face."`;
      }
      return `${character.name} falters as you present ${clue.name}${habit}: "${matchingContradictionTopic.response}"`;
    }

    if (clue.id.startsWith('clue_liar_trace_') && clue.relatedCharacterId === character.id) {
      const traceTopic = topics.find((t) => t.id === `topic_${character.id}_trace`);
      return traceTopic
        ? `${character.name} tenses over ${clue.name}${habit}: "${traceTopic.response}"`
        : `${character.name} eyes ${clue.name}${habit}: "Yes, those are my initials, detective—I dropped that earlier before the killing, not at the hour of death."`;
    }

    if (clue.id.startsWith('clue_liar_motive_') && clue.relatedCharacterId === character.id) {
      const motiveTopic = topics.find((t) => t.id === `topic_${character.id}_motive`);
      return motiveTopic
        ? `${character.name} exhales sharply over ${clue.name}${habit}: "${motiveTopic.response}"`
        : `${character.name} tightens their jaw over ${clue.name}${habit}: "Having a bitter grievance with ${victimName} isn't the same as committing murder, detective."`;
    }

    if (clue.id.startsWith('clue_gossip_') && clue.relatedCharacterId === character.id) {
      return `${character.name} scoffs uneasily at ${clue.name}${habit}: "Loose-tongued regulars will repeat anything after midnight! Check signed books and physical facts instead of parlor rumors."`;
    }

    if (clue.supports === 'red_herring' && clue.relatedCharacterId === character.id) {
      const herringTopicId =
        clue.id === 'clue_red_herring_2' ? 'topic_second_suspect_scene_item' : 'topic_dispute_note';
      const herringTopic = topics.find((t) => t.id === herringTopicId);
      return herringTopic
        ? `${character.name} scoffs${habit}: "${herringTopic.response}"`
        : `${character.name} scoffs${habit}: "That ${clue.name} has an innocent explanation—ask me about it on the record."`;
    }

    if (clue.id === 'clue_second_suspect_record' && clue.relatedCharacterId === character.id) {
      const secretTopic = topics.find((t) => t.id === 'topic_confront_secret_visit');
      return secretTopic
        ? `${character.name} pales over ${clue.name}${habit}: ${secretTopic.response}`
        : `${character.name} swallows hard as you present ${clue.name}${habit}: "Keep my name out of the papers—yes, I slipped into ${foundAtName} last night and saw trouble brewing before the murder!"`;
    }

    if (character.role === 'culprit' && (clue.supports === 'motive' || clue.supports === 'motive_hook')) {
      const motiveTopic = topics.find((t) => t.id === 'topic_motive');
      return motiveTopic
        ? `${character.name} exhales sharply over ${clue.name}${habit}: "${motiveTopic.response}"`
        : `${character.name}'s jaw tightens over ${clue.name}${habit}: "Having a bitter grievance with ${victimName} isn't the same as committing murder, detective."`;
    }

    if (character.role === 'culprit' && (clue.supports === 'weapon' || clue.supports === 'weapon_transfer')) {
      return `${character.name} refuses to meet your gaze over ${clue.name}: "Lots of people wear dark coats in the rain, detective. Unless you can tie me to the street outside, keep your theories to yourself."`;
    }

    if (clue.supports === 'corroboration' && (character.role === 'corroborator' || character.isRedHerring)) {
      if (character.role === 'corroborator') {
        const corrTopic = topics.find((t) => t.id === 'topic_corroborate_alibi');
        if (corrTopic) {
          return `${character.name} taps ${clue.name} briskly: "${corrTopic.response}"`;
        }
      }
      return `${character.name} taps ${clue.name} briskly: "There you have it in black and white—two signatures, exact times, right at ${foundAtName}. That clears our evening completely."`;
    }

    if (clue.id === 'clue_witness_report_slip' && clue.relatedCharacterId === character.id) {
      return `${character.name} glances at ${clue.name} and nods${habit}: "Yes, that beat log notes me outside ${foundAtName} last night when I heard shouting inside. Ask me about my whereabouts and what I saw on the record."`;
    }

    if (clue.relatedCharacterId === character.id) {
      return `${character.name} studies ${clue.name} and nods${habit}: "That record has my name on it right enough—just like I told you, I kept to my schedule at ${foundAtName}. Compare the timestamps against the rest of the street."`;
    }

    if (clue.supports === 'location_lead' && leadsToName) {
      return `${character.name} squints at ${clue.name}${habit}: "That stamp points straight toward ${leadsToName}. If someone slipped away in a hurry last night, that's where the trail continues."`;
    }

    if (clue.id.startsWith('clue_loc_weapon_') && clue.relatedWeaponId) {
      const itemWeapon =
        weapons.find((w) => w.id === clue.relatedWeaponId) ||
        (caseWeapon?.id === clue.relatedWeaponId ? caseWeapon : undefined);
      const itemName = itemWeapon ? itemWeapon.name.toLowerCase() : clue.name.toLowerCase();
      if (character.role === 'culprit') {
        return `${character.name} eyes the ${itemName} flatly${habit}: "Lots of establishments around New Bay keep tools and fixtures like that around. Unless you can tie it to ${victimName} and prove I handled it, don't waste my time."`;
      }
      if (character.role === 'staff') {
        return clue.locationFoundId === character.currentLocationId
          ? `${character.name} nods from behind the counter at ${hereName}: "Yes, that ${itemName} is ordinary equipment kept right on the premises here. Check our stock logs if you think anyone touched it."`
          : `${character.name} studies ${clue.name} briskly: "That ${itemName} belongs over at ${foundAtName}, not my counter—you'd better compare it against the coroner's wound report."`;
      }
      return `${character.name} glances at ${clue.name}${habit}: "You found that ${itemName} at ${foundAtName}? Almost every shop or venue in this city has something dangerous sitting in a drawer—see whether it actually fits the medical examiner's findings."`;
    }

    if (clue.supports === 'weapon' || clue.supports === 'weapon_transfer') {
      if (character.role === 'staff') {
        return `${character.name} eyes ${clue.name} from behind the counter: "If someone signed gear out or carried hardware off-shift, look closely at the stockroom tags and the collar description logged on that slip."`;
      }
      return `${character.name} recoils slightly from ${clue.name}${habit}: "Rough work, detective. You ought to ask the counter clerks and storeroom keepers who handle tools like that before closing."`;
    }

    if (clue.supports === 'motive' || clue.supports === 'motive_hook') {
      return `${character.name} examines ${clue.name} carefully${habit}: "${victimName} kept dangerous secrets on paper. Whoever stood to lose the most if those terms came due is the person whose alibi won't hold water."`;
    }

    if (clue.supports === 'roster') {
      return `${character.name} glances down the ink columns of ${clue.name}: "Duty hours and errand call-ins don't lie—the clerks keep those door sheets accurate to the quarter-hour at ${foundAtName}."`;
    }

    if (clue.locationFoundId === character.currentLocationId) {
      return `${character.name} recognizes ${clue.name} from ${hereName}${habit}: "I remember seeing something like that around the floor earlier, though folks come and go fast once the rain starts."`;
    }

    const voiceLines: Record<CharacterCaseInstance['voice'], string> = {
      cynical: `${character.name} exhales a thin ribbon of smoke over ${clue.name}: "Nice piece of legwork from ${foundAtName}, shamus, but it doesn't pin me to the body. Trace who actually had motive and no alibi."`,
      posh: `${character.name} lifts an eyebrow at ${clue.name}: "How dreadfully sordid. Whatever turned up at ${foundAtName} belongs to someone else's parlor drama, not mine."`,
      defensive: `${character.name} folds their arms stiffly around ${clue.name}: "Don't wave ${clue.category} scraps from ${foundAtName} at me—I gave you my statement, and it checks out."`,
      nervous: `${character.name} swallows hard while glancing at ${clue.name}${habit}: "I—I saw folks hurrying through ${foundAtName} earlier, detective, honest I did, but I stayed clear of any trouble!"`,
      gruff: `${character.name} grunts at ${clue.name}: "Paper and oddments from ${foundAtName} won't rattle me, gumshoe. Keep working the street—somebody's story around ${victimName} doesn't add up."`
    };
    return voiceLines[character.voice];
  };

  const handleSelectClue = (clue: ClueInstance) => {
    const alreadyShown = interviewState.evidencePresented.includes(clue.id);
    const isPrematurelyShown =
      !alreadyShown &&
      (interviewState.prematureEvidencePresented?.includes(clue.id) ?? false);
    if (alreadyShown || (isPrematurelyShown && !hasHeardCharacterWhereabouts)) {
      noirAudio.playPaperRustle();
      setSelectedClueId((prev) => (prev === clue.id ? null : clue.id));
      return;
    }
    noirAudio.playYarnPluck();
    setSelectedClueId(clue.id);
    onConfrontEvidence(clue.id);
  };

  const getClueStatusBadgeStyle = (status: ClueInstance['status']) => {
    if (status === 'corroborated') {
      return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
    }
    if (status === 'noticed') {
      return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
    }
    return 'bg-sky-950/60 text-sky-300 border-sky-700/50';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overscroll-none">
      <div className="w-full max-w-3xl rounded-2xl bg-[#11141B] border border-[#273142] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] min-h-0">
        {/* Header */}
        <div className="p-4 md:p-6 bg-[#161B24] border-b border-[#252E3E] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => {
                noirAudio.playPaperRustle();
                setShowPortrait(true);
              }}
              aria-label={`View portrait artwork of ${character.name}`}
              title={`Click to view ${character.name}'s portrait`}
              className="group relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 shadow-md transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            >
              <img
                src={getCharacterMugshot(character)}
                alt={character.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
              <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-[#F4EDD8]" />
              </span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base md:text-xl font-serif font-bold text-[#E5DEC9]">
                  {character.name}
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getDemeanorStyle(
                    character.demeanor,
                    perjuryExposed
                  )}`}
                >
                  {perjuryExposed ? 'Perjury Exposed' : character.demeanor}
                </span>
              </div>
              <p className="text-xs text-[#8A96A8] mt-0.5">{character.title}</p>
            </div>
          </div>

          <button
            onClick={() => {
              noirAudio.playPaperRustle();
              onClose();
            }}
            className="p-2 rounded-lg text-[#7F8C9E] hover:text-[#E5DEC9] hover:bg-[#202735] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls (2 Tabs: Inquire & Present Clue) */}
        <div className="flex border-b border-[#232B3B] bg-[#0E1117] px-4 shrink-0">
          <button
            onClick={() => {
              noirAudio.playTypewriterKey();
              if (selectedClueId && !interviewState.evidencePresented.includes(selectedClueId)) {
                setSelectedClueId(null);
              }
              setActiveTab('topics');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'topics'
                ? 'border-[#F59E0B] text-[#F59E0B]'
                : 'border-transparent text-[#818D9E] hover:text-[#C5D0DE]'
            }`}
          >
            Inquire Topics ({unlockedTopics.length})
          </button>
          <button
            onClick={() => {
              noirAudio.playTypewriterKey();
              setActiveTab('evidence');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-[#F59E0B] text-[#F59E0B]'
                : 'border-transparent text-[#818D9E] hover:text-[#C5D0DE]'
            }`}
          >
            Present Clue ({discoveredClues.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-5 flex-1 min-h-0">
          {activeTab === 'topics' && (
            <div className="space-y-3">
              <span className="text-xs text-[#8A96A8] block">
                Select a topic to question {character.name} or review their answer:
              </span>

              <div className="space-y-2.5">
                {unlockedTopics.map((t) => {
                  const isHeard = interviewState.statementsHeard.includes(t.id);
                  const isSelected = activeTopicId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isSelected
                          ? 'bg-[#1C2330] border-[#F59E0B]'
                          : isHeard
                            ? 'bg-[#111720] border-[#263245] hover:border-[#344054]'
                            : 'bg-[#12161F] border-[#222A38] hover:border-[#344054]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectTopic(t)}
                        className="w-full p-3.5 text-left text-xs cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <span
                            className={`font-bold block ${
                              isSelected ? 'text-[#F59E0B]' : 'text-[#E5DEC9]'
                            }`}
                          >
                            {t.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#F59E0B] block">
                            {isHeard
                              ? isSelected
                                ? 'Asked — Response Below'
                                : 'Asked — View Response →'
                              : 'Ask Question →'}
                          </span>
                        </div>
                        {isHeard ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 shrink-0 text-[#6C7A8E]" />
                        )}
                      </button>

                      {isSelected && (
                        <div className="px-3.5 pb-3.5 pt-3 border-t border-[#283347] bg-[#0C1017] space-y-3 animate-in fade-in duration-150">
                          {t.id === whereaboutsTopicId ? (
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
                                  <Clock className="w-4 h-4" />
                                  <span>Official Whereabouts Statement</span>
                                </div>
                                <blockquote className="text-xs text-[#E5DEC9] italic border-l-2 border-[#F59E0B] pl-3 py-1">
                                  "{character.alibiClaim}"
                                </blockquote>
                              </div>

                              <div className="p-3 rounded-xl bg-[#141923] border border-[#263142] text-xs text-[#8A96A8] leading-relaxed space-y-1">
                                <span className="font-semibold text-[#D5CDBC] block">
                                  Detective's Field Note:
                                </span>
                                <p>
                                  To verify or break this alibi, search for timestamped physical records
                                  (dispatcher carbons, tickets, logs) or interview third-party witnesses who can confirm or
                                  refute whether {character.name} was truly present where they claim.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-[#F59E0B] block">
                                  DET. HARRISON:
                                </span>
                                <p className="text-xs font-medium text-[#E5DEC9] italic">
                                  "{t.prompt}"
                                </p>
                              </div>

                              <div className="pt-2.5 border-t border-[#202735] space-y-1">
                                <span className="text-[10px] font-mono text-[#60A5FA] block">
                                  {character.name.toUpperCase()}:
                                </span>
                                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                                  {t.response}
                                </p>
                              </div>

                              {(() => {
                                const topicWeapon =
                                  (t.relatedWeaponId
                                    ? weapons.find((w) => w.id === t.relatedWeaponId) ||
                                      (caseWeapon?.id === t.relatedWeaponId ? caseWeapon : undefined) ||
                                      MASTER_WEAPONS.find((w) => w.id === t.relatedWeaponId)
                                    : undefined) ||
                                  (t.id === 'topic_suspect_weapon_check' || t.id.endsWith('_weapon_check')
                                    ? caseWeapon
                                    : undefined);
                                if (
                                  !topicWeapon ||
                                  !(
                                    t.id === 'topic_suspect_weapon_check' ||
                                    t.id.endsWith('_weapon_check') ||
                                    Boolean(t.relatedWeaponId)
                                  )
                                ) {
                                  return null;
                                }
                                return (
                                  <div className="pt-2.5 border-t border-[#1C2332] flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        noirAudio.playPaperRustle();
                                        setInspectedWeapon({
                                          weapon: topicWeapon,
                                          contextLabel: `Discussed with ${character.name}`
                                        });
                                      }}
                                      aria-label={`Inspect forensic photo of ${topicWeapon.name}`}
                                      title={`Click to inspect ${topicWeapon.name}`}
                                      className="group relative w-14 h-14 rounded-lg overflow-hidden border border-[#3B475E] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 shadow-sm transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                                    >
                                      <img
                                        src={getWeaponImage(topicWeapon)}
                                        alt={topicWeapon.name}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                      />
                                      <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ZoomIn className="w-4 h-4 text-[#F4EDD8]" />
                                      </span>
                                    </button>
                                    <div className="min-w-0">
                                      <span className="text-[10px] font-mono uppercase text-[#F59E0B] block">
                                        Referenced Weapon Exhibit
                                      </span>
                                      <div className="text-xs font-semibold text-[#E5DEC9] truncate">
                                        {topicWeapon.name}
                                      </div>
                                      <div className="text-[10px] text-[#8A96A8] truncate">
                                        {topicWeapon.category}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {lockedTopicCount > 0 && (
                <div className="p-2.5 rounded-lg bg-[#0E1117] border border-dashed border-[#242C3A] text-[11px] text-[#6D7B8E] flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-[#7F8C9E]" />
                  <span>
                    {lockedTopicCount} line{lockedTopicCount > 1 ? 's' : ''} of questioning locked until relevant testimony or physical evidence is uncovered.
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <span className="text-xs text-[#8A96A8]">
                Select a clue from your case file to confront {character.name} or review their response:
              </span>

              {discoveredClues.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0E1117] border border-[#232A38] text-center text-xs text-[#6F7C8E]">
                  You have not logged any physical clues yet. Search points of interest at crime scenes.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  {discoveredClues.map((clue) => {
                    const alreadyShown = interviewState.evidencePresented.includes(clue.id);
                    const isPrematurelyShown =
                      !alreadyShown &&
                      (interviewState.prematureEvidencePresented?.includes(clue.id) ?? false);
                    const isSelected = selectedClueId === clue.id;
                    const responseText = getConfrontationResponse(clue);
                    const relatedWeapon = clue.relatedWeaponId
                      ? weapons.find((w) => w.id === clue.relatedWeaponId) ||
                        (caseWeapon?.id === clue.relatedWeaponId ? caseWeapon : undefined) ||
                        MASTER_WEAPONS.find((w) => w.id === clue.relatedWeaponId)
                      : undefined;
                    return (
                      <div
                        key={clue.id}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          isSelected
                            ? 'bg-[#1C2330] border-[#F59E0B]'
                            : isPrematurelyShown
                              ? 'bg-[#1B1510] border-[#EA580C]/60 hover:border-[#FB923C]'
                              : alreadyShown
                                ? 'bg-[#111720] border-[#263245] hover:border-[#344054]'
                                : 'bg-[#12161F] border-[#222A38] hover:border-[#344054]'
                        }`}
                      >
                        <div className="p-3 flex items-start gap-2.5 w-full">
                          {clue.relatedWeaponId && relatedWeapon && (
                            <button
                              type="button"
                              onClick={() => {
                                noirAudio.playPaperRustle();
                                setInspectedWeapon({
                                  weapon: relatedWeapon,
                                  contextLabel: `Evidence: ${clue.name}`
                                });
                              }}
                              aria-label={`Inspect forensic photo of ${relatedWeapon.name}`}
                              title={`Click to inspect ${relatedWeapon.name}`}
                              className="group relative w-11 h-11 rounded-lg overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                            >
                              <img
                                src={getWeaponImage(relatedWeapon)}
                                alt={relatedWeapon.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-3.5 h-3.5 text-[#F4EDD8]" />
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSelectClue(clue)}
                            className="flex-1 min-w-0 text-left text-xs cursor-pointer flex flex-col justify-between gap-2 focus:outline-none"
                          >
                            <div className="space-y-1.5 w-full">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`font-bold line-clamp-1 flex-1 ${
                                    isSelected ? 'text-[#F59E0B]' : 'text-[#E5DEC9]'
                                  }`}
                                >
                                  {clue.name}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${getClueStatusBadgeStyle(
                                      clue.status
                                    )}`}
                                  >
                                    {clue.status}
                                  </span>
                                  {alreadyShown ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                  ) : isPrematurelyShown ? (
                                    <span
                                      className="w-5 h-5 rounded-full bg-[#EA580C] border border-[#FB923C] text-white flex items-center justify-center shrink-0 shadow-sm"
                                      title="Check Again"
                                    >
                                      <Sparkles className="w-3 h-3 text-white" />
                                    </span>
                                  ) : (
                                    <ChevronRight className="w-4 h-4 shrink-0 text-[#6C7A8E]" />
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-[#8694A6] line-clamp-2 leading-snug">
                                {clue.shortSummary}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-[#F59E0B]">
                              {alreadyShown
                                ? isSelected
                                  ? 'Presented — Response Below'
                                  : 'Presented — View Response →'
                                : isPrematurelyShown
                                  ? isSelected
                                    ? 'Presented — Response Below'
                                    : hasHeardCharacterWhereabouts
                                      ? 'Presented — Check Again →'
                                      : 'Presented — View Response →'
                                  : 'Confront with this Clue →'}
                            </span>
                          </button>
                        </div>

                        {isSelected && (
                          <div className="px-3 pb-3 pt-2.5 border-t border-[#283347] bg-[#0C1017] text-[11px] text-[#CBD5E1] leading-relaxed space-y-2 animate-in fade-in duration-150">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B] block">
                              {character.name}'s Response:
                            </span>
                            <p>{responseText}</p>
                            {relatedWeapon && (
                              <div className="pt-2 border-t border-[#1D2534] flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    noirAudio.playPaperRustle();
                                    setInspectedWeapon({
                                      weapon: relatedWeapon,
                                      contextLabel: `Presented to ${character.name}`
                                    });
                                  }}
                                  aria-label={`Inspect forensic photo of ${relatedWeapon.name}`}
                                  title={`Click to inspect ${relatedWeapon.name}`}
                                  className="group relative w-12 h-12 rounded-lg overflow-hidden border border-[#3B475E] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                                >
                                  <img
                                    src={getWeaponImage(relatedWeapon)}
                                    alt={relatedWeapon.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="w-3.5 h-3.5 text-[#F4EDD8]" />
                                  </span>
                                </button>
                                <div className="min-w-0">
                                  <div className="text-[11px] font-semibold text-[#E5DEC9] truncate">
                                    {relatedWeapon.name}
                                  </div>
                                  <div className="text-[10px] text-[#8A96A8]">
                                    Click photo to inspect forensic exhibit
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141822] border-t border-[#222A38] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] font-mono text-[#6D7B8E] flex items-center gap-3">
            <span>Witness Integrity: {perjuryExposed ? 'Liar (Discredited)' : 'Unbroken'}</span>
            <span>·</span>
            <span>Pressure: {interviewState.pressureState}</span>
          </div>
          <button
            onClick={() => {
              noirAudio.playPaperRustle();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[#222A39] hover:bg-[#2C3547] text-xs font-semibold text-[#E5DEC9] transition-colors cursor-pointer"
          >
            Conclude Questioning
          </button>
        </div>
      </div>

      <MugshotModal
        character={showPortrait ? character : null}
        contextLabel={getLocationName(character.currentLocationId)}
        onClose={() => setShowPortrait(false)}
      />

      <WeaponModal
        weapon={inspectedWeapon?.weapon ?? null}
        contextLabel={inspectedWeapon?.contextLabel}
        onClose={() => setInspectedWeapon(null)}
      />
    </div>
  );
};
