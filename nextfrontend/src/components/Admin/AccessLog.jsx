import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { getAccessLogsApi, getAccessStatsApi } from '../../api/access';
import Spinner from '../UI/Spinner';
import { MapPin, List, RefreshCw, Globe, Clock, Users, BarChart3 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a timestamp to an HSL hue:
 *   – Recent (now)  → red (0°)
 *   – Older (24h+)  → blue (240°)
 * Intermediate values are interpolated.
 */
function ageToColor(timestamp, oldestTs, newestTs) {
  const ts = new Date(timestamp).getTime();
  const range = newestTs - oldestTs || 1;
  // 0 = oldest, 1 = newest
  const ratio = (ts - oldestTs) / range;
  // newest → red (0), oldest → blue (240)
  const hue = Math.round(240 - ratio * 240);
  return `hsl(${hue}, 85%, 55%)`;
}

function buildMarkerSvg(color) {
  // URL-encoded SVG marker pin
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.9"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 bg-gray-800/60 rounded-lg p-4 min-w-[160px]">
    <Icon size={22} className="text-primary shrink-0" />
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const TimeFilter = ({ value, onChange, t }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    className="bg-gray-800 text-gray-200 text-sm rounded-md px-3 py-1.5 border border-gray-700 focus:border-primary outline-none"
  >
    <option value="">{t('allTime')}</option>
    <option value="1">{t('lastHour')}</option>
    <option value="6">{t('last6Hours')}</option>
    <option value="24">{t('last24Hours')}</option>
    <option value="168">{t('last7Days')}</option>
    <option value="720">{t('last30Days')}</option>
  </select>
);

// ---------------------------------------------------------------------------
// Map component (dynamic import to avoid SSR issues with Leaflet)
// ---------------------------------------------------------------------------

function AccessMap({ logs }) {
  const [MapContainer, setMapContainer] = useState(null);
  const [TileLayer, setTileLayer] = useState(null);
  const [MarkerComp, setMarkerComp] = useState(null);
  const [PopupComp, setPopupComp] = useState(null);
  const [L, setL] = useState(null);

  useEffect(() => {
    // Dynamically import leaflet and react-leaflet on client side only
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
    ]).then(([leaflet, rl]) => {
      setL(leaflet.default || leaflet);
      setMapContainer(() => rl.MapContainer);
      setTileLayer(() => rl.TileLayer);
      setMarkerComp(() => rl.Marker);
      setPopupComp(() => rl.Popup);
    });
  }, []);

  // Compute time range for colour coding
  const { oldestTs, newestTs } = useMemo(() => {
    const geoLogs = logs.filter((l) => l.latitude && l.longitude);
    if (geoLogs.length === 0) return { oldestTs: 0, newestTs: 1 };
    const timestamps = geoLogs.map((l) => new Date(l.timestamp).getTime());
    return { oldestTs: Math.min(...timestamps), newestTs: Math.max(...timestamps) };
  }, [logs]);

  const geoLogs = useMemo(
    () => logs.filter((l) => l.latitude && l.longitude),
    [logs],
  );

  if (!MapContainer || !L) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-900/50 rounded-lg">
        <Spinner />
      </div>
    );
  }

  // Centre on first marker or world view
  const centre = geoLogs.length > 0
    ? [geoLogs[0].latitude, geoLogs[0].longitude]
    : [30, 0];

  return (
    <div className="rounded-lg overflow-hidden border border-gray-700" style={{ height: 500 }}>
      <MapContainer center={centre} zoom={geoLogs.length > 0 ? 4 : 2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {geoLogs.map((log) => {
          const color = ageToColor(log.timestamp, oldestTs, newestTs);
          const icon = L.icon({
            iconUrl: buildMarkerSvg(color),
            iconSize: [28, 40],
            iconAnchor: [14, 40],
            popupAnchor: [0, -40],
          });

          return (
            <MarkerComp key={log.id} position={[log.latitude, log.longitude]} icon={icon}>
              <PopupComp>
                <div className="text-sm min-w-[180px]" style={{ color: '#222' }}>
                  <p className="font-bold">{log.city}{log.region ? `, ${log.region}` : ''}</p>
                  <p>{log.country} {log.org ? `· ${log.org}` : ''}</p>
                  <p className="text-xs mt-1 opacity-70">
                    IP: {log.ip_address}
                  </p>
                  <p className="text-xs opacity-70">
                    {format(new Date(log.timestamp), 'MMM d, yyyy – HH:mm')}
                  </p>
                </div>
              </PopupComp>
            </MarkerComp>
          );
        })}
      </MapContainer>

      {/* Colour legend */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/90 text-xs text-gray-300 border-t border-gray-700">
        <span>Older</span>
        <div className="flex-1 h-2 rounded"
          style={{
            background: 'linear-gradient(to right, hsl(240,85%,55%), hsl(180,85%,55%), hsl(120,85%,55%), hsl(60,85%,55%), hsl(0,85%,55%))',
          }}
        />
        <span>Newest</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

const AccessListItem = ({ log }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors"
  >
    <div className="flex items-center gap-3 min-w-0">
      <MapPin size={18} className="text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {log.city || 'Unknown'}{log.region ? `, ${log.region}` : ''}{log.country ? ` (${log.country})` : ''}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {log.ip_address} {log.org ? `· ${log.org}` : ''}
        </p>
      </div>
    </div>
    <div className="text-right shrink-0">
      <p className="text-xs text-gray-300">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</p>
      <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p>
    </div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const AccessLog = () => {
  const t = useTranslations('admin.access');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [hoursFilter, setHoursFilter] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [logsData, statsData] = await Promise.all([
        getAccessLogsApi(hoursFilter),
        getAccessStatsApi(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (err) {
      setError(t('loadError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [hoursFilter, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (error) return <p className="text-red-400 text-center py-10">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          <StatCard icon={Globe} label={t('totalAccesses')} value={stats.total} />
          <StatCard icon={Users} label={t('uniqueIPs')} value={stats.unique_ips} />
          <StatCard icon={Clock} label={t('last24h')} value={stats.recent_count} />
          <StatCard icon={BarChart3} label={t('topCountry')} value={stats.top_countries?.[0]?.country || '—'} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'map' ? 'nav-button active' : 'nav-button'}`}
          >
            <MapPin size={14} className="inline mr-1" /> {t('mapView')}
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'list' ? 'nav-button active' : 'nav-button'}`}
          >
            <List size={14} className="inline mr-1" /> {t('listView')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <TimeFilter value={hoursFilter ?? ''} onChange={setHoursFilter} t={t} />
          <button onClick={fetchData} className="btn btn-secondary btn-sm !py-1.5 !px-2" title={t('refresh')}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {viewMode === 'map' ? (
            <AccessMap logs={logs} />
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-mode-secondary text-center py-6">{t('noLogs')}</p>
              ) : (
                logs.map((log) => <AccessListItem key={log.id} log={log} />)
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AccessLog;
