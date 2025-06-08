import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AIProvider = 'openai' | 'gemini' | 'openrouter' | 'deepseek';

interface AIRequest {
  provider: AIProvider;
  task: string;
  prompt: string;
  context?: any;
}

interface AIResponse {
  result: string;
  usage: {
    tokens: number;
    cost?: number;
  };
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processAIRequest = async (request: AIRequest): Promise<AIResponse | null> => {
    setLoading(true);
    try {
      // Call the edge function for AI processing
      const { data, error } = await supabase.functions.invoke('ai-processor', {
        body: request
      });

      if (error) {
        throw error;
      }

      // Log AI usage to database using the new function
      await logAIUsage(request, data);

      return data;
    } catch (error) {
      console.error('AI Request Error:', error);
      toast({
        title: "Error",
        description: "Gagal memproses permintaan AI",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logAIUsage = async (request: AIRequest, response: AIResponse) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user, skipping AI usage log');
        return;
      }

      // Use the database function to log AI usage
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        provider: request.provider,
        task_type: request.task,
        prompt_length: request.prompt.length,
        response_length: response.result.length,
        tokens_used: response.usage.tokens,
        cost: response.usage.cost || 0
      });

    } catch (error) {
      console.error('Failed to log AI usage:', error);
    }
  };

  const analyzeStudentBehavior = async (studentId: string, provider: AIProvider = 'gemini') => {
    // Fetch student data from database
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    const { data: violations } = await supabase
      .from('student_violations')
      .select(`
        *,
        violation_types (name, category, point_deduction)
      `)
      .eq('student_id', studentId)
      .order('violation_date', { ascending: false })
      .limit(10);

    const { data: achievements } = await supabase
      .from('student_achievements')
      .select(`
        *,
        achievement_types (name, category, point_reward)
      `)
      .eq('student_id', studentId)
      .order('achievement_date', { ascending: false })
      .limit(10);

    const { data: attendances } = await supabase
      .from('student_attendances')
      .select('*')
      .eq('student_id', studentId)
      .order('attendance_date', { ascending: false })
      .limit(30);

    const context = {
      student,
      violations,
      achievements,
      attendances
    };

    const prompt = `Analisis perilaku siswa berikut:

Nama: ${student?.full_name}
NIS: ${student?.nis}

Data Pelanggaran (10 terakhir):
${violations?.map(v => `- ${v.violation_types?.name} (${v.violation_date}) - Poin: ${v.point_deduction}`).join('\n') || 'Tidak ada pelanggaran'}

Data Prestasi (10 terakhir):
${achievements?.map(a => `- ${a.achievement_types?.name} (${a.achievement_date}) - Poin: ${a.point_reward}`).join('\n') || 'Tidak ada prestasi'}

Data Kehadiran (30 hari terakhir):
Hadir: ${attendances?.filter(a => a.status === 'present').length || 0} hari
Tidak Hadir: ${attendances?.filter(a => a.status !== 'present').length || 0} hari

Berikan analisis komprehensif tentang:
1. Pola perilaku siswa
2. Trend kedisiplinan
3. Potensi dan area yang perlu diperbaiki
4. Rekomendasi tindakan konkret
5. Saran untuk orang tua dan guru

Format response dalam bahasa Indonesia yang mudah dipahami.`;

    return await processAIRequest({
      provider,
      task: 'analyze_behavior',
      prompt,
      context
    });
  };

  const generateLetter = async (studentId: string, letterType: string, provider: AIProvider = 'gemini') => {
    // Fetch student data
    const { data: student } = await supabase
      .from('students')
      .select(`
        *,
        student_enrollments (
          classes (
            name,
            grade,
            majors (name)
          )
        )
      `)
      .eq('id', studentId)
      .single();

    const { data: disciplinePoints } = await supabase
      .from('student_discipline_points')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1);

    const prompt = `Generate surat ${letterType} untuk siswa:

Nama: ${student?.full_name}
NIS: ${student?.nis}
Kelas: ${student?.student_enrollments?.[0]?.classes?.name || 'N/A'}
Jurusan: ${student?.student_enrollments?.[0]?.classes?.majors?.name || 'N/A'}
Status Disiplin: ${disciplinePoints?.[0]?.discipline_status || 'Baik'}

Buat surat yang sesuai dengan format resmi SMK Negeri 1 Kendal dengan:
1. Kop surat yang sesuai
2. Nomor surat otomatis
3. Isi yang relevan dengan jenis surat
4. Penutup dan tanda tangan

Format dalam bahasa Indonesia formal.`;

    return await processAIRequest({
      provider,
      task: 'generate_letter',
      prompt,
      context: { student, letterType, disciplinePoints }
    });
  };

  const summarizeCase = async (caseId: string, provider: AIProvider = 'gemini') => {
    // Fetch case data
    const { data: caseData } = await supabase
      .from('student_cases')
      .select(`
        *,
        case_activities (*)
      `)
      .eq('id', caseId)
      .single();

    const prompt = `Buatkan ringkasan kasus siswa berikut:

Nomor Kasus: ${caseData?.case_number}
Judul: ${caseData?.title}
Kategori: ${caseData?.category}
Status: ${caseData?.status}
Prioritas: ${caseData?.priority}

Deskripsi: ${caseData?.description}

Aktivitas Kasus:
${caseData?.case_activities?.map(a => `- ${a.activity_type}: ${a.description} (${a.created_at})`).join('\n') || 'Belum ada aktivitas'}

Buat ringkasan yang mencakup:
1. Kronologi singkat
2. Poin-poin penting
3. Status terkini
4. Langkah selanjutnya yang disarankan

Format dalam bahasa Indonesia yang profesional.`;

    return await processAIRequest({
      provider,
      task: 'summarize_case',
      prompt,
      context: { caseData }
    });
  };

  const getRecommendations = async (studentId: string, provider: AIProvider = 'gemini') => {
    // Similar to analyzeStudentBehavior but focused on recommendations
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    const { data: disciplinePoints } = await supabase
      .from('student_discipline_points')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1);

    const prompt = `Berikan rekomendasi tindakan disiplin untuk siswa:

Nama: ${student?.full_name}
Status Disiplin: ${disciplinePoints?.[0]?.discipline_status || 'Baik'}
Skor Disiplin: ${disciplinePoints?.[0]?.final_score || 100}
Total Poin Pelanggaran: ${disciplinePoints?.[0]?.total_violation_points || 0}
Total Poin Prestasi: ${disciplinePoints?.[0]?.total_achievement_points || 0}

Berikan rekomendasi:
1. Tindakan yang sesuai dengan status disiplin
2. Program pembinaan yang cocok
3. Target perbaikan yang realistis
4. Timeline implementasi
5. Indikator keberhasilan

Format dalam bahasa Indonesia yang praktis dan implementatif.`;

    return await processAIRequest({
      provider,
      task: 'discipline_recommendation',
      prompt,
      context: { student, disciplinePoints }
    });
  };

  const generateAutomaticRecommendation = async (studentId: string) => {
    try {
      // Analyze student and create recommendation
      const analysis = await analyzeStudentBehavior(studentId);
      
      if (!analysis) return;

      // Create AI recommendation in database
      const { data: { user } } = await supabase.auth.getUser();
      const { data: student } = await supabase.from('students').select('*').eq('id', studentId).single();
      
      // Determine appropriate stakeholder based on analysis
      let assignedRole = 'wali_kelas';
      let priority = 'medium';
      
      // Logic to determine stakeholder and priority
      const { data: disciplinePoints } = await supabase
        .from('student_discipline_points')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (disciplinePoints?.final_score < 40) {
        assignedRole = 'tppk';
        priority = 'urgent';
      } else if (disciplinePoints?.final_score < 60) {
        assignedRole = 'guru_bk';
        priority = 'high';
      }

      await supabase.from('ai_recommendations').insert({
        student_id: studentId,
        recommendation_type: 'behavioral_analysis',
        title: `Rekomendasi Pembinaan untuk ${student?.full_name}`,
        content: analysis.result,
        priority,
        assigned_role: assignedRole,
        metadata: {
          generated_at: new Date().toISOString(),
          student_score: disciplinePoints?.final_score,
          analysis_type: 'automatic'
        }
      });

    } catch (error) {
      console.error('Error generating automatic recommendation:', error);
    }
  };

  return {
    loading,
    analyzeStudentBehavior,
    generateLetter,
    summarizeCase,
    getRecommendations,
    generateAutomaticRecommendation,
    processAIRequest
  };
}
