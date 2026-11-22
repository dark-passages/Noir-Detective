/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MethodTemplate } from '../types/game';
import { resolveAssetImage, resolveAssetMap } from './assetUrl';

const WPN_BRASS_CANDLESTICK = resolveAssetImage('/src/assets/images/wpn_brass_candlestick_1794751404257.jpg');
const WPN_BRANDY_POISON = resolveAssetImage('/src/assets/images/wpn_brandy_flask_1794751404692.jpg');
const WPN_SNUB_REVOLVER = resolveAssetImage('/src/assets/images/wpn_snub_revolver_1794751404914.jpg');
const WPN_BONE_DAGGER = resolveAssetImage('/src/assets/images/wpn_bone_dagger_1794751405099.jpg');
const WPN_MORPHINE_OVERDOSE = resolveAssetImage('/src/assets/images/wpn_morphine_syringe_1794751406228.jpg');
const WPN_SILK_GARROTE = resolveAssetImage('/src/assets/images/wpn_silk_garrote_1794751405439.jpg');
const WPN_BAR_ICE_PICK = resolveAssetImage('/src/assets/images/wpn_ice_pick_1794751406071.jpg');
const WPN_BRASS_LAMP = resolveAssetImage('/src/assets/images/wpn_brass_lamp_1794751406882.jpg');
const WPN_DOCK_HOOK = resolveAssetImage('/src/assets/images/wpn_dock_hook_1794751406967.jpg');
const WPN_LETTER_OPENER = resolveAssetImage('/src/assets/images/wpn_letter_opener_1794751408138.jpg');
const WPN_HEAVY_TYPEWRITER = resolveAssetImage('/src/assets/images/wpn_heavy_typewriter_1794751408530.jpg');
const WPN_HEAVY_PIPE = resolveAssetImage('/src/assets/images/wpn_steam_pipe_1794751409260.jpg');
const WPN_UTILITY_KNIFE = resolveAssetImage('/src/assets/images/wpn_utility_knife_1794751408447.jpg');
const WPN_BAR_BOTTLE = resolveAssetImage('/src/assets/images/wpn_champagne_bottle_1794751409935.jpg');
const WPN_KITCHEN_CLEAVER = resolveAssetImage('/src/assets/images/wpn_kitchen_cleaver_1794751411223.jpg');
const WPN_TRAINING_DUMBBELL = resolveAssetImage('/src/assets/images/wpn_iron_dumbbell_1794751410990.jpg');
const WPN_JUMP_ROPE = resolveAssetImage('/src/assets/images/wpn_jump_rope_1794751410335.jpg');
const WPN_IRON_CROWBAR = resolveAssetImage('/src/assets/images/wpn_iron_crowbar_1794751411117.jpg');
const WPN_SURGICAL_SCALPEL = resolveAssetImage('/src/assets/images/wpn_surgical_scalpel_1794751410771.jpg');
const WPN_BONE_SAW = resolveAssetImage('/src/assets/images/wpn_bone_saw_1794751412094.jpg');
const WPN_FILLET_KNIFE = resolveAssetImage('/src/assets/images/wpn_fillet_knife_1794751411777.jpg');
const WPN_WRENCH = resolveAssetImage('/src/assets/images/wpn_monkey_wrench_1794751413520.jpg');
const WPN_FIRE_POKER = resolveAssetImage('/src/assets/images/wpn_fire_poker_1794751413747.jpg');
const WPN_HEAVY_DESK_ORNAMENT = resolveAssetImage('/src/assets/images/wpn_desk_ornament_1794751413535.jpg');
const WPN_ELECTRICAL_CABLE = resolveAssetImage('/src/assets/images/wpn_electrical_cable_1794751413445.jpg');
const WPN_ARSENIC_TONIC = resolveAssetImage('/src/assets/images/wpn_arsenic_tonic_1794751414274.jpg');
const WPN_POCKET_DERRINGER = resolveAssetImage('/src/assets/images/wpn_pocket_derringer_1794751414065.jpg');
const WPN_SERVICE_AUTOMATIC = resolveAssetImage('/src/assets/images/wpn_service_automatic_1794751415263.jpg');
const WPN_HAMMER = resolveAssetImage('/src/assets/images/wpn_dockyard_hammer_1794828589821.jpg');
const WPN_KITCHEN_KNIFE = resolveAssetImage('/src/assets/images/wpn_kitchen_knife_1794828588486.jpg');

export const WEAPON_IMAGES: Record<string, string> = resolveAssetMap({
  brass_candlestick: WPN_BRASS_CANDLESTICK,
  brandy_poison: WPN_BRANDY_POISON,
  snub_revolver: WPN_SNUB_REVOLVER,
  bone_dagger: WPN_BONE_DAGGER,
  morphine_overdose: WPN_MORPHINE_OVERDOSE,
  silk_garrote: WPN_SILK_GARROTE,
  bar_ice_pick: WPN_BAR_ICE_PICK,
  brass_lamp: WPN_BRASS_LAMP,
  dock_hook: WPN_DOCK_HOOK,
  letter_opener: WPN_LETTER_OPENER,
  heavy_typewriter: WPN_HEAVY_TYPEWRITER,
  heavy_pipe: WPN_HEAVY_PIPE,
  utility_knife: WPN_UTILITY_KNIFE,
  bar_bottle: WPN_BAR_BOTTLE,
  kitchen_cleaver: WPN_KITCHEN_CLEAVER,
  training_dumbbell: WPN_TRAINING_DUMBBELL,
  jump_rope: WPN_JUMP_ROPE,
  iron_crowbar: WPN_IRON_CROWBAR,
  surgical_scalpel: WPN_SURGICAL_SCALPEL,
  bone_saw: WPN_BONE_SAW,
  fillet_knife: WPN_FILLET_KNIFE,
  wrench: WPN_WRENCH,
  fire_poker: WPN_FIRE_POKER,
  heavy_desk_ornament: WPN_HEAVY_DESK_ORNAMENT,
  electrical_cable: WPN_ELECTRICAL_CABLE,
  arsenic_tonic: WPN_ARSENIC_TONIC,
  pocket_derringer: WPN_POCKET_DERRINGER,
  service_automatic: WPN_SERVICE_AUTOMATIC,
  hammer: WPN_HAMMER,
  kitchen_knife: WPN_KITCHEN_KNIFE
});

export function getWeaponImage(
  weaponOrId: string | Pick<MethodTemplate, 'id' | 'category'>
): string {
  const id = typeof weaponOrId === 'string' ? weaponOrId : weaponOrId.id;
  if (WEAPON_IMAGES[id]) {
    return WEAPON_IMAGES[id];
  }
  if (typeof weaponOrId !== 'string') {
    switch (weaponOrId.category) {
      case 'Poison':
        return WPN_ARSENIC_TONIC;
      case 'Firearm':
        return WPN_SNUB_REVOLVER;
      case 'Edged Weapon':
        return WPN_LETTER_OPENER;
      case 'Strangulation':
        return WPN_SILK_GARROTE;
      default:
        return WPN_BRASS_CANDLESTICK;
    }
  }
  return WPN_BRASS_CANDLESTICK;
}
