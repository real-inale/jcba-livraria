import { useEffect, useState } from 'react';
import { Save, CreditCard, Settings, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { PaymentSetting, PlatformSetting, PAYMENT_METHOD_LABELS } from '@/lib/types';
import { toast } from 'sonner';

type PaymentMethod = 'multicaixa_express' | 'atm_reference' | 'paypay' | 'visa';

export default function AdminSettings() {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Platform settings state
  const [commissionRate, setCommissionRate] = useState('15');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [shippingFee, setShippingFee] = useState('0');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [{ data: payments }, { data: platform }] = await Promise.all([
        supabase.from('payment_settings').select('*'),
        supabase.from('platform_settings').select('*'),
      ]);

      setPaymentSettings(payments as PaymentSetting[] || []);
      setPlatformSettings(platform as PlatformSetting[] || []);

      // Set platform settings values
      const commission = platform?.find(s => s.key === 'commission_rate');
      const minOrder = platform?.find(s => s.key === 'min_order_value');
      const shipping = platform?.find(s => s.key === 'shipping_fee');
      
      if (commission) setCommissionRate(commission.value);
      if (minOrder) setMinOrderValue(minOrder.value);
      if (shipping) setShippingFee(shipping.value);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = async (method: PaymentMethod, isActive: boolean) => {
    try {
      const existing = paymentSettings.find(p => p.method === method);
      
      if (existing) {
        await supabase
          .from('payment_settings')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('payment_settings')
          .insert({ method, is_active: isActive });
      }
      
      toast.success(`Método de pagamento ${isActive ? 'activado' : 'desactivado'}`);
      fetchSettings();
    } catch (error) {
      console.error('Error toggling payment method:', error);
      toast.error('Erro ao alterar método de pagamento');
    }
  };

  const updatePaymentDetails = async (method: PaymentMethod, field: string, value: string) => {
    const existing = paymentSettings.find(p => p.method === method);
    if (!existing) return;

    try {
      await supabase
        .from('payment_settings')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      
      fetchSettings();
    } catch (error) {
      console.error('Error updating payment details:', error);
    }
  };

  const savePlatformSettings = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: 'commission_rate', value: commissionRate, description: 'Taxa de comissão padrão para vendedores (%)' },
        { key: 'min_order_value', value: minOrderValue, description: 'Valor mínimo para pedidos (AOA)' },
        { key: 'shipping_fee', value: shippingFee, description: 'Taxa de envio padrão (AOA)' },
      ];

      for (const setting of settings) {
        const existing = platformSettings.find(s => s.key === setting.key);
        if (existing) {
          await supabase
            .from('platform_settings')
            .update({ value: setting.value, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('platform_settings')
            .insert(setting);
        }
      }

      toast.success('Configurações guardadas');
      fetchSettings();
    } catch (error) {
      console.error('Error saving platform settings:', error);
      toast.error('Erro ao guardar configurações');
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods: PaymentMethod[] = ['multicaixa_express', 'atm_reference', 'paypay', 'visa'];

  const getPaymentSetting = (method: PaymentMethod): PaymentSetting | undefined => {
    return paymentSettings.find(p => p.method === method);
  };

  if (loading) {
    return (
      <AdminLayout title="Configurações" description="Configurações da plataforma">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações" description="Configurações da plataforma">
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="platform">
            <Settings className="h-4 w-4 mr-2" />
            Plataforma
          </TabsTrigger>
        </TabsList>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-6">
            {paymentMethods.map((method) => {
              const setting = getPaymentSetting(method);
              const isActive = setting?.is_active ?? false;

              return (
                <Card key={method}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{PAYMENT_METHOD_LABELS[method]}</CardTitle>
                        <CardDescription>
                          Configure os detalhes para receber pagamentos via {PAYMENT_METHOD_LABELS[method]}
                        </CardDescription>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => togglePaymentMethod(method, checked)}
                      />
                    </div>
                  </CardHeader>
                  {isActive && (
                    <CardContent className="space-y-4">
                      {(method === 'multicaixa_express' || method === 'paypay') && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Número de Telefone</Label>
                            <Input
                              value={setting?.account_number || ''}
                              onChange={(e) => updatePaymentDetails(method, 'account_number', e.target.value)}
                              placeholder="923 000 000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nome do Titular</Label>
                            <Input
                              value={setting?.account_holder || ''}
                              onChange={(e) => updatePaymentDetails(method, 'account_holder', e.target.value)}
                              placeholder="Nome completo"
                            />
                          </div>
                        </div>
                      )}
                      
                      {method === 'atm_reference' && (
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Código da Entidade</Label>
                            <Input
                              value={setting?.entity_code || ''}
                              onChange={(e) => updatePaymentDetails(method, 'entity_code', e.target.value)}
                              placeholder="00000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Número da Conta</Label>
                            <Input
                              value={setting?.account_number || ''}
                              onChange={(e) => updatePaymentDetails(method, 'account_number', e.target.value)}
                              placeholder="000000000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nome do Titular</Label>
                            <Input
                              value={setting?.account_holder || ''}
                              onChange={(e) => updatePaymentDetails(method, 'account_holder', e.target.value)}
                              placeholder="Nome completo"
                            />
                          </div>
                        </div>
                      )}

                      {method === 'visa' && (
                        <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
                          <p>A integração com VISA requer configuração adicional do gateway de pagamento.</p>
                          <p className="mt-2">Contacte o suporte para configurar pagamentos por cartão.</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Platform Settings */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Comissões e Taxas
              </CardTitle>
              <CardDescription>
                Configure as taxas e comissões aplicadas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="commission">Taxa de Comissão (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comissão cobrada aos vendedores em cada venda
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minOrder">Valor Mínimo do Pedido (AOA)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor mínimo para finalizar um pedido
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shipping">Taxa de Envio Padrão (AOA)</Label>
                  <Input
                    id="shipping"
                    type="number"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Taxa aplicada para entrega de livros físicos
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePlatformSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'A guardar...' : 'Guardar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
