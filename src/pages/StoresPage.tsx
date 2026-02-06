import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Store, MapPin, Search, ExternalLink } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';

interface SellerProfile {
    id: string;
    store_name: string;
    store_description: string;
    status: string;
}

export default function StoresPage() {
    const [stores, setStores] = useState<SellerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const { data, error } = await supabase
                .from('seller_profiles')
                .select('*')
                .eq('status', 'approved');

            if (error) throw error;
            setStores(data || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    useGSAP(() => {
        if (!loading && stores.length > 0) {
            gsap.from('.store-card', {
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }
    }, { scope: containerRef, dependencies: [loading, stores] });

    const filteredStores = stores.filter(store =>
        store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.store_description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="min-h-screen bg-background pb-12" ref={containerRef}>
                <div className="bg-primary/5 py-16 mb-12">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl font-playfair font-bold mb-4">Nossas Livrarias Parceiras</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                            Explore as melhores livrarias de Angola. Encontre raridades, lançamentos e apoie o comércio local.
                        </p>

                        <div className="max-w-md mx-auto relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                            <Input
                                placeholder="Pesquisar livraria..."
                                className="pl-10 h-12 rounded-full border-primary/20 focus:border-primary/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredStores.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma livraria encontrada.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStores.map((store) => (
                                <Card key={store.id} className="store-card group hover:shadow-lg transition-all duration-300 border-primary/10 hover:-translate-y-1 bg-card">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                                {store.store_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                                    {store.store_name}
                                                </CardTitle>
                                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    <span>Angola</span> {/* Placeholder for location if added later */}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground text-sm line-clamp-2 mb-6 h-10">
                                            {store.store_description || 'Uma livraria parceira do BookMarket Angola.'}
                                        </p>
                                        <Button
                                            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                            onClick={() => navigate(`/loja/${store.id}`)}
                                        >
                                            <Store className="mr-2 h-4 w-4" />
                                            Visitar Loja
                                            <ExternalLink className="ml-2 h-3 w-3 opacity-50" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
