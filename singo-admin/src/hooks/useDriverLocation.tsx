import { useEffect, useRef } from 'react';
import { getSocket } from '../utils/socket';

export function useDriverLocation(driverId: number | null, deliveryId: number | null, enabled = true) {
  const watchIdRef = useRef<number | null>(null);
  const socket = getSocket();

  useEffect(() => {
    if (!enabled || !driverId || !deliveryId || !('geolocation' in navigator)) return;

    const success = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      socket.emit('updateLocation', {
        driverId,
        deliveryId,
        latitude,
        longitude,
      });
      // optional console
      // console.log('sent location', { driverId, deliveryId, latitude, longitude });
    };

    const error = (err: GeolocationPositionError) => {
      console.error('Geolocation error:', err);
    };

    const id = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    });

    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [driverId, deliveryId, enabled, socket]);
}