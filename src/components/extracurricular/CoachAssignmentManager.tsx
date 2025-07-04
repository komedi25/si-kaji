
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ExtracurricularCoach {
  id: string;
  extracurricular_id: string;
  coach_id: string;
  is_active: boolean;
  assigned_at: string;
  extracurriculars: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

interface Coach {
  id: string;
  full_name: string;
}

interface Extracurricular {
  id: string;
  name: string;
}

export const CoachAssignmentManager = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExtracurricular, setSelectedExtracurricular] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');

  // Fetch extracurriculars
  const { data: extracurriculars } = useQuery({
    queryKey: ['extracurriculars-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Extracurricular[];
    }
  });

  // Fetch coaches (users with pelatih_ekstrakurikuler role)
  const { data: coaches } = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles!inner(id, full_name)
        `)
        .eq('role', 'pelatih_ekstrakurikuler')
        .eq('is_active', true);
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.user_id,
        full_name: item.profiles.full_name
      })) as Coach[];
    }
  });

  // Fetch coach assignments
  const { data: assignments, refetch: refetchAssignments } = useQuery({
    queryKey: ['coach-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extracurricular_coaches')
        .select(`
          *,
          extracurriculars(name),
          profiles(full_name)
        `)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return data as ExtracurricularCoach[];
    }
  });

  const assignCoachMutation = useMutation({
    mutationFn: async ({ extracurricularId, coachId }: { extracurricularId: string; coachId: string }) => {
      const { error } = await supabase
        .from('extracurricular_coaches')
        .insert({
          extracurricular_id: extracurricularId,
          coach_id: coachId,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Pelatih berhasil ditugaskan"
      });
      setSelectedExtracurricular('');
      setSelectedCoach('');
      refetchAssignments();
    },
    onError: (error) => {
      console.error('Error assigning coach:', error);
      toast({
        title: "Error",
        description: "Gagal menugaskan pelatih",
        variant: "destructive"
      });
    }
  });

  const removeCoachMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('extracurricular_coaches')
        .update({ is_active: false })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Penugasan pelatih berhasil dihapus"
      });
      refetchAssignments();
    },
    onError: (error) => {
      console.error('Error removing coach assignment:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus penugasan pelatih",
        variant: "destructive"
      });
    }
  });

  const handleAssignCoach = () => {
    if (!selectedExtracurricular || !selectedCoach) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Pilih ekstrakurikuler dan pelatih terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    // Check if assignment already exists
    const existingAssignment = assignments?.find(
      a => a.extracurricular_id === selectedExtracurricular && a.coach_id === selectedCoach && a.is_active
    );

    if (existingAssignment) {
      toast({
        title: "Pelatih Sudah Ditugaskan",
        description: "Pelatih sudah ditugaskan untuk ekstrakurikuler ini",
        variant: "destructive"
      });
      return;
    }

    assignCoachMutation.mutate({
      extracurricularId: selectedExtracurricular,
      coachId: selectedCoach
    });
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    removeCoachMutation.mutate(assignmentId);
  };

  if (!hasRole('admin') && !hasRole('koordinator_ekstrakurikuler') && !hasRole('waka_kesiswaan')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-orange-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Akses Terbatas</h3>
              <p className="text-gray-500 mt-2">
                Anda tidak memiliki akses untuk mengelola penugasan pelatih. 
                Fitur ini hanya tersedia untuk koordinator dan administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Tugaskan Pelatih
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                value={selectedExtracurricular}
                onValueChange={setSelectedExtracurricular}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Ekstrakurikuler" />
                </SelectTrigger>
                <SelectContent>
                  {extracurriculars?.map((extra) => (
                    <SelectItem key={extra.id} value={extra.id}>
                      {extra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select
                value={selectedCoach}
                onValueChange={setSelectedCoach}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Pelatih" />
                </SelectTrigger>
                <SelectContent>
                  {coaches?.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAssignCoach}
              disabled={!selectedExtracurricular || !selectedCoach || assignCoachMutation.isPending}
            >
              {assignCoachMutation.isPending ? 'Menugaskan...' : 'Tugaskan Pelatih'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Daftar Penugasan Pelatih
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments && assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {assignment.extracurriculars.name}
                    </Badge>
                    <span className="font-medium">
                      {assignment.profiles.full_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      Ditugaskan: {new Date(assignment.assigned_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAssignment(assignment.id)}
                    disabled={removeCoachMutation.isPending}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Belum ada penugasan pelatih
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
