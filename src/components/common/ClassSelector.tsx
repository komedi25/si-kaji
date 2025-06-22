
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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
      setLoading(true);
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
    return `Kelas ${cls.grade} ${cls.name}${majorName ? ` - ${majorName}` : ''}`;
  };

  const groupClassesByGrade = () => {
    const grouped = classes.reduce((acc, cls) => {
      const grade = cls.grade;
      if (!acc[grade]) {
        acc[grade] = [];
      }
      acc[grade].push(cls);
      return acc;
    }, {} as Record<number, Class[]>);

    return Object.keys(grouped)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(grade => ({
        grade: parseInt(grade),
        classes: grouped[parseInt(grade)]
      }));
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Memuat kelas...
            </div>
          </SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  const groupedClasses = groupClassesByGrade();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll && (
          <>
            <SelectItem value="all">
              <div className="flex items-center">
                <span className="font-medium">Semua Kelas</span>
              </div>
            </SelectItem>
            <div className="border-t my-1" />
          </>
        )}
        
        {groupedClasses.length === 0 ? (
          <SelectItem value="" disabled>
            Tidak ada kelas tersedia
          </SelectItem>
        ) : (
          groupedClasses.map(({ grade, classes: gradeClasses }) => (
            <div key={grade}>
              <div className="px-2 py-1.5 text-sm font-medium text-gray-500 bg-gray-50">
                Kelas {grade}
              </div>
              {gradeClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  <div className="flex items-center space-x-2">
                    <span>{cls.name}</span>
                    {cls.majors && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {cls.majors.name || cls.majors.code}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          ))
        )}
      </SelectContent>
    </Select>
  );
};
