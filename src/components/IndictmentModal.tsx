/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Award,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Clock,
  Compass,
  ArrowRight,
  RotateCcw,
  BookOpen,
  ZoomIn
} from 'lucide-react';
import {
  CaseInstance,
  CharacterTemplate,
  Difficulty,
  IndictmentSubmission,
  MethodTemplate
} from '../types/game';
import { noirAudio } from '../utils/audio';
import { useModalScrollLock } from '../utils/modalScrollLock';
import { getCharacterMugshot } from '../utils/characterImages';
import { getWeaponImage } from '../utils/weaponImages';
import { MugshotModal } from './MugshotModal';
import { WeaponModal } from './WeaponModal';

interface IndictmentModalProps {
  currentCase: CaseInstance;
  difficulty: Difficulty;
  submission: IndictmentSubmission;
  secondsElapsed: number;
  totalTravelMinutes: number;
  onClose: () => void;
  onCaseSolved: (seed: string) => void;
  onSurrender?: () => void;
  onNewCase: () => void;
}

export const IndictmentModal: React.FC<IndictmentModalProps> = ({
  currentCase,
  difficulty,
  submission,
  secondsElapsed,
  totalTravelMinutes,
  onClose,
  onCaseSolved,
  onSurrender,
  onNewCase
}) => {
  const [showTruthReveal, setShowTruthReveal] = useState(false);
  const didNotifySolvedRef = useRef(false);
  useModalScrollLock(true);
  const [copiedShare, setCopiedShare] = useState(false);
  const [inspectedPortrait, setInspectedPortrait] = useState<{
    char: CharacterTemplate;
    contextLabel?: string;
  } | null>(null);
  const [inspectedWeapon, setInspectedWeapon] = useState<{
    weapon: MethodTemplate;
    contextLabel?: string;
  } | null>(null);

  // Evaluate the submission
  const solution = currentCase.hiddenSolution;
  const accusedCharacter = [currentCase.culprit, ...currentCase.suspects].find(
    (s) => s.id === submission.accusedCulpritId
  );
  const selectedWeapon = [currentCase.weapon, ...(currentCase.candidateWeapons || [])].find(
    (w) => w.id === submission.selectedWeaponId
  );
  const culpritCorrect = submission.accusedCulpritId === solution.culpritId;
  const weaponCorrect = submission.selectedWeaponId === solution.weaponId;
  const hasMotiveHypothesis = Boolean(submission.selectedMotiveId);
  const hasMotiveClue = Boolean(submission.selectedMotiveClueId);
  const pinnedMotiveClue = submission.selectedMotiveClueId
    ? currentCase.clues[submission.selectedMotiveClueId]
    : undefined;
  const motiveClueCorrect = Boolean(
    pinnedMotiveClue &&
      (pinnedMotiveClue.supports === 'motive' || pinnedMotiveClue.supports === 'motive_hook') &&
      (!pinnedMotiveClue.relatedCharacterId ||
        pinnedMotiveClue.relatedCharacterId === solution.culpritId)
  );
  const motiveHypothesisCorrect = submission.selectedMotiveId === solution.motiveId;
  const motiveCorrect =
    (hasMotiveHypothesis || hasMotiveClue) &&
    (!hasMotiveHypothesis || motiveHypothesisCorrect) &&
    (!hasMotiveClue || motiveClueCorrect);
  const decisiveEvidenceCorrect =
    submission.selectedDecisiveProofId === solution.decisiveProofClueId ||
    submission.selectedDecisiveProofId === solution.alibiBreakClueId;

  const totalPoints =
    (culpritCorrect ? 40 : 0) +
    (weaponCorrect ? 20 : 0) +
    (motiveCorrect ? 20 : 0) +
    (decisiveEvidenceCorrect ? 20 : 0);

  const isSolved = culpritCorrect && weaponCorrect && motiveCorrect && decisiveEvidenceCorrect;

  // Feedback analysis
  const feedbackLines: string[] = [];
  if (culpritCorrect) {
    feedbackLines.push(`✓ Identified the true perpetrator: ${currentCase.culprit.name}.`);
  } else {
    feedbackLines.push(`✗ Wrong suspect accused. The accused had an ironclad alibi; charges were dropped.`);
  }

  if (weaponCorrect) {
    feedbackLines.push(`✓ Correctly identified the murder weapon: ${currentCase.weapon.name}.`);
  } else {
    feedbackLines.push(`✗ Murder weapon mismatched with coroner's autopsy findings.`);
  }

  if (motiveCorrect) {
    feedbackLines.push(`✓ Proven motive: ${currentCase.motive.name}.`);
  } else {
    feedbackLines.push(`✗ Motive theory unproven in court.`);
  }

  if (decisiveEvidenceCorrect) {
    feedbackLines.push(`✓ Decisive physical evidence held up under cross-examination.`);
  } else {
    feedbackLines.push(`✗ Insufficient decisive physical proof linked to the crime scene.`);
  }

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  useEffect(() => {
    if (isSolved && !didNotifySolvedRef.current) {
      didNotifySolvedRef.current = true;
      onCaseSolved(currentCase.seed);
    }
  }, [isSolved, currentCase.seed, onCaseSolved]);

  const difficultyLabel =
    difficulty === 'hard'
      ? 'Hard'
      : difficulty === 'medium'
        ? 'Medium'
        : 'Easy';

  const handleSurrender = () => {
    noirAudio.playPaperRustle();
    setShowTruthReveal(true);
    onSurrender?.();
  };

  const handleShareSummary = () => {
    const isSurrendered = showTruthReveal && !isSolved;
    const verdictText = isSolved
      ? 'GUILTY AS CHARGED (100% Solved)'
      : isSurrendered
        ? `Surrendered (${totalPoints}% Proof)`
        : `Mistrial (${totalPoints}% Proof)`;
    const timingLine = isSurrendered
      ? `Status: Surrendered · Road Transit: ${totalTravelMinutes} mins`
      : `Solve Time: ${formatTime(secondsElapsed)} · Road Transit: ${totalTravelMinutes} mins`;
    const text = `NEW BAY POLICE REPORT // ${currentCase.caseNumber}
Seed: ${currentCase.seed} · Ruleset v${currentCase.rulesetVersion} · ${difficultyLabel}
Verdict: ${verdictText}
${timingLine}
Can you beat my investigation?`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overscroll-none">
      <div className="w-full max-w-2xl rounded-2xl bg-[#11141B] border border-[#273142] shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] min-h-0">
        {/* Newspaper / Trial Header Banner */}
        <div
          className={`p-6 border-b text-center space-y-1 shrink-0 ${
            isSolved
              ? 'bg-emerald-950/40 border-emerald-800/40'
              : 'bg-rose-950/40 border-rose-800/40'
          }`}
        >
          <div className="text-[11px] font-mono tracking-widest text-[#F59E0B] uppercase">
            SUPERIOR COURT OF NEW BAY · OFFICIAL VERDICT
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-[#F4EDD8] uppercase tracking-wide">
            {isSolved ? 'GUILTY AS CHARGED' : 'MISTRIAL DECLARED'}
          </h2>
          <p className="text-xs text-[#9AA5B8] font-sans">
            {isSolved
              ? 'Grand Jury returns unanimous indictment for First-Degree Murder.'
              : 'The District Attorney dismisses charges due to insufficient or contradictory proof.'}
          </p>
          <div className="pt-1 text-[10px] font-mono text-[#7E8B9E]">
            SEED: {currentCase.seed} · RULESET v{currentCase.rulesetVersion} · {difficultyLabel.toUpperCase()}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-6 flex-1 min-h-0">
          {/* Score & Investigation Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#151923] border border-[#252E3E]">
              <span className="text-[10px] font-mono text-[#7B889C] block">DEDUCTION ACCURACY</span>
              <span
                className={`text-xl font-bold font-mono ${
                  isSolved ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {totalPoints}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#151923] border border-[#252E3E]">
              <span className="text-[10px] font-mono text-[#7B889C] block">
                {showTruthReveal && !isSolved ? 'INVESTIGATION' : 'PLAY TIME'}
              </span>
              <span className="text-xl font-bold font-mono text-[#E5DEC9]">
                {showTruthReveal && !isSolved ? 'Surrendered' : formatTime(secondsElapsed)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#151923] border border-[#252E3E]">
              <span className="text-[10px] font-mono text-[#7B889C] block">ROAD TRANSIT</span>
              <span className="text-xl font-bold font-mono text-[#E5DEC9]">
                {totalTravelMinutes}m
              </span>
            </div>
          </div>

          {/* Accused Suspect, Victim & Selected Weapon Dossier Header */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              selectedWeapon ? 'lg:grid-cols-3' : ''
            } gap-3`}
          >
            {accusedCharacter && (
              <div className="p-3 rounded-xl bg-[#131720] border border-[#263042] flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    noirAudio.playPaperRustle();
                    setInspectedPortrait({
                      char: accusedCharacter,
                      contextLabel: 'Indicted Suspect'
                    });
                  }}
                  aria-label={`View portrait artwork of ${accusedCharacter.name}`}
                  title={`Click to view ${accusedCharacter.name}'s portrait`}
                  className="group relative w-12 h-12 rounded-lg overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                >
                  <img
                    src={getCharacterMugshot(accusedCharacter)}
                    alt={accusedCharacter.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-3.5 h-3.5 text-[#F4EDD8]" />
                  </span>
                </button>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-[#F59E0B] block">
                    Indicted Suspect
                  </span>
                  <div className="text-xs font-serif font-bold text-[#E5DEC9] truncate">
                    {accusedCharacter.name}
                  </div>
                  <div className="text-[10px] text-[#8A96A8] truncate">{accusedCharacter.title}</div>
                </div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-[#131720] border border-[#263042] flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  noirAudio.playPaperRustle();
                  setInspectedPortrait({
                    char: currentCase.victim,
                    contextLabel: 'Case Victim'
                  });
                }}
                aria-label={`View portrait artwork of ${currentCase.victim.name}`}
                title={`Click to view ${currentCase.victim.name}'s portrait`}
                className="group relative w-12 h-12 rounded-lg overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              >
                <img
                  src={getCharacterMugshot(currentCase.victim)}
                  alt={currentCase.victim.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-3.5 h-3.5 text-[#F4EDD8]" />
                </span>
              </button>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-[#60A5FA] block">
                  Victim
                </span>
                <div className="text-xs font-serif font-bold text-[#E5DEC9] truncate">
                  {currentCase.victim.name}
                </div>
                <div className="text-[10px] text-[#8A96A8] truncate">{currentCase.victim.title}</div>
              </div>
            </div>
            {selectedWeapon && (
              <div className="p-3 rounded-xl bg-[#131720] border border-[#263042] flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    noirAudio.playPaperRustle();
                    setInspectedWeapon({
                      weapon: selectedWeapon,
                      contextLabel: 'Indicted Murder Weapon'
                    });
                  }}
                  aria-label={`Inspect forensic photo of ${selectedWeapon.name}`}
                  title={`Click to inspect ${selectedWeapon.name}`}
                  className="group relative w-12 h-12 rounded-lg overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                >
                  <img
                    src={getWeaponImage(selectedWeapon)}
                    alt={selectedWeapon.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-3.5 h-3.5 text-[#F4EDD8]" />
                  </span>
                </button>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-[#F59E0B] block">
                    Indicted Weapon
                  </span>
                  <div className="text-xs font-serif font-bold text-[#E5DEC9] truncate">
                    {selectedWeapon.name}
                  </div>
                  <div className="text-[10px] text-[#8A96A8] truncate">{selectedWeapon.category}</div>
                </div>
              </div>
            )}
          </div>

          {/* D.A. Line-by-Line Breakdown */}
          <div className="p-4 rounded-xl bg-[#0E1117] border border-[#232B3B] space-y-2.5">
            <span className="text-xs font-mono font-bold text-[#E5DEC9] uppercase tracking-wider block border-b border-[#202736] pb-2">
              District Attorney's Review
            </span>
            {feedbackLines.map((line, idx) => (
              <div
                key={idx}
                className={`text-xs font-sans ${
                  line.startsWith('✓') ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {line}
              </div>
            ))}
          </div>

          {/* The Hidden Truth Chronology Reveal */}
          {(isSolved || showTruthReveal) ? (
            <div className="p-4 rounded-xl bg-[#131822] border border-[#283244] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F59E0B]">
                <BookOpen className="w-4 h-4" />
                <span>WHAT REALLY HAPPENED THAT NIGHT</span>
              </div>
              <p className="text-xs text-[#A7B4C6] leading-relaxed">
                {solution.truthSummary}
              </p>

              <div className="p-2.5 rounded-lg bg-[#0E121A] border border-[#242E40] flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    noirAudio.playPaperRustle();
                    setInspectedWeapon({
                      weapon: currentCase.weapon,
                      contextLabel: 'Confirmed Murder Weapon'
                    });
                  }}
                  aria-label={`Inspect forensic photo of ${currentCase.weapon.name}`}
                  title={`Click to inspect ${currentCase.weapon.name}`}
                  className="group relative w-12 h-12 rounded-lg overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                >
                  <img
                    src={getWeaponImage(currentCase.weapon)}
                    alt={currentCase.weapon.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-3.5 h-3.5 text-[#F4EDD8]" />
                  </span>
                </button>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                    Confirmed Murder Weapon
                  </span>
                  <div className="text-xs font-semibold text-[#E5DEC9] truncate">
                    {currentCase.weapon.name}
                  </div>
                  <div className="text-[10px] text-[#8A96A8] truncate">
                    {currentCase.weapon.category} · {currentCase.weapon.portability}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#202836] space-y-2">
                <span className="text-[10px] font-mono text-[#7E8B9E] block uppercase">
                  Step-by-Step Chronology:
                </span>
                {solution.stepByStepChronology.map((step, idx) => (
                  <div key={idx} className="text-xs text-[#CBD5E1] flex items-start gap-2">
                    <span className="font-mono text-[#F59E0B] shrink-0">{step.time}</span>
                    <span>{step.event}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSurrender}
              className="w-full py-2.5 px-4 rounded-xl bg-[#161B24] hover:bg-[#1E2532] border border-[#2B3547] text-xs font-medium text-[#8F9CAE] hover:text-[#E5DEC9] transition-colors cursor-pointer"
            >
              Surrender & Reveal True Case Chronology
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 bg-[#141822] border-t border-[#222A38] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShareSummary}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#222A39] hover:bg-[#2C3547] text-xs font-semibold text-[#E5DEC9] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{copiedShare ? 'Copied to Clipboard!' : 'Share Seed Result'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isSolved && !showTruthReveal ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#252E3E] hover:bg-[#313C50] text-xs font-semibold text-[#E5DEC9] transition-colors cursor-pointer"
              >
                Return to Murder Board
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  noirAudio.playPaperRustle();
                  onNewCase();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0E12] text-xs font-bold transition-all shadow-md shadow-[#F59E0B]/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Investigate Another Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
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
