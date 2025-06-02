
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Clock, MapPin, Users } from 'lucide-react';
import { Extracurricular } from '@/types/masterData';

export const ExtracurricularManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_participants: '30',
    schedule_day: '',
    schedule_time: '',
    location: '',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: extracurriculars, isLoading } = useQuery({
    queryKey: ['extracurriculars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Extracurricular[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('extracurriculars')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extracurriculars'] });
      resetForm();
      toast({ title: 'Ekstrakurikuler berhasil ditambahkan' });
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
        .from('extracurriculars')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extracurriculars'] });
      resetForm();
      toast({ title: 'Ekstrakurikuler berhasil diupdate' });
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
        .from('extracurriculars')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extracurriculars'] });
      toast({ title: 'Ekstrakurikuler berhasil dihapus' });
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
      max_participants: '30',
      schedule_day: '',
      schedule_time: '',
      location: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (extracurricular: Extracurricular) => {
    setFormData({
      name: extracurricular.name,
      description: extracurricular.description || '',
      max_participants: extracurricular.max_participants?.toString() || '30',
      schedule_day: extracurricular.schedule_day || '',
      schedule_time: extracurricular.schedule_time || '',
      location: extracurricular.location || '',
      is_active: extracurricular.is_active
    });
    setEditingId(extracurricular.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      description: formData.description || null,
      max_participants: parseInt(formData.max_participants),
      schedule_day: formData.schedule_day || null,
      schedule_time: formData.schedule_time || null,
      location: formData.location || null,
      is_active: formData.is_active
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nama Ekstrakurikuler</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Pramuka"
              required
            />
          </div>
          <div>
            <Label htmlFor="max_participants">Maksimal Peserta</Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              placeholder="30"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Deskripsi kegiatan ekstrakurikuler..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="schedule_day">Hari Jadwal</Label>
            <Input
              id="schedule_day"
              value={formData.schedule_day}
              onChange={(e) => setFormData({ ...formData, schedule_day: e.target.value })}
              placeholder="Sabtu"
            />
          </div>
          <div>
            <Label htmlFor="schedule_time">Waktu</Label>
            <Input
              id="schedule_time"
              value={formData.schedule_time}
              onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
              placeholder="14:00-16:00"
            />
          </div>
          <div>
            <Label htmlFor="location">Lokasi</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Lapangan Sekolah"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Aktif</Label>
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
        {extracurriculars?.map((extracurricular) => (
          <div key={extracurricular.id} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-lg">{extracurricular.name}</h3>
                  {extracurricular.is_active && (
                    <Badge variant="default">Aktif</Badge>
                  )}
                </div>
                
                {extracurricular.description && (
                  <p className="text-gray-600 text-sm mb-3">{extracurricular.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {extracurricular.max_participants && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Max {extracurricular.max_participants} peserta
                    </div>
                  )}
                  {extracurricular.schedule_day && extracurricular.schedule_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {extracurricular.schedule_day}, {extracurricular.schedule_time}
                    </div>
                  )}
                  {extracurricular.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {extracurricular.location}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(extracurricular)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(extracurricular.id)}
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
