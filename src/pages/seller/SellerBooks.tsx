import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SellerLayout from '@/components/seller/SellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Book, Category } from '@/lib/types';

type BookType = 'physical' | 'digital' | 'both';

interface BookForm {
  title: string;
  author: string;
  description: string;
  price: string;
  original_price: string;
  isbn: string;
  publisher: string;
  published_year: string;
  pages: string;
  language: string;
  stock: string;
  category_id: string;
  book_type: BookType;
  cover_image_url: string;
  digital_file_url: string;
  is_active: boolean;
}

const initialForm: BookForm = {
  title: '',
  author: '',
  description: '',
  price: '',
  original_price: '',
  isbn: '',
  publisher: '',
  published_year: '',
  pages: '',
  language: 'Português',
  stock: '0',
  category_id: '',
  book_type: 'physical',
  cover_image_url: '',
  digital_file_url: '',
  is_active: true,
};

export default function SellerBooks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState<BookForm>(initialForm);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Get seller profile
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return;
      setSellerProfile(profile);

      // Get books
      const { data: booksData } = await supabase
        .from('books')
        .select('*, categories(name)')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false });

      setBooks(booksData as Book[] || []);

      // Get categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setCategories(categoriesData as Category[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sellerProfile) return;

    const bookData = {
      title: form.title,
      author: form.author,
      description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      isbn: form.isbn || null,
      publisher: form.publisher || null,
      published_year: form.published_year ? parseInt(form.published_year) : null,
      pages: form.pages ? parseInt(form.pages) : null,
      language: form.language,
      stock: parseInt(form.stock),
      category_id: form.category_id || null,
      book_type: form.book_type,
      cover_image_url: form.cover_image_url || null,
      digital_file_url: form.digital_file_url || null,
      is_active: form.is_active,
      seller_id: sellerProfile.id,
    };

    try {
      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editingBook.id);

        if (error) throw error;
        toast({ title: 'Livro actualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('books')
          .insert([bookData]);

        if (error) throw error;
        toast({ title: 'Livro adicionado com sucesso!' });
      }

      setIsDialogOpen(false);
      setEditingBook(null);
      setForm(initialForm);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar livro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      description: book.description || '',
      price: book.price.toString(),
      original_price: book.original_price?.toString() || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      published_year: book.published_year?.toString() || '',
      pages: book.pages?.toString() || '',
      language: book.language || 'Português',
      stock: book.stock?.toString() || '0',
      category_id: book.category_id || '',
      book_type: book.book_type as BookType,
      cover_image_url: book.cover_image_url || '',
      digital_file_url: book.digital_file_url || '',
      is_active: book.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Tem certeza que deseja eliminar este livro?')) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;
      toast({ title: 'Livro eliminado com sucesso!' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao eliminar livro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (book: Book) => {
    try {
      const { error } = await supabase
        .from('books')
        .update({ is_active: !book.is_active })
        .eq('id', book.id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao actualizar estado',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(value);
  };

  const getBookTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      physical: 'Físico',
      digital: 'Digital',
      both: 'Físico e Digital',
    };
    return labels[type] || type;
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meus Livros</h1>
            <p className="text-muted-foreground">
              Gerencie o seu catálogo de livros
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingBook(null);
              setForm(initialForm);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Livro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBook ? 'Editar Livro' : 'Adicionar Novo Livro'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Autor *</Label>
                    <Input
                      id="author"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (AOA) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original_price">Preço Original</Label>
                    <Input
                      id="original_price"
                      type="number"
                      step="0.01"
                      value={form.original_price}
                      onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={form.category_id}
                      onValueChange={(value) => setForm({ ...form, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book_type">Tipo de Livro</Label>
                    <Select
                      value={form.book_type}
                      onValueChange={(value: BookType) => setForm({ ...form, book_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Físico</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="both">Físico e Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={form.isbn}
                      onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Editora</Label>
                    <Input
                      id="publisher"
                      value={form.publisher}
                      onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="published_year">Ano</Label>
                    <Input
                      id="published_year"
                      type="number"
                      value={form.published_year}
                      onChange={(e) => setForm({ ...form, published_year: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pages">Páginas</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={form.pages}
                      onChange={(e) => setForm({ ...form, pages: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Input
                      id="language"
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_image_url">URL da Capa</Label>
                  <Input
                    id="cover_image_url"
                    type="url"
                    value={form.cover_image_url}
                    onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                {(form.book_type === 'digital' || form.book_type === 'both') && (
                  <div className="space-y-2">
                    <Label htmlFor="digital_file_url">URL do Ficheiro Digital</Label>
                    <Input
                      id="digital_file_url"
                      type="url"
                      value={form.digital_file_url}
                      onChange={(e) => setForm({ ...form, digital_file_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Livro activo (visível no catálogo)</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingBook ? 'Guardar Alterações' : 'Adicionar Livro'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar livros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'Nenhum livro encontrado.' : 'Ainda não tem livros. Adicione o seu primeiro!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <Card key={book.id} className={!book.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-24 w-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">📚</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{book.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                      <p className="font-bold text-primary mt-1">{formatCurrency(book.price)}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {getBookTypeLabel(book.book_type)}
                        </Badge>
                        <Badge variant={book.is_active ? 'default' : 'outline'} className="text-xs">
                          {book.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(book)}
                    >
                      {book.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(book)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(book.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
