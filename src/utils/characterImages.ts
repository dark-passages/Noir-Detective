/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterTemplate } from '../types/game';
import { resolveAssetMap } from './assetUrl';

export const CHARACTER_MUGSHOTS: Record<string, string> = resolveAssetMap({
  // 8 Core Characters
  mara_vance: '/src/assets/images/person/vance_mara.jpg',
  victor_malone: '/src/assets/images/person/malone_victor.jpg',
  dr_arthur_pendelton: '/src/assets/images/person/pendelton_arthur.jpg',
  evelyn_cross: '/src/assets/images/person/cross_evelyn.jpg',
  silas_thorne: '/src/assets/images/person/thorne_silas.jpg',
  father_callahan: '/src/assets/images/person/callahan_thomas.jpg',
  beatrice_fontaine: '/src/assets/images/person/fontaine_beatrice.jpg',
  officer_omalley: '/src/assets/images/person/omalley_frank.jpg',

  // Clergy & Parish
  staff_trinity_pastor: '/src/assets/images/person/brooks_isaiah.jpg',
  staff_trinity_organist: '/src/assets/images/person/whitfield_clara.jpg',
  staff_st_judes_sexton: '/src/assets/images/person/shaw_barnaby.jpg',
  staff_riverside_sexton: '/src/assets/images/person/moran_agnes.jpg',

  // Bakeries, Delis & Restaurants
  staff_bakery_baker: '/src/assets/images/person/lindemann_otto.jpg',
  staff_bakery_clerk: '/src/assets/images/person/carmichael_penny.jpg',
  staff_rosie_deli: '/src/assets/images/person/abramowitz_rosie.jpg',
  staff_harborview_waiter: '/src/assets/images/person/moreau_henri.jpg',
  staff_harborview_bartender: '/src/assets/images/person/vance_pryce_gideon.jpg',
  staff_harborview_chef: '/src/assets/images/person/bellini_marco.jpg',
  staff_diner_cook: '/src/assets/images/person/ruiz_alfonso.jpg',
  staff_diner_waitress: '/src/assets/images/person/henderson_dolly.jpg',

  // Nightclubs, Cabarets & Taverns
  staff_cabaret_bartender: '/src/assets/images/person/ferraro_sal.jpg',
  staff_cabaret_dancer1: '/src/assets/images/person/delacroix_scarlett.jpg',
  staff_cabaret_dancer2: '/src/assets/images/person/marlowe_lola.jpg',
  staff_cabaret_bouncer: '/src/assets/images/person/kowalczyk_moose.jpg',
  staff_velvet_bartender: '/src/assets/images/person/mercer_louie.jpg',
  staff_velvet_dancer: '/src/assets/images/person/laurent_yvonne.jpg',
  staff_velvet_bouncer: '/src/assets/images/person/deluca_bruno.jpg',
  staff_dahlia_waiter: '/src/assets/images/person/dupont_maurice.jpg',
  staff_dahlia_bartender: '/src/assets/images/person/rourke_teddy.jpg',
  staff_dahlia_dancer: '/src/assets/images/person/rostova_nadia.jpg',
  staff_copper_bartender: '/src/assets/images/person/mcbride_seamus.jpg',
  staff_copper_barback: '/src/assets/images/person/oshea_mickey.jpg',

  // Hotels, Shops, Waterfront & Civic Staff
  staff_grand_hotel_concierge: '/src/assets/images/person/ashworth_reginald.jpg',
  staff_grand_hotel_maid: '/src/assets/images/person/gallagher_nora.jpg',
  staff_grand_hotel_nightclerk: '/src/assets/images/person/carmichael_edmund.jpg',
  staff_starlight_manager: '/src/assets/images/person/vance_julian.jpg',
  staff_starlight_concierge: '/src/assets/images/person/greer_beatrice_anne.jpg',
  staff_antiquities_clerk: '/src/assets/images/person/finch_hester.jpg',
  staff_pier_dockmaster: '/src/assets/images/person/halloway_gus.jpg',
  staff_pier_watchman: '/src/assets/images/person/muldoon_barney.jpg',
  staff_clinic_nurse: '/src/assets/images/person/holloway_clara.jpg',
  staff_clarion_editor: '/src/assets/images/person/riggs_wallace.jpg',
  staff_clarion_pressman: '/src/assets/images/person/kowal_milo.jpg',
  staff_railway_master: '/src/assets/images/person/bradshaw_arthur.jpg',
  staff_boxing_trainer: '/src/assets/images/person/doyle_marty.jpg',
  staff_morgue_examiner: '/src/assets/images/person/kroll_leonard.jpg',
  staff_morgue_attendant: '/src/assets/images/person/phipps_simon.jpg',
  staff_fish_monger: '/src/assets/images/person/greco_salvadore.jpg',
  staff_drydock_foreman: '/src/assets/images/person/voss_red.jpg',
  staff_drydock_guard: '/src/assets/images/person/delgado_hector.jpg',
  staff_warehouse_watchman: '/src/assets/images/person/gable_chester.jpg',
  staff_warehouse_foreman: '/src/assets/images/person/dugan_mack.jpg',
  staff_union_steward: '/src/assets/images/person/donovan_john.jpg',
  staff_tenement_super: '/src/assets/images/person/kaczmarek_olga.jpg',
  staff_cityhall_clerk: '/src/assets/images/person/graves_percival.jpg',
  staff_cityhall_auditor: '/src/assets/images/person/halstead_clifford.jpg',
  staff_radio_announcer: '/src/assets/images/person/cole_dexter.jpg',
  staff_mercer_pharmacist: '/src/assets/images/person/mercer_eugene.jpg',
  staff_savile_tailor: '/src/assets/images/person/finch_albert.jpg',
  staff_marigold_florist: '/src/assets/images/person/bloom_iris.jpg',
  staff_ace_pawnbroker: '/src/assets/images/person/katz_soloman.jpg',
  staff_crown_barber: '/src/assets/images/person/santoro_vito.jpg',
  staff_bank_manager: '/src/assets/images/person/grant_harrison.jpg',
  staff_bank_teller: '/src/assets/images/person/levy_miriam.jpg',
  staff_theater_cashier: '/src/assets/images/person/dolan_peggy.jpg',
  staff_theater_projectionist: '/src/assets/images/person/halvorsen_buster.jpg',
  staff_precinct_sergeant: '/src/assets/images/person/burke_dan.jpg',
  staff_precinct_clerk: '/src/assets/images/person/novak_ray.jpg',
  staff_library_librarian: '/src/assets/images/person/pym_eleanor.jpg',
  staff_post_master: '/src/assets/images/person/finchley_wilbur.jpg',
  staff_bus_dispatcher: '/src/assets/images/person/mug_carl_kowal_1794750783416.jpg',
  staff_taxi_dispatcher: '/src/assets/images/person/shapiro_sammy.jpg',
  staff_taxi_mechanic: '/src/assets/images/person/lindqvist_dutch.jpg',
  staff_foundry_foreman: '/src/assets/images/person/mug_hank_kowalski_1794750783097.jpg',
  staff_mill_forewoman: '/src/assets/images/person/mug_martha_zielinski_1794750785748.jpg',
  staff_conservatory_botanist: '/src/assets/images/person/mug_evelyn_crane_1794750786697.jpg',
  staff_cemetery_keeper: '/src/assets/images/person/mug_eli_mercer_1794750785200.jpg',
  staff_university_prof: '/src/assets/images/person/mug_simon_ash_1794750786241.jpg',
  staff_courthouse_bailiff: '/src/assets/images/person/mug_patrick_byrne_1794750787046.jpg',
  staff_courthouse_steno: '/src/assets/images/person/mug_ruthie_caldwell_1794750787152.jpg',
  staff_opera_manager: '/src/assets/images/person/mug_claude_beaumont_1794750789113.jpg',
  staff_customs_inspector: '/src/assets/images/person/mug_bernard_cole_1794750788914.jpg',
  staff_ferry_ticketmaster: '/src/assets/images/person/mug_mitch_donovan_1794750788509.jpg',
  staff_pool_steward: '/src/assets/images/person/mug_chalky_white_1794750789927.jpg',
  staff_laundry_operator: '/src/assets/images/person/mug_meiling_wu_1794750789934.jpg',
  staff_bookshop_dealer: '/src/assets/images/person/mug_barnaby_locke_1794750791061.jpg',

  // Family Visitors (8 families, 32 characters)
  fam_miller_thomas: '/src/assets/images/person/miller_thomas.jpg',
  fam_miller_clara: '/src/assets/images/person/miller_clara.jpg',
  fam_miller_grace: '/src/assets/images/person/miller_grace.jpg',
  fam_miller_eddie: '/src/assets/images/person/miller_eddie.jpg',

  fam_kowalski_stan: '/src/assets/images/person/kowalski_stanley.jpg',
  fam_kowalski_helena: '/src/assets/images/person/kowalski_helena.jpg',
  fam_kowalski_frank: '/src/assets/images/person/kowalski_frankie.jpg',
  fam_kowalski_sofia: '/src/assets/images/person/kowalski_sofia.jpg',

  fam_delgado_mateo: '/src/assets/images/person/delgado_mateo.jpg',
  fam_delgado_rosa: '/src/assets/images/person/delgado_rosa.jpg',
  fam_delgado_carlos: '/src/assets/images/person/delgado_carlos.jpg',
  fam_delgado_lucia: '/src/assets/images/person/delgado_lucia.jpg',

  fam_oconnor_patrick: '/src/assets/images/person/oconnor_patrick.jpg',
  fam_oconnor_bridget: '/src/assets/images/person/oconnor_bridget.jpg',
  fam_oconnor_liam: '/src/assets/images/person/oconnor_liam.jpg',
  fam_oconnor_maeve: '/src/assets/images/person/oconnor_maeve.jpg',

  fam_goldstein_morris: '/src/assets/images/person/goldstein_morris.jpg',
  fam_goldstein_esther: '/src/assets/images/person/goldstein_esther.jpg',
  fam_goldstein_david: '/src/assets/images/person/goldstein_david.jpg',
  fam_goldstein_rebecca: '/src/assets/images/person/goldstein_rebecca.jpg',

  fam_bellini_angela: '/src/assets/images/person/bellini_angela.jpg',
  fam_bellini_tony: '/src/assets/images/person/bellini_tony.jpg',
  fam_bellini_gina: '/src/assets/images/person/bellini_gina.jpg',
  fam_bellini_vincenzo: '/src/assets/images/person/bellini_vincenzo.jpg',

  fam_sterling_arthur: '/src/assets/images/person/sterling_arthur.jpg',
  fam_sterling_beatrice: '/src/assets/images/person/sterling_beatrice.jpg',
  fam_sterling_edward: '/src/assets/images/person/sterling_edward.jpg',
  fam_sterling_claire: '/src/assets/images/person/sterling_claire.jpg',

  fam_cho_kenji: '/src/assets/images/person/cho_henry.jpg',
  fam_cho_evelyn: '/src/assets/images/person/cho_grace.jpg',
  fam_cho_daniel: '/src/assets/images/person/cho_daniel.jpg',
  fam_cho_iris: '/src/assets/images/person/cho_iris.jpg'
});

export function getCharacterMugshot(
  character: Pick<CharacterTemplate, 'id'>
): string {
  const portrait = CHARACTER_MUGSHOTS[character.id];
  if (!portrait) {
    throw new Error(`Missing portrait mapping for character "${character.id}"`);
  }
  return portrait;
}
