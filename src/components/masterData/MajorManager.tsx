
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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Major } from '@/types/student';

export const MajorManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: majors, isLoading } = useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Major[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('majors')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      resetForm();
      toast({ title: 'Jurusan berhasil ditambahkan' });
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
        .from('majors')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      resetForm();
      toast({ title: 'Jurusan berhasil diupdate' });
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
        .from('majors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      toast({ title: 'Jurusan berhasil dihapus' });
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
      code: '',
      name: '',
      description: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (major: Major) => {
    setFormData({
      code: major.code,
      name: major.name,
      description: major.description || '',
      is_active: major.is_active
    });
    setEditingId(major.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
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
            <Label htmlFor="code">Kode Jurusan</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="TKJ"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Nama Jurusan</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Teknik Komputer dan Jaringan"
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
            placeholder="Deskripsi jurusan..."
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
        {majors?.map((major) => (
          <div key={major.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{major.code}</span>
                <span>{major.name}</span>
                {major.is_active && (
                  <Badge variant="default">Aktif</Badge>
                )}
              </div>
              {major.description && (
                <div className="text-sm text-gray-500">{major.description}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(major)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(major.id)}
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
