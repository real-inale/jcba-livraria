import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SellerLayout from '@/components/seller/SellerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Percent, Calendar } from 'lucide-react';

interface CommissionData {
  totalRevenue: number;
  totalCommission: number;
  netEarnings: number;
  commissionRate: number;
  monthlyData: {
    month: string;
    revenue: number;
    commission: number;
    net: number;
  }[];
}

export default function SellerCommissions() {
  const { user } = useAuth();
  const [data, setData] = useState<CommissionData>({
    totalRevenue: 0,
    totalCommission: 0,
    netEarnings: 0,
    commissionRate: 15,
    monthlyData: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCommissionData();
    }
  }, [user]);

  const fetchCommissionData = async () => {
    try {
      // Get seller profile
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('id, commission_rate')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return;

      // Get order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          unit_price,
          commission_amount,
          created_at,
          orders!inner(status, created_at)
        `)
        .eq('seller_id', profile.id);

      if (!orderItems) {
        setData({
          totalRevenue: 0,
          totalCommission: 0,
          netEarnings: 0,
          commissionRate: profile.commission_rate,
          monthlyData: [],
        });
        return;
      }

      // Calculate totals (only for paid/completed orders)
      const paidItems = orderItems.filter(item => 
        ['paid', 'processing', 'completed'].includes((item.orders as any)?.status)
      );

      const totalRevenue = paidItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const totalCommission = paidItems.reduce((sum, item) => sum + (item.commission_amount || 0), 0);

      // Group by month
      const monthlyMap = new Map<string, { revenue: number; commission: number }>();
      
      paidItems.forEach(item => {
        const date = new Date((item.orders as any)?.created_at || item.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const current = monthlyMap.get(monthKey) || { revenue: 0, commission: 0 };
        monthlyMap.set(monthKey, {
          revenue: current.revenue + (item.unit_price * item.quantity),
          commission: current.commission + (item.commission_amount || 0),
        });
      });

      // Convert to array and sort
      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, values]) => ({
          month,
          revenue: values.revenue,
          commission: values.commission,
          net: values.revenue - values.commission,
        }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 6);

      setData({
        totalRevenue,
        totalCommission,
        netEarnings: totalRevenue - totalCommission,
        commissionRate: profile.commission_rate,
        monthlyData,
      });
    } catch (error) {
      console.error('Error fetching commission data:', error);
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

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });
  };

  const commissionPercentage = data.totalRevenue > 0 
    ? (data.totalCommission / data.totalRevenue) * 100 
    : 0;

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Comissões</h1>
          <p className="text-muted-foreground">
            Acompanhe as suas comissões e ganhos
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    De pedidos pagos/concluídos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comissão Paga</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    -{formatCurrency(data.totalCommission)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taxa de {data.commissionRate}% sobre vendas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ganhos Líquidos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.netEarnings)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Após dedução de comissões
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Comissão</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.commissionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Taxa fixa da plataforma
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Commission Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Receita</CardTitle>
                <CardDescription>
                  Como a sua receita é dividida entre você e a plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Seus ganhos ({100 - data.commissionRate}%)</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data.netEarnings)}
                    </span>
                  </div>
                  <Progress value={100 - commissionPercentage} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Comissão da plataforma ({data.commissionRate}%)</span>
                    <span className="font-medium text-destructive">
                      {formatCurrency(data.totalCommission)}
                    </span>
                  </div>
                  <Progress value={commissionPercentage} className="h-3 [&>div]:bg-destructive" />
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico Mensal</CardTitle>
                <CardDescription>
                  Desempenho dos últimos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.monthlyData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível ainda.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.monthlyData.map((month) => (
                      <div key={month.month} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold capitalize">{formatMonth(month.month)}</h4>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(month.net)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Receita</p>
                            <p className="font-medium">{formatCurrency(month.revenue)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Comissão</p>
                            <p className="font-medium text-destructive">-{formatCurrency(month.commission)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Líquido</p>
                            <p className="font-medium text-green-600">{formatCurrency(month.net)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">ℹ️ Como funcionam as comissões?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• A plataforma cobra uma comissão de <strong>{data.commissionRate}%</strong> sobre cada venda concluída.</li>
                  <li>• As comissões são calculadas automaticamente no momento da venda.</li>
                  <li>• Os ganhos líquidos representam o valor que você recebe após a dedução da comissão.</li>
                  <li>• Apenas vendas de pedidos pagos ou concluídos são contabilizadas.</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
