import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart, Share2, BookOpen, Truck, Download, Star, Minus, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Category, BOOK_TYPE_LABELS } from '@/lib/types';
import { toast } from 'sonner';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [book, setBook] = useState<Book | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [sellerName, setSellerName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBook();
    }
  }, [id]);

  const fetchBook = async () => {
    setIsLoading(true);
    
    const { data: bookData, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !bookData) {
      toast.error('Livro não encontrado');
      navigate('/livros');
      return;
    }

    setBook(bookData as Book);

    // Fetch category
    if (bookData.category_id) {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', bookData.category_id)
        .single();
      
      if (catData) {
        setCategory(catData as Category);
      }
    }

    // Fetch seller name
    const { data: sellerData } = await supabase
      .from('seller_profiles')
      .select('store_name')
      .eq('id', bookData.seller_id)
      .single();
    
    if (sellerData) {
      setSellerName(sellerData.store_name);
    }

    setIsLoading(false);
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Faça login para adicionar ao carrinho');
      navigate('/auth');
      return;
    }

    if (!book) return;

    setIsAddingToCart(true);
    try {
      await addToCart(book, quantity);
      toast.success('Adicionado ao carrinho!');
    } catch (error) {
      toast.error('Erro ao adicionar ao carrinho');
    }
    setIsAddingToCart(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discount = book?.original_price 
    ? Math.round((1 - book.price / book.original_price) * 100)
    : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[3/4] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/livros">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Catálogo
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Book Image */}
          <div className="relative">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary/50">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-24 w-24 text-muted-foreground/50" />
                </div>
              )}
            </div>
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            {/* Category */}
            {category && (
              <Link to={`/categorias/${category.slug}`}>
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            )}

            {/* Title and Author */}
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-muted-foreground">por {book.author}</p>
            </div>

            {/* Book Type */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {book.book_type === 'digital' ? (
                  <Download className="h-3 w-3" />
                ) : (
                  <Truck className="h-3 w-3" />
                )}
                {BOOK_TYPE_LABELS[book.book_type]}
              </Badge>
              {sellerName && (
                <span className="text-sm text-muted-foreground">
                  Vendido por <span className="font-medium">{sellerName}</span>
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">
                {formatPrice(book.price)}
              </span>
              {book.original_price && book.original_price > book.price && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(book.original_price)}
                </span>
              )}
            </div>

            {/* Stock */}
            {book.book_type !== 'digital' && (
              <div className="flex items-center gap-2">
                {book.stock && book.stock > 0 ? (
                  <span className="text-sm text-green-600">
                    ✓ Em stock ({book.stock} disponíveis)
                  </span>
                ) : (
                  <span className="text-sm text-destructive">
                    ✕ Fora de stock
                  </span>
                )}
              </div>
            )}

            <Separator />

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              {book.book_type !== 'digital' && (
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(book.stock || 10, quantity + 1))}
                    disabled={quantity >= (book.stock || 10)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Button 
                size="lg" 
                className="flex-1 gap-2"
                onClick={handleAddToCart}
                disabled={isAddingToCart || (book.book_type !== 'digital' && (!book.stock || book.stock <= 0))}
              >
                <ShoppingCart className="h-5 w-5" />
                {isAddingToCart ? 'A adicionar...' : 'Adicionar ao Carrinho'}
              </Button>

              <Button variant="outline" size="lg" className="gap-2">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
              {book.publisher && (
                <div>
                  <p className="text-xs text-muted-foreground">Editora</p>
                  <p className="text-sm font-medium">{book.publisher}</p>
                </div>
              )}
              {book.published_year && (
                <div>
                  <p className="text-xs text-muted-foreground">Ano</p>
                  <p className="text-sm font-medium">{book.published_year}</p>
                </div>
              )}
              {book.pages && (
                <div>
                  <p className="text-xs text-muted-foreground">Páginas</p>
                  <p className="text-sm font-medium">{book.pages}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <p className="text-xs text-muted-foreground">Idioma</p>
                  <p className="text-sm font-medium">{book.language}</p>
                </div>
              )}
              {book.isbn && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">ISBN</p>
                  <p className="text-sm font-medium">{book.isbn}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Descrição</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="prose prose-neutral max-w-none">
                {book.description ? (
                  <p className="text-muted-foreground whitespace-pre-line">
                    {book.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Sem descrição disponível.
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="details" className="mt-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Título</span>
                  <span className="font-medium">{book.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Autor</span>
                  <span className="font-medium">{book.author}</span>
                </div>
                {book.publisher && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Editora</span>
                    <span className="font-medium">{book.publisher}</span>
                  </div>
                )}
                {book.isbn && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">ISBN</span>
                    <span className="font-medium">{book.isbn}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">{BOOK_TYPE_LABELS[book.book_type]}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
