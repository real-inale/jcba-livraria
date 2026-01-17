import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import CatalogPage from "./pages/CatalogPage";
import BookDetailPage from "./pages/BookDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
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
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/livros" element={<CatalogPage />} />
              <Route path="/livro/:id" element={<BookDetailPage />} />
              <Route path="/carrinho" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/pedidos" element={<OrdersPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/usuarios" element={<AdminUsers />} />
              <Route path="/admin/vendedores" element={<AdminSellers />} />
              <Route path="/admin/pedidos" element={<AdminOrders />} />
              <Route path="/admin/categorias" element={<AdminCategories />} />
              <Route path="/admin/configuracoes" element={<AdminSettings />} />
              <Route path="/vendedor" element={<SellerDashboard />} />
              <Route path="/vendedor/livros" element={<SellerBooks />} />
              <Route path="/vendedor/vendas" element={<SellerSales />} />
              <Route path="/vendedor/comissoes" element={<SellerCommissions />} />
              <Route path="/vendedor/configuracoes" element={<SellerSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
