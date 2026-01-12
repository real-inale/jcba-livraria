import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-10" />
      
      <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl animate-slide-up">
            Descubra o Prazer da Leitura
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/90 md:text-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            A maior livraria online de Angola. Milhares de títulos em livros físicos e digitais, 
            com entrega em todo o país.
          </p>
          
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button size="lg" variant="secondary" className="group gap-2 text-base" asChild>
              <Link to="/livros">
                Explorar Catálogo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/auth?mode=seller">
                Vender Livros
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-4 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">+10.000 Títulos</h3>
              <p className="text-sm text-primary-foreground/80">Livros físicos e digitais</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Entrega Nacional</h3>
              <p className="text-sm text-primary-foreground/80">Em todo o território</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Pagamento Seguro</h3>
              <p className="text-sm text-primary-foreground/80">Multicaixa, PayPay e mais</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
