import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Save, Trash2, Zap } from 'lucide-react';

interface PolygonPoint {
  lat: number;
  lng: number;
}

interface LocationPolygon {
  id?: string;
  name: string;
  location_type: 'polygon';
  polygon_coordinates: PolygonPoint[];
  is_active: boolean;
}

export const PolygonLocationManager: React.FC = () => {
  const [locations, setLocations] = useState<LocationPolygon[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationPolygon | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -6.9175, lng: 107.6191 }); // Default Bandung
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPoints, setTempPoints] = useState<PolygonPoint[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = () => {
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=drawing`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_locations')
        .select('*')
        .eq('location_type', 'polygon')
        .eq('is_active', true);

      if (error) throw error;
      setLocations((data || []).map(loc => ({
        id: loc.id,
        name: loc.name,
        location_type: 'polygon' as const,
        polygon_coordinates: typeof loc.polygon_coordinates === 'string' 
          ? JSON.parse(loc.polygon_coordinates) 
          : Array.isArray(loc.polygon_coordinates) 
            ? loc.polygon_coordinates 
            : [],
        is_active: loc.is_active
      })));
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Gagal memuat lokasi');
    }
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (simplified conversion)
    const lat = mapCenter.lat + (rect.height / 2 - y) * 0.0001;
    const lng = mapCenter.lng + (x - rect.width / 2) * 0.0001;

    setTempPoints(prev => [...prev, { lat, lng }]);
  };

  const completePolygon = () => {
    if (tempPoints.length < 3) {
      toast.error('Polygon harus memiliki minimal 3 titik');
      return;
    }

    if (selectedLocation) {
      setSelectedLocation({
        ...selectedLocation,
        polygon_coordinates: tempPoints
      });
    }

    setIsDrawing(false);
    setTempPoints([]);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setTempPoints([]);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setTempPoints([]);
  };

  const saveLocation = async () => {
    if (!selectedLocation?.name || !selectedLocation?.polygon_coordinates?.length) {
      toast.error('Nama lokasi dan koordinat polygon harus diisi');
      return;
    }

    setLoading(true);
    try {
      const locationData = {
        name: selectedLocation.name,
        location_type: 'polygon',
        polygon_coordinates: JSON.stringify(selectedLocation.polygon_coordinates),
        latitude: selectedLocation.polygon_coordinates[0].lat,
        longitude: selectedLocation.polygon_coordinates[0].lng,
        radius_meters: 0,
        is_active: true
      };

      if (selectedLocation.id) {
        const { error } = await supabase
          .from('attendance_locations')
          .update(locationData)
          .eq('id', selectedLocation.id);

        if (error) throw error;
        toast.success('Lokasi berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('attendance_locations')
          .insert(locationData);

        if (error) throw error;
        toast.success('Lokasi berhasil ditambahkan');
      }

      setSelectedLocation(null);
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Gagal menyimpan lokasi');
    } finally {
      setLoading(false);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendance_locations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Lokasi berhasil dihapus');
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Gagal menghapus lokasi');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Pengaturan Lokasi Polygon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="locationName">Nama Lokasi</Label>
                <Input
                  id="locationName"
                  value={selectedLocation?.name || ''}
                  onChange={(e) => setSelectedLocation(prev => prev ? {...prev, name: e.target.value} : {name: e.target.value, location_type: 'polygon', polygon_coordinates: [], is_active: true})}
                  placeholder="Masukkan nama lokasi"
                />
              </div>

              <div className="space-y-2">
                <Label>Koordinat Polygon</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedLocation?.polygon_coordinates?.length || 0} titik
                </div>
                {selectedLocation?.polygon_coordinates?.map((point, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    Titik {index + 1}: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {!isDrawing ? (
                  <Button onClick={startDrawing} className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Mulai Gambar Polygon
                  </Button>
                ) : (
                  <>
                    <Button onClick={completePolygon} variant="outline">
                      Selesai
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
                  disabled={loading || !selectedLocation?.name}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Simpan Lokasi
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
              <Label>Peta Interaktif</Label>
              <div 
                ref={mapRef}
                className="w-full h-80 bg-muted rounded-lg border relative cursor-pointer overflow-hidden"
                onClick={handleMapClick}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isDrawing ? 'Klik untuk menambah titik polygon' : 'Klik "Mulai Gambar Polygon" untuk memulai'}
                    </p>
                  </div>
                </div>

                {/* Render temporary points */}
                {tempPoints.map((point, index) => (
                  <div
                    key={index}
                    className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${50 + (point.lng - mapCenter.lng) / 0.0001}%`,
                      top: `${50 - (point.lat - mapCenter.lat) / 0.0001}%`
                    }}
                  />
                ))}

                {/* Render polygon lines */}
                {tempPoints.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {tempPoints.map((point, index) => {
                      if (index === tempPoints.length - 1) return null;
                      const nextPoint = tempPoints[index + 1];
                      return (
                        <line
                          key={index}
                          x1={`${50 + (point.lng - mapCenter.lng) / 0.0001}%`}
                          y1={`${50 - (point.lat - mapCenter.lat) / 0.0001}%`}
                          x2={`${50 + (nextPoint.lng - mapCenter.lng) / 0.0001}%`}
                          y2={`${50 - (nextPoint.lat - mapCenter.lat) / 0.0001}%`}
                          stroke="red"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Catatan: Ini adalah peta simulasi. Dalam implementasi penuh, gunakan Google Maps atau Leaflet untuk peta interaktif yang sesungguhnya.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Lokasi Polygon yang Tersimpan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {locations.length === 0 ? (
              <p className="text-muted-foreground">Belum ada lokasi polygon yang tersimpan</p>
            ) : (
              locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {location.polygon_coordinates?.length || 0} titik polygon
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedLocation(location)}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => location.id && deleteLocation(location.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
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
