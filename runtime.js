/* 1:64 Garage runtime for the public website.
   The app talks to window.claude.use("db" | "user" | "downloads"). On the public site this
   preview runtime serves the release database, prices and collector-added cars from /data
   (read-only). Accounts and saving arrive with the Supabase runtime. */
(() => {
  const J = p => fetch(p, {cache: "no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null);
  const store = new Map();
  const ready = (async () => {
    const [rel, val, cat, site] = await Promise.all([J("/data/releases.json"), J("/data/values.json"), J("/data/catalog.json"), J("/data/site.json")]);
    if(site) store.set("releasePhotos/_site", site);
    (rel || []).forEach(({id, ...d}) => store.set("releases/" + id, d));
    Object.entries(val || {}).forEach(([k, v]) => store.set("values/" + k, v));
    store.set("catalog/site", {items: cat || []});
  })();
  const copy = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const snap = p => ({id: p.split("/").pop(), exists: store.has(p), data: () => copy(store.get(p))});
  const denied = () => Promise.reject(Object.assign(new Error("Accounts open soon"), {code: "permission-denied"}));
  function docRef(p){
    return { id: p.split("/").pop(), path: p,
      get: async () => { await ready; return snap(p) },
      set: denied, update: denied, delete: denied,
      onSnapshot: (cb) => { ready.then(() => cb(snap(p))); return () => {} },
      collection: c => colRef(p + "/" + c) };
  }
  function colRef(c){
    const depth = c.split("/").length + 1;
    const docs = () => [...store.keys()].filter(k => k.startsWith(c + "/") && k.split("/").length === depth).map(snap);
    return { doc: id => docRef(c + "/" + (id || Math.random().toString(36).slice(2))),
      orderBy(){ return this }, where(){ return this }, limit(){ return this },
      onSnapshot: (cb) => { ready.then(() => cb({docs: docs(), metadata: {fromCache: false}})); return () => {} },
      get: async () => { await ready; return {docs: docs()} } };
  }
  const db = {collection: colRef, doc: docRef};
  const user = { me: async () => ({id: null}), can: async () => false, profiles: async () => ({}) };
  const downloads = { save: async ({filename, data}) => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data])); a.download = filename || "download"; document.body.appendChild(a); a.click(); a.remove() } };
  window.__SITE_MODE = "preview";
  window.claude = { use: async n => ({db, user, downloads})[n] || null };
})();
