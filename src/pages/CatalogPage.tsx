import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { BookCard } from '@/components/books/BookCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Book, Category } from '@/lib/types';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bookType, setBookType] = useState<string>(searchParams.get('tipo') || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [searchQuery, selectedCategories, bookType, priceRange, sortBy]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) {
      setCategories(data as Category[]);
    }
  };

  const fetchBooks = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('books')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .gte('price', priceRange[0])
      .lte('price', priceRange[1]);

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
    }

    if (selectedCategories.length > 0) {
      query = query.in('category_id', selectedCategories);
    }

    if (bookType !== 'all' && (bookType === 'physical' || bookType === 'digital' || bookType === 'both')) {
      query = query.eq('book_type', bookType);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, count, error } = await query;

    if (!error && data) {
      setBooks(data as Book[]);
      setTotalBooks(count || 0);
    }
    
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchQuery) {
        prev.set('q', searchQuery);
      } else {
        prev.delete('q');
      }
      return prev;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setBookType('all');
    setPriceRange([0, 50000]);
    setSortBy('newest');
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || bookType !== 'all' || priceRange[0] > 0 || priceRange[1] < 50000;

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Book Type */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Tipo de Livro</Label>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'physical', label: 'Físico' },
            { value: 'digital', label: 'Digital' },
            { value: 'both', label: 'Físico + Digital' },
          ].map(type => (
            <div key={type.value} className="flex items-center gap-2">
              <Checkbox
                id={`type-${type.value}`}
                checked={bookType === type.value}
                onCheckedChange={() => setBookType(type.value)}
              />
              <Label htmlFor={`type-${type.value}`} className="text-sm font-normal cursor-pointer">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Categorias</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map(category => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label htmlFor={`cat-${category.id}`} className="text-sm font-normal cursor-pointer">
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Preço: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} Kz
        </Label>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={50000}
          step={500}
          className="mt-2"
        />
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Catálogo de Livros
          </h1>
          <p className="text-muted-foreground">
            {isLoading ? 'A carregar...' : `${totalBooks} livros encontrados`}
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por título ou autor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais Recentes</SelectItem>
                <SelectItem value="price-asc">Preço: Menor</SelectItem>
                <SelectItem value="price-desc">Preço: Maior</SelectItem>
                <SelectItem value="title">Título A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      !
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24 rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </h3>
              <FiltersContent />
            </div>
          </aside>

          {/* Books Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[3/4] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : books.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum livro encontrado com os filtros selecionados.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
