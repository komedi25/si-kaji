
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, Users, Wrench } from 'lucide-react';
import { SchoolFacility } from '@/types/masterData';

export const SchoolFacilityManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    capacity: '',
    condition: 'baik' as 'baik' | 'rusak_ringan' | 'rusak_berat',
    maintenance_schedule: '',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: facilities, isLoading } = useQuery({
    queryKey: ['school-facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_facilities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as SchoolFacility[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('school_facilities')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-facilities'] });
      resetForm();
      toast({ title: 'Fasilitas berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('school_facilities')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-facilities'] });
      resetForm();
      toast({ title: 'Fasilitas berhasil diupdate' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('school_facilities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-facilities'] });
      toast({ title: 'Fasilitas berhasil dihapus' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      capacity: '',
      condition: 'baik',
      maintenance_schedule: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (facility: SchoolFacility) => {
    setFormData({
      name: facility.name,
      description: facility.description || '',
      location: facility.location || '',
      capacity: facility.capacity?.toString() || '',
      condition: facility.condition,
      maintenance_schedule: facility.maintenance_schedule || '',
      is_active: facility.is_active
    });
    setEditingId(facility.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      description: formData.description || null,
      location: formData.location || null,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      condition: formData.condition,
      maintenance_schedule: formData.maintenance_schedule || null,
      is_active: formData.is_active
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getConditionBadge = (condition: string) => {
    const variants = {
      'baik': 'default',
      'rusak_ringan': 'secondary',
      'rusak_berat': 'destructive'
    };
    const labels = {
      'baik': 'BAIK',
      'rusak_ringan': 'RUSAK RINGAN',
      'rusak_berat': 'RUSAK BERAT'
    };
    return <Badge variant={variants[condition as keyof typeof variants] as any}>{labels[condition as keyof typeof labels]}</Badge>;
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nama Fasilitas</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Laboratorium Komputer"
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Lokasi</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Gedung A Lantai 2"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Deskripsi fasilitas..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="capacity">Kapasitas</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="30"
            />
          </div>
          <div>
            <Label htmlFor="condition">Kondisi</Label>
            <Select
              value={formData.condition}
              onValueChange={(value) => setFormData({ ...formData, condition: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kondisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baik">Baik</SelectItem>
                <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 mt-6">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Aktif</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="maintenance_schedule">Jadwal Maintenance</Label>
          <Input
            id="maintenance_schedule"
            value={formData.maintenance_schedule}
            onChange={(e) => setFormData({ ...formData, maintenance_schedule: e.target.value })}
            placeholder="Setiap bulan pertama"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {editingId ? 'Update' : 'Tambah'}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Batal
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {facilities?.map((facility) => (
          <div key={facility.id} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-lg">{facility.name}</h3>
                  {getConditionBadge(facility.condition)}
                  {facility.is_active && (
                    <Badge variant="default">Aktif</Badge>
                  )}
                </div>
                
                {facility.description && (
                  <p className="text-gray-600 text-sm mb-3">{facility.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {facility.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {facility.location}
                    </div>
                  )}
                  {facility.capacity && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Kapasitas {facility.capacity}
                    </div>
                  )}
                  {facility.maintenance_schedule && (
                    <div className="flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      {facility.maintenance_schedule}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(facility)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(facility.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
