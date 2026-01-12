import { Link } from 'react-router-dom';
import { ShoppingCart, BookOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, BOOK_TYPE_LABELS } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  className?: string;
}

export function BookCard({ book, className }: BookCardProps) {
  const { addToCart } = useCart();

  const discount = book.original_price
    ? Math.round(((book.original_price - book.price) / book.original_price) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={cn(
      "group relative flex flex-col bg-card rounded-lg overflow-hidden card-elevated",
      className
    )}>
      {/* Image Container */}
      <Link to={`/livro/${book.id}`} className="relative aspect-[3/4] overflow-hidden">
        <img
          src={book.cover_image_url || '/placeholder.svg'}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              -{discount}%
            </Badge>
          )}
          {book.book_type === 'digital' && (
            <Badge variant="secondary" className="gap-1">
              <Download className="h-3 w-3" />
              Digital
            </Badge>
          )}
          {book.book_type === 'both' && (
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="h-3 w-3" />
              Físico + Digital
            </Badge>
          )}
        </div>

        {/* Out of stock overlay */}
        {book.book_type !== 'digital' && book.stock <= 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="font-medium text-muted-foreground">Esgotado</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/livro/${book.id}`}>
          <h3 className="font-display text-base font-semibold text-foreground line-clamp-2 mb-1 hover:text-primary transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
        
        {/* Category */}
        {book.category && (
          <Badge variant="outline" className="w-fit mb-3 text-xs">
            {book.category.name}
          </Badge>
        )}

        {/* Price & Add to Cart */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-primary">
                {formatPrice(book.price)}
              </span>
              {book.original_price && book.original_price > book.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(book.original_price)}
                </span>
              )}
            </div>
          </div>
          
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              addToCart(book);
            }}
            disabled={book.book_type !== 'digital' && book.stock <= 0}
            className="shrink-0 transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
