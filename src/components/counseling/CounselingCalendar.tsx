
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface CounselingCalendarProps {
  onDateSelect?: (date: Date) => void;
}

export const CounselingCalendar = ({ onDateSelect }: CounselingCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: sessions } = useQuery({
    queryKey: ['counseling-calendar', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('counseling_sessions')
        .select(`
          *,
          student:students!counseling_sessions_student_id_fkey(full_name),
          counselor:profiles!counseling_sessions_counselor_id_fkey(full_name)
        `)
        .gte('session_date', start)
        .lte('session_date', end)
        .order('session_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getSessionsForDate = (date: Date) => {
    return sessions?.filter(session => 
      isSameDay(new Date(session.session_date), date)
    ) || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Kalender Konseling
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: id })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const daySessions = getSessionsForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-1 border rounded cursor-pointer hover:bg-gray-50 ${
                  isToday ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onDateSelect?.(day)}
              >
                <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1 mt-1">
                  {daySessions.slice(0, 2).map((session, index) => (
                    <div
                      key={session.id}
                      className={`text-xs px-1 py-0.5 rounded text-white truncate ${getStatusColor(session.status)}`}
                      title={`${session.session_time} - ${session.student?.full_name}`}
                    >
                      {session.session_time}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{daySessions.length - 2} lagi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Terjadwal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Selesai</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Dibatalkan</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>Tidak Hadir</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
