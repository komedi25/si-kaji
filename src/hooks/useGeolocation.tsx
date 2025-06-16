
import { useState, useEffect } from 'react';
import { LocationPermission } from '@/types/selfAttendance';

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationPermission>({ granted: false });
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = (): Promise<LocationPermission> => {
    return new Promise((resolve) => {
      setLoading(true);
      
      if (!navigator.geolocation) {
        setLoading(false);
        const result = { granted: false, error: 'Geolocation tidak didukung oleh browser ini' };
        setLocation(result);
        resolve(result);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = {
            granted: true,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            }
          };
          setLocation(result);
          setLoading(false);
          resolve(result);
        },
        (error) => {
          let errorMessage = 'Gagal mendapatkan lokasi';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Akses lokasi ditolak. Mohon izinkan akses lokasi di browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informasi lokasi tidak tersedia.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Permintaan lokasi timeout.';
              break;
          }
          const result = { granted: false, error: errorMessage };
          setLocation(result);
          setLoading(false);
          resolve(result);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const checkPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return permission.state === 'granted';
      } catch (error) {
        console.error('Error checking geolocation permission:', error);
        return false;
      }
    }
    return false;
  };

  return {
    location,
    loading,
    getCurrentLocation,
    checkPermission
  };
};
