import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { getToken, getUser } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import BuyerDashboard from "@/pages/buyer/dashboard";
import BuyerOrderDetails from "@/pages/buyer/order-details";
import DealerDashboard from "@/pages/dealer/dashboard";
import DealerSubOrders from "@/pages/dealer/suborders";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrderDetails from "@/pages/admin/order-details";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, role }: { component: any, role: string }) {
  const [, setLocation] = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      setLocation("/login");
    } else if (user.role !== role) {
      setLocation(`/${user.role}`);
    } else {
      setIsReady(true);
    }
  }, [setLocation, role]);

  if (!isReady) return null;
  return <Component />;
}

function RootRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const user = getUser();
    if (user?.role) {
      setLocation(`/${user.role}`);
    } else {
      setLocation("/login");
    }
  }, [setLocation]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Buyer Routes */}
      <Route path="/buyer">
        {() => <ProtectedRoute role="buyer" component={BuyerDashboard} />}
      </Route>
      <Route path="/buyer/orders/:id">
        {() => <ProtectedRoute role="buyer" component={BuyerOrderDetails} />}
      </Route>

      {/* Dealer Routes */}
      <Route path="/dealer">
        {() => <ProtectedRoute role="dealer" component={DealerDashboard} />}
      </Route>
      <Route path="/dealer/suborders">
        {() => <ProtectedRoute role="dealer" component={DealerSubOrders} />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <ProtectedRoute role="admin" component={AdminDashboard} />}
      </Route>
      <Route path="/admin/orders/:id">
        {() => <ProtectedRoute role="admin" component={AdminOrderDetails} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
