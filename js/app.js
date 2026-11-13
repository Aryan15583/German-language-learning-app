(() => {
  "use strict";

  // ---------- State (saved in this browser) ----------
  const KEY = "zusammen-v1";
  const fresh = () => ({
    partners: [
      { name: "", xp: 0, known: {} },
      { name: "", xp: 0, known: {} },
    ],
    learner: 0,
    streak: { count: 0, last: null },
    duels: [], // { topic, scores: [a, b], date }
  });

  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { state = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

  const app = document.getElementById("app");
  const tabs = document.getElementById("tabs");
  const learnerEl = document.getElementById("learner");

  // ---------- Helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const name = (i) => esc(state.partners[i].name || (i ? "Partner B" : "Partner A"));
  const today = () => new Date().toISOString().slice(0, 10);
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const topic = (id) => TOPICS.find((t) => t.id === id);
  const allWords = () => TOPICS.flatMap((t) => t.words);

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  // German text-to-speech using the browser's built-in voices.
  function speak(text) {
    if (!("speechSynthesis" in window)) return toast("Speech isn't supported in this browser");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.rate = 0.9;
    const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith("de"));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  const speakBtn = (text) => `<button class="speak" data-speak="${esc(text)}" aria-label="Listen">🔊</button>`;

  // Shared couple streak: any practice on a new day keeps it going.
  function practiced(partnerIdx, xp) {
    state.partners[partnerIdx].xp += xp;
    const t = today();
    if (state.streak.last !== t) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      state.streak.count = state.streak.last === y ? state.streak.count + 1 : 1;
      state.streak.last = t;
    }
    save();
  }

  function renderLearner() {
    const show = state.partners[0].name && state.partners[1].name;
    learnerEl.hidden = !show; tabs.hidden = !show;
    if (!show) return;
    learnerEl.innerHTML = [0, 1].map((i) =>
      `<button class="p${i ? "b" : "a"}" data-learner="${i}" aria-pressed="${state.learner === i}">${name(i)}</button>`
    ).join("");
  }

  // ---------- Views ----------
  const views = {};

  views.setup = () => {
    app.innerHTML = `
      <h1>Willkommen! 👋</h1>
      <p class="sub">Learn German together — practise side by side, quiz each other, and send sweet notes in German.</p>
      <form class="card" id="setup">
        <label for="pa">Your name</label>
        <input type="text" id="pa" required maxlength="20" value="${esc(state.partners[0].name)}" />
        <label for="pb">Your partner's name</label>
        <input type="text" id="pb" required maxlength="20" value="${esc(state.partners[1].name)}" />
        <p></p>
        <button class="btn block">Los geht's! (Let's go!)</button>
      </form>`;
    app.querySelector("#setup").onsubmit = (e) => {
      e.preventDefault();
      state.partners[0].name = app.querySelector("#pa").value.trim();
      state.partners[1].name = app.querySelector("#pb").value.trim();
      save(); go("home");
    };
  };

  views.home = () => {
    const words = allWords();
    const dayNum = Math.floor(Date.now() / 864e5);
    const phrase = words[dayNum % words.length];
    const streakAlive = state.streak.last === today() ||
      state.streak.last === new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const streak = streakAlive ? state.streak.count : 0;
    const total = words.length;
    const knownCount = (i) => Object.values(state.partners[i].known).reduce((n, arr) => n + arr.length, 0);

    app.innerHTML = `
      <h1>Hallo ${name(0)} & ${name(1)} 💞</h1>
      <p class="sub">${state.streak.last === today() ? "You've practised today — super!" : "Practise together today to keep your streak."}</p>
      <div class="card stats">
        <div class="stat"><b>🔥 ${streak}</b><small>day streak</small></div>
        <div class="stat pa"><b>${state.partners[0].xp}</b><small>${name(0)} XP</small></div>
        <div class="stat pb"><b>${state.partners[1].xp}</b><small>${name(1)} XP</small></div>
      </div>
      <div class="card">
        <small class="muted">Satz des Tages · Phrase of the day</small>
        <div class="row"><div class="phrase">${esc(phrase.de)}</div>${speakBtn(phrase.de)}</div>
        <div class="muted">${esc(phrase.en)}</div>
        <p class="muted" style="margin-bottom:0">💡 Use it on each other at least once today!</p>
      </div>
      <div class="card">
        <div class="row"><b>Words mastered</b></div>
        ${[0, 1].map((i) => `
          <div class="row" style="margin-top:8px"><span class="turn p${i ? "b" : "a"}">${name(i)}</span><span class="spacer"></span><small>${knownCount(i)} / ${total}</small></div>
          <div class="progress"><div style="width:${(knownCount(i) / total) * 100}%;background:var(--${i ? "b" : "a"})"></div></div>`).join("")}
      </div>
      <h2>What shall we do?</h2>
      <div class="grid">
        <button class="tile" data-nav="learn"><span class="emoji">📚</span><strong>Flashcards</strong><small>Learn words by topic</small></button>
        <button class="tile" data-nav="duel"><span class="emoji">⚔️</span><strong>Quiz duel</strong><small>Pass the phone & compete</small></button>
        <button class="tile" data-nav="dialogues"><span class="emoji">🎭</span><strong>Role-play</strong><small>Read dialogues together</small></button>
        <button class="tile" data-nav="notes"><span class="emoji">💌</span><strong>Love note</strong><small>Write in German</small></button>
      </div>
      <p style="text-align:center;margin-top:24px"><button class="speak" id="reset">Change names / reset progress</button></p>`;
    app.querySelector("#reset").onclick = () => {
      if (confirm("Reset all progress and names?")) { state = fresh(); save(); go("setup"); }
    };
  };

  // --- Flashcards ---
  views.learn = (topicId) => {
    if (!topicId) {
      const p = state.partners[state.learner];
      app.innerHTML = `
        <h1>Learn 📚</h1>
        <p class="sub">Studying as <span class="turn p${state.learner ? "b" : "a"}">${name(state.learner)}</span> — switch at the top.</p>
        <div class="grid">${TOPICS.map((t) => `
          <button class="tile" data-topic="${t.id}"><span class="emoji">${t.emoji}</span><strong>${esc(t.title)}</strong>
          <small>${(p.known[t.id] || []).length} / ${t.words.length} known</small></button>`).join("")}
        </div>`;
      app.querySelectorAll("[data-topic]").forEach((b) => (b.onclick = () => go("learn", b.dataset.topic)));
      return;
    }

    const t = topic(topicId);
    const learner = state.learner;
    const known = new Set(state.partners[learner].known[t.id] || []);
    // Unknown words first, then known ones for review.
    let deck = shuffle(t.words.map((_, i) => i).filter((i) => !known.has(i)));
    if (!deck.length) deck = shuffle(t.words.map((_, i) => i));
    let pos = 0, flipped = false, gained = 0;

    const draw = () => {
      if (pos >= deck.length) {
        if (gained) practiced(learner, gained);
        app.innerHTML = `
          <div class="big">🎉</div>
          <h1 style="text-align:center">Toll gemacht!</h1>
          <p class="sub" style="text-align:center">${name(learner)} earned ${gained} XP. Now quiz each other in a duel?</p>
          <div class="row"><button class="btn secondary" data-nav="learn">More topics</button><span class="spacer"></span>
          <button class="btn" data-duel="${t.id}">Start a duel on this topic</button></div>`;
        app.querySelector("[data-duel]").onclick = () => go("duel", t.id);
        return;
      }
      const w = t.words[deck[pos]];
      app.innerHTML = `
        <div class="row"><button class="speak" data-nav="learn">← Topics</button><span class="spacer"></span><small class="muted">${t.emoji} ${esc(t.title)} · ${pos + 1}/${deck.length}</small></div>
        <div class="progress"><div style="width:${(pos / deck.length) * 100}%"></div></div>
        <div class="card flash" id="flash" role="button" tabindex="0" aria-label="Flip card">
          <div>${esc(w.de)}</div>
          ${flipped ? `<div class="back">${esc(w.en)}</div>` : `<div class="hint">Tap to reveal</div>`}
        </div>
        <div class="row" style="justify-content:center;margin-bottom:12px">${speakBtn(w.de)}</div>
        ${flipped ? `<div class="row"><button class="btn secondary" id="again" style="flex:1">Still learning</button>
          <button class="btn" id="got" style="flex:1">Got it ✓</button></div>` : ""}`;
      const flip = () => { flipped = true; draw(); };
      const flash = app.querySelector("#flash");
      flash.onclick = flip;
      flash.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } };
      if (flipped) {
        app.querySelector("#again").onclick = () => { deck.push(deck[pos]); pos++; flipped = false; draw(); };
        app.querySelector("#got").onclick = () => {
          const k = state.partners[learner].known;
          k[t.id] = Array.from(new Set([...(k[t.id] || []), deck[pos]]));
          gained += 5; pos++; flipped = false; save(); draw();
        };
      }
    };
    draw();
  };

  // --- Quiz duel: same questions for both partners, pass the phone in between ---
  views.duel = (topicId) => {
    if (!topicId) {
      const recent = state.duels.slice(-3).reverse();
      app.innerHTML = `
        <h1>Quiz duel ⚔️</h1>
        <p class="sub">${name(0)} plays first, then hands the phone to ${name(1)}. Same questions, who knows more?</p>
        <div class="grid">${TOPICS.map((t) => `
          <button class="tile" data-topic="${t.id}"><span class="emoji">${t.emoji}</span><strong>${esc(t.title)}</strong></button>`).join("")}
          <button class="tile" data-topic="__mix"><span class="emoji">🎲</span><strong>Mix of everything</strong></button>
        </div>
        ${recent.length ? `<h2>Recent duels</h2>${recent.map((d) => `
          <div class="card row"><span>${esc(d.title)}</span><span class="spacer"></span>
          <span class="turn pa">${d.scores[0]}</span>&nbsp;:&nbsp;<span class="turn pb">${d.scores[1]}</span></div>`).join("")}` : ""}`;
      app.querySelectorAll("[data-topic]").forEach((b) => (b.onclick = () => go("duel", b.dataset.topic)));
      return;
    }

    const pool = topicId === "__mix" ? allWords() : topic(topicId).words;
    const title = topicId === "__mix" ? "Mix of everything" : topic(topicId).title;
    const questions = shuffle(pool).slice(0, 6).map((w) => {
      const deToEn = Math.random() < 0.5;
      const others = shuffle(allWords().filter((o) => o.de !== w.de)).slice(0, 3);
      return {
        prompt: deToEn ? w.de : w.en,
        answer: deToEn ? w.en : w.de,
        speak: w.de,
        deToEn,
        options: shuffle([w, ...others].map((o) => (deToEn ? o.en : o.de))),
      };
    });
    const scores = [0, 0];
    let player = 0, q = 0;

    const handoff = () => {
      app.innerHTML = `
        <div class="big">📱➡️</div>
        <h1 style="text-align:center">Pass the phone to <span class="turn p${player ? "b" : "a"}">${name(player)}</span></h1>
        <p class="sub" style="text-align:center">${player ? `No peeking at ${name(0)}'s score! 🙈` : `${questions.length} questions. Viel Glück!`}</p>
        <button class="btn block" id="ready">I'm ready</button>`;
      app.querySelector("#ready").onclick = ask;
    };

    const ask = () => {
      const item = questions[q];
      app.innerHTML = `
        <div class="row"><span class="turn p${player ? "b" : "a"}">${name(player)}'s turn</span><span class="spacer"></span><small class="muted">${q + 1}/${questions.length}</small></div>
        <div class="progress"><div style="width:${(q / questions.length) * 100}%;background:var(--${player ? "b" : "a"})"></div></div>
        <div class="card">
          <small class="muted">${item.deToEn ? "What does this mean?" : "How do you say this in German?"}</small>
          <div class="row"><div class="phrase">${esc(item.prompt)}</div>${item.deToEn ? speakBtn(item.speak) : ""}</div>
        </div>
        <div class="choices">${item.options.map((o) => `<button class="choice" data-opt="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
      app.querySelectorAll(".choice").forEach((b) => (b.onclick = () => {
        const right = b.dataset.opt === item.answer;
        if (right) scores[player]++;
        app.querySelectorAll(".choice").forEach((c) => {
          c.disabled = true;
          if (c.dataset.opt === item.answer) c.classList.add("correct");
          else if (c === b) c.classList.add("wrong");
        });
        if (!item.deToEn || !right) speak(item.speak);
        setTimeout(() => {
          q++;
          if (q < questions.length) return ask();
          if (player === 0) { player = 1; q = 0; return handoff(); }
          finish();
        }, right ? 700 : 1500);
      }));
    };

    const finish = () => {
      const [a, b] = scores;
      practiced(0, a * 10 + (a > b ? 15 : 0));
      practiced(1, b * 10 + (b > a ? 15 : 0));
      state.duels.push({ title, scores, date: today() });
      state.duels = state.duels.slice(-20);
      save();
      const winner = a === b ? null : a > b ? 0 : 1;
      app.innerHTML = `
        <div class="big">${winner === null ? "🤝" : "🏆"}</div>
        <h1 style="text-align:center">${winner === null ? "Unentschieden! It's a tie!" : `${name(winner)} gewinnt!`}</h1>
        <div class="card stats" style="grid-template-columns:1fr 1fr">
          <div class="stat pa"><b>${a}</b><small>${name(0)}</small></div>
          <div class="stat pb"><b>${b}</b><small>${name(1)}</small></div>
        </div>
        <p class="sub" style="text-align:center">${winner === null ? "Perfectly matched 💞" : `Loser makes dinner tonight? 😉 <br><i>Der Verlierer kocht heute!</i>`}</p>
        <div class="row"><button class="btn secondary" data-nav="duel">Other topic</button><span class="spacer"></span>
        <button class="btn" id="rematch">Revanche! (Rematch)</button></div>`;
      app.querySelector("#rematch").onclick = () => go("duel", topicId);
    };

    handoff();
  };

  // --- Role-play dialogues ---
  views.dialogues = (id) => {
    if (!id) {
      app.innerHTML = `
        <h1>Role-play 🎭</h1>
        <p class="sub">Read a dialogue out loud together. ${name(0)} is <span class="turn pa">A</span>, ${name(1)} is <span class="turn pb">B</span>.</p>
        <div class="grid">${DIALOGUES.map((d) => `
          <button class="tile" data-d="${d.id}"><span class="emoji">${d.emoji}</span><strong>${esc(d.title)}</strong><small>${d.lines.length} lines</small></button>`).join("")}
        </div>`;
      app.querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => go("dialogues", b.dataset.d)));
      return;
    }
    const d = DIALOGUES.find((x) => x.id === id);
    let showEn = true, swapped = false, challenge = false, revealed = new Set();

    const draw = () => {
      const who = (w) => ((w === "a") !== swapped ? 0 : 1);
      app.innerHTML = `
        <div class="row"><button class="speak" data-nav="dialogues">← Dialogues</button><span class="spacer"></span><small class="muted">${d.emoji} ${esc(d.title)}</small></div>
        <div class="row" style="margin:12px 0">
          <button class="chip" id="en" aria-pressed="${showEn}">Show English</button>
          <button class="chip" id="ch" aria-pressed="${challenge}">Challenge: hide German</button>
          <button class="chip" id="sw">Swap roles ⇄</button>
        </div>
        ${d.lines.map((l, i) => {
          const p = who(l.who);
          const hide = challenge && !revealed.has(i);
          return `<div class="bubble ${p ? "b" : "a"} ${hide ? "hidden-line" : ""}" data-line="${i}">
            <div class="who">${name(p)}</div>
            <div class="row"><span class="de">${esc(l.de)}</span>${hide ? "" : speakBtn(l.de)}</div>
            ${showEn || hide ? `<div class="en">${esc(l.en)}</div>` : ""}
          </div>`;
        }).join("")}
        <p class="muted" style="text-align:center">${challenge ? "Say the German from the English, then tap the bubble to check." : "Tip: read it twice, then swap roles."}</p>
        <button class="btn block" id="done">We did it! (+10 XP each)</button>`;
      app.querySelector("#en").onclick = () => { showEn = !showEn; draw(); };
      app.querySelector("#ch").onclick = () => { challenge = !challenge; revealed = new Set(); draw(); };
      app.querySelector("#sw").onclick = () => { swapped = !swapped; draw(); };
      app.querySelectorAll(".hidden-line").forEach((el) => (el.onclick = () => { revealed.add(+el.dataset.line); draw(); }));
      app.querySelector("#done").onclick = () => {
        practiced(0, 10); practiced(1, 10);
        toast("Wunderbar! +10 XP each 🎉"); go("dialogues");
      };
    };
    draw();
  };

  // --- Love notes ---
  views.notes = () => {
    const from = state.learner, to = 1 - from;
    let opener = 0, middles = new Set([0]), closer = 1;

    const text = () => {
      const close = NOTE_PARTS.closers[closer].replace("…", state.partners[from].name || "…");
      return `${NOTE_PARTS.openers[opener]}\n${[...middles].sort().map((i) => cap(NOTE_PARTS.middles[i].de)).join(" ")}\n${close}`;
    };
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    const draw = () => {
      app.innerHTML = `
        <h1>Love note 💌</h1>
        <p class="sub">From <span class="turn p${from ? "b" : "a"}">${name(from)}</span> to ${name(to)}. Build it, then send it by text!</p>
        <label>Start</label>
        <div class="chips">${NOTE_PARTS.openers.map((o, i) => `<button class="chip" data-o="${i}" aria-pressed="${i === opener}">${esc(o)}</button>`).join("")}</div>
        <label>Say something sweet (pick any)</label>
        <div class="chips">${NOTE_PARTS.middles.map((m, i) => `<button class="chip" data-m="${i}" aria-pressed="${middles.has(i)}" title="${esc(m.de)}">${esc(m.en)}</button>`).join("")}</div>
        <label>End</label>
        <div class="chips">${NOTE_PARTS.closers.map((c, i) => `<button class="chip" data-c="${i}" aria-pressed="${i === closer}">${esc(c)}</button>`).join("")}</div>
        <h2>Preview</h2>
        <div class="card note-preview">${esc(text())}</div>
        <div class="row">${speakBtn(text())}<span class="spacer"></span>
          <button class="btn secondary" id="copy">Copy</button>
          <button class="btn" id="share">Send 💌</button></div>`;
      app.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => { opener = +b.dataset.o; draw(); }));
      app.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { closer = +b.dataset.c; draw(); }));
      app.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => {
        const i = +b.dataset.m;
        middles.has(i) ? middles.size > 1 && middles.delete(i) : middles.add(i);
        draw();
      }));
      app.querySelector("#copy").onclick = async () => {
        try { await navigator.clipboard.writeText(text()); toast("Copied! Paste it into your chat 💬"); practiced(from, 5); }
        catch { toast("Couldn't copy — select the text instead"); }
      };
      app.querySelector("#share").onclick = async () => {
        if (navigator.share) {
          try { await navigator.share({ text: text() }); practiced(from, 5); } catch {}
        } else app.querySelector("#copy").click();
      };
    };
    draw();
  };

  // ---------- Router ----------
  let current = "home";
  function go(view, arg) {
    if (view !== "setup" && !(state.partners[0].name && state.partners[1].name)) view = "setup";
    current = view;
    window.speechSynthesis?.cancel();
    renderLearner();
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.nav === view));
    views[view](arg);
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav) return go(nav.dataset.nav);
    const sp = e.target.closest("[data-speak]");
    if (sp) { e.stopPropagation(); return speak(sp.dataset.speak); }
    const l = e.target.closest("[data-learner]");
    if (l) {
      state.learner = +l.dataset.learner; save();
      // Re-render views that depend on who's learning; don't interrupt a duel or dialogue.
      if (["home", "learn", "notes"].includes(current)) go(current); else renderLearner();
    }
  });

  go("home");
})();
