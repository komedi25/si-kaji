import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, AlertTriangle, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ViolationReferral {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  violation_count: number;
  latest_violation: string;
  violation_types: string[];
  referral_reason: string;
  urgency_level: string;
  status: string;
  created_at: string;
  assigned_counselor?: string;
}

interface AutoReferralRule {
  id: string;
  name: string;
  violation_threshold: number;
  time_period_days: number;
  violation_types: string[];
  auto_assign: boolean;
  urgency_level: string;
  is_active: boolean;
}

export const ViolationReferralSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<ViolationReferral[]>([]);
  const [rules, setRules] = useState<AutoReferralRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingReferral, setProcessingReferral] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
    fetchAutoReferralRules();
    
    // Set up real-time subscription for new violations
    const violationChannel = supabase
      .channel('violation-referrals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_violations'
        },
        () => {
          checkForAutoReferrals();
          fetchReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(violationChannel);
    };
  }, []);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('counseling_referrals')
        .select(`
          id,
          student_id,
          referral_reason,
          urgency_level,
          status,
          created_at,
          assigned_counselor,
          students (
            full_name,
            nis
          )
        `)
        .eq('referral_type', 'violation')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get violation details for each referral
      const enrichedReferrals = await Promise.all(
        (data || []).map(async (referral) => {
          const { data: violations } = await supabase
            .from('student_violations')
            .select(`
              violation_date,
              violation_types (name, category)
            `)
            .eq('student_id', referral.student_id)
            .eq('status', 'active')
            .order('violation_date', { ascending: false });

          const violationTypes = violations?.map(v => v.violation_types?.name).filter(Boolean) || [];
          const latestViolation = violations?.[0]?.violation_date || '';

          return {
            id: referral.id,
            student_id: referral.student_id,
            student_name: referral.students?.full_name || '',
            student_nis: referral.students?.nis || '',
            violation_count: violations?.length || 0,
            latest_violation: latestViolation,
            violation_types: violationTypes,
            referral_reason: referral.referral_reason,
            urgency_level: referral.urgency_level,
            status: referral.status,
            created_at: referral.created_at,
            assigned_counselor: referral.assigned_counselor
          };
        })
      );

      setReferrals(enrichedReferrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data referral",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoReferralRules = async () => {
    // For now, we'll use predefined rules. In production, these would be stored in database
    const defaultRules: AutoReferralRule[] = [
      {
        id: '1',
        name: 'Multiple Violations (3+ in 30 days)',
        violation_threshold: 3,
        time_period_days: 30,
        violation_types: [],
        auto_assign: true,
        urgency_level: 'high',
        is_active: true
      },
      {
        id: '2', 
        name: 'Serious Violations (Violence/Drugs)',
        violation_threshold: 1,
        time_period_days: 1,
        violation_types: ['kekerasan', 'narkoba', 'bullying'],
        auto_assign: true,
        urgency_level: 'critical',
        is_active: true
      },
      {
        id: '3',
        name: 'Repeated Late Arrivals (5+ in 14 days)',
        violation_threshold: 5,
        time_period_days: 14,
        violation_types: ['terlambat'],
        auto_assign: false,
        urgency_level: 'normal',
        is_active: true
      }
    ];

    setRules(defaultRules);
  };

  const checkForAutoReferrals = async () => {
    try {
      // This function would check current violations against rules
      // and create automatic referrals when thresholds are met
      
      for (const rule of rules.filter(r => r.is_active)) {
        const { data: students } = await (supabase as any)
          .from('students')
          .select(`
            id,
            full_name,
            nis
          `)
          .eq('is_active', true);

        students?.forEach(async (student) => {
          const recentViolations = student.violations?.filter(v => {
            const violationDate = new Date(v.violation_date);
            const cutoffDate = new Date(Date.now() - rule.time_period_days * 24 * 60 * 60 * 1000);
            
            if (rule.violation_types.length > 0) {
              return violationDate >= cutoffDate && 
                     rule.violation_types.some(type => 
                       v.violation_types?.name?.toLowerCase().includes(type.toLowerCase())
                     );
            }
            return violationDate >= cutoffDate;
          }) || [];

          if (recentViolations.length >= rule.violation_threshold) {
            // Check if referral already exists
            const { data: existingReferral } = await supabase
              .from('counseling_referrals')
              .select('id')
              .eq('student_id', student.id)
              .eq('referral_type', 'violation')
              .neq('status', 'completed')
              .single();

            if (!existingReferral) {
              // Create auto-referral
              await supabase
                .from('counseling_referrals')
                .insert({
                  student_id: student.id,
                  referred_by: null, // System generated
                  referral_type: 'violation',
                  urgency_level: rule.urgency_level,
                  referral_reason: `Auto-referral: ${rule.name} - ${recentViolations.length} violations detected`,
                  assigned_counselor: rule.auto_assign ? user?.id : null,
                  status: 'pending'
                });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error checking auto-referrals:', error);
    }
  };

  const handleAcceptReferral = async (referralId: string) => {
    setProcessingReferral(referralId);
    try {
      const { error } = await supabase
        .from('counseling_referrals')
        .update({
          assigned_counselor: user?.id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', referralId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Referral berhasil diterima"
      });

      fetchReferrals();
    } catch (error) {
      console.error('Error accepting referral:', error);
      toast({
        title: "Error", 
        description: "Gagal menerima referral",
        variant: "destructive"
      });
    } finally {
      setProcessingReferral(null);
    }
  };

  const handleScheduleSession = async (referralId: string, studentId: string) => {
    try {
      // Create counseling session (using correct schema)
      const { error: sessionError } = await supabase
        .from('counseling_sessions')
        .insert({
          student_id: studentId,
          counselor_id: user?.id,
          session_type: 'individual',
          topic: 'Follow-up dari referral pelanggaran',
          status: 'scheduled',
          session_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
          session_time: '08:00'
        });

      if (sessionError) throw sessionError;

      // Update referral status
      const { error: referralError } = await supabase
        .from('counseling_referrals')
        .update({
          status: 'in_progress'
        })
        .eq('id', referralId);

      if (referralError) throw referralError;

      toast({
        title: "Berhasil",
        description: "Sesi konseling berhasil dijadwalkan"
      });

      fetchReferrals();
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast({
        title: "Error",
        description: "Gagal menjadwalkan sesi",
        variant: "destructive"
      });
    }
  };

  const getUrgencyBadge = (level: string) => {
    const badges = {
      low: <Badge className="bg-green-100 text-green-800">Rendah</Badge>,
      normal: <Badge className="bg-blue-100 text-blue-800">Normal</Badge>,
      high: <Badge className="bg-orange-100 text-orange-800">Tinggi</Badge>,
      urgent: <Badge className="bg-red-100 text-red-800">Mendesak</Badge>,
      critical: <Badge className="bg-red-500 text-white">Kritis</Badge>
    };
    return badges[level as keyof typeof badges] || badges.normal;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="secondary">Menunggu</Badge>,
      accepted: <Badge className="bg-blue-100 text-blue-800">Diterima</Badge>,
      in_progress: <Badge className="bg-yellow-100 text-yellow-800">Berlangsung</Badge>,
      completed: <Badge className="bg-green-100 text-green-800">Selesai</Badge>
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="space-y-6">
      {/* Auto-Referral Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Aturan Auto-Referral Pelanggaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{rule.name}</div>
                  <div className="text-sm text-gray-600">
                    {rule.violation_threshold}+ pelanggaran dalam {rule.time_period_days} hari
                    {rule.violation_types.length > 0 && (
                      <span> | Jenis: {rule.violation_types.join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getUrgencyBadge(rule.urgency_level)}
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Referral dari Pelanggaran ({referrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada referral yang pending</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <Card key={referral.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{referral.student_name}</h3>
                          <span className="text-sm text-gray-500">{referral.student_nis}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {getUrgencyBadge(referral.urgency_level)}
                          {getStatusBadge(referral.status)}
                          
                          <Badge variant="outline">
                            {referral.violation_count} Pelanggaran
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Alasan:</strong> {referral.referral_reason}</p>
                          <p><strong>Jenis pelanggaran:</strong> {referral.violation_types.join(', ') || 'Berbagai jenis'}</p>
                          {referral.latest_violation && (
                            <p><strong>Pelanggaran terakhir:</strong> {format(new Date(referral.latest_violation), 'dd MMM yyyy', { locale: id })}</p>
                          )}
                          <p><strong>Referral dibuat:</strong> {format(new Date(referral.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {referral.status === 'pending' && (
                          <Button
                            onClick={() => handleAcceptReferral(referral.id)}
                            disabled={processingReferral === referral.id}
                            className="flex items-center gap-2"
                          >
                            <UserCheck className="h-4 w-4" />
                            {processingReferral === referral.id ? 'Memproses...' : 'Terima Referral'}
                          </Button>
                        )}
                        
                        {referral.status === 'accepted' && (
                          <Button
                            onClick={() => handleScheduleSession(referral.id, referral.student_id)}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            Jadwalkan Sesi
                          </Button>
                        )}

                        {referral.status === 'in_progress' && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Sesi Terjadwal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};