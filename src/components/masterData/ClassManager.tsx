
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Class, Major, AcademicYear } from '@/types/student';

export const ClassManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    major_id: '',
    academic_year_id: '',
    max_students: '36',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: majors } = useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Major[];
    }
  });

  const { data: academicYears } = useQuery({
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

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          major:majors(*),
          academic_year:academic_years(*)
        `)
        .order('grade')
        .order('name');
      
      if (error) throw error;
      return data as Class[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('classes')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      resetForm();
      toast({ title: 'Kelas berhasil ditambahkan' });
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
        .from('classes')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      resetForm();
      toast({ title: 'Kelas berhasil diupdate' });
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
        .from('classes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({ title: 'Kelas berhasil dihapus' });
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
      grade: '',
      major_id: '',
      academic_year_id: '',
      max_students: '36',
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (classData: Class) => {
    setFormData({
      name: classData.name,
      grade: classData.grade.toString(),
      major_id: classData.major_id || '',
      academic_year_id: classData.academic_year_id || '',
      max_students: classData.max_students?.toString() || '36',
      is_active: classData.is_active
    });
    setEditingId(classData.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      grade: parseInt(formData.grade),
      major_id: formData.major_id || null,
      academic_year_id: formData.academic_year_id || null,
      max_students: parseInt(formData.max_students),
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
            <Label htmlFor="name">Nama Kelas</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="XII TKJ 1"
              required
            />
          </div>
          <div>
            <Label htmlFor="grade">Tingkat</Label>
            <Select
              value={formData.grade}
              onValueChange={(value) => setFormData({ ...formData, grade: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">X (10)</SelectItem>
                <SelectItem value="11">XI (11)</SelectItem>
                <SelectItem value="12">XII (12)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="major_id">Jurusan</Label>
            <Select
              value={formData.major_id}
              onValueChange={(value) => setFormData({ ...formData, major_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jurusan" />
              </SelectTrigger>
              <SelectContent>
                {majors?.map((major) => (
                  <SelectItem key={major.id} value={major.id}>
                    {major.code} - {major.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="academic_year_id">Tahun Ajaran</Label>
            <Select
              value={formData.academic_year_id}
              onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tahun ajaran" />
              </SelectTrigger>
              <SelectContent>
                {academicYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="max_students">Maksimal Siswa</Label>
            <Input
              id="max_students"
              type="number"
              value={formData.max_students}
              onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
              placeholder="36"
            />
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
        {classes?.map((classData) => (
          <div key={classData.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{classData.name}</span>
                <Badge variant="outline">Tingkat {classData.grade}</Badge>
                {classData.is_active && (
                  <Badge variant="default">Aktif</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {classData.major?.name} • {classData.academic_year?.name} • Max: {classData.max_students} siswa
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(classData)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(classData.id)}
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
