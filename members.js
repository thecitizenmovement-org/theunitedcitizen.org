/* The Citizen Movement — member accounts.
   Sign-in is handled by Supabase Auth; the members table holds the permanent
   record (member_since is stamped at signup and locked by the database).
   The anon key below is public by design — row-level security enforces access. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://jesrbqrwbacuirwxbkis.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implc3JicXJ3YmFjdWlyd3hia2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NTU2OTcsImV4cCI6MjEwNzIzMTY5N30._LCnNC2JIjijt6n0u3kKestF5G2Zsjju4hEv1d1tImc';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function say(text) {
    var t = $('toast');
    if (!t) return;
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(say._t);
    say._t = setTimeout(function () { t.classList.remove('show'); }, 3600);
  }

  if (!window.supabase) return; // CDN unreachable — page works, auth stays off
  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  var session = null, member = null, mode = 'join';

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return iso; }
  }

  async function refreshCount() {
    try {
      var r = await client.rpc('member_count');
      if (!r.error && r.data != null) {
        var el = $('member-count');
        if (el) el.innerHTML = '<strong>' + Number(r.data).toLocaleString() + '</strong> citizens strong';
      }
    } catch (e) { /* counter is decorative — never break the page */ }
  }

  async function loadMember() {
    try {
      var s = await client.auth.getSession();
      session = s.data.session || null;
      member = null;
      if (session) {
        var m = await client.from('members').select('display_name,member_since').eq('id', session.user.id).maybeSingle();
        if (!m.error) member = m.data;
      }
    } catch (e) { session = null; member = null; }
    render();
  }

  function render() {
    var box = $('member-auth-box');
    if (!box) return;
    if (session) {
      var meta = session.user.user_metadata || {};
      var name = (member && member.display_name) || meta.display_name || 'Citizen';
      var since = member && member.member_since ? fmtDate(member.member_since) : null;
      box.innerHTML =
        '<h3>Welcome, ' + esc(name) + '</h3>' +
        (since ? '<p class="member-since">Member since <strong>' + esc(since) + '</strong></p>' : '') +
        '<p class="muted small">' + esc(session.user.email) + '</p>' +
        '<button class="btn ghost" id="member-signout" type="button">Sign out</button>' +
        '<label class="muted small" style="display:block;margin-top:12px"><input type="checkbox" id="member-music-opt"> Member music: cue up slowly after I sign in</label>' +
        '<p class="muted small">Safety precaution: volume is capped and fades in slowly, so it never blasts ears or speakers. Visitors always get click-to-play.</p>' +
        '<button class="btn ghost" id="member-music-play" type="button" style="display:none">▶ Play member music</button>' +
        '<p class="muted small" style="margin-top:14px"><a href="https://thecitizenmovement.com/info-member-profile.html">Your member profile — optional information</a><br><a href="https://thecitizenmovement.store/">Add your personal information (optional)</a> — saved only if you choose to, in the store.</p>';
      // Member music magic: post-login only, option-checked only, slow fade to a capped level.
      (function(){
        var opt=$('member-music-opt'); if(!opt) return;
        opt.checked = localStorage.getItem('cm_music_opt')==='1';
        var tracks=[
          'https://tunes.stocktune.com/public/2/5/2/2525ed68-5577-4f3b-b26a-18c631e797b2/ethereal-nocturnal-pathways-stocktune.mp3',
          'https://tunes.stocktune.com/public/2/0/b/20b055ac-94d5-4272-92d9-f1dd03bb8a61/quiet-reflections-hip-hop-stocktune.mp3',
          'https://tunes.stocktune.com/public/b/3/d/b3d7566c-727e-4173-b905-cd0c12771d74/echoes-in-the-dark-stocktune.mp3'
        ];
        var audio=window.__cmMusic; if(!audio){ audio=document.createElement('audio'); audio.preload='none'; window.__cmMusic=audio; }
        var ti=0, fading=false;
        function fadeTo(target, step){
          clearInterval(audio.__fade);
          audio.__fade=setInterval(function(){
            var v=audio.volume + (target>audio.volume? step : -step);
            if((step>0 && v>=target)||(step<0 && v<=target)){ audio.volume=target; clearInterval(audio.__fade); if(target===0) audio.pause(); }
            else audio.volume=Math.max(0, Math.min(0.6, v));
          }, 250);
        }
        function playTrack(i){
          ti=i % tracks.length; audio.src=tracks[ti]; audio.volume=0;
          audio.play().catch(function(){}); fadeTo(0.6, 0.03);
          audio.onended=function(){ playTrack(ti+1); };
        }
        opt.addEventListener('change', function(){
          localStorage.setItem('cm_music_opt', opt.checked?'1':'0');
          if(opt.checked) playTrack(0); else fadeTo(0, 0.05);
        });
        // Cue on this sign-in only if the member already checked the option before.
        // Browsers still require a prior tap on this site before sound is allowed;
        // if play is blocked, the Play button below appears for one tap.
        if(opt.checked){
          audio.src=tracks[0]; audio.volume=0;
          var pr=audio.play(); if(pr && pr.catch) pr.catch(function(){ var b=$('member-music-play'); if(b){ b.style.display='inline-block'; b.addEventListener('click', function(){ playTrack(0); b.style.display='none'; }); } });
          else fadeTo(0.6, 0.03);
        }
      })();
      $('member-signout').addEventListener('click', function () {
        client.auth.signOut().then(function () {
          session = null; member = null; render(); refreshCount(); say('Signed out.');
        });
      });
    } else {
      box.innerHTML =
        '<h3>Member Sign In</h3>' +
        '<p id="member-count" class="member-count"></p>' +
        '<div class="auth-tabs" role="tablist">' +
        '<button type="button" id="tab-join" class="' + (mode === 'join' ? 'active' : '') + '">Join free</button>' +
        '<button type="button" id="tab-login" class="' + (mode === 'login' ? 'active' : '') + '">Sign in</button></div>' +
        (mode === 'join' ? '<label for="m-name">Display name</label><input class="field" id="m-name" autocomplete="nickname" placeholder="What should we call you?">' : '') +
        '<label for="m-email">Email</label><input class="field" id="m-email" type="email" autocomplete="email" placeholder="you@example.com">' +
        '<label for="m-pass">Password</label><input class="field" id="m-pass" type="password" autocomplete="' + (mode === 'join' ? 'new-password' : 'current-password') + '" placeholder="' + (mode === 'join' ? 'Choose a password' : 'Your password') + '">' +
        '<button class="btn" id="m-go" type="button">' + (mode === 'join' ? '→ JOIN FREE' : '→ SIGN IN') + '</button>' +
        '<p class="coming" id="m-msg" aria-live="polite"></p>';
      $('tab-join').addEventListener('click', function () { mode = 'join'; render(); });
      $('tab-login').addEventListener('click', function () { mode = 'login'; render(); });
      $('m-go').addEventListener('click', go);
      $('m-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      refreshCount();
    }
  }

  function msg(t) { var m = $('m-msg'); if (m) m.textContent = t; }

  async function go() {
    var email = $('m-email').value.trim(), pass = $('m-pass').value;
    if (!email || !pass) { msg('Enter your email and password.'); return; }
    if (mode === 'join' && pass.length < 6) { msg('Password needs at least 6 characters.'); return; }
    msg(mode === 'join' ? 'Creating your membership…' : 'Signing you in…');
    try {
      if (mode === 'join') {
        var name = $('m-name') ? $('m-name').value.trim() : '';
        var r = await client.auth.signUp({
          email: email, password: pass, options: { data: { display_name: name } }
        });
        if (r.error) {
          msg(/already registered/i.test(r.error.message)
            ? 'That email is already a member — switch to Sign in.'
            : r.error.message);
          return;
        }
        if (r.data.session) { await loadMember(); refreshCount(); say('Welcome to the movement.'); }
        else { msg('Check your email to confirm, then sign in.'); say('Confirmation email sent — check your inbox.'); }
      } else {
        var s = await client.auth.signInWithPassword({ email: email, password: pass });
        if (s.error) { msg(s.error.message); return; }
        await loadMember(); refreshCount(); say('Signed in. Welcome back.');
      }
    } catch (e) { msg('Something went wrong. Try again.'); }
  }

  // Gate used by the printables download buttons: members pass, visitors get
  // pointed at free signup.
  function requireMember() {
    if (session) return true;
    say('Join free to download — it takes 20 seconds.');
    var p = $('member-panel');
    if (p && p.scrollIntoView) p.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  window.CitizenMembers = { requireMember: requireMember, refresh: loadMember };
  client.auth.onAuthStateChange(function () { loadMember(); refreshCount(); });
  loadMember();
  refreshCount();
})();
