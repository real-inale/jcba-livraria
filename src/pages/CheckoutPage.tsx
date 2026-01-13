import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Phone, Building2, Wallet, Upload, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PaymentSetting, PaymentMethod, PAYMENT_METHOD_LABELS } from '@/lib/types';
import { toast } from 'sonner';

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  multicaixa_express: <Phone className="h-5 w-5" />,
  atm_reference: <Building2 className="h-5 w-5" />,
  paypay: <Wallet className="h-5 w-5" />,
  visa: <CreditCard className="h-5 w-5" />,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, total, clearCart } = useCart();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentSetting[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [shippingAddress, setShippingAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (items.length === 0 && !orderComplete) {
      navigate('/carrinho');
      return;
    }

    fetchPaymentMethods();
  }, [user, items, navigate, orderComplete]);

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      setPaymentMethods(data as PaymentSetting[]);
      if (data.length > 0) {
        setSelectedMethod(data[0].method as PaymentMethod);
      }
    }
  };

  const selectedPaymentDetails = paymentMethods.find(p => p.method === selectedMethod);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const hasPhysicalBooks = items.some(item => item.book?.book_type !== 'digital');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMethod) {
      toast.error('Selecione um método de pagamento');
      return;
    }

    if (hasPhysicalBooks && !shippingAddress.trim()) {
      toast.error('Informe o endereço de entrega');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number
      const { data: orderNumData } = await supabase.rpc('generate_order_number');
      const orderNum = orderNumData || `LA${Date.now()}`;

      // Calculate commission (default 15%)
      const commissionRate = 0.15;
      const platformCommission = total * commissionRate;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user!.id,
          order_number: orderNum,
          subtotal: total,
          total: total,
          platform_commission: platformCommission,
          payment_method: selectedMethod,
          shipping_address: hasPhysicalBooks ? shippingAddress : null,
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        book_id: item.book_id,
        seller_id: item.book?.seller_id,
        quantity: item.quantity,
        unit_price: item.book?.price || 0,
        commission_amount: (item.book?.price || 0) * item.quantity * commissionRate,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: user!.id,
        title: 'Pedido Criado!',
        message: `O seu pedido ${orderNum} foi criado com sucesso. Aguarde a confirmação do pagamento.`,
        type: 'success',
      });

      // Clear cart
      await clearCart();

      setOrderNumber(orderNum);
      setOrderComplete(true);
      toast.success('Pedido criado com sucesso!');

    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
    }

    setIsSubmitting(false);
  };

  if (orderComplete) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="font-display text-2xl font-bold mb-2">Pedido Confirmado!</h1>
          <p className="text-muted-foreground mb-6">
            O seu pedido <strong>{orderNumber}</strong> foi criado com sucesso.
          </p>

          <Card className="text-left mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>1. Efetue o pagamento usando os dados do método selecionado</p>
              <p>2. Guarde o comprovativo de pagamento</p>
              <p>3. Envie o comprovativo na página "Meus Pedidos"</p>
              <p>4. Aguarde a confirmação (até 24h úteis)</p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/pedidos">Ver Meus Pedidos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/livros">Continuar Comprando</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/carrinho">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Carrinho
            </Link>
          </Button>
        </div>

        <h1 className="font-display text-2xl font-bold mb-8">Finalizar Compra</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled className="bg-secondary/50" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+244 9XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              {hasPhysicalBooks && (
                <Card>
                  <CardHeader>
                    <CardTitle>Endereço de Entrega</CardTitle>
                    <CardDescription>
                      Necessário para livros físicos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Rua, número, bairro, cidade, província..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      rows={3}
                      required
                    />
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Método de Pagamento</CardTitle>
                  <CardDescription>
                    Escolha como deseja pagar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum método de pagamento disponível no momento.
                    </p>
                  ) : (
                    <RadioGroup
                      value={selectedMethod || ''}
                      onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
                    >
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary/30">
                          <RadioGroupItem value={method.method} id={method.id} />
                          <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                            {PAYMENT_ICONS[method.method as PaymentMethod]}
                            <span>{PAYMENT_METHOD_LABELS[method.method as PaymentMethod]}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* Payment Details */}
                  {selectedPaymentDetails && (
                    <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium mb-2">Dados para Pagamento:</h4>
                      <div className="text-sm space-y-1">
                        {selectedPaymentDetails.account_holder && (
                          <p><span className="text-muted-foreground">Titular:</span> {selectedPaymentDetails.account_holder}</p>
                        )}
                        {selectedPaymentDetails.account_number && (
                          <p><span className="text-muted-foreground">Número:</span> {selectedPaymentDetails.account_number}</p>
                        )}
                        {selectedPaymentDetails.entity_code && (
                          <p><span className="text-muted-foreground">Entidade:</span> {selectedPaymentDetails.entity_code}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Observações (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Alguma instrução especial para o pedido..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 border rounded-lg bg-card p-6">
                <h2 className="font-display text-lg font-semibold mb-4">
                  Resumo do Pedido
                </h2>

                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate flex-1 mr-2">
                        {item.book?.title} x{item.quantity}
                      </span>
                      <span className="font-medium shrink-0">
                        {formatPrice((item.book?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  {hasPhysicalBooks && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Envio</span>
                      <span className="text-muted-foreground">A combinar</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>

                <Button 
                  type="submit"
                  className="w-full mt-6" 
                  size="lg"
                  disabled={isSubmitting || !selectedMethod}
                >
                  {isSubmitting ? 'A processar...' : 'Confirmar Pedido'}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Ao confirmar, concorda com os nossos Termos e Condições
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
