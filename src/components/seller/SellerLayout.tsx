import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShoppingCart, 
  DollarSign,
  Settings,
  ArrowLeft,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SellerLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/vendedor' },
  { icon: BookOpen, label: 'Meus Livros', path: '/vendedor/livros' },
  { icon: ShoppingCart, label: 'Vendas', path: '/vendedor/vendas' },
  { icon: DollarSign, label: 'Comissões', path: '/vendedor/comissoes' },
  { icon: Settings, label: 'Configurações', path: '/vendedor/configuracoes' },
];

export default function SellerLayout({ children }: SellerLayoutProps) {
  const location = useLocation();
  const { user, isSeller, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSeller) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Store className="h-6 w-6 text-primary mr-2" />
            <span className="text-lg font-bold">Painel Vendedor</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Back to site */}
          <div className="border-t p-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao site
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
