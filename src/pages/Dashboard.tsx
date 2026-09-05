import { dashboardData, CURRENT_USER_ARTIST } from "../data/mockData";
import { useNav } from "../store/useNavigation";
import { useAuth } from "../store/useAuthStore";
import { useDonations } from "../store/useDonationStore";

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPlays(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

function EarningsChart() {
  const data = dashboardData.monthlyData;
  const maxEarnings = Math.max(...data.map((d) => d.earningsCents));
  const h = 120;
  const w = 100;
  const padL = 0;
  const padB = 20;

  const points = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * (w - padL);
    const y = h - padB - ((d.earningsCents / maxEarnings) * (h - padB - 8));
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillD = `${pathD} L ${points[points.length - 1].x} ${h - padB} L ${points[0].x} ${h - padB} Z`;

  return (
    <svg viewBox={`0 0 100 ${h}`} className="w-full" style={{ height: "140px" }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#chartFill)" />
      <path d={pathD} fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill="#5EEAD4" />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={h - 4} textAnchor="middle" fill="#8A8A8E" fontSize="5">
          {p.month}
        </text>
      ))}
    </svg>
  );
}

function PlaysChart() {
  const data = dashboardData.monthlyData;
  const maxPlays = Math.max(...data.map((d) => d.plays));
  const h = 80;

  return (
    <div className="flex items-end gap-1.5" style={{ height: `${h}px` }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${Math.max(4, (d.plays / maxPlays) * (h - 20))}px`,
              backgroundColor: i === data.length - 1 ? "#5EEAD4" : "rgba(94,234,212,0.3)",
            }}
          />
          <span className="text-[9px] text-wl-muted">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { getArtistDonations } = useDonations();
  const myTracks: import("../types").Track[] = [];
  const myDonations = getArtistDonations("me");

  const statCards = [
    {
      label: "Total earnings",
      value: fmtMoney(dashboardData.totalEarningsCents),
      sub: `${fmtMoney(dashboardData.pendingPayoutCents)} pending payout`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      teal: true,
    },
    {
      label: "All-time plays",
      value: fmtPlays(dashboardData.allTimePlays),
      sub: `${fmtPlays(dashboardData.monthlyData[dashboardData.monthlyData.length - 1]?.plays ?? 0)} this month`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-9h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V5.25c0-.621.504-1.125 1.125-1.125zm-9.75 9h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      label: "Monthly listeners",
      value: fmtPlays(CURRENT_USER_ARTIST.monthlyListeners),
      sub: `${fmtPlays(CURRENT_USER_ARTIST.followers)} followers`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      label: "Donations received",
      value: `${myDonations.length}`,
      sub: fmtMoney(myDonations.reduce((s, d) => s + Math.round(d.amountCents * 0.8), 0)),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 animate-fade-up space-y-6 sm:space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">Artist Dashboard</h1>
          <p className="text-[#a7a7a7] text-xs sm:text-sm mt-1">
            Logged in as <span className="text-white font-semibold">{user.name}</span> ({user.handle})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ id: "profile" })}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider text-white border border-white/20 hover:border-white transition-colors cursor-pointer"
          >
            Edit Artist Page
          </button>
          <button
            onClick={() => navigate({ id: "upload" })}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-display font-bold text-xs sm:text-sm text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload Track
          </button>
        </div>
      </div>


      {/* Stripe Connect status */}
      {CURRENT_USER_ARTIST.stripeConnected ? (
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-[#181818] border border-emerald-500/20">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
          <p className="text-xs text-emerald-400 font-semibold">Stripe Connect active — donations and payouts are enabled</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-[#181818] border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-400 font-semibold">Connect Stripe to receive donations and payouts</p>
          </div>
          <button className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-display font-bold bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30 transition-colors cursor-pointer">
            Connect now
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#181818] hover:bg-[#202020] transition-colors border border-white/5 shadow-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={card.teal ? "text-[#5EEAD4]" : "text-[#a7a7a7]"}>{card.icon}</span>
              <span className="text-xs text-[#a7a7a7] font-semibold">{card.label}</span>
            </div>
            <p className={`font-display font-black text-2xl ${card.teal ? "text-[#5EEAD4]" : "text-white"}`}>{card.value}</p>
            <p className="text-xs text-[#a7a7a7] mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#181818] border border-white/5 shadow-md">
          <p className="text-xs text-[#a7a7a7] font-display font-bold uppercase tracking-wider mb-4">Earnings — last 6 months</p>
          <EarningsChart />
          <p className="text-xs text-[#a7a7a7] mt-3">
            Total: <span className="text-white font-semibold">{fmtMoney(dashboardData.monthlyData.reduce((s, d) => s + d.earningsCents, 0))}</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#181818] border border-white/5 shadow-md">
          <p className="text-xs text-[#a7a7a7] font-display font-bold uppercase tracking-wider mb-4">Plays — last 6 months</p>
          <PlaysChart />
          <div className="mt-4 space-y-2.5">
            {dashboardData.topCountries.slice(0, 3).map((c) => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="text-xs text-[#a7a7a7] flex-1 font-medium">{c.country}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[#282828] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#5EEAD4]"
                    style={{
                      width: `${(c.plays / dashboardData.topCountries[0].plays) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-[#a7a7a7] tabular-nums w-12 text-right font-medium">{fmtPlays(c.plays)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Track performance */}
      <div>
        <h2 className="font-display font-bold text-xl text-white mb-4">Your tracks</h2>
        <div className="space-y-2">
          {myTracks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#181818] hover:bg-[#202020] transition-colors border border-white/5"
            >
              <img src={t.coverArt} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-[#242424]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                <p className="text-xs text-[#a7a7a7]">{t.album} · {t.releaseYear}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-display font-bold text-white">{fmtPlays(t.playCount)}</p>
                <p className="text-xs text-[#a7a7a7]">plays</p>
              </div>
              <div className="w-24 hidden sm:block">
                <div className="h-1.5 rounded-full bg-[#282828] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#5EEAD4]"
                    style={{
                      width: `${(t.playCount / Math.max(...myTracks.map((x) => x.playCount))) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent donations */}
      <div className="pb-6">
        <h2 className="font-display font-bold text-xl text-white mb-4">Recent donations</h2>
        {myDonations.length > 0 ? (
          <div className="space-y-2">
            {myDonations.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-[#181818] border border-white/5">
                {d.donorAvatar ? (
                  <img src={d.donorAvatar} alt={d.donorName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-[#282828]">
                    <span className="text-xs font-bold text-[#a7a7a7]">{d.donorName[0].toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{d.donorName}</p>
                  {d.message && <p className="text-xs text-[#a7a7a7] truncate italic">&ldquo;{d.message}&rdquo;</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-display font-bold text-[#5EEAD4]">{fmtMoney(Math.round(d.amountCents * 0.8))}</p>
                  <p className="text-[10px] text-[#a7a7a7]">{d.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#a7a7a7] text-sm py-4">No donations yet. Set up Stripe Connect to start receiving support.</p>
        )}
      </div>
    </div>
  );
}
