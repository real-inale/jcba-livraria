import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Book, Mail, Lock, User, Store, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Palavra-passe deve ter pelo menos 6 caracteres'),
});

const clientSignupSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Palavra-passe deve ter pelo menos 6 caracteres'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Deve aceitar os termos' }) }),
});

const sellerSignupSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Palavra-passe deve ter pelo menos 6 caracteres'),
  storeName: z.string().min(3, 'Nome da loja deve ter pelo menos 3 caracteres'),
  storeDescription: z.string().optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Deve aceitar os termos' }) }),
});

type SignupType = 'client' | 'seller';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const mode = searchParams.get('mode') || 'login';
  const initialType = searchParams.get('type') as SignupType || 'client';
  
  const [activeTab, setActiveTab] = useState(mode === 'signup' || mode === 'seller' ? 'signup' : 'login');
  const [signupType, setSignupType] = useState<SignupType>(mode === 'seller' ? 'seller' : initialType);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [clientSignupData, setClientSignupData] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    acceptTerms: false 
  });
  const [sellerSignupData, setSellerSignupData] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    storeName: '',
    storeDescription: '',
    acceptTerms: false 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email ou palavra-passe incorretos' : error.message);
    } else {
      toast.success('Bem-vindo de volta!');
      navigate('/');
    }
  };

  const handleClientSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = clientSignupSchema.safeParse(clientSignupData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(clientSignupData.email, clientSignupData.password, clientSignupData.fullName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este email já está registado');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Conta criada com sucesso! Bem-vindo!');
      navigate('/');
    }
  };

  const handleSellerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = sellerSignupSchema.safeParse(sellerSignupData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    // First create the user account
    const { error: signUpError } = await signUp(
      sellerSignupData.email, 
      sellerSignupData.password, 
      sellerSignupData.fullName
    );

    if (signUpError) {
      setIsLoading(false);
      if (signUpError.message.includes('already registered')) {
        toast.error('Este email já está registado');
      } else {
        toast.error(signUpError.message);
      }
      return;
    }

    // Wait a moment for the user to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the current session to get the user ID
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      setIsLoading(false);
      toast.error('Erro ao criar conta. Tente novamente.');
      return;
    }

    // Create seller profile
    const { error: sellerError } = await supabase
      .from('seller_profiles')
      .insert({
        user_id: session.user.id,
        store_name: sellerSignupData.storeName,
        store_description: sellerSignupData.storeDescription || null,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        status: 'pending'
      });

    if (sellerError) {
      setIsLoading(false);
      console.error('Seller profile error:', sellerError);
      toast.error('Conta criada, mas houve erro ao criar perfil de vendedor. Contacte o suporte.');
      navigate('/');
      return;
    }

    // Add seller role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: session.user.id,
        role: 'seller'
      });

    if (roleError) {
      console.error('Role error:', roleError);
    }

    // Refresh profile to get updated roles
    await refreshProfile();

    setIsLoading(false);
    toast.success('Conta de vendedor criada! Aguarde aprovação do administrador.');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Book className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Livraria JCBA</span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <h1 className="font-display text-2xl font-bold mb-2">Bem-vindo de volta</h1>
              <p className="text-muted-foreground mb-6">Entre na sua conta para continuar</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'A entrar...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <h1 className="font-display text-2xl font-bold mb-2">Criar uma conta</h1>
              <p className="text-muted-foreground mb-4">Escolha o tipo de conta que deseja criar</p>

              {/* Signup Type Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setSignupType('client')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    signupType === 'client'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    signupType === 'client' ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <User className={`h-6 w-6 ${signupType === 'client' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`font-medium ${signupType === 'client' ? 'text-primary' : 'text-foreground'}`}>
                    Cliente
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    Comprar livros
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupType('seller')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    signupType === 'seller'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    signupType === 'seller' ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <Store className={`h-6 w-6 ${signupType === 'seller' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`font-medium ${signupType === 'seller' ? 'text-primary' : 'text-foreground'}`}>
                    Vendedor
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    Vender livros
                  </span>
                </button>
              </div>

              {/* Client Signup Form */}
              {signupType === 'client' && (
                <form onSubmit={handleClientSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="client-name"
                        type="text"
                        placeholder="O seu nome"
                        className="pl-10"
                        value={clientSignupData.fullName}
                        onChange={(e) => setClientSignupData({ ...clientSignupData, fullName: e.target.value })}
                      />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="client-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={clientSignupData.email}
                        onChange={(e) => setClientSignupData({ ...clientSignupData, email: e.target.value })}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-password">Palavra-passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="client-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={clientSignupData.password}
                        onChange={(e) => setClientSignupData({ ...clientSignupData, password: e.target.value })}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="client-terms"
                      checked={clientSignupData.acceptTerms}
                      onCheckedChange={(checked) => setClientSignupData({ ...clientSignupData, acceptTerms: checked as boolean })}
                    />
                    <Label htmlFor="client-terms" className="text-sm leading-relaxed">
                      Li e aceito os{' '}
                      <Link to="/termos-clientes" className="text-primary hover:underline">
                        Termos e Condições
                      </Link>
                    </Label>
                  </div>
                  {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'A criar conta...' : 'Criar Conta de Cliente'}
                  </Button>
                </form>
              )}

              {/* Seller Signup Form */}
              {signupType === 'seller' && (
                <form onSubmit={handleSellerSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="seller-name"
                        type="text"
                        placeholder="O seu nome"
                        className="pl-10"
                        value={sellerSignupData.fullName}
                        onChange={(e) => setSellerSignupData({ ...sellerSignupData, fullName: e.target.value })}
                      />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="seller-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={sellerSignupData.email}
                        onChange={(e) => setSellerSignupData({ ...sellerSignupData, email: e.target.value })}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-password">Palavra-passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="seller-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={sellerSignupData.password}
                        onChange={(e) => setSellerSignupData({ ...sellerSignupData, password: e.target.value })}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-store-name">Nome da Loja</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="seller-store-name"
                        type="text"
                        placeholder="Nome da sua loja"
                        className="pl-10"
                        value={sellerSignupData.storeName}
                        onChange={(e) => setSellerSignupData({ ...sellerSignupData, storeName: e.target.value })}
                      />
                    </div>
                    {errors.storeName && <p className="text-sm text-destructive">{errors.storeName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-store-description">Descrição da Loja (opcional)</Label>
                    <Textarea
                      id="seller-store-description"
                      placeholder="Descreva a sua loja..."
                      value={sellerSignupData.storeDescription}
                      onChange={(e) => setSellerSignupData({ ...sellerSignupData, storeDescription: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="seller-terms"
                      checked={sellerSignupData.acceptTerms}
                      onCheckedChange={(checked) => setSellerSignupData({ ...sellerSignupData, acceptTerms: checked as boolean })}
                    />
                    <Label htmlFor="seller-terms" className="text-sm leading-relaxed">
                      Li e aceito os{' '}
                      <Link to="/termos-vendedores" className="text-primary hover:underline">
                        Termos e Condições para Vendedores
                      </Link>
                    </Label>
                  </div>
                  {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}

                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Nota:</p>
                    <p>A sua conta de vendedor será criada com status pendente. Um administrador irá analisar e aprovar o seu registo.</p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'A criar conta...' : 'Criar Conta de Vendedor'}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex lg:flex-1 hero-gradient items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="text-8xl mb-6">📚</div>
          <h2 className="font-display text-3xl font-bold mb-4">
            {signupType === 'seller' && activeTab === 'signup' 
              ? 'Torne-se um vendedor' 
              : 'A sua livraria online de confiança'
            }
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            {signupType === 'seller' && activeTab === 'signup'
              ? 'Junte-se à nossa plataforma e venda os seus livros para milhares de clientes em Angola.'
              : 'Milhares de títulos, entrega em todo o país, e os melhores preços de Angola.'
            }
          </p>
          <div className="mt-8 space-y-3 text-left">
            {signupType === 'seller' && activeTab === 'signup' ? (
              ['Gestão fácil de inventário', 'Comissões competitivas', 'Pagamentos seguros'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                    <Check className="h-4 w-4" />
                  </div>
                  <span>{item}</span>
                </div>
              ))
            ) : (
              ['Livros físicos e digitais', 'Pagamento seguro', 'Entrega em todo o país'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                    <Check className="h-4 w-4" />
                  </div>
                  <span>{item}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
