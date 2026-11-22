/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Clock, MapPin, Search, Grid, FileText } from 'lucide-react';
import { noirAudio } from '../utils/audio';
import { formatInvestigationClock } from '../engine/timeUtils';

interface NavbarProps {
  activeView: 'desk' | 'map' | 'scene' | 'board';
  setActiveView: (view: 'desk' | 'map' | 'scene' | 'board') => void;
  caseTitle: string;
  seed: string;
  secondsElapsed: number;
  investigationMinutes?: number;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  caseTitle,
  seed,
  secondsElapsed,
  investigationMinutes,
  isMuted,
  setIsMuted
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioToggle = () => {
    const newState = noirAudio.toggleMute();
    setIsMuted(newState);
  };

  const navItems = [
    { id: 'desk', label: 'Office Desk', icon: FileText },
    { id: 'map', label: 'City Map', icon: MapPin },
    { id: 'scene', label: 'Investigation', icon: Search },
    { id: 'board', label: 'Case Board', icon: Grid }
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0C0E12]/95 backdrop-blur-md border-b border-[#252B38] px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 lg:gap-5">
        {/* Zone 1: Brand title wordmark & active case info (visible on all devices) */}
        <div className="order-1 flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setActiveView('desk')}
            className="text-left group cursor-pointer focus-visible:outline-none min-w-0"
          >
            <span className="block text-sm sm:text-base font-serif font-bold tracking-wider text-[#E5DEC9] group-hover:text-[#F59E0B] transition-colors whitespace-nowrap">
              NEW BAY DISPATCH
            </span>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#8A95A5] font-mono min-w-0">
              <span className="shrink-0">{seed}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{caseTitle}</span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (visible on all devices) */}
        <nav className="order-3 lg:order-2 w-full lg:w-auto grid grid-cols-4 lg:flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs md:text-sm font-medium pt-1.5 lg:pt-0 border-t border-[#1D2330] lg:border-t-0 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  noirAudio.playPaperRustle();
                  setActiveView(item.id);
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 md:py-2 rounded-md transition-all whitespace-nowrap shrink-0 min-h-[40px] md:min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-[#1C222E] text-[#F59E0B] font-semibold border border-[#374257]'
                    : 'text-[#9AA5B8] hover:text-[#E5DEC9] hover:bg-[#161B24]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-[#F59E0B]' : 'text-[#727E91]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Investigation Clock, Timer & Audio Controls */}
        <div className="order-2 lg:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
          {investigationMinutes !== undefined && (
            <div
              title="Investigation Timeline Clock"
              className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded bg-[#13171F] border border-[#232A38] text-[10px] sm:text-[11px] font-mono text-[#93C5FD] tabular-nums whitespace-nowrap"
            >
              <span>{formatInvestigationClock(investigationMinutes)}</span>
            </div>
          )}

          {/* Stopwatch */}
          <div className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded bg-[#13171F] border border-[#232A38] text-[10px] sm:text-xs font-mono text-[#D4AF37] tabular-nums">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{formatTime(secondsElapsed)}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleAudioToggle}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-[#161B24] border border-[#262F3E] text-[#9AA5B8] hover:text-[#E5DEC9] transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#7B8798]" /> : <Volume2 className="w-4 h-4 text-[#F59E0B]" />}
          </button>
        </div>
      </div>
    </header>
  );
};
