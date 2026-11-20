/* 1:64 Garage runtime for the public website (Supabase).
   The app talks to window.claude.use("db" | "user" | "downloads" | "sample"), the same calls it makes
   on the Claude-hosted site. This file answers them with Supabase:
   - db: documents in the public.docs table (col + id + JSON data), with live updates.
     Drops, prices and the site settings also load from the static /data files; the database
     overrides them where it has a newer copy.
   - user: Supabase Auth (email link or Google). Admins are listed in public.admins.
   - sample: the AI scanner, through /api/scan (needs ANTHROPIC_API_KEY set in Vercel).
   Needs supabase-js loaded first (see index.html). */
(() => {
  const SUPABASE_URL = "https://bgrteibwyedrxuytifto.supabase.co";
  const SUPABASE_KEY = "sb_publishable_pubSfz5V2kAozok-R4HUzw_oGMTI5ul";   // publishable key: safe in the browser
  const STATIC = {releases: "/data/releases.json", values: "/data/values.json", catalog: "/data/catalog.json", releasePhotos: "/data/site.json"};

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce"}
  });
  window.__sb = sb;
  window.__SITE_MODE = "live";

  const copy = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const split = p => { const s = String(p).split("/").filter(Boolean); return {col: s.slice(0, -1).join("/"), id: s[s.length - 1]} };

  /* ---------- static seed (drops, prices, collector-added cars, site settings) ---------- */
  const J = p => fetch(p, {cache: "no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null);
  const seed = new Map();                               // col -> Map(id -> data)
  const seedReady = (async () => {
    const [rel, val, cat, site] = await Promise.all([J(STATIC.releases), J(STATIC.values), J(STATIC.catalog), J(STATIC.releasePhotos)]);
    const put = (c, id, d) => { if(!seed.has(c)) seed.set(c, new Map()); seed.get(c).set(id, d) };
    (rel || []).forEach(({id, ...d}) => put("releases", id, d));
    Object.entries(val || {}).forEach(([k, v]) => put("values", k, v));
    if(cat) put("catalog", "site", {items: cat});
    if(site) put("releasePhotos", "_site", site);
  })();

  /* ---------- cache + listeners ---------- */
  const cache = new Map();          // col -> Map(id -> data), rows from Supabase
  const loaded = new Map();         // col -> Promise (first full load)
  const colSubs = new Map();        // col -> Set(callback)
  const docSubs = new Map();        // "col/id" -> Set(callback)
  const channels = new Map();       // col -> realtime channel

  const merged = col => {
    const out = new Map(seed.get(col) || []);
    for(const [id, d] of (cache.get(col) || [])) out.set(id, d);
    return out;
  };
  const snap = (col, id) => {
    const m = merged(col), has = m.has(id);
    return {id, exists: has, data: () => copy(m.get(id)), ref: docRef(col + "/" + id)};
  };
  function notify(col, id){
    const cs = colSubs.get(col);
    if(cs && cs.size){ const s = colSnap(col); cs.forEach(cb => { try{ cb(s) }catch(e){ console.error(e) } }) }
    const ds = docSubs.get(col + "/" + id);
    if(ds && ds.size){ const s = snap(col, id); ds.forEach(cb => { try{ cb(s) }catch(e){ console.error(e) } }) }
  }
  const colSnap = (col, opts = {}) => {
    let docs = [...merged(col).keys()].map(id => snap(col, id));
    if(opts.order){ const {f, dir} = opts.order; docs.sort((a, b) => { const x = (a.data() || {})[f], y = (b.data() || {})[f]; return (x > y ? 1 : x < y ? -1 : 0) * dir }) }
    if(opts.lim) docs = docs.slice(0, opts.lim);
    return {docs, size: docs.length, empty: !docs.length, metadata: {fromCache: false}, forEach: fn => docs.forEach(fn)};
  };

  async function loadCol(col){
    if(loaded.has(col)) return loaded.get(col);
    const p = (async () => {
      await seedReady;
      const rows = new Map(), PAGE = 1000;
      for(let from = 0; ; from += PAGE){
        const {data, error} = await sb.from("docs").select("id,data").eq("col", col).range(from, from + PAGE - 1);
        if(error) throw error;
        (data || []).forEach(r => rows.set(r.id, r.data));
        if(!data || data.length < PAGE) break;
      }
      cache.set(col, rows);
      listen(col);
    })();
    loaded.set(col, p);
    p.catch(() => loaded.delete(col));
    return p;
  }

  function listen(col){
    if(channels.has(col)) return;
    const ch = sb.channel("docs:" + col + ":" + Math.random().toString(36).slice(2, 7))
      .on("postgres_changes", {event: "*", schema: "public", table: "docs", filter: "col=eq." + col}, ev => {
        const row = ev.new && ev.new.id ? ev.new : ev.old;
        if(!row || !row.id) return;
        if(!cache.has(col)) cache.set(col, new Map());
        if(ev.eventType === "DELETE") cache.get(col).delete(row.id);
        else cache.get(col).set(row.id, row.data);
        notify(col, row.id);
      })
      .subscribe();
    channels.set(col, ch);
  }

  /* ---------- writes ---------- */
  const err = (e) => { const x = new Error(e?.message || "Couldn't save"); x.code = /row-level security|permission|42501/i.test(e?.message || e?.code || "") ? "permission-denied" : (e?.code || "unknown"); return x };
  async function writeDoc(col, id, data){
    const {error} = await sb.from("docs").upsert({col, id, data}, {onConflict: "col,id"});
    if(error) throw err(error);
    if(!cache.has(col)) cache.set(col, new Map());
    cache.get(col).set(id, copy(data));
    notify(col, id);
  }
  function setPath(obj, path, val){
    const ks = path.split("."); let o = obj;
    for(let i = 0; i < ks.length - 1; i++){ if(typeof o[ks[i]] !== "object" || o[ks[i]] === null) o[ks[i]] = {}; o = o[ks[i]] }
    if(val === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = val;
  }
  async function currentRow(col, id){
    const {data, error} = await sb.from("docs").select("data").eq("col", col).eq("id", id).maybeSingle();
    if(error) throw err(error);
    return data ? data.data : (seed.get(col)?.get(id));
  }

  /* ---------- Firestore-style references (what the app expects) ---------- */
  function docRef(path){
    const {col, id} = split(path);
    return {
      id, path: col + "/" + id,
      async get(){ await seedReady; const d = await currentRow(col, id); if(!cache.has(col)) cache.set(col, new Map());
        if(d !== undefined && d !== null) cache.get(col).set(id, d); else cache.get(col).delete(id);
        return snap(col, id) },
      async set(data, opts){ const base = opts?.merge ? (await currentRow(col, id)) || {} : {}; return writeDoc(col, id, {...base, ...copy(data)}) },
      async update(fields){ const cur = await currentRow(col, id); if(cur === undefined || cur === null){ const e = new Error("No document to update"); e.code = "not-found"; throw e }
        const next = copy(cur); Object.entries(fields || {}).forEach(([k, v]) => setPath(next, k, copy(v))); return writeDoc(col, id, next) },
      async delete(){ const {error} = await sb.from("docs").delete().eq("col", col).eq("id", id); if(error) throw err(error);
        cache.get(col)?.delete(id); notify(col, id) },
      onSnapshot(cb, onErr){
        const k = col + "/" + id; if(!docSubs.has(k)) docSubs.set(k, new Set()); docSubs.get(k).add(cb);
        this.get().then(s => { cb(s); listen(col) }).catch(e => onErr && onErr(err(e)));
        return () => docSubs.get(k)?.delete(cb);
      },
      collection: c => colRef(col + "/" + id + "/" + c)
    };
  }
  function colRef(col, opts = {}){
    return {
      id: col.split("/").pop(), path: col,
      doc: id => docRef(col + "/" + (id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)))),
      orderBy(f, dir){ return colRef(col, {...opts, order: {f, dir: dir === "desc" ? -1 : 1}}) },
      limit(n){ return colRef(col, {...opts, lim: n}) },
      where(){ return colRef(col, opts) },
      async get(){ await loadCol(col); return colSnap(col, opts) },
      onSnapshot(cb, onErr){
        const wrapped = s => cb(opts.order || opts.lim ? colSnap(col, opts) : s);
        if(!colSubs.has(col)) colSubs.set(col, new Set()); colSubs.get(col).add(wrapped);
        loadCol(col).then(() => wrapped(colSnap(col, opts))).catch(e => {
          // a collection this visitor can't read, or the database is unreachable: still show the static copy
          if(seed.has(col)) wrapped(colSnap(col, opts)); if(onErr) onErr(err(e));
        });
        return () => colSubs.get(col)?.delete(wrapped);
      }
    };
  }
  const db = {collection: c => colRef(c), doc: p => docRef(p)};

  /* ---------- accounts ---------- */
  const AVATAR = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#dfe5ec"/><circle cx="20" cy="16" r="7" fill="#9aa8b8"/><path d="M7 35c2-8 8-11 13-11s11 3 13 11" fill="#9aa8b8"/></svg>');
  async function session(){ const {data} = await sb.auth.getSession(); return data.session }
  const user = {
    async me(){
      const s = await session(); if(!s) return {id: null};
      const u = s.user, md = u.user_metadata || {};
      if(md.username) window.__signupName = md.username;
      const {data: adm} = await sb.from("admins").select("user_id").eq("user_id", u.id).maybeSingle();
      const isAdmin = !!adm;
      return {id: u.id, name: md.full_name || md.name || "", avatarUrl: md.avatar_url || md.picture || AVATAR, canEdit: isAdmin, isOwner: isAdmin};
    },
    async can(){ return !!(await session()) },
    async profiles(ids){
      // every id gets an answer (the app asks again for any it doesn't get); names come from profiles
      const s = await session(); const out = {};
      (ids || []).forEach(id => { out[id] = {name: "", avatarUrl: AVATAR} });
      if(s && ids.includes(s.user.id)){ const md = s.user.user_metadata || {}; out[s.user.id] = {name: md.full_name || md.name || "", avatarUrl: md.avatar_url || md.picture || AVATAR} }
      return out;
    }
  };
  // reload once when someone logs in or out in this tab or another one
  let lastUid;
  sb.auth.onAuthStateChange((ev, s) => {
    if(ev === "PASSWORD_RECOVERY") try{ sessionStorage.setItem("setpw", "1") }catch(e){}
    const id = s?.user?.id || null;
    if(lastUid === undefined){ lastUid = id; return }
    if(id !== lastUid){ lastUid = id; location.reload() }
  });
  const authErr = (code, msg) => Object.assign(new Error(msg || code), {code});
  window.__auth = {
    // username (or email) + password
    async logIn(who, pass){
      const {data: email, error} = await sb.rpc("login_email", {who, pass});
      if(error) throw authErr(/too_many/.test(error.message) ? "too_many" : "failed");
      if(!email) throw authErr("wrong");
      const {error: e2} = await sb.auth.signInWithPassword({email, password: pass});
      if(e2) throw authErr(/confirm/i.test(e2.message) ? "unconfirmed" : /rate|too many/i.test(e2.message) ? "too_many" : "wrong");
    },
    async usernameFree(u){ const {data} = await sb.rpc("username_free", {u}); return data !== false },
    async signUp(email, pass, username){
      const {data, error} = await sb.auth.signUp({email, password: pass, options: {emailRedirectTo: location.origin + "/", data: {username}}});
      if(error) throw authErr(/registered|exists/i.test(error.message) ? "exists" : /password/i.test(error.message) ? "weak" : /rate|seconds/i.test(error.message) ? "too_many" : "failed", error.message);
      return {needsConfirm: !data.session};
    },
    async setPassword(p){ const {error} = await sb.auth.updateUser({password: p}); if(error) throw authErr(/different|same/i.test(error.message) ? "same" : "failed", error.message) },
    async resetPassword(email){ const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin + "/"}); if(error) throw authErr(/rate|seconds/i.test(error.message) ? "too_many" : "failed") },
    async emailLink(email){
      const {error} = await sb.auth.signInWithOtp({email, options: {emailRedirectTo: location.origin + "/"}});
      if(error) throw error;
    },
    async google(){
      const {error} = await sb.auth.signInWithOAuth({provider: "google", options: {redirectTo: location.origin + "/"}});
      if(error) throw error;
    },
    async signOut(){ await sb.auth.signOut(); location.reload() }
  };

  /* ---------- AI scanner ---------- */
  const blobToDataUrl = b => typeof b === "string" ? Promise.resolve(b) : new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b) });
  const scanInfo = fetch("/api/scan", {cache: "no-store"}).then(r => r.ok ? r.json() : null).catch(() => null);
  const sample = {
    async limits(){ const i = await scanInfo; return {images: i?.maxImages || 8} },
    async json(prompt, opts = {}){
      const s = await session(); if(!s){ const e = new Error("Log in to scan"); e.code = "permission-denied"; throw e }
      const images = await Promise.all((opts.images || []).map(blobToDataUrl));
      const r = await fetch("/api/scan", {method: "POST", signal: opts.signal,
        headers: {"content-type": "application/json", authorization: "Bearer " + s.access_token},
        body: JSON.stringify({prompt, images, tier: opts.modelTier || "default"})});
      const out = await r.json().catch(() => ({}));
      if(!r.ok){ const e = new Error(out.error || "The scanner couldn't read that"); e.code = r.status === 429 ? "rate-limited" : "scan-failed"; throw e }
      return out.result;
    }
  };

  const downloads = { save: async ({filename, data}) => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data])); a.download = filename || "download"; document.body.appendChild(a); a.click(); a.remove() } };

  window.claude = { use: async n => {
    if(n === "sample") return (await scanInfo)?.enabled ? sample : null;
    return ({db, user, downloads})[n] || null;
  } };
})();
