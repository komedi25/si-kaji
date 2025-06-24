
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Shield, Brain, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudentData } from '@/hooks/useStudentData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { attendanceSecurityManager } from './SecurityEnhancements';
import { AdvancedGeofencing, advancedGeofenceValidator } from './AdvancedGeofencing';
import { MLPatternDetectorComponent, mlPatternDetector } from './MLPatternDetector';
import type { GeofenceValidation } from './AdvancedGeofencing';
import type { AttendancePattern } from './MLPatternDetector';

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
  device_fingerprint?: string;
}

export const EnhancedSelfAttendanceWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { studentData, loading: studentLoading, error: studentError, refetch } = useStudentData();
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [schedule, setSchedule] = useState<AttendanceSchedule | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<SelfAttendance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [geofenceValidation, setGeofenceValidation] = useState<GeofenceValidation | null>(null);
  const [patternAnalysis, setPatternAnalysis] = useState<AttendancePattern | null>(null);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

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
          console.log('Locations fetched:', locationsData);
          setLocations(locationsData || []);
        }

        // Fetch today's schedule
        const today = new Date();
        const dayOfWeek = today.getDay();
        console.log('Today is day:', dayOfWeek, 'Date:', today.toDateString());
        
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('attendance_schedules')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (scheduleError) {
          console.error('Error fetching schedule:', scheduleError);
          toast({
            title: "Error",
            description: "Gagal memuat jadwal presensi: " + scheduleError.message,
            variant: "destructive"
          });
        } else if (scheduleData) {
          setSchedule(scheduleData);
          console.log('Active schedule found:', scheduleData);
        } else {
          console.log('No active schedule found for today');
          setSchedule(null);
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
      console.log('Fetching attendance for student:', studentData.id, 'date:', today);
      
      const { data, error } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('attendance_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today attendance:', error);
      } else if (data) {
        console.log('Today attendance found:', data);
        setTodayAttendance(data);
      } else {
        console.log('No attendance record found for today');
        setTodayAttendance(null);
      }
    };

    fetchTodayAttendance();
  }, [studentData?.id]);

  // Enhanced location validation with multi-layer security
  const getCurrentLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung browser ini'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setPosition(position);
          
          // Multi-layer validation
          try {
            // 1. Basic security validation
            const basicValidation = attendanceSecurityManager.validateLocation(
              position.coords.latitude,
              position.coords.longitude,
              position.coords.accuracy
            );

            // 2. Advanced geofencing validation
            const advancedValidation = await advancedGeofenceValidator.validateLocation(
              position.coords.latitude,
              position.coords.longitude
            );

            setGeofenceValidation(advancedValidation);

            // Combine validations
            const combinedWarnings = [...basicValidation.reasons];
            if (!advancedValidation.overall.isValid) {
              combinedWarnings.push(...advancedValidation.overall.risks);
            }

            if (combinedWarnings.length > 0) {
              setSecurityWarnings(combinedWarnings);
              reject(new Error('Validasi keamanan gagal: ' + combinedWarnings.join(', ')));
              return;
            }

            setSecurityWarnings([]);
            resolve(position);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error('Gagal mendapatkan lokasi: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
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

  const handleCheckIn = async () => {
    if (!studentData?.id || !schedule) {
      toast({
        title: "Error",
        description: "Data siswa atau jadwal tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    const rateLimitCheck = attendanceSecurityManager.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Rate Limit",
        description: rateLimitCheck.reason,
        variant: "destructive"
      });
      return;
    }

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
      const deviceFingerprint = attendanceSecurityManager.generateDeviceFingerprint();

      const validationMetadata = {
        geofenceValidation: geofenceValidation,
        securityScore: geofenceValidation?.overall.score || 0,
        validationTimestamp: now.toISOString()
      };

      const { error } = await supabase
        .from('student_self_attendances')
        .upsert({
          student_id: studentData.id,
          attendance_date: today,
          check_in_time: currentTime,
          check_out_time: null,
          check_in_latitude: latitude,
          check_in_longitude: longitude,
          check_in_location_id: location.id,
          status: 'present',
          device_fingerprint: deviceFingerprint,
          notes: JSON.stringify(validationMetadata)
        });

      if (error) throw error;

      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('attendance_date', today)
        .maybeSingle();

      if (updatedData) {
        setTodayAttendance(updatedData);
      }

      toast({
        title: "Berhasil Check In",
        description: `Check in berhasil dengan validasi keamanan tingkat tinggi`,
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
    if (!studentData?.id || !todayAttendance) {
      toast({
        title: "Error",
        description: "Data siswa atau presensi hari ini tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    const rateLimitCheck = attendanceSecurityManager.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Rate Limit",
        description: rateLimitCheck.reason,
        variant: "destructive"
      });
      return;
    }

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

      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('id', todayAttendance.id)
        .maybeSingle();

      if (updatedData) {
        setTodayAttendance(updatedData);
      }

      toast({
        title: "Berhasil Check Out",
        description: `Check out berhasil dengan validasi keamanan tingkat tinggi`,
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

  const isWithinLocation = (lat: number, lng: number): AttendanceLocation | null => {
    for (const location of locations) {
      const distance = calculateDistance(lat, lng, location.latitude, location.longitude);
      if (distance <= location.radius_meters) {
        return location;
      }
    }
    return null;
  };

  const canCheckIn = () => {
    if (!schedule || todayAttendance?.check_in_time) return false;
    
    const now = format(currentTime, 'HH:mm:ss');
    const result = now >= schedule.check_in_start && now <= schedule.check_in_end;
    console.log('canCheckIn check:', { now, start: schedule.check_in_start, end: schedule.check_in_end, result });
    return result;
  };

  const canCheckOut = () => {
    if (!schedule || !todayAttendance?.check_in_time || todayAttendance?.check_out_time) return false;
    
    const now = format(currentTime, 'HH:mm:ss');
    const result = now >= schedule.check_out_start && now <= schedule.check_out_end;
    console.log('canCheckOut check:', { now, start: schedule.check_out_start, end: schedule.check_out_end, result });
    return result;
  };

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

  const getSecurityLevel = () => {
    if (!geofenceValidation) return null;
    
    const score = geofenceValidation.overall.score;
    if (score >= 80) return { level: 'Tinggi', color: 'text-green-600' };
    if (score >= 60) return { level: 'Sedang', color: 'text-yellow-600' };
    return { level: 'Rendah', color: 'text-red-600' };
  };

  // Debug information
  console.log('Widget state:', { 
    schedule, 
    studentId: studentData?.id, 
    todayAttendance, 
    currentTime: format(currentTime, 'HH:mm:ss'),
    canCheckIn: canCheckIn(),
    canCheckOut: canCheckOut()
  });

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
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Siswa Tidak Ditemukan</strong><br/>
                User ID: {user?.id}<br/>
                Email: {user?.email}<br/>
                Error: {studentError}<br/><br/>
                <strong>Debug Information:</strong><br/>
                Sistem tidak dapat menemukan data siswa yang terhubung dengan akun Anda.
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Langkah Troubleshooting:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Pastikan data siswa sudah ada di database</li>
                <li>Periksa apakah NIS di profil akun sesuai dengan NIS di data siswa</li>
                <li>Periksa apakah nama di profil akun sesuai dengan nama di data siswa</li>
                <li>Hubungi admin untuk menghubungkan akun secara manual</li>
              </ol>
              
              <div className="mt-3 p-3 bg-white rounded border">
                <h5 className="font-medium text-blue-800 text-xs mb-1">Info Debug:</h5>
                <div className="text-xs text-blue-600 space-y-1">
                  <div>User ID: {user?.id}</div>
                  <div>Email: {user?.email}</div>
                  <div>Student Error: {studentError}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={refetch} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Presensi Mandiri Enhanced
            <Shield className="h-4 w-4 text-green-600" />
            <Brain className="h-4 w-4 text-purple-600" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debug Info */}
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

          {/* Security warnings */}
          {securityWarnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Peringatan Keamanan:</span>
              </div>
              <ul className="mt-1 text-sm text-red-600">
                {securityWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Level Indicator */}
          {geofenceValidation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Security Level:</span>
                <span className={getSecurityLevel()?.color}>
                  {getSecurityLevel()?.level} ({geofenceValidation.overall.score}/100)
                </span>
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
              disabled={!canCheckIn() || loading || !studentData?.id || !schedule}
              className="w-full"
              variant={canCheckIn() && studentData?.id && schedule ? "default" : "secondary"}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {loading ? "Memproses..." : "Check In Enhanced"}
            </Button>
            
            <Button
              onClick={handleCheckOut}
              disabled={!canCheckOut() || loading || !studentData?.id}
              className="w-full"
              variant={canCheckOut() && studentData?.id ? "default" : "secondary"}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {loading ? "Memproses..." : "Check Out Enhanced"}
            </Button>
          </div>

          <Button
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            variant="outline"
            className="w-full"
          >
            {showAdvancedTools ? 'Sembunyikan' : 'Tampilkan'} Advanced Tools
          </Button>

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

          <div className="text-xs text-gray-400 border-t pt-2">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <Brain className="h-3 w-3" />
              <span>Enhanced Security: Multi-layer validation + AI Pattern Detection</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Tools */}
      {showAdvancedTools && (
        <div className="space-y-4">
          <AdvancedGeofencing onValidation={setGeofenceValidation} />
          
          {studentData?.id && (
            <MLPatternDetectorComponent 
              studentId={studentData.id} 
              onPatternAnalyzed={setPatternAnalysis}
            />
          )}
        </div>
      )}
    </div>
  );
};
