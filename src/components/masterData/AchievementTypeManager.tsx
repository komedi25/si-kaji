
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
    name: '',
    description: '',
    point_reward: '',
    category: 'akademik' as 'akademik' | 'non_akademik' | 'prestasi',
    level: 'sekolah' as 'sekolah' | 'kecamatan' | 'kabupaten' | 'provinsi' | 'nasional' | 'internasional',
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
      return data as AchievementType[];
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
      const { error } = await supabase
        .from('achievement_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-types'] });
      toast({ title: 'Jenis prestasi berhasil dihapus' });
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
      point_reward: '',
      category: 'akademik',
      level: 'sekolah',
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (achievementType: AchievementType) => {
    setFormData({
      name: achievementType.name,
      description: achievementType.description || '',
      point_reward: achievementType.point_reward.toString(),
      category: achievementType.category,
      level: achievementType.level,
      is_active: achievementType.is_active
    });
    setEditingId(achievementType.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      description: formData.description || null,
      point_reward: parseInt(formData.point_reward),
      category: formData.category,
      level: formData.level,
      is_active: formData.is_active
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
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
            <Label htmlFor="name">Nama Prestasi</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Juara 1 Olimpiade Matematika"
              required
            />
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
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="akademik">Akademik</SelectItem>
                <SelectItem value="non_akademik">Non Akademik</SelectItem>
                <SelectItem value="prestasi">Prestasi</SelectItem>
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
          <div className="flex items-center space-x-2 mt-6">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Aktif</Label>
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
                onClick={() => deleteMutation.mutate(achievementType.id)}
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
