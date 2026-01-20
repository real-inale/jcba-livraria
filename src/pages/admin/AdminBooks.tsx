import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  BookOpen, 
  Eye,
  EyeOff,
  MoreHorizontal,
  Filter,
  Download,
  TrendingUp
} from 'lucide-react';
import { Book, Category } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type BookType = 'physical' | 'digital' | 'both';

interface BookWithSeller extends Book {
  seller_profiles?: { store_name: string } | null;
  categories?: { name: string } | null;
}

interface SellerProfile {
  id: string;
  store_name: string;
  user_id: string;
}

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
  seller_id: string;
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
  seller_id: '',
};

export default function AdminBooks() {
  const { toast } = useToast();
  const [books, setBooks] = useState<BookWithSeller[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookWithSeller | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookWithSeller | null>(null);
  const [form, setForm] = useState<BookForm>(initialForm);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    digital: 0,
    physical: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch books with seller info
      const { data: booksData } = await supabase
        .from('books')
        .select('*, seller_profiles(store_name), categories(name)')
        .order('created_at', { ascending: false });

      const booksList = booksData as BookWithSeller[] || [];
      setBooks(booksList);

      // Calculate stats
      setStats({
        total: booksList.length,
        active: booksList.filter(b => b.is_active).length,
        inactive: booksList.filter(b => !b.is_active).length,
        digital: booksList.filter(b => b.book_type === 'digital' || b.book_type === 'both').length,
        physical: booksList.filter(b => b.book_type === 'physical' || b.book_type === 'both').length,
      });

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setCategories(categoriesData as Category[] || []);

      // Fetch approved sellers
      const { data: sellersData } = await supabase
        .from('seller_profiles')
        .select('id, store_name, user_id')
        .eq('status', 'approved')
        .order('store_name');

      setSellers(sellersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.seller_id) {
      toast({
        title: 'Erro',
        description: 'Seleccione um vendedor',
        variant: 'destructive',
      });
      return;
    }

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
      seller_id: form.seller_id,
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

  const handleEdit = (book: BookWithSeller) => {
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
      seller_id: book.seller_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBook) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', deletingBook.id);

      if (error) throw error;
      toast({ title: 'Livro eliminado com sucesso!' });
      setIsDeleteDialogOpen(false);
      setDeletingBook(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao eliminar livro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (book: BookWithSeller) => {
    try {
      const { error } = await supabase
        .from('books')
        .update({ is_active: !book.is_active })
        .eq('id', book.id);

      if (error) throw error;
      toast({ 
        title: book.is_active ? 'Livro desactivado' : 'Livro activado',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao actualizar estado',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.seller_profiles?.store_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && book.is_active) || 
      (filterStatus === 'inactive' && !book.is_active);

    const matchesCategory = 
      filterCategory === 'all' || 
      book.category_id === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

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

  const getBookTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      physical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      digital: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      both: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return styles[type] || 'bg-muted text-muted-foreground';
  };

  return (
    <AdminLayout title="Gestão de Livros" description="Adicione, edite e gerencie todos os livros da plataforma">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.physical}</p>
                <p className="text-xs text-muted-foreground">Físicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.digital}</p>
                <p className="text-xs text-muted-foreground">Digitais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por título, autor ou vendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                {/* Seller Selection (Admin only) */}
                <div className="space-y-2">
                  <Label htmlFor="seller_id">Vendedor *</Label>
                  <Select
                    value={form.seller_id}
                    onValueChange={(value) => setForm({ ...form, seller_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.store_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                <div className="flex justify-end gap-2 pt-4">
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
      </div>

      {/* Books Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== 'all' || filterCategory !== 'all' 
                ? 'Nenhum livro encontrado com os filtros aplicados.' 
                : 'Ainda não há livros na plataforma.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Capa</TableHead>
                  <TableHead>Título / Autor</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{book.title}</p>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {book.seller_profiles?.store_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {book.categories?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getBookTypeBadge(book.book_type)}>
                        {getBookTypeLabel(book.book_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium">{formatCurrency(Number(book.price))}</p>
                        {book.original_price && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatCurrency(Number(book.original_price))}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={book.stock && book.stock > 0 ? 'default' : 'destructive'}>
                        {book.stock || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={book.is_active ?? false}
                        onCheckedChange={() => toggleActive(book)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(book)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(book)}>
                            {book.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setDeletingBook(book);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Livro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja eliminar "{deletingBook?.title}"? Esta acção não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
