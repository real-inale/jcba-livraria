import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Layout } from '@/components/layout/Layout';
import { Store, DollarSign, BookOpen, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SellerTerms() {
    const containerRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline();
        tl.from('h1', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out' })
            .from('.feature-card', {
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.5)'
            }, '-=0.4');
    }, { scope: containerRef });

    return (
        <Layout>
            <div ref={containerRef} className="min-h-screen bg-background pb-16">
                <div className="bg-sidebar-background text-sidebar-foreground py-20 px-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
                            <Store className="h-8 w-8 text-accent" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
                            Termos para Parceiros
                        </h1>
                        <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                            Regras e directrizes para vendedores na plataforma JCBA. Cresça o seu negócio com transparência.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-10 relative z-20">
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        <Card className="feature-card border-none shadow-lg bg-card">
                            <CardContent className="pt-8 text-center space-y-4">
                                <div className="inline-flex p-4 rounded-full bg-green-100 text-green-600 mb-2">
                                    <DollarSign className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold">Comissões</h3>
                                <p className="text-muted-foreground">
                                    A plataforma cobra uma comissão fixa de 10% sobre cada venda realizada. O pagamento aos vendedores é feito quinzenalmente.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="feature-card border-none shadow-lg bg-card">
                            <CardContent className="pt-8 text-center space-y-4">
                                <div className="inline-flex p-4 rounded-full bg-blue-100 text-blue-600 mb-2">
                                    <BookOpen className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold">Conteúdo</h3>
                                <p className="text-muted-foreground">
                                    O vendedor é responsável pela veracidade das informações dos livros. Conteúdos ofensivos ou ilegais serão removidos imediatamente.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="feature-card border-none shadow-lg bg-card">
                            <CardContent className="pt-8 text-center space-y-4">
                                <div className="inline-flex p-4 rounded-full bg-orange-100 text-orange-600 mb-2">
                                    <AlertCircle className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold">Responsabilidade</h3>
                                <p className="text-muted-foreground">
                                    O vendedor deve garantir o envio do produto dentro do prazo estipulado de 48 horas após a confirmação do pagamento.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-8">
                        <section className="prose prose-stone max-w-none">
                            <h2 className="text-2xl font-playfair font-bold text-primary">1. Elegibilidade</h2>
                            <p className="text-muted-foreground">
                                Para se tornar um vendedor, deve ser maior de 18 anos ou uma entidade legal registada. Agradecemos o fornecimento de documentos de identificação válidos durante o registo.
                            </p>

                            <h2 className="text-2xl font-playfair font-bold text-primary mt-8">2. Gestão de Stock</h2>
                            <p className="text-muted-foreground">
                                É da inteira responsabilidade do vendedor manter o stock actualizado. O cancelamento frequente de encomendas por falta de stock pode levar à suspensão da conta.
                            </p>

                            <h2 className="text-2xl font-playfair font-bold text-primary mt-8">3. Propriedade Intelectual</h2>
                            <p className="text-muted-foreground">
                                Ao publicar um livro, garante que possui os direitos de venda ou que o livro é de domínio público. A venda de cópias ilegais ou piratadas é estritamente proibida e resultará no banimento imediato.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
