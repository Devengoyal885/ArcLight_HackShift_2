/**
 * mockGeocoding.ts
 * ────────────────
 * Quick geocoding stub to map common Capable locations to lat/lng.
 * In a real production setup, this would be a backend service using
 * Google Maps Geocoding API or Nominatim, with a permanent DB cache.
 */

const LOCATION_COORDS: Record<string, [number, number]> = {
    // [longitude, latitude] for MapLibre

    // ── Asia ──
    'bangalore': [77.5946, 12.9716],
    'bengaluru': [77.5946, 12.9716],
    'mumbai': [72.8777, 19.0760],
    'delhi': [77.2090, 28.6139],
    'new delhi': [77.2090, 28.6139],
    'hyderabad': [78.4867, 17.3850],
    'pune': [73.8567, 18.5204],
    'chennai': [80.2707, 13.0827],
    'gurgaon': [77.0266, 28.4595],
    'gurugram': [77.0266, 28.4595],
    'noida': [77.3910, 28.5355],
    'india': [78.9629, 20.5937],
    'singapore': [103.8198, 1.3521],
    'japan': [138.2529, 36.2048],
    'tokyo': [139.6917, 35.6895],
    'china': [104.1954, 35.8617],
    'hong kong': [114.1694, 22.3193],
    'vietnam': [108.2772, 14.0583],
    'taiwan': [120.9605, 23.6978],
    'south korea': [127.7669, 35.9078],
    'korea': [127.7669, 35.9078],
    'pakistan': [69.3451, 30.3753],
    'philippines': [121.7740, 12.8797],
    'indonesia': [113.9213, -0.7893],
    'malaysia': [109.6976, 4.2105],
    'thailand': [100.9925, 15.8700],
    'turkey': [35.2433, 38.9637],
    'israel': [34.8516, 31.0461],
    'uae': [53.8478, 23.4241],
    'dubai': [55.2708, 25.2048],
    'apac': [134.4900, -6.1751],

    // ── Europe ──
    'europe': [15.2551, 54.5260],
    'uk': [-3.4360, 55.3781],
    'united kingdom': [-3.4360, 55.3781],
    'london': [-0.1278, 51.5074],
    'germany': [10.4515, 51.1657],
    'berlin': [13.4050, 52.5200],
    'france': [2.2137, 46.2276],
    'paris': [2.3522, 48.8566],
    'netherlands': [5.2913, 52.1326],
    'amsterdam': [4.9041, 52.3676],
    'spain': [-3.7038, 40.4168],
    'portugal': [-8.2245, 39.3999],
    'italy': [12.5674, 41.8719],
    'sweden': [18.6435, 60.1282],
    'stockholm': [18.0686, 59.3293],
    'norway': [8.4689, 60.4720],
    'denmark': [9.5018, 56.2639],
    'finland': [25.7482, 61.9241],
    'switzerland': [8.2275, 46.8182],
    'austria': [14.5501, 47.5162],
    'belgium': [4.4699, 50.5039],
    'ireland': [-8.2439, 53.4129],
    'poland': [19.1451, 51.9194],
    'czech': [15.4730, 49.8175],
    'romania': [24.9668, 45.9432],
    'ukraine': [31.1656, 48.3794],
    'russia': [105.3188, 61.5240],
    'iceland': [-19.0208, 64.9631],

    // ── Americas ──
    'usa': [-95.7129, 37.0902],
    'us': [-95.7129, 37.0902],
    'united states': [-95.7129, 37.0902],
    'new york': [-74.0060, 40.7128],
    'san francisco': [-122.4194, 37.7749],
    'los angeles': [-118.2437, 34.0522],
    'seattle': [-122.3321, 47.6062],
    'chicago': [-87.6298, 41.8781],
    'austin': [-97.7431, 30.2672],
    'boston': [-71.0589, 42.3601],
    'denver': [-104.9903, 39.7392],
    'canada': [-106.3468, 56.1304],
    'toronto': [-79.3832, 43.6532],
    'vancouver': [-123.1216, 49.2827],
    'latam': [-58.4438, -14.2350],
    'latin america': [-58.4438, -14.2350],
    'latin': [-58.4438, -14.2350],
    'americas': [-80.0000, 15.0000],
    'northern america': [-100.0000, 45.0000],
    'brazil': [-51.9253, -14.2350],
    'argentina': [-63.6167, -38.4161],
    'mexico': [-102.5528, 23.6345],
    'peru': [-75.0152, -9.1900],
    'colombia': [-74.2973, 4.5709],
    'chile': [-71.5430, -35.6751],

    // ── Africa / Oceania ──
    'australia': [133.7751, -25.2744],
    'sydney': [151.2093, -33.8688],
    'melbourne': [144.9631, -37.8136],
    'new zealand': [172.7496, -40.9006],
    'africa': [34.5085, -8.7832],
    'nigeria': [8.6753, 9.0820],
    'south africa': [25.0449, -29.0000],
    'kenya': [37.9062, -0.0236],
    'egypt': [30.8025, 26.8206],

    // ── Additional European & Global Cities ──
    'hamburg': [9.9937, 53.5511],
    'munich': [11.5820, 48.1351],
    'münchen': [11.5820, 48.1351],
    'frankfurt': [8.6821, 50.1109],
    'cologne': [6.9603, 50.9375],
    'köln': [6.9603, 50.9375],
    'stuttgart': [9.1829, 48.7758],
    'düsseldorf': [6.7735, 51.2277],
    'dusseldorf': [6.7735, 51.2277],
    'zurich': [8.5417, 47.3769],
    'zürich': [8.5417, 47.3769],
    'geneva': [6.1432, 46.2044],
    'dublin': [-6.2603, 53.3498],
    'cambridge': [0.1218, 52.2053],
    'oxford': [-1.2577, 51.7520],
    'manchester': [-2.2426, 53.4808],
    'edinburgh': [-3.1883, 55.9533],
    'madrid': [-3.7038, 40.4168],
    'barcelona': [2.1734, 41.3851],
    'lisbon': [-9.1393, 38.7223],
    'warsaw': [21.0122, 52.2297],
    'krakow': [19.9450, 50.0647],
    'prague': [14.4378, 50.0755],
    'budapest': [19.0402, 47.4979],
    'bucharest': [26.1025, 44.4268],
    'copenhagen': [12.5683, 55.6761],
    'helsinki': [24.9384, 60.1699],
    'oslo': [10.7522, 59.9139],
    'brussels': [4.3517, 50.8503],
    'vienna': [16.3738, 48.2082],
    'wien': [16.3738, 48.2082],
    'milan': [9.1900, 45.4642],
    'rome': [12.4964, 41.9028],
    'seoul': [126.9780, 37.5665],
    'taipei': [121.5654, 25.0330],
    'beijing': [116.4074, 39.9042],
    'shanghai': [121.4737, 31.2304],
    'shenzhen': [114.0579, 22.5431],
    'auckland': [174.7633, -36.8485],
    'wellington': [174.7762, -41.2865],
    'san jose': [-121.8863, 37.3382],
    'silicon valley': [-122.0839, 37.3861],
    'sunnyvale': [-122.0363, 37.3688],
    'mountain view': [-122.0839, 37.3861],
    'palo alto': [-122.1430, 37.4419],
    'san diego': [-117.1611, 32.7157],
    'dallas': [-96.7970, 32.7767],
    'houston': [-95.3698, 29.7604],
    'atlanta': [-84.3880, 33.7490],
    'miami': [-80.1918, 25.7617],
    'washington': [-77.0369, 38.9072],
    'philadelphia': [-75.1652, 39.9526],
    'raleigh': [-78.6382, 35.7796],
    'montreal': [-73.5673, 45.5017],
    'ottawa': [-75.6972, 45.4215],
    'calgary': [-114.0719, 51.0447],
    'waterloo': [-80.5204, 43.4643],
    'são paulo': [-46.6333, -23.5505],
    'sao paulo': [-46.6333, -23.5505],
    'rio de janeiro': [-43.1729, -22.9068],
    'buenos aires': [-58.3816, -34.6037],
    'santiago': [-70.6693, -33.4489],
    'bogotá': [-74.0721, 4.7110],
    'bogota': [-74.0721, 4.7110],
    'mexico city': [-99.1332, 19.4326],
    'riyadh': [46.6753, 24.7136],
    'abu dhabi': [54.3773, 24.4539],
    'tel aviv': [34.7818, 32.0853],
    'cairo': [31.2357, 30.0444],
    'nairobi': [36.8219, -1.2921],
    'cape town': [18.4241, -33.9249],
    'johannesburg': [28.0473, -26.2041],
    'lagos': [3.3792, 6.5244],
    'kolkata': [88.3639, 22.5726],
    'ahmedabad': [72.5714, 23.0225],
    'jaipur': [75.7873, 26.9124],
    'chandigarh': [76.7794, 30.7333],
    'kochi': [76.2673, 9.9312],
    'thiruvananthapuram': [76.9366, 8.5241],
    'indore': [75.8577, 22.7196],
};

// Parse a multi-country location string like "USA, UK, India, Australia"
// by picking the first token that matches a known location.
function parseMultiLocation(locationStr: string): [number, number] | null {
    const parts = locationStr.split(/[,|/;]+/).map(p => p.trim().toLowerCase());

    for (const part of parts) {
        if (!part) continue;
        // Exact match
        if (LOCATION_COORDS[part]) return LOCATION_COORDS[part];
        // Partial match (e.g. "northern america" contains "america")
        for (const key of Object.keys(LOCATION_COORDS)) {
            if (part.includes(key) || key.includes(part)) {
                return LOCATION_COORDS[key];
            }
        }
    }
    return null;
}

// ─── §3.10: Permanent Geocoding Cache ─────────────────────────────────────────
// Mirrors job-find's two-tier permanent cache approach:
//   Tier 1 — In-memory dict (instant, same session)
//   Tier 2 — localStorage (persists forever, survives page reload)
//   Tier 3 — Nominatim free API (no key, rate limited — last resort)
//
// Each unique location string is resolved EXACTLY ONCE and cached forever.
// This prevents repeated lookups and avoids burning API rate limits.

const GEOCACHE_KEY = 'capable_geocache_v1';

// Tier 1: In-memory cache (same session)
const runtimeCache = new Map<string, [number, number] | null>();

// Load Tier 2 (localStorage) into runtime cache on module init
function loadPersistentCache(): void {
    try {
        const raw = localStorage.getItem(GEOCACHE_KEY);
        if (!raw) return;
        const stored: Record<string, [number, number] | null> = JSON.parse(raw);
        for (const [k, v] of Object.entries(stored)) {
            runtimeCache.set(k, v);
        }
    } catch { /* ignore */ }
}

function saveToPersistentCache(location: string, coords: [number, number] | null): void {
    try {
        const raw = localStorage.getItem(GEOCACHE_KEY);
        const stored: Record<string, [number, number] | null> = raw ? JSON.parse(raw) : {};
        stored[location] = coords;
        localStorage.setItem(GEOCACHE_KEY, JSON.stringify(stored));
    } catch { /* ignore — storage quota */ }
}

// Initialize on import
if (typeof window !== 'undefined') {
    loadPersistentCache();
}

/**
 * Async geocode via Nominatim (free, no API key).
 * Called ONLY when neither the built-in dict nor cache has the location.
 * §3.10: Result is stored permanently so it's never called again for the same string.
 */
async function geocodeViaNominatim(location: string): Promise<[number, number] | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
        const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (!data || data.length === 0) return null;
        const { lon, lat } = data[0];
        return [parseFloat(lon), parseFloat(lat)];
    } catch {
        return null;
    }
}

/**
 * Synchronous coord lookup (instant, no network).
 * Use this in render loops and map components.
 *
 * Checks in order:
 *  1. Tier 1 in-memory cache (previous session or same-session)
 *  2. Built-in LOCATION_COORDS dictionary
 *  3. Multi-location string parser
 *  4. Partial string matching
 *  5. Deterministic hash fallback (keeps unknown pins on the map)
 */
export function getMockCoords(location: string = ''): [number, number] | null {
    if (!location) return null;
    const loc = location.toLowerCase().trim();

    // Distribute purely remote/worldwide roles across major global tech hubs
    if (['remote', 'worldwide', 'anywhere', 'global', 'world'].includes(loc)) {
        const GLOBAL_REMOTE_HUBS: [number, number][] = [
            [77.5946, 12.9716],   // Bengaluru
            [-122.4194, 37.7749], // San Francisco
            [-0.1278, 51.5074],   // London
            [13.4050, 52.5200],   // Berlin
            [103.8198, 1.3521],   // Singapore
            [139.6917, 35.6895],  // Tokyo
            [-74.0060, 40.7128],  // New York
            [4.9041, 52.3676],    // Amsterdam
            [151.2093, -33.8688], // Sydney
            [-79.3832, 43.6532],  // Toronto
            [55.2708, 25.2048],   // Dubai
            [78.4867, 17.3850],   // Hyderabad
            [8.5417, 47.3769],    // Zurich
            [-46.6333, -23.5505], // São Paulo
            [-122.3321, 47.6062], // Seattle
            [72.8777, 19.0760],   // Mumbai
            [2.3522, 48.8566],    // Paris
            [126.9780, 37.5665],  // Seoul
        ];
        const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return GLOBAL_REMOTE_HUBS[Math.abs(hash) % GLOBAL_REMOTE_HUBS.length];
    }

    // Tier 1: in-memory cache hit
    if (runtimeCache.has(loc)) return runtimeCache.get(loc)!;

    // Built-in dict — exact match
    if (LOCATION_COORDS[loc]) {
        const coords = LOCATION_COORDS[loc];
        runtimeCache.set(loc, coords);
        return coords;
    }

    // Multi-location string
    if (loc.includes(',') || loc.includes('/')) {
        const multi = parseMultiLocation(loc);
        if (multi) {
            runtimeCache.set(loc, multi);
            saveToPersistentCache(loc, multi);
            return multi;
        }
    }

    // Partial match
    for (const key of Object.keys(LOCATION_COORDS)) {
        if (loc.includes(key)) {
            const coords = LOCATION_COORDS[key];
            runtimeCache.set(loc, coords);
            return coords;
        }
    }

    // Deterministic hash-based fallback — keeps unknown pins on the map
    const hash = loc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const lng = -170 + (hash % 340);
    const lat = -55 + (hash % 110);
    const fallback: [number, number] = [lng, lat];
    runtimeCache.set(loc, fallback);
    return fallback;
}

/**
 * Async version of getMockCoords.
 * Same as synchronous but also tries Nominatim for unknown locations
 * and permanently caches the result (§3.10 pattern).
 *
 * Use this in background jobs or one-time data processing.
 * Do NOT use in render loops (async is too slow for real-time rendering).
 */
export async function geocodeLocation(location: string): Promise<[number, number] | null> {
    if (!location) return null;
    const loc = location.toLowerCase().trim();

    // Try sync path first (instant)
    const sync = getMockCoords(loc);
    if (sync) return sync;

    // Tier 3: Nominatim API (only reached for truly unknown locations)
    const apiCoords = await geocodeViaNominatim(loc);
    const result = apiCoords ?? null;

    // Permanently cache the result — success OR failure (null = "not found")
    runtimeCache.set(loc, result);
    saveToPersistentCache(loc, result);

    return result;
}
