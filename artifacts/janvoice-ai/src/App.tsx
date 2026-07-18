import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Shell } from '@/components/layout/Shell';

import LandingPage from '@/pages/landing';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import Campaigns from '@/pages/campaigns';
import CampaignDetail from '@/pages/campaign-detail';
import Petitions from '@/pages/petitions';
import PetitionDetail from '@/pages/petition-detail';
import Polls from '@/pages/polls';
import PollDetail from '@/pages/poll-detail';
import Community from '@/pages/community';
import Notifications from '@/pages/notifications';
import Profile from '@/pages/profile';
import AITools from '@/pages/ai-tools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected Routes wrapped in Shell */}
      <Route path="/dashboard"><ProtectedRoute><Shell><Dashboard /></Shell></ProtectedRoute></Route>
      <Route path="/campaigns"><ProtectedRoute><Shell><Campaigns /></Shell></ProtectedRoute></Route>
      <Route path="/campaigns/:id"><ProtectedRoute><Shell><CampaignDetail /></Shell></ProtectedRoute></Route>
      <Route path="/petitions"><ProtectedRoute><Shell><Petitions /></Shell></ProtectedRoute></Route>
      <Route path="/petitions/:id"><ProtectedRoute><Shell><PetitionDetail /></Shell></ProtectedRoute></Route>
      <Route path="/polls"><ProtectedRoute><Shell><Polls /></Shell></ProtectedRoute></Route>
      <Route path="/polls/:id"><ProtectedRoute><Shell><PollDetail /></Shell></ProtectedRoute></Route>
      <Route path="/community"><ProtectedRoute><Shell><Community /></Shell></ProtectedRoute></Route>
      <Route path="/ai-tools"><ProtectedRoute><Shell><AITools /></Shell></ProtectedRoute></Route>
      <Route path="/notifications"><ProtectedRoute><Shell><Notifications /></Shell></ProtectedRoute></Route>
      <Route path="/profile"><ProtectedRoute><Shell><Profile /></Shell></ProtectedRoute></Route>
      
      {/* Fallback */}
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-[#050A1A] text-white">
          <h1 className="text-2xl font-serif">404 - Page Not Found</h1>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
