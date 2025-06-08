
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { provider, task, prompt, context, model } = await req.json()
    
    let result = '';
    let tokens = 0;
    let cost = 0;
    
    // Get API keys from Supabase secrets
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
    
    // Process based on provider
    switch (provider) {
      case 'openai':
        if (openaiKey) {
          const response = await processWithOpenAI(prompt, model || 'gpt-4o-mini', openaiKey);
          result = response.result;
          tokens = response.tokens;
          cost = response.cost;
        } else {
          result = await processWithMockAI(prompt, task);
        }
        break;
      case 'gemini':
        if (geminiKey) {
          const response = await processWithGemini(prompt, model || 'gemini-pro', geminiKey);
          result = response.result;
          tokens = response.tokens;
          cost = response.cost;
        } else {
          result = await processWithMockAI(prompt, task);
        }
        break;
      case 'openrouter':
        if (openrouterKey) {
          const response = await processWithOpenRouter(prompt, model || 'meta-llama/llama-3.2-3b-instruct:free', openrouterKey);
          result = response.result;
          tokens = response.tokens;
          cost = response.cost;
        } else {
          result = await processWithMockAI(prompt, task);
        }
        break;
      case 'deepseek':
        if (deepseekKey) {
          const response = await processWithDeepSeek(prompt, model || 'deepseek-chat', deepseekKey);
          result = response.result;
          tokens = response.tokens;
          cost = response.cost;
        } else {
          result = await processWithMockAI(prompt, task);
        }
        break;
      default:
        result = await processWithMockAI(prompt, task);
    }

    return new Response(
      JSON.stringify({ 
        result,
        usage: {
          tokens,
          cost
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('AI Processor Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    )
  }
})

async function processWithOpenAI(prompt: string, model: string, apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Anda adalah asisten AI yang membantu dalam analisis kesiswaan dan pendidikan. Berikan respons yang profesional dan konstruktif dalam bahasa Indonesia.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    return {
      result: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0,
      cost: calculateOpenAICost(model, data.usage?.total_tokens || 0)
    };
  } catch (error) {
    console.error('OpenAI Error:', error);
    throw error;
  }
}

async function processWithGemini(prompt: string, model: string, apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Anda adalah asisten AI untuk sistem kesiswaan. ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respons dari Gemini';
    const tokens = result.length; // Approximate token count

    return {
      result,
      tokens,
      cost: 0 // Gemini Pro is free for now
    };
  } catch (error) {
    console.error('Gemini Error:', error);
    throw error;
  }
}

async function processWithOpenRouter(prompt: string, model: string, apiKey: string) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sikaji.lovable.app',
        'X-Title': 'Si-Kaji SMK Negeri 1 Kendal'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Anda adalah asisten AI yang membantu dalam analisis kesiswaan dan pendidikan. Berikan respons yang profesional dan konstruktif dalam bahasa Indonesia.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API error');
    }

    return {
      result: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0,
      cost: 0 // Vary by model, mostly free models available
    };
  } catch (error) {
    console.error('OpenRouter Error:', error);
    throw error;
  }
}

async function processWithDeepSeek(prompt: string, model: string, apiKey: string) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Anda adalah asisten AI yang membantu dalam analisis kesiswaan dan pendidikan. Berikan respons yang profesional dan konstruktif dalam bahasa Indonesia.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'DeepSeek API error');
    }

    return {
      result: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0,
      cost: calculateDeepSeekCost(data.usage?.total_tokens || 0)
    };
  } catch (error) {
    console.error('DeepSeek Error:', error);
    throw error;
  }
}

async function processWithMockAI(prompt: string, task: string): Promise<string> {
  // Mock responses when API keys are not available
  if (prompt.includes('Analisis perilaku siswa')) {
    return `**ANALISIS PERILAKU SISWA**

**Pola Perilaku:**
- Berdasarkan data yang tersedia, siswa menunjukkan pola perilaku yang cukup konsisten
- Tingkat kedisiplinan berada dalam kategori yang dapat diterima
- Partisipasi dalam kegiatan sekolah menunjukkan tren positif

**Trend Kedisiplinan:**
- Tidak ada pelanggaran berat dalam periode observasi
- Kehadiran menunjukkan konsistensi yang baik
- Prestasi akademik dan non-akademik seimbang

**Potensi dan Area Perbaikan:**
- Potensi: Menunjukkan kemampuan adaptasi yang baik
- Area perbaikan: Dapat ditingkatkan konsistensi dalam aktivitas ekstrakurikuler

**Rekomendasi Tindakan:**
1. Lanjutkan pembinaan karakter positif
2. Berikan apresiasi atas pencapaian yang sudah diraih
3. Monitor perkembangan secara berkala
4. Libatkan orang tua dalam proses pembinaan

**Saran untuk Orang Tua dan Guru:**
- Pertahankan komunikasi yang baik dengan siswa
- Berikan dukungan dalam pengembangan minat dan bakat
- Pantau aktivitas dan pergaulan siswa

*Catatan: Ini adalah respons demo. Untuk hasil analisis yang akurat, silakan konfigurasi API key yang sesuai.*`;
  }

  if (prompt.includes('Generate surat')) {
    return `**SURAT KETERANGAN**

PEMERINTAH PROVINSI JAWA TENGAH
DINAS PENDIDIKAN DAN KEBUDAYAAN
SMK NEGERI 1 KENDAL
Jl. Soekarno Hatta No. 3 Kendal 51314 Telp. (0294) 381645

SURAT KETERANGAN
Nomor: 421.3/SK-SMKN1KDL/VII/2024

Yang bertanda tangan di bawah ini:
Nama       : Drs. H. Ahmad Sugiyono, M.Pd
NIP        : 196508151990031008
Jabatan    : Kepala SMK Negeri 1 Kendal

Dengan ini menerangkan bahwa:
[Data siswa akan diisi otomatis berdasarkan input]

Adalah benar siswa SMK Negeri 1 Kendal yang:
- Terdaftar sebagai siswa aktif
- Memiliki catatan perilaku yang baik
- Tidak pernah terlibat dalam pelanggaran berat

Surat keterangan ini dibuat untuk keperluan [sesuai permohonan] dan dapat dipergunakan sebagaimana mestinya.

Kendal, [tanggal otomatis]
Kepala SMK Negeri 1 Kendal

Drs. H. Ahmad Sugiyono, M.Pd
NIP. 196508151990031008

*Catatan: Ini adalah template demo. Untuk hasil yang akurat, silakan konfigurasi API key yang sesuai.*`;
  }

  if (prompt.includes('ringkasan kasus')) {
    return `**RINGKASAN KASUS**

**Informasi Dasar:**
- Status: Dalam penanganan
- Prioritas: Sedang
- Kategori: Pelanggaran disiplin

**Kronologi Singkat:**
Kasus dilaporkan dan telah melalui tahap investigasi awal. Tim penanganan telah mengidentifikasi akar permasalahan dan menyusun rencana tindak lanjut.

**Poin-Poin Penting:**
1. Kasus telah didokumentasikan dengan baik
2. Saksi dan pihak terkait telah diwawancarai
3. Bukti-bukti telah dikumpulkan dan diverifikasi
4. Orang tua/wali telah diberitahu

**Status Terkini:**
- Proses pembinaan sedang berlangsung
- Siswa menunjukkan kooperatif dalam proses penanganan
- Monitoring berkala terus dilakukan

**Langkah Selanjutnya:**
1. Lanjutkan sesi konseling
2. Evaluasi perkembangan mingguan
3. Libatkan orang tua dalam proses pembinaan
4. Dokumentasi progres secara berkala

*Catatan: Ini adalah respons demo. Untuk hasil analisis yang akurat, silakan konfigurasi API key yang sesuai.*`;
  }

  // Default response for custom prompts
  return `Maaf, saat ini fitur AI sedang dalam mode demo. Untuk mendapatkan hasil yang optimal, silakan:

1. Konfigurasi API key yang sesuai di pengaturan sistem
2. Pastikan koneksi internet stabil
3. Gunakan prompt yang jelas dan spesifik
4. Pilih provider AI yang sesuai dengan kebutuhan

Tim pengembang Si-Kaji sedang bekerja untuk mengintegrasikan AI secara penuh. Terima kasih atas pengertiannya.

*Respons ini dihasilkan oleh sistem demo.*`;
}

function calculateOpenAICost(model: string, tokens: number): number {
  // Approximate pricing (as of 2024)
  const pricing = {
    'gpt-4o': 0.03 / 1000, // $0.03 per 1K tokens
    'gpt-4o-mini': 0.00015 / 1000, // $0.00015 per 1K tokens
    'gpt-3.5-turbo': 0.002 / 1000 // $0.002 per 1K tokens
  };
  
  return (pricing[model as keyof typeof pricing] || 0.002 / 1000) * tokens;
}

function calculateDeepSeekCost(tokens: number): number {
  // DeepSeek is very cheap
  return 0.00014 / 1000 * tokens; // $0.00014 per 1K tokens
}
