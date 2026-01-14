import { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Shield, ShieldOff, Mail, Phone, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/lib/types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles for all users
      const { data: allRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: allRoles?.filter(r => r.user_id === profile.id).map(r => r.role as AppRole) || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar utilizadores');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (user: UserWithRoles) => {
    setProcessing(true);
    try {
      const isAdmin = user.roles.includes('admin');
      
      if (isAdmin) {
        // Remove admin role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role', 'admin');
        toast.success('Permissão de administrador removida');
      } else {
        // Add admin role
        await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });
        toast.success('Permissão de administrador adicionada');
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin:', error);
      toast.error('Erro ao alterar permissões');
    } finally {
      setProcessing(false);
      setRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadges = (roles: AppRole[]) => {
    const roleColors: Record<AppRole, string> = {
      admin: 'bg-red-100 text-red-800',
      seller: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800',
    };

    const roleLabels: Record<AppRole, string> = {
      admin: 'Admin',
      seller: 'Vendedor',
      client: 'Cliente',
    };

    return roles.map(role => (
      <Badge key={role} className={roleColors[role]}>
        {roleLabels[role]}
      </Badge>
    ));
  };

  return (
    <AdminLayout title="Utilizadores" description="Gestão de utilizadores da plataforma">
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Funções</TableHead>
                  <TableHead>Registo</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum utilizador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getRoleBadges(user.roles)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: pt })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setRoleDialogOpen(true);
                              }}
                            >
                              {user.roles.includes('admin') ? (
                                <>
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Remover Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Tornar Admin
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Toggle Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.roles.includes('admin') ? 'Remover Administrador' : 'Adicionar Administrador'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.roles.includes('admin')
                ? `Tem certeza que deseja remover as permissões de administrador de ${selectedUser?.full_name}?`
                : `Tem certeza que deseja tornar ${selectedUser?.full_name} administrador? Esta acção dará acesso total ao painel de administração.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedUser && handleToggleAdmin(selectedUser)}
              disabled={processing}
              variant={selectedUser?.roles.includes('admin') ? 'destructive' : 'default'}
            >
              {processing ? 'A processar...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
