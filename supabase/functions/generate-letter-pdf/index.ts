
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LetterData {
  studentName: string;
  studentNIS: string;
  studentClass: string;
  letterType: string;
  purpose: string;
  requestNumber: string;
  issueDate: string;
  schoolName: string;
  principalName: string;
}

const generateLetterHTML = (data: LetterData): string => {
  const letterTypes = {
    'surat_aktif': 'SURAT KETERANGAN AKTIF',
    'surat_mutasi': 'SURAT KETERANGAN MUTASI',
    'surat_keterangan': 'SURAT KETERANGAN',
    'surat_rekomendasi': 'SURAT REKOMENDASI',
    'surat_lulus': 'SURAT KETERANGAN LULUS'
  };

  const letterTitle = letterTypes[data.letterType as keyof typeof letterTypes] || 'SURAT KETERANGAN';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${letterTitle}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
        }
        .school-name {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .school-address {
            font-size: 11pt;
            margin-bottom: 10px;
        }
        .letter-title {
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 30px 0;
            text-align: center;
        }
        .letter-number {
            text-align: center;
            margin-bottom: 30px;
            font-size: 11pt;
        }
        .content {
            text-align: justify;
            margin-bottom: 30px;
        }
        .student-data {
            margin: 20px 0;
            padding-left: 40px;
        }
        .student-data tr td {
            padding: 3px 0;
            vertical-align: top;
        }
        .signature {
            margin-top: 50px;
            text-align: right;
            margin-right: 50px;
        }
        .signature-date {
            margin-bottom: 80px;
        }
        .signature-name {
            font-weight: bold;
            text-decoration: underline;
        }
        .signature-title {
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">${data.schoolName}</div>
        <div class="school-address">
            Jl. Pendidikan No. 123, Kota Pendidikan<br>
            Telp: (021) 1234567 | Email: info@sekolah.sch.id
        </div>
    </div>

    <div class="letter-title">${letterTitle}</div>
    <div class="letter-number">Nomor: ${data.requestNumber}</div>

    <div class="content">
        <p>Yang bertanda tangan di bawah ini, Kepala ${data.schoolName}, dengan ini menerangkan bahwa:</p>
        
        <table class="student-data">
            <tr>
                <td style="width: 150px;">Nama</td>
                <td style="width: 20px;">:</td>
                <td>${data.studentName}</td>
            </tr>
            <tr>
                <td>NIS</td>
                <td>:</td>
                <td>${data.studentNIS}</td>
            </tr>
            <tr>
                <td>Kelas</td>
                <td>:</td>
                <td>${data.studentClass}</td>
            </tr>
        </table>

        ${generateLetterContent(data)}

        <p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
    </div>

    <div class="signature">
        <div class="signature-date">${data.issueDate}</div>
        <div>Kepala Sekolah</div>
        <div style="margin-top: 80px;">
            <div class="signature-name">${data.principalName}</div>
            <div class="signature-title">NIP. 123456789012345678</div>
        </div>
    </div>
</body>
</html>`;
};

const generateLetterContent = (data: LetterData): string => {
  switch (data.letterType) {
    case 'surat_aktif':
      return `<p>Adalah benar siswa tersebut di atas <strong>AKTIF</strong> sebagai siswa ${data.schoolName} tahun pelajaran 2024/2025 dan berkelakuan baik.</p>
              <p>Surat keterangan ini dibuat untuk keperluan: <strong>${data.purpose}</strong></p>`;
    
    case 'surat_mutasi':
      return `<p>Adalah benar siswa tersebut di atas telah <strong>MUTASI/PINDAH</strong> dari ${data.schoolName} pada tanggal ${data.issueDate}.</p>
              <p>Siswa tersebut selama belajar di sekolah ini berkelakuan baik dan tidak tersangkut masalah apapun.</p>
              <p>Keperluan: <strong>${data.purpose}</strong></p>`;
    
    case 'surat_lulus':
      return `<p>Adalah benar siswa tersebut di atas telah <strong>LULUS</strong> dari ${data.schoolName} tahun pelajaran 2024/2025 dengan hasil yang memuaskan.</p>
              <p>Keperluan: <strong>${data.purpose}</strong></p>`;
    
    default:
      return `<p>Adalah benar siswa tersebut di atas adalah siswa ${data.schoolName} yang berkelakuan baik.</p>
              <p>Keperluan: <strong>${data.purpose}</strong></p>`;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { requestId } = await req.json();

    // Fetch letter request data
    const { data: letterRequest, error: letterError } = await supabase
      .from('letter_requests')
      .select(`
        *,
        students (
          full_name,
          nis,
          classes (name, grade, majors (name))
        )
      `)
      .eq('id', requestId)
      .single();

    if (letterError) throw letterError;

    const student = letterRequest.students;
    const className = `${student.classes.grade} ${student.classes.majors?.name || ''} ${student.classes.name}`;

    const letterData: LetterData = {
      studentName: student.full_name,
      studentNIS: student.nis,
      studentClass: className,
      letterType: letterRequest.letter_type,
      purpose: letterRequest.purpose,
      requestNumber: letterRequest.request_number,
      issueDate: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      schoolName: 'SMA Negeri 1 Pendidikan',
      principalName: 'Dr. Ahmad Sudrajat, S.Pd., M.M.'
    };

    const html = generateLetterHTML(letterData);

    // Convert HTML to PDF using Puppeteer
    const pdfResponse = await fetch('https://api.htmlcsstoimage.com/v1/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('HTML_CSS_TO_IMAGE_API_KEY')}`
      },
      body: JSON.stringify({
        html: html,
        format: 'pdf',
        width: 595,
        height: 842,
        quality: 100
      })
    });

    if (!pdfResponse.ok) {
      // Fallback: return HTML for now if PDF service is not available
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html'
        }
      });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Upload PDF to storage
    const fileName = `letters/${requestId}/${Date.now()}-${letterRequest.request_number}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Update letter request with PDF URL
    await supabase
      .from('letter_requests')
      .update({ letter_url: publicUrl })
      .eq('id', requestId);

    return new Response(JSON.stringify({ 
      success: true, 
      pdfUrl: publicUrl,
      html: html // Include HTML for preview
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error generating letter PDF:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
