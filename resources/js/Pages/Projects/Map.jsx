import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const OFFICE_COLORS = [
    '#7F77DD', '#1D9E75', '#D85A30', '#D4537E',
    '#378ADD', '#639922', '#BA7517', '#E24B4A',
    '#5F5E5A', '#0F6E56',
];

const officeColorCache = {};
let colorIndex = 0;

function getOfficeColor(officeId) {
    if (!officeColorCache[officeId]) {
        officeColorCache[officeId] = OFFICE_COLORS[colorIndex++ % OFFICE_COLORS.length];
    }
    return officeColorCache[officeId];
}

function progressInfo(progress) {
    if (progress >= 100) return { label: 'Completed',   bg: '#d1fae5', color: '#065f46' };
    if (progress >= 60)  return { label: 'On Track',    bg: '#dbeafe', color: '#1e40af' };
    if (progress >= 30)  return { label: 'In Progress', bg: '#fef9c3', color: '#92400e' };
    return                      { label: 'Early Stage', bg: '#fee2e2', color: '#991b1b' };
}

function makeMarkerIcon(color, title, showName) {
    const short = title.length > 18 ? title.slice(0, 16) + '…' : title;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="28" overflow="visible">
            <circle cx="6" cy="6" r="6" fill="${color}" stroke="white" stroke-width="1.5"/>
            <line x1="6" y1="12" x2="6" y2="20" stroke="${color}" stroke-width="1.5"/>
            ${showName ? `
            <text x="16" y="10"
                font-family="system-ui,sans-serif"
                font-size="11"
                font-weight="600"
                fill="${color}"
                stroke="white"
                stroke-width="3"
                paint-order="stroke"
                style="pointer-events:none;"
            >${short}</text>` : ''}
        </svg>`;

    return L.divIcon({
        className: '',
        html: svg,
        iconSize: [160, 28],
        iconAnchor: [6, 20],
        popupAnchor: [6, -20],
    });
}

const TILE_LAYERS = {
    street: {
        label: 'Street',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
    },
    terrain: {
        label: 'Terrain',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap contributors',
    },
    satellite: {
        label: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, Maxar, Earthstar Geographics',
    },
    dark: {
        label: 'Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '© CartoDB',
    },
};

export default function Map({ offices, years, progressList }) {
    const mapRef       = useRef(null);
    const mapInstance  = useRef(null);
    const markersRef   = useRef([]);
    const tileLayerRef = useRef(null);
    const legendRef    = useRef(null);

    const [filters, setFilters] = useState({
        office_id: '',
        year_obligated: '',
        progress: '',
    });

    const [projects,  setProjects]  = useState([]);
    const [showNames, setShowNames] = useState(true);
    const [tileKey,   setTileKey]   = useState('street');

    // Derive unique progress options from fetched projects
    const progressOptions = [...new Set(projects.map(p => progressInfo(p.progress).label))];

    // Fetch ALL projects once on mount (no progress filter sent to server)
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.office_id)      params.append('office_id',      filters.office_id);
        if (filters.year_obligated) params.append('year_obligated', filters.year_obligated);

        fetch(`/projects/map/data?${params.toString()}`)
            .then(res => res.json())
            .then(data => setProjects(data));
    }, [filters.office_id, filters.year_obligated]);

// Init map once
useEffect(() => {
    if (mapInstance.current) return;

    const mindanaoBounds = L.latLngBounds(
        L.latLng(5.5, 121.8),   // southwest corner
        L.latLng(10.5, 127.5),  // northeast corner
    );

    mapInstance.current = L.map(mapRef.current, {
        center: [8.4542, 124.6319],  // Northern Mindanao (Cagayan de Oro)
        zoom: 9,
        minZoom: 7,
        maxBounds: mindanaoBounds,
        maxBoundsViscosity: 1.0,
    });

    const tile = TILE_LAYERS.street;
    tileLayerRef.current = L.tileLayer(tile.url, {
        attribution: tile.attribution,
        maxZoom: 18,
    }).addTo(mapInstance.current);
}, []);

    // Swap tile layer when tileKey changes
    useEffect(() => {
        if (!mapInstance.current) return;

        if (tileLayerRef.current) {
            mapInstance.current.removeLayer(tileLayerRef.current);
        }

        const tile = TILE_LAYERS[tileKey];
        tileLayerRef.current = L.tileLayer(tile.url, {
            attribution: tile.attribution,
            maxZoom: 18,
        }).addTo(mapInstance.current);
    }, [tileKey]);

    // Re-render markers when projects, showNames, or progress filter changes
    useEffect(() => {
        if (!mapInstance.current) return;

        markersRef.current.forEach(m => mapInstance.current.removeLayer(m));
        markersRef.current = [];

        if (legendRef.current) legendRef.current.innerHTML = '';

        const seenOffices = {};

        // Filter by progress label client-side
        const filtered = filters.progress
            ? projects.filter(p => p.progress === filters.progress)
            : projects;

        filtered.forEach(p => {
            const color = getOfficeColor(p.office_id);
            const icon  = makeMarkerIcon(color, p.project_title, showNames);
            const pl    = progressInfo(p.progress);

            const marker = L.marker([p.latitude, p.longitude], { icon });

            marker.bindPopup(`
                <div style="font-family:system-ui,sans-serif;min-width:220px;">
                    <p style="font-size:13px;font-weight:500;margin:0 0 8px;line-height:1.4;">${p.project_title}</p>
                    <table style="width:100%;font-size:12px;border-collapse:collapse;">
                        <tr><td style="color:#666;padding:2px 0;">Office</td>
                            <td style="text-align:right;font-weight:500;">${p.office_name ?? '—'}</td></tr>
                        <tr><td style="color:#666;padding:2px 0;">Proponent</td>
                            <td style="text-align:right;font-weight:500;">${p.proponent_name ?? '—'}</td></tr>
                        <tr><td style="color:#666;padding:2px 0;">Year Obligated</td>
                            <td style="text-align:right;font-weight:500;">${p.year_obligated ?? '—'}</td></tr>
                        <tr><td style="color:#666;padding:2px 0;">Project Cost</td>
                            <td style="text-align:right;font-weight:500;">₱${Number(p.project_cost).toLocaleString()}</td></tr>
                        <tr><td style="color:#666;padding:2px 0;">Fund Release</td>
                            <td style="text-align:right;font-weight:500;">${p.fund_release ?? '—'}</td></tr>
                        <tr><td style="color:#666;padding:2px 0;">Progress</td>
                            <td style="text-align:right;font-weight:500;">${p.progress}</td></tr>
                    </table>
                    <span style="display:inline-block;margin-top:6px;font-size:11px;padding:2px 8px;
                        border-radius:10px;background:${pl.bg};color:${pl.color};">${p.progress ?? '—'}</span>
                </div>
            `, { maxWidth: 260 });

            marker.addTo(mapInstance.current);
            markersRef.current.push(marker);

            if (!seenOffices[p.office_id] && legendRef.current) {
                seenOffices[p.office_id] = true;
                const item = document.createElement('div');
                item.style.cssText = 'display:flex;align-items:center;gap:6px;margin:3px 0;font-size:12px;color:#333;';
                item.innerHTML = `
                    <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></div>
                    <span>${p.office_name ?? 'Unknown'}</span>`;
                legendRef.current.appendChild(item);
            }
        });
    }, [projects, showNames, filters.progress]);

    const handleFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
<main className="flex-1 p-3 md:p-6">
            <Head title="Project Map" />

            <div className="py-4 px-4 max-w-full mx-auto">

                {/* Filters + controls row */}
                <div className="flex flex-wrap items-center gap-3 mb-4">

                    {/* Office filter */}
                    <select
                        className="rounded-md border-gray-300 shadow-sm text-sm focus:ring focus:ring-indigo-200"
                        value={filters.office_id}
                        onChange={e => handleFilter('office_id', e.target.value)}
                    >
                        <option value="">All Offices</option>
                        {offices.map(o => (
                            <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                        ))}
                    </select>

                    {/* Year filter */}
                    <select
                        className="rounded-md border-gray-300 shadow-sm text-sm focus:ring focus:ring-indigo-200"
                        value={filters.year_obligated}
                        onChange={e => handleFilter('year_obligated', e.target.value)}
                    >
                        <option value="">All Years</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Progress filter — derived from actual project data */}
                    <select
                        className="rounded-md border-gray-300 shadow-sm text-sm focus:ring focus:ring-indigo-200"
                        value={filters.progress}
                        onChange={e => handleFilter('progress', e.target.value)}
                    >
                        <option value="">All Progress</option>
                        {progressList.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    {/* Tile / terrain selector */}
                    <div className="flex rounded-md overflow-hidden border border-gray-300 shadow-sm text-sm">
                        {Object.entries(TILE_LAYERS).map(([key, { label }]) => (
                            <button
                                key={key}
                                onClick={() => setTileKey(key)}
                                className={`px-3 py-1.5 transition-colors ${
                                    tileKey === key
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Show/hide names toggle */}
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <div
                            onClick={() => setShowNames(v => !v)}
                            className={`relative w-9 h-5 rounded-full transition-colors ${
                                showNames ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                showNames ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                        </div>
                        Show names
                    </label>

                     {/* Project count */}
                    <p className="mt-3 text-sm justify-right">
                        Showing <span className="font-medium justify-right">
                            {filters.progress
                                ? projects.filter(p => p.progress === filters.progress).length
                                : projects.length}
                        </span> project{projects.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Map — taller, full width */}
                <div
                    className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                    style={{ height: 'calc(100vh - 220px)' }}
                >
                    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

                    {/* Legend */}
                    <div
                        ref={legendRef}
                        className="absolute bottom-6 left-3 z-[999] bg-white/95 border border-gray-200 rounded-lg px-3 py-2"
                        style={{ maxHeight: '160px', overflowY: 'auto' }}
                    />
                </div>

               
            </div>
        </main>
    );
}