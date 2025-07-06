
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

// Simple local interface to avoid type recursion
interface EnrollmentRequestData {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class?: string;
  extracurricular_name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

interface EnrollmentRequestsListProps {
  requests: EnrollmentRequestData[];
  onApprove: (requestId: string, approved: boolean) => void;
}

export const EnrollmentRequestsList: React.FC<EnrollmentRequestsListProps> = ({
  requests,
  onApprove
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permohonan Pendaftaran</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Belum ada permohonan pendaftaran
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-medium">{request.student_name}</div>
                    <div className="text-sm text-muted-foreground">
                      NIS: {request.student_nis}
                      {request.student_class && ` • Kelas: ${request.student_class}`}
                    </div>
                    <div className="text-sm">
                      Mengajukan ke: <span className="font-medium">{request.extracurricular_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Diajukan: {new Date(request.requested_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      request.status === 'pending' ? 'secondary' :
                      request.status === 'approved' ? 'default' : 'destructive'
                    }>
                      {request.status === 'pending' ? 'Menunggu' :
                       request.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </Badge>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onApprove(request.id, true)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Setujui
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onApprove(request.id, false)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
