/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Link2,
  ChevronDown,
  ChevronUp,
  User,
  Crosshair,
  FileText,
  Scale,
  X
} from 'lucide-react';
import {
  CharacterCaseInstance,
  ClueInstance,
  IndictmentSubmission,
  LocationCaseInstance,
  MethodTemplate,
  MotiveTemplate
} from '../types/game';
import { BoardNodeKey } from '../engine/boardGraph';
import { getCharacterMugshot } from '../utils/characterImages';
import { getWeaponImage } from '../utils/weaponImages';
import { noirAudio } from '../utils/audio';

type BuilderSlot = 'suspect' | 'weapon' | 'motive' | 'proof';

interface IndictmentBuilderProps {
  allSuspects: CharacterCaseInstance[];
  discoveredSuspects?: CharacterCaseInstance[];
  discoveredWeapons: { weapon: MethodTemplate; foundAtLocationIds: string[] }[];
  allCaseWeapons: MethodTemplate[];
  allMotives: MotiveTemplate[];
  eligibleProofClues: ClueInstance[];
  locations: Record<string, LocationCaseInstance>;
  hiddenKeys: ReadonlySet<BoardNodeKey>;
  submission: IndictmentSubmission;
  onUpdateSubmission: (updates: Partial<IndictmentSubmission>) => void;
  onClearTheory: () => void;
  onOpenIndictment: () => void;
}

const MOTIVE_CATEGORIES = [
  'All',
  'Inheritance',
  'Blackmail',
  'Mob Silencing',
  'Debt',
  'Jealousy',
  'Revenge'
] as const;

export const IndictmentBuilder: React.FC<IndictmentBuilderProps> = ({
  allSuspects,
  discoveredSuspects,
  discoveredWeapons,
  allCaseWeapons,
  allMotives,
  eligibleProofClues,
  locations,
  hiddenKeys,
  submission,
  onUpdateSubmission,
  onClearTheory,
  onOpenIndictment
}) => {
  const [activeSlot, setActiveSlot] = useState<BuilderSlot | null>(null);
  const [motiveCategoryFilter, setMotiveCategoryFilter] = useState<string>('All');
  const [showFullArsenal, setShowFullArsenal] = useState<boolean>(false);

  const weaponLookup = useMemo(() => {
    const map = new Map<string, MethodTemplate>();
    for (const w of allCaseWeapons) map.set(w.id, w);
    for (const bw of discoveredWeapons) map.set(bw.weapon.id, bw.weapon);
    return map;
  }, [allCaseWeapons, discoveredWeapons]);

  const selectedSuspect = useMemo(
    () => allSuspects.find((s) => s.id === submission.accusedCulpritId) || null,
    [allSuspects, submission.accusedCulpritId]
  );

  const selectedWeapon = useMemo(
    () => (submission.selectedWeaponId ? weaponLookup.get(submission.selectedWeaponId) || null : null),
    [weaponLookup, submission.selectedWeaponId]
  );

  const selectedMotive = useMemo(
    () => allMotives.find((m) => m.id === submission.selectedMotiveId) || null,
    [allMotives, submission.selectedMotiveId]
  );

  const selectedMotiveClue = useMemo(
    () => eligibleProofClues.find((c) => c.id === submission.selectedMotiveClueId) || null,
    [eligibleProofClues, submission.selectedMotiveClueId]
  );

  const selectedProof = useMemo(
    () => eligibleProofClues.find((c) => c.id === submission.selectedDecisiveProofId) || null,
    [eligibleProofClues, submission.selectedDecisiveProofId]
  );

  const suspectPool = discoveredSuspects ?? allSuspects;

  const activeSuspectCandidates = useMemo(
    () => suspectPool.filter((s) => !hiddenKeys.has(`char:${s.id}`)),
    [suspectPool, hiddenKeys]
  );

  const activeWeaponCandidates = useMemo(() => {
    const discoveredActive = discoveredWeapons
      .filter((bw) => !hiddenKeys.has(`weapon:${bw.weapon.id}`))
      .map((bw) => ({
        weapon: bw.weapon,
        context:
          bw.foundAtLocationIds.length > 0
            ? bw.foundAtLocationIds.map((id) => locations[id]?.name || id).join(', ')
            : 'Logged exhibit'
      }));

    if (!showFullArsenal) return discoveredActive;

    const seenIds = new Set(discoveredActive.map((item) => item.weapon.id));
    const extras = allCaseWeapons
      .filter((w) => !seenIds.has(w.id) && !hiddenKeys.has(`weapon:${w.id}`))
      .map((w) => ({ weapon: w, context: `${w.category} · Arsenal catalog` }));
    return [...discoveredActive, ...extras];
  }, [discoveredWeapons, allCaseWeapons, hiddenKeys, locations, showFullArsenal]);

  const filteredMotives = useMemo(
    () =>
      motiveCategoryFilter === 'All'
        ? allMotives
        : allMotives.filter((m) => m.category === motiveCategoryFilter),
    [allMotives, motiveCategoryFilter]
  );

  const activeProofCandidates = useMemo(
    () => eligibleProofClues.filter((c) => !hiddenKeys.has(`clue:${c.id}`)),
    [eligibleProofClues, hiddenKeys]
  );

  const linkedCount =
    (selectedSuspect ? 1 : 0) +
    (selectedWeapon ? 1 : 0) +
    (selectedMotive || selectedMotiveClue ? 1 : 0) +
    (selectedProof ? 1 : 0);

  const isCompleteTheory = linkedCount === 4;

  const toggleSlot = (slot: BuilderSlot) => {
    noirAudio.playTypewriterKey();
    setActiveSlot((prev) => (prev === slot ? null : slot));
  };

  return (
    <section
      aria-label="Guided 4-Slot Indictment Builder"
      className="p-4 sm:p-5 rounded-xl bg-[#131720] border border-[#232B3B] space-y-4 shadow-lg"
    >
      {/* Builder Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#222A38] pb-3.5">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleteTheory
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                : 'bg-[#19202C] text-[#F59E0B] border border-[#283244]'
            }`}
          >
            {isCompleteTheory ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Link2 className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#F4EDD8]">
                Indictment Builder
              </h3>
              <span
                className={`text-xs font-mono font-bold tabular-nums ${
                  isCompleteTheory ? 'text-emerald-400' : 'text-[#F59E0B]'
                }`}
              >
                {linkedCount} of 4 Linked
              </span>
            </div>
            <p className="text-xs text-[#828FA3]">
              {isCompleteTheory
                ? 'All four deductive slots linked and ready for the Grand Jury.'
                : 'Select each slot below to link your active suspect, weapon, motive, and proof.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSlot(null);
              onClearTheory();
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#1A212E] hover:bg-[#242D3E] border border-[#2A3448] text-xs font-medium text-[#9AA5B8] hover:text-[#E5DEC9] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Theory</span>
          </button>

          <button
            type="button"
            onClick={() => {
              noirAudio.playGavelStrike();
              onOpenIndictment();
            }}
            disabled={!submission.accusedCulpritId}
            className="min-h-[44px] px-4 sm:px-5 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold transition-colors shadow-md shadow-[#DC2626]/25 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            title={
              !submission.accusedCulpritId
                ? 'Pin at least an accused suspect to issue an indictment'
                : 'Submit theory to the Grand Jury'
            }
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Issue Indictment &amp; Arrest Warrant</span>
          </button>
        </div>
      </div>

      {/* 4 Interactive Theory Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* SLOT 01: SUSPECT */}
        <div
          className={`rounded-xl border transition-colors ${
            activeSlot === 'suspect'
              ? 'bg-[#171E2A] border-[#F59E0B]'
              : selectedSuspect
                ? 'bg-[#1A161A] border-[#DC2626]/70'
                : 'bg-[#0E1117] border-[#232B3B] hover:border-[#39465E]'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSlot('suspect')}
            aria-expanded={activeSlot === 'suspect'}
            className="w-full min-h-[76px] p-3 text-left flex items-center gap-3 cursor-pointer"
          >
            {selectedSuspect ? (
              <img
                src={getCharacterMugshot(selectedSuspect)}
                alt={selectedSuspect.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-lg object-cover object-top border border-[#DC2626]/70 shrink-0 bg-[#0B0E14]"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg border border-dashed border-[#344056] bg-[#131822] flex items-center justify-center text-[#6F7E95] shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B]">
                  01 · Suspect
                </span>
                {activeSlot === 'suspect' ? (
                  <ChevronUp className="w-4 h-4 text-[#9AA5B8] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9AA5B8] shrink-0" />
                )}
              </div>
              <div className="text-sm font-serif font-bold text-[#F4EDD8] truncate mt-0.5">
                {selectedSuspect ? selectedSuspect.name : 'Choose Suspect'}
              </div>
              <div className="text-[11px] text-[#8A96A8] truncate">
                {selectedSuspect ? selectedSuspect.title : 'Tap to accuse a suspect'}
              </div>
            </div>
          </button>
        </div>

        {/* SLOT 02: WEAPON */}
        <div
          className={`rounded-xl border transition-colors ${
            activeSlot === 'weapon'
              ? 'bg-[#171E2A] border-[#F59E0B]'
              : selectedWeapon
                ? 'bg-[#1A161A] border-[#DC2626]/70'
                : 'bg-[#0E1117] border-[#232B3B] hover:border-[#39465E]'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSlot('weapon')}
            aria-expanded={activeSlot === 'weapon'}
            className="w-full min-h-[76px] p-3 text-left flex items-center gap-3 cursor-pointer"
          >
            {selectedWeapon ? (
              <img
                src={getWeaponImage(selectedWeapon)}
                alt={selectedWeapon.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-lg object-cover border border-[#DC2626]/70 shrink-0 bg-[#0B0E14]"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg border border-dashed border-[#344056] bg-[#131822] flex items-center justify-center text-[#6F7E95] shrink-0">
                <Crosshair className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B]">
                  02 · Weapon
                </span>
                {activeSlot === 'weapon' ? (
                  <ChevronUp className="w-4 h-4 text-[#9AA5B8] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9AA5B8] shrink-0" />
                )}
              </div>
              <div className="text-sm font-serif font-bold text-[#F4EDD8] truncate mt-0.5">
                {selectedWeapon ? selectedWeapon.name : 'Choose Weapon'}
              </div>
              <div className="text-[11px] text-[#8A96A8] truncate">
                {selectedWeapon ? selectedWeapon.category : 'Match wound & exhibit'}
              </div>
            </div>
          </button>
        </div>

        {/* SLOT 03: MOTIVE */}
        <div
          className={`rounded-xl border transition-colors ${
            activeSlot === 'motive'
              ? 'bg-[#171E2A] border-[#F59E0B]'
              : selectedMotive || selectedMotiveClue
                ? 'bg-[#1A161A] border-[#DC2626]/70'
                : 'bg-[#0E1117] border-[#232B3B] hover:border-[#39465E]'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSlot('motive')}
            aria-expanded={activeSlot === 'motive'}
            className="w-full min-h-[76px] p-3 text-left flex items-center gap-3 cursor-pointer"
          >
            <div
              className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${
                selectedMotive || selectedMotiveClue
                  ? 'border-[#DC2626]/70 bg-[#2A1518] text-[#FCA5A5]'
                  : 'border-dashed border-[#344056] bg-[#131822] text-[#6F7E95]'
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B]">
                  03 · Motive
                </span>
                {activeSlot === 'motive' ? (
                  <ChevronUp className="w-4 h-4 text-[#9AA5B8] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9AA5B8] shrink-0" />
                )}
              </div>
              <div className="text-sm font-serif font-bold text-[#F4EDD8] truncate mt-0.5">
                {selectedMotive
                  ? selectedMotive.name
                  : selectedMotiveClue
                    ? selectedMotiveClue.name
                    : 'Choose Motive'}
              </div>
              <div className="text-[11px] text-[#8A96A8] truncate">
                {selectedMotive && selectedMotiveClue
                  ? `Clue: ${selectedMotiveClue.name}`
                  : selectedMotive
                    ? selectedMotive.category
                    : selectedMotiveClue
                      ? `${selectedMotiveClue.category} · Pinned motive clue`
                      : 'Select clue or hypothesis'}
              </div>
            </div>
          </button>
        </div>

        {/* SLOT 04: DECISIVE PROOF */}
        <div
          className={`rounded-xl border transition-colors ${
            activeSlot === 'proof'
              ? 'bg-[#171E2A] border-[#F59E0B]'
              : selectedProof
                ? 'bg-[#1A161A] border-[#DC2626]/70'
                : 'bg-[#0E1117] border-[#232B3B] hover:border-[#39465E]'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSlot('proof')}
            aria-expanded={activeSlot === 'proof'}
            className="w-full min-h-[76px] p-3 text-left flex items-center gap-3 cursor-pointer"
          >
            <div
              className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${
                selectedProof
                  ? 'border-[#DC2626]/70 bg-[#2A1518] text-[#FCA5A5]'
                  : 'border-dashed border-[#344056] bg-[#131822] text-[#6F7E95]'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B]">
                  04 · Proof
                </span>
                {activeSlot === 'proof' ? (
                  <ChevronUp className="w-4 h-4 text-[#9AA5B8] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9AA5B8] shrink-0" />
                )}
              </div>
              <div className="text-sm font-serif font-bold text-[#F4EDD8] truncate mt-0.5">
                {selectedProof ? selectedProof.name : 'Choose Proof'}
              </div>
              <div className="text-[11px] text-[#8A96A8] truncate">
                {selectedProof ? `${selectedProof.category} · ${selectedProof.status}` : 'Anchor physical proof'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Expanded Inline Candidate Selector */}
      {activeSlot && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#0D1017] border border-[#2A3448] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2534] pb-2.5">
            <span className="text-xs font-mono font-bold uppercase text-[#F59E0B]">
              {activeSlot === 'suspect' && `Discovered Suspects (${activeSuspectCandidates.length})`}
              {activeSlot === 'weapon' && `Active Weapons (${activeWeaponCandidates.length})`}
              {activeSlot === 'motive' &&
                `Motive Clue (${activeProofCandidates.length}) & Hypotheses (${filteredMotives.length})`}
              {activeSlot === 'proof' && `Eligible Decisive Proof (${activeProofCandidates.length})`}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {activeSlot === 'weapon' && allCaseWeapons.length > discoveredWeapons.length && (
                <button
                  type="button"
                  onClick={() => setShowFullArsenal((prev) => !prev)}
                  className="min-h-[36px] px-2.5 py-1 rounded-md bg-[#161C27] hover:bg-[#1F2736] border border-[#2B364B] text-[11px] font-mono text-[#CBD5E1] cursor-pointer whitespace-nowrap"
                >
                  {showFullArsenal
                    ? 'Show Discovered Only'
                    : `Browse Full Arsenal (${allCaseWeapons.length})`}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                aria-label="Close slot selector"
                className="min-w-[44px] min-h-[44px] -my-2 flex items-center justify-center rounded-lg text-[#8A96A8] hover:text-[#F4EDD8] hover:bg-[#1B2230] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {activeSlot === 'suspect' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeSuspectCandidates.length === 0 ? (
                <p className="text-xs text-[#8A96A8] py-3 col-span-full">
                  {suspectPool.length === 0
                    ? 'No suspects discovered yet. Visit city venues, interview witnesses, or uncover clues to identify suspects.'
                    : 'All discovered suspects are currently hidden. Toggle Show Hidden on the board to restore a suspect.'}
                </p>
              ) : (
                activeSuspectCandidates.map((suspect) => {
                  const isSelected = submission.accusedCulpritId === suspect.id;
                  const locName = locations[suspect.currentLocationId]?.discovered
                    ? locations[suspect.currentLocationId].name
                    : 'City whereabouts';
                  return (
                    <button
                      key={suspect.id}
                      type="button"
                      onClick={() => {
                        noirAudio.playPinThud();
                        onUpdateSubmission({
                          accusedCulpritId: isSelected ? null : suspect.id
                        });
                        if (!isSelected) setActiveSlot(null);
                      }}
                      className={`min-h-[56px] p-2.5 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#26181A] border-[#DC2626] ring-1 ring-[#DC2626]/60 text-white'
                          : 'bg-[#131720] border-[#232B3B] text-[#D5CDBC] hover:border-[#42516B]'
                      }`}
                    >
                      <img
                        src={getCharacterMugshot(suspect)}
                        alt={suspect.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-md object-cover object-top border border-[#323D52] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-serif font-bold truncate">{suspect.name}</div>
                        <div className="text-[11px] text-[#8E9BB0] truncate">
                          {suspect.title} · {locName}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {activeSlot === 'weapon' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {activeWeaponCandidates.length === 0 ? (
                <p className="text-xs text-[#8A96A8] py-3 col-span-full">
                  No active discovered weapons yet. Inspect city venues to log weapon exhibits or
                  browse the full arsenal above.
                </p>
              ) : (
                activeWeaponCandidates.map(({ weapon, context }) => {
                  const isSelected = submission.selectedWeaponId === weapon.id;
                  return (
                    <button
                      key={weapon.id}
                      type="button"
                      onClick={() => {
                        noirAudio.playYarnPluck();
                        onUpdateSubmission({
                          selectedWeaponId: isSelected ? null : weapon.id
                        });
                        if (!isSelected) setActiveSlot(null);
                      }}
                      className={`min-h-[56px] p-2.5 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#26181A] border-[#DC2626] ring-1 ring-[#DC2626]/60 text-white'
                          : 'bg-[#131720] border-[#232B3B] text-[#D5CDBC] hover:border-[#42516B]'
                      }`}
                    >
                      <img
                        src={getWeaponImage(weapon)}
                        alt={weapon.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-md object-cover border border-[#323D52] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-serif font-bold truncate">{weapon.name}</div>
                        <div className="text-[11px] text-[#8E9BB0] truncate">{context}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {activeSlot === 'motive' && (
            <div className="space-y-4">
              {/* Motive Clue Selection */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#9AA5B8]">
                  Pin Motive Clue from Board
                </div>
                {activeProofCandidates.length === 0 ? (
                  <p className="text-xs text-[#8A96A8] py-1">
                    Inspect points of interest at city venues to uncover clues pointing to motive.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {activeProofCandidates.map((clue) => {
                      const isSelected = submission.selectedMotiveClueId === clue.id;
                      const foundLoc = locations[clue.locationFoundId]?.name || clue.locationFoundId;
                      return (
                        <button
                          key={clue.id}
                          type="button"
                          onClick={() => {
                            noirAudio.playYarnPluck();
                            onUpdateSubmission({
                              selectedMotiveClueId: isSelected ? null : clue.id,
                              ...(isSelected || submission.selectedDecisiveProofId !== clue.id
                                ? {}
                                : { selectedDecisiveProofId: null })
                            });
                            if (!isSelected) setActiveSlot(null);
                          }}
                          className={`min-h-[52px] p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#261E12] border-[#D97706] ring-1 ring-[#D97706]/60 text-white'
                              : 'bg-[#131720] border-[#232B3B] text-[#D5CDBC] hover:border-[#42516B]'
                          }`}
                        >
                          <div className="text-xs font-serif font-bold text-[#F4EDD8] truncate">
                            {clue.name}
                          </div>
                          <div className="text-[11px] font-mono text-[#8E9BB0] truncate mt-0.5">
                            {clue.category} · {foundLoc} · {clue.status}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Motive Hypothesis Selection */}
              <div className="space-y-2.5 pt-2 border-t border-[#1E2534]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#9AA5B8]">
                  Motive Hypothesis
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MOTIVE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        noirAudio.playTypewriterKey();
                        setMotiveCategoryFilter(cat);
                      }}
                      className={`min-h-[36px] px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border whitespace-nowrap ${
                        motiveCategoryFilter === cat
                          ? 'bg-[#1C222E] text-[#F59E0B] border-[#F59E0B]/50 font-semibold'
                          : 'bg-[#131720] text-[#8E9BB0] border-[#232B3B] hover:text-[#E5DEC9]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {filteredMotives.map((motive) => {
                    const isSelected = submission.selectedMotiveId === motive.id;
                    return (
                      <button
                        key={motive.id}
                        type="button"
                        onClick={() => {
                          noirAudio.playYarnPluck();
                          onUpdateSubmission({
                            selectedMotiveId: isSelected ? null : motive.id
                          });
                          if (!isSelected) setActiveSlot(null);
                        }}
                        className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#26181A] border-[#DC2626] ring-1 ring-[#DC2626]/60 text-white'
                            : 'bg-[#131720] border-[#232B3B] text-[#C4BBA7] hover:border-[#42516B]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold">{motive.name}</span>
                          <span className="text-[10px] font-mono text-[#F59E0B] shrink-0">
                            {motive.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8A96A8] line-clamp-2 mt-1">
                          {motive.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSlot === 'proof' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {activeProofCandidates.length === 0 ? (
                <p className="text-xs text-[#8A96A8] py-3 col-span-full">
                  Inspect points of interest at the crime scene and city venues to uncover
                  physical proof.
                </p>
              ) : (
                activeProofCandidates.map((clue) => {
                  const isSelected = submission.selectedDecisiveProofId === clue.id;
                  const foundLoc = locations[clue.locationFoundId]?.name || clue.locationFoundId;
                  return (
                    <button
                      key={clue.id}
                      type="button"
                      onClick={() => {
                        noirAudio.playYarnPluck();
                        onUpdateSubmission({
                          selectedDecisiveProofId: isSelected ? null : clue.id,
                          ...(isSelected || submission.selectedMotiveClueId !== clue.id
                            ? {}
                            : { selectedMotiveClueId: null })
                        });
                        if (!isSelected) setActiveSlot(null);
                      }}
                      className={`min-h-[56px] p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#26181A] border-[#DC2626] ring-1 ring-[#DC2626]/60 text-white'
                          : 'bg-[#131720] border-[#232B3B] text-[#D5CDBC] hover:border-[#42516B]'
                      }`}
                    >
                      <div className="text-xs font-serif font-bold text-[#F4EDD8] truncate">
                        {clue.name}
                      </div>
                      <div className="text-[11px] font-mono text-[#8E9BB0] truncate mt-0.5">
                        {clue.category} · {foundLoc} · {clue.status}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
