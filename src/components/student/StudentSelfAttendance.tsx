import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Home, LogOut, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudentDetails } from '@/hooks/useStudentData';
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
  notes?: string;
  device_fingerprint?: string;
}

interface LocationValidation {
  isValid: boolean;
  confidence: number;
  warnings: string[];
}

export const StudentSelfAttendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: studentData, isLoading: studentLoading, error: studentError, refetch } = useStudentDetails(user?.id || null);
  const [loading, setLoading] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [schedule, setSchedule] = useState<AttendanceSchedule | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<SelfAttendance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWithinSchool, setIsWithinSchool] = useState<boolean | null>(null);
  const [locationValidation, setLocationValidation] = useState<LocationValidation | null>(null);
  const [locationHistory, setLocationHistory] = useState<Array<{
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy: number;
  }>>([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch locations and schedule
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('attendance_locations')
          .select('*')
          .eq('is_active', true);

        if (locationsError) {
          console.error('Error fetching locations:', locationsError);
        } else {
          setLocations(locationsData || []);
        }

        // Fetch today's schedule
        const today = new Date();
        const dayOfWeek = today.getDay();
        
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('attendance_schedules')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)
          .maybeSingle();

        if (scheduleError) {
          console.error('Error fetching schedule:', scheduleError);
        } else {
          setSchedule(scheduleData);
        }
      } catch (error) {
        console.error('Unexpected error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch today's attendance
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!studentData?.id) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('attendance_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today attendance:', error);
      } else {
        setTodayAttendance(data);
      }
    };

    fetchTodayAttendance();
  }, [studentData?.id]);

  // Check location status when position changes
  useEffect(() => {
    if (position && locations.length > 0) {
      const withinSchool = isWithinLocation(position.coords.latitude, position.coords.longitude);
      setIsWithinSchool(withinSchool !== null);
      
      // Validate location for anti-fake GPS
      const validation = validateLocationAccuracy(position);
      setLocationValidation(validation);
    }
  }, [position, locations]);

  // Anti-Fake GPS Detection
  const validateLocationAccuracy = (position: GeolocationPosition): LocationValidation => {
    const validation: LocationValidation = {
      isValid: true,
      confidence: 100,
      warnings: []
    };

    // Check accuracy - fake GPS often has perfect accuracy
    if (position.coords.accuracy < 5) {
      validation.confidence -= 30;
      validation.warnings.push('Akurasi GPS terlalu tinggi (kemungkinan fake GPS)');
    }

    // Check location jump (teleportation detection)
    if (locationHistory.length > 0) {
      const lastLocation = locationHistory[locationHistory.length - 1];
      const distance = calculateDistance(
        position.coords.latitude, position.coords.longitude,
        lastLocation.latitude, lastLocation.longitude
      );
      const timeDiff = (Date.now() - lastLocation.timestamp) / 1000; // seconds
      const speed = distance / timeDiff; // m/s

      // If speed > 50 m/s (180 km/h), likely fake
      if (speed > 50) {
        validation.confidence -= 40;
        validation.warnings.push('Perpindahan lokasi tidak wajar');
      }
    }

    // Check for suspicious patterns
    if (detectSuspiciousPattern(position.coords.latitude, position.coords.longitude)) {
      validation.confidence -= 30;
      validation.warnings.push('Pola lokasi mencurigakan');
    }

    validation.isValid = validation.confidence >= 60;
    return validation;
  };

  const detectSuspiciousPattern = (lat: number, lng: number): boolean => {
    // Check if coordinates are too perfect (fake GPS often uses exact coordinates)
    const latStr = lat.toString();
    const lngStr = lng.toString();
    
    // Perfect coordinates with many zeros
    if (latStr.includes('00000') || lngStr.includes('00000')) {
      return true;
    }

    // Check for commonly used fake coordinates
    const commonFakeCoords = [
      { lat: 0, lng: 0 },
      { lat: -6.9174639, lng: 110.2024914 }, // SMKN 1 Kendal exact coordinates
    ];

    for (const coord of commonFakeCoords) {
      const distance = calculateDistance(lat, lng, coord.lat, coord.lng);
      if (distance < 1) { // Within 1 meter of exact coordinate
        return true;
      }
    }

    return false;
  };

  const generateDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      memory: (navigator as any).deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      timestamp: Date.now()
    };

    return btoa(JSON.stringify(fingerprint));
  };

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
        
        // Store location history for validation
        setLocationHistory(prev => {
          const newHistory = [...prev, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy
          }];
          // Keep only last 10 locations
          return newHistory.slice(-10);
        });
        
        setRefreshingLocation(false);
        toast({
          title: "Berhasil",
          description: `Lokasi diperbarui (akurasi: ${Math.round(position.coords.accuracy || 0)}m)`,
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
        timeout: 15000,
        maximumAge: 0
      }
    );
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

  const isLateForCheckIn = (): boolean => {
    if (!schedule) return false;
    const now = format(currentTime, 'HH:mm:ss');
    return now > schedule.check_in_end;
  };

  const isAfterHours = (): boolean => {
    const now = format(currentTime, 'HH:mm:ss');
    return now > '17:15:00';
  };

  const checkForActivePermit = async (): Promise<boolean> => {
    if (!studentData?.id) return false;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('student_permits')
      .select('*')
      .eq('student_id', studentData.id)
      .lte('start_date', today)
      .gte('end_date', today)
      .eq('status', 'approved')
      .maybeSingle();
    
    return !!data;
  };

  const handleCheckIn = async () => {
    if (!studentData?.id) return;

    if (locationValidation && !locationValidation.isValid) {
      toast({
        title: "Validasi Lokasi Gagal",
        description: "Lokasi tidak valid: " + locationValidation.warnings.join(', '),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (!position) {
        toast({
          title: "Error",
          description: "Lokasi belum terdeteksi. Silakan refresh lokasi terlebih dahulu.",
          variant: "destructive"
        });
        return;
      }

      const location = isWithinLocation(position.coords.latitude, position.coords.longitude);
      if (!location) {
        toast({
          title: "Lokasi Tidak Valid",
          description: "Anda harus berada di dalam area sekolah untuk melakukan presensi",
          variant: "destructive"
        });
        return;
      }

      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm:ss');
      const deviceFingerprint = generateDeviceFingerprint();
      
      let status = 'present';
      let notes = '';
      
      // Check if late
      if (isLateForCheckIn()) {
        status = 'late';
        notes = 'Terlambat masuk sekolah';
      }

      const { error } = await supabase
        .from('student_self_attendances')
        .upsert({
          student_id: studentData.id,
          attendance_date: today,
          check_in_time: currentTime,
          check_in_latitude: position.coords.latitude,
          check_in_longitude: position.coords.longitude,
          check_in_location_id: location.id,
          status: status,
          notes: notes,
          device_fingerprint: deviceFingerprint
        });

      if (error) throw error;

      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('attendance_date', today)
        .maybeSingle();

      setTodayAttendance(updatedData);

      if (status === 'late') {
        toast({
          title: "Check In Terlambat",
          description: `Presensi masuk terlambat dicatat di ${location.name}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Berhasil Check In",
          description: `Presensi masuk berhasil di ${location.name}`,
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
    if (!studentData?.id || !todayAttendance) return;

    if (locationValidation && !locationValidation.isValid) {
      toast({
        title: "Validasi Lokasi Gagal",
        description: "Lokasi tidak valid: " + locationValidation.warnings.join(', '),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (!position) {
        toast({
          title: "Error",
          description: "Lokasi belum terdeteksi. Silakan refresh lokasi terlebih dahulu.",
          variant: "destructive"
        });
        return;
      }

      const now = new Date();
      const currentTime = format(now, 'HH:mm:ss');
      let notes = todayAttendance.notes || '';
      
      // Check if after hours without permit for after-hours activities
      if (isAfterHours()) {
        const hasPermit = await checkForActivePermit();
        if (!hasPermit) {
          notes += (notes ? '; ' : '') + 'Pulang setelah jam 17:15 tanpa izin kegiatan';
          
          toast({
            title: "Peringatan",
            description: "Anda pulang setelah jam 17:15. Pastikan ada izin kegiatan yang berlaku.",
            variant: "destructive"
          });
        } else {
          notes += (notes ? '; ' : '') + 'Pulang setelah jam 17:15 dengan izin kegiatan';
        }
      }

      const { error } = await supabase
        .from('student_self_attendances')
        .update({
          check_out_time: currentTime,
          check_out_latitude: position.coords.latitude,
          check_out_longitude: position.coords.longitude,
          notes: notes
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;

      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('id', todayAttendance.id)
        .maybeSingle();

      setTodayAttendance(updatedData);

      toast({
        title: "Berhasil Check Out",
        description: "Presensi keluar berhasil dicatat",
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

  const canCheckIn = () => {
    if (!schedule || todayAttendance?.check_in_time || isWithinSchool === false) return false;
    return isWithinSchool === true;
  };

  const canCheckOut = () => {
    if (!todayAttendance?.check_in_time || todayAttendance?.check_out_time) return false;
    return true;
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

    if (todayAttendance.status === 'late') {
      return <Badge variant="destructive">Terlambat</Badge>;
    }

    if (todayAttendance.check_out_time) {
      return <Badge variant="default">Selesai</Badge>;
    }

    if (todayAttendance.check_in_time) {
      return <Badge className="bg-green-100 text-green-800">Hadir</Badge>;
    }

    return <Badge variant="secondary">Belum Presensi</Badge>;
  };

  const getSecurityLevel = () => {
    if (!locationValidation) return null;
    
    const confidence = locationValidation.confidence;
    if (confidence >= 80) return { level: 'Tinggi', color: 'text-green-600' };
    if (confidence >= 60) return { level: 'Sedang', color: 'text-yellow-600' };
    return { level: 'Rendah', color: 'text-red-600' };
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (studentError || !studentData) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Data Siswa Tidak Ditemukan</strong><br/>
              {studentError instanceof Error ? studentError.message : String(studentError)}<br/><br/>
              Silakan hubungi admin untuk menghubungkan akun Anda dengan data siswa.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Presensi Mandiri
          <Shield className="h-4 w-4 text-green-600" />
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

        {/* Security Level Indicator */}
        {locationValidation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Keamanan Lokasi:</span>
              <span className={getSecurityLevel()?.color}>
                {getSecurityLevel()?.level} ({locationValidation.confidence}%)
              </span>
            </div>
            {locationValidation.warnings.length > 0 && (
              <div className="mt-2 text-sm text-red-600">
                <div className="font-medium">Peringatan:</div>
                <ul className="list-disc list-inside">
                  {locationValidation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Location Status with Refresh Button */}
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
              Akurasi GPS: {Math.round(position.coords.accuracy || 0)} meter
            </div>
          )}
        </div>

        {/* Time-based warnings */}
        {isLateForCheckIn() && !todayAttendance?.check_in_time && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anda terlambat! Presensi masuk akan dicatat sebagai terlambat.
            </AlertDescription>
          </Alert>
        )}

        {isAfterHours() && !todayAttendance?.check_out_time && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Waktu sudah lewat jam 17:15. Pastikan Anda memiliki izin kegiatan yang berlaku.
            </AlertDescription>
          </Alert>
        )}

        {schedule && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Jadwal Hari Ini: {schedule.name}</div>
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
                <CheckCircle className={`h-4 w-4 ${todayAttendance.status === 'late' ? 'text-red-500' : 'text-green-500'}`} />
                <span>Check In: {todayAttendance.check_in_time} {todayAttendance.status === 'late' && '(Terlambat)'}</span>
              </div>
            )}
            {todayAttendance.check_out_time && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Check Out: {todayAttendance.check_out_time}</span>
              </div>
            )}
            {todayAttendance.notes && (
              <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                {todayAttendance.notes}
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
            {loading ? "Memproses..." : "Check In"}
          </Button>
          
          <Button
            onClick={handleCheckOut}
            disabled={!canCheckOut() || loading}
            className="w-full"
            variant={canCheckOut() ? "default" : "secondary"}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {loading ? "Memproses..." : "Check Out"}
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <div>• Pastikan GPS aktif dan lokasi akurat</div>
          <div>• Check In harus di dalam area sekolah</div>
          <div>• Keterlambatan akan dicatat otomatis</div>
          <div>• Pulang setelah jam 17:15 perlu izin kegiatan</div>
          <div>• Sistem anti-fake GPS aktif</div>
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
