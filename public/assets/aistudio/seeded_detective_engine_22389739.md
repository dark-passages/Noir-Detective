# Seeded Detective Story Engine — Setup

## 1. Core contract

A case is generated from a deterministic seed and a versioned ruleset. The generator must produce the same cast, solution, map locations, schedules, dialogue content, clue availability, and outcomes for the same seed and engine version.

```text
caseSeed = hash(gameId, rulesetVersion, levelNumber)
```

Use independent deterministic random streams derived from the case seed, such as `cast`, `solution`, `map`, `timeline`, `clues`, and `dialogue`. This prevents a dialogue-content change from unexpectedly rerolling the culprit or map. Never use runtime clock time or unseeded randomness in case generation.

## 2. Content data model

Keep authored content separate from generated case instances.

### Character template

```text
CharacterTemplate {
  id, name, ageBand, publicPersona, biography,
  traits[], goals[], fears[], secrets[], personalCode[],
  skills[], resources[], methodPreferences[], methodAvoidances[],
  relationships: [{characterTag, relationshipType, strength}],
  routine: [{locationTag, timeWindow, frequency, visitReason}],
  dialogueVoice: {formality, verbosity, vocabulary, verbalHabits},
  roleEligibility[]
}
```

Traits are tendencies, not verdicts. A preference influences plausibility and dialogue but never proves guilt. Identity categories must not be used as shortcuts for capability; use explicit skills, resources, access, and authored preferences.

### Location template

```text
LocationTemplate {
  id, name, description, mapPosition, district, openingHours,
  accessRules[], staffRoles[], regularVisitorTags[],
  evidenceOpportunities[], connectedRoads[], locationTags[]
}
```

Coordinates and districts are fixed in the city map. The generator selects a subset for each case; it does not move locations to suit a plot.

### Weapon or method template

```text
MethodTemplate {
  id, type, requirements[], evidenceSignature[],
  usuallyAvailableAt[], neverNaturallyAvailableAt[],
  portability, accessRules[], compatibleSkills[],
  preferenceTags[], avoidTags[]
}
```

“Never naturally available” means it cannot be selected as ordinary stock at that location. A portable item may appear there only if the generated timeline includes a credible source, transfer, and evidence or explanation for its presence.

### Case content atoms

Use authored, tagged fragments rather than unrestricted generated prose:

```text
DialogueFragment {
  id, speakerTags[], topicTags[], caseFactTags[],
  prerequisites[], truthMode, textTemplate, followUps[]
}
ClueTemplate { id, sourceType, supports[], contradicts[], prerequisites[], discoverMethod }
MotiveTemplate { id, eligibleRelationshipTags[], requiredFacts[], clueHooks[] }
```

Fragments should express a stable character voice while case facts fill named slots. Each generated statement is grounded in both the speaker’s character data and the current case state.

## 3. Deterministic generation pipeline

### Stage A — Select a case frame

Use the `solution` stream to select an eligible victim, perpetrator, motive, and method. Require a plausible relationship or conflict, opportunity, and a case-specific reason. Filter combinations by authored eligibility rules; do not force an incompatible pairing merely to fill a level.

### Stage B — Select locations

Start with the crime scene. Derive candidate locations from the victim’s routine, work, relationships, and the case frame. Add only locations needed for a fair clue chain. Respect the fixed map, opening hours, access rules, and weapon availability. Ensure the player can discover every required location through an obtainable lead.

### Stage C — Build the cast

Include the victim and perpetrator, staff needed at selected locations, and a bounded number of visitors. Give each added person a role (witness, suspect, corroborator, red herring, or unrelated visitor), a reason to be present, and a personal goal. Ensure each role contributes information, a testable claim, or meaningful atmosphere; avoid filler characters.

### Stage D — Construct the timeline

1. Generate the victim’s itinerary as the case backbone.
2. Schedule staff according to opening hours and shifts.
3. Generate visitor itineraries from their routines and goals.
4. Place meaningful intersections: meetings, sightings, overheard exchanges, or near misses.
5. Place the perpetrator’s opportunity, actions, and alibi, including any unusual visit and its reason.
6. Validate travel time along fixed roads, location access, and that no person occupies two places at once.

Store time intervals and confidence/provenance for each event; a witness may report an approximate or mistaken time.

### Stage E — Generate evidence and misdirection

Derive clues from the hidden solution, timeline, people, and locations. Every decisive inference must have at least one discoverable support path. Red herrings must have a coherent innocent explanation and must not require hidden information unavailable to the player. Distinguish observation from interpretation: a clue can be visible before its significance is understood.

### Stage F — Generate interview content

Select dialogue by combining:
- **Character layer:** voice, knowledge, goals, relationships, secrets, habits, and willingness to cooperate.
- **Case layer:** what this person witnessed, did, believes, hides, or misunderstands in this case.
- **Interaction layer:** what the player has discovered, asked, or presented.

A response is available only when its prerequisites are met. Character knowledge limits what they can truthfully report. A lie must have a motive and be detectable through evidence or contradiction; demeanor alone is not proof. A truthful but mistaken account is allowed when the case explains the mistake.

## 4. Interview state and clue gating

Track per character:

```text
InterviewState {
  topicsUnlocked[], statementsHeard[], evidencePresented[],
  trustState, pressureState, revealedFacts[], followUpsAvailable[]
}
```

Player actions are topic-based: ask about a person, place, event, or time; ask for a timeline; present discovered evidence; follow up on a specific statement; end the interview. Answers add journal entries and may unlock topics, leads, or re-examination prompts.

For “notice it only after learning it is relevant,” model two states:

```text
clueState = undiscovered | noticed | interpreted | corroborated
```

A prerequisite fact can move an object from `undiscovered` to `noticeable` on revisiting a place. The object was present all along; the new knowledge changes what the detective recognizes. Do not make a mandatory clue permanently missable.

## 5. Case validation gates

Reject and regenerate a candidate case if any check fails:

- Solution has a coherent motive, capability, access, and opportunity.
- Weapon/method is plausible at its source and any movement is explained.
- All events fit travel times, opening hours, and access rules.
- Required people are present for their stated actions and sightings.
- Every required location has an obtainable discovery lead.
- Every essential deduction has a fair evidence path; no single arbitrary dialogue choice blocks completion.
- Each lie, red herring, and exceptional visit has a discoverable explanation.
- At least one alternative theory can be tested and eliminated by evidence.
- The player can submit culprit, motive, method, and supporting evidence; scoring rewards proof, not just a lucky name.

## 6. Seed fairness and comparison

Display the level number, seed identifier, and ruleset version in the case record. A leaderboard comparison is valid only for the same ruleset version and settings. Record elapsed play time separately from in-game investigation time; include hints and difficulty settings in the comparison metadata. Seed all encounter ordering and dialogue variants so replaying the same case never changes the puzzle.

## 7. Suggested generation output

```text
GeneratedCase {
  caseId, levelNumber, seed, rulesetVersion,
  cast[], selectedLocations[], hiddenSolution,
  schedules[], timelineEvents[], clues[],
  interviewStates[], discoveryGraph[], validationReport
}
```

Keep `hiddenSolution` inaccessible to the player-facing interface. The case journal should expose only discovered facts and clearly distinguish testimony, physical evidence, and the detective’s inference.

## 8. Implementation order

1. Author a small set of compatible character, location, method, motive, clue, and dialogue templates.
2. Implement deterministic streams and the fixed city map.
3. Generate and validate a single case frame and victim timeline.
4. Add cast scheduling, clue chains, and topic-based interviews.
5. Add seeded replay tests: same seed/version produces identical serialized case output; different seeds produce valid variation.
