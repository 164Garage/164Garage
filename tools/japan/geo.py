import json, os, re, unicodedata, sys
API="/tmp/ja2/api/ja"
KN="〇一二三四五六七八九"
def kan(n):
    n=int(n)
    if n<10: return KN[n]
    if n<20: return "十"+(KN[n%10] if n%10 else "")
    if n<100: return KN[n//10]+"十"+(KN[n%10] if n%10 else "")
    return str(n)
prefs=sorted(os.listdir(API), key=len, reverse=True)
cache={}
def cities(p):
    return sorted([f[:-5] for f in os.listdir(f"{API}/{p}")], key=len, reverse=True)
def towns(p,c):
    k=(p,c)
    if k not in cache: cache[k]=json.load(open(f"{API}/{p}/{c}.json"))
    return cache[k]
def norm(s):
    s=unicodedata.normalize("NFKC",s).replace(" ","").replace("　","")
    s=s.replace("ヶ","ケ").replace("ヵ","カ").replace("−","-").replace("ー","ー")
    return s
def geocode(addr):
    a=norm(addr)
    p=next((p for p in prefs if a.startswith(p)), None)
    if not p: return None,"nopref"
    r=a[len(p):]
    cs=cities(p)
    c=next((c for c in cs if r.startswith(norm(c))), None)
    if not c:
        # 熊本市西区 style without pref handled by caller; try county-less match
        c=next((c for c in cs if norm(c).split("郡")[-1] and r.startswith(norm(c).split("郡")[-1])), None)
        if not c: return None,"nocity"
        r=r[len(norm(c).split("郡")[-1]):]
    else: r=r[len(norm(c)):]
    r=re.sub(r"^(大字|字)","",r)
    T=towns(p,c)
    # candidates: town + kanji chome
    m=re.match(r"^(\D+?)(\d+)(?:丁目|-|条|$|番|号)?",r)
    best=None
    def tn(t): return norm(t["town"]).replace("大字","")
    # 1) exact town incl. chome in kanji: e.g. 太平4- -> 太平四丁目
    if m:
        base,num=m.group(1),m.group(2)
        base2=re.sub(r"(\d+)",lambda x:kan(x.group(1)),base)
        for cand in (base2+kan(num)+"丁目", base+kan(num)+"丁目", base2+kan(num)+"条"):
            hit=[t for t in T if tn(t).startswith(cand)]
            if hit: best=hit[0]; break
        # Sapporo style 北7条東9-.. -> 北七条東九丁目
        if not best:
            r2=re.sub(r"(\d+)(条)",lambda x:kan(x.group(1))+x.group(2),r)
            m2=re.match(r"^(\D+?)(\d+)",r2)
            if m2:
                cand=m2.group(1)+kan(m2.group(2))+"丁目"
                hit=[t for t in T if tn(t)==cand]
                if hit: best=hit[0]
    if not best:
        # 2) longest town name that the remainder starts with
        hit=sorted([t for t in T if tn(t) and r.startswith(tn(t))], key=lambda t:-len(tn(t)))
        if hit: best=hit[0]
    if not best and m:
        base=m.group(1)
        hit=[t for t in T if tn(t).startswith(base)]
        if hit:
            la=sum(t["lat"] for t in hit)/len(hit); lo=sum(t["lng"] for t in hit)/len(hit)
            return (la,lo,p,c),"townbase"
    if best: return (best["lat"],best["lng"],p,c),"town"
    la=sum(t["lat"] for t in T)/len(T); lo=sum(t["lng"] for t in T)/len(T)
    return (la,lo,p,c),"city"
if __name__=="__main__":
    out=[]; grp=None; stat={}
    for line in open("stores.txt"):
        line=line.strip()
        if not line: continue
        if line.startswith("#"): grp=line[1:].split("|"); continue
        n,addr=line.split("|")
        if addr.startswith("熊本市"): addr="熊本県"+addr
        g,how=geocode(addr); stat[how]=stat.get(how,0)+1
        if how in ("city","nocity","nopref","townbase"): print(how, n, addr, g and g[2:])
        if g: out.append(dict(k=grp[0], n=n, lat=g[0], lng=g[1], pref=g[2], city=g[3], st=addr, how=how))
    json.dump(out, open("geo.json","w"), ensure_ascii=False, indent=0)
    print(stat, len(out))
