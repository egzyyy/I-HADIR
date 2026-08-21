import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

export type LocationState =
  | 'checking'    // asking the server whether a fix is even needed
  | 'not-needed'  // geofence off — scan freely
  | 'requesting'  // waiting on the browser permission prompt / GPS fix
  | 'denied'      // user refused, or the browser blocked it
  | 'unavailable' // no GPS, timed out, or not a secure context
  | 'verifying'   // have a position, asking the server if it's inside the fence
  | 'out-of-area' // position is valid but too far from the school
  | 'ready';      // inside the fence — scanning allowed

export interface ScanLocation {
  state: LocationState;
  coords: { latitude: number; longitude: number; accuracy: number } | null;
  error: string | null;
  retry: () => void;
}

/**
 * Obtains a position for the public kiosk scanner when the school has a
 * geofence configured. The scanner stays locked until this reports 'ready'
 * (or 'not-needed').
 *
 * The server re-checks the coordinates on every scan — this hook exists for
 * the user experience, not as the enforcement point.
 */
export function useScanLocation(schoolSlug?: string | null): ScanLocation {
  const slugRef = useRef<string | null | undefined>(schoolSlug);
  slugRef.current = schoolSlug;

  const [state, setState] = useState<LocationState>('checking');
  const [coords, setCoords] = useState<ScanLocation['coords']>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const requestPosition = useCallback(() => {
    // Geolocation is a secure-context API: it silently fails over plain http
    // on anything but localhost, so say so rather than hanging on a prompt
    // that will never appear.
    if (!window.isSecureContext) {
      setState('unavailable');
      setError(
        'Location needs a secure (HTTPS) connection. Open this page over HTTPS to record attendance.'
      );
      return;
    }

    if (!('geolocation' in navigator)) {
      setState('unavailable');
      setError('This device cannot report its location.');
      return;
    }

    setState('requesting');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCoords(next);

        // Having a fix isn't enough — confirm it's actually at the school
        // before unlocking the camera. The scan endpoints re-check this
        // server-side regardless.
        setState('verifying');
        axios
          .post('/api/public/verify-location', {
            ...next,
            ...(slugRef.current ? { school: slugRef.current } : {}),
          })
          .then((res) => {
            const d = res.data?.data;
            if (d?.inside) {
              setState('ready');
            } else {
              setState('out-of-area');
              setError(d?.message ?? 'You are not at the school.');
            }
          })
          .catch(() => {
            // Verification unavailable — allow through; the scan itself is
            // still checked server-side and will reject if out of area.
            setState('ready');
          });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState('denied');
          setError('Location is switched off. Turn it on and allow access to record attendance.');
          return;
        }
        setState('unavailable');
        setError(
          err.code === err.TIMEOUT
            ? 'Timed out finding your location. Move somewhere with a clearer signal and try again.'
            : 'Your location could not be determined. Check that location services are on.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, []);

  // Ask the server whether this school enforces a geofence at all.
  useEffect(() => {
    let cancelled = false;

    axios
      .get('/api/public/scan-policy', { params: schoolSlug ? { school: schoolSlug } : undefined })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.data?.geofence_required) {
          requestPosition();
        } else {
          setState('not-needed');
        }
      })
      .catch(() => {
        // Can't reach the policy endpoint — let the scan proceed and let the
        // server reject it if a geofence really is in force.
        if (!cancelled) setState('not-needed');
      });

    return () => {
      cancelled = true;
    };
  }, [schoolSlug, requestPosition, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, coords, error, retry };
}
