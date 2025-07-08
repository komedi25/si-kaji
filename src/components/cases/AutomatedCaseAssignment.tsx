import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Plus, Edit, Trash2, Save, X, Users, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface WorkflowRule {
  id: string;
  name: string;
  category: string | null;
  priority: string | null;
  auto_assign_to: string | null;
  escalation_conditions: any;
  escalation_to: string | null;
  max_response_hours: number;
  is_active: boolean;
  created_at: string;
}

export const AutomatedCaseAssignment = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creating/editing rules
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    priority: '',
    auto_assign_to: '',
    escalation_to: '',
    max_response_hours: 24,
    escalation_hours: 48
  });

  useEffect(() => {
    fetchWorkflowRules();
  }, []);

  const fetchWorkflowRules = async () => {
    try {
      const { data, error } = await supabase
        .from('case_workflow_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching workflow rules:', error);
      toast({
        title: "Error",
        description: "Gagal memuat aturan workflow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      const ruleData = {
        name: formData.name,
        category: formData.category || null,
        priority: formData.priority || null,
        auto_assign_to: formData.auto_assign_to || null,
        escalation_to: formData.escalation_to || null,
        max_response_hours: formData.max_response_hours,
        escalation_conditions: formData.escalation_to ? {
          no_response_hours: formData.escalation_hours,
          from_role: formData.auto_assign_to
        } : {}
      };

      let result;
      if (editingRule) {
        result = await supabase
          .from('case_workflow_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
      } else {
        result = await supabase
          .from('case_workflow_rules')
          .insert(ruleData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Berhasil",
        description: editingRule ? "Aturan berhasil diperbarui" : "Aturan berhasil dibuat"
      });

      resetForm();
      fetchWorkflowRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan aturan",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('case_workflow_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Aturan berhasil dihapus"
      });

      fetchWorkflowRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus aturan",
        variant: "destructive"
      });
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('case_workflow_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: isActive ? "Aturan dinonaktifkan" : "Aturan diaktifkan"
      });

      fetchWorkflowRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status aturan",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      priority: '',
      auto_assign_to: '',
      escalation_to: '',
      max_response_hours: 24,
      escalation_hours: 48
    });
    setEditingRule(null);
    setIsCreating(false);
  };

  const startEdit = (rule: WorkflowRule) => {
    setFormData({
      name: rule.name,
      category: rule.category || '',
      priority: rule.priority || '',
      auto_assign_to: rule.auto_assign_to || '',
      escalation_to: rule.escalation_to || '',
      max_response_hours: rule.max_response_hours,
      escalation_hours: rule.escalation_conditions?.no_response_hours || 48
    });
    setEditingRule(rule);
    setIsCreating(true);
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      tppk: 'bg-blue-100 text-blue-800',
      p4gn: 'bg-purple-100 text-purple-800',
      arps: 'bg-green-100 text-green-800',
      waka_kesiswaan: 'bg-red-100 text-red-800',
      guru_bk: 'bg-yellow-100 text-yellow-800'
    };
    
    const roleLabels = {
      tppk: 'TPPK',
      p4gn: 'P4GN',
      arps: 'ARPS',
      waka_kesiswaan: 'Waka Kesiswaan',
      guru_bk: 'Guru BK'
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
        {roleLabels[role as keyof typeof roleLabels] || role}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return <Badge variant="outline">Semua Kategori</Badge>;
    
    const categoryLabels = {
      bullying: 'Bullying',
      kekerasan: 'Kekerasan',
      narkoba: 'Narkoba',
      pergaulan_bebas: 'Pergaulan Bebas',
      tawuran: 'Tawuran',
      pencurian: 'Pencurian',
      vandalisme: 'Vandalisme',
      lainnya: 'Lainnya'
    };

    return (
      <Badge variant="secondary">
        {categoryLabels[category as keyof typeof categoryLabels] || category}
      </Badge>
    );
  };

  if (!hasRole('admin') && !hasRole('waka_kesiswaan')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Akses terbatas untuk admin dan waka kesiswaan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manajemen Aturan Assignment Otomatis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Kelola aturan otomatis untuk penugasan dan eskalasi kasus
            </p>
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Aturan
            </Button>
          </div>

          {/* Create/Edit Form */}
          {isCreating && (
            <Card className="mb-6 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingRule ? 'Edit Aturan' : 'Buat Aturan Baru'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nama Aturan</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nama aturan workflow"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Kategori Kasus</label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori (kosong = semua)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Semua Kategori</SelectItem>
                        <SelectItem value="bullying">Bullying</SelectItem>
                        <SelectItem value="kekerasan">Kekerasan</SelectItem>
                        <SelectItem value="narkoba">Narkoba</SelectItem>
                        <SelectItem value="pergaulan_bebas">Pergaulan Bebas</SelectItem>
                        <SelectItem value="tawuran">Tawuran</SelectItem>
                        <SelectItem value="pencurian">Pencurian</SelectItem>
                        <SelectItem value="vandalisme">Vandalisme</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Auto-Assign ke Role</label>
                    <Select 
                      value={formData.auto_assign_to} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, auto_assign_to: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tppk">TPPK</SelectItem>
                        <SelectItem value="p4gn">P4GN</SelectItem>
                        <SelectItem value="arps">ARPS</SelectItem>
                        <SelectItem value="guru_bk">Guru BK</SelectItem>
                        <SelectItem value="waka_kesiswaan">Waka Kesiswaan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Response Time (jam)</label>
                    <Input
                      type="number"
                      value={formData.max_response_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_response_hours: parseInt(e.target.value) }))}
                      min="1"
                      max="168"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Eskalasi ke Role (Opsional)</label>
                    <Select 
                      value={formData.escalation_to} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, escalation_to: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role eskalasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tidak ada eskalasi</SelectItem>
                        <SelectItem value="waka_kesiswaan">Waka Kesiswaan</SelectItem>
                        <SelectItem value="guru_bk">Guru BK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.escalation_to && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Eskalasi setelah (jam)</label>
                      <Input
                        type="number"
                        value={formData.escalation_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, escalation_hours: parseInt(e.target.value) }))}
                        min="1"
                        max="168"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveRule} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Simpan
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules List */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className={`${rule.is_active ? '' : 'opacity-60'}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {getCategoryBadge(rule.category)}
                          {rule.auto_assign_to && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {getRoleBadge(rule.auto_assign_to)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <Badge variant="outline">{rule.max_response_hours}h response</Badge>
                          </div>
                          {rule.escalation_to && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              <span className="text-xs">→ {getRoleBadge(rule.escalation_to)}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Dibuat: {format(new Date(rule.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => startEdit(rule)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant={rule.is_active ? "secondary" : "default"}
                          onClick={() => handleToggleRule(rule.id, rule.is_active)}
                        >
                          {rule.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteRule(rule.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {rules.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Belum ada aturan workflow</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};