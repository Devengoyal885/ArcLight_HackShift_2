/**
 * TalentMapView.tsx
 * ─────────────────
 * §3.5 from job-find analysis: Employer-side geographic talent view.
 * 
 * Shows a dark world map with candidate pins clustered by city/location.
 * Color-coded by skill match score vs the employer's active role.
 * Clicking a cluster → zooms in. Clicking a pin → opens candidate mini-card.
 * 
 * Mirrors job-find's MapView architecture but for CANDIDATES, not jobs.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Map as MLMap, GeoJSONSource, NavigationControl } from 'maplibre-gl';
import type { MapGeoJSONFeature, StyleSpecification } from 'maplibre-gl';
import type * as GeoJSON from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMockCoords } from '../../utils/mockGeocoding';
import { X, User, Star, MapPin, Briefcase, Code2 } from 'lucide-react';

export interface TalentPin {
    id: string;
    name: string;
    city: string;
    skills: string[];
    matchScore?: number;   // 0-100 vs an open role
    headline?: string;
    avatar?: string;
}

interface TalentMapViewProps {
    candidates: TalentPin[];
    onSelect?: (candidate: TalentPin) => void;
}

// Same OSM inline style as JobMapView — dark, no API key
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
    layers: [{
        id: 'osm-tiles', type: 'raster', source: 'osm',
        paint: {
            'raster-brightness-min': 0, 'raster-brightness-max': 0.22,
            'raster-saturation': -0.75, 'raster-contrast': 0.15,
        },
    }],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

// Color tiers by match score
const HIGH = '#10b981';    // ≥75 match — green
const MID  = '#f59e0b';    // 40–74 — amber
const LOW  = '#3b82f6';    // <40 or no score — blue

function matchColor(score?: number) {
    if (score == null) return LOW;
    if (score >= 75) return HIGH;
    if (score >= 40) return MID;
    return LOW;
}

interface CandidateGroup {
    id: string;
    city: string;
    longitude: number;
    latitude: number;
    candidates: TalentPin[];
    avgScore: number;
}

export default function TalentMapView({ candidates, onSelect }: TalentMapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MLMap | null>(null);
    const loadedRef = useRef(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Group candidates by city
    const groups: CandidateGroup[] = useMemo(() => {
        const map = new Map<string, CandidateGroup>();
        candidates.forEach(c => {
            const coords = getMockCoords(c.city);
            if (!coords) return;
            const [lng, lat] = coords;
            const id = c.city.toLowerCase().trim();
            if (!map.has(id)) {
                map.set(id, { id, city: c.city, longitude: lng, latitude: lat, candidates: [], avgScore: 0 });
            }
            map.get(id)!.candidates.push(c);
        });
        // Compute avgScore per group
        map.forEach(g => {
            const scores = g.candidates.filter(c => c.matchScore != null).map(c => c.matchScore!);
            g.avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        });
        return Array.from(map.values());
    }, [candidates]);

    const selectedGroup = useMemo(() =>
        selectedGroupId ? groups.find(g => g.id === selectedGroupId) ?? null : null,
    [selectedGroupId, groups]);

    const toGeoJSON = useCallback((data: CandidateGroup[]) => ({
        type: 'FeatureCollection' as const,
        features: data.map(g => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [g.longitude, g.latitude] },
            properties: {
                group_id: g.id,
                city: g.city,
                count: g.candidates.length,
                avg_score: g.avgScore,
                // Map avg score to a color string for the circle layer
                color: matchColor(g.avgScore),
            },
        })),
    }), []);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        const map = new MLMap({
            container: containerRef.current,
            style: DARK_STYLE,
            center: [78.9629, 22],
            zoom: 4,
            minZoom: 1, maxZoom: 16,
            attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');

        map.on('load', () => {
            map.addSource('talent', {
                type: 'geojson',
                data: toGeoJSON(groups),
                cluster: true,
                clusterRadius: 40,
                clusterMaxZoom: 10,
            });

            // Cluster circles
            map.addLayer({
                id: 'talent-clusters',
                type: 'circle',
                source: 'talent',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#3b82f6',
                    'circle-opacity': 0.85,
                    'circle-radius': ['step', ['get', 'point_count'], 18, 5, 24, 20, 32],
                    'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(10,15,30,0.8)',
                },
            });
            map.addLayer({
                id: 'talent-cluster-count',
                type: 'symbol',
                source: 'talent',
                filter: ['has', 'point_count'],
                layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Noto Sans Bold'] },
                paint: { 'text-color': '#ffffff' },
            });

            // Individual city pins — color by avg match score
            map.addLayer({
                id: 'talent-point',
                type: 'circle',
                source: 'talent',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': ['get', 'color'],
                    'circle-radius': 10,
                    'circle-stroke-width': 2.5, 'circle-stroke-color': 'rgba(10,15,30,0.8)',
                    'circle-opacity': 0.92,
                },
            });
            // Candidate count on each pin
            map.addLayer({
                id: 'talent-count',
                type: 'symbol',
                source: 'talent',
                filter: ['all', ['!', ['has', 'point_count']], ['>', ['get', 'count'], 1]],
                layout: { 'text-field': ['to-string', ['get', 'count']], 'text-size': 10, 'text-font': ['Noto Sans Bold'] },
                paint: { 'text-color': '#ffffff' },
            });

            loadedRef.current = true;
            setMapLoaded(true);
        });

        map.on('click', 'talent-clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['talent-clusters'] });
            const clusterId = features[0]?.properties?.cluster_id;
            const src = map.getSource('talent') as GeoJSONSource;
            if (clusterId == null || !src) return;
            src.getClusterExpansionZoom(clusterId).then(zoom => {
                map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 1 });
            });
        });

        map.on('click', 'talent-point', (e) => {
            const f = e.features?.[0] as MapGeoJSONFeature | undefined;
            const id = f?.properties?.group_id;
            if (id) {
                setSelectedGroupId(String(id));
                map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number] });
            }
        });

        for (const layer of ['talent-clusters', 'talent-point']) {
            map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
            map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
        }

        return () => { map.remove(); mapRef.current = null; loadedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!mapLoaded) return;
        const src = mapRef.current?.getSource('talent') as GeoJSONSource | undefined;
        if (src) src.setData(toGeoJSON(groups));
    }, [groups, mapLoaded, toGeoJSON]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400, background: '#0b1220', borderRadius: 12, overflow: 'hidden' }}>
            <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} aria-label="Talent location map" />

            {/* Legend */}
            <div style={{
                position: 'absolute', top: 14, right: 14, zIndex: 10,
                background: 'rgba(10,15,30,0.82)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6,
                fontSize: 12, color: '#94a3b8',
            }}>
                <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Match Score</div>
                {[{ color: HIGH, label: '≥75% — Strong fit' }, { color: MID, label: '40–74% — Good fit' }, { color: LOW, label: '<40% — Exploring' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                        <span>{l.label}</span>
                    </div>
                ))}
            </div>

            {/* Status badge */}
            <div style={{
                position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                zIndex: 10, background: 'rgba(10,15,30,0.82)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(59,130,246,0.3)', color: '#94a3b8',
                fontSize: 12, fontWeight: 500, padding: '5px 13px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none',
            }}>
                <User size={11} />
                <span>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} mapped</span>
            </div>

            {/* City detail drawer */}
            {selectedGroup && (
                <div style={{
                    position: 'absolute', top: 16, right: 16, bottom: 16, width: 340,
                    background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12,
                    display: 'flex', flexDirection: 'column', zIndex: 20, overflow: 'hidden',
                    animation: 'slideIn 0.25s ease',
                }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                                <MapPin size={14} color="#3b82f6" />
                                {selectedGroup.city}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                {selectedGroup.candidates.length} candidate{selectedGroup.candidates.length !== 1 ? 's' : ''}
                                {selectedGroup.avgScore > 0 && ` · avg ${selectedGroup.avgScore}% match`}
                            </div>
                        </div>
                        <button onClick={() => setSelectedGroupId(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedGroup.candidates.map(c => (
                            <div key={c.id} onClick={() => onSelect?.(c)} style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 10, padding: '12px 14px', cursor: onSelect ? 'pointer' : 'default',
                                transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                        {c.avatar
                                            ? <img src={c.avatar} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e293b', display: 'grid', placeItems: 'center', color: '#3b82f6', fontWeight: 700, fontSize: 13 }}>{c.name[0]}</div>
                                        }
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{c.name}</div>
                                            {c.headline && <div style={{ fontSize: 11, color: '#64748b' }}>{c.headline}</div>}
                                        </div>
                                    </div>
                                    {c.matchScore != null && (
                                        <div style={{ fontSize: 13, fontWeight: 700, color: matchColor(c.matchScore), background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
                                            {c.matchScore}%
                                        </div>
                                    )}
                                </div>
                                {c.skills.length > 0 && (
                                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {c.skills.slice(0, 4).map(s => (
                                            <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>{s}</span>
                                        ))}
                                        {c.skills.length > 4 && <span style={{ fontSize: 10, color: '#64748b' }}>+{c.skills.length - 4}</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
