
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, QrCode, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Student {
  id: string;
  nis: string;
  full_name: string;
  status: string;
}

interface StudentSearchWithQRProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const StudentSearchWithQR: React.FC<StudentSearchWithQRProps> = ({
  value,
  onValueChange,
  placeholder = "Cari siswa...",
  disabled = false
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchStudents(searchQuery);
    } else {
      setStudents([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (value && !selectedStudent) {
      findStudentById(value);
    }
  }, [value]);

  const searchStudents = async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, nis, full_name, status')
        .or(`nis.ilike.%${query}%, full_name.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(10);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        title: "Error",
        description: "Gagal mencari data siswa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const findStudentById = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, nis, full_name, status')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedStudent(data);
      }
    } catch (error) {
      console.error('Error finding student:', error);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    onValueChange(student.id);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    setSelectedStudent(null);
    onValueChange('');
    setSearchQuery('');
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
            disabled={disabled}
          >
            {selectedStudent ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{selectedStudent.nis} - {selectedStudent.full_name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder="Ketik NIS atau nama siswa..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Mencari...
                </div>
              ) : students.length === 0 && searchQuery.length > 2 ? (
                <CommandEmpty>Siswa tidak ditemukan</CommandEmpty>
              ) : (
                <CommandGroup>
                  {students.map((student) => (
                    <CommandItem
                      key={student.id}
                      value={student.id}
                      onSelect={() => handleSelectStudent(student)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-muted-foreground">NIS: {student.nis}</div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedStudent && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleClear}
          disabled={disabled}
        >
          ✕
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          toast({
            title: "QR Scanner",
            description: "Fitur QR scanner akan segera tersedia",
          });
        }}
        disabled={disabled}
      >
        <QrCode className="h-4 w-4" />
      </Button>
    </div>
  );
};
