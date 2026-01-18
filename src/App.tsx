import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import CatalogPage from "./pages/CatalogPage";
import BookDetailPage from "./pages/BookDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSettings from "./pages/admin/AdminSettings";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerBooks from "./pages/seller/SellerBooks";
import SellerSales from "./pages/seller/SellerSales";
import SellerCommissions from "./pages/seller/SellerCommissions";
import SellerSettings from "./pages/seller/SellerSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/livros" element={<CatalogPage />} />
              <Route path="/livro/:id" element={<BookDetailPage />} />
              
              {/* Authenticated Routes */}
              <Route path="/carrinho" element={<RequireAuth><CartPage /></RequireAuth>} />
              <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
              <Route path="/pedidos" element={<RequireAuth><OrdersPage /></RequireAuth>} />
              <Route path="/perfil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/vendedores" element={<ProtectedRoute requireAdmin><AdminSellers /></ProtectedRoute>} />
              <Route path="/admin/pedidos" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/categorias" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
              
              {/* Seller Routes */}
              <Route path="/vendedor" element={<ProtectedRoute requireSeller><SellerDashboard /></ProtectedRoute>} />
              <Route path="/vendedor/livros" element={<ProtectedRoute requireSeller><SellerBooks /></ProtectedRoute>} />
              <Route path="/vendedor/vendas" element={<ProtectedRoute requireSeller><SellerSales /></ProtectedRoute>} />
              <Route path="/vendedor/comissoes" element={<ProtectedRoute requireSeller><SellerCommissions /></ProtectedRoute>} />
              <Route path="/vendedor/configuracoes" element={<ProtectedRoute requireSeller><SellerSettings /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
