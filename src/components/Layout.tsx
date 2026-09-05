import { usePlayer } from "../store/usePlayerStore";
import { useNav } from "../store/useNavigation";
import { useDonations } from "../store/useDonationStore";
import { useLibrary } from "../store/useLibraryStore";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MiniPlayer from "./MiniPlayer";
import NowPlaying from "./NowPlaying";
import TopBar from "./TopBar";
import DonationModal from "./DonationModal";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Home from "../pages/Home";
import Search from "../pages/Search";
import Library from "../pages/Library";
import ArtistProfile from "../pages/ArtistProfile";
import PlaylistPage from "../pages/PlaylistPage";
import Upload from "../pages/Upload";
import Dashboard from "../pages/Dashboard";
import ProfilePage from "../pages/ProfilePage";
import ErrorBoundary from "./ErrorBoundary";

export default function Layout() {
  const { state } = usePlayer();
  const { page } = useNav();
  const { activeDonationArtist, closeDonationModal } = useDonations();
  const { activePlaylistTrack, closeAddToPlaylist } = useLibrary();

  const renderPage = () => {
    switch (page.id) {
      case "home":
        return <Home />;
      case "search":
        return <Search />;
      case "library":
        return <Library />;
      case "artist":
        return <ArtistProfile artistId={page.artistId} />;
      case "playlist":
        return <PlaylistPage playlistId={page.playlistId} />;
      case "upload":
        return <Upload />;
      case "dashboard":
        return <Dashboard />;
      case "profile":
        return <ProfilePage />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] p-0 sm:p-2 gap-0 sm:gap-2 overflow-hidden select-none">
      {/* ─── Upper area: Sidebar + Main Content Panel ─── */}
      <div className="flex flex-1 gap-0 sm:gap-2 overflow-hidden min-h-0">
        {/* Left Sidebar (desktop) */}
        <Sidebar />

        {/* Right Main Content Panel */}
        <div className="flex-1 bg-[#121212] rounded-none sm:rounded-xl flex flex-col overflow-hidden relative min-w-0 shadow-2xl ring-0 sm:ring-1 ring-white/5">
          <TopBar />
          <main className="flex-1 overflow-y-auto relative scrollbar-thin pb-28 lg:pb-6">
            <ErrorBoundary key={page.id}>
              {renderPage()}
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* ─── Bottom area: Full-width player bar ─── */}
      <MiniPlayer />

      {/* Mobile bottom navigation (small screens only) */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {/* Fullscreen Now Playing overlay */}
      {state.showNowPlaying && state.currentTrack && <NowPlaying />}

      {/* Global Donation Modal for any track / artist */}
      {activeDonationArtist && (
        <DonationModal
          artist={activeDonationArtist}
          onClose={closeDonationModal}
        />
      )}

      {/* Global Add To Playlist Modal */}
      {activePlaylistTrack && (
        <AddToPlaylistModal
          track={activePlaylistTrack}
          onClose={closeAddToPlaylist}
        />
      )}
    </div>
  );
}
