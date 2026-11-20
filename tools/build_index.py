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
<meta name="theme-color" content="#13233d">
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="canonical" href="https://www.1-64garage.com/">
<meta property="og:url" content="https://www.1-64garage.com/">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/runtime.js"></script>
<style>.pwwrap{position:relative;display:block}.pwwrap input{width:100%;padding-right:64px}.pweye{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--accent);font:600 13px inherit;padding:6px 8px;cursor:pointer}</style>
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

# log-in box: username/email + password, create account, forgot password (instead of "log in with Claude")
s = rep(s,
  """<h2>Log in</h2>
      <p class="muted">Log in with the account you use for Claude. It's free, and the site remembers you every time you come back.</p>`}
      <a class="btn" href="https://claude.ai/login" target="_blank" rel="noopener">Log in</a>
      <p class="small muted">Once you've logged in, come back here and tap <button class="link" data-reload="1">Refresh</button>. Your username and garage load automatically.</p>""",
  """<h2>${authTab==="signup"?"Create your account":authTab==="forgot"?"Reset your password":"Log in"}</h2>
      <p class="muted">${authTab==="signup"?"It's free. You stay logged in on this device until you log out.":authTab==="forgot"?"Enter your email and we'll send a link. Tap it, then pick a new password.":"Use your username (or email) and password. You stay logged in until you log out."}</p>`}
      ${authTab==="signup" ? `<form class="form" id="signupform" autocomplete="on">
        <label class="c6">Username<span class="uin"><i>@</i><input id="su-user" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_.]{3,20}" autocapitalize="none" autocomplete="username" spellcheck="false" placeholder="pick a username" title="3–20 letters, numbers, _ or ."></span></label>
        <label class="c6">Email <span style="font-weight:500">(private, for password resets)</span><input id="su-email" type="email" required autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com"></label>
        <label class="c6">Password <span style="font-weight:500">(8+ characters)</span><span class="pwwrap"><input id="su-pass" type="password" required minlength="8" autocomplete="new-password"><button type="button" class="pweye" data-pweye="su-pass" aria-label="Show password">Show</button></span></label>
        <div class="c6"><button class="btn" type="submit">Create account</button></div>
      </form>
      ${loginMsg?`<p class="loginmsg">${loginMsg}</p>`:""}
      <p class="small muted">Already have an account? <button class="link" data-authtab="login">Log in</button></p>`
      : authTab==="forgot" ? `<form class="form" id="forgotform" autocomplete="on">
        <label class="c6">Email<input id="fp-email" type="email" required autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com"></label>
        <div class="c6"><button class="btn" type="submit">Email me a reset link</button></div>
      </form>
      ${loginMsg?`<p class="loginmsg">${loginMsg}</p>`:""}
      <p class="small muted"><button class="link" data-authtab="login">Back to log in</button></p>`
      : `<form class="form" id="pwloginform" autocomplete="on">
        <label class="c6">Username or email<input id="l-who" required autocapitalize="none" autocomplete="username" spellcheck="false" placeholder="Your username" value="${esc(rm?.u||"")}"></label>
        <label class="c6">Password<span class="pwwrap"><input id="l-pass" type="password" required autocomplete="current-password"><button type="button" class="pweye" data-pweye="l-pass" aria-label="Show password">Show</button></span></label>
        <div class="c6"><button class="btn" type="submit">Log in</button></div>
      </form>
      ${loginMsg?`<p class="loginmsg">${loginMsg}</p>`:""}
      <p class="small muted"><button class="link" data-authtab="forgot">Forgot password?</button> · New here? <button class="link" data-authtab="signup">Create an account</button></p>`}
      ${siteConf.google?`<p class="small muted" style="margin:6px 0">or</p><button class="btn line" data-google="1">Continue with Google</button>`:""}""")
s = rep(s, "let db=null, user=null, uid=null,", "let authTab=\"login\", db=null, user=null, uid=null,")
s = rep(s, '''value="${esc(p.username||"")}" placeholder="aidan164"''', '''value="${esc(p.username||window.__signupName||"")}" placeholder="aidan164"''')

# Log out, once you're logged in
s = rep(s,
  """<div class="ctas"><button class="btn" data-go="myprofile">Go to my profile</button><button class="btn line" data-go="garage">My Garage</button></div>""",
  """<div class="ctas"><button class="btn" data-go="myprofile">Go to my profile</button><button class="btn line" data-go="garage">My Garage</button></div>
      <form class="form" id="pwsetform" autocomplete="on" style="margin-top:12px"><input type="text" autocomplete="username" value="${esc(uname(uid))}" hidden>
        <label class="c6">${pwPrompt()?"Pick a new password":"Password"} <span style="font-weight:500">(8+ characters, so you can log in with @${esc(uname(uid)||"your username")})</span><input id="ps-pass" type="password" required minlength="8" autocomplete="new-password"></label>
        <div class="c6"><button class="btn line sm" type="submit">${pwPrompt()?"Save new password":"Set or change password"}</button></div>
      </form>
      ${loginMsg?`<p class="loginmsg">${loginMsg}</p>`:""}
      <p class="small muted"><button class="link" data-logout="1">Log out</button></p>""")
# logged in but no profile yet (just signed up): finish the account instead of a second log-in form
s = rep(s,
  """      <h2>Log in to your account</h2>
      <form class="form" id="loginform" autocomplete="on">
        <label class="c6">Username<span class="uin"><i>@</i><input id="l-user" required autocapitalize="none" autocomplete="username" spellcheck="false" placeholder="yourusername" value="${esc(rm?.u||"")}"></span></label>
        <div class="c6"><button class="btn" type="submit">Log in</button></div>
      </form>
      ${loginMsg?`<p class="loginmsg">${loginMsg}</p>`:""}
      <hr>
      <p class="muted" style="margin:0">New to 1:64 Garage?</p>
      <button class="btn line" data-go="myprofile">Create an account</button>""",
  """      <h2>You're in. One more step</h2>
      <p class="muted">Pick your display name and finish your profile to start your garage.</p>
      <button class="btn" data-go="myprofile">Finish my account</button>
      <p class="small muted"><button class="link" data-logout="1">Log out</button></p>""")
s = rep(s, "Log out of Claude and log back in with the account you used to sign up, then refresh this page.",
        "Log out, then log back in with your username and password.")

# button + form handlers
s = rep(s, "  if(b.dataset.reload){ location.reload(); return }",
  """  if(b.dataset.reload){ location.reload(); return }
  if(b.dataset.authtab){ authTab = b.dataset.authtab; loginMsg = ""; render(); return }
  if(b.dataset.pweye){ const i = document.getElementById(b.dataset.pweye); if(i){ const show = i.type==="password"; i.type = show ? "text" : "password"; b.textContent = show ? "Hide" : "Show"; b.setAttribute("aria-label", show ? "Hide password" : "Show password") } return }
  if(b.dataset.logout){ forgetMe(); window.__auth?.signOut(); return }
  if(b.dataset.google){ window.__auth?.google().catch(e=>toast(e.message||"Couldn't open Google")); return }""")
s = rep(s, """  if(f.id==="loginform"){""",
  """  if(f.id==="pwloginform"){
    const who = $("#l-who").value.trim(), pw = $("#l-pass").value; if(!who || !pw) return; document.activeElement.blur();
    loginMsg = "Logging in…"; render();
    try{ await window.__auth.logIn(who, pw); loginMsg = "" }
    catch(err){ const c = err?.code;
      loginMsg = c==="too_many" ? "Too many tries. Wait 15 minutes, or reset your password." : c==="unconfirmed" ? "Confirm your email first: tap the link we sent when you signed up." : c==="wrong" ? `Wrong username or password. Check the spelling (capitals don't matter), tap <b>Show</b> to see the password, or <button class="link" data-authtab="forgot">reset your password</button>.` : "Couldn't log in right now. Try again in a minute." }
    render(); return }
  if(f.id==="signupform"){
    const un = $("#su-user").value.trim().replace(/^@/,""), em = $("#su-email").value.trim(), pw = $("#su-pass").value; document.activeElement.blur();
    if(!/^[A-Za-z0-9_.]{3,20}$/.test(un)){ loginMsg = "Usernames are 3–20 letters, numbers, _ or ."; render(); return }
    if(pw.length < 8){ loginMsg = "Use at least 8 characters for your password."; render(); return }
    loginMsg = "Creating your account…"; render();
    try{
      if(!(await window.__auth.usernameFree(un))){ loginMsg = `@${esc(un)} is taken. Try another username.`; render(); return }
      const r = await window.__auth.signUp(em, pw, un);
      loginMsg = r.needsConfirm ? `Almost done: check <b>${esc(em)}</b> and tap the link to confirm (look in spam too). After that you log in with @${esc(un)} and your password.` : "";
    }catch(err){ const c = err?.code;
      loginMsg = c==="exists" ? `There's already an account for that email. <button class="link" data-authtab="login">Log in</button> or <button class="link" data-authtab="forgot">reset your password</button>.` : c==="weak" ? "Pick a stronger password (8+ characters, mix letters and numbers)." : c==="too_many" ? "Too many tries. Wait a minute and try again." : "Couldn't create the account. Check the email and try again." }
    render(); return }
  if(f.id==="forgotform"){
    const em = $("#fp-email").value.trim(); if(!em) return; document.activeElement.blur();
    loginMsg = "Sending…"; render();
    try{ await window.__auth.resetPassword(em); loginMsg = `If there's an account for <b>${esc(em)}</b>, a reset link is on its way (look in spam too). Open it on this device, then pick a new password.` }
    catch(err){ loginMsg = err?.code==="too_many" ? "Too many tries. Wait a minute, then send it again." : "Couldn't send the link. Try again in a minute." }
    render(); return }
  if(f.id==="pwsetform"){
    const pw = $("#ps-pass").value; document.activeElement.blur();
    if(pw.length < 8){ loginMsg = "Use at least 8 characters."; render(); return }
    try{ await window.__auth.setPassword(pw); try{ sessionStorage.removeItem("setpw") }catch(e){}; loginMsg = ""; toast(`Password saved. Log in any time with @${uname(uid)||"your username"} and this password.`) }
    catch(err){ loginMsg = err?.code==="same" ? "That's already your password." : "Couldn't save the password. Try again." }
    render(); return }
  if(f.id==="loginform"){""")
s = rep(s, '"loginform","ggform"', '"loginform","pwloginform","signupform","forgotform","pwsetform","ggform"')

# after a password-reset link: open the account page with the new-password box
s = rep(s, "function remembered(){", """function pwPrompt(){ try{ return sessionStorage.getItem("setpw")==="1" }catch(e){ return false } }
function remembered(){""")
s = rep(s, "go(page);\n\n(async()=>{", """try{ if(sessionStorage.getItem("authmsg")==="ended"){ sessionStorage.removeItem("authmsg"); loginMsg = "You were logged out on this device, because your password changed or the session ended. Log in again to pick up where you left off."; page = "login" } }catch(e){}
go(pwPrompt() ? "login" : page);\n\n(async()=>{""")

open(out_path, "w", encoding="utf-8").write(HEAD + s + "\n</body>\n</html>\n")
print("built", out_path, len(HEAD + s), "bytes")
