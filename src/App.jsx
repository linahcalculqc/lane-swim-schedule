import { useState, useEffect } from "react";

const FACILITIES = {
  plant: {
    key: "plant-recreation-centre",
    name: "Plant",
    sub: "930 Somerset W.",
    color: "#fc7ffc",
    accent: "#fc7ffc",
    reserve: false,
  },
  lowertown: {
    key: "lowertown-community-centre-and-pool",
    name: "Lowertown",
    sub: "40 Cobourg Street",
    color: "#00f7eb",
    accent: "#00f7eb",
    reserve: false,
  },
  jackpurcell: {
  key: "jack-purcell-community-centre",
  name: "Jack Purcell",
  sub: "320 Jack Purcell Lane",
  color: "#fc7ffc",
  accent: "#fc7ffc",
  reserve: true,
  },
  stlaurent: {
    key: "st-laurent-complex",
    name: "St. Laurent",
    sub: "525 Côté Street",
    color: "#00f7eb",
    accent: "#00f7eb",
    reserve: true,
  },
  champagne: {
  key: "champagne-bath",
  name: "Champagne",
  sub: "321 King Edward Ave",
  color: "#fc7ffc",
  accent: "#fc7ffc",
  reserve: false,
},
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AFTER_WORK_START = "14:30"; // 2:30pm threshold — anything starting at/after this counts

function fmt(t) {
  // "17:00" → "5:00 PM"
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function isAfterWork(startTime) {
  return startTime >= AFTER_WORK_START;
}

function isLaneSwim(name) {
  return name.toLowerCase().includes("lane swim");
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(() => {
    // default to today's day of week
    const d = new Date().getDay(); // 0=sun
    const map = [6, 0, 1, 2, 3, 4, 5]; // Sun=6, Mon=0...
    return map[d];
  });

  useEffect(() => {
   fetch("/.netlify/functions/schedule")
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError("Could not load live data. " + e.message);
        setLoading(false);
      });
  }, []);

  // Build schedule: for each facility, each day, get after-work lane swims
  function buildSchedule(json) {
    const sched = {};
    for (const [id, fac] of Object.entries(FACILITIES)) {
      sched[id] = {};
      for (const day of DAYS) sched[id][day] = [];
    }

    for (const act of json.activity) {
      if (!isLaneSwim(act.name)) continue;
      const facId = Object.entries(FACILITIES).find(([, f]) =>
        act.facilityUrl?.includes(f.key)
      )?.[0];
      if (!facId) continue;
      if (!act.weekday || !DAYS.includes(act.weekday)) continue;
      if (!isAfterWork(act.startTime)) continue;

      sched[facId][act.weekday].push({
        start: act.startTime,
        end: act.endTime,
        reserve: act.reservationRequired,
        name: act.rawActivity || act.name,
      });
    }
    // sort by start time
    for (const id of Object.keys(sched)) {
      for (const day of DAYS) {
        sched[id][day].sort((a, b) => a.start.localeCompare(b.start));
      }
    }
    return sched;
  }

  const sched = data?.activity ? buildSchedule(data) : null;
  const today = DAYS[activeDay];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#ffffff",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#111111",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        padding: "32px 24px 0",
        borderBottom: "1px solid #1e1e2e",
        background: "linear-gradient(180deg, #0f0f1a 0%, #0a0a0f 100%)",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 18
            , letterSpacing: 4, color: "#555", marginBottom: 8, textTransform: "uppercase" }}>
            Ottawa Rec · After-Work
          </div>
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 56px)",
            fontWeight: 700,
            margin: "0 0 4px",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: 1,
            lineHeight: 1.1,
          }}>
            Lane Swim
          </h1>
          <div style={{ fontSize: 16, color: "#ffa1e8", marginBottom: 24, letterSpacing: 1 }}>
            Sessions starting 2:30 pm or later at the these central locations in Ottawa: Plant Bath - 930 Somerset W · Lowertown Pool - 40 Cobourg (Le Patro)· St. Laurent Complex - 525 Côté · Jack Purcell - 320 Jack Purcell · Champagne Bath - 321 King Edward ·          </div>
          {/* Day tabs */}
          <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 0 }}>
            {DAY_SHORT.map((d, i) => {
              const isActive = i === activeDay;
              return (
                <button
                  key={d}
                  onClick={() => setActiveDay(i)}
                  style={{
                    background: isActive ? "#e2e21a" : "transparent",
                    color: isActive ? "#977ddf" : "#977ddf",
                    border: "none",
                    padding: "8px 14px",
                    fontSize: 14,
                    letterSpacing: 2,
                    fontFamily: "inherit",
                    fontWeight: isActive ? 700 : 400,
                    cursor: "pointer",
                    borderRadius: "4px 4px 0 0",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 24px 48px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#2c7f8a", fontSize: 14, letterSpacing: 2 }}>
            LOADING LIVE DATA…
          </div>
        )}
        {error && (
          <div style={{
            background: "#1a0a0a", border: "1px solid #4a1a1a",
            borderRadius: 8, padding: 20, color: "#ff6b6b", fontSize: 13, marginTop: 16
          }}>
            {error}
          </div>
        )}

        {sched && Object.entries(FACILITIES).map(([id, fac]) => {
          const slots = sched[id][today];
          return (
            <div key={id} style={{
              marginBottom: 16,
              background: "#0f0f18",
              border: `1px solid #1e1e2e`,
              borderLeft: `3px solid ${fac.color}`,
              borderRadius: "0 8px 8px 0",
              overflow: "hidden",
            }}>
              {/* Pool header */}
              <div style={{
                padding: "14px 18px 10px",
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                borderBottom: slots.length > 0 ? "1px solid #1a1a28" : "none",
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: fac.color, letterSpacing: -0.5 }}>
                  {fac.name}
                </span>
                <span style={{ fontSize: 12, color: "#57fff7", letterSpacing: 1 }}>
                  {fac.sub}
                </span>
                {fac.reserve && (
                  <a href="https://reservation.frontdesksuite.ca/rcfs/ottawacity" target="_blank" rel="noreferrer" style={{
  marginLeft: "auto",
  fontSize: 12,
  letterSpacing: 1.5,
  color: "#4cc9f0",
  background: "#0a1a24",
  border: "1px solid #1a3a4a",
  padding: "2px 6px",
  borderRadius: 3,
  textTransform: "uppercase",
  textDecoration: "none",
  cursor: "pointer",
}}>
  Reserve
</a>
                )}
              </div>

              {/* Slots */}
              {slots.length === 0 ? (
                <div style={{ padding: "12px 18px", fontSize: 11, color: "#333", letterSpacing: 1 }}>
                  — no after-work lane swim —
                </div>
              ) : (
                <div style={{ padding: "8px 0" }}>
                  {slots.map((s, i) => {
                    const isReduced = s.name?.toLowerCase().includes("reduced");
                    return (
                      <div key={i} style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "7px 18px",
                        gap: 12,
                        borderBottom: i < slots.length - 1 ? "1px solid #13131f" : "none",
                      }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#e8e8e0",
                          minWidth: 90,
                          letterSpacing: -0.3,
                        }}>
                          {fmt(s.start)}
                        </span>
                        <span style={{ fontSize: 14, color: "#16b478" }}>→</span>
                        <span style={{ fontSize: 14, color: "#16b478"  }}>
                          {fmt(s.end)}
                        </span>
                        {isReduced && (
                          <span style={{
                            fontSize: 14,
                            color: "#16b478",
                            letterSpacing: 1,
                            background: "#1a1a1a",
                            padding: "1px 5px",
                            borderRadius: 3,
                            textTransform: "uppercase",
                          }}>
                            Reduced
                          </span>
                        )}
                        {s.reserve && !fac.reserve && (
                          <span style={{
                            marginLeft: "auto",
                            fontSize: 9,
                            color: "#4cc9f0",
                            letterSpacing: 1,
                            textTransform: "uppercase",
                          }}>
                            Reserve
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {sched && (
          <div style={{
            marginTop: 24,
            padding: "12px 16px",
            background: "#0f0f14",
            border: "1px solid #1a1a24",
            borderRadius: 6,
            fontSize: 18,
            color: "#42dada",
            letterSpacing: 0.5,
            lineHeight: 1.8,
          }}>
            <span style={{ color: "#4cc9f0" }}>◆</span> St. Laurent requires reservation via FrontDesk — opens 6 PM, 2 days prior.<br />
            <span style={{ color: "#ff4d6d" }}>◆</span> All other swims are walk-in. <a href="https://www.613today.ca/drop-in/swim" target="_blank" rel="noreferrer" style={{color: "inherit", textDecoration: "underline"}}>Schedules subject to change</a>.<br />
          </div>
        )}
      </div>
    </div>
  );
}
