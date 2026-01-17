import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SellerLayout from '@/components/seller/SellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ShoppingCart, DollarSign, TrendingUp, Package, Clock } from 'lucide-react';

interface SellerStats {
  totalBooks: number;
  activeBooks: number;
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  pendingOrders: number;
}

interface RecentSale {
  id: string;
  order_number: string;
  book_title: string;
  quantity: number;
  total: number;
  created_at: string;
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SellerStats>({
    totalBooks: 0,
    activeBooks: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingOrders: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user]);

  const fetchSellerData = async () => {
    try {
      // Get seller profile
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return;
      setSellerProfile(profile);

      // Get books stats
      const { data: books } = await supabase
        .from('books')
        .select('id, is_active')
        .eq('seller_id', profile.id);

      const totalBooks = books?.length || 0;
      const activeBooks = books?.filter(b => b.is_active)?.length || 0;

      // Get order items for this seller
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          unit_price,
          commission_amount,
          order_id,
          book_id,
          orders!inner(id, order_number, status, created_at),
          books(title)
        `)
        .eq('seller_id', profile.id);

      const totalSales = orderItems?.length || 0;
      const totalRevenue = orderItems?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;
      const totalCommission = orderItems?.reduce((sum, item) => sum + (item.commission_amount || 0), 0) || 0;
      
      // Count pending orders
      const pendingOrders = orderItems?.filter(item => 
        (item.orders as any)?.status === 'pending' || (item.orders as any)?.status === 'awaiting_payment'
      )?.length || 0;

      setStats({
        totalBooks,
        activeBooks,
        totalSales,
        totalRevenue,
        totalCommission,
        pendingOrders,
      });

      // Get recent sales
      const recent = orderItems?.slice(0, 5).map(item => ({
        id: item.id,
        order_number: (item.orders as any)?.order_number || '',
        book_title: (item.books as any)?.title || 'Livro removido',
        quantity: item.quantity,
        total: item.unit_price * item.quantity,
        created_at: (item.orders as any)?.created_at || '',
      })) || [];

      setRecentSales(recent);
    } catch (error) {
      console.error('Error fetching seller data:', error);
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
    });
  };

  return (
    <SellerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {sellerProfile?.store_name || 'Vendedor'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Livros</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeBooks} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Comissão: {formatCurrency(stats.totalCommission)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganhos Líquidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue - stats.totalCommission)}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de comissão: {sellerProfile?.commission_rate || 15}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando processamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBooks}</div>
              <p className="text-xs text-muted-foreground">
                Livros disponíveis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda registada ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">{sale.book_title}</p>
                      <p className="text-sm text-muted-foreground">
                        Pedido #{sale.order_number} • {sale.quantity}x
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(sale.total)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(sale.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SellerLayout>
  );
}
