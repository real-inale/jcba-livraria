import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Book, Search, ShoppingCart, User, Menu, X, Bell, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export function Header() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isSeller, signOut } = useAuth();
  const { itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/livros?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Book className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="hidden font-display text-xl font-semibold text-foreground sm:inline-block">
              Livraria JCBA
            </span>
          </Link>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-md mx-4 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar livros, autores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-secondary/50 border-transparent focus:border-primary focus:bg-background"
              />
            </div>
          </form>

          {/* Navigation - Desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/livros">Catálogo</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/categorias">Categorias</Link>
            </Button>
            
            {user ? (
              <>
                {/* Cart */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/carrinho">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-accent text-accent-foreground">
                        {itemCount}
                      </Badge>
                    )}
                  </Link>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/notificacoes">
                    <Bell className="h-5 w-5" />
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-1">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{profile?.full_name || 'Utilizador'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/minha-conta">
                        <User className="mr-2 h-4 w-4" />
                        Minha Conta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/pedidos">
                        <Book className="mr-2 h-4 w-4" />
                        Meus Pedidos
                      </Link>
                    </DropdownMenuItem>
                    {isSeller && (
                      <DropdownMenuItem asChild>
                        <Link to="/vendedor">
                          <Settings className="mr-2 h-4 w-4" />
                          Painel do Vendedor
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <Settings className="mr-2 h-4 w-4" />
                          Administração
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth?mode=signup">Criar Conta</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t py-4 md:hidden animate-slide-up">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar livros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start" asChild>
                <Link to="/livros" onClick={() => setMobileMenuOpen(false)}>Catálogo</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link to="/categorias" onClick={() => setMobileMenuOpen(false)}>Categorias</Link>
              </Button>
              {user ? (
                <>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/carrinho" onClick={() => setMobileMenuOpen(false)}>
                      Carrinho {itemCount > 0 && `(${itemCount})`}
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/minha-conta" onClick={() => setMobileMenuOpen(false)}>Minha Conta</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/pedidos" onClick={() => setMobileMenuOpen(false)}>Meus Pedidos</Link>
                  </Button>
                  {isSeller && (
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/vendedor" onClick={() => setMobileMenuOpen(false)}>Painel do Vendedor</Link>
                    </Button>
                  )}
                  {isAdmin && (
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Administração</Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                  </Button>
                  <Button className="justify-start" asChild>
                    <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>Criar Conta</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
