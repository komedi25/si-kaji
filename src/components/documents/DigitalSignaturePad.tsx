import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  PenTool, Save, X, FileSignature, 
  Download, Clock, CheckCircle
} from 'lucide-react';

interface Signature {
  id: string;
  document_id: string;
  signer_id: string;
  signer_role: string;
  signature_data: string | null;
  signature_timestamp: string;
  status: string;
  signature_position: any;
  profiles?: {
    full_name: string;
  } | null;
}

interface Document {
  id: string;
  title: string;
  file_url: string;
  version_number: number;
}

interface DigitalSignaturePadProps {
  documentId: string;
  documents: Document[];
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({ 
  documentId, 
  documents 
}) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(false);
  const [signerRole, setSignerRole] = useState('');

  const document = documents.find(d => d.id === documentId);

  useEffect(() => {
    if (documentId) {
      fetchSignatures();
    }
  }, [documentId]);

  useEffect(() => {
    // Determine user's role for signing
    if (hasRole('admin')) {
      setSignerRole('admin');
    } else if (hasRole('waka_kesiswaan')) {
      setSignerRole('waka_kesiswaan');
    } else if (hasRole('wali_kelas')) {
      setSignerRole('wali_kelas');
    } else if (hasRole('guru_bk')) {
      setSignerRole('guru_bk');
    }
  }, [hasRole]);

  const fetchSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('document_signatures')
        .select(`
          *,
          profiles:signer_id (
            full_name
          )
        `)
        .eq('document_id', documentId)
        .order('signature_timestamp', { ascending: false });

      if (error) throw error;
      setSignatures((data as any) || []);
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveSignature = async () => {
    if (!signerRole) {
      toast({
        title: "Error",
        description: "Role penandatangan tidak valid",
        variant: "destructive"
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    try {
      // Convert canvas to base64
      const signatureData = canvas.toDataURL();

      const { error } = await supabase
        .from('document_signatures')
        .insert({
          document_id: documentId,
          signer_id: user?.id,
          signer_role: signerRole,
          signature_data: signatureData,
          status: 'signed',
          signature_position: { x: 100, y: 100, page: 1 }
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Tanda tangan digital berhasil disimpan"
      });

      clearSignature();
      fetchSignatures();
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan tanda tangan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileSignature className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrator',
      waka_kesiswaan: 'Waka Kesiswaan',
      wali_kelas: 'Wali Kelas',
      guru_bk: 'Guru BK'
    };
    return labels[role] || role;
  };

  if (!document) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Pilih dokumen untuk menandatangani
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Tanda Tangan Digital: {document.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">v{document.version_number}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              <Download className="h-4 w-4 mr-1" />
              Lihat Dokumen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signature Pad */}
      {signerRole && (
        <Card>
          <CardHeader>
            <CardTitle>Buat Tanda Tangan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Role: {getRoleLabel(signerRole)}</Label>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="border rounded cursor-crosshair w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={clearSignature} variant="outline">
                <X className="h-4 w-4 mr-1" />
                Hapus
              </Button>
              <Button onClick={saveSignature} disabled={loading}>
                <Save className="h-4 w-4 mr-1" />
                {loading ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tanda Tangan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {signatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PenTool className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada tanda tangan</p>
              </div>
            ) : (
              signatures.map((signature) => (
                <div key={signature.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {signature.profiles?.full_name || 'Penandatangan'}
                        </h4>
                        <Badge variant="outline">
                          {getRoleLabel(signature.signer_role)}
                        </Badge>
                        <Badge className={getStatusColor(signature.status)}>
                          {getStatusIcon(signature.status)}
                          <span className="ml-1">{signature.status.toUpperCase()}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Ditandatangani: {new Date(signature.signature_timestamp).toLocaleString('id-ID')}
                      </p>
                      
                      {signature.signature_data && (
                        <div className="mt-3">
                          <img
                            src={signature.signature_data}
                            alt="Tanda Tangan"
                            className="border rounded max-w-xs h-20 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
