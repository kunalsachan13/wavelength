"""
Wavelength Music Service — Powered by SpotAPI (Aran404/SpotAPI).

Architecture:
  - SpotAPI: Search, artist info, playlist extraction, album data from Spotify's catalog.
  - JioSaavn CDN: Full-length 320kbps audio stream resolution by title+artist match.
  - Audius: Fallback audio stream for indie tracks.

Audio resolution flow:
  Frontend requests /stream/resolve?title=X&artist=Y → backend searches JioSaavn/Audius
  → returns redirect (307) to the best available full-length audio stream.

Run with: uvicorn main:app --port 8001
"""

import sys
import os
import json
import time
import threading
import logging
import re
import urllib.request
import urllib.parse
from typing import Any
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wavelength")

app = FastAPI(title="Wavelength Music Service", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

HEADERS = {"User-Agent": "Wavelength/2.0"}

# ─── SpotAPI Setup (Singleton) ──────────────────────────────────────────────

# Add SpotAPI clone to Python path
spotapi_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "SpotAPI"))
if os.path.exists(spotapi_path):
    sys.path.insert(0, spotapi_path)

SPOTAPI_AVAILABLE = False
_song_client = None
_artist_client = None
_client_lock = threading.Lock()

try:
    from spotapi import Song, Artist, PublicPlaylist, PublicAlbum, Public
    SPOTAPI_AVAILABLE = True
    logger.info("✅ SpotAPI loaded successfully")
except Exception as e:
    logger.warning("⚠️  SpotAPI import failed: %s", e)


def _get_song_client():
    global _song_client
    if _song_client is not None:
        return _song_client
    with _client_lock:
        if _song_client is None and SPOTAPI_AVAILABLE:
            _song_client = Song()
    return _song_client


def _get_artist_client():
    global _artist_client
    if _artist_client is not None:
        return _artist_client
    with _client_lock:
        if _artist_client is None and SPOTAPI_AVAILABLE:
            _artist_client = Artist()
    return _artist_client


# ─── In-Memory Caching ─────────────────────────────────────────────────────

QUERY_CACHE: dict[str, tuple[float, Any]] = {}
PLAYLIST_CACHE: dict[str, tuple[float, Any]] = {}
CACHE_TTL = 900  # 15 minutes
PLAYLIST_CACHE_TTL = 1800  # 30 minutes

SPOTIFY_PLAYLIST_SEEDS = [
    {"id": "37i9dQZF1DXcBWIGoYBM5M", "badge": "TOP HITS", "name": "Today's Top Hits"},
    {"id": "37i9dQZEVXbMDoHDwVN2tF", "badge": "GLOBAL 50", "name": "Top 50 - Global"},
    {"id": "37i9dQZEVXbLiRSasKsNU9", "badge": "VIRAL", "name": "Viral 50 - Global"},
    {"id": "37i9dQZF1DX0XUsuxWHRQd", "badge": "HIP HOP", "name": "RapCaviar"},
    {"id": "37i9dQZF1DX4WYpdgoIcn6", "badge": "CHILL", "name": "Chill Hits"},
    {"id": "37i9dQZF1DX4UtSsGT1Sbe", "badge": "80s", "name": "All Out 80s"},
]

# ─── JioSaavn Audio Resolution ──────────────────────────────────────────────

SAAVN_APIS = [
    "https://jiosaavn-api-black.vercel.app/api/search/songs?query=",
    "https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=",
]


def _http_get(url: str, timeout: int = 8) -> dict[str, Any]:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def _resolve_jiosaavn(title: str, artist: str) -> dict[str, Any] | None:
    """Search JioSaavn for a full-length 320kbps audio stream."""
    query = f"{title} {artist}".strip()
    if not query:
        return None

    for api_base in SAAVN_APIS:
        try:
            url = api_base + urllib.parse.quote(query)
            data = _http_get(url, timeout=5)
            results = data.get("data", {}).get("results") or data.get("results") or data.get("data")

            if isinstance(results, list) and results:
                song = results[0]
                audio_url = ""
                quality = "320kbps"

                dl = song.get("downloadUrl")
                if isinstance(dl, list) and dl:
                    high = next((d for d in dl if d.get("quality") == "320kbps"), None)
                    if not high:
                        high = next((d for d in dl if d.get("quality") == "160kbps"), None)
                    if not high:
                        high = dl[-1]
                    audio_url = high.get("url", "") if high else dl[0].get("url", "")
                    quality = high.get("quality", "320kbps") if high else "160kbps"
                elif isinstance(dl, str) and dl:
                    audio_url = dl

                if audio_url:
                    return {
                        "audioUrl": audio_url,
                        "duration": int(song.get("duration", 210)),
                        "quality": quality,
                        "source": "jiosaavn",
                    }
        except Exception:
            continue

    return None


def _resolve_audius(title: str, artist: str) -> dict[str, Any] | None:
    """Search Audius for a full-length audio stream."""
    query = f"{title} {artist}".strip()
    try:
        url = f"https://discoveryprovider.audius.co/v1/tracks/search?query={urllib.parse.quote(query)}&app_name=wavelength"
        data = _http_get(url, timeout=5)
        results = data.get("data", [])
        if results:
            track = results[0]
            track_id = track.get("id", "")
            audio_url = f"https://discoveryprovider.audius.co/v1/tracks/{track_id}/stream?app_name=wavelength"
            return {
                "audioUrl": audio_url,
                "duration": int(track.get("duration", 210)),
                "quality": "320kbps",
                "source": "audius",
            }
    except Exception:
        pass
    return None


# ─── SpotAPI Track Parser ───────────────────────────────────────────────────

def _parse_spotapi_track(item_data: dict[str, Any], rank: int = 0) -> dict[str, Any] | None:
    """Parse a SpotAPI GraphQL track item into our normalized format."""
    try:
        data = item_data.get("item", {}).get("data", {})
        if not data:
            data = item_data.get("data", {})
        if not data:
            data = item_data

        if data.get("__typename") and data["__typename"] != "Track":
            return None

        track_id = data.get("id") or (data.get("uri", "").split(":")[-1] if data.get("uri") else "")
        title = data.get("name", "")
        if not title or not track_id:
            return None

        # Duration
        duration_ms = (
            data.get("duration", {}).get("totalMilliseconds", 0)
            or data.get("trackDuration", {}).get("totalMilliseconds", 0)
        )
        if isinstance(data.get("duration"), (int, float)):
            duration_ms = int(data["duration"])
        duration_s = round(duration_ms / 1000) if duration_ms else 210

        # Artists
        artists = data.get("artists", {}).get("items", [])
        artist_name = artists[0].get("profile", {}).get("name", "Unknown Artist") if artists else "Unknown Artist"
        artist_id = artists[0].get("uri", "").split(":")[-1] if artists else ""

        # All artists joined
        all_artists = ", ".join(
            a.get("profile", {}).get("name", "") for a in artists if a.get("profile", {}).get("name")
        ) or artist_name

        # Album & Cover art
        album = data.get("albumOfTrack", {}) or data.get("album", {})
        album_name = album.get("name", "")
        cover_sources = album.get("coverArt", {}).get("sources", [])
        cover_url = cover_sources[0].get("url") if cover_sources else ""

        # Explicit
        content_rating = data.get("contentRating", {})
        is_explicit = (content_rating.get("label", "").upper() == "EXPLICIT") if isinstance(content_rating, dict) else False

        # Playcount
        try:
            playcount = int(data.get("playcount", "0"))
        except (ValueError, TypeError):
            playcount = 0

        return {
            "id": f"sp-{track_id}",
            "spotifyId": track_id,
            "title": title,
            "artistName": all_artists,
            "artistId": artist_id,
            "artistAvatar": "",
            "album": album_name,
            "coverArt": cover_url,
            "durationMs": duration_ms,
            "duration": duration_s,
            "previewUrl": "",
            "audioUrl": f"/api/music/stream/resolve?title={urllib.parse.quote(title)}&artist={urllib.parse.quote(artist_name)}",
            "isExplicit": is_explicit,
            "source": "spotify",
            "rank": rank or playcount,
            "needsResolve": True,
        }
    except Exception as exc:
        logger.debug("Failed to parse SpotAPI track: %s", exc)
        return None


def _parse_spotapi_artist(item_data: dict[str, Any]) -> dict[str, Any] | None:
    """Parse a SpotAPI GraphQL artist search result."""
    try:
        data = item_data.get("data", item_data)
        uri = data.get("uri", "")
        artist_id = uri.split(":")[-1] if ":" in uri else ""

        profile = data.get("profile", {})
        name = profile.get("name", "") or data.get("name", "")
        if not name:
            return None

        # Avatar
        visuals = data.get("visuals", {})
        avatar_img = visuals.get("avatarImage", {})
        sources = avatar_img.get("sources", []) if avatar_img else []
        avatar_url = sorted(sources, key=lambda s: s.get("width", 0), reverse=True)[0].get("url", "") if sources else ""

        # Verification
        rep = data.get("onPlatformReputationTrait", {})
        verified = rep.get("verification", {}).get("isVerified", False) if rep else False

        return {
            "id": f"sp-artist-{artist_id}",
            "spotifyId": artist_id,
            "name": name,
            "avatarUrl": avatar_url,
            "coverUrl": avatar_url,
            "verified": verified,
        }
    except Exception:
        return None


def _parse_spotapi_playlist(item_data: dict[str, Any]) -> dict[str, Any] | None:
    """Parse a SpotAPI GraphQL playlist search result."""
    try:
        data = item_data.get("data", item_data)
        if data.get("__typename") and data["__typename"] != "Playlist":
            return None
        uri = data.get("uri", "")
        playlist_id = uri.split(":")[-1] if ":" in uri else ""
        if not playlist_id:
            return None
        name = data.get("name", "")
        if not name:
            return None
        description = data.get("description", "")
        images = data.get("images", {}).get("items", [])
        cover_url = ""
        if images and images[0].get("sources"):
            cover_url = images[0]["sources"][0].get("url", "")
        owner_name = data.get("ownerV2", {}).get("data", {}).get("name", "Spotify") or "Spotify"
        return {
            "id": f"sp-playlist-{playlist_id}",
            "spotifyId": playlist_id,
            "title": name,
            "description": description,
            "owner": owner_name,
            "badge": "PLAYLIST",
            "coverArt": cover_url,
            "trackCount": 0,
            "tracks": [],
        }
    except Exception as exc:
        logger.debug("Failed to parse SpotAPI playlist: %s", exc)
        return None


# ─── SpotAPI Playlist Fetcher ───────────────────────────────────────────────

def _fetch_spotify_playlist(playlist_id: str, badge: str = "HOT") -> dict[str, Any] | None:
    """Fetch real-time Spotify playlist via PublicPlaylist."""
    if not SPOTAPI_AVAILABLE:
        return None
    try:
        clean_id = playlist_id.replace("sp-playlist-", "")
        pl = PublicPlaylist(clean_id)
        info = pl.get_playlist_info()
        pdata = info.get("data", {}).get("playlistV2", {})
        if not pdata:
            return None

        title = pdata.get("name") or "Spotify Playlist"
        desc = pdata.get("description") or ""

        images = pdata.get("images", {}).get("items", [])
        cover_url = images[0]["sources"][0]["url"] if images and images[0].get("sources") else ""

        owner_data = pdata.get("ownerV2", {}).get("data", {}) or {}
        owner_name = owner_data.get("name", "Spotify") or "Spotify"

        contents = pdata.get("content", {}).get("items", [])
        tracks = []
        for track_item in contents:
            data = track_item.get("itemV2", {}).get("data", {}) or track_item.get("item", {}).get("data", {})
            if not data or data.get("__typename") != "Track":
                continue
            parsed = _parse_spotapi_track({"data": data}, rank=50 - len(tracks))
            if parsed:
                tracks.append(parsed)

        return {
            "id": f"sp-playlist-{clean_id}",
            "spotifyId": clean_id,
            "title": title,
            "description": desc,
            "owner": owner_name,
            "badge": badge,
            "coverArt": cover_url,
            "trackCount": len(tracks),
            "tracks": tracks,
        }
    except Exception as exc:
        logger.warning("Error fetching Spotify playlist %s: %s", playlist_id, exc)
        return None


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "spotapi": SPOTAPI_AVAILABLE,
        "version": "4.0.0",
    }


@app.get("/spotify/search")
def search_tracks(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
) -> dict[str, Any]:
    """Search via SpotAPI (Spotify catalog)."""
    logger.info("Search: %r (limit=%d)", q, limit)

    if not SPOTAPI_AVAILABLE:
        return {"tracks": [], "artists": [], "playlists": [], "query": q, "total": 0, "error": "SpotAPI not available"}

    # Check cache
    cache_key = f"search_{q.lower()}_{limit}"
    now = time.time()
    if cache_key in QUERY_CACHE:
        cached_time, cached_data = QUERY_CACHE[cache_key]
        if now - cached_time < CACHE_TTL:
            return {**cached_data, "cached": True}

    tracks = []
    artists = []
    playlists = []

    try:
        client = _get_song_client()
        if client:
            raw = client.query_songs(q, limit=limit)
            search_v2 = raw.get("data", {}).get("searchV2", {})

            # Tracks
            raw_tracks = search_v2.get("tracksV2", {}).get("items", [])
            for i, item in enumerate(raw_tracks[:limit]):
                parsed = _parse_spotapi_track(item, rank=limit - i)
                if parsed:
                    tracks.append(parsed)

            # Artists from search results
            raw_artists = search_v2.get("artists", {}).get("items", [])
            for item in raw_artists[:8]:
                parsed = _parse_spotapi_artist(item)
                if parsed:
                    artists.append(parsed)

            # Playlists from search results
            raw_playlists = search_v2.get("playlists", {}).get("items", [])
            for item in raw_playlists[:12]:
                parsed = _parse_spotapi_playlist(item)
                if parsed:
                    playlists.append(parsed)

        logger.info("SpotAPI search %r → %d tracks, %d artists, %d playlists", q, len(tracks), len(artists), len(playlists))
    except Exception as exc:
        logger.warning("SpotAPI search failed: %s", exc)

    result = {
        "tracks": tracks,
        "artists": artists,
        "playlists": playlists,
        "query": q,
        "total": len(tracks),
    }
    QUERY_CACHE[cache_key] = (now, result)
    return result


@app.get("/spotify/track/{track_id}")
def get_track(track_id: str) -> dict[str, Any]:
    """Get single track info via SpotAPI."""
    clean_id = track_id.replace("sp-", "")

    if SPOTAPI_AVAILABLE:
        try:
            client = _get_song_client()
            if client:
                result = client.get_track_info(clean_id)
                track_data = result.get("data", {}).get("trackUnion", {})
                if track_data:
                    parsed = _parse_spotapi_track({"data": track_data})
                    if parsed:
                        return parsed
        except Exception as exc:
            logger.warning("SpotAPI track lookup failed: %s", exc)

    raise HTTPException(status_code=404, detail="Track not found")


@app.get("/chart/tracks")
def chart_tracks(limit: int = Query(20, ge=1, le=50)) -> dict[str, Any]:
    """Top tracks from Spotify's Top 50 Global playlist via SpotAPI."""
    cache_key = f"chart_tracks_{limit}"
    now = time.time()
    if cache_key in QUERY_CACHE:
        cached_time, cached_data = QUERY_CACHE[cache_key]
        if now - cached_time < CACHE_TTL:
            return {**cached_data, "cached": True}

    tracks = []
    if SPOTAPI_AVAILABLE:
        try:
            pl = _fetch_spotify_playlist("37i9dQZF1DXcBWIGoYBM5M", "TOP HITS")
            if pl and pl.get("tracks"):
                tracks = pl["tracks"][:limit]
            logger.info("SpotAPI chart → %d tracks", len(tracks))
        except Exception as exc:
            logger.warning("SpotAPI chart failed: %s", exc)

    result = {"tracks": tracks, "total": len(tracks)}
    if tracks:
        QUERY_CACHE[cache_key] = (now, result)
    return result


@app.get("/chart/artists")
def chart_artists(limit: int = Query(10, ge=1, le=50)) -> dict[str, Any]:
    """Top artists via SpotAPI search."""
    cache_key = f"chart_artists_{limit}"
    now = time.time()
    if cache_key in QUERY_CACHE:
        cached_time, cached_data = QUERY_CACHE[cache_key]
        if now - cached_time < CACHE_TTL:
            return {**cached_data, "cached": True}

    artists = []
    if SPOTAPI_AVAILABLE:
        try:
            client = _get_artist_client()
            if client:
                result = client.query_artists("top hits 2024", limit=limit)
                items = result.get("data", {}).get("searchV2", {}).get("artists", {}).get("items", [])
                for item in items:
                    parsed = _parse_spotapi_artist(item)
                    if parsed:
                        artists.append(parsed)
        except Exception as exc:
            logger.warning("SpotAPI artist chart failed: %s", exc)

    result = {"artists": artists, "total": len(artists)}
    if artists:
        QUERY_CACHE[cache_key] = (now, result)
    return result


@app.get("/chart/albums")
def chart_albums(limit: int = Query(10, ge=1, le=50)) -> dict[str, Any]:
    """Chart albums — extracted from search results."""
    cache_key = f"chart_albums_{limit}"
    now = time.time()
    if cache_key in QUERY_CACHE:
        cached_time, cached_data = QUERY_CACHE[cache_key]
        if now - cached_time < CACHE_TTL:
            return {**cached_data, "cached": True}

    albums = []
    if SPOTAPI_AVAILABLE:
        try:
            client = _get_song_client()
            if client:
                raw = client.query_songs("top hits 2024", limit=20)
                search_v2 = raw.get("data", {}).get("searchV2", {})
                raw_albums = search_v2.get("albumsV2", {}).get("items", [])
                for item in raw_albums[:limit]:
                    data = item.get("data", item)
                    uri = data.get("uri", "")
                    album_id = uri.split(":")[-1] if ":" in uri else ""
                    if not album_id:
                        continue

                    title = data.get("name", "")
                    artists_items = data.get("artists", {}).get("items", [])
                    artist_name = artists_items[0].get("profile", {}).get("name", "") if artists_items else ""

                    cover_sources = data.get("coverArt", {}).get("sources", [])
                    cover_url = cover_sources[0].get("url", "") if cover_sources else ""

                    release_year = str(data.get("date", {}).get("year", ""))

                    albums.append({
                        "id": f"sp-album-{album_id}",
                        "spotifyId": album_id,
                        "title": title,
                        "artistName": artist_name,
                        "coverArt": cover_url,
                        "coverArtXl": cover_url,
                        "year": release_year,
                    })
        except Exception as exc:
            logger.warning("SpotAPI album chart failed: %s", exc)

    result = {"albums": albums, "total": len(albums)}
    if albums:
        QUERY_CACHE[cache_key] = (now, result)
    return result


@app.get("/playlists")
def get_playlists() -> dict[str, Any]:
    """Fetch curated Spotify playlists via SpotAPI."""
    cache_key = "playlists_all"
    now = time.time()
    if cache_key in PLAYLIST_CACHE:
        cached_time, cached_data = PLAYLIST_CACHE[cache_key]
        if now - cached_time < PLAYLIST_CACHE_TTL:
            return cached_data

    playlists = []
    if SPOTAPI_AVAILABLE:
        for seed in SPOTIFY_PLAYLIST_SEEDS:
            try:
                pl = _fetch_spotify_playlist(seed["id"], seed["badge"])
                if pl and pl.get("tracks"):
                    playlists.append(pl)
            except Exception as exc:
                logger.warning("Error fetching playlist %s: %s", seed["id"], exc)

    result = {"playlists": playlists, "total": len(playlists)}
    if playlists:
        PLAYLIST_CACHE[cache_key] = (now, result)
    return result


@app.get("/playlist/{playlist_id}")
def get_playlist(playlist_id: str) -> dict[str, Any]:
    """Get single playlist details."""
    if SPOTAPI_AVAILABLE:
        pl = _fetch_spotify_playlist(playlist_id)
        if pl:
            return {"playlist": pl}
    raise HTTPException(status_code=404, detail="Playlist not found")


@app.get("/artist/{artist_id}")
def get_artist_profile(artist_id: str) -> dict[str, Any]:
    """Get full artist profile via SpotAPI."""
    if not SPOTAPI_AVAILABLE:
        raise HTTPException(status_code=503, detail="SpotAPI not available")

    clean_id = artist_id.replace("sp-artist-", "").replace("dz-artist-", "")

    try:
        client = _get_artist_client()
        if client:
            result = client.get_artist(clean_id)
            artist_union = result.get("data", {}).get("artistUnion", {})
            if artist_union:
                profile = artist_union.get("profile", {})
                stats = artist_union.get("stats", {})
                visuals = artist_union.get("visuals", {})

                # Avatar
                avatar_url = ""
                avatar_img = visuals.get("avatarImage", {})
                if avatar_img:
                    sources = avatar_img.get("sources", [])
                    if sources:
                        avatar_url = sorted(sources, key=lambda s: s.get("width", 0), reverse=True)[0].get("url", "")

                # Header/cover
                header_url = avatar_url
                header_img = visuals.get("headerImage", {})
                if header_img:
                    sources = header_img.get("sources", [])
                    if sources:
                        header_url = sorted(sources, key=lambda s: s.get("width", 0), reverse=True)[0].get("url", "")

                # Bio
                bio = ""
                biography = profile.get("biography", {})
                if biography:
                    bio = biography.get("text", "")

                # Top tracks
                top_tracks_data = (
                    artist_union.get("discography", {})
                    .get("topTracks", {})
                    .get("items", [])
                )
                top_tracks = []
                for i, item in enumerate(top_tracks_data[:10]):
                    track = item.get("track", {})
                    parsed = _parse_spotapi_track({"data": track}, rank=10 - i)
                    if parsed:
                        top_tracks.append(parsed)

                # Genres
                genres = [g.get("name", "") for g in profile.get("genres", {}).get("items", [])]

                return {
                    "id": f"sp-artist-{clean_id}",
                    "spotifyId": clean_id,
                    "name": profile.get("name", "Unknown"),
                    "avatarUrl": avatar_url,
                    "coverUrl": header_url,
                    "bio": bio,
                    "isVerified": profile.get("verified", False),
                    "monthlyListeners": stats.get("monthlyListeners", 0),
                    "followers": stats.get("followers", 0),
                    "worldRank": stats.get("worldRank", 0),
                    "genres": genres,
                    "topTracks": top_tracks,
                }
    except Exception as exc:
        logger.warning("SpotAPI artist profile failed: %s", exc)

    raise HTTPException(status_code=404, detail="Artist not found")


@app.get("/artist/{artist_id}/top")
def get_artist_top(
    artist_id: str,
    limit: int = Query(10, ge=1, le=50),
) -> dict[str, Any]:
    """Top tracks for an artist."""
    if SPOTAPI_AVAILABLE:
        clean_id = artist_id.replace("sp-artist-", "").replace("dz-artist-", "")
        try:
            client = _get_artist_client()
            if client:
                result = client.get_artist(clean_id)
                top_tracks_data = (
                    result.get("data", {})
                    .get("artistUnion", {})
                    .get("discography", {})
                    .get("topTracks", {})
                    .get("items", [])
                )
                tracks = []
                for i, item in enumerate(top_tracks_data[:limit]):
                    track = item.get("track", {})
                    parsed = _parse_spotapi_track({"data": track}, rank=limit - i)
                    if parsed:
                        tracks.append(parsed)
                if tracks:
                    return {"tracks": tracks, "total": len(tracks)}
        except Exception as exc:
            logger.warning("SpotAPI artist top tracks failed: %s", exc)

    return {"tracks": [], "total": 0}


@app.get("/album/{album_id}")
def get_album(album_id: str) -> dict[str, Any]:
    """Get album details and tracks via SpotAPI."""
    if not SPOTAPI_AVAILABLE:
        raise HTTPException(status_code=503, detail="SpotAPI not available")

    clean_id = album_id.replace("sp-album-", "")
    try:
        pa = PublicAlbum(clean_id)
        info = pa.get_album_info(limit=50)
        album_union = info.get("data", {}).get("albumUnion", {})
        if not album_union:
            raise HTTPException(status_code=404, detail="Album not found")

        title = album_union.get("name", "")
        cover_sources = album_union.get("coverArt", {}).get("sources", [])
        cover_url = cover_sources[0]["url"] if cover_sources else ""

        artists_items = album_union.get("artists", {}).get("items", [])
        artist_name = artists_items[0].get("profile", {}).get("name", "") if artists_items else ""
        release_year = str(album_union.get("date", {}).get("year", ""))

        track_items = album_union.get("tracksV2", {}).get("items", [])
        tracks = []
        for ti in track_items:
            tdata = ti.get("track", {})
            if not tdata:
                continue
            parsed = _parse_spotapi_track({"data": tdata})
            if parsed:
                # Override cover art with album cover
                parsed["coverArt"] = cover_url
                tracks.append(parsed)

        return {
            "id": f"sp-album-{clean_id}",
            "spotifyId": clean_id,
            "title": title,
            "artistName": artist_name,
            "coverArt": cover_url,
            "year": release_year,
            "trackCount": len(tracks),
            "tracks": tracks,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("SpotAPI album fetch failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.api_route("/stream/resolve", methods=["GET", "HEAD"])
def resolve_stream(
    title: str = Query(..., min_length=1),
    artist: str = Query("", min_length=0),
) -> Any:
    """
    Resolve a full-length audio stream for a track by title + artist.
    Returns a 307 redirect to the audio URL, or 404 if not found.
    This is the key endpoint that makes Spotify tracks playable.
    """
    logger.info("Resolving stream: %r by %r", title, artist)

    # Check cache
    cache_key = f"stream_{title.lower()}_{artist.lower()}"
    now = time.time()
    if cache_key in QUERY_CACHE:
        cached_time, cached_data = QUERY_CACHE[cache_key]
        if now - cached_time < CACHE_TTL:
            return RedirectResponse(url=cached_data["audioUrl"], status_code=307)

    # 1. JioSaavn (320kbps full-length)
    result = _resolve_jiosaavn(title, artist)
    if result:
        QUERY_CACHE[cache_key] = (now, result)
        return RedirectResponse(url=result["audioUrl"], status_code=307)

    # 2. Try with cleaned title (remove feat., remix annotations, etc.)
    if artist and len(title) > 3:
        clean_title = re.sub(r"\([^)]*\)", "", title).replace("[", "").replace("]", "").strip()
        result = _resolve_jiosaavn(clean_title, artist)
        if result:
            QUERY_CACHE[cache_key] = (now, result)
            return RedirectResponse(url=result["audioUrl"], status_code=307)

    # 3. Audius fallback
    result = _resolve_audius(title, artist)
    if result:
        QUERY_CACHE[cache_key] = (now, result)
        return RedirectResponse(url=result["audioUrl"], status_code=307)

    raise HTTPException(status_code=404, detail="No audio stream found")
