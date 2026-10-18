/**
 * JobMapView.tsx — World Map of Open Roles
 * ─────────────────────────────────────────
 * Ported & adapted from job-find/frontend/components/map/MapView.tsx
 *
 * Architecture (mirrors job-find exactly):
 *  1. Map fills its container. Filter sidebar + office drawer float OVER it.
 *  2. onViewportChange fires on every moveend → parent re-filters jobs to viewport bounds.
 *  3. Pins are clustered GeoJSON (MapLibre native clustering, no external library).
 *  4. Clicking a cluster zooms in. Clicking an office pin opens a side drawer.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Map as MLMap, GeoJSONSource, NavigationControl } from 'maplibre-gl';
import type { MapGeoJSONFeature, StyleSpecification } from 'maplibre-gl';
import type * as GeoJSON from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { OpportunityCard } from '../../services/opportunityService';
import { getMockCoords } from '../../utils/mockGeocoding';
import { X, ExternalLink, MapPin, Briefcase } from 'lucide-react';
import './JobMapView.css';

export interface MapViewport {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
}

export interface JobMapViewProps {
    jobs: OpportunityCard[];
    onApply?: (job: OpportunityCard) => void;
    /** Called when the user pans/zooms so parent can re-filter to visible area */
    onViewportChange?: (v: MapViewport | null) => void;
}

// Group jobs by company+location into office pins
interface OfficePin {
    id: string;
    company: string;
    location: string;
    companyLogo?: string;
    longitude: number;
    latitude: number;
    jobs: OpportunityCard[];
}

// Inline dark map using OSM raster tiles — no API key, no external style URL
const DARK_STYLE: StyleSpecification = {
    version: 8,
    name: 'Capable Dark',
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19,
        },
    },
    layers: [
        {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            paint: {
                'raster-brightness-min': 0,
                'raster-brightness-max': 0.22,
                'raster-saturation': -0.75,
                'raster-contrast': 0.15,
            },
        },
    ],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

const SIGNAL = '#3b82f6';       // Capable blue
const SIGNAL_DARK = '#1d4ed8';

export default function JobMapView({ jobs, onApply, onViewportChange }: JobMapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MLMap | null>(null);
    const loadedRef = useRef(false);
    // Use refs for callbacks to avoid stale closures in map event listeners
    const onViewportRef = useRef(onViewportChange);
    onViewportRef.current = onViewportChange;

    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(0);

    // ── 1. Build office pins from jobs ────────────────────────────────────────
    const allPins: OfficePin[] = useMemo(() => {
        const map = new Map<string, OfficePin>();
        jobs.forEach(job => {
            let lng = job.longitude;
            let lat = job.latitude;
            if (lng == null || lat == null) {
                const coords = getMockCoords(job.location);
                if (!coords) return;
                [lng, lat] = coords;
            }
            const id = `${job.company}|${job.location}`.toLowerCase();
            if (!map.has(id)) {
                map.set(id, { id, company: job.company, location: job.location, companyLogo: job.companyLogo, longitude: lng!, latitude: lat!, jobs: [] });
            }
            map.get(id)!.jobs.push(job);
        });
        return Array.from(map.values());
    }, [jobs]);

    const selectedPin = useMemo(() =>
        selectedPinId ? allPins.find(p => p.id === selectedPinId) ?? null : null,
    [selectedPinId, allPins]);

    // ── 2. GeoJSON helper ────────────────────────────────────────────────────
    const toGeoJSON = useCallback((data: OfficePin[]) => ({
        type: 'FeatureCollection' as const,
        features: data.map(p => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
            properties: { office_id: p.id, company: p.company, location: p.location, job_count: p.jobs.length },
        })),
    }), []);

    // ── 3. Emit viewport bounds so parent can re-filter ───────────────────────
    const emitViewport = useCallback(() => {
        const map = mapRef.current;
        if (!map || !onViewportRef.current) return;
        const b = map.getBounds();
        const west = b.getWest(), east = b.getEast(), south = b.getSouth(), north = b.getNorth();
        const lngSpan = east - west;
        // If map spans the whole world, pass null (no viewport restriction)
        if (lngSpan >= 270 || west < -180 || east > 180) {
            onViewportRef.current(null);
        } else {
            onViewportRef.current({
                minLng: Math.max(west, -180),
                minLat: Math.max(south, -85),
                maxLng: Math.min(east, 180),
                maxLat: Math.min(north, 85),
            });
        }
    }, []);

    // ── 4. Initialize map once ────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new MLMap({
            container: containerRef.current,
            style: DARK_STYLE,
            center: [10, 25], // Centered on land masses like job-find
            zoom: 2,
            minZoom: 1,
            maxZoom: 16,
            attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');

        map.on('load', () => {
            map.addSource('offices', {
                type: 'geojson',
                data: toGeoJSON(allPins),
                cluster: true,
                clusterRadius: 48,
                clusterMaxZoom: 12,
                clusterProperties: { job_sum: ['+', ['get', 'job_count']] },
            });

            // Cluster circles — size + color based on point count
            map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'offices',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': ['step', ['get', 'point_count'], SIGNAL_DARK, 10, SIGNAL, 50, '#60a5fa'],
                    'circle-opacity': 0.92,
                    'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 32],
                    'circle-stroke-width': 2.5,
                    'circle-stroke-color': 'rgba(10,15,30,0.85)',
                },
            });

            // Cluster count labels
            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'offices',
                filter: ['has', 'point_count'],
                layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Noto Sans Bold'] },
                paint: { 'text-color': '#ffffff' },
            });

            // Individual office pins (unclustered)
            map.addLayer({
                id: 'office-point',
                type: 'circle',
                source: 'offices',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': SIGNAL,
                    'circle-radius': 9,
                    'circle-stroke-width': 2.5,
                    'circle-stroke-color': 'rgba(10,15,30,0.85)',
                },
            });

            // Job count badge on unclustered pins with >1 role
            map.addLayer({
                id: 'office-count',
                type: 'symbol',
                source: 'offices',
                filter: ['all', ['!', ['has', 'point_count']], ['>', ['get', 'job_count'], 1]],
                layout: { 'text-field': ['to-string', ['get', 'job_count']], 'text-size': 10, 'text-font': ['Noto Sans Bold'], 'text-offset': [0, 0.05] },
                paint: { 'text-color': '#ffffff' },
            });

            loadedRef.current = true;
            setMapLoaded(true);
            setVisibleCount(allPins.length);
            emitViewport();
        });

        // Cluster click → zoom in
        map.on('click', 'clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = features[0]?.properties?.cluster_id;
            const src = map.getSource('offices') as GeoJSONSource;
            if (clusterId == null || !src) return;
            src.getClusterExpansionZoom(clusterId).then(zoom => {
                const geom = features[0].geometry as GeoJSON.Point;
                map.easeTo({ center: geom.coordinates as [number, number], zoom: zoom + 1 });
            });
        });

        // Office pin click → open drawer
        map.on('click', 'office-point', (e) => {
            const f = e.features?.[0] as MapGeoJSONFeature | undefined;
            const id = f?.properties?.office_id;
            if (id) {
                setSelectedPinId(String(id));
                const geom = f.geometry as GeoJSON.Point;
                map.easeTo({ center: geom.coordinates as [number, number] });
            }
        });

        // Pointer cursors
        for (const layer of ['clusters', 'office-point']) {
            map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
            map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
        }

        // ── DEEP SEARCH: Re-filter on pan/zoom ────────────────────────────────
        map.on('moveend', () => {
            emitViewport();
            // Update visible count based on rendered features in current viewport
            const rendered = map.queryRenderedFeatures(undefined, { layers: ['office-point'] });
            setVisibleCount(rendered.length);
        });

        return () => {
            map.remove();
            mapRef.current = null;
            loadedRef.current = false;
            setMapLoaded(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 5. Push updated pins into existing source ─────────────────────────────
    useEffect(() => {
        if (!mapLoaded) return;
        const src = mapRef.current?.getSource('offices') as GeoJSONSource | undefined;
        if (src) {
            src.setData(toGeoJSON(allPins));
            setVisibleCount(allPins.length);
        }
    }, [allPins, mapLoaded, toGeoJSON]);

    return (
        <div className="jmv-container">
            {/* Full-bleed map canvas */}
            <div ref={containerRef} className="jmv-map" aria-label="World map of open roles" />

            {/* Status badge — mirrors job-find's result count */}
            <div className="jmv-status-badge">
                <MapPin size={12} />
                <span>{jobs.length} open role{jobs.length !== 1 ? 's' : ''} across {allPins.length} office{allPins.length !== 1 ? 's' : ''} worldwide</span>
            </div>

            {/* Office detail drawer */}
            {selectedPin && (
                <div className="jmv-drawer">
                    <div className="jmv-drawer-header">
                        <div className="jmv-drawer-title-area">
                            {selectedPin.companyLogo ? (
                                <img src={selectedPin.companyLogo} alt={selectedPin.company} className="jmv-company-logo" />
                            ) : (
                                <div className="jmv-company-logo-fallback">{selectedPin.company[0]}</div>
                            )}
                            <div>
                                <h3 className="jmv-company-name">{selectedPin.company}</h3>
                                <p className="jmv-company-loc">
                                    <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                                    {selectedPin.location}
                                </p>
                            </div>
                        </div>
                        <button className="jmv-close-btn" onClick={() => setSelectedPinId(null)} aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="jmv-drawer-body">
                        <div className="jmv-role-count">
                            <Briefcase size={13} style={{ display: 'inline', marginRight: 5 }} />
                            {selectedPin.jobs.length} open role{selectedPin.jobs.length !== 1 ? 's' : ''}
                        </div>
                        <div className="jmv-role-list">
                            {selectedPin.jobs.map(job => (
                                <div key={job.id} className="jmv-role-card">
                                    <div className="jmv-role-header">
                                        <h4 className="jmv-role-title">{job.title}</h4>
                                        <span className={`jmv-role-badge ${job.remote ? 'remote' : 'onsite'}`}>
                                            {job.remote ? '🌐 Remote' : '🏢 Onsite'}
                                        </span>
                                    </div>
                                    <div className="jmv-role-meta">
                                        <span>{job.type}</span>
                                        {job.salary && <> · <span>{job.salary}</span></>}
                                    </div>
                                    {job.tags && job.tags.length > 0 && (
                                        <div className="jmv-role-tags">
                                            {job.tags.slice(0, 5).map(t => <span key={t} className="jmv-role-tag">{t}</span>)}
                                        </div>
                                    )}
                                    <a
                                        className="jmv-apply-btn"
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View & Apply <ExternalLink size={13} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
