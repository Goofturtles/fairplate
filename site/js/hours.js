/* "Open now" from OpenStreetMap opening_hours. Reads the common forms ("Mo-Fr 11:00-22:00; Sa-Su 12:00-02:00", "24/7",
   "11:00-23:00", "Su off", several ranges a day, overnight). Anything it can't read fully (holidays, months, week numbers)
   returns null, so the site shows nothing rather than a wrong answer. */
window.FP = window.FP || {};
(function () {
  const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const mins = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t); return m ? +m[1] * 60 + +m[2] : NaN; };
  function days(spec) {   // "Mo-Fr,Su" -> [0,1,2,3,4,6]
    const out = new Set();
    for (const part of spec.split(",")) {
      const [a, b] = part.split("-"), i = DAYS.indexOf(a), j = b ? DAYS.indexOf(b) : i;
      if (i < 0 || j < 0) return null;
      for (let k = i; ; k = (k + 1) % 7) { out.add(k); if (k === j) break; }
    }
    return [...out];
  }
  const cache = new Map();
  function parse(oh) {
    if (cache.has(oh)) return cache.get(oh);
    let week = null;
    const s = (oh || "").trim();
    if (s === "24/7") week = Array.from({ length: 7 }, () => [[0, 1440]]);
    else if (s) {
      week = Array.from({ length: 7 }, () => []);
      for (let rule of s.split(";")) {
        rule = rule.trim(); if (!rule || /^(PH|SH)\b/.test(rule)) continue;   // public/school holiday rules: ignored (we do not know the holiday calendar)
        const m = /^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*)?\s*(.*)$/.exec(rule);
        const ds = m[1] ? days(m[1]) : [0, 1, 2, 3, 4, 5, 6], body = m[2].trim();
        if (!ds) { week = null; break; }
        let ranges;
        if (/^(off|closed)$/i.test(body)) ranges = [];
        else {
          ranges = body.split(",").map((r) => r.trim().split("-").map(mins));
          if (!ranges.length || ranges.some((r) => r.length !== 2 || r.some(isNaN))) { week = null; break; }
          ranges = ranges.map(([a, b]) => [a, b <= a ? b + 1440 : b]);   // 22:00-02:00 runs past midnight
        }
        ds.forEach((d) => (week[d] = ranges));   // a later rule replaces earlier ones for its days
      }
    }
    cache.set(oh, week);
    return week;
  }
  const clock = (m) => { m %= 1440; const h = Math.floor(m / 60), mm = m % 60, h12 = h % 12 || 12; return `${h12}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`; };
  /* { open, label } for now, or null when the hours are missing or not readable */
  function status(oh, now = new Date()) {
    const week = parse(oh); if (!week) return null;
    if (week.every((d) => d.length === 1 && d[0][0] === 0 && d[0][1] === 1440)) return { open: true, label: "Open 24 hours" };
    const d = (now.getDay() + 6) % 7, m = now.getHours() * 60 + now.getMinutes(), prev = week[(d + 6) % 7];
    for (const [a, b] of week[d]) if (m >= a && m < b) return { open: true, label: `Open · closes ${clock(b)}` };
    for (const [a, b] of prev) if (b > 1440 && m < b - 1440) return { open: true, label: `Open · closes ${clock(b)}` };
    for (let k = 0; k < 7; k++) {
      const dd = (d + k) % 7, next = week[dd].map((r) => r[0]).filter((a) => k > 0 || a > m).sort((x, y) => x - y)[0];
      if (next != null) return { open: false, label: `Closed · opens ${k === 0 ? "" : k === 1 ? "tomorrow " : NAMES[dd] + " "}${clock(next)}` };
    }
    return { open: false, label: "Closed" };
  }
  FP.hours = { status, parse };
})();
