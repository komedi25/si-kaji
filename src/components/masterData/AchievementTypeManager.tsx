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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AchievementType } from '@/types/masterData';

export const AchievementTypeManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    competition_name: '',
    rank: '',
    description: '',
    point_reward: '',
    category: 'akademik' as 'akademik' | 'non_akademik' | 'prestasi',
    level: 'sekolah' as 'sekolah' | 'kecamatan' | 'kabupaten' | 'provinsi' | 'nasional' | 'internasional',
    is_tiered: false,
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: achievementTypes, isLoading } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_types')
        .select('*')
        .order('level')
        .order('point_reward', { ascending: false });
      
      if (error) throw error;
      return data as (AchievementType & { is_tiered: boolean })[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('achievement_types')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-types'] });
      resetForm();
      toast({ title: 'Jenis prestasi berhasil ditambahkan' });
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
        .from('achievement_types')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-types'] });
      resetForm();
      toast({ title: 'Jenis prestasi berhasil diupdate' });
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
      console.log('Attempting to delete achievement type:', id);
      
      // Check if achievement type is used in student_achievements
      const { data: achievements, error: checkError } = await supabase
        .from('student_achievements')
        .select('id')
        .eq('achievement_type_id', id)
        .limit(1);
      
      console.log('Check achievements result:', { achievements, checkError });
      
      if (checkError) {
        console.error('Error checking achievements:', checkError);
        throw checkError;
      }
      
      if (achievements && achievements.length > 0) {
        throw new Error('Jenis prestasi tidak dapat dihapus karena sudah digunakan dalam data prestasi siswa');
      }

      // Try to delete the achievement type
      const { data, error } = await supabase
        .from('achievement_types')
        .delete()
        .eq('id', id)
        .select();
      
      console.log('Delete result:', { data, error });
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Tidak ada data yang dihapus. Mungkin data sudah tidak ada atau Anda tidak memiliki izin untuk menghapus.');
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Delete successful:', data);
      queryClient.invalidateQueries({ queryKey: ['achievement-types'] });
      toast({ title: 'Jenis prestasi berhasil dihapus' });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      competition_name: '',
      rank: '',
      description: '',
      point_reward: '',
      category: 'akademik',
      level: 'sekolah',
      is_tiered: false,
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (achievementType: AchievementType & { is_tiered: boolean }) => {
    // Parse existing name to extract components
    const nameParts = achievementType.name.split(' - ');
    const competitionName = nameParts[0] || '';
    const rank = nameParts[1] || '';
    
    setFormData({
      competition_name: competitionName,
      rank: rank,
      description: achievementType.description || '',
      point_reward: achievementType.point_reward.toString(),
      category: achievementType.category,
      level: achievementType.level,
      is_tiered: achievementType.is_tiered || false,
      is_active: achievementType.is_active
    });
    setEditingId(achievementType.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create full name from competition name and rank
    const fullName = formData.competition_name + (formData.rank ? ` - ${formData.rank}` : '');
    
    const data = {
      name: fullName,
      description: formData.description || null,
      point_reward: parseInt(formData.point_reward),
      category: formData.category,
      level: formData.level,
      is_tiered: formData.is_tiered,
      is_active: formData.is_active
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    console.log('Delete button clicked for achievement type ID:', id);
    if (window.confirm('Apakah Anda yakin ingin menghapus jenis prestasi ini?')) {
      console.log('User confirmed achievement type deletion');
      deleteMutation.mutate(id);
    } else {
      console.log('User cancelled achievement type deletion');
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'akademik': 'default',
      'non_akademik': 'secondary',
      'prestasi': 'outline'
    };
    return <Badge variant={variants[category as keyof typeof variants] as any}>{category.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      'sekolah': 'bg-gray-100 text-gray-800',
      'kecamatan': 'bg-blue-100 text-blue-800',
      'kabupaten': 'bg-green-100 text-green-800',
      'provinsi': 'bg-yellow-100 text-yellow-800',
      'nasional': 'bg-orange-100 text-orange-800',
      'internasional': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[level as keyof typeof colors]}>{level.toUpperCase()}</Badge>;
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="competition_name">Nama Kegiatan/Lomba</Label>
            <Input
              id="competition_name"
              value={formData.competition_name}
              onChange={(e) => setFormData({ ...formData, competition_name: e.target.value })}
              placeholder="Olimpiade Matematika"
              required
            />
          </div>
          <div>
            <Label htmlFor="rank">Juara/Peringkat</Label>
            <Select
              value={formData.rank}
              onValueChange={(value) => setFormData({ ...formData, rank: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih juara/peringkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Juara 1">Juara 1</SelectItem>
                <SelectItem value="Juara 2">Juara 2</SelectItem>
                <SelectItem value="Juara 3">Juara 3</SelectItem>
                <SelectItem value="Juara Harapan 1">Juara Harapan 1</SelectItem>
                <SelectItem value="Juara Harapan 2">Juara Harapan 2</SelectItem>
                <SelectItem value="Finalis">Finalis</SelectItem>
                <SelectItem value="Peserta Terbaik">Peserta Terbaik</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="point_reward">Poin Reward</Label>
          <Input
            id="point_reward"
            type="number"
            value={formData.point_reward}
            onChange={(e) => setFormData({ ...formData, point_reward: e.target.value })}
            placeholder="100"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Deskripsi prestasi..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="category">Bidang</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih bidang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="akademik">Akademik</SelectItem>
                <SelectItem value="non_akademik">Non Akademik</SelectItem>
                <SelectItem value="prestasi">Prestasi Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="level">Level</Label>
            <Select
              value={formData.level}
              onValueChange={(value) => setFormData({ ...formData, level: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sekolah">Sekolah</SelectItem>
                <SelectItem value="kecamatan">Kecamatan</SelectItem>
                <SelectItem value="kabupaten">Kabupaten</SelectItem>
                <SelectItem value="provinsi">Provinsi</SelectItem>
                <SelectItem value="nasional">Nasional</SelectItem>
                <SelectItem value="internasional">Internasional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_tiered"
                checked={formData.is_tiered}
                onCheckedChange={(checked) => setFormData({ ...formData, is_tiered: checked })}
              />
              <Label htmlFor="is_tiered">Berjenjang</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
          </div>
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

      <div className="space-y-2">
        {achievementTypes?.map((achievementType) => (
          <div key={achievementType.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{achievementType.name}</span>
                {getCategoryBadge(achievementType.category)}
                {getLevelBadge(achievementType.level)}
                <Badge variant="outline">+{achievementType.point_reward} poin</Badge>
                {achievementType.is_tiered && (
                  <Badge variant="secondary">Berjenjang</Badge>
                )}
                {achievementType.is_active && (
                  <Badge variant="default">Aktif</Badge>
                )}
              </div>
              {achievementType.description && (
                <div className="text-sm text-gray-500 mt-1">{achievementType.description}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(achievementType)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(achievementType.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
