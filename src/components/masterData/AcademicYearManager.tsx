
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AcademicYear } from '@/types/student';

export const AcademicYearManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    year_start: '',
    year_end: '',
    is_active: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: academicYears, isLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_start', { ascending: false });
      
      if (error) throw error;
      return data as AcademicYear[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('academic_years')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      resetForm();
      toast({ title: 'Tahun ajaran berhasil ditambahkan' });
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
        .from('academic_years')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      resetForm();
      toast({ title: 'Tahun ajaran berhasil diupdate' });
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
        .from('academic_years')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast({ title: 'Tahun ajaran berhasil dihapus' });
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
      year_start: '',
      year_end: '',
      is_active: false
    });
    setEditingId(null);
  };

  const handleEdit = (academicYear: AcademicYear) => {
    setFormData({
      name: academicYear.name,
      year_start: academicYear.year_start.toString(),
      year_end: academicYear.year_end.toString(),
      is_active: academicYear.is_active
    });
    setEditingId(academicYear.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      year_start: parseInt(formData.year_start),
      year_end: parseInt(formData.year_end),
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
            <Label htmlFor="name">Nama Tahun Ajaran</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="2024/2025"
              required
            />
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="year_start">Tahun Mulai</Label>
            <Input
              id="year_start"
              type="number"
              value={formData.year_start}
              onChange={(e) => setFormData({ ...formData, year_start: e.target.value })}
              placeholder="2024"
              required
            />
          </div>
          <div>
            <Label htmlFor="year_end">Tahun Selesai</Label>
            <Input
              id="year_end"
              type="number"
              value={formData.year_end}
              onChange={(e) => setFormData({ ...formData, year_end: e.target.value })}
              placeholder="2025"
              required
            />
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
        {academicYears?.map((academicYear) => (
          <div key={academicYear.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{academicYear.name}</span>
                {academicYear.is_active && (
                  <Badge variant="default">Aktif</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {academicYear.year_start} - {academicYear.year_end}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(academicYear)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(academicYear.id)}
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
