import type { $LocationGuard } from 'location-guard-types';
import { useCallback, useEffect, useRef, useState } from 'react';

function isReady(): boolean {
  return !!window.$locationGuard?.ready;
}

export function useLocationGuard() {
  const [ready, setReady] = useState(isReady);
  const ref = useRef<$LocationGuard | null>(window.$locationGuard ?? null);

  useEffect(() => {
    if (ready)
      return;

    const onReady = () => {
      if (window.$locationGuard) {
        ref.current = window.$locationGuard;
      }
      setReady(true);
    };
    window.addEventListener('location-guard-config-ui-ready', onReady, { once: true });

    const timeout = setTimeout(() => {
      if (!window.$locationGuard) {
        window.alert('Location Guard UserScript is missing, please install it first!');
        window.location.assign('/');
      }
    }, 3000);

    return () => {
      window.removeEventListener('location-guard-config-ui-ready', onReady);
      clearTimeout(timeout);
    };
  }, [ready]);

  const getValue = useCallback(
    async <K extends keyof import('location-guard-types').StoredValues>(key: K) => {
      if (!ref.current)
        throw new Error('LocationGuard not ready');
      return ref.current.getValue(key);
    },
    [],
  );

  const setValue = useCallback(
    async <K extends keyof import('location-guard-types').StoredValues>(
      key: K,
      value: import('location-guard-types').StoredValues[K],
    ) => {
      if (!ref.current)
        throw new Error('LocationGuard not ready');
      return ref.current.setValue(key, value);
    },
    [],
  );

  const resetConfig = useCallback(async () => {
    if (!ref.current)
      throw new Error('LocationGuard not ready');
    return ref.current.resetConfig();
  }, []);

  const emptyCachedPos = useCallback(async () => {
    if (!ref.current)
      throw new Error('LocationGuard not ready');
    return ref.current.emptyCachedPos();
  }, []);

  return {
    ready,
    api: ref.current,
    getValue,
    setValue,
    resetConfig,
    emptyCachedPos,
  };
}
