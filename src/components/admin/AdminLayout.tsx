import { ReactNode, useEffect, useState } from 'react';
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
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    const fetchPendingCounts = async () => {
      const [{ count: sellers }, { count: orders }] = await Promise.all([
        supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'awaiting_payment']),
      ]);
      setPendingCount((sellers || 0) + (orders || 0));
    };
    fetchPendingCounts();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">A carregar...</p>
        </div>
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

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar-background border-r border-sidebar-border hidden lg:flex lg:flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border/50">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg transition-transform group-hover:scale-105">
              <BookOpen className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-sidebar-foreground tracking-tight">
                Livraria JCBA
              </h1>
              <p className="text-xs text-sidebar-foreground/60 font-medium">
                Painel de Administração
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5 transition-transform group-hover:scale-110',
                    active && 'text-sidebar-primary-foreground'
                  )} />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User & Actions */}
        <div className="p-4 border-t border-sidebar-border/50 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-sidebar-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                Admin
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl"
            asChild
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-3" />
              Voltar à Loja
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Terminar Sessão
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-sidebar-background/95 backdrop-blur-md border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-sidebar-primary" />
            <span className="font-display font-bold text-sidebar-foreground">Admin</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-sidebar-foreground">
              <Bell className="h-5 w-5" />
              {pendingCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="absolute top-full left-0 right-0 bg-sidebar-background border-b border-sidebar-border shadow-lg animate-fade-in">
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-sidebar-border mt-4 space-y-1">
                <Link
                  to="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground/70"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar à Loja
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive/80"
                >
                  <LogOut className="h-5 w-5" />
                  Terminar Sessão
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{title}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-muted-foreground text-lg">{description}</p>
            )}
          </div>

          {/* Page Content */}
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
