
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

interface FilterOptions {
  status: string;
  priority: string;
  type: string;
  assignedRole: string;
  search: string;
}

interface AIRecommendationFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export function AIRecommendationFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: AIRecommendationFiltersProps) {
  const updateFilter = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'all');
  const activeFilterCount = Object.values(filters).filter(value => value !== '' && value !== 'all').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari rekomendasi..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="in_progress">Dalam Proses</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="dismissed">Diabaikan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Prioritas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="urgent">Mendesak</SelectItem>
            <SelectItem value="high">Tinggi</SelectItem>
            <SelectItem value="medium">Sedang</SelectItem>
            <SelectItem value="low">Rendah</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="behavioral_intervention">Intervensi Perilaku</SelectItem>
            <SelectItem value="achievement_opportunity">Peluang Prestasi</SelectItem>
            <SelectItem value="academic_support">Dukungan Akademik</SelectItem>
            <SelectItem value="discipline_recommendation">Rekomendasi Disiplin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.assignedRole} onValueChange={(value) => updateFilter('assignedRole', value)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Ditugaskan ke" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
            <SelectItem value="guru_bk">Guru BK</SelectItem>
            <SelectItem value="tppk">TPPK</SelectItem>
            <SelectItem value="arps">ARPS</SelectItem>
            <SelectItem value="p4gn">P4GN</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter aktif:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Pencarian: "{filters.search}"
              <button
                onClick={() => updateFilter('search', '')}
                className="ml-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.status !== 'all' && filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <button
                onClick={() => updateFilter('status', 'all')}
                className="ml-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.priority !== 'all' && filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Prioritas: {filters.priority}
              <button
                onClick={() => updateFilter('priority', 'all')}
                className="ml-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.type !== 'all' && filters.type && (
            <Badge variant="secondary" className="gap-1">
              Jenis: {filters.type.replace('_', ' ')}
              <button
                onClick={() => updateFilter('type', 'all')}
                className="ml-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <span className="text-xs text-muted-foreground">
            ({activeFilterCount} filter aktif)
          </span>
        </div>
      )}
    </div>
  );
}
