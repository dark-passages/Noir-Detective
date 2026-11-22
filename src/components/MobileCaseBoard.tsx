/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Crosshair,
  Eye,
  EyeOff,
  RotateCcw,
  X,
  ArrowRight,
  MapPin,
  Pin,
  ShieldAlert
} from 'lucide-react';
import {
  CaseInstance,
  CharacterCaseInstance,
  ClueInstance,
  IndictmentSubmission,
  LocationCaseInstance,
  MethodTemplate,
  getDemeanorPinStyle
} from '../types/game';
import { BoardNodeKey, BoardStringEdge } from '../engine/boardGraph';
import { getCharacterMugshot } from '../utils/characterImages';
import { getWeaponImage } from '../utils/weaponImages';
import { noirAudio } from '../utils/audio';
import { isLocationOpenAt } from '../engine/timeUtils';
import { CharacterInterviewStatus } from '../engine/mapStatus';

export type MobileBoardTab = 'suspects' | 'weapons' | 'clues' | 'locations' | 'indictment';

interface MobileCaseBoardProps {
  currentCase: CaseInstance;
  locations: Record<string, LocationCaseInstance>;
  discoveredLocations: LocationCaseInstance[];
  visitedLocationIds: string[];
  currentLocationId?: string;
  people: CharacterCaseInstance[];
  weapons: { weapon: MethodTemplate; foundAtLocationIds: string[] }[];
  clues: ClueInstance[];
  clueFilter: 'all' | 'leads' | 'weapons';
  onChangeClueFilter: (next: 'all' | 'leads' | 'weapons') => void;
  mobileTab: MobileBoardTab;
  onChangeMobileTab: (tab: MobileBoardTab) => void;
  showHidden: boolean;
  onToggleShowHidden: () => void;
  totalHiddenCount: number;
  effectiveHiddenKeys: ReadonlySet<BoardNodeKey>;
  onToggleHideNode: (nodeKey: BoardNodeKey) => void;
  focusedNode: BoardNodeKey | null;
  onToggleFocusNode: (nodeKey: BoardNodeKey) => void;
  onClearFocusNode: () => void;
  connectionEdges: BoardStringEdge[];
  getNodeLabel: (nodeKey: BoardNodeKey) => string;
  onInspectNodeKey: (nodeKey: BoardNodeKey) => void;
  onOpenPerson: (char: CharacterCaseInstance, context: string) => void;
  onOpenWeapon: (weapon: MethodTemplate, context: string) => void;
  onOpenClue: (clue: ClueInstance) => void;
  characterStatuses: Record<string, CharacterInterviewStatus>;
  perjuryExposedByChar: Record<string, boolean>;
  submission: IndictmentSubmission;
  linkedTheoryCount: number;
  indictmentBuilderNode: React.ReactNode;
}

export const MobileCaseBoard: React.FC<MobileCaseBoardProps> = ({
  currentCase,
  locations,
  discoveredLocations,
  visitedLocationIds,
  currentLocationId,
  people,
  weapons,
  clues,
  clueFilter,
  onChangeClueFilter,
  mobileTab,
  onChangeMobileTab,
  showHidden,
  onToggleShowHidden,
  totalHiddenCount,
  effectiveHiddenKeys,
  onToggleHideNode,
  focusedNode,
  onToggleFocusNode,
  onClearFocusNode,
  connectionEdges,
  getNodeLabel,
  onInspectNodeKey,
  onOpenPerson,
  onOpenWeapon,
  onOpenClue,
  characterStatuses,
  perjuryExposedByChar,
  submission,
  linkedTheoryCount,
  indictmentBuilderNode
}) => {
  const visitedSet = new Set(visitedLocationIds);

  const focusedEdges = focusedNode
    ? connectionEdges.filter((e) => e.from === focusedNode || e.to === focusedNode)
    : [];

  const getCharStatusText = (char: CharacterCaseInstance): string => {
    if (perjuryExposedByChar[char.id]) return 'Perjury Exposed';
    const st = characterStatuses[char.id];
    if (st === 'interviewed') return 'Interviewed';
    if (st === 'updated') return 'Update Available';
    return 'Not Interviewed';
  };

  return (
    <div className="md:hidden space-y-3">
      {/* Compact Header & Show Hidden Toggle */}
      <div className="p-3 rounded-xl bg-[#131720] border border-[#232B3B] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-mono font-bold text-[#F59E0B] uppercase truncate">
            {currentCase.seed} · Evidence Ledger
          </div>
          <div className="text-xs font-serif font-bold text-[#F4EDD8] truncate">
            {currentCase.caseTitle}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleShowHidden}
          disabled={totalHiddenCount === 0 && !showHidden}
          className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
            showHidden
              ? 'bg-[#1D283A] border-[#F59E0B]/60 text-[#F59E0B] font-semibold'
              : 'bg-[#0E1117] border-[#263042] text-[#A8B3C5] hover:text-[#F4EDD8]'
          }`}
        >
          {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="tabular-nums">
            {showHidden ? `Hide Ruled Out (${totalHiddenCount})` : `Show Hidden (${totalHiddenCount})`}
          </span>
        </button>
      </div>

      {/* Mobile Segmented Category Tabs */}
      <div
        role="tablist"
        aria-label="Mobile Case Board Categories"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
      >
        {(
          [
            { id: 'suspects', label: `Suspects (${people.length})` },
            { id: 'weapons', label: `Weapons (${weapons.length})` },
            { id: 'clues', label: `Clues (${clues.length})` },
            { id: 'locations', label: `Locations (${discoveredLocations.length})` },
            { id: 'indictment', label: `Indictment (${linkedTheoryCount}/4)` }
          ] as const
        ).map((tab) => {
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                noirAudio.playTypewriterKey();
                onChangeMobileTab(tab.id);
              }}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer tabular-nums ${
                active
                  ? tab.id === 'indictment'
                    ? 'bg-[#DC2626] border-[#EF4444] text-white font-semibold'
                    : 'bg-[#1C222E] border-[#F59E0B]/60 text-[#F59E0B] font-semibold'
                  : 'bg-[#131720] border-[#232B3B] text-[#9AA5B8] hover:text-[#E5DEC9]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inline Connection Inspector (Shown whenever a board node is being traced) */}
      {focusedNode && mobileTab !== 'indictment' && (
        <section
          aria-label="Connected Threads Inspector"
          className="p-3.5 rounded-xl bg-[#111722] border border-[#1D4ED8]/70 shadow-lg space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#1E293B] pb-2">
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#60A5FA]">
                Connected Threads
              </div>
              <div className="text-sm font-serif font-bold text-[#F4EDD8] truncate">
                {getNodeLabel(focusedNode)}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearFocusNode}
              aria-label="Close connection inspector"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#9AA5B8] hover:text-[#F4EDD8] hover:bg-[#1B2433] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {focusedEdges.length === 0 ? (
            <p className="text-xs text-[#8A96A8] py-1">
              No active connected items logged for this entry yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {focusedEdges.map((edge) => {
                const targetKey = edge.from === focusedNode ? edge.to : edge.from;
                const dotColor =
                  edge.kind === 'theory'
                    ? 'bg-[#DC2626]'
                    : edge.kind === 'clue'
                      ? 'bg-[#3B82F6]'
                      : 'bg-[#F59E0B]';
                return (
                  <button
                    key={edge.id}
                    type="button"
                    onClick={() => onInspectNodeKey(targetKey)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#0C1018] hover:bg-[#171F2E] border border-[#232D40] flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#F4EDD8] truncate">
                          {getNodeLabel(targetKey)}
                        </div>
                        <div className="text-[11px] text-[#8E9BB0] truncate">{edge.label}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 1: SUSPECTS & WITNESSES */}
      {mobileTab === 'suspects' && (
        <div className="space-y-2">
          {people.length === 0 ? (
            <div className="p-5 rounded-xl bg-[#131720] border border-[#232B3B] text-xs text-center text-[#8A96A8]">
              {totalHiddenCount > 0
                ? 'All discovered people are currently ruled out. Tap Show Hidden to review them.'
                : 'Visit city venues or question locals to log suspects and witnesses.'}
            </div>
          ) : (
            people.map((person) => {
              const nodeKey: BoardNodeKey = `char:${person.id}`;
              const isHidden = effectiveHiddenKeys.has(nodeKey);
              const isAccused = submission.accusedCulpritId === person.id;
              const isTraced = focusedNode === nodeKey;
              const isPerjuryExposed = Boolean(
                person.perjuryExposed || perjuryExposedByChar[person.id]
              );
              const stateLabel = isPerjuryExposed ? 'Perjury Exposed' : person.demeanor;
              const locName = locations[person.currentLocationId]?.discovered
                ? locations[person.currentLocationId].name
                : 'Unknown Venue';

              return (
                <div
                  key={person.id}
                  className={`min-h-[64px] p-2.5 rounded-xl border flex items-center gap-2.5 transition-opacity ${
                    isHidden
                      ? 'bg-[#0E1117] border-dashed border-[#344056] opacity-65'
                      : isAccused
                        ? 'bg-[#221417] border-[#DC2626]'
                        : isTraced
                          ? 'bg-[#141D2E] border-[#2563EB]'
                          : 'bg-[#131720] border-[#232B3B]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onOpenPerson(person, 'Case Board Dossier')}
                    className="flex-1 min-w-0 min-h-[44px] flex items-center gap-3 text-left cursor-pointer"
                  >
                    <img
                      src={getCharacterMugshot(person)}
                      alt={person.name}
                      referrerPolicy="no-referrer"
                      className={`w-11 h-11 rounded-lg object-cover object-top border shrink-0 bg-[#0A0D12] ${
                        isAccused ? 'border-[#DC2626]' : 'border-[#313C52]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          title={stateLabel}
                          className={`w-2.5 h-2.5 rounded-full border shrink-0 ${getDemeanorPinStyle(
                            person.demeanor,
                            isPerjuryExposed
                          )}`}
                        />
                        {isAccused && (
                          <Pin className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                        )}
                        <span className="text-sm font-serif font-bold text-[#F4EDD8] truncate">
                          {person.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8E9BB0] truncate mt-0.5">
                        {locName} · {stateLabel} · {getCharStatusText(person)}
                        {isHidden ? ' · Ruled Out' : ''}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFocusNode(nodeKey)}
                      aria-label={`Trace connections for ${person.name}`}
                      title={`Trace ${person.name}`}
                      className={`min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isTraced
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-[#181E2A] text-[#9AA5B8] hover:text-[#F4EDD8] border border-[#263042]'
                      }`}
                    >
                      <Crosshair className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleHideNode(nodeKey)}
                      aria-label={isHidden ? `Restore ${person.name}` : `Rule out and hide ${person.name}`}
                      title={isHidden ? 'Restore to board' : 'Rule out & hide'}
                      className="min-w-[44px] min-h-[44px] rounded-lg bg-[#181E2A] hover:bg-[#222B3C] border border-[#263042] text-[#9AA5B8] hover:text-[#F4EDD8] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {isHidden ? (
                        <RotateCcw className="w-4 h-4 text-[#F59E0B]" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: WEAPONS */}
      {mobileTab === 'weapons' && (
        <div className="space-y-2">
          {weapons.length === 0 ? (
            <div className="p-5 rounded-xl bg-[#131720] border border-[#232B3B] text-xs text-center text-[#8A96A8]">
              {totalHiddenCount > 0
                ? 'All discovered weapons are currently ruled out. Tap Show Hidden to review them.'
                : 'Inspect points of interest across New Bay to log weapons.'}
            </div>
          ) : (
            weapons.map(({ weapon, foundAtLocationIds }) => {
              const nodeKey: BoardNodeKey = `weapon:${weapon.id}`;
              const isHidden = effectiveHiddenKeys.has(nodeKey);
              const isPinned = submission.selectedWeaponId === weapon.id;
              const isTraced = focusedNode === nodeKey;
              const foundNames =
                foundAtLocationIds.length > 0
                  ? foundAtLocationIds.map((id) => locations[id]?.name || id).join(', ')
                  : 'Exhibit';

              return (
                <div
                  key={weapon.id}
                  className={`min-h-[64px] p-2.5 rounded-xl border flex items-center gap-2.5 transition-opacity ${
                    isHidden
                      ? 'bg-[#0E1117] border-dashed border-[#344056] opacity-65'
                      : isPinned
                        ? 'bg-[#221417] border-[#DC2626]'
                        : isTraced
                          ? 'bg-[#141D2E] border-[#2563EB]'
                          : 'bg-[#131720] border-[#232B3B]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onOpenWeapon(weapon, `Recovered at ${foundNames}`)}
                    className="flex-1 min-w-0 min-h-[44px] flex items-center gap-3 text-left cursor-pointer"
                  >
                    <img
                      src={getWeaponImage(weapon)}
                      alt={weapon.name}
                      referrerPolicy="no-referrer"
                      className={`w-11 h-11 rounded-lg object-cover border shrink-0 bg-[#0A0D12] ${
                        isPinned ? 'border-[#DC2626]' : 'border-[#313C52]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isPinned && <Pin className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />}
                        <span className="text-sm font-serif font-bold text-[#F4EDD8] truncate">
                          {weapon.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8E9BB0] truncate mt-0.5">
                        {weapon.category} · {foundNames}
                        {isHidden ? ' · Ruled Out' : ''}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFocusNode(nodeKey)}
                      aria-label={`Trace connections for ${weapon.name}`}
                      title={`Trace ${weapon.name}`}
                      className={`min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isTraced
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-[#181E2A] text-[#9AA5B8] hover:text-[#F4EDD8] border border-[#263042]'
                      }`}
                    >
                      <Crosshair className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleHideNode(nodeKey)}
                      aria-label={isHidden ? `Restore ${weapon.name}` : `Rule out and hide ${weapon.name}`}
                      title={isHidden ? 'Restore to board' : 'Rule out & hide'}
                      className="min-w-[44px] min-h-[44px] rounded-lg bg-[#181E2A] hover:bg-[#222B3C] border border-[#263042] text-[#9AA5B8] hover:text-[#F4EDD8] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {isHidden ? (
                        <RotateCcw className="w-4 h-4 text-[#F59E0B]" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: CLUES */}
      {mobileTab === 'clues' && (
        <div className="space-y-2.5">
          {/* Clue Sub-filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {(
              [
                { id: 'all', label: 'All Clues' },
                { id: 'leads', label: 'Key Leads' },
                { id: 'weapons', label: 'Weapon Findings' }
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  noirAudio.playTypewriterKey();
                  onChangeClueFilter(sub.id);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer ${
                  clueFilter === sub.id
                    ? 'bg-[#1C222E] border-[#F59E0B]/50 text-[#F59E0B] font-semibold'
                    : 'bg-[#131720] border-[#232B3B] text-[#8E9BB0]'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {clues.length === 0 ? (
            <div className="p-5 rounded-xl bg-[#131720] border border-[#232B3B] text-xs text-center text-[#8A96A8]">
              No active clues match this filter yet.
            </div>
          ) : (
            <div className="space-y-2">
              {clues.map((clue) => {
                const nodeKey: BoardNodeKey = `clue:${clue.id}`;
                const isHidden = effectiveHiddenKeys.has(nodeKey);
                const isPinnedProof = submission.selectedDecisiveProofId === clue.id;
                const isPinnedMotive = submission.selectedMotiveClueId === clue.id;
                const isTraced = focusedNode === nodeKey;
                const foundName = locations[clue.locationFoundId]?.name || clue.locationFoundId;

                return (
                  <div
                    key={clue.id}
                    className={`min-h-[64px] p-3 rounded-xl border flex items-center gap-2.5 transition-opacity ${
                      isHidden
                        ? 'bg-[#0E1117] border-dashed border-[#344056] opacity-65'
                        : isPinnedProof
                          ? 'bg-[#221417] border-[#DC2626]'
                          : isPinnedMotive
                            ? 'bg-[#221B11] border-[#D97706]'
                            : isTraced
                              ? 'bg-[#141D2E] border-[#2563EB]'
                              : 'bg-[#131720] border-[#232B3B]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenClue(clue)}
                      className="flex-1 min-w-0 min-h-[44px] text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isPinnedProof && <Pin className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />}
                        {isPinnedMotive && <Pin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />}
                        <span className="text-sm font-serif font-bold text-[#F4EDD8] truncate">
                          {clue.name}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8E9BB0] truncate mt-0.5">
                        {clue.category} · {foundName} · {clue.status}
                        {isHidden ? ' · Ruled Out' : ''}
                      </div>
                      <p className="text-xs text-[#AEB9CA] line-clamp-1 mt-1">{clue.shortSummary}</p>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleFocusNode(nodeKey)}
                        aria-label={`Trace connections for ${clue.name}`}
                        title={`Trace ${clue.name}`}
                        className={`min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          isTraced
                            ? 'bg-[#1D4ED8] text-white'
                            : 'bg-[#181E2A] text-[#9AA5B8] hover:text-[#F4EDD8] border border-[#263042]'
                        }`}
                      >
                        <Crosshair className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleHideNode(nodeKey)}
                        aria-label={isHidden ? `Restore ${clue.name}` : `Rule out and hide ${clue.name}`}
                        title={isHidden ? 'Restore to board' : 'Rule out & hide'}
                        className="min-w-[44px] min-h-[44px] rounded-lg bg-[#181E2A] hover:bg-[#222B3C] border border-[#263042] text-[#9AA5B8] hover:text-[#F4EDD8] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {isHidden ? (
                          <RotateCcw className="w-4 h-4 text-[#F59E0B]" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LOCATIONS */}
      {mobileTab === 'locations' && (
        <div className="space-y-2">
          {discoveredLocations.map((loc) => {
            const nodeKey: BoardNodeKey = `loc:${loc.id}`;
            const isCurrent = currentLocationId === loc.id;
            const isVisited = visitedSet.has(loc.id);
            const isTraced = focusedNode === nodeKey;
            const isOpen = isLocationOpenAt(
              loc.openingHours,
              currentCase.investigationStartMinutes ?? 540
            );
            const threadCount = connectionEdges.filter(
              (e) => e.from === nodeKey || e.to === nodeKey
            ).length;

            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onToggleFocusNode(nodeKey)}
                className={`w-full min-h-[60px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isTraced
                    ? 'bg-[#141D2E] border-[#2563EB]'
                    : 'bg-[#131720] border-[#232B3B] hover:border-[#3A465C]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isCurrent
                        ? 'bg-[#FACC15]'
                        : isVisited
                          ? 'bg-[#16A34A]'
                          : 'bg-[#DC2626]'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                      <span className="text-sm font-serif font-bold text-[#F4EDD8] truncate">
                        {loc.name}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#8E9BB0] truncate mt-0.5 tabular-nums">
                      {loc.district} ·{' '}
                      <span className={isOpen ? 'text-emerald-400' : 'text-rose-400'}>
                        {isOpen ? 'Open' : 'Closed'}
                      </span>{' '}
                      · {threadCount} linked
                    </div>
                  </div>
                </div>
                <Crosshair
                  className={`w-4 h-4 shrink-0 ${
                    isTraced ? 'text-[#60A5FA]' : 'text-[#6F7E95]'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 5: GUIDED 4-SLOT INDICTMENT BUILDER */}
      {mobileTab === 'indictment' && indictmentBuilderNode}

      {/* Compact Sticky Shortcut Footer on non-Indictment Mobile Tabs */}
      {mobileTab !== 'indictment' && (
        <button
          type="button"
          onClick={() => {
            noirAudio.playTypewriterKey();
            onChangeMobileTab('indictment');
          }}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#181D29] hover:bg-[#202736] border border-[#2F3A4F] flex items-center justify-between gap-2 text-xs font-medium text-[#E5DEC9] cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>Indictment Builder</span>
          </span>
          <span className="font-mono font-bold text-[#F59E0B] tabular-nums">
            {linkedTheoryCount} of 4 Linked →
          </span>
        </button>
      )}
    </div>
  );
};
