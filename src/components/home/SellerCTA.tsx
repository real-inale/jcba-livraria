import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SellerCTA() {
  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl hero-gradient p-8 md:p-12 lg:p-16 overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
                Venda os seus livros na maior plataforma de Angola
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/90">
                Junte-se a milhares de vendedores e alcance leitores em todo o país. 
                Registo simples, comissões justas e pagamentos seguros.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 text-primary-foreground">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">+1000</p>
                    <p className="text-sm text-primary-foreground/80">Vendas/mês</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">+500</p>
                    <p className="text-sm text-primary-foreground/80">Vendedores</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">10-20%</p>
                    <p className="text-sm text-primary-foreground/80">Comissão</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button size="lg" variant="secondary" className="group gap-2" asChild>
                  <Link to="/auth?mode=seller">
                    Começar a Vender
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/20 to-transparent rounded-2xl" />
                <div className="absolute inset-4 bg-primary-foreground/10 rounded-xl backdrop-blur flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <p className="text-6xl font-display font-bold">📚</p>
                    <p className="mt-4 text-xl font-semibold">Seja um Vendedor</p>
                    <p className="text-primary-foreground/80">Alcance milhares de leitores</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
