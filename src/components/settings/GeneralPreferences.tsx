
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { User, Bell, Shield, Globe, Palette, AlertCircle } from 'lucide-react';

interface UserPreferences {
  id?: string;
  user_id: string;
  language: string;
  timezone: string;
  theme: string;
  date_format: string;
  time_format: string;
  items_per_page: number;
  auto_save: boolean;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export function GeneralPreferences() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    user_id: '',
    language: 'id',
    timezone: 'Asia/Jakarta',
    theme: 'system',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    items_per_page: 10,
    auto_save: true,
    notifications_enabled: true,
    email_notifications: true,
    sms_notifications: false
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Try to load existing preferences
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingPrefs) {
        setPreferences(existingPrefs);
      } else {
        setPreferences(prev => ({ ...prev, user_id: user.id }));
      }

      return { user, profile };
    }
  });

  const savePreferences = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          ...preferences,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Preferensi telah disimpan"
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan preferensi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Profil
          </CardTitle>
          <CardDescription>
            Informasi dasar profil pengguna
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input 
                value={userProfile?.profile?.full_name || ''} 
                disabled 
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">
                Hubungi administrator untuk mengubah nama
              </p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={userProfile?.user?.email || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>NIP/NIS</Label>
              <Input 
                value={userProfile?.profile?.nip || userProfile?.profile?.nis || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input 
                value={userProfile?.profile?.phone || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interface Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Preferensi Tampilan
          </CardTitle>
          <CardDescription>
            Atur tampilan dan bahasa aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bahasa</Label>
              <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select value={preferences.theme} onValueChange={(value) => updatePreference('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Terang</SelectItem>
                  <SelectItem value="dark">Gelap</SelectItem>
                  <SelectItem value="system">Mengikuti Sistem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format Tanggal</Label>
              <Select value={preferences.date_format} onValueChange={(value) => updatePreference('date_format', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format Waktu</Label>
              <Select value={preferences.time_format} onValueChange={(value) => updatePreference('time_format', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Jam</SelectItem>
                  <SelectItem value="12h">12 Jam (AM/PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferensi Sistem
          </CardTitle>
          <CardDescription>
            Pengaturan sistem dan regional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Zona Waktu</Label>
              <Select value={preferences.timezone} onValueChange={(value) => updatePreference('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
                  <SelectItem value="Asia/Makassar">WITA (Makassar)</SelectItem>
                  <SelectItem value="Asia/Jayapura">WIT (Jayapura)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Item per Halaman</Label>
              <Select value={preferences.items_per_page.toString()} onValueChange={(value) => updatePreference('items_per_page', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Save</Label>
                <p className="text-sm text-muted-foreground">
                  Simpan otomatis perubahan data
                </p>
              </div>
              <Switch
                checked={preferences.auto_save}
                onCheckedChange={(checked) => updatePreference('auto_save', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferensi Notifikasi
          </CardTitle>
          <CardDescription>
            Atur jenis notifikasi yang ingin diterima
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifikasi Aplikasi</Label>
                <p className="text-sm text-muted-foreground">
                  Tampilkan notifikasi di dalam aplikasi
                </p>
              </div>
              <Switch
                checked={preferences.notifications_enabled}
                onCheckedChange={(checked) => updatePreference('notifications_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifikasi Email</Label>
                <p className="text-sm text-muted-foreground">
                  Kirim notifikasi melalui email
                </p>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                disabled={!preferences.notifications_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifikasi SMS</Label>
                <p className="text-sm text-muted-foreground">
                  Kirim notifikasi melalui SMS
                </p>
              </div>
              <Switch
                checked={preferences.sms_notifications}
                onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
                disabled={!preferences.notifications_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Preferences - Only for Admin */}
      {hasRole('admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Keamanan Akun (Admin)
            </CardTitle>
            <CardDescription>
              Pengaturan keamanan sistem untuk administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Pengaturan Admin:</strong> Sebagai administrator, Anda memiliki akses ke pengaturan keamanan tingkat sistem. 
                Untuk mengubah password atau pengaturan keamanan akun, silakan gunakan menu manajemen pengguna atau 
                hubungi administrator sistem lainnya.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Akses Sistem</h4>
                <p className="text-sm text-muted-foreground">
                  Akses penuh ke semua fitur sistem dan pengaturan
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Manajemen Pengguna</h4>
                <p className="text-sm text-muted-foreground">
                  Dapat mengelola pengguna, role, dan permission
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-admin security note */}
      {!hasRole('admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>
              Pengaturan keamanan akun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> Untuk mengubah password atau pengaturan keamanan lainnya, 
                silakan hubungi administrator sistem.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Preferensi'}
        </Button>
      </div>
    </div>
  );
}
