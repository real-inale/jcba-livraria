import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Book, SellerProfile } from '@/lib/types';
import { BookCard } from '@/components/books/BookCard';
import { Button } from '@/components/ui/button';
import { Store, MapPin, ArrowLeft, Book as BookIcon } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function StoreDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [store, setStore] = useState<SellerProfile | null>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (id) fetchStoreDetails();
    }, [id]);

    const fetchStoreDetails = async () => {
        try {
            // Fetch store profile
            const { data: storeData, error: storeError } = await supabase
                .from('seller_profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (storeError) throw storeError;
            setStore(storeData);

            // Fetch store books
            const { data: booksData, error: booksError } = await supabase
                .from('books')
                .select('*')
                .eq('seller_id', id)
                .eq('is_active', true)
                .eq('approval_status', 'approved');

            if (booksError) throw booksError;
            setBooks(booksData || []);

        } catch (error) {
            console.error('Error fetching store details:', error);
        } finally {
            setLoading(false);
        }
    };

    useGSAP(() => {
        if (!loading && store) {
            const tl = gsap.timeline();
            tl.from('.store-header', { y: 20, opacity: 0, duration: 0.6 })
                .from('.store-stats', { y: 20, opacity: 0, duration: 0.4 }, '-=0.2')
                .from('.book-card', { y: 30, opacity: 0, duration: 0.5, stagger: 0.05 });
        }
    }, { scope: containerRef, dependencies: [loading, store] });

    if (loading) {
        return <Layout><div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></Layout>;
    }

    if (!store) {
        return <Layout><div className="text-center p-20">Loja não encontrada.</div></Layout>;
    }

    return (
        <Layout>
            <div className="min-h-screen bg-background pb-12" ref={containerRef}>
                {/* Store Header */}
                <div className="bg-sidebar-background text-sidebar-foreground py-12 px-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

                    <div className="container mx-auto max-w-6xl relative z-10">
                        <Button
                            variant="ghost"
                            className="mb-8 text-white/70 hover:text-white hover:bg-white/10 pl-0"
                            onClick={() => navigate('/lojas')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar às Lojas
                        </Button>

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 store-header">
                            <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-white/10 flex items-center justify-center text-4xl md:text-5xl font-bold backdrop-blur-sm border border-white/20 shadow-xl">
                                {store.store_name.charAt(0).toUpperCase()}
                            </div>

                            <div className="text-center md:text-left flex-1">
                                <h1 className="text-3xl md:text-5xl font-playfair font-bold mb-3">{store.store_name}</h1>
                                <div className="flex items-center justify-center md:justify-start gap-4 text-white/70 mb-4">
                                    <div className="flex items-center text-sm">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        Angola
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Store className="h-4 w-4 mr-1" />
                                        Livraria Oficial
                                    </div>
                                </div>
                                <p className="max-w-2xl text-lg text-white/80 leading-relaxed">
                                    {store.store_description || 'Bem-vindo à nossa livraria.'}
                                </p>
                            </div>

                            <div className="store-stats flex gap-8 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary">{books.length}</div>
                                    <div className="text-xs uppercase tracking-wider text-white/60">Livros</div>
                                </div>
                                <div className="w-px bg-white/10"></div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-400">0</div> {/* Placeholder for ratings */}
                                    <div className="text-xs uppercase tracking-wider text-white/60">Vendas</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Store Books */}
                <div className="container mx-auto px-4 max-w-6xl mt-12">
                    <h2 className="text-2xl font-playfair font-bold mb-8 flex items-center gap-2">
                        <BookIcon className="h-6 w-6 text-primary" />
                        Catálogo da Loja
                    </h2>

                    {books.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-xl">
                            <p className="text-muted-foreground">Esta loja ainda não tem livros disponíveis.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {books.map((book) => (
                                <div key={book.id} className="book-card">
                                    <BookCard book={book} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
