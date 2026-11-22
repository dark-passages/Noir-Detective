/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MethodTemplate } from '../types/game';
import { resolveAssetImage, resolveAssetMap } from './assetUrl';

const WPN_BRASS_CANDLESTICK = resolveAssetImage('/src/assets/images/weapon/brass_candlestick.jpg');
const WPN_BRANDY_POISON = resolveAssetImage('/src/assets/images/weapon/brandy_flask.jpg');
const WPN_SNUB_REVOLVER = resolveAssetImage('/src/assets/images/weapon/snub_revolver.jpg');
const WPN_BONE_DAGGER = resolveAssetImage('/src/assets/images/weapon/bone_dagger.jpg');
const WPN_MORPHINE_OVERDOSE = resolveAssetImage('/src/assets/images/weapon/morphine_syringe.jpg');
const WPN_SILK_GARROTE = resolveAssetImage('/src/assets/images/weapon/silk_garrote.jpg');
const WPN_BAR_ICE_PICK = resolveAssetImage('/src/assets/images/weapon/ice_pick.jpg');
const WPN_BRASS_LAMP = resolveAssetImage('/src/assets/images/weapon/brass_lamp.jpg');
const WPN_DOCK_HOOK = resolveAssetImage('/src/assets/images/weapon/dock_hook.jpg');
const WPN_LETTER_OPENER = resolveAssetImage('/src/assets/images/weapon/letter_opener.jpg');
const WPN_HEAVY_TYPEWRITER = resolveAssetImage('/src/assets/images/weapon/heavy_typewriter.jpg');
const WPN_HEAVY_PIPE = resolveAssetImage('/src/assets/images/weapon/steam_pipe.jpg');
const WPN_UTILITY_KNIFE = resolveAssetImage('/src/assets/images/weapon/utility_knife.jpg');
const WPN_BAR_BOTTLE = resolveAssetImage('/src/assets/images/weapon/champagne_bottle.jpg');
const WPN_KITCHEN_CLEAVER = resolveAssetImage('/src/assets/images/weapon/kitchen_cleaver.jpg');
const WPN_TRAINING_DUMBBELL = resolveAssetImage('/src/assets/images/weapon/iron_dumbbell.jpg');
const WPN_JUMP_ROPE = resolveAssetImage('/src/assets/images/weapon/jump_rope.jpg');
const WPN_IRON_CROWBAR = resolveAssetImage('/src/assets/images/weapon/iron_crowbar.jpg');
const WPN_SURGICAL_SCALPEL = resolveAssetImage('/src/assets/images/weapon/surgical_scalpel.jpg');
const WPN_BONE_SAW = resolveAssetImage('/src/assets/images/weapon/bone_saw.jpg');
const WPN_FILLET_KNIFE = resolveAssetImage('/src/assets/images/weapon/fillet_knife.jpg');
const WPN_WRENCH = resolveAssetImage('/src/assets/images/weapon/monkey_wrench.jpg');
const WPN_FIRE_POKER = resolveAssetImage('/src/assets/images/weapon/fire_poker.jpg');
const WPN_HEAVY_DESK_ORNAMENT = resolveAssetImage('/src/assets/images/weapon/desk_ornament.jpg');
const WPN_ELECTRICAL_CABLE = resolveAssetImage('/src/assets/images/weapon/electrical_cable.jpg');
const WPN_ARSENIC_TONIC = resolveAssetImage('/src/assets/images/weapon/arsenic_tonic.jpg');
const WPN_POCKET_DERRINGER = resolveAssetImage('/src/assets/images/weapon/pocket_derringer.jpg');
const WPN_SERVICE_AUTOMATIC = resolveAssetImage('/src/assets/images/weapon/service_automatic.jpg');
const WPN_HAMMER = resolveAssetImage('/src/assets/images/weapon/dockyard_hammer.jpg');
const WPN_KITCHEN_KNIFE = resolveAssetImage('/src/assets/images/weapon/kitchen_knife.jpg');

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
