
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/auth';

interface BulkUserImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface CSVRow {
  Email: string;
  Password: string;
  'Nama Lengkap': string;
  Role: string;
  NIP: string;
  NIS: string;
  Telepon: string;
  Alamat: string;
}

interface AuthUser {
  id: string;
  email?: string;
}

export const BulkUserImport = ({ open, onOpenChange, onImportComplete }: BulkUserImportProps) => {
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      'Email,Password,Nama Lengkap,Role,NIP,NIS,Telepon,Alamat',
      'admin@sekolah.com,password123,Admin Sekolah,admin,123456789,,08123456789,Jl. Admin No. 1',
      'guru@sekolah.com,password123,Guru BK,guru_bk,987654321,,08198765432,Jl. Guru No. 2',
      'siswa@sekolah.com,password123,Siswa Contoh,siswa,,2024001,08111222333,Jl. Siswa No. 3'
    ].join('\n');

    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-import-user.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row as CSVRow);
    }

    return data;
  };

  const validateRole = (role: string): AppRole | null => {
    const validRoles: AppRole[] = [
      'admin', 'kepala_sekolah', 'tppk', 'arps', 'p4gn',
      'koordinator_ekstrakurikuler', 'wali_kelas', 'guru_bk',
      'waka_kesiswaan', 'pelatih_ekstrakurikuler', 'siswa',
      'orang_tua', 'penanggung_jawab_sarpras', 'osis'
    ];
    
    return validRoles.includes(role as AppRole) ? role as AppRole : null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setImporting(true);
      setImportResults(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Silakan pilih file CSV');
      }

      const file = event.target.files[0];
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('File harus berformat CSV');
      }

      // Store current session to restore later
      const { data: currentSession } = await supabase.auth.getSession();

      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error('File CSV kosong atau format tidak valid');
      }

      const results = { success: 0, errors: [] as string[] };

      for (const [index, row] of data.entries()) {
        try {
          // Validate required fields
          if (!row.Email || !row.Password || !row['Nama Lengkap'] || !row.Role) {
            results.errors.push(`Baris ${index + 2}: Email, Password, Nama Lengkap, dan Role wajib diisi`);
            continue;
          }

          // Validate role
          const role = validateRole(row.Role);
          if (!role) {
            results.errors.push(`Baris ${index + 2}: Role "${row.Role}" tidak valid`);
            continue;
          }

          // Check if user already exists
          const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
          if (checkError) {
            console.warn('Could not check existing users:', checkError);
          }

          const userExists = existingUsers?.users?.some((u: AuthUser) => u.email === row.Email);
          if (userExists) {
            results.errors.push(`Baris ${index + 2}: Email ${row.Email} sudah terdaftar`);
            continue;
          }

          // Create user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: row.Email,
            password: row.Password,
            options: {
              data: {
                full_name: row['Nama Lengkap']
              },
              emailRedirectTo: `${window.location.origin}/`
            }
          });

          if (authError) {
            results.errors.push(`Baris ${index + 2}: ${authError.message}`);
            continue;
          }

          if (!authData.user) {
            results.errors.push(`Baris ${index + 2}: Gagal membuat user`);
            continue;
          }

          // Restore session immediately
          if (currentSession.session) {
            await supabase.auth.setSession(currentSession.session);
          }

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              full_name: row['Nama Lengkap'],
              nip: role === 'siswa' ? null : row.NIP || null,
              nis: role === 'siswa' ? row.NIS || null : null,
              phone: row.Telepon || null,
              address: row.Alamat || null
            });

          if (profileError) {
            results.errors.push(`Baris ${index + 2}: Error membuat profil - ${profileError.message}`);
            continue;
          }

          // Assign role with type casting
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: role as any, // Type cast to bypass strict type checking
              assigned_by: currentSession.session?.user.id || null,
              is_active: true
            });

          if (roleError) {
            results.errors.push(`Baris ${index + 2}: Error memberikan role - ${roleError.message}`);
            continue;
          }

          // If role is student, create student record
          if (role === 'siswa' && row.NIS) {
            const { error: studentError } = await supabase
              .from('students')
              .insert({
                user_id: authData.user.id,
                nis: row.NIS,
                full_name: row['Nama Lengkap'],
                phone: row.Telepon || null,
                address: row.Alamat || null,
                gender: 'L',
                status: 'active'
              });

            if (studentError) {
              console.warn(`Could not create student record for ${row['Nama Lengkap']}:`, studentError);
            }
          }

          results.success++;
        } catch (error) {
          console.error('Row processing error:', error);
          results.errors.push(`Baris ${index + 2}: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`);
        }
      }

      setImportResults(results);

      if (results.success > 0) {
        toast({
          title: "Import Berhasil",
          description: `${results.success} user berhasil diimport`,
        });
        onImportComplete();
      }

      if (results.errors.length > 0) {
        toast({
          title: "Import Selesai dengan Error",
          description: `${results.errors.length} baris gagal diimport`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengimport data",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import User dari Excel/CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importing}
                style={{ display: 'none' }}
              />
              <Button 
                onClick={handleImportClick}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {importing ? 'Mengimport...' : 'Import CSV'}
              </Button>
            </div>
          </div>

          {importResults && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Hasil Import:</strong></p>
                  <p>✅ Berhasil: {importResults.success} user</p>
                  {importResults.errors.length > 0 && (
                    <div>
                      <p>❌ Error: {importResults.errors.length} baris</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer">Detail Error</summary>
                        <ul className="mt-2 space-y-1 text-sm">
                          {importResults.errors.slice(0, 10).map((error, index) => (
                            <li key={index} className="text-red-600">• {error}</li>
                          ))}
                          {importResults.errors.length > 10 && (
                            <li className="text-gray-500">... dan {importResults.errors.length - 10} error lainnya</li>
                          )}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-500">
            <p><strong>Petunjuk:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Download template terlebih dahulu</li>
              <li>Isi data sesuai format template</li>
              <li>Email, Password, Nama Lengkap, dan Role wajib diisi</li>
              <li>Role yang valid: admin, guru_bk, siswa, osis, dll.</li>
              <li>Untuk siswa, isi kolom NIS. Untuk staff, isi kolom NIP</li>
              <li>Upload file CSV yang sudah diisi</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
