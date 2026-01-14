import { useEffect, useState } from 'react';
import { Search, MoreHorizontal, CheckCircle, XCircle, Clock, Ban, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { SellerProfile, SellerStatus, SELLER_STATUS_LABELS } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

interface SellerWithUser extends SellerProfile {
  user: { full_name: string; email: string } | null;
  books_count: number;
}

export default function AdminSellers() {
  const { user: currentUser } = useAuth();
  const [sellers, setSellers] = useState<SellerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSeller, setSelectedSeller] = useState<SellerWithUser | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend'>('approve');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const { data: sellersData, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user info and book counts
      const userIds = sellersData?.map(s => s.user_id) || [];
      const sellerIds = sellersData?.map(s => s.id) || [];
      
      const [{ data: users }, { data: books }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
        supabase.from('books').select('seller_id').in('seller_id', sellerIds),
      ]);

      const sellersWithDetails = sellersData?.map(seller => ({
        ...seller,
        user: users?.find(u => u.id === seller.user_id) || null,
        books_count: books?.filter(b => b.seller_id === seller.id).length || 0,
      })) || [];

      setSellers(sellersWithDetails as SellerWithUser[]);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Erro ao carregar vendedores');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedSeller || !currentUser) return;
    
    setProcessing(true);
    try {
      const statusMap: Record<string, SellerStatus> = {
        approve: 'approved',
        reject: 'rejected',
        suspend: 'suspended',
      };

      const newStatus = statusMap[actionType];
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (actionType === 'approve') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = currentUser.id;
      }

      await supabase
        .from('seller_profiles')
        .update(updateData)
        .eq('id', selectedSeller.id);

      // If approving, add seller role
      if (actionType === 'approve') {
        await supabase
          .from('user_roles')
          .upsert({ user_id: selectedSeller.user_id, role: 'seller' }, { onConflict: 'user_id,role' });
      }

      // Create notification
      const messages: Record<string, { title: string; message: string }> = {
        approve: { title: 'Conta de Vendedor Aprovada!', message: 'Parabéns! A sua conta de vendedor foi aprovada. Já pode começar a vender os seus livros na Livraria JCBA.' },
        reject: { title: 'Conta de Vendedor Rejeitada', message: 'Lamentamos informar que a sua solicitação de conta de vendedor foi rejeitada. Entre em contacto connosco para mais informações.' },
        suspend: { title: 'Conta de Vendedor Suspensa', message: 'A sua conta de vendedor foi suspensa. Entre em contacto connosco para mais informações.' },
      };

      await supabase.from('notifications').insert({
        user_id: selectedSeller.user_id,
        title: messages[actionType].title,
        message: messages[actionType].message,
        type: actionType === 'approve' ? 'success' : 'warning',
      });

      toast.success('Estado do vendedor actualizado');
      fetchSellers();
    } catch (error) {
      console.error('Error updating seller status:', error);
      toast.error('Erro ao actualizar estado do vendedor');
    } finally {
      setProcessing(false);
      setActionDialogOpen(false);
      setSelectedSeller(null);
    }
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = 
      seller.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || seller.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: SellerStatus) => {
    const styles: Record<SellerStatus, { className: string; icon: typeof CheckCircle }> = {
      approved: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      suspended: { className: 'bg-red-100 text-red-800', icon: Ban },
      rejected: { className: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    
    const { className, icon: Icon } = styles[status];
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {SELLER_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const getActionDialogContent = () => {
    const contents: Record<string, { title: string; description: string; buttonText: string; variant: 'default' | 'destructive' }> = {
      approve: {
        title: 'Aprovar Vendedor',
        description: `Tem certeza que deseja aprovar "${selectedSeller?.store_name}"? O utilizador receberá permissões de vendedor e poderá começar a listar livros.`,
        buttonText: 'Aprovar',
        variant: 'default',
      },
      reject: {
        title: 'Rejeitar Vendedor',
        description: `Tem certeza que deseja rejeitar "${selectedSeller?.store_name}"? O utilizador será notificado.`,
        buttonText: 'Rejeitar',
        variant: 'destructive',
      },
      suspend: {
        title: 'Suspender Vendedor',
        description: `Tem certeza que deseja suspender "${selectedSeller?.store_name}"? Os livros do vendedor ficarão ocultos e não poderá fazer novas listagens.`,
        buttonText: 'Suspender',
        variant: 'destructive',
      },
    };
    return contents[actionType];
  };

  return (
    <AdminLayout title="Vendedores" description="Gestão de vendedores e lojas">
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por loja, nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Livros</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum vendedor encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{seller.store_name}</p>
                            {seller.store_description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                                {seller.store_description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{seller.user?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{seller.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(seller.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{seller.books_count} livros</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{seller.commission_rate}%</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(seller.created_at), "dd/MM/yyyy", { locale: pt })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {seller.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSeller(seller);
                                    setActionType('approve');
                                    setActionDialogOpen(true);
                                  }}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSeller(seller);
                                    setActionType('reject');
                                    setActionDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            {seller.status === 'approved' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSeller(seller);
                                  setActionType('suspend');
                                  setActionDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
                            )}
                            {seller.status === 'suspended' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSeller(seller);
                                  setActionType('approve');
                                  setActionDialogOpen(true);
                                }}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Reactivar
                              </DropdownMenuItem>
                            )}
                            {seller.status === 'rejected' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSeller(seller);
                                  setActionType('approve');
                                  setActionDialogOpen(true);
                                }}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aprovar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionDialogContent()?.title}</DialogTitle>
            <DialogDescription>{getActionDialogContent()?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={processing}
              variant={getActionDialogContent()?.variant}
            >
              {processing ? 'A processar...' : getActionDialogContent()?.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
