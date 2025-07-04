
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudentDetails } from '@/hooks/useStudentData';
import { FileText, Calendar, Clock, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PermitForm } from '@/components/permits/PermitForm';
import { StudentDataError } from './StudentDataError';

interface StudentPermit {
  id: string;
  permit_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
  supporting_document_url?: string;
  approval_letter_url?: string;
}

export const StudentPermitManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: studentData, isLoading: studentLoading, error: studentError, refetch } = useStudentDetails(user?.id || null);
  const [permits, setPermits] = useState<StudentPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (studentData?.id) {
      fetchPermits();
    }
  }, [studentData]);

  const fetchPermits = async () => {
    if (!studentData?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('student_permits')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPermits(data || []);
    } catch (error) {
      console.error('Error fetching permits:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data perizinan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      expired: 'outline'
    } as const;

    const labels = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      expired: 'Kedaluwarsa'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPermitTypeLabel = (type: string) => {
    const labels = {
      sakit: 'Sakit',
      izin: 'Izin',
      dispensasi: 'Dispensasi',
      lainnya: 'Lainnya'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (studentError || !studentData) {
    return <StudentDataError error={studentError || 'Unknown error'} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Perizinan Siswa</h2>
          <p className="text-gray-600">
            Ajukan permohonan izin dan pantau status persetujuan
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Tutup Form' : 'Ajukan Izin'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Permohonan Izin</CardTitle>
          </CardHeader>
          <CardContent>
            <PermitForm 
              studentId={studentData.id}
              onSuccess={() => {
                setShowForm(false);
                fetchPermits();
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Riwayat Perizinan</h3>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : permits.length > 0 ? (
          permits.map((permit) => (
            <Card key={permit.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {getPermitTypeLabel(permit.permit_type)}
                  </span>
                  {getStatusBadge(permit.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Alasan:</p>
                  <p className="text-sm text-gray-600">{permit.reason}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(permit.start_date), 'dd MMM yyyy', { locale: id })} - 
                      {format(new Date(permit.end_date), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Diajukan: {format(new Date(permit.submitted_at), 'dd/MM/yyyy HH:mm', { locale: id })}</span>
                  </div>
                </div>

                {permit.reviewed_at && (
                  <div className="text-sm">
                    <strong>Ditinjau:</strong> {format(new Date(permit.reviewed_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                  </div>
                )}

                {permit.review_notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-gray-700 font-medium">Catatan:</div>
                    <div className="text-gray-600 text-sm mt-1">{permit.review_notes}</div>
                  </div>
                )}

                {permit.status === 'approved' && permit.approval_letter_url && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-700 text-sm">
                      ✅ Izin disetujui! 
                      <Button variant="link" className="p-0 h-auto text-green-600" asChild>
                        <a href={permit.approval_letter_url} target="_blank" rel="noopener noreferrer">
                          Download Surat Izin
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {permit.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-700 text-sm">
                      ❌ Permohonan izin ditolak
                    </div>
                  </div>
                )}

                {permit.status === 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-blue-700 text-sm">
                      🔍 Permohonan sedang dalam proses peninjauan
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Belum ada riwayat perizinan</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
