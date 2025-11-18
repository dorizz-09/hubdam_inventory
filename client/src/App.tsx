import { Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/admin-layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import BarrackDetailPage from "@/pages/barrack-detail";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminBarracksPage from "@/pages/admin-barracks";
import AdminBarrackFormPage from "@/pages/admin-barrack-form";
import AdminInventoryPage from "@/pages/admin-inventory";
import AdminMembersPage from "@/pages/admin-members";

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/dashboard" component={AdminDashboardPage} />
        <Route path="/admin/barracks" component={AdminBarracksPage} />
        <Route path="/admin/barracks/new" component={AdminBarrackFormPage} />
        <Route path="/admin/barracks/:id/edit" component={AdminBarrackFormPage} />
        <Route path="/admin/inventory" component={AdminInventoryPage} />
        <Route path="/admin/members" component={AdminMembersPage} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  const [isAdminRoute] = useRoute("/admin/:rest*");
  const [isAdminLogin] = useRoute("/admin/login");

  // Admin routes with sidebar (except login)
  if (isAdminRoute && !isAdminLogin) {
    return <AdminRouter />;
  }

  // Public routes and admin login
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/barrack/:id" component={BarrackDetailPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
