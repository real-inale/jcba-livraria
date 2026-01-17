import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SellerLayout from '@/components/seller/SellerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Store, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface SellerProfile {
  id: string;
  store_name: string;
  store_description: string | null;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  commission_rate: number;
  created_at: string;
  approved_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  suspended: { label: 'Suspenso', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function SellerSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    store_name: '',
    store_description: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (data) {
        setProfile(data as SellerProfile);
        setForm({
          store_name: data.store_name,
          store_description: data.store_description || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          store_name: form.store_name,
          store_description: form.store_description || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({ title: 'Configurações guardadas com sucesso!' });
      fetchProfile();
    } catch (error: any) {
      toast({
        title: 'Erro ao guardar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SellerLayout>
    );
  }

  if (!profile) {
    return (
      <SellerLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Perfil de vendedor não encontrado.</p>
        </div>
      </SellerLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[profile.status];
  const StatusIcon = statusConfig.icon;

  return (
    <SellerLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Configurações da Loja</h1>
          <p className="text-muted-foreground">
            Gerencie as informações da sua loja
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Estado da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                <span>Estado:</span>
              </div>
              <Badge className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Taxa de Comissão:</span>
              <span className="font-medium">{profile.commission_rate}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Membro desde:</span>
              <span className="font-medium">{formatDate(profile.created_at)}</span>
            </div>

            {profile.approved_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Aprovado em:</span>
                <span className="font-medium">{formatDate(profile.approved_at)}</span>
              </div>
            )}

            {profile.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  ⏳ A sua conta está pendente de aprovação. Assim que for aprovada, poderá começar a vender os seus livros.
                </p>
              </div>
            )}

            {profile.status === 'suspended' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-red-800">
                  ⚠️ A sua conta está suspensa. Entre em contacto com o suporte para mais informações.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Info Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Loja</CardTitle>
            <CardDescription>
              Estas informações serão exibidas publicamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store_name">Nome da Loja *</Label>
                <Input
                  id="store_name"
                  value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store_description">Descrição da Loja</Label>
                <Textarea
                  id="store_description"
                  value={form.store_description}
                  onChange={(e) => setForm({ ...form, store_description: e.target.value })}
                  rows={4}
                  placeholder="Descreva a sua loja e os tipos de livros que vende..."
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'A guardar...' : 'Guardar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">💡 Precisa de ajuda?</h4>
            <p className="text-sm text-muted-foreground">
              Se tiver dúvidas sobre a sua conta de vendedor ou precisar de suporte, 
              entre em contacto connosco através do email suporte@livrariajcba.ao
            </p>
          </CardContent>
        </Card>
      </div>
    </SellerLayout>
  );
}
