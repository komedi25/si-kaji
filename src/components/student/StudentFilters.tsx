
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface StudentFiltersProps {
  filters: {
    search: string;
    class: string;
    status: string;
  };
  onFiltersChange: (filters: { search: string; class: string; status: string }) => void;
}

export function StudentFilters({
  filters,
  onFiltersChange
}: StudentFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleClassChange = (value: string) => {
    onFiltersChange({ ...filters, class: value });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari nama, NIS, atau NISN..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filters.class} onValueChange={handleClassChange}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              <SelectItem value="10">Kelas 10</SelectItem>
              <SelectItem value="11">Kelas 11</SelectItem>
              <SelectItem value="12">Kelas 12</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="graduated">Lulus</SelectItem>
              <SelectItem value="transferred">Pindah</SelectItem>
              <SelectItem value="dropped_out">Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
