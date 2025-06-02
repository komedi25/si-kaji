
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Major, Class } from '@/types/student';

interface StudentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedMajor: string;
  setSelectedMajor: (value: string) => void;
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedGrade: string;
  setSelectedGrade: (value: string) => void;
  majors: Major[];
  classes: Class[];
}

export function StudentFilters({
  searchTerm,
  setSearchTerm,
  selectedMajor,
  setSelectedMajor,
  selectedClass,
  setSelectedClass,
  selectedStatus,
  setSelectedStatus,
  selectedGrade,
  setSelectedGrade,
  majors,
  classes
}: StudentFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari nama, NIS, atau NISN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kelas</SelectItem>
              <SelectItem value="10">Kelas 10</SelectItem>
              <SelectItem value="11">Kelas 11</SelectItem>
              <SelectItem value="12">Kelas 12</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMajor} onValueChange={setSelectedMajor}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Jurusan</SelectItem>
              {majors.map((major) => (
                <SelectItem key={major.id} value={major.id}>
                  {major.code} - {major.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kelas</SelectItem>
              {classes.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="graduated">Lulus</SelectItem>
              <SelectItem value="transferred">Pindah</SelectItem>
              <SelectItem value="dropped">Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
