import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Save, Trash2, Navigation, Edit } from 'lucide-react';

interface PolygonPoint {
  lat: number;
  lng: number;
}

interface LocationPolygon {
  id?: string;
  name: string;
  coordinates: PolygonPoint[];
  isActive: boolean;
}

export const PolygonLocationManager: React.FC = () => {
  const [locations, setLocations] = useState<LocationPolygon[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationPolygon | null>(null);
  const [mapCenter] = useState({ lat: -6.989899, lng: 110.420042 }); // SMK N 1 Kendal
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPoints, setTempPoints] = useState<PolygonPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
    checkMapboxToken();
  }, []);

  useEffect(() => {
    if (mapboxToken && mapContainerRef.current) {
      initializeMap();
    }
  }, [mapboxToken]);

  const checkMapboxToken = async () => {
    try {
      // Try to get token from Edge Function secrets
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.log('Edge function error:', error);
        setShowTokenInput(true);
        return;
      }
      
      if (data?.token && data.token.startsWith('pk.')) {
        setMapboxToken(data.token);
        setShowTokenInput(false);
        console.log('Mapbox token loaded successfully');
        return;
      } else {
        console.log('No valid token in response:', data);
        setShowTokenInput(true);
      }
    } catch (error) {
      console.log('Error fetching Mapbox token:', error);
      setShowTokenInput(true);
    }
  };

  const initializeMap = async () => {
    if (!mapboxToken || !mapContainerRef.current) {
      console.log('Cannot initialize map - missing token or container');
      return;
    }

    try {
      console.log('Initializing map with token:', mapboxToken.substring(0, 10) + '...');
      
      // Dynamically import mapbox-gl
      const mapboxgl = await import('mapbox-gl');
      
      // Set access token
      mapboxgl.default.accessToken = mapboxToken;

      // Initialize map
      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [mapCenter.lng, mapCenter.lat],
        zoom: 16,
        pitch: 0,
        bearing: 0
      });

      // Add navigation controls
      map.addControl(new mapboxgl.default.NavigationControl(), 'top-right');

      // Store map reference
      mapRef.current = map;

      // Wait for map to load before adding features
      map.on('load', () => {
        console.log('Map loaded successfully');
        
        // Add existing polygons to map
        locations.forEach(location => {
          if (location.coordinates && location.coordinates.length > 0) {
            addPolygonToMap(location);
          }
        });
        
        toast({
          title: "Berhasil",
          description: "Peta berhasil dimuat. Klik tombol 'Mulai Gambar' untuk membuat polygon.",
        });
      });

      // Add click handler for polygon drawing
      map.on('click', (e) => {
        if (isDrawing) {
          const point = { lat: e.lngLat.lat, lng: e.lngLat.lng };
          setTempPoints(prev => [...prev, point]);
          
          // Add marker for this point
          new mapboxgl.default.Marker({ color: '#ef4444' })
            .setLngLat([point.lng, point.lat])
            .addTo(map);
            
          console.log('Added point:', point);
        }
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        toast({
          title: "Error",
          description: "Terjadi kesalahan pada peta. Periksa token Mapbox Anda.",
          variant: "destructive",
        });
      });

    } catch (error) {
      console.error('Error loading map:', error);
      toast({
        title: "Error",
        description: "Gagal memuat peta. Pastikan token Mapbox valid dan koneksi internet stabil.",
        variant: "destructive",
      });
    }
  };

  const addPolygonToMap = (location: LocationPolygon) => {
    if (!mapRef.current || !location.coordinates) return;

    const coordinates = location.coordinates.map(point => [point.lng, point.lat]);
    coordinates.push(coordinates[0]); // Close the polygon

    // Add polygon source
    mapRef.current.addSource(`polygon-${location.id}`, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    });

    // Add polygon layer
    mapRef.current.addLayer({
      id: `polygon-${location.id}`,
      type: 'fill',
      source: `polygon-${location.id}`,
      paint: {
        'fill-color': location.isActive ? '#22c55e' : '#ef4444',
        'fill-opacity': 0.3
      }
    });

    // Add polygon outline
    mapRef.current.addLayer({
      id: `polygon-outline-${location.id}`,
      type: 'line',
      source: `polygon-${location.id}`,
      paint: {
        'line-color': location.isActive ? '#16a34a' : '#dc2626',
        'line-width': 2
      }
    });
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_locations')
        .select('*')
        .eq('location_type', 'polygon')
        .eq('is_active', true);

      if (error) throw error;

      const formattedLocations: LocationPolygon[] = (data || []).map(loc => ({
        id: loc.id,
        name: loc.name,
        coordinates: typeof loc.polygon_coordinates === 'string' 
          ? JSON.parse(loc.polygon_coordinates) 
          : Array.isArray(loc.polygon_coordinates) 
            ? loc.polygon_coordinates 
            : [],
        isActive: loc.is_active
      }));

      setLocations(formattedLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Error",
        description: "Gagal memuat lokasi polygon.",
        variant: "destructive",
      });
    }
  };

  const handleTokenSubmit = () => {
    if (!mapboxToken.trim()) {
      toast({
        title: "Error",
        description: "Masukkan token Mapbox yang valid.",
        variant: "destructive",
      });
      return;
    }
    setShowTokenInput(false);
    initializeMap();
  };

  const completePolygon = () => {
    if (tempPoints.length < 3) {
      toast({
        title: "Error",
        description: "Polygon harus memiliki minimal 3 titik.",
        variant: "destructive",
      });
      return;
    }

    // Clear temporary markers
    if (mapRef.current) {
      const markers = document.querySelectorAll('.mapboxgl-marker');
      markers.forEach(marker => marker.remove());
    }

    setSelectedLocation({
      id: '',
      name: '',
      coordinates: tempPoints,
      isActive: true
    });
    setIsDrawing(false);
  };

  const startDrawing = () => {
    if (!mapRef.current) {
      toast({
        title: "Error",
        description: "Peta belum siap. Pastikan token Mapbox telah dimasukkan.",
        variant: "destructive",
      });
      return;
    }
    
    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());
    
    setTempPoints([]);
    setIsDrawing(true);
    setSelectedLocation(null);
  };

  const cancelDrawing = () => {
    // Clear temporary markers
    if (mapRef.current) {
      const markers = document.querySelectorAll('.mapboxgl-marker');
      markers.forEach(marker => marker.remove());
    }
    
    setTempPoints([]);
    setIsDrawing(false);
  };

  const saveLocation = async () => {
    if (!selectedLocation?.name || !selectedLocation?.coordinates?.length) {
      toast({
        title: "Error",
        description: "Nama lokasi dan koordinat polygon harus diisi.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const locationData = {
        name: selectedLocation.name,
        location_type: 'polygon',
        polygon_coordinates: JSON.stringify(selectedLocation.coordinates),
        latitude: selectedLocation.coordinates[0].lat,
        longitude: selectedLocation.coordinates[0].lng,
        radius_meters: 0,
        is_active: true
      };

      if (selectedLocation.id) {
        const { error } = await supabase
          .from('attendance_locations')
          .update(locationData)
          .eq('id', selectedLocation.id);

        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Lokasi polygon berhasil diperbarui.",
        });
      } else {
        const { error } = await supabase
          .from('attendance_locations')
          .insert(locationData);

        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Lokasi polygon berhasil ditambahkan.",
        });
      }

      setSelectedLocation(null);
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan lokasi polygon.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendance_locations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Berhasil",
        description: "Lokasi polygon berhasil dihapus.",
      });
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus lokasi polygon.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Mapbox Token Input */}
      {showTokenInput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Konfigurasi Mapbox
            </CardTitle>
            <CardDescription>
              Masukkan token Mapbox untuk menggunakan peta interaktif. 
              Dapatkan token gratis di{' '}
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                mapbox.com
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
              <Input
                id="mapbox-token"
                type="password"
                placeholder="pk.eyJ1IjoiWW91clVzZXJuYW1lIiwiYSI6IkFiQ0RlRmdISUpLTG1Ob1BxUnNUdVZ3WFlabGFOYlBjRGVmR2hJSktMbU5vIn0..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
              />
            </div>
            <Button onClick={handleTokenSubmit} className="w-full">
              Aktifkan Peta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Polygon Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pengaturan Lokasi Polygon
          </CardTitle>
          <CardDescription>
            Buat dan kelola area polygon untuk presensi lokasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="locationName">Nama Lokasi</Label>
                <Input
                  id="locationName"
                  value={selectedLocation?.name || ''}
                  onChange={(e) => setSelectedLocation(prev => 
                    prev 
                      ? { ...prev, name: e.target.value }
                      : { id: '', name: e.target.value, coordinates: [], isActive: true }
                  )}
                  placeholder="Masukkan nama lokasi"
                />
              </div>

              <div className="space-y-2">
                <Label>Koordinat Polygon</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedLocation?.coordinates?.length || 0} titik
                </div>
                {selectedLocation?.coordinates?.map((point, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    Titik {index + 1}: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {!isDrawing ? (
                  <Button onClick={startDrawing} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Mulai Gambar
                  </Button>
                ) : (
                  <>
                    <Button onClick={completePolygon} variant="outline">
                      Selesai ({tempPoints.length} titik)
                    </Button>
                    <Button onClick={cancelDrawing} variant="destructive">
                      Batal
                    </Button>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={saveLocation} 
                  disabled={isLoading || !selectedLocation?.name}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Menyimpan..." : "Simpan Lokasi"}
                </Button>
                {selectedLocation && (
                  <Button 
                    onClick={() => setSelectedLocation(null)} 
                    variant="outline"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Map Section */}
            <div className="space-y-4">
              <Label>Peta Lokasi Polygon</Label>
              <div 
                ref={mapContainerRef}
                className="w-full h-96 bg-gray-200 border border-gray-300 rounded-lg relative overflow-hidden"
                style={{ minHeight: '384px' }}
              >
                {!mapboxToken && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="text-center">
                      <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Masukkan token Mapbox untuk melihat peta</p>
                    </div>
                  </div>
                )}
                {mapboxToken && !mapRef.current && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Memuat peta...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {isDrawing && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Mode Gambar Aktif:</strong> Klik pada peta untuk menambah titik polygon.
                    Minimal 3 titik diperlukan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Lokasi Polygon Tersimpan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Belum ada lokasi polygon yang tersimpan
              </p>
            ) : (
              locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{location.name}</h4>
                      <Badge variant={location.isActive ? "default" : "secondary"}>
                        {location.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {location.coordinates?.length || 0} titik polygon
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedLocation(location)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => location.id && deleteLocation(location.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
