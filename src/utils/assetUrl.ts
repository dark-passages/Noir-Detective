/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let RAW_BUNDLED_ASSETS: Record<string, string> = {};
try {
  RAW_BUNDLED_ASSETS = import.meta.glob('../assets/images/**/*.{jpg,jpeg,png,webp}', {
    eager: true,
    import: 'default'
  }) as Record<string, string>;
} catch {
  // Outside Vite (e.g. Node tsx unit tests), keep empty and fall back to source paths
}

const ASSETS_BY_PATH: Record<string, string> = {};
const ASSETS_BY_FILENAME: Record<string, string> = {};
for (const [key, url] of Object.entries(RAW_BUNDLED_ASSETS)) {
  if (typeof url !== 'string' || url.length === 0) continue;
  const normalizedPath = key.replace(/^\.\.\//, '/src/');
  ASSETS_BY_PATH[normalizedPath] = url;
  const filename = key.split('/').pop();
  if (filename) {
    ASSETS_BY_FILENAME[filename] = url;
  }
}

export function resolveAssetImage(assetPath: string): string {
  if (ASSETS_BY_PATH[assetPath]) {
    return ASSETS_BY_PATH[assetPath];
  }
  const filename = assetPath.split('/').pop();
  if (filename && ASSETS_BY_FILENAME[filename]) {
    return ASSETS_BY_FILENAME[filename];
  }
  return assetPath;
}

export function resolveAssetMap(map: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    resolved[k] = resolveAssetImage(v);
  }
  return resolved;
}
