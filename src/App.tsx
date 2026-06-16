import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Game from "@/pages/Game";
import Lobby from "@/pages/Lobby";
import { AuthProvider } from "@/contexts/AuthContext";
import { FadeIn } from "@/components/FadeIn";

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();

  return (
    <FadeIn key={location} duration={0.28} fade>
      <Switch>
        <Route path="/" component={Lobby} />
        <Route path="/game" component={Game} />
        <Route component={NotFound} />
      </Switch>
    </FadeIn>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
