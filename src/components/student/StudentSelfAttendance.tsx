
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { StudentDataError } from './StudentDataError';

export const StudentSelfAttendance = () => {
  const { studentData, isLoading: userLoading, error: userError, refetch } = useUserProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Get today's attendance
  const { data: todayAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-self-attendance', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('attendance_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
    enabled: !!studentData?.id,
  });

  // Get attendance locations
  const { data: locations } = useQuery({
    queryKey: ['attendance-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_locations')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!studentData?.id || !location) {
        throw new Error('Data siswa atau lokasi tidak tersedia');
      }

      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];

      const { error } = await supabase
        .from('student_self_attendances')
        .insert({
          student_id: studentData.id,
          attendance_date: today,
          check_in_time: currentTime,
          check_in_latitude: location.latitude,
          check_in_longitude: location.longitude,
          status: 'present'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil Check-in!",
        description: "Presensi masuk berhasil dicatat.",
      });
      queryClient.invalidateQueries({ queryKey: ['student-self-attendance'] });
    },
    onError: (error) => {
      toast({
        title: "Gagal Check-in",
        description: error.message,
        variant: "destructive",
      });
      console.error('Check-in error:', error);
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!studentData?.id || !location || !todayAttendance?.id) {
        throw new Error('Data tidak lengkap untuk check-out');
      }

      const currentTime = new Date().toTimeString().split(' ')[0];

      const { error } = await supabase
        .from('student_self_attendances')
        .update({
          check_out_time: currentTime,
          check_out_latitude: location.latitude,
          check_out_longitude: location.longitude,
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil Check-out!",
        description: "Presensi pulang berhasil dicatat.",
      });
      queryClient.invalidateQueries({ queryKey: ['student-self-attendance'] });
    },
    onError: (error) => {
      toast({
        title: "Gagal Check-out",
        description: error.message,
        variant: "destructive",
      });
      console.error('Check-out error:', error);
    },
  });

  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setGettingLocation(false);
          toast({
            title: "Lokasi ditemukan",
            description: "Lokasi Anda berhasil dideteksi.",
          });
        },
        (error) => {
          setGettingLocation(false);
          toast({
            title: "Gagal mendapatkan lokasi",
            description: "Mohon izinkan akses lokasi atau coba lagi.",
            variant: "destructive",
          });
        }
      );
    } else {
      setGettingLocation(false);
      toast({
        title: "GPS tidak tersedia",
        description: "Browser Anda tidak mendukung geolokasi.",
        variant: "destructive",
      });
    }
  };

  if (userLoading || attendanceLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (userError || !studentData) {
    return (
      <StudentDataError 
        error={userError || 'Data siswa tidak ditemukan'} 
        onRetry={refetch}
      />
    );
  }

  const today = new Date();
  const isCheckedIn = todayAttendance?.check_in_time;
  const isCheckedOut = todayAttendance?.check_out_time;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Presensi Mandiri
          </CardTitle>
          <CardDescription>
            {format(today, 'EEEE, dd MMMM yyyy', { locale: id })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-800">
              {studentData.full_name} - {studentData.nis}
            </div>
            <div className="text-xs text-blue-600">
              Status: {studentData.status}
            </div>
          </div>

          {/* Current Status */}
          {todayAttendance && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Status Hari Ini:</h3>
              <div className="flex items-center gap-4">
                {isCheckedIn && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Masuk: {todayAttendance.check_in_time}
                    </span>
                  </div>
                )}
                {isCheckedOut && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      Pulang: {todayAttendance.check_out_time}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Status */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {location 
                ? `Lokasi terdeteksi` 
                : 'Lokasi belum terdeteksi'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!location && (
              <Button 
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full"
                variant="outline"
              >
                {gettingLocation ? 'Mendapatkan lokasi...' : 'Dapatkan Lokasi'}
              </Button>
            )}

            {location && !isCheckedIn && (
              <Button 
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="w-full"
              >
                {checkInMutation.isPending ? 'Memproses...' : 'Check-in Masuk'}
              </Button>
            )}

            {location && isCheckedIn && !isCheckedOut && (
              <Button 
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                className="w-full"
                variant="secondary"
              >
                {checkOutMutation.isPending ? 'Memproses...' : 'Check-out Pulang'}
              </Button>
            )}

            {isCheckedIn && isCheckedOut && (
              <div className="text-center py-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Presensi hari ini sudah lengkap
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Locations */}
      {locations && locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lokasi Presensi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{loc.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    Radius {loc.radius_meters}m
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
