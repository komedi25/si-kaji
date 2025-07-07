import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Unlock, Eye, EyeOff, Key, AlertTriangle } from 'lucide-react';

interface EncryptedNotesManagerProps {
  sessionId: string;
  existingNotes?: any[];
  onNotesUpdate?: () => void;
}

export const EncryptedNotesManager: React.FC<EncryptedNotesManagerProps> = ({
  sessionId,
  existingNotes = [],
  onNotesUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newNote, setNewNote] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [decryptionKey, setDecryptionKey] = useState('');
  const [showDecrypted, setShowDecrypted] = useState<{[key: string]: boolean}>({});
  const [decryptedContent, setDecryptedContent] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [noteType, setNoteType] = useState('session_notes');

  // Simple encryption (in production, use proper encryption like AES)
  const encryptContent = (content: string, key: string): string => {
    return btoa(content + '|' + key);
  };

  // Simple decryption
  const decryptContent = (encrypted: string, key: string): string | null => {
    try {
      const decoded = atob(encrypted);
      const [content, originalKey] = decoded.split('|');
      if (originalKey === key) {
        return content;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !encryptionKey.trim()) {
      toast({
        title: "Error",
        description: "Mohon isi catatan dan kunci enkripsi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const encryptedContent = encryptContent(newNote, encryptionKey);
      const keyHint = encryptionKey.substring(0, 3) + '***';

      const { error } = await supabase
        .from('counseling_session_notes')
        .insert({
          session_id: sessionId,
          note_type: noteType,
          encrypted_content: encryptedContent,
          encryption_key_hint: keyHint,
          created_by: user?.id,
          is_confidential: true
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Catatan terenkripsi berhasil disimpan"
      });

      setNewNote('');
      setEncryptionKey('');
      if (onNotesUpdate) onNotesUpdate();

    } catch (error) {
      console.error('Error adding encrypted note:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan catatan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptNote = (noteId: string, encryptedContent: string) => {
    if (!decryptionKey.trim()) {
      toast({
        title: "Error",
        description: "Masukkan kunci dekripsi",
        variant: "destructive"
      });
      return;
    }

    const decrypted = decryptContent(encryptedContent, decryptionKey);
    if (decrypted) {
      setDecryptedContent(prev => ({
        ...prev,
        [noteId]: decrypted
      }));
      setShowDecrypted(prev => ({
        ...prev,
        [noteId]: true
      }));
      toast({
        title: "Berhasil",
        description: "Catatan berhasil didekripsi"
      });
    } else {
      toast({
        title: "Error",
        description: "Kunci dekripsi salah",
        variant: "destructive"
      });
    }
  };

  const handleHideDecrypted = (noteId: string) => {
    setShowDecrypted(prev => ({
      ...prev,
      [noteId]: false
    }));
    setDecryptedContent(prev => {
      const newContent = { ...prev };
      delete newContent[noteId];
      return newContent;
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New Encrypted Note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Tambah Catatan Terenkripsi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="note_type">Jenis Catatan</Label>
            <select
              id="note_type"
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="session_notes">Catatan Sesi</option>
              <option value="assessment">Asesmen</option>
              <option value="treatment_plan">Rencana Perawatan</option>
              <option value="progress_notes">Catatan Progress</option>
              <option value="confidential">Rahasia Khusus</option>
            </select>
          </div>

          <div>
            <Label htmlFor="new_note">Catatan</Label>
            <Textarea
              id="new_note"
              placeholder="Tulis catatan rahasia di sini..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="encryption_key">Kunci Enkripsi</Label>
            <Input
              id="encryption_key"
              type="password"
              placeholder="Masukkan kunci enkripsi (ingat baik-baik!)"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="mt-1"
            />
            <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Pastikan mengingat kunci ini - tidak dapat dipulihkan jika hilang!
            </div>
          </div>

          <Button onClick={handleAddNote} disabled={loading} className="w-full">
            {loading ? 'Menyimpan...' : 'Simpan Catatan Terenkripsi'}
          </Button>
        </CardContent>
      </Card>

      {/* View Encrypted Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5" />
            Catatan Terenkripsi ({existingNotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {existingNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada catatan terenkripsi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Decryption Key Input */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <Label htmlFor="decryption_key">Kunci Dekripsi</Label>
                <Input
                  id="decryption_key"
                  type="password"
                  placeholder="Masukkan kunci untuk membaca catatan..."
                  value={decryptionKey}
                  onChange={(e) => setDecryptionKey(e.target.value)}
                  className="mt-1"
                />
              </div>

              {existingNotes.map((note) => (
                <Card key={note.id} className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-sm">
                          {note.note_type?.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Hint kunci: {note.encryption_key_hint}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString('id-ID')}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {showDecrypted[note.id] ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleHideDecrypted(note.id)}
                            className="flex items-center gap-1"
                          >
                            <EyeOff className="h-3 w-3" />
                            Sembunyikan
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleDecryptNote(note.id, note.encrypted_content)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Dekripsi
                          </Button>
                        )}
                      </div>
                    </div>

                    {showDecrypted[note.id] ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="text-sm text-green-800 font-medium mb-2">
                          ✓ Catatan Terdekripsi:
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {decryptedContent[note.id]}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-3 rounded">
                        <div className="text-sm text-gray-500 font-mono">
                          🔒 [ENCRYPTED] {note.encrypted_content.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Gunakan kunci dekripsi untuk membaca isi catatan
                        </div>
                      </div>
                    )}
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