/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
  useCallback
} from 'react';
import {
  ShieldAlert,
  RotateCcw,
  Link2,
  BookOpen,
  FileText,
  MessageSquare,
  Lightbulb,
  ZoomIn,
  Pin,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  CaseInstance,
  CharacterCaseInstance,
  ClueInstance,
  IndictmentSubmission,
  InterviewState,
  JournalEntry,
  LocationCaseInstance,
  MethodTemplate,
  getDemeanorPinStyle
} from '../types/game';
import { noirAudio } from '../utils/audio';
import { getCharacterMugshot } from '../utils/characterImages';
import { getWeaponImage } from '../utils/weaponImages';
import { MugshotModal } from './MugshotModal';
import { WeaponModal } from './WeaponModal';
import { ClueDetailModal } from './ClueDetailModal';
import { IndictmentBuilder } from './IndictmentBuilder';
import { MobileBoardTab, MobileCaseBoard } from './MobileCaseBoard';
import { MASTER_LOCATIONS, MASTER_WEAPONS } from '../engine/templates';
import { findShortestRoadPath } from '../engine/fragments';
import {
  BoardNodeKey,
  BoardStringEdge,
  BoardStringMode,
  buildBoardStringEdges,
  filterBoardEdgesForMode,
  getDiscoveredBoardPeople,
  getDiscoveredBoardWeapons,
  getEffectiveHiddenNodeKeys,
  getRelevantBoardClues,
  isClueCharacterLinkVisible
} from '../engine/boardGraph';
import { CharacterInterviewStatus } from '../engine/mapStatus';

interface CaseBoardViewProps {
  currentCase: CaseInstance;
  locations?: Record<string, LocationCaseInstance>;
  visitedLocationIds?: string[];
  currentLocationId?: string;
  discoveredClues: ClueInstance[];
  livingCharacters: CharacterCaseInstance[];
  interviewStates?: Record<string, InterviewState>;
  characterStatuses?: Record<string, CharacterInterviewStatus>;
  perjuryExposedByChar?: Record<string, boolean>;
  journalEntries: JournalEntry[];
  submission: IndictmentSubmission;
  hiddenNodeKeys?: BoardNodeKey[];
  onToggleHideNode?: (nodeKey: BoardNodeKey) => void;
  onUpdateSubmission: (updates: Partial<IndictmentSubmission>) => void;
  onOpenIndictment: () => void;
}

interface PinPoint {
  x: number;
  y: number;
}

const PIN_TILT_CLASSES = [
  '-rotate-1',
  'rotate-1',
  '-rotate-[1.5deg]',
  'rotate-[1.5deg]',
  'rotate-0'
];

export const CaseBoardView: React.FC<CaseBoardViewProps> = ({
  currentCase,
  locations: locationsProp,
  visitedLocationIds = [],
  currentLocationId,
  discoveredClues,
  livingCharacters,
  interviewStates = {},
  characterStatuses = {},
  perjuryExposedByChar = {},
  journalEntries,
  submission,
  hiddenNodeKeys = [],
  onToggleHideNode,
  onUpdateSubmission,
  onOpenIndictment
}) => {
  const locations = locationsProp || currentCase.locations;
  const [boardTab, setBoardTab] = useState<'board' | 'journal'>('board');
  const [clueFilter, setClueFilter] = useState<'all' | 'leads' | 'weapons'>('all');
  const [stringMode, setStringMode] = useState<BoardStringMode>('focused');
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobileBoardTab>('suspects');
  const [focusedNode, setFocusedNode] = useState<BoardNodeKey | null>(null);

  const [inspectedPortrait, setInspectedPortrait] = useState<{
    char: CharacterCaseInstance;
    contextLabel?: string;
    extraNotes?: { label: string; value: string }[];
  } | null>(null);
  const [inspectedWeapon, setInspectedWeapon] = useState<{
    weapon: MethodTemplate;
    contextLabel?: string;
  } | null>(null);
  const [inspectedClue, setInspectedClue] = useState<ClueInstance | null>(null);

  const allSuspects = useMemo(
    () =>
      [currentCase.culprit, ...currentCase.suspects].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [currentCase.culprit, currentCase.suspects]
  );
  const suspectIdSet = useMemo(
    () => new Set(allSuspects.map((s) => s.id)),
    [allSuspects]
  );
  const allWeapons = useMemo(
    () =>
      currentCase.candidateWeapons && currentCase.candidateWeapons.length > 0
        ? currentCase.candidateWeapons
        : [currentCase.weapon],
    [currentCase.candidateWeapons, currentCase.weapon]
  );
  const allMotives = useMemo(
    () =>
      currentCase.candidateMotives && currentCase.candidateMotives.length > 0
        ? currentCase.candidateMotives
        : [currentCase.motive],
    [currentCase.candidateMotives, currentCase.motive]
  );

  const discoveredLocations = useMemo(
    () => Object.values(locations).filter((l) => l.discovered),
    [locations]
  );

  const hiddenKeySet = useMemo(() => new Set<BoardNodeKey>(hiddenNodeKeys), [hiddenNodeKeys]);
  const effectiveHiddenKeys = useMemo(
    () => getEffectiveHiddenNodeKeys(hiddenKeySet, submission),
    [hiddenKeySet, submission]
  );

  const allDiscoveredPeople = useMemo(
    () =>
      getDiscoveredBoardPeople({
        livingCharacters,
        visitedLocationIds,
        interviewStates,
        discoveredClues,
        accusedCulpritId: submission.accusedCulpritId
      }),
    [
      livingCharacters,
      visitedLocationIds,
      interviewStates,
      discoveredClues,
      submission.accusedCulpritId
    ]
  );

  const discoveredPeopleIdSet = useMemo(
    () => new Set(allDiscoveredPeople.map((p) => p.id)),
    [allDiscoveredPeople]
  );

  const discoveredSuspects = useMemo(
    () => allSuspects.filter((s) => discoveredPeopleIdSet.has(s.id)),
    [allSuspects, discoveredPeopleIdSet]
  );

  const allDiscoveredWeapons = useMemo(
    () =>
      getDiscoveredBoardWeapons({
        caseWeapons: allWeapons,
        discoveredClues,
        selectedWeaponId: submission.selectedWeaponId
      }),
    [allWeapons, discoveredClues, submission.selectedWeaponId]
  );

  const allBoardCluesUnfiltered = useMemo(
    () => getRelevantBoardClues(discoveredClues, 'all'),
    [discoveredClues]
  );

  const filteredRawClues = useMemo(
    () => getRelevantBoardClues(discoveredClues, clueFilter),
    [discoveredClues, clueFilter]
  );

  const boardPeople = useMemo(
    () =>
      showHidden
        ? allDiscoveredPeople
        : allDiscoveredPeople.filter((p) => !effectiveHiddenKeys.has(`char:${p.id}`)),
    [allDiscoveredPeople, effectiveHiddenKeys, showHidden]
  );

  const boardWeapons = useMemo(
    () =>
      showHidden
        ? allDiscoveredWeapons
        : allDiscoveredWeapons.filter((bw) => !effectiveHiddenKeys.has(`weapon:${bw.weapon.id}`)),
    [allDiscoveredWeapons, effectiveHiddenKeys, showHidden]
  );

  const boardClues = useMemo(
    () =>
      showHidden
        ? filteredRawClues
        : filteredRawClues.filter((c) => !effectiveHiddenKeys.has(`clue:${c.id}`)),
    [filteredRawClues, effectiveHiddenKeys, showHidden]
  );

  const totalHiddenCount = useMemo(() => {
    let count = 0;
    for (const p of allDiscoveredPeople) {
      if (effectiveHiddenKeys.has(`char:${p.id}`)) count++;
    }
    for (const w of allDiscoveredWeapons) {
      if (effectiveHiddenKeys.has(`weapon:${w.weapon.id}`)) count++;
    }
    for (const c of allBoardCluesUnfiltered) {
      if (effectiveHiddenKeys.has(`clue:${c.id}`)) count++;
    }
    return count;
  }, [allDiscoveredPeople, allDiscoveredWeapons, allBoardCluesUnfiltered, effectiveHiddenKeys]);

  const evidenceClues = useMemo(
    () =>
      discoveredClues.filter(
        (c) =>
          c.status !== 'undiscovered' &&
          (c.supports === 'culprit' ||
            c.supports === 'alibi_break' ||
            c.supports === 'weapon' ||
            c.supports === 'motive' ||
            c.supports === 'motive_hook' ||
            c.supports === 'red_herring')
      ),
    [discoveredClues]
  );

  const activeGraphHiddenSet = showHidden ? undefined : effectiveHiddenKeys;

  const boardEdges: BoardStringEdge[] = useMemo(
    () =>
      buildBoardStringEdges({
        activeCase: currentCase,
        locations,
        boardPeople: allDiscoveredPeople,
        boardWeapons: allDiscoveredWeapons,
        boardClues: filteredRawClues,
        submission,
        hiddenNodeKeys: activeGraphHiddenSet
      }),
    [
      currentCase,
      locations,
      allDiscoveredPeople,
      allDiscoveredWeapons,
      filteredRawClues,
      submission,
      activeGraphHiddenSet
    ]
  );

  const connectionEdges: BoardStringEdge[] = useMemo(
    () =>
      buildBoardStringEdges({
        activeCase: currentCase,
        locations,
        boardPeople: allDiscoveredPeople,
        boardWeapons: allDiscoveredWeapons,
        boardClues: allBoardCluesUnfiltered,
        submission,
        hiddenNodeKeys: activeGraphHiddenSet
      }),
    [
      currentCase,
      locations,
      allDiscoveredPeople,
      allDiscoveredWeapons,
      allBoardCluesUnfiltered,
      submission,
      activeGraphHiddenSet
    ]
  );

  const weaponLookup = useMemo(() => {
    const map = new Map<string, MethodTemplate>();
    for (const w of MASTER_WEAPONS) map.set(w.id, w);
    for (const w of allWeapons) map.set(w.id, w);
    return map;
  }, [allWeapons]);

  const peopleById = useMemo(
    () => Object.fromEntries(livingCharacters.map((c) => [c.id, c])),
    [livingCharacters]
  );

  // Visible road network on the corkboard New Bay City Map
  const miniMapRoads = useMemo(() => {
    const byId = Object.fromEntries(MASTER_LOCATIONS.map((l) => [l.id, l]));
    const discoveredIds = new Set(discoveredLocations.map((l) => l.id));
    const getCoords = (id: string) => locations[id]?.mapCoords || byId[id]?.mapCoords;

    const segments: { key: string; pointsAttr: string }[] = [];
    for (let i = 0; i < discoveredLocations.length; i++) {
      for (let j = i + 1; j < discoveredLocations.length; j++) {
        const a = discoveredLocations[i];
        const b = discoveredLocations[j];
        const res = findShortestRoadPath(MASTER_LOCATIONS, a.id, b.id);
        if (res.path.length < 2) continue;
        const intermediates = res.path.slice(1, -1);
        if (!intermediates.every((id) => !discoveredIds.has(id))) continue;
        const pts = res.path
          .map((id) => getCoords(id))
          .filter((pt): pt is { x: number; y: number } => Boolean(pt));
        if (pts.length < 2) continue;
        segments.push({
          key: a.id < b.id ? `${a.id}__${b.id}` : `${b.id}__${a.id}`,
          pointsAttr: pts.map((p) => `${p.x},${p.y}`).join(' ')
        });
      }
    }
    return segments;
  }, [discoveredLocations, locations]);

  // DOM pin measurement for exact SVG yarn string coordinates
  const boardRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pinElementsRef = useRef<Record<string, HTMLElement | null>>({});
  const [pinPoints, setPinPoints] = useState<Record<string, PinPoint>>({});

  const registerPinRef = useCallback(
    (key: BoardNodeKey) => (el: HTMLElement | null) => {
      if (el) {
        pinElementsRef.current[key] = el;
      } else {
        delete pinElementsRef.current[key];
      }
    },
    []
  );

  const measurePins = useCallback(() => {
    const boardEl = boardRef.current;
    const svgEl = svgRef.current;
    if (!boardEl || !svgEl) return;
    const svgRect = svgEl.getBoundingClientRect();
    if (svgRect.width === 0 || svgRect.height === 0) return;

    const next: Record<string, PinPoint> = {};
    for (const [key, el] of Object.entries(pinElementsRef.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      next[key] = {
        x: Math.round((r.left - svgRect.left + r.width / 2) * 10) / 10,
        y: Math.round((r.top - svgRect.top + r.height / 2) * 10) / 10
      };
    }

    setPinPoints((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length === nextKeys.length) {
        let same = true;
        for (const k of nextKeys) {
          const a = prev[k];
          const b = next[k];
          if (!a || Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    if (boardTab !== 'board') return;
    measurePins();
    const raf = requestAnimationFrame(measurePins);

    const boardEl = boardRef.current;
    let observer: ResizeObserver | null = null;
    if (boardEl && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => measurePins());
      observer.observe(boardEl);
    }
    window.addEventListener('resize', measurePins);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', measurePins);
    };
  }, [
    boardTab,
    measurePins,
    boardPeople,
    boardWeapons,
    boardClues,
    discoveredLocations,
    submission,
    focusedNode,
    stringMode,
    showHidden,
    hiddenNodeKeys
  ]);

  const activeHighlightNode = focusedNode;

  const visibleDesktopEdges = useMemo(
    () => filterBoardEdgesForMode(boardEdges, stringMode, activeHighlightNode),
    [boardEdges, stringMode, activeHighlightNode]
  );

  const connectedToActive = useMemo(() => {
    const connectedNodes = new Set<BoardNodeKey>();
    const connectedEdgeIds = new Set<string>();
    if (!activeHighlightNode) {
      return { connectedNodes, connectedEdgeIds };
    }
    connectedNodes.add(activeHighlightNode);
    for (const edge of boardEdges) {
      if (edge.from === activeHighlightNode || edge.to === activeHighlightNode) {
        connectedEdgeIds.add(edge.id);
        connectedNodes.add(edge.from);
        connectedNodes.add(edge.to);
      }
    }
    return { connectedNodes, connectedEdgeIds };
  }, [activeHighlightNode, boardEdges]);

  const testimonyEntries = journalEntries.filter((e) => e.kind === 'testimony');
  const physicalEntries = journalEntries.filter((e) => e.kind === 'physical_evidence');
  const inferenceEntries = journalEntries.filter((e) => e.kind === 'inference');

  const isCompleteTheory = Boolean(
    submission.accusedCulpritId &&
      submission.selectedWeaponId &&
      (submission.selectedMotiveId || submission.selectedMotiveClueId) &&
      submission.selectedDecisiveProofId
  );

  const linkedTheoryCount =
    (submission.accusedCulpritId ? 1 : 0) +
    (submission.selectedWeaponId ? 1 : 0) +
    (submission.selectedMotiveId || submission.selectedMotiveClueId ? 1 : 0) +
    (submission.selectedDecisiveProofId ? 1 : 0);

  const openPersonDetails = (char: CharacterCaseInstance, contextLabel: string) => {
    noirAudio.playPaperRustle();
    const locName = locations[char.currentLocationId]?.name || char.currentLocationId;
    const status = characterStatuses[char.id];
    const isPerjury = Boolean(perjuryExposedByChar[char.id]);
    const statusLabel = isPerjury
      ? 'Perjury Exposed'
      : status === 'interviewed'
        ? 'Interviewed'
        : status === 'updated'
          ? 'Update Available'
          : 'Not Interviewed';

    const iState = interviewStates[char.id];
    const topics = currentCase.dialogueMap[char.id] || [];
    const heardTopics = (iState?.statementsHeard || [])
      .map((tId) => {
        const topic = topics.find((t) => t.id === tId);
        return topic ? `${topic.title}: ${topic.response}` : null;
      })
      .filter((s): s is string => Boolean(s));

    const linkedClueTitles = allBoardCluesUnfiltered
      .filter((c) => isClueCharacterLinkVisible(c, char))
      .map((c) => c.name);

    const extraNotes: { label: string; value: string }[] = [
      { label: 'Known Whereabouts & Status', value: `${locName} · ${statusLabel}` }
    ];
    if (heardTopics.length > 0) {
      extraNotes.push({
        label: 'Key Statements Recorded',
        value: heardTopics.join(' · ')
      });
    }
    if (linkedClueTitles.length > 0) {
      extraNotes.push({
        label: 'Board Clues Referencing Subject',
        value: linkedClueTitles.join(', ')
      });
    }

    setInspectedPortrait({
      char,
      contextLabel,
      extraNotes
    });
  };

  const handleSelectSuspect = (id: string) => {
    noirAudio.playPinThud();
    onUpdateSubmission({
      accusedCulpritId: submission.accusedCulpritId === id ? null : id
    });
  };

  const handleSelectWeapon = (id: string) => {
    noirAudio.playYarnPluck();
    onUpdateSubmission({
      selectedWeaponId: submission.selectedWeaponId === id ? null : id
    });
  };

  const handleSelectEvidence = (id: string) => {
    noirAudio.playYarnPluck();
    const isUnpinning = submission.selectedDecisiveProofId === id;
    onUpdateSubmission({
      selectedDecisiveProofId: isUnpinning ? null : id,
      ...(!isUnpinning && submission.selectedMotiveClueId === id
        ? { selectedMotiveClueId: null }
        : {})
    });
  };

  const handleSelectMotiveClue = (id: string) => {
    noirAudio.playYarnPluck();
    const isUnpinning = submission.selectedMotiveClueId === id;
    onUpdateSubmission({
      selectedMotiveClueId: isUnpinning ? null : id,
      ...(!isUnpinning && submission.selectedDecisiveProofId === id
        ? { selectedDecisiveProofId: null }
        : {})
    });
  };

  const handleToggleHideNode = (nodeKey: BoardNodeKey) => {
    noirAudio.playPaperRustle();
    const willBeHidden = !effectiveHiddenKeys.has(nodeKey);
    if (willBeHidden && !showHidden && focusedNode === nodeKey) {
      setFocusedNode(null);
    }
    onToggleHideNode?.(nodeKey);
  };

  const handleResetBoard = () => {
    noirAudio.playPaperRustle();
    setFocusedNode(null);
    onUpdateSubmission({
      accusedCulpritId: null,
      selectedWeaponId: null,
      selectedMotiveId: null,
      selectedMotiveClueId: null,
      selectedDecisiveProofId: null,
      selectedAlibiBreakPinId: null
    });
  };

  const toggleFocusNode = (nodeKey: BoardNodeKey) => {
    noirAudio.playTypewriterKey();
    setFocusedNode((prev) => (prev === nodeKey ? null : nodeKey));
  };

  const activeMotiveObj = allMotives.find((m) => m.id === submission.selectedMotiveId);
  const visitedSet = useMemo(() => new Set(visitedLocationIds), [visitedLocationIds]);

  const getFocusLabel = (node: BoardNodeKey): string => {
    if (node === 'motive:active') return activeMotiveObj?.name || 'Active Motive';
    const [prefix, id] = node.split(':');
    if (prefix === 'loc') return locations[id]?.name || id;
    if (prefix === 'char') return peopleById[id]?.name || id;
    if (prefix === 'weapon') return weaponLookup.get(id)?.name || id;
    if (prefix === 'clue') return currentCase.clues[id]?.name || id;
    return node;
  };

  const handleInspectNodeKey = (nodeKey: BoardNodeKey) => {
    if (nodeKey === 'motive:active') {
      setMobileTab('indictment');
      return;
    }
    const [prefix, id] = nodeKey.split(':');
    if (prefix === 'char' && peopleById[id]) {
      openPersonDetails(peopleById[id], 'Connected Thread');
    } else if (prefix === 'weapon' && weaponLookup.get(id)) {
      noirAudio.playPaperRustle();
      setInspectedWeapon({
        weapon: weaponLookup.get(id)!,
        contextLabel: 'Connected Forensic Exhibit'
      });
    } else if (prefix === 'clue' && currentCase.clues[id]) {
      noirAudio.playPaperRustle();
      setInspectedClue(currentCase.clues[id]);
    } else if (prefix === 'loc') {
      setMobileTab('locations');
      setFocusedNode(nodeKey);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 md:py-7 space-y-5 pb-28 md:pb-16">
      {/* Board Header & Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#131720] border border-[#232B3B]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
            <Link2 className="w-3.5 h-3.5" />
            <span>THE DETECTIVE&apos;S CASE BOARD</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#E5DEC9]">
            {boardTab === 'board'
              ? 'Cork Evidence Board & City Connections'
              : 'Case Journal & Field Notes'}
          </h2>
          <p className="text-xs text-[#828FA3]">
            {boardTab === 'board'
              ? 'Inspect pinned photographs, map locations, and clue cards; follow the strings to align culprit, weapon, motive, and decisive proof.'
              : 'Verified testimony, physical evidence observations, and detective inferences logged during your investigation.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-tab Switcher */}
          <div className="inline-flex rounded-lg border border-[#252C3B] p-0.5 bg-[#0C0F14]">
            <button
              type="button"
              onClick={() => {
                noirAudio.playTypewriterKey();
                setBoardTab('board');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                boardTab === 'board'
                  ? 'bg-[#1C222E] text-[#F59E0B] font-semibold border border-[#3E4D68]'
                  : 'text-[#828FA3] hover:text-[#D5CDBC]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Cork Board</span>
            </button>
            <button
              type="button"
              onClick={() => {
                noirAudio.playTypewriterKey();
                setBoardTab('journal');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                boardTab === 'journal'
                  ? 'bg-[#1C222E] text-[#F59E0B] font-semibold border border-[#3E4D68]'
                  : 'text-[#828FA3] hover:text-[#D5CDBC]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Case Journal ({journalEntries.length})</span>
            </button>
          </div>

          {boardTab === 'board' && (
            <button
              type="button"
              onClick={handleResetBoard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B222E] hover:bg-[#252E3E] text-xs font-medium text-[#8F9CAE] hover:text-[#E5DEC9] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Threads</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              noirAudio.playGavelStrike();
              onOpenIndictment();
            }}
            disabled={!submission.accusedCulpritId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer ${
              isCompleteTheory
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-[#DC2626]/25'
                : submission.accusedCulpritId
                  ? 'bg-[#DC2626]/85 text-white hover:bg-[#DC2626]'
                  : 'bg-[#1E2533] text-[#556275] cursor-not-allowed'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>File Indictment</span>
          </button>
        </div>
      </div>

      {boardTab === 'journal' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1: Testimony */}
          <div className="p-4 rounded-xl bg-[#131720] border border-[#232B3B] space-y-3">
            <div className="flex items-center justify-between border-b border-[#222A38] pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#60A5FA] uppercase">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Testimony ({testimonyEntries.length})</span>
              </div>
              <span className="text-[10px] text-[#717E91]">Statements</span>
            </div>

            {testimonyEntries.length === 0 ? (
              <p className="text-xs text-[#6E7B8E] py-6 text-center">
                No statements logged yet. Interrogate suspects and witnesses at city locations.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {testimonyEntries.map((entry) => {
                  const speaker = livingCharacters.find((ch) => ch.id === entry.sourceId);
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg bg-[#0E1117] border border-[#222A38] space-y-1.5"
                    >
                      <div className="flex items-start gap-2.5">
                        {speaker && (
                          <button
                            type="button"
                            onClick={() =>
                              openPersonDetails(speaker, `Testimony · ${entry.timestampLabel}`)
                            }
                            aria-label={`View portrait artwork of ${speaker.name}`}
                            title={`Click to view ${speaker.name}'s dossier`}
                            className="group relative w-9 h-9 rounded-lg overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in"
                          >
                            <img
                              src={getCharacterMugshot(speaker)}
                              alt={speaker.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-top"
                            />
                            <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-3.5 h-3.5 text-[#F4EDD8]" />
                            </span>
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#E5DEC9]">{entry.title}</span>
                            <span className="text-[10px] font-mono text-[#717E91] shrink-0">
                              {entry.timestampLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9AA5B8] leading-relaxed mt-1 whitespace-pre-line">
                            {entry.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Physical Evidence */}
          <div className="p-4 rounded-xl bg-[#131720] border border-[#232B3B] space-y-3">
            <div className="flex items-center justify-between border-b border-[#222A38] pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F59E0B] uppercase">
                <FileText className="w-3.5 h-3.5" />
                <span>Physical Evidence ({physicalEntries.length})</span>
              </div>
              <span className="text-[10px] text-[#717E91]">Forensics &amp; Docs</span>
            </div>

            {physicalEntries.length === 0 ? (
              <p className="text-xs text-[#6E7B8E] py-6 text-center">
                No physical clues logged yet. Inspect points of interest across scenes.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {physicalEntries.map((entry) => {
                  const sourceClue = currentCase.clues[entry.sourceId];
                  const relatedWeapon = sourceClue?.relatedWeaponId
                    ? weaponLookup.get(sourceClue.relatedWeaponId)
                    : undefined;
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg bg-[#0E1117] border border-[#222A38] space-y-1.5"
                    >
                      <div className="flex items-start gap-2.5">
                        {sourceClue?.relatedWeaponId &&
                          (relatedWeapon ? (
                            <button
                              type="button"
                              onClick={() => {
                                noirAudio.playPaperRustle();
                                setInspectedWeapon({
                                  weapon: relatedWeapon,
                                  contextLabel: `Logged at ${entry.timestampLabel}`
                                });
                              }}
                              aria-label={`Inspect forensic photo of ${relatedWeapon.name}`}
                              title={`Click to inspect ${relatedWeapon.name}`}
                              className="group relative w-11 h-11 rounded-lg overflow-hidden border border-[#37445C] hover:border-[#F59E0B] bg-[#0B0E14] shrink-0 transition-colors cursor-zoom-in"
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
                          ) : (
                            <img
                              src={getWeaponImage(sourceClue.relatedWeaponId)}
                              alt={entry.title}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-lg object-cover border border-[#37445C] bg-[#0B0E14] shrink-0"
                            />
                          ))}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#E5DEC9]">{entry.title}</span>
                            {entry.clueStatus && (
                              <span className="text-[10px] font-mono uppercase text-[#9AA5B8] shrink-0">
                                {entry.clueStatus}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#9AA5B8] leading-relaxed whitespace-pre-line">
                            {entry.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 3: Detective's Inference */}
          <div className="p-4 rounded-xl bg-[#131720] border border-[#232B3B] space-y-3">
            <div className="flex items-center justify-between border-b border-[#222A38] pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Detective&apos;s Inference ({inferenceEntries.length})</span>
              </div>
              <span className="text-[10px] text-[#717E91]">Deductions</span>
            </div>

            {inferenceEntries.length === 0 ? (
              <p className="text-xs text-[#6E7B8E] py-6 text-center">
                Cross-reference discovered clues with suspect statements during interrogation to
                establish verified inferences.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {inferenceEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-300">{entry.title}</span>
                      <span className="text-[10px] font-mono text-[#717E91]">
                        {entry.timestampLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#CBD5E1] leading-relaxed whitespace-pre-line">{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ========================= MOBILE TABBED BOARD (< md) ========================= */}
          <MobileCaseBoard
            currentCase={currentCase}
            locations={locations}
            discoveredLocations={discoveredLocations}
            visitedLocationIds={visitedLocationIds}
            currentLocationId={currentLocationId}
            people={boardPeople}
            weapons={boardWeapons}
            clues={boardClues}
            clueFilter={clueFilter}
            onChangeClueFilter={setClueFilter}
            mobileTab={mobileTab}
            onChangeMobileTab={setMobileTab}
            showHidden={showHidden}
            onToggleShowHidden={() => {
              noirAudio.playTypewriterKey();
              setShowHidden((prev) => !prev);
            }}
            totalHiddenCount={totalHiddenCount}
            effectiveHiddenKeys={effectiveHiddenKeys}
            onToggleHideNode={handleToggleHideNode}
            focusedNode={focusedNode}
            onToggleFocusNode={toggleFocusNode}
            onClearFocusNode={() => setFocusedNode(null)}
            connectionEdges={connectionEdges}
            getNodeLabel={getFocusLabel}
            onInspectNodeKey={handleInspectNodeKey}
            onOpenPerson={openPersonDetails}
            onOpenWeapon={(weapon, contextLabel) => {
              noirAudio.playPaperRustle();
              setInspectedWeapon({ weapon, contextLabel });
            }}
            onOpenClue={(clue) => {
              noirAudio.playPaperRustle();
              setInspectedClue(clue);
            }}
            characterStatuses={characterStatuses}
            perjuryExposedByChar={perjuryExposedByChar}
            submission={submission}
            linkedTheoryCount={linkedTheoryCount}
            indictmentBuilderNode={
              <IndictmentBuilder
                allSuspects={allSuspects}
                discoveredSuspects={discoveredSuspects}
                discoveredWeapons={allDiscoveredWeapons}
                allCaseWeapons={allWeapons}
                allMotives={allMotives}
                eligibleProofClues={evidenceClues}
                locations={locations}
                hiddenKeys={effectiveHiddenKeys}
                submission={submission}
                onUpdateSubmission={onUpdateSubmission}
                onClearTheory={handleResetBoard}
                onOpenIndictment={onOpenIndictment}
              />
            }
          />

          {/* ========================= DESKTOP TACTILE CORK BOARD (>= md) ========================= */}
          <div className="hidden md:block space-y-5">
            <div
              ref={boardRef}
              className="relative rounded-2xl bg-corkboard border-[12px] border-[#382314] shadow-[0_24px_60px_rgba(0,0,0,0.72),inset_0_0_48px_rgba(24,12,4,0.45)] p-6 space-y-6 overflow-hidden"
            >
              {/* Inner Wooden Frame Bevel */}
              <div className="pointer-events-none absolute inset-0 border border-[#5B3B22]/60 rounded-lg" />

              {/* Dynamic Focus-Filtered Yarn String Overlay */}
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-30"
                aria-hidden="true"
              >
                <defs>
                  <filter id="yarnShadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow
                      dx="1"
                      dy="2.5"
                      stdDeviation="1.6"
                      floodColor="#140A04"
                      floodOpacity="0.58"
                    />
                  </filter>
                </defs>
                {visibleDesktopEdges.map((edge) => {
                  const p1 = pinPoints[edge.from];
                  const p2 = pinPoints[edge.to];
                  if (!p1 || !p2) return null;

                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const dist = Math.hypot(dx, dy);
                  const sag = Math.min(44, Math.max(10, dist * 0.12));
                  const cx = (p1.x + p2.x) / 2;
                  const cy = (p1.y + p2.y) / 2 + sag;
                  const d = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;

                  const isHighlighted = activeHighlightNode
                    ? connectedToActive.connectedEdgeIds.has(edge.id)
                    : false;
                  const opacity =
                    stringMode === 'focused'
                      ? edge.kind === 'theory' || isHighlighted
                        ? 0.96
                        : 0.78
                      : activeHighlightNode
                        ? isHighlighted
                          ? 0.96
                          : 0.14
                        : edge.kind === 'theory'
                          ? 0.95
                          : edge.kind === 'clue'
                            ? 0.72
                            : 0.62;

                  const stroke =
                    edge.kind === 'theory'
                      ? '#DC2626'
                      : edge.kind === 'clue'
                        ? '#1D4ED8'
                        : '#B45309';

                  const strokeWidth =
                    edge.kind === 'theory'
                      ? isHighlighted
                        ? 3.6
                        : 3
                      : isHighlighted
                        ? 2.8
                        : 1.9;

                  const dash = edge.kind === 'tie' ? '5 4' : 'none';

                  return (
                    <path
                      key={edge.id}
                      d={d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      strokeDasharray={dash}
                      strokeLinecap="round"
                      filter="url(#yarnShadow)"
                    />
                  );
                })}
              </svg>

              {/* Pinned Case Header Strip, String Mode Control & Hidden Filter */}
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 bg-[#F6EED6] text-[#1E1A14] border border-[#B9A472] rounded-lg px-4 py-2.5 shadow-md">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="font-mono font-bold uppercase text-[#8A1C1C]">
                    {currentCase.seed}
                  </span>
                  <span aria-hidden="true" className="text-[#8B7650]">·</span>
                  <span className="font-serif font-bold text-sm text-[#1C1610]">
                    {currentCase.caseTitle}
                  </span>
                  <span aria-hidden="true" className="text-[#8B7650]">·</span>
                  <span className="font-mono text-[11px] text-[#4A3B28]">
                    Victim: {currentCase.victim.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* String Legend */}
                  <div className="hidden xl:flex items-center gap-3 text-[11px] font-mono text-[#3E3121] mr-1">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 h-[3px] rounded-full bg-[#DC2626]" />
                      <span>Theory</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 h-[2px] rounded-full bg-[#1D4ED8]" />
                      <span>Clue</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 border-t-2 border-dashed border-[#B45309]" />
                      <span>Ties</span>
                    </span>
                  </div>

                  {/* Segmented String Visibility Control */}
                  <div
                    role="group"
                    aria-label="Board yarn string mode"
                    className="inline-flex items-center rounded-md border border-[#B9A472] bg-[#E8D9B5] p-0.5"
                  >
                    {(
                      [
                        { id: 'focused', label: 'Focused' },
                        { id: 'theory', label: 'Theory' },
                        { id: 'all', label: 'All Strings' }
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          noirAudio.playTypewriterKey();
                          setStringMode(mode.id);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                          stringMode === mode.id
                            ? 'bg-[#2C1E12] text-[#FAF5E6] font-bold shadow-sm'
                            : 'text-[#4A3B28] hover:text-[#1E1A14]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual Rule-Out Show Hidden Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      noirAudio.playTypewriterKey();
                      setShowHidden((prev) => !prev);
                    }}
                    disabled={totalHiddenCount === 0 && !showHidden}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-mono flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      showHidden
                        ? 'bg-[#2C1E12] text-[#FACC15] border-[#2C1E12] font-bold'
                        : 'bg-[#E8D9B5] text-[#3B2C1B] border-[#B9A472] hover:bg-[#DECBA0]'
                    }`}
                  >
                    {showHidden ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    <span className="tabular-nums">
                      {showHidden
                        ? `Showing Hidden (${totalHiddenCount})`
                        : `Show Hidden (${totalHiddenCount})`}
                    </span>
                  </button>

                  {focusedNode && (
                    <button
                      type="button"
                      onClick={() => setFocusedNode(null)}
                      className="px-2.5 py-1 rounded-md bg-[#1D4ED8] text-white hover:bg-[#1E40AF] text-[11px] font-mono font-semibold cursor-pointer transition-colors whitespace-nowrap"
                    >
                      Tracing: {getFocusLabel(focusedNode)} ×
                    </button>
                  )}
                </div>
              </div>

              {/* ROW 1 (ABOVE MAP): Discovered Suspects & Witnesses on 1 Horizontal Line */}
              <div className="relative z-20 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 bg-[#F6EED6] text-[#1E1A14] border border-[#B9A472] px-3 py-1 rounded shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C] shadow-inner" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider tabular-nums">
                      Suspects &amp; Witnesses ({boardPeople.length})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#F6EED6]/90 drop-shadow">
                    Click photo for dossier · Click pushpin to trace · Hover corner to hide
                  </span>
                </div>

                {boardPeople.length === 0 ? (
                  <div className="p-3 bg-[#F6EED6] text-[#3B2F21] border border-[#B9A472] rounded shadow-md text-xs text-center">
                    {totalHiddenCount > 0
                      ? 'All discovered suspects are currently hidden. Click Show Hidden above to restore.'
                      : 'Visit city venues or question locals to pin discovered suspects and witnesses above the map.'}
                  </div>
                ) : (
                  <div
                    onScroll={measurePins}
                    className="mx-auto w-fit max-w-full flex flex-nowrap items-start gap-3 overflow-x-auto pt-3 pb-1.5 px-2"
                  >
                    {boardPeople.map((person, idx) => {
                      const nodeKey: BoardNodeKey = `char:${person.id}`;
                      const isHidden = effectiveHiddenKeys.has(nodeKey);
                      const isAccused = submission.accusedCulpritId === person.id;
                      const isNodeFocused = focusedNode === nodeKey;
                      const isPerjuryExposed = Boolean(
                        person.perjuryExposed || perjuryExposedByChar[person.id]
                      );
                      const pinStateLabel = isPerjuryExposed ? 'Perjury Exposed' : person.demeanor;
                      const isDimmed =
                        isHidden ||
                        (Boolean(activeHighlightNode) &&
                          !connectedToActive.connectedNodes.has(nodeKey));

                      return (
                        <div
                          key={person.id}
                          className={`group/card relative w-[94px] sm:w-[100px] shrink-0 bg-[#FAF5E6] text-[#1E1A14] p-1.5 pt-2.5 rounded-sm border shadow-[0_6px_14px_rgba(20,10,4,0.42)] transition-opacity duration-150 ${
                            PIN_TILT_CLASSES[idx % PIN_TILT_CLASSES.length]
                          } ${
                            isHidden
                              ? 'border-dashed border-[#6B5A40]'
                              : isAccused
                                ? 'border-[#DC2626] ring-2 ring-[#DC2626]/80'
                                : isNodeFocused
                                  ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/70'
                                  : 'border-[#C9B993]'
                          } ${isDimmed ? 'opacity-50' : 'opacity-100'}`}
                        >
                          {/* Pushpin Anchor (click to trace strings) */}
                          <button
                            type="button"
                            ref={registerPinRef(nodeKey)}
                            onClick={() => toggleFocusNode(nodeKey)}
                            title={`Trace strings for ${person.name} (${pinStateLabel})`}
                            aria-label={`Trace board connections for ${person.name} (${pinStateLabel})`}
                            className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 shadow-md z-40 cursor-pointer transition-transform hover:scale-110 ${getDemeanorPinStyle(
                              person.demeanor,
                              isPerjuryExposed
                            )} ${
                              isNodeFocused
                                ? 'ring-2 ring-[#2563EB] ring-offset-1 ring-offset-[#FAF5E6] scale-110'
                                : ''
                            }`}
                          />

                          {/* Corner Quick Rule-Out / Restore Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleHideNode(nodeKey);
                            }}
                            title={
                              isHidden
                                ? `Restore ${person.name} to board`
                                : `Rule out & hide ${person.name}`
                            }
                            aria-label={
                              isHidden
                                ? `Restore ${person.name} to board`
                                : `Rule out and hide ${person.name}`
                            }
                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border shadow-md z-40 flex items-center justify-center transition-opacity cursor-pointer ${
                              isHidden
                                ? 'opacity-100 bg-[#1C222E] border-[#F59E0B] text-[#F59E0B]'
                                : 'opacity-0 group-hover/card:opacity-100 focus:opacity-100 bg-[#2C1E12] border-[#B9A472] text-[#F6EED6] hover:bg-[#1A120B]'
                            }`}
                          >
                            {isHidden ? (
                              <RotateCcw className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                          </button>

                          {/* Clickable Compact Polaroid (Photo + Name only) */}
                          <button
                            type="button"
                            onClick={() => openPersonDetails(person, 'Cork Board Dossier')}
                            aria-label={`Inspect dossier of ${person.name}`}
                            title={`Click to view ${person.name}'s details`}
                            className="group w-full text-center cursor-zoom-in block focus:outline-none"
                          >
                            <div className="relative w-full h-[72px] sm:h-[76px] overflow-hidden bg-[#12161E] border border-[#2C241B]/40">
                              <img
                                src={getCharacterMugshot(person)}
                                alt={person.name}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full object-cover object-top ${
                                  isHidden ? 'grayscale' : ''
                                }`}
                              />
                              <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-[#FAF5E6]" />
                              </span>
                            </div>
                            <div className="mt-1.5 text-[11px] font-serif font-bold text-[#1A140F] leading-tight line-clamp-2">
                              {person.name}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ROW 2 (CENTER): Pinned New Bay City Map */}
              <div className="relative z-20 max-w-4xl mx-auto">
                <div className="relative bg-[#ECE2C6] text-[#1E1A14] p-3 rounded-sm border-2 border-[#B39E72] shadow-[0_12px_28px_rgba(20,10,4,0.5)]">
                  {/* 4 Brass Corner Tacks */}
                  <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-[#D4AF37] border border-[#6E5211] shadow-md pointer-events-none z-40" />
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#D4AF37] border border-[#6E5211] shadow-md pointer-events-none z-40" />
                  <span className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[#D4AF37] border border-[#6E5211] shadow-md pointer-events-none z-40" />
                  <span className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-[#D4AF37] border border-[#6E5211] shadow-md pointer-events-none z-40" />

                  <div className="flex items-center justify-between pb-2 px-1">
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6E5632]">
                        New Bay City Street Survey
                      </div>
                      <div className="text-xs font-serif font-bold text-[#1E1A14] tabular-nums">
                        Discovered Locations ({discoveredLocations.length})
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#5B4930]">
                      Click any map pin to trace strings
                    </span>
                  </div>

                  {/* Nocturnal Map Canvas Sheet */}
                  <div className="relative w-full aspect-[16/10] min-h-[320px] rounded bg-[#0E131D] border border-[#2A3346] overflow-hidden shadow-inner">
                    <svg
                      viewBox="-2 -2 104 104"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <path
                        d="M -25 -20 L 2.2 -20 L 1.5 6 L 3.2 13 L 1.3 20 L 2.9 27 L 1.2 35 L 3.1 42 L 1.6 49 L 3.3 56.5 L 1.7 64 L 3.4 72 L 1.4 80 L 2.9 88 L 1.6 93.2 L 7 93.8 L 11 95.1 L 16 93.6 L 21 94.8 L 26 93.5 L 31 95.3 L 36 93.7 L 42 94.9 L 47 93.4 L 53 95.1 L 59 93.7 L 65 95.2 L 71 93.6 L 77 94.9 L 83 93.6 L 89 95.0 L 95 93.6 L 103 94.5 L 125 94 L 125 120 L -25 120 Z"
                        fill="#09101B"
                      />
                      <path
                        d="M 1.8 57.5 L 5.2 56.8 L 8.6 57.7 L 12.1 58.6 L 15.8 58.0 L 19.4 59.5 L 23.6 60.4 L 27.6 61.9 L 28.4 65.5 L 26.8 70.6 L 28.1 76.4 L 26.7 82.1 L 27.8 87.3 L 25.8 94.4"
                        fill="none"
                        stroke="#15243A"
                        strokeWidth="9"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d="M 2.2 -10 L 1.5 6 L 3.2 13 L 1.3 20 L 2.9 27 L 1.2 35 L 3.1 42 L 1.6 49 L 3.3 56.5 L 1.7 64 L 3.4 72 L 1.4 80 L 2.9 88 L 1.6 93.2 L 7 93.8 L 11 95.1 L 16 93.6 L 21 94.8 L 26 93.5 L 31 95.3 L 36 93.7 L 42 94.9 L 47 93.4 L 53 95.1 L 59 93.7 L 65 95.2 L 71 93.6 L 77 94.9 L 83 93.6 L 89 95.0 L 95 93.6 L 106 94.5"
                        fill="none"
                        stroke="#243B59"
                        strokeWidth="1.4"
                        vectorEffect="non-scaling-stroke"
                      />
                      <line x1="31" y1="-2" x2="31" y2="92" stroke="#1D2636" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                      <line x1="66" y1="-2" x2="66" y2="92" stroke="#1D2636" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                      <line x1="0" y1="36" x2="100" y2="36" stroke="#1D2636" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                      <line x1="0" y1="60" x2="100" y2="60" stroke="#1D2636" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />

                      {miniMapRoads.map((road) => (
                        <polyline
                          key={road.key}
                          points={road.pointsAttr}
                          fill="none"
                          stroke="#31415A"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </svg>

                    <div className="pointer-events-none absolute top-1.5 left-3 text-[9px] font-mono uppercase text-[#667892]/75">
                      Cathedral Heights
                    </div>
                    <div className="pointer-events-none absolute top-1.5 right-3 text-[9px] font-mono uppercase text-[#667892]/75">
                      Civic Centre
                    </div>
                    <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase text-[#667892]/75">
                      Industrial Docklands &amp; New Bay Harbor
                    </div>

                    {discoveredLocations.map((loc) => {
                      const nodeKey: BoardNodeKey = `loc:${loc.id}`;
                      const isNodeFocused = focusedNode === nodeKey;
                      const isCrimeScene = currentCase.crimeSceneLocationId === loc.id;
                      const isVisited = visitedSet.has(loc.id);
                      const isDimmed =
                        Boolean(activeHighlightNode) &&
                        !connectedToActive.connectedNodes.has(nodeKey);

                      const pinLeft = ((loc.mapCoords.x + 2) / 104) * 100;
                      const pinTop = ((loc.mapCoords.y + 2) / 104) * 100;

                      return (
                        <div
                          key={loc.id}
                          style={{ left: `${pinLeft}%`, top: `${pinTop}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-opacity duration-150 ${
                            isNodeFocused ? 'z-30' : ''
                          } ${isDimmed ? 'opacity-35' : 'opacity-100'}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              noirAudio.playPinThud();
                              toggleFocusNode(nodeKey);
                            }}
                            aria-label={`Map pin: ${loc.name}`}
                            title={`${loc.name} (${loc.district})`}
                            className="group relative flex flex-col items-center cursor-pointer focus:outline-none"
                          >
                            <span
                              ref={registerPinRef(nodeKey)}
                              className={`w-4 h-4 rounded-full border-2 shadow-[0_2px_6px_rgba(0,0,0,0.85)] transition-transform group-hover:scale-125 ${
                                isNodeFocused
                                  ? 'bg-[#2563EB] border-[#DBEAFE] scale-110'
                                  : isCrimeScene
                                    ? 'bg-[#DC2626] border-[#FEE2E2]'
                                    : isVisited
                                      ? 'bg-[#16A34A] border-[#DCFCE7]'
                                      : 'bg-[#EA580C] border-[#FFEDD5]'
                              }`}
                            />
                            <span
                              className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap shadow ${
                                isNodeFocused
                                  ? 'bg-[#1D4ED8] text-white font-bold border border-[#93C5FD]'
                                  : 'bg-[#0C1018]/90 text-[#E5DEC9] border border-[#2C374D]'
                              }`}
                            >
                              {loc.name}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ROW 3 (BELOW MAP): Discovered Weapons on 1 Horizontal Line */}
              <div className="relative z-20 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 bg-[#F6EED6] text-[#1E1A14] border border-[#B9A472] px-3 py-1 rounded shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8] shadow-inner" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider tabular-nums">
                      Discovered Weapons ({boardWeapons.length})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#F6EED6]/90 drop-shadow">
                    Click weapon photo for forensics · Click pushpin to trace · Hover corner to hide
                  </span>
                </div>

                {boardWeapons.length === 0 ? (
                  <div className="p-3 bg-[#F6EED6] text-[#3B2F21] border border-[#B9A472] rounded shadow-md text-xs text-center">
                    {totalHiddenCount > 0
                      ? 'All discovered weapons are currently hidden. Click Show Hidden above to restore.'
                      : 'Inspect points of interest across New Bay to log weapons and link them back to where they were found.'}
                  </div>
                ) : (
                  <div
                    onScroll={measurePins}
                    className="mx-auto w-fit max-w-full flex flex-nowrap items-start gap-3 overflow-x-auto pt-3 pb-1.5 px-2"
                  >
                    {boardWeapons.map(({ weapon, foundAtLocationIds }, idx) => {
                      const nodeKey: BoardNodeKey = `weapon:${weapon.id}`;
                      const isHidden = effectiveHiddenKeys.has(nodeKey);
                      const isPinnedWeapon = submission.selectedWeaponId === weapon.id;
                      const isNodeFocused = focusedNode === nodeKey;
                      const isDimmed =
                        isHidden ||
                        (Boolean(activeHighlightNode) &&
                          !connectedToActive.connectedNodes.has(nodeKey));
                      const foundNames = foundAtLocationIds
                        .map((id) => locations[id]?.name || id)
                        .join(', ');

                      return (
                        <div
                          key={weapon.id}
                          className={`group/card relative w-[94px] sm:w-[100px] shrink-0 bg-[#FAF5E6] text-[#1E1A14] p-1.5 pt-2.5 rounded-sm border shadow-[0_6px_14px_rgba(20,10,4,0.42)] transition-opacity duration-150 ${
                            PIN_TILT_CLASSES[(idx + 2) % PIN_TILT_CLASSES.length]
                          } ${
                            isHidden
                              ? 'border-dashed border-[#6B5A40]'
                              : isPinnedWeapon
                                ? 'border-[#DC2626] ring-2 ring-[#DC2626]/80'
                                : isNodeFocused
                                  ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/70'
                                  : 'border-[#C9B993]'
                          } ${isDimmed ? 'opacity-50' : 'opacity-100'}`}
                        >
                          <button
                            type="button"
                            ref={registerPinRef(nodeKey)}
                            onClick={() => toggleFocusNode(nodeKey)}
                            title={`Trace strings for ${weapon.name}`}
                            aria-label={`Trace board connections for ${weapon.name}`}
                            className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 shadow-md z-40 cursor-pointer transition-transform hover:scale-110 ${
                              isPinnedWeapon
                                ? 'bg-[#DC2626] border-[#FEE2E2]'
                                : isNodeFocused
                                  ? 'bg-[#2563EB] border-[#DBEAFE]'
                                  : 'bg-[#1D4ED8] border-[#DBEAFE]'
                            }`}
                          />

                          {/* Corner Quick Rule-Out / Restore Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleHideNode(nodeKey);
                            }}
                            title={
                              isHidden
                                ? `Restore ${weapon.name} to board`
                                : `Rule out & hide ${weapon.name}`
                            }
                            aria-label={
                              isHidden
                                ? `Restore ${weapon.name} to board`
                                : `Rule out and hide ${weapon.name}`
                            }
                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border shadow-md z-40 flex items-center justify-center transition-opacity cursor-pointer ${
                              isHidden
                                ? 'opacity-100 bg-[#1C222E] border-[#F59E0B] text-[#F59E0B]'
                                : 'opacity-0 group-hover/card:opacity-100 focus:opacity-100 bg-[#2C1E12] border-[#B9A472] text-[#F6EED6] hover:bg-[#1A120B]'
                            }`}
                          >
                            {isHidden ? (
                              <RotateCcw className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              noirAudio.playPaperRustle();
                              setInspectedWeapon({
                                weapon,
                                contextLabel: foundNames
                                  ? `Recovered at ${foundNames}`
                                  : 'Cork Board Exhibit'
                              });
                            }}
                            aria-label={`Inspect forensic photo of ${weapon.name}`}
                            title={`Click to view ${weapon.name}'s details`}
                            className="group w-full text-center cursor-zoom-in block focus:outline-none"
                          >
                            <div className="relative w-full h-[72px] sm:h-[76px] overflow-hidden bg-[#12161E] border border-[#2C241B]/40">
                              <img
                                src={getWeaponImage(weapon)}
                                alt={weapon.name}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full object-cover ${
                                  isHidden ? 'grayscale' : ''
                                }`}
                              />
                              <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-[#FAF5E6]" />
                              </span>
                            </div>
                            <div className="mt-1.5 text-[11px] font-serif font-bold text-[#1A140F] leading-tight line-clamp-2">
                              {weapon.name}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BOTTOM BAND: Relevant Clue Index Cards */}
              <div className="relative z-20 space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F6EED6] text-[#1E1A14] border border-[#B9A472] px-3.5 py-2 rounded shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider tabular-nums">
                      Pinned Clue Index Cards ({boardClues.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'All Clues' },
                        { id: 'leads', label: 'Key Leads & Proof' },
                        { id: 'weapons', label: 'Weapon Findings' }
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          noirAudio.playTypewriterKey();
                          setClueFilter(tab.id);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                          clueFilter === tab.id
                            ? 'bg-[#2C1E12] text-[#FAF5E6] font-bold'
                            : 'bg-[#E7D8B6] text-[#3B2C1B] hover:bg-[#D8C49A]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {boardClues.length === 0 ? (
                  <div className="p-5 bg-[#F6EED6] text-[#4A3B28] border border-[#B9A472] rounded text-center text-xs shadow-md">
                    {totalHiddenCount > 0
                      ? 'No visible clues under the current filter. Toggle Show Hidden or switch tabs.'
                      : 'No clues logged for this filter yet. Inspect points of interest at city venues to pin clue cards onto the board.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {boardClues.map((clue, idx) => {
                      const nodeKey: BoardNodeKey = `clue:${clue.id}`;
                      const isHidden = effectiveHiddenKeys.has(nodeKey);
                      const isPinnedProof = submission.selectedDecisiveProofId === clue.id;
                      const isPinnedMotive = submission.selectedMotiveClueId === clue.id;
                      const isEligibleProof =
                        clue.supports === 'culprit' ||
                        clue.supports === 'alibi_break' ||
                        clue.supports === 'weapon' ||
                        clue.supports === 'motive' ||
                        clue.supports === 'motive_hook' ||
                        clue.supports === 'red_herring';
                      const isNodeFocused = focusedNode === nodeKey;
                      const isDimmed =
                        isHidden ||
                        (Boolean(activeHighlightNode) &&
                          !connectedToActive.connectedNodes.has(nodeKey));

                      const foundName = locations[clue.locationFoundId]?.name;
                      const leadsLocName =
                        clue.leadsToLocationId && locations[clue.leadsToLocationId]?.discovered
                          ? locations[clue.leadsToLocationId].name
                          : null;
                      const visibleWeaponName =
                        clue.status !== 'noticed' && clue.relatedWeaponId
                          ? weaponLookup.get(clue.relatedWeaponId)?.name
                          : null;
                      const linkedChar = clue.relatedCharacterId
                        ? peopleById[clue.relatedCharacterId]
                        : undefined;
                      const visiblePersonName = isClueCharacterLinkVisible(clue, linkedChar)
                        ? linkedChar?.name
                        : null;

                      const refs: string[] = [];
                      if (foundName) refs.push(`At ${foundName}`);
                      if (leadsLocName) refs.push(`Lead → ${leadsLocName}`);
                      if (visibleWeaponName) refs.push(visibleWeaponName);
                      if (visiblePersonName) refs.push(visiblePersonName);

                      return (
                        <div
                          key={clue.id}
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(to bottom, transparent, transparent 21px, rgba(154,176,204,0.35) 21px, rgba(154,176,204,0.35) 22px)'
                          }}
                          className={`relative bg-[#F6EED6] text-[#1E1A14] p-3.5 pt-4 rounded-sm border shadow-[0_8px_18px_rgba(20,10,4,0.38)] transition-opacity duration-150 ${
                            PIN_TILT_CLASSES[(idx + 1) % PIN_TILT_CLASSES.length]
                          } ${
                            isHidden
                              ? 'border-dashed border-[#7D6C4E]'
                              : isPinnedProof
                                ? 'border-[#DC2626] ring-2 ring-[#DC2626]/70'
                                : isPinnedMotive
                                  ? 'border-[#B45309] ring-2 ring-[#D97706]/75'
                                  : isNodeFocused
                                    ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/60'
                                    : 'border-[#C7B385]'
                          } ${isDimmed ? 'opacity-55' : 'opacity-100'}`}
                        >
                          {/* Clue Card Top Pushpin */}
                          <button
                            type="button"
                            ref={registerPinRef(nodeKey)}
                            onClick={() => toggleFocusNode(nodeKey)}
                            title={`Trace strings for ${clue.name}`}
                            aria-label={`Trace board connections for ${clue.name}`}
                            className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 shadow-md z-40 cursor-pointer transition-transform hover:scale-110 ${
                              isPinnedProof
                                ? 'bg-[#DC2626] border-[#FEE2E2]'
                                : isPinnedMotive
                                  ? 'bg-[#D97706] border-[#FEF3C7]'
                                  : isNodeFocused
                                    ? 'bg-[#2563EB] border-[#DBEAFE]'
                                    : 'bg-[#1D4ED8] border-[#DBEAFE]'
                            }`}
                          />

                          <div className="flex items-start justify-between gap-2 border-b border-[#D86B6B]/45 pb-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                noirAudio.playPaperRustle();
                                setInspectedClue(clue);
                              }}
                              className="text-left min-w-0 flex-1 cursor-pointer hover:underline"
                            >
                              <div className="text-xs font-serif font-bold text-[#1A140F] leading-snug">
                                {clue.name}
                              </div>
                              <div className="text-[10px] font-mono uppercase text-[#6B573A] mt-0.5">
                                {clue.category} · {clue.status}
                                {isHidden ? ' · Ruled Out' : ''}
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleHideNode(nodeKey)}
                                title={
                                  isHidden
                                    ? `Restore ${clue.name} to board`
                                    : `Rule out & hide ${clue.name}`
                                }
                                aria-label={
                                  isHidden
                                    ? `Restore ${clue.name} to board`
                                    : `Rule out and hide ${clue.name}`
                                }
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  isHidden
                                    ? 'bg-[#2C1E12] text-[#F59E0B]'
                                    : 'text-[#6A5740] hover:bg-[#E7D8B6]'
                                }`}
                              >
                                {isHidden ? (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              noirAudio.playPaperRustle();
                              setInspectedClue(clue);
                            }}
                            className="w-full text-left mt-2 space-y-1.5 cursor-pointer"
                          >
                            <p className="text-[11px] text-[#2F2519] leading-relaxed line-clamp-2">
                              {clue.shortSummary}
                            </p>
                            {refs.length > 0 && (
                              <div className="text-[10px] font-mono text-[#1E3A8A] truncate">
                                {refs.join(' · ')}
                              </div>
                            )}
                          </button>

                          <div className="mt-2 pt-1.5 border-t border-[#E1D5B5] flex flex-wrap items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                noirAudio.playPaperRustle();
                                setInspectedClue(clue);
                              }}
                              className="text-[10px] font-mono font-bold text-[#6E5632] hover:text-[#1E1A14] cursor-pointer"
                            >
                              Read Card →
                            </button>
                            {isEligibleProof && (
                              <div className="flex flex-wrap items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSelectMotiveClue(clue.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                    isPinnedMotive
                                      ? 'bg-[#B45309] text-white'
                                      : 'bg-[#E5D7B6] hover:bg-[#D4B883] text-[#2B1F13]'
                                  }`}
                                >
                                  <Pin className="w-2.5 h-2.5" />
                                  <span>{isPinnedMotive ? 'Motive ★' : 'Pin Motive'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectEvidence(clue.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                    isPinnedProof
                                      ? 'bg-[#DC2626] text-white'
                                      : 'bg-[#E5D7B6] hover:bg-[#D4B883] text-[#2B1F13]'
                                  }`}
                                >
                                  <Pin className="w-2.5 h-2.5" />
                                  <span>{isPinnedProof ? 'Proof ★' : 'Pin Proof'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Guided 4-Slot Indictment Builder */}
            <IndictmentBuilder
              allSuspects={allSuspects}
              discoveredSuspects={discoveredSuspects}
              discoveredWeapons={allDiscoveredWeapons}
              allCaseWeapons={allWeapons}
              allMotives={allMotives}
              eligibleProofClues={evidenceClues}
              locations={locations}
              hiddenKeys={effectiveHiddenKeys}
              submission={submission}
              onUpdateSubmission={onUpdateSubmission}
              onClearTheory={handleResetBoard}
              onOpenIndictment={onOpenIndictment}
            />
          </div>
        </>
      )}

      {/* Journal view still shows quick Indictment Builder shortcut below */}
      {boardTab === 'journal' && (
        <IndictmentBuilder
          allSuspects={allSuspects}
          discoveredSuspects={discoveredSuspects}
          discoveredWeapons={allDiscoveredWeapons}
          allCaseWeapons={allWeapons}
          allMotives={allMotives}
          eligibleProofClues={evidenceClues}
          locations={locations}
          hiddenKeys={effectiveHiddenKeys}
          submission={submission}
          onUpdateSubmission={onUpdateSubmission}
          onClearTheory={handleResetBoard}
          onOpenIndictment={onOpenIndictment}
        />
      )}

      {/* Modals */}
      <MugshotModal
        character={inspectedPortrait?.char ?? null}
        contextLabel={inspectedPortrait?.contextLabel}
        extraNotes={inspectedPortrait?.extraNotes}
        actionLabel={
          inspectedPortrait && suspectIdSet.has(inspectedPortrait.char.id)
            ? submission.accusedCulpritId === inspectedPortrait.char.id
              ? 'Unpin Accused Suspect'
              : 'Pin as Accused Suspect'
            : undefined
        }
        isActionActive={Boolean(
          inspectedPortrait && submission.accusedCulpritId === inspectedPortrait.char.id
        )}
        onAction={
          inspectedPortrait && suspectIdSet.has(inspectedPortrait.char.id)
            ? () => handleSelectSuspect(inspectedPortrait.char.id)
            : undefined
        }
        secondaryActionLabel={
          inspectedPortrait
            ? effectiveHiddenKeys.has(`char:${inspectedPortrait.char.id}`)
              ? 'Restore to Board'
              : 'Rule Out / Hide'
            : undefined
        }
        isSecondaryActionActive={Boolean(
          inspectedPortrait && effectiveHiddenKeys.has(`char:${inspectedPortrait.char.id}`)
        )}
        onSecondaryAction={
          inspectedPortrait
            ? () => handleToggleHideNode(`char:${inspectedPortrait.char.id}`)
            : undefined
        }
        onClose={() => setInspectedPortrait(null)}
      />

      <WeaponModal
        weapon={inspectedWeapon?.weapon ?? null}
        contextLabel={inspectedWeapon?.contextLabel}
        actionLabel={
          inspectedWeapon
            ? submission.selectedWeaponId === inspectedWeapon.weapon.id
              ? 'Unpin Murder Weapon'
              : 'Pin as Murder Weapon'
            : undefined
        }
        isActionActive={Boolean(
          inspectedWeapon && submission.selectedWeaponId === inspectedWeapon.weapon.id
        )}
        onAction={
          inspectedWeapon ? () => handleSelectWeapon(inspectedWeapon.weapon.id) : undefined
        }
        secondaryActionLabel={
          inspectedWeapon
            ? effectiveHiddenKeys.has(`weapon:${inspectedWeapon.weapon.id}`)
              ? 'Restore to Board'
              : 'Rule Out / Hide'
            : undefined
        }
        isSecondaryActionActive={Boolean(
          inspectedWeapon && effectiveHiddenKeys.has(`weapon:${inspectedWeapon.weapon.id}`)
        )}
        onSecondaryAction={
          inspectedWeapon
            ? () => handleToggleHideNode(`weapon:${inspectedWeapon.weapon.id}`)
            : undefined
        }
        onClose={() => setInspectedWeapon(null)}
      />

      <ClueDetailModal
        clue={inspectedClue}
        locations={locations}
        linkedPerson={
          inspectedClue?.relatedCharacterId &&
          isClueCharacterLinkVisible(
            inspectedClue,
            peopleById[inspectedClue.relatedCharacterId]
          )
            ? peopleById[inspectedClue.relatedCharacterId]
            : undefined
        }
        linkedWeapon={
          inspectedClue?.relatedWeaponId && inspectedClue.status !== 'noticed'
            ? weaponLookup.get(inspectedClue.relatedWeaponId)
            : undefined
        }
        isEligibleProof={Boolean(
          inspectedClue &&
            (inspectedClue.supports === 'culprit' ||
              inspectedClue.supports === 'alibi_break' ||
              inspectedClue.supports === 'weapon' ||
              inspectedClue.supports === 'motive' ||
              inspectedClue.supports === 'motive_hook' ||
              inspectedClue.supports === 'red_herring')
        )}
        isPinnedProof={Boolean(
          inspectedClue && submission.selectedDecisiveProofId === inspectedClue.id
        )}
        onTogglePinProof={handleSelectEvidence}
        isPinnedMotive={Boolean(
          inspectedClue && submission.selectedMotiveClueId === inspectedClue.id
        )}
        onTogglePinMotive={handleSelectMotiveClue}
        isHiddenOnBoard={Boolean(
          inspectedClue && effectiveHiddenKeys.has(`clue:${inspectedClue.id}`)
        )}
        onToggleHideOnBoard={(clueId) => handleToggleHideNode(`clue:${clueId}`)}
        onInspectWeapon={(weapon) => {
          noirAudio.playPaperRustle();
          setInspectedWeapon({
            weapon,
            contextLabel: inspectedClue ? `Evidence: ${inspectedClue.name}` : undefined
          });
        }}
        onClose={() => setInspectedClue(null)}
      />
    </div>
  );
};
