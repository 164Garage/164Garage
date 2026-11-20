"""Builds the public site's index.html from the Claude-hosted page.

Usage: python3 tools/build_index.py <claude-page.html> [out=index.html]

The Claude page is the same app; this adds the website <head>, swaps the Claude login
box for email / Google log-in, and adds a Log out button. Every replacement must match
exactly once, so a changed page fails loudly instead of building a broken site."""
import sys, re

src = open(sys.argv[1], encoding="utf-8").read()
out_path = sys.argv[2] if len(sys.argv) > 2 else "index.html"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>1:64 Garage</title>
<meta name="description" content="Track your Hot Wheels, Matchbox, Mini GT and Majorette collection. Every drop, real-world prices, and a garage to show it off.">
<meta property="og:title" content="1:64 Garage">
<meta property="og:description" content="Scan it. Value it. Park it in your garage. The collector site for 1:64 diecast.">
<meta name="theme-color" content="#2b5c8a">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/runtime.js"></script>
</head>
<body>
"""

def rep(s, old, new, count=1):
    n = s.count(old)
    if n != count:
        sys.exit(f"build_index: expected {count} match(es), found {n}: {old[:90]!r}")
    return s.replace(old, new)

s = src
s = rep(s, "<title>1:64 Garage</title>\n", "")

# log-in box: email link + Google instead of "log in with your Claude account"
s = rep(s,
  """<h2>Log in</h2>
      <p class="muted">Log in with the account you use for Claude. It's free, and the site remembers you every time you come back.</p>`}
      <a class="btn" href="https://claude.ai/login" target="_blank" rel="noopener">Log in</a>
      <p class="small muted">Once you've logged in, come back here and tap <button class="link" data-reload="1">Refresh</button>. Your username and garage load automatically.</p>""",
  """<h2>Log in or sign up</h2>
      <p class="muted">It's free. Enter your email and we'll send you a link: tap it and you're in. No password to remember.</p>`}
      <form class="form" id="emailform" autocomplete="on">
        <label class="c6">Email<input id="l-email" type="email" required autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com"></label>
        <div class="c6"><button class="btn" type="submit">Email me a log-in link</button></div>
      </form>
      ${loginMsg?`<p class="loginmsg">${loginMsg}</p>`:""}
      ${siteConf.google?`<p class="small muted" style="margin:6px 0">or</p><button class="btn line" data-google="1">Continue with Google</button>`:""}
      <p class="small muted">Your email stays private. Collectors only see the display name you pick.</p>""")

# Log out, once you're logged in
s = rep(s,
  """<div class="ctas"><button class="btn" data-go="myprofile">Go to my profile</button><button class="btn line" data-go="garage">My Garage</button></div>""",
  """<div class="ctas"><button class="btn" data-go="myprofile">Go to my profile</button><button class="btn line" data-go="garage">My Garage</button></div>
      <p class="small muted"><button class="link" data-logout="1">Log out</button></p>""")
s = rep(s,
  """<p class="muted" style="margin:0">New to 1:64 Garage?</p>
      <button class="btn line" data-go="myprofile">Create an account</button>""",
  """<p class="muted" style="margin:0">New to 1:64 Garage?</p>
      <button class="btn line" data-go="myprofile">Create an account</button>
      <p class="small muted"><button class="link" data-logout="1">Log out</button></p>""")
s = rep(s, "Log out of Claude and log back in with the account you used to sign up, then refresh this page.",
        "Log out, then log back in with the email you used to sign up.")

# button + form handlers
s = rep(s, "  if(b.dataset.reload){ location.reload(); return }",
  """  if(b.dataset.reload){ location.reload(); return }
  if(b.dataset.logout){ forgetMe(); window.__auth?.signOut(); return }
  if(b.dataset.google){ window.__auth?.google().catch(e=>toast(e.message||"Couldn't open Google")); return }""")
s = rep(s, """  if(f.id==="loginform"){""",
  """  if(f.id==="emailform"){
    const em = $("#l-email").value.trim(); if(!em) return; document.activeElement.blur();
    loginMsg = "Sending…"; render();
    try{ await window.__auth.emailLink(em); loginMsg = `Check <b>${esc(em)}</b> for your log-in link (look in spam too). Open it on this device.` }
    catch(err){ loginMsg = /rate|seconds/i.test(err?.message||"") ? "Too many tries. Wait a minute, then send the link again." : "Couldn't send the link. Check the email address and try again." }
    render(); return }
  if(f.id==="loginform"){""")
s = rep(s, '"loginform","ggform"', '"loginform","emailform","ggform"')

open(out_path, "w", encoding="utf-8").write(HEAD + s + "\n</body>\n</html>\n")
print("built", out_path, len(HEAD + s), "bytes")
