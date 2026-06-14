import type { Level } from 'location-guard-types';
import { useCallback, useEffect, useState } from 'react';
import { useLocationGuard } from '../hooks/useLocationGuard';

const LEVEL_OPTIONS: { value: Level; label: string }[] = [
  { value: 'fixed', label: 'Use fixed location' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'real', label: 'Use real location' },
];

export function OptionsPage() {
  const { ready, api, getValue, setValue, resetConfig, emptyCachedPos } = useLocationGuard();
  const [defaultLevel, setDefaultLevel] = useState<Level>('medium');
  const [paused, setPaused] = useState(false);
  const [updateAccuracy, setUpdateAccuracy] = useState(false);

  useEffect(() => {
    if (!ready)
      return;
    (async () => {
      setDefaultLevel(await getValue('defaultLevel'));
      setPaused(await getValue('paused'));
      setUpdateAccuracy(await getValue('updateAccuracy'));
    })();
  }, [ready, getValue]);

  const handleLevelChange = useCallback(async (level: Level) => {
    setDefaultLevel(level);
    await setValue('defaultLevel', level);
  }, [setValue]);

  const handlePausedChange = useCallback(async (checked: boolean) => {
    setPaused(checked);
    await setValue('paused', checked);
  }, [setValue]);

  const handleAccuracyChange = useCallback(async (checked: boolean) => {
    if (!api)
      return;
    setUpdateAccuracy(checked);

    const PlanarLaplace = api.PlanarLaplace;
    const epsilon = api.epsilon;
    const levels = await getValue('levels');
    const cachedPos = await getValue('cachedPos');

    for (const level in cachedPos) {
      const entry = cachedPos[level as Level];
      if (!entry)
        continue;
      const lvl = levels[level as keyof typeof levels];
      if (!lvl)
        continue;
      const eps = epsilon / lvl.radius;
      entry.position.coords.accuracy
        += (checked ? 1 : -1) * Math.round(PlanarLaplace.alphaDeltaAccuracy(eps, 0.9));
    }

    await setValue('cachedPos', cachedPos);
    await setValue('updateAccuracy', checked);
  }, [api, getValue, setValue]);

  const handleDeleteCache = useCallback(async () => {
    await emptyCachedPos();
    window.alert('Location cache was deleted');
  }, [emptyCachedPos]);

  const handleRestoreDefaults = useCallback(async () => {
    if (window.confirm('Are you sure you want to restore the default options?')) {
      await resetConfig();
      location.reload();
    }
  }, [resetConfig]);

  if (!ready) {
    return (
      <>
        <div className="page-header"><h2>Options</h2></div>
        <div className="page-body">
          <div className="card">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>Options</h2>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-title">General</div>
          <div className="form-group">
            <label htmlFor="defaultLevel">Default privacy level</label>
            <select
              id="defaultLevel"
              value={defaultLevel}
              onChange={e => handleLevelChange(e.target.value as Level)}
            >
              {LEVEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={paused}
                onChange={e => handlePausedChange(e.target.checked)}
              />
              <span>
                Pause Location Guard
                {paused && <span className="status-badge paused" style={{ marginLeft: 8 }}>Paused</span>}
              </span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={updateAccuracy}
                onChange={e => handleAccuracyChange(e.target.checked)}
              />
              <span>
                Update accuracy
                <div className="hint">Adapts the reported accuracy to the amount of added noise</div>
              </span>
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Actions</div>
          <div className="btn-group">
            <button className="btn btn-danger" onClick={handleDeleteCache}>
              Delete fake location cache
            </button>
            <button className="btn" onClick={handleRestoreDefaults}>
              Restore default options
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
