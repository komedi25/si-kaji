import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Home, LogOut } from 'lucide-react';
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

export const SelfAttendanceWithRefresh = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [schedule, setSchedule] = useState<AttendanceSchedule | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<SelfAttendance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isWithinSchool, setIsWithinSchool] = useState<boolean | null>(null);

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

  // Check location status when position changes
  useEffect(() => {
    if (position && locations.length > 0) {
      const withinSchool = isWithinLocation(position.coords.latitude, position.coords.longitude);
      setIsWithinSchool(withinSchool !== null);
    }
  }, [position, locations]);

  const refreshLocation = () => {
    setRefreshingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation tidak didukung browser ini",
        variant: "destructive"
      });
      setRefreshingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition(position);
        const withinSchool = isWithinLocation(position.coords.latitude, position.coords.longitude);
        setIsWithinSchool(withinSchool !== null);
        setRefreshingLocation(false);
        toast({
          title: "Berhasil",
          description: "Lokasi berhasil diperbarui",
        });
      },
      (error) => {
        setRefreshingLocation(false);
        toast({
          title: "Error",
          description: "Gagal mendapatkan lokasi: " + error.message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const getCurrentLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung browser ini'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition(position);
          const withinSchool = isWithinLocation(position.coords.latitude, position.coords.longitude);
          setIsWithinSchool(withinSchool !== null);
          resolve(position);
        },
        (error) => {
          reject(new Error('Gagal mendapatkan lokasi: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isWithinLocation = (lat: number, lng: number): AttendanceLocation | null => {
    for (const location of locations) {
      const distance = calculateDistance(lat, lng, location.latitude, location.longitude);
      if (distance <= location.radius_meters) {
        return location;
      }
    }
    return null;
  };

  const handleCheckIn = async () => {
    if (!studentId || !schedule) return;

    setLoading(true);
    try {
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      // Check if within school area - REQUIRED for check in
      const location = isWithinLocation(latitude, longitude);
      if (!location) {
        toast({
          title: "Lokasi Tidak Valid",
          description: "Anda harus berada di dalam area sekolah untuk melakukan presensi datang",
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
          status: 'present' // Siswa dianggap hadir meskipun hanya check in
        });

      if (error) throw error;

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
        description: `Presensi datang berhasil di ${location.name}`,
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

  const handleCheckOut = async () => {
    if (!studentId || !todayAttendance) return;

    setLoading(true);
    try {
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      // Check if OUTSIDE school area - REQUIRED for check out
      const location = isWithinLocation(latitude, longitude);
      if (location) {
        toast({
          title: "Lokasi Tidak Valid",
          description: "Anda harus berada di luar area sekolah untuk melakukan presensi pulang",
          variant: "destructive"
        });
        return;
      }

      const now = new Date();
      const currentTime = format(now, 'HH:mm:ss');
      const earlyDepartureTime = '15:15:00';
      const lateDepartureTime = '17:15:00';

      // Check for violations
      let violationCreated = false;
      let violationMessage = '';

      if (currentTime < earlyDepartureTime) {
        // Create early departure violation (before 15:15)
        const { data: violationType } = await supabase
          .from('violation_types')
          .select('id')
          .eq('name', 'Pulang Terlalu Awal')
          .eq('is_active', true)
          .single();

        if (violationType) {
          await supabase
            .from('student_violations')
            .insert({
              student_id: studentId,
              violation_type_id: violationType.id,
              violation_date: format(now, 'yyyy-MM-dd'),
              description: `Pulang terlalu awal sebelum jam 15:15 (pulang jam ${currentTime})`,
              point_deduction: 15,
              status: 'active'
            });
          violationCreated = true;
          violationMessage = 'Pelanggaran: Pulang terlalu awal (sebelum 15:15)';
        }
      } else if (currentTime > lateDepartureTime) {
        // Create late departure violation (after 17:15)
        const { data: violationType } = await supabase
          .from('violation_types')
          .select('id')
          .eq('name', 'Pulang Terlalu Malam')
          .eq('is_active', true)
          .single();

        if (violationType) {
          await supabase
            .from('student_violations')
            .insert({
              student_id: studentId,
              violation_type_id: violationType.id,
              violation_date: format(now, 'yyyy-MM-dd'),
              description: `Pulang terlalu malam setelah jam 17:15 (pulang jam ${currentTime})`,
              point_deduction: 10,
              status: 'active'
            });
          violationCreated = true;
          violationMessage = 'Pelanggaran: Pulang terlalu malam (setelah 17:15)';
        }
      }

      const { error } = await supabase
        .from('student_self_attendances')
        .update({
          check_out_time: currentTime,
          check_out_latitude: latitude,
          check_out_longitude: longitude,
          violation_created: violationCreated,
          notes: violationCreated ? violationMessage : 'Pulang sesuai jadwal'
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;

      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('id', todayAttendance.id)
        .single();

      if (updatedData) {
        setTodayAttendance(updatedData);
      }

      if (violationCreated) {
        toast({
          title: "Presensi Pulang Berhasil",
          description: violationMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Berhasil Check Out",
          description: "Presensi pulang berhasil dicatat",
        });
      }
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

  const canCheckIn = () => {
    if (!schedule || todayAttendance?.check_in_time || isWithinSchool === false) return false;
    
    const now = format(currentTime, 'HH:mm:ss');
    return now >= schedule.check_in_start && now <= schedule.check_in_end && isWithinSchool === true;
  };

  const canCheckOut = () => {
    if (!todayAttendance?.check_in_time || todayAttendance?.check_out_time || isWithinSchool === true) return false;
    
    // Can check out anytime after check in, but must be outside school
    return isWithinSchool === false;
  };

  const getCheckInButtonText = () => {
    if (todayAttendance?.check_in_time) return "Sudah Check In";
    if (isWithinSchool === null) return "Memuat Lokasi...";
    if (isWithinSchool === false) return "Harus di Dalam Sekolah";
    if (!schedule) return "Tidak Ada Jadwal";
    
    const now = format(currentTime, 'HH:mm:ss');
    if (now < schedule.check_in_start) return `Belum Waktunya (${schedule.check_in_start})`;
    if (now > schedule.check_in_end) return "Waktu Check In Habis";
    
    return "Check In";
  };

  const getCheckOutButtonText = () => {
    if (!todayAttendance?.check_in_time) return "Check In Dulu";
    if (todayAttendance?.check_out_time) return "Sudah Check Out";
    if (isWithinSchool === null) return "Memuat Lokasi...";
    if (isWithinSchool === true) return "Harus di Luar Sekolah";
    
    return "Check Out";
  };

  const getLocationStatus = () => {
    if (isWithinSchool === null) return { text: "Memuat lokasi...", color: "text-gray-500", icon: Clock };
    if (isWithinSchool) return { text: "Di dalam sekolah", color: "text-green-600", icon: Home };
    return { text: "Di luar sekolah", color: "text-blue-600", icon: LogOut };
  };

  const locationStatus = getLocationStatus();

  const getStatusBadge = () => {
    if (!todayAttendance) {
      return <Badge variant="secondary">Belum Presensi</Badge>;
    }

    if (todayAttendance.violation_created) {
      return <Badge variant="destructive">Ada Pelanggaran</Badge>;
    }

    if (todayAttendance.check_out_time) {
      const checkOutTime = todayAttendance.check_out_time;
      const earlyTime = '15:15:00';
      const lateTime = '17:15:00';
      
      if (checkOutTime < earlyTime) {
        return <Badge variant="destructive">Pulang Terlalu Awal</Badge>;
      } else if (checkOutTime > lateTime) {
        return <Badge variant="destructive">Pulang Terlalu Malam</Badge>;
      }
      return <Badge variant="default">Selesai</Badge>;
    }

    if (todayAttendance.check_in_time) {
      return <Badge className="bg-green-100 text-green-800">Hadir</Badge>;
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

        {/* Location Status */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Status Lokasi:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLocation}
              disabled={refreshingLocation}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshingLocation ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className={`flex items-center gap-2 ${locationStatus.color}`}>
            <locationStatus.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{locationStatus.text}</span>
          </div>
          {position && (
            <div className="text-xs text-gray-500 mt-1">
              Koordinat: {position.coords.latitude.toFixed(6)}, {position.coords.longitude.toFixed(6)}
            </div>
          )}
        </div>

        {schedule && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Jadwal Hari Ini:</div>
            <div className="text-xs space-y-1">
              <div>Check In: {schedule.check_in_start} - {schedule.check_in_end}</div>
              <div className="text-gray-600">Check Out: Kapan saja (di luar sekolah)</div>
              <div className="text-red-600">Waktu Normal: 15:15 - 17:15 WIB</div>
              <div className="text-orange-600">Pelanggaran: &lt; 15:15 atau &gt; 17:15</div>
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
              </div>
            )}
            {todayAttendance.check_out_time && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Check Out: {todayAttendance.check_out_time}</span>
                {(todayAttendance.check_out_time < '15:15:00' || todayAttendance.check_out_time > '17:15:00') && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
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
            <Home className="h-4 w-4 mr-2" />
            {loading ? "Memproses..." : getCheckInButtonText()}
          </Button>
          
          <Button
            onClick={handleCheckOut}
            disabled={!canCheckOut() || loading}
            className="w-full"
            variant={canCheckOut() ? "default" : "secondary"}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {loading ? "Memproses..." : getCheckOutButtonText()}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs space-y-1">
            <div className="font-medium text-blue-800">Aturan Presensi:</div>
            <div>• Check In: Harus di dalam area sekolah</div>
            <div>• Check Out: Harus di luar area sekolah</div>
            <div>• Siswa dianggap hadir meski hanya check in</div>
            <div>• Waktu pulang normal: 15:15 - 17:15 WIB</div>
            <div>• Pelanggaran: Pulang &lt; 15:15 atau &gt; 17:15</div>
          </div>
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
