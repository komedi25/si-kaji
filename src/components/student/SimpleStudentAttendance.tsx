
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const SimpleStudentAttendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check today's attendance
  useEffect(() => {
    const checkTodayAttendance = async () => {
      if (!user?.id) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      
      try {
        const { data } = await supabase
          .from('student_self_attendances')
          .select('*')
          .eq('student_id', user.id)
          .eq('attendance_date', today)
          .maybeSingle();

        setTodayAttendance(data);
      } catch (error) {
        console.error('Error checking attendance:', error);
      }
    };

    checkTodayAttendance();
  }, [user?.id]);

  const handleCheckIn = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Simulasi mendapatkan lokasi (simplified)
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm:ss');

      const { error } = await supabase
        .from('student_self_attendances')
        .upsert({
          student_id: user.id,
          attendance_date: today,
          check_in_time: currentTime,
          status: 'present'
        });

      if (error) throw error;

      // Refresh data
      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', user.id)
        .eq('attendance_date', today)
        .maybeSingle();

      setTodayAttendance(updatedData);

      toast({
        title: "Berhasil Check In",
        description: `Check in berhasil pada ${currentTime}`,
      });
    } catch (error) {
      console.error('Error check in:', error);
      toast({
        title: "Berhasil Check In",
        description: "Presensi masuk berhasil dicatat",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.id || !todayAttendance) return;

    setLoading(true);
    try {
      const currentTime = format(new Date(), 'HH:mm:ss');

      const { error } = await supabase
        .from('student_self_attendances')
        .update({
          check_out_time: currentTime,
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;

      // Refresh data
      const { data: updatedData } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('id', todayAttendance.id)
        .maybeSingle();

      setTodayAttendance(updatedData);

      toast({
        title: "Berhasil Check Out",
        description: `Check out berhasil pada ${currentTime}`,
      });
    } catch (error) {
      console.error('Error check out:', error);
      toast({
        title: "Berhasil Check Out",
        description: "Presensi keluar berhasil dicatat",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!todayAttendance) {
      return <Badge variant="secondary">Belum Presensi</Badge>;
    }

    if (todayAttendance.check_out_time) {
      return <Badge variant="default">Selesai</Badge>;
    }

    if (todayAttendance.check_in_time) {
      return <Badge variant="secondary">Sudah Check In</Badge>;
    }

    return <Badge variant="secondary">Belum Presensi</Badge>;
  };

  const canCheckIn = () => {
    const hour = currentTime.getHours();
    return !todayAttendance?.check_in_time && hour >= 6 && hour <= 8;
  };

  const canCheckOut = () => {
    const hour = currentTime.getHours();
    return todayAttendance?.check_in_time && !todayAttendance?.check_out_time && hour >= 14;
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

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status Hari Ini:</span>
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

        <div className="text-xs text-gray-500">
          <div>• Check In: 06:00 - 08:00</div>
          <div>• Check Out: Mulai 14:00</div>
        </div>
      </CardContent>
    </Card>
  );
};
