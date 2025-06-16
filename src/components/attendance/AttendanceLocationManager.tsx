
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceLocation } from '@/types/selfAttendance';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';

export const AttendanceLocationManager = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AttendanceLocation | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius_meters: '100'
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data lokasi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const locationData = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius_meters: parseInt(formData.radius_meters)
      };

      if (editingLocation) {
        const { error } = await supabase
          .from('attendance_locations')
          .update(locationData)
          .eq('id', editingLocation.id);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Lokasi berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('attendance_locations')
          .insert(locationData);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Lokasi berhasil ditambahkan"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan lokasi",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (location: AttendanceLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius_meters: location.radius_meters.toString()
    });
    setIsDialogOpen(true);
  };

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
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus lokasi",
        variant: "destructive"
      });
    }
  };

  const toggleStatus = async (location: AttendanceLocation) => {
    try {
      const { error } = await supabase
        .from('attendance_locations')
        .update({ is_active: !location.is_active })
        .eq('id', location.id);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: `Lokasi ${location.is_active ? 'dinonaktifkan' : 'diaktifkan'}`
      });
      
      fetchLocations();
    } catch (error) {
      console.error('Error updating location status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status lokasi",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      radius_meters: '100'
    });
    setEditingLocation(null);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          toast({
            title: "Error",
            description: "Gagal mendapatkan lokasi saat ini",
            variant: "destructive"
          });
        }
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Manajemen Lokasi Presensi
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Lokasi
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="-6.9225"
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
                      placeholder="110.1983"
                      required
                    />
                  </div>
                </div>
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
                </div>
                <Button type="button" variant="outline" onClick={getCurrentLocation} className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  Gunakan Lokasi Saat Ini
                </Button>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingLocation ? 'Perbarui' : 'Tambah'} Lokasi
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lokasi</TableHead>
              <TableHead>Koordinat</TableHead>
              <TableHead>Radius</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell className="text-sm">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </TableCell>
                <TableCell>{location.radius_meters}m</TableCell>
                <TableCell>
                  <Badge 
                    variant={location.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleStatus(location)}
                  >
                    {location.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(location)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
