import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SellerLayout from '@/components/seller/SellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Clock, CheckCircle, XCircle, CreditCard, Truck } from 'lucide-react';

interface SaleItem {
  id: string;
  order_id: string;
  order_number: string;
  order_status: string;
  book_id: string;
  book_title: string;
  quantity: number;
  unit_price: number;
  commission_amount: number;
  created_at: string;
  customer_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  awaiting_payment: 'bg-orange-100 text-orange-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  awaiting_payment: 'Aguardando Pagamento',
  paid: 'Pago',
  processing: 'Em Processamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  awaiting_payment: CreditCard,
  paid: CheckCircle,
  processing: Truck,
  completed: Package,
  cancelled: XCircle,
};

export default function SellerSales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchSales();
    }
  }, [user]);

  const fetchSales = async () => {
    try {
      // Get seller profile
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return;

      // Get order items with order and book details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          book_id,
          quantity,
          unit_price,
          commission_amount,
          created_at,
          orders!inner(id, order_number, status, customer_id, created_at),
          books(title)
        `)
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false });

      if (!orderItems) {
        setSales([]);
        return;
      }

      // Get customer profiles
      const customerIds = [...new Set(orderItems.map(item => (item.orders as any)?.customer_id).filter(Boolean))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const salesData: SaleItem[] = orderItems.map(item => ({
        id: item.id,
        order_id: item.order_id,
        order_number: (item.orders as any)?.order_number || '',
        order_status: (item.orders as any)?.status || 'pending',
        book_id: item.book_id || '',
        book_title: (item.books as any)?.title || 'Livro removido',
        quantity: item.quantity,
        unit_price: item.unit_price,
        commission_amount: item.commission_amount || 0,
        created_at: (item.orders as any)?.created_at || item.created_at,
        customer_name: profilesMap.get((item.orders as any)?.customer_id) || 'Cliente',
      }));

      setSales(salesData);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sale.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.unit_price * sale.quantity), 0);
  const totalCommission = filteredSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
  const totalNet = totalRevenue - totalCommission;

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Minhas Vendas</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as suas vendas e o estado dos pedidos
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comissão Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">-{formatCurrency(totalCommission)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ganho Líquido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalNet)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por pedido, livro ou cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="processing">Em Processamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredSales.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Nenhuma venda encontrada com os filtros aplicados.' 
                  : 'Ainda não tem vendas registadas.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale) => {
              const StatusIcon = STATUS_ICONS[sale.order_status] || Clock;
              return (
                <Card key={sale.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <StatusIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{sale.book_title}</h3>
                            <Badge className={STATUS_COLORS[sale.order_status]}>
                              {STATUS_LABELS[sale.order_status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Pedido #{sale.order_number} • {sale.quantity}x • {sale.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(sale.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(sale.unit_price * sale.quantity)}</p>
                        <p className="text-sm text-muted-foreground">
                          Comissão: -{formatCurrency(sale.commission_amount)}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          Líquido: {formatCurrency((sale.unit_price * sale.quantity) - sale.commission_amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
