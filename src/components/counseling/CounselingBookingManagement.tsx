
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Clock, User, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CounselingBooking {
  id: string;
  student_id: string;
  counselor_id: string;
  requested_date: string;
  requested_time: string;
  priority_level: string;
  booking_reason: string;
  student_notes: string | null;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  student: {
    full_name: string;
    nis: string;
    current_class?: { name: string };
    phone?: string;
  };
}

export const CounselingBookingManagement = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<CounselingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState<{[key: string]: string}>({});

  const canManageBookings = hasRole('guru_bk') || hasRole('admin') || hasRole('waka_kesiswaan');

  useEffect(() => {
    if (canManageBookings) {
      fetchBookings();
    }
  }, [user, canManageBookings]);

  const fetchBookings = async () => {
    if (!user?.id) return;

    try {
      let query = supabase
        .from('counseling_bookings')
        .select(`
          *,
          student:students (
            full_name,
            nis,
            phone,
            current_class:classes (name)
          )
        `)
        .order('created_at', { ascending: false });

      // If user is counselor, only show their bookings
      if (hasRole('guru_bk') && !hasRole('admin')) {
        query = query.eq('counselor_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Normalize the data structure
      const normalizedBookings = data?.map(booking => ({
        ...booking,
        student: {
          ...booking.student,
          current_class: Array.isArray(booking.student.current_class) 
            ? booking.student.current_class[0] 
            : booking.student.current_class
        }
      })) || [];

      setBookings(normalizedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data booking konseling",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'cancel', notes?: string) => {
    setProcessingId(bookingId);
    
    try {
      const updateData: any = {
        status: action === 'confirm' ? 'confirmed' : 'cancelled'
      };

      if (action === 'confirm') {
        updateData.confirmed_at = new Date().toISOString();
        
        // Create counseling session
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          const { error: sessionError } = await supabase
            .from('counseling_sessions')
            .insert({
              student_id: booking.student_id,
              counselor_id: booking.counselor_id,
              session_date: booking.requested_date,
              session_time: booking.requested_time,
              session_type: 'individual',
              topic: booking.booking_reason,
              status: 'scheduled',
              booking_status: 'confirmed',
              session_location: 'Ruang BK',
              is_emergency: booking.priority_level === 'urgent'
            });

          if (sessionError) throw sessionError;
        }
      }

      const { error } = await supabase
        .from('counseling_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Booking ${action === 'confirm' ? 'dikonfirmasi' : 'dibatalkan'}`
      });

      fetchBookings();
      
      // Clear notes
      setResponseNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[bookingId];
        return newNotes;
      });

    } catch (error) {
      console.error('Error processing booking:', error);
      toast({
        title: "Error",
        description: "Gagal memproses booking",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
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

  const getStatusBadge = (status: string) => {
    const badges = {
      'pending': <Badge variant="outline" className="text-yellow-600 border-yellow-300">Menunggu</Badge>,
      'confirmed': <Badge className="bg-green-100 text-green-800">Dikonfirmasi</Badge>,
      'cancelled': <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>,
      'completed': <Badge className="bg-blue-100 text-blue-800">Selesai</Badge>,
      'no_show': <Badge className="bg-gray-100 text-gray-800">Tidak Hadir</Badge>
    };
    return badges[status as keyof typeof badges];
  };

  const getBookingsByStatus = (status: string) => {
    return bookings.filter(booking => booking.status === status);
  };

  if (!canManageBookings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Anda tidak memiliki akses untuk mengelola booking konseling</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const BookingCard = ({ booking }: { booking: CounselingBooking }) => (
    <Card key={booking.id} className="border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                {booking.student.full_name} - {booking.student.nis}
              </h3>
              <p className="text-sm text-gray-600">
                {booking.student.current_class?.name} | 
                {format(new Date(booking.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {getPriorityBadge(booking.priority_level)}
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Schedule Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4" />
              Jadwal Konseling
            </div>
            <p className="text-sm">
              {format(new Date(booking.requested_date), 'EEEE, dd MMMM yyyy', { locale: id })} 
              <span className="mx-2">•</span>
              {booking.requested_time}
            </p>
          </div>

          {/* Booking Details */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Alasan Booking:</div>
            <p className="text-sm bg-white p-3 border rounded-lg">{booking.booking_reason}</p>
          </div>

          {booking.student_notes && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Catatan Siswa:</div>
              <p className="text-sm bg-white p-3 border rounded-lg">{booking.student_notes}</p>
            </div>
          )}

          {/* Priority Alert */}
          {booking.priority_level === 'urgent' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Booking Mendesak</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Booking ini memerlukan perhatian prioritas. Hubungi siswa segera jika diperlukan.
              </p>
            </div>
          )}

          {/* Action Buttons for Pending Bookings */}
          {booking.status === 'pending' && (
            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label htmlFor={`notes-${booking.id}`}>Catatan Response (Opsional)</Label>
                <Textarea
                  id={`notes-${booking.id}`}
                  placeholder="Berikan catatan untuk siswa..."
                  value={responseNotes[booking.id] || ''}
                  onChange={(e) => setResponseNotes(prev => ({
                    ...prev,
                    [booking.id]: e.target.value
                  }))}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => handleBookingAction(booking.id, 'confirm', responseNotes[booking.id])}
                  disabled={processingId === booking.id}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {processingId === booking.id ? 'Memproses...' : 'Konfirmasi'}
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => handleBookingAction(booking.id, 'cancel', responseNotes[booking.id])}
                  disabled={processingId === booking.id}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Batalkan
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Manajemen Booking Konseling ({bookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Menunggu ({getBookingsByStatus('pending').length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Dikonfirmasi ({getBookingsByStatus('confirmed').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Selesai ({getBookingsByStatus('completed').length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Dibatalkan ({getBookingsByStatus('cancelled').length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4 mt-6">
              {getBookingsByStatus('pending').map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
              {getBookingsByStatus('pending').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada booking yang menunggu konfirmasi</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="confirmed" className="space-y-4 mt-6">
              {getBookingsByStatus('confirmed').map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
              {getBookingsByStatus('confirmed').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada booking yang dikonfirmasi</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4 mt-6">
              {getBookingsByStatus('completed').map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
              {getBookingsByStatus('completed').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada sesi konseling yang selesai</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cancelled" className="space-y-4 mt-6">
              {getBookingsByStatus('cancelled').map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
              {getBookingsByStatus('cancelled').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <XCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada booking yang dibatalkan</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
