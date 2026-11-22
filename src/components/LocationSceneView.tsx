/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  MessageSquare,
  Users,
  CheckCircle2,
  Sparkles,
  Eye,
  Clock,
  ZoomIn,
  AlertCircle
} from 'lucide-react';
import {
  LocationCaseInstance,
  CharacterCaseInstance,
  CharacterScheduleWindow,
  ClueInstance,
  MethodTemplate,
  PointOfInterest,
  getDemeanorStyle
} from '../types/game';
import { noirAudio } from '../utils/audio';
import { getLocationBackground } from '../utils/locationImages';
import { getCharacterMugshot } from '../utils/characterImages';
import { getWeaponImage } from '../utils/weaponImages';
import { MugshotModal } from './MugshotModal';
import { WeaponModal } from './WeaponModal';
import { MASTER_WEAPONS } from '../engine/templates';
import {
  DEFAULT_INVESTIGATION_START_MINUTES,
  formatMinutesHHMM,
  getActiveScheduleWindow,
  getNextArrivalAtLocation,
  getNextOpeningTotalMinutes,
  is24HourSchedule,
  isLocationOpenAt
} from '../engine/timeUtils';
import { CharacterInterviewStatus } from '../engine/mapStatus';

interface LocationSceneViewProps {
  location: LocationCaseInstance;
  presentCharacters: CharacterCaseInstance[];
  livingCharacters?: CharacterCaseInstance[];
  characterStatuses?: Record<string, CharacterInterviewStatus>;
  perjuryExposedByChar?: Record<string, boolean>;
  schedules?: Record<string, CharacterScheduleWindow[]>;
  investigationMinutes?: number;
  clues: Record<string, ClueInstance>;
  weapons?: MethodTemplate[];
  onInspectPOI: (poi: PointOfInterest) => void;
  onOpenInterrogation: (char: CharacterCaseInstance) => void;
  onNavigateToMap: () => void;
  onAdvanceTime?: (mins: number) => void;
  onWaitUntilMinute?: (targetMins: number) => void;
}

export const LocationSceneView: React.FC<LocationSceneViewProps> = ({
  location,
  presentCharacters,
  livingCharacters = [],
  characterStatuses,
  perjuryExposedByChar,
  schedules,
  investigationMinutes = DEFAULT_INVESTIGATION_START_MINUTES,
  clues,
  weapons = [],
  onInspectPOI,
  onOpenInterrogation,
  onNavigateToMap,
  onAdvanceTime,
  onWaitUntilMinute
}) => {
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const [inspectedPortrait, setInspectedPortrait] = useState<{
    char: CharacterCaseInstance;
    contextLabel?: string;
  } | null>(null);
  const [inspectedWeapon, setInspectedWeapon] = useState<{
    weapon: MethodTemplate;
    contextLabel?: string;
  } | null>(null);

  useEffect(() => {
    setSelectedPOI(null);
    setInspectedPortrait(null);
    setInspectedWeapon(null);
  }, [location.id]);
  const bgUrl = getLocationBackground(location.id, location.locationTags);
  const isOpen = isLocationOpenAt(location.openingHours, investigationMinutes);
  const nextOpeningMin = getNextOpeningTotalMinutes(location.openingHours, investigationMinutes);
  const nextArrival = getNextArrivalAtLocation(schedules, location.id, investigationMinutes, 'investigation_day');
  const hoursLabel =
    !location.openingHours || is24HourSchedule(location.openingHours)
      ? 'Open 24 Hours'
      : `${location.openingHours.open} – ${location.openingHours.close}`;

  const scheduledHereForDay = livingCharacters
    .flatMap((ch) =>
      (schedules?.[ch.id] || [])
        .filter((w) => w.locationId === location.id && w.timelinePhase === 'investigation_day')
        .map((win) => ({ char: ch, win }))
    )
    .sort((a, b) => a.win.startMinutes - b.win.startMinutes);

  const getNextWindowStart = (winStartMinutes: number): number => {
    if (winStartMinutes >= investigationMinutes) return winStartMinutes;
    const dayBase = Math.floor(investigationMinutes / 1440) * 1440;
    const modStart = ((winStartMinutes % 1440) + 1440) % 1440;
    let candidate = dayBase + modStart;
    if (candidate <= investigationMinutes) candidate += 1440;
    return candidate;
  };

  const handlePOIClick = (poi: PointOfInterest) => {
    setSelectedPOI(poi);
    noirAudio.playDiscoveryChime();
    onInspectPOI(poi);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6 pb-24 md:pb-12">
      {/* Location Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#131720] border border-[#232B3B] shadow-md">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#F59E0B]">
            <MapPin className="w-3.5 h-3.5" />
            <span>ACTIVE INVESTIGATION SCENE</span>
            <span className="text-[#475569]">·</span>
            <span
              className={`px-2 py-0.5 rounded border text-[10px] ${
                isOpen
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/40'
                  : 'bg-rose-950/50 text-rose-300 border-rose-700/40'
              }`}
            >
              {isOpen ? 'OPEN NOW' : `CLOSED (Opens ${location.openingHours?.open})`}
            </span>
            <span className="text-[11px] text-[#8A97AA]">Hours: {hoursLabel}</span>
          </div>
          <h1 className="text-xl md:text-3xl font-serif font-bold text-[#E5DEC9] mt-0.5">
            {location.name}
          </h1>
          <p className="text-xs text-[#8A97AA] mt-1 max-w-2xl">{location.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {!isOpen && onWaitUntilMinute && nextOpeningMin > investigationMinutes && (
            <button
              onClick={() => {
                noirAudio.playTypewriterKey();
                onWaitUntilMinute(nextOpeningMin);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-xs font-semibold text-[#0C0E12] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Wait Until Opens ({formatMinutesHHMM(nextOpeningMin)})</span>
            </button>
          )}
          <button
            onClick={() => {
              noirAudio.playPaperRustle();
              onNavigateToMap();
            }}
            className="px-4 py-2 rounded-lg bg-[#1E2533] hover:bg-[#283244] text-xs font-medium text-[#E5DEC9] border border-[#333E52] transition-colors cursor-pointer"
          >
            View City Map
          </button>
        </div>
      </div>

      {/* Point-and-Click Visual Scene Canvas */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8B98AB]">
          <span className="flex items-center gap-1.5 font-medium">
            <Search className="w-4 h-4 text-[#F59E0B]" />
            <span>Search Area for Physical Evidence & Leads</span>
          </span>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
            <span className="inline-flex items-center gap-1 text-[#FCA5A5]">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Unchecked
            </span>
            <span className="inline-flex items-center gap-1 text-[#FDBA74]">
              <span className="w-2 h-2 rounded-full bg-[#EA580C]" /> Updated
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Checked
            </span>
          </div>
        </div>

        <div className="relative w-full aspect-[16/10] max-h-[480px] rounded-2xl bg-[#0B0D12] border border-[#232A39] overflow-hidden shadow-2xl">
          {/* Authentic 1940s Film Noir Location Background Image */}
          <img
            src={bgUrl}
            alt={location.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover select-none"
          />

          {/* Interactive Inspection Pins / Points of Interest */}
          {location.pointsOfInterest.map((poi) => {
            const isInspected = poi.inspected;
            const isUpdated = Boolean(isInspected && poi.clueUpdated);
            const rewardClue = poi.clueRewardId ? clues[poi.clueRewardId] : null;

            return (
              <div
                key={poi.id}
                style={{ top: `${poi.coords.top}%`, left: `${poi.coords.left}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
              >
                <button
                  onClick={() => handlePOIClick(poi)}
                  className={`relative p-2 rounded-full border shadow-xl transition-all cursor-pointer focus:outline-none ${
                    !isInspected
                      ? 'bg-[#DC2626] border-[#EF4444] text-white animate-pulse hover:scale-125 ring-4 ring-[#DC2626]/20'
                      : isUpdated
                        ? 'bg-[#EA580C] border-[#FB923C] text-white animate-pulse hover:scale-125 ring-4 ring-[#F97316]/30'
                        : 'bg-[#1C2330] border-[#364257] text-[#9AA7BA] hover:scale-110'
                  }`}
                  title={isUpdated ? `${poi.label} (Clue Updated — Check Again)` : poi.label}
                >
                  {!isInspected ? (
                    <Eye className="w-4 h-4 text-white" />
                  ) : isUpdated ? (
                    <Sparkles className="w-4 h-4 text-white" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap">
                  <div className="px-2.5 py-1 rounded bg-[#10141C] border border-[#2E3748] text-[11px] font-sans text-[#E5DEC9] shadow-lg">
                    {poi.label}
                    {isUpdated ? (
                      <span className="block text-[10px] text-orange-400 font-mono">
                        Clue Updated — Check Again
                      </span>
                    ) : isInspected && rewardClue ? (
                      <span className="block text-[10px] text-emerald-400 font-mono">
                        Clue Discovered
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* Inspected POI & Clue Details placed cleanly under the search area */}
        {selectedPOI ? (
          <div className="p-4 rounded-xl bg-[#12161E] border border-[#2B3547] text-xs space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-[#232B3B] pb-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#F59E0B]" />
                <span className="font-bold text-[#E5DEC9] text-sm">{selectedPOI.label}</span>
              </div>
              <button
                onClick={() => setSelectedPOI(null)}
                className="text-[11px] text-[#7E8B9E] hover:text-[#E5DEC9] px-2 py-0.5 rounded hover:bg-[#1E2533] cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            <p className="text-[#A7B4C6] leading-relaxed">{selectedPOI.description}</p>

            {selectedPOI.clueRewardId && clues[selectedPOI.clueRewardId] && (() => {
              const clue = clues[selectedPOI.clueRewardId!];
              const isNoticedOnly = clue.status === 'noticed';
              const isCorroborated = clue.status === 'corroborated';
              const relatedWeapon = clue.relatedWeaponId
                ? weapons.find((w) => w.id === clue.relatedWeaponId) ||
                  MASTER_WEAPONS.find((w) => w.id === clue.relatedWeaponId)
                : undefined;
              return (
                <div
                  className={`mt-2 p-3 rounded-lg border flex items-start gap-3 ${
                    isNoticedOnly
                      ? 'bg-[#1D1B14] border-[#F59E0B]/40'
                      : isCorroborated
                        ? 'bg-[#12221D] border-emerald-500/40'
                        : 'bg-[#19212E] border-[#F59E0B]/30'
                  }`}
                >
                  {clue.relatedWeaponId && !isNoticedOnly ? (
                    relatedWeapon ? (
                      <button
                        type="button"
                        onClick={() => {
                          noirAudio.playPaperRustle();
                          setInspectedWeapon({
                            weapon: relatedWeapon,
                            contextLabel: `Evidence at ${location.name}`
                          });
                        }}
                        aria-label={`Inspect forensic photo of ${relatedWeapon.name}`}
                        title={`Click to inspect ${relatedWeapon.name}`}
                        className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#3B475E] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 shadow-md transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                      >
                        <img
                          src={getWeaponImage(relatedWeapon)}
                          alt={relatedWeapon.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-4 h-4 text-[#F4EDD8]" />
                        </span>
                      </button>
                    ) : (
                      <img
                        src={getWeaponImage(clue.relatedWeaponId)}
                        alt={clue.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#3B475E] bg-[#0B0E14] shrink-0 shadow-md"
                      />
                    )
                  ) : (
                    <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#F59E0B]">
                        {isNoticedOnly ? 'Initial Observation' : 'Clue Logged'}: {clue.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          isCorroborated
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                            : isNoticedOnly
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                              : 'bg-sky-950/60 text-sky-300 border-sky-700/50'
                        }`}
                      >
                        {clue.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#D5CDBC] leading-relaxed whitespace-pre-line">
                      {isNoticedOnly
                        ? selectedPOI.noticedNoticeText ||
                          'You log the physical item as noticed.'
                        : clue.detailedInspection}
                    </p>

                    {!isNoticedOnly && clue.interpretationNote && (
                      <div className="mt-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
                        Detective's Deduction: {clue.interpretationNote}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#10131A] border border-[#1E2533] text-[11px] text-[#69778C] flex items-center gap-2 font-mono">
            <Eye className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Select any inspection point in the search area above to examine clues and physical evidence.</span>
          </div>
        )}
      </div>

      {/* Characters Present Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E5DEC9]">
            <Users className="w-4 h-4 text-[#60A5FA]" />
            <span>Persons Present at {formatMinutesHHMM(investigationMinutes)} ({presentCharacters.length})</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
              <span className="inline-flex items-center gap-1 text-[#FCA5A5]">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Not Interviewed
              </span>
              <span className="inline-flex items-center gap-1 text-[#FDBA74]">
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" /> Update Available
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Interviewed
              </span>
            </div>
            {onAdvanceTime && (
              <button
                onClick={() => {
                  noirAudio.playTypewriterKey();
                  onAdvanceTime(30);
                }}
                className="px-3 py-1 rounded-lg bg-[#171E2B] hover:bg-[#232E42] text-[11px] font-mono text-[#F59E0B] border border-[#2D3A52] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clock className="w-3 h-3" />
                <span>Wait +30m</span>
              </button>
            )}
          </div>
        </div>

        {presentCharacters.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#11141B] border border-[#222836] text-center space-y-3">
            <p className="text-xs text-[#8A96A8]">
              {!isOpen
                ? `${location.name} is currently closed (${hoursLabel}). Staff and regulars arrive when doors open.`
                : location.id === 'agency'
                  ? 'Your private office is quiet. Nobody is lingering behind the frosted glass.'
                  : (location.absenceNotices?.length ?? 0) > 0
                    ? `Counter unattended at this hour — see the posted absence note below.`
                    : 'No persons are present at this exact minute.'}
            </p>
            {onWaitUntilMinute && nextArrival && nextArrival.arrivalMinutes > investigationMinutes && (
              <button
                onClick={() => {
                  noirAudio.playTypewriterKey();
                  onWaitUntilMinute(nextArrival.arrivalMinutes);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-xs font-semibold text-[#0C0E12] transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Wait Until Next Arrival ({formatMinutesHHMM(nextArrival.arrivalMinutes)})
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentCharacters.map((char) => {
              const activeWin = getActiveScheduleWindow(
                schedules,
                char.id,
                location.id,
                investigationMinutes,
                location.openingHours,
                'investigation_day'
              );
              const charStatus: CharacterInterviewStatus =
                characterStatuses?.[char.id] ?? 'not_interviewed';
              const statusCardBorder =
                charStatus === 'updated'
                  ? 'border-[#EA580C]/65 hover:border-[#FB923C]'
                  : charStatus === 'interviewed'
                    ? 'border-emerald-600/45 hover:border-emerald-500/75'
                    : 'border-[#DC2626]/55 hover:border-[#EF4444]/85';
              const statusDotClass =
                charStatus === 'updated'
                  ? 'bg-[#EA580C] border-[#FB923C] animate-pulse'
                  : charStatus === 'interviewed'
                    ? 'bg-[#16A34A] border-[#4ADE80]'
                    : 'bg-[#DC2626] border-[#EF4444]';
              const statusPillClass =
                charStatus === 'updated'
                  ? 'bg-[#EA580C]/20 text-[#FDBA74] border-[#FB923C]/55'
                  : charStatus === 'interviewed'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/45'
                    : 'bg-[#DC2626]/15 text-[#FCA5A5] border-[#EF4444]/45';
              const statusLabel =
                charStatus === 'updated'
                  ? 'Update Available'
                  : charStatus === 'interviewed'
                    ? 'Interviewed'
                    : 'Not Interviewed';
              return (
                <div
                  key={char.id}
                  className={`p-4 rounded-xl bg-[#131720] border transition-all flex flex-col justify-between ${statusCardBorder}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              noirAudio.playPaperRustle();
                              setInspectedPortrait({
                                char,
                                contextLabel: `Present at ${location.name}`
                              });
                            }}
                            aria-label={`View portrait artwork of ${char.name}`}
                            title={`Click to view ${char.name}'s portrait`}
                            className="group relative w-12 h-12 rounded-xl overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shadow-sm transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                          >
                            <img
                              src={getCharacterMugshot(char)}
                              alt={char.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-top"
                            />
                            <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-[#F4EDD8]" />
                            </span>
                          </button>
                          <span
                            title={statusLabel}
                            className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border shadow-md pointer-events-none ${statusDotClass}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-serif font-bold text-[#E5DEC9] truncate">{char.name}</h4>
                          <p className="text-xs text-[#8A96A8] line-clamp-1">{char.title}</p>
                        </div>
                      </div>
                      {(() => {
                        const isPerjuryExposed = Boolean(
                          char.perjuryExposed || perjuryExposedByChar?.[char.id]
                        );
                        return (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${getDemeanorStyle(
                              char.demeanor,
                              isPerjuryExposed
                            )}`}
                          >
                            {isPerjuryExposed ? 'Perjury Exposed' : char.demeanor}
                          </span>
                        );
                      })()}
                    </div>

                    <p className="text-xs text-[#9AA5B8] line-clamp-2 leading-relaxed">
                      {char.publicPersona}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${statusPillClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            charStatus === 'updated'
                              ? 'bg-[#FB923C]'
                              : charStatus === 'interviewed'
                                ? 'bg-emerald-400'
                                : 'bg-[#EF4444]'
                          }`}
                        />
                        {statusLabel}
                      </span>
                      <span className="text-[11px] text-[#717E91] font-mono">
                        Attire: {char.avatarStyle.collar}
                      </span>
                      {activeWin && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            activeWin.kind === 'visit'
                              ? 'bg-sky-950/50 text-sky-300 border-sky-700/40'
                              : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                          }`}
                        >
                          {activeWin.kind === 'visit' ? 'Short Visit' : 'On Shift'}: {activeWin.startStr}–{activeWin.endStr}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      noirAudio.playPaperRustle();
                      onOpenInterrogation(char);
                    }}
                    className={`mt-4 w-full py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      charStatus === 'updated'
                        ? 'bg-[#2A1810] hover:bg-[#382014] text-[#FDBA74] border-[#EA580C]/65'
                        : charStatus === 'interviewed'
                          ? 'bg-[#12201A] hover:bg-[#192D24] text-emerald-200 border-emerald-600/45'
                          : 'bg-[#261418] hover:bg-[#351A20] text-[#FCA5A5] border-[#DC2626]/55'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        charStatus === 'updated'
                          ? 'bg-[#EA580C] animate-pulse'
                          : charStatus === 'interviewed'
                            ? 'bg-[#16A34A]'
                            : 'bg-[#DC2626]'
                      }`}
                    />
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Interrogate {char.name.split(' ')[0]}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Daily Roster, Absence Notices & Scheduled Arrivals for this location */}
        {(scheduledHereForDay.length > 0 || (location.absenceNotices?.length ?? 0) > 0) && (
          <div className="p-3.5 rounded-xl bg-[#0F131B] border border-[#1E2636] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#7E8B9E]">
              <span>TODAY’S VENUE ROSTER & VISITING HOURS</span>
              <span>{hoursLabel}</span>
            </div>
            {(location.absenceNotices?.length ?? 0) > 0 && (
              <div className="space-y-2">
                {location.absenceNotices!.map((notice) => (
                  <div
                    key={`${notice.characterId}_${notice.timelineLabel}`}
                    className="p-2.5 rounded-lg bg-[#1A1416] border border-amber-700/40 text-xs space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-[#E5DEC9]">
                        <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                        <span>{notice.characterName}</span>
                        <span className="text-[11px] font-normal text-[#9AA5B8]">
                          ({notice.characterTitle})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-700/40">
                          {notice.reasonLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-700/40">
                          {notice.timelineLabel}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#C8C0AE] leading-relaxed">{notice.detail}</p>
                  </div>
                ))}
              </div>
            )}
            {scheduledHereForDay.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {scheduledHereForDay.map(({ char, win }) => {
                  const activeWin = getActiveScheduleWindow(
                    schedules,
                    char.id,
                    location.id,
                    investigationMinutes,
                    location.openingHours,
                    'investigation_day'
                  );
                  const isHereNow = Boolean(activeWin && activeWin.id === win.id);
                  const waitTarget = !isHereNow && onWaitUntilMinute ? getNextWindowStart(win.startMinutes) : null;
                  const charStatus: CharacterInterviewStatus =
                    characterStatuses?.[char.id] ?? 'not_interviewed';
                  const rosterDotClass =
                    charStatus === 'updated'
                      ? 'bg-[#EA580C] animate-pulse'
                      : charStatus === 'interviewed'
                        ? 'bg-[#16A34A]'
                        : 'bg-[#DC2626]';
                  const rosterStatusTitle =
                    charStatus === 'updated'
                      ? 'Update Available'
                      : charStatus === 'interviewed'
                        ? 'Interviewed'
                        : 'Not Interviewed';
                  return (
                    <div
                      key={win.id}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                        isHereNow
                          ? 'bg-[#172130] border-[#3B82F6]/40 text-[#E5DEC9]'
                          : 'bg-[#12161F] border-[#222A3A] text-[#7D8A9E]'
                      }`}
                    >
                      <span
                        title={rosterStatusTitle}
                        className={`w-2 h-2 rounded-full shrink-0 ${rosterDotClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          noirAudio.playPaperRustle();
                          setInspectedPortrait({
                            char,
                            contextLabel: `${win.kind === 'visit' ? 'Visiting' : 'On shift at'} ${location.name} (${win.startStr}–${win.endStr})`
                          });
                        }}
                        aria-label={`View portrait artwork of ${char.name}`}
                        title={`Click to view ${char.name}'s portrait (${rosterStatusTitle})`}
                        className="group relative w-6 h-6 rounded-full overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                      >
                        <img
                          src={getCharacterMugshot(char)}
                          alt={char.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                        <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-3 h-3 text-[#F4EDD8]" />
                        </span>
                      </button>
                      <span className="font-medium">{char.name}</span>
                      {isHereNow && (
                        <span className="px-1 py-[1px] rounded bg-sky-950/60 text-sky-300 border border-sky-700/40 font-mono text-[9px]">
                          Here Now
                        </span>
                      )}
                      <span className="font-mono text-[10px] opacity-80">
                        ({win.kind === 'visit' ? 'Visit' : 'Shift'} {win.startStr}–{win.endStr})
                      </span>
                      {!isHereNow && waitTarget && onWaitUntilMinute && (
                        <button
                          type="button"
                          onClick={() => {
                            noirAudio.playTypewriterKey();
                            onWaitUntilMinute(waitTarget);
                          }}
                          className="ml-1 px-1.5 py-0.5 rounded bg-[#1E2636] hover:bg-[#F59E0B] text-[#F59E0B] hover:text-[#0C0E12] font-mono text-[10px] transition-colors cursor-pointer"
                          title={`Wait until ${char.name} arrives at ${formatMinutesHHMM(waitTarget)}`}
                        >
                          Wait {formatMinutesHHMM(waitTarget)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <MugshotModal
        character={inspectedPortrait?.char ?? null}
        contextLabel={inspectedPortrait?.contextLabel}
        onClose={() => setInspectedPortrait(null)}
      />

      <WeaponModal
        weapon={inspectedWeapon?.weapon ?? null}
        contextLabel={inspectedWeapon?.contextLabel}
        onClose={() => setInspectedWeapon(null)}
      />
    </div>
  );
};
