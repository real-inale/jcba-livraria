import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SellerLayout from '@/components/seller/SellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ShoppingCart, DollarSign, TrendingUp, Package, Clock } from 'lucide-react';
import { RevenueChart, CategoryPieChart } from '@/components/dashboard/DashboardCharts';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { pt } from 'date-fns/locale';

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
  const [revenueData, setRevenueData] = useState<{ name: string; total: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
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
        .select('id, is_active, category_id, categories(name)')
        .eq('seller_id', profile.id);

      const totalBooks = books?.length || 0;
      const activeBooks = books?.filter(b => b.is_active)?.length || 0;

      // Calculate Category Data
      const catCount: Record<string, number> = {};
      books?.forEach((book: any) => {
        const catName = book.categories?.name || 'Outros';
        catCount[catName] = (catCount[catName] || 0) + 1;
      });
      const catChartData = Object.entries(catCount).map(([name, value]) => ({ name, value }));
      setCategoryData(catChartData);


      // Get order items for this seller
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          unit_price,
          commission_amount,
          created_at,
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

      // Calculate monthly revenue for chart (last 6 months)
      const monthlyData: Record<string, number> = {};
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(today, i);
        const monthKey = format(d, 'MMM', { locale: pt });
        monthlyData[monthKey] = 0;
      }

      orderItems?.forEach(item => {
        const date = new Date(item.created_at);
        const monthKey = format(date, 'MMM', { locale: pt });
        const revenue = (item.unit_price * item.quantity); // Gross revenue
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey] += revenue;
        }
      });

      const revChartData = Object.entries(monthlyData).map(([name, total]) => ({ name, total }));
      setRevenueData(revChartData);

      setStats({
        totalBooks,
        activeBooks,
        totalSales,
        totalRevenue,
        totalCommission,
        pendingOrders,
      });

      // Get recent sales
      const recent = orderItems
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(item => ({
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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-playfair font-bold">Painel de Controle</h1>
            <p className="text-muted-foreground">
              Visão geral do desempenho de <span className="font-semibold text-primary">{sellerProfile?.store_name}</span>
            </p>
          </div>
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('pt-AO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Comissão a pagar: <span className="text-red-500">{formatCurrency(stats.totalCommission)}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganhos Líquidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue - stats.totalCommission)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalSales} vendas realizadas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pedidos aguardando envio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <RevenueChart data={revenueData} title="Evolução da Receita (6 Meses)" />
          </div>
          <div className="lg:col-span-3">
            <CategoryPieChart data={categoryData} title="Livros por Categoria" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Últimas Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma venda recente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {sale.quantity}x
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{sale.book_title}</p>
                          <p className="text-xs text-muted-foreground">
                            Pedido #{sale.order_number} • {formatDate(sale.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(sale.total)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo de Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total de Livros</span>
                </div>
                <span className="font-bold">{stats.totalBooks}</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${stats.totalBooks > 0 ? (stats.activeBooks / stats.totalBooks) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.activeBooks} Ativos</span>
                <span>{stats.totalBooks - stats.activeBooks} Inativos</span>
              </div>

              <div className="pt-4 border-t mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Categorias Principais</span>
                </div>
                <div className="space-y-2">
                  {categoryData.slice(0, 3).map((cat, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="font-medium">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SellerLayout>
  );
}
