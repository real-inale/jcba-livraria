import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Layout } from '@/components/layout/Layout';
import { Shield, FileText, CheckCircle } from 'lucide-react';

export default function ClientTerms() {
    const containerRef = useRef(null);

    useGSAP(() => {
        gsap.from('h1', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' });
        gsap.from('.term-section', {
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            scrollTrigger: {
                trigger: '.content-wrapper',
                start: 'top 80%',
            }
        });
    }, { scope: containerRef });

    return (
        <Layout>
            <div ref={containerRef} className="min-h-screen bg-background pb-16">
                <div className="bg-muted/30 py-16 px-4 border-b">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
                            Termos e Condições
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Para Clientes e Utilizadores da Livraria JCBA
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 mt-12 content-wrapper space-y-12">
                    <section className="term-section">
                        <h2 className="text-2xl font-bold font-playfair mb-4 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            1. Introdução
                        </h2>
                        <div className="prose prose-stone max-w-none text-muted-foreground leading-relaxed">
                            <p>
                                Bem-vindo à Livraria JCBA. Ao aceder e utilizar o nosso website, concorda em cumprir e ficar vinculado aos seguintes termos e condições de uso, que, juntamente com a nossa política de privacidade, regem a relação da Livraria JCBA consigo em relação a este website.
                            </p>
                        </div>
                    </section>

                    <section className="term-section">
                        <h2 className="text-2xl font-bold font-playfair mb-4 flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            2. Compras e Encomendas
                        </h2>
                        <div className="prose prose-stone max-w-none text-muted-foreground leading-relaxed space-y-4">
                            <p>
                                Ao efectuar uma encomenda na nossa loja online, garante que tem mais de 18 anos de idade ou que possui autorização dos pais ou tutores.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Todos os preços são apresentados em Kwanzas (AOA) e incluem IVA à taxa legal em vigor.</li>
                                <li>Reservamo-nos o direito de alterar preços e especificações sem aviso prévio.</li>
                                <li>As encomendas estão sujeitas à disponibilidade de stock.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="term-section">
                        <h2 className="text-2xl font-bold font-playfair mb-4 flex items-center gap-2">
                            <Shield className="h-6 w-6 text-primary" />
                            3. Privacidade e Dados
                        </h2>
                        <div className="prose prose-stone max-w-none text-muted-foreground leading-relaxed">
                            <p>
                                A Livraria JCBA compromete-se a proteger a sua privacidade. As informações recolhidas no momento da compra são utilizadas apenas para processamento da encomenda e comunicação relacionada. Não partilhamos os seus dados com terceiros para fins comerciais sem o seu consentimento explícito.
                            </p>
                        </div>
                    </section>

                    <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 mt-8">
                        <p className="text-sm text-center text-muted-foreground">
                            Última actualização: 06 de Fevereiro de 2026. Estes termos podem ser revistos a qualquer momento.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
