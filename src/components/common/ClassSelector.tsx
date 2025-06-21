
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Class {
  id: string;
  name: string;
  grade: number;
  major_id: string;
  majors?: {
    name: string;
    code: string;
  };
}

interface ClassSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowAll?: boolean;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Pilih kelas",
  disabled = false,
  allowAll = false
}) => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          grade,
          major_id,
          majors (
            name,
            code
          )
        `)
        .eq('is_active', true)
        .order('grade', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getClassDisplay = (cls: Class) => {
    const majorName = cls.majors?.name || cls.majors?.code || '';
    return `${cls.grade} ${cls.name}${majorName ? ` - ${majorName}` : ''}`;
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Memuat kelas..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll && (
          <SelectItem value="all">Semua Kelas</SelectItem>
        )}
        {classes.map((cls) => (
          <SelectItem key={cls.id} value={cls.id}>
            {getClassDisplay(cls)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
