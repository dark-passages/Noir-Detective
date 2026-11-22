/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoomSpotKey = 'recordSpot' | 'discardSpot' | 'exitSpot' | 'leadSpot';

export interface RoomEvidenceOption {
  id: string;
  name: string;
  shortLabel: string;
  category: 'physical' | 'document' | 'forensic';
  preferredSpots: RoomSpotKey[];
  recoverySpotDetail: string;
  itemFeature: string;
}

/**
 * Authored multi-option physical & documentary evidence items for ALL 54 locations in New Bay.
 * Each location provides 3 distinct room-native items drawn into a shared pool for BOTH
 * decisive proof and red herrings, so no player can recognize culprit vs. distractor items on sight.
 */
export const LOCATION_EVIDENCE_ITEMS: Record<string, RoomEvidenceOption[]> = {
  agency: [
    {
      id: 'agency_brass_keytag',
      name: 'Engraved Transom Key Fob & Thread',
      shortLabel: 'engraved key fob',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'wedged beneath the frosted corridor transom latch',
      itemFeature: 'a weighted brass office key fob scratched along the bezel'
    },
    {
      id: 'agency_client_carbon',
      name: 'Initialed Client Intake Carbon & Cuff Fiber',
      shortLabel: 'client intake carbon',
      category: 'document',
      preferredSpots: ['recordSpot', 'discardSpot'],
      recoverySpotDetail: 'tucked inside the steel client filing drawer',
      itemFeature: 'a folded duplicate intake sheet torn from a pocket notepad'
    },
    {
      id: 'agency_silver_pen',
      name: 'Monogrammed Fountain Pen & Blotter Smudge',
      shortLabel: 'monogrammed fountain pen',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'rolled behind the swivel chair brass wastebasket',
      itemFeature: 'a black celluloid fountain pen with a gold-banded cap'
    }
  ],
  grand_hotel: [
    {
      id: 'hotel_suite_key',
      name: 'Gilded Suite Key Tag & Coat Thread',
      shortLabel: 'suite key tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'caught beside the Suite 408 balcony brass casement latch',
      itemFeature: 'a heavy gilded hotel room key tag bent at the brass ring'
    },
    {
      id: 'hotel_silver_case',
      name: 'Monogrammed St. Moritz Cigarette Case',
      shortLabel: 'monogrammed cigarette case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'slipped beside the walnut parlor writing bureau',
      itemFeature: 'an engraved sterling cigarette case bearing a faint thumbprint on the clasp'
    },
    {
      id: 'hotel_bellhop_folio',
      name: 'Initialed Concierge Credit Folio & Fiber',
      shortLabel: 'concierge credit folio',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'pressed beneath the marble concierge key pigeonholes',
      itemFeature: 'a torn luxury suite charge slip bearing damp street grit'
    }
  ],
  grand_hotel2: [
    {
      id: 'starlight_cufflink',
      name: 'Mother-of-Pearl Cufflink & Cloth Trace',
      shortLabel: 'pearl cufflink',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'dropped along the Room 614 service-stair fire bolt',
      itemFeature: 'a split mother-of-pearl dress cufflink scuffed along the toggle'
    },
    {
      id: 'starlight_ash_lighter',
      name: 'Engraved Petrol Pocket Lighter',
      shortLabel: 'engraved pocket lighter',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged in the tray of the chipped onyx ash-stand',
      itemFeature: 'a brushed chrome windproof lighter scuffed along the hinge'
    },
    {
      id: 'starlight_switchboard_slip',
      name: 'Initialed Night-Desk Message Slip',
      shortLabel: 'night-desk message slip',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'clipped behind the night manager’s folio cubbies',
      itemFeature: 'a stamped Starlight message carbon smeared with rain moisture'
    }
  ],
  velvet_lounge: [
    {
      id: 'velvet_pocket_flask',
      name: 'Engraved Silver Pocket Flask & Fiber',
      shortLabel: 'silver pocket flask',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'tucked beside the baby grand floor basin and spittoon',
      itemFeature: 'a curved four-ounce silver hip flask with a loose screw cap'
    },
    {
      id: 'velvet_cloak_token',
      name: 'Numbered Velvet Cloakroom Brass Check',
      shortLabel: 'cloakroom brass check',
      category: 'physical',
      preferredSpots: ['exitSpot', 'recordSpot'],
      recoverySpotDetail: 'snagged under the speakeasy alley delivery door hasp',
      itemFeature: 'a stamped oval brass coat-check disc nicked along the rim'
    },
    {
      id: 'velvet_booth_marker',
      name: 'Initialed Reserve Booth Credit Card',
      shortLabel: 'reserve booth card',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged beneath the proprietor’s mahogany check desk',
      itemFeature: 'a cream house-credit card crumpled at one corner'
    }
  ],
  st_judes: [
    {
      id: 'stjudes_pewter_case',
      name: 'Engraved Vestry Match-Safe & Thread',
      shortLabel: 'vestry match-safe',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'caught against the wrought-iron belfry stair gate',
      itemFeature: 'a tarnished pewter vesta matchbox dented on the lid'
    },
    {
      id: 'stjudes_hymn_marker',
      name: 'Initialed Leather Prayer-Book Clasp',
      shortLabel: 'prayer-book clasp',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'resting on the beeswax-dripped votive shelf',
      itemFeature: 'a gilded leather bookmark clip bearing wax spatters'
    },
    {
      id: 'stjudes_sacristy_slip',
      name: 'Signed Sacristy Stewardship Note',
      shortLabel: 'sacristy stewardship note',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped inside the vestry oak sacristy blotter',
      itemFeature: 'a folded parish pledge slip creased with hurried ink lines'
    }
  ],
  blackwood_antiquities: [
    {
      id: 'blackwood_brass_loupe',
      name: 'Monogrammed Jeweler’s Brass Loupe',
      shortLabel: 'jeweler’s brass loupe',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'dropped beside the velvet-lined heirloom vitrine',
      itemFeature: 'a folding ten-power brass magnifier smeared near the lens ring'
    },
    {
      id: 'blackwood_consign_stub',
      name: 'Initialed Estate Appraisal Tag & Thread',
      shortLabel: 'estate appraisal tag',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'impaled beside the appraiser’s consignment spindle',
      itemFeature: 'a reinforced linen auction tag torn sharply along the perforation'
    },
    {
      id: 'blackwood_shutter_pin',
      name: 'Engraved Silver Tie-Bar & Cloth Fiber',
      shortLabel: 'engraved tie-bar',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'jammed beneath the vault alley shutter bar',
      itemFeature: 'a ribbed sterling clasp bent slightly out of true'
    }
  ],
  pier_four: [
    {
      id: 'pier_locker_tag',
      name: 'Stamped Boathouse Locker Brass Tag',
      shortLabel: 'boathouse locker tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'tangled in the boathouse padlock chain by Slip 4',
      itemFeature: 'a salt-pitted brass locker disc with fresh file marks'
    },
    {
      id: 'pier_watch_fob',
      name: 'Initialed Brass Watch-Fob & Oilskin Lint',
      shortLabel: 'brass watch-fob',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged between the coiled hemp hawsers and barrels',
      itemFeature: 'a pocket-watch chain clasp coated in dry dockside tar'
    },
    {
      id: 'pier_wharf_chit',
      name: 'Signed Motor-Launch Berth Voucher',
      shortLabel: 'launch berth voucher',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'pinned under the dockmaster’s oilskin tally stand',
      itemFeature: 'a damp wharf-fee slip folded neatly into quarters'
    }
  ],
  pendelton_clinic: [
    {
      id: 'clinic_lancet_case',
      name: 'Engraved Steel Pocket Case & Thread',
      shortLabel: 'steel pocket case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'resting behind the chromium sterilizer basin',
      itemFeature: 'a slim brushed-steel pocket case smelling faintly of carbolic'
    },
    {
      id: 'clinic_rx_folio',
      name: 'Initialed Dispensary Prescription Carbon',
      shortLabel: 'prescription carbon',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'caught inside the glass dispensary case archive',
      itemFeature: 'a perforated apothecary carbon slip inked in brisk shorthand'
    },
    {
      id: 'clinic_pen_clip',
      name: 'Monogrammed Gold Pen Cap & Fiber',
      shortLabel: 'monogrammed pen cap',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'dropped beside the ambulance yard rear door latch',
      itemFeature: 'a rolled-gold fountain pen barrel chipped near the pocket clip'
    }
  ],
  clarion_newsroom: [
    {
      id: 'clarion_press_pass',
      name: 'Initialed Press Gallery Credential Holder',
      shortLabel: 'press credential holder',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped underneath the night editor’s copy desk',
      itemFeature: 'a worn calfskin credential wallet stamped with press ink'
    },
    {
      id: 'clarion_pencil_holder',
      name: 'Engraved Silver Copy-Pencil Case',
      shortLabel: 'silver copy-pencil case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'lodged between the olive-steel morgue clipping drawers',
      itemFeature: 'a hexagonal silver mechanical pencil cracked near the clip'
    },
    {
      id: 'clarion_chute_pin',
      name: 'Monogrammed Brass Cuff Button & Thread',
      shortLabel: 'monogrammed cuff button',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'caught against the newsprint loading chute fire door',
      itemFeature: 'a heavy brass cuff stud nicked along the shank'
    }
  ],
  central_railway: [
    {
      id: 'railway_ticket_wallet',
      name: 'Monogrammed Leather Ticket Wallet',
      shortLabel: 'leather ticket wallet',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'left beside the station master’s telegraph ledge',
      itemFeature: 'a stitched morocco ticket holder creased around a sleeper stub'
    },
    {
      id: 'railway_pocket_watch',
      name: 'Engraved Brass Pocket-Watch Bezel & Fiber',
      shortLabel: 'pocket-watch bezel',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'dropped by the Track 9 parcel platform iron wicket',
      itemFeature: 'a snapped brass watch-case lid scratched by iron bars'
    },
    {
      id: 'railway_urn_comb',
      name: 'Initialed Tortoiseshell Pocket Comb',
      shortLabel: 'tortoiseshell pocket comb',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged alongside the brass waiting-bench sand urn',
      itemFeature: 'a silver-backed pocket comb stained with soot'
    }
  ],
  blue_dahlia_club: [
    {
      id: 'dahlia_cloak_tag',
      name: 'Engraved Brass Coatroom Number Plate',
      shortLabel: 'brass coatroom plate',
      category: 'physical',
      preferredSpots: ['leadSpot', 'exitSpot'],
      recoverySpotDetail: 'tucked beneath the cloakroom claim counter match-tray',
      itemFeature: 'a heavy indigo-enameled brass coat tag bent at the eyelet'
    },
    {
      id: 'dahlia_compact',
      name: 'Monogrammed Silver Case & Cloth Trace',
      shortLabel: 'monogrammed silver case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'wedged deep in the Velvet Booth Seven cushion seam',
      itemFeature: 'a slim engraved silver pocket case dusted with face powder and gin'
    },
    {
      id: 'dahlia_supper_chit',
      name: 'Initialed Supper-Club Bottle Chit',
      shortLabel: 'supper-club bottle chit',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'clipped behind the head waiter’s booth ledger',
      itemFeature: 'a folded cellar-reserve check bearing penciled figures'
    }
  ],
  boxing_gym: [
    {
      id: 'gym_stopwatch',
      name: 'Engraved Cornerman’s Stopwatch & Thread',
      shortLabel: 'engraved stopwatch',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'dropped under the trainer’s tape and liniment bench',
      itemFeature: 'a nickel-plated split-second timer dusted with rosin chalk'
    },
    {
      id: 'gym_locker_disc',
      name: 'Stamped Brass Shower-Locker Key Tag',
      shortLabel: 'locker key tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'caught against the shower alley fire-escape door',
      itemFeature: 'a numbered brass locker fob smeared with damp rust'
    },
    {
      id: 'gym_bout_slip',
      name: 'Initialed Ring-Purse Advance Slip',
      shortLabel: 'ring-purse slip',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'tucked inside the promoter’s bout ledger',
      itemFeature: 'a creased carbon payout ticket inked in hurried strokes'
    }
  ],
  service_alley: [
    {
      id: 'service_alley_case',
      name: 'Scuffed Silver Cigarette Case & Fiber',
      shortLabel: 'silver cigarette case',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'caught on the rusted iron fire-escape drop ladder',
      itemFeature: 'a rain-streaked silver case dented along the hinge'
    },
    {
      id: 'service_alley_key',
      name: 'Initialed Brass Cut-Through Gate Key',
      shortLabel: 'brass gate key',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'resting beside the dented galvanized ash-barrel',
      itemFeature: 'a tagged brass padlock key stained with wet cinders'
    },
    {
      id: 'service_alley_docket',
      name: 'Signed Loading-Dock Parcel Stub',
      shortLabel: 'loading-dock parcel stub',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'stuffed inside the rusted loading-dock delivery box',
      itemFeature: 'a damp brown parcel voucher torn along its perforated stub'
    }
  ],
  cobblestone_alley: [
    {
      id: 'cobble_lighter',
      name: 'Engraved Brass Trench Lighter & Thread',
      shortLabel: 'brass trench lighter',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'wedged beside the tenement courtyard iron gate',
      itemFeature: 'a heavy cylindrical brass pocket lighter smudged with grate mud'
    },
    {
      id: 'cobble_sign_card',
      name: 'Initialed Stage-Door Call Card',
      shortLabel: 'stage-door call card',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'tucked inside the rear stage-door patrol call box',
      itemFeature: 'a rain-buckled calling card scribbled on the reverse'
    },
    {
      id: 'cobble_cufflink',
      name: 'Monogrammed Onyx Cufflink & Fiber',
      shortLabel: 'onyx cufflink',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'snagged on the overflowing storm grate by the crates',
      itemFeature: 'a square gold-mounted black onyx stud bent at the swivel bar'
    }
  ],
  city_morgue: [
    {
      id: 'morgue_drawer_tag',
      name: 'Stamped Cold-Storage Brass Tag & Fiber',
      shortLabel: 'cold-storage brass tag',
      category: 'physical',
      preferredSpots: ['recordSpot', 'exitSpot'],
      recoverySpotDetail: 'slipped beside the coroner’s cold-storage drawer rack',
      itemFeature: 'a numbered brass specimen tag nicked at the stamping ring'
    },
    {
      id: 'morgue_pocket_loupe',
      name: 'Engraved Pathologist’s Silver Penlight',
      shortLabel: 'silver penlight',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'tucked behind the enamel scrub sink towel bin',
      itemFeature: 'a slim chrome pocket torch smelling of formalin'
    },
    {
      id: 'morgue_effects_slip',
      name: 'Initialed Personal-Effects Claim Carbon',
      shortLabel: 'effects claim carbon',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged inside the personal-effects brass wire cage',
      itemFeature: 'a yellow triplicate release receipt torn cleanly at the staple'
    }
  ],
  riverside_chapel: [
    {
      id: 'chapel_rosary_case',
      name: 'Monogrammed Silver Keepsake Box',
      shortLabel: 'silver keepsake box',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'left along the dark oak confessional kneeler shelf',
      itemFeature: 'a palm-sized silver pillbox etched with worn scrollwork'
    },
    {
      id: 'chapel_vestry_key',
      name: 'Initialed Brass Vestry Porch Key',
      shortLabel: 'vestry porch key',
      category: 'physical',
      preferredSpots: ['exitSpot', 'recordSpot'],
      recoverySpotDetail: 'caught against the salt-weathered vestry side porch latch',
      itemFeature: 'an antique brass warded key tied with faded ribbon'
    },
    {
      id: 'chapel_alms_envelope',
      name: 'Signed Parish Alms & Errand Envelope',
      shortLabel: 'parish errand envelope',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'slipped underneath the narthex poor-box pamphlet stack',
      itemFeature: 'a stiff cream parish envelope sealed and slit open sharply'
    }
  ],
  fish_market: [
    {
      id: 'fish_tally_knife',
      name: 'Initialed Horn-Handled Pocket Clasp',
      shortLabel: 'horn pocket clasp',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'wedged between the dripping salted cedar herring crates',
      itemFeature: 'a small folding dock tally knife crusted with coarse brine'
    },
    {
      id: 'fish_brass_token',
      name: 'Stamped Quay Stall Brass Credit Disc',
      shortLabel: 'quay brass token',
      category: 'physical',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'dangling near the auctioneer’s brass weigh-scale hook',
      itemFeature: 'a notched brass wholesale token threaded on dark twine'
    },
    {
      id: 'fish_credit_chit',
      name: 'Monogrammed Wholesaler Credit Slip',
      shortLabel: 'wholesaler credit slip',
      category: 'document',
      preferredSpots: ['recordSpot', 'exitSpot'],
      recoverySpotDetail: 'tucked inside the market inspector’s stall blotter',
      itemFeature: 'a salt-waved carbon receipt torn from an auction book'
    }
  ],
  dry_dock: [
    {
      id: 'drydock_badge',
      name: 'Stamped Brass Shipyard Pass & Thread',
      shortLabel: 'shipyard pass',
      category: 'physical',
      preferredSpots: ['exitSpot', 'recordSpot'],
      recoverySpotDetail: 'snagged in the yard chain-link slip gate latch',
      itemFeature: 'a circular brass dockyard gate token smeared with red primer'
    },
    {
      id: 'drydock_caliper',
      name: 'Engraved Steel Pocket Rule & Fiber',
      shortLabel: 'steel pocket rule',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'resting atop the dented rivet drum beneath keel timbers',
      itemFeature: 'a folding six-inch machinist rule dulled with axle grease'
    },
    {
      id: 'drydock_winch_slip',
      name: 'Initialed Winch-House Shift Carbon',
      shortLabel: 'winch-house carbon',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'clipped behind the winch-house clipboard hook',
      itemFeature: 'a grease-thumbprinted dispatch carbon noting evening clearance'
    }
  ],
  harbor_warehouse: [
    {
      id: 'warehouse_seal_tag',
      name: 'Monogrammed Customs Bond Key Tag',
      shortLabel: 'customs bond tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'jammed beneath the loading bay iron cargo hatch',
      itemFeature: 'a stamped copper crate key tag bent near the eyelet'
    },
    {
      id: 'warehouse_flask',
      name: 'Engraved Pewter Hip Flask & Twine',
      shortLabel: 'pewter hip flask',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'tucked inside the splintered burlap customs bins',
      itemFeature: 'a dented pewter flask wrapped once in parcel twine'
    },
    {
      id: 'warehouse_gate_stub',
      name: 'Initialed Watchman’s Gate-Pass Carbon',
      shortLabel: 'gate-pass carbon',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged beside the night watchman’s desk clock',
      itemFeature: 'a numbered dock gate slip signed hurriedly in fountain ink'
    }
  ],
  union_hall: [
    {
      id: 'union_dues_book',
      name: 'Initialed Local 88 Dues Wallet & Fiber',
      shortLabel: 'dues wallet',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped behind the steward’s stamped dues binders',
      itemFeature: 'a burgundy leather membership booklet torn at the corner'
    },
    {
      id: 'union_lapel_pin',
      name: 'Engraved Brass Union Lapel Badge',
      shortLabel: 'union lapel badge',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'fallen beside the dripping brass hat-stand by the radiator',
      itemFeature: 'an enameled brass brotherhood pin bent at the clasp'
    },
    {
      id: 'union_pocket_case',
      name: 'Monogrammed Chrome Cigarette Holder',
      shortLabel: 'chrome cigarette holder',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'wedged near the scuffed rear brick stairwell door',
      itemFeature: 'a flat spring-latch tobacco case bearing fresh rain spots'
    }
  ],
  tenement_court: [
    {
      id: 'tenement_latch_key',
      name: 'Tagged Brass Courtyard Gate Key',
      shortLabel: 'courtyard gate key',
      category: 'physical',
      preferredSpots: ['exitSpot', 'recordSpot'],
      recoverySpotDetail: 'caught on the third-floor iron fire-escape landing',
      itemFeature: 'a notched brass cylinder key tied to a cardboard fob'
    },
    {
      id: 'tenement_rent_stub',
      name: 'Initialed Rent & Errand Receipt Stub',
      shortLabel: 'rent receipt stub',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'fallen beneath the dented brass vestibule mailboxes',
      itemFeature: 'a folded carbon payment receipt stamped with landlord ink'
    },
    {
      id: 'tenement_knife_fob',
      name: 'Engraved Nickel Pocket Penknife',
      shortLabel: 'nickel pocket penknife',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'tucked beside the galvanized ash pit and wringer tubs',
      itemFeature: 'a slim two-blade pocket knife etched along the silver bolster'
    }
  ],
  city_hall: [
    {
      id: 'cityhall_vault_token',
      name: 'Monogrammed Archive Vault Brass Pass',
      shortLabel: 'archive vault pass',
      category: 'physical',
      preferredSpots: ['exitSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged beneath the basement archive heavy oak door',
      itemFeature: 'an octagonal municipal vault token rubbed bright at the edges'
    },
    {
      id: 'cityhall_notary_pen',
      name: 'Engraved Ivory-Trimmed Clerk Pen',
      shortLabel: 'ivory-trimmed pen',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'fallen inside the rolling oak tax-form trolley',
      itemFeature: 'a sleek fountain pen bearing dried purple notary ink'
    },
    {
      id: 'cityhall_tube_slip',
      name: 'Initialed Pneumatic Call Slip & Fiber',
      shortLabel: 'pneumatic call slip',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'jammed beside the public counter brass tube tray',
      itemFeature: 'a rolled manila clerk requisition carbon frayed at one edge'
    }
  ],
  starlight_radio: [
    {
      id: 'radio_studio_pass',
      name: 'Initialed Studio B Visitor Pass & Thread',
      shortLabel: 'studio visitor pass',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'tucked beneath the control-room engineer’s cue ledger',
      itemFeature: 'a stamped green broadcast clearance slip torn near the hole'
    },
    {
      id: 'radio_silver_compact',
      name: 'Monogrammed Brushed-Nickel Case',
      shortLabel: 'brushed-nickel case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'slipped beneath the green-room linoleum coffee table',
      itemFeature: 'a slim pocket case smudged with grease pencil and coffee'
    },
    {
      id: 'radio_stair_cufflink',
      name: 'Engraved Microphone-Crest Tie Clip',
      shortLabel: 'engraved tie clip',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'caught against the acoustic seal door to the freight hall',
      itemFeature: 'a gold-plated spring tie clasp sprung slightly at the hinge'
    }
  ],
  trinity_baptist: [
    {
      id: 'trinity_alms_clip',
      name: 'Engraved Brass Alms-Tray Clip & Fiber',
      shortLabel: 'brass alms clip',
      category: 'physical',
      preferredSpots: ['leadSpot', 'discardSpot'],
      recoverySpotDetail: 'resting beside the narthex brass alms plate',
      itemFeature: 'a polished brass money clip sprung open along the tension arm'
    },
    {
      id: 'trinity_vestry_book',
      name: 'Initialed Pocket Testament & Note',
      shortLabel: 'pocket testament',
      category: 'document',
      preferredSpots: ['recordSpot', 'discardSpot'],
      recoverySpotDetail: 'wedged beside the deacon’s vestry benevolence ledger',
      itemFeature: 'a black morocco pocket book carrying an urgent penciled margin'
    },
    {
      id: 'trinity_gate_fob',
      name: 'Monogrammed Iron Gate Key Ring',
      shortLabel: 'gate key ring',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'dropped along the north churchyard wrought-iron gate',
      itemFeature: 'a stamped brass keyring bent from forceful pulling'
    }
  ],
  golden_crust_bakery: [
    {
      id: 'bakery_dough_token',
      name: 'Stamped Brass Route-Driver Token',
      shortLabel: 'route-driver token',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'dusted with white wheat flour near the alley delivery hatch',
      itemFeature: 'an embossed brass wholesale crate disc coated in pastry flour'
    },
    {
      id: 'bakery_invoice_stub',
      name: 'Initialed Wholesale Order Carbon',
      shortLabel: 'wholesale order carbon',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'impaled beside the brass cash register order spike',
      itemFeature: 'a grease-spotted parchment order sheet torn off hurriedly'
    },
    {
      id: 'bakery_pocket_watch',
      name: 'Monogrammed Silver Pocket Case & Dust',
      shortLabel: 'silver pocket case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'tucked behind the tin-lined flour bins and canvas aprons',
      itemFeature: 'a compact pocket holder powdered in fine baker’s flour'
    }
  ],
  silver_spoon_diner: [
    {
      id: 'diner_phone_notebook',
      name: 'Initialed Pocket Address Pad & Fiber',
      shortLabel: 'pocket address pad',
      category: 'document',
      preferredSpots: ['leadSpot', 'discardSpot'],
      recoverySpotDetail: 'wedged inside the Wurlitzer jukebox payphone shelf',
      itemFeature: 'a vinyl-bound pocket notebook stained with cold coffee rings'
    },
    {
      id: 'diner_chrome_case',
      name: 'Engraved Chrome Cigarette Case',
      shortLabel: 'chrome cigarette case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'slipped between the cracked scarlet rear vinyl booth cushions',
      itemFeature: 'an art-deco striped chrome case dented along the thumb latch'
    },
    {
      id: 'diner_counter_key',
      name: 'Monogrammed Brass Till Key & Thread',
      shortLabel: 'brass till key',
      category: 'physical',
      preferredSpots: ['recordSpot', 'exitSpot'],
      recoverySpotDetail: 'dropped behind the chrome pie dome check spindle',
      itemFeature: 'a flat brass lock key attached to an etched metal fob'
    }
  ],
  harborview_restaurant: [
    {
      id: 'harborview_cigar_cutter',
      name: 'Monogrammed Silver Cigar Cutter',
      shortLabel: 'silver cigar cutter',
      category: 'physical',
      preferredSpots: ['leadSpot', 'discardSpot'],
      recoverySpotDetail: 'resting beside the lobby humidor brass-numbered coat tags',
      itemFeature: 'a scissor-blade silver cigar clipper bearing dry tobacco dust'
    },
    {
      id: 'harborview_banquet_card',
      name: 'Initialed Private-Dining Ledger Card',
      shortLabel: 'private-dining card',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped inside the maitre d’s rosewood reservation lectern',
      itemFeature: 'a gilt-edged seating card bearing hurried pencil annotations'
    },
    {
      id: 'harborview_cellar_tag',
      name: 'Engraved Brass Reserve-Bottle Neck Tag',
      shortLabel: 'bottle neck tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'caught against the swinging brass pantry service door',
      itemFeature: 'a chained brass cellar tag scratched along the stamped numeral'
    }
  ],
  rosie_deli: [
    {
      id: 'deli_scale_weight',
      name: 'Engraved Brass Grocer’s Pocket Token',
      shortLabel: 'brass pocket token',
      category: 'physical',
      preferredSpots: ['recordSpot', 'discardSpot'],
      recoverySpotDetail: 'tucked beside the butcher’s brass scale and waxed paper stack',
      itemFeature: 'a small milled brass counter disc stained faintly with brine'
    },
    {
      id: 'deli_credit_slip',
      name: 'Initialed Butcher-Paper Credit Slip',
      shortLabel: 'butcher-paper credit slip',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'pinned below the storefront window chalkboard route rack',
      itemFeature: 'a torn square of brown butcher wrapping inked with figures'
    },
    {
      id: 'deli_pocket_knife',
      name: 'Monogrammed Bone-Handle Folding Knife',
      shortLabel: 'bone folding knife',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'dropped beside the bolted timber alley crate-yard door',
      itemFeature: 'a two-inch pocket clasp knife smeared with sawdust and oil'
    }
  ],
  crimson_cabaret: [
    {
      id: 'cabaret_dressing_case',
      name: 'Engraved Gilt Vanity Compact & Thread',
      shortLabel: 'gilt vanity case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'tucked beneath the star’s bulb-lined dressing mirror',
      itemFeature: 'a thin gilded pocket case dusted with rouge powder'
    },
    {
      id: 'cabaret_vip_stub',
      name: 'Initialed Velvet Coatroom Duplicate Stub',
      shortLabel: 'coatroom duplicate stub',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged under the doorman’s discreet champagne ledger',
      itemFeature: 'a pink numbered cloakroom carbon signed in wet fountain ink'
    },
    {
      id: 'cabaret_stage_key',
      name: 'Monogrammed Brass Stage-Door Tag',
      shortLabel: 'stage-door brass tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'snagged beside the poorly bolted steel stage-door latch',
      itemFeature: 'a stamped brass pass key ring bent open at the split wire'
    }
  ],
  copper_kettle_tavern: [
    {
      id: 'tavern_tap_token',
      name: 'Stamped Copper Taproom House Check',
      shortLabel: 'copper house check',
      category: 'physical',
      preferredSpots: ['discardSpot', 'recordSpot'],
      recoverySpotDetail: 'fallen beside the dark wainscoting and spittoon corner',
      itemFeature: 'a heavy hammered copper trade token notched along the lip'
    },
    {
      id: 'tavern_phone_note',
      name: 'Initialed Payphone Scratch-Pad Tear',
      shortLabel: 'payphone scratch tear',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged inside the smoke-stained taproom telephone booth',
      itemFeature: 'a dog-eared pad sheet torn cleanly along the top staple'
    },
    {
      id: 'tavern_bulkhead_lighter',
      name: 'Engraved Brass Storm Lighter & Fiber',
      shortLabel: 'brass storm lighter',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'caught against the beer-keg alley bulkhead hinges',
      itemFeature: 'a tarnished wind-shielded lighter smudged with cellar soot'
    }
  ],
  mercer_apothecary: [
    {
      id: 'apothecary_pillbox',
      name: 'Monogrammed Silver Pillbox & Cloth Trace',
      shortLabel: 'silver pillbox',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'slipped behind the marble compounding cylinders',
      itemFeature: 'a hinged silver apothecary box holding fine white dust'
    },
    {
      id: 'apothecary_poison_stub',
      name: 'Initialed State Compound Ledger Carbon',
      shortLabel: 'compound ledger carbon',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'tucked inside the locked state poison & Rx register',
      itemFeature: 'a violet-inked dispensary carbon torn neatly from the spine'
    },
    {
      id: 'apothecary_keytag',
      name: 'Engraved Amber-Cabinet Key Tag',
      shortLabel: 'cabinet key tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged beside the dispensary rear courtyard door crates',
      itemFeature: 'a small brass locker tag tarnished along the key hole'
    }
  ],
  savile_tailors: [
    {
      id: 'tailor_shear_tag',
      name: 'Initialed Bespoke Fitting Card & Swatch',
      shortLabel: 'bespoke fitting card',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped inside the master cutter’s measurement ledger',
      itemFeature: 'a stiff manila pattern card pinned with a dark fabric snippet'
    },
    {
      id: 'tailor_silver_thimble',
      name: 'Monogrammed Gold-Plated Lapel Stud',
      shortLabel: 'gold-plated lapel stud',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'fallen beside the wicker wool-scrap bin and iron stand',
      itemFeature: 'a precision-milled coat stud wrapped in fresh tailored wool'
    },
    {
      id: 'tailor_rack_check',
      name: 'Engraved Brass Coat-Rail Claim Tag',
      shortLabel: 'coat-rail claim tag',
      category: 'physical',
      preferredSpots: ['leadSpot', 'exitSpot'],
      recoverySpotDetail: 'caught against the workroom oak alteration alley door',
      itemFeature: 'a stamped brass hanger check scratched by heavy hangers'
    }
  ],
  marigold_florist: [
    {
      id: 'florist_ribbon_knife',
      name: 'Engraved Nickel Stem Knife & Thread',
      shortLabel: 'nickel stem knife',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'resting beside the copper cutting trough and pruners',
      itemFeature: 'a slim folding florist’s knife stained with cedar sap'
    },
    {
      id: 'florist_enclosure_card',
      name: 'Initialed Mourning-Ribbon Enclosure Card',
      shortLabel: 'enclosure card',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged inside the corsage counter dispatch wire rack',
      itemFeature: 'a water-spotted cream enclosure card creased sharply in half'
    },
    {
      id: 'florist_glasshouse_key',
      name: 'Monogrammed Brass Conservatory Key Fob',
      shortLabel: 'conservatory key fob',
      category: 'physical',
      preferredSpots: ['exitSpot', 'recordSpot'],
      recoverySpotDetail: 'snagged under the steamed glasshouse rear latch door',
      itemFeature: 'a damp moss-smudged brass fob scratched at the collar'
    }
  ],
  ace_pawnshop: [
    {
      id: 'pawn_silver_case',
      name: 'Monogrammed Silver Case & Pledge Cord',
      shortLabel: 'monogrammed silver case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'tucked inside the watchmaker’s felt-lined silverware tray',
      itemFeature: 'an engraved pocket case tagged loosely with faded pink string'
    },
    {
      id: 'pawn_pink_ticket',
      name: 'Initialed Pink Pledge Duplicate #742',
      shortLabel: 'pink pledge duplicate',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'clipped underneath the steel cashbox serial ledger',
      itemFeature: 'a perforated pawn ticket smudged with fresh counter ink'
    },
    {
      id: 'pawn_cage_key',
      name: 'Engraved Brass Valuables-Cage Key',
      shortLabel: 'valuables-cage key',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged behind the barred steel pawn-cage back door',
      itemFeature: 'a flat milled lock key scarred by fresh teeth marks'
    }
  ],
  crown_barbershop: [
    {
      id: 'barber_tonic_cap',
      name: 'Monogrammed Silver Shaving-Brush Case',
      shortLabel: 'shaving-brush case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'fallen beside the blue Barbicide counter and linen chute',
      itemFeature: 'a screw-top travel cylinder smelling sharply of bay rum'
    },
    {
      id: 'barber_chair_ticket',
      name: 'Initialed Shoe-Shine & Valet Call Slip',
      shortLabel: 'valet call slip',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'impaled on the appointment ledger beside Chair Two',
      itemFeature: 'a lather-smudged barber slip scribbled with a late hour'
    },
    {
      id: 'barber_coat_check',
      name: 'Engraved Brass Hat-Tree Claim Pin',
      shortLabel: 'hat-tree claim pin',
      category: 'physical',
      preferredSpots: ['leadSpot', 'exitSpot'],
      recoverySpotDetail: 'snagged near the narrow oak alley supply closet door',
      itemFeature: 'a tarnished brass coat pin bent sharply at the clasp'
    }
  ],
  continental_bank: [
    {
      id: 'bank_box_key',
      name: 'Stamped Safe-Deposit Box Guard Key #219',
      shortLabel: 'safe-deposit guard key',
      category: 'physical',
      preferredSpots: ['recordSpot', 'exitSpot'],
      recoverySpotDetail: 'slipped beside the bronze vault access logbook grille',
      itemFeature: 'a numbered flat bronze deposit key worn bright at the bow'
    },
    {
      id: 'bank_wire_carbon',
      name: 'Initialed Teller Wire Carbon & Seal',
      shortLabel: 'teller wire carbon',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'tucked under the Teller Window #3 brass blotter stand',
      itemFeature: 'a blue carbon transfer receipt stamped late in the afternoon'
    },
    {
      id: 'bank_booth_pen',
      name: 'Monogrammed Onyx & Gold Desk Pen',
      shortLabel: 'monogrammed gold pen',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'dropped in the velvet-curtained coupon clipping booth',
      itemFeature: 'a heavy gold-filled pocket pen nicked against marble'
    }
  ],
  liberty_theater: [
    {
      id: 'theater_opera_glass',
      name: 'Engraved Mother-of-Pearl Pocket Glass',
      shortLabel: 'pearl pocket glass',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged beside the balcony brass candy counter',
      itemFeature: 'a compact folding opera lens case bearing dark fingerprints'
    },
    {
      id: 'theater_ticket_wallet',
      name: 'Initialed Box-Office Stub & Memo Card',
      shortLabel: 'box-office memo card',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped beside the numbered box-office ticket reels',
      itemFeature: 'a purple matinee ticket stub annotated hurriedly in ink'
    },
    {
      id: 'theater_crash_pin',
      name: 'Monogrammed Brass Watch-Chain Clasp',
      shortLabel: 'watch-chain clasp',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'caught against the red-lit alley crash-bar exit door',
      itemFeature: 'a spring-ring brass chain clasp snapped out of alignment'
    }
  ],
  precinct_four: [
    {
      id: 'precinct_property_tag',
      name: 'Stamped Evidence-Cage Brass Tag',
      shortLabel: 'evidence-cage tag',
      category: 'physical',
      preferredSpots: ['leadSpot', 'exitSpot'],
      recoverySpotDetail: 'dropped beneath the evidence clerk’s wired shelving',
      itemFeature: 'a numbered brass lock-tag tied with frayed parcel cord'
    },
    {
      id: 'precinct_bail_carbon',
      name: 'Initialed Watch-Desk Carbon Receipt',
      shortLabel: 'watch-desk carbon',
      category: 'document',
      preferredSpots: ['recordSpot', 'discardSpot'],
      recoverySpotDetail: 'pulled from the squad-room teletype wire wastebasket',
      itemFeature: 'a smudged police carbon slip torn across the lower line'
    },
    {
      id: 'precinct_badge_wallet',
      name: 'Monogrammed Calfskin Pocket Case',
      shortLabel: 'calfskin pocket case',
      category: 'physical',
      preferredSpots: ['exitSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged near the brick sally-port patrol-wagon alley gate',
      itemFeature: 'a slim black leather card wallet scuffed along the fold'
    }
  ],
  public_library: [
    {
      id: 'library_brass_bookmark',
      name: 'Engraved Brass Foliation Bookmark',
      shortLabel: 'brass bookmark',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'slipped beside the bound newspaper rack magnifiers',
      itemFeature: 'a thin engraved brass page-clip scratched at the tip'
    },
    {
      id: 'library_call_slip',
      name: 'Initialed Atlas Reference Call Ticket',
      shortLabel: 'atlas call ticket',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'tucked inside the oak catalog card drawer cabinet',
      itemFeature: 'a stamped reference circulation slip smudged with thumb ink'
    },
    {
      id: 'library_bindery_key',
      name: 'Monogrammed Bindery Stair Key Tag',
      shortLabel: 'bindery key tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'dropped near the rear book-bindery oak service exit',
      itemFeature: 'an oil-rubbed brass locker tag nicked along the bezel'
    }
  ],
  post_office: [
    {
      id: 'post_wax_seal',
      name: 'Monogrammed Brass Wax-Seal Stamp',
      shortLabel: 'brass wax-seal stamp',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'rolling beneath the wax-seal and wrapping-twine sorting bin',
      itemFeature: 'a turned mahogany-and-brass signet smudged with red wax'
    },
    {
      id: 'post_wire_receipt',
      name: 'Initialed Registered-Wire Dispatch Slip',
      shortLabel: 'registered-wire slip',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'wedged inside the registered mail & telegraph counter tray',
      itemFeature: 'a yellow Western Union carbon stamped with postal time'
    },
    {
      id: 'post_pouch_tag',
      name: 'Stamped Mail-Sack Brass Buckle & Thread',
      shortLabel: 'mail-sack brass buckle',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'caught against the steel roll-up mail-truck loading door',
      itemFeature: 'a heavy brass strap clasp scraped bright along the tongue'
    }
  ],
  bus_depot: [
    {
      id: 'depot_locker_key',
      name: 'Stamped Bayside Locker Key #9 & Fiber',
      shortLabel: 'locker key #9',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'fallen beside the glass coach-bay departure gate',
      itemFeature: 'a heavy brass coin-locker key bent slightly along the neck'
    },
    {
      id: 'depot_claim_stub',
      name: 'Initialed Express Baggage Claim Stub',
      shortLabel: 'baggage claim stub',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged beneath the parcel express counter wire shelf',
      itemFeature: 'a yellow perforated coach ticket bearing hurried handwriting'
    },
    {
      id: 'depot_trench_case',
      name: 'Engraved Nickel Match-Safe & Ash',
      shortLabel: 'nickel match-safe',
      category: 'physical',
      preferredSpots: ['discardSpot', 'recordSpot'],
      recoverySpotDetail: 'tucked beside the cast-iron concourse waiting-bench ash can',
      itemFeature: 'a pocket matchbox holder streaked with diesel soot'
    }
  ],
  taxi_garage: [
    {
      id: 'garage_hack_badge',
      name: 'Stamped Brass Hack-License Plate & Fiber',
      shortLabel: 'hack-license plate',
      category: 'physical',
      preferredSpots: ['leadSpot', 'exitSpot'],
      recoverySpotDetail: 'caught in the slotted metal night-driver timecard rack',
      itemFeature: 'a notched brass medallion smeared with dark chassis grease'
    },
    {
      id: 'garage_dispatch_chit',
      name: 'Initialed Radio-Call Fare Chit',
      shortLabel: 'radio-call fare chit',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped underneath the dispatcher’s steel fare clipboard',
      itemFeature: 'an oil-spotted cab voucher torn roughly from a fare pad'
    },
    {
      id: 'garage_pocket_wrench',
      name: 'Engraved Chrome Ignition-Key Tag',
      shortLabel: 'ignition-key tag',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'resting on the mechanic’s oily rag drum beside Bay #4',
      itemFeature: 'a monogrammed chrome key-ring smudged with axle grease'
    }
  ],
  foundry_works: [
    {
      id: 'foundry_brass_check',
      name: 'Stamped Steelworker’s Brass Tool Check',
      shortLabel: 'brass tool check',
      category: 'physical',
      preferredSpots: ['recordSpot', 'exitSpot'],
      recoverySpotDetail: 'dropped inside the foundry master’s soot-rimmed hut',
      itemFeature: 'a numbered hexagonal brass tool disc coated in gray cinder'
    },
    {
      id: 'foundry_lading_carbon',
      name: 'Initialed Freight-Siding Lading Carbon',
      shortLabel: 'freight-siding carbon',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged beside the shipping weigh-bridge chalkboard',
      itemFeature: 'a soot-smudged bill-of-lading slip torn near the corner'
    },
    {
      id: 'foundry_steel_case',
      name: 'Engraved Gunmetal Tobacco Box & Thread',
      shortLabel: 'gunmetal tobacco box',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'tucked beside the sand-casting pit and clinker slag drum',
      itemFeature: 'a brushed-steel pocket box dusted with foundry soot'
    }
  ],
  textile_mill: [
    {
      id: 'mill_dye_card',
      name: 'Initialed Worsted Dye-Lot Swatch Card',
      shortLabel: 'dye-lot swatch card',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped inside the dye-master’s sample binder desk',
      itemFeature: 'a numbered mill batch card stapled with dark worsted yarn'
    },
    {
      id: 'mill_brass_shuttle',
      name: 'Monogrammed Brass Loom Key & Bobbin',
      shortLabel: 'brass loom key',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'wedged inside the rolling canvas spindle and bobbin tub',
      itemFeature: 'a polished brass pocket key coiled with fine wool thread'
    },
    {
      id: 'mill_hoist_tag',
      name: 'Engraved Copper Bale-Tag & Lint',
      shortLabel: 'copper bale-tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'caught against the timber bale-hoist canal loading door',
      itemFeature: 'a stamped copper shipping tag flecked with canal damp'
    }
  ],
  botanical_conservatory: [
    {
      id: 'conservatory_brass_tag',
      name: 'Stamped Brass Specimen Stake & Thread',
      shortLabel: 'brass specimen stake',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'wedged between muddy clay shards on the potting bench',
      itemFeature: 'a narrow engraved brass plant marker stained with peat'
    },
    {
      id: 'conservatory_shed_key',
      name: 'Monogrammed Copper Potting-Shed Key',
      shortLabel: 'potting-shed key',
      category: 'physical',
      preferredSpots: ['recordSpot', 'exitSpot'],
      recoverySpotDetail: 'dropped near the north conservatory frosted iron gate',
      itemFeature: 'a verdigris-rimmed copper key spotted with greenhouse damp'
    },
    {
      id: 'conservatory_seed_slip',
      name: 'Initialed Botanical Specimen Ledger Slip',
      shortLabel: 'specimen ledger slip',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'tucked inside the painted ticketing kiosk map stand',
      itemFeature: 'a penciled greenhouse log tear marked with humid smudges'
    }
  ],
  civic_cemetery: [
    {
      id: 'cemetery_vault_key',
      name: 'Engraved Bronze Mausoleum Key & Mud',
      shortLabel: 'bronze mausoleum key',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'wedged beside the squeaking north iron carriage gate',
      itemFeature: 'a heavy long-stemmed bronze gate key caked in damp soil'
    },
    {
      id: 'cemetery_ribbon_card',
      name: 'Initialed Sexton Plot Permit & Card',
      shortLabel: 'sexton plot permit',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'slipped inside the stone caretaker lodge permit box',
      itemFeature: 'a cream cemetery plot permit creased sharply at the seal'
    },
    {
      id: 'cemetery_lantern_clip',
      name: 'Monogrammed Silver Pocket Case & Ribbon',
      shortLabel: 'silver pocket case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'leadSpot'],
      recoverySpotDetail: 'resting in the iron tool barrow beneath wet mourning ribbons',
      itemFeature: 'a slim silver holder dented lightly along the clasp'
    }
  ],
  university_hall: [
    {
      id: 'univ_reagent_tag',
      name: 'Stamped Brass Locker Tag & Acid Smudge',
      shortLabel: 'brass locker tag',
      category: 'physical',
      preferredSpots: ['recordSpot', 'discardSpot'],
      recoverySpotDetail: 'tucked beside the dean’s locked chemical stock index',
      itemFeature: 'a numbered laboratory cabinet disc etched by reagent drops'
    },
    {
      id: 'univ_faculty_memo',
      name: 'Initialed Faculty Cubby Telegram & Note',
      shortLabel: 'faculty cubby note',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged inside the varnished faculty mailroom cubbies',
      itemFeature: 'a folded academic correspondence slip inked hurriedly'
    },
    {
      id: 'univ_archway_pen',
      name: 'Monogrammed Gold-Nibb Fountain Pen',
      shortLabel: 'gold-nibbed pen',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'dropped near the Gothic oak quadrangle archway door',
      itemFeature: 'a marbled-ebonite fountain pen chipped near the barrel lip'
    }
  ],
  courthouse: [
    {
      id: 'court_docket_slip',
      name: 'Initialed Grand Jury Corridor Brief',
      shortLabel: 'corridor brief',
      category: 'document',
      preferredSpots: ['discardSpot', 'recordSpot'],
      recoverySpotDetail: 'tucked beneath the worn oak attorney consultation bench',
      itemFeature: 'a blue-backed legal memo sheet torn near the margin'
    },
    {
      id: 'court_gallery_case',
      name: 'Monogrammed Leather Brief-Clasp & Fiber',
      shortLabel: 'leather brief-clasp',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'caught against the bronze witness stairwell alley door',
      itemFeature: 'a snapped brass briefcase buckle bent at the keeper bar'
    },
    {
      id: 'court_booth_pen',
      name: 'Engraved Reporter’s Silver Pencil Holder',
      shortLabel: 'silver pencil holder',
      category: 'physical',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'wedged inside the press gallery oak telephone booth',
      itemFeature: 'a chased-silver pencil sleeve scuffed along the pocket clip'
    }
  ],
  opera_house: [
    {
      id: 'opera_box_key',
      name: 'Gilded Private-Box Brass Key & Tassel',
      shortLabel: 'private-box brass key',
      category: 'physical',
      preferredSpots: ['leadSpot', 'exitSpot'],
      recoverySpotDetail: 'left beside the marble foyer will-call brass window',
      itemFeature: 'an ornate gilded box-tier key knotted with frayed silk cord'
    },
    {
      id: 'opera_prompt_card',
      name: 'Initialed Backstage Prompt Call Card',
      shortLabel: 'prompt call card',
      category: 'document',
      preferredSpots: ['recordSpot', 'discardSpot'],
      recoverySpotDetail: 'slipped inside the stage manager’s cue sheet desk',
      itemFeature: 'a cream theater card scribbled with backstage timestamps'
    },
    {
      id: 'opera_silver_case',
      name: 'Monogrammed Mother-of-Pearl Card Case',
      shortLabel: 'pearl card case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'wedged behind wilted bouquets on the velvet dressing table',
      itemFeature: 'an inlaid pearl calling-card case cracked near the hinge'
    }
  ],
  customs_house: [
    {
      id: 'customs_brass_seal',
      name: 'Stamped Port Inspector’s Seal Press',
      shortLabel: 'port seal press',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'dropped inside the wire-fenced confiscated crate cage',
      itemFeature: 'a heavy pocket brass customs die smeared with lead filings'
    },
    {
      id: 'customs_clearance_carbon',
      name: 'Initialed Ship Clearance Dispatch Slip',
      shortLabel: 'clearance dispatch slip',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'clipped behind the port collector’s manifest desk',
      itemFeature: 'a stamped federal tariff slip torn sharply at the corner'
    },
    {
      id: 'customs_shutter_tag',
      name: 'Engraved Brass Bonded-Locker Tag',
      shortLabel: 'bonded-locker tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'jammed beneath the bolted steel wharfside shutter',
      itemFeature: 'a salt-dulled brass key tag scarred along the stamped edge'
    }
  ],
  ferry_terminal: [
    {
      id: 'ferry_turnstile_token',
      name: 'Engraved Brass Slip-Pass Medallion',
      shortLabel: 'brass slip-pass',
      category: 'physical',
      preferredSpots: ['recordSpot', 'exitSpot'],
      recoverySpotDetail: 'wedged beside the ticketmaster’s brass turnstile cage',
      itemFeature: 'a heavy seasonal harbor ferry disc scratched near the edge'
    },
    {
      id: 'ferry_trunk_check',
      name: 'Initialed Steamer-Trunk Claim Tag',
      shortLabel: 'steamer-trunk tag',
      category: 'document',
      preferredSpots: ['leadSpot', 'discardSpot'],
      recoverySpotDetail: 'slipped along the battered steamer-trunk check counter',
      itemFeature: 'a damp cardboard baggage claim tag ink-stamped at dusk'
    },
    {
      id: 'ferry_storm_case',
      name: 'Monogrammed Oilskin-Lined Match Case',
      shortLabel: 'oilskin match case',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'caught against the heavy harbor boarding gangway chain',
      itemFeature: 'a watertight brass match cylinder streaked with salt spray'
    }
  ],
  pool_hall: [
    {
      id: 'pool_chalk_holder',
      name: 'Monogrammed Brass Billiard-Chalk Case',
      shortLabel: 'brass chalk case',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'fallen beneath the rye-stained spectator cue-rack bench',
      itemFeature: 'a weighted brass pocket chalk holder dusted in blue chalk'
    },
    {
      id: 'pool_marker_slip',
      name: 'Initialed Back-Table Marker & IOU Tear',
      shortLabel: 'back-table marker',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'tucked underneath the steward’s slate marker desk',
      itemFeature: 'a crumpled cellar billiard wager slip inked on green paper'
    },
    {
      id: 'pool_cellar_key',
      name: 'Engraved Silver Flask Cap & Cloth Fiber',
      shortLabel: 'silver flask cap',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'dropped along the low iron-braced alley cellar stair door',
      itemFeature: 'a threaded silver pocket-flask top nicked along the knurling'
    }
  ],
  laundry_works: [
    {
      id: 'laundry_collar_pin',
      name: 'Monogrammed Gold Collar Bar & Starch',
      shortLabel: 'gold collar bar',
      category: 'physical',
      preferredSpots: ['discardSpot', 'exitSpot'],
      recoverySpotDetail: 'tangled inside the tall wicker starched-collar hamper',
      itemFeature: 'a bent spring collar pin stiff with dried laundry starch'
    },
    {
      id: 'laundry_rush_claim',
      name: 'Initialed Overnight Linen Claim Ticket',
      shortLabel: 'overnight claim ticket',
      category: 'document',
      preferredSpots: ['recordSpot', 'leadSpot'],
      recoverySpotDetail: 'strung behind the front claim-ticket and collar desk',
      itemFeature: 'a crimson-bordered laundry claim check torn at the eyelet'
    },
    {
      id: 'laundry_boiler_key',
      name: 'Stamped Brass Steam-Room Key Tag',
      shortLabel: 'steam-room key tag',
      category: 'physical',
      preferredSpots: ['exitSpot', 'leadSpot'],
      recoverySpotDetail: 'snagged beside the steaming iron boiler-room alley door',
      itemFeature: 'a tarnished brass number tag pitted from boiler steam'
    }
  ],
  bookshop: [
    {
      id: 'bookshop_exlibris',
      name: 'Engraved Brass Bookplate Seal & Ink',
      shortLabel: 'brass bookplate seal',
      category: 'physical',
      preferredSpots: ['recordSpot', 'discardSpot'],
      recoverySpotDetail: 'resting inside the antiquarian’s catalogue desk drawer',
      itemFeature: 'a pocket brass collector stamp stained with faded blue ink'
    },
    {
      id: 'bookshop_folio_slip',
      name: 'Initialed Estate Auction Receipt Slip',
      shortLabel: 'auction receipt slip',
      category: 'document',
      preferredSpots: ['leadSpot', 'recordSpot'],
      recoverySpotDetail: 'slipped inside the front counter wicker wrapping basket',
      itemFeature: 'a deckle-edged bookshop appraisal receipt creased in thirds'
    },
    {
      id: 'bookshop_silver_knife',
      name: 'Monogrammed Silver Page-Cutter & Thread',
      shortLabel: 'silver page-cutter',
      category: 'physical',
      preferredSpots: ['exitSpot', 'discardSpot'],
      recoverySpotDetail: 'caught beside the bolted narrow bindery back-alley door',
      itemFeature: 'a slim ivory-and-silver pocket paper knife nicked near the tip'
    }
  ]
};
