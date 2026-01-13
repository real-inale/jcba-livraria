import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, isLoading, total, updateQuantity, removeFromCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Carrinho de Compras</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para ver o seu carrinho
          </p>
          <Button asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display text-2xl font-bold mb-8">Carrinho de Compras</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg">
                <Skeleton className="w-20 h-28 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Carrinho Vazio</h1>
          <p className="text-muted-foreground mb-6">
            O seu carrinho está vazio. Explore o nosso catálogo!
          </p>
          <Button asChild>
            <Link to="/livros">Ver Catálogo</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/livros">
              <ArrowLeft className="h-4 w-4" />
              Continuar Comprando
            </Link>
          </Button>
        </div>

        <h1 className="font-display text-2xl font-bold mb-8">
          Carrinho de Compras ({items.length} {items.length === 1 ? 'item' : 'itens'})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg bg-card">
                {/* Book Image */}
                <Link to={`/livro/${item.book_id}`} className="shrink-0">
                  <div className="w-20 h-28 rounded overflow-hidden bg-secondary/50">
                    {item.book?.cover_image_url ? (
                      <img
                        src={item.book.cover_image_url}
                        alt={item.book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Book Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/livro/${item.book_id}`}>
                    <h3 className="font-medium text-foreground hover:text-primary truncate">
                      {item.book?.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.book?.author}
                  </p>
                  <p className="font-semibold text-primary">
                    {formatPrice(item.book?.price || 0)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.book_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.book_id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.book_id, item.quantity + 1)}
                      disabled={item.book?.book_type !== 'digital' && item.quantity >= (item.book?.stock || 10)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-sm font-medium">
                    Subtotal: {formatPrice((item.book?.price || 0) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border rounded-lg bg-card p-6">
              <h2 className="font-display text-lg font-semibold mb-4">
                Resumo do Pedido
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envio</span>
                  <span className="text-green-600">A calcular</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              <Button 
                className="w-full mt-6 gap-2" 
                size="lg"
                onClick={() => navigate('/checkout')}
              >
                Finalizar Compra
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                O envio será calculado no checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
