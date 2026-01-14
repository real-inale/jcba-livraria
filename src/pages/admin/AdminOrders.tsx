import { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Eye, CheckCircle, XCircle, Package, CreditCard } from 'lucide-react';
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
import { Order, OrderStatus, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

interface OrderWithDetails extends Order {
  customer: { full_name: string; email: string } | null;
  items_count: number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [processing, setProcessing] = useState(false);
  const [orderItems, setOrderItems] = useState<Array<{ id: string; quantity: number; unit_price: number; book: { title: string; author: string } | null }>>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer info and item counts
      const customerIds = ordersData?.map(o => o.customer_id) || [];
      const orderIds = ordersData?.map(o => o.id) || [];
      
      const [{ data: customers }, { data: items }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', customerIds),
        supabase.from('order_items').select('order_id').in('order_id', orderIds),
      ]);

      const ordersWithDetails = ordersData?.map(order => ({
        ...order,
        customer: customers?.find(c => c.id === order.customer_id) || null,
        items_count: items?.filter(i => i.order_id === order.id).length || 0,
      })) || [];

      setOrders(ordersWithDetails as OrderWithDetails[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data: items } = await supabase
        .from('order_items')
        .select('id, quantity, unit_price, book_id')
        .eq('order_id', orderId);

      if (items) {
        const bookIds = items.map(i => i.book_id).filter(Boolean);
        const { data: books } = await supabase
          .from('books')
          .select('id, title, author')
          .in('id', bookIds);

        const itemsWithBooks = items.map(item => ({
          ...item,
          book: books?.find(b => b.id === item.book_id) || null,
        }));
        setOrderItems(itemsWithBooks);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedOrder) return;
    
    setProcessing(true);
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedOrder.id);

      // Create notification
      const statusMessages: Record<OrderStatus, string> = {
        pending: 'O seu pedido está pendente.',
        awaiting_payment: 'Aguardamos a confirmação do seu pagamento.',
        paid: 'O seu pagamento foi confirmado!',
        processing: 'O seu pedido está a ser processado.',
        completed: 'O seu pedido foi concluído com sucesso!',
        cancelled: 'O seu pedido foi cancelado.',
      };

      await supabase.from('notifications').insert({
        user_id: selectedOrder.customer_id,
        title: `Pedido ${selectedOrder.order_number} - ${ORDER_STATUS_LABELS[newStatus]}`,
        message: statusMessages[newStatus],
        type: newStatus === 'completed' ? 'success' : newStatus === 'cancelled' ? 'warning' : 'info',
      });

      toast.success('Estado do pedido actualizado');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao actualizar estado do pedido');
    } finally {
      setProcessing(false);
      setStatusDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      awaiting_payment: 'bg-orange-100 text-orange-800',
      paid: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={styles[status]}>
        {ORDER_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Pedidos" description="Gestão de pedidos e encomendas">
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por número, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="processing">Em Processamento</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
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
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <p className="font-medium font-mono">{order.order_number}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer?.full_name || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">{order.customer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.payment_method ? (
                          <Badge variant="outline">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {PAYMENT_METHOD_LABELS[order.payment_method]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{order.items_count} itens</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(order.total))}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                fetchOrderItems(order.id);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus(order.status);
                                setStatusDialogOpen(true);
                              }}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Alterar Estado
                            </DropdownMenuItem>
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

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Criado em {selectedOrder && format(new Date(selectedOrder.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Status and Payment */}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estado</p>
                {selectedOrder && getStatusBadge(selectedOrder.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pagamento</p>
                {selectedOrder?.payment_method ? (
                  <Badge variant="outline">
                    {PAYMENT_METHOD_LABELS[selectedOrder.payment_method]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Não definido</span>
                )}
              </div>
            </div>

            {/* Customer */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cliente</p>
              <p className="font-medium">{selectedOrder?.customer?.full_name}</p>
              <p className="text-sm">{selectedOrder?.customer?.email}</p>
            </div>

            {/* Shipping Address */}
            {selectedOrder?.shipping_address && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Morada de Entrega</p>
                <p className="text-sm">{selectedOrder.shipping_address}</p>
              </div>
            )}

            {/* Items */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Itens</p>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <div>
                      <p className="font-medium">{item.book?.title || 'Livro'}</p>
                      <p className="text-sm text-muted-foreground">{item.book?.author}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{item.quantity}x</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(item.unit_price))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(selectedOrder?.subtotal || 0))}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(selectedOrder?.total || 0))}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder?.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm p-2 rounded bg-muted">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Payment Proof */}
            {selectedOrder?.payment_proof_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Comprovativo de Pagamento</p>
                <a 
                  href={selectedOrder.payment_proof_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  Ver comprovativo
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Estado do Pedido</DialogTitle>
            <DialogDescription>
              Alterar estado do pedido {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          
          <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="processing">Em Processamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange} disabled={processing}>
              {processing ? 'A processar...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
