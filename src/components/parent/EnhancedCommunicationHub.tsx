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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  MessageCircle, Send, Phone, Mail, Clock, CheckCircle,
  User, Reply, Archive, Star, Search, Filter
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

interface Communication {
  id: string;
  subject: string;
  message: string;
  recipient_type: string;
  recipient_id: string | null;
  priority: string;
  status: 'sent' | 'read' | 'replied' | 'closed';
  read_at: string | null;
  replied_at: string | null;
  reply_message: string | null;
  created_at: string;
  updated_at: string;
  recipient_profile?: {
    full_name: string;
    phone?: string;
  };
}

interface TeacherContact {
  id: string;
  full_name: string;
  role: string;
  phone?: string;
  email?: string;
  last_contacted?: string;
}

export const EnhancedCommunicationHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [contacts, setContacts] = useState<TeacherContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      priority: 'medium'
    }
  });

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        fetchCommunications(),
        fetchTeacherContacts()
      ]).finally(() => setLoading(false));
      
      subscribeToUpdates();
    }
  }, [user]);

  const fetchCommunications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('parent_communications')
        .select('*')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCommunications((data || []) as Communication[]);
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const fetchTeacherContacts = async () => {
    if (!user?.id) return;

    try {
      // Get parent access to find student and related teachers
      const { data: parentAccess } = await supabase
        .from('parent_access')
        .select(`
          students!inner (
            id,
            student_enrollments!inner (
              classes!inner (
                homeroom_teacher_id
              )
            )
          )
        `)
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();

      const contactsList: TeacherContact[] = [];

      // Add homeroom teacher
      if (parentAccess?.students?.student_enrollments?.[0]?.classes?.homeroom_teacher_id) {
        const teacherId = parentAccess.students.student_enrollments[0].classes.homeroom_teacher_id;
        
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .eq('id', teacherId)
          .single();

        if (teacherProfile) {
          // Get last communication date
          const { data: lastComm } = await supabase
            .from('parent_communications')
            .select('created_at')
            .eq('parent_user_id', user.id)
            .eq('recipient_id', teacherId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          contactsList.push({
            id: teacherProfile.id,
            full_name: teacherProfile.full_name,
            role: 'wali_kelas',
            phone: teacherProfile.phone || undefined,
            last_contacted: lastComm?.created_at
          });
        }
      }

      // Add other staff members
      const { data: staffData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['guru_bk', 'waka_kesiswaan'])
        .eq('is_active', true);

      if (staffData) {
        for (const staff of staffData) {
          // Get profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .eq('id', staff.user_id)
            .single();

          if (profile && !contactsList.find(c => c.id === profile.id)) {
            // Get last communication date
            const { data: lastComm } = await supabase
              .from('parent_communications')
              .select('created_at')
              .eq('parent_user_id', user.id)
              .eq('recipient_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            contactsList.push({
              id: profile.id,
              full_name: profile.full_name,
              role: staff.role,
              phone: profile.phone || undefined,
              last_contacted: lastComm?.created_at
            });
          }
        }
      }

      setContacts(contactsList);
    } catch (error) {
      console.error('Error fetching teacher contacts:', error);
    }
  };

  const subscribeToUpdates = () => {
    if (!user?.id) return;

    const channel = supabase
      .channel('parent-communications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parent_communications',
          filter: `parent_user_id=eq.${user.id}`
        },
        () => {
          fetchCommunications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const onSubmit = async (data: MessageFormData) => {
    if (!user?.id) return;

    try {
      // Get student ID
      const { data: parentAccess } = await supabase
        .from('parent_access')
        .select('student_id')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!parentAccess) {
        throw new Error('Student data not found');
      }

      // Find recipient ID based on role
      let recipientId = null;
      if (data.recipient_type === 'wali_kelas') {
        const contact = contacts.find(c => c.role === 'wali_kelas');
        recipientId = contact?.id;
      } else {
        const contact = contacts.find(c => c.role === data.recipient_type);
        recipientId = contact?.id;
      }

      const { error } = await supabase
        .from('parent_communications')
        .insert({
          parent_user_id: user.id,
          student_id: parentAccess.student_id,
          recipient_id: recipientId,
          recipient_type: data.recipient_type,
          subject: data.subject,
          message: data.message,
          priority: data.priority
        });

      if (error) throw error;

      toast({
        title: 'Pesan Terkirim',
        description: 'Pesan Anda telah berhasil dikirim.'
      });

      form.reset();
      fetchCommunications();
    } catch (error: any) {
      toast({
        title: 'Gagal Mengirim Pesan',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const markAsRead = async (communicationId: string) => {
    try {
      const { error } = await supabase
        .from('parent_communications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString() 
        })
        .eq('id', communicationId)
        .eq('parent_user_id', user?.id);

      if (error) throw error;

      fetchCommunications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      sent: { label: 'Terkirim', variant: 'secondary' as const, icon: Send },
      read: { label: 'Dibaca', variant: 'default' as const, icon: CheckCircle },
      replied: { label: 'Dibalas', variant: 'outline' as const, icon: Reply },
      closed: { label: 'Ditutup', variant: 'outline' as const, icon: Archive }
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

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = searchTerm === '' || 
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Pusat Komunikasi dengan Guru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Berkomunikasi langsung dengan wali kelas, guru BK, dan staf sekolah untuk memantau 
            perkembangan anak Anda dengan lebih baik.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">Pesan</TabsTrigger>
          <TabsTrigger value="contacts">Kontak</TabsTrigger>
          <TabsTrigger value="compose">Tulis Pesan</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari pesan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="sent">Terkirim</SelectItem>
                    <SelectItem value="read">Dibaca</SelectItem>
                    <SelectItem value="replied">Dibalas</SelectItem>
                    <SelectItem value="closed">Ditutup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Riwayat Komunikasi ({filteredCommunications.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {filteredCommunications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada komunikasi</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCommunications.map((comm) => (
                      <div
                        key={comm.id}
                        className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                          comm.status === 'sent' ? 'border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => setSelectedMessage(comm)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-sm line-clamp-1">
                                  {comm.subject}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Kepada: {getRoleLabel(comm.recipient_type)}
                                  {comm.recipient_profile && (
                                    <span> ({comm.recipient_profile.full_name})</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                {getStatusBadge(comm.status)}
                                {getPriorityBadge(comm.priority)}
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {comm.message}
                            </p>
                            
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>
                                {format(new Date(comm.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                              </span>
                              {comm.replied_at && (
                                <span className="flex items-center gap-1">
                                  <Reply className="h-3 w-3" />
                                  Dibalas {format(new Date(comm.replied_at), 'dd MMM', { locale: id })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
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
                    <div className="flex items-start justify-between mb-3">
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
                    
                    <div className="space-y-2 mb-4">
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.last_contacted && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Terakhir: {format(new Date(contact.last_contacted), 'dd MMM yyyy', { locale: id })}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          form.setValue('recipient_type', contact.role as any);
                          // Switch to compose tab
                        }}
                      >
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
                            placeholder="Tulis pesan Anda..."
                            rows={6}
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

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedMessage.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                {getStatusBadge(selectedMessage.status)}
                {getPriorityBadge(selectedMessage.priority)}
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Kepada:</div>
                <div className="font-medium">
                  {getRoleLabel(selectedMessage.recipient_type)}
                  {selectedMessage.recipient_profile && (
                    <span> ({selectedMessage.recipient_profile.full_name})</span>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Pesan:</div>
                <div className="whitespace-pre-wrap border rounded p-3 bg-muted/30">
                  {selectedMessage.message}
                </div>
              </div>
              
              {selectedMessage.reply_message && (
                <div>
                  <div className="text-sm text-muted-foreground">Balasan:</div>
                  <div className="whitespace-pre-wrap border rounded p-3 bg-blue-50">
                    {selectedMessage.reply_message}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Dibalas: {selectedMessage.replied_at && format(new Date(selectedMessage.replied_at), 'dd MMM yyyy HH:mm', { locale: id })}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground border-t pt-2">
                Dikirim: {format(new Date(selectedMessage.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                {selectedMessage.read_at && (
                  <span className="ml-4">
                    Dibaca: {format(new Date(selectedMessage.read_at), 'dd MMM yyyy HH:mm', { locale: id })}
                  </span>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};