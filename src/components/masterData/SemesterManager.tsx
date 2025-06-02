
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
import { Semester } from '@/types/masterData';
import { AcademicYear } from '@/types/student';

export const SemesterManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    academic_year_id: '',
    semester_number: '',
    start_date: '',
    end_date: '',
    is_active: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: semesters, isLoading } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('semesters')
        .select(`
          *,
          academic_year:academic_years(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Semester[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('semesters')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      resetForm();
      toast({ title: 'Semester berhasil ditambahkan' });
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
        .from('semesters')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      resetForm();
      toast({ title: 'Semester berhasil diupdate' });
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
        .from('semesters')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      toast({ title: 'Semester berhasil dihapus' });
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
      academic_year_id: '',
      semester_number: '',
      start_date: '',
      end_date: '',
      is_active: false
    });
    setEditingId(null);
  };

  const handleEdit = (semester: Semester) => {
    setFormData({
      name: semester.name,
      academic_year_id: semester.academic_year_id || '',
      semester_number: semester.semester_number.toString(),
      start_date: semester.start_date,
      end_date: semester.end_date,
      is_active: semester.is_active
    });
    setEditingId(semester.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      academic_year_id: formData.academic_year_id || null,
      semester_number: parseInt(formData.semester_number),
      start_date: formData.start_date,
      end_date: formData.end_date,
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
            <Label htmlFor="name">Nama Semester</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Semester 1"
              required
            />
          </div>
          <div>
            <Label htmlFor="semester_number">Nomor Semester</Label>
            <Select
              value={formData.semester_number}
              onValueChange={(value) => setFormData({ ...formData, semester_number: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih nomor semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        {semesters?.map((semester) => (
          <div key={semester.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{semester.name}</span>
                {semester.is_active && (
                  <Badge variant="default">Aktif</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {semester.academic_year?.name} • {semester.start_date} - {semester.end_date}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(semester)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(semester.id)}
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
