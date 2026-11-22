/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'daily' | 'sandbox';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type CharacterVoice = 'cynical' | 'posh' | 'defensive' | 'nervous' | 'gruff';

export type CharacterRole =
  | 'victim'
  | 'culprit'
  | 'suspect'
  | 'witness'
  | 'corroborator'
  | 'staff';

export interface CharacterRelationship {
  characterId: string;
  relationshipType:
    | 'rival'
    | 'creditor'
    | 'accomplice'
    | 'confidant'
    | 'blackmailer'
    | 'family'
    | 'informant';
  strength: number; // 1-10
}

export interface CharacterRoutineEntry {
  locationId: string;
  timeWindow: string;
  frequency: 'nightly' | 'frequent' | 'occasional';
  visitReason: string;
  durationMinutes?: number;
}

export interface DialogueVoiceProfile {
  formality: 'formal' | 'street' | 'clipped' | 'academic';
  verbosity: 'terse' | 'measured' | 'effusive';
  vocabulary: string;
  verbalHabits: string;
}

export interface CharacterTemplate {
  id: string;
  name: string;
  alias: string;
  title: string;
  ageBand: 'young_adult' | 'middle_aged' | 'elder';
  publicPersona: string;
  biography: string;
  traits: string[];
  goals: string[];
  fears: string[];
  personalCode: string[];
  skills: string[];
  resources: string[];
  routineLocations: string[];
  routine: CharacterRoutineEntry[];
  preferredMethods: string[];
  avoidedMethods: string[];
  relationships: CharacterRelationship[];
  voice: CharacterVoice;
  dialogueVoice: DialogueVoiceProfile;
  roleEligibility: CharacterRole[];
  secrets: string[];
  characterKind?: 'core' | 'staff' | 'family_visitor';
  assignedLocationId?: string;
  shiftHours?: { open: string; close: string };
  familyName?: string;
  avatarStyle: {
    hat?: string;
    collar: string;
    tint: string;
    silhouette: string;
  };
}

export interface CharacterCaseInstance extends CharacterTemplate {
  role: CharacterRole;
  isPrimaryCast?: boolean;
  currentLocationId: string;
  alibiClaim: string;
  actualLocationIdAtMurder: string;
  isLying: boolean;
  isRedHerring?: boolean;
  reasonPresent: string;
  personalGoal: string;
  motiveDetails?: string;
  interviewNotes: string[];
  perjuryExposed: boolean;
  demeanor: 'Cooperative' | 'Guarded' | 'Defiant' | 'Nervous' | 'Distraught';
}

export interface TemplatePointOfInterest {
  id?: string;
  label: string;
  description: string;
  coords: { top: number; left: number };
  clueRewardId?: string;
}

export interface LocationTemplate {
  id: string;
  name: string;
  district: string;
  description: string;
  mapCoords: { x: number; y: number }; // Fixed percentage on map canvas
  openingHours?: { open: string; close: string };
  accessRules?: string[];
  staffRoles: string[];
  regularVisitorTags?: string[];
  naturalWeapons: string[];
  neverNaturalWeapons: string[];
  pointsOfInterest?: TemplatePointOfInterest[];
  connectedRoads: string[];
  locationTags?: string[];
  isPublic?: boolean;
  icon: string;
}

export interface PointOfInterest {
  id: string;
  label: string;
  description: string;
  coords: { top: number; left: number }; // percentage inside scene
  clueRewardId?: string;
  requiresClueOrTopicToNotice?: string;
  noticedNoticeText?: string;
  inspected: boolean;
  clueUpdated?: boolean;
}

export interface WorkplaceAbsenceNotice {
  characterId: string;
  characterName: string;
  characterTitle: string;
  reasonLabel: string;
  timelineLabel: string;
  detail: string;
  clueId?: string;
  poiId?: string;
}

export interface LocationCaseInstance extends LocationTemplate {
  discovered: boolean;
  discoveredReason?: string;
  pointsOfInterest: PointOfInterest[];
  absenceNotices?: WorkplaceAbsenceNotice[];
}

export interface MethodTemplate {
  id: string;
  name: string;
  category: 'Blunt Force' | 'Poison' | 'Firearm' | 'Edged Weapon' | 'Strangulation';
  description: string;
  requirements: string[];
  evidenceSignature: string;
  usuallyAvailableAt: string[];
  neverNaturallyAvailableAt: string[];
  portability: 'Pocket' | 'Concealable' | 'Cumbersome';
  accessRules: string[];
  compatibleSkills: string[];
  preferenceTags: string[];
  avoidTags: string[];
  icon: string;
}

export interface MotiveTemplate {
  id: string;
  name: string;
  category: 'Inheritance' | 'Blackmail' | 'Jealousy' | 'Revenge' | 'Mob Silencing' | 'Debt';
  description: string;
  evidenceClueSnippet: string;
  eligibleRelationshipTags: string[];
  requiredFacts: string[];
  clueHooks: string[];
}

export type ClueStatus = 'undiscovered' | 'noticed' | 'interpreted' | 'corroborated';

export interface ClueTemplate {
  id: string;
  name: string;
  category: 'physical' | 'document' | 'forensic' | 'testimony' | 'lead';
  supports:
    | 'culprit'
    | 'weapon'
    | 'motive'
    | 'motive_hook'
    | 'alibi_break'
    | 'location_lead'
    | 'red_herring'
    | 'weapon_transfer'
    | 'suspect_alibi'
    | 'witness_account'
    | 'corroboration'
    | 'roster'
    | 'ambient';
  discoverMethod: 'inspect' | 'revisit_with_fact' | 'interview';
  prerequisites: string[];
}

export interface ClueInstance {
  id: string;
  name: string;
  category: 'physical' | 'document' | 'forensic' | 'testimony' | 'lead';
  shortSummary: string;
  detailedInspection: string;
  locationFoundId: string;
  status: ClueStatus;
  requiresContextToInterpret?: string; // Prerequisite statement or clue
  interpretationNote?: string;
  corroboratedNote?: string;
  supports:
    | 'culprit'
    | 'weapon'
    | 'motive'
    | 'motive_hook'
    | 'alibi_break'
    | 'location_lead'
    | 'red_herring'
    | 'weapon_transfer'
    | 'suspect_alibi'
    | 'witness_account'
    | 'corroboration'
    | 'roster'
    | 'ambient';
  leadsToLocationId?: string;
  relatedCharacterId?: string;
  relatedWeaponId?: string;
}

export interface TimelineEntry {
  characterId: string;
  timeSlot: string; // e.g. "20:00", "20:30", "21:00", "21:30"
  timeEnd?: string;
  locationId: string;
  claimedAction: string;
  actualAction: string;
  isAlibiFalse: boolean;
  confidence: 'confirmed' | 'approximate' | 'disputed';
  provenance: 'physical_record' | 'witness_sighting' | 'suspect_claim' | 'itinerary';
  travelMinutesFromPrev?: number;
  refutingClueId?: string;
}

export interface DialogueFragment {
  id: string;
  topicId: string;
  speakerVoices: CharacterVoice[];
  roleTags: CharacterRole[];
  prerequisites: string[];
  truthMode: 'truthful' | 'deceptive' | 'mistaken' | 'confession';
  promptTemplate: string;
  responseTemplate: string;
  followUps: string[];
}

export interface DialogueTopic {
  id: string;
  title: string;
  prompt: string;
  response: string;
  unlocked: boolean;
  unlocksLocationId?: string;
  unlocksClueId?: string;
  unlocksFactId?: string;
  unlocksTopicIds?: string[];
  requiresClueId?: string;
  requiresFactId?: string;
  requiresAnyClueIds?: string[];
  requiresAnyFactIds?: string[];
  requiresAllFactIds?: string[];
  revealsContradiction?: boolean;
  truthMode?: 'truthful' | 'deceptive' | 'mistaken' | 'confession';
  relatedWeaponId?: string;
}

export interface InterviewState {
  characterId: string;
  topicsUnlocked: string[];
  statementsHeard: string[];
  evidencePresented: string[];
  prematureEvidencePresented?: string[];
  trustState: number;
  pressureState: number;
  revealedFacts: string[];
  followUpsAvailable: string[];
}

export interface JournalEntry {
  id: string;
  kind: 'testimony' | 'physical_evidence' | 'inference';
  title: string;
  content: string;
  sourceId: string;
  timestampLabel: string;
  clueStatus?: ClueStatus;
}

export interface DiscoveryGraphEdge {
  fromLocationId: string;
  toLocationId: string;
  viaClueOrTopicId: string;
  label: string;
}

export interface ValidationCheckResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ValidationReport {
  passed: boolean;
  attempts: number;
  checks: ValidationCheckResult[];
}

export interface CaseHiddenSolution {
  culpritId: string;
  weaponId: string;
  motiveId: string;
  crimeLocationId: string;
  crimeTime: string;
  decisiveProofClueId: string;
  alibiBreakClueId: string;
  truthSummary: string;
  stepByStepChronology: { time: string; event: string }[];
  weaponRelocated?: boolean;
  weaponHostLocationId?: string;
}

export interface CharacterScheduleWindow {
  id: string;
  characterId: string;
  locationId: string;
  timelinePhase: 'murder_night' | 'investigation_day';
  kind: 'shift' | 'visit';
  startMinutes: number;
  endMinutes: number;
  startStr: string;
  endStr: string;
  purpose: string;
}

export interface CaseInstance {
  caseId: string;
  seed: string;
  seedNumber: number;
  rulesetVersion: string;
  difficulty: Difficulty;
  caseTitle: string;
  caseNumber: string;
  dateStr: string;
  victim: CharacterCaseInstance;
  culprit: CharacterCaseInstance;
  suspects: CharacterCaseInstance[];
  witnesses: CharacterCaseInstance[];
  candidateWeapons: MethodTemplate[];
  candidateMotives: MotiveTemplate[];
  motive: MotiveTemplate;
  weapon: MethodTemplate;
  crimeSceneLocationId: string;
  crimeTime: string;
  investigationStartMinutes: number;
  schedules: Record<string, CharacterScheduleWindow[]>;
  dispatchMemo: string;
  autopsyReport: string;
  locations: Record<string, LocationCaseInstance>;
  clues: Record<string, ClueInstance>;
  timeline: TimelineEntry[];
  dialogueMap: Record<string, DialogueTopic[]>;
  interviewStates: Record<string, InterviewState>;
  discoveryGraph: DiscoveryGraphEdge[];
  validationReport: ValidationReport;
  hiddenSolution: CaseHiddenSolution;
}

export interface IndictmentSubmission {
  accusedCulpritId: string | null;
  selectedWeaponId: string | null;
  selectedMotiveId: string | null;
  selectedMotiveClueId?: string | null;
  selectedAlibiBreakPinId: string | null;
  selectedDecisiveProofId: string | null;
}

export interface IndictmentResult {
  isSolved: boolean;
  verdict: 'guilty_confirmed' | 'mistrial_insufficient_proof' | 'wrongful_accusation';
  grade: 'Master Detective' | 'Senior Inspector' | 'Gumshoe' | 'Case Thrown Out';
  accuracyPercentage: number;
  culpritCorrect: boolean;
  weaponCorrect: boolean;
  motiveCorrect: boolean;
  alibiBrokenCorrect: boolean;
  decisiveEvidenceCorrect: boolean;
  feedbackLines: string[];
  truthChronology: { time: string; event: string }[];
  timeTakenSeconds: number;
  totalTravelMinutes: number;
}

export function getDemeanorStyle(demeanor: string, perjuryExposed = false): string {
  if (perjuryExposed) {
    return 'bg-rose-950/70 text-rose-300 border-rose-600 font-bold animate-pulse';
  }
  switch (demeanor) {
    case 'Cooperative':
      return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
    case 'Guarded':
      return 'bg-amber-950/40 text-amber-400 border-amber-800/40';
    case 'Defiant':
      return 'bg-orange-950/40 text-orange-400 border-orange-800/40';
    case 'Nervous':
      return 'bg-sky-950/40 text-sky-400 border-sky-800/40';
    case 'Distraught':
      return 'bg-purple-950/40 text-purple-400 border-purple-800/40';
    default:
      return 'bg-amber-950/40 text-amber-400 border-amber-800/40';
  }
}

export function getDemeanorPinStyle(demeanor: string, perjuryExposed = false): string {
  if (perjuryExposed) {
    return 'bg-[#DC2626] border-[#FEE2E2]';
  }
  switch (demeanor) {
    case 'Cooperative':
      return 'bg-[#16A34A] border-[#DCFCE7]';
    case 'Guarded':
      return 'bg-[#D97706] border-[#FEF3C7]';
    case 'Defiant':
      return 'bg-[#EA580C] border-[#FFEDD5]';
    case 'Nervous':
      return 'bg-[#0284C7] border-[#E0F2FE]';
    case 'Distraught':
      return 'bg-[#9333EA] border-[#F3E8FF]';
    default:
      return 'bg-[#D97706] border-[#FEF3C7]';
  }
}
