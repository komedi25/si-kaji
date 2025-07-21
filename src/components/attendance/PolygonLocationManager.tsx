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
    // First check localStorage for saved token
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken && savedToken.startsWith('pk.')) {
      setMapboxToken(savedToken);
      setShowTokenInput(false);
      console.log('Using saved Mapbox token');
      return;
    }
    
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
        localStorage.setItem('mapbox_token', data.token); // Save to localStorage
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

      // Clear existing map if any
      if (mapRef.current) {
        mapRef.current.remove();
      }

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
        if (!isDrawing) {
          console.log('Click ignored - not in drawing mode');
          return;
        }
        
        const point = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        console.log('Adding point:', point);
        
        setTempPoints(prev => {
          const newPoints = [...prev, point];
          
          // Add marker for this point
          const marker = new mapboxgl.Marker({ 
            color: '#ef4444',
            draggable: false 
          })
            .setLngLat([point.lng, point.lat])
            .addTo(map);
            
          // Store marker reference for cleanup
          marker.getElement().setAttribute('data-marker-type', 'temp');
          
          // Draw line between points if there are multiple points
          if (newPoints.length > 1) {
            const lineCoordinates = newPoints.map(p => [p.lng, p.lat]);
            
            // Remove existing temp line if any
            if (map.getSource('temp-line')) {
              map.removeLayer('temp-line');
              map.removeSource('temp-line');
            }
            
            // Add temp line
            map.addSource('temp-line', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: lineCoordinates
                }
              }
            });
            
            map.addLayer({
              id: 'temp-line',
              type: 'line',
              source: 'temp-line',
              paint: {
                'line-color': '#ef4444',
                'line-width': 3,
                'line-dasharray': [4, 2]
              }
            });
          }
          
          // Show completion polygon preview if 3+ points
          if (newPoints.length >= 3) {
            const polygonCoordinates = [...newPoints.map(p => [p.lng, p.lat]), [newPoints[0].lng, newPoints[0].lat]];
            
            // Remove existing temp polygon if any
            if (map.getSource('temp-polygon')) {
              map.removeLayer('temp-polygon-fill');
              map.removeLayer('temp-polygon-outline');
              map.removeSource('temp-polygon');
            }
            
            // Add temp polygon
            map.addSource('temp-polygon', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [polygonCoordinates]
                }
              }
            });
            
            map.addLayer({
              id: 'temp-polygon-fill',
              type: 'fill',
              source: 'temp-polygon',
              paint: {
                'fill-color': '#ef4444',
                'fill-opacity': 0.2
              }
            });
            
            map.addLayer({
              id: 'temp-polygon-outline',
              type: 'line',
              source: 'temp-polygon',
              paint: {
                'line-color': '#dc2626',
                'line-width': 2,
                'line-dasharray': [4, 2]
              }
            });
          }
          
          console.log('Total points:', newPoints.length);
          
          // Show success toast for first point
          if (newPoints.length === 1) {
            toast({
              title: "Titik Pertama",
              description: "Klik untuk menambah titik lainnya (minimal 3 titik).",
            });
          }
          
          return newPoints;
        });
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
        .order('created_at', { ascending: false });

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
    
    // Save token to localStorage for persistence
    localStorage.setItem('mapbox_token', mapboxToken);
    setShowTokenInput(false);
    
    toast({
      title: "Berhasil",
      description: "Token Mapbox berhasil disimpan dan akan diingat.",
    });
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

    // Clear temporary markers and layers
    if (mapRef.current) {
      // Remove temporary markers
      const markers = document.querySelectorAll('.mapboxgl-marker[data-marker-type="temp"]');
      markers.forEach(marker => marker.remove());
      
      // Remove temporary layers
      if (mapRef.current.getSource('temp-line')) {
        mapRef.current.removeLayer('temp-line');
        mapRef.current.removeSource('temp-line');
      }
      if (mapRef.current.getSource('temp-polygon')) {
        mapRef.current.removeLayer('temp-polygon-fill');
        mapRef.current.removeLayer('temp-polygon-outline');
        mapRef.current.removeSource('temp-polygon');
      }
    }

    setSelectedLocation({
      id: '',
      name: '',
      coordinates: tempPoints,
      isActive: true
    });
    setIsDrawing(false);
    
    toast({
      title: "Berhasil",
      description: `Polygon dengan ${tempPoints.length} titik siap disimpan.`,
    });
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
    
    toast({
      title: "Mode Gambar Aktif",
      description: "Klik pada peta untuk menambahkan titik polygon. Minimal 3 titik diperlukan.",
    });
  };

  const cancelDrawing = () => {
    // Clear temporary markers
    if (mapRef.current) {
      // Remove temporary markers
      const markers = document.querySelectorAll('.mapboxgl-marker[data-marker-type="temp"]');
      markers.forEach(marker => marker.remove());
      
      // Remove temporary layers
      if (mapRef.current.getSource('temp-line')) {
        mapRef.current.removeLayer('temp-line');
        mapRef.current.removeSource('temp-line');
      }
      if (mapRef.current.getSource('temp-polygon')) {
        mapRef.current.removeLayer('temp-polygon-fill');
        mapRef.current.removeLayer('temp-polygon-outline');
        mapRef.current.removeSource('temp-polygon');
      }
    }
    
    setTempPoints([]);
    setIsDrawing(false);
    
    toast({
      title: "Dibatalkan",
      description: "Mode gambar polygon dibatalkan.",
    });
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

  const deleteLocation = async (locationId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lokasi polygon ini?')) return;

    try {
      const { error } = await supabase
        .from('attendance_locations')
        .delete()
        .eq('id', locationId);

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
      {/* Token Input */}
      {showTokenInput && (
        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi Mapbox Token</CardTitle>
            <CardDescription>
              Masukkan token Mapbox untuk menggunakan peta. Token akan disimpan untuk penggunaan selanjutnya. Dapatkan token gratis di{' '}
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

      {!showTokenInput && !mapboxToken && (
        <Card>
          <CardHeader>
            <CardTitle>Memuat Konfigurasi...</CardTitle>
            <CardDescription>
              Sedang memuat konfigurasi Mapbox...
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Main Polygon Manager */}
      {mapboxToken && (
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
                      prev ? { ...prev, name: e.target.value } : null
                    )}
                    placeholder="Contoh: Area Sekolah SMKN 1 Kendal"
                  />
                </div>

                <div>
                  <Label>Titik Polygon ({tempPoints.length} titik)</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {tempPoints.map((point, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        Titik {index + 1}: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                      </div>
                    ))}
                  </div>
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
                <div>
                  <Label>Peta Interaktif</Label>
                  {isDrawing && (
                    <Badge variant="destructive" className="ml-2">
                      Mode Gambar Aktif
                    </Badge>
                  )}
                </div>
                <div 
                  ref={mapContainerRef} 
                  className="h-96 w-full border rounded-lg"
                  style={{ minHeight: '384px' }}
                />
              </div>
            </div>

            {/* Existing Locations */}
            <div className="space-y-4">
              <Label>Lokasi Polygon Tersimpan</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((location) => (
                  <Card key={location.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{location.name}</h4>
                      <Badge variant={location.isActive ? "default" : "secondary"}>
                        {location.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {location.coordinates.length} titik polygon
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLocation(location)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteLocation(location.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {locations.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Belum ada lokasi polygon tersimpan
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
