import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Loader2, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, roles, refreshProfile, isLoading: authLoading, isSeller, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setErrors({});
    
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user) return;

    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone || null,
        address: formData.address || null,
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      toast.error('Erro ao guardar perfil');
      console.error('Profile update error:', error);
    } else {
      toast.success('Perfil atualizado com sucesso!');
      await refreshProfile();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadges = () => {
    const badges = [];
    if (roles.includes('admin')) {
      badges.push(<Badge key="admin" variant="default">Administrador</Badge>);
    }
    if (roles.includes('seller')) {
      badges.push(<Badge key="seller" variant="secondary">Vendedor</Badge>);
    }
    if (roles.includes('client')) {
      badges.push(<Badge key="client" variant="outline">Cliente</Badge>);
    }
    return badges;
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">Gerencie as suas informações pessoais</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <h2 className="mt-4 font-display text-xl font-semibold">
                  {profile?.full_name || 'Utilizador'}
                </h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {getRoleBadges()}
                </div>

                <Separator className="my-4" />

                <div className="w-full space-y-2 text-left text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{profile?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="line-clamp-2">{profile.address}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="w-full space-y-2">
                  {isSeller && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/vendedor')}
                    >
                      Painel do Vendedor
                    </Button>
                  )}
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/admin')}
                    >
                      Painel Admin
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/pedidos')}
                  >
                    Meus Pedidos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize os seus dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="security">Segurança</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="full_name"
                        placeholder="O seu nome completo"
                        className="pl-10"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    </div>
                    {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={profile?.email || ''}
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+244 XXX XXX XXX"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      placeholder="O seu endereço completo"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                    {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                  </div>

                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A guardar...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Alterações
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Alterar Palavra-passe</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Para alterar a sua palavra-passe, utilize a opção de recuperação de senha.
                    </p>
                    <Button variant="outline" disabled>
                      Alterar Palavra-passe (em breve)
                    </Button>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Sessões Ativas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Gerencie os dispositivos onde está conectado.
                    </p>
                    <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-md">
                      <div>
                        <p className="text-sm font-medium">Sessão Atual</p>
                        <p className="text-xs text-muted-foreground">Este dispositivo</p>
                      </div>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                  </div>

                  <div className="rounded-lg border border-destructive/20 p-4">
                    <h3 className="font-medium text-destructive mb-2">Zona de Perigo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ações irreversíveis relacionadas à sua conta.
                    </p>
                    <Button variant="destructive" disabled>
                      Eliminar Conta (em breve)
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
