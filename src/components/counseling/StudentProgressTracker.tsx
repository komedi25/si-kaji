import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Users, Clock, TrendingUp, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface StudentProgress {
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class: string;
  risk_level: string;
  total_violations: number;
  recent_violations: number;
  counseling_sessions: number;
  last_session: string | null;
  progress_status: string;
  next_action: string;
  referral_source: string;
  assigned_counselor: string;
}

interface ProgressMetrics {
  improvement_score: number;
  attendance_trend: string;
  behavior_trend: string;
  academic_trend: string;
  last_updated: string;
}

export const StudentProgressTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null);

  useEffect(() => {
    fetchProblematicStudents();
  }, [filter]);

  const fetchProblematicStudents = async () => {
    try {
      setLoading(true);
      
      // Get students basic data first
      const { data: studentsData, error } = await (supabase as any)
        .from('students')
        .select('id, full_name, nis')
        .eq('is_active', true);

      if (error) throw error;

      if (!studentsData) {
        setStudents([]);
        return;
      }

      // Process each student to calculate risk levels and progress
      const processedStudents = await Promise.all(
        studentsData.map(async (student) => {
          // Get violations for this student
          const { data: violations } = await supabase
            .from('student_violations')
            .select('violation_date, status')
            .eq('student_id', student.id)
            .eq('status', 'active');

          const activeViolations = violations || [];
          const recentViolations = activeViolations.filter(v => 
            new Date(v.violation_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          );

          // Get counseling sessions for this student
          const { data: sessions } = await supabase
            .from('counseling_sessions')
            .select('session_date, status')
            .eq('student_id', student.id);

          const counselingSessions = sessions || [];
          const lastSession = counselingSessions.length > 0 
            ? counselingSessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0]
            : null;

          // Get referrals for this student
          const { data: referrals } = await supabase
            .from('counseling_referrals')
            .select('referral_type, status, assigned_counselor')
            .eq('student_id', student.id)
            .eq('status', 'active');

          const activeReferrals = referrals || [];
          
          // Calculate risk level
          let riskLevel = 'low';
          if (activeViolations.length >= 5 || recentViolations.length >= 3) {
            riskLevel = 'critical';
          } else if (activeViolations.length >= 3 || recentViolations.length >= 2) {
            riskLevel = 'high';
          } else if (activeViolations.length >= 1) {
            riskLevel = 'medium';
          }

          // Determine progress status
          let progressStatus = 'stable';
          if (recentViolations.length > activeViolations.length / 2) {
            progressStatus = 'declining';
          } else if (counselingSessions.length > 0 && recentViolations.length === 0) {
            progressStatus = 'improving';
          }

          // Next action recommendation
          let nextAction = 'monitor';
          if (riskLevel === 'critical') {
            nextAction = 'immediate_intervention';
          } else if (riskLevel === 'high' && counselingSessions.length === 0) {
            nextAction = 'schedule_counseling';
          } else if (counselingSessions.length > 0 && !lastSession) {
            nextAction = 'follow_up';
          }

          return {
            student_id: student.id,
            student_name: student.full_name,
            student_nis: student.nis,
            student_class: 'Kelas tidak tersedia',
            risk_level: riskLevel,
            total_violations: activeViolations.length,
            recent_violations: recentViolations.length,
            counseling_sessions: counselingSessions.length,
            last_session: lastSession?.session_date || null,
            progress_status: progressStatus,
            next_action: nextAction,
            referral_source: activeReferrals[0]?.referral_type || 'none',
            assigned_counselor: activeReferrals[0]?.assigned_counselor || ''
          };
        })
      );

      // Filter students based on criteria
      const filteredStudents = processedStudents
        .filter(student => {
          // Filter out students with no issues unless showing all
          if (filter === 'all') return true;
          if (filter === 'high_risk') return ['high', 'critical'].includes(student.risk_level);
          if (filter === 'needs_attention') return student.next_action !== 'monitor';
          if (filter === 'improving') return student.progress_status === 'improving';
          if (filter === 'declining') return student.progress_status === 'declining';
          return student.risk_level !== 'low' || student.total_violations > 0;
        })
        .filter(student => 
          searchTerm === '' || 
          student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.student_nis.includes(searchTerm)
        )
        .sort((a, b) => {
          // Sort by risk level and recent activity
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return riskOrder[b.risk_level as keyof typeof riskOrder] - riskOrder[a.risk_level as keyof typeof riskOrder];
        });

      setStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching problematic students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa bermasalah",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressMetrics = async (studentId: string) => {
    try {
      // This would typically involve more complex analytics
      // For now, we'll simulate progress metrics
      const mockMetrics: ProgressMetrics = {
        improvement_score: Math.floor(Math.random() * 100),
        attendance_trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)],
        behavior_trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)],
        academic_trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)],
        last_updated: new Date().toISOString()
      };

      setProgressMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching progress metrics:', error);
    }
  };

  const handleCreateReferral = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('counseling_referrals')
        .insert({
          student_id: studentId,
          referred_by: user?.id,
          referral_type: 'behavioral',
          urgency_level: 'high',
          referral_reason: 'Multiple violations detected - requires immediate attention',
          assigned_counselor: user?.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Referral konseling berhasil dibuat"
      });

      fetchProblematicStudents();
    } catch (error) {
      console.error('Error creating referral:', error);
      toast({
        title: "Error",
        description: "Gagal membuat referral",
        variant: "destructive"
      });
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      low: 'Rendah',
      medium: 'Sedang', 
      high: 'Tinggi',
      critical: 'Kritis'
    };

    return (
      <Badge className={colors[risk as keyof typeof colors]}>
        {labels[risk as keyof typeof labels]}
      </Badge>
    );
  };

  const getProgressBadge = (status: string) => {
    const colors = {
      improving: 'bg-green-100 text-green-800',
      stable: 'bg-blue-100 text-blue-800',
      declining: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      improving: 'Membaik',
      stable: 'Stabil',
      declining: 'Menurun'
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getActionButton = (student: StudentProgress) => {
    switch (student.next_action) {
      case 'immediate_intervention':
        return (
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => handleCreateReferral(student.student_id)}
            className="flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Intervensi Darurat
          </Button>
        );
      case 'schedule_counseling':
        return (
          <Button 
            size="sm"
            onClick={() => handleCreateReferral(student.student_id)}
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Jadwalkan Konseling
          </Button>
        );
      case 'follow_up':
        return (
          <Button size="sm" variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Follow Up
          </Button>
        );
      default:
        return (
          <Button size="sm" variant="ghost" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Monitor
          </Button>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pelacakan Progress Siswa Bermasalah
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Cari nama siswa atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-64"
            />
            
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'high_risk', label: 'Risiko Tinggi' },
                { value: 'needs_attention', label: 'Perlu Perhatian' },
                { value: 'improving', label: 'Membaik' },
                { value: 'declining', label: 'Menurun' }
              ].map((filterOption) => (
                <Button
                  key={filterOption.value}
                  variant={filter === filterOption.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(filterOption.value)}
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Students List */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada siswa yang memerlukan perhatian khusus</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <Card 
                  key={student.student_id} 
                  className={`border-l-4 ${
                    student.risk_level === 'critical' ? 'border-l-red-500' :
                    student.risk_level === 'high' ? 'border-l-orange-500' :
                    student.risk_level === 'medium' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{student.student_name}</h3>
                          <span className="text-sm text-gray-500">{student.student_nis}</span>
                          <span className="text-sm text-gray-500">| {student.student_class}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {getRiskBadge(student.risk_level)}
                          {getProgressBadge(student.progress_status)}
                          
                          {student.total_violations > 0 && (
                            <Badge variant="outline">
                              {student.total_violations} Pelanggaran
                            </Badge>
                          )}
                          
                          {student.recent_violations > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              {student.recent_violations} Baru (30 hari)
                            </Badge>
                          )}
                          
                          {student.counseling_sessions > 0 && (
                            <Badge className="bg-blue-100 text-blue-800">
                              {student.counseling_sessions} Sesi Konseling
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          {student.last_session && (
                            <p>Sesi terakhir: {format(new Date(student.last_session), 'dd MMM yyyy', { locale: localeId })}</p>
                          )}
                          {student.referral_source !== 'none' && (
                            <p>Sumber referral: {student.referral_source}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        {getActionButton(student)}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            fetchProgressMetrics(student.student_id);
                          }}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Detail Progress
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Detail Modal/Card */}
      {selectedStudent && progressMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detail Progress: {selectedStudent.student_name}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {progressMetrics.improvement_score}%
                </div>
                <div className="text-sm text-gray-600">Skor Perbaikan</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {getProgressBadge(progressMetrics.behavior_trend)}
                </div>
                <div className="text-sm text-gray-600">Tren Perilaku</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {getProgressBadge(progressMetrics.attendance_trend)}
                </div>
                <div className="text-sm text-gray-600">Tren Kehadiran</div>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              Data terakhir diperbarui: {format(new Date(progressMetrics.last_updated), 'dd MMM yyyy, HH:mm', { locale: localeId })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};