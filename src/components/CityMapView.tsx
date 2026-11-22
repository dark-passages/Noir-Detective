/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Compass,
  ArrowRight,
  Briefcase,
  Building,
  Building2,
  Wine,
  Church,
  Anchor,
  Stethoscope,
  Newspaper,
  Footprints,
  Users,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Clock,
  Hotel,
  Train,
  Music,
  Dumbbell,
  Fish,
  Warehouse,
  Landmark,
  Radio,
  Store,
  Utensils,
  Scissors,
  Shield,
  BookOpen,
  Mail,
  Car,
  Film,
  Scale,
  FlaskConical,
  Hammer,
  KeyRound
} from 'lucide-react';
import {
  LocationCaseInstance,
  CharacterCaseInstance,
  CharacterScheduleWindow
} from '../types/game';
import { noirAudio } from '../utils/audio';
import { getCharacterMugshot } from '../utils/characterImages';
import { MugshotModal } from './MugshotModal';
import { AGENCY_NAME, MASTER_LOCATIONS } from '../engine/templates';
import { calculateRoadTravelMinutes, findShortestRoadPath } from '../engine/fragments';
import {
  DEFAULT_INVESTIGATION_START_MINUTES,
  is24HourSchedule,
  isCharacterPresentAt,
  isLocationOpenAt
} from '../engine/timeUtils';
import { CharacterInterviewStatus, LocationMapStatus } from '../engine/mapStatus';

interface CityMapViewProps {
  locations: Record<string, LocationCaseInstance>;
  currentLocationId: string;
  locationStatuses?: Record<string, LocationMapStatus>;
  characterStatuses?: Record<string, CharacterInterviewStatus>;
  onTravelToLocation: (locId: string) => void;
  livingCharacters: CharacterCaseInstance[];
  totalTravelMinutes: number;
  schedules?: Record<string, CharacterScheduleWindow[]>;
  investigationMinutes?: number;
  onAdvanceTime?: (mins: number) => void;
}

export const CityMapView: React.FC<CityMapViewProps> = ({
  locations,
  currentLocationId,
  locationStatuses,
  characterStatuses,
  onTravelToLocation,
  livingCharacters,
  totalTravelMinutes,
  schedules,
  investigationMinutes = DEFAULT_INVESTIGATION_START_MINUTES,
  onAdvanceTime
}) => {
  const locationList = Object.values(locations);
  // Only accessible (discovered) locations are shown on the map
  const discoveredLocations = useMemo(
    () => locationList.filter((l) => l.discovered),
    [locationList]
  );

  // Selected location for the mobile-friendly bottom inspection card
  const [selectedLocId, setSelectedLocId] = useState<string>(currentLocationId);
  const [inspectedPortrait, setInspectedPortrait] = useState<{
    char: CharacterCaseInstance;
    contextLabel?: string;
  } | null>(null);

  // Sync selected location when current location changes
  useEffect(() => {
    setSelectedLocId(currentLocationId);
  }, [currentLocationId]);

  // Helper for crisp, distinctive location names
  const getLocationDisplayName = (name: string, id: string): string => {
    switch (id) {
      case 'agency':
        return AGENCY_NAME;
      case 'grand_hotel':
        return 'Grand St. Moritz Hotel';
      case 'grand_hotel2':
        return 'Starlight Grand Hotel';
      case 'velvet_lounge':
        return 'The Velvet Lounge';
      case 'st_judes':
        return "St. Jude's Belltower";
      case 'blackwood_antiquities':
        return 'Blackwood Antiquities';
      case 'pier_four':
        return 'Pier 4 Boathouse';
      case 'pendelton_clinic':
        return 'Pendelton Surgery';
      case 'clarion_newsroom':
        return 'Daily Clarion Press';
      case 'cobblestone_alley':
        return "Raven's Alley";
      default:
        return name;
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return Briefcase;
      case 'Building':
        return Building;
      case 'Building2':
        return Building2;
      case 'Hotel':
        return Hotel;
      case 'Wine':
        return Wine;
      case 'Church':
        return Church;
      case 'Compass':
        return Compass;
      case 'Anchor':
        return Anchor;
      case 'Stethoscope':
        return Stethoscope;
      case 'Newspaper':
        return Newspaper;
      case 'Footprints':
        return Footprints;
      case 'Train':
        return Train;
      case 'Music':
        return Music;
      case 'Dumbbell':
        return Dumbbell;
      case 'Fish':
        return Fish;
      case 'Warehouse':
        return Warehouse;
      case 'Users':
        return Users;
      case 'Landmark':
        return Landmark;
      case 'Radio':
        return Radio;
      case 'Store':
        return Store;
      case 'Utensils':
        return Utensils;
      case 'Scissors':
        return Scissors;
      case 'Shield':
        return Shield;
      case 'BookOpen':
        return BookOpen;
      case 'Mail':
        return Mail;
      case 'Car':
        return Car;
      case 'Film':
        return Film;
      case 'Scale':
        return Scale;
      case 'FlaskConical':
        return FlaskConical;
      case 'Hammer':
        return Hammer;
      case 'KeyRound':
        return KeyRound;
      default:
        return MapPin;
    }
  };

  const getPeoplePresentAt = (loc: LocationCaseInstance | undefined): CharacterCaseInstance[] => {
    if (!loc) return [];
    return livingCharacters.filter((c) => {
      if (schedules && schedules[c.id]) {
        return isCharacterPresentAt(
          schedules,
          c.id,
          loc.id,
          investigationMinutes,
          loc.openingHours,
          'investigation_day'
        );
      }
      return c.currentLocationId === loc.id;
    });
  };

  const formatHoursLabel = (openingHours?: { open: string; close: string }) => {
    if (!openingHours || is24HourSchedule(openingHours)) return '24 Hours';
    return `${openingHours.open}–${openingHours.close}`;
  };

  const currentLocation = locations[currentLocationId] || discoveredLocations[0] || locationList[0];
  const inspectedLocation = locations[selectedLocId] || currentLocation;

  // Precompute road links connecting visible (discovered) locations:
  // If two visible locations connect through 1+ undiscovered intermediate locations,
  // render the continuous polyline through those hidden coordinates without showing hidden pins.
  const { visibleRoadPaths, activeRoutePoints } = useMemo(() => {
    const byId = Object.fromEntries(MASTER_LOCATIONS.map((l) => [l.id, l]));
    const discoveredIds = new Set(discoveredLocations.map((l) => l.id));

    const getCoords = (id: string) => {
      const live = locations[id];
      if (live) return live.mapCoords;
      return byId[id]?.mapCoords;
    };

    const getPolylineMidpoint = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return { x: 50, y: 50 };
      if (pts.length === 1) return pts[0];
      let totalLen = 0;
      const segLens: number[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        segLens.push(d);
        totalLen += d;
      }
      if (totalLen === 0) return pts[0];
      let target = totalLen / 2;
      for (let i = 0; i < segLens.length; i++) {
        if (target <= segLens[i]) {
          const t = segLens[i] === 0 ? 0 : target / segLens[i];
          return {
            x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
            y: pts[i].y + (pts[i + 1].y - pts[i].y) * t
          };
        }
        target -= segLens[i];
      }
      return pts[pts.length - 1];
    };

    const paths: {
      key: string;
      fromId: string;
      toId: string;
      pointsAttr: string;
      totalMinutes: number;
      isIndirect: boolean;
      touchesCurrent: boolean;
      touchesSelected: boolean;
      midPoint: { x: number; y: number };
    }[] = [];

    for (let i = 0; i < discoveredLocations.length; i++) {
      for (let j = i + 1; j < discoveredLocations.length; j++) {
        const a = discoveredLocations[i];
        const b = discoveredLocations[j];
        const res = findShortestRoadPath(MASTER_LOCATIONS, a.id, b.id);
        if (res.path.length < 2) continue;
        const intermediates = res.path.slice(1, -1);
        // Only draw connecting corridor if all intermediate stops are hidden;
        // once an intermediate stop becomes visible, its two sub-legs render separately.
        if (!intermediates.every((id) => !discoveredIds.has(id))) {
          continue;
        }
        const pts = res.path
          .map((id) => getCoords(id))
          .filter((c): c is { x: number; y: number } => Boolean(c));
        if (pts.length < 2) continue;

        paths.push({
          key: a.id < b.id ? `${a.id}__${b.id}` : `${b.id}__${a.id}`,
          fromId: a.id,
          toId: b.id,
          pointsAttr: pts.map((p) => `${p.x},${p.y}`).join(' '),
          totalMinutes: res.totalMinutes,
          isIndirect: intermediates.length > 0,
          touchesCurrent: a.id === currentLocationId || b.id === currentLocationId,
          touchesSelected:
            (a.id === currentLocationId && b.id === selectedLocId) ||
            (b.id === currentLocationId && a.id === selectedLocId),
          midPoint: getPolylineMidpoint(pts)
        });
      }
    }

    let routePtsAttr: string | null = null;
    if (
      selectedLocId &&
      selectedLocId !== currentLocationId &&
      discoveredIds.has(selectedLocId) &&
      discoveredIds.has(currentLocationId)
    ) {
      const activeRes = findShortestRoadPath(MASTER_LOCATIONS, currentLocationId, selectedLocId);
      const pts = activeRes.path
        .map((id) => getCoords(id))
        .filter((c): c is { x: number; y: number } => Boolean(c));
      if (pts.length >= 2) {
        routePtsAttr = pts.map((p) => `${p.x},${p.y}`).join(' ');
      }
    }

    return { visibleRoadPaths: paths, activeRoutePoints: routePtsAttr };
  }, [discoveredLocations, locations, currentLocationId, selectedLocId]);

  const neighborhoodLabels: { name: string; x: number; y: number }[] = [
    { name: 'Cathedral Heights', x: 17, y: 3.5 },
    { name: 'Uptown Promenade', x: 46, y: 3.5 },
    { name: 'Civic Centre', x: 79, y: 3.5 },
    { name: 'Old Quarter', x: 14, y: 37.5 },
    { name: 'Midtown District', x: 49, y: 29.5 },
    { name: 'Midtown Promenade', x: 84, y: 38.5 },
    { name: 'The Gutters', x: 48, y: 61.5 },
    { name: 'Theatre Row', x: 84, y: 61.5 },
    { name: 'Industrial Docklands', x: 52, y: 95.5 }
  ];

  // Calculate bounding box and center of discovered locations for optimal auto-fit
  const { centerX, centerY, autoFitZoom } = useMemo(() => {
    if (discoveredLocations.length === 0) {
      return { centerX: 50, centerY: 50, autoFitZoom: 1 };
    }
    const xs = discoveredLocations.map((l) => l.mapCoords.x);
    const ys = discoveredLocations.map((l) => l.mapCoords.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const cX = (minX + maxX) / 2;
    const cY = (minY + maxY) / 2;
    const spansX = Math.max(maxX - minX, 18);
    const spansY = Math.max(maxY - minY, 18);
    const fitZoomX = 80 / spansX;
    const fitZoomY = 72 / spansY;
    const calculatedZoom = Math.max(0.75, Math.min(2.1, Math.min(fitZoomX, fitZoomY)));

    return { centerX: cX, centerY: cY, autoFitZoom: calculatedZoom };
  }, [discoveredLocations]);

  // Camera state (panOrigin = map coords centered in viewport; zoom >= 0.65 spreads space between pins without scaling pin/icon size)
  const [camera, setCamera] = useState<{ x: number; y: number; zoom: number }>({
    x: centerX,
    y: centerY,
    zoom: autoFitZoom
  });
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const suppressMarkerClickRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startCamX: number;
    startCamY: number;
    rectWidth: number;
    rectHeight: number;
    dragging: boolean;
  } | null>(null);

  const clampPan = useCallback((x: number, y: number) => ({
    x: Math.max(-5, Math.min(105, x)),
    y: Math.max(-5, Math.min(105, y))
  }), []);

  const stopCameraAnimation = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const animateCameraTo = useCallback(
    (targetX: number, targetY: number, targetZoom: number) => {
      stopCameraAnimation();
      const start = { ...cameraRef.current };
      const clamped = clampPan(targetX, targetY);
      const clampedZoom = Math.max(0.65, Math.min(3.2, targetZoom));
      if (
        Math.abs(start.x - clamped.x) < 0.01 &&
        Math.abs(start.y - clamped.y) < 0.01 &&
        Math.abs(start.zoom - clampedZoom) < 0.001
      ) {
        return;
      }
      const startTime = performance.now();
      const durationMs = 220;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = {
          x: start.x + (clamped.x - start.x) * eased,
          y: start.y + (clamped.y - start.y) * eased,
          zoom: start.zoom + (clampedZoom - start.zoom) * eased
        };
        cameraRef.current = next;
        setCamera(next);
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          animFrameRef.current = null;
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    },
    [clampPan, stopCameraAnimation]
  );

  // Sync fit when discovered location set changes
  useEffect(() => {
    animateCameraTo(centerX, centerY, autoFitZoom);
    return () => stopCameraAnimation();
  }, [autoFitZoom, centerX, centerY, animateCameraTo, stopCameraAnimation]);

  const handleZoomIn = () => {
    noirAudio.playTypewriterKey();
    const cur = cameraRef.current;
    animateCameraTo(cur.x, cur.y, Math.min(cur.zoom + 0.35, 3.2));
  };

  const handleZoomOut = () => {
    noirAudio.playTypewriterKey();
    const cur = cameraRef.current;
    animateCameraTo(cur.x, cur.y, Math.max(cur.zoom - 0.35, 0.65));
  };

  const handleResetFit = () => {
    noirAudio.playPaperRustle();
    animateCameraTo(centerX, centerY, autoFitZoom);
  };

  const handleCenterCurrent = () => {
    noirAudio.playPaperRustle();
    if (currentLocation) {
      animateCameraTo(
        currentLocation.mapCoords.x,
        currentLocation.mapCoords.y,
        Math.max(cameraRef.current.zoom, 1.45)
      );
    }
  };

  const handleMarkerClick = (locId: string) => {
    if (suppressMarkerClickRef.current) return;
    noirAudio.playPaperRustle();
    setSelectedLocId(locId);
    const loc = locations[locId];
    if (loc) {
      animateCameraTo(loc.mapCoords.x, loc.mapCoords.y, cameraRef.current.zoom);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const el = mapContainerRef.current;
    if (!el) return;
    stopCameraAnimation();
    const rect = el.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCamX: cameraRef.current.x,
      startCamY: cameraRef.current.y,
      rectWidth: Math.max(rect.width, 1),
      rectHeight: Math.max(rect.height, 1),
      dragging: false
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;

    if (!drag.dragging) {
      if (Math.hypot(dx, dy) < 5) return;
      drag.dragging = true;
      suppressMarkerClickRef.current = true;
      setIsDragging(true);
      try {
        mapContainerRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer already released
      }
    }

    const z = cameraRef.current.zoom;
    const deltaMapX = (dx / drag.rectWidth) * (100 / z);
    const deltaMapY = (dy / drag.rectHeight) * (100 / z);
    const nextPan = clampPan(drag.startCamX - deltaMapX, drag.startCamY - deltaMapY);
    const nextCam = { x: nextPan.x, y: nextPan.y, zoom: z };
    cameraRef.current = nextCam;
    setCamera(nextCam);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const wasDragging = drag.dragging;
    dragStateRef.current = null;
    setIsDragging(false);
    if (wasDragging) {
      try {
        if (mapContainerRef.current?.hasPointerCapture(e.pointerId)) {
          mapContainerRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
      setTimeout(() => {
        suppressMarkerClickRef.current = false;
      }, 0);
    } else {
      suppressMarkerClickRef.current = false;
    }
  };

  // Convert map percentage coordinates (0..100) to current viewport screen percentage
  const toScreenX = (mx: number) => 50 + (mx - camera.x) * camera.zoom;
  const toScreenY = (my: number) => 50 + (my - camera.y) * camera.zoom;

  const svgViewBoxX = camera.x - 50 / camera.zoom;
  const svgViewBoxY = camera.y - 50 / camera.zoom;
  const svgViewBoxW = 100 / camera.zoom;
  const svgViewBoxH = 100 / camera.zoom;

  const canalBridges: {
    id: string;
    name: string;
    x: number;
    y: number;
    dx: number;
    dy: number;
    px: number;
    py: number;
  }[] = [
    {
      id: 'bridge_bellfoundry',
      name: 'Bellfoundry Bridge',
      x: 7.0,
      y: 57.3,
      dx: 0,
      dy: 2.0,
      px: 1.7,
      py: 0
    },
    {
      id: 'bridge_antiquities',
      name: 'Old Quay Bridge',
      x: 18.6,
      y: 59.2,
      dx: 1.0,
      dy: 1.8,
      px: 1.6,
      py: -0.9
    },
    {
      id: 'bridge_gullpoint',
      name: 'Gull Point Bascule',
      x: 27.9,
      y: 65.6,
      dx: 2.1,
      dy: 0.5,
      px: -0.4,
      py: 1.8
    },
    {
      id: 'bridge_morgue',
      name: 'Morgue Iron Bridge',
      x: 27.6,
      y: 77.0,
      dx: 2.1,
      dy: 0.3,
      px: -0.2,
      py: 1.8
    },
    {
      id: 'bridge_mill',
      name: 'Mill Swing Bridge',
      x: 26.2,
      y: 89.0,
      dx: 2.2,
      dy: 0,
      px: 0,
      py: 1.8
    }
  ];

  const peopleAtSelected = getPeoplePresentAt(inspectedLocation);

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-6 md:py-8 space-y-3 md:space-y-4 pb-24 flex flex-col">
      {/* 1. Full-Width Top Banner: Generous Title, District & Transit Info */}
      <div className="p-4 rounded-xl bg-[#131720] border border-[#232B3B] shadow-md shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
            <Compass className="w-3.5 h-3.5" />
            <span>CURRENT LOCATION</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-serif font-bold text-[#E5DEC9]">
            {getLocationDisplayName(currentLocation?.name, currentLocation?.id)}
          </h1>
          <p className="text-xs text-[#8A96A8] leading-relaxed max-w-xl">
            {currentLocation?.description}
          </p>
        </div>

        {/* Transit & Discovery Stats without leaking total locations */}
        <div className="flex items-center gap-5 sm:gap-8 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#202735] shrink-0">
          <div>
            <div className="flex items-center gap-1 text-[11px] text-[#717E91] font-mono">
              <Clock className="w-3 h-3 text-[#F59E0B]" />
              <span>TOTAL TRANSIT</span>
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-[#E5DEC9] tabular-nums">
              {totalTravelMinutes} minutes
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dedicated Navigation Toolbar Strip (placed between the description and the map) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#0F1218] border border-[#222A38] shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            className="w-8 h-8 rounded-lg bg-[#18202D] hover:bg-[#253044] text-[#D5CDBC] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="w-8 h-8 rounded-lg bg-[#18202D] hover:bg-[#253044] text-[#D5CDBC] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-[#263143] mx-1" />
          <button
            onClick={handleResetFit}
            title="Fit All Accessible Locations"
            aria-label="Fit All Accessible Locations"
            className="px-3 h-8 rounded-lg bg-[#18202D] hover:bg-[#253044] text-xs font-mono text-[#F59E0B] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit All</span>
          </button>
          <button
            onClick={handleCenterCurrent}
            title="Center on Current Position"
            aria-label="Center on Current Position"
            className="px-3 h-8 rounded-lg bg-[#18202D] hover:bg-[#253044] text-xs font-mono text-[#60A5FA] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>My Location</span>
          </button>
        </div>

        {/* Status Legend & Investigation Clock */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px]">
          <span className="inline-flex items-center gap-1 text-[#FEF08A]">
            <span className="w-2 h-2 rounded-full bg-[#FACC15]" /> Current
          </span>
          <span className="inline-flex items-center gap-1 text-[#FCA5A5]">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Not Visited
          </span>
          <span className="inline-flex items-center gap-1 text-[#FDBA74]">
            <span className="w-2 h-2 rounded-full bg-[#EA580C]" /> Updated
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Visited
          </span>
          <span className="text-[#475569]">·</span>
          <span className="text-[#8A96A8]">
            Name: <span className="text-emerald-300">Open</span> / <span className="text-rose-300">Closed</span>
          </span>
        </div>
      </div>

      {/* 3. The Graphical Noir Map Canvas (Draggable via Mouse or Touch, Fixed Icon Size on Zoom) */}
      <div
        ref={mapContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className={`relative w-full h-[400px] sm:h-[480px] md:h-[540px] min-h-[360px] rounded-2xl bg-[#0F1218] border border-[#252C3B] overflow-hidden shadow-2xl shrink-0 touch-none select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Inner Map Layer (Camera ViewBox maps coordinates cleanly without scaling pin icons) */}
        <div className="absolute inset-0 w-full h-full">
          {/* Stylized District Grid, Crinkly River/Harbor Water Flow, Bridges & Street Network */}
          <svg
            viewBox={`${svgViewBoxX} ${svgViewBoxY} ${svgViewBoxW} ${svgViewBoxH}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {/* Outer Deep Harbor Basin & Jagged West Riverbank */}
            <path
              d="M -25 -20 L 2.2 -20 L 1.5 6 L 3.2 13 L 1.3 20 L 2.9 27 L 1.2 35 L 3.1 42 L 1.6 49 L 3.3 56.5 L 1.7 64 L 3.4 72 L 1.4 80 L 2.9 88 L 1.6 93.2 L 7 93.8 L 11 95.1 L 16 93.6 L 21 94.8 L 26 93.5 L 31 95.3 L 36 93.7 L 42 94.9 L 47 93.4 L 53 95.1 L 59 93.7 L 65 95.2 L 71 93.6 L 77 94.9 L 83 93.6 L 89 95.0 L 95 93.6 L 103 94.5 L 125 94 L 125 120 L -25 120 Z"
              fill="#0A111C"
            />

            {/* Winding Blackwater Canal (splits East across Old Quarter/Docklands, then South into New Bay Harbor) */}
            <path
              d="M 1.8 57.5 L 5.2 56.8 L 8.6 57.7 L 12.1 58.6 L 15.8 58.0 L 19.4 59.5 L 23.6 60.4 L 27.6 61.9 L 28.4 65.5 L 26.8 70.6 L 28.1 76.4 L 26.7 82.1 L 27.8 87.3 L 25.8 94.4"
              fill="none"
              stroke="#0A111C"
              strokeWidth="26"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M 1.8 57.5 L 5.2 56.8 L 8.6 57.7 L 12.1 58.6 L 15.8 58.0 L 19.4 59.5 L 23.6 60.4 L 27.6 61.9 L 28.4 65.5 L 26.8 70.6 L 28.1 76.4 L 26.7 82.1 L 27.8 87.3 L 25.8 94.4"
              fill="none"
              stroke="#1E304A"
              strokeWidth="12"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M 1.8 57.5 L 5.2 56.8 L 8.6 57.7 L 12.1 58.6 L 15.8 58.0 L 19.4 59.5 L 23.6 60.4 L 27.6 61.9 L 28.4 65.5 L 26.8 70.6 L 28.1 76.4 L 26.7 82.1 L 27.8 87.3 L 25.8 94.4"
              fill="none"
              stroke="#0D1726"
              strokeWidth="8"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Crinkly Shoreline Edge Outline */}
            <path
              d="M 2.2 -10 L 1.5 6 L 3.2 13 L 1.3 20 L 2.9 27 L 1.2 35 L 3.1 42 L 1.6 49 L 3.3 56.5 L 1.7 64 L 3.4 72 L 1.4 80 L 2.9 88 L 1.6 93.2 L 7 93.8 L 11 95.1 L 16 93.6 L 21 94.8 L 26 93.5 L 31 95.3 L 36 93.7 L 42 94.9 L 47 93.4 L 53 95.1 L 59 93.7 L 65 95.2 L 71 93.6 L 77 94.9 L 83 93.6 L 89 95.0 L 95 93.6 L 106 94.5"
              fill="none"
              stroke="#243B59"
              strokeWidth="1.6"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Crinkly Water Flow Currents & Harbor Ripples */}
            <path
              d="M 2.5 57.5 Q 4.5 56.4, 6.8 57.4 T 11.4 58.2 T 16.0 58.3 T 20.8 59.7 T 25.6 61.0 T 27.9 65.8 T 27.3 71.5 T 27.7 77.2 T 27.1 83.2 T 26.6 89.2 L 26.0 94.5"
              fill="none"
              stroke="#2E4A70"
              strokeOpacity={0.65}
              strokeWidth="1.2"
              strokeDasharray="5 3 2 3"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M 0.9 12 L 2.1 19 L 0.8 27 L 2.0 34 L 0.7 42 L 2.1 50 L 0.9 58 L 2.2 66 L 0.8 74 L 2.1 82 L 0.9 90 L 3.5 96.4 L 9 95.9 L 15 97.1 L 22 96.1 L 29 97.3 L 36 96.0 L 44 97.1 L 52 95.9 L 60 97.2 L 68 96.1 L 76 97.2 L 84 96.0 L 92 97.1 L 104 96.2"
              fill="none"
              stroke="#2A4263"
              strokeOpacity={0.7}
              strokeWidth="1.2"
              strokeDasharray="6 4 2 4"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M 5 99.1 L 13 98.2 L 21 99.3 L 30 98.1 L 39 99.4 L 48 98.2 L 57 99.3 L 66 98.3 L 75 99.4 L 85 98.2 L 95 99.2 L 106 98.5"
              fill="none"
              stroke="#233856"
              strokeOpacity={0.55}
              strokeWidth="1.1"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
            />

            {/* Wooden Harbor Quays / Docks jutting along Pier 4 & Ferry Slip */}
            <path
              d="M 45 92.2 L 45 95.4 M 71 92.2 L 71 95.8 M 69.8 94.8 L 72.2 94.8 M 95 92.2 L 95 95.6"
              fill="none"
              stroke="#3B4D6B"
              strokeWidth="2.2"
              strokeLinecap="square"
              vectorEffect="non-scaling-stroke"
            />

            {/* Neighborhood Boundary Gridlines */}
            <line
              x1="31"
              y1="-10"
              x2="31"
              y2="84"
              stroke="#1E2533"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="66"
              y1="-10"
              x2="66"
              y2="84"
              stroke="#1E2533"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="-10"
              y1="36"
              x2="110"
              y2="36"
              stroke="#1E2533"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="-10"
              y1="60"
              x2="110"
              y2="60"
              stroke="#1E2533"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="28"
              y1="84"
              x2="110"
              y2="84"
              stroke="#1E2533"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />

            {/* Architectural Bridges Across the Blackwater Canal */}
            {canalBridges.map((br) => {
              const x1 = br.x - br.dx;
              const y1 = br.y - br.dy;
              const x2 = br.x + br.dx;
              const y2 = br.y + br.dy;
              const railOffX = br.px * 0.45;
              const railOffY = br.py * 0.45;
              return (
                <g key={br.id}>
                  {/* Stone/Timber Deck Span */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#2B3548"
                    strokeWidth="9"
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Left & Right Bridge Parapet Girders + Flared Abutments */}
                  <line
                    x1={x1 - railOffX}
                    y1={y1 - railOffY}
                    x2={x2 - railOffX}
                    y2={y2 - railOffY}
                    stroke="#94A3B8"
                    strokeOpacity={0.7}
                    strokeWidth="1.6"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={x1 + railOffX}
                    y1={y1 + railOffY}
                    x2={x2 + railOffX}
                    y2={y2 + railOffY}
                    stroke="#94A3B8"
                    strokeOpacity={0.7}
                    strokeWidth="1.6"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={x1 - railOffX * 1.45}
                    y1={y1 - railOffY * 1.45}
                    x2={x1 + railOffX * 1.45}
                    y2={y1 + railOffY * 1.45}
                    stroke="#64748B"
                    strokeOpacity={0.65}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={x2 - railOffX * 1.45}
                    y1={y2 - railOffY * 1.45}
                    x2={x2 + railOffX * 1.45}
                    y2={y2 + railOffY * 1.45}
                    stroke="#64748B"
                    strokeOpacity={0.65}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}

            {/* Visible Location Street Network (including indirect paths routed via hidden intermediates) */}
            {visibleRoadPaths.map((edge) => (
              <polyline
                key={edge.key}
                points={edge.pointsAttr}
                fill="none"
                stroke={edge.touchesSelected ? '#60A5FA' : '#F59E0B'}
                strokeOpacity={edge.touchesSelected ? 0.85 : edge.touchesCurrent ? 0.58 : 0.32}
                strokeWidth={edge.touchesSelected ? 3 : edge.touchesCurrent ? 2.4 : 1.9}
                strokeDasharray={edge.isIndirect ? '5 4' : '4 2'}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Highlighted Shortest Route to Inspected Location */}
            {activeRoutePoints && (
              <polyline
                points={activeRoutePoints}
                fill="none"
                stroke="#60A5FA"
                strokeOpacity={0.9}
                strokeWidth={3.2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Subtle Bridge Name Callouts (shown cleanly when zoomed in for extra spacing) */}
          {camera.zoom >= 1.25 &&
            canalBridges.map((br) => (
              <div
                key={`label-${br.id}`}
                style={{ left: `${toScreenX(br.x)}%`, top: `${toScreenY(br.y)}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-[11]"
              >
                <span className="px-1 py-[1px] rounded bg-[#0D131E]/85 border border-[#334155]/60 font-mono text-[8px] uppercase tracking-wider text-[#94A3B8] whitespace-nowrap">
                  {br.name}
                </span>
              </div>
            ))}

          {/* Subtle Neighborhood Labels */}
          {neighborhoodLabels.map((zone) => (
            <div
              key={zone.name}
              style={{ left: `${toScreenX(zone.x)}%`, top: `${toScreenY(zone.y)}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-10"
            >
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-[#56667F]/75 whitespace-nowrap">
                {zone.name}
              </span>
            </div>
          ))}

          {/* Path Travel-Time Badges on Paths Connected to Current Location */}
          {visibleRoadPaths
            .filter((edge) => edge.touchesCurrent || edge.touchesSelected)
            .map((edge) => (
              <div
                key={`time-${edge.key}`}
                style={{ left: `${toScreenX(edge.midPoint.x)}%`, top: `${toScreenY(edge.midPoint.y)}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-[15]"
              >
                <span
                  className={`px-1.5 py-0.5 rounded font-mono text-[9px] tabular-nums border shadow-sm ${
                    edge.touchesSelected
                      ? 'bg-[#102038]/95 text-[#93C5FD] border-[#3B82F6]/60'
                      : 'bg-[#0F1218]/90 text-[#FBBF24]/90 border-[#F59E0B]/35'
                  }`}
                >
                  {edge.totalMinutes}m
                </span>
              </div>
            ))}

          {/* Accessible Location Markers (Locked locations are completely hidden; markers keep fixed size on zoom) */}
          {discoveredLocations.map((loc) => {
            const Icon = getIcon(loc.icon);
            const status = locationStatuses?.[loc.id];
            const isCurrent = status ? status.isCurrent : loc.id === currentLocationId;
            const isVisited = status ? status.visited : isCurrent;
            const isUpdated = status ? status.isUpdated : false;
            const isOpen = status
              ? status.isOpen
              : isLocationOpenAt(loc.openingHours, investigationMinutes);
            const isSelected = loc.id === selectedLocId;
            const displayName = getLocationDisplayName(loc.name, loc.id);

            const markerPinClass = isCurrent
              ? 'bg-[#FACC15] text-[#0C0E12] border-[#FEF08A] ring-4 ring-[#FACC15]/35'
              : isVisited && isUpdated
                ? 'bg-[#EA580C] text-white border-[#FB923C] animate-pulse ring-4 ring-[#F97316]/30'
                : isVisited
                  ? 'bg-[#16A34A] text-white border-[#4ADE80]'
                  : 'bg-[#DC2626] text-white border-[#EF4444] ring-4 ring-[#DC2626]/20';

            const selectedOutlineClass =
              isSelected && !isCurrent ? ' outline outline-2 outline-offset-2 outline-white/90' : '';

            const labelClass = isOpen
              ? 'bg-[#0B1C15]/95 text-emerald-300 border-emerald-500/60'
              : 'bg-[#1F0E12]/95 text-rose-300 border-rose-500/60';

            const selectedLabelHighlight = isSelected
              ? isCurrent
                ? ' ring-2 ring-[#FACC15]/70'
                : ' ring-2 ring-white/50'
              : '';

            return (
              <div
                key={loc.id}
                style={{
                  left: `${toScreenX(loc.mapCoords.x)}%`,
                  top: `${toScreenY(loc.mapCoords.y)}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
              >
                <button
                  onClick={() => handleMarkerClick(loc.id)}
                  className={`flex flex-col items-center cursor-pointer focus:outline-none transition-transform active:scale-95 ${
                    isSelected ? 'scale-110' : isCurrent ? 'scale-105' : 'hover:scale-105'
                  }`}
                >
                  {/* Pin Icon Box (remains constant screen size regardless of map zoom) */}
                  <div
                    className={`relative p-2 sm:p-2.5 rounded-xl border shadow-xl transition-all ${markerPinClass}${selectedOutlineClass}`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  {/* Identifying Location Name (Green when Open, Red when Closed) */}
                  <span
                    className={`mt-1.5 px-2.5 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold tracking-tight whitespace-nowrap shadow-xl border backdrop-blur-md ${labelClass}${selectedLabelHighlight}`}
                  >
                    {displayName}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Location Details & Travel Action Card placed cleanly BELOW the map */}
      {inspectedLocation && (() => {
        const inspectedStatus = locationStatuses?.[inspectedLocation.id];
        const inspectedIsOpen = inspectedStatus
          ? inspectedStatus.isOpen
          : isLocationOpenAt(inspectedLocation.openingHours, investigationMinutes);
        return (
        <div className="p-3 sm:p-4 rounded-xl bg-[#131720] border border-[#2B3547] text-xs space-y-2.5 shadow-lg shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#1B222F] text-[#F59E0B]">
                {React.createElement(getIcon(inspectedLocation.icon), { className: 'w-4 h-4' })}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`text-xs sm:text-sm font-bold ${
                      inspectedIsOpen ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {getLocationDisplayName(inspectedLocation.name, inspectedLocation.id)}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      inspectedIsOpen
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/40'
                        : 'bg-rose-950/50 text-rose-300 border-rose-700/40'
                    }`}
                  >
                    {inspectedIsOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                  {inspectedStatus?.visited && inspectedStatus.isUpdated && !inspectedStatus.isCurrent && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-orange-950/60 text-orange-300 border-orange-600/50">
                      {inspectedStatus.hasUpdatedClue && inspectedStatus.hasUpdatedSuspect
                        ? 'Updated Clue & Suspect'
                        : inspectedStatus.hasUpdatedClue
                          ? 'Updated Clue'
                          : 'Updated Suspect'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#7E8B9E]">
                  {inspectedLocation.district} · Hours: {formatHoursLabel(inspectedLocation.openingHours)}
                </span>
              </div>
            </div>

            {inspectedLocation.id === currentLocationId ? (
              <span className="text-[10px] font-mono text-[#F59E0B] px-2 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                Current Location
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#8694A6]">
                Travel: +{calculateRoadTravelMinutes(MASTER_LOCATIONS, currentLocationId, inspectedLocation.id)} min
              </span>
            )}
          </div>

          <p className="text-[11px] text-[#9AA5B8] leading-relaxed">
            {inspectedLocation.description}
          </p>

          {/* Who is present */}
          {peopleAtSelected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#60A5FA] bg-[#161D2B] p-2 rounded-lg border border-[#232F42]">
              <Users className="w-3.5 h-3.5 shrink-0" />
              {peopleAtSelected.map((p) => {
                const charStatus: CharacterInterviewStatus =
                  characterStatuses?.[p.id] ?? 'not_interviewed';
                const chipToneClass =
                  charStatus === 'updated'
                    ? 'bg-[#211710] hover:bg-[#2C1E14] border-[#EA580C]/65 text-[#FDBA74]'
                    : charStatus === 'interviewed'
                      ? 'bg-[#0E1E17] hover:bg-[#132920] border-emerald-500/50 text-emerald-300'
                      : 'bg-[#1D1216] hover:bg-[#28161C] border-[#DC2626]/55 text-[#FCA5A5]';
                const statusDotClass =
                  charStatus === 'updated'
                    ? 'bg-[#EA580C] animate-pulse'
                    : charStatus === 'interviewed'
                      ? 'bg-[#16A34A]'
                      : 'bg-[#DC2626]';
                const statusLabel =
                  charStatus === 'updated'
                    ? 'Update Available'
                    : charStatus === 'interviewed'
                      ? 'Interviewed'
                      : 'Not Interviewed';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      noirAudio.playPaperRustle();
                      setInspectedPortrait({
                        char: p,
                        contextLabel: `Present at ${getLocationDisplayName(inspectedLocation.name, inspectedLocation.id)}`
                      });
                    }}
                    aria-label={`View portrait artwork of ${p.name} (${statusLabel})`}
                    title={`${p.name} — ${statusLabel} (Click to view portrait)`}
                    className={`group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border hover:border-[#F59E0B] font-semibold transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${chipToneClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass}`} />
                    <span className="relative w-5 h-5 rounded-full overflow-hidden border border-[#37445C] bg-[#0B0E14] shrink-0">
                      <img
                        src={getCharacterMugshot(p)}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-3 h-3 text-[#F4EDD8]" />
                      </span>
                    </span>
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-[#717E91] bg-[#141923] p-2 rounded-lg border border-[#202736]">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>
                {inspectedIsOpen
                  ? 'No one currently present at this hour.'
                  : `Closed right now (opens ${inspectedLocation.openingHours?.open}). Physical perimeter can still be inspected.`}
              </span>
            </div>
          )}

          {/* Action button: Enter or Travel */}
          <div className="pt-1 flex items-center justify-end">
            <button
              onClick={() => {
                if (inspectedLocation.id === currentLocationId) {
                  noirAudio.playPaperRustle();
                }
                onTravelToLocation(inspectedLocation.id);
              }}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                inspectedLocation.id === currentLocationId
                  ? 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0E12]'
                  : 'bg-[#253044] hover:bg-[#32405A] text-white border border-[#3E4E6B]'
              }`}
            >
              <span>
                {inspectedLocation.id === currentLocationId
                  ? 'Enter Location'
                  : `Travel to ${getLocationDisplayName(inspectedLocation.name, inspectedLocation.id)} (+${calculateRoadTravelMinutes(MASTER_LOCATIONS, currentLocationId, inspectedLocation.id)}m)`}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        );
      })()}

      <MugshotModal
        character={inspectedPortrait?.char ?? null}
        contextLabel={inspectedPortrait?.contextLabel}
        onClose={() => setInspectedPortrait(null)}
      />
    </div>
  );
};
