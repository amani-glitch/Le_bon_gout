import { Route, Routes } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { DemoAdminLayout } from "@/layouts/DemoAdminLayout";
import { PublicLayout } from "@/layouts/PublicLayout";

import { AuthCallbackPage } from "@/features/auth/AuthCallbackPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { LandingPage } from "@/features/landing/LandingPage";
import { MenuPage } from "@/features/menu/MenuPage";
import { ProductDetailPage } from "@/features/menu/ProductDetailPage";
import { CheckoutPage } from "@/features/checkout/CheckoutPage";
import { OrderConfirmationPage } from "@/features/checkout/OrderConfirmationPage";
import { OrdersPage } from "@/features/orders/OrdersPage";
import { OrderTrackingPage } from "@/features/orders/OrderTrackingPage";
import { FavoritesPage } from "@/features/favorites/FavoritesPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { NotFoundPage } from "@/features/misc/NotFoundPage";

import { AdminConversations } from "@/features/admin/AdminConversations";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { AdminLeads } from "@/features/admin/AdminLeads";
import { AdminOrders } from "@/features/admin/AdminOrders";
import { AdminProducts } from "@/features/admin/AdminProducts";
import { AdminProductForm } from "@/features/admin/AdminProductForm";
import { AdminCustomers } from "@/features/admin/AdminCustomers";

import { AdminRoute, ProtectedRoute } from "./guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:productId" element={<ProductDetailPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/confirmation/:orderId"
          element={
            <ProtectedRoute>
              <OrderConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/products/new" element={<AdminProductForm />} />
        <Route path="/admin/products/:productId" element={<AdminProductForm />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/conversations" element={<AdminConversations />} />
        <Route path="/admin/leads" element={<AdminLeads />} />
      </Route>

      {/* Public, read-only preview of the admin space — no auth required. */}
      <Route element={<DemoAdminLayout />}>
        <Route path="/demo/admin" element={<AdminDashboard />} />
        <Route path="/demo/admin/orders" element={<AdminOrders />} />
        <Route path="/demo/admin/products" element={<AdminProducts />} />
        <Route path="/demo/admin/customers" element={<AdminCustomers />} />
        <Route path="/demo/admin/conversations" element={<AdminConversations />} />
        <Route path="/demo/admin/leads" element={<AdminLeads />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
