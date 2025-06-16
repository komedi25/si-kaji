
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Users, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ActivitySchedule {
  id: string;
  name: string;
  description?: string;
  activity_type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  max_participants?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ActivityAttendanceManager = () => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivitySchedule[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivitySchedule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activity_type: 'ekstrakurikuler',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: 30,
    is_active: true
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      // Gunakan tabel yang sudah ada yaitu activity_proposals untuk sementara
      const { data, error } = await supabase
        .from('activity_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data dari activity_proposals ke format ActivitySchedule
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        name: item.title,
        description: item.description,
        activity_type: item.activity_type || 'ekstrakurikuler',
        start_date: item.start_date,
        end_date: item.end_date,
        start_time: item.start_time || '08:00',
        end_time: item.end_time || '10:00',
        location: item.location,
        max_participants: item.estimated_participants,
        is_active: item.status === 'approved',
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setActivities(transformedData);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kegiatan",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingActivity) {
        // Update existing activity
        const updateData = {
          title: formData.name,
          description: formData.description,
          activity_type: formData.activity_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location,
          estimated_participants: formData.max_participants
        };

        const { error } = await supabase
          .from('activity_proposals')
          .update(updateData)
          .eq('id', editingActivity.id);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Kegiatan berhasil diperbarui"
        });
      } else {
        // Create new activity
        const insertData = {
          title: formData.name,
          description: formData.description,
          activity_type: formData.activity_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location,
          estimated_participants: formData.max_participants,
          status: 'approved'
        };

        const { error } = await supabase
          .from('activity_proposals')
          .insert([insertData]);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Kegiatan berhasil ditambahkan"
        });
      }

      setIsDialogOpen(false);
      setEditingActivity(null);
      resetForm();
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan kegiatan",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (activity: ActivitySchedule) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      description: activity.description || '',
      activity_type: activity.activity_type,
      start_date: activity.start_date,
      end_date: activity.end_date,
      start_time: activity.start_time,
      end_time: activity.end_time,
      location: activity.location || '',
      max_participants: activity.max_participants || 30,
      is_active: activity.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;

    try {
      const { error } = await supabase
        .from('activity_proposals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Kegiatan berhasil dihapus"
      });
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus kegiatan",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      activity_type: 'ekstrakurikuler',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      location: '',
      max_participants: 30,
      is_active: true
    });
  };

  const activityTypes = [
    { value: 'ekstrakurikuler', label: 'Ekstrakurikuler' },
    { value: 'osis', label: 'OSIS' },
    { value: 'upacara', label: 'Upacara' },
    { value: 'lomba', label: 'Lomba' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Manajemen Kegiatan Presensi
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingActivity(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Kegiatan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingActivity ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Kegiatan</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="activity_type">Jenis Kegiatan</Label>
                    <Select value={formData.activity_type} onValueChange={(value) => setFormData({ ...formData, activity_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Tanggal Mulai</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Tanggal Selesai</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Jam Mulai</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Jam Selesai</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Lokasi</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_participants">Maksimal Peserta</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      min="1"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {editingActivity ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{activity.name}</h3>
                      <Badge variant={activity.is_active ? "default" : "secondary"}>
                        {activity.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <Badge variant="outline">
                        {activityTypes.find(t => t.value === activity.activity_type)?.label}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {activity.start_date} - {activity.end_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.start_time?.slice(0, 5)} - {activity.end_time?.slice(0, 5)}
                      </span>
                      {activity.max_participants && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Max {activity.max_participants} peserta
                        </span>
                      )}
                    </div>
                    {activity.location && (
                      <p className="text-sm text-muted-foreground">📍 {activity.location}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(activity)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(activity.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada kegiatan yang terdaftar
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
