import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  X, 
  Store, 
  ShoppingBag, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Trash2,
  MailCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  reference_id: string | null;
  reference_type: string | null;
}

interface PendingSeller {
  id: string;
  store_name: string;
  user_id: string;
  user: { full_name: string; email: string } | null;
}

export default function NotificationsPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingSellers, setPendingSellers] = useState<Map<string, PendingSeller>>(new Map());
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    sellerId: string;
    sellerName: string;
    notificationId: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);

      // Fetch pending sellers if admin and there are seller_pending notifications
      if (isAdmin && data) {
        const sellerNotifications = data.filter(n => n.type === 'seller_pending');
        if (sellerNotifications.length > 0) {
          const { data: sellers } = await supabase
            .from('seller_profiles')
            .select('id, store_name, user_id')
            .eq('status', 'pending');

          if (sellers) {
            // Fetch user info for sellers
            const userIds = sellers.map(s => s.user_id);
            const { data: users } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', userIds);

            const sellerMap = new Map<string, PendingSeller>();
            sellers.forEach(seller => {
              const userData = users?.find(u => u.id === seller.user_id);
              sellerMap.set(seller.store_name, {
                ...seller,
                user: userData || null,
              });
            });
            setPendingSellers(sellerMap);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notification
          toast.info(newNotification.title, {
            description: newNotification.message.slice(0, 100) + '...',
          });

          // Refresh pending sellers if it's a seller notification
          if (newNotification.type === 'seller_pending') {
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleSellerAction = async () => {
    if (!actionDialog) return;
    
    setProcessing(true);
    try {
      const seller = Array.from(pendingSellers.values()).find(
        s => s.store_name === actionDialog.sellerName || s.id === actionDialog.sellerId
      );

      if (!seller) {
        toast.error('Vendedor não encontrado');
        return;
      }

      const newStatus = actionDialog.type === 'approve' ? 'approved' : 'rejected';

      // Update seller status
      await supabase
        .from('seller_profiles')
        .update({
          status: newStatus,
          approved_at: actionDialog.type === 'approve' ? new Date().toISOString() : null,
          approved_by: actionDialog.type === 'approve' ? user!.id : null,
        })
        .eq('id', seller.id);

      // Add seller role if approved
      if (actionDialog.type === 'approve') {
        await supabase
          .from('user_roles')
          .insert({ user_id: seller.user_id, role: 'seller' });
      }

      // Send notification to seller
      const messages = {
        approve: {
          title: 'Conta de Vendedor Aprovada!',
          message: 'Parabéns! A sua conta de vendedor foi aprovada. Já pode começar a listar os seus livros.',
        },
        reject: {
          title: 'Conta de Vendedor Recusada',
          message: 'Lamentamos informar que o seu pedido de conta de vendedor foi recusado.',
        },
      };

      await supabase.from('notifications').insert({
        user_id: seller.user_id,
        title: messages[actionDialog.type].title,
        message: messages[actionDialog.type].message,
        type: actionDialog.type === 'approve' ? 'success' : 'warning',
      });

      // Mark the notification as read and update it
      await handleMarkAsRead(actionDialog.notificationId);

      // Remove from pending sellers map
      setPendingSellers(prev => {
        const newMap = new Map(prev);
        newMap.delete(actionDialog.sellerName);
        return newMap;
      });

      toast.success(
        actionDialog.type === 'approve' 
          ? 'Vendedor aprovado com sucesso!' 
          : 'Vendedor recusado'
      );

      setActionDialog(null);
    } catch (error) {
      console.error('Error processing seller action:', error);
      toast.error('Erro ao processar acção');
    } finally {
      setProcessing(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'seller_pending':
        return <Store className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'order':
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'seller_pending':
        return 'bg-warning/10 text-warning';
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-destructive/10 text-destructive';
      case 'order':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const extractSellerName = (message: string): string | null => {
    const match = message.match(/O vendedor "([^"]+)"/);
    return match ? match[1] : null;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">Notificações</h1>
                <p className="text-muted-foreground">
                  {unreadCount > 0 
                    ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                    : 'Todas as notificações lidas'
                  }
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <MailCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Sem notificações</p>
                <p className="text-muted-foreground">
                  As suas notificações aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const sellerName = notification.type === 'seller_pending' 
                  ? extractSellerName(notification.message)
                  : null;
                const isPendingSeller = sellerName && pendingSellers.has(sellerName);

                return (
                  <Card 
                    key={notification.id}
                    className={cn(
                      'transition-all duration-200 hover:shadow-md',
                      !notification.is_read && 'border-l-4 border-l-primary bg-primary/5'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className={cn(
                          'shrink-0 p-3 rounded-xl',
                          getNotificationColor(notification.type)
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{notification.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: pt,
                              })}
                            </span>
                          </div>

                          {/* Actions for seller pending notifications */}
                          {notification.type === 'seller_pending' && isAdmin && isPendingSeller && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/90"
                                onClick={() => setActionDialog({
                                  open: true,
                                  type: 'approve',
                                  sellerId: pendingSellers.get(sellerName!)?.id || '',
                                  sellerName: sellerName!,
                                  notificationId: notification.id,
                                })}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setActionDialog({
                                  open: true,
                                  type: 'reject',
                                  sellerId: pendingSellers.get(sellerName!)?.id || '',
                                  sellerName: sellerName!,
                                  notificationId: notification.id,
                                })}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Recusar
                              </Button>
                            </div>
                          )}

                          {/* Already processed seller notification */}
                          {notification.type === 'seller_pending' && isAdmin && !isPendingSeller && notification.is_read && (
                            <Badge variant="outline" className="mt-3">
                              Processado
                            </Badge>
                          )}

                          {/* Quick actions */}
                          <div className="flex gap-2 mt-3">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Marcar como lida
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={actionDialog?.open} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.type === 'approve' ? 'Aprovar Vendedor' : 'Recusar Vendedor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.type === 'approve'
                ? `Tem certeza que deseja aprovar o vendedor "${actionDialog?.sellerName}"? O vendedor poderá começar a listar livros imediatamente.`
                : `Tem certeza que deseja recusar o pedido do vendedor "${actionDialog?.sellerName}"?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSellerAction}
              disabled={processing}
              className={actionDialog?.type === 'approve' ? 'bg-success hover:bg-success/90' : ''}
            >
              {processing ? 'A processar...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
