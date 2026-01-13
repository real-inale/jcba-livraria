import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Upload, Eye, Download } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, OrderStatus, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PaymentMethod } from '@/lib/types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  awaiting_payment: 'bg-orange-100 text-orange-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  awaiting_payment: <Clock className="h-4 w-4" />,
  paid: <CheckCircle className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

interface OrderWithItems extends Order {
  items: (OrderItem & { book?: { title: string; cover_image_url?: string } })[];
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    setIsLoading(true);

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      setIsLoading(false);
      return;
    }

    // Fetch order items for each order
    const ordersWithItems: OrderWithItems[] = [];
    
    for (const order of ordersData) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, book:book_id(title, cover_image_url)')
        .eq('order_id', order.id);

      ordersWithItems.push({
        ...order,
        items: itemsData || [],
      } as OrderWithItems);
    }

    setOrders(ordersWithItems);
    setIsLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleUploadProof = async (orderId: string, file: File) => {
    setUploadingProof(orderId);

    try {
      // In a real app, upload to storage first
      // For now, just update the order status
      await supabase
        .from('orders')
        .update({ 
          status: 'awaiting_payment',
          payment_proof_url: 'proof_uploaded', // Placeholder
        })
        .eq('id', orderId);

      toast.success('Comprovativo enviado! Aguarde a confirmação.');
      fetchOrders();
    } catch (error) {
      toast.error('Erro ao enviar comprovativo');
    }

    setUploadingProof(null);
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold mb-8">Meus Pedidos</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Você ainda não fez nenhum pedido.
            </p>
            <Button asChild>
              <Link to="/livros">Explorar Catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{order.order_number}</h3>
                        <Badge className={STATUS_COLORS[order.status as OrderStatus]}>
                          {STATUS_ICONS[order.status as OrderStatus]}
                          <span className="ml-1">{ORDER_STATUS_LABELS[order.status as OrderStatus]}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod]}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-semibold text-primary">{formatPrice(order.total)}</p>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Pedido {order.order_number}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <Badge className={STATUS_COLORS[order.status as OrderStatus]}>
                                  {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Data</span>
                                <span>{format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Pagamento</span>
                                <span>{PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod]}</span>
                              </div>
                              
                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Itens do Pedido</h4>
                                <div className="space-y-2">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                      <span>{item.book?.title} x{item.quantity}</span>
                                      <span>{formatPrice(item.unit_price * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border-t pt-4 flex justify-between font-semibold">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(order.total)}</span>
                              </div>

                              {order.shipping_address && (
                                <div className="border-t pt-4">
                                  <h4 className="font-medium mb-2">Endereço de Entrega</h4>
                                  <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {order.status === 'pending' && (
                          <label>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadProof(order.id, file);
                              }}
                            />
                            <Button 
                              variant="default" 
                              size="sm" 
                              asChild
                              disabled={uploadingProof === order.id}
                            >
                              <span className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-1" />
                                {uploadingProof === order.id ? 'A enviar...' : 'Enviar Comprovativo'}
                              </span>
                            </Button>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
