
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
import { ViolationType } from '@/types/masterData';

export const ViolationTypeManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    point_deduction: '',
    category: 'ringan' as 'ringan' | 'sedang' | 'berat',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: violationTypes, isLoading } = useQuery({
    queryKey: ['violation-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('violation_types')
        .select('*')
        .order('category')
        .order('point_deduction', { ascending: false });
      
      if (error) throw error;
      return data as ViolationType[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('violation_types')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violation-types'] });
      resetForm();
      toast({ title: 'Jenis pelanggaran berhasil ditambahkan' });
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
        .from('violation_types')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violation-types'] });
      resetForm();
      toast({ title: 'Jenis pelanggaran berhasil diupdate' });
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
      // Check if violation type is used in student_violations
      const { data: violations, error: checkError } = await supabase
        .from('student_violations')
        .select('id')
        .eq('violation_type_id', id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (violations && violations.length > 0) {
        throw new Error('Jenis pelanggaran tidak dapat dihapus karena sudah digunakan dalam data pelanggaran siswa');
      }

      const { error } = await supabase
        .from('violation_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violation-types'] });
      toast({ title: 'Jenis pelanggaran berhasil dihapus' });
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
      point_deduction: '',
      category: 'ringan',
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (violationType: ViolationType) => {
    setFormData({
      name: violationType.name,
      description: violationType.description || '',
      point_deduction: violationType.point_deduction.toString(),
      category: violationType.category,
      is_active: violationType.is_active
    });
    setEditingId(violationType.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      description: formData.description || null,
      point_deduction: parseInt(formData.point_deduction),
      category: formData.category,
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
      'ringan': 'secondary',
      'sedang': 'default',
      'berat': 'destructive'
    };
    return <Badge variant={variants[category as keyof typeof variants] as any}>{category.toUpperCase()}</Badge>;
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nama Pelanggaran</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Terlambat ke sekolah"
              required
            />
          </div>
          <div>
            <Label htmlFor="point_deduction">Poin Pengurangan</Label>
            <Input
              id="point_deduction"
              type="number"
              value={formData.point_deduction}
              onChange={(e) => setFormData({ ...formData, point_deduction: e.target.value })}
              placeholder="5"
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
            placeholder="Deskripsi pelanggaran..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                <SelectItem value="ringan">Ringan</SelectItem>
                <SelectItem value="sedang">Sedang</SelectItem>
                <SelectItem value="berat">Berat</SelectItem>
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
        {violationTypes?.map((violationType) => (
          <div key={violationType.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{violationType.name}</span>
                {getCategoryBadge(violationType.category)}
                <Badge variant="outline">-{violationType.point_deduction} poin</Badge>
                {violationType.is_active && (
                  <Badge variant="default">Aktif</Badge>
                )}
              </div>
              {violationType.description && (
                <div className="text-sm text-gray-500 mt-1">{violationType.description}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(violationType)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(violationType.id)}
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
