import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingBag, 
  FolderTree, 
  Settings,
  BookOpen,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/livros', label: 'Livros', icon: BookOpen },
  { href: '/admin/utilizadores', label: 'Utilizadores', icon: Users },
  { href: '/admin/vendedores', label: 'Vendedores', icon: Store },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/categorias', label: 'Categorias', icon: FolderTree },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
];

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-3 text-sidebar-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
                <LayoutDashboard className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold">Livraria JCBA</h1>
                <p className="text-xs text-sidebar-foreground/70">Administração</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-3" />
                Voltar à Loja
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-sidebar-background border-b border-sidebar-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2 text-sidebar-foreground">
            <LayoutDashboard className="h-6 w-6" />
            <span className="font-display font-semibold">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-sidebar-foreground" asChild>
              <Link to="/">Loja</Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive"
              onClick={handleSignOut}
            >
              Sair
            </Button>
          </div>
        </div>
        {/* Mobile Navigation */}
        <nav className="flex overflow-x-auto px-4 pb-4 gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'bg-sidebar-accent/50 text-sidebar-foreground/80'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="mt-2 text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
