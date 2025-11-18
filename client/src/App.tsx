import { Switch, Route } from "wouter";
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

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/barrack/:id" component={BarrackDetailPage} />
      
      {/* Admin login (no sidebar) */}
      <Route path="/admin/login" component={AdminLoginPage} />
      
      {/* Admin routes with sidebar - more specific routes first */}
      <Route path="/admin/barracks/new">
        <AdminLayout><AdminBarrackFormPage /></AdminLayout>
      </Route>
      <Route path="/admin/barracks/:id/edit">
        <AdminLayout><AdminBarrackFormPage /></AdminLayout>
      </Route>
      <Route path="/admin/barracks">
        <AdminLayout><AdminBarracksPage /></AdminLayout>
      </Route>
      <Route path="/admin/inventory">
        <AdminLayout><AdminInventoryPage /></AdminLayout>
      </Route>
      <Route path="/admin/members">
        <AdminLayout><AdminMembersPage /></AdminLayout>
      </Route>
      <Route path="/admin/dashboard">
        <AdminLayout><AdminDashboardPage /></AdminLayout>
      </Route>
      
      {/* 404 fallback */}
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
