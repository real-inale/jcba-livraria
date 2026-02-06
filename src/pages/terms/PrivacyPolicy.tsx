import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Layout } from '@/components/layout/Layout';
import { Lock, Eye, Database, Globe } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPolicy() {
    const containerRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline();
        tl.from('.header-anim', { y: 20, opacity: 0, duration: 0.8, stagger: 0.1 })
            .from('.policy-item', { x: -20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.4');
    }, { scope: containerRef });

    return (
        <Layout>
            <div ref={containerRef} className="min-h-screen bg-background pb-20">
                <div className="container max-w-4xl mx-auto px-4 pt-16">
                    <header className="mb-16 text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-primary/5 rounded-2xl mb-6 header-anim">
                            <Lock className="h-10 w-10 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-4 header-anim">
                            Política de Privacidade
                        </h1>
                        <p className="text-xl text-muted-foreground header-anim">
                            Transparência total sobre como tratamos os seus dados.
                        </p>
                    </header>

                    <div className="space-y-12">
                        <div className="policy-item flex gap-6">
                            <div className="flex-shrink-0 mt-1">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Database className="h-5 w-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-3 font-playfair">Recolha de Dados</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Recolhemos apenas as informações essenciais para a prestação dos nossos serviços: nome, email, endereço de entrega e contacto telefónico. Para vendedores, solicitamos adicionalmente dados fiscais para processamento de pagamentos.
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="policy-item flex gap-6">
                            <div className="flex-shrink-0 mt-1">
                                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Eye className="h-5 w-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-3 font-playfair">Uso das Informações</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Os seus dados são utilizados exclusivamente para:
                                    <br />• Processar e entregar as suas encomendas;
                                    <br />• Comunicar o estado dos pedidos;
                                    <br />• Melhorar a experiência de navegação através de cookies essenciais;
                                    <br />• Cumprimento de obrigações legais e fiscais.
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="policy-item flex gap-6">
                            <div className="flex-shrink-0 mt-1">
                                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                    <Globe className="h-5 w-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-3 font-playfair">Partilha com Terceiros</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Não vendemos os seus dados. Partilhamos informações estritamente necessárias apenas com parceiros logísticos (para entregas) e gateways de pagamento (para processamento financeiro seguro).
                                </p>
                            </div>
                        </div>

                        <div className="policy-item bg-muted p-6 rounded-xl mt-8">
                            <h4 className="font-bold mb-2">Os seus direitos</h4>
                            <p className="text-sm text-muted-foreground">
                                Pode solicitar a qualquer momento o acesso, rectificação ou eliminação dos seus dados pessoais. Basta enviar um email para <span className="font-medium text-foreground">privacidade@jcbalivraria.com</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
