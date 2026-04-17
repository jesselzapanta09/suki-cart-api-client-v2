import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

// Layouts
import HomeLayout   from "./layouts/HomeLayout.jsx";
import AuthLayout   from "./layouts/AuthLayout.jsx";
import AdminLayout  from "./layouts/Adminlayout.jsx";
import CustomerLayout from "./layouts/CustomerLayout.jsx";
import SellerLayout   from "./layouts/SellerLayout.jsx";

// Pages - Home
import Home from "./Home.jsx";
import ProductDetailPage from "./pages/home/ProductDetailPage.jsx";
import SearchResultsPage from "./pages/home/SearchResultsPage.jsx";

// Pages - Auth
import Login            from "./pages/auth/Login.jsx";
import RegisterCustomer from "./pages/auth/RegisterCustomer.jsx";
import RegisterSeller   from "./pages/auth/RegisterSeller.jsx";
import VerifyEmail      from "./pages/auth/Verifyemail.jsx";
import ForgotPassword   from "./pages/auth/Forgotpassword.jsx";
import ResetPassword    from "./pages/auth/Resetpassword.jsx";
import EditProfile      from "./pages/profile/EditProfile.jsx";

// Pages - Admin
import AdminDashboard from "./pages/admin/Admindashboard.jsx";
import UserIndex from "./pages/admin/user/UserIndex.jsx";
import CategoryIndex from "./pages/admin/category/CategoryIndex.jsx";
import SellerVerifyIndex from "./pages/admin/seller-verify/SellerVerifyIndex.jsx";
import SellerVerifyShow from "./pages/admin/seller-verify/SellerVerifyShow.jsx";
import SellerVerifyLogs from "./pages/admin/seller-verify/SellerVerifyLogs.jsx";
import SellerVerifyAllLogs from "./pages/admin/seller-verify/SellerVerifyAllLogs.jsx";import ManageSellerIndex from "./pages/admin/seller/ManageSellerIndex.jsx"
import ManageSellerShow from "./pages/admin/seller/ManageSellerShow.jsx"// Pages - Customer
import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";

// Pages - Seller
import SellerDashboard from "./pages/seller/SellerDashboard.jsx";
import ProductIndex from "./pages/seller/product/ProductIndex.jsx";
import ProductFormPage from "./pages/seller/product/ProductFormPage.jsx";

// Pages - Cart
import CartPage from "./pages/cart/CartPage.jsx";

// Pages - Notifications
import NotificationsPage from "./pages/notifications/NotificationsPage.jsx";

const antTheme = {
    token: {
        colorPrimary:     "#16a34a",
        colorLink:        "#15803d",
        borderRadius:     10,
        fontFamily:       "'DM Sans', sans-serif",
        colorBgContainer: "#ffffff",
    },
    components: {
        Button: { borderRadius: 10 },
        Input:  { borderRadius: 10 },
        Table:  { borderRadius: 12 },
        Card:   { borderRadius: 16 },
    },
};

function RoleRedirect() {
    const { isAuthenticated, isAdmin, isSeller, isCustomer } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (isAdmin)     return <Navigate to="/admin/dashboard" replace />;
    if (isSeller)    return <Navigate to="/seller/dashboard" replace />;
    if (isCustomer)  return <Navigate to="/customer/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
}

export default function App() {
    return (
        <ConfigProvider theme={antTheme}>
            <AntApp>
                <AuthProvider>
                    <NotificationProvider>
                        <CartProvider>
                            <BrowserRouter>
                            <Routes>
                                {/* Public - Home */}
                                <Route element={<HomeLayout />}>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/products/:id" element={<ProductDetailPage />} />
                                    <Route path="/search" element={<SearchResultsPage />} />
                                </Route>

                                {/* Auth pages */}
                                <Route element={<AuthLayout />}>
                                    <Route path="/login"             element={<Login />} />
                                    <Route path="/register/customer" element={<RegisterCustomer />} />
                                    <Route path="/register/seller"   element={<RegisterSeller />} />
                                </Route>

                                {/* Standalone */}
                                <Route path="/verify-email"    element={<VerifyEmail />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password"  element={<ResetPassword />} />

                                {/* Smart redirect */}
                                <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

                                {/* Admin routes */}
                                <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                                    <Route path="/admin/dashboard"    element={<AdminDashboard />} />
                                    <Route path="/admin/users"        element={<UserIndex />} />
                                    <Route path="/admin/categories"   element={<CategoryIndex />} />
                                    <Route path="/admin/seller-verify" element={<SellerVerifyIndex />} />
                                    <Route path="/admin/seller-verify/logs" element={<SellerVerifyAllLogs />} />
                                    <Route path="/admin/seller-verify/:id" element={<SellerVerifyShow />} />
                                    <Route path="/admin/seller-verify/:id/logs" element={<SellerVerifyLogs />} />
                                    <Route path="/admin/sellers" element={<ManageSellerIndex />} />
                                    <Route path="/admin/sellers/:id" element={<ManageSellerShow />} />
                                    <Route path="/admin/edit-profile" element={<EditProfile />} />
                                    <Route path="/notifications" element={<NotificationsPage />} />
                                </Route>

                                {/* Customer routes */}
                                <Route element={<ProtectedRoute role="customer"><CustomerLayout /></ProtectedRoute>}>
                                    <Route path="/customer/dashboard"    element={<CustomerDashboard />} />
                                    <Route path="/customer/edit-profile" element={<EditProfile />} />
                                    <Route path="/customer/notifications" element={<NotificationsPage />} />

                                    <Route path="/customer/cart" element={<CartPage />} />
                                </Route>

                                {/* Seller routes */}
                                <Route element={<ProtectedRoute role="seller"><SellerLayout /></ProtectedRoute>}>
                                    <Route path="/seller/dashboard"    element={<SellerDashboard />} />
                                    <Route path="/seller/products"     element={<ProductIndex />} />
                                    <Route path="/seller/products/create" element={<ProductFormPage mode="create" />} />
                                    <Route path="/seller/products/:id/edit" element={<ProductFormPage mode="edit" />} />
                                    <Route path="/seller/edit-profile" element={<EditProfile />} />
                                    <Route path="/seller/notifications" element={<NotificationsPage />} />
                                </Route>

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </CartProvider>
                    </NotificationProvider>
                </AuthProvider>
            </AntApp>
        </ConfigProvider>
    );
}
