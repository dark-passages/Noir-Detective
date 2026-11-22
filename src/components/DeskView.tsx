/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Hash,
  Shield,
  Sparkles,
  ArrowRight,
  Award,
  Compass,
  FileCheck,
  Copy,
  Check,
  ZoomIn,
Stethoscope
} from 'lucide-react';
import { CaseInstance, Difficulty } from '../types/game';
import { noirAudio } from '../utils/audio';
import { getDailySeedString } from '../engine/caseGenerator';
import { getCharacterMugshot } from '../utils/characterImages';
import { MugshotModal } from './MugshotModal';

interface DeskViewProps {
  currentCase: CaseInstance;
  onSelectDaily: () => void;
  onSelectSeed: (seed: string, diff: Difficulty) => void;
  onStartInvestigation: () => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  solvedSeeds: string[];
}

export const DeskView: React.FC<DeskViewProps> = ({
  currentCase,
  onSelectDaily,
  onSelectSeed,
  onStartInvestigation,
  difficulty,
  setDifficulty,
  solvedSeeds
}) => {
  const [customSeedInput, setCustomSeedInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showVictimPortrait, setShowVictimPortrait] = useState(false);

  const todayDailySeed = getDailySeedString();
  const isDailyLoaded = currentCase.seed === todayDailySeed;

  const handleRandomSeed = () => {
    noirAudio.playTypewriterKey();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setCustomSeedInput(`CASE-${randomNum}`);
  };

  const handleApplySeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSeedInput.trim()) return;
    noirAudio.playPaperRustle();
    onSelectSeed(customSeedInput.trim().toUpperCase(), difficulty);
  };

  const handleCopyCaseNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentCase.seed);
    }
    setCopied(true);
    noirAudio.playPaperRustle();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8 pb-24 md:pb-12">

      {/* 1. Title of the Case, Police Report, Coroner's Findings & Examine Button */}
      <section className="rounded-2xl bg-[#141821] border border-[#262F3E] p-6 md:p-8 shadow-xl space-y-6">
        {/* Title Header with Full-Width Title, Per-Line Summary */}
        <div className="flex flex-col items-start gap-5 pb-6 border-b border-[#242C3A]">
          <div className="w-full space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#F59E0B] tracking-wider uppercase">
              <span className="text-[#E5DEC9] font-bold">CASE #{currentCase.seed}</span>
              <button
                type="button"
                onClick={handleCopyCaseNumber}
                className="px-2.5 py-1 rounded bg-[#1B222E] hover:bg-[#253042] text-[10px] text-[#F59E0B] border border-[#F59E0B]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy exact Case Number to share with a friend"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied Case #' : 'Copy Case #'}</span>
              </button>
            </div>
            <h1 className="w-full text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#F4EDD8] tracking-tight">
              {currentCase.caseTitle}
            </h1>
            <div className="flex items-start gap-4 pt-1">
              <button
                type="button"
                onClick={() => {
                  noirAudio.playPaperRustle();
                  setShowVictimPortrait(true);
                }}
                aria-label={`View portrait artwork of ${currentCase.victim.name}`}
                title={`Click to view ${currentCase.victim.name}'s portrait`}
                className="group relative w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 shadow-md transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              >
                <img
                  src={getCharacterMugshot(currentCase.victim)}
                  alt={currentCase.victim.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-5 h-5 text-[#F4EDD8]" />
                </span>
              </button>
              <div className="text-sm md:text-base text-[#9AA5B8] font-sans space-y-1">
                <p>
                  Victim: <strong className="text-[#E5DEC9]">{currentCase.victim.name}</strong>{' '}
                  <span className="text-xs text-[#7E8B9E]">({currentCase.victim.title})</span>
                </p>
                <p>
                  Found dead at:{' '}
                  <strong className="text-[#E5DEC9]">
                    {currentCase.locations[currentCase.crimeSceneLocationId]?.name}
                  </strong>
                </p>
                <p>
                  Estimated time of demise:{' '}
                  <span className="font-mono text-[#F59E0B]">{currentCase.crimeTime}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Police Dispatch Memo and Coroner's Findings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Police Dispatch Report */}
          <div className="p-6 rounded-xl bg-[#11141B] border border-[#242C3A] shadow-inner font-mono text-xs text-[#D5CDBC] leading-relaxed space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242C3A] pb-3 text-[11px] text-[#F59E0B]">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>CONFIDENTIAL POLICE DISPATCH</span>
              </div>
            </div>
            <p className="whitespace-pre-line text-[#C4BBA7] font-mono selection:bg-[#DC2626]/40">
              {currentCase.dispatchMemo}
            </p>
          </div>

          {/* 2. Coroner's Findings */}
          <div className="p-6 rounded-xl bg-[#141720] border border-[#27303F] space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#283244] pb-3 text-[11px] text-[#60A5FA]">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>COUNTY CORONER'S INITIAL FINDINGS</span>
              </div>
              <span>REF: {currentCase.weapon.category.toUpperCase()}</span>
            </div>
            <div className="text-[#B9C4D4] whitespace-pre-line space-y-2 leading-relaxed">
              {currentCase.autopsyReport}
            </div>
          </div>
        </div>

        {/* Bottom: Difficulty Selector & "Examine Crime Scene" Button */}
        <div className="pt-4 border-t border-[#232C3A] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#10131A] p-4 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#69778D]">
                Difficulty:
              </span>
              <div className="inline-flex rounded-lg border border-[#252C3B] p-0.5 bg-[#0C0F14]">
                {(
                  [
                    { id: 'easy', label: 'Easy' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'hard', label: 'Hard' }
                  ] as const
                ).map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      noirAudio.playTypewriterKey();
                      setDifficulty(tier.id);
                    }}
                    className={`py-1.5 px-3 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      difficulty === tier.id
                        ? 'bg-[#1C222E] text-[#F59E0B] font-semibold border border-[#3E4D68]'
                        : 'text-[#7A879B] hover:text-[#C4CFDE]'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onStartInvestigation}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0E12] font-semibold text-sm shadow-md shadow-[#F59E0B]/20 active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <span>Get to work</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 2. Today's Daily Mystery */}
      <section className="rounded-2xl bg-[#141821] border border-[#262F3E] p-6 md:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#F4EDD8]">
                  Today's Daily Mystery
                </h2>
                {isDailyLoaded && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-xs text-[#828FA3] font-mono mt-0.5">
                {todayDailySeed} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {solvedSeeds.includes(todayDailySeed) && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/40">
                <FileCheck className="w-3.5 h-3.5" /> Solved Today
              </span>
            )}
            <button
              onClick={() => {
                if (!isDailyLoaded) {
                  noirAudio.playPaperRustle();
                  onSelectDaily();
                }
              }}
              disabled={isDailyLoaded}
              className={`w-full sm:w-auto py-2.5 px-5 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-2 min-h-[42px] ${
                isDailyLoaded
                  ? 'bg-[#181D26] text-[#6E7B8E] border-[#252E3E] cursor-not-allowed opacity-60'
                  : 'bg-[#202736] hover:bg-[#283245] text-[#E5DEC9] border-[#343F54] hover:border-[#F59E0B] cursor-pointer shadow-sm active:scale-95'
              }`}
              title={isDailyLoaded ? "Today's daily mystery is currently loaded" : "Load today's synchronized mystery case"}
            >
              <Compass className="w-4 h-4 text-[#F59E0B]" />
              <span>{isDailyLoaded ? 'Currently Loaded Mystery' : "Load Today's Mystery"}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-[#9AA5B8] leading-relaxed">
          A synchronized case generated deterministically for all detectives worldwide today. The crime, suspects, weapon, and clues are identical for everyone investigating today's docket.
        </p>
      </section>

      {/* 3. Custom Case */}
      <section className="rounded-2xl bg-[#141821] border border-[#262F3E] p-6 md:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#60A5FA] shrink-0">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#F4EDD8]">Custom Case</h2>
            <p className="text-xs text-[#828FA3]">
              Enter a string that will be used as a seed for the case generator.
            </p>
          </div>
        </div>

        <form onSubmit={handleApplySeed} className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={customSeedInput}
                onChange={(e) => setCustomSeedInput(e.target.value)}
                placeholder="Enter Case Number / Seed (e.g. CASE-4092, NOIR-77, COLD-HARBOR)"
                className="w-full bg-[#0C0F14] border border-[#283244] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#E5DEC9] placeholder-[#5A667A] focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
              <button
                type="button"
                onClick={handleRandomSeed}
                title="Generate Random Case Number"
                className="absolute right-2 top-2 p-1 text-[#828FA3] hover:text-[#F59E0B] transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!customSeedInput.trim()}
              className="py-2.5 px-5 rounded-lg bg-[#232A39] hover:bg-[#2C3547] text-xs font-semibold text-[#E5DEC9] border border-[#343F54] hover:border-[#F59E0B] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap min-h-[42px]"
            >
              <span>Load Custom Case</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B]" />
            </button>
          </div>

          <div className="text-[11px] font-mono text-[#6E7B8E] pt-1">
            Share this exact case number with a friend to investigate the identical crime.
          </div>
        </form>

        {solvedSeeds.length > 0 && (
          <div className="pt-2 border-t border-[#1F2736] flex items-center justify-between text-xs text-[#8A96A8]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#F59E0B]" />
              <span>Solved Cases in Dossier:</span>
            </div>
            <span className="font-mono font-semibold text-[#E5DEC9]">
              {solvedSeeds.length} Files
            </span>
          </div>
        )}
      </section>

      <MugshotModal
        character={showVictimPortrait ? currentCase.victim : null}
        contextLabel={`Victim · Case #${currentCase.seed}`}
        onClose={() => setShowVictimPortrait(false)}
      />
    </div>
  );
};
