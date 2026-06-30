(function () {
  const API = location.origin;
  const STORAGE_KEY = "ssc_qa_history_v1";
  const USER_KEY = "ssc_user_name";

  const healthChip = document.getElementById("qaHealthChip");
  const topDate = document.getElementById("qaTopDate");
  const userInput = document.getElementById("qaCurrentUser");
  const statusEl = document.getElementById("qaStatus");
  const knotTitle = document.getElementById("qaKnotTitle");
  const knotSub = document.getElementById("qaKnotSub");
  const knotContainer = document.getElementById("knot-chat-container");
  const knotFallback = document.getElementById("knotChatFallback");
  const qaKnotAgentLink = document.getElementById("qaKnotAgentLink");
  const qaAccessBadge = document.getElementById("qaAccessBadge");
  const heroResult = document.getElementById("qaHeroResult");

  let embedCfg = null;
  let chatInstance = null;
  let lastShelves = [];
  let lastPerm = null;
  let sessionIdentity = null;

  function isLocalDev() {
    const h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "";
  }
  function isPreviewHost() {
    return /\.preview\.with\.woa\.com$/i.test(location.hostname);
  }

  function getDevStaffQuery() {
    const p = new URLSearchParams(location.search);
    return p.get("staffname") || p.get("user") || "";
  }

  function renderUserBadge(sess) {
    const badge = document.getElementById("qaUserBadge");
    if (!badge) return;
    const nameEl = document.getElementById("qaUserDisplayName");
    const subEl = document.getElementById("qaUserStaffMeta");
    const roleEl = document.getElementById("qaUserRoleTag");
    const avatar = document.getElementById("qaUserAvatar");
    badge.hidden = false;
    badge.classList.remove("guest", "none");
    if (!sess?.user) {
      badge.classList.add("none");
      if (nameEl) nameEl.textContent = "未选操作人";
      if (subEl) subEl.textContent = "请从右上角下拉选择";
      if (roleEl) roleEl.textContent = "Guest";
      if (avatar) avatar.style.visibility = "hidden";
      return;
    }
    if (avatar) {
      avatar.style.visibility = "visible";
      if (sess.avatar_url) avatar.src = sess.avatar_url;
    }
    if (nameEl) nameEl.textContent = sess.display || sess.user;
    if (subEl) {
      const bits = [sess.login_id, sess.staff_id].filter(Boolean);
      subEl.textContent = bits.length ? bits.join(" · ") : sess.user;
    }
    if (roleEl) roleEl.textContent = sess.registered ? (sess.role || "member") : "未登记";
    if (!sess.registered) badge.classList.add("guest");
  }

  async function initSessionIdentity() {
    await loadOperators();
    const qs = getDevStaffQuery();
    const url = `${API}/api/permissions/session${qs ? `?staffname=${encodeURIComponent(qs)}` : ""}`;
    try {
      sessionIdentity = await fetch(url).then((r) => r.json());
    } catch {
      sessionIdentity = null;
    }
    const saved = normalizeUser(localStorage.getItem(USER_KEY) || "");
    const fromQuery = qs ? normalizeUser(qs) : "";
    const sessionUser = sessionIdentity?.user ? normalizeUser(sessionIdentity.user) : "";
    const user = saved || fromQuery || sessionUser;
    if (user && operatorsCache.some((o) => o.name === user)) {
      setCurrentUser(user);
      lastPerm = sessionIdentity?.user === user && sessionIdentity?.registered !== undefined
        ? sessionIdentity
        : null;
    }
    renderUserBadge(sessionIdentity?.user === user ? sessionIdentity : (user ? { user, display: user, source: "picker" } : null));
    if (user) await loadPermissionBadge(user);
  }

  const DEFAULT_KNOT_EMBED = {
    ok: true,
    embed_mode: "launchpad",
    agent_id: "60b0769077ac446d95ebddd21ac85cfa",
    chat_publish_url: "https://knot.woa.com/chat?web_key=60b0769077ac446d95ebddd21ac85cfa&close=0",
    sdk_base_url: "https://knot.woa.com",
    workspace_id: "cef2f910-1b1b-4691-bb0f-26b71cf62599",
    enable_workspace_selector: true,
    streaming_timeout_sec: 1800,
    initial_conversation: true,
    header_title: "SSC 知识问答",
    agent_detail_url: "https://knot.woa.com/agent/detail/60b0769077ac446d95ebddd21ac85cfa",
  };

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  let operatorsCache = [];

  function normalizeUser(name) {
    const n = String(name ?? "").trim();
    if (!n) return "";
    for (const o of operatorsCache) {
      if (o.name === n || o.login_id === n || o.display === n) return o.name;
      for (const a of o.aliases || []) {
        if (a === n || String(a).toLowerCase() === n.toLowerCase()) return o.name;
      }
    }
    const legacy = { "liu wei": "刘微", "liuwei": "刘微", "vvvliu": "刘微" };
    return legacy[n.toLowerCase()] || n;
  }

  const OPERATOR_FALLBACK = [
    { name: "刘微", display: "vvvliu(刘微)", login_id: "vvvliu" },
    { name: "张文婧", display: "annawzhang(张文婧)", login_id: "annawzhang" },
    { name: "罗东明", display: "aicoluo(罗东明)", login_id: "aicoluo" },
    { name: "叶佩彦", display: "phayyan(叶佩彦)", login_id: "phayyan" },
  ];

  async function loadOperators() {
    try {
      const res = await fetch(`${API}/api/permissions/operators`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "失败");
      operatorsCache = data.operators || [];
      if (!operatorsCache.length) operatorsCache = [...OPERATOR_FALLBACK];
    } catch {
      operatorsCache = [...OPERATOR_FALLBACK];
    }
    if (!userInput) return;
    const saved = normalizeUser(localStorage.getItem(USER_KEY) || "");
    userInput.innerHTML =
      `<option value="">请选择操作人</option>` +
      operatorsCache
        .map(
          (o) =>
            `<option value="${esc(o.name)}"${o.name === saved ? " selected" : ""}>${esc(o.display || o.name)}</option>`
        )
        .join("");
    if (saved && operatorsCache.some((o) => o.name === saved)) userInput.value = saved;
  }

  function getCurrentUser() {
    const picked = normalizeUser(userInput?.value || localStorage.getItem(USER_KEY) || "");
    if (picked) return picked;
    if (sessionIdentity?.user) return normalizeUser(sessionIdentity.user);
    return "";
  }

  function setCurrentUser(v) {
    const n = normalizeUser(v);
    if (userInput) userInput.value = n || "";
    if (n) localStorage.setItem(USER_KEY, n);
    else localStorage.removeItem(USER_KEY);
  }

  function fmtDateTime(d) {
    const x = d ? new Date(d) : new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}:${p(x.getSeconds())}`;
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveHistory(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
    renderLocalHistory(list);
  }

  function renderLocalHistory(list) {
    const box = document.getElementById("qaLocalHistory");
    if (!box) return;
    if (!list.length) {
      box.innerHTML = "<span class='muted' style='font-size:11px'>暂无</span>";
      return;
    }
    box.innerHTML = list.slice(0, 8).map((item, i) =>
      `<div class="qa-local-item" data-idx="${i}" title="${esc(item.q)}">${esc(item.q)}</div>`
    ).join("");
    box.querySelectorAll(".qa-local-item").forEach((el) => {
      el.onclick = () => {
        const idx = Number(el.dataset.idx);
        const item = list[idx];
        if (item) {
          const input = document.getElementById("qaHeroInput");
          if (input) input.value = item.q;
          askViaGateway(item.q);
        }
      };
    });
  }

  async function fetchEmbedConfig() {
    try {
      const res = await fetch(`${API}/api/qa/knot-embed`);
      if (res.ok) {
        const d = await res.json();
        if (d.ok) return d;
      }
    } catch (_) {
      /* use defaults */
    }
    return { ...DEFAULT_KNOT_EMBED, fallback: true };
  }

  function applyEmbedLinks() {
    if (qaKnotAgentLink && embedCfg?.agent_detail_url) {
      qaKnotAgentLink.href = embedCfg.agent_detail_url;
    }
  }

  function openKnotViaAnchor() {
    if (!embedCfg?.chat_publish_url) return false;
    const a = document.createElement("a");
    a.href = embedCfg.chat_publish_url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }

  function expandKnotPanel() {
    const panel = document.querySelector(".qa-more-panel");
    if (panel) panel.open = true;
    panel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function tryKnotIframeEmbed() {
    if (!knotFallback || !embedCfg?.chat_publish_url) return;
    if (knotContainer) knotContainer.hidden = true;
    knotFallback.hidden = false;
    knotFallback.removeAttribute("hidden");
    if (knotFallback.src !== embedCfg.chat_publish_url) {
      knotFallback.src = embedCfg.chat_publish_url;
    }
    if (knotSub) knotSub.textContent = "页内嵌入 · 若空白请用新标签页打开";
    if (statusEl) {
      statusEl.textContent = "已尝试页内嵌入 Knot · 若无法登录，请点「新标签页打开」";
    }
  }

  function openKnotTab() {
    if (!embedCfg?.chat_publish_url) return null;
    expandKnotPanel();
    const opened = openKnotViaAnchor();
    if (!opened) return null;
    const w = window.open("", "ssc_knot_chat");
    if (w) {
      try {
        w.location.href = embedCfg.chat_publish_url;
        return w;
      } catch {
        /* fallback already opened via anchor */
      }
    }
    return null;
  }

  async function copyQuestion(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function renderKnotDock() {
    /* Knot 入口已合并至页顶「Knot 深聊 ↗」 */
  }

  function renderHeroResult(html, visible = true) {
    if (!heroResult) return;
    heroResult.hidden = !visible;
    if (visible) heroResult.innerHTML = html;
  }

  async function loadPermissionBadge(user) {
    if (!qaAccessBadge) return;
    if (!user) {
      qaAccessBadge.textContent = "未选操作人 · 请先选择后再提问";
      qaAccessBadge.className = "status qa-access-badge";
      lastPerm = null;
      return;
    }
    if (sessionIdentity?.user === user && sessionIdentity?.registered !== undefined) {
      lastPerm = sessionIdentity;
    } else {
      try {
        const res = await fetch(`${API}/api/permissions/me?user=${encodeURIComponent(user)}`);
        lastPerm = await res.json();
      } catch {
        qaAccessBadge.textContent = "权限校验失败";
        qaAccessBadge.className = "status err qa-access-badge";
        return;
      }
    }
    const d = lastPerm;
    if (d.registered) {
      qaAccessBadge.textContent = `已登记 · ${d.role || "成员"} · ${lastShelves.length} 书架`;
      qaAccessBadge.className = "status ok qa-access-badge";
    } else {
      qaAccessBadge.textContent = "未登记 · 仅只读书架 · 写操作需申请";
      qaAccessBadge.className = "status qa-access-badge";
    }
  }

  async function initKnotChat() {
    embedCfg = await fetchEmbedConfig();
    applyEmbedLinks();
  }

  async function sendToKnot(text) {
    const q = (text || "").trim();
    if (!q) {
      openKnotViaAnchor();
      if (statusEl) statusEl.textContent = "已打开 Knot · 请在新标签页输入问题";
      return;
    }
    saveHistory([{ q, at: new Date().toISOString() }, ...loadHistory()]);

    if (chatInstance) {
      for (const method of ["sendMessage", "send", "submit"]) {
        if (typeof chatInstance[method] === "function") {
          try {
            await chatInstance[method](q);
            return;
          } catch (_) {
            /* next */
          }
        }
      }
    }

    const copied = await copyQuestion(q);
    openKnotViaAnchor();
    if (statusEl) {
      statusEl.textContent = copied
        ? `已复制问题并打开 Knot 新标签页 · 在 Knot 里 Ctrl+V 粘贴后发送`
        : "已打开 Knot 新标签页 · 请手动输入或粘贴问题";
    }
  }

  function consumeKnotAskFromStorage() {
    try {
      const raw = localStorage.getItem("ssc_knot_ask");
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (Date.now() - (payload.t || 0) > 30 * 60 * 1000) {
        localStorage.removeItem("ssc_knot_ask");
        return null;
      }
      localStorage.removeItem("ssc_knot_ask");
      return payload;
    } catch {
      return null;
    }
  }

  function formatKnotQuestion(payload) {
    const q = String(payload.q || "").trim();
    const ctx = String(payload.ctx || "").trim();
    const view = payload.view || "";
    const who = payload.user || "";
    if (!ctx) return q;
    return `【页面 ${view} · 操作人 ${who}】\n\n${ctx}\n\n---\n请回答：${q}`;
  }

  async function handleKnotDeepLink() {
    const params = new URLSearchParams(location.search);
    if (params.get("knot") !== "1") return;
    const payload = consumeKnotAskFromStorage();
    if (!payload) {
      if (statusEl) statusEl.textContent = "未找到页面上下文（请从工作台「在 Knot 问」进入）";
      return;
    }
    if (payload.user) setCurrentUser(payload.user);
    await loadSources();
    const fullQ = formatKnotQuestion(payload);
    await sendToKnot(fullQ);
  }

  async function loadSources() {
    const user = getCurrentUser();
    const qs = user ? `?user=${encodeURIComponent(user)}` : "";
    const box = document.getElementById("qaSources");
    const indexMeta = document.getElementById("qaIndexMeta");
    try {
      const [lib, health, idxSt] = await Promise.all([
        fetch(`${API}/api/library/shelves${qs}`).then((r) => r.json()),
        fetch(`${API}/api/health`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/api/library/index-status?refresh=true`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (healthChip) {
        healthChip.textContent = health ? `在线 v${health.api_version || "?"}` : "离线";
        healthChip.className = "status " + (health ? "ok" : "err");
      }
      if (topDate) topDate.textContent = fmtDateTime();
      if (indexMeta && idxSt) {
        const tag = idxSt.rebuilt ? " · 已同步" : "";
        indexMeta.textContent = `索引：${idxSt.document_count ?? "—"} 篇 · ${idxSt.updated_at || "—"}${tag}`;
      }
      const metaRes = await fetch(`${API}/api/meta`).catch(() => null);
      if (metaRes?.ok) {
        const meta = await metaRes.json();
        const fpp = document.getElementById("fppSidebarLink");
        if (fpp && meta.fpp_portal_url) fpp.href = meta.fpp_portal_url;
      }
      lastShelves = lib.shelves || [];
      if (box) {
        box.innerHTML = lastShelves.length
          ? lastShelves.map((s) =>
              `<div class="qa-src-group"><h4>${esc(s.name)}</h4><ul><li>${s.document_count || 0} 篇 · ${esc(s.visibility)}</li></ul></div>`
            ).join("")
          : `<p class='muted'>${user ? "无可见书架" : "请从右上角选择操作人"}</p>`;
      }
      await loadPermissionBadge(user);
      renderKnotDock();
    } catch {
      if (box) box.innerHTML = "<p class='muted'>Gateway 未连接 · 请先 bash knot-chat/start_web.sh</p>";
      if (healthChip) {
        healthChip.textContent = "离线";
        healthChip.className = "status err";
      }
    }
  }

  userInput?.addEventListener("change", async () => {
    sessionIdentity = null;
    setCurrentUser(getCurrentUser());
    renderUserBadge(getCurrentUser() ? { user: getCurrentUser(), display: getCurrentUser(), source: "picker" } : null);
    await loadSources();
  });

  async function askViaGateway(text) {
    const user = getCurrentUser();
    if (!user) { alert("请先在右上角选择操作人"); return; }
    const q = (text || "").trim();
    if (!q) return;
    if (statusEl) statusEl.textContent = "检索中…";
    renderHeroResult("<p class='muted'>检索中…</p>", true);
    try {
      const res = await fetch(`${API}/api/qa/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q, user, use_llm: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "失败");
      saveHistory([{ q, at: new Date().toISOString() }, ...loadHistory()]);
      renderHeroResult(
        `<div class="qa-ai-label">${d.llm ? "LLM 归纳" : "权限内检索"}</div><pre>${esc(d.message || "")}</pre>` +
          `<div class="qa-hero-result-actions"><button type="button" class="btn btn-sm" id="qaHeroKnotFollow">Knot 深聊此问</button></div>`,
        true
      );
      document.getElementById("qaHeroKnotFollow")?.addEventListener("click", () => sendToKnot(q));
      if (statusEl) statusEl.textContent = d.llm ? "AI 已回答" : "检索完成 · 可点「Knot 深聊」继续追问";
      heroResult?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {
      renderHeroResult(`<p class="muted">${esc(e.message || "失败")}</p>`, true);
      if (statusEl) statusEl.textContent = e.message || "失败";
    }
  }

  function bindHero() {
    const input = document.getElementById("qaHeroInput");
    const ask = () => askViaGateway(input?.value || "");
    const toKnot = () => sendToKnot(input?.value || "");
    document.getElementById("qaHeroAsk")?.addEventListener("click", ask);
    document.getElementById("qaHeroKnot")?.addEventListener("click", toKnot);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ask();
    });
    document.querySelectorAll(".qa-hero-chip").forEach((btn) => {
      btn.onclick = () => {
        if (input) input.value = btn.dataset.q || "";
        ask();
      };
    });
  }

  document.querySelectorAll(".qa-prompt").forEach((btn) => {
    btn.onclick = () => sendToKnot(btn.dataset.q);
  });

  document.getElementById("btnClearHistory")?.addEventListener("click", () => {
    if (confirm("清空本页问答记录？")) saveHistory([]);
  });

  document.getElementById("btnQaRefresh")?.addEventListener("click", () => {
    loadSources();
    initKnotChat();
  });

  (async () => {
    await initSessionIdentity();
    saveHistory(loadHistory());
    await loadSources();
    await initKnotChat();
    await handleKnotDeepLink();
    bindHero();
  })();
})();
