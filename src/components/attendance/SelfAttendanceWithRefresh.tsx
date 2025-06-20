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
  day_of_week: number;
}

interface SelfAttendance {
  id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  violation_created: boolean;
}

interface LocationReading {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
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
  const [locationReadings, setLocationReadings] = useState<LocationReading[]>([]);
  const [stabilizedPosition, setStabilizedPosition] = useState<{lat: number, lng: number} | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get student ID from user - FIXED
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user?.id) return;
      
      console.log('🔍 Fetching student ID for user:', user.id);
      
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle(); // Changed from .single() to .maybeSingle()
      
      if (error) {
        console.error('❌ Error fetching student ID:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data siswa: " + error.message,
          variant: "destructive"
        });
      } else if (data) {
        console.log('✅ Student ID found:', data.id);
        setStudentId(data.id);
      } else {
        console.log('⚠️ No student record found for user');
        toast({
          title: "Warning",
          description: "Data siswa tidak ditemukan untuk akun ini",
          variant: "destructive"
        });
      }
    };

    fetchStudentId();
  }, [user]);

  // Fetch locations and schedule - IMPROVED
  useEffect(() => {
    const fetchData = async () => {
      console.log('🔍 Fetching attendance data...');
      
      try {
        // Fetch active locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('attendance_locations')
          .select('*')
          .eq('is_active', true);

        if (locationsError) {
          console.error('❌ Error fetching locations:', locationsError);
          toast({
            title: "Error",
            description: "Gagal memuat lokasi presensi: " + locationsError.message,
            variant: "destructive"
          });
        } else {
          console.log('📍 Locations fetched:', locationsData?.length || 0, 'locations');
          setLocations(locationsData || []);
        }

        // Fetch today's schedule - FIXED
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        console.log('📅 Today is:', format(today, 'EEEE', { locale: id }), 'Day of week:', dayOfWeek);
        
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('attendance_schedules')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)
          .maybeSingle(); // Changed from .limit(1) to .maybeSingle()

        if (scheduleError) {
          console.error('❌ Error fetching schedule:', scheduleError);
          toast({
            title: "Error",
            description: "Gagal memuat jadwal presensi: " + scheduleError.message,
            variant: "destructive"
          });
        } else if (scheduleData) {
          console.log('✅ Schedule found:', scheduleData);
          setSchedule(scheduleData);
        } else {
          console.log('⚠️ No active schedule found for today (day_of_week:', dayOfWeek, ')');
          setSchedule(null);
          
          // Show helpful message
          toast({
            title: "Info",
            description: `Tidak ada jadwal presensi untuk hari ${format(today, 'EEEE', { locale: id })}`,
            variant: "default"
          });
        }
      } catch (error) {
        console.error('💥 Unexpected error fetching data:', error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat memuat data",
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, []);

  // Fetch today's attendance - FIXED
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!studentId) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('🔍 Fetching attendance for student:', studentId, 'date:', today);
      
      const { data, error } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentId)
        .eq('attendance_date', today)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (error) {
        console.error('❌ Error fetching today attendance:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data presensi hari ini: " + error.message,
          variant: "destructive"
        });
      } else if (data) {
        console.log('✅ Today attendance found:', data);
        setTodayAttendance(data);
      } else {
        console.log('ℹ️ No attendance record found for today');
        setTodayAttendance(null);
      }
    };

    fetchTodayAttendance();
  }, [studentId]);

  // Stabilize coordinates using multiple readings
  const stabilizeCoordinates = (newReading: LocationReading) => {
    const maxReadings = 5;
    const maxAge = 30000; // 30 seconds
    const now = Date.now();
    
    // Add new reading
    const updatedReadings = [...locationReadings, newReading].filter(
      reading => now - reading.timestamp <= maxAge
    ).slice(-maxReadings);
    
    setLocationReadings(updatedReadings);
    
    if (updatedReadings.length === 0) return null;
    
    // Filter out readings with poor accuracy (> 20 meters)
    const goodReadings = updatedReadings.filter(reading => reading.accuracy <= 20);
    const readingsToUse = goodReadings.length > 0 ? goodReadings : updatedReadings.slice(-2);
    
    // Calculate weighted average based on accuracy (better accuracy = higher weight)
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    
    readingsToUse.forEach(reading => {
      const weight = 1 / Math.max(reading.accuracy, 1); // Better accuracy = higher weight
      totalWeight += weight;
      weightedLat += reading.latitude * weight;
      weightedLng += reading.longitude * weight;
    });
    
    const stabilized = {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight
    };
    
    console.log('📍 Coordinate stabilization:', {
      rawReadings: updatedReadings.length,
      goodReadings: goodReadings.length,
      stabilized,
      accuracy: newReading.accuracy
    });
    
    return stabilized;
  };

  // Check location status when position changes
  useEffect(() => {
    if (stabilizedPosition && locations.length > 0) {
      const withinSchool = isWithinLocation(stabilizedPosition.lat, stabilizedPosition.lng);
      setIsWithinSchool(withinSchool !== null);
      console.log('📍 Location check with stabilized position:', withinSchool ? 'Inside school' : 'Outside school');
    }
  }, [stabilizedPosition, locations]);

  const refreshLocation = () => {
    setRefreshingLocation(true);
    console.log('🔄 Refreshing location...');
    
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
        console.log('📍 Raw location:', position.coords.latitude, position.coords.longitude, 'accuracy:', position.coords.accuracy);
        setPosition(position);
        
        const newReading: LocationReading = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 999,
          timestamp: Date.now()
        };
        
        const stabilized = stabilizeCoordinates(newReading);
        if (stabilized) {
          setStabilizedPosition(stabilized);
          console.log('📍 Stabilized position updated:', stabilized);
        }
        
        setRefreshingLocation(false);
        toast({
          title: "Berhasil",
          description: `Lokasi diperbarui (akurasi: ${Math.round(position.coords.accuracy || 0)}m)`,
        });
      },
      (error) => {
        console.error('❌ Location error:', error);
        setRefreshingLocation(false);
        toast({
          title: "Error",
          description: "Gagal mendapatkan lokasi: " + error.message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
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
          console.log('📍 Getting current location for attendance:', position.coords.latitude, position.coords.longitude);
          setPosition(position);
          
          const newReading: LocationReading = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 999,
            timestamp: Date.now()
          };
          
          const stabilized = stabilizeCoordinates(newReading);
          if (stabilized) {
            setStabilizedPosition(stabilized);
          }
          
          resolve(position);
        },
        (error) => {
          reject(new Error('Gagal mendapatkan lokasi: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
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
      console.log(`📏 Distance to ${location.name}: ${Math.round(distance)}m (limit: ${location.radius_meters}m)`);
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
      const coords = stabilizedPosition || { lat: position.coords.latitude, lng: position.coords.longitude };
      
      // Check if within school area - REQUIRED for check in
      const location = isWithinLocation(coords.lat, coords.lng);
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

      // Check for lateness - Create violation if late but still allow check in
      let violationCreated = false;
      let lateMessage = '';

      if (currentTime > schedule.check_in_end) {
        // Student is late - create violation but allow check in
        const { data: violationType } = await supabase
          .from('violation_types')
          .select('id')
          .eq('name', 'Terlambat')
          .eq('is_active', true)
          .single();

        if (violationType) {
          // Fix the arithmetic operation by converting time strings to Date objects and then to numbers
          const currentTimeMs = new Date(`1970-01-01T${currentTime}`).getTime();
          const checkInEndMs = new Date(`1970-01-01T${schedule.check_in_end}`).getTime();
          const lateMinutes = Math.ceil((currentTimeMs - checkInEndMs) / 60000);

          await supabase
            .from('student_violations')
            .insert({
              student_id: studentId,
              violation_type_id: violationType.id,
              violation_date: today,
              description: `Terlambat datang ke sekolah (hadir jam ${currentTime}, batas ${schedule.check_in_end})`,
              point_deduction: 5,
              status: 'active'
            });
          violationCreated = true;
          lateMessage = `Anda terlambat ${lateMinutes} menit`;
        }
      }

      const { error } = await supabase
        .from('student_self_attendances')
        .upsert({
          student_id: studentId,
          attendance_date: today,
          check_in_time: currentTime,
          check_in_latitude: coords.lat,
          check_in_longitude: coords.lng,
          check_in_location_id: location.id,
          status: 'present',
          violation_created: violationCreated,
          notes: violationCreated ? lateMessage : 'Hadir tepat waktu'
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

      if (violationCreated) {
        toast({
          title: "Check In Berhasil (Terlambat)",
          description: lateMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Berhasil Check In",
          description: `Presensi datang berhasil di ${location.name}`,
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

  const handleCheckOut = async () => {
    if (!studentId || !todayAttendance) return;

    setLoading(true);
    try {
      const position = await getCurrentLocation();
      const coords = stabilizedPosition || { lat: position.coords.latitude, lng: position.coords.longitude };
      
      // Check if OUTSIDE school area - REQUIRED for check out
      const location = isWithinLocation(coords.lat, coords.lng);
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
          check_out_latitude: coords.lat,
          check_out_longitude: coords.lng,
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

  // Updated canCheckIn - no time restrictions, only location and student/schedule availability
  const canCheckIn = () => {
    console.log('🤔 Checking if can check in:', {
      schedule: !!schedule,
      alreadyCheckedIn: !!todayAttendance?.check_in_time,
      isWithinSchool,
      studentId: !!studentId,
      stabilizedPosition: !!stabilizedPosition
    });
    
    if (!schedule || !studentId) {
      console.log('❌ Cannot check in: No schedule or student ID');
      return false;
    }
    
    if (todayAttendance?.check_in_time) {
      console.log('❌ Cannot check in: Already checked in');
      return false;
    }
    
    if (isWithinSchool === false) {
      console.log('❌ Cannot check in: Outside school area');
      return false;
    }
    
    // No time restriction - allow check in anytime if within school
    const canCheck = isWithinSchool === true;
    
    console.log('📝 Check in validation:', {
      isWithinSchool,
      finalResult: canCheck
    });
    
    return canCheck;
  };

  const canCheckOut = () => {
    if (!todayAttendance?.check_in_time || todayAttendance?.check_out_time || isWithinSchool === true) return false;
    
    // Can check out anytime after check in, but must be outside school
    return isWithinSchool === false;
  };

  const getCheckInButtonText = () => {
    if (!studentId) return "Data Siswa Tidak Ditemukan";
    if (!schedule) return "Tidak Ada Jadwal Hari Ini";
    if (todayAttendance?.check_in_time) return "Sudah Check In";
    if (isWithinSchool === null) return "Memuat Lokasi...";
    if (isWithinSchool === false) return "Harus di Dalam Sekolah";
    
    // No time restriction message
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
      // Check if late
      if (schedule && todayAttendance.check_in_time > schedule.check_in_end) {
        return <Badge variant="destructive">Hadir Terlambat</Badge>;
      }
      return <Badge className="bg-green-100 text-green-800">Hadir</Badge>;
    }

    return <Badge variant="secondary">Belum Presensi</Badge>;
  };

  // Debug widget state
  console.log('🔍 Widget Debug State:', {
    hasUser: !!user,
    studentId,
    hasSchedule: !!schedule,
    scheduleData: schedule,
    hasLocations: locations.length > 0,
    locationsCount: locations.length,
    todayAttendance,
    isWithinSchool,
    stabilizedPosition,
    locationReadings: locationReadings.length,
    canCheckIn: canCheckIn(),
    canCheckOut: canCheckOut(),
    currentDayOfWeek: new Date().getDay()
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Presensi Mandiri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Debug Info - Show if no schedule */}
        {!schedule && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Tidak Ada Jadwal Aktif</span>
            </div>
            <div className="text-sm text-yellow-600 mt-1">
              Hari: {format(currentTime, 'EEEE', { locale: id })} (Day: {currentTime.getDay()})
              <br />
              Tidak ditemukan jadwal presensi untuk hari ini. Hubungi admin untuk menambahkan jadwal.
            </div>
          </div>
        )}

        {!studentId && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Data Siswa Tidak Ditemukan</span>
            </div>
            <div className="text-sm text-red-600 mt-1">
              User ID: {user?.id || 'Tidak ada'}
              <br />
              Hubungi admin untuk memastikan akun Anda terhubung dengan data siswa.
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="text-2xl font-bold">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-sm text-gray-500">
            {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: id })}
          </div>
        </div>

        {/* Enhanced Location Status */}
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
          {stabilizedPosition && (
            <div className="text-xs text-gray-500 mt-1">
              Koordinat Stabil: {stabilizedPosition.lat.toFixed(6)}, {stabilizedPosition.lng.toFixed(6)}
              <br />
              Pembacaan GPS: {locationReadings.length}/5
              {position && (
                <span className="text-blue-600"> | Akurasi: {Math.round(position.coords.accuracy || 0)}m</span>
              )}
            </div>
          )}
          {position && !stabilizedPosition && (
            <div className="text-xs text-gray-500 mt-1">
              Koordinat Raw: {position.coords.latitude.toFixed(6)}, {position.coords.longitude.toFixed(6)}
              <br />
              Menunggu stabilisasi lokasi...
            </div>
          )}
        </div>

        {schedule && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Jadwal Hari Ini: {schedule.name}</div>
            <div className="text-xs space-y-1">
              <div>Jam Masuk Normal: {schedule.check_in_start} - {schedule.check_in_end}</div>
              <div className="text-blue-600">Check In: Kapan saja (di dalam sekolah)</div>
              <div className="text-orange-600">Terlambat: Setelah jam {schedule.check_in_end}</div>
              <div className="text-gray-600">Check Out: Kapan saja (di luar sekolah)</div>
              <div className="text-red-600">Waktu Normal Pulang: 15:15 - 17:15 WIB</div>
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
                {schedule && todayAttendance.check_in_time > schedule.check_in_end && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
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

        {/* Enhanced Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs space-y-1">
            <div className="font-medium text-blue-800">Aturan Presensi & Stabilisasi GPS:</div>
            <div>• Check In: Kapan saja jika di dalam area sekolah</div>
            <div>• Check Out: Harus di luar area sekolah</div>
            <div>• Terlambat: Otomatis tercatat jika check in setelah jam normal</div>
            <div>• Pelanggaran pulang: &lt; 15:15 atau &gt; 17:15</div>
            <div className="text-green-700 font-medium mt-2">• Koordinat distabilkan dari 5 pembacaan GPS terbaru</div>
            <div className="text-green-700">• Sistem menggunakan weighted average berdasarkan akurasi</div>
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

        {/* Debug info untuk troubleshooting */}
        <div className="text-xs text-gray-400 border-t pt-2">
          <div>Debug: Day={new Date().getDay()}, Schedule={!!schedule}, Student={!!studentId}, Locations={locations.length}</div>
          <div>GPS: Raw={!!position}, Stabilized={!!stabilizedPosition}, Readings={locationReadings.length}</div>
        </div>
      </CardContent>
    </Card>
  );
};
