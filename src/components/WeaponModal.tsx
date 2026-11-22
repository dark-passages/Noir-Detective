/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, Pin, EyeOff, RotateCcw } from 'lucide-react';
import { MethodTemplate } from '../types/game';
import { getWeaponImage } from '../utils/weaponImages';
import { noirAudio } from '../utils/audio';
import { useModalScrollLock } from '../utils/modalScrollLock';

interface WeaponModalProps {
  weapon: MethodTemplate | null;
  contextLabel?: string;
  actionLabel?: string;
  isActionActive?: boolean;
  onAction?: () => void;
  secondaryActionLabel?: string;
  isSecondaryActionActive?: boolean;
  onSecondaryAction?: () => void;
  onClose: () => void;
}

export const WeaponModal: React.FC<WeaponModalProps> = ({
  weapon,
  contextLabel,
  actionLabel,
  isActionActive,
  onAction,
  secondaryActionLabel,
  isSecondaryActionActive,
  onSecondaryAction,
  onClose
}) => {
  useModalScrollLock(Boolean(weapon));
  useEffect(() => {
    if (!weapon) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        noirAudio.playPaperRustle();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [weapon, onClose]);

  if (!weapon) return null;

  const imageUrl = getWeaponImage(weapon);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Forensic exhibit: ${weapon.name}`}
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
              {weapon.name}
            </h3>
            <p className="text-xs text-[#9AA5B8] mt-0.5 truncate">
              {weapon.category} · {weapon.portability}
              {contextLabel ? ` · ${contextLabel}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              noirAudio.playPaperRustle();
              onClose();
            }}
            aria-label="Close evidence photo"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#8A96A8] hover:text-[#E5DEC9] hover:bg-[#202735] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full Evidence Photo */}
        <div className="p-5 overflow-y-auto overscroll-contain touch-pan-y space-y-4 flex-1 min-h-0">
          <div className="relative rounded-xl overflow-hidden border border-[#2C3648] bg-[#0A0D12] flex items-center justify-center">
            <img
              src={imageUrl}
              alt={weapon.name}
              referrerPolicy="no-referrer"
              className="w-full max-h-[55vh] object-contain select-none"
            />
          </div>

          {/* Forensic Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-[#A8B3C5]">
              <span className="text-[#F59E0B] uppercase">{weapon.category}</span>
              <span aria-hidden="true" className="text-[#4B5669]">·</span>
              <span>Portability: {weapon.portability}</span>
            </div>
            <p className="text-xs md:text-sm text-[#D5CDBC] leading-relaxed">
              {weapon.description}
            </p>
            <div className="p-3 rounded-lg bg-[#0E1218] border border-[#232B3B] text-[11px] font-mono text-[#9BB0C9] leading-relaxed">
              <span className="text-[#F59E0B] block mb-0.5 uppercase">Forensic Signature</span>
              {weapon.evidenceSignature}
            </div>
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
