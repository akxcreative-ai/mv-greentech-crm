import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { trackingApi } from '../lib/api';

// Calculate compass bearing angle (0 - 360 deg) between two lat/lon points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return Math.round(bearing);
}

export function useLocationTracker() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState<boolean>(() => {
    return localStorage.getItem('mv_gps_tracking_enabled') === 'true';
  });
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const prevCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  const sendPing = useCallback(
    async (coords: GeolocationCoordinates) => {
      if (!user) return;

      const now = Date.now();
      // Throttle pings to at most once every 12 seconds
      if (now - lastPingTimeRef.current < 12000) return;
      lastPingTimeRef.current = now;

      let calculatedHeading = coords.heading;
      if ((calculatedHeading === null || isNaN(calculatedHeading)) && prevCoordsRef.current) {
        calculatedHeading = calculateBearing(
          prevCoordsRef.current.lat,
          prevCoordsRef.current.lon,
          coords.latitude,
          coords.longitude
        );
      }

      // Convert speed from m/s to km/h if present
      const speedKmH =
        coords.speed !== null && !isNaN(coords.speed)
          ? Math.round(coords.speed * 3.6)
          : 0;

      prevCoordsRef.current = { lat: coords.latitude, lon: coords.longitude };

      let batteryPct: number | null = null;
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          batteryPct = Math.round(battery.level * 100);
        }
      } catch {
        // Battery status not supported
      }

      setCurrentCoords({
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: calculatedHeading ?? 0,
        speed: speedKmH,
        accuracy: Math.round(coords.accuracy),
      });

      try {
        await trackingApi.ping({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          heading: calculatedHeading,
          speed: speedKmH,
          battery: batteryPct,
          isTrackingActive: true,
        });
      } catch (err) {
        console.warn('GPS ping failed:', err);
      }
    },
    [user]
  );

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setGpsError(null);
    setIsTracking(true);
    localStorage.setItem('mv_gps_tracking_enabled', 'true');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        sendPing(position.coords);
      },
      (error) => {
        console.warn('GPS Watch error:', error.message);
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );
  }, [sendPing]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    localStorage.setItem('mv_gps_tracking_enabled', 'false');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    trackingApi.toggle(false).catch(() => {});
  }, []);

  useEffect(() => {
    // If tracking was previously active and user is logged in, resume watching
    if (user && isTracking) {
      startTracking();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user, isTracking, startTracking]);

  return {
    isTracking,
    currentCoords,
    gpsError,
    startTracking,
    stopTracking,
  };
}
