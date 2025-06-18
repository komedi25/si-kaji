
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/types/auth';

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: AppRole | 'all';
  setRoleFilter: (role: AppRole | 'all') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filteredUsers: any[];
  roleOptions: { value: AppRole; label: string }[];
}

export const UserFilters = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  activeTab,
  setActiveTab,
  filteredUsers,
  roleOptions
}: UserFiltersProps) => {
  const getTabCount = (type: string) => {
    if (type === 'all') return filteredUsers.length;
    return filteredUsers.filter(u => u.user_type === type).length;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Cari berdasarkan nama, email, NIS, atau NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AppRole | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User Type Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Semua Pengguna
          <Badge variant="secondary" className="ml-2">
            {getTabCount('all')}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'staff'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Staff & Guru
          <Badge variant="secondary" className="ml-2">
            {getTabCount('staff')}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Siswa
          <Badge variant="secondary" className="ml-2">
            {getTabCount('student')}
          </Badge>
        </button>
      </div>
    </div>
  );
};
