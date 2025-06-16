
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AttendanceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

interface AttendanceSchedule {
  id: string;
  name: string;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  late_threshold_minutes: number;
}

interface SelfAttendance {
  id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  violation_created: boolean;
}

export const SelfAttendanceWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [schedule, setSchedule] = useState<AttendanceSchedule | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<SelfAttendance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentId, setStudentId] = useState<string | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get student ID from user
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setStudentId(data.id);
      }
    };

    fetchStudentId();
  }, [user]);

  // Fetch locations and schedule
  useEffect(() => {
    const fetchData = async () => {
      // Fetch active locations
      const { data: locationsData } = await supabase
        .from('attendance_locations')
        .select('*')
        .eq('is_active', true);

      if (locationsData) {
        setLocations(locationsData);
      }

      // Fetch today's schedule
      const today = new Date().getDay();
      const { data: scheduleData } = await supabase
        .from('attendance_schedules')
        .select('*')
        .eq('day_of_week', today)
        .eq('is_active', true)
        .single();

      if (scheduleData) {
        setSchedule(scheduleData);
      }
    };

    fetchData();
  }, []);

  // Fetch today's attendance
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!studentId) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentId)
        .eq('attendance_date', today)
        .single();

      if (data) {
        setTodayAttendance(data);
      }
    };

    fetchTodayAttendance();
  }, [studentId]);

  // Get current location
  const getCurrentLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung browser ini'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition(position);
          resolve(position);
        },
        (error) => {
          reject(new Error('Gagal mendapatkan lokasi: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Check if within any location
  const isWithinLocation = (lat: number, lng: number): AttendanceLocation | null => {
    for (const location of locations) {
      const distance = calculateDistance(lat, lng, location.latitude, location.longitude);
      if (distance <= location.radius_meters) {
        return location;
      }
    }
    return null;
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Handle check in
  const handleCheckIn = async () => {
    if (!studentId || !schedule) return;

    setLoading(true);
    try {
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      const location = isWithinLocation(latitude, longitude);
      if (!location) {
        toast({
          title: "Lokasi Tidak Valid",
          description: "Anda tidak berada di area sekolah yang diizinkan",
          variant: "destructive"
        });
        return;
      }

      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm:ss');

      const { error } = await supabase
        .from('student_self_attendances')
        .upsert({
          student_id: studentId,
          attendance_date: today,
          check_in_time: currentTime,
          check_in_latitude: latitude,
          check_in_longitude: longitude,
          check_in_location_id: location.id,
          status: 'present'
        });

      if (error) throw error;

      // Refresh today's attendance
      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentId)
        .eq('attendance_date', today)
        .single();

      if (updatedData) {
        setTodayAttendance(updatedData);
      }

      toast({
        title: "Berhasil Check In",
        description: `Check in berhasil di ${location.name} pada ${format(now, 'HH:mm:ss')}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle check out
  const handleCheckOut = async () => {
    if (!studentId || !todayAttendance) return;

    setLoading(true);
    try {
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      const location = isWithinLocation(latitude, longitude);
      if (!location) {
        toast({
          title: "Lokasi Tidak Valid",
          description: "Anda tidak berada di area sekolah yang diizinkan",
          variant: "destructive"
        });
        return;
      }

      const now = new Date();
      const currentTime = format(now, 'HH:mm:ss');

      const { error } = await supabase
        .from('student_self_attendances')
        .update({
          check_out_time: currentTime,
          check_out_latitude: latitude,
          check_out_longitude: longitude,
          check_out_location_id: location.id,
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;

      // Refresh today's attendance
      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('id', todayAttendance.id)
        .single();

      if (updatedData) {
        setTodayAttendance(updatedData);
      }

      toast({
        title: "Berhasil Check Out",
        description: `Check out berhasil di ${location.name} pada ${format(now, 'HH:mm:ss')}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if can check in
  const canCheckIn = () => {
    if (!schedule || todayAttendance?.check_in_time) return false;
    
    const now = format(currentTime, 'HH:mm:ss');
    return now >= schedule.check_in_start && now <= schedule.check_in_end;
  };

  // Check if can check out
  const canCheckOut = () => {
    if (!schedule || !todayAttendance?.check_in_time || todayAttendance?.check_out_time) return false;
    
    const now = format(currentTime, 'HH:mm:ss');
    return now >= schedule.check_out_start && now <= schedule.check_out_end;
  };

  // Check if late
  const isLate = () => {
    if (!schedule || !todayAttendance?.check_in_time) return false;
    return todayAttendance.check_in_time > schedule.check_in_end;
  };

  const getStatusBadge = () => {
    if (!todayAttendance) {
      return <Badge variant="secondary">Belum Presensi</Badge>;
    }

    if (todayAttendance.violation_created) {
      return <Badge variant="destructive">Terlambat</Badge>;
    }

    if (todayAttendance.check_out_time) {
      return <Badge variant="default">Selesai</Badge>;
    }

    if (todayAttendance.check_in_time) {
      return <Badge variant="secondary">Sudah Check In</Badge>;
    }

    return <Badge variant="secondary">Belum Presensi</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Presensi Mandiri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-sm text-gray-500">
            {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: id })}
          </div>
        </div>

        {schedule && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Jadwal Hari Ini:</div>
            <div className="text-xs space-y-1">
              <div>Check In: {schedule.check_in_start} - {schedule.check_in_end}</div>
              <div>Check Out: {schedule.check_out_start} - {schedule.check_out_end}</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {todayAttendance && (
          <div className="space-y-2 text-sm">
            {todayAttendance.check_in_time && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Check In: {todayAttendance.check_in_time}</span>
                {isLate() && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </div>
            )}
            {todayAttendance.check_out_time && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Check Out: {todayAttendance.check_out_time}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleCheckIn}
            disabled={!canCheckIn() || loading}
            className="w-full"
            variant={canCheckIn() ? "default" : "secondary"}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {loading ? "Memproses..." : "Check In"}
          </Button>
          
          <Button
            onClick={handleCheckOut}
            disabled={!canCheckOut() || loading}
            className="w-full"
            variant={canCheckOut() ? "default" : "secondary"}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {loading ? "Memproses..." : "Check Out"}
          </Button>
        </div>

        {locations.length > 0 && (
          <div className="text-xs text-gray-500">
            <div className="font-medium mb-1">Lokasi Presensi:</div>
            {locations.map((location) => (
              <div key={location.id}>
                • {location.name} (Radius: {location.radius_meters}m)
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
