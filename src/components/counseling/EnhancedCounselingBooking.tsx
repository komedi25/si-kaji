import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, Clock, User, AlertTriangle } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';

interface CounselorSchedule {
  id: string;
  counselor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_sessions_per_slot: number;
  counselor: {
    full_name: string;
  } | null;
}

interface ExistingBooking {
  requested_date: string;
  requested_time: string;
  status: string;
}

export const EnhancedCounselingBooking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [counselorSchedules, setCounselorSchedules] = useState<CounselorSchedule[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  const [formData, setFormData] = useState({
    priority_level: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    booking_reason: '',
    student_notes: ''
  });

  useEffect(() => {
    fetchCounselorSchedules();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedCounselor) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedCounselor]);

  const fetchCounselorSchedules = async () => {
    try {
      // First, get the schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('counseling_schedules')
        .select('*')
        .eq('is_active', true);

      if (schedulesError) throw schedulesError;

      // Then, for each schedule, get the counselor info
      const schedulesWithCounselor: CounselorSchedule[] = [];
      
      for (const schedule of schedules || []) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', schedule.counselor_id)
          .single();

        schedulesWithCounselor.push({
          ...schedule,
          counselor: profile ? { full_name: profile.full_name } : null
        });
      }
      
      setCounselorSchedules(schedulesWithCounselor);
    } catch (error) {
      console.error('Error fetching counselor schedules:', error);
      setCounselorSchedules([]);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedCounselor) return;

    try {
      const dayOfWeek = selectedDate.getDay();
      const selectedSchedule = counselorSchedules.find(
        s => s.counselor_id === selectedCounselor && s.day_of_week === dayOfWeek
      );

      if (!selectedSchedule) {
        setAvailableSlots([]);
        return;
      }

      // Generate time slots between start and end time
      const slots = generateTimeSlots(selectedSchedule.start_time, selectedSchedule.end_time);
      
      // Check existing bookings for this date and counselor
      const { data: bookings, error } = await supabase
        .from('counseling_bookings')
        .select('requested_date, requested_time, status')
        .eq('counselor_id', selectedCounselor)
        .eq('requested_date', format(selectedDate, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;

      const validBookings: ExistingBooking[] = bookings?.map(booking => ({
        requested_date: booking.requested_date,
        requested_time: booking.requested_time,
        status: booking.status
      })) || [];

      const bookedTimes = validBookings.map(b => b.requested_time);
      const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));
      
      setAvailableSlots(availableSlots);
      setExistingBookings(validBookings);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
      setExistingBookings([]);
    }
  };

  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots = [];
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    while (start < end) {
      slots.push(format(start, 'HH:mm'));
      start.setMinutes(start.getMinutes() + 30); // 30-minute slots
    }
    
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate || !selectedCounselor || !selectedTime) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw studentError;

      const { error } = await supabase
        .from('counseling_bookings')
        .insert({
          student_id: studentData.id,
          counselor_id: selectedCounselor,
          requested_date: format(selectedDate, 'yyyy-MM-dd'),
          requested_time: selectedTime,
          priority_level: formData.priority_level,
          booking_reason: formData.booking_reason,
          student_notes: formData.student_notes
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Booking konseling berhasil diajukan dan menunggu konfirmasi"
      });

      // Reset form
      setFormData({
        priority_level: 'normal',
        booking_reason: '',
        student_notes: ''
      });
      setSelectedDate(undefined);
      setSelectedCounselor('');
      setSelectedTime('');
      setAvailableSlots([]);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Gagal membuat booking konseling",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (level: string) => {
    const badges = {
      'low': <Badge className="bg-blue-100 text-blue-800">Rendah</Badge>,
      'normal': <Badge className="bg-green-100 text-green-800">Normal</Badge>,
      'high': <Badge className="bg-yellow-100 text-yellow-800">Tinggi</Badge>,
      'urgent': <Badge className="bg-red-100 text-red-800">Mendesak</Badge>
    };
    return badges[level as keyof typeof badges];
  };

  const getAvailableCounselors = () => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const counselors = counselorSchedules
      .filter(schedule => schedule.day_of_week === dayOfWeek && schedule.counselor)
      .map(schedule => ({
        id: schedule.counselor_id,
        name: schedule.counselor?.full_name || 'Unknown',
        schedule: `${schedule.start_time} - ${schedule.end_time}`
      }));
    
    return counselors.filter((counselor, index, self) => 
      index === self.findIndex(c => c.id === counselor.id)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Booking Konseling BK
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Priority Level */}
          <div>
            <Label htmlFor="priority">Tingkat Prioritas</Label>
            <Select
              value={formData.priority_level}
              onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                setFormData({ ...formData, priority_level: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Rendah - Konsultasi umum</SelectItem>
                <SelectItem value="normal">Normal - Bimbingan rutin</SelectItem>
                <SelectItem value="high">Tinggi - Perlu perhatian khusus</SelectItem>
                <SelectItem value="urgent">Mendesak - Situasi darurat</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2">
              {getPriorityBadge(formData.priority_level)}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <Label>Pilih Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: id }) : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Counselor Selection */}
          {selectedDate && (
            <div>
              <Label>Pilih Konselor BK</Label>
              <Select value={selectedCounselor} onValueChange={setSelectedCounselor}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih konselor yang tersedia" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCounselors().map((counselor) => (
                    <SelectItem key={counselor.id} value={counselor.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{counselor.name}</span>
                        <span className="text-sm text-gray-500">({counselor.schedule})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time Slot Selection */}
          {selectedCounselor && availableSlots.length > 0 && (
            <div>
              <Label>Pilih Waktu</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedTime === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(slot)}
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Booking Reason */}
          <div>
            <Label htmlFor="reason">Alasan Booking Konseling *</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan Anda ingin melakukan konseling..."
              value={formData.booking_reason}
              onChange={(e) => setFormData({ ...formData, booking_reason: e.target.value })}
              required
              className="min-h-[100px]"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Informasi tambahan yang ingin Anda sampaikan..."
              value={formData.student_notes}
              onChange={(e) => setFormData({ ...formData, student_notes: e.target.value })}
            />
          </div>

          {/* Priority Alert */}
          {formData.priority_level === 'urgent' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Booking Mendesak</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Booking dengan prioritas mendesak akan diprioritaskan dan Anda akan dihubungi segera.
                Pastikan nomor telepon Anda aktif.
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !selectedDate || !selectedCounselor || !selectedTime || !formData.booking_reason}
            className="w-full"
          >
            {loading ? 'Memproses...' : 'Ajukan Booking Konseling'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
