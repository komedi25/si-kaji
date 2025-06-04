
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, User, FileText, Trophy, AlertTriangle, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SearchResult {
  id: string;
  type: 'student' | 'document' | 'achievement' | 'violation' | 'case' | 'activity';
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  date?: string;
}

export const GlobalSearch = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock search function - in real implementation, this would call API
  const performSearch = async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'student',
          title: 'Ahmad Wijaya',
          subtitle: 'XII RPL 1',
          description: 'NIS: 123456, NISN: 0123456789',
          url: '/siswa/123',
          date: '2024-01-15'
        },
        {
          id: '2',
          type: 'document',
          title: 'Surat Edaran Disiplin',
          subtitle: 'Kebijakan Sekolah',
          description: 'Peraturan terbaru tentang tata tertib sekolah',
          url: '/documents/456',
          date: '2024-03-10'
        },
        {
          id: '3',
          type: 'achievement',
          title: 'Juara 1 Lomba Programming',
          subtitle: 'Ahmad Wijaya - XII RPL 1',
          description: 'Kompetisi tingkat provinsi',
          url: '/achievements/789',
          date: '2024-05-20'
        },
        {
          id: '4',
          type: 'violation',
          title: 'Pelanggaran Terlambat',
          subtitle: 'Siti Nurhaliza - XI TKJ 2',
          description: 'Terlambat masuk kelas jam pertama',
          url: '/violations/101',
          date: '2024-06-01'
        },
        {
          id: '5',
          type: 'case',
          title: 'Kasus Bullying - CASE-2024-001',
          subtitle: 'Status: In Progress',
          description: 'Laporan bullying di lingkungan sekolah',
          url: '/cases/202',
          date: '2024-05-28'
        },
        {
          id: '6',
          type: 'activity',
          title: 'Kegiatan Pramuka Wajib',
          subtitle: 'Proposal OSIS',
          description: 'Kegiatan rutin pramuka untuk kelas X',
          url: '/activities/303',
          date: '2024-06-15'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(term.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(term.toLowerCase()) ||
        item.description?.toLowerCase().includes(term.toLowerCase())
      );

      setResults(mockResults);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <User className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'achievement':
        return <Trophy className="h-4 w-4" />;
      case 'violation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'case':
        return <AlertTriangle className="h-4 w-4" />;
      case 'activity':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'student':
        return 'bg-blue-100 text-blue-700';
      case 'document':
        return 'bg-gray-100 text-gray-700';
      case 'achievement':
        return 'bg-green-100 text-green-700';
      case 'violation':
        return 'bg-red-100 text-red-700';
      case 'case':
        return 'bg-orange-100 text-orange-700';
      case 'activity':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'student':
        return 'Siswa';
      case 'document':
        return 'Dokumen';
      case 'achievement':
        return 'Prestasi';
      case 'violation':
        return 'Pelanggaran';
      case 'case':
        return 'Kasus';
      case 'activity':
        return 'Kegiatan';
      default:
        return type;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Global Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari siswa, dokumen, prestasi, pelanggaran, atau kegiatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {loading && (
          <div className="text-center text-muted-foreground">
            Searching...
          </div>
        )}

        {searchTerm && !loading && results.length === 0 && (
          <div className="text-center text-muted-foreground">
            No results found for "{searchTerm}"
          </div>
        )}

        <div className="space-y-2">
          {results.map((result) => (
            <div
              key={result.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => result.url && window.open(result.url, '_self')}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{result.title}</h4>
                      <Badge className={getTypeColor(result.type)}>
                        {getTypeLabel(result.type)}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {result.subtitle}
                      </p>
                    )}
                    {result.description && (
                      <p className="text-xs text-muted-foreground">
                        {result.description}
                      </p>
                    )}
                  </div>
                </div>
                {result.date && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(result.date).toLocaleDateString('id-ID')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {searchTerm && results.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Found {results.length} result(s)
          </div>
        )}
      </CardContent>
    </Card>
  );
};
