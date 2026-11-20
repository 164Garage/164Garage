/* ---------- hunting map: a scrollable map of stores near a ZIP code, city or address ----------
   Map lines and store lists ship as the artifact's own files (map/*.json), loaded when the map opens.
   Store locations: OpenStreetMap contributors (ODbL) and public store-locator data; ZIP centers: US Census. */
const HM_CAT = {wm:{n:"Walmart", c:"#0071ce"}, tg:{n:"Target", c:"#cc0000"}, groc:{n:"Grocery", c:"#0d8a8f"}, disc:{n:"Dollar & discount", c:"#6a4fc4"}, rx:{n:"Pharmacy", c:"#b0407e"}, more:{n:"More stores", c:"#4d6b8a"}, big:{n:"Big stores", c:"#35589a"}, toy:{n:"Toy stores", c:"#76a713"}};
const HM_OTHER = {n:"Other store", c:"#5a6472"};
const HM_CHAIN = {custom:["other","none"], walmart:["wm","big"], target:["tg","big"], meijer:["groc","big"], fb:["disc","big"], kroger:["groc","grocery"], albertsons:["groc","grocery"], heb:["groc","grocery"], hyvee:["groc","grocery"], gianteagle:["groc","grocery"], dg:["disc","dollar"], dt:["disc","dollar"], fd:["disc","dollar"], cvs:["rx","pharmacy"], wg:["rx","pharmacy"],
  sev:["more","more"], az:["more","more"], tjx:["more","more"], mar:["more","more"], ross:["more","more"], bur:["more","more"], bl:["more","more"], ol:["more","more"],
  /* stores outside the US (one file per country: map/hm-x-XX.json) */
  alcampo:["groc","x"], argos:["big","x"], asda:["groc","x"], auchan:["groc","x"], aurrera:["big","x"], bm:["disc","x"], carrefour:["groc","x"], checkers:["groc","x"], chedraui:["groc","x"], costco:["big","x"], coto:["groc","x"], ctire:["big","x"], dmart:["groc","x"], dunnes:["groc","x"], eci:["big","x"], ent:["toy","x"], exito:["big","x"], falabella:["big","x"], fcw:["toy","x"], galeria:["big","x"], gameza:["big","x"], gtiger:["disc","x"], hamleys:["toy","x"], hbarg:["disc","x"], interspar:["groc","x"], joueclub:["toy","x"], juguetron:["toy","x"], juguettos:["toy","x"], jumbo:["groc","x"], kaufland:["groc","x"], kingjouet:["toy","x"], kmartau:["big","x"], ldrugs:["rx","x"], leclerc:["groc","x"], lider:["groc","x"], liverpool:["big","x"], makro:["big","x"], manor:["big","x"], maxi:["groc","x"], morr:["groc","x"], mueller:["rx","x"], paknsave:["groc","x"], plazavea:["groc","x"], pnp:["groc","x"], range:["big","x"], rcss:["groc","x"], recre:["toy","x"], ripley:["big","x"], sains:["groc","x"], sanborns:["more","x"], sdm:["rx","x"], smdept:["big","x"], smhyper:["groc","x"], smyths:["toy","x"], soriana:["groc","x"], tesco:["groc","x"], tkmaxx:["more","x"], tottus:["groc","x"], toy:["toy","x"], toykingdom:["toy","x"], toyworld:["toy","x"], tru:["toy","x"], twh:["big","x"], winners:["more","x"], woolies:["groc","x"], targetau:["big","x"]};
/* countries with a store list, and how many stores each has (OpenStreetMap contributors, ODbL) */
const HM_INTL = {"AR":203,"AT":144,"AU":4,"BO":5,"CA":929,"CH":132,"CL":221,"CO":67,"CR":25,"CU":1,"DE":1824,"DO":11,"EC":7,"ES":321,"FR":962,"GA":7,"GB":4095,"GH":1,"GM":1,"GT":7,"HN":5,"IE":230,"IN":72,"KE":6,"MC":2,"MX":308,"NI":2,"NZ":79,"PA":1,"PE":81,"PH":991,"PK":49,"PR":18,"PY":6,"SN":3,"SV":5,"UY":1,"VE":9,"ZA":551};
const HM_FILES0 = 0, HM_FILES = {wm:["big"], tg:["big"], groc:["big","grocery"], disc:["big","dollar"], rx:["pharmacy"], more:["more"], big:[], toy:[]};
/* where the cars usually are, by chain (collector reports; every store is set up a little differently) */
const HM_TIPS = {
  walmart: ["Toy department: the die-cast aisle, with long peg walls of Hot Wheels and Matchbox.", "Cardboard dump bins and side displays in the wide main aisle. Fresh cases often land there first.", "Checkout-lane racks. Most stores restock overnight, so early morning is best."],
  walmart_nm: ["Neighborhood Markets have a small toy section: usually one short peg strip near seasonal or party supplies.", "Check the endcaps and the checkout lanes."],
  target: ["Toy department, in the vehicles aisle near the action figures. The pegs are usually tidy and quick to scan.", "Promo endcaps, where Target exclusives like Red Edition and new premium sets show up."],
  meijer: ["Toy department pegs, plus endcaps along the main aisle.", "Checkout lanes often have a rack of singles."],
  fredmeyer: ["Fred Meyer has a full toy department. Start at the die-cast pegs.", "Check the seasonal aisle and checkout lanes too."],
  grocery: ["A small toy section in general merchandise, often beside seasonal, greeting cards or party supplies.", "End-of-aisle trays and checkout lanes. Grocery stores get skipped by most hunters, so cars sit longer."],
  dg: ["One short toy aisle with a few peg hooks. Slide every car forward.", "Deliveries are uneven: nothing for weeks, then a fresh case. Ask which day the truck comes."],
  dt: ["Toy aisle pegs, mixed in with Matchbox.", "Ask which day the toy aisle gets restocked. Fresh cases go fast."],
  fd: ["A small peg rack in the toy aisle.", "Few collectors check here, so older cases can still be hanging."],
  fb: ["The toy wall. Stock changes a lot from store to store.", "Look for multi-packs and premium sets as well as singles."],
  sev: ["The register area and the small toy or gift shelf. Hot Wheels are usually a few singles on a clip strip or counter display.", "7-Eleven gets its own Hot Wheels exclusive in the summer. Ask at the counter when it's due."],
  az: ["By the registers. AutoZone keeps a small Hot Wheels display at the checkout.", "Often older cases sit here, since few collectors stop in."],
  offprice: ["The toy aisle, usually near the back. Look for premium sets, multi-packs and leftover cases at a discount.", "Stock is random and changes fast. Leftover premium cases have turned up here before."],
  closeout: ["The toy aisle and any clearance endcaps. Closeout stores get leftover and older stock.", "Check the bins. Older Treasure Hunts sometimes slip through with the closeout stock."],
  rx: ["A small toy or seasonal aisle. Some stores put a tray or a small shipper box at the end of the aisle.", "Check by the registers. Pharmacies are rarely picked over."]
};
/* store exclusives: what only this chain gets (collector reports; check each year's lineup) */
const HM_EXCL = {
  walmart: "Walmart exclusives: the unpainted ZAMAC editions in mainline cases, and the Silver Series cases that only Walmart gets in the US.",
  target: "Target exclusive: Red Edition cars, a dozen a year in sets of three. Target also sells collector brands like Tarmac Works and Greenlight online and in some stores.",
  kroger: "Kroger exclusive colors on some mainlines, also at Kroger-owned stores like Fry's, Ralphs and King Soopers.",
  dg: "Dollar General exclusive colors, plus Collector Edition mail-in deals some years.",
  dt: "Dollar Tree and Family Dollar share some exclusive colors and Collector Edition promos.",
  fd: "Family Dollar and Dollar Tree share some exclusive colors and Collector Edition promos.",
  wg: "Walgreens usually gets one exclusive mainline a year.",
  sev: "7-Eleven exclusive: a special car each summer, like the 2025 Silver Series Toyota Supra and the 2026 Nissan GT-R. Also at Speedway and Stripes."
};
Object.assign(HM_TIPS, {
  toyshop: ["Toy stores keep Hot Wheels in the vehicle aisle, near Matchbox and the track sets.", "Specialist shops sometimes keep premium cars behind the counter, so ask.", "Ask which day new cases come in."],
  bigintl: ["Head to the toy department and look for the vehicle aisle or a peg wall of Hot Wheels.", "Check endcaps, seasonal aisles and checkout lanes for dump bins.", "Mornings after a restock are best."],
  hyper: ["Big hypermarkets and superstores have a toy aisle. Small city or express formats usually don't carry Hot Wheels.", "Check the toy aisle first, then the checkout lanes and seasonal displays."],
  discintl: ["Look in the toy aisle and the seasonal aisle. Discount stores get mixed cases, so stock changes week to week."],
  rxintl: ["Check the toy aisle near the seasonal goods, and the racks by the checkout."],
  argos: ["Argos keeps stock behind the counter. Check the app or catalogue for Hot Wheels in stock, then collect at the till.", "Multipacks and track sets are more common there than single cars."],
  mueller: ["Müller has a full toy floor, often upstairs. Hot Wheels hang with the vehicles, near Matchbox."],
  smyths: ["Smyths has a big Hot Wheels section in the vehicle aisle, with singles, 5-packs and track sets.", "Premium and collector lines are often on a separate shelf nearby. Ask staff about new deliveries."],
  ctire: ["Canadian Tire keeps Hot Wheels in the toy aisle and often on racks near the checkouts.", "Check the seasonal aisle around the holidays."]
});
const HM_GENERAL = ["Slide cars forward. Treasure Hunts often hide at the back of a peg.", "Check endcaps, dump bins and checkout lanes, not just the toy aisle.", "Go early, and politely ask which day the toy aisle gets restocked.", "Leave the pegs tidy. Stores treat collectors better when we do."];
const hmExclKey = s => s.ch==="kroger" ? "kroger" : s.ch;
const hmTipKey = s => HM_CHAIN[s.ch] && HM_CHAIN[s.ch][1]==="x" && !HM_TIPS[s.ch] ? ({toy:"toyshop", big:"bigintl", groc:"hyper", disc:"discintl", rx:"rxintl", more:["tkmaxx","winners"].includes(s.ch) ? "offprice" : "bigintl"})[HM_CHAIN[s.ch][0]] : s.ch==="walmart" ? (/neighborhood/i.test(s.nm) ? "walmart_nm" : "walmart") : s.ch==="kroger" && /fred meyer/i.test(s.nm) ? "fredmeyer" : ["kroger","albertsons","heb","hyvee","gianteagle"].includes(s.ch) ? "grocery" : s.ch==="cvs"||s.ch==="wg" ? "rx" : ["tjx","mar","ross","bur"].includes(s.ch) ? "offprice" : ["bl","ol"].includes(s.ch) ? "closeout" : s.ch;
const hmChainOfName = n => /wal-?mart/i.test(n) ? {ch:"walmart", nm:n} : /target/i.test(n) ? {ch:"target", nm:n} : /meijer/i.test(n) ? {ch:"meijer", nm:n} : /fred meyer/i.test(n) ? {ch:"kroger", nm:"Fred Meyer"} : /kroger|ralphs|king soopers|fry'?s|smith'?s|harris teeter|safeway|albertsons|vons|jewel|h-?e-?b|hy-?vee|giant eagle|publix|food lion/i.test(n) ? {ch:"kroger", nm:n} : /dollar general/i.test(n) ? {ch:"dg"} : /dollar tree/i.test(n) ? {ch:"dt"} : /family dollar/i.test(n) ? {ch:"fd"} : /five below/i.test(n) ? {ch:"fb"} : /cvs|walgreens/i.test(n) ? {ch:"cvs"} : null;

const HM = {node:null, cv:null, ctx:null, w:0, h:0, dpr:1, cx:0, cy:0, z:3, base:null, files:{}, loading:{}, stores:[], zips:null, zipsP:null,
  on:{wm:true, tg:true, groc:true, disc:false, rx:false, more:false, big:true, toy:true}, country:"US", world:null, placing:false, draft:null, origin:null, radius:10, res:null, sel:null, hover:null, msg:"", q:"", pins:[], started:false, err:"", raf:0, autoDone:false};
const hmMx = lon => (lon+180)/360, hmMy = lat => { const s = Math.sin(Math.max(-85,Math.min(85,lat))*Math.PI/180); return .5 - Math.log((1+s)/(1-s))/(4*Math.PI) };
const hmMiles = (a, b) => { const r = Math.PI/180, dLa = (b.lat-a.lat)*r, dLo = (b.lng-a.lng)*r, h = Math.sin(dLa/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLo/2)**2; return 7917.6*Math.asin(Math.sqrt(h)) };
const hmFmtMi = m => m < .1 ? "here" : (m < 10 ? m.toFixed(1) : Math.round(m)) + " mi";
const hmDir = s => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([s.nm, s.st, s.city, s.s, s.zip].filter(Boolean).join(", "))}`;
const hmAddr = s => [s.st, [s.city, [s.s, s.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(", ");
const hmFile = name => fetch("map/" + name + ".json").then(r => { if(!r.ok) throw new Error(r.status); return r.json() });

function hmFitUS(){ const S = Math.min(HM.w/(hmMx(-66)-hmMx(-125)), HM.h/(hmMy(24)-hmMy(50))) * .96;
  HM.z = Math.log2(S/256); HM.cx = (hmMx(-125)+hmMx(-66))/2; HM.cy = (hmMy(24)+hmMy(50))/2 }
function hmFitMiles(lat, lng, mi){ const r = mi*1609.34/(40075016.7*Math.cos(lat*Math.PI/180)), S = .42*Math.min(HM.w, HM.h)/r;
  HM.z = Math.max(3, Math.min(17, Math.log2(S/256))); HM.cx = hmMx(lng); HM.cy = hmMy(lat) }
function hmFitList(list){ if(!list.length) return; if(list.length===1) return hmFitMiles(list[0].lat, list[0].lng, 1.5);
  const xs = list.map(s=>s.x), ys = list.map(s=>s.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const S = Math.min(HM.w/Math.max(x1-x0, 1e-6), HM.h/Math.max(y1-y0, 1e-6))*.8; HM.z = Math.max(3, Math.min(15, Math.log2(S/256))); HM.cx = (x0+x1)/2; HM.cy = (y0+y1)/2 }

/* decode delta-packed lon/lat lines into mercator coordinates with a bounding box for culling */
function hmLines(arr, sc){ return arr.map(a => { const n = a.length/2, p = new Float32Array(a.length); let lo = 0, la = 0, x0 = 9, y0 = 9, x1 = -9, y1 = -9;
  for(let i = 0; i < n; i++){ lo = i ? lo + a[2*i] : a[0]; la = i ? la + a[2*i+1] : a[1]; const x = hmMx(lo/sc), y = hmMy(la/sc); p[2*i] = x; p[2*i+1] = y;
    if(x<x0) x0=x; if(x>x1) x1=x; if(y<y0) y0=y; if(y>y1) y1=y }
  return {p, b:[x0,y0,x1,y1]} }) }
async function hmLoadBase(){ if(HM.base || HM.loading.base) return HM.loading.base; HM.loading.base = hmFile("hm-base").then(d => {
  HM.base = {land:hmLines(d.land,100), nation:hmLines(d.nation,1000), states:hmLines(d.states,1000), urban:hmLines(d.urban,1000), hwy:hmLines(d.hwy,1000), road:hmLines(d.road,1000)};
  HM.cities = CITIES.map(([n,st,la,lo]) => ({n, x:hmMx(lo), y:hmMy(la)})); hmPaint() }); return HM.loading.base }
async function hmLoadFile(f){ if(HM.files[f]) return; if(HM.loading[f]) return HM.loading[f];
  HM.loading[f] = hmFile("hm-" + f).then(d => { const names = d.names, cc = d.cc || "US"; let i = HM.stores.length;
    for(const line of d.rows.split("\n")){ if(!line) continue; const [ni, la, lo, st, city, s, zip] = line.split("|"), [ch, nm, c3] = names[+ni], lat = la/1e4, lng = lo/1e4;
      HM.stores.push({id:i++, ch, nm, cat:c3 || (HM_CHAIN[ch]||HM_CHAIN.custom)[0], lat, lng, x:hmMx(lng), y:hmMy(lat), st, city, s, zip, cc}) }
    HM.files[f] = true; hmPaint() }).finally(() => { delete HM.loading[f] }); return HM.loading[f] }
const hmNeedFiles = () => [...new Set([...Object.keys(HM.on).filter(k=>HM.on[k]).flatMap(k=>HM_FILES[k]||[]), ...(HM.country!=="US" && HM_INTL[HM.country] ? ["x-" + HM.country] : [])])];
/* the store categories that exist in a country (US: the US chains; elsewhere: what that country's list holds) */
const hmCatsHere = () => HM.country==="US" ? ["wm","tg","groc","disc","rx","more"] : Object.keys(HM_CAT).filter(k => HM.stores.some(s => s.cc===HM.country && s.cat===k));
/* world outlines and ~7,300 world cities, so the map works in any country */
async function hmLoadWorld(){ if(HM.world || HM.loading.world) return HM.loading.world; HM.loading.world = hmFile("hm-world").then(d => {
  const countries = d.countries.map(c => ({n:c.n, a:c.a, b:c.b, lines:hmLines(c.p, 100)})).filter(c=>c.a && c.a.length===2);
  const cities = d.rows ? [] : d.cities.split("\n").map(l => { const [n, a, la, lo, pop] = l.split("|"); const lat = la/100, lng = lo/100; return {n, a, lat, lng, pop:+pop, x:hmMx(lng), y:hmMy(lat)} }).sort((a,b)=>b.pop-a.pop);
  HM.world = {countries, cities}; hmCountrySelect(); hmPaint() }).finally(() => { delete HM.loading.world }); return HM.loading.world }
const hmCountry = a => HM.world && HM.world.countries.find(c=>c.a===a);
const hmCountryName = a => (hmCountry(a)||{}).n || (a==="US" ? "United States" : a);
function hmCountrySelect(){ const s = HM.node && HM.node.querySelector("#hm-c"); if(!s || !HM.world) return;
  const list = [...HM.world.countries].sort((a,b)=>a.n.localeCompare(b.n)).filter((c,i,arr)=>arr.findIndex(x=>x.a===c.a)===i);
  s.innerHTML = [`<option value="US">United States</option>`, ...list.filter(c=>c.a!=="US").map(c=>`<option value="${esc(c.a)}">${esc(c.n)}</option>`)].join(""); s.value = HM.country }
function hmFitCountry(a){ if(a==="US") return hmFitUS(); const c = hmCountry(a); if(!c) return; const [x0,y0,x1,y1] = c.b;
  const S = Math.min(HM.w/Math.max(hmMx(x1)-hmMx(x0), 1e-4), HM.h/Math.max(hmMy(y0)-hmMy(y1), 1e-4))*.9; HM.z = Math.max(3, Math.min(12, Math.log2(S/256))); HM.cx = (hmMx(x0)+hmMx(x1))/2; HM.cy = (hmMy(y0)+hmMy(y1))/2 }
function hmSetCountry(a, quiet){ HM.country = a || "US"; { const c = HM.node && HM.node.querySelector("#hm-c"); if(c && c.value!==HM.country) c.value = HM.country } HM.res = null; HM.origin = null; HM.sel = null; HM.msg = ""; HM.q = "";
  const q = HM.node && HM.node.querySelector("#hm-q"); if(q){ q.value = ""; q.placeholder = HM.country==="US" ? "ZIP code, city or store" : HM_INTL[HM.country] ? "City, postcode or store" : "City or saved store" }
  hmFitCountry(HM.country); hmChips(); hmSide(); hmPaint(); if(HM_INTL[HM.country]) hmLoadOn();
  if(!quiet && typeof col!=="undefined" && col && hasAccount() && prefs.huntCountry !== HM.country){ prefs = {...prefs, huntCountry:HM.country}; col.doc("_prefs").set(prefs).catch(()=>{}) } }
const hmFold = s => String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g,"").trim();
function hmWorldCity(q, a){ if(!HM.world) return null; const f = hmFold(q.replace(/,.*$/,"")); if(!f) return null;
  const inC = HM.world.cities.filter(c => !a || c.a===a);
  return inC.find(c => hmFold(c.n)===f) || inC.find(c => hmFold(c.n).startsWith(f)) || null }
function hmNearCity(lat, lng){ if(!HM.world) return ""; let best = null, bd = 1e9; for(const c of HM.world.cities){ const d = Math.abs(c.lat-lat) + Math.abs(c.lng-lng); if(d < bd){ bd = d; best = c } }
  return best && bd < 1.2 ? `Near ${best.n}, ${hmCountryName(best.a)}` : "" }
async function hmLoadOn(){ HM.err = ""; try{ await Promise.all([hmLoadBase(), hmLoadWorld(), ...hmNeedFiles().map(hmLoadFile)]) }catch(e){ HM.err = "The map didn't load. Check your connection and try again." } hmUI() }
async function hmLoadZips(){ if(HM.zips) return HM.zips; if(!HM.zipsP) HM.zipsP = hmFile("hm-zips").then(d => { const m = new Map();
  for(const line of d.rows.split("\n")){ const [z, la, lo, city, s] = line.split("|"); m.set(z, {zip:z, lat:la/1e3, lng:lo/1e3, city, s}) } return HM.zips = m }).catch(e => { HM.zipsP = null; throw e }); return HM.zipsP }

/* ---------- saved stores and the cars found at each store (both private to the owner, in _prefs and the garage) ---------- */
const hmKeyOf = s => `${s.ch||"pin"}|${(+s.lat).toFixed(4)}|${(+s.lng).toFixed(4)}`;
const hmSaved = () => (typeof prefs!=="undefined" && prefs && Array.isArray(prefs.huntSaved)) ? prefs.huntSaved : [];
const hmIsSaved = s => hmSaved().some(x=>x.k===hmKeyOf(s));
const hmFromSaved = x => { return {id:-1, ch:x.ch, nm:x.nm, cat:HM_CHAIN[x.ch] ? HM_CHAIN[x.ch][0] : "other", lat:x.lat, lng:x.lng, x:hmMx(x.lng), y:hmMy(x.lat), st:x.addr||"", city:"", s:"", zip:""} };
function hmToggleSave(s){
  if(typeof col==="undefined" || !col || !hasAccount()){ toast("Sign in to save stores."); return }
  const k = hmKeyOf(s), list = hmSaved(), on = list.some(x=>x.k===k);
  const next = on ? list.filter(x=>x.k!==k) : [{k, ch:s.ch||"", nm:String(s.nm||s.name||"Store").slice(0,40), lat:r5(+s.lat), lng:r5(+s.lng), addr:String(s.addr || hmAddr(s) || "").slice(0,100)}, ...list].slice(0,40);
  if(!on && list.length >= 40) toast("You can save up to 40 stores. The oldest one was removed.");
  prefs = {...prefs, huntSaved:next}; col.doc("_prefs").set(prefs).catch(()=>toast("Couldn't save that store. Try again."));
  toast(on ? "Store removed from your saved stores" : "Store saved. Find it under Your saved stores."); hmSide(); hmPaint(); spRepaintAll() }
function hmCarsAt(s){ const k = hmKeyOf(s); return (typeof own==="function" ? own() : []).filter(c => c.buyFrom!=="person" && (c.storeKey===k || (validLoc(c.loc) && hmMiles(c.loc, s) < .12)))
  .sort((a,b)=>String(b.gotAt||"").localeCompare(String(a.gotAt||"")) || (b.addedAt||0)-(a.addedAt||0)) }
function hmCarsHtml(list, foot){ if(!list.length) return "";
  return `<div class="hm-found"><b>Pulled here · ${list.length} car${list.length===1?"":"s"}</b><ul class="hm-cars hm-fcars">${list.map(c=>{ const u = safeImg(c.photo); return `<li><button type="button" class="hm-fcar" data-own-detail="${c.id}"><span class="hm-fph">${u ? `<img src="${u}" alt="" loading="lazy">` : silhouette(c.name, c.brand)}</span><span class="hm-ftx"><b>${esc(c.name)}</b><small>${esc([lineName(c.line), c.set, fmtDay(c.gotAt || (c.addedAt ? localDate(new Date(c.addedAt)) : "")), c.spot].filter(Boolean).join(" · "))}</small></span></button></li>` }).join("")}</ul>${foot || ""}</div>` }

/* ---------- drawing ---------- */
function hmPaint(){ if(!HM.raf) HM.raf = requestAnimationFrame(() => { HM.raf = 0; hmDraw() }) }
function hmDraw(){
  const {ctx, w, h} = HM; if(!ctx || !w) return;
  const S = 256*2**HM.z, ox = w/2 - HM.cx*S, oy = h/2 - HM.cy*S, X = x => x*S+ox, Y = y => y*S+oy;
  const vx0 = -ox/S, vy0 = -oy/S, vx1 = (w-ox)/S, vy1 = (h-oy)/S, vis = b => b[2]>=vx0 && b[0]<=vx1 && b[3]>=vy0 && b[1]<=vy1;
  const cs = getComputedStyle(HM.node), v = k => cs.getPropertyValue(k).trim(), dark = HM.node.closest("[data-theme='dark']") || matchMedia("(prefers-color-scheme: dark)").matches && !document.documentElement.matches("[data-theme='light']");
  const water = v("--hm-water"), land = v("--panel"), line = v("--line"), ink = v("--ink"), muted = v("--muted"), acc = v("--forest") || "#1f6b45";
  ctx.setTransform(HM.dpr,0,0,HM.dpr,0,0); ctx.fillStyle = water; ctx.fillRect(0,0,w,h);
  const path = (lines, close) => { ctx.beginPath(); for(const L of lines){ if(!vis(L.b)) continue; const p = L.p; ctx.moveTo(X(p[0]),Y(p[1])); for(let i=2;i<p.length;i+=2) ctx.lineTo(X(p[i]),Y(p[i+1])); if(close) ctx.closePath() } };
  if(HM.world){ ctx.beginPath(); for(const c of HM.world.countries) for(const L of c.lines){ if(!vis(L.b)) continue; const p = L.p; ctx.moveTo(X(p[0]),Y(p[1])); for(let i=2;i<p.length;i+=2) ctx.lineTo(X(p[i]),Y(p[i+1])); ctx.closePath() }
    ctx.fillStyle = land; ctx.fill(); ctx.strokeStyle = muted; ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1 }
  if(HM.base){ const B = HM.base;
    path(B.land, true); ctx.fillStyle = land; ctx.fill("evenodd");
    path(B.urban, true); ctx.fillStyle = dark ? "rgba(255,255,255,.05)" : "rgba(31,107,69,.07)"; ctx.fill();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if(HM.z >= 6.2){ path(B.road); ctx.strokeStyle = dark ? "rgba(255,255,255,.13)" : "rgba(60,70,80,.16)"; ctx.lineWidth = HM.z>=9 ? 2 : 1; ctx.stroke() }
    if(HM.z >= 4.2){ path(B.hwy); ctx.strokeStyle = dark ? "rgba(255,255,255,.22)" : "rgba(60,70,80,.26)"; ctx.lineWidth = HM.z>=9 ? 3.2 : HM.z>=6.5 ? 2 : 1.1; ctx.stroke() }
    path(B.states); ctx.strokeStyle = muted; ctx.globalAlpha = .45; ctx.setLineDash([4,3]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    path(B.nation); ctx.strokeStyle = muted; ctx.globalAlpha = .6; ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalAlpha = 1;
  }
  // stores: the smaller chains first so Walmart and Target sit on top
  const r = HM.z < 6 ? 1.3 : HM.z < 8 ? 2.2 : HM.z < 10.5 ? 3.6 : 5.5, order = ["more","rx","disc","groc","toy","big","tg","wm"];
  for(const cat of order){ if(!HM.on[cat]) continue; ctx.fillStyle = HM_CAT[cat].c; ctx.strokeStyle = land; ctx.lineWidth = 1.5; ctx.beginPath();
    for(const s of HM.stores){ if(s.cat!==cat) continue; const x = X(s.x), y = Y(s.y); if(x<-8||y<-8||x>w+8||y>h+8) continue;
      if(r<2){ ctx.rect(x-r, y-r, 2*r, 2*r) } else { ctx.moveTo(x+r, y); ctx.arc(x, y, r, 0, 6.2832) } }
    ctx.fill(); if(r>=3.6) ctx.stroke() }
  // city names
  const cityList = HM.country==="US" || !HM.world ? HM.cities : HM.world.cities.filter(c => c.pop >= (HM.z>=9 ? 0 : HM.z>=7 ? 50000 : 400000));
  if(cityList && HM.z >= (HM.country==="US" ? 5.3 : 4)){ ctx.font = `600 ${HM.z>=8?12:11}px ${v("--body")}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; const placed = [];
    for(const c of cityList){ const x = X(c.x), y = Y(c.y); if(x<0||y<0||x>w||y>h) continue; const tw = ctx.measureText(c.n).width/2+4;
      if(placed.some(p=>Math.abs(p[0]-x)<p[2]+tw && Math.abs(p[1]-y)<16)) continue; placed.push([x,y,tw]);
      ctx.lineWidth = 3.5; ctx.strokeStyle = land; ctx.strokeText(c.n, x, y-12); ctx.fillStyle = muted; ctx.fillText(c.n, x, y-12) } }
  // search center and radius
  if(HM.origin){ const x = X(hmMx(HM.origin.lng)), y = Y(hmMy(HM.origin.lat)), rr = HM.radius*1609.34/(40075016.7*Math.cos(HM.origin.lat*Math.PI/180))*S;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.2832); ctx.fillStyle = dark ? "rgba(98,192,142,.07)" : "rgba(31,107,69,.06)"; ctx.fill(); ctx.strokeStyle = acc; ctx.globalAlpha = .55; ctx.setLineDash([6,4]); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fillStyle = acc; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = land; ctx.stroke() }
  // your pinned stores
  for(const p of HM.pins){ const x = X(p.x), y = Y(p.y); if(x<-20||y<-20||x>w+20||y>h+20) continue; const n = p.cars.length, pr = Math.min(16, 9 + 2*Math.sqrt(n-1));
    ctx.beginPath(); ctx.arc(x, y, pr, 0, 6.2832); ctx.fillStyle = acc; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = land; ctx.stroke();
    ctx.fillStyle = land; ctx.font = `700 11px ${v("--mono")}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(n), x, y+.5) }
  if(HM.draft){ const x = X(hmMx(HM.draft.lng)), y = Y(hmMy(HM.draft.lat)); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y-16, 9, Math.PI*.75, Math.PI*.25); ctx.closePath(); ctx.fillStyle = acc; ctx.fill(); ctx.beginPath(); ctx.arc(x, y-16, 3.5, 0, 6.2832); ctx.fillStyle = land; ctx.fill() }
  // saved stores: a green ring around the store
  if(hasAccount && typeof hasAccount==="function") for(const x of hmSaved()){ const px = X(hmMx(x.lng)), py = Y(hmMy(x.lat)); if(px<-20||py<-20||px>w+20||py>h+20) continue; const c = HM_CHAIN[x.ch] ? (HM_CAT[HM_CHAIN[x.ch][0]]||HM_OTHER).c : acc;
    ctx.beginPath(); ctx.arc(px, py, 10, 0, 6.2832); ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(px, py, 5.5, 0, 6.2832); ctx.fillStyle = c; ctx.fill();
    if(HM.z >= 11.5 && !(HM.sel && hmKeyOf(HM.sel.s)===x.k)){ ctx.font = `700 11.5px ${v("--body")}`; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.lineWidth = 3.5; ctx.strokeStyle = land; ctx.strokeText("★ " + x.nm, px, py+13); ctx.fillStyle = acc; ctx.fillText("★ " + x.nm, px, py+13) } }
  wfDraw(ctx, X, Y, w, h, land, acc);
  // selected / hovered store with its name
  for(const s of [HM.hover, HM.sel && HM.sel.s].filter(Boolean)){ const x = X(s.x), y = Y(s.y), col = s.cat ? (HM_CAT[s.cat]||HM_OTHER).c : acc, sel = HM.sel && s===HM.sel.s;
    ctx.beginPath(); ctx.arc(x, y, sel ? 9 : 7, 0, 6.2832); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = land; ctx.stroke();
    if(sel){ ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.2832); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]) }
    const label = s.nm || s.name; ctx.font = `700 12.5px ${v("--body")}`; const tw = ctx.measureText(label).width; let lx = x+17, ly = y; ctx.textAlign = "left";
    if(x + 17 + tw > w - 58){ if(x - 17 - tw >= 4){ lx = x-17; ctx.textAlign = "right" } else { ctx.textAlign = "center"; lx = Math.max(tw/2+6, Math.min(w-tw/2-6, x)); ly = y < 40 ? y+24 : y-24 } }
    ctx.textBaseline = "middle"; ctx.lineWidth = 4; ctx.strokeStyle = land; ctx.strokeText(label, lx, ly); ctx.fillStyle = ink; ctx.fillText(label, lx, ly) }
  const ld = HM.node.querySelector(".hm-loading"); if(ld) ld.hidden = !!HM.base && !HM.err;
  const zb = HM.node.querySelectorAll("[data-hmz]"); if(zb.length){ zb[0].disabled = HM.z >= 17; zb[1].disabled = HM.z <= 3 }
}

/* ---------- interaction ---------- */
function hmZoomAt(px, py, dz){ const S = 256*2**HM.z, wx = HM.cx + (px-HM.w/2)/S, wy = HM.cy + (py-HM.h/2)/S;
  HM.z = Math.max(3, Math.min(17, HM.z+dz)); const S2 = 256*2**HM.z; HM.cx = wx - (px-HM.w/2)/S2; HM.cy = wy - (py-HM.h/2)/S2; hmPaint() }
function hmHit(px, py){ const S = 256*2**HM.z, ox = HM.w/2 - HM.cx*S, oy = HM.h/2 - HM.cy*S; let best = null, bd = 15*15;
  for(const p of HM.pins){ const dx = p.x*S+ox-px, dy = p.y*S+oy-py, d = dx*dx+dy*dy; if(d < Math.max(bd, 18*18)){ bd = d; best = {type:"pin", s:p} } }
  if(best){ const near = HM.stores.filter(s=>hmMiles(s, best.s) < .12).sort((a,b)=>hmMiles(a,best.s)-hmMiles(b,best.s))[0]; return near ? {type:"store", s:near} : best }
  for(const x of hmSaved()){ const s = hmFromSaved(x), dx = s.x*S+ox-px, dy = s.y*S+oy-py, d = dx*dx+dy*dy; if(d < 15*15){ const real = HM.stores.find(t=>hmKeyOf(t)===x.k); return {type:"store", s:real || s} } }
  for(const s of HM.stores){ if(!HM.on[s.cat]) continue; const dx = s.x*S+ox-px, dy = s.y*S+oy-py, d = dx*dx+dy*dy; if(d < bd){ bd = d; best = {type:"store", s} } }
  return best }
function hmSelect(sel, center){ if(!sel || !HM.adding || HM.adding.k!==hmKeyOf(sel.s)) HM.adding = null; HM.sel = sel; HM.hover = null;
  if(sel && center){ const S = 256*2**HM.z, x = (sel.s.x-HM.cx)*S, y = (sel.s.y-HM.cy)*S; if(HM.z < 11) hmFitMiles(sel.s.lat, sel.s.lng, 3); else if(Math.abs(x) > HM.w/2-30 || Math.abs(y) > HM.h/2-30){ HM.cx = sel.s.x; HM.cy = sel.s.y } }
  hmPaint(); hmSide() }
function hmBind(){
  const cv = HM.cv, pts = new Map(); let moved = 0, last = null, pinch = null;
  cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.offsetX, e.offsetY]); moved = 0; last = [e.offsetX, e.offsetY];
    if(pts.size===2){ const [a,b] = [...pts.values()]; pinch = {d:Math.hypot(a[0]-b[0], a[1]-b[1]), z:HM.z} } cv.classList.add("drag") });
  cv.addEventListener("pointermove", e => {
    if(!pts.has(e.pointerId)){ if(e.pointerType==="mouse"){ const h = hmHit(e.offsetX, e.offsetY), s = h && h.type==="store" ? h.s : null; cv.style.cursor = h ? "pointer" : ""; if(s!==HM.hover){ HM.hover = s; hmPaint() } } return }
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.offsetX, e.offsetY]);
    if(pts.size===2 && pinch){ const [a,b] = [...pts.values()], d = Math.hypot(a[0]-b[0], a[1]-b[1]); const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2;
      hmZoomAt(mx, my, pinch.z + Math.log2(d/pinch.d) - HM.z); moved += 10; return }
    const S = 256*2**HM.z, dx = e.offsetX-prev[0], dy = e.offsetY-prev[1]; moved += Math.abs(dx)+Math.abs(dy); HM.cx -= dx/S; HM.cy -= dy/S; hmPaint() });
  const up = e => { if(!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if(pts.size<2) pinch = null; if(!pts.size) cv.classList.remove("drag");
    if(e.type==="pointerup" && moved < 6 && !pts.size && HM.placing){ const S = 256*2**HM.z, wx = HM.cx + (e.offsetX-HM.w/2)/S, wy = HM.cy + (e.offsetY-HM.h/2)/S;
      HM.draft = {lat:+(360/Math.PI*Math.atan(Math.exp((.5-wy)*2*Math.PI)) - 90).toFixed(5), lng:+(wx*360-180).toFixed(5)}; hmSide(); hmPaint(); setTimeout(()=>HM.node.querySelector("#hm-dn")?.focus({preventScroll:true}), 50); return }
    if(e.type==="pointerup" && moved < 6 && !pts.size){ const h = hmHit(e.offsetX, e.offsetY); if(h) hmSelect(h, false); else if(HM.sel){ HM.sel = null; hmPaint(); hmSide() } } };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("pointerleave", () => { if(HM.hover){ HM.hover = null; hmPaint() } });
  cv.addEventListener("wheel", e => { e.preventDefault(); hmZoomAt(e.offsetX, e.offsetY, -e.deltaY*(e.deltaMode===1 ? .05 : .0022)) }, {passive:false});
  cv.addEventListener("dblclick", e => { e.preventDefault(); hmZoomAt(e.offsetX, e.offsetY, 1) });
  cv.addEventListener("keydown", e => { const S = 256*2**HM.z, step = 80/S, k = e.key;
    if(k==="ArrowLeft") HM.cx -= step; else if(k==="ArrowRight") HM.cx += step; else if(k==="ArrowUp") HM.cy -= step; else if(k==="ArrowDown") HM.cy += step;
    else if(k==="+"||k==="=") return hmZoomAt(HM.w/2, HM.h/2, .7), e.preventDefault(); else if(k==="-"||k==="_") return hmZoomAt(HM.w/2, HM.h/2, -.7), e.preventDefault(); else return;
    e.preventDefault(); hmPaint() });
  new ResizeObserver(() => hmResize()).observe(HM.node.querySelector(".hm-mapbox"));
  HM.node.addEventListener("click", e => { const t = e.target.closest("button,a"); if(!t || !HM.node.contains(t)) return; const d = t.dataset;
    if(d.hmz != null){ const z = +d.hmz; if(z) hmZoomAt(HM.w/2, HM.h/2, z); else { if(HM.origin) hmFitMiles(HM.origin.lat, HM.origin.lng, HM.radius); else hmFitUS(); hmPaint() } }
    else if(d.hmcat){ HM.on[d.hmcat] = !HM.on[d.hmcat]; if(HM.sel && HM.sel.s.cat===d.hmcat && !HM.on[d.hmcat]) HM.sel = null; hmChips(); hmPaint(); hmLoadOn().then(() => { if(HM.origin) hmNearby(false) }) }
    else if(d.hms != null){ const s = HM.stores[+d.hms]; if(s) hmSelect({type:"store", s}, true) }
    else if(d.hmpin != null){ const p = HM.pins.find(p=>p.key===d.hmpin); if(p) hmSelect({type:"pin", s:p}, true) }
    else if(d.hmadd != null){ if(typeof hasAccount!=="function" || !hasAccount()){ toast("Sign in to save stores."); return } HM.placing = true; HM.draft = null; HM.sel = null; HM.cv.classList.add("placing"); hmSide(); hmPaint() }
    else if(d.hmaddx != null){ HM.placing = false; HM.draft = null; HM.cv.classList.remove("placing"); hmSide(); hmPaint() }
    else if(d.hmaddok != null){ const nm = (HM.node.querySelector("#hm-dn")||{}).value || "", ty = (HM.node.querySelector("#hm-dt")||{}).value || "custom";
      if(!nm.trim()){ toast("Give the store a name first."); HM.node.querySelector("#hm-dn")?.focus(); return } if(!HM.draft) return;
      const s = {ch:ty, nm:nm.trim().slice(0,40), lat:HM.draft.lat, lng:HM.draft.lng, addr:hmNearCity(HM.draft.lat, HM.draft.lng)};
      HM.placing = false; HM.draft = null; HM.cv.classList.remove("placing"); if(!hmIsSaved(s)) hmToggleSave(s); hmSelect({type:"store", s:hmFromSaved({k:hmKeyOf(s), ...s})}, false) }
    else if(d.hmaddpick != null){ const s = HM.sel && HM.sel.s; if(s){ HM.adding = {k:hmKeyOf(s), mode:"pick", pick:new Set(), q:""}; hmSide(); setTimeout(()=>{ const p = HM.node.querySelector(".hm-addp"); p?.scrollIntoView({block:"nearest", behavior:"smooth"}); HM.node.querySelector("#hm-pq")?.focus({preventScroll:true}) }, 30) } }
    else if(d.hmaddcars != null){ const s = HM.sel && HM.sel.s; if(s){ HM.adding = {k:hmKeyOf(s), mode:"", pick:new Set(), q:""}; hmSide() } }
    else if(d.hmaddx2 != null){ HM.adding = null; hmSide() }
    else if(d.hmscan != null){ const s = HM.sel && HM.sel.s; if(!s) return; HM.addTo = {s, at:Date.now()}; HM.adding = null; hmSide();
      if(typeof camOpen==="function"){ camOpen("scan"); toast(`Scan your cards. They'll be set to ${s.nm} when you add them.`) } }
    else if(d.hmpick != null){ if(HM.adding){ HM.adding.mode = "pick"; hmSide(); setTimeout(()=>HM.node.querySelector("#hm-pq")?.focus({preventScroll:true}), 30) } }
    else if(d.hmpickc != null){ const A = HM.adding; if(!A) return; A.pick.has(d.hmpickc) ? A.pick.delete(d.hmpickc) : A.pick.add(d.hmpickc); t.setAttribute("aria-pressed", String(A.pick.has(d.hmpickc))); const n = HM.node.querySelector("[data-hmpicksave]"); if(n){ n.disabled = !A.pick.size; n.textContent = A.pick.size ? `Save ${A.pick.size} car${A.pick.size===1?"":"s"} to this store` : "Pick the cars you found here" } }
    else if(d.hmpicksave != null){ const s = HM.sel && HM.sel.s, A = HM.adding; if(!s || !A || !A.pick.size) return; const rec = {buyFrom:"store", source:String(s.nm||"").slice(0,40), loc:{lat:r5(+s.lat), lng:r5(+s.lng)}, storeKey:hmKeyOf(s), storeAddr:String(hmAddr(s)||s.st||"").slice(0,100)};
      const ids = [...A.pick]; HM.adding = null; t.disabled = true;
      Promise.all(ids.map(id=>{ const c = cars.find(x=>x.id===id); return c ? save({...c, ...rec}) : null })).then(()=>{ toast(`Added ${ids.length} car${ids.length===1?"":"s"} to ${s.nm}`); hmSide(); setTimeout(wfSync, 1500) }).catch(()=>toast("Couldn't save. Try again.")) }
    else if(d.hmunsave != null){ const x = hmSaved().find(x=>x.k===d.hmunsave); if(x) hmToggleSave(hmFromSaved(x)) }
    else if(d.hmsave != null){ const s = HM.sel && HM.sel.s; if(s) hmToggleSave(s) }
    else if(d.hmsaved != null){ const x = hmSaved().find(x=>x.k===d.hmsaved); if(x){ const real = HM.stores.find(t=>hmKeyOf(t)===x.k); hmSelect({type:"store", s:real || hmFromSaved(x)}, true) } }
    else if(d.hmretry != null){ HM.err = ""; hmUI(); hmLoadOn() }
    else if(d.hmback != null){ HM.sel = null; hmPaint(); hmSide() }
    else if(d.hmq != null){ const i = HM.node.querySelector("#hm-q"); i.value = d.hmq; hmSearch(d.hmq) } });
  HM.node.querySelector("form").addEventListener("submit", e => { e.preventDefault(); hmSearch(HM.node.querySelector("#hm-q").value) });
  HM.node.querySelector("#hm-c").addEventListener("change", e => hmSetCountry(e.target.value));
  HM.node.querySelector("#hm-r").addEventListener("change", e => { HM.radius = +e.target.value; if(HM.origin){ hmFitMiles(HM.origin.lat, HM.origin.lng, HM.radius); hmNearby(true) } else hmPaint() });
}
function hmResize(){ const box = HM.node && HM.node.querySelector(".hm-mapbox"); if(!box || !box.isConnected) return; const w = box.clientWidth, h = box.clientHeight; if(!w || !h) return;
  const first = !HM.w; HM.dpr = Math.min(2, devicePixelRatio || 1); HM.w = w; HM.h = h; HM.cv.width = Math.round(w*HM.dpr); HM.cv.height = Math.round(h*HM.dpr);
  if(first){ if(HM.origin) hmFitMiles(HM.origin.lat, HM.origin.lng, HM.radius); else if(HM.pins.length) hmFitList(HM.pins); else hmFitUS() } hmDraw() }

/* ---------- search ---------- */
async function hmSearch(q){
  q = String(q||"").trim().slice(0, 80); HM.q = q; HM.sel = null; HM.msg = ""; if(!q){ HM.origin = null; HM.res = null; hmSide(); hmPaint(); return }
  HM.msg = "Looking…"; hmSide();
  try{ await hmLoadOn(); if(HM.err) throw new Error("load");
    const svHits = hmSaved().filter(x => hmFold(x.nm + " " + (x.addr||"")).includes(hmFold(q))).map(hmFromSaved);
    if(HM.country!=="US"){ const c = hmWorldCity(q, HM.country);
      if(c) return hmGo({lat:c.lat, lng:c.lng, label:`${c.n}, ${hmCountryName(c.a)}`}, q);
      const words = q.toLowerCase().split(/[\s,]+/).filter(Boolean), list = [...svHits];
      for(const s of HM.stores){ if(s.cc!==HM.country || !HM.on[s.cat]) continue; const t = hmFold(`${s.nm} ${s.st} ${s.city} ${s.zip}`) + " " + `${s.zip}`.toLowerCase(); if(words.every(w => t.includes(hmFold(w)) || t.includes(w))){ list.push(s); if(list.length >= 60) break } }
      if(list.length){ HM.origin = null; HM.res = list; HM.resLabel = `${list.length===60 ? "First 60" : list.length} store${list.length===1?"":"s"} matching “${q}”`; HM.msg = ""; hmFitList(list); hmSide(); hmPaint(); hmSaveQ(q); return }
      HM.res = null; HM.origin = null; HM.msg = HM_INTL[HM.country] ? `We couldn't find “${q}” in ${hmCountryName(HM.country)}. Try a bigger nearby city, a postcode, or a store name like “${hmIntlEx()}”.` : `We couldn't find “${q}” in ${hmCountryName(HM.country)}. Try a bigger nearby city.`; hmSide(); hmPaint(); return }
    const zipM = q.match(/^\s*(\d{5})(?:-\d{4})?\s*$/);
    if(zipM){ const zips = await hmLoadZips(), z = zips.get(zipM[1]);
      if(!z){ HM.msg = `We couldn't find ZIP code ${zipM[1]}. Check the number, or try a nearby ZIP or your city.`; HM.origin = null; HM.res = null; hmSide(); hmPaint(); return }
      return hmGo({lat:z.lat, lng:z.lng, label:[z.city, z.s].filter(Boolean).join(", ") + " " + z.zip}, q) }
    // a city: "Atlanta", "Atlanta, GA", "atlanta ga"
    const zips = await hmLoadZips(), m = q.toLowerCase().replace(/[.]/g,"").match(/^(.+?)(?:,?\s+([a-z]{2}))?$/), city = m && m[1].replace(/,$/,"").trim(), st = m && m[2] ? m[2].toUpperCase() : "";
    if(city){ const hits = [...zips.values()].filter(z => z.city && z.city.toLowerCase()===city && (!st || z.s===st));
      const by = {}; hits.forEach(z => (by[z.s] = by[z.s] || []).push(z)); const best = Object.values(by).sort((a,b)=>b.length-a.length)[0];
      if(best){ const lat = best.reduce((a,z)=>a+z.lat,0)/best.length, lng = best.reduce((a,z)=>a+z.lng,0)/best.length; return hmGo({lat, lng, label:`${best[0].city}, ${best[0].s}`}, q) } }
    // a store: words matched against chain, street, city, state and ZIP
    const words = q.toLowerCase().split(/[\s,]+/).filter(Boolean), list = [...svHits];
    for(const s of HM.stores){ if(!HM.on[s.cat] || (s.cc||"US")!=="US") continue; const t = `${s.nm} ${s.st} ${s.city} ${s.s} ${s.zip}`.toLowerCase(); if(words.every(w => t.includes(w))){ list.push(s); if(list.length >= 60) break } }
    HM.origin = null;
    if(!list.length){ HM.res = null; HM.msg = `No ZIP code, city or store matched “${q}”. Try a 5-digit ZIP code, a city like “Atlanta, GA”, or a store and street like “Walmart Ponce”.`; hmSide(); hmPaint(); return }
    HM.res = list; HM.resLabel = `${list.length===60 ? "First 60" : list.length} store${list.length===1?"":"s"} matching “${q}”`; HM.msg = ""; hmFitList(list); hmSide(); hmPaint(); hmSaveQ(q);
  }catch(e){ HM.msg = "The store list didn't load. Check your connection and try again."; hmSide() }
}
function hmIntlEx(){ const c = {}; for(const s of HM.stores) if(s.cc===HM.country && s.ch!=="toy") c[s.nm] = (c[s.nm]||0) + 1; return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(x=>x[0])[0] || "Toys\"R\"Us" }
function hmGo(origin, q){ HM.origin = origin; hmFitMiles(origin.lat, origin.lng, HM.radius); hmNearby(true); hmSaveQ(q) }
function hmNearby(fit){ const o = HM.origin; if(!o) return;
  const own0 = hmSaved().filter(x => !HM_CHAIN[x.ch] || x.ch==="custom").map(hmFromSaved);
  let list = [...own0, ...HM.stores.filter(s => HM.on[s.cat] && (s.cc||"US")===HM.country)].map(s => (s.d = hmMiles(o, s), s)).sort((a,b)=>a.d-b.d);
  const near = list.filter(s => s.d <= HM.radius);
  if(!list.length){ HM.res = null; HM.msg = `Showing ${o.label}. We don't have a store list here yet. Tap ＋ Add a store, then tap the map where you hunt.`; hmSide(); hmPaint(); return }
  HM.res = (near.length ? near : list.slice(0, 8)).slice(0, 80); HM.resLabel = near.length ? `${near.length} store${near.length===1?"":"s"} within ${HM.radius} mi of ${o.label}` : `Nothing within ${HM.radius} mi of ${o.label}. Closest stores:`;
  if(!near.length && fit && HM.res.length) hmFitList([{...o, x:hmMx(o.lng), y:hmMy(o.lat)}, ...HM.res.slice(0,3)]);
  HM.msg = ""; hmSide(); hmPaint() }
function hmSaveQ(q){ if(!col || !hasAccount()) return; if(prefs.huntQ===q && prefs.huntR===HM.radius) return; prefs = {...prefs, huntQ:q, huntR:HM.radius}; col.doc("_prefs").set(prefs).catch(()=>{}) }

/* ---------- side panel, chips, guide ---------- */
function hmTipsHtml(key){ return `<div class="hm-tip"><b>Where to look</b><ul>${(HM_TIPS[key]||HM_GENERAL).map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>` }
function hmSide(){ wfStart(); hmSavedList(); const el = HM.node && HM.node.querySelector(".hm-side"); if(!el) return;
  if(HM.placing){ el.innerHTML = HM.draft ? `<div class="hm-card hm-addcard"><span class="eyebrow">New store</span><b>${esc(hmNearCity(HM.draft.lat, HM.draft.lng) || `${HM.draft.lat.toFixed(4)}, ${HM.draft.lng.toFixed(4)}`)}</b>
      <label>Store name<input id="hm-dn" maxlength="40" placeholder="Walmart, corner shop, hobby store…" autocomplete="off"></label>
      <label>Type<select id="hm-dt"><option value="custom">Other / hobby shop</option><option value="walmart">Walmart</option><option value="target">Target</option><option value="kroger">Grocery store</option><option value="dg">Dollar / discount store</option><option value="cvs">Pharmacy</option></select></label>
      <div class="hm-acts"><button type="button" class="btn sm" data-hmaddok>Save store</button><button type="button" class="btn line sm" data-hmaddx>Cancel</button></div><small class="muted">Tap the map again to move the pin.</small></div>`
    : `<div class="hm-intro"><b>Tap the map where the store is</b><p>Zoom in close first so the pin lands on the right spot.</p><div class="hm-acts"><button type="button" class="btn line sm" data-hmaddx>Cancel</button></div></div>`; return } const sel = HM.sel, back = HM.car && sel ? `<button type="button" class="link small hm-back" data-hmback>← Back to ${esc(HM.car.name)}</button>` : HM.res ? `<button type="button" class="link small hm-back" data-hmback>← ${HM.origin ? "All nearby stores" : "All results"}</button>` : "";
  if(sel && sel.type==="store"){ const s = sel.s, c = HM_CAT[s.cat] || HM_OTHER, d = HM.origin ? hmMiles(HM.origin, s) : null;
    el.innerHTML = `${back}<div class="hm-card"><div class="hm-ch"><i class="hm-key" style="background:${c.c}" aria-hidden="true"></i><div><span class="eyebrow">${esc(s.ch==="custom" ? "Your store" : c.n)}${d!=null?` · ${hmFmtMi(d)} away`:""}</span><b>${esc(s.nm)}</b><small class="muted hm-ad">${esc(hmAddr(s))}</small></div></div>
      ${HM.car && hasAccount() && HM_CHAIN[s.ch] && s.ch!=="custom" ? (()=>{ const w = wfStores(HM.car).find(x=>x.k===hmKeyOf(s)); return `<div class="wf-here">${w ? `<p><b>${esc(HM.car.name)}</b>: ${w.found ? `found here ${w.found}×` : ""}${w.found && w.seen ? ", " : ""}${w.seen ? `seen here ${w.seen}×` : ""}${w.last ? ` · last ${esc(wfMonthName(w.last))}` : ""}</p>` : ""}<button type="button" class="btn line sm" data-wfseen>👀 I saw ${esc(HM.car.name)} here</button></div>` })() : ""}
      ${(()=>{ const found = hmCarsAt(s), can = !!uid && own().length > 0, open = HM.adding && HM.adding.k===hmKeyOf(s);
        // with cars already found: a simple "+ Add" under the list opens your garage right there; with none yet: the scan / pick choice
        if(found.length) return hmCarsHtml(found, can ? (open ? hmAddPanel(s) : `<button type="button" class="btn hm-addmore" data-hmaddpick>＋ Add cars found here</button>`) : "");
        return can ? (open ? hmAddPanel(s) : `<button type="button" class="btn sm hm-addcars" data-hmaddcars>＋ Add cards you found here</button>`) : "" })()}${HM_EXCL[hmExclKey(s)] ? `<p class="hm-excl"><b>Store exclusive</b>${esc(HM_EXCL[hmExclKey(s)])}</p>` : ""}${hmTipsHtml(hmTipKey(s))}
      <div class="hm-acts"><a class="btn sm" href="${esc(hmDir(s))}" target="_blank" rel="noopener">Directions ↗</a>${hasAccount() ? `<button type="button" class="btn line sm hm-savebtn" data-hmsave aria-pressed="${hmIsSaved(s)}">${hmIsSaved(s) ? "★ Saved" : "☆ Save store"}</button>` : ""}</div><small class="muted">Hours and stock change. Check before you drive over.</small></div>`; return }
  if(sel && sel.type==="pin"){ const st = sel.s, n = st.cars.length, ch = hmChainOfName(st.name), d = HM.origin ? hmMiles(HM.origin, st) : null;
    el.innerHTML = `${back}<div class="hm-card"><div class="hm-ch"><i class="hm-key" style="background:var(--forest)" aria-hidden="true"></i><div><span class="eyebrow">Your store${d!=null?` · ${hmFmtMi(d)} away`:""}</span><b>${esc(st.name)}</b><small class="muted">${st.lat.toFixed(5)}, ${st.lng.toFixed(5)}</small></div></div>
      <div class="hm-stats"><div><b>${n}</b><small>car${n===1?"":"s"} found</small></div><div><b>${money(st.paid)}</b><small>Total paid there</small></div></div>
      ${ch ? hmTipsHtml(hmTipKey({ch:ch.ch, nm:ch.nm||st.name})) : ""}
      <a class="btn sm" href="${esc(mapsUrl(st))}" target="_blank" rel="noopener">Directions ↗</a>
      ${hmCarsHtml(st.cars)}</div>`; return }
  if(HM.car && !HM.msg){ el.innerHTML = hmCarPanel(); return }
  if(HM.msg){ el.innerHTML = `<div class="hm-intro"><p>${esc(HM.msg)}</p>${HM.msg!=="Looking…" ? `<div class="hm-acts"><button type="button" class="btn line sm" data-hmadd>＋ Add a store</button></div>` : ""}</div>`; return }
  if(HM.res){ el.innerHTML = `<p class="hm-rhead">${esc(HM.resLabel)}</p><div class="hm-results" role="list">${HM.res.map(s => `<button type="button" role="listitem" class="hm-r" ${s.id < 0 ? `data-hmsaved="${esc(hmKeyOf(s))}"` : `data-hms="${s.id}"`}><i class="hm-key" style="background:${(HM_CAT[s.cat]||HM_OTHER).c}" aria-hidden="true"></i><span><b>${esc(s.nm)}</b><small>${esc(hmAddr(s))}</small></span>${HM.origin ? `<em>${hmFmtMi(s.d)}</em>` : ""}</button>`).join("")}</div>`; return }
  const savedHtml = false ? `<p class="hm-rhead">Your saved stores</p><div class="hm-results hm-saved" role="list">${sv.map(x=>{ const s = hmFromSaved(x), n = hmCarsAt(s).length; return `<button type="button" role="listitem" class="hm-r" data-hmsaved="${esc(x.k)}"><i class="hm-key" style="background:${(HM_CAT[s.cat]||HM_CAT.groc).c}" aria-hidden="true"></i><span><b>★ ${esc(x.nm)}</b><small>${esc(x.addr||"")}</small></span>${n ? `<em>${n} found</em>` : ""}</button>` }).join("")}</div>` : "";
  if(HM.country!=="US"){ const n = HM_INTL[HM.country]; el.innerHTML = n ? `<div class="hm-intro"><b>Hunting in ${esc(hmCountryName(HM.country))}</b><p>Search a city, a postcode or a store like “${esc(hmIntlEx())}” ${n >= 20 ? `to see ${n.toLocaleString()} stores that carry Hot Wheels: toy shops, big stores and hypermarkets. Turn store types on and off with the buttons above.` : `. We only know ${n} store${n===1?"":"s"} here so far.`}</p><p class="small muted">Store list from OpenStreetMap, so a few may be missing. Tap <b>＋ Add a store</b> to put yours on the map.</p><div class="hm-acts"><button type="button" class="btn sm" data-hmadd>＋ Add a store</button></div></div>` : `<div class="hm-intro"><b>Hunting in ${esc(hmCountryName(HM.country))}</b><p>We don't have a store list for ${esc(hmCountryName(HM.country))} yet. Search a city to move the map there, then tap <b>＋ Add a store</b> and tap the map where you hunt. Saved stores show up here and when you add a car.</p><div class="hm-acts"><button type="button" class="btn sm" data-hmadd>＋ Add a store</button></div></div>`; return }
  el.innerHTML = `<div class="hm-intro"><b>Find stores to hunt</b><p>Type your ZIP code to see the Walmart, Target and grocery stores near you. Turn on dollar stores and pharmacies with the buttons above.</p>
    ${HM.pins.length ? `<p class="small muted">Green pins are stores where you've found cars.</p>` : ""}<p class="small muted">Drag the map to move around. Scroll, pinch or use + and − to zoom. Tap a store to see where the Hot Wheels usually are, and ☆ Save it to find it fast next time.</p><div class="hm-acts"><button type="button" class="btn line sm" data-hmadd>＋ Add a store that isn't listed</button></div></div>`;
}
/* a car already has a location when it has a store, a map pin, or came from another collector */
const hmHasWhere = c => !!(c.storeKey || validLoc(c.loc) || String(c.source||"").trim() || c.buyFrom==="person");
function hmAddPanel(s){ const A = HM.adding;
  if(A.mode!=="pick") return `<div class="hm-addp"><b>Add cards you found at ${esc(s.nm)}</b><div class="hm-acts"><button type="button" class="btn sm" data-hmscan>📷 Scan new cards</button><button type="button" class="btn line sm" data-hmpick>Pick from my garage</button><button type="button" class="link small" data-hmaddx2>Cancel</button></div></div>`;
  const k = hmKeyOf(s), f = hmFold(A.q), list = own().filter(c => !hmHasWhere(c) && (!f || hmFold(c.name + " " + (c.set||"") + " " + (c.brand||"")).includes(f))).sort((a,b)=>(b.addedAt||0)-(a.addedAt||0)).slice(0, 60);
  return `<div class="hm-addp"><b>Which cars did you find at ${esc(s.nm)}?</b><input id="hm-pq" type="search" placeholder="Search your garage" value="${esc(A.q)}" autocomplete="off">
    <div class="hm-plist">${list.map(c=>{ const u = safeImg(c.photo); return `<button type="button" class="hm-pc" data-hmpickc="${c.id}" aria-pressed="${A.pick.has(c.id)}"><span class="hm-fph">${u ? `<img src="${u}" alt="" loading="lazy">` : silhouette(c.name, c.brand)}</span><span class="hm-ftx"><b>${esc(c.name)}</b><small>${esc([c.set, c.source ? "now: " + c.source : ""].filter(Boolean).join(" · "))}</small></span><i aria-hidden="true">✓</i></button>` }).join("") || `<p class="small muted">${f ? "No cars without a store match that search." : "Every car in your garage already has a store. To change one, open the car and edit where you found it."}</p>`}</div>
    <div class="hm-acts"><button type="button" class="btn sm" data-hmpicksave ${A.pick.size ? "" : "disabled"}>${A.pick.size ? `Save ${A.pick.size} car${A.pick.size===1?"":"s"} to this store` : "Pick the cars you found here"}</button><button type="button" class="link small" data-hmscan>📷 Scan new ones</button><button type="button" class="link small" data-hmaddx2>Cancel</button></div></div>` }
document.addEventListener("input", e=>{ if(e.target.id==="hm-pq" && HM.adding){ HM.adding.q = e.target.value; clearTimeout(HM.pqT); HM.pqT = setTimeout(()=>{ hmSide(); const i = HM.node.querySelector("#hm-pq"); if(i){ i.focus({preventScroll:true}); i.setSelectionRange(i.value.length, i.value.length) } }, 250) } });
function hmSavedList(){ const el = HM.node && HM.node.querySelector(".hm-savedlist"); if(!el) return; const sv = hmSaved();
  const share = typeof hasAccount==="function" && hasAccount() ? `<label class="wf-share"><input type="checkbox" data-wfshare ${wfShareOn() ? "checked" : ""}> <span><b>Share my finds on each car's “Where to find it” map</b><small>Only the store (chain stores, never your own pins) and the month. No prices, no name. Turn it off anytime.</small></span></label>` : "";
  el.innerHTML = sv.length ? `<h3 class="pf-h">Your saved stores · ${sv.length}</h3><div class="hm-svl">${sv.map(x=>{ const s = hmFromSaved(x), n = hmCarsAt(s).length; return `<div class="hm-sv"><button type="button" class="hm-r" data-hmsaved="${esc(x.k)}"><i class="hm-key" style="background:${(HM_CAT[s.cat]||HM_OTHER).c}" aria-hidden="true"></i><span><b>★ ${esc(x.nm)}</b><small>${esc(x.addr||"")}</small></span>${n ? `<em>${n} found</em>` : ""}</button><button type="button" class="hm-svx" data-hmunsave="${esc(x.k)}" aria-label="Remove ${esc(x.nm)} from saved stores" title="Remove">✕</button></div>` }).join("")}</div>`
    : `<p class="small muted hm-svempty">☆ Save stores you hunt at and they'll be listed here, on the map, and when you add a car.</p>`;
  el.insertAdjacentHTML("beforeend", share) }
function hmChips(){ const el = HM.node && HM.node.querySelector(".hm-chips"); if(!el) return; const here = hmCatsHere(); el.hidden = !here.length;
  el.innerHTML = Object.entries(HM_CAT).filter(([k]) => here.includes(k)).map(([k,c]) => `<button type="button" class="hm-chip" data-hmcat="${k}" aria-pressed="${!!HM.on[k]}"><i style="background:${c.c}" aria-hidden="true"></i>${esc(c.n)}</button>`).join("") + `<span class="hm-chip mine" aria-hidden="true"><i></i>Your finds</span>` }
function hmUI(){ hmChips(); hmSide(); const e = HM.node && HM.node.querySelector(".hm-err"); if(e){ e.hidden = !HM.err; e.querySelector("span").textContent = HM.err } hmPaint() }
function hmBuild(){
  const n = document.createElement("div"); n.className = "hm2";
  n.innerHTML = `<form class="hm-search" role="search" autocomplete="off"><label class="sr-only" for="hm-q">ZIP code, city or store</label>
      <select id="hm-c" aria-label="Country"><option value="US">United States</option></select>
      <input id="hm-q" type="search" enterkeyhint="search" placeholder="ZIP code, city or store" maxlength="80" spellcheck="false">
      <select id="hm-r" aria-label="How far to look">${[5,10,25,50].map(m=>`<option value="${m}"${m===HM.radius?" selected":""}>${m} mi</option>`).join("")}</select>
      <button class="btn" type="submit">Find stores</button></form>
    <div class="hm-chips" role="group" aria-label="Which stores to show"></div>
    <div class="hm-wrap2"><div class="hm-mapbox"><canvas class="hm-cv" tabindex="0" role="img" aria-label="Map of stores. Drag to move. Scroll, pinch or press plus and minus to zoom. Arrow keys move the map."></canvas>
        <div class="hm-zoom"><button type="button" data-hmz="1" aria-label="Zoom in">+</button><button type="button" data-hmz="-1" aria-label="Zoom out">−</button><button type="button" data-hmz="0" aria-label="Fit the map" title="Fit the map"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg></button><button type="button" data-hmadd aria-label="Add a store" title="Add a store">＋<small>Store</small></button></div>
        <div class="hm-loading">Loading map…</div><div class="hm-err" hidden><span></span> <button type="button" class="link" data-hmretry>Try again</button></div>
        <small class="hm-attr">Map © OpenStreetMap contributors, Natural Earth, US Census</small></div>
      <div class="hm-side" aria-live="polite"></div></div>
    <div class="hm-savedlist"></div>
    <details class="hm-guide"><summary>Where Hot Wheels hide in each store</summary><div class="hm-gtbl">
      ${[["Walmart","walmart"],["Walmart Neighborhood Market","walmart_nm"],["Target","target"],["Meijer","meijer"],["Fred Meyer","fredmeyer"],["Kroger, H‑E‑B, Hy‑Vee, Safeway and other grocery stores","grocery"],["Dollar General","dg"],["Dollar Tree","dt"],["Family Dollar","fd"],["Five Below","fb"],["CVS and Walgreens","rx"],["7-Eleven","sev"],["AutoZone","az"],["TJ Maxx, Marshalls, Ross and Burlington","offprice"],["Big Lots and Ollie's","closeout"],["Toy stores (outside the US)","toyshop"],["Smyths Toys","smyths"],["Canadian Tire","ctire"],["Argos","argos"],["Müller","mueller"],["Hypermarkets like Tesco, Carrefour, Kaufland and Soriana","hyper"]].map(([t,k])=>`<div><b>${t}</b><ul>${HM_TIPS[k].map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}
      <div class="hm-gall"><b>Store exclusives</b><ul>${Object.values(HM_EXCL).filter((v,i,a)=>a.indexOf(v)===i).map(x=>`<li>${esc(x)}</li>`).join("")}<li>Hobby Lobby and some Targets carry collector brands like Greenlight, Johnny Lightning and Tarmac Works.</li></ul></div>
      <div class="hm-gall"><b>Anywhere you hunt</b><ul>${HM_GENERAL.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div>
      <p class="small muted">From collector reports. Every store is set up a little differently.</p></details>`;
  HM.node = n; HM.cv = n.querySelector("canvas"); HM.ctx = HM.cv.getContext("2d"); hmBind(); hmChips(); hmSide() }
function hmStart(){ if(!HM.node || !HM.node.isConnected) return; hmResize();
  if(!HM.started){ HM.started = true; hmLoadOn().then(() => { if(prefs && prefs.huntCountry && prefs.huntCountry!=="US" && !HM.q){ hmCountrySelect(); hmSetCountry(prefs.huntCountry, true); const c = HM.node.querySelector("#hm-c"); if(c) c.value = HM.country } if(!HM.autoDone && prefs && prefs.huntQ && !HM.q){ HM.autoDone = true; if(prefs.huntR) HM.radius = +prefs.huntR || 10; const i = HM.node.querySelector("#hm-q"), r = HM.node.querySelector("#hm-r"); if(i) i.value = prefs.huntQ; if(r) r.value = String(HM.radius); hmSearch(prefs.huntQ) } }) } }
function hmMount(){ wfStart(); setTimeout(wfSync, 1500); const slot = document.getElementById("hm-slot"); if(!slot) return; if(!HM.node) hmBuild();
  slot.appendChild(HM.node); HM.pins = huntStores(own()).map(st => ({...st, x:hmMx(st.lng), y:hmMy(st.lat)}));
  if(HM.sel && HM.sel.type==="pin"){ const p = HM.pins.find(p=>p.key===HM.sel.s.key); HM.sel = p ? {type:"pin", s:p} : null }
  hmSide(); if(slot.closest("details").open) hmStart(); else hmPaint() }

/* ---------- store picker for "Where did you get it?" (add, scan and edit forms) ----------
   Same look as the hunting map: search a ZIP code, city or store, pick from the list, saved stores first. */
const SP_FILES = ["big","grocery","dollar","pharmacy","more"];
const spCtx = k => String(k).startsWith("wh") ? whereCtx(k) : (typeof buyCtx==="function" ? buyCtx(k) : null);
const spBox = k => document.getElementById(bp(k)+"-sp");
function spHtml(k, B){ return `<div class="sp c6" id="${bp(k)}-sp" data-sp="${esc(k)}">${spInner(k, B)}</div>` }
function spStore(B){ const ch = B.storeCh || (B.storeKey ? String(B.storeKey).split("|")[0] : "") || (hmChainOfName(B.store)||{}).ch || "";
  return {ch, nm:B.store, cat:HM_CHAIN[ch] ? HM_CHAIN[ch][0] : "other", lat:B.loc.lat, lng:B.loc.lng, x:hmMx(B.loc.lng), y:hmMy(B.loc.lat), st:B.storeAddr||"", city:"", s:"", zip:"", addr:B.storeAddr||""} }
function spInner(k, B){
  const K = esc(k), p = bp(k);
  if(B.spManual) return `<div class="sp-manual"><label>Store<input id="${p}-store" data-buyf="${K}|store" list="sourcelist" maxlength="40" autocomplete="off" value="${esc(B.store)}" placeholder="Target, Main St"></label>
    ${String(k).startsWith("wh") ? "" : `<div class="buypin"><div class="buypin-st" id="${p}-pinst" aria-live="polite">${pinStatus(k, B)}</div>
    <label>or paste a Google/Apple Maps link or "lat, lng"<input id="${p}-locin" data-buyloc="${K}" value="${esc(B.locIn)}" placeholder="33.74901, -84.38798" autocomplete="off" spellcheck="false"></label></div>`}
    <button type="button" class="link small" data-spback="${K}">← Pick from the store list instead</button></div>`;
  if(B.store && validLoc(B.loc)){ const s = spStore(B), c = HM_CAT[s.cat] || HM_OTHER, n = hmCarsAt(s).length, tk = hmTipKey({ch:s.ch, nm:s.nm});
    return `<div class="sp-sel"><i class="hm-key" style="background:${c.c}" aria-hidden="true"></i><div><span class="eyebrow">Found it at</span><b>${esc(B.store)}</b><small>${esc(B.storeAddr || `${B.loc.lat.toFixed(5)}, ${B.loc.lng.toFixed(5)}`)}</small>${n ? `<small class="sp-n">${n} car${n===1?"":"s"} from this store in your garage</small>` : ""}</div>
      <div class="sp-acts"><button type="button" class="btn line sm" data-spchange="${K}">Change</button>${hasAccount() ? `<button type="button" class="btn line sm" data-spsave="${K}" aria-pressed="${hmIsSaved(s)}">${hmIsSaved(s) ? "★ Saved" : "☆ Save"}</button>` : ""}</div></div>
      ${HM_TIPS[tk] ? `<details class="sp-tip"><summary>Where Hot Wheels are in this store</summary><ul>${HM_TIPS[tk].map(t=>`<li>${esc(t)}</li>`).join("")}</ul></details>` : ""}`; }
  return `<label class="sp-q">Find the store<input id="${p}-spq" data-spq="${K}" value="${esc(B.spQ||"")}" placeholder="ZIP code, city or store name" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>
    <div class="sp-res" id="${p}-spr" aria-live="polite">${spResults(k, B)}</div>
    <button type="button" class="link small" data-spmanual="${K}">Store not listed? Type it in</button>`;
}
function spRow(k, s, extra){ const c = HM_CAT[s.cat] || HM_OTHER;
  return `<button type="button" class="hm-r" data-sppick="${esc(k)}|${s.id >= 0 ? s.id : "k:" + hmKeyOf(s)}"><i class="hm-key" style="background:${c.c}" aria-hidden="true"></i><span><b>${hmIsSaved(s) ? "★ " : ""}${esc(s.nm)}</b><small>${esc(hmAddr(s) || s.st)}</small></span>${extra ? `<em>${extra}</em>` : ""}</button>` }
function spResults(k, B){
  if(B.spMsg) return `<p class="small muted sp-msg">${esc(B.spMsg)}</p>`;
  if(B.spRes) return B.spRes.length ? `<div class="hm-results sp-list">${B.spRes.map(s=>spRow(k, s, s.d != null && B.spOrigin ? hmFmtMi(s.d) : "")).join("")}</div>` : "";
  const sv = hmSaved(); return sv.length ? `<p class="hm-rhead">Your saved stores</p><div class="hm-results sp-list">${sv.map(x=>spRow(k, hmFromSaved(x), "")).join("")}</div>` : `<p class="small muted sp-msg">Type your ZIP code to list the stores near you.</p>`;
}
function spPaint(k, keepFocus){ const box = spBox(k), ctx = spCtx(k); if(!box || !ctx) return;
  if(keepFocus){ const r = document.getElementById(bp(k)+"-spr"); if(r){ r.innerHTML = spResults(k, ctx.B); return } }
  box.innerHTML = spInner(k, ctx.B) }
function spRepaintAll(){ document.querySelectorAll("[data-sp]").forEach(el=>spPaint(el.dataset.sp)) }
let spT = null;
async function spSearch(k, q){
  const ctx = spCtx(k); if(!ctx) return; const B = ctx.B; q = String(q||"").trim().slice(0,80); B.spQ = q;
  if(q.length < 2){ B.spRes = null; B.spMsg = ""; B.spOrigin = null; spPaint(k, true); return }
  B.spMsg = "Looking…"; spPaint(k, true);
  try{ await Promise.all([...SP_FILES.map(hmLoadFile), hmLoadWorld(), ...(HM.country!=="US" && HM_INTL[HM.country] ? [hmLoadFile("x-" + HM.country)] : [])]); const zips = await hmLoadZips(); if(B.spQ !== q) return;
    let origin = null; const zm = q.match(/^(\d{5})(?:-\d{4})?$/);
    /* a city abroad: "Dublin, Ireland", or any city when the Hunting Map is set to another country */
    const cm = q.match(/^(.+?),\s*([^,]{3,})$/), cn = cm && HM.world ? HM.world.countries.find(c => hmFold(c.n)===hmFold(cm[2])) : null;
    const abroad = cn && cn.a!=="US" ? hmWorldCity(cm[1], cn.a) : !zm && HM.country!=="US" ? hmWorldCity(q, HM.country) : null;
    if(abroad){ if(HM_INTL[abroad.a]){ await hmLoadFile("x-" + abroad.a); if(B.spQ !== q) return }
      const near = [...hmSaved().map(hmFromSaved), ...HM.stores.filter(s => s.cc===abroad.a)].map(s=>(s.d = hmMiles(abroad, s), s)).filter(s=>s.d<=15).sort((a,b)=>a.d-b.d).filter((s,i,a)=>a.findIndex(x=>hmKeyOf(x)===hmKeyOf(s))===i).slice(0, 25);
      B.spOrigin = abroad; B.spRes = near; B.spMsg = near.length ? "" : `No stores near ${abroad.n} in our list yet. Tap “Store not listed?” to type it in, or add it on the Hunting Map.`; spPaint(k, true); return }
    if(zm){ const z = zips.get(zm[1]); if(!z){ B.spRes = null; B.spMsg = `We couldn't find ZIP code ${zm[1]}.`; B.spOrigin = null; spPaint(k, true); return } origin = z }
    else if(/^\d{1,4}$/.test(q)){ B.spMsg = "Keep typing: a ZIP code has 5 digits."; B.spRes = null; spPaint(k, true); return }
    else { const m = q.toLowerCase().replace(/[.]/g,"").match(/^(.+?)(?:,?\s+([a-z]{2}))?$/), city = m && m[1].replace(/,$/,"").trim(), st = m && m[2] ? m[2].toUpperCase() : "";
      const hits = city ? [...zips.values()].filter(z => z.city && z.city.toLowerCase()===city && (!st || z.s===st)) : [];
      if(hits.length){ const by = {}; hits.forEach(z => (by[z.s] = by[z.s] || []).push(z)); const best = Object.values(by).sort((a,b)=>b.length-a.length)[0]; origin = {lat:best.reduce((a,z)=>a+z.lat,0)/best.length, lng:best.reduce((a,z)=>a+z.lng,0)/best.length} } }
    const svHits = hmSaved().filter(x => hmFold(x.nm + " " + (x.addr||"")).includes(hmFold(q))).map(hmFromSaved);
    if(!origin && !zm && HM.world){ const wc = hmWorldCity(q, HM.country!=="US" ? HM.country : null) || hmWorldCity(q, null); if(wc && !svHits.length && wc.a!=="US"){
      if(HM_INTL[wc.a]){ await hmLoadFile("x-" + wc.a); if(B.spQ !== q) return }
      const near = [...hmSaved().map(hmFromSaved), ...HM.stores.filter(s => s.cc===wc.a)].map(s=>(s.d = hmMiles(wc, s), s)).filter(s=>s.d<=15).sort((a,b)=>a.d-b.d).filter((s,i,a)=>a.findIndex(x=>hmKeyOf(x)===hmKeyOf(s))===i).slice(0, 25);
      B.spOrigin = wc; B.spRes = near; B.spMsg = near.length ? "" : `No stores near ${wc.n} in our list yet. Tap “Store not listed?” to type it in, or add it on the Hunting Map.`; spPaint(k, true); return } }
    let list;
    if(origin){ list = HM.stores.map(s => (s.d = hmMiles(origin, s), s)).filter(s => s.d <= 15).sort((a,b)=>a.d-b.d).slice(0, 25) }
    else { const words = q.toLowerCase().split(/[\s,]+/).filter(Boolean), ref = HM.origin || (B.loc && validLoc(B.loc) ? B.loc : null); list = [];
      for(const s of HM.stores){ const t = `${s.nm} ${s.st} ${s.city} ${s.s} ${s.zip}`.toLowerCase(); if(words.every(w=>t.includes(w))){ list.push(s); if(list.length >= 400) break } }
      list = [...svHits, ...list.filter(s=>!svHits.some(x=>hmKeyOf(x)===hmKeyOf(s)))];
      if(ref){ list.forEach(s => s.d = hmMiles(ref, s)); list.sort((a,b)=>a.d-b.d) } list = list.slice(0, 25) }
    B.spOrigin = origin || (HM.origin && !zm ? HM.origin : null); B.spRes = list; B.spMsg = list.length ? "" : origin ? "No stores in our list within 15 miles. Tap “Store not listed?” to type it in." : `Nothing matched “${q}”. Try a 5-digit ZIP code or a city like “Atlanta, GA”.`;
    spPaint(k, true);
  }catch(e){ B.spRes = null; B.spMsg = "The store list didn't load. Check your connection, or type the store in."; spPaint(k, true) }
}
function spPick(k, s){ const ctx = spCtx(k); if(!ctx) return; const B = ctx.B;
  B.store = String(s.nm||"").slice(0,40); B.loc = {lat:r5(+s.lat), lng:r5(+s.lng)}; B.storeKey = hmKeyOf(s); B.storeCh = s.ch||""; B.storeAddr = String(hmAddr(s) || s.st || "").slice(0,100);
  B.locIn = ""; B.locMsg = ""; B.spRes = null; B.spQ = ""; B.spMsg = ""; B.spManual = false;
  if(String(k).startsWith("wh:") && WH){ WH.open = ""; whereShow(); return } spPaint(k);
  const box = spBox(k), b = box && box.querySelector("[data-spchange]"); if(b) try{ b.focus({preventScroll:true}) }catch(e){} }
document.addEventListener("input", e=>{ const t = e.target; if(!t.dataset || t.dataset.spq == null) return; const k = t.dataset.spq; clearTimeout(spT); spT = setTimeout(()=>spSearch(k, t.value), 300) });
document.addEventListener("keydown", e=>{ const t = e.target; if(!t.dataset || t.dataset.spq == null || e.key!=="Enter") return; e.preventDefault(); clearTimeout(spT); spSearch(t.dataset.spq, t.value) });
document.addEventListener("click", e=>{ const t = e.target.closest && e.target.closest("[data-sppick],[data-spchange],[data-spmanual],[data-spback],[data-spsave]"); if(!t) return; const d = t.dataset;
  if(d.sppick){ const s = d.sppick, i = s.indexOf("|"), k = s.slice(0,i), v = s.slice(i+1);
    const st = v.startsWith("k:") ? (()=>{ const x = hmSaved().find(x=>x.k===v.slice(2)); return x && (HM.stores.find(t=>hmKeyOf(t)===x.k) || hmFromSaved(x)) })() : HM.stores[+v];
    if(st) spPick(k, st); return }
  const k = d.spchange || d.spmanual || d.spback || d.spsave, ctx = spCtx(k); if(!ctx) return; const B = ctx.B;
  if(d.spchange){ B.store = ""; B.loc = null; B.storeKey = ""; B.storeAddr = ""; B.storeCh = ""; spPaint(k); const q = document.getElementById(bp(k)+"-spq"); if(q) try{ q.focus({preventScroll:true}) }catch(err){} }
  else if(d.spmanual){ B.spManual = true; B.storeKey = ""; spPaint(k); const s = document.getElementById(bp(k)+"-store"); if(s) try{ s.focus({preventScroll:true}) }catch(err){} }
  else if(d.spback){ B.spManual = false; spPaint(k) }
  else if(d.spsave){ if(B.store && validLoc(B.loc)) hmToggleSave(spStore(B)) }
});

/* ---------- "Where did you find these?" after scanning, before the cars go to the garage ---------- */
let WH = null;
function whereCtx(k){ if(!WH) return null; if(k==="wh-all") return {B:WH.B};
  if(k.startsWith("wh:")){ const it = typeof trayItem==="function" && trayItem(k.slice(3)); return it ? {B: it.buy ??= newBuy()} : null } return null }
const whHas = B => !!B && (B.from==="person" || !!String(B.store||"").trim() || validLoc(B.loc));
function whereAsk(list, then){
  if(!list || !list.length || typeof hasAccount!=="function" || !hasAccount()) return false;
  const need = list.filter(it => !it.whereAsked && !whHas(it.buy));
  if(!need.length) return false;
  WH = {ids:list.map(it=>it.id), need:need.map(it=>it.id), then, mode:"all", from:"store", open:"", B:{...newBuy(), from:"store"}};
  const at = HM.addTo && Date.now() - HM.addTo.at < 3*3600e3 ? HM.addTo.s : null;   // started from "Scan new cards" on a store
  if(at) Object.assign(WH.B, {store:String(at.nm||"").slice(0,40), loc:{lat:r5(+at.lat), lng:r5(+at.lng)}, storeKey:hmKeyOf(at), storeAddr:String(hmAddr(at)||at.st||"").slice(0,100), storeCh:at.ch||""});
  whereShow(); return true }
function whereRow(it){ const B = it.buy ??= newBuy(), r = it.res || {}, on = WH.open===it.id;
  const has = B.store && validLoc(B.loc) ? `<b class="wh-st">${esc(B.store)}</b><small>${esc(B.storeAddr||"")}</small>` : B.store ? `<b class="wh-st">${esc(B.store)}</b>` : `<small class="muted">No store picked</small>`;
  return `<div class="wh-car${on ? " on" : ""}"><div class="wh-top">${it.photo ? `<img src="${esc(it.photo)}" alt="">` : ""}<div class="wh-nm"><b>${esc(r.relName || r.name || "Car")}</b>${has}</div><button type="button" class="btn line sm" data-whopen="${esc(it.id)}">${on ? "Done" : B.store ? "Change" : "Choose"}</button></div>
    ${on ? `<div class="wh-pick">${spHtml("wh:"+it.id, B)}</div>` : ""}</div>` }
function whereShow(){ let el = document.getElementById("where"); if(!WH){ el?.remove(); return }
  if(!el){ el = document.createElement("div"); el.id = "where"; el.className = "where"; document.body.appendChild(el) }
  const its = WH.ids.map(id=>trayItem(id)).filter(Boolean), n = its.length, multi = n > 1;
  el.innerHTML = `<div class="where-card" role="dialog" aria-modal="true" aria-labelledby="wh-t"><div class="where-h"><div><span class="eyebrow">Before they go in your garage</span><h2 id="wh-t">Where did you find ${multi ? `these ${n} cars` : "this car"}?</h2></div></div>
    <div class="where-b">
      <div class="buyseg" role="group" aria-label="Where did you get them?"><button type="button" data-whfrom="store" aria-pressed="${WH.from==="store"}">In a store</button><button type="button" data-whfrom="person" aria-pressed="${WH.from==="person"}">From another collector</button></div>
      ${WH.from==="person" ? `<label class="sp-q">Who / where <span class="opt">(optional)</span><input id="wh-who" maxlength="40" value="${esc(WH.who||"")}" placeholder="@handle, swap meet, eBay seller" autocomplete="off"></label>`
      : `${multi ? `<div class="buyseg wh-mode" role="group" aria-label="One store or each car"><button type="button" data-whmode="all" aria-pressed="${WH.mode==="all"}">Same store for all ${n}</button><button type="button" data-whmode="each" aria-pressed="${WH.mode==="each"}">Pick for each car</button></div>` : ""}
        ${WH.mode==="all" || !multi ? `${spHtml("wh-all", WH.B)}<label class="sp-q">Spot in the store<select id="wh-spot"><option value="">Not noted</option>${SPOTS.map(s=>`<option ${WH.spot===s?"selected":""}>${esc(s)}</option>`).join("")}</select></label>
          ${multi ? `<div class="wh-thumbs">${its.map(it=>it.photo ? `<img src="${esc(it.photo)}" alt="${esc((it.res||{}).name||"")}">` : "").join("")}</div>` : ""}`
        : `<div class="wh-list">${its.map(whereRow).join("")}</div>`}`}
    </div>
    ${WH.from==="store" ? `<label class="wf-share wh-share"><input type="checkbox" id="wh-share" ${prefs && prefs.shareFinds===false ? "" : "checked"}> <span><b>Add to each car's “Where to find it” map</b><small>Anonymous: store and month only, no prices.</small></span></label>` : ""}
    <div class="where-f"><button type="button" class="btn" data-whok>${multi ? `Save and add ${n} cars` : "Save and add"}</button><button type="button" class="btn line" data-whskip>Skip for now</button></div></div>`;
  document.body.classList.add("where-on") }
function whereClose(){ WH = null; document.getElementById("where")?.remove(); document.body.classList.remove("where-on") }
function whereApply(){ const its = WH.ids.map(id=>trayItem(id)).filter(Boolean), spot = (document.getElementById("wh-spot")||{}).value ?? WH.spot ?? "";
  for(const it of its){ const B = it.buy ??= newBuy(); it.whereAsked = true;
    if(WH.from==="person"){ B.from = "person"; B.who = String((document.getElementById("wh-who")||{}).value || WH.who || "").slice(0,40); B.store = ""; B.loc = null; B.storeKey = ""; if(B.paidAuto){ B.paidAuto = false } continue }
    B.from = "store";
    if(WH.mode==="all" || its.length===1){ const A = WH.B; if(WH.need.includes(it.id) || A.store){ Object.assign(B, {store:A.store||"", loc:A.loc ? {...A.loc} : null, storeKey:A.storeKey||"", storeAddr:A.storeAddr||"", storeCh:A.storeCh||"", locIn:A.locIn||""}); if(spot) B.spot = spot } } } }
document.addEventListener("click", e=>{ const t = e.target.closest && e.target.closest("#where button"); if(!t || !WH) return; const d = t.dataset;
  if(d.whfrom){ WH.who = (document.getElementById("wh-who")||{}).value ?? WH.who; WH.from = d.whfrom; whereShow(); return }
  if(d.whmode){ WH.spot = (document.getElementById("wh-spot")||{}).value ?? WH.spot; WH.mode = d.whmode; WH.open = ""; whereShow(); return }
  if(d.whopen){ WH.open = WH.open===d.whopen ? "" : d.whopen; whereShow(); const q = document.getElementById(bp("wh:"+d.whopen)+"-spq"); if(q) try{ q.focus({preventScroll:true}) }catch(err){} return }
  if(d.whok != null){ if(WH.from==="store" && (WH.mode==="all" || WH.ids.length===1) && !WH.B.store){ toast("Pick a store, or tap Skip for now."); document.getElementById(bp("wh-all")+"-spq")?.focus(); return }
    const shb = document.getElementById("wh-share"); if(shb && hasAccount() && col && prefs.shareFinds !== shb.checked){ prefs = {...prefs, shareFinds:shb.checked}; col.doc("_prefs").set(prefs).catch(()=>{}) }
    whereApply(); const then = WH.then; whereClose(); setTimeout(wfSync, 4000); if(typeof renderTray==="function") renderTray(); toast("Saved where you found them"); then && then(); return }
  if(d.whskip != null){ const its = WH.ids.map(id=>trayItem(id)).filter(Boolean); its.forEach(it=>it.whereAsked = true); const then = WH.then; whereClose(); then && then(); return }
});
document.addEventListener("input", e=>{ if(WH && e.target.id==="wh-who") WH.who = e.target.value });
document.addEventListener("change", e=>{ if(WH && e.target.id==="wh-spot") WH.spot = e.target.value });
document.addEventListener("keydown", e=>{ if(WH && e.key==="Escape"){ e.preventDefault(); whereClose() } });
document.addEventListener("input", e=>{ const t = e.target; if(!t.dataset || !t.dataset.buyf || !t.dataset.buyf.startsWith("wh")) return; const s = t.dataset.buyf, i = s.lastIndexOf("|"), ctx = whereCtx(s.slice(0,i)); if(ctx && s.slice(i+1)==="store"){ ctx.B.store = t.value; ctx.B.storeKey = ""; ctx.B.loc = null } });

/* ---------- where to find a car: how to get it, plus a map of stores where collectors found or saw it ----------
   Shared in posts/<uid>/finds/all = {items:[{n, l, set, k, nm, lat, lng, a, m, f}]} (each collector writes only their own): chain stores only (never your own pins),
   no prices, month only, no names shown. Only shared when the collector turns sharing on. */
const WF = {docs:{}, subs:new Set(), last:"", t:0};
const wfPath = id => `posts/${id}/finds/all`;
function wfRefresh(){ clearTimeout(WF.t); WF.t = setTimeout(()=>{ if(typeof detail!=="undefined" && detail && typeof renderDetail==="function") renderDetail(); if(HM.node && HM.node.isConnected){ hmSide(); hmPaint() } }, 150) }
function wfStart(){ if(typeof db==="undefined" || !db) return;
  const ids = new Set([...Object.keys(typeof postsDocs!=="undefined" ? postsDocs||{} : {}), ...(uid ? [uid] : [])]);
  for(const id of ids){ if(WF.subs.has(id)) continue; WF.subs.add(id);
    try{ db.doc(wfPath(id)).onSnapshot(d=>{ const x = d && d.exists !== false && d.data ? d.data() : null; if(x && Array.isArray(x.items)) WF.docs[id] = x; else delete WF.docs[id]; wfRefresh() }, ()=>{}) }catch(e){} } }
const wfShareOn = () => typeof prefs!=="undefined" && prefs && prefs.shareFinds===true;
const wfMonth = c => String(c.gotAt || (c.addedAt ? localDate(new Date(c.addedAt)) : "")).slice(0,7);
function wfMine(){ return own().filter(c => c.buyFrom!=="person" && c.storeKey && validLoc(c.loc)).map(c => { const ch = String(c.storeKey).split("|")[0];
    return HM_CHAIN[ch] && ch!=="custom" ? {n:castName(c), l:c.line||"", set:c.set||"", k:c.storeKey, nm:String(c.source||"").slice(0,40), lat:r5(c.loc.lat), lng:r5(c.loc.lng), a:String(c.storeAddr||"").replace(/^[^,]*,\s*/,"").slice(0,60), m:wfMonth(c), f:"found"} : null }).filter(Boolean) }
function wfSync(){ if(typeof db==="undefined" || !db || !uid || typeof hasAccount!=="function" || !hasAccount()) return;
  const prev = (WF.docs[uid]||{}).items || [], seen = prev.filter(x=>x.f==="seen"), items = wfShareOn() ? [...wfMine(), ...seen].slice(-400) : seen.slice(-100);
  const sig = JSON.stringify(items); if(sig===WF.last || sig===JSON.stringify(prev)){ WF.last = sig; return } WF.last = sig;
  if(typeof postsDocs!=="undefined" && postsDocs && !postsDocs[uid]) db.doc("posts/"+uid).set({items:[]}).catch(()=>{});   // so other collectors can find your finds list
  db.doc(wfPath(uid)).set({items, at:Date.now()}).catch(()=>{ WF.last = "" }) }
function wfSetShare(on){ if(!col || !hasAccount()) return; prefs = {...prefs, shareFinds:!!on}; col.doc("_prefs").set(prefs).catch(()=>{}); WF.last = ""; wfSync(); hmSide() }
function wfFor(c){ const out = []; for(const [who, d] of Object.entries(WF.docs)) for(const x of (d.items||[])) if(sameCar({name:x.n, line:x.l}, c)) out.push({...x, who}); return out }
function wfStores(c){ const m = new Map(); for(const x of wfFor(c)){ const e = m.get(x.k) || {k:x.k, ch:String(x.k).split("|")[0], nm:x.nm, lat:x.lat, lng:x.lng, a:x.a, found:0, seen:0, last:"", who:new Set()}; e[x.f==="seen" ? "seen" : "found"]++; e.who.add(x.who); if(x.m > e.last) e.last = x.m; m.set(x.k, e) }
  return [...m.values()].map(e=>({...e, n:e.who.size, cat:HM_CHAIN[e.ch] ? HM_CHAIN[e.ch][0] : "other", x:hmMx(e.lng), y:hmMy(e.lat), st:e.a, id:-1})).sort((a,b)=>b.last.localeCompare(a.last) || b.found-a.found) }
const wfMonthName = m => { if(!m) return ""; const [y, mo] = m.split("-"); return new Date(+y, +mo-1, 1).toLocaleDateString(undefined, {month:"short", year:"numeric"}) };
/* how to get it, from what's printed on the card and the line */
function wfHow(c){ const t = [c.name, c.set, c.sub, c.line, c.note, c.cardVar].filter(Boolean).join(" ").toLowerCase(), l = String(c.line||"").toLowerCase(), q = encodeURIComponent(castName(c));
  const creations = {label:"Mattel Creations", url:`https://creations.mattel.com/search?q=${q}`};
  if(/elite ?64|red ?line club|\brlc\b|creations|convention|nationals/.test(t) || l==="rlc") return {where:"Online drop", text:"Sold online through Mattel Creations (and the Red Line Club), not in stores. Drops sell out fast, so set a reminder for the sale time. After that, collectors resell it.", shop:creations};
  if(/7-?eleven/.test(t)) return {where:"7-Eleven exclusive", text:"Only at participating 7-Eleven, Speedway and Stripes stores (and 7-Eleven's online shop) while supplies last.", chips:["sev"]};
  if(/red edition/.test(t)) return {where:"Target exclusive", text:"A Red Edition car: only at Target, in mainline cases.", chips:["tg"]};
  if(/zamac/.test(t)) return {where:"Walmart exclusive", text:"A ZAMAC (unpainted) edition: only at Walmart, in mainline cases.", chips:["wm"]};
  if(/silver series/.test(t)) return {where:"Walmart (Silver Series)", text:"Silver Series cases go to Walmart in the US. Look for the separate Silver Series display, not the mainline pegs.", chips:["wm"]};
  if(/kroger/.test(t)) return {where:"Kroger exclusive", text:"Only at Kroger and Kroger-owned stores (Fry's, Ralphs, King Soopers and others).", chips:["groc"]};
  if(/dollar general/.test(t)) return {where:"Dollar General exclusive", text:"Only at Dollar General.", chips:["disc"]};
  if(/dollar tree|family dollar/.test(t)) return {where:"Dollar Tree / Family Dollar", text:"Only at Dollar Tree and Family Dollar.", chips:["disc"]};
  if(/walgreens/.test(t)) return {where:"Walgreens exclusive", text:"Only at Walgreens.", chips:["rx"]};
  if(tier(c.line)==="prem") return {where:"Premium", text:"Premium cars (Car Culture, Boulevard, Pop Culture and similar) are at Walmart and Target, usually on a separate premium display, plus hobby shops. Some show up later at TJ Maxx, Marshalls and Ross.", chips:["wm","tg","more"]};
  if(c.th || c.sth || /treasure hunt/.test(t)) return {where:"Mainline chase", text:"Treasure Hunts are packed at random in mainline cases, so any store with Hot Wheels pegs can have one. Fresh cases at Walmart and Target are the best bet.", chips:["wm","tg","groc"]};
  return {where:"Mainline", text:"Mainline cars are on the pegs at Walmart, Target, grocery stores, dollar stores and pharmacies. Check the stores below where collectors found it.", chips:["wm","tg","groc"]} }
function wfHtml(c){ wfStart(); if(!c || !c.name) return ""; const h = wfHow(c), st = wfStores(c), K = esc(JSON.stringify({name:c.name, cast:c.cast||"", line:c.line||"", set:c.set||"", sub:c.sub||"", note:c.note||""}));
  return `<div class="wf"><div class="wf-h"><span class="eyebrow">Where to find it</span><b>${esc(h.where)}</b></div><p>${esc(h.text)}</p>
    ${st.length ? `<p class="wf-n">Collectors found it at <b>${st.length} store${st.length===1?"":"s"}</b>:</p><ul class="wf-list">${st.slice(0,3).map(s=>`<li><i class="hm-key" style="background:${(HM_CAT[s.cat]||HM_OTHER).c}"></i><span><b>${esc(s.nm)}</b><small>${esc([s.a, s.last ? (s.found ? "found " : "seen ") + wfMonthName(s.last) : ""].filter(Boolean).join(" · "))}</small></span></li>`).join("")}</ul>` : `<p class="wf-n small muted">No collector has shared where they found this one yet.</p>`}
    <div class="hm-acts"><button type="button" class="btn sm" data-wfmap="${K}">📍 See where to find it on the map</button>${h.shop ? `<a class="btn line sm" href="${esc(h.shop.url)}" target="_blank" rel="noopener">Shop on ${esc(h.shop.label)} ↗</a>` : ""}</div></div>` }
function wfOpen(c){ HM.car = c; HM.sel = null; HM.adding = null; if(typeof closeDetail==="function") closeDetail();
  const h = wfHow(c); (h.chips||[]).forEach(k=>HM.on[k] = true); huntOpen = true; go("garage");
  setTimeout(()=>{ const d = document.querySelector("details[data-hunt]"); if(d){ d.open = true; hmStart(); hmLoadOn().then(()=>{ hmCarFit(); hmChips(); hmSide(); hmPaint() }); d.scrollIntoView({behavior:"smooth", block:"start"}) } }, 80) }
function hmCarFit(){ if(!HM.car || !HM.w) return; const st = wfStores(HM.car); if(HM.origin){ hmFitMiles(HM.origin.lat, HM.origin.lng, Math.max(HM.radius, 25)); return } if(st.length) hmFitList(st); else hmFitCountry(HM.country) }
function hmCarPanel(){ const c = HM.car, h = wfHow(c), st = wfStores(c), o = HM.origin;
  const rows = st.map(s=>({...s, d:o ? hmMiles(o, s) : null})).sort((a,b)=> a.d!=null && b.d!=null ? a.d-b.d : 0);
  return `<div class="hm-carp"><div class="hm-carh"><span class="eyebrow">Finding</span><b>${esc(c.name)}</b><small class="muted">${esc([lineName(c.line), c.set].filter(Boolean).join(" · "))}</small><button type="button" class="link small" data-wfclear>✕ Stop finding this car</button></div>
    <p class="hm-how"><b>${esc(h.where)}</b>${esc(h.text)}</p>${h.shop ? `<a class="btn line sm" href="${esc(h.shop.url)}" target="_blank" rel="noopener">Shop on ${esc(h.shop.label)} ↗</a>` : ""}
    ${rows.length ? `<p class="hm-rhead">Found or seen at ${rows.length} store${rows.length===1?"":"s"}</p><div class="hm-results" role="list">${rows.map(s=>`<button type="button" role="listitem" class="hm-r" data-wfstore="${esc(s.k)}"><i class="hm-key wf-key" style="background:${(HM_CAT[s.cat]||HM_OTHER).c}" aria-hidden="true"></i><span><b>${esc(s.nm)}</b><small>${esc([s.a, `${s.found ? s.found + " found" : ""}${s.found && s.seen ? ", " : ""}${s.seen ? s.seen + " seen" : ""}`, wfMonthName(s.last)].filter(Boolean).join(" · "))}</small></span>${s.d!=null ? `<em>${hmFmtMi(s.d)}</em>` : ""}</button>`).join("")}</div>`
      : `<p class="small muted" style="margin:0">No sightings shared yet. Type your ZIP code above to see the stores near you that carry this kind of car, and tap a store to log it if you spot it.</p>`}</div>` }
/* sighting markers on the map: a green tag with how many collectors */
function wfDraw(ctx, X, Y, w, h, land, acc){ if(!HM.car) return; for(const s of wfStores(HM.car)){ const x = X(s.x), y = Y(s.y); if(x<-20||y<-30||x>w+20||y>h+20) continue;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-8, y-12); ctx.arc(x, y-17, 9.5, Math.PI*.8, Math.PI*.2); ctx.closePath(); ctx.fillStyle = acc; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = land; ctx.stroke();
  ctx.fillStyle = land; ctx.font = `700 10.5px ${getComputedStyle(HM.node).getPropertyValue("--mono")}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(s.found + s.seen), x, y-17) } }
function wfSeen(s){ if(!HM.car || !hasAccount()){ toast("Sign in to log a sighting."); return } const ch = s.ch || "";
  if(!HM_CHAIN[ch] || ch==="custom"){ toast("Sightings can only be logged at stores from the store list."); return }
  const prev = (WF.docs[uid]||{}).items || [], item = {n:castName(HM.car), l:HM.car.line||"", set:HM.car.set||"", k:hmKeyOf(s), nm:String(s.nm||"").slice(0,40), lat:r5(+s.lat), lng:r5(+s.lng), a:[s.city, s.s].filter(Boolean).join(", ").slice(0,60), m:localDate(new Date()).slice(0,7), f:"seen"};
  const items = [...prev.filter(x=>!(x.f==="seen" && x.k===item.k && x.n===item.n)), item].slice(-400); WF.docs[uid] = {items}; WF.last = JSON.stringify(items);
  if(typeof postsDocs!=="undefined" && postsDocs && !postsDocs[uid]) db.doc("posts/"+uid).set({items:[]}).catch(()=>{});
  db.doc(wfPath(uid)).set({items, at:Date.now()}).then(()=>toast(`Logged: ${HM.car.name} seen at ${s.nm}. Thanks for helping other collectors!`)).catch(()=>toast("Couldn't save. Try again.")); hmSide(); hmPaint() }
document.addEventListener("click", e=>{ const t = e.target.closest && e.target.closest("[data-wfmap],[data-wfclear],[data-wfstore],[data-wfseen],[data-wfshare]"); if(!t) return; const d = t.dataset;
  if(d.wfmap){ try{ wfOpen(JSON.parse(d.wfmap)) }catch(err){} return }
  if(d.wfclear != null){ HM.car = null; HM.sel = null; hmSide(); hmPaint(); return }
  if(d.wfstore){ const s = wfStores(HM.car||{}).find(x=>x.k===d.wfstore); if(s){ const real = HM.stores.find(x=>hmKeyOf(x)===s.k); hmSelect({type:"store", s:real || {...s, st:s.a, city:"", s:"", zip:""}}, true) } return }
  if(d.wfseen != null){ const s = HM.sel && HM.sel.s; if(s) wfSeen(s); return }
  if(d.wfshare != null){ wfSetShare(!wfShareOn()); return }
});
