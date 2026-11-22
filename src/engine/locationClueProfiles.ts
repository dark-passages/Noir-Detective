/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocationSpotDef {
  label: string;
  description: string;
  coords: { top: number; left: number };
}

export interface LocationSceneProfile {
  bodySpotLabel: string;
  bodySpotDescription: string;
  bodyCoords: { top: number; left: number };
  exitFeature: string;
  recordSpot: LocationSpotDef;
  discardSpot: LocationSpotDef;
  exitSpot: LocationSpotDef;
  leadSpot: LocationSpotDef;
}

export const COMPROMISING_VENUE_IDS = [
  'crimson_cabaret',
  'velvet_lounge',
  'blue_dahlia_club',
  'copper_kettle_tavern',
  'pool_hall',
  'ace_pawnshop'
] as const;

/**
 * Authored forensic & architectural profiles for every single one of the 54 locations
 * in New Bay so no default/boilerplate POIs are ever stamped across distinct scenes.
 */
export const LOCATION_SCENE_PROFILES: Record<string, LocationSceneProfile> = {
  agency: {
    bodySpotLabel: 'Hardwood Threshold Beside Desk',
    bodySpotDescription: 'Dark polished oak floorboards beside the frosted glass door.',
    bodyCoords: { top: 55, left: 48 },
    exitFeature: 'frosted corridor transom latch',
    recordSpot: {
      label: 'Oak Filing Ledger & Client Index',
      description: 'Steel index drawers holding confidential client intake cards.',
      coords: { top: 36, left: 72 }
    },
    discardSpot: {
      label: 'Swivel Chair Blotter & Wire Basket',
      description: 'Green felt desk blotter and brass wastebasket beneath the Venetian blinds.',
      coords: { top: 64, left: 34 }
    },
    exitSpot: {
      label: 'Frosted Corridor Door Frame',
      description: 'Brass doorknob and hallway transom overlooking the stairwell.',
      coords: { top: 26, left: 60 }
    },
    leadSpot: {
      label: 'Desk Telephone & Message Spike',
      description: 'Bakelite rotary telephone beside a brass slip spindle.',
      coords: { top: 44, left: 26 }
    }
  },
  grand_hotel: {
    bodySpotLabel: 'Suite 408 Parlor Rug',
    bodySpotDescription: 'Persia-patterned wool carpet inside Suite 408 at the Grand St. Moritz.',
    bodyCoords: { top: 56, left: 46 },
    exitFeature: 'balcony brass casement latch',
    recordSpot: {
      label: 'Concierge Marble Front Register',
      description: 'Gilded guest check-in book and key pigeonholes behind the marble desk.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Writing Bureau & Stationery Drawer',
      description: 'Walnut suite writing desk littered with hotel stationery.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Suite 408 Fire-Balcony Casement',
      description: 'Tall French casement window opening onto the hotel iron fire balcony.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Bellboy Key Tray & Mail Slot',
      description: 'Brass bellhop dispatch tray beside elevator cage doors.',
      coords: { top: 46, left: 82 }
    }
  },
  grand_hotel2: {
    bodySpotLabel: 'Room 614 Velvet Settee',
    bodySpotDescription: 'Mahogany side suite in the Starlight Grand Hotel overlooking the rain-wet avenue.',
    bodyCoords: { top: 54, left: 44 },
    exitFeature: 'service-stair fire door bolt',
    recordSpot: {
      label: 'Night Manager’s Folio Desk',
      description: 'Numbered room folios and late switchboard call logs.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Chipped Onyx Ash-Stand',
      description: 'Tall brass floor ash-stand tucked beside the draped parlor curtains.',
      coords: { top: 70, left: 66 }
    },
    exitSpot: {
      label: 'Room 614 Service Stair Door',
      description: 'Narrow corridor service door leading down toward the mezzanine.',
      coords: { top: 26, left: 78 }
    },
    leadSpot: {
      label: 'Switchboard Alcove & Parcel Shelf',
      description: 'Cord board and overnight guest parcel cubbies.',
      coords: { top: 48, left: 84 }
    }
  },
  velvet_lounge: {
    bodySpotLabel: 'Red Velvet Corner Booth Floor',
    bodySpotDescription: 'Dimly lit alcove beneath amber sconces at the rear of The Velvet Lounge.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'back-alley delivery door hasp',
    recordSpot: {
      label: 'Proprietor’s Mahogany Check Desk',
      description: 'Liquor stock tallies, VIP booth reservations, and coat-check stubs.',
      coords: { top: 38, left: 24 }
    },
    discardSpot: {
      label: 'Pianist’s Baby Grand Floor Basin',
      description: 'Shadowed parquet beneath the upright stage piano and brass spittoon.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Speakeasy Alley Delivery Door',
      description: 'Padded green-baize service door bolted from the alley side.',
      coords: { top: 26, left: 78 }
    },
    leadSpot: {
      label: 'Steward’s Bottle Rack & Match Bowl',
      description: 'Glass match-dish atop the polished bar mirror counter.',
      coords: { top: 64, left: 68 }
    }
  },
  st_judes: {
    bodySpotLabel: 'Stone Chancel & Belfry Arch',
    bodySpotDescription: 'Cold flagstone beside the brass lectern beneath St. Jude’s stone belltower.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'wrought-iron belfry stair gate',
    recordSpot: {
      label: 'Vestry Oak Sacristy Table',
      description: 'Parish marriage registry, stewardship envelopes, and sexton keys.',
      coords: { top: 38, left: 22 }
    },
    discardSpot: {
      label: 'Votive Alcove & Hymnal Shelf',
      description: 'Beeswax-dripped iron candle stand beside carved cedar pews.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Belfry Iron Stairway Gate',
      description: 'Squeaking iron grill opening onto the rain-swept stone churchyard.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Choir Vestibule Notice Ledger',
      description: 'Parish bulletin table holding charitable slips and bell-ringing notes.',
      coords: { top: 46, left: 82 }
    }
  },
  blackwood_antiquities: {
    bodySpotLabel: 'Curio Alcove & Persian Runner',
    bodySpotDescription: 'Narrow aisle between mahogany vitrines packed with brassware and relics.',
    bodyCoords: { top: 55, left: 46 },
    exitFeature: 'vault alley shutter bar',
    recordSpot: {
      label: 'Appraiser’s Estate Consignment Desk',
      description: 'Leather-bound provenance ledgers and auction tag spindles.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Velvet-Lined Display Vitrine',
      description: 'Unlocked glass heirloom case lined with moth-eaten crimson felt.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Vault Alley Shutter Door',
      description: 'Iron-barred rear shipping door facing the fogbound side street.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Clockmaker’s Counter Bell',
      description: 'Brass service tray surrounded by auction flyers and repair tickets.',
      coords: { top: 48, left: 82 }
    }
  },
  pier_four: {
    bodySpotLabel: 'Weathered Pilings & Mooring Cleat',
    bodySpotDescription: 'Tar-black timber decking slick with harbor spray near Slip 4.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'boathouse padlock chain',
    recordSpot: {
      label: 'Dockmaster’s Oilskin Tally Stand',
      description: 'Salt-stained boat departure clipboards inside the wharf shack.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Coiled Hawser & Crate Pallet',
      description: 'Soggy hemp rigging piled beside stencil-marked wooden shipping barrels.',
      coords: { top: 72, left: 34 }
    },
    exitSpot: {
      label: 'Boathouse River Gate & Skiff Ladder',
      description: 'Rusted iron dock ladder descending toward dark slapping harbor water.',
      coords: { top: 26, left: 78 }
    },
    leadSpot: {
      label: 'Lantern Hook & Dispatch Chalkboard',
      description: 'Tin lantern rack beside a chalked harbor launch schedule.',
      coords: { top: 46, left: 82 }
    }
  },
  pendelton_clinic: {
    bodySpotLabel: 'Linoleum Examination Bay',
    bodySpotDescription: 'Tile floor beside the enameled operating table under harsh surgical lamps.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'ambulance yard side latch',
    recordSpot: {
      label: 'Glass Dispensary & Case Archive',
      description: 'Alphabetical patient charts and narcotics dispensing logbook.',
      coords: { top: 38, left: 22 }
    },
    discardSpot: {
      label: 'Sterilizer Stand & Basin',
      description: 'Chromium instrument tray beside discarded gauze and tincture slips.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Ambulance Yard Rear Door',
      description: 'Steel-framed clinic rear door opening onto the paved ambulance court.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Receptionist’s Appointment Pad',
      description: 'White linen desk pad beside late-evening house call slips.',
      coords: { top: 46, left: 82 }
    }
  },
  clarion_newsroom: {
    bodySpotLabel: 'Press Floor Typesetting Aisle',
    bodySpotDescription: 'Ink-smudged floorboards between clattering Linotype frames and proofing tables.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'loading chute fire door',
    recordSpot: {
      label: 'Night Editor’s Copy Desk',
      description: 'Stacks of clipped wire copy, galley proofs, and press credentials.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Morgue Clipping Cabinets',
      description: 'Dented olive-steel file drawers crammed with yellowed newsprint clips.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Newsprint Loading Chute Exit',
      description: 'Heavy steel fire door leading out to the delivery truck bay.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Teletype Wire & Press Spindle',
      description: 'Ticking Western Union printer beside brass wire-room hooks.',
      coords: { top: 46, left: 82 }
    }
  },
  central_railway: {
    bodySpotLabel: 'Track 9 Brass Baggage Arch',
    bodySpotDescription: 'Terrazzo concourse slick with umbrella drips beside the sleeper car gate.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'parcel platform iron wicket',
    recordSpot: {
      label: 'Station Master’s Window & Telegraph',
      description: 'Pullman sleeper manifests, punch logs, and express parcel stubs.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Oak Waiting Bench & Ash Urn',
      description: 'Soot-rimmed brass sand urn flanking a row of battered waiting benches.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Parcel Platform Iron Wicket',
      description: 'Sliding steel gate connecting Track 9 to the cab concourse.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Concourse Newsstand & Ticket Window',
      description: 'Rack of evening editions alongside stamped suburban rail stubs.',
      coords: { top: 48, left: 82 }
    }
  },
  blue_dahlia_club: {
    bodySpotLabel: 'Backstage Bandstand Corridor',
    bodySpotDescription: 'Narrow velvet-curtained passage running behind the Blue Dahlia brass stage.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'kitchen alley service latch',
    recordSpot: {
      label: 'Head Waiter’s Booth Ledger',
      description: 'Nightly cover-charge sheet and coat-check tag duplicate stubs.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Velvet Booth Seven Cushion Seam',
      description: 'Tufted indigo banquette smelling of gin and damp fur.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Kitchen Service Alley Door',
      description: 'Greasy swinging kitchen door braced open toward Theatre Row.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Cloakroom Claim Counter',
      description: 'Brass numbered coat hooks above a silver match-tray.',
      coords: { top: 46, left: 82 }
    }
  },
  boxing_gym: {
    bodySpotLabel: 'Canvas Ring Apron Mat',
    bodySpotDescription: 'Resin-dusted floorboards beside the bloodstained ring ropes.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'locker room fire-escape door',
    recordSpot: {
      label: 'Promoter’s Bout & Locker Ledger',
      description: 'Ring-card purse payouts, sparring schedules, and locker key list.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Trainer’s Tape & Bucket Bench',
      description: 'Splintered pine corner bench covered in liniment rags and water pails.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Shower Alley Fire-Escape Door',
      description: 'Battered tin-sheathed door opening onto the brick tenement cut-through.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Ticket Window & Fight Poster Wall',
      description: 'Wire cage booth plastered with torn Friday card handbills.',
      coords: { top: 46, left: 82 }
    }
  },
  service_alley: {
    bodySpotLabel: 'Wet Cobbles Beside Ash-Barrel',
    bodySpotDescription: 'Slick granite cobbles in shadow under an amber loading-bay sconce.',
    bodyCoords: { top: 56, left: 45 },
    exitFeature: 'fire-escape rusted drop ladder',
    recordSpot: {
      label: 'Loading Dock Delivery Box',
      description: 'Rusted tin milk-and-parcel dropbox bolted beside the brick arch.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Dented Galvanized Ash-Barrel',
      description: 'Sodden alley trash barrel reeking of wet cinders and fish wrap.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Rusted Iron Fire-Escape Ladder',
      description: 'Low fire-escape landing dripping rain above the alleyway curb.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Brick Arched Cutoff Lamppost',
      description: 'Rain-slick poster wall plastered with cab schedules and handbills.',
      coords: { top: 48, left: 82 }
    }
  },
  cobblestone_alley: {
    bodySpotLabel: 'Recessed Brick Steam Vent',
    bodySpotDescription: 'Rain-washed cobbles half veiled in hissing manhole steam.',
    bodyCoords: { top: 56, left: 46 },
    exitFeature: 'tenement courtyard iron gate',
    recordSpot: {
      label: 'Rear Stage-Door Call Box',
      description: 'Patrol call box housing weathered beat sign-in slips.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Alley Drain & Milk Crate Stack',
      description: 'Splintered wooden crates wedged beside an overflowing storm grate.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Tenement Courtyard Iron Gate',
      description: 'Pitted iron alley gate swinging cleanly out toward Midtown.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Cab Stand Curbside Bollard',
      description: 'Chipped painted steel post marking the late-night hack pickup lane.',
      coords: { top: 46, left: 82 }
    }
  },
  city_morgue: {
    bodySpotLabel: 'White Tile Autopsy Prep Bay',
    bodySpotDescription: 'Cold terrazzo floor beside the steel gurney bay under humming fluorescents.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'hearse-bay sliding door',
    recordSpot: {
      label: 'Coroner’s Intake & Locker Desk',
      description: 'Metal intake ledger tracking cold-storage drawers and belongings tags.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Enamel Scrub Sink & Towel Bin',
      description: 'Deep porcelain washbasin bordered by antiseptic bottles.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Hearse-Bay Sliding Loading Door',
      description: 'Heavy double steel doors backing onto the river ambulance apron.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Personal Effects Brass Cage',
      description: 'Wire-mesh locker shelf holding tagged pocketbooks and watch chains.',
      coords: { top: 46, left: 82 }
    }
  },
  riverside_chapel: {
    bodySpotLabel: 'Cedar Nave Center Aisle',
    bodySpotDescription: 'Creaking varnished floorboards beneath the stained-glass rose window.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'vestry side porch latch',
    recordSpot: {
      label: 'Sexton’s Parish Key Desk',
      description: 'Vestry key rack, baptismal ledger, and charitable account book.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Confessional Kneeler Shelf',
      description: 'Dark oak lattice nook lit only by trembling sanctuary tapers.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Vestry Side Porch Door',
      description: 'Salt-weathered oak door opening onto the river fog steps.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Poor-Box Table & Parish Pamphlets',
      description: 'Carved oak pamphlet table beside the rain-spotted entrance vestibule.',
      coords: { top: 46, left: 82 }
    }
  },
  fish_market: {
    bodySpotLabel: 'Quay Sawdust & Scaling Floor',
    bodySpotDescription: 'Wet concrete trench running past galvanized fillet benches and crushed ice bins.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'wharf gantry rolling shutter',
    recordSpot: {
      label: 'Market Inspector’s Stall Desk',
      description: 'Briny dock auction tallies and wholesaler credit chits.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Crushed-Ice Cart & Crates',
      description: 'Dripping wooden cart stacked with salted cedar herring boxes.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Wharf Gantry Rolling Shutter',
      description: 'Corrugated iron shutter rattled by wet river gusts.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Auctioneer’s Weigh-Scale Hook',
      description: 'Hanging brass spring scale beside pinned quay delivery tags.',
      coords: { top: 46, left: 82 }
    }
  },
  dry_dock: {
    bodySpotLabel: 'Oil-Slick Keel Block Apron',
    bodySpotDescription: 'Puddled iron gantry floor beside towering hull scaffolding at Pier Nine.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'yard chain-link slip gate',
    recordSpot: {
      label: 'Welding Foreman’s Tool Crib',
      description: 'Grease-blackened chalk inventory board and shift timecards.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Rivet Drum & Primer Cans',
      description: 'Dented paint drums tucked beneath steel keel timbers.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Yard Chain-Link Slip Gate',
      description: 'Padlocked shipyard fence gate overlooking the black river basin.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Winch House Clipboard Hook',
      description: 'Steel control shelter containing tugboat dispatch slips.',
      coords: { top: 46, left: 82 }
    }
  },
  harbor_warehouse: {
    bodySpotLabel: 'Concrete Bay Beside Crate Stack C-14',
    bodySpotDescription: 'Drafty warehouse aisle bordered by stenciled tea chests and burlap cargo bales.',
    bodyCoords: { top: 55, left: 46 },
    exitFeature: 'loading bay iron cargo latch',
    recordSpot: {
      label: 'Night Watchman’s Gate Booth',
      description: 'Pine desk holding the wall clock, customs gate logbook, and key ring.',
      coords: { top: 38, left: 24 }
    },
    discardSpot: {
      label: 'Burlap Pallet & Customs Bins',
      description: 'Splintered cargo skids piled with cut twine and discarded packing slips.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Loading Bay Iron Cargo Hatch',
      description: 'Heavy sliding steel loading door facing the black harbor apron.',
      coords: { top: 28, left: 78 }
    },
    leadSpot: {
      label: 'Freight Weigh-Scale Office Shelf',
      description: 'Brass balance scale beside dock cartage routing slips.',
      coords: { top: 48, left: 82 }
    }
  },
  union_hall: {
    bodySpotLabel: 'Scarred Oak Meeting Floor',
    bodySpotDescription: 'Smoke-hazed hall beside knocked-over folding chairs and a hissing radiator.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'rear fire stairwell door',
    recordSpot: {
      label: 'Steward’s Dues & Shift Desk',
      description: 'Stamped Local 88 membership binders and dock gang call-out sheets.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Coat Rack & Radiator Alcove',
      description: 'Overcrowded brass hat-stand dripping rainwater beside the corner table.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Rear Brick Stairwell Exit',
      description: 'Scuffed fire door opening down toward the harbor street.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Cork Noticeboard & Dispatch Slip',
      description: 'Pinned union bulletins covered with chalked meeting notices.',
      coords: { top: 46, left: 82 }
    }
  },
  tenement_court: {
    bodySpotLabel: 'Flagstone Courtyard Beside Well Pump',
    bodySpotDescription: 'Slick brick courtyard overshadowed by zigzagging iron fire escapes.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'basement coal-chute gate',
    recordSpot: {
      label: 'Superintendent’s Mailbox Alcove',
      description: 'Dented brass letterboxes and rent receipt stubs in the vestibule.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Ash Pit & Wringer Tub Corner',
      description: 'Galvanized laundry tubs beside wet brick stairwell steps.',
      coords: { top: 72, left: 34 }
    },
    exitSpot: {
      label: 'Third-Floor Fire-Escape Drop',
      description: 'Iron ladder landing above the shadowy tenement alley exit.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Vestibule Milk-Crate Shelf',
      description: 'Covered wooden crate holding tenant errand notes and delivery tags.',
      coords: { top: 48, left: 82 }
    }
  },
  city_hall: {
    bodySpotLabel: 'Marble Archive Wing Corridor',
    bodySpotDescription: 'Echoing limestone corridor outside the municipal vault stacks.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'basement archive iron door',
    recordSpot: {
      label: 'Registrar’s Property Folio Desk',
      description: 'Bound municipal deed volumes, notary ink pads, and stamp racks.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Copy Clerk’s Oak Paper Cart',
      description: 'Rolling wooden trolley stuffed with cancelled tax forms and carbon sheets.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Basement Archive Fire Door',
      description: 'Heavy paneled oak door leading out to the Civic Centre plaza steps.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Public Counter Pneumatic Tube',
      description: 'Brass message canister tray beside municipal clerk call slips.',
      coords: { top: 46, left: 82 }
    }
  },
  starlight_radio: {
    bodySpotLabel: 'Studio B Soundproof Floor',
    bodySpotDescription: 'Cork-tiled studio booth bathed in the red glow of the ON AIR sign.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'roof antenna fire door',
    recordSpot: {
      label: 'Control-Room Broadcast Log Desk',
      description: 'Engineer’s cue sheets, sponsor scripts, and reel-to-reel tape rack.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Green-Room Coffee Table',
      description: 'Linoleum coffee table cluttered with cold cups and smudged scripts.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Studio Wing Roof-Stair Exit',
      description: 'Heavy acoustic seal door leading toward the freight elevator hall.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Receptionist’s Switchboard Desk',
      description: 'Glass-partitioned desk stacked with listener wires and press drops.',
      coords: { top: 46, left: 82 }
    }
  },
  trinity_baptist: {
    bodySpotLabel: 'Polished Oak Pew Row Three',
    bodySpotDescription: 'Dim cathedral nave beneath high arched Gothic lancet windows.',
    bodyCoords: { top: 55, left: 46 },
    exitFeature: 'north churchyard iron gate',
    recordSpot: {
      label: 'Deacon’s Vestry Ledger Stand',
      description: 'Church benevolence ledger, parish mail, and key ring.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Choir Robe Locker Bench',
      description: 'Varnished cedar vestment chests beside the organ alcove.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'North Churchyard Iron Gate',
      description: 'Tall wrought-iron gate creaking softly onto Cathedral Heights.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Narthex Bulletin & Alms Stand',
      description: 'Brass alms plate resting beside parish errand slips.',
      coords: { top: 48, left: 82 }
    }
  },
  golden_crust_bakery: {
    bodySpotLabel: 'Flour-Dusted Brick Oven Apron',
    bodySpotDescription: 'Tile bakehouse floor white with spilled wheat flour beside cooling racks.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'flour alley delivery hatch',
    recordSpot: {
      label: 'Oak Pastry Counter & Cash Till',
      description: 'Brass cash register beside wholesale bread-route order spikes.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Flour Bin & Apron Hamper',
      description: 'Tin-lined flour bins tucked beside canvas work aprons.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Flour Alley Delivery Hatch',
      description: 'Iron-hinged side delivery door opening onto the brick oven court.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Warm Bread Cooling Racks',
      description: 'Rolling iron racks holding penciled morning route tags.',
      coords: { top: 46, left: 82 }
    }
  },
  silver_spoon_diner: {
    bodySpotLabel: 'Checkered Linoleum Counter Bay',
    bodySpotDescription: 'Chrome-trimmed 1940s dining car aisle smelling of scorched coffee.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'grease-trap alley exit',
    recordSpot: {
      label: 'Cashier’s Check & Tip Spindle',
      description: 'Chrome pie dome beside stamped guest checks and shift logs.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Rear Red Vinyl Window Booth',
      description: 'Cracked scarlet vinyl booth overlooking the neon-lit crosswalk.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Galley Back Screen Door',
      description: 'Warped kitchen screen door opening beside the alley milk crates.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Jukebox Wall & Payphone Nook',
      description: 'Wurlitzer wall-box beside a nickel coin-telephone shelf.',
      coords: { top: 46, left: 82 }
    }
  },
  harborview_restaurant: {
    bodySpotLabel: 'White Linen Harbor Alcove',
    bodySpotDescription: 'Carpeted private dining alcove overlooking rain-lashed cargo piers.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'kitchen service stairwell',
    recordSpot: {
      label: 'Maitre d’s Rosewood Lectern',
      description: 'Gilt reservation book and private banquet seating charts.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Mahogany Wine Cellar Hatch',
      description: 'Velvet-roped cellar doorway beside silver ice buckets.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Pantry Rear Service Door',
      description: 'Swinging brass-plate kitchen door connecting to the wharf alley.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Lobby Cloak Desk & Cigars',
      description: 'Humidor cabinet beside brass-numbered dining coat tags.',
      coords: { top: 46, left: 82 }
    }
  },
  rosie_deli: {
    bodySpotLabel: 'Sawdust Floor Beside Slicing Block',
    bodySpotDescription: 'Cramped corner storefront between hanging salami ropes and brine barrels.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'crate-yard back door',
    recordSpot: {
      label: 'Butcher’s Brass Scale Counter',
      description: 'Waxed paper stack, credit notebook, and neighborhood delivery slips.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Pickle Barrel & Apron Hook',
      description: 'Wooden vinegar keg tucked beside an overflowing paper bin.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Alley Crate-Yard Back Door',
      description: 'bolted timber rear door opening onto the tenement court cut-through.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Storefront Window Order Board',
      description: 'Chalk slate listing afternoon grocery and neighborhood errands.',
      coords: { top: 48, left: 82 }
    }
  },
  crimson_cabaret: {
    bodySpotLabel: 'Sequined Wing Floor Behind Curtain',
    bodySpotDescription: 'Dim backstage catwalk littered with ostrich feathers and stage ropes.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'stage-door theatre alley latch',
    recordSpot: {
      label: 'Velvet Coat-Check & Patron Sign-In',
      description: 'Doorman’s discreet champagne tab ledger and numbered hat-check stubs.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Star’s Illuminated Dressing Vanity',
      description: 'Bulb-lined dressing mirror strewn with greasepaint, wires, and crumpled notes.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Stage-Door Theatre Alley Exit',
      description: 'Steel-plated rear stage door bolted poorly from the dressing wing.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Spotlight Booth & Match Counter',
      description: 'Bartender’s service rail stocked with Crimson Garter matchbooks.',
      coords: { top: 46, left: 82 }
    }
  },
  copper_kettle_tavern: {
    bodySpotLabel: 'Sawdust Hearth Floor',
    bodySpotDescription: 'Dark tavern floorboards stained with ale spills beside the brick taproom grate.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'taproom cellar bulkhead',
    recordSpot: {
      label: 'Bartender’s Cash Drawer & Slate',
      description: 'Oak taproom counter holding the chalk credit board and bottle register.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Spittoon & Dartboard Corner',
      description: 'Scarred wood wainscoting beside torn betting slips.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Beer-Keg Alley Bulkhead',
      description: 'Slanted wooden cellar hatch opening beside the brick alley.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Taproom Payphone Alcove',
      description: 'Scuffed wooden telephone booth smelling of stale cigar smoke.',
      coords: { top: 46, left: 82 }
    }
  },
  mercer_apothecary: {
    bodySpotLabel: 'Ceramic Mortar Counter Floor',
    bodySpotDescription: 'Black-and-white tile aisle lined with amber glass apothecary jars.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'dispensary back-courtyard door',
    recordSpot: {
      label: 'Locked State Poison & Rx Ledger',
      description: 'Leather-bound dispensary register requiring pharmacist sign-offs.',
      coords: { top: 36, left: 22 }
    },
    discardSpot: {
      label: 'Marble Compounding Counter',
      description: 'Glass graduated cylinders and wiped prescription slips.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Dispensary Rear Courtyard Door',
      description: 'Narrow painted door braced by crates of medicinal mineral water.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Soda-Fountain & Parcel Rack',
      description: 'Marble fountain tray holding neighborhood tonic delivery tags.',
      coords: { top: 46, left: 82 }
    }
  },
  savile_tailors: {
    bodySpotLabel: 'Chalked Oak Fitting Platform',
    bodySpotDescription: 'Mirrored fitting dais strewn with worsted wool bolts and tailor chalk.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'press-room fire escape landing',
    recordSpot: {
      label: 'Master Cutter’s Measurement Book',
      description: 'Bespoke client measurement cards, cuff tags, and alteration dates.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Wool Scrap Bin & Steam Iron Stand',
      description: 'Wicker scrap basket heaped with trimmed lapels and dark serge.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Alteration Alley Door',
      description: 'Heavy oak workroom door opening behind Midtown shops.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Front Counter Alteration Rack',
      description: 'Brass clothes rail hung with tagged winter overcoats.',
      coords: { top: 46, left: 82 }
    }
  },
  marigold_florist: {
    bodySpotLabel: 'Moss-Damp Potting Bench',
    bodySpotDescription: 'Wet stone work floor strewn with cut stems and cedar wreath wire.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'conservatory glasshouse latch',
    recordSpot: {
      label: 'Greenhouse Order & Ribbon Book',
      description: 'Wax-spotted dispatch book logging funeral wreaths and corsages.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Zinc Watering Bucket & Pruners',
      description: 'Copper cutting trough beside discarded mourning ribbon cards.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Glasshouse Rear Latch Door',
      description: 'Steamed glass frame door leading onto the garden alley.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Corsage Counter Dispatch Box',
      description: 'Wire rack holding typed enclosure slips and delivery routes.',
      coords: { top: 48, left: 82 }
    }
  },
  ace_pawnshop: {
    bodySpotLabel: 'Iron-Grilled Pledge Cage Floor',
    bodySpotDescription: 'Scuffed linoleum beneath hanging trombones, pocket watches, and caged shelves.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'steel shuttered alley door',
    recordSpot: {
      label: 'Pledge Ledger & Steel Cashbox',
      description: 'Numbered pink pawn tickets and state serial-number check book.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Battered Watchmaker’s Tray',
      description: 'Felt-lined display tray filled with tarnished silverware and cufflinks.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Shuttered Pawn-Cage Back Door',
      description: 'Barred steel rear exit wedged behind pawned trunks.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Front Window Jewelry Case',
      description: 'Wire-meshed counter shelf holding redeemed claim tags.',
      coords: { top: 48, left: 82 }
    }
  },
  crown_barbershop: {
    bodySpotLabel: 'Tiled Tonsorial Chair Two',
    bodySpotDescription: 'Porcelain pedestal chair beside steaming hot-towel urns and wall mirrors.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'back-hall barber stairwell',
    recordSpot: {
      label: 'Shoe-Shine & Appointment Ledger',
      description: 'Leather-trimmed appointment spike and tonic supply slips.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Sanitizer Jar & Linen Chute',
      description: 'Blue-tinted Barbicide counter beside fresh towel bundles.',
      coords: { top: 72, left: 34 }
    },
    exitSpot: {
      label: 'Alley Supply Closet Door',
      description: 'Narrow oak back door smelling of bay rum and cold rain.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Hat-Rack & Magazine Table',
      description: 'Mahogany coat tree beside racing forms and neighborhood flyers.',
      coords: { top: 46, left: 82 }
    }
  },
  continental_bank: {
    bodySpotLabel: 'Marble Teller Rotunda Floor',
    bodySpotDescription: 'Echoing Tennessee marble floor outside the bronze safe-deposit grille.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'armored night-depository door',
    recordSpot: {
      label: 'Bronze Vault Access Logbook',
      description: 'Timestamped box-holder entry sheets and wire-transfer carbons.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Coupon Clipping Booth Desk',
      description: 'Private velvet-curtained safe-deposit examination table.',
      coords: { top: 72, left: 34 }
    },
    exitSpot: {
      label: 'Night-Depository Side Door',
      description: 'Reinforced bronze side exit guarded by heavy deadbolts.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Teller Window #3 Blotter Stand',
      description: 'Brass pen stand holding stamped courier deposit receipts.',
      coords: { top: 48, left: 82 }
    }
  },
  liberty_theater: {
    bodySpotLabel: 'Velvet Orchestra Loge Aisle',
    bodySpotDescription: 'Faded gold-leaf side aisle carpeted in worn burgundy beneath the projection beam.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'alley crash-bar exit door',
    recordSpot: {
      label: 'Box-Office Stub Box & Log',
      description: 'Numbered torn ticket reels and evening manager cash balance.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Balcony Candy Counter Trash',
      description: 'Brass concession stand strewn with torn playbills and foil.',
      coords: { top: 72, left: 32 }
    },
    exitSpot: {
      label: 'Theatre Alley Crash-Bar Door',
      description: 'Red-lit fire exit pushing straight out into the wet side alley.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Lobby Poster Frame & Payphone',
      description: 'Brass marquee stand beside the foyer telephone alcove.',
      coords: { top: 46, left: 82 }
    }
  },
  precinct_four: {
    bodySpotLabel: 'Detention Hall Oak Bench',
    bodySpotDescription: 'Scuffed linoleum corridor outside the green-painted sergeant’s cage.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'patrol-wagon garage gate',
    recordSpot: {
      label: 'Watch-Sergeant’s Desk Blotter',
      description: 'Stamped patrol beat sheets, bail bonds, and arrest logs.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Squad-Room Teletype Basket',
      description: 'Wire wastebasket heaped with discarded precinct carbon sheets.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Patrol-Wagon Alley Gate',
      description: 'Brick sally-port archway opening toward the side street.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Evidence Clerk’s Property Rack',
      description: 'Wired shelving tagged with recovered street parcels and stubs.',
      coords: { top: 48, left: 82 }
    }
  },
  public_library: {
    bodySpotLabel: 'Oak Reading Room Gallery',
    bodySpotDescription: 'Hushed parquet floor beneath tall brass gooseneck study lamps.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'rare-book stack service door',
    recordSpot: {
      label: 'Reference Desk Borrower File',
      description: 'Index trays recording municipal atlas and map check-outs.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Periodical Rack & Table',
      description: 'Bound newspaper poles beside city directories and magnifiers.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Rear Book-Bindery Service Exit',
      description: 'Heavy oak stair door dropping to the Civic plaza lane.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Catalog Card Drawer Cabinet',
      description: 'Oak card-index cabinet beside return slips and call tickets.',
      coords: { top: 46, left: 82 }
    }
  },
  post_office: {
    bodySpotLabel: 'Parcel Sorting Conveyor Table',
    bodySpotDescription: 'Worn maple floor beneath hanging mail sacks and brass telegraph keys.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'mail-truck loading bay dock',
    recordSpot: {
      label: 'Registered Mail & Wire Desk',
      description: 'Timestamped Western Union dispatch books and parcel registry.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Wax Seal & String Bin',
      description: 'Sorting bench cluttered with torn wrapping twine and ink stamps.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Mail-Truck Loading Bay Door',
      description: 'Steel roll-up dock overlooking the covered postal apron.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'General Delivery Counter Window',
      description: 'Brass teller window holding uncollected envelopes and slips.',
      coords: { top: 46, left: 82 }
    }
  },
  bus_depot: {
    bodySpotLabel: 'Concourse Locker Bank Row B',
    bodySpotDescription: 'Diesel-scented terrazzo hall lined with coin-operated luggage lockers.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'coach bay departure lane',
    recordSpot: {
      label: 'Depot Dispatcher’s Fare Booth',
      description: 'Timed coach manifests, ticket carbons, and luggage claim checks.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Baggage Claim Bench & Ash Can',
      description: 'Cast-iron concourse bench strewn with crumpled bus timetables.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Coach Bay Departure Gate',
      description: 'Glass-paneled terminal door blowing cold diesel exhaust.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Parcel Express Counter Window',
      description: 'Wire shelf stacked with intercity freight tags and bus receipts.',
      coords: { top: 48, left: 82 }
    }
  },
  taxi_garage: {
    bodySpotLabel: 'Concrete Bay #4 Oil Pit',
    bodySpotDescription: 'Grease-blackened garage floor parked beside ticking checkered cabs.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'rolling carriage bay shutter',
    recordSpot: {
      label: 'Dispatcher’s Fare & Radio Desk',
      description: 'Steel clipboards tracking evening hack trips, drivers, and meters.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Mechanic’s Rag Drum & Wrench Bench',
      description: 'Oily steel tool bench surrounded by spare tires and rags.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Rolling Carriage Bay Shutter',
      description: 'Chain-hoisted garage bay door opening onto Midtown Avenue.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Night Driver Timecard Rack',
      description: 'Slotted metal punch rack beside cab route clipboards.',
      coords: { top: 46, left: 82 }
    }
  },
  foundry_works: {
    bodySpotLabel: 'Slag-Dusted Anvil Runway',
    bodySpotDescription: 'Brick foundry floor carpeted in gray cinder dust beside cooled molds.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'coal-yard freight siding gate',
    recordSpot: {
      label: 'Foundry Master’s Timekeeping Hut',
      description: 'Soot-rimmed glass cubicle holding tool crib pegs and shift cards.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Sand-Casting Pit & Slag Drum',
      description: 'Iron barrows filled with cold clinkers and discarded rags.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Coal-Yard Freight Siding Gate',
      description: 'Corrugated yard door sliding out onto the industrial spur tracks.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Shipping Weigh-Bridge Desk',
      description: 'Chalkboard and bill-of-lading hook beside heavy loading doors.',
      coords: { top: 46, left: 82 }
    }
  },
  textile_mill: {
    bodySpotLabel: 'Power-Loom Weaving Aisle',
    bodySpotDescription: 'Lint-carpeted plank floor between silent cast-iron weaving frames.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'bale-hoist canal door',
    recordSpot: {
      label: 'Dye-Master’s Batch Card Desk',
      description: 'Sample swatch binders tracking wool lots shipped to Midtown tailors.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Spindle Cart & Bobbin Tub',
      description: 'Rolling canvas basket heaped with cut yarn and oil rags.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Bale-Hoist Canal Loading Door',
      description: 'Timber loading bay overlooking the rain-slick brick millrace.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Mill Gatekeeper’s Sample Shelf',
      description: 'Shipping tags and tailor delivery vouchers stacked on pine slats.',
      coords: { top: 48, left: 82 }
    }
  },
  botanical_conservatory: {
    bodySpotLabel: 'Fernery Gravel Walk',
    bodySpotDescription: 'Damp crushed-gravel pathway beneath steamed Victorian iron-and-glass arches.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'north conservatory iron gate',
    recordSpot: {
      label: 'Head Botanist’s Potting Shed',
      description: 'Cedar shed holding seed ledgers, tool hooks, and key board.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Clay Pot Bench & Peat Bin',
      description: 'Slat bench cluttered with pruning twine and muddy clay shards.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'North Conservatory Iron Gate',
      description: 'Frosted glasshouse door opening onto Cathedral Heights Park.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Ticketing Kiosk & Map Stand',
      description: 'Painted iron booth displaying park notices and specimen maps.',
      coords: { top: 46, left: 82 }
    }
  },
  civic_cemetery: {
    bodySpotLabel: 'Flagstone Crypt Terrace',
    bodySpotDescription: 'Wet granite steps beside ivy-draped family mausoleums and yew trees.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'north wrought-iron carriage gate',
    recordSpot: {
      label: 'Sexton’s Stone Caretaker Lodge',
      description: 'Burial plot charts, grave opening permits, and lantern rack.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Tool Barrow & Withered Wreaths',
      description: 'Iron barrow resting beside rain-soaked mourning ribbons.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'North Iron Carriage Gate',
      description: 'Squeaking wrought-iron gate opening onto the silent lane.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Mausoleum Bench & Notice Board',
      description: 'Carved granite bench tucked beneath the stone archway.',
      coords: { top: 48, left: 82 }
    }
  },
  university_hall: {
    bodySpotLabel: 'Laboratory Slate Prep Floor',
    bodySpotDescription: 'Parquet lecture aisle below tiered oak seats and glass reagent cabinets.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'quadrangle archway fire door',
    recordSpot: {
      label: 'Dean’s Chemical Stock Desk',
      description: 'Locked laboratory inventory cards and student sign-in sheet.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Slate Bench & Broken Glass Bin',
      description: 'Acid-stained slate lab counter beside a tin waste receptacle.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Quadrangle Archway Door',
      description: 'Gothic oak hall door leading out into the misty campus court.',
      coords: { top: 25, left: 78 }
    },
    leadSpot: {
      label: 'Faculty Mailroom Cubbies',
      description: 'Varnished mail pigeonholes stuffed with memos and telegrams.',
      coords: { top: 46, left: 82 }
    }
  },
  courthouse: {
    bodySpotLabel: 'Courtroom Two Corridor Marble',
    bodySpotDescription: 'Polished stone hall outside the grand jury room’s padded leather doors.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'witness stairwell alley door',
    recordSpot: {
      label: 'Bailiff’s Docket & Clerk Cage',
      description: 'Bound court calendars, subpoena stubs, and bail registers.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Oak Attorney Consultation Bench',
      description: 'Worn hallway bench beside a brass stand and legal briefs.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Witness Stairwell Alley Door',
      description: 'Heavy bronze-plated exit dropping down toward the Civic street.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Press Gallery Telephone Booth',
      description: 'Oak phone booth holding hurried reporter notes and wire stubs.',
      coords: { top: 48, left: 82 }
    }
  },
  opera_house: {
    bodySpotLabel: 'Backstage Green-Room Parquet',
    bodySpotDescription: 'Crimson-curtained backstage wing beside gilded plaster columns.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'carriage alley stage door',
    recordSpot: {
      label: 'Stage Manager’s Prompt Desk',
      description: 'Curtain call sheets, box patron logs, and stagehand sign-ins.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Gilded Dressing Table & Flowers',
      description: 'Velvet dressing table cluttered with wilted bouquets and torn wires.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Carriage Alley Stage Door',
      description: 'Tall iron-studded backstage door opening onto the theatre court.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Foyer Will-Call Brass Window',
      description: 'Marble ticket booth holding uncollected box envelopes.',
      coords: { top: 46, left: 82 }
    }
  },
  customs_house: {
    bodySpotLabel: 'Federal Weigh-Scale Bay',
    bodySpotDescription: 'Granite floor beside massive cast-iron customs balances and seized crates.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'wharfside inspection shutter',
    recordSpot: {
      label: 'Port Collector’s Manifest Desk',
      description: 'Bound ship manifests, tariff seals, and seizure carbons.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Confiscated Crate Cage',
      description: 'Wire-fenced customs bond pen filled with re-tied dock chests.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Wharfside Inspection Shutter',
      description: 'Bolted steel warehouse shutter opening onto the harbor quay.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Tidewaiter’s Dispatch Hook',
      description: 'Wooden pigeonhole rack holding ship clearance slips.',
      coords: { top: 48, left: 82 }
    }
  },
  ferry_terminal: {
    bodySpotLabel: 'North Slip Fog Apron',
    bodySpotDescription: 'Wet planked ferry apron echoing with foghorns beside brass turnstiles.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'harbor boarding gangway chain',
    recordSpot: {
      label: 'Ticketmaster’s Turnstile Cage',
      description: 'Passenger fare tallies, deckhand logs, and timetable carbons.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Salt-Crusted Waiting Bench',
      description: 'Slatted dock bench beside an iron stove and soggy timetables.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Harbor Boarding Gangway Chain',
      description: 'Heavy iron chain gate overhanging dark churning ferry wake.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Steamer Trunk Check Counter',
      description: 'Battered wooden counter holding ferry baggage and parcel tags.',
      coords: { top: 46, left: 82 }
    }
  },
  pool_hall: {
    bodySpotLabel: 'Green Baize Table Four Floor',
    bodySpotDescription: 'Smoke-hung basement hall under shaded green-glass billiard lamps.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'alley cellar stair door',
    recordSpot: {
      label: 'Steward’s Chalk & Marker Desk',
      description: 'House IOU slips, cue rack tabs, and late tournament tallies.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Cue-Rack Bench & Brass Rail',
      description: 'Long wooden spectator bench stained by spilled rye and ash.',
      coords: { top: 74, left: 32 }
    },
    exitSpot: {
      label: 'Alley Cellar Stair Door',
      description: 'Low iron-braced door leading straight up the cellar steps.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Wall Payphone & Match Hook',
      description: 'Tin wall shelf holding house matchbooks and cab numbers.',
      coords: { top: 46, left: 82 }
    }
  },
  laundry_works: {
    bodySpotLabel: 'Steam Mangle & Sorting Floor',
    bodySpotDescription: 'Wet concrete floor thick with starch steam beside wicker shirt hampers.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'boiler-room delivery alley door',
    recordSpot: {
      label: 'Front Claim Ticket & Collar Desk',
      description: 'Wire-strung numbered laundry rush tags and hotel linen invoices.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Wicker Linen Hamper Row',
      description: 'Tall woven baskets piled with starched collars and hotel sheets.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Boiler-Room Alley Door',
      description: 'Steaming iron back door venting into the cobblestone cut-through.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Parcel Bundle Wrapping Table',
      description: 'Brown-paper bundle shelf stamped with Midtown delivery routes.',
      coords: { top: 48, left: 82 }
    }
  },
  bookshop: {
    bodySpotLabel: 'Folio Ladder Gallery Floor',
    bodySpotDescription: 'Creaking pine floorboards wedged tightly between towering rare-book stacks.',
    bodyCoords: { top: 54, left: 46 },
    exitFeature: 'bindery back-alley door',
    recordSpot: {
      label: 'Antiquarian’s Catalogue Desk',
      description: 'Auction appraisal ledgers, customer want-lists, and ex-libris stamps.',
      coords: { top: 36, left: 24 }
    },
    discardSpot: {
      label: 'Oak Folio Table & Magnifier',
      description: 'Velvet book-rest beside loose clippings and parcel twine.',
      coords: { top: 74, left: 34 }
    },
    exitSpot: {
      label: 'Bindery Back-Alley Door',
      description: 'Low narrow timber rear door bolted beside stacks of packed folios.',
      coords: { top: 24, left: 78 }
    },
    leadSpot: {
      label: 'Front Counter Parcel Basket',
      description: 'Wicker wrapping tray holding city dispatch cards and book receipts.',
      coords: { top: 48, left: 82 }
    }
  }
};
