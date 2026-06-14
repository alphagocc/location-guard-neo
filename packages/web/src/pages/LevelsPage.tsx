import type { NoisyLevel } from 'location-guard-types';
import L from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocationGuard } from '../hooks/useLocationGuard';

const TABS: { id: NoisyLevel; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

const DEFAULT_POS = { latitude: 48.860_141_066_724_41, longitude: 2.356_910_705_566_406 };

function formatCacheTime(ct: number): string {
  if (ct === 0)
    return 'don\'t cache';
  if (ct < 60)
    return `${ct} minute${ct > 1 ? 's' : ''}`;
  const h = ct - 59;
  return `${h} hour${h > 1 ? 's' : ''}`;
}

export function LevelsPage() {
  const { ready, api, getValue, setValue } = useLocationGuard();
  const [activeLevel, setActiveLevel] = useState<NoisyLevel>('medium');
  const [radius, setRadius] = useState(500);
  const [accuracy, setAccuracy] = useState(1500);
  const [cacheTime, setCacheTime] = useState(30);
  const [sliderCt, setSliderCt] = useState(30);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const protectionCircleRef = useRef<L.Circle | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const currentPosRef = useRef(DEFAULT_POS);

  const computeAccuracy = useCallback((r: number) => {
    if (!api)
      return 1500;
    const eps = api.epsilon / r;
    return Math.round(api.PlanarLaplace.alphaDeltaAccuracy(eps, 0.95));
  }, [api]);

  const moveCircles = useCallback(() => {
    const pos = currentPosRef.current;
    const latlng: L.LatLngExpression = [pos.latitude, pos.longitude];
    markerRef.current?.setLatLng(latlng);
    protectionCircleRef.current?.setLatLng(latlng);
    accuracyCircleRef.current?.setLatLng(latlng);
  }, []);

  const updateMapCircles = useCallback((r: number, fit: boolean) => {
    const acc = computeAccuracy(r);
    setAccuracy(acc);
    moveCircles();
    protectionCircleRef.current?.setRadius(r);
    accuracyCircleRef.current?.setRadius(acc);
    if (fit && mapInstanceRef.current && accuracyCircleRef.current) {
      mapInstanceRef.current.fitBounds(accuracyCircleRef.current.getBounds());
    }
  }, [computeAccuracy, moveCircles]);

  const loadLevelInfo = useCallback(async (level: NoisyLevel) => {
    if (!ready)
      return;
    const levels = await getValue('levels');
    const r = levels[level].radius;
    const ct = levels[level].cacheTime;
    const slCt = ct <= 59 ? ct : 59 + Math.floor(ct / 59);

    setRadius(r);
    setCacheTime(ct);
    setSliderCt(slCt);
    updateMapCircles(r, true);
  }, [ready, getValue, updateMapCircles]);

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current)
      return;

    const pos = currentPosRef.current;
    const latlng: L.LatLngExpression = [pos.latitude, pos.longitude];

    const map = L.map(mapRef.current).setView(latlng, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker(latlng, { draggable: true }).addTo(map);
    const accCircle = L.circle(latlng, { radius: 1500, color: 'transparent', fillColor: 'blue', fillOpacity: 0.4 }).addTo(map);
    const protCircle = L.circle(latlng, { radius: 500, color: 'transparent', fillColor: '#f03', fillOpacity: 0.4 }).addTo(map);

    const handlePosChange = (e: L.LeafletEvent) => {
      const ll = (e as L.LeafletMouseEvent).latlng || (e.target as L.Marker).getLatLng();
      currentPosRef.current = { latitude: ll.lat, longitude: ll.lng };
      moveCircles();
    };

    map.on('click', handlePosChange);
    marker.on('drag', handlePosChange);

    mapInstanceRef.current = map;
    markerRef.current = marker;
    protectionCircleRef.current = protCircle;
    accuracyCircleRef.current = accCircle;

    loadLevelInfo(activeLevel);
  }, [ready]); // eslint-disable-line react/exhaustive-deps

  useEffect(() => {
    if (!ready)
      return;
    loadLevelInfo(activeLevel);
  }, [activeLevel, ready, loadLevelInfo]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
      return () => clearTimeout(timer);
    }
  });

  const handleRadiusChange = useCallback((value: number) => {
    const r = Math.round(value / 20) * 20;
    setRadius(r);
    updateMapCircles(r, false);
  }, [updateMapCircles]);

  const handleRadiusCommit = useCallback(async (value: number) => {
    const r = Math.round(value / 20) * 20;
    if (!ready)
      return;

    const levels = await getValue('levels');
    const cachedPos = await getValue('cachedPos');

    if (levels[activeLevel].radius !== r) {
      delete cachedPos[activeLevel];
    }

    levels[activeLevel].radius = r;
    const ct = sliderCt <= 59 ? sliderCt : 60 * (sliderCt - 59);
    levels[activeLevel].cacheTime = ct;

    await setValue('levels', levels);
    await setValue('cachedPos', cachedPos);
  }, [ready, activeLevel, sliderCt, getValue, setValue]);

  const handleCacheChange = useCallback((value: number) => {
    setSliderCt(value);
    const ct = value <= 59 ? value : 60 * (value - 59);
    setCacheTime(ct);
  }, []);

  const handleCacheCommit = useCallback(async (value: number) => {
    if (!ready)
      return;
    const ct = value <= 59 ? value : 60 * (value - 59);
    const levels = await getValue('levels');
    const cachedPos = await getValue('cachedPos');

    levels[activeLevel].cacheTime = ct;
    await setValue('levels', levels);
    await setValue('cachedPos', cachedPos);
  }, [ready, activeLevel, getValue, setValue]);

  return (
    <div className="levels-page">
      <div className="page-header">
        <h2>Privacy Levels</h2>
      </div>
      <div className="page-body">
        <div className="tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeLevel === tab.id ? 'active' : ''}`}
              onClick={() => setActiveLevel(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="levels-controls" style={{ padding: '16px 0' }}>
          <div className="level-info">
            <span className="level-info-item">
              Protection:
              <strong>
                {radius}
                {' '}
                m
              </strong>
            </span>
            <span className="level-info-item">
              Accuracy:
              <strong>
                {accuracy}
                {' '}
                m
              </strong>
            </span>
          </div>

          <div className="slider-container">
            <div className="slider-header">
              <span>Protection radius</span>
              <span className="slider-value">
                {radius}
                {' '}
                m
              </span>
            </div>
            <input
              type="range"
              min={40}
              max={3000}
              step={20}
              value={radius}
              onChange={e => handleRadiusChange(Number(e.target.value))}
              onMouseUp={e => handleRadiusCommit(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={e => handleRadiusCommit(Number((e.target as HTMLInputElement).value))}
            />
          </div>

          <div className="slider-container">
            <div className="slider-header">
              <span>Cache duration</span>
              <span className="slider-value">{formatCacheTime(cacheTime)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={69}
              step={1}
              value={sliderCt}
              onChange={e => handleCacheChange(Number(e.target.value))}
              onMouseUp={e => handleCacheCommit(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={e => handleCacheCommit(Number((e.target as HTMLInputElement).value))}
            />
          </div>
        </div>

        <div ref={mapRef} className="map-container map-container-full" />
      </div>
    </div>
  );
}
