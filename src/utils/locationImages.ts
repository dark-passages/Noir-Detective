/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveAssetImage, resolveAssetMap } from './assetUrl';

const IMG_AGENCY = resolveAssetImage('/src/assets/images/loc_empty_agency_office_1794336329305.jpg');
const IMG_HOTEL = resolveAssetImage('/src/assets/images/loc_grand_hotel_1794335881586.jpg');
const IMG_LOUNGE = resolveAssetImage('/src/assets/images/loc_velvet_lounge_1794335882812.jpg');
const IMG_CHAPEL = resolveAssetImage('/src/assets/images/loc_st_judes_chapel_1794335883284.jpg');
const IMG_SHOP = resolveAssetImage('/src/assets/images/loc_antiquities_shop_1794335883700.jpg');
const IMG_PIER = resolveAssetImage('/src/assets/images/loc_waterfront_pier_1794335884895.jpg');
const IMG_MEDICAL = resolveAssetImage('/src/assets/images/loc_medical_clinic_1794335885849.jpg');
const IMG_NEWSROOM = resolveAssetImage('/src/assets/images/loc_clarion_newsroom_1794335886615.jpg');
const IMG_ALLEY = resolveAssetImage('/src/assets/images/loc_cobblestone_alley_1794335887180.jpg');

export const LOCATION_BACKGROUNDS: Record<string, string> = resolveAssetMap({
  agency: IMG_AGENCY,
  grand_hotel: IMG_HOTEL,
  grand_hotel2: '/src/assets/images/loc_starlight_grand_1794750214538.jpg',
  velvet_lounge: IMG_LOUNGE,
  blue_dahlia_club: '/src/assets/images/loc_blue_dahlia_1794750214521.jpg',
  st_judes: IMG_CHAPEL,
  riverside_chapel: '/src/assets/images/loc_harbor_chapel_1794750218527.jpg',
  blackwood_antiquities: IMG_SHOP,
  pier_four: IMG_PIER,
  fish_market: '/src/assets/images/loc_fish_market_1794750218606.jpg',
  dry_dock: '/src/assets/images/loc_dry_dock_1794750218471.jpg',
  harbor_warehouse: '/src/assets/images/loc_harbor_warehouse_1794750219715.jpg',
  pendelton_clinic: IMG_MEDICAL,
  city_morgue: '/src/assets/images/loc_city_morgue_1794750218642.jpg',
  clarion_newsroom: IMG_NEWSROOM,
  starlight_radio: '/src/assets/images/loc_starlight_radio_1794750222098.jpg',
  central_railway: '/src/assets/images/loc_central_railway_1794750215385.jpg',
  city_hall: '/src/assets/images/loc_city_hall_1794750222103.jpg',
  union_hall: '/src/assets/images/loc_union_hall_1794750220041.jpg',
  boxing_gym: '/src/assets/images/loc_boxing_club_1794750217227.jpg',
  service_alley: '/src/assets/images/loc_morrow_alley_1794750216613.jpg',
  tenement_court: '/src/assets/images/loc_tenement_court_1794750220902.jpg',
  cobblestone_alley: IMG_ALLEY,
  // 31 expanded city locations
  trinity_baptist: '/src/assets/images/loc_trinity_baptist_1794750222022.jpg',
  golden_crust_bakery: '/src/assets/images/loc_golden_bakery_1794750222944.jpg',
  silver_spoon_diner: '/src/assets/images/loc_silver_diner_1794750223957.jpg',
  harborview_restaurant: '/src/assets/images/loc_harborview_chophouse_1794750224036.jpg',
  rosie_deli: '/src/assets/images/loc_rosie_deli_1794750225090.jpg',
  crimson_cabaret: '/src/assets/images/loc_crimson_cabaret_1794750225484.jpg',
  copper_kettle_tavern: '/src/assets/images/loc_copper_tavern_1794750225775.jpg',
  mercer_apothecary: '/src/assets/images/loc_mercer_apothecary_1794750226793.jpg',
  savile_tailors: '/src/assets/images/loc_savile_tailors_1794750226579.jpg',
  marigold_florist: '/src/assets/images/loc_marigold_florist_1794750226969.jpg',
  ace_pawnshop: '/src/assets/images/loc_ace_pawnshop_1794750228232.jpg',
  crown_barbershop: '/src/assets/images/loc_crown_barbershop_1794750228259.jpg',
  continental_bank: '/src/assets/images/loc_continental_bank_1794750227957.jpg',
  liberty_theater: '/src/assets/images/loc_liberty_theater_1794750228508.jpg',
  precinct_four: '/src/assets/images/loc_precinct_four_1794750231141.jpg',
  public_library: '/src/assets/images/loc_carnegie_library_1794750230483.jpg',
  post_office: '/src/assets/images/loc_post_office_1794750230767.jpg',
  bus_depot: '/src/assets/images/loc_bus_depot_1794750231244.jpg',
  taxi_garage: '/src/assets/images/loc_taxi_garage_1794750231415.jpg',
  foundry_works: '/src/assets/images/loc_foundry_works_1794750231959.jpg',
  textile_mill: '/src/assets/images/loc_textile_mill_1794750232105.jpg',
  botanical_conservatory: '/src/assets/images/loc_botanical_conservatory_1794750233297.jpg',
  civic_cemetery: '/src/assets/images/loc_civic_cemetery_1794750233242.jpg',
  university_hall: '/src/assets/images/loc_chemistry_hall_1794750233725.jpg',
  courthouse: '/src/assets/images/loc_criminal_courthouse_1794750234500.jpg',
  opera_house: '/src/assets/images/loc_opera_house_1794750234348.jpg',
  customs_house: '/src/assets/images/loc_customs_house_1794750235501.jpg',
  ferry_terminal: '/src/assets/images/loc_ferry_terminal_1794750235541.jpg',
  pool_hall: '/src/assets/images/loc_pool_hall_1794750236891.jpg',
  laundry_works: '/src/assets/images/loc_laundry_works_1794750237685.jpg',
  bookshop: '/src/assets/images/loc_rare_bookshop_1794750237260.jpg'
});

export function getLocationBackground(locationId: string, locationTags: string[] = []): string {
  if (LOCATION_BACKGROUNDS[locationId]) return LOCATION_BACKGROUNDS[locationId];
  if (locationTags.includes('church')) return IMG_CHAPEL;
  if (locationTags.includes('nightclub') || locationTags.includes('cabaret') || locationTags.includes('tavern')) return IMG_LOUNGE;
  if (locationTags.includes('medical') || locationTags.includes('pharmacy')) return IMG_MEDICAL;
  if (locationTags.includes('docks') || locationTags.includes('industrial')) return IMG_PIER;
  if (locationTags.includes('shop') || locationTags.includes('bakery') || locationTags.includes('antiques')) return IMG_SHOP;
  if (locationTags.includes('hotel') || locationTags.includes('bank') || locationTags.includes('civic')) return IMG_HOTEL;
  if (locationTags.includes('press') || locationTags.includes('media')) return IMG_NEWSROOM;
  return IMG_ALLEY;
}
