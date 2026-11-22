/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CharacterRole,
  CharacterTemplate,
  CharacterVoice,
  ClueInstance,
  ClueTemplate,
  DialogueFragment,
  LocationTemplate,
  MotiveTemplate
} from '../types/game';
import { SeededRNG } from './prng';

/**
 * Authored, tagged dialogue fragments driven by character voice, role, and case facts.
 * Keeps character voice stable while filling case-specific slots.
 */
export const DIALOGUE_FRAGMENTS: DialogueFragment[] = [
  // Culprit: Relationship with victim
  {
    id: 'frag_culprit_victim_posh',
    topicId: 'topic_victim',
    speakerVoices: ['posh'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'What was your exact arrangement with {victimName}?',
    responseTemplate:
      'My good detective, {victimName} and I moved in overlapping circles, nothing more. Frankly, {victimName} possessed neither discretion nor manners. Shed no tears over them, though I fail to see why you are troubling me.',
    followUps: []
  },
  {
    id: 'frag_culprit_victim_gruff',
    topicId: 'topic_victim',
    speakerVoices: ['gruff'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'What was your business with {victimName}?',
    responseTemplate:
      'Listen pal, {victimName} ran their mouth in the wrong parlors and leaned on people who push back. We had words once or twice, sure. That don’t put blood on my cuffs.',
    followUps: []
  },
  {
    id: 'frag_culprit_victim_cynical',
    topicId: 'topic_victim',
    speakerVoices: ['cynical'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'How well did you know {victimName}?',
    responseTemplate:
      'Well enough to know {victimName} kept half this town on a short leash. Save your ink, detective—plenty of folks wanted that ledger closed, and I wasn’t holding the pen last night.',
    followUps: []
  },
  {
    id: 'frag_culprit_victim_nervous',
    topicId: 'topic_victim',
    speakerVoices: ['nervous'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'Did you have recent dealings with {victimName}?',
    responseTemplate:
      'Oh, well—purely professional, I assure you! {victimName} could be terribly demanding, yes, quite agitated of late, but I am a person of quiet routine. Violence turns my stomach.',
    followUps: []
  },
  {
    id: 'frag_culprit_victim_defensive',
    topicId: 'topic_victim',
    speakerVoices: ['defensive'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'Speak plainly about your connection to {victimName}.',
    responseTemplate:
      'God forgive us, {victimName} carried dark burdens and tested every soul nearby. We spoke earlier in the week, yes, but I raise prayers—not hands—against the troubled.',
    followUps: []
  },

  // Culprit: Alibi claim
  {
    id: 'frag_culprit_alibi_default',
    topicId: 'topic_alibi',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'Where were you between {alibiWindowStart} and {crimeTime} last night?',
    responseTemplate:
      '{culpritShiftNote}I never left {alibiLocation} from {alibiStartTime} {alibiEndPhrase}! Check with the floor staff if you doubt my word. {alibiSceneDenial}',
    followUps: ['topic_confront_alibi']
  },

  // Culprit: Motive defense
  {
    id: 'frag_culprit_motive_default',
    topicId: 'topic_motive',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'We uncovered papers tied to {motiveName}. Care to explain?',
    responseTemplate: '{culpritMotiveDefenseLine}',
    followUps: []
  },

  // Culprit: Alibi confrontation (requires alibi break clue)
  {
    id: 'frag_culprit_confront_alibi',
    topicId: 'topic_confront_alibi',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['culprit'],
    prerequisites: ['clue_alibi_break'],
    truthMode: 'confession',
    promptTemplate:
      'Explain this {alibiBreakEvidence} logging a passenger in a {culpritCollar} arriving at {crimeLocation} at {cabDropTime}!',
    responseTemplate:
      '(Winces, caught in a lie) ...All right, I shouldn’t have claimed I stayed at {alibiLocation} all night! I slipped over to {crimeLocation} around {cabDropTime} via {alibiBreakTransport} trying to {culpritSecretActionExcuse}, panicked when news of the killing broke, and cleared out before {crimeTime}—I swear I never touched {victimName}!',
    followUps: ['topic_confession_trap']
  },

  // Culprit: Follow-up Trap
  {
    id: 'frag_culprit_confession_trap',
    topicId: 'topic_confession_trap',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['culprit'],
    prerequisites: ['topic_confront_alibi'],
    truthMode: 'confession',
    promptTemplate:
      'If you left early, how did a {decisiveProofItem} marked "{initials}" with {culpritFiberDesc} turn up {decisiveProofContext}?',
    responseTemplate:
      '(Swallows hard as you hold up the {decisiveProofShort}) ...Yes, "{initials}" is mine, and those {culpritFiberDesc} match my coat! I slipped into {crimeLocation} earlier around {culpritEarlierVisitTime} trying to {culpritSecretActionExcuse} over {motiveName}, dropped it there in the rush, and cleared out before {crimeTime}. Having a bitter grievance with {victimName} isn’t murder, detective!',
    followUps: []
  },

  // Innocent Suspects (including Red Herring)
  {
    id: 'frag_suspect_red_herring_note',
    topicId: 'topic_dispute_note',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['suspect'],
    prerequisites: ['clue_red_herring'],
    truthMode: 'truthful',
    promptTemplate:
      'We recovered a {redHerringItem} bearing "{redHerringInitials}" and {redHerringFiberDesc} {redHerringContext} at {crimeLocation}. Explain that.',
    responseTemplate:
      'That {redHerringShort}? Yes, it is mine—I met {victimName} there yesterday at {settlementTime} to settle an overdue balance by {settlementMethod}, and left in a rush before dusk! Ask {corroboratorName} at {corroboratorLocation}—we were together from {corrStart} to {corrEnd} last night!',
    followUps: []
  },

  // Corroborator
  {
    id: 'frag_corroborator_vouch',
    topicId: 'topic_corroborate_alibi',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['corroborator'],
    prerequisites: [],
    truthMode: 'truthful',
    promptTemplate: 'Did you see {redHerringName} or {victimName} yesterday?',
    responseTemplate:
      '{corroboratorShiftNote}I can swear to it, detective. {redHerringName} was with me at {corroboratorLocation} between {corrStart} and {corrEnd} last night. Earlier yesterday at {settlementTime}, {victimName} settled their balance with {redHerringName} via {settlementMethod}—their quarrel was already over.',
    followUps: []
  },
  {
    id: 'frag_culprit_crime_scene',
    topicId: 'topic_crime_scene',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'Did you set foot inside {crimeLocation} over the past few days, or anywhere near it last night?',
    responseTemplate:
      'Not last night, I didn’t. Oh, I walked past {crimeLocation} once or twice earlier in the week in broad daylight, same as half this town—but if someone spotted a silhouette in the rain last night, they didn’t see me.',
    followUps: []
  },
  {
    id: 'frag_culprit_crime_scene_workplace',
    topicId: 'topic_crime_scene_workplace',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['culprit'],
    prerequisites: [],
    truthMode: 'deceptive',
    promptTemplate: 'We know {crimeLocation} is your regular workplace—did you return or stay inside around {crimeTime} last night?',
    responseTemplate:
      '{culpritWorkplaceSceneDeny}',
    followUps: []
  },
  {
    id: 'frag_suspect_rumors',
    topicId: 'topic_suspect_rumors',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['suspect'],
    prerequisites: [],
    truthMode: 'truthful',
    promptTemplate: 'Did you notice anyone else having trouble with {victimName} recently?',
    responseTemplate:
      'New Bay’s full of quiet grudges after dark, detective, and folks who talk out of turn don’t keep their good name long. Unless you have proof on paper showing someone’s business last night, ask the floor clerks and check the rosters.',
    followUps: []
  },
  {
    id: 'frag_suspect_weapon_check',
    topicId: 'topic_suspect_weapon_check',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['suspect'],
    prerequisites: [],
    truthMode: 'truthful',
    promptTemplate: 'Do you handle or recognize anything like a {weaponName}?',
    responseTemplate:
      'Check the storeroom ledgers and stockists before pointing fingers at me, detective. Items like a {weaponName} leave a paper trail wherever they are kept or signed out.',
    followUps: []
  },
  {
    id: 'frag_witness_details',
    topicId: 'topic_witness_details',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['witness'],
    prerequisites: [],
    truthMode: 'truthful',
    promptTemplate: 'What caught your eye first outside {crimeLocation} around {crimeTime}?',
    responseTemplate:
      'A slammed latch and hurried footsteps echoing down the wet brick. Whoever bolted out the back was wearing a distinct {culpritCollar} and practically vaulted toward {fleeTransport}.',
    followUps: []
  },
  {
    id: 'frag_corroborator_relation',
    topicId: 'topic_corroborator_relation',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['corroborator'],
    prerequisites: [],
    truthMode: 'truthful',
    promptTemplate: 'What was the nature of the dispute between {redHerringName} and {victimName}?',
    responseTemplate:
      'Strictly an overdue private balance—sharp words earlier in the week, yes, but no stomach for violence. Once the {settlementMethod} cleared at {settlementTime}, {redHerringName} put the whole ledger behind them.',
    followUps: []
  },
  {
    id: 'frag_corroborator_venue',
    topicId: 'topic_corroborator_venue',
    speakerVoices: ['posh', 'gruff', 'nervous', 'cynical', 'defensive'],
    roleTags: ['corroborator'],
    prerequisites: [],
    truthMode: 'truthful',
    promptTemplate: 'Was {corroboratorLocation} busy while you two were there?',
    responseTemplate:
      'Steady evening trade right through opening hours—floor staff were watching the door the whole stretch, and our signed check or desk ledger is right on the premises if you want it in black and white.',
    followUps: []
  }
];

export const CLUE_TEMPLATES: ClueTemplate[] = [
  { id: 'clue_murder_weapon', name: 'Murder Weapon', category: 'physical', supports: 'weapon', discoverMethod: 'inspect', prerequisites: [] },
  { id: 'clue_motive_document', name: 'Disputed Documents', category: 'document', supports: 'motive', discoverMethod: 'inspect', prerequisites: [] },
  { id: 'clue_alibi_break', name: 'Evening Transit & Departure Record', category: 'forensic', supports: 'alibi_break', discoverMethod: 'inspect', prerequisites: [] },
  { id: 'clue_decisive_proof', name: 'Scene-Specific Physical Proof', category: 'physical', supports: 'culprit', discoverMethod: 'revisit_with_fact', prerequisites: ['heard_culprit_alibi'] },
  { id: 'clue_red_herring', name: 'Suspect Scene Artifact', category: 'document', supports: 'red_herring', discoverMethod: 'inspect', prerequisites: [] },
  { id: 'clue_weapon_transfer', name: 'Signed Property Transfer Slip', category: 'forensic', supports: 'weapon_transfer', discoverMethod: 'inspect', prerequisites: [] }
];

export function pickVoiceFragment(
  rng: SeededRNG,
  topicId: string,
  voice: CharacterVoice,
  role: CharacterRole
): DialogueFragment | undefined {
  const exact = DIALOGUE_FRAGMENTS.filter(
    (f) => f.topicId === topicId && f.speakerVoices.includes(voice) && f.roleTags.includes(role)
  );
  if (exact.length > 0) return rng.pick(exact);
  const byRole = DIALOGUE_FRAGMENTS.filter(
    (f) => f.topicId === topicId && f.roleTags.includes(role)
  );
  if (byRole.length > 0) return rng.pick(byRole);
  return undefined;
}

export function interpolateFragment(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

/**
 * Authored ambient/environmental physical clue definitions for the user's expanded 20-location POIs.
 * None of these spoil the solution; they provide grounded 1940s noir atmosphere and corroborating observations.
 */
export const AMBIENT_POI_CLUES: Record<
  string,
  { name: string; category: ClueInstance['category']; shortSummary: string; detailedInspection: string }
> = {
  missing_case_card: {
    name: 'Missing Alphabetical Index Card',
    category: 'document',
    shortSummary: 'An index gap between "V" and "W" in the Hudson Detective Agency filing drawer.',
    detailedInspection:
      'Dust outlines show a single manila index card was pulled from the Suite 312 drawer within the past twelve hours. Traces of smudged newsprint ink remain on the divider tab.'
  },
  hotel_ledger_key: {
    name: 'Grand St. Moritz Register Tear',
    category: 'document',
    shortSummary: 'A misaligned brass key fob beside a torn page corner from Suite 408.',
    detailedInspection:
      'The concierge desk register shows a late-afternoon private suite booking paid in cash, with the guest signature edge neatly torn away.'
  },
  velvet_backroom_chit: {
    name: 'Velvet Lounge Bottle Tab',
    category: 'document',
    shortSummary: 'An unpaid private booth tab clipped behind the red velvet curtain.',
    detailedInspection:
      'Stamped 20:35 by the floor steward, noting two highballs ordered for a back-corner table that was vacated abruptly before nine.'
  },
  st_judes_bell_rope: {
    name: 'Frayed Belfry Hemp Fiber',
    category: 'physical',
    shortSummary: 'Coarse cut hemp strands snagged on St. Jude’s belfry ironwork.',
    detailedInspection:
      'A six-inch end of weathered bell rope snagged at shoulder height along the stairwell sconce, damp from rain blowing through the louvres.'
  },
  antiquities_appraisal_tag: {
    name: 'Blackwood Vault Appraisal Tag',
    category: 'document',
    shortSummary: 'A loose stringed museum-grade inventory tag dropped beside the vitrine.',
    detailedInspection:
      'Handwritten ink appraisal numbers note an unrecorded evening inspection of heirloom metalware before closing lockup.'
  },
  pier_four_manifest: {
    name: 'Waterfront Pier 4 Bollard Tally',
    category: 'document',
    shortSummary: 'A salt-speckled wharf clipboard recording nocturnal motor-launch traffic.',
    detailedInspection:
      'An entry smudged by river spray logs an unscheduled skiff tying up near Slip 4 just after 21:00.'
  },
  clinic_prescription_stub: {
    name: 'Pendelton Dispensary Narcotics Stub',
    category: 'forensic',
    shortSummary: 'A torn carbon prescription stub caught beneath the locked cabinet latch.',
    detailedInspection:
      'Partial clinic shorthand records an irregular evening withdrawal from the locked apothecary inventory without a patient counter-signature.'
  },
  alley_cab_tire_track: {
    name: 'Raven’s Court Muddy Tire Cast',
    category: 'forensic',
    shortSummary: 'Fresh commercial cab tread impressions halting beside the rear door.',
    detailedInspection:
      'Dual narrow rear treads consistent with Yellow Cab fleet rubber stopped beside the rain puddle long enough to discharge a hurried fare.'
  },
  impressed_note: {
    name: 'Blotter Pad Indentation',
    category: 'document',
    shortSummary: 'Faint pen impressions pressed into the Room 614 desk blotter.',
    detailedInspection:
      'Held under raking lamplight, the green blotter shows partial lettering: "...bring the sealed envelope before 21:00 — no third parties."'
  },
  altered_proof: {
    name: 'Pencilled Galley Proof Sheet',
    category: 'document',
    shortSummary: 'A typeset page marked with hurried blue-pencil deletions.',
    detailedInspection:
      'An entire column naming municipal bond holders was struck out in frantic slanted strokes, accompanied by a margin scribble: "HOLD UNTIL MORNING."'
  },
  disconnected_extension: {
    name: 'Severed Switchboard Trunk Line',
    category: 'physical',
    shortSummary: 'Extension cord 4 pulled sharply from the evening switchboard.',
    detailedInspection:
      'The copper jack is bent slightly out of round; an operator log shows an incoming call from Midtown cut off abruptly at 20:55.'
  },
  railway_ticket_stub: {
    name: 'Unused One-Way Pullman Stub',
    category: 'document',
    shortSummary: 'A stamped outbound rail ticket purchased with cash.',
    detailedInspection:
      'Issued for the 23:15 northbound sleeper express, stamped at Window 3 earlier this evening but never punched by a platform conductor.'
  },
  lipstick_cigarette: {
    name: 'Crimson-Tipped Turkish Cigarette',
    category: 'physical',
    shortSummary: 'An expensive monogrammed cigarette extinguished halfway down.',
    detailedInspection:
      'Lipstick shade is deep carmine, common among supper-club performers and uptown patrons. The ash is still faintly crisp, untouched by rain.'
  },
  marked_dance_card: {
    name: 'Circled Supper Club Dance Card',
    category: 'document',
    shortSummary: 'A torn card with two initials underscored in fountain ink.',
    detailedInspection:
      'Torn along the binding cord. Beside the 21:00 entry, an urgent note reads: "Check coatroom before the second set."'
  },
  empty_medicine_slot: {
    name: 'Wiped Apothecary Shelf Space',
    category: 'forensic',
    shortSummary: 'A clean circular ring amidst dust in the trainer’s cabinet.',
    detailedInspection:
      'While liniment bottles sit untouched, a narrow amber vial space at the rear has been wiped clean with an alcohol rag.'
  },
  fabric_in_drain: {
    name: 'Snagged Dark Wool Thread',
    category: 'physical',
    shortSummary: 'Coarse dark coat fibers caught on a cast-iron storm grate.',
    detailedInspection:
      'Two inches of damp worsted thread tangled around the drain bar alongside fresh boot heel scuffs angled toward the main street.'
  },
  brass_button: {
    name: 'Detached Uniform Brass Button',
    category: 'physical',
    shortSummary: 'A tarnished brass button recovered beside the morgue drain.',
    detailedInspection:
      'Stamped with standard municipal hardware markings on the shank. A fragment of dark blue cotton thread remains knotted through the eye.'
  },
  altered_time_of_death: {
    name: 'Smudged Coroner Entry Sheet',
    category: 'document',
    shortSummary: 'An intake clipboard where the arrival hour was overwritten.',
    detailedInspection:
      'Under close inspection, an initial "21:2" pencil stroke was rubbed out and replaced with a firmer ink notation.'
  },
  blue_cloth_thread: {
    name: 'Blue Serge Fiber on Lattice',
    category: 'physical',
    shortSummary: 'A narrow strip of dark blue cloth snagged inside the confessional.',
    detailedInspection:
      'Heavy serge weave consistent with dockside workwear or a winter overcoat, caught roughly at shoulder height.'
  },
  scraped_market_ledger: {
    name: 'Scraped Fishmonger Delivery Ledger',
    category: 'document',
    shortSummary: 'A cash-paid cargo line with the recipient’s name scratched off.',
    detailedInspection:
      'A sharp penknife scraped away the ink in the "Received By" column, leaving raised paper fibers next to a 19:40 dockside delivery stamp.'
  },
  red_primer_smear: {
    name: 'Fresh Marine Primer & Heel Mark',
    category: 'physical',
    shortSummary: 'Wet red hull paint smudged across a dry-dock scaffolding plank.',
    detailedInspection:
      'Someone stepped through an open tin of rust-primer and climbed the side ladder hurriedly, leaving diminishing red ridges.'
  },
  replaced_cargo_seal: {
    name: 'Cut Customs Lead Seal',
    category: 'physical',
    shortSummary: 'A shipping crate re-tied with ordinary parcel twine.',
    detailedInspection:
      'The official port authority lead wire lies clipped beneath the pallet, replaced hastily with brown butcher’s twine.'
  },
  removed_union_ledger_page: {
    name: 'Razor-Cut Ledger Binding',
    category: 'document',
    shortSummary: 'A clean knife incision along page 44 of the dues book.',
    detailedInspection:
      'Page 44—covering October dues and dock shift assignments—was sliced out cleanly with a sharp pocket blade.'
  },
  fire_escape_button: {
    name: 'Chipped Horn Overcoat Button',
    category: 'physical',
    shortSummary: 'A cracked dark horn button dropped on the third-floor landing.',
    detailedInspection:
      'Dust on the iron treads is swept clear along the outer rail, indicating a rapid descent toward the courtyard pump.'
  },
  misfiled_property_deed: {
    name: 'Tacky-Spined Municipal Deed',
    category: 'document',
    shortSummary: 'A waterfront parcel deed glued hastily into an uptown binder.',
    detailedInspection:
      'The binder paste is still slightly tacky to the touch, and the transfer signature bears yesterday’s date without a clerk counter-stamp.'
  },
  missing_broadcast_tape: {
    name: 'Empty Master Reel Tin',
    category: 'physical',
    shortSummary: 'A labeled studio transcription tin emptied of its acetate disc.',
    detailedInspection:
      'The grease-pencil label reads "21:00 SPECIAL BULLETIN — HOLD FOR SPONSOR", yet only the paper spacer remains inside.'
  },
  sunday_offering_ledger: {
    name: 'Baptist Vestry Offering Ledger',
    category: 'document',
    shortSummary: 'An open collection book noting an anonymous large-bill contribution.',
    detailedInspection:
      'Beside Tuesday evening’s stewardship column, a crisp twenty-dollar entry bears the pencil note: "Left by hurried visitor before closing bell."'
  },
  flour_delivery_receipt: {
    name: 'Golden Crust Wholesale Invoice',
    category: 'document',
    shortSummary: 'A morning flour invoice signed at the bakery side door.',
    detailedInspection:
      'Timed at 06:15 AM by the baker; a penciled margin note reminds the clerk not to open the alley latch after dusk.'
  },
  stained_counter_check: {
    name: 'Coffee-Ringed Diner Check #814',
    category: 'document',
    shortSummary: 'A greasy railcar counter slip stamped past midnight.',
    detailedInspection:
      'Two black coffees and pie rung up at 22:10, with a cab driver’s fare tally scribbled on the reverse.'
  },
  reserved_table_chit: {
    name: 'Crossed-Out Chop House Reservation',
    category: 'document',
    shortSummary: 'A linen-table reservation card canceled cleanly in red wax.',
    detailedInspection:
      'Booked for Table 6 at 20:30, but crossed through with the note: "Party never arrived; telephone message at nine."'
  },
  butcher_paper_note: {
    name: 'Twine-Wrapped Delicatessen Note',
    category: 'document',
    shortSummary: 'An errand reminder scribbled on brown butcher wrapping.',
    detailedInspection:
      'Notes a household cold-cut order alongside a warning to check Continental Trust before the afternoon bell.'
  },
  backstage_call_sheet: {
    name: 'Crimson Garter Stage Call Sheet',
    category: 'document',
    shortSummary: 'A dressing-room curtain roster showing an early departure.',
    detailedInspection:
      'Someone struck a thick pencil line through the 21:30 encore slot with the remark: "Stepped out via Theatre Row alley."'
  },
  chalkboard_tab_slate: {
    name: 'Damp-Wiped Taproom Tab Slate',
    category: 'physical',
    shortSummary: 'A slate credit board freshly smeared across one patron’s balance.',
    detailedInspection:
      'Faint chalk numerals beneath the damp rag smear show a hefty unpaid bar debt owed since Friday night.'
  },
  poison_register_page: {
    name: 'Apothecary Toxic Compound Ledger',
    category: 'forensic',
    shortSummary: 'A state poison log with a blurred violet ink signature.',
    detailedInspection:
      'Records the legal sale of white arsenic trioxide earlier this week; the buyer’s street address was smudged while wet.'
  },
  chalked_suit_tag: {
    name: 'Bespoke Tailor’s Cuff Repair Tag',
    category: 'physical',
    shortSummary: 'A manila fitting tag pinned to a dark wool overcoat sleeve.',
    detailedInspection:
      'Marked "Priority weave repair — fresh snag near pocket seam", with tailor’s chalk circling a frayed thread.'
  },
  ribbon_order_card: {
    name: 'Torn Florist Delivery Card',
    category: 'document',
    shortSummary: 'Half of a white enclosure card clipped to black mourning ribbon.',
    detailedInspection:
      'Written in firm vertical script: "For settled accounts — deliver no later than noon."'
  },
  pawn_ticket_stub: {
    name: 'Pink Pledge Ticket #1904',
    category: 'document',
    shortSummary: 'A pawnshop stub noting an undervalued silver timepiece.',
    detailedInspection:
      'Issued late yesterday afternoon; the clerk noted the pledger seemed anxious for immediate unmarked cash.'
  },
  straight_razor_strop: {
    name: 'Freshly Stropped Tonsorial Blade',
    category: 'physical',
    shortSummary: 'An unsterilized steel straight razor lying beside Chair Two.',
    detailedInspection:
      'While the master barber’s kit is immaculate, this spare blade carries damp soap residue outside its case.'
  },
  vault_entry_slip: {
    name: 'Bank Safe-Deposit Access Slip',
    category: 'document',
    shortSummary: 'A vault log ticket timed minutes before 16:30 closing.',
    detailedInspection:
      'Box #219 was opened swiftly by a single keyholder right before the brass teller grille dropped for the afternoon.'
  },
  torn_matinee_stub: {
    name: 'Balcony Ticket Stub #312',
    category: 'document',
    shortSummary: 'A purple theater ticket torn prematurely before feature end.',
    detailedInspection:
      'Grease-pencil scribble across the back reads: "Meet near cab stand after newsreel."'
  },
  precinct_blotter_copy: {
    name: 'Anonymous Precinct Desk Blotter',
    category: 'document',
    shortSummary: 'A watch-desk log entry lacking a verifying officer badge.',
    detailedInspection:
      'Records an urgent midnight tip directing patrol cars away from Midtown toward the harbor slips.'
  },
  library_borrower_card: {
    name: 'Carnegie Reference Borrower Card',
    category: 'document',
    shortSummary: 'A circulation slip pulled from a city harbor atlas.',
    detailedInspection:
      'Shows an afternoon consultation of 1934 sewer and dockside utility blueprints.'
  },
  undelivered_telegram: {
    name: 'Held Western Union Envelope',
    category: 'document',
    shortSummary: 'An urgent wire stamped "HOLD FOR CALLER" after 19:30.',
    detailedInspection:
      'Sealed wax edges remain intact; the origin office stamps point to an out-of-state estate solicitor.'
  },
  baggage_claim_tag: {
    name: 'Yellow Bayside Baggage Check',
    category: 'physical',
    shortSummary: 'A torn luggage claim tag dropped by the Greyhound lockers.',
    detailedInspection:
      'Issued for the 22:30 express coach; the matching leather valise remains unclaimed in Locker 9.'
  },
  grease_stained_trip_log: {
    name: 'Yellow Cab Central Fare Clipboard',
    category: 'forensic',
    shortSummary: 'Master garage dispatch sheet cross-referencing evening hack numbers.',
    detailedInspection:
      'Confirms Cab #4402 operated the Midtown-to-Theatre Row circuit between 20:30 and 22:00 without radio breakdown.'
  },
  slag_hammer_rack: {
    name: 'Empty Marine Foundry Tool Peg',
    category: 'physical',
    shortSummary: 'A soot-outlined hook missing a forged iron wrench.',
    detailedInspection:
      'Grease tracks lead toward the side loading bay facing Morrow Street.'
  },
  dyed_bobbin_sample: {
    name: 'Midnight-Blue Worsted Yarn Bobbin',
    category: 'physical',
    shortSummary: 'A mill dye-lot sample matching tailored winter overcoats.',
    detailedInspection:
      'Batch card #47-B supplies Savile & Finch exclusively for heavy evening outerwear.'
  },
  pruning_shed_key: {
    name: 'Conservatory Tool Shed Key',
    category: 'physical',
    shortSummary: 'A damp brass key hanging beside cut garden twine.',
    detailedInspection:
      'Muddy heel impressions trail from the glasshouse side door toward Cathedral Heights.'
  },
  sexton_burial_map: {
    name: 'Memorial Cemetery Plot Map',
    category: 'document',
    shortSummary: 'A groundskeeper chart circled sharply in black grease pencil.',
    detailedInspection:
      'Marks an older family mausoleum near the iron north gate visited just before dusk.'
  },
  reagent_inventory_card: {
    name: 'University Chemistry Stock Card',
    category: 'forensic',
    shortSummary: 'A locked-cabinet tally flagging missing potassium salts.',
    detailedInspection:
      'Two grams of laboratory-grade reagent are unaccounted for since Tuesday evening’s seminar.'
  },
  subpoena_docket_copy: {
    name: 'Criminal Courthouse Grand Jury Slip',
    category: 'document',
    shortSummary: 'A torn docket slip listing this morning’s ten o’clock testimony.',
    detailedInspection:
      'Stamped by Courtroom Two’s bailiff; someone ripped off the witness signature block.'
  },
  dressing_room_telegram: {
    name: 'Crumpled Lyric Opera Telegram',
    category: 'document',
    shortSummary: 'A floral dressing-table wire torn in anger.',
    detailedInspection:
      'Reads in part: "DO NOT SPEAK TO INSPECTORS BEFORE INTERMISSION — TERMS FINAL."'
  },
  seized_manifest_carbon: {
    name: 'Customs Contraband Weight Carbon',
    category: 'document',
    shortSummary: 'A federal weigh-scale slip showing mismatched crate tonnage.',
    detailedInspection:
      'Two crates cleared at Pier 4 registered forty pounds lighter on the Customs House scale.'
  },
  deckhand_watch_log: {
    name: 'North Slip Ferry Turnstile Tally',
    category: 'document',
    shortSummary: 'A damp pierhead log noting a lone late-fog passenger.',
    detailedInspection:
      'Ticketmaster marked a single cash fare boarding the 21:40 ferry carrying a wrapped parcel.'
  },
  chalked_break_ledger: {
    name: 'Eight-Ball Parlor Wager Slip',
    category: 'document',
    shortSummary: 'A folded IOU tucked underneath a blue chalk cube.',
    detailedInspection:
      'Records an unpaid five-hundred-dollar side bet initialed at 20:15.'
  },
  collared_shirt_claim: {
    name: 'Pearl Laundry Overnight Rush Tag',
    category: 'physical',
    shortSummary: 'A red rush-order ticket pinned to a starched white collar.',
    detailedInspection:
      'Marked "REMOVE DARK STAIN FROM CUFF — PICKUP 09:30 AM."'
  },
  ex_libris_bookplate: {
    name: 'Penciled Rare Estate Bookplate',
    category: 'document',
    shortSummary: 'An unglued collector bookplate tucked inside an auction folio.',
    detailedInspection:
      'Shows an estate appraisal date from last week alongside handwritten provenance notes.'
  }
};

/**
 * Authored forensic & provenance clue definitions covering ALL 28 weapons in MASTER_WEAPONS.
 */
export const WEAPON_CLUES: Record<
  string,
  { forensicNote: string; transferSlipTitle: string; stockistSummary: string }
> = {
  brass_candlestick: {
    forensicNote: 'Heavy cast-brass altar candlestick bearing octagonal base bruising and tarnished wax smears.',
    transferSlipTitle: 'Vestry & Curio Brassware Sign-Out Chit',
    stockistSummary: 'Vestry brass inventory notes a six-pound octagonal candlestick missing from its shelf.'
  },
  brandy_poison: {
    forensicNote: 'Engraved silver cognac flask retaining faint bitter-almond cyanide residue along the stopper.',
    transferSlipTitle: 'Apothecary & Bar Spirit Decanter Slip',
    stockistSummary: 'Stock log flags an unusual evening requisition of medicinal spirits and glass vials.'
  },
  snub_revolver: {
    forensicNote: 'Walnut-gripped .38 Colt Detective Special with fresh powder fouling inside two chambers.',
    transferSlipTitle: 'Armory & Locker .38 Issue Chit',
    stockistSummary: 'Locker log records a snub-nose .38 revolver checked out prior to the 21:00 shift.'
  },
  bone_dagger: {
    forensicNote: 'Scrimshaw narwhal-handled stiletto blade wiped hurriedly with damp dockside canvas.',
    transferSlipTitle: 'Curio & Maritime Blade Appraisal Slip',
    stockistSummary: 'Inventory card shows an antique carved bone bodkin pulled from display.'
  },
  morphine_overdose: {
    forensicNote: 'Clinical glass syringe barrel smeared with concentrated morphine tartrate residue.',
    transferSlipTitle: 'Narcotics Cabinet Dispensing Receipt',
    stockistSummary: 'Dispensary tally notes an unaccounted-for vial of concentrated morphine.'
  },
  silk_garrote: {
    forensicNote: 'Weighted piano-wire cord sheathed in black opera silk bearing faint skin abrasions.',
    transferSlipTitle: 'Backstage & Tailory Wire-Cord Requisition',
    stockistSummary: 'Stage maintenance sheet notes braided steel cord clipped from a reel earlier.'
  },
  bar_ice_pick: {
    forensicNote: 'Tempered-steel bar ice pick with a turned hardwood grip wiped clean near the ferrule.',
    transferSlipTitle: 'Service Bar Utensil Stock Slip',
    stockistSummary: 'Barback checklist notes one tempered ice pick missing from the service well.'
  },
  brass_lamp: {
    forensicNote: 'Weighted Art Deco brass table lamp with a bent shade harp and cracked enamel.',
    transferSlipTitle: 'Hotel Furnishings Lamp Repair Ticket',
    stockistSummary: 'Maintenance slip logs a brass desk lamp removed from its parlor table.'
  },
  dock_hook: {
    forensicNote: 'Rusted iron longshoreman baling hook dusted with dry salt-tar and damp wool.',
    transferSlipTitle: 'Wharf Gear Shed Hook Check-Out',
    stockistSummary: 'Pier tool peg records an iron cargo hook signed out before night tide.'
  },
  letter_opener: {
    forensicNote: 'Double-edged Sheffield steel desk stiletto with faint dark smudges near the hilt guard.',
    transferSlipTitle: 'Executive Stationery Supply Chit',
    stockistSummary: 'Clerk supply ticket notes a steel desk stiletto absent from its blotter tray.'
  },
  heavy_typewriter: {
    forensicNote: 'Thirty-pound black Underwood cast-iron typewriter bearing chipped frame enamel.',
    transferSlipTitle: 'Press Room Typewriter Loan Tag',
    stockistSummary: 'Newsroom property tag shows a spare cast-iron Underwood carried down the hall.'
  },
  heavy_pipe: {
    forensicNote: 'Eighteen-inch threaded steam pipe wrapped in black friction tape stained with machine grease.',
    transferSlipTitle: 'Maintenance Pipe Rack Withdrawal Slip',
    stockistSummary: 'Boiler room tally notes an eighteen-inch galvanized pipe section missing.'
  },
  utility_knife: {
    forensicNote: 'Brass-bolstered porter’s folding clasp knife with frayed twine fibers in the hinge.',
    transferSlipTitle: 'Baggage Porter Tool Issue Card',
    stockistSummary: 'Supply crib notes a heavy clasp knife checked out at dusk.'
  },
  bar_bottle: {
    forensicNote: 'Heavy green-glass champagne magnum fractured near the punt with dried foil residue.',
    transferSlipTitle: 'Cellar Stockroom Vintage Issue Chit',
    stockistSummary: 'Steward chit logs a reserve green magnum taken from the cellar crate.'
  },
  kitchen_cleaver: {
    forensicNote: 'Broad high-carbon butcher’s cleaver rinsed unevenly under cold water.',
    transferSlipTitle: 'Galley & Butcher Block Tool Log',
    stockistSummary: 'Kitchen block inventory marks one steel cleaver missing after dinner prep.'
  },
  training_dumbbell: {
    forensicNote: 'Twelve-pound cast-iron gym dumbbell dusted with white magnesium grip chalk.',
    transferSlipTitle: 'Gymnasium Equipment Rack Check',
    stockistSummary: 'Trainer tally notes a single twelve-pound iron dumbbell missing from Rack 2.'
  },
  jump_rope: {
    forensicNote: 'Weighted rawhide boxer’s speed rope with ball-bearing wooden handles twisted under strain.',
    transferSlipTitle: 'Sparring Locker Gear Sign-Out',
    stockistSummary: 'Gym locker register notes a rawhide speed rope taken from the corner peg.'
  },
  iron_crowbar: {
    forensicNote: 'Hexagonal forged steel pry bar carrying rust flakes and splintered timber dust.',
    transferSlipTitle: 'Loading Bay Tool Crib Slip',
    stockistSummary: 'Night watch sheet notes a forged pry bar removed from the loading-bay rack.'
  },
  surgical_scalpel: {
    forensicNote: 'Stainless #10 surgical scalpel tucked inside folded gauze with antiseptic odor.',
    transferSlipTitle: 'Autoclave Tray Instrument Audit',
    stockistSummary: 'Clinic tray count shows one #10 stainless blade unaccounted for.'
  },
  bone_saw: {
    forensicNote: 'Chromed pathology bone saw showing microscopic tissue residue along its fine teeth.',
    transferSlipTitle: 'Morgue Instrument Cabinet Sign-Out',
    stockistSummary: 'Autopsy cabinet audit flags a missing pathology saw removed before evening shift.'
  },
  fillet_knife: {
    forensicNote: 'Flexible seven-inch dockside fillet knife carrying coarse marine salt crystals.',
    transferSlipTitle: 'Quay Stall Knife Block Tally',
    stockistSummary: 'Fishmonger rack sheet notes a seven-inch ash-handled fillet blade missing.'
  },
  wrench: {
    forensicNote: 'Heavy eighteen-inch Stillson monkey wrench smudged with red marine hull primer.',
    transferSlipTitle: 'Foundry & Dock Pipefitter Tool Tag',
    stockistSummary: 'Yard tool crib logs an eighteen-inch pipe wrench signed out at dusk.'
  },
  fire_poker: {
    forensicNote: 'Twisted wrought-iron hearth poker topped with a brass finial and soot smudges.',
    transferSlipTitle: 'Parlor Hearth Equipment Inventory',
    stockistSummary: 'Caretaker list marks an iron fireplace poker missing from the lounge grate.'
  },
  heavy_desk_ornament: {
    forensicNote: 'Five-pound bronze Harbor Dedication eagle paperweight with green verdigris scuffs.',
    transferSlipTitle: 'Civic Office Inventory Transfer Card',
    stockistSummary: 'Registrar ledger notes a heavy bronze desk ornament moved from Room 2B.'
  },
  electrical_cable: {
    forensicNote: 'Rubber-sheathed broadcast microphone cable stripped abruptly of its brass plug.',
    transferSlipTitle: 'Studio Engineering Cable Log',
    stockistSummary: 'Control room rack shows one heavy microphone trunk line clipped short.'
  },
  arsenic_tonic: {
    forensicNote: 'Amber patent-medicine bottle containing cloudy white arsenic trioxide sediment.',
    transferSlipTitle: 'Apothecary Compound & Poison Log',
    stockistSummary: 'Poison register notes an irregular compounding of white arsenic earlier this week.'
  },
  pocket_derringer: {
    forensicNote: 'Two-shot pearl-grip .32 Remington derringer smelling sharply of burnt smokeless powder.',
    transferSlipTitle: 'Private Valuables & Pistol Check Stub',
    stockistSummary: 'Coat-check tag notes a small .32 pocket piece claimed before 21:00.'
  },
  service_automatic: {
    forensicNote: 'Matte-blued .45 Colt M1911 service automatic with one spent brass casing nearby.',
    transferSlipTitle: 'Precinct & Union Locker .45 Issue Log',
    stockistSummary: 'Armory log tracks a .45 Colt automatic removed from lockbox before dusk.'
  },
  hammer: {
    forensicNote: 'Forged steel ball-peen shipyard hammer carrying hull-scale dust along the striking face.',
    transferSlipTitle: 'Dry Dock & Foundry Machinist Tool Tag',
    stockistSummary: 'Yard tool crib notes a forged ball-peen hammer signed out before night shift.'
  },
  kitchen_knife: {
    forensicNote: 'Eight-inch high-carbon chef’s blade with riveted rosewood grip wiped hurriedly dry.',
    transferSlipTitle: 'Kitchen & Prep Block Cutlery Log',
    stockistSummary: 'Kitchen prep board notes an eight-inch carbon steel knife missing from the rack.'
  }
};

export function getLocationWeaponSpotSpec(
  loc: LocationTemplate,
  weapon: { id: string; name: string; category: string }
): { label: string; description: string } {
  const spotsByWeaponId: Record<string, { label: string; description: string }> = {
    brass_candlestick: {
      label: `Side Stand & Candelabra Rail`,
      description: `An ornate cast-brass pedestal stand inside ${loc.name} where heavy altar candlesticks are kept within arm’s reach.`
    },
    brandy_poison: {
      label: `Private Spirits Tray & Flask Shelf`,
      description: `A locked mahogany cabinet and cocktail decanter shelf inside ${loc.name}.`
    },
    snub_revolver: {
      label: `Cashier’s Lockbox & Security Holster`,
      description: `A steel under-counter lockbox kept behind the main desk of ${loc.name}.`
    },
    bone_dagger: {
      label: `Curio Crate & Oilskin Tool Roll`,
      description: `A canvas-lined side rack at ${loc.name} storing maritime scrimshaw and bodkin blades.`
    },
    morphine_overdose: {
      label: `Sealed Glass Apothecary Tray`,
      description: `A clinical tray of glass syringes and narcotics vials inside ${loc.name}.`
    },
    silk_garrote: {
      label: `Backstage Cord & Haberdashery Reel`,
      description: `A utility drawer beside spare cordage, piano wire, and heavy silk trimmings at ${loc.name}.`
    },
    bar_ice_pick: {
      label: `Service Well & Crushed-Ice Chest`,
      description: `A zinc-lined ice chest and steel bar-pick holder behind the service rail at ${loc.name}.`
    },
    brass_lamp: {
      label: `Parlor Console Table & Cord Outlet`,
      description: `A polished side table inside ${loc.name} weighted with heavy brass fixtures.`
    },
    dock_hook: {
      label: `Baling Gear Rack & Wharf Pegboard`,
      description: `An oilskin gear peg inside ${loc.name} hung with iron cargo hooks and tarred hemp.`
    },
    letter_opener: {
      label: `Executive Desk Blotter & Mail Tray`,
      description: `A leather-cornered desk blotter beside stacked correspondence at ${loc.name}.`
    },
    heavy_typewriter: {
      label: `Copy Desk Carriage & Ink Stand`,
      description: `A heavy steel clerical workstand supporting spare typing machinery at ${loc.name}.`
    },
    heavy_pipe: {
      label: `Boiler Conduit & Maintenance Niche`,
      description: `A shadowy utility corner near exposed steam plumbing inside ${loc.name}.`
    },
    utility_knife: {
      label: `Stockroom Twine & Clasp-Knife Bench`,
      description: `A packing bench littered with twine, canvas strapping, and utility blades at ${loc.name}.`
    },
    bar_bottle: {
      label: `Reserve Bottle Rack & Ice Bucket`,
      description: `A dim cellar crate and bottle-service niche beside the floor tables at ${loc.name}.`
    },
    kitchen_cleaver: {
      label: `Butcher’s Chopping Block`,
      description: `A scarred end-grain wood block inside ${loc.name} fitted with slotted blade rests.`
    },
    kitchen_knife: {
      label: `Kitchen Prep Counter & Knife Rack`,
      description: `A worn kitchen prep counter holding culinary blades and whetstones at ${loc.name}.`
    },
    training_dumbbell: {
      label: `Chalk-Dusted Iron Weight Rack`,
      description: `A bolted steel gym rack lined with cast-iron free weights inside ${loc.name}.`
    },
    jump_rope: {
      label: `Trainer’s Conditioning Corner`,
      description: `A row of brass wall hooks draped with leather jump ropes and hand wraps at ${loc.name}.`
    },
    iron_crowbar: {
      label: `Freight-Door Pry Bar Rack`,
      description: `A metal bracket beside the loading door where heavy pry bars sit ready at ${loc.name}.`
    },
    surgical_scalpel: {
      label: `Nickel Instrument & Razor Tray`,
      description: `An enamel sterilization tray of surgical steel instruments inside ${loc.name}.`
    },
    bone_saw: {
      label: `Pathology Steel Instrument Case`,
      description: `A tiled morgue cabinet housing heavy chromed dissection tools at ${loc.name}.`
    },
    fillet_knife: {
      label: `Brine Washstand & Fillet Board`,
      description: `A salt-stained timber prep table lined with fishmonger knives at ${loc.name}.`
    },
    wrench: {
      label: `Pipefitter’s Tool Chest`,
      description: `A grease-darkened iron chest holding heavy shipyard wrenches inside ${loc.name}.`
    },
    hammer: {
      label: `Machinist’s Anvil & Hammer Rack`,
      description: `A heavy timber workbench mounted with forged hammers and chisels at ${loc.name}.`
    },
    fire_poker: {
      label: `Hearth Grate & Brass Fire-Iron Stand`,
      description: `A sooty brick fireplace hearth beside heavy iron pokers and tongs at ${loc.name}.`
    },
    heavy_desk_ornament: {
      label: `Civic Desk Bronze Crest Display`,
      description: `An oak office counter weighted with heavy bronze civic memorabilia inside ${loc.name}.`
    },
    electrical_cable: {
      label: `Booth Wiring & Power Cable Reel`,
      description: `A coiled bundle of thick rubber-sheathed trunk cables tucked behind equipment at ${loc.name}.`
    },
    arsenic_tonic: {
      label: `Apothecary Glass Reagent Shelf`,
      description: `A shadowy glass shelf stocked with brown-bottled tonics and mineral salts at ${loc.name}.`
    },
    pocket_derringer: {
      label: `Velvet Cloakroom Valuables Drawer`,
      description: `A felt-lined attendant’s drawer holding unclaimed pocket valuables at ${loc.name}.`
    },
    service_automatic: {
      label: `Duty Locker & Sidearm Safe`,
      description: `A keyed steel locker storing regulation .45 equipment inside ${loc.name}.`
    }
  };

  return (
    spotsByWeaponId[weapon.id] || {
      label: `${loc.name} Equipment & Supply Bench`,
      description: `Checked equipment fixture inside ${loc.name} where a ${weapon.name.toLowerCase()} belongs.`
    }
  );
}

/**
 * Authored clue hooks covering ALL 24 clueHooks across ALL 12 motives in MASTER_MOTIVES.
 */
export const MOTIVE_HOOK_CLUES: Record<
  string,
  { motiveId: string; name: string; category: ClueInstance['category']; shortSummary: string; detailTemplate: string }
> = {
  codicil_carbon: {
    motiveId: 'inheritance_greed',
    name: 'Torn Testament Codicil Carbon',
    category: 'document',
    shortSummary: 'A lawyer’s carbon copy cutting a beneficiary entirely out of an estate will.',
    detailTemplate: 'Typed legal carbon among {victimName}’s papers revoking all bequests linked to {culpritName}. {motiveDesc}'
  },
  probate_appointment: {
    motiveId: 'inheritance_greed',
    name: 'Surrogate Court Probate Appointment Slip',
    category: 'document',
    shortSummary: 'An urgent morning probate filing scheduled for 09:00 today.',
    detailTemplate: 'Confirmation slip showing {victimName} booked an emergency surrogate filing to disinherit {culpritName} at dawn.'
  },
  negative_strips: {
    motiveId: 'blackmail_exposure',
    name: 'Exposed 35mm Bond Ledger Negatives',
    category: 'forensic',
    shortSummary: 'Celluloid photo strips showing tampered municipal bearer-bond sheets.',
    detailTemplate: 'Developed contact strips recovered from {victimName}’s effects linking {culpritName} to vaulted bond shortages. {motiveDesc}'
  },
  deposit_key: {
    motiveId: 'blackmail_exposure',
    name: 'Brass Safe-Deposit Box Claim Tag',
    category: 'physical',
    shortSummary: 'A stamped Continental Trust key envelope demanding cash before midnight.',
    detailTemplate: 'Claim envelope listing Box #219 alongside handwritten extortion figures addressed to {culpritName}.'
  },
  federal_subpoena: {
    motiveId: 'gangland_silencing',
    name: 'Folded Federal Grand Jury Subpoena',
    category: 'document',
    shortSummary: 'A stamped federal summons compelling morning testimony on syndicate kickbacks.',
    detailTemplate: 'Official court writ naming {victimName} as star witness regarding protection payouts tied to {culpritName}. {motiveDesc}'
  },
  precinct_payoff: {
    motiveId: 'gangland_silencing',
    name: 'Numbered Syndicate Payoff Envelope',
    category: 'document',
    shortSummary: 'An unsealed cash wrapper annotated with weekly Midtown protection figures.',
    detailTemplate: 'Grease-penciled payoff sheet detailing kickback routes threatened by {victimName}’s imminent testimony against {culpritName}.'
  },
  attorney_demand: {
    motiveId: 'medical_malpractice',
    name: 'Counsel’s Malpractice Affidavit Packet',
    category: 'document',
    shortSummary: 'Sworn surgical negligence affidavits prepared for state medical board review.',
    detailTemplate: 'Formal legal demand held by {victimName} citing falsified clinical records and tincture tampering by {culpritName}. {motiveDesc}'
  },
  narcotics_audit: {
    motiveId: 'medical_malpractice',
    name: 'State Pharmacy Board Audit Notice',
    category: 'forensic',
    shortSummary: 'A red-flagged narcotics discrepancy audit scheduled for this morning.',
    detailTemplate: 'Audit carbon comparing dispensary stock against death certificates initialed by {culpritName}, obtained by {victimName}.'
  },
  perfumed_letters: {
    motiveId: 'romantic_betrayal',
    name: 'Ribbon-Tied Rendezvous Letters',
    category: 'document',
    shortSummary: 'Perfumed private correspondence threatening public scandal and ruin.',
    detailTemplate: 'Heated personal letters preserved by {victimName} containing explicit threats to expose {culpritName} in society columns. {motiveDesc}'
  },
  hotel_register: {
    motiveId: 'romantic_betrayal',
    name: 'Annotated Hotel Suite Folio',
    category: 'document',
    shortSummary: 'A suite bill scribbled with bitter accusations of betrayal.',
    detailTemplate: 'Private hotel invoice connecting {victimName} and {culpritName} to last week’s clandestine meetings and ultimatum.'
  },
  promissory_marker: {
    motiveId: 'unpaid_gambling_marker',
    name: 'Stamped Red-Ink Gambling Marker',
    category: 'document',
    shortSummary: 'A ten-thousand-dollar IOU stamped "FINAL NOTICE — DEFAULT".',
    detailTemplate: 'Signed cellar poker marker calling in crushing debts owed by {culpritName} to {victimName} at sunrise. {motiveDesc}'
  },
  club_iou: {
    motiveId: 'unpaid_gambling_marker',
    name: 'Cellar Club House Ledger Tear',
    category: 'document',
    shortSummary: 'A torn house credit sheet showing seized collateral notices.',
    detailTemplate: 'Tabulation sheet listing business assets of {culpritName} slated for seizure by {victimName}.'
  },
  altered_manifest: {
    motiveId: 'smuggled_cargo_double_cross',
    name: 'Water-Stained Contraband Bill of Lading',
    category: 'document',
    shortSummary: 'A harbor freight manifest overwritten in two distinct inks.',
    detailTemplate: 'Skimmed pier shipment manifest carried by {victimName} showing customs tip-offs that cost {culpritName} a fortune. {motiveDesc}'
  },
  warehouse_receipt: {
    motiveId: 'smuggled_cargo_double_cross',
    name: 'Harbor Bonded Crate Tally',
    category: 'document',
    shortSummary: 'A dockside customs inspection receipt bearing penciled accusations.',
    detailTemplate: 'Dock tally confirming {victimName} diverted bonded crates away from {culpritName} prior to customs seizure.'
  },
  reconciliation_sheet: {
    motiveId: 'embezzled_trust_audit',
    name: 'Dual-Entry Trust Reconciliation Sheet',
    category: 'document',
    shortSummary: 'An accountant’s audit tracing $40,000 into numbered accounts.',
    detailTemplate: 'Independent audit draft in {victimName}’s briefcase linking missing endowment funds directly to {culpritName}. {motiveDesc}'
  },
  bank_draft: {
    motiveId: 'embezzled_trust_audit',
    name: 'Traceable Wire Transfer Carbon',
    category: 'document',
    shortSummary: 'A bank wire receipt stamped for foreclosure review.',
    detailTemplate: 'Teller wire carbon confirming {culpritName} routed parish/union reserves before {victimName} froze the ledger.'
  },
  unsigned_pact: {
    motiveId: 'syndicate_turf_usurpation',
    name: 'Unsigned Theatre-Row Territory Pact',
    category: 'document',
    shortSummary: 'A handwritten street-map agreement carving up Midtown protection routes.',
    detailTemplate: 'Rival syndicate agreement drafted by {victimName} to freeze {culpritName} out of Downtown clubs. {motiveDesc}'
  },
  precinct_envelope: {
    motiveId: 'syndicate_turf_usurpation',
    name: 'Turned-Back Protection Route Memo',
    category: 'document',
    shortSummary: 'A crisp dispatch note reassigning midnight collection stops.',
    detailTemplate: 'Collection schedule instructing venue stewards to pay {victimName}’s backers instead of {culpritName}.'
  },
  tribunal_clipping: {
    motiveId: 'ruined_career_vendetta',
    name: 'Annotated 1938 Tribunal Clipping',
    category: 'document',
    shortSummary: 'A yellowed newspaper clipping scored with furious red ink.',
    detailTemplate: 'Archived 1938 hearing report framing {culpritName}, carried by {victimName} alongside an unsigned retraction refusal. {motiveDesc}'
  },
  retraction_draft: {
    motiveId: 'ruined_career_vendetta',
    name: 'Refused Sworn Retraction Draft',
    category: 'document',
    shortSummary: 'A legal exoneration letter marked "DECLINED" across the signature line.',
    detailTemplate: 'Notary draft dated yesterday showing {victimName} flatly refused to clear {culpritName}’s tarnished record.'
  },
  appraiser_wire: {
    motiveId: 'forged_provenance_fraud',
    name: 'Appraiser’s Counterfeit Hallmarks Telegram',
    category: 'forensic',
    shortSummary: 'A Western Union wire flagging laboratory-proven heirloom forgeries.',
    detailTemplate: 'Urgent curator telegram obtained by {victimName} exposing three counterfeit consignments sold by {culpritName}. {motiveDesc}'
  },
  auction_catalogue: {
    motiveId: 'forged_provenance_fraud',
    name: 'Marked Estate Auction Catalogue',
    category: 'document',
    shortSummary: 'A private auction booklet with suspicious lots circled in red ink.',
    detailTemplate: 'Annotated provenance booklet matching tampered hallmarks traced to {culpritName}.'
  },
  registry_extract: {
    motiveId: 'concealed_marriage_claim',
    name: 'Out-of-State Marriage Registry Extract',
    category: 'document',
    shortSummary: 'A certified county clerk extract hidden inside a solicitor’s sleeve.',
    detailTemplate: 'Unrecorded marriage certificate kept by {victimName} that nullified {culpritName}’s shipping-estate inheritance claim. {motiveDesc}'
  },
  estate_memo: {
    motiveId: 'concealed_marriage_claim',
    name: 'Shipping Estate Solicitor’s Memo',
    category: 'document',
    shortSummary: 'A private legal brief warning of an imminent estate invalidation.',
    detailTemplate: 'Solicitor memorandum advising {victimName} to file the concealed registry extract blocking {culpritName}’s claim.'
  }
};

/**
 * Resolves a discoverable clue hook for EVERY character in MASTER_CHARACTERS (all 110 characters).
 */
export function getCharacterClueHook(char: CharacterTemplate): {
  clueTitle: string;
  category: ClueInstance['category'];
  shortSummary: string;
  detailTemplate: string;
} {
  if (char.characterKind === 'staff') {
    return {
      clueTitle: `Shift Roster & Timecard — ${char.name}`,
      category: 'document',
      shortSummary: `Duty timecard logging ${char.name} (${char.title}) on shift.`,
      detailTemplate: `Signed floor timecard for ${char.name} (${char.title}, wearing ${char.avatarStyle.collar}). Notes continuous venue duty across operating hours.`
    };
  }
  if (char.characterKind === 'family_visitor') {
    const stopsText = char.routine.map((r) => `${r.locationId} (${r.timeWindow})`).join(', ');
    return {
      clueTitle: `${char.familyName || 'Household'} Errand Receipt — ${char.name}`,
      category: 'document',
      shortSummary: `Dated errand slip signed by ${char.name} (${char.title}).`,
      detailTemplate: `Household receipt bearing ${char.name}’s signature (${char.avatarStyle.collar}). Confirms brief routine errands across: ${stopsText}.`
    };
  }
  return {
    clueTitle: `Private Desk & Correspondence Memo — ${char.name}`,
    category: 'document',
    shortSummary: `Timestamped entry citing ${char.name} (${char.title}).`,
    detailTemplate: `Signed counter ledger and coat-check note referencing ${char.name} (${char.title}, clad in ${char.avatarStyle.collar}). ${char.publicPersona}`
  };
}

export interface DynamicVictimTieSpec {
  relationshipKind: string;
  tieSummary: string;
  motiveDetailBridge: string;
  victimTopicPrompt: string;
  victimTopicResponse: string;
}

/**
 * Dynamically synthesizes a grounded 1940s noir connection between ANY paired victim and culprit
 * based on their professions, workplaces, districts, pre-existing links (if any), and case motive.
 */
export function buildDynamicVictimTie(
  rng: SeededRNG,
  victim: CharacterTemplate,
  culprit: CharacterTemplate,
  motive: MotiveTemplate,
  allLocations: LocationTemplate[],
  crimeLoc: LocationTemplate
): DynamicVictimTieSpec {
  const locById = Object.fromEntries(allLocations.map((l) => [l.id, l]));
  const victimLoc = victim.assignedLocationId ? locById[victim.assignedLocationId] : undefined;
  const culpritLoc = culprit.assignedLocationId ? locById[culprit.assignedLocationId] : undefined;
  const sameWorkplace = Boolean(victimLoc && culpritLoc && victimLoc.id === culpritLoc.id);
  const sameFamily = Boolean(
    victim.familyName && culprit.familyName && victim.familyName === culprit.familyName
  );
  const directRel =
    victim.relationships.find((r) => r.characterId === culprit.id)?.relationshipType ||
    culprit.relationships.find((r) => r.characterId === victim.id)?.relationshipType;

  let relationshipKind = directRel || 'entangled acquaintance';
  let tieContext = '';

  if (sameWorkplace && victimLoc) {
    relationshipKind = 'fellow staff insider';
    tieContext = `working the same premises at ${victimLoc.name} (${victimLoc.district})`;
  } else if (sameFamily) {
    relationshipKind = 'estranged family relation';
    tieContext = `bound by tangled ${victim.familyName} household affairs`;
  } else if (directRel === 'creditor') {
    tieContext = `holding private financial obligations behind closed doors`;
  } else if (directRel === 'blackmailer') {
    tieContext = `trading quiet pressure over closely guarded secrets`;
  } else if (directRel === 'accomplice') {
    tieContext = `splitting off-book favors after dark`;
  } else if (culpritLoc && victimLoc) {
    relationshipKind = rng.pick(['cross-town trade contact', 'after-hours go-between', 'discreet debtor']);
    tieContext = `crossing paths between ${culpritLoc.name} and ${victimLoc.name}`;
  } else if (culpritLoc || victimLoc) {
    const anchorLoc = culpritLoc || victimLoc!;
    relationshipKind = rng.pick(['off-hours client', 'back-room acquaintance', 'silent partner']);
    tieContext = `dealing quietly through ${anchorLoc.name} (${anchorLoc.district})`;
  } else {
    relationshipKind = rng.pick(['private confidant', 'card-room rival', 'discreet broker']);
    tieContext = `crossing paths around ${crimeLoc.district} after hours`;
  }

  const motiveBridgeByCategory: Record<MotiveTemplate['category'], string> = {
    Inheritance: `${victim.name} (${victim.title}) and ${culprit.name} (${culprit.title}), ${tieContext}, became locked in an urgent legal confrontation over ${motive.name.toLowerCase()}.`,
    Blackmail: `Despite only appearing as a ${relationshipKind} (${tieContext}), ${victim.name} had compiled compromising proof against ${culprit.name} (${culprit.title}) tied to ${motive.name.toLowerCase()}.`,
    'Mob Silencing': `Though known on paper merely through ${tieContext}, ${victim.name} threatened to name ${culprit.name} (${culprit.title}) before federal investigators regarding ${motive.name.toLowerCase()}.`,
    Debt: `Beneath everyday dealings (${tieContext}), ${culprit.name} (${culprit.title}) stood deeply in arrears to ${victim.name} under ${motive.name.toLowerCase()}.`,
    Jealousy: `Private correspondence confirms ${culprit.name} (${culprit.title}) and ${victim.name} (${tieContext}) clashed bitterly over ${motive.name.toLowerCase()}.`,
    Revenge: `Beneath polite appearances (${tieContext}), ${culprit.name} (${culprit.title}) nursed a fierce grievance against ${victim.name} rooted in ${motive.name.toLowerCase()}.`
  };

  const sharedPlaceClause =
    sameWorkplace && victimLoc
      ? `We worked the same roof at ${victimLoc.name}`
      : sameFamily
        ? `Blood or not, ${victim.name} and I shared the ${victim.familyName} name—and plenty of friction`
        : culpritLoc && victimLoc
          ? `${victim.name} over at ${victimLoc.name} and my post at ${culpritLoc.name} crossed paths now and then`
          : `Our paths crossed around ${crimeLoc.district} on side business`;

  const responseByVoice: Record<CharacterVoice, string> = {
    posh: `My good detective, ${sharedPlaceClause}, nothing deeper. Frankly, ${victim.name} had a talent for making enemies in delicate affairs—hardly reason to trouble me.`,
    gruff: `Listen pal, ${sharedPlaceClause}. ${victim.name} pushed folks too hard and talked out of turn—lots of people had beef there, and none of it puts blood on my cuffs.`,
    cynical: `Save your ink, detective. ${sharedPlaceClause}, sure, and ${victim.name} kept plenty of people on edge around New Bay. Half this district had a grudge—doesn't mean I swung anything last night.`,
    nervous: `Oh, well—strictly passing acquaintance, I assure you! ${sharedPlaceClause}. ${victim.name} could be terribly sharp-tongued lately, yes, but I keep out of trouble.`,
    defensive: `Speak of the dead carefully, detective. ${sharedPlaceClause}, and yes we exchanged sharp words on occasion—but ordinary friction isn't a hanging crime.`
  };

  const promptByContext = sameWorkplace && victimLoc
    ? `You and ${victim.name} both worked at ${victimLoc.name}—how did the two of you get along?`
    : sameFamily
      ? `How were things really going between you and ${victim.name} within the ${victim.familyName} family?`
      : `What was your real business with ${victim.name}?`;

  return {
    relationshipKind,
    tieSummary: `${culprit.name} (${culprit.title}) & ${victim.name} (${victim.title}) — ${relationshipKind}, ${tieContext}`,
    motiveDetailBridge: motiveBridgeByCategory[motive.category],
    victimTopicPrompt: promptByContext,
    victimTopicResponse: responseByVoice[culprit.voice]
  };
}

/**
 * Resolves a location-lead clue description for EVERY location in MASTER_LOCATIONS (all 54 locations).
 * Supports seeded multi-variant room-matched lead items so leads aren't always matchbooks or calling cards.
 */
export function getLocationLeadHook(
  loc: LocationTemplate,
  rng?: SeededRNG,
  contextTag?: 'culprit_hangout' | 'weapon_source' | 'corroborator_meet' | 'bonus'
): {
  clueName: string;
  shortSummary: string;
  detailedInspection: string;
  poiHint: string;
} {
  const hours = loc.openingHours ? `${loc.openingHours.open}–${loc.openingHours.close}` : '24 Hours';
  const tags = loc.locationTags || [];
  const apptTime = rng ? rng.pick(['20:15', '20:25', '20:30', '20:40', '20:50']) : '20:30';
  const serial = rng ? rng.int(114, 986) : 412;

  interface LeadVariant {
    clueName: string;
    shortSummary: string;
    detailedInspection: string;
    poiHint: string;
  }

  const variants: LeadVariant[] = [];

  if (tags.some((t) => ['nightclub', 'speakeasy', 'cabaret', 'tavern', 'hotel', 'restaurant', 'diner', 'theater'].includes(t))) {
    variants.push(
      {
        clueName: `Stamped House Matchbook — ${loc.name}`,
        shortSummary: `Half-used cardboard matchbook bearing the crest of ${loc.name} (${loc.district}).`,
        detailedInspection: `Stamped with the ${loc.district} street address for ${loc.name} (Hours: ${hours}). Penciled inside the cover: "Around ${apptTime} — ask at the back booth."`,
        poiHint: `A half-used matchbook from ${loc.name} sits tucked along the edge.`
      },
      {
        clueName: `Duplicate Cloakroom Tag #${serial} — ${loc.name}`,
        shortSummary: `Numbered hat-check stub stamped by ${loc.name} in ${loc.district}.`,
        detailedInspection: `Heavy card check #${serial} issued at ${loc.name} (${hours}), bearing a pencil note: "Meet near the side door around ${apptTime}."`,
        poiHint: `A numbered cloakroom stub from ${loc.name} lies slipped beside the tray.`
      },
      {
        clueName: `Cork Coaster & Tab Stub — ${loc.name}`,
        shortSummary: `An ink-ringed coaster noting an appointment at ${loc.name}.`,
        detailedInspection: `Embossed beverage coaster from ${loc.name} (${loc.district}, ${hours}) with hurried handwriting across the back: "${apptTime} sharp — don't be late."`,
        poiHint: `A scribbled coaster from ${loc.name} rests near the glassware.`
      }
    );
  } else if (tags.some((t) => ['docks', 'warehouse', 'industrial', 'shipyard', 'alley', 'transit', 'garage'].includes(t))) {
    variants.push(
      {
        clueName: `Stamped Cargo & Transfer Slip — ${loc.name}`,
        shortSummary: `A weathered routing slip citing ${loc.name} (${loc.district}).`,
        detailedInspection: `Numbered transit docket #${serial} routed to ${loc.name} in ${loc.district} (Hours: ${hours}), penciled with a stop near ${apptTime}.`,
        poiHint: `A stamped routing docket pointing toward ${loc.name} sticks out from the rack.`
      },
      {
        clueName: `Gatekeeper’s Evening Pass #${serial} — ${loc.name}`,
        shortSummary: `Chalk-smudged entry pass stamped for ${loc.name}.`,
        detailedInspection: `Heavy manila pass granting after-dusk admittance to ${loc.name} (${hours}), marked with an ${apptTime} arrival notation.`,
        poiHint: `A folded gate pass stamped for ${loc.name} sits weighted under a paperweight.`
      },
      {
        clueName: `Night Courier Dispatch Carbon — ${loc.name}`,
        shortSummary: `Carbon courier receipt listing a pickup near ${loc.name}.`,
        detailedInspection: `District messenger carbon citing ${loc.name} (${loc.district}) with an urgent margin reminder for ${apptTime}.`,
        poiHint: `A torn courier carbon referencing ${loc.name} is tucked beside the counter.`
      }
    );
  } else if (tags.some((t) => ['shop', 'bakery', 'market', 'antiques', 'curios', 'pharmacy'].includes(t))) {
    variants.push(
      {
        clueName: `Counter Order Claim Tag #${serial} — ${loc.name}`,
        shortSummary: `String-tied shop claim stub stamped by ${loc.name} (${loc.district}).`,
        detailedInspection: `Printed merchant tag from ${loc.name} in ${loc.district} (Hours: ${hours}) noting an item held or inquired about around ${apptTime}.`,
        poiHint: `A string-tied shop claim tag from ${loc.name} rests near the counter.`
      },
      {
        clueName: `Duplicate Parcel Invoice — ${loc.name}`,
        shortSummary: `Pink counter invoice referencing stock at ${loc.name}.`,
        detailedInspection: `Dated counter slip from ${loc.name} (${hours}) detailing a late inquiry or parcel arrangement timed around ${apptTime}.`,
        poiHint: `A folded pink invoice from ${loc.name} lies tucked among discarded slips.`
      },
      {
        clueName: `Engraved Merchant Calling Card — ${loc.name}`,
        shortSummary: `Embossed trade card listing ${loc.name} in ${loc.district}.`,
        detailedInspection: `Crisp trade card for ${loc.name} (${hours}) with pencil directions scribbled across the reverse: "See the stock clerk near ${apptTime}."`,
        poiHint: `An embossed trade card for ${loc.name} was left beside the spindle.`
      }
    );
  } else {
    variants.push(
      {
        clueName: `Switchboard Message Carbon #${serial} — ${loc.name}`,
        shortSummary: `Pink telephone memo routing a caller to ${loc.name} (${loc.district}).`,
        detailedInspection: `Operator slip logging an evening call connected to ${loc.name} in ${loc.district} (Hours: ${hours}) with an ${apptTime} reminder.`,
        poiHint: `A pink switchboard memo citing ${loc.name} rests on the spindle.`
      },
      {
        clueName: `Stamped Appointment Slip — ${loc.name}`,
        shortSummary: `A dated desk slip scheduling a stop at ${loc.name}.`,
        detailedInspection: `Clerk appointment carbon for ${loc.name} (${hours}) penciled with an ${apptTime} notation and ${loc.district} street directions.`,
        poiHint: `A stamped desk appointment slip pointing to ${loc.name} lies visible.`
      },
      {
        clueName: `Messenger Routing Envelope — ${loc.name}`,
        shortSummary: `An addressed envelope marked for ${loc.name} (${loc.district}).`,
        detailedInspection: `Heavy manila routing sleeve stamped for ${loc.name} (${hours}) noting an urgent drop-off or meeting at ${apptTime}.`,
        poiHint: `An addressed routing envelope for ${loc.name} sits tucked behind the tray.`
      }
    );
  }

  // Bias selection slightly by contextTag while letting rng pick across variants
  if (!rng) return variants[0];
  if (contextTag === 'weapon_source' && variants.length > 1) {
    return rng.pick(variants.slice(1));
  }
  return rng.pick(variants);
}

export interface AlibiBreakSpec {
  name: string;
  shortSummary: string;
  detailedInspection: string;
  topicTitle: string;
  evidencePhrase: string;
  transportPhrase: string;
  witnessMention: string;
  timelineAction: string;
  poiHint: string;
}

/**
 * Generates diverse, room-and-transit-aware alibi-break records so every game isn't
 * hardcoded to "Yellow Cab Dispatcher Carbon #4402".
 */
export function buildAlibiBreakClueSpec(
  rng: SeededRNG,
  originLoc: LocationTemplate,
  crimeLoc: LocationTemplate,
  pickUpTime: string,
  dropTime: string,
  culpritCollar: string
): AlibiBreakSpec {
  const originTags = originLoc.locationTags || [];
  const crimeTags = crimeLoc.locationTags || [];
  const cabNum = rng.pick(['1879', '2784', '3106', '4402', '5531', '6240', '7195']);
  const routeNum = rng.pick(['4', '7', '9', '12', '14']);
  const voucherNum = rng.int(410, 985);
  const collarDesc = culpritCollar || 'dark coat';

  const candidates: AlibiBreakSpec[] = [
    {
      name: `Yellow Cab Trip Carbon #${cabNum}`,
      shortSummary: `Cab trip sheet stamped ${dropTime} for drop-off near ${crimeLoc.name}.`,
      detailedInspection: `A yellowed carbon receipt from Yellow Cab Co. Driver note on Hack #${cabNum}: "Fare picked up outside ${originLoc.name} at ${pickUpTime}, dropped at side alley of ${crimeLoc.name} at ${dropTime}. Passenger wore a ${collarDesc}, paid exact cash, and walked briskly toward the rear entrance."`,
      topicTitle: `Confront with Cab Trip Carbon #${cabNum}`,
      evidencePhrase: `Yellow Cab trip carbon #${cabNum}`,
      transportPhrase: 'a Yellow Cab',
      witnessMention: 'a waiting Yellow Cab',
      timelineAction: `Yellow Cab #${cabNum}`,
      poiHint: `Tucked beside the street hail stand lies a rain-smudged cab trip carbon.`
    },
    {
      name: `Owl Streetcar Transfer Stub — Route #${routeNum}`,
      shortSummary: `Punched zone transfer timed ${pickUpTime}–${dropTime} from ${originLoc.district} to ${crimeLoc.name}.`,
      detailedInspection: `A wet conductor's transfer stub from Owl Streetcar Route #${routeNum} annotated on the fare pad: "Solo fare boarded at ${originLoc.name} stop (${pickUpTime}) in a ${collarDesc}; stepped off briskly two doors from ${crimeLoc.name} at ${dropTime}."`,
      topicTitle: `Confront with Streetcar Transfer #${routeNum}`,
      evidencePhrase: `Route #${routeNum} Owl streetcar transfer stub`,
      transportPhrase: `the Route #${routeNum} Owl streetcar`,
      witnessMention: 'the corner Owl streetcar stop',
      timelineAction: `Owl Streetcar Route #${routeNum}`,
      poiHint: `A punched transit transfer stub and conductor note rest along the ledge.`
    },
    {
      name: `District Livery Dispatch Ticket #${voucherNum}`,
      shortSummary: `Private-car hire slip logging a ${pickUpTime} pickup outside ${originLoc.name}.`,
      detailedInspection: `Stamped livery-stand voucher #${voucherNum}: records an urgent cash-paid sedan hired near ${originLoc.name} at ${pickUpTime}, discharging a passenger wearing a ${collarDesc} beside ${crimeLoc.name}'s back court at ${dropTime}.`,
      topicTitle: `Confront with Livery Dispatch Ticket #${voucherNum}`,
      evidencePhrase: `livery dispatch ticket #${voucherNum}`,
      transportPhrase: 'a hired livery sedan',
      witnessMention: 'a dark hired sedan',
      timelineAction: `Livery Sedan #${voucherNum}`,
      poiHint: `A carbon hire-car slip lies folded beside the door frame.`
    },
    {
      name: `Payphone & Hack-Call Carbon #${voucherNum}`,
      shortSummary: `Switchboard dispatch slip calling a rush hack to ${originLoc.name} at ${pickUpTime}.`,
      detailedInspection: `Operator call-cab carbon #${voucherNum}: logs a hurried phone request from ${originLoc.name} at ${pickUpTime} for immediate drop-off at ${crimeLoc.name} (${dropTime}); driver noted a ${collarDesc} vanishing toward the service entrance.`,
      topicTitle: `Confront with Hack-Call Carbon #${voucherNum}`,
      evidencePhrase: `switchboard hack-call carbon #${voucherNum}`,
      transportPhrase: 'a telephone-dispatched hack',
      witnessMention: 'a waiting dispatched hack',
      timelineAction: `Dispatched Hack #${voucherNum}`,
      poiHint: `A pink operator call-car carbon sticks out beneath the desk blotter.`
    }
  ];

  if (originTags.some((t) => ['hotel', 'nightclub', 'cabaret', 'restaurant', 'theater'].includes(t))) {
    candidates.push({
      name: `Doorman Private-Car Call Stub #${voucherNum}`,
      shortSummary: `Doorman's whistle-cab ledger logging a ${pickUpTime} departure from ${originLoc.name}.`,
      detailedInspection: `Stamped carriage-starter pad #${voucherNum} kept outside ${originLoc.name}: records calling a private coupe at ${pickUpTime} for a patron in a ${collarDesc} bound straight for ${crimeLoc.name}, logged arriving at ${dropTime}.`,
      topicTitle: `Confront with Doorman Call Stub #${voucherNum}`,
      evidencePhrase: `doorman private-car stub #${voucherNum}`,
      transportPhrase: 'a private coupe from the door',
      witnessMention: 'a dark coupe idling at the curb',
      timelineAction: `Private Coupe #${voucherNum}`,
      poiHint: `A rain-spotted doorman carriage stub rests tucked inside the entry tray.`
    });
  }

  if (
    originTags.some((t) => ['docks', 'waterfront', 'warehouse', 'shipyard'].includes(t)) &&
    crimeTags.some((t) => ['docks', 'waterfront', 'warehouse', 'shipyard'].includes(t))
  ) {
    candidates.push({
      name: `Harbor Skiff Berth Log #${voucherNum}`,
      shortSummary: `Pierhead ferryman's slate logging a ${pickUpTime} crossing to ${crimeLoc.name}.`,
      detailedInspection: `Salt-spotted wharf slate #${voucherNum} kept near ${originLoc.name}: logs an unscheduled skiff passenger in a ${collarDesc} shoving off at ${pickUpTime} and landing beside ${crimeLoc.name} at ${dropTime}.`,
      topicTitle: `Confront with Harbor Skiff Log #${voucherNum}`,
      evidencePhrase: `harbor skiff berth log #${voucherNum}`,
      transportPhrase: 'a harbor skiff',
      witnessMention: 'a dockside skiff slipping away',
      timelineAction: `Harbor Skiff #${voucherNum}`,
      poiHint: `A damp wharf-ferryman tally sheet lies clipped near the exit.`
    });
  }

  return rng.pick(candidates);
}

/**
 * Generates varied corroborator verification documents tailored to the meeting venue.
 */
export function getCorroboratorRecordSpec(
  rng: SeededRNG,
  loc: LocationTemplate,
  corroboratorName: string,
  redHerringName: string,
  corrStart: string,
  corrEnd: string
): { name: string; shortSummary: string; poiHint: string } {
  const tags = loc.locationTags || [];
  const voucherNum = rng.int(120, 899);

  if (tags.some((t) => ['nightclub', 'restaurant', 'diner', 'tavern', 'cabaret', 'hotel'].includes(t))) {
    return rng.pick([
      {
        name: `Co-Signed Booth & Check Stub #${voucherNum} — ${corroboratorName}`,
        shortSummary: `Time-stamped house check co-signed by ${corroboratorName} and ${redHerringName}.`,
        poiHint: `A time-stamped booth bill bearing two signatures rests on the counter.`
      },
      {
        name: `Maitre d’ Reservation & Tab — ${corroboratorName}`,
        shortSummary: `Signed evening seating card confirming ${corroboratorName} and ${redHerringName} stayed ${corrStart}–${corrEnd}.`,
        poiHint: `A dated reservation tab clipped with two signatures sits inside the book.`
      }
    ]);
  }

  if (tags.some((t) => ['church', 'library', 'civic', 'medical', 'academic'].includes(t))) {
    return rng.pick([
      {
        name: `Desk Visitor Register #${voucherNum} — ${corroboratorName}`,
        shortSummary: `Two-signature evening log co-signed by ${corroboratorName} and ${redHerringName}.`,
        poiHint: `A dated evening register line bearing two signatures sits open.`
      },
      {
        name: `Witnessed Evening Ledger Entry — ${corroboratorName}`,
        shortSummary: `Counter-signed attendance slip verifying ${redHerringName} stayed from ${corrStart} to ${corrEnd}.`,
        poiHint: `Two counter-signed evening vouchers dated last night are clipped together.`
      }
    ]);
  }

  return rng.pick([
    {
      name: `Signed Counter Voucher #${voucherNum} — ${corroboratorName}`,
      shortSummary: `Counter receipt co-signed by ${corroboratorName} and ${redHerringName}.`,
      poiHint: `Two counter-signed evening vouchers dated last night are clipped together in the register.`
    },
    {
      name: `Two-Signature Appointment Card — ${corroboratorName}`,
      shortSummary: `Evening appointment card logging ${corroboratorName} with ${redHerringName} (${corrStart}–${corrEnd}).`,
      poiHint: `A counter-signed evening appointment slip sits clipped beside the ledger.`
    }
  ]);
}

/**
 * Computes deterministic road-network shortest path distance (in hops & travel minutes)
 * across the fixed city map using symmetric connectedRoads.
 */
export function buildSymmetricRoadGraph(
  allLocations: LocationTemplate[]
): Record<string, string[]> {
  const graph: Record<string, Set<string>> = {};
  for (const loc of allLocations) {
    if (!graph[loc.id]) graph[loc.id] = new Set();
    for (const neighbor of loc.connectedRoads) {
      graph[loc.id].add(neighbor);
      if (!graph[neighbor]) graph[neighbor] = new Set();
      graph[neighbor].add(loc.id);
    }
  }
  const result: Record<string, string[]> = {};
  for (const [id, set] of Object.entries(graph)) {
    result[id] = Array.from(set);
  }
  return result;
}

/**
 * Computes direct travel time (in minutes) along a road segment between two
 * adjacent map locations based on their planar street distance.
 */
export function getDirectRoadMinutes(
  a: Pick<LocationTemplate, 'mapCoords'>,
  b: Pick<LocationTemplate, 'mapCoords'>
): number {
  const dist = Math.hypot(a.mapCoords.x - b.mapCoords.x, a.mapCoords.y - b.mapCoords.y);
  return Math.max(3, Math.round(dist * 0.45));
}

export interface RoadPathResult {
  path: string[];
  totalMinutes: number;
}

/**
 * Finds a deterministic shortest road-network path (by cumulative street travel minutes)
 * across symmetric connectedRoads using Dijkstra's algorithm with canonical tie-breaking
 * so routes are strictly symmetric between A->B and B->A.
 */
export function findShortestRoadPath(
  allLocations: LocationTemplate[],
  fromId: string,
  toId: string
): RoadPathResult {
  if (fromId === toId) {
    return { path: [fromId], totalMinutes: 0 };
  }

  const reversed = fromId > toId;
  const startId = reversed ? toId : fromId;
  const endId = reversed ? fromId : toId;

  const byId: Record<string, LocationTemplate> = {};
  for (const loc of allLocations) {
    byId[loc.id] = loc;
  }

  const graph = buildSymmetricRoadGraph(allLocations);
  const allIds = Object.keys(graph).sort();

  const dist: Record<string, number> = {};
  const hopCount: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const unvisited = new Set<string>(allIds);

  for (const id of allIds) {
    dist[id] = Infinity;
    hopCount[id] = Infinity;
    prev[id] = null;
  }

  if (dist[startId] === undefined || dist[endId] === undefined) {
    const a = byId[fromId];
    const b = byId[toId];
    const fallback = a && b ? getDirectRoadMinutes(a, b) : 10;
    return { path: [fromId, toId], totalMinutes: fallback };
  }

  dist[startId] = 0;
  hopCount[startId] = 0;

  while (unvisited.size > 0) {
    let bestId: string | null = null;
    let bestDist = Infinity;
    let bestHops = Infinity;

    for (const id of unvisited) {
      const d = dist[id];
      const h = hopCount[id];
      if (
        d < bestDist ||
        (d === bestDist && h < bestHops) ||
        (d === bestDist && h === bestHops && bestId !== null && id < bestId)
      ) {
        bestDist = d;
        bestHops = h;
        bestId = id;
      }
    }

    if (!bestId || bestDist === Infinity || bestId === endId) {
      break;
    }

    unvisited.delete(bestId);
    const currentLoc = byId[bestId];
    const neighbors = [...(graph[bestId] || [])].sort();

    for (const nextId of neighbors) {
      if (!unvisited.has(nextId)) continue;
      const nextLoc = byId[nextId];
      const weight = currentLoc && nextLoc ? getDirectRoadMinutes(currentLoc, nextLoc) : 6;
      const altDist = bestDist + weight;
      const altHops = bestHops + 1;

      if (
        altDist < dist[nextId] ||
        (altDist === dist[nextId] && altHops < hopCount[nextId]) ||
        (altDist === dist[nextId] &&
          altHops === hopCount[nextId] &&
          prev[nextId] !== null &&
          bestId < prev[nextId]!)
      ) {
        dist[nextId] = altDist;
        hopCount[nextId] = altHops;
        prev[nextId] = bestId;
      }
    }
  }

  if (dist[endId] === Infinity) {
    const a = byId[fromId];
    const b = byId[toId];
    const fallback = a && b ? getDirectRoadMinutes(a, b) : 10;
    return { path: [fromId, toId], totalMinutes: fallback };
  }

  const path: string[] = [];
  let cursor: string | null = endId;
  while (cursor) {
    path.unshift(cursor);
    if (cursor === startId) break;
    cursor = prev[cursor];
  }

  return {
    path: reversed ? path.reverse() : path,
    totalMinutes: dist[endId]
  };
}

export function calculateRoadTravelMinutes(
  allLocations: LocationTemplate[],
  fromId: string,
  toId: string
): number {
  return findShortestRoadPath(allLocations, fromId, toId).totalMinutes;
}

const ATTIRE_FIBER_OVERRIDES: Record<string, string> = {
  'Briefcase & Felt Homburg': 'stray felt homburg fibers',
  'Wool Cap & Wrench': 'stray wool cap fibers',
  'Measuring Tape & Waistcoat': 'stray waistcoat cloth fibers',
  'Loupe & Wool Cardigan': 'stray wool cardigan fibers',
  'Knitted Shawl & Ring of Keys': 'stray knitted shawl fibers',
  'Tweed Suit & Reading Chain': 'stray tweed suit fibers',
  'Green Visor & Garters': 'stray elastic garter threads',
  'Storm Lantern & Oilskin': 'stray waxed oilskin coat fibers',
  'Watchman Jacket & Lantern': 'stray watchman jacket fibers',
  'Heavy Dock Coat & Torch': 'stray heavy dock coat fibers',
  'Pea Coat & Ticket Punch': 'stray pea coat fibers',
  'Tweed Coat & Cane': 'stray tweed coat fibers',
  'Wool Cloak & Brooch': 'stray wool cloak fibers',
  'Wool Cardigan & Whistle': 'stray wool cardigan fibers',
  'Wool Vest & Keys': 'stray wool vest fibers',
  'Steward Jacket & Pocket Watch': 'stray steward jacket fibers',
  'Butcher Apron & Pencil': 'stray butcher apron fibers',
  'Sweatshirt & Towel': 'stray cotton sweatshirt fibers',
  'Vested Suit & Loupe': 'stray vested suit fibers',
  'Work Jacket & Union Pin': 'stray work jacket fibers',
  'Pearl Clip & Navy Coat': 'stray navy coat fibers',
  'Black Coat & Market Tote': 'stray black coat fibers',
  'Navy Cape & Satchel': 'stray navy cape fibers',
  'Tartan Scarf & Basket': 'stray tartan scarf fibers',
  'Silk Halter & Pearls': 'stray silk halter fibers',
  'Crisp Blouse & Brass Badge': 'stray crisp blouse fibers',
  'Police Badge & Coat': 'stray police coat fibers',
  'Tweedy Smock & Spectacles': 'stray tweedy smock fibers',
  'Tweed Blazer & Glasses': 'stray tweed blazer fibers',
  'Tweed Jacket & Chalk': 'stray tweed jacket fibers',
  'Corduroy Jacket & Spectacles': 'stray corduroy jacket fibers',
  'Rolled Vest & Chalk': 'stray vest cloth fibers',
  'Pinstripe Suit & Sleeve Protectors': 'stray pinstripe suit fibers',
  'Pinstripe Vest & Bowtie': 'stray pinstripe vest fibers',
  'Tailcoat & White Gloves': 'stray tailcoat and white glove fibers',
  'Uniform Shirt & Tie': 'stray uniform shirt and tie fibers',
  'Silk Scarf & Tuxedo': 'stray silk scarf and tuxedo fibers',
  'Camel Hair Jacket & Ascot': 'stray camel hair jacket and ascot fibers',
  'Velvet Cravat & Blazer': 'stray velvet cravat and blazer fibers',
  'Cloth Cap & Ink Cuffs': 'stray cloth cap and ink cuff fibers',
  'Headscarf & Wool Coat': 'stray headscarf and wool coat fibers',
  'Checkered Cap & Jacket': 'stray checkered cap and jacket fibers',
  'Pleated Skirt & Cardigan': 'stray pleated skirt and cardigan fibers',
  'Lab Coat & Vest': 'stray lab coat and vest fibers',
  'Starched White Cap & Coat': 'stray starched white coat fibers',
  'Precinct Sergeant Stripes': 'stray precinct sergeant uniform fibers',
  'Fox Fur Collar': 'stray fox fur collar hairs',
  'Fur Stole': 'stray fur stole hairs',
  'Sequin Feather Wrap': 'stray sequin feather wrap wisps',
  'Leather Flight Jacket': 'stray leather flight jacket lining threads',
  'Riveted Leather Jacket': 'stray riveted leather jacket lining threads',
  'Leather Dispatcher Cap': 'stray leather dispatcher cap lining threads',
  'Rubberized Apron': 'stray rubberized apron tie fibers',
  'Rubberized Surgical Apron': 'stray rubberized surgical apron tie fibers',
  'Black Satin Gloves': 'stray black satin glove threads',
  'Clerical Collar': 'stray black clerical collar threads'
};

/**
 * Converts a character's Attire (`avatarStyle.collar`) string into a natural forensic
 * fiber/thread description that matches what the player sees on suspect portraits.
 */
export function describeAttireFibers(collar?: string): string {
  const trimmed = (collar || '').trim();
  if (!trimmed) return 'stray dark cloth fibers';
  if (ATTIRE_FIBER_OVERRIDES[trimmed]) {
    return ATTIRE_FIBER_OVERRIDES[trimmed];
  }
  const lower = trimmed.toLowerCase().replace(/\s*&\s*/g, ' and ');
  return `stray ${lower} fibers`;
}


