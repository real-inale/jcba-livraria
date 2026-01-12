import { Link } from 'react-router-dom';
import { Book, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Book className="h-6 w-6" />
              </div>
              <span className="font-display text-xl font-semibold">Livros Angola</span>
            </Link>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              A maior livraria online de Angola. Encontre os melhores livros físicos e digitais 
              com entrega em todo o país.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/livros" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Catálogo de Livros
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Categorias
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=seller" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Vender na Plataforma
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Sobre Nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/ajuda" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Centro de Ajuda
                </Link>
              </li>
              <li>
                <Link to="/termos-clientes" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Termos para Clientes
                </Link>
              </li>
              <li>
                <Link to="/termos-vendedores" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Termos para Vendedores
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Mail className="h-4 w-4" />
                <span>suporte@livrosangola.co.ao</span>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Phone className="h-4 w-4" />
                <span>+244 923 456 789</span>
              </li>
              <li className="flex items-start gap-2 text-primary-foreground/80">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Luanda, Angola</span>
              </li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} Livros Angola. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
