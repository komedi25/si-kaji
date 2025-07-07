import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { qrData, permitId } = await req.json();

    // Create QR code data string
    const qrString = JSON.stringify({
      id: permitId,
      nis: qrData.student_nis,
      valid_from: qrData.valid_from,
      valid_until: qrData.valid_until,
      verify_url: qrData.verification_url,
      generated_at: new Date().toISOString()
    });

    // Generate QR code using a QR code API service
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
    
    // For production, you might want to upload this to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store QR metadata in database
    const { error: insertError } = await supabase
      .from('permit_qr_codes')
      .insert({
        permit_id: permitId,
        qr_data: qrString,
        qr_url: qrApiUrl,
        generated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing QR metadata:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        qr_url: qrApiUrl,
        verification_url: qrData.verification_url
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error("Error generating QR code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        }
      }
    );
  }
});