/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { DeskView } from './components/DeskView';
import { CityMapView } from './components/CityMapView';
import { LocationSceneView } from './components/LocationSceneView';
import { CaseBoardView } from './components/CaseBoardView';
import { InterrogationModal } from './components/InterrogationModal';
import { IndictmentModal } from './components/IndictmentModal';
import { generateCaseFromSeed, getDailySeedString } from './engine/caseGenerator';
import { MASTER_LOCATIONS } from './engine/templates';
import { calculateRoadTravelMinutes } from './engine/fragments';
import { getLinkedClueIdsForTopic, getLinkedTopicIdsForClue } from './engine/interrogationSync';
import {
  CharacterInterviewStatus,
  getCharacterInterviewStatus,
  getCharactersPresentAtLocation,
  getLocationMapStatus,
  getUnlockedTopicIdsForCharacter,
  LocationMapStatus
} from './engine/mapStatus';
import { BoardNodeKey } from './engine/boardGraph';
import { hashString } from './engine/prng';
import {
  CaseInstance,
  CharacterCaseInstance,
  ClueInstance,
  Difficulty,
  IndictmentSubmission,
  InterviewState,
  JournalEntry,
  MethodTemplate,
  PointOfInterest
} from './types/game';
import { noirAudio } from './utils/audio';
import {
  DEFAULT_INVESTIGATION_START_MINUTES,
  formatInvestigationClock,
  isCharacterPresentAt
} from './engine/timeUtils';

export default function App() {
  const [currentSeed, setCurrentSeed] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSeed = params.get('seed');
      if (urlSeed && urlSeed.trim()) {
        return urlSeed.trim().toUpperCase();
      }
    } catch {
      // fallback
    }
    return getDailySeedString();
  });

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [activeCase, setActiveCase] = useState<CaseInstance>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSeed = params.get('seed');
      if (urlSeed && urlSeed.trim()) {
        return generateCaseFromSeed(urlSeed.trim().toUpperCase(), 'easy');
      }
    } catch {
      // fallback
    }
    return generateCaseFromSeed(getDailySeedString(), 'easy');
  });

  const [activeView, setActiveView] = useState<'desk' | 'map' | 'scene' | 'board'>('desk');
  const [currentLocationId, setCurrentLocationId] = useState<string>(() =>
    activeCase.locations['agency'] ? 'agency' : activeCase.crimeSceneLocationId
  );

  // Dynamic Case State
  const [locations, setLocations] = useState(activeCase.locations);
  const [clues, setClues] = useState(activeCase.clues);
  const [visitedLocationIds, setVisitedLocationIds] = useState<string[]>(() => [
    activeCase.locations['agency'] ? 'agency' : activeCase.crimeSceneLocationId
  ]);
  const [seenUnlockedTopicsByChar, setSeenUnlockedTopicsByChar] = useState<
    Record<string, string[]>
  >({});
  const [interviewStates, setInterviewStates] = useState<Record<string, InterviewState>>(
    () => activeCase.interviewStates
  );
  const [revealedFacts, setRevealedFacts] = useState<string[]>([]);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  // Timer starts as soon as the player leaves the Office Desk page
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isCaseSolvedInSession, setIsCaseSolvedInSession] = useState<boolean>(false);
  const [isCaseSurrendered, setIsCaseSurrendered] = useState<boolean>(false);
  const [totalTravelMinutes, setTotalTravelMinutes] = useState<number>(0);
  const [investigationMinutes, setInvestigationMinutes] = useState<number>(
    () => activeCase.investigationStartMinutes ?? DEFAULT_INVESTIGATION_START_MINUTES
  );

  // Active Interrogation Modal
  const [activeInterrogationChar, setActiveInterrogationChar] =
    useState<CharacterCaseInstance | null>(null);

  // Case Board Submission state & manually ruled-out/hidden nodes
  const [submission, setSubmission] = useState<IndictmentSubmission>({
    accusedCulpritId: null,
    selectedWeaponId: null,
    selectedMotiveId: null,
    selectedMotiveClueId: null,
    selectedAlibiBreakPinId: null,
    selectedDecisiveProofId: null
  });
  const [hiddenBoardNodeKeys, setHiddenBoardNodeKeys] = useState<BoardNodeKey[]>([]);

  const [isIndictmentOpen, setIsIndictmentOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(noirAudio.isMuted());

  // LocalStorage solved seeds
  const [solvedSeeds, setSolvedSeeds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('noir_solved_seeds');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Stopwatch effect
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Start stopwatch automatically whenever the player leaves the Office Desk page
  useEffect(() => {
    if (activeView !== 'desk' && !isCaseSolvedInSession && !isCaseSurrendered) {
      setIsTimerRunning(true);
    }
  }, [activeView, isCaseSolvedInSession, isCaseSurrendered]);

  // Always start at the top of the page when switching views or traveling to a new location
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeView, currentLocationId]);

  const handleChangeView = (view: 'desk' | 'map' | 'scene' | 'board') => {
    if (view !== 'desk' && !isCaseSolvedInSession && !isCaseSurrendered) {
      setIsTimerRunning(true);
    }
    setActiveView(view);
  };

  // Handle case seed & difficulty changes
  const loadCase = (newSeed: string, diff = difficulty) => {
    const cleanSeed = newSeed.trim().toUpperCase();
    const generated = generateCaseFromSeed(cleanSeed, diff);
    const startingLocId = generated.locations['agency'] ? 'agency' : generated.crimeSceneLocationId;
    setActiveCase(generated);
    setCurrentSeed(cleanSeed);
    setDifficulty(diff);
    setCurrentLocationId(startingLocId);
    setLocations(generated.locations);
    setClues(generated.clues);
    setVisitedLocationIds([startingLocId]);
    setSeenUnlockedTopicsByChar({});
    setInterviewStates(generated.interviewStates);
    setRevealedFacts([]);
    setSecondsElapsed(0);
    // Keep timer stopped while on Office Desk until the player leaves it
    setIsTimerRunning(false);
    setIsCaseSolvedInSession(false);
    setIsCaseSurrendered(false);
    setTotalTravelMinutes(0);
    setInvestigationMinutes(generated.investigationStartMinutes ?? DEFAULT_INVESTIGATION_START_MINUTES);
    setSubmission({
      accusedCulpritId: null,
      selectedWeaponId: null,
      selectedMotiveId: null,
      selectedMotiveClueId: null,
      selectedAlibiBreakPinId: null,
      selectedDecisiveProofId: null
    });
    setHiddenBoardNodeKeys([]);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('seed', cleanSeed);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }

    showToast(`Loaded ${generated.caseTitle} (${cleanSeed})`);
  };

  // Start / return to work action triggered by "Get to work" (always opens Hudson Detective Agency)
  const handleStartInvestigation = () => {
    noirAudio.playTypewriterBell();
    if (!isCaseSolvedInSession && !isCaseSurrendered) {
      setIsTimerRunning(true);
    }
    if (locations['agency']) {
      if (currentLocationId !== 'agency') {
        handleTravelToLocation('agency');
        return;
      }
      setVisitedLocationIds((prev) => (prev.includes('agency') ? prev : [...prev, 'agency']));
    }
    setActiveView('scene');
  };

  // Advance investigation timeline
  const handleAdvanceTime = (deltaMinutes: number, reason?: string) => {
    if (deltaMinutes <= 0) return;
    setInvestigationMinutes((prev) => {
      const next = prev + deltaMinutes;
      showToast(reason ? `${reason} (${formatInvestigationClock(next)})` : `Clock advanced to ${formatInvestigationClock(next)}`);
      return next;
    });
  };

  const handleWaitUntilMinute = (targetMinutes: number, reason?: string) => {
    setInvestigationMinutes((prev) => {
      const next = Math.max(prev, targetMinutes);
      if (next > prev) {
        showToast(reason ? `${reason} (${formatInvestigationClock(next)})` : `Waited until ${formatInvestigationClock(next)}`);
      }
      return next;
    });
  };

  // Travel action using symmetric city road network
  const handleTravelToLocation = (locId: string) => {
    if (locId === currentLocationId) {
      setVisitedLocationIds((prev) => (prev.includes(locId) ? prev : [...prev, locId]));
      setActiveView('scene');
      return;
    }

    const leavingLoc = locations[currentLocationId];
    if (leavingLoc) {
      const presentAtLeaving = getCharactersPresentAtLocation(
        leavingLoc,
        livingCharacters,
        activeCase.schedules,
        investigationMinutes
      );
      if (presentAtLeaving.length > 0) {
        setSeenUnlockedTopicsByChar((prev) => {
          const next = { ...prev };
          for (const ch of presentAtLeaving) {
            next[ch.id] = getUnlockedTopicIdsForCharacter(
              ch,
              activeCase.dialogueMap[ch.id] || [],
              interviewStates[ch.id],
              clues,
              revealedFacts
            );
          }
          return next;
        });
      }
    }

    const travelMins = calculateRoadTravelMinutes(MASTER_LOCATIONS, currentLocationId, locId);
    noirAudio.playTravelSound(travelMins);
    setVisitedLocationIds((prev) => (prev.includes(locId) ? prev : [...prev, locId]));
    setCurrentLocationId(locId);
    setTotalTravelMinutes((prev) => prev + travelMins);
    setInvestigationMinutes((prev) => prev + travelMins);
    setActiveView('scene');
    showToast(`Arrived at ${locations[locId]?.name || 'new location'} (+${travelMins}m transit)`);
  };

  // Mark already-inspected POIs as updated when their clue changes so the player sees an orange indicator
  const markCluePoisUpdated = (clueIds: string[]) => {
    if (clueIds.length === 0) return;
    const clueIdSet = new Set(clueIds);
    setLocations((prev) => {
      let anyLocationChanged = false;
      const nextLocations: typeof prev = { ...prev };
      for (const [locId, loc] of Object.entries(prev)) {
        let locChanged = false;
        const updatedPOIs = loc.pointsOfInterest.map((p) => {
          if (p.inspected && p.clueRewardId && clueIdSet.has(p.clueRewardId)) {
            locChanged = true;
            return { ...p, clueUpdated: true };
          }
          return p;
        });
        if (locChanged) {
          anyLocationChanged = true;
          nextLocations[locId] = {
            ...loc,
            pointsOfInterest: updatedPOIs
          };
        }
      }
      return anyLocationChanged ? nextLocations : prev;
    });
  };

  // Helper to record newly revealed facts and automatically upgrade any waiting 'noticed' clues
  const registerFactAndUpgradeClues = (factId: string) => {
    setRevealedFacts((prev) => (prev.includes(factId) ? prev : [...prev, factId]));
    const upgradedIds = Object.values(clues)
      .filter((c) => c.status === 'noticed' && c.requiresContextToInterpret === factId)
      .map((c) => c.id);

    if (upgradedIds.length > 0) {
      setClues((prev) => {
        let changed = false;
        const next: Record<string, ClueInstance> = { ...prev };
        for (const [id, c] of Object.entries(prev)) {
          if (c.status === 'noticed' && c.requiresContextToInterpret === factId) {
            changed = true;
            next[id] = {
              ...c,
              status: 'interpreted',
              interpretationNote:
                c.interpretationNote ||
                'Cross-referenced with suspect testimony — initials and physical trace match this suspect. Confront them to verify or refute.'
            };
          }
        }
        return changed ? next : prev;
      });
      markCluePoisUpdated(upgradedIds);
    }
  };

  // Shared helper for corroborating clues & updating board/toast when confronted in either tab
  const applyClueConfrontationEffects = (clueId: string, char: CharacterCaseInstance) => {
    const clue = clues[clueId];
    if (!clue) return;

    if (char.role === 'culprit' && (clue.supports === 'alibi_break' || clue.supports === 'culprit')) {
      if (clue.supports === 'alibi_break') {
        setSubmission((prev) => ({
          ...prev,
          selectedAlibiBreakPinId: clueId
        }));
      }
      setHiddenBoardNodeKeys((prev) =>
        prev.filter((k) => k !== `char:${char.id}` && k !== `clue:${clueId}`)
      );
      setClues((prev) => ({
        ...prev,
        [clueId]: {
          ...prev[clueId],
          status: 'corroborated',
          interpretationNote:
            prev[clueId].corroboratedNote ||
            `Contradiction Corroborated: Refutes ${char.name}'s claim of never leaving ${locations[char.currentLocationId]?.name || 'their alibi spot'}.`
        }
      }));
      markCluePoisUpdated([clueId]);
      showToast(`Perjury Exposed: ${char.name}'s statement contradicted ${clue.name}.`);
    } else if (clue.id.startsWith('clue_liar_trace_') && clue.relatedCharacterId === char.id) {
      registerFactAndUpgradeClues(`liar_trace_explained_${char.id}`);
      const locName = locations[clue.locationFoundId]?.name || 'the venue';
      setClues((prev) => ({
        ...prev,
        [clueId]: {
          ...prev[clueId],
          status: 'corroborated',
          interpretationNote:
            prev[clueId].interpretationNote ||
            `Initialed Trace Explained: ${char.name} acknowledged leaving ${prev[clueId].name} at ${locName} during a separate dispute, denying involvement in the murder.`
        }
      }));
      markCluePoisUpdated([clueId]);
      showToast(`${char.name} explained their initialed trace at ${locName}.`);
    } else if (clue.id.startsWith('clue_liar_motive_') && clue.relatedCharacterId === char.id) {
      registerFactAndUpgradeClues(`liar_motive_discussed_${char.id}`);
      setClues((prev) => ({
        ...prev,
        [clueId]: {
          ...prev[clueId],
          status: 'corroborated',
          interpretationNote:
            prev[clueId].interpretationNote ||
            `Motive Admitted (Non-Fatal): ${char.name} acknowledged this grievance with the victim while maintaining they did not kill anyone.`
        }
      }));
      markCluePoisUpdated([clueId]);
      showToast(`${char.name} admitted their dispute over ${clue.name}.`);
    } else if (clue.id.startsWith('clue_gossip_') && clue.relatedCharacterId === char.id) {
      setClues((prev) => ({
        ...prev,
        [clueId]: {
          ...prev[clueId],
          status: 'corroborated',
          interpretationNote:
            prev[clueId].interpretationNote ||
            `Street Rumor Challenged: ${char.name} dismissed the second-hand sighting rumor as neighborhood gossip.`
        }
      }));
      markCluePoisUpdated([clueId]);
      showToast(`Confronted ${char.name} with the neighborhood gossip lead.`);
    } else if (clue.supports === 'red_herring' && clue.relatedCharacterId === char.id) {
      const explainedFact =
        clue.id === 'clue_red_herring_2' ? 'red_herring_2_explained' : 'red_herring_explained';
      registerFactAndUpgradeClues(explainedFact);
      setClues((prev) => ({
        ...prev,
        [clueId]: {
          ...prev[clueId],
          status: 'corroborated',
          interpretationNote:
            prev[clueId].corroboratedNote ||
            `Alibi Verified: ${char.name} accounted for leaving ${prev[clueId].name} earlier.`
        }
      }));
      markCluePoisUpdated([clueId]);
      showToast(
        clue.id === 'clue_red_herring_2'
          ? `Daytime errand verified: ${char.name} explained ${clue.name}.`
          : `Alibi verified: ${char.name}'s dispute was settled earlier.`
      );
    } else if (clue.id === 'clue_second_suspect_record' && clue.relatedCharacterId === char.id) {
      registerFactAndUpgradeClues('second_suspect_confessed_visit');
      const secretLocName = locations[clue.locationFoundId]?.name || 'the secret venue';
      setClues((prev) => ({
        ...prev,
        [clueId]: {
          ...prev[clueId],
          status: 'corroborated',
          interpretationNote: `Secret Visit Admitted: ${char.name} confessed to visiting ${secretLocName} and revealed who they spotted heading toward the crime scene.`
        }
      }));
      markCluePoisUpdated([clueId]);
      showToast(`${char.name} admitted visiting ${secretLocName} and shared what they saw.`);
    } else if (char.role === 'corroborator' && clue.supports === 'corroboration') {
      registerFactAndUpgradeClues('red_herring_corroborated');
      if (clue.status !== 'corroborated') {
        setClues((prev) => ({
          ...prev,
          [clueId]: {
            ...prev[clueId],
            status: 'corroborated',
            interpretationNote:
              prev[clueId].corroboratedNote ||
              prev[clueId].interpretationNote ||
              `${char.name} verified the signed record and confirmed the evening alibi.`
          }
        }));
        markCluePoisUpdated([clueId]);
      }
      if (char.isLying) {
        showToast(`Perjury Exposed: ${char.name} admitted meeting at ${locations[clue.locationFoundId]?.name || 'the venue'}.`);
      }
    } else if (char.isLying) {
      const charTopics = activeCase.dialogueMap[char.id] || [];
      const contradictionTopic = charTopics.find(
        (t) =>
          Boolean(t.revealsContradiction) &&
          (t.requiresClueId === clueId || Boolean(t.requiresAnyClueIds?.includes(clueId)))
      );
      if (contradictionTopic) {
        if (contradictionTopic.unlocksFactId) {
          registerFactAndUpgradeClues(contradictionTopic.unlocksFactId);
        }
        setClues((prev) => ({
          ...prev,
          [clueId]: {
            ...prev[clueId],
            status: 'corroborated',
            interpretationNote:
              prev[clueId].interpretationNote ||
              `Perjury Exposed: Contradicted ${char.name}'s whereabouts claim with ${prev[clueId].name}.`
          }
        }));
        markCluePoisUpdated([clueId]);
        showToast(`Perjury Exposed: ${char.name}'s statement contradicted ${clue.name}.`);
      }
    }
  };

  // Inspect Point of Interest with two-stage clue gating (undiscovered -> noticed -> interpreted)
  const handleInspectPOI = (poi: PointOfInterest) => {
    if (!poi.inspected) {
      setInvestigationMinutes((prev) => prev + 5);
    }
    setLocations((prev) => {
      const currentLoc = prev[currentLocationId];
      if (!currentLoc) return prev;
      const updatedPOIs = currentLoc.pointsOfInterest.map((p) =>
        p.id === poi.id ? { ...p, inspected: true, clueUpdated: false } : p
      );
      return {
        ...prev,
        [currentLocationId]: {
          ...currentLoc,
          pointsOfInterest: updatedPOIs
        }
      };
    });

    if (poi.clueRewardId && clues[poi.clueRewardId]) {
      const clue = clues[poi.clueRewardId];
      const contextMet =
        !clue.requiresContextToInterpret ||
        revealedFacts.includes(clue.requiresContextToInterpret);

      if (clue.status === 'undiscovered') {
        const nextStatus = contextMet ? 'interpreted' : 'noticed';
        setClues((prev) => ({
          ...prev,
          [clue.id]: {
            ...clue,
            status: nextStatus
          }
        }));

        showToast(
          nextStatus === 'noticed'
            ? `Initial Observation: ${clue.name} (Needs testimony context)`
            : `Clue Logged: ${clue.name}`
        );

        // If this clue leads to an undiscovered location, unlock it!
        if (clue.leadsToLocationId && locations[clue.leadsToLocationId]) {
          const targetLoc = locations[clue.leadsToLocationId];
          if (!targetLoc.discovered) {
            setLocations((prev) => ({
              ...prev,
              [clue.leadsToLocationId!]: {
                ...prev[clue.leadsToLocationId!],
                discovered: true,
                discoveredReason: `Unlocked by ${clue.name}`
              }
            }));
            showToast(`New Location Unlocked on Map: ${targetLoc.name}`);
          }
        }
      } else if (clue.status === 'noticed' && contextMet) {
        setClues((prev) => ({
          ...prev,
          [clue.id]: {
            ...clue,
            status: 'interpreted',
            interpretationNote:
              clue.interpretationNote ||
              'Re-evaluated against suspect alibi — forensic initials and cloth weave confirmed.'
          }
        }));
        showToast(`Clue Interpreted: ${clue.name}`);
      }
    }
  };

  // Handle case solved
  const handleCaseSolved = (seed: string) => {
    setIsTimerRunning(false);
    setIsCaseSolvedInSession(true);
    if (!solvedSeeds.includes(seed)) {
      const updated = [...solvedSeeds, seed];
      setSolvedSeeds(updated);
      try {
        localStorage.setItem('noir_solved_seeds', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to localStorage', err);
      }
    }
  };

  // Handle surrender (freeze timer without marking case solved)
  const handleCaseSurrendered = () => {
    setIsTimerRunning(false);
    setIsCaseSurrendered(true);
  };

  const livingCharacters = useMemo(
    () => [activeCase.culprit, ...activeCase.suspects, ...activeCase.witnesses],
    [activeCase]
  );

  const allCaseWeapons = useMemo(() => {
    const byId = new Map<string, MethodTemplate>();
    byId.set(activeCase.weapon.id, activeCase.weapon);
    for (const w of activeCase.candidateWeapons || []) {
      if (!byId.has(w.id)) byId.set(w.id, w);
    }
    return Array.from(byId.values());
  }, [activeCase]);

  const discoveredCluesList = Object.values(clues).filter((c) => c.status !== 'undiscovered');
  const currentLocation = locations[currentLocationId] || locations[activeCase.crimeSceneLocationId];

  const presentCharacters = useMemo(
    () =>
      livingCharacters.filter((c) => {
        if (activeCase.schedules && activeCase.schedules[c.id]) {
          return isCharacterPresentAt(
            activeCase.schedules,
            c.id,
            currentLocationId,
            investigationMinutes,
            currentLocation?.openingHours,
            'investigation_day'
          );
        }
        return c.currentLocationId === currentLocationId;
      }),
    [livingCharacters, activeCase.schedules, currentLocationId, investigationMinutes, currentLocation?.openingHours]
  );

  // Build Case Journal entries cleanly without ever exposing activeCase.hiddenSolution
  const journalEntries: JournalEntry[] = useMemo(() => {
    const entries: JournalEntry[] = [];

    // 1. Physical Evidence entries
    for (const clue of discoveredCluesList) {
      const foundAt = locations[clue.locationFoundId]?.name || 'New Bay';
      entries.push({
        id: `ev_${clue.id}`,
        kind: 'physical_evidence',
        title: clue.name,
        content:
          clue.status === 'noticed'
            ? `${clue.shortSummary} (Observed at ${foundAt} — awaiting corroborating testimony to interpret fully.)`
            : clue.detailedInspection,
        sourceId: clue.id,
        timestampLabel: foundAt,
        clueStatus: clue.status
      });
    }

    // 2. Testimony entries from persistent InterviewState
    for (const char of livingCharacters) {
      const iState = interviewStates[char.id];
      if (!iState) continue;
      const charTopics = activeCase.dialogueMap[char.id] || [];
      for (const topicId of iState.statementsHeard) {
        if (topicId === `topic_${char.id}_whereabouts`) {
          entries.push({
            id: `test_${char.id}_${topicId}`,
            kind: 'testimony',
            title: `${char.name} — Whereabouts / Alibi`,
            content: char.alibiClaim,
            sourceId: char.id,
            timestampLabel: locations[char.currentLocationId]?.name || 'Interview'
          });
          continue;
        }
        const topic = charTopics.find((t) => t.id === topicId);
        if (!topic) continue;
        entries.push({
          id: `test_${char.id}_${topicId}`,
          kind: 'testimony',
          title: `${char.name} — ${topic.title}`,
          content: topic.response,
          sourceId: char.id,
          timestampLabel: locations[char.currentLocationId]?.name || 'Interview'
        });
      }
    }

    // 3. Detective's Inference entries (derived strictly from discovered/corroborated findings)
    for (const clue of discoveredCluesList) {
      if (clue.interpretationNote) {
        entries.push({
          id: `inf_${clue.id}`,
          kind: 'inference',
          title: `Deduction: ${clue.name}`,
          content: clue.interpretationNote,
          sourceId: clue.id,
          timestampLabel: clue.status.toUpperCase()
        });
      }
    }
    if (revealedFacts.includes('red_herring_corroborated')) {
      const corroborator = livingCharacters.find((ch) => ch.role === 'corroborator');
      const corrTopic = corroborator
        ? (activeCase.dialogueMap[corroborator.id] || []).find((t) => t.id === 'topic_corroborate_alibi')
        : undefined;
      entries.push({
        id: 'inf_red_herring_alibi',
        kind: 'inference',
        title: 'Corroborated Alibi Statement',
        content:
          corrTopic?.response ||
          clues['clue_corroborator_record']?.detailedInspection ||
          'Third-party witness vouched for the suspect’s evening whereabouts and earlier settlement.',
        sourceId: 'red_herring_corroborated',
        timestampLabel: 'VERIFIED'
      });
    }

    return entries;
  }, [discoveredCluesList, locations, livingCharacters, interviewStates, activeCase.dialogueMap, revealedFacts, clues]);

  const locationMapStatuses = useMemo(() => {
    const map: Record<string, LocationMapStatus> = {};
    for (const loc of Object.values(locations)) {
      map[loc.id] = getLocationMapStatus(loc, {
        currentLocationId,
        visitedLocationIds,
        livingCharacters,
        dialogueMap: activeCase.dialogueMap,
        interviewStates,
        clues,
        revealedFacts,
        seenUnlockedTopicsByChar,
        schedules: activeCase.schedules,
        investigationMinutes
      });
    }
    return map;
  }, [
    locations,
    currentLocationId,
    visitedLocationIds,
    livingCharacters,
    activeCase.dialogueMap,
    interviewStates,
    clues,
    revealedFacts,
    seenUnlockedTopicsByChar,
    activeCase.schedules,
    investigationMinutes
  ]);

  const characterInterviewStatuses = useMemo(() => {
    const map: Record<string, CharacterInterviewStatus> = {};
    for (const char of livingCharacters) {
      map[char.id] = getCharacterInterviewStatus(
        char,
        activeCase.dialogueMap[char.id] || [],
        interviewStates[char.id],
        clues,
        revealedFacts
      );
    }
    return map;
  }, [livingCharacters, activeCase.dialogueMap, interviewStates, clues, revealedFacts]);

  const perjuryExposedByChar = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const char of livingCharacters) {
      const charTopics = activeCase.dialogueMap[char.id] || [];
      const heardSet = new Set(interviewStates[char.id]?.statementsHeard || []);
      const charFacts = new Set([
        ...revealedFacts,
        ...(interviewStates[char.id]?.revealedFacts || [])
      ]);
      const contradictionTopicHeard = charTopics.some(
        (t) =>
          Boolean(t.revealsContradiction) &&
          (heardSet.has(t.id) || (t.unlocksFactId ? charFacts.has(t.unlocksFactId) : false))
      );
      map[char.id] = Boolean(
        char.perjuryExposed ||
          contradictionTopicHeard ||
          (char.role === 'culprit' &&
            (submission.selectedAlibiBreakPinId !== null ||
              revealedFacts.includes('alibi_confronted')))
      );
    }
    return map;
  }, [
    livingCharacters,
    activeCase.dialogueMap,
    interviewStates,
    revealedFacts,
    submission.selectedAlibiBreakPinId
  ]);

  return (
    <div className="min-h-screen bg-[#0C0E12] text-[#E5DEC9] flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={handleChangeView}
        caseTitle={activeCase.caseTitle}
        seed={activeCase.seed}
        secondsElapsed={secondsElapsed}
        investigationMinutes={investigationMinutes}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 px-4 py-2.5 rounded-xl bg-[#171E2B] border border-[#F59E0B]/50 text-xs text-[#E5DEC9] font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1">
        {activeView === 'desk' && (
          <DeskView
            currentCase={activeCase}
            onSelectDaily={() => loadCase(getDailySeedString(), difficulty)}
            onSelectSeed={(seed, diff) => loadCase(seed, diff)}
            onStartInvestigation={handleStartInvestigation}
            difficulty={difficulty}
            setDifficulty={(nextDiff) => {
              if (nextDiff !== difficulty) {
                loadCase(currentSeed, nextDiff);
              }
            }}
            solvedSeeds={solvedSeeds}
          />
        )}

        {activeView === 'map' && (
          <CityMapView
            locations={locations}
            currentLocationId={currentLocationId}
            locationStatuses={locationMapStatuses}
            characterStatuses={characterInterviewStatuses}
            onTravelToLocation={handleTravelToLocation}
            livingCharacters={livingCharacters}
            totalTravelMinutes={totalTravelMinutes}
            schedules={activeCase.schedules}
            investigationMinutes={investigationMinutes}
            onAdvanceTime={(mins) => handleAdvanceTime(mins, 'Waited on street')}
          />
        )}

        {activeView === 'scene' && (
          <LocationSceneView
            location={currentLocation}
            presentCharacters={presentCharacters}
            livingCharacters={livingCharacters}
            characterStatuses={characterInterviewStatuses}
            perjuryExposedByChar={perjuryExposedByChar}
            schedules={activeCase.schedules}
            investigationMinutes={investigationMinutes}
            clues={clues}
            weapons={allCaseWeapons}
            onInspectPOI={handleInspectPOI}
            onOpenInterrogation={(char) => setActiveInterrogationChar(char)}
            onNavigateToMap={() => setActiveView('map')}
            onAdvanceTime={(mins) => handleAdvanceTime(mins, 'Waited at venue')}
            onWaitUntilMinute={(targetMins) => handleWaitUntilMinute(targetMins, `Waited at ${currentLocation.name}`)}
          />
        )}

        {activeView === 'board' && (
          <CaseBoardView
            currentCase={activeCase}
            locations={locations}
            visitedLocationIds={visitedLocationIds}
            currentLocationId={currentLocationId}
            discoveredClues={discoveredCluesList}
            livingCharacters={livingCharacters}
            interviewStates={interviewStates}
            characterStatuses={characterInterviewStatuses}
            perjuryExposedByChar={perjuryExposedByChar}
            journalEntries={journalEntries}
            submission={submission}
            hiddenNodeKeys={hiddenBoardNodeKeys}
            onToggleHideNode={(nodeKey) => {
              const isCurrentlyHidden = hiddenBoardNodeKeys.includes(nodeKey);
              setHiddenBoardNodeKeys((prev) =>
                prev.includes(nodeKey)
                  ? prev.filter((k) => k !== nodeKey)
                  : [...prev, nodeKey]
              );
              if (!isCurrentlyHidden) {
                if (nodeKey.startsWith('char:')) {
                  const charId = nodeKey.slice(5);
                  setSubmission((prev) =>
                    prev.accusedCulpritId === charId ? { ...prev, accusedCulpritId: null } : prev
                  );
                } else if (nodeKey.startsWith('weapon:')) {
                  const weaponId = nodeKey.slice(7);
                  setSubmission((prev) =>
                    prev.selectedWeaponId === weaponId ? { ...prev, selectedWeaponId: null } : prev
                  );
                } else if (nodeKey.startsWith('clue:')) {
                  const clueId = nodeKey.slice(5);
                  setSubmission((prev) => {
                    if (
                      prev.selectedDecisiveProofId !== clueId &&
                      prev.selectedMotiveClueId !== clueId
                    ) {
                      return prev;
                    }
                    return {
                      ...prev,
                      selectedDecisiveProofId:
                        prev.selectedDecisiveProofId === clueId ? null : prev.selectedDecisiveProofId,
                      selectedMotiveClueId:
                        prev.selectedMotiveClueId === clueId ? null : prev.selectedMotiveClueId
                    };
                  });
                }
              }
            }}
            onUpdateSubmission={(updates) => {
              setSubmission((prev) => ({ ...prev, ...updates }));
              const keysToUnhide: BoardNodeKey[] = [];
              if (updates.accusedCulpritId) keysToUnhide.push(`char:${updates.accusedCulpritId}`);
              if (updates.selectedWeaponId) keysToUnhide.push(`weapon:${updates.selectedWeaponId}`);
              if (updates.selectedDecisiveProofId) {
                keysToUnhide.push(`clue:${updates.selectedDecisiveProofId}`);
              }
              if (updates.selectedMotiveClueId) {
                keysToUnhide.push(`clue:${updates.selectedMotiveClueId}`);
              }
              if (keysToUnhide.length > 0) {
                setHiddenBoardNodeKeys((prev) =>
                  prev.filter((k) => !keysToUnhide.includes(k))
                );
              }
            }}
            onOpenIndictment={() => setIsIndictmentOpen(true)}
          />
        )}
      </main>

      {/* Interrogation Modal */}
      {activeInterrogationChar && (
        <InterrogationModal
          character={activeInterrogationChar}
          victimName={activeCase.victim.name}
          caseWeapon={activeCase.weapon}
          weapons={allCaseWeapons}
          getLocationName={(locId) => locations[locId]?.name || locId}
          topics={activeCase.dialogueMap[activeInterrogationChar.id] || []}
          interviewState={
            interviewStates[activeInterrogationChar.id] || {
              characterId: activeInterrogationChar.id,
              topicsUnlocked: [],
              statementsHeard: [],
              evidencePresented: [],
              trustState: 0,
              pressureState: 0,
              revealedFacts: [],
              followUpsAvailable: []
            }
          }
          discoveredClues={discoveredCluesList}
          revealedFacts={revealedFacts}
          onClose={() => setActiveInterrogationChar(null)}
          onTopicAsked={(topicId) => {
            const charId = activeInterrogationChar.id;
            const topic = activeCase.dialogueMap[charId]?.find((t) => t.id === topicId);
            const alreadyHeard = interviewStates[charId]?.statementsHeard?.includes(topicId);
            if (!alreadyHeard) {
              setInvestigationMinutes((prev) => prev + 5);
            }

            const factsToReveal: string[] = [];
            if (topicId === `topic_${charId}_whereabouts`) {
              factsToReveal.push(`heard_${charId}_whereabouts`);
              if (charId === activeCase.culprit.id) {
                factsToReveal.push('heard_culprit_alibi');
              }
            }
            if (topic?.unlocksFactId) {
              factsToReveal.push(topic.unlocksFactId);
            }

            const linkedClueIds = getLinkedClueIdsForTopic(topic, clues);
            const previouslyPresented = new Set(interviewStates[charId]?.evidencePresented || []);

            setInterviewStates((prev) => {
              const curr = prev[charId] || {
                characterId: charId,
                topicsUnlocked: [],
                statementsHeard: [],
                evidencePresented: [],
                prematureEvidencePresented: [],
                trustState: 0,
                pressureState: 0,
                revealedFacts: [],
                followUpsAvailable: []
              };
              const nextHeard = curr.statementsHeard.includes(topicId)
                ? curr.statementsHeard
                : [...curr.statementsHeard, topicId];
              const nextPresented = [...curr.evidencePresented];
              for (const cId of linkedClueIds) {
                if (!nextPresented.includes(cId)) nextPresented.push(cId);
              }
              const nextPremature = (curr.prematureEvidencePresented || []).filter(
                (id) => !linkedClueIds.includes(id)
              );
              const nextUnlocked = [...curr.topicsUnlocked];
              if (topic?.unlocksTopicIds) {
                for (const uId of topic.unlocksTopicIds) {
                  if (!nextUnlocked.includes(uId)) nextUnlocked.push(uId);
                }
              }
              const nextFacts = [...curr.revealedFacts];
              for (const fId of factsToReveal) {
                if (!nextFacts.includes(fId)) nextFacts.push(fId);
              }

              return {
                ...prev,
                [charId]: {
                  ...curr,
                  statementsHeard: nextHeard,
                  evidencePresented: nextPresented,
                  prematureEvidencePresented: nextPremature,
                  topicsUnlocked: nextUnlocked,
                  revealedFacts: nextFacts
                }
              };
            });

            for (const fId of factsToReveal) {
              registerFactAndUpgradeClues(fId);
            }

            for (const cId of linkedClueIds) {
              if (!previouslyPresented.has(cId)) {
                applyClueConfrontationEffects(cId, activeInterrogationChar);
              }
            }

            if (topic?.unlocksLocationId && locations[topic.unlocksLocationId]) {
              setLocations((prev) => ({
                ...prev,
                [topic.unlocksLocationId!]: {
                  ...prev[topic.unlocksLocationId!],
                  discovered: true
                }
              }));
              showToast(`Unlocked location: ${locations[topic.unlocksLocationId].name}`);
            }
          }}
          onConfrontEvidence={(clueId) => {
            const clue = clues[clueId];
            if (!clue) return;
            const charId = activeInterrogationChar.id;
            const prevState = interviewStates[charId];
            if (prevState?.evidencePresented.includes(clueId)) {
              return;
            }

            const hasHeardCulpritAlibi =
              revealedFacts.includes('heard_culprit_alibi') ||
              (prevState?.revealedFacts.includes('heard_culprit_alibi') ?? false) ||
              (prevState?.statementsHeard.includes(`topic_${activeCase.culprit.id}_whereabouts`) ?? false);

            const hasHeardCharacterWhereabouts =
              revealedFacts.includes(`heard_${charId}_whereabouts`) ||
              (prevState?.revealedFacts.includes(`heard_${charId}_whereabouts`) ?? false) ||
              (prevState?.statementsHeard.includes(`topic_${charId}_whereabouts`) ?? false);

            const charTopics = activeCase.dialogueMap[charId] || [];
            const triggersContradictionForLiar =
              activeInterrogationChar.isLying &&
              ((activeInterrogationChar.role === 'culprit' &&
                (clue.supports === 'alibi_break' || clue.supports === 'culprit')) ||
                charTopics.some(
                  (t) =>
                    Boolean(t.revealsContradiction) &&
                    (t.requiresClueId === clueId || Boolean(t.requiresAnyClueIds?.includes(clueId)))
                ));

            if (triggersContradictionForLiar && !hasHeardCharacterWhereabouts) {
              setInterviewStates((prev) => {
                const curr = prev[charId] || {
                  characterId: charId,
                  topicsUnlocked: [],
                  statementsHeard: [],
                  evidencePresented: [],
                  prematureEvidencePresented: [],
                  trustState: 0,
                  pressureState: 0,
                  revealedFacts: [],
                  followUpsAvailable: []
                };
                const currPremature = curr.prematureEvidencePresented || [];
                if (currPremature.includes(clueId)) {
                  return prev;
                }
                return {
                  ...prev,
                  [charId]: {
                    ...curr,
                    prematureEvidencePresented: [...currPremature, clueId]
                  }
                };
              });
              return;
            }

            const isCulpritAlibiBreak =
              activeInterrogationChar.role === 'culprit' && clue.supports === 'alibi_break';
            const linkedTopicIds = getLinkedTopicIdsForClue(
              activeInterrogationChar,
              charTopics,
              clue,
              hasHeardCulpritAlibi,
              hasHeardCharacterWhereabouts
            );
            const extraFactsToReveal: string[] = [];
            if (isCulpritAlibiBreak) {
              extraFactsToReveal.push('alibi_confronted');
            }
            for (const ltId of linkedTopicIds) {
              const lt = charTopics.find((t) => t.id === ltId);
              if (lt?.unlocksFactId && !extraFactsToReveal.includes(lt.unlocksFactId)) {
                extraFactsToReveal.push(lt.unlocksFactId);
              }
            }

            setInterviewStates((prev) => {
              const curr = prev[charId] || {
                characterId: charId,
                topicsUnlocked: [],
                statementsHeard: [],
                evidencePresented: [],
                prematureEvidencePresented: [],
                trustState: 0,
                pressureState: 0,
                revealedFacts: [],
                followUpsAvailable: []
              };
              if (curr.evidencePresented.includes(clueId)) {
                return prev;
              }
              const nextPresented = [...curr.evidencePresented, clueId];
              const nextPremature = (curr.prematureEvidencePresented || []).filter(
                (id) => id !== clueId
              );
              const nextHeard = [...curr.statementsHeard];
              const nextUnlocked = [...curr.topicsUnlocked];
              const nextFacts = [...curr.revealedFacts];

              for (const ltId of linkedTopicIds) {
                if (!nextHeard.includes(ltId)) nextHeard.push(ltId);
                if (!nextUnlocked.includes(ltId)) nextUnlocked.push(ltId);
                const lt = charTopics.find((t) => t.id === ltId);
                if (lt?.unlocksTopicIds) {
                  for (const uId of lt.unlocksTopicIds) {
                    if (!nextUnlocked.includes(uId)) nextUnlocked.push(uId);
                  }
                }
              }

              for (const fId of extraFactsToReveal) {
                if (!nextFacts.includes(fId)) nextFacts.push(fId);
              }

              if (clue.supports === 'alibi_break' && !nextUnlocked.includes('topic_confront_alibi')) {
                nextUnlocked.push('topic_confront_alibi');
              }
              if (clue.supports === 'culprit' && !nextUnlocked.includes('topic_confession_trap')) {
                nextUnlocked.push('topic_confession_trap');
              }
              if (clue.id === 'clue_second_suspect_record' && clue.relatedCharacterId === charId && !nextUnlocked.includes('topic_confront_secret_visit')) {
                nextUnlocked.push('topic_confront_secret_visit');
              }
              if (
                clue.id === 'clue_red_herring_2' &&
                clue.relatedCharacterId === charId &&
                !nextUnlocked.includes('topic_second_suspect_scene_item')
              ) {
                nextUnlocked.push('topic_second_suspect_scene_item');
              } else if (
                clue.supports === 'red_herring' &&
                clue.relatedCharacterId === charId &&
                !nextUnlocked.includes('topic_dispute_note')
              ) {
                nextUnlocked.push('topic_dispute_note');
              }
              return {
                ...prev,
                [charId]: {
                  ...curr,
                  statementsHeard: nextHeard,
                  evidencePresented: nextPresented,
                  prematureEvidencePresented: nextPremature,
                  topicsUnlocked: nextUnlocked,
                  revealedFacts: nextFacts,
                  pressureState: curr.pressureState + 1,
                  trustState: Math.max(-3, curr.trustState - 1)
                }
              };
            });

            for (const fId of extraFactsToReveal) {
              registerFactAndUpgradeClues(fId);
            }

            applyClueConfrontationEffects(clueId, activeInterrogationChar);
          }}
          perjuryExposed={Boolean(perjuryExposedByChar[activeInterrogationChar.id])}
        />
      )}

      {/* Indictment Modal */}
      {isIndictmentOpen && (
        <IndictmentModal
          currentCase={activeCase}
          difficulty={difficulty}
          submission={submission}
          secondsElapsed={secondsElapsed}
          totalTravelMinutes={totalTravelMinutes}
          onClose={() => setIsIndictmentOpen(false)}
          onCaseSolved={handleCaseSolved}
          onSurrender={handleCaseSurrendered}
          onNewCase={() => {
            setIsIndictmentOpen(false);
            const nextCode = (hashString(`${currentSeed}:next`) % 9000) + 1000;
            loadCase(`CASE-${nextCode}`);
            setActiveView('desk');
          }}
        />
      )}
    </div>
  );
}
