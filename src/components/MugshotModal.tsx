/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, Pin, EyeOff, RotateCcw } from 'lucide-react';
import { CharacterTemplate } from '../types/game';
import { getCharacterMugshot } from '../utils/characterImages';
import { noirAudio } from '../utils/audio';
import { useModalScrollLock } from '../utils/modalScrollLock';

interface MugshotModalProps {
  character: CharacterTemplate | null;
  contextLabel?: string;
  extraNotes?: { label: string; value: string }[];
  actionLabel?: string;
  isActionActive?: boolean;
  onAction?: () => void;
  secondaryActionLabel?: string;
  isSecondaryActionActive?: boolean;
  onSecondaryAction?: () => void;
  onClose: () => void;
}

const AGE_BAND_LABELS: Record<CharacterTemplate['ageBand'], string> = {
  young_adult: 'Young Adult',
  middle_aged: 'Middle-Aged',
  elder: 'Elder'
};

export const MugshotModal: React.FC<MugshotModalProps> = ({
  character,
  contextLabel,
  extraNotes,
  actionLabel,
  isActionActive,
  onAction,
  secondaryActionLabel,
  isSecondaryActionActive,
  onSecondaryAction,
  onClose
}) => {
  useModalScrollLock(Boolean(character));
  useEffect(() => {
    if (!character) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        noirAudio.playPaperRustle();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [character, onClose]);

  if (!character) return null;

  const mugshotUrl = getCharacterMugshot(character);
  const hatLabel =
    character.avatarStyle.hat && character.avatarStyle.hat !== 'None'
      ? character.avatarStyle.hat
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Portrait of ${character.name}`}
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
            <h3 className="text-lg md:text-xl font-serif font-bold text-[#F4EDD8] truncate">
              {character.name}
            </h3>
            <p className="text-xs text-[#9AA5B8] mt-0.5 truncate">
              {character.title}
              {contextLabel ? ` · ${contextLabel}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              noirAudio.playPaperRustle();
              onClose();
            }}
            aria-label="Close portrait"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#8A96A8] hover:text-[#E5DEC9] hover:bg-[#202735] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full Mugshot Artwork */}
        <div className="p-5 overflow-y-auto overscroll-contain touch-pan-y space-y-4 flex-1 min-h-0">
          <div className="relative rounded-xl overflow-hidden border border-[#2C3648] bg-[#0A0D12] flex items-center justify-center">
            <img
              src={mugshotUrl}
              alt={character.name}
              referrerPolicy="no-referrer"
              className="w-full max-h-[55vh] object-contain select-none"
            />
          </div>

          {/* Identification Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-[#A8B3C5]">
              <span>{AGE_BAND_LABELS[character.ageBand]}</span>
              <span aria-hidden="true" className="text-[#4B5669]">·</span>
              <span>Attire: {character.avatarStyle.collar}</span>
              {hatLabel && (
                <>
                  <span aria-hidden="true" className="text-[#4B5669]">·</span>
                  <span>Hat: {hatLabel}</span>
                </>
              )}
            </div>
            <p className="text-xs md:text-sm text-[#D5CDBC] leading-relaxed">
              {character.publicPersona}
            </p>
            {extraNotes && extraNotes.length > 0 && (
              <div className="pt-2 border-t border-[#232B3B] space-y-2">
                {extraNotes.map((note, idx) => (
                  <div
                    key={`${note.label}-${idx}`}
                    className="p-2.5 rounded-lg bg-[#0E1218] border border-[#232B3B]"
                  >
                    <div className="text-[10px] font-mono uppercase text-[#F59E0B] mb-0.5">
                      {note.label}
                    </div>
                    <div className="text-xs text-[#CBD5E1] leading-relaxed">{note.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {((onAction && actionLabel) || (onSecondaryAction && secondaryActionLabel)) && (
          <div className="px-5 py-3 bg-[#141923] border-t border-[#232B3B] flex flex-wrap items-center justify-between gap-2 shrink-0">
            {onSecondaryAction && secondaryActionLabel ? (
              <button
                type="button"
                onClick={() => {
                  onSecondaryAction();
                  onClose();
                }}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                  isSecondaryActionActive
                    ? 'bg-[#1D283A] hover:bg-[#26354D] text-[#E5DEC9] border-[#3B4B66]'
                    : 'bg-[#171D28] hover:bg-[#202838] text-[#B6C2D4] hover:text-[#F4EDD8] border-[#2C374A]'
                }`}
              >
                {isSecondaryActionActive ? (
                  <RotateCcw className="w-3.5 h-3.5 text-[#F59E0B]" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                <span>{secondaryActionLabel}</span>
              </button>
            ) : (
              <span />
            )}

            {onAction && actionLabel && (
              <button
                type="button"
                onClick={() => {
                  onAction();
                  onClose();
                }}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActionActive
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                    : 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0E12]'
                }`}
              >
                <Pin className="w-3.5 h-3.5" />
                <span>{actionLabel}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
