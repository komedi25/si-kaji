
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  MessageCircle, Send, Phone, Mail, Calendar, 
  Clock, User, BookOpen, AlertCircle, CheckCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const messageSchema = z.object({
  recipient_type: z.enum(['wali_kelas', 'guru_bk', 'waka_kesiswaan', 'admin']),
  subject: z.string().min(5, 'Subjek minimal 5 karakter'),
  message: z.string().min(10, 'Pesan minimal 10 karakter'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface Message {
  id: string;
  subject: string;
  message: string;
  recipient_type: string;
  priority: string;
  status: 'sent' | 'read' | 'replied';
  created_at: string;
  replies?: Array<{
    id: string;
    message: string;
    sender_name: string;
    created_at: string;
  }>;
}

interface TeacherContact {
  id: string;
  full_name: string;
  role: string;
  phone?: string;
  email?: string;
  availability_schedule?: string;
  last_online?: string;
}

export const ParentCommunicationHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<TeacherContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      priority: 'medium'
    }
  });

  useEffect(() => {
    Promise.all([
      fetchMessages(),
      fetchTeacherContacts()
    ]).finally(() => setLoading(false));
  }, [user]);

  const fetchMessages = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('parent_messages')
        .select(`
          id, subject, message, recipient_type, priority, status, created_at,
          replies:message_replies(
            id, message, sender_name, created_at
          )
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchTeacherContacts = async () => {
    if (!user?.id) return;

    try {
      // Get student data first
      const { data: parentAccess } = await supabase
        .from('parent_access')
        .select('student:students(id, class_id)')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!parentAccess?.student) return;

      // Get class info and homeroom teacher
      const { data: classInfo } = await supabase
        .from('classes')
        .select(`
          homeroom_teacher_id,
          homeroom_teacher:profiles(full_name, phone)
        `)
        .eq('id', parentAccess.student.class_id)
        .single();

      // Get other relevant teachers (BK, Waka Kesiswaan)
      const { data: otherTeachers } = await supabase
        .from('user_roles')
        .select(`
          user:profiles(id, full_name, phone),
          role
        `)
        .in('role', ['guru_bk', 'waka_kesiswaan', 'admin'])
        .eq('is_active', true);

      const teacherContacts: TeacherContact[] = [];

      // Add homeroom teacher
      if (classInfo?.homeroom_teacher) {
        teacherContacts.push({
          id: classInfo.homeroom_teacher_id,
          full_name: classInfo.homeroom_teacher.full_name,
          role: 'wali_kelas',
          phone: classInfo.homeroom_teacher.phone
        });
      }

      // Add other teachers
      otherTeachers?.forEach((teacher) => {
        if (teacher.user) {
          teacherContacts.push({
            id: teacher.user.id,
            full_name: teacher.user.full_name,
            role: teacher.role,
            phone: teacher.user.phone
          });
        }
      });

      setContacts(teacherContacts);
    } catch (error) {
      console.error('Error fetching teacher contacts:', error);
    }
  };

  const onSubmit = async (data: MessageFormData) => {
    try {
      const { error } = await supabase
        .from('parent_messages')
        .insert({
          sender_id: user?.id,
          subject: data.subject,
          message: data.message,
          recipient_type: data.recipient_type,
          priority: data.priority,
          status: 'sent'
        });

      if (error) throw error;

      toast({
        title: 'Pesan Terkirim',
        description: 'Pesan Anda telah berhasil dikirim ke penerima.'
      });

      form.reset();
      fetchMessages();
    } catch (error: any) {
      toast({
        title: 'Gagal Mengirim Pesan',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      sent: { label: 'Terkirim', variant: 'secondary' as const, icon: Send },
      read: { label: 'Dibaca', variant: 'default' as const, icon: CheckCircle },
      replied: { label: 'Dibalas', variant: 'outline' as const, icon: MessageCircle }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.sent;
    const Icon = statusConfig.icon;
    
    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { label: 'Rendah', variant: 'outline' as const },
      medium: { label: 'Sedang', variant: 'secondary' as const },
      high: { label: 'Tinggi', variant: 'default' as const },
      urgent: { label: 'Mendesak', variant: 'destructive' as const }
    };
    
    const priorityConfig = config[priority as keyof typeof config] || config.medium;
    return <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      wali_kelas: 'Wali Kelas',
      guru_bk: 'Guru BK',
      waka_kesiswaan: 'Waka Kesiswaan',
      admin: 'Administrator'
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (loading) {
    return <div>Memuat pusat komunikasi...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Pusat Komunikasi Orang Tua
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Berkomunikasi langsung dengan guru dan staf sekolah mengenai perkembangan anak Anda.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">Pesan</TabsTrigger>
          <TabsTrigger value="contacts">Kontak Guru</TabsTrigger>
          <TabsTrigger value="compose">Tulis Pesan</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pesan</CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada pesan yang dikirim
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{message.subject}</h4>
                          <p className="text-sm text-muted-foreground">
                            Kepada: {getRoleLabel(message.recipient_type)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(message.status)}
                          {getPriorityBadge(message.priority)}
                        </div>
                      </div>
                      <p className="text-sm mb-3 line-clamp-2">{message.message}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedMessage(message)}
                            >
                              Lihat Detail
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{selectedMessage?.subject}</DialogTitle>
                            </DialogHeader>
                            {selectedMessage && (
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  {getStatusBadge(selectedMessage.status)}
                                  {getPriorityBadge(selectedMessage.priority)}
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">Kepada:</div>
                                  <div className="font-medium">{getRoleLabel(selectedMessage.recipient_type)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">Pesan:</div>
                                  <div className="whitespace-pre-wrap">{selectedMessage.message}</div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Dikirim: {format(new Date(selectedMessage.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                </div>
                                
                                {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium mb-2">Balasan:</div>
                                    <div className="space-y-2">
                                      {selectedMessage.replies.map((reply) => (
                                        <div key={reply.id} className="bg-gray-50 p-3 rounded">
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-sm">{reply.sender_name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {format(new Date(reply.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                            </span>
                                          </div>
                                          <div className="text-sm">{reply.message}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kontak Guru & Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{contact.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {getRoleLabel(contact.role)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Kirim Pesan
                      </Button>
                      {contact.phone && (
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tulis Pesan Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recipient_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penerima</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih penerima" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                              <SelectItem value="guru_bk">Guru BK</SelectItem>
                              <SelectItem value="waka_kesiswaan">Waka Kesiswaan</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioritas</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih prioritas" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Rendah</SelectItem>
                              <SelectItem value="medium">Sedang</SelectItem>
                              <SelectItem value="high">Tinggi</SelectItem>
                              <SelectItem value="urgent">Mendesak</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subjek</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan subjek pesan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pesan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tulis pesan Anda di sini..."
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Kirim Pesan
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
