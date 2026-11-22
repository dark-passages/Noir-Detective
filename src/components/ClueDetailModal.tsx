/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, Pin, ZoomIn, EyeOff, RotateCcw } from 'lucide-react';
import {
  CharacterCaseInstance,
  ClueInstance,
  LocationCaseInstance,
  MethodTemplate
} from '../types/game';
import { noirAudio } from '../utils/audio';
import { useModalScrollLock } from '../utils/modalScrollLock';
import { getWeaponImage } from '../utils/weaponImages';

interface ClueDetailModalProps {
  clue: ClueInstance | null;
  locations: Record<string, LocationCaseInstance>;
  linkedPerson?: CharacterCaseInstance;
  linkedWeapon?: MethodTemplate;
  isEligibleProof: boolean;
  isPinnedProof: boolean;
  onTogglePinProof: (clueId: string) => void;
  isPinnedMotive?: boolean;
  onTogglePinMotive?: (clueId: string) => void;
  isHiddenOnBoard?: boolean;
  onToggleHideOnBoard?: (clueId: string) => void;
  onInspectWeapon?: (weapon: MethodTemplate) => void;
  onClose: () => void;
}

export const ClueDetailModal: React.FC<ClueDetailModalProps> = ({
  clue,
  locations,
  linkedPerson,
  linkedWeapon,
  isEligibleProof,
  isPinnedProof,
  onTogglePinProof,
  isPinnedMotive = false,
  onTogglePinMotive,
  isHiddenOnBoard = false,
  onToggleHideOnBoard,
  onInspectWeapon,
  onClose
}) => {
  useModalScrollLock(Boolean(clue));

  useEffect(() => {
    if (!clue) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        noirAudio.playPaperRustle();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clue, onClose]);

  if (!clue) return null;

  const foundLocName = locations[clue.locationFoundId]?.name || clue.locationFoundId;
  const leadsLocName =
    clue.leadsToLocationId && locations[clue.leadsToLocationId]?.discovered
      ? locations[clue.leadsToLocationId].name
      : null;
  const isNoticedOnly = clue.status === 'noticed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Clue card: ${clue.name}`}
      onClick={() => {
        noirAudio.playPaperRustle();
        onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#11141B] border border-[#2B3548] shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#161B24] border-b border-[#252E3E] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-serif font-bold text-[#F4EDD8] leading-snug">
              {clue.name}
            </h3>
            <p className="text-xs font-mono text-[#9AA5B8] mt-1">
              {clue.category.toUpperCase()} · {clue.status.toUpperCase()} · Found at {foundLocName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              noirAudio.playPaperRustle();
              onClose();
            }}
            aria-label="Close clue card"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#8A96A8] hover:text-[#E5DEC9] hover:bg-[#202735] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Details Body */}
        <div className="p-5 overflow-y-auto overscroll-contain touch-pan-y space-y-4 flex-1 min-h-0">
          {linkedWeapon && !isNoticedOnly && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1017] border border-[#252E3E]">
              <button
                type="button"
                onClick={() => onInspectWeapon?.(linkedWeapon)}
                aria-label={`Inspect forensic photo of ${linkedWeapon.name}`}
                className="group relative w-16 h-16 rounded-lg overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#090C11] shrink-0 cursor-zoom-in"
              >
                <img
                  src={getWeaponImage(linkedWeapon)}
                  alt={linkedWeapon.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-[#F4EDD8]" />
                </span>
              </button>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#F4EDD8]">{linkedWeapon.name}</div>
                <div className="text-[11px] font-mono text-[#8A96A8]">
                  {linkedWeapon.category} · {linkedWeapon.portability}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#F6EED6] text-[#1E1A14] border border-[#C9B684] shadow-inner space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#6E5632]">
              Field Observation
            </div>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {isNoticedOnly
                ? `${clue.shortSummary} Observed at ${foundLocName} — awaiting suspect testimony to interpret fully.`
                : clue.detailedInspection}
            </p>
          </div>

          {!isNoticedOnly && clue.interpretationNote && (
            <div className="p-3 rounded-xl bg-emerald-950/35 border border-emerald-700/40 text-xs text-emerald-200 leading-relaxed">
              <div className="text-[10px] font-mono uppercase text-emerald-400 mb-1">
                Detective’s Deduction
              </div>
              {clue.interpretationNote}
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#0D1017] border border-[#232B3B] text-xs space-y-1.5 text-[#CBD5E1]">
            <div className="text-[10px] font-mono uppercase text-[#F59E0B]">
              Connected Board References
            </div>
            <div>
              Location: <span className="text-[#F4EDD8] font-medium">{foundLocName}</span>
              {leadsLocName ? (
                <>
                  {' '}
                  · Points to: <span className="text-[#93C5FD] font-medium">{leadsLocName}</span>
                </>
              ) : null}
            </div>
            {linkedPerson && (
              <div>
                Person: <span className="text-[#F4EDD8] font-medium">{linkedPerson.name}</span>
              </div>
            )}
            {linkedWeapon && !isNoticedOnly && (
              <div>
                Weapon: <span className="text-[#F4EDD8] font-medium">{linkedWeapon.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {(isEligibleProof || onToggleHideOnBoard) && (
          <div className="px-5 py-3 bg-[#141923] border-t border-[#232B3B] flex flex-wrap items-center justify-between gap-2 shrink-0">
            {onToggleHideOnBoard ? (
              <button
                type="button"
                onClick={() => {
                  onToggleHideOnBoard(clue.id);
                  onClose();
                }}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                  isHiddenOnBoard
                    ? 'bg-[#1D283A] hover:bg-[#26354D] text-[#E5DEC9] border-[#3B4B66]'
                    : 'bg-[#171D28] hover:bg-[#202838] text-[#B6C2D4] hover:text-[#F4EDD8] border-[#2C374A]'
                }`}
              >
                {isHiddenOnBoard ? (
                  <RotateCcw className="w-3.5 h-3.5 text-[#F59E0B]" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                <span>{isHiddenOnBoard ? 'Restore to Board' : 'Rule Out / Hide'}</span>
              </button>
            ) : (
              <span />
            )}

            {isEligibleProof && (
              <div className="flex flex-wrap items-center gap-2">
                {onTogglePinMotive && (
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePinMotive(clue.id);
                      onClose();
                    }}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                      isPinnedMotive
                        ? 'bg-[#D97706] hover:bg-[#B45309] text-white border-[#FBBF24]/50'
                        : isPinnedProof
                          ? 'bg-[#171D28] hover:bg-[#202838] text-[#B6C2D4] hover:text-[#F4EDD8] border-[#2C374A]'
                          : 'bg-[#3A2710] hover:bg-[#4D3415] text-[#FCD34D] border-[#92400E]/70'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{isPinnedMotive ? 'Unpin Motive' : 'Pin as Motive'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onTogglePinProof(clue.id);
                    onClose();
                  }}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                    isPinnedProof
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white border-[#F87171]/50'
                      : isPinnedMotive
                        ? 'bg-[#171D28] hover:bg-[#202838] text-[#B6C2D4] hover:text-[#F4EDD8] border-[#2C374A]'
                        : 'bg-[#3B161B] hover:bg-[#4E1D24] text-[#FCA5A5] border-[#991B1B]/70'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{isPinnedProof ? 'Unpin Decisive Proof' : 'Pin as Decisive Proof'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
