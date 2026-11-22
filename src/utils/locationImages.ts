/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveAssetImage, resolveAssetMap } from './assetUrl';

const IMG_AGENCY = resolveAssetImage('/src/assets/images/location/empty_agency_office.jpg');
const IMG_HOTEL = resolveAssetImage('/src/assets/images/location/grand_hotel.jpg');
const IMG_LOUNGE = resolveAssetImage('/src/assets/images/location/velvet_lounge.jpg');
const IMG_CHAPEL = resolveAssetImage('/src/assets/images/location/st_judes_chapel.jpg');
const IMG_SHOP = resolveAssetImage('/src/assets/images/location/antiquities_shop.jpg');
const IMG_PIER = resolveAssetImage('/src/assets/images/location/waterfront_pier.jpg');
const IMG_MEDICAL = resolveAssetImage('/src/assets/images/location/medical_clinic.jpg');
const IMG_NEWSROOM = resolveAssetImage('/src/assets/images/location/clarion_newsroom.jpg');
const IMG_ALLEY = resolveAssetImage('/src/assets/images/location/cobblestone_alley.jpg');

export const LOCATION_BACKGROUNDS: Record<string, string> = resolveAssetMap({
  agency: IMG_AGENCY,
  grand_hotel: IMG_HOTEL,
  grand_hotel2: '/src/assets/images/location/starlight_grand.jpg',
  velvet_lounge: IMG_LOUNGE,
  blue_dahlia_club: '/src/assets/images/location/blue_dahlia.jpg',
  st_judes: IMG_CHAPEL,
  riverside_chapel: '/src/assets/images/location/harbor_chapel.jpg',
  blackwood_antiquities: IMG_SHOP,
  pier_four: IMG_PIER,
  fish_market: '/src/assets/images/location/fish_market.jpg',
  dry_dock: '/src/assets/images/location/dry_dock.jpg',
  harbor_warehouse: '/src/assets/images/location/harbor_warehouse.jpg',
  pendelton_clinic: IMG_MEDICAL,
  city_morgue: '/src/assets/images/location/city_morgue.jpg',
  clarion_newsroom: IMG_NEWSROOM,
  starlight_radio: '/src/assets/images/location/starlight_radio.jpg',
  central_railway: '/src/assets/images/location/central_railway.jpg',
  city_hall: '/src/assets/images/location/city_hall.jpg',
  union_hall: '/src/assets/images/location/union_hall.jpg',
  boxing_gym: '/src/assets/images/location/boxing_club.jpg',
  service_alley: '/src/assets/images/location/morrow_alley.jpg',
  tenement_court: '/src/assets/images/location/tenement_court.jpg',
  cobblestone_alley: IMG_ALLEY,
  trinity_baptist: '/src/assets/images/location/trinity_baptist.jpg',
  golden_crust_bakery: '/src/assets/images/location/golden_bakery.jpg',
  silver_spoon_diner: '/src/assets/images/location/silver_diner.jpg',
  harborview_restaurant: '/src/assets/images/location/harborview_chophouse.jpg',
  rosie_deli: '/src/assets/images/location/rosie_deli.jpg',
  crimson_cabaret: '/src/assets/images/location/crimson_cabaret.jpg',
  copper_kettle_tavern: '/src/assets/images/location/copper_tavern.jpg',
  mercer_apothecary: '/src/assets/images/location/mercer_apothecary.jpg',
  savile_tailors: '/src/assets/images/location/savile_tailors.jpg',
  marigold_florist: '/src/assets/images/location/marigold_florist.jpg',
  ace_pawnshop: '/src/assets/images/location/ace_pawnshop.jpg',
  crown_barbershop: '/src/assets/images/location/crown_barbershop.jpg',
  continental_bank: '/src/assets/images/location/continental_bank.jpg',
  liberty_theater: '/src/assets/images/location/liberty_theater.jpg',
  precinct_four: '/src/assets/images/location/precinct_four.jpg',
  public_library: '/src/assets/images/location/carnegie_library.jpg',
  post_office: '/src/assets/images/location/post_office.jpg',
  bus_depot: '/src/assets/images/location/bus_depot.jpg',
  taxi_garage: '/src/assets/images/location/taxi_garage.jpg',
  foundry_works: '/src/assets/images/location/foundry_works.jpg',
  textile_mill: '/src/assets/images/location/textile_mill.jpg',
  botanical_conservatory: '/src/assets/images/location/botanical_conservatory.jpg',
  civic_cemetery: '/src/assets/images/location/civic_cemetery.jpg',
  university_hall: '/src/assets/images/location/chemistry_hall.jpg',
  courthouse: '/src/assets/images/location/criminal_courthouse.jpg',
  opera_house: '/src/assets/images/location/opera_house.jpg',
  customs_house: '/src/assets/images/location/customs_house.jpg',
  ferry_terminal: '/src/assets/images/location/ferry_terminal.jpg',
  pool_hall: '/src/assets/images/location/pool_hall.jpg',
  laundry_works: '/src/assets/images/location/laundry_works.jpg',
  bookshop: '/src/assets/images/location/rare_bookshop.jpg'
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
