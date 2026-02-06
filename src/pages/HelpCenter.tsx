import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Layout } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, Mail, Phone, MessageSquare } from 'lucide-react';

const faqCategories = [
    {
        title: 'Compras e Pagamentos',
        questions: [
            { q: 'Quais são os métodos de pagamento aceites?', a: 'Aceitamos pagamentos via Multicaixa Express, Transferência Bancária e em breve cartões VISA/Mastercard.' },
            { q: 'É seguro comprar na Livraria JCBA?', a: 'Sim, utilizamos criptografia SSL para proteger os seus dados e processamos pagamentos através de gateways seguros.' },
            { q: 'Como recebo a minha factura?', a: 'A factura é enviada automaticamente para o seu email após a confirmação do pagamento.' }
        ]
    },
    {
        title: 'Entregas e Envios',
        questions: [
            { q: 'Qual é o prazo de entrega?', a: 'Para Luanda, o prazo é de 24 a 48 horas. Para outras províncias, pode variar entre 3 a 7 dias úteis.' },
            { q: 'Fazem entregas internacionais?', a: 'De momento, apenas realizamos entregas em território nacional (Angola).' },
            { q: 'Posso levantar a minha encomenda na loja?', a: 'Sim, pode seleccionar a opção "Levantamento em Loja" durante o checkout.' }
        ]
    },
    {
        title: 'Trocas e Devoluções',
        questions: [
            { q: 'Qual é a política de devolução?', a: 'Aceitamos devoluções até 14 dias após a recepção do produto, desde que este esteja em perfeitas condições.' },
            { q: 'Recebi um livro com defeito, o que faço?', a: 'Entre em contacto connosco imediatamente através do email suporte@jcbalivraria.com com fotos do defeito.' }
        ]
    }
];

export default function HelpCenter() {
    const containerRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline();

        tl.from('.hero-content > *', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out'
        })
            .from('.faq-card', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out'
            }, '-=0.4')
            .from('.contact-card', {
                scale: 0.95,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.7)'
            }, '-=0.2');

    }, { scope: containerRef });

    return (
        <Layout>
            <div ref={containerRef} className="min-h-screen bg-background pb-12">
                {/* Hero Section */}
                <div className="bg-primary text-primary-foreground py-16 px-4 mb-12">
                    <div className="max-w-4xl mx-auto text-center hero-content space-y-6">
                        <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4 backdrop-blur-sm">
                            <HelpCircle className="h-8 w-8 text-accent" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-playfair font-bold">
                            Como podemos ajudar?
                        </h1>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            Encontre respostas para as suas dúvidas ou entre em contacto com a nossa equipa de suporte.
                        </p>

                        <div className="relative max-w-xl mx-auto mt-8">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                            <Input
                                placeholder="Pesquisar ajuda..."
                                className="pl-12 h-14 bg-white/95 text-foreground rounded-full shadow-lg border-0 text-lg"
                            />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* FAQ Sections */}
                        <div className="md:col-span-2 space-y-8">
                            <h2 className="text-2xl font-playfair font-bold mb-6">Perguntas Frequentes</h2>

                            {faqCategories.map((category, idx) => (
                                <Card key={idx} className="faq-card border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-medium text-primary">{category.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="single" collapsible className="w-full">
                                            {category.questions.map((item, qIdx) => (
                                                <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                                                    <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors">
                                                        {item.q}
                                                    </AccordionTrigger>
                                                    <AccordionContent className="text-muted-foreground leading-relaxed">
                                                        {item.a}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Contact Sidebar */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-playfair font-bold mb-6">Contactos</h2>

                            <Card className="contact-card bg-primary/5 border-primary/20">
                                <CardContent className="pt-6 space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <Phone className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Telefone</h3>
                                            <p className="text-muted-foreground text-sm mb-2">Seg-Sex das 8h às 18h</p>
                                            <a href="tel:+244923456789" className="text-primary font-medium hover:underline">
                                                +244 923 456 789
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <Mail className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Email</h3>
                                            <p className="text-muted-foreground text-sm mb-2">Resposta em até 24h</p>
                                            <a href="mailto:suporte@jcbalivraria.com" className="text-primary font-medium hover:underline">
                                                suporte@jcbalivraria.com
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <MessageSquare className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Chat Online</h3>
                                            <p className="text-muted-foreground text-sm mb-2">Disponível agora</p>
                                            <Button variant="default" size="sm" className="w-full bg-primary text-white hover:bg-primary/90">
                                                Iniciar Conversa
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="contact-card bg-accent/10 border-accent/20">
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold text-lg mb-2">Quer ser um Vendedor?</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Junte-se à nossa plataforma e comece a vender os seus livros hoje mesmo.
                                    </p>
                                    <Button variant="outline" className="w-full border-accent text-accent-foreground hover:bg-accent/10">
                                        Saber Mais
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
