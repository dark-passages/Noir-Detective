/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterTemplate } from '../types/game';
import { resolveAssetImage, resolveAssetMap } from './assetUrl';

const MUG_MARA_VANCE = resolveAssetImage('/src/assets/images/mara_vance_portrait_1795359395618.jpg');
const MUG_VICTOR_MALONE = resolveAssetImage('/src/assets/images/victor_malone_portrait_1795359394398.jpg');
const MUG_ARTHUR_PENDELTON = resolveAssetImage('/src/assets/images/arthur_pendelton_portrait_1795359395971.jpg');
const MUG_EVELYN_CROSS = resolveAssetImage('/src/assets/images/evelyn_cross_portrait_1795359468582.jpg');
const MUG_SILAS_THORNE = resolveAssetImage('/src/assets/images/silas_thorne_portrait_1795359394140.jpg');
const MUG_FATHER_CALLAHAN = resolveAssetImage('/src/assets/images/father_callahan_portrait_1795359396601.jpg');
const MUG_BEATRICE_FONTAINE = resolveAssetImage('/src/assets/images/beatrice_fontaine_portrait_1795359396606.jpg');
const MUG_FRANK_OMALLEY = resolveAssetImage('/src/assets/images/frank_omalley_portrait_1795359395942.jpg');

const MUG_NUN_HABIT = resolveAssetImage('/src/assets/images/nun_habit_portrait_1795359396506.jpg');
const MUG_CLINIC_NURSE = resolveAssetImage('/src/assets/images/clinic_nurse_portrait_1795359394768.jpg');
const MUG_DINER_WAITRESS = resolveAssetImage('/src/assets/images/diner_waitress_portrait_1795359394789.jpg');
const MUG_CABARET_DANCER = resolveAssetImage('/src/assets/images/cabaret_dancer_portrait_1795359394800.jpg');
const MUG_YOUNG_CLERK = resolveAssetImage('/src/assets/images/young_clerk_portrait_1795359395502.jpg');
const MUG_APRON_WOMAN = resolveAssetImage('/src/assets/images/apron_woman_portrait_1795359395186.jpg');
const MUG_TAILORED_WOMAN = resolveAssetImage('/src/assets/images/tailored_woman_portrait_1795359468464.jpg');
const MUG_ELDER_WOMAN = resolveAssetImage('/src/assets/images/elder_woman_portrait_1795359469504.jpg');

const MUG_CHEF_BAKER = resolveAssetImage('/src/assets/images/chef_baker_portrait_1795359469710.jpg');
const MUG_DOCK_WATCHMAN = resolveAssetImage('/src/assets/images/dock_watchman_portrait_1795359467758.jpg');
const MUG_ELDER_CRAFTSMAN = resolveAssetImage('/src/assets/images/elder_craftsman_portrait_1795359468034.jpg');
const MUG_ELDER_GENTLEMAN = resolveAssetImage('/src/assets/images/elder_gentleman_portrait_1795359468757.jpg');
const MUG_BEARDED_WORKER = resolveAssetImage('/src/assets/images/bearded_worker_portrait_1795359468958.jpg');
const MUG_BESPECTACLED_CLERK = resolveAssetImage('/src/assets/images/bespectacled_clerk_portrait_1795359469216.jpg');
const MUG_SUITED_MAN = resolveAssetImage('/src/assets/images/suited_man_portrait_1795359547241.jpg');
const MUG_YOUNG_WORKER = resolveAssetImage('/src/assets/images/young_worker_portrait_1795359548230.jpg');
const MUG_YOUNG_GENTLEMAN = resolveAssetImage('/src/assets/images/young_gentleman_portrait_1795359547850.jpg');

const MUG_JONATHAN_WELLS = resolveAssetImage('/src/assets/images/jonathan_wells_portrait_1795359549031.jpg');
const MUG_OTTO_LINDEMANN = resolveAssetImage('/src/assets/images/otto_lindemann_portrait_1795359547604.jpg');
const MUG_HENRI_MOREAU = resolveAssetImage('/src/assets/images/henri_moreau_portrait_1795359546764.jpg');
const MUG_SCARLETT_DELACROIX = resolveAssetImage('/src/assets/images/scarlett_delacroix_portrait_1795359547487.jpg');
const MUG_HARRISON_GRANT = resolveAssetImage('/src/assets/images/harrison_grant_portrait_1795359548084.jpg');

const MUG_THOMAS_MILLER = resolveAssetImage('/src/assets/images/thomas_miller_portrait_1795359547245.jpg');
const MUG_CLARA_MILLER = resolveAssetImage('/src/assets/images/clara_miller_portrait_1795359620266.jpg');
const MUG_GRACE_MILLER = resolveAssetImage('/src/assets/images/grace_miller_portrait_1795359620115.jpg');
const MUG_EDDIE_MILLER = resolveAssetImage('/src/assets/images/eddie_miller_portrait_1795359622319.jpg');

const MUG_STANLEY_KOWALSKI = resolveAssetImage('/src/assets/images/stanley_kowalski_portrait_1795359619770.jpg');
const MUG_HELENA_KOWALSKI = resolveAssetImage('/src/assets/images/helena_kowalski_portrait_1795359620367.jpg');
const MUG_FRANKIE_KOWALSKI = resolveAssetImage('/src/assets/images/frankie_kowalski_portrait_1795359621047.jpg');
const MUG_SOFIA_KOWALSKI = resolveAssetImage('/src/assets/images/sofia_kowalski_portrait_1795359620360.jpg');

const MUG_MATEO_DELGADO = resolveAssetImage('/src/assets/images/mateo_delgado_portrait_1795359621048.jpg');
const MUG_ROSA_DELGADO = resolveAssetImage('/src/assets/images/rosa_delgado_portrait_1795359620440.jpg');
const MUG_CARLOS_DELGADO = resolveAssetImage('/src/assets/images/carlos_delgado_portrait_1795359695418.jpg');
const MUG_LUCIA_DELGADO = resolveAssetImage('/src/assets/images/lucia_delgado_portrait_1795359695059.jpg');

const MUG_PATRICK_OCONNOR = resolveAssetImage('/src/assets/images/patrick_oconnor_portrait_1795359695145.jpg');
const MUG_BRIDGET_OCONNOR = resolveAssetImage('/src/assets/images/bridget_oconnor_portrait_1795359695272.jpg');
const MUG_LIAM_OCONNOR = resolveAssetImage('/src/assets/images/liam_oconnor_portrait_1795359694708.jpg');
const MUG_MAEVE_OCONNOR = resolveAssetImage('/src/assets/images/maeve_oconnor_portrait_1795359695725.jpg');

const MUG_MORRIS_GOLDSTEIN = resolveAssetImage('/src/assets/images/morris_goldstein_portrait_1795359695305.jpg');
const MUG_ESTHER_GOLDSTEIN = resolveAssetImage('/src/assets/images/esther_goldstein_portrait_1795359694095.jpg');
const MUG_DAVID_GOLDSTEIN = resolveAssetImage('/src/assets/images/david_goldstein_portrait_1795359695525.jpg');
const MUG_REBECCA_GOLDSTEIN = resolveAssetImage('/src/assets/images/rebecca_goldstein_portrait_1795359779967.jpg');

const MUG_ANGELA_BELLINI = resolveAssetImage('/src/assets/images/mug_angela_bellini_1794749537235.jpg');
const MUG_TONY_BELLINI = resolveAssetImage('/src/assets/images/tony_bellini_portrait_1795359783341.jpg');
const MUG_GINA_BELLINI = resolveAssetImage('/src/assets/images/gina_bellini_portrait_1795359785549.jpg');
const MUG_VINCENZO_BELLINI = resolveAssetImage('/src/assets/images/mug_vincenzo_bellini_1794749539619.jpg');

const MUG_ARTHUR_STERLING = resolveAssetImage('/src/assets/images/mug_arthur_sterling_1794749537937.jpg');
const MUG_BEATRICE_STERLING = resolveAssetImage('/src/assets/images/beatrice_sterling_portrait_1795359787275.jpg');
const MUG_EDWARD_STERLING = resolveAssetImage('/src/assets/images/mug_edward_sterling_1794749540529.jpg');
const MUG_CLAIRE_STERLING = resolveAssetImage('/src/assets/images/mug_claire_sterling_1794749540930.jpg');

const MUG_HENRY_CHO = resolveAssetImage('/src/assets/images/mug_henry_cho_1794749541126.jpg');
const MUG_GRACE_CHO = resolveAssetImage('/src/assets/images/mug_grace_cho_1794749541096.jpg');
const MUG_DANIEL_CHO = resolveAssetImage('/src/assets/images/mug_daniel_cho_1794749542516.jpg');
const MUG_IRIS_CHO = resolveAssetImage('/src/assets/images/mug_iris_cho_1794749541636.jpg');

export const CHARACTER_MUGSHOTS: Record<string, string> = resolveAssetMap({
  // 8 Core Characters
  mara_vance: MUG_MARA_VANCE,
  victor_malone: MUG_VICTOR_MALONE,
  dr_arthur_pendelton: MUG_ARTHUR_PENDELTON,
  evelyn_cross: MUG_EVELYN_CROSS,
  silas_thorne: MUG_SILAS_THORNE,
  father_callahan: MUG_FATHER_CALLAHAN,
  beatrice_fontaine: MUG_BEATRICE_FONTAINE,
  officer_omalley: MUG_FRANK_OMALLEY,

  // Clergy & Parish
  staff_trinity_pastor: MUG_JONATHAN_WELLS,
  staff_trinity_organist: MUG_ELDER_WOMAN,
  staff_st_judes_sexton: MUG_ELDER_CRAFTSMAN,
  staff_riverside_sexton: MUG_NUN_HABIT,

  // Bakeries, Delis & Restaurants
  staff_bakery_baker: MUG_OTTO_LINDEMANN,
  staff_bakery_clerk: MUG_DINER_WAITRESS,
  staff_rosie_deli: MUG_APRON_WOMAN,
  staff_harborview_waiter: MUG_HENRI_MOREAU,
  staff_harborview_bartender: MUG_SUITED_MAN,
  staff_harborview_chef: MUG_CHEF_BAKER,
  staff_diner_cook: '/src/assets/images/mug_alfonso_ruiz_1794750765186.jpg',
  staff_diner_waitress: '/src/assets/images/mug_dolly_henderson_1794750764992.jpg',

  // Nightclubs, Cabarets & Taverns
  staff_cabaret_bartender: '/src/assets/images/mug_sal_ferraro_1794750766613.jpg',
  staff_cabaret_dancer1: MUG_SCARLETT_DELACROIX,
  staff_cabaret_dancer2: MUG_CABARET_DANCER,
  staff_cabaret_bouncer: '/src/assets/images/mug_moose_kowalczyk_1794750765302.jpg',
  staff_velvet_bartender: MUG_BESPECTACLED_CLERK,
  staff_velvet_dancer: '/src/assets/images/mug_yvonne_laurent_1794750766586.jpg',
  staff_velvet_bouncer: '/src/assets/images/mug_bruno_deluca_1794750766701.jpg',
  staff_dahlia_waiter: '/src/assets/images/mug_maurice_dupont_1794750766663.jpg',
  staff_dahlia_bartender: '/src/assets/images/mug_teddy_rourke_1794750768875.jpg',
  staff_dahlia_dancer: '/src/assets/images/mug_nadia_rostova_1794750767994.jpg',
  staff_copper_bartender: MUG_BEARDED_WORKER,
  staff_copper_barback: MUG_YOUNG_WORKER,

  // Hotels, Shops & Waterfront Staff
  staff_grand_hotel_concierge: MUG_ELDER_GENTLEMAN,
  staff_grand_hotel_maid: '/src/assets/images/mug_nora_gallagher_1794750769125.jpg',
  staff_grand_hotel_nightclerk: '/src/assets/images/mug_edmund_carmichael_1794750768807.jpg',
  staff_starlight_manager: '/src/assets/images/mug_julian_vance_1794750769999.jpg',
  staff_starlight_concierge: MUG_TAILORED_WOMAN,
  staff_antiquities_clerk: MUG_YOUNG_CLERK,
  staff_pier_dockmaster: MUG_DOCK_WATCHMAN,
  staff_pier_watchman: '/src/assets/images/mug_barney_muldoon_1794750770409.jpg',
  staff_clinic_nurse: MUG_CLINIC_NURSE,
  staff_clarion_editor: '/src/assets/images/mug_wallace_riggs_1794750770767.jpg',
  staff_clarion_pressman: '/src/assets/images/mug_milo_kowal_1794750820224.jpg',
  staff_railway_master: '/src/assets/images/mug_arthur_bradshaw_1794750772206.jpg',
  staff_boxing_trainer: '/src/assets/images/mug_marty_doyle_1794750772816.jpg',
  staff_morgue_examiner: '/src/assets/images/mug_leonard_kroll_1794750772755.jpg',
  staff_morgue_attendant: '/src/assets/images/mug_simon_phipps_1794750774050.jpg',
  staff_fish_monger: '/src/assets/images/mug_salvadore_greco_1794750772932.jpg',
  staff_drydock_foreman: '/src/assets/images/mug_red_voss_1794750774459.jpg',
  staff_drydock_guard: '/src/assets/images/mug_hector_delgado_1794750774747.jpg',
  staff_warehouse_watchman: '/src/assets/images/mug_chester_gable_1794750775248.jpg',
  staff_warehouse_foreman: '/src/assets/images/mug_mack_dugan_1794750776306.jpg',
  staff_union_steward: '/src/assets/images/mug_john_donovan_1794750775735.jpg',
  staff_tenement_super: '/src/assets/images/mug_olga_kaczmarek_1794750776397.jpg',
  staff_cityhall_clerk: '/src/assets/images/mug_percival_graves_1794750777221.jpg',
  staff_radio_announcer: '/src/assets/images/mug_dexter_cole_1794750777448.jpg',
  staff_mercer_pharmacist: '/src/assets/images/mug_eugene_mercer_1794750776830.jpg',
  staff_savile_tailor: '/src/assets/images/mug_albert_finch_1794750777922.jpg',
  staff_marigold_florist: '/src/assets/images/mug_iris_bloom_1794750779750.jpg',
  staff_ace_pawnbroker: '/src/assets/images/mug_soloman_katz_1794750778335.jpg',
  staff_crown_barber: '/src/assets/images/mug_vito_santoro_1794750779701.jpg',
  staff_bank_manager: MUG_HARRISON_GRANT,
  staff_bank_teller: '/src/assets/images/mug_miriam_levy_1794750781400.jpg',
  staff_theater_cashier: '/src/assets/images/mug_peggy_dolan_1794750780629.jpg',
  staff_theater_projectionist: '/src/assets/images/mug_buster_halvorsen_1794750781976.jpg',
  staff_precinct_sergeant: '/src/assets/images/mug_dan_burke_1794750781829.jpg',
  staff_precinct_clerk: '/src/assets/images/mug_ray_novak_1794750781613.jpg',
  staff_library_librarian: '/src/assets/images/mug_eleanor_pym_1794750782148.jpg',
  staff_post_master: '/src/assets/images/mug_wilbur_finchley_1794750782601.jpg',
  staff_bus_dispatcher: '/src/assets/images/mug_carl_kowal_1794750783416.jpg',
  staff_taxi_dispatcher: '/src/assets/images/mug_sammy_shapiro_1794750785270.jpg',
  staff_taxi_mechanic: '/src/assets/images/mug_dutch_lindqvist_1794750783760.jpg',
  staff_foundry_foreman: '/src/assets/images/mug_hank_kowalski_1794750783097.jpg',
  staff_mill_forewoman: '/src/assets/images/mug_martha_zielinski_1794750785748.jpg',
  staff_conservatory_botanist: '/src/assets/images/mug_evelyn_crane_1794750786697.jpg',
  staff_cemetery_keeper: '/src/assets/images/mug_eli_mercer_1794750785200.jpg',
  staff_university_prof: '/src/assets/images/mug_simon_ash_1794750786241.jpg',
  staff_courthouse_bailiff: '/src/assets/images/mug_patrick_byrne_1794750787046.jpg',
  staff_courthouse_steno: '/src/assets/images/mug_ruthie_caldwell_1794750787152.jpg',
  staff_opera_manager: '/src/assets/images/mug_claude_beaumont_1794750789113.jpg',
  staff_customs_inspector: '/src/assets/images/mug_bernard_cole_1794750788914.jpg',
  staff_ferry_ticketmaster: '/src/assets/images/mug_mitch_donovan_1794750788509.jpg',
  staff_pool_steward: '/src/assets/images/mug_chalky_white_1794750789927.jpg',
  staff_laundry_operator: '/src/assets/images/mug_meiling_wu_1794750789934.jpg',
  staff_bookshop_dealer: '/src/assets/images/mug_barnaby_locke_1794750791061.jpg',

  // Family Visitors (8 families, 32 characters)
  fam_miller_thomas: MUG_THOMAS_MILLER,
  fam_miller_clara: MUG_CLARA_MILLER,
  fam_miller_grace: MUG_GRACE_MILLER,
  fam_miller_eddie: MUG_EDDIE_MILLER,

  fam_kowalski_stan: MUG_STANLEY_KOWALSKI,
  fam_kowalski_helena: MUG_HELENA_KOWALSKI,
  fam_kowalski_frank: MUG_FRANKIE_KOWALSKI,
  fam_kowalski_sofia: MUG_SOFIA_KOWALSKI,

  fam_delgado_mateo: MUG_MATEO_DELGADO,
  fam_delgado_rosa: MUG_ROSA_DELGADO,
  fam_delgado_carlos: MUG_CARLOS_DELGADO,
  fam_delgado_lucia: MUG_LUCIA_DELGADO,

  fam_oconnor_patrick: MUG_PATRICK_OCONNOR,
  fam_oconnor_bridget: MUG_BRIDGET_OCONNOR,
  fam_oconnor_liam: MUG_LIAM_OCONNOR,
  fam_oconnor_maeve: MUG_MAEVE_OCONNOR,

  fam_goldstein_morris: MUG_MORRIS_GOLDSTEIN,
  fam_goldstein_esther: MUG_ESTHER_GOLDSTEIN,
  fam_goldstein_david: MUG_DAVID_GOLDSTEIN,
  fam_goldstein_rebecca: MUG_REBECCA_GOLDSTEIN,

  fam_bellini_angela: MUG_ANGELA_BELLINI,
  fam_bellini_tony: MUG_TONY_BELLINI,
  fam_bellini_gina: MUG_GINA_BELLINI,
  fam_bellini_vincenzo: MUG_VINCENZO_BELLINI,

  fam_sterling_arthur: MUG_ARTHUR_STERLING,
  fam_sterling_beatrice: MUG_BEATRICE_STERLING,
  fam_sterling_edward: MUG_EDWARD_STERLING,
  fam_sterling_claire: MUG_CLAIRE_STERLING,

  fam_cho_kenji: MUG_HENRY_CHO,
  fam_cho_evelyn: MUG_GRACE_CHO,
  fam_cho_daniel: MUG_DANIEL_CHO,
  fam_cho_iris: MUG_IRIS_CHO
});

export function getCharacterMugshot(
  character: Pick<CharacterTemplate, 'id' | 'ageBand' | 'avatarStyle'>
): string {
  if (CHARACTER_MUGSHOTS[character.id]) {
    return CHARACTER_MUGSHOTS[character.id];
  }

  const { silhouette, hat, collar } = character.avatarStyle;
  const age = character.ageBand;

  if (silhouette === 'man_priest') return MUG_FATHER_CALLAHAN;
  if (hat === 'Police Visor') return MUG_FRANK_OMALLEY;
  if (hat === 'Watch Cap') return MUG_DOCK_WATCHMAN;
  if (hat === 'Bowler') return MUG_SILAS_THORNE;
  if (hat === 'Cloche Hat') return MUG_MARA_VANCE;
  if (hat === 'Fedora with Press Tag') return MUG_EVELYN_CROSS;

  if (silhouette.startsWith('woman_')) {
    if (age === 'elder') return MUG_ELDER_WOMAN;
    if (age === 'young_adult') {
      if (silhouette === 'woman_singer') return MUG_BEATRICE_FONTAINE;
      return MUG_YOUNG_CLERK;
    }
    if (collar.toLowerCase().includes('apron') || collar.toLowerCase().includes('smock')) {
      return MUG_APRON_WOMAN;
    }
    return MUG_TAILORED_WOMAN;
  }

  if (silhouette === 'man_glasses') {
    return age === 'elder' ? MUG_ELDER_GENTLEMAN : MUG_BESPECTACLED_CLERK;
  }
  if (silhouette === 'man_beard') {
    return age === 'elder' ? MUG_ELDER_CRAFTSMAN : MUG_BEARDED_WORKER;
  }
  if (age === 'young_adult') {
    return silhouette === 'man_cop' ? MUG_YOUNG_WORKER : MUG_YOUNG_GENTLEMAN;
  }

  return MUG_SUITED_MAN;
}
