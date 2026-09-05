import { AuthProvider, useAuth } from "./store/useAuthStore";
import { LibraryProvider } from "./store/useLibraryStore";
import { PlayerProvider } from "./store/usePlayerStore";
import { NavProvider } from "./store/useNavigation";
import { DonationProvider } from "./store/useDonationStore";
import AmbientCanvas from "./components/AmbientCanvas";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";

function MainContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <AmbientCanvas />
      <Layout />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DonationProvider>
        <LibraryProvider>
          <PlayerProvider>
            <NavProvider>
              <MainContent />
            </NavProvider>
          </PlayerProvider>
        </LibraryProvider>
      </DonationProvider>
    </AuthProvider>
  );
}

