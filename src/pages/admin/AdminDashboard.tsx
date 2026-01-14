import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  BookOpen,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { ORDER_STATUS_LABELS } from '@/lib/types';
import { format } from 'date-fns';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats in parallel
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
        supabase.from('orders').select('total').eq('status', 'completed'),
        supabase.from('orders').select('id, order_number, status, total, created_at, customer_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('seller_profiles').select('id, store_name, created_at, user_id').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalSellers: sellersCount || 0,
        pendingSellers: pendingSellersCount || 0,
        totalOrders: ordersCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        totalBooks: booksCount || 0,
        totalRevenue,
      });

      // Fetch customer names for recent orders
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

      // Fetch user info for pending sellers
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

  const statCards = [
    { label: 'Total Utilizadores', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
    { label: 'Vendedores Activos', value: stats.totalSellers, icon: Store, color: 'text-green-600' },
    { label: 'Vendedores Pendentes', value: stats.pendingSellers, icon: Clock, color: 'text-orange-600', highlight: stats.pendingSellers > 0 },
    { label: 'Total Pedidos', value: stats.totalOrders, icon: ShoppingBag, color: 'text-purple-600' },
    { label: 'Pedidos Pendentes', value: stats.pendingOrders, icon: AlertCircle, color: 'text-red-600', highlight: stats.pendingOrders > 0 },
    { label: 'Livros Activos', value: stats.totalBooks, icon: BookOpen, color: 'text-primary' },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      awaiting_payment: 'bg-orange-100 text-orange-800',
      paid: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <AdminLayout title="Dashboard" description="Visão geral da plataforma">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {statCards.map((stat) => (
              <Card key={stat.label} className={stat.highlight ? 'border-warning' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total (Pedidos Concluídos)</p>
                  <p className="text-4xl font-bold mt-1 text-primary">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats.totalRevenue)}
                  </p>
                </div>
                <div className="p-4 rounded-full bg-primary/10 text-primary">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
                  <CardDescription>Últimos 5 pedidos recebidos</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/pedidos">Ver Todos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum pedido encontrado</p>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer?.full_name || 'Cliente'} • {format(new Date(order.created_at), "dd MMM", { locale: pt })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusBadge(order.status)}>
                            {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(order.total))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Sellers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Vendedores Pendentes</CardTitle>
                  <CardDescription>Aguardando aprovação</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/vendedores">Ver Todos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pendingSellers.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum vendedor pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingSellers.map((seller) => (
                      <div key={seller.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{seller.store_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {seller.user?.full_name || seller.user?.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-warning/20 text-warning">Pendente</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(seller.created_at), "dd/MM/yyyy", { locale: pt })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
