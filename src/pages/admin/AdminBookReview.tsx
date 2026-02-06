import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Book, BOOK_APPROVAL_STATUS_LABELS } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Eye, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BookWithSeller extends Book {
    seller_profiles?: { store_name: string } | null;
    categories?: { name: string } | null;
}

export default function AdminBookReview() {
    const { toast } = useToast();
    const [pendingBooks, setPendingBooks] = useState<BookWithSeller[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState<BookWithSeller | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    useEffect(() => {
        fetchPendingBooks();
    }, []);

    const fetchPendingBooks = async () => {
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*, seller_profiles(store_name), categories(name)')
                .eq('approval_status', 'pending')
                .order('created_at', { ascending: true });

            if (error) throw error;

            setPendingBooks(data as BookWithSeller[] || []);
        } catch (error: any) {
            console.error('Error fetching pending books:', error);
            toast({
                title: 'Erro ao carregar livros pendentes',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (book: BookWithSeller) => {
        try {
            const { error } = await supabase
                .from('books')
                .update({
                    approval_status: 'approved',
                    is_active: true
                })
                .eq('id', book.id);

            if (error) throw error;

            toast({
                title: 'Livro Aprovado',
                description: `O livro "${book.title}" foi aprovado e já está visível na loja.`,
            });

            fetchPendingBooks();
        } catch (error: any) {
            toast({
                title: 'Erro ao aprovar',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleReject = async () => {
        if (!selectedBook) return;

        try {
            const { error } = await supabase
                .from('books')
                .update({
                    approval_status: 'rejected',
                    is_active: false
                })
                .eq('id', selectedBook.id);

            if (error) throw error;

            toast({
                title: 'Livro Rejeitado',
                description: `O livro "${selectedBook.title}" foi rejeitado.`,
            });

            setIsRejectDialogOpen(false);
            setSelectedBook(null);
            fetchPendingBooks();
        } catch (error: any) {
            toast({
                title: 'Erro ao rejeitar',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
        }).format(value);
    };

    return (
        <AdminLayout title="Revisão de Livros" description="Aprove ou rejeite livros enviados pelos vendedores">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Fila de Aprovação</CardTitle>
                    <CardDescription>
                        Existem {pendingBooks.length} livros aguardando revisão.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : pendingBooks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-green-100 text-green-600">
                                    <Check className="h-6 w-6" />
                                </div>
                            </div>
                            <p className="text-lg font-medium">Tudo limpo!</p>
                            <p>Não há livros pendentes de revisão no momento.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Capa</TableHead>
                                    <TableHead>Detalhes do Livro</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead className="text-right">Preço</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingBooks.map((book) => (
                                    <TableRow key={book.id}>
                                        <TableCell>
                                            {book.cover_image_url ? (
                                                <img
                                                    src={book.cover_image_url}
                                                    alt={book.title}
                                                    className="w-12 h-16 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={() => window.open(book.cover_image_url, '_blank')}
                                                />
                                            ) : (
                                                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                                                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-medium">{book.title}</p>
                                                <p className="text-sm text-muted-foreground">{book.author}</p>
                                                <div className="flex gap-2 text-xs">
                                                    <Badge variant="outline">{book.categories?.name}</Badge>
                                                    <Badge variant="secondary">{book.book_type === 'physical' ? 'Físico' : 'Digital'}</Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium">
                                                {book.seller_profiles?.store_name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-medium text-foreground">
                                                {formatCurrency(Number(book.price))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => {
                                                        setSelectedBook(book);
                                                        setIsRejectDialogOpen(true);
                                                    }}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Rejeitar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleApprove(book)}
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Aprovar
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Livro</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja rejeitar o livro "{selectedBook?.title}"?
                            O vendedor será notificado e o livro não aparecerá na loja.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleReject}>Confirmar Rejeição</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
