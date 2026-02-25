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
import Cadastros from "./pages/Cadastros";
import ClientesEFornecedores from "./pages/ClientesEFornecedores";
import Vendedores from "./pages/Vendedores";
import Funcionarios from "./pages/Funcionarios";
import ContasFinanceiras from "./pages/ContasFinanceiras";
import CategoriasFinanceiras from "./pages/CategoriasFinanceiras";
import FormasPagamento from "./pages/FormasPagamento";
import RelatoriosCadastros from "./pages/RelatoriosCadastros";

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
      <Route path="/cadastros">
        <DashboardLayout>
          <Cadastros />
        </DashboardLayout>
      </Route>
      <Route path="/clientes-fornecedores">
        <DashboardLayout>
          <ClientesEFornecedores />
        </DashboardLayout>
      </Route>
      <Route path="/vendedores">
        <DashboardLayout>
          <Vendedores />
        </DashboardLayout>
      </Route>
      <Route path="/funcionarios">
        <DashboardLayout>
          <Funcionarios />
        </DashboardLayout>
      </Route>
      <Route path="/contas-financeiras">
        <DashboardLayout>
          <ContasFinanceiras />
        </DashboardLayout>
      </Route>
      <Route path="/categorias-financeiras">
        <DashboardLayout>
          <CategoriasFinanceiras />
        </DashboardLayout>
      </Route>
      <Route path="/formas-pagamento">
        <DashboardLayout>
          <FormasPagamento />
        </DashboardLayout>
      </Route>
      <Route path="/relatorios-cadastros">
        <DashboardLayout>
          <RelatoriosCadastros />
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
