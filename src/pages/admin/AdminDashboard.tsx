import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Package,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { RecentActivityCard } from '@/components/admin/RecentActivityCard';
import { QuickActionCard } from '@/components/admin/QuickActionCard';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { supabase } from '@/integrations/supabase/client';
import { ORDER_STATUS_LABELS } from '@/lib/types';
import { format, subDays, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  pendingSellers: number;
  totalOrders: number;
  pendingOrders: number;
  totalBooks: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  customer: { full_name: string } | null;
}

interface PendingSeller {
  id: string;
  store_name: string;
  created_at: string;
  user: { full_name: string; email: string } | null;
}

interface ChartData {
  name: string;
  value: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSellers: 0,
    pendingSellers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalBooks: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        { count: usersCount },
        { count: sellersCount },
        { count: pendingSellersCount },
        { count: ordersCount },
        { count: pendingOrdersCount },
        { count: booksCount },
        { data: ordersData },
        { data: recentOrdersData },
        { data: pendingSellersData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'awaiting_payment']),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('total, created_at').eq('status', 'completed'),
        supabase.from('orders').select('id, order_number, status, total, created_at, customer_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('seller_profiles').select('id, store_name, created_at, user_id').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      // Generate chart data from last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayStart = startOfDay(date);
        const dayOrders = ordersData?.filter(order => {
          const orderDate = startOfDay(new Date(order.created_at));
          return orderDate.getTime() === dayStart.getTime();
        }) || [];
        const dayTotal = dayOrders.reduce((sum, order) => sum + Number(order.total), 0);
        
        return {
          name: format(date, 'EEE', { locale: pt }),
          value: dayTotal,
        };
      });
      setChartData(last7Days);

      setStats({
        totalUsers: usersCount || 0,
        totalSellers: sellersCount || 0,
        pendingSellers: pendingSellersCount || 0,
        totalOrders: ordersCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        totalBooks: booksCount || 0,
        totalRevenue,
      });

      if (recentOrdersData) {
        const customerIds = recentOrdersData.map(o => o.customer_id);
        const { data: customers } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', customerIds);
        
        const ordersWithCustomers = recentOrdersData.map(order => ({
          ...order,
          customer: customers?.find(c => c.id === order.customer_id) || null,
        }));
        setRecentOrders(ordersWithCustomers as RecentOrder[]);
      }

      if (pendingSellersData) {
        const userIds = pendingSellersData.map(s => s.user_id);
        const { data: users } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        const sellersWithUsers = pendingSellersData.map(seller => ({
          ...seller,
          user: users?.find(u => u.id === seller.user_id) || null,
        }));
        setPendingSellers(sellersWithUsers as PendingSeller[]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { 
      style: 'currency', 
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'warning',
      awaiting_payment: 'warning',
      paid: 'info',
      processing: 'info',
      completed: 'success',
      cancelled: 'danger',
    };
    return variants[status] || 'default';
  };

  const orderItems = recentOrders.map(order => ({
    id: order.id,
    title: order.order_number,
    subtitle: `${order.customer?.full_name || 'Cliente'} • ${format(new Date(order.created_at), "dd MMM", { locale: pt })}`,
    badge: {
      label: ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status,
      variant: getStatusBadgeVariant(order.status),
    },
    meta: formatCurrency(Number(order.total)),
    avatar: order.order_number.slice(-2),
  }));

  const sellerItems = pendingSellers.map(seller => ({
    id: seller.id,
    title: seller.store_name,
    subtitle: seller.user?.full_name || seller.user?.email || '',
    badge: {
      label: 'Pendente',
      variant: 'warning' as const,
    },
    meta: format(new Date(seller.created_at), "dd/MM/yyyy", { locale: pt }),
    avatar: seller.store_name.charAt(0).toUpperCase(),
  }));

  if (loading) {
    return (
      <AdminLayout title="Dashboard" description="Visão geral da plataforma">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" description="Visão geral da plataforma">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          variant="highlight"
        />
        <StatCard
          label="Total Pedidos"
          value={stats.totalOrders}
          icon={ShoppingBag}
          variant={stats.pendingOrders > 0 ? 'warning' : 'default'}
          trend={stats.pendingOrders > 0 ? { value: stats.pendingOrders, isPositive: false } : undefined}
        />
        <StatCard
          label="Livros Activos"
          value={stats.totalBooks}
          icon={BookOpen}
        />
        <StatCard
          label="Utilizadores"
          value={stats.totalUsers}
          icon={Users}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Vendedores Activos"
          value={stats.totalSellers}
          icon={Store}
          variant="success"
        />
        <StatCard
          label="Vendedores Pendentes"
          value={stats.pendingSellers}
          icon={Clock}
          variant={stats.pendingSellers > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Pedidos Pendentes"
          value={stats.pendingOrders}
          icon={AlertCircle}
          variant={stats.pendingOrders > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <RevenueChart
          data={chartData}
          title="Receita dos Últimos 7 Dias"
          description="Pedidos concluídos"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Acções Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Adicionar Livro"
            description="Criar novo livro"
            icon={Plus}
            href="/admin/livros"
            variant="primary"
          />
          <QuickActionCard
            title="Ver Pedidos"
            description="Gerir encomendas"
            icon={Package}
            href="/admin/pedidos"
          />
          <QuickActionCard
            title="Vendedores"
            description="Aprovar novos"
            icon={Store}
            href="/admin/vendedores"
            variant={stats.pendingSellers > 0 ? 'accent' : 'default'}
          />
          <QuickActionCard
            title="Configurações"
            description="Definições da loja"
            icon={Settings}
            href="/admin/configuracoes"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard
          title="Pedidos Recentes"
          description="Últimos 5 pedidos recebidos"
          icon={ShoppingBag}
          items={orderItems}
          viewAllLink="/admin/pedidos"
          emptyState={{
            icon: CheckCircle,
            message: 'Nenhum pedido encontrado',
          }}
        />
        <RecentActivityCard
          title="Vendedores Pendentes"
          description="Aguardando aprovação"
          icon={Store}
          items={sellerItems}
          viewAllLink="/admin/vendedores"
          emptyState={{
            icon: CheckCircle,
            message: 'Nenhum vendedor pendente',
          }}
        />
      </div>
    </AdminLayout>
  );
}
