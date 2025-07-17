import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Edit, Trash2, Circle, Pentagon, Map } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AttendanceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  location_type: 'radius' | 'polygon';
  polygon_coordinates?: Array<{lat: number, lng: number}>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const EnhancedLocationManager = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AttendanceLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius_meters: '100',
    location_type: 'radius' as 'radius' | 'polygon',
    polygon_coordinates: [] as Array<{lat: number, lng: number}>
  });

  // Fetch locations
  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('attendance_locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data lokasi",
        variant: "destructive"
      });
      return;
    }

    setLocations((data || []).map(location => ({
      ...location,
      location_type: (location.location_type as 'radius' | 'polygon') || 'radius',
      polygon_coordinates: location.polygon_coordinates ? 
        JSON.parse(location.polygon_coordinates as string) : undefined
    })));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      radius_meters: '100',
      location_type: 'radius',
      polygon_coordinates: []
    });
    setEditingLocation(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius_meters: parseInt(formData.radius_meters),
        location_type: formData.location_type,
        polygon_coordinates: formData.location_type === 'polygon' ? 
          JSON.stringify(formData.polygon_coordinates) : null
      };

      if (editingLocation) {
        const { error } = await supabase
          .from('attendance_locations')
          .update(data)
          .eq('id', editingLocation.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Lokasi berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('attendance_locations')
          .insert(data);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Lokasi berhasil ditambahkan"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (location: AttendanceLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius_meters: location.radius_meters.toString(),
      location_type: location.location_type || 'radius',
      polygon_coordinates: location.polygon_coordinates || []
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lokasi ini?')) return;

    try {
      const { error } = await supabase
        .from('attendance_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Lokasi berhasil dihapus"
      });

      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Toggle active status
  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('attendance_locations')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Lokasi berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`
      });

      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation tidak didukung browser ini",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        toast({
          title: "Berhasil",
          description: "Lokasi saat ini berhasil didapatkan"
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: "Gagal mendapatkan lokasi: " + error.message,
          variant: "destructive"
        });
      }
    );
  };

  // Add polygon point
  const addPolygonPoint = () => {
    if (formData.latitude && formData.longitude) {
      const newPoint = {
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude)
      };
      setFormData(prev => ({
        ...prev,
        polygon_coordinates: [...prev.polygon_coordinates, newPoint]
      }));
    }
  };

  // Remove polygon point
  const removePolygonPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      polygon_coordinates: prev.polygon_coordinates.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Manajemen Lokasi Presensi
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Lokasi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Lokasi</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: SMKN 1 Kendal"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location_type">Tipe Lokasi</Label>
                  <Select 
                    value={formData.location_type} 
                    onValueChange={(value: 'radius' | 'polygon') => 
                      setFormData(prev => ({ ...prev, location_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe lokasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="radius">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4" />
                          Radius (Lingkaran)
                        </div>
                      </SelectItem>
                      <SelectItem value="polygon">
                        <div className="flex items-center gap-2">
                          <Pentagon className="h-4 w-4" />
                          Polygon (Area Bentuk Bebas)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="coordinates" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="coordinates">Koordinat</TabsTrigger>
                    <TabsTrigger value="settings">Pengaturan</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="coordinates" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                          placeholder="-6.9174639"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                          placeholder="110.2024914"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      className="w-full"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Gunakan Lokasi Saat Ini
                    </Button>

                    {formData.location_type === 'polygon' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Titik Polygon ({formData.polygon_coordinates.length} titik)</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPolygonPoint}
                            disabled={!formData.latitude || !formData.longitude}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Titik
                          </Button>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {formData.polygon_coordinates.map((point, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">
                                Titik {index + 1}: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePolygonPoint(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {formData.polygon_coordinates.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                              Belum ada titik polygon. Masukkan koordinat dan klik "Tambah Titik"
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    {formData.location_type === 'radius' && (
                      <div>
                        <Label htmlFor="radius">Radius (meter)</Label>
                        <Input
                          id="radius"
                          type="number"
                          value={formData.radius_meters}
                          onChange={(e) => setFormData(prev => ({ ...prev, radius_meters: e.target.value }))}
                          placeholder="100"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Radius dalam meter untuk validasi lokasi presensi
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Tips Pengaturan Lokasi:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• <strong>Radius:</strong> Cocok untuk area circular seperti sekolah dengan halaman bulat</li>
                        <li>• <strong>Polygon:</strong> Cocok untuk area kompleks seperti gedung bertingkat atau area tidak beraturan</li>
                        <li>• Untuk polygon, minimal 3 titik diperlukan untuk membentuk area yang valid</li>
                        <li>• Gunakan radius 50-200 meter untuk area sekolah standar</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lokasi</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Koordinat</TableHead>
              <TableHead>Detail Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {location.location_type === 'radius' ? (
                      <>
                        <Circle className="h-4 w-4" />
                        <span>Radius</span>
                      </>
                    ) : (
                      <>
                        <Pentagon className="h-4 w-4" />
                        <span>Polygon</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Lat: {location.latitude.toFixed(6)}</div>
                    <div>Lng: {location.longitude.toFixed(6)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {location.location_type === 'radius' ? (
                    <span>{location.radius_meters}m radius</span>
                  ) : (
                    <span>{location.polygon_coordinates?.length || 0} titik polygon</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={location.is_active}
                      onCheckedChange={(checked) => toggleActive(location.id, checked)}
                    />
                    <Badge variant={location.is_active ? "default" : "secondary"}>
                      {location.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {locations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Belum ada lokasi presensi. Tambahkan lokasi pertama Anda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};