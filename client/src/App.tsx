import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import BanhoTosa from "./pages/BanhoTosa";
import Clientes from "./pages/Clientes";
import Pets from "./pages/Pets";
import Marketing from "./pages/Marketing";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/produtos">
        <DashboardLayout>
          <Produtos />
        </DashboardLayout>
      </Route>
      <Route path="/banho-tosa">
        <DashboardLayout>
          <BanhoTosa />
        </DashboardLayout>
      </Route>
      <Route path="/clientes">
        <DashboardLayout>
          <Clientes />
        </DashboardLayout>
      </Route>
      <Route path="/pets">
        <DashboardLayout>
          <Pets />
        </DashboardLayout>
      </Route>
      <Route path="/marketing">
        <DashboardLayout>
          <Marketing />
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
