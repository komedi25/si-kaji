
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, User, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StudentDataErrorProps {
  error: string;
  onRetry: () => void;
  loading?: boolean;
}

export const StudentDataError = ({ error, onRetry, loading = false }: StudentDataErrorProps) => {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Siswa Tidak Ditemukan</strong><br/>
          Sistem tidak dapat menemukan data siswa yang terhubung dengan akun Anda.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Detail Akun:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div><strong>User ID:</strong> {user?.id}</div>
              <div><strong>Email:</strong> {user?.email}</div>
              <div><strong>Error:</strong> {error}</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Kemungkinan Penyebab:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Data siswa belum diinput ke dalam sistem</li>
              <li>NIS di profil akun tidak sesuai dengan database siswa</li>
              <li>Nama di profil akun tidak cocok dengan database siswa</li>
              <li>Akun belum dihubungkan manual oleh admin</li>
              <li>Masalah konektivitas database</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Langkah Penyelesaian:</h4>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>Pastikan NIS dan nama lengkap di profil Anda sudah benar</li>
              <li>Hubungi bagian tata usaha atau admin sistem</li>
              <li>Berikan informasi: Email ({user?.email}) dan User ID</li>
              <li>Admin akan menghubungkan data siswa dengan akun Anda</li>
              <li>Coba refresh halaman setelah admin mengkonfirmasi</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onRetry} 
              disabled={loading}
              variant="outline" 
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Mencoba...' : 'Coba Lagi'}
            </Button>
            
            <Button 
              onClick={() => window.open('mailto:admin@smkn1kendal.sch.id?subject=Masalah Data Siswa&body=User ID: ' + user?.id + '%0AEmail: ' + user?.email, '_blank')}
              variant="default"
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              Hubungi Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
