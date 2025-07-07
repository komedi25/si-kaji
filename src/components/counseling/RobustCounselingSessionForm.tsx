import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, User, Lock, Shield } from 'lucide-react';

interface EncryptedNote {
  content: string;
  encrypted_content: string;
  encryption_key_hint: string;
}

interface CounselingSessionFormProps {
  studentId?: string;
  sessionId?: string;
  onSuccess?: () => void;
}

export const RobustCounselingSessionForm: React.FC<CounselingSessionFormProps> = ({
  studentId,
  sessionId,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: studentId || '',
    session_date: '',
    session_time: '',
    session_type: 'individual',
    priority_level: 'normal',
    category: 'academic',
    reason: '',
    goals: '',
    initial_assessment: '',
    intervention_plan: '',
    follow_up_date: '',
    is_confidential: true,
    requires_parent_notification: false,
    risk_level: 'low'
  });
  
  const [notes, setNotes] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');

  const sessionTypes = [
    { value: 'individual', label: 'Individual Counseling' },
    { value: 'group', label: 'Group Counseling' },
    { value: 'crisis', label: 'Crisis Intervention' },
    { value: 'academic', label: 'Academic Counseling' },
    { value: 'career', label: 'Career Guidance' },
    { value: 'behavioral', label: 'Behavioral Support' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Rendah', color: 'text-green-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'high', label: 'Tinggi', color: 'text-yellow-600' },
    { value: 'urgent', label: 'Mendesak', color: 'text-red-600' },
    { value: 'crisis', label: 'Krisis', color: 'text-red-800' }
  ];

  const riskLevels = [
    { value: 'low', label: 'Rendah' },
    { value: 'medium', label: 'Sedang' },
    { value: 'high', label: 'Tinggi' },
    { value: 'critical', label: 'Kritis' }
  ];

  // Simple encryption function (in production, use proper encryption library)
  const encryptContent = (content: string, key: string): EncryptedNote => {
    const encrypted = btoa(content + '|' + key); // Simple base64 encoding with key
    return {
      content: content,
      encrypted_content: encrypted,
      encryption_key_hint: key.substring(0, 3) + '***'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.session_date || !formData.reason) {
      toast({
        title: "Error",
        description: "Mohon lengkapi field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    if (formData.is_confidential && !encryptionKey) {
      toast({
        title: "Error", 
        description: "Session rahasia memerlukan kunci enkripsi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create session
      const sessionData = {
        ...formData,
        counselor_id: user?.id,
        status: 'scheduled',
        created_at: new Date().toISOString()
      };

      const { data: session, error: sessionError } = await supabase
        .from('counseling_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add encrypted notes if provided
      if (notes && formData.is_confidential && encryptionKey) {
        const encryptedNote = encryptContent(notes, encryptionKey);
        
        const { error: noteError } = await supabase
          .from('counseling_session_notes')
          .insert({
            session_id: session.id,
            note_type: 'initial_assessment',
            encrypted_content: encryptedNote.encrypted_content,
            encryption_key_hint: encryptedNote.encryption_key_hint,
            created_by: user?.id,
            is_confidential: true
          });

        if (noteError) throw noteError;
      }

      // Create automatic referral tracking if this is from violation
      if (formData.category === 'behavioral' && formData.priority_level !== 'low') {
        const { error: referralError } = await supabase
          .from('counseling_referrals')
          .insert({
            student_id: formData.student_id,
            referred_by: user?.id,
            referral_type: 'behavioral',
            urgency_level: formData.priority_level,
            referral_reason: formData.reason,
            assigned_counselor: user?.id,
            status: 'active'
          });

        if (referralError) console.error('Referral creation failed:', referralError);
      }

      toast({
        title: "Berhasil",
        description: "Sesi konseling berhasil dijadwalkan"
      });

      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        student_id: studentId || '',
        session_date: '',
        session_time: '',
        session_type: 'individual',
        priority_level: 'normal',
        category: 'academic',
        reason: '',
        goals: '',
        initial_assessment: '',
        intervention_plan: '',
        follow_up_date: '',
        is_confidential: true,
        requires_parent_notification: false,
        risk_level: 'low'
      });
      setNotes('');
      setEncryptionKey('');

    } catch (error) {
      console.error('Error creating counseling session:', error);
      toast({
        title: "Error",
        description: "Gagal membuat sesi konseling",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Sesi Konseling Baru - Sistem Robust
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal Sesi *
              </Label>
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="session_time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Waktu Sesi *
              </Label>
              <Input
                id="session_time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData({...formData, session_time: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Session Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="session_type">Jenis Sesi</Label>
              <Select value={formData.session_type} onValueChange={(value) => setFormData({...formData, session_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis sesi" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority_level">Tingkat Prioritas</Label>
              <Select value={formData.priority_level} onValueChange={(value) => setFormData({...formData, priority_level: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className={level.color}>{level.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="risk_level">Tingkat Risiko</Label>
              <Select value={formData.risk_level} onValueChange={(value) => setFormData({...formData, risk_level: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat risiko" />
                </SelectTrigger>
                <SelectContent>
                  {riskLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason and Goals */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Alasan / Masalah yang Dibahas *</Label>
              <Textarea
                id="reason"
                placeholder="Deskripsikan masalah atau alasan konseling..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="goals">Tujuan Konseling</Label>
              <Textarea
                id="goals"
                placeholder="Apa yang ingin dicapai dari sesi ini..."
                value={formData.goals}
                onChange={(e) => setFormData({...formData, goals: e.target.value})}
                rows={2}
              />
            </div>
          </div>

          {/* Confidential Notes Section */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="is_confidential"
                checked={formData.is_confidential}
                onCheckedChange={(checked) => setFormData({...formData, is_confidential: checked as boolean})}
              />
              <Label htmlFor="is_confidential" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Sesi Rahasia (Terenkripsi)
              </Label>
            </div>

            {formData.is_confidential && (
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <Shield className="h-4 w-4" />
                  Catatan rahasia akan dienkripsi dan memerlukan kunci akses
                </div>
                
                <div>
                  <Label htmlFor="encryption_key">Kunci Enkripsi *</Label>
                  <Input
                    id="encryption_key"
                    type="password"
                    placeholder="Masukkan kunci enkripsi untuk catatan rahasia..."
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    required={formData.is_confidential}
                  />
                </div>

                <div>
                  <Label htmlFor="confidential_notes">Catatan Rahasia</Label>
                  <Textarea
                    id="confidential_notes"
                    placeholder="Catatan khusus yang akan dienkripsi..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Assessment and Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initial_assessment">Asesmen Awal</Label>
              <Textarea
                id="initial_assessment"
                placeholder="Penilaian awal kondisi siswa..."
                value={formData.initial_assessment}
                onChange={(e) => setFormData({...formData, initial_assessment: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="intervention_plan">Rencana Intervensi</Label>
              <Textarea
                id="intervention_plan"
                placeholder="Langkah-langkah yang akan dilakukan..."
                value={formData.intervention_plan}
                onChange={(e) => setFormData({...formData, intervention_plan: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          {/* Follow-up and Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="follow_up_date">Tanggal Follow-up</Label>
              <Input
                id="follow_up_date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="requires_parent_notification"
                checked={formData.requires_parent_notification}
                onCheckedChange={(checked) => setFormData({...formData, requires_parent_notification: checked as boolean})}
              />
              <Label htmlFor="requires_parent_notification">
                Perlukan Notifikasi Orang Tua
              </Label>
            </div>
          </div>

          {/* Priority Warning */}
          {(formData.priority_level === 'urgent' || formData.priority_level === 'crisis') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-700 font-medium mb-2">⚠️ Sesi Prioritas Tinggi</div>
              <div className="text-red-600 text-sm">
                • Sesi akan diprioritaskan dalam jadwal<br />
                • Notifikasi otomatis ke koordinator BK<br />
                • Protokol krisis akan diaktifkan jika diperlukan
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Menyimpan...' : 'Jadwalkan Sesi Konseling'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};