const API = localStorage.getItem("ssc_api_base") ||
  (location.protocol.startsWith("http") ? location.origin : "http://127.0.0.1:18180");

let projectsCache = [];
let selectedProjectId = null;
let projectDetailCache = null;
let userPermissions = null;
let registryCache = null;
let selectedAgentId = null;
const agentLiveCache = {};
const VV_STORAGE_KEYS = {
  announcements: "ssc_vv_announcements",
  demands: "ssc_vv_demands",
  notes: "ssc_vv_notes",
  sops: "ssc_vv_sops",
  quality: "ssc_vv_quality",
};

const TITLES = {
  home: "全局总览", projects: "项目看板", agents: "Agent & Knot",
  issues: "Issue", knowledge: "知识图书馆", tools: "工具",
  "tools-americas": "美国工作区 · 分摊 / 提单",
  "tools-sg": "新加坡工作区 · EE Listing",
  "tools-non-americas": "加拿大工作区 · 分摊 / 提单",
  meetings: "会议",
  "admin-mgmt": "管理看板",
  "admin-users": "用户管理", "admin-perm": "权限矩阵",
  "admin-audit": "操作日志", "admin-access": "权限申请",
};

const PAGE_SUBTITLES = {
  home: "Command Overview",
  projects: "Project Board",
  agents: "Agent & Knot Config",
  issues: "Issue Tracking",
  knowledge: "Knowledge Library",
  meetings: "Meeting Notes",
  "tools-americas": "Regional Tools · US Workspace (Allocation / Submission)",
  "tools-sg": "Regional Tools · Singapore Workspace (EE Listing)",
  "tools-non-americas": "Regional Tools · Canada Workspace (Allocation / Submission)",
  "admin-mgmt": "SSC Operations Board",
  "admin-users": "User Management",
  "admin-perm": "Permission Matrix",
  "admin-audit": "Audit Log",
  "admin-access": "Access Request",
};

function syncPageHead(viewId) {
  const titleEl = document.getElementById("pageTitle");
  const subEl = document.getElementById("pageSubtitle");
  if (titleEl) titleEl.textContent = TITLES[viewId] || "工作台";
  if (subEl) subEl.textContent = PAGE_SUBTITLES[viewId] || "Workbench";
}

const VIEW_PANEL = {
  home: "home",
  knowledge: "knowledge",
  projects: "collab",
  issues: "collab",
  meetings: "collab",
  "tools-americas": "tools",
  "tools-non-americas": "tools",
  "tools-sg": "tools",
  agents: "system",
  "admin-mgmt": "system",
  "admin-users": "system",
  "admin-perm": "system",
  "admin-audit": "system",
  "admin-access": "system",
};

const PANEL_DEFAULT_VIEW = {
  tools: "tools-americas",
  knowledge: "knowledge",
  home: "home",
  collab: "projects",
  system: "admin-mgmt",
};

const VIEW_NAV_GROUP = {
  home: null,
  knowledge: "knowledge",
  projects: "collab",
  issues: "collab",
  meetings: "collab",
  "tools-americas": "tools",
  "tools-sg": "tools",
  "tools-non-americas": "tools",
  agents: "system",
  "admin-mgmt": "system",
  "admin-users": "system",
  "admin-perm": "system",
  "admin-audit": "system",
  "admin-access": "system",
};

const DOMAIN_PANELS = [
  { id: "americas", view: "tools-americas", icon: "🧰", name: "区域工具", key: "americas" },
  { id: "knowledge", view: "knowledge", icon: "📚", name: "知识库", key: "knowledge" },
  { id: "projects", view: "projects", icon: "📋", name: "项目协同", key: "projects" },
  { id: "collab", view: "issues", icon: "🤝", name: "Issue / 会议", key: "issues" },
  { id: "agents", view: "agents", icon: "🤖", name: "Agent 编排", key: "agents" },
];

const TAB_AGENT = {
  home: "monitor", projects: "project", issues: "issue",
  knowledge: "knowledge", tools: "leave", "tools-americas": "leave",
  "tools-sg": "leave", "tools-non-americas": "leave", meetings: "meeting",
  "admin-users": "admin-users", "admin-perm": "admin-perm",
  "admin-audit": "admin-audit", "admin-access": "admin-access",
};

function fmtDateTime(iso) {
  if (!iso) return "—";
  const raw = String(iso).trim();
  const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return raw.length >= 16 ? raw.slice(0, 16) : raw;
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function updateTopbarDate() {
  const el = document.getElementById("topbarDate");
  if (el) el.textContent = fmtDateTime(new Date().toISOString());
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function copyText(text, btn) {
  navigator.clipboard?.writeText(text).then(() => {
    if (btn) { const o = btn.textContent; btn.textContent = "已复制"; setTimeout(() => { btn.textContent = o; }, 1200); }
  });
}

function cmdBlock(label, cmd) {
  const id = "cmd-" + Math.random().toString(36).slice(2, 8);
  return `<div class="cmd-block" id="${id}">
    <button type="button" class="copy-inline" data-copy="${esc(cmd)}">复制</button>
    <div style="color:#94a3b8;margin-bottom:4px">${esc(label)}</div>${esc(cmd)}
  </div>`;
}

function bindCopyButtons(root) {
  root.querySelectorAll("[data-copy]").forEach(btn => {
    btn.onclick = () => copyText(btn.dataset.copy, btn);
  });
}

function renderWorkstationGuide(reg, meta) {
  const dep = reg.deployment || {};
  const ws = dep.workspace_path || meta?.workspace_root || "/data/workspace";
  const steps = dep.workstation_steps || [
    `工作区终端：cd ${ws} && git pull`,
    "启动 Gateway：bash knot-chat/start_web.sh",
    `Knot 执行命令：bash ${ws}/knot-chat/run_agent.sh {{user_input}}`,
  ];
  const knotUrl = dep.knot_agent_url || meta?.knot_agent_url || "#";
  const fppUrl = dep.fpp_portal_url || meta?.fpp_portal_url || "#";
  const gitUrl = dep.git_repo_https || "https://git.woa.com/annawzhang/ssc-overseas-cb.git";

  return `
    <h3>工作区要做什么（Knot 托管 · 与 FPP amer-fpp-a 相同模式）</h3>
    <ol class="workstation-steps">
      ${steps.map(s => `<li>${esc(s)}</li>`).join("")}
    </ol>
    ${cmdBlock("① 同步工蜂代码", `cd ${ws}\ngit pull\nchmod +x knot-chat/*.sh`)}
    ${cmdBlock("② 启动网页 + API", `cd ${ws}\nbash knot-chat/start_web.sh`)}
    ${cmdBlock("③ Knot · 执行命令（配置界面填，勿手打 {{user_input}}）", `bash ${ws}/knot-chat/run_agent.sh {{user_input}}`)}
    ${cmdBlock("④ Knot · Client Webhook Body", `{"text": "{{user_input}}"}`)}
    <div class="divider-note">
      <strong>分工（勿混）</strong><br>
      ① 工作区终端 = git pull + start_web.sh（SSC 与网页共用）<br>
      ② SSC 总助手 Agent = 项目 / Issue / 会议 / 假期 / 监控<br>
      ③ FPP 分摊操作台 3.0 = 分摊 / 提单 / Invoice（独立 · :18082）
    </div>
    <div class="link-row">
      <a class="btn btn-primary" href="${esc(knotUrl)}" target="_blank" rel="noopener">打开 Knot · SSC 总助手</a>
      <a class="btn mode-fpp" href="${esc(fppUrl)}" target="_blank" rel="noopener">打开 FPP 分摊操作台 3.0</a>
      <a class="btn" href="${esc(gitUrl)}" target="_blank" rel="noopener">工蜂仓库</a>
      <button type="button" class="btn" id="btnTestMainMenu">终端等价 · 主菜单</button>
    </div>
  `;
}

function applyPortalLinks(meta, reg) {
  const tencentMeeting = document.getElementById("btnTencentMeetingEntry");
  const tencentMeetingUrl = meta?.tencent_meeting_schedule_url || tencentMeeting?.href;
  if (tencentMeeting && tencentMeetingUrl) tencentMeeting.href = tencentMeetingUrl;

  const wecomCalendar = document.getElementById("btnWecomCalendarEntry");
  const wecomCalendarUrl = meta?.wecom_calendar_url || wecomCalendar?.href;
  if (wecomCalendar && wecomCalendarUrl) wecomCalendar.href = wecomCalendarUrl;
}

function viewFromHash() {
  const raw = (location.hash || "").replace(/^#/, "").split(/[/?]/)[0];
  if (raw && TITLES[raw]) return raw;
  if (location.hash.startsWith("#projects")) return "projects";
  return "home";
}

function formBadge(form) {
  if (!form) return "logic";
  if (form.includes("脚本")) return "script";
  if (form.includes("外链") || form.includes("引导")) return "external";
  if (form.includes("Knot")) return "knot";
  return "logic";
}

function agentConnectMeta(a) {
  const h = a?.handler || "";
  if (a?.id === "qa" || a?.knot_agent_id) {
    return { type: "Knot Bot #2", path: "run_qa.sh → agent_id=qa + user", api: a.api_invoke || "POST /api/orchestrate" };
  }
  if (a?.id?.startsWith("admin-")) {
    return { type: "系统 Agent", path: `${a.api_data || "admin API"} → 只读/申请流`, api: a.api_invoke };
  }
  if (h === "action") return { type: "脚本", path: "Gateway 调 Python · jobs 留痕", api: a.api_invoke };
  if (h === "external") return { type: "外链引导", path: "返回 FPP 分摊操作台 3.0", api: a.api_invoke };
  if (h === "qa") return { type: "RAG", path: "library 上下文 + Knot LLM", api: a.api_invoke };
  if (a?.api_data) return { type: "JSON 数据", path: `${a.api_data} → 格式化`, api: a.api_invoke };
  return { type: "编排路由", path: "总助手识别意图 → handler", api: a?.api_invoke || "POST /api/orchestrate" };
}

let operatorsCache = [];
let sessionIdentity = null;
const HR_DW_QUERY_API = "https://dos-dataview-mcp.woa.com/api/query";
const HR_STAFF_WIDE_TABLE = "catalog_dos_data_analysis_mcp_2.hrdw.Report_Wide_Public_Staff_Info";

function isLocalDev() {
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "";
}

function isPreviewHost() {
  return /\.preview\.with\.woa\.com$/i.test(location.hostname);
}

function looksLikeToken(s) {
  const t = String(s || "").trim();
  return t.startsWith("eyJ") && t.includes(".") || t.length > 80;
}

function getDevStaffQuery() {
  const p = new URLSearchParams(location.search);
  return p.get("staffname") || p.get("user") || "";
}

function sqlLiteral(v) {
  return `'${String(v || "").replace(/'/g, "''")}'`;
}

function pickRowField(row, keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
  }
  return "";
}

async function queryHrDw(sql) {
  const res = await fetch(HR_DW_QUERY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data?.code !== 0 || !Array.isArray(data?.data)) throw new Error(data?.message || "query failed");
  return data.data;
}

function renderEmployeeProfileSession() {
  const bodyEl = document.getElementById("employeeProfileBody");
  const srcEl = document.getElementById("employeeProfileSource");
  if (!bodyEl || !srcEl) return;
  const sess = sessionIdentity || {};
  if (!sess?.user) {
    srcEl.textContent = "session";
    bodyEl.textContent = "请先在右上角选择操作人。";
    return;
  }
  srcEl.textContent = "session";
  bodyEl.innerHTML = `
    <ul class="employee-profile-list">
      <li>姓名：${esc(sess.display || sess.user)}</li>
      <li>登录名：${esc(sess.login_id || "—")}</li>
      <li>工号：${esc(sess.staff_id || "—")}</li>
      <li>来源：${esc(sess.source || "none")}</li>
    </ul>`;
}

function renderEmployeeProfileDw(row) {
  const bodyEl = document.getElementById("employeeProfileBody");
  const srcEl = document.getElementById("employeeProfileSource");
  if (!bodyEl || !srcEl) return;
  const name = pickRowField(row, ["staff_name", "staffname", "name"]);
  const staffId = pickRowField(row, ["staff_id8", "staff_id", "employee_id"]);
  const org = pickRowField(row, ["org_name", "organization_name", "department_name", "dept_name"]);
  const subject = pickRowField(row, ["manage_unit_name", "management_subject_name"]);
  const status = pickRowField(row, ["hr_status_name", "staff_status_name"]);
  const staffType = pickRowField(row, ["staff_type_name", "staff_category_name"]);
  const workspace = pickRowField(row, ["work_space_city_name", "workplace_name", "work_location_name"]);
  const email = pickRowField(row, ["email", "mail", "work_email"]);
  srcEl.textContent = "hr-ai-data";
  bodyEl.innerHTML = `
    <ul class="employee-profile-list">
      <li>姓名：${esc(name || (sessionIdentity?.display || sessionIdentity?.user || "—"))}</li>
      <li>工号：${esc(staffId || sessionIdentity?.staff_id || "—")}</li>
      <li>组织：${esc(org || "—")}</li>
      <li>管理主体：${esc(subject || "—")}</li>
      <li>员工状态：${esc(status || "—")} / ${esc(staffType || "—")}</li>
      <li>工作地：${esc(workspace || "—")}</li>
      <li>邮箱：${esc(email || "—")}</li>
    </ul>`;
}

async function loadEmployeeProfile() {
  const bodyEl = document.getElementById("employeeProfileBody");
  if (!bodyEl) return;
  renderEmployeeProfileSession();
  const actor = getCurrentUser();
  if (!actor) return;
  if (!sessionIdentity?.user) {
    sessionIdentity = { user: actor, display: actor, source: "picker" };
  }
  const profileSess = sessionIdentity || {};
  if (!profileSess?.user) return;
  const candidates = [];
  if (profileSess.staff_id) candidates.push(`SELECT * FROM ${HR_STAFF_WIDE_TABLE} WHERE staff_id8 = ${sqlLiteral(profileSess.staff_id)} LIMIT 1`);
  if (profileSess.display || profileSess.user) {
    const name = (profileSess.display || profileSess.user || "").split("(").pop()?.replace(")", "").trim() || (profileSess.user || "").trim();
    if (name) candidates.push(`SELECT * FROM ${HR_STAFF_WIDE_TABLE} WHERE staff_name = ${sqlLiteral(name)} LIMIT 1`);
  }
  if (profileSess.login_id) candidates.push(`SELECT * FROM ${HR_STAFF_WIDE_TABLE} WHERE email LIKE ${sqlLiteral(`%${profileSess.login_id}%`)} LIMIT 1`);
  for (const sql of candidates) {
    try {
      const rows = await queryHrDw(sql);
      if (rows.length) {
        renderEmployeeProfileDw(rows[0]);
        return;
      }
    } catch {
      // Keep trying fallback queries; session profile remains visible.
    }
  }
}

function renderUserBadge(sess) {
  const badge = document.getElementById("userBadge");
  if (!badge) return;
  const nameEl = document.getElementById("userDisplayName");
  const subEl = document.getElementById("userStaffMeta");
  const roleEl = document.getElementById("userRoleTag");
  const avatar = document.getElementById("userAvatar");
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
  if (roleEl) {
    roleEl.textContent = sess.registered
      ? (sess.console_role || sess.role || "member")
      : "未登记";
  }
  if (!sess.registered) badge.classList.add("guest");
}

async function initSessionIdentity() {
  await loadOperators();
  populateOperatorSelect(document.getElementById("currentUser"));
  const qs = getDevStaffQuery();
  const url = `${API}/api/permissions/session${qs ? `?staffname=${encodeURIComponent(qs)}` : ""}`;
  try {
    sessionIdentity = await fetch(url).then((r) => r.json());
  } catch {
    sessionIdentity = null;
  }
  const saved = normalizeUser(localStorage.getItem("ssc_user_name") || "");
  const fromQuery = qs ? normalizeUser(qs) : "";
  const sessionUser = sessionIdentity?.user ? normalizeUser(sessionIdentity.user) : "";
  const user = saved || fromQuery || sessionUser;
  if (user && operatorsCache.some((o) => o.name === user)) {
    setCurrentUser(user);
    userPermissions = sessionIdentity?.user === user && sessionIdentity?.registered !== undefined
      ? sessionIdentity
      : await loadUserPermissions();
  } else {
    userPermissions = null;
    renderUserBadge(null);
  }
  if (userPermissions?.user) renderUserBadge(userPermissions);
  await loadEmployeeProfile();
  if (!userPermissions?.user) await loadUserPermissions();
}

/** API 失败时的兜底名单（与 permissions.json 一致） */
const OPERATOR_FALLBACK = [
  { name: "刘微", display: "vvvliu(刘微)", login_id: "vvvliu" },
  { name: "叶佩彦", display: "phayyan(叶佩彦)", login_id: "phayyan" },
  { name: "罗东明", display: "aicoluo(罗东明)", login_id: "aicoluo" },
  { name: "张文婧", display: "annawzhang(张文婧)", login_id: "annawzhang" },
  { name: "杨文山", display: "boonsanyeoh(杨文山)", login_id: "boonsanyeoh" },
  { name: "吴丽芳", display: "danniewu(吴丽芳)", login_id: "danniewu" },
  { name: "EMILY KHOO", display: "emilykhoo(EMILY KHOO)", login_id: "emilykhoo" },
  { name: "YEN HOOI GOH", display: "feliciagoh(YEN HOOI GOH)", login_id: "feliciagoh" },
  { name: "JIN YI OW", display: "jinyiow(JIN YI OW)", login_id: "jinyiow" },
  { name: "SHEE HUEY LIM", display: "michellelim(SHEE HUEY LIM)", login_id: "michellelim" },
  { name: "NICOLE NG", display: "nicng(NICOLE NG)", login_id: "nicng" },
  { name: "颜宝玲", display: "paulinegan(颜宝玲)", login_id: "paulinegan" },
  { name: "单钱君", display: "qianjunshan(单钱君)", login_id: "qianjunshan" },
];

const USER_ALIASES = {
  "liu wei": "刘微",
  "liuwei": "刘微",
  "vvvliu": "刘微",
  "刘薇": "刘微",
};

function normalizeUser(name) {
  const n = String(name ?? "").trim();
  if (!n) return "";
  for (const o of operatorsCache) {
    if (o.name === n || o.login_id === n || o.display === n) return o.name;
    for (const a of o.aliases || []) {
      if (a === n || String(a).toLowerCase() === n.toLowerCase()) return o.name;
    }
  }
  const key = n.toLowerCase().replace(/\s+/g, " ");
  return USER_ALIASES[key] || n;
}

async function loadOperators() {
  const hint = document.getElementById("operatorHint");
  try {
    const res = await fetch(`${API}/api/permissions/operators`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    operatorsCache = data.operators || [];
    if (!operatorsCache.length) operatorsCache = [...OPERATOR_FALLBACK];
    if (hint) hint.hidden = true;
  } catch (e) {
    operatorsCache = [...OPERATOR_FALLBACK];
    if (hint) {
      hint.hidden = false;
      hint.textContent = `名单离线 · 已用本地兜底 · ${e.message || "请刷新"}`;
      hint.classList.add("warn");
    }
  }
  populateOperatorSelect(document.getElementById("currentUser"));
  populateOperatorSelect(document.getElementById("qaCurrentUser"));
}

function populateOperatorSelect(sel) {
  if (!sel) return;
  const saved = normalizeUser(localStorage.getItem("ssc_user_name") || "");
  const cur = normalizeUser(sel.value || saved);
  sel.innerHTML = `<option value="">请选择操作人</option>${operatorsCache.map(o =>
    `<option value="${esc(o.name)}"${o.name === cur ? " selected" : ""}>${esc(o.display || o.name)}</option>`
  ).join("")}`;
  if (cur && operatorsCache.some(o => o.name === cur)) sel.value = cur;
}

function fileUrl(path) {
  if (!path) return "#";
  const user = getCurrentUser();
  const u = user ? `&user=${encodeURIComponent(user)}` : "";
  return `${API}/api/files?path=${encodeURIComponent(path)}${u}`;
}

function currentUserQueryParams(params = new URLSearchParams()) {
  const user = getCurrentUser();
  if (user && !params.get("user")) params.set("user", user);
  return params;
}

function canCreateProject() {
  const user = getCurrentUser();
  if (!user) return false;
  return !!userPermissions?.can_create_projects;
}

function sortProjectsByBlackboard(projects) {
  return [...projects].sort((a, b) => {
    const ta = a.blackboard?.updated_at || "";
    const tb = b.blackboard?.updated_at || "";
    return tb.localeCompare(ta);
  });
}

function canManageProject(projectId, p) {
  const user = getCurrentUser();
  if (!user) return false;
  const owner = normalizeUser(p?.permission_owner || p?.owner || "");
  if (user === owner || normalizeUser(user) === owner) return true;
  const bb = userPermissions?.can_blackboard || [];
  const up = userPermissions?.can_upload_files || [];
  const sync = userPermissions?.can_sync_progress || [];
  return bb.includes("*") || bb.includes(projectId) ||
    up.includes("*") || up.includes(projectId) ||
    sync.includes("*") || sync.includes(projectId);
}

function enrichProjectClient(p) {
  const files = (p.files || []).map(f => ({
    ...f,
    uploaded_at: f.uploaded_at || f.updated_at || "",
    download_url: f.download_url || fileUrl(f.path),
    exists: f.exists !== false,
  }));
  return { ...p, files };
}

async function fetchLinkedMeetings(project) {
  const ids = project?.linked_meeting_ids || [];
  if (!ids.length) return [];
  try {
    const data = await fetch(`${API}/api/meetings`).then(r => r.json());
    return (data.items || []).filter(m => ids.includes(m.id));
  } catch {
    return [];
  }
}

async function fetchProjectDetail(projectId) {
  const user = getCurrentUser();
  const qsUser = user ? `&user=${encodeURIComponent(user)}` : "";
  const qsBase = user ? `?user=${encodeURIComponent(user)}` : "";

  const tries = [
    `${API}/api/projects/${encodeURIComponent(projectId)}${qsBase}`,
    `${API}/api/projects?project_id=${encodeURIComponent(projectId)}${qsUser}`,
  ];

  for (const url of tries) {
    try {
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.project) return data;
      if (res.status === 403) throw new Error(data.detail || "无权查看该项目");
    } catch (e) {
      if (e.message?.includes("无权")) throw e;
    }
  }

  if (!projectsCache.length) await loadProjectsData();
  const cached = projectsCache.find(p => p.id === projectId);
  if (cached) {
    return {
      ok: true,
      project: enrichProjectClient(cached),
      linked_meetings: await fetchLinkedMeetings(cached),
      _fromCache: true,
    };
  }
  throw new Error("项目未找到 · 请在工作区执行 git pull 后 bash knot-chat/start_web.sh 重启服务");
}

function renderMiniTimeline(nodes) {
  if (!nodes?.length) return "<p class='muted card-empty'>暂无处理节点</p>";
  return `<div class="mini-timeline">${nodes.map((n, i) => `
    <div class="mini-node ${esc(n.status)}" title="${esc(n.description || "")}">
      <div class="mini-dot">${n.status === "done" ? "✓" : i + 1}</div>
      <div class="mini-label">${esc(n.label)}</div>
      <div class="mini-date">${esc(n.date)}</div>
    </div>`).join("")}</div>`;
}

function renderRoleChips(p) {
  const roles = p.roles?.length ? p.roles : [
    { role: p.permission_owner_title || "People Operation Manager", name: "—", duty: "小黑板 · 进度维护" },
    { role: "Project Owner", name: p.owner, duty: "交付" },
  ];
  return `<div class="role-chips">${roles.map(r => `
    <div class="role-chip">
      <div class="role-title">${esc(r.role)}</div>
      <div class="role-name">${esc(r.name)}</div>
      <div class="role-duty">${esc(r.duty || "")}</div>
    </div>`).join("")}</div>`;
}

function renderCardFiles(p) {
  const files = p.files || [];
  const canDel = canDeleteFiles(p.id);
  const list = files.length ? files.slice(0, 6).map(f => `
    <div class="card-file-item">
      <span class="file-icon">📄</span>
      <div>
        <div class="file-name">${esc(f.name)}</div>
        <div class="file-meta">${esc(f.category)} · ${esc(f.uploaded_by || "—")} · ${fmtDateTime(f.uploaded_at || f.updated_at)}</div>
      </div>
      <div class="file-actions-inline">
        ${f.path ? `<a class="btn btn-sm" href="${esc(fileUrl(f.path))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">打开</a>` : ""}
        ${canDel && f.path ? `<button type="button" class="btn btn-sm btn-danger card-del-file" data-id="${esc(p.id)}" data-path="${esc(f.path)}">删除</button>` : ""}
      </div>
    </div>`).join("") : "<p class='muted card-empty'>暂无文件 · 可上传 SOP / 纪要 / 产出</p>";
  const upload = `
    ${operatorHintHtml()}
    <form class="card-upload-form" data-project-id="${esc(p.id)}">
      <input type="file" class="card-file-input" required />
      <select class="card-file-cat">
        <option value="上传">上传</option>
        <option value="SOP">SOP</option>
        <option value="会议纪要">会议纪要</option>
      </select>
      <button type="submit" class="btn btn-sm btn-primary">上传文件</button>
      <span class="upload-msg muted" style="font-size:11px"></span>
    </form>`;
  return `${list}${files.length > 6 ? `<p class="muted" style="font-size:11px;margin:6px 0 0">还有 ${files.length - 6} 个文件 · 进入详情查看</p>` : ""}${upload}`;
}

function renderCardWriteSection(p) {
  return `
    <div class="card-section card-write">
      <h4>写入项目 · 动态 / 知识库</h4>
      <div class="card-note-row">
        <textarea class="card-note-input" rows="2" placeholder="写一条项目动态…"></textarea>
        <button type="button" class="btn btn-sm btn-primary card-note-btn" data-id="${esc(p.id)}">发布动态</button>
      </div>
      <button type="button" class="btn btn-sm card-sync-kb-btn" data-id="${esc(p.id)}">同步本项目到知识库</button>
      <span class="write-msg muted" style="font-size:11px;display:block;margin-top:6px"></span>
    </div>`;
}

function renderCardBlackboard(p, canEdit) {
  const bb = p.blackboard || {};
  const ownerTitle = p.permission_owner_title || "People Operation Manager";
  const reminders = bb.reminders || [];
  return `
    <div class="card-section card-blackboard">
      <div class="bb-header">
        <h4>小黑板</h4>
        <span class="bb-owner">${esc(p.permission_owner_title || "People Operation Manager")}</span>
      </div>
      <div class="bb-body">${esc(bb.progress_summary || "（尚未发布进度摘要）")}</div>
      ${reminders.length ? `<div class="bb-rem-list">${reminders.map(r => `
        <span class="bb-rem level-${esc(r.level || "medium")}">${esc(r.due || "—")} ${esc(r.text)}</span>`).join("")}</div>` : ""}
      <div class="bb-foot">更新：${esc(bb.updated_by || "—")} · ${fmtDateTime(bb.updated_at)}</div>
      ${canEdit ? `
      <details class="bb-inline-edit">
        <summary>编辑并发布小黑板</summary>
        <textarea class="bb-edit-summary" rows="3">${esc(bb.progress_summary || "")}</textarea>
        <textarea class="bb-edit-reminders" rows="2" placeholder="日期|提醒内容，每行一条">${reminders.map(r => `${r.due || ""}|${r.text}`).join("\n")}</textarea>
        <button type="button" class="btn btn-sm btn-primary bb-save-btn" data-id="${esc(p.id)}">发布</button>
        <span class="bb-save-msg muted" style="font-size:11px;margin-left:6px"></span>
      </details>` : ""}
    </div>`;
}

function projectRichCard(p) {
  const canManage = canManageProject(p.id, p);
  const pct = p.progress || 0;
  const bb = p.blackboard || {};
  const snippet = (bb.progress_summary || "").slice(0, 120);
  const openRem = (bb.reminders || []).length;
  return `
    <article class="project-rich-card project-rich-card-slim" data-id="${esc(p.id)}">
      <div class="rich-card-top">
        <div class="rich-card-title">
          <h3>${esc(p.name)}</h3>
          <span class="tier">${esc(p.tier)} · ${pct}% · ${esc(p.owner || "—")}</span>
          ${snippet ? `<p class="rich-summary bb-snippet">${esc(snippet)}${(bb.progress_summary || "").length > 120 ? "…" : ""}</p>` : `<p class="rich-summary muted">（小黑板暂无摘要）</p>`}
          ${openRem ? `<span class="muted" style="font-size:11px">${openRem} 条提醒</span>` : ""}
        </div>
        <div class="rich-progress-block">
          <div class="progress-ring-sm" style="--pct:${pct}"><span class="pct-label">${pct}%</span></div>
          ${canManage ? `<button type="button" class="btn btn-sm sync-progress-btn" data-id="${esc(p.id)}">同步进度</button>` : ""}
        </div>
      </div>
      <div class="rich-card-foot">
        <button type="button" class="btn btn-sm btn-primary btn-detail" data-id="${esc(p.id)}">进入项目 →</button>
      </div>
    </article>`;
}

function renderBlackboardHero(projects) {
  const sorted = sortProjectsByBlackboard(projects);
  const latest = sorted[0];
  if (!latest?.blackboard?.progress_summary) {
    return `<div class="blackboard-hero">
      <div class="hero-label">小黑板</div>
      <div class="hero-text">各项目进度摘要将显示在此处（由 People Operation Manager 发布）。</div>
    </div>`;
  }
  const bb = latest.blackboard;
  return `
    <div class="blackboard-hero">
      <div class="hero-label">最新小黑板 · ${esc(latest.name)}</div>
      <div class="hero-text">${esc(bb.progress_summary)}</div>
      <div class="hero-meta">更新：${fmtDateTime(bb.updated_at)} · ${esc(latest.name)}</div>
    </div>`;
}

function projectCard(p, mode) {
  const bb = p.blackboard || {};
  const snippet = (bb.progress_summary || "").slice(0, 80);
  const reminders = bb.reminders || [];
  const highRem = reminders.find(r => r.level === "high");
  const sel = mode !== "list" && p.id === selectedProjectId ? " selected" : "";
  return `<div class="project-card${sel}" data-id="${esc(p.id)}" role="button" tabindex="0">
    <div class="head"><h3>${esc(p.name)}</h3><span class="tier">${esc(p.tier)}</span></div>
    <div class="summary">${esc(p.summary)}</div>
    ${snippet ? `<div class="blackboard-snippet">${highRem ? '<span class="reminder-dot"></span>' : ""}${esc(snippet)}${snippet.length >= 80 ? "…" : ""}</div>` : ""}
    <div class="progress-line">
      <div class="progress-track"><div class="progress-fill" style="width:${p.progress || 0}%"></div></div>
      <div class="progress-pct">${p.progress || 0}%</div>
    </div>
    <div class="project-meta">${esc(p.permission_owner || p.owner)} · ${esc(p.status_label || p.status)} · 截止 ${esc(p.due)}</div>
  </div>`;
}

function bindProjectCardClicks(containerId, onClick) {
  document.getElementById(containerId)?.querySelectorAll(".project-card").forEach(el => {
    const go = () => onClick(el.dataset.id);
    el.onclick = go;
    el.onkeydown = (e) => { if (e.key === "Enter") go(); };
  });
}

function showProjectsList() {
  const list = document.getElementById("projectsList");
  const detail = document.getElementById("projectsDetail");
  list?.classList.remove("is-hidden");
  detail?.classList.remove("is-open");
  selectedProjectId = null;
  location.hash = "projects";
}

async function openProjectDetail(projectId) {
  if (!projectId) return;
  selectedProjectId = projectId;
  const list = document.getElementById("projectsList");
  const detail = document.getElementById("projectsDetail");
  list?.classList.add("is-hidden");
  detail?.classList.add("is-open");
  location.hash = `projects/${projectId}`;
  const root = document.getElementById("projectDetailRoot");
  if (!root) return;
  root.innerHTML = "<p class='muted'>加载中…</p>";
  detail?.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    if (!userPermissions) await loadUserPermissions();
    const data = await fetchProjectDetail(projectId);
    projectDetailCache = data;
    const canBb = canManageProject(projectId, data.project);
    const cacheNote = data._fromCache
      ? `<p class="muted" style="font-size:12px;margin-bottom:12px">⚠ 详情 API 未就绪，已用列表数据展示 · 请 git pull 后重启 start_web.sh</p>`
      : "";
    root.innerHTML = cacheNote + renderProjectDetail(data.project, data.linked_meetings || [], canBb);
    bindBlackboardForm(data.project);
    bindNoteForm(data.project);
    bindDetailUploadForm(data.project);
    bindDetailProgressSync(data.project, canBb);
    bindProjectDetailTabs();
    document.getElementById("pageTitle").textContent = data.project.name;
    detail?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    root.innerHTML = `<div class="detail-section"><p class='muted'>加载失败：${esc(e.message)}</p>
      <p class="muted" style="font-size:12px">请确认 Gateway 已启动且已 git pull · API: ${esc(API)}</p>
      <button type="button" class="btn btn-sm" id="btnRetryDetail">重试</button>
      <button type="button" class="btn btn-sm" id="btnBackFromErr">返回列表</button></div>`;
    document.getElementById("btnRetryDetail")?.addEventListener("click", () => openProjectDetail(projectId));
    document.getElementById("btnBackFromErr")?.addEventListener("click", showProjectsList);
  }
}

function renderNodeTimeline(nodes) {
  if (!nodes?.length) return "<p class='muted'>暂无处理节点</p>";
  return `<div class="node-timeline">${nodes.map((n, i) => `
    <div class="node-step ${esc(n.status)}">
      <div class="node-dot">${n.status === "done" ? "✓" : i + 1}</div>
      <div class="node-label">${esc(n.label)}</div>
      <div class="node-date">${esc(n.date)}</div>
      <div class="node-desc">${esc(n.description || "")}</div>
    </div>`).join("")}</div>`;
}

function renderTaskTable(tasks) {
  if (!tasks?.length) return "<p class='muted'>暂无任务</p>";
  return `<table class="task-table"><thead><tr>
    <th>任务名称</th><th>起止时间</th><th>进度</th><th>负责人</th><th>周期</th><th>备注</th>
  </tr></thead><tbody>${tasks.map(t => `
    <tr>
      <td><strong>${esc(t.name)}</strong></td>
      <td>${esc(t.start)} ~ ${esc(t.end)}</td>
      <td class="task-progress">${t.progress || 0}%
        <div class="task-progress-bar"><div style="width:${t.progress || 0}%"></div></div>
      </td>
      <td>${esc(t.owner)}</td>
      <td>${esc(t.duration)}</td>
      <td class="muted">${esc(t.notes || "—")}</td>
    </tr>`).join("")}</tbody></table>`;
}

function renderFileList(files, showUpload, projectId) {
  const canDel = canDeleteFiles(projectId);
  const rows = (files || []).length ? (files || []).map(f => {
    const missing = f.exists === false;
    const href = f.download_url || fileUrl(f.path);
    return `
    <div class="file-item${missing ? " missing" : ""}">
      <div>
        <div class="file-name">${esc(f.name)}${missing ? " <span class='muted'>(文件待上传)</span>" : ""}</div>
        <div class="file-meta">
          ${esc(f.category || "—")} · 操作人 <strong>${esc(f.uploaded_by || "—")}</strong>
          · 上传 <strong>${fmtDateTime(f.uploaded_at || f.updated_at)}</strong>
          · <code>${esc(f.path)}</code>
        </div>
      </div>
      <div class="file-actions">
        <a class="btn btn-sm file-open-btn" href="${esc(href)}" target="_blank" rel="noopener">打开 / 下载</a>
        ${canDel && f.path ? `<button type="button" class="btn btn-sm btn-danger detail-del-file" data-path="${esc(f.path)}">删除</button>` : ""}
      </div>
    </div>`;
  }).join("") : "<p class='muted'>暂无文件</p>";
  const upload = showUpload ? `
    <div class="upload-panel">
      <label>上传项目文件（SOP · 纪要 · 产出）</label>
      ${operatorHintHtml()}
      <form id="detailUploadForm" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">
        <input type="file" id="detailFileInput" required />
        <select id="detailFileCategory" style="padding:6px 8px;border-radius:6px;border:1px solid var(--border)">
          <option value="上传">上传</option>
          <option value="SOP">SOP</option>
          <option value="会议纪要">会议纪要</option>
          <option value="产出">产出</option>
          <option value="需求">需求</option>
        </select>
        <button type="submit" class="btn btn-sm btn-primary">上传</button>
        <span class="muted" id="detailUploadMsg" style="font-size:12px"></span>
      </form>
    </div>` : "";
  return `<div class="file-list">${rows}</div>${upload}`;
}

function renderActivityLog(logs) {
  if (!logs?.length) return "<p class='muted'>暂无操作记录 · 上传文件、同步进度、发布动态会自动记录</p>";
  return `<div class="ops-log">${logs.map(l => `
    <div class="ops-log-item">
      <div class="ops-time">${fmtDateTime(l.at)}</div>
      <div class="ops-user">${esc(l.by || "—")}</div>
      <div class="ops-text">${esc(l.text || "")}</div>
    </div>`).join("")}</div>`;
}

function renderBlackboardPanel(p, editable) {
  const bb = p.blackboard || {};
  const reminders = bb.reminders || [];
  return `
    <div class="blackboard-panel">
      <h3>小黑板 · ${esc(p.permission_owner_title || "People Operation Manager")}</h3>
      <div class="bb-summary">${esc(bb.progress_summary || "（尚未填写）")}</div>
      <div class="bb-reminders">
        ${reminders.length ? reminders.map(r => `
          <div class="bb-reminder level-${esc(r.level || "medium")}">
            <span>⏰ ${esc(r.due || "—")}</span><span>${esc(r.text)}</span>
          </div>`).join("") : "<div class='bb-reminder'>暂无提醒</div>"}
      </div>
      <div class="bb-meta">更新：${esc(bb.updated_by || "—")} · ${esc(bb.updated_at || "—")}</div>
      ${editable ? `
      <div class="blackboard-edit">
        <label>操作人姓名</label>
        <input type="text" id="bbEditor" value="${esc(getEditorName())}" placeholder="与 permissions.json 一致" />
        <label>进度摘要</label>
        <textarea id="bbSummary" rows="3">${esc(bb.progress_summary || "")}</textarea>
        <label>提醒（每行：日期|内容）</label>
        <textarea id="bbReminders" rows="3">${reminders.map(r => `${r.due || ""}|${r.text}`).join("\n")}</textarea>
        <button type="button" class="btn btn-primary btn-sm" id="btnSaveBlackboard">保存小黑板</button>
        <span class="muted" id="bbSaveMsg" style="margin-left:8px;font-size:12px"></span>
      </div>` : ""}
    </div>`;
}

function renderProjectDetail(p, meetings, canBb) {
  const pct = p.progress || 0;
  const cols = [["todo", "To Do"], ["in_progress", "In Progress"], ["review", "Review"], ["done", "Done"]];
  const kb = p.kanban || {};
  const logs = p.activity_log || [];
  const fppUrl = registryCache?.deployment?.fpp_portal_url || "#";
  const jobTitle = p.permission_owner_title || "People Operation Manager";
  return `
    <div class="project-detail-header">
      <div>
        <h2>${esc(p.name)} <span class="priority-tag">${esc(p.priority || p.tier)}</span></h2>
        <p class="status-tag">${esc(p.status_label || p.status)}</p>
        <p class="detail-goal">${esc(p.goal || p.summary)}</p>
        <div class="project-meta-row">
          <span>负责人 <strong>${esc(p.owner)}</strong></span>
          <span>${esc(jobTitle)}</span>
          <span>${esc(p.start_date || "—")} ~ ${esc(p.due)}</span>
          <span id="detailPctLabel">${pct}%</span>
        </div>
        ${canBb ? `<div class="detail-progress-sync">
          <input type="range" id="detailProgressSlider" min="0" max="100" value="${pct}" />
          <button type="button" class="btn btn-primary btn-sm" id="btnDetailSyncProgress">同步进度</button>
          <span class="sync-msg" id="detailSyncMsg"></span>
        </div>` : ""}
      </div>
      <div class="progress-ring" id="detailProgressRing" style="--pct:${pct}"><span>${pct}%</span></div>
    </div>

    <div class="detail-tabs">
      <button type="button" class="detail-tab active" data-pane="overview">概览</button>
      <button type="button" class="detail-tab" data-pane="files">文件</button>
      <button type="button" class="detail-tab" data-pane="meetings">会议</button>
      <button type="button" class="detail-tab" data-pane="activity">动态</button>
    </div>

    <div id="pane-overview" class="detail-pane active">
      ${renderBlackboardPanel(p, canBb)}
      <div class="detail-section">
        <h3>处理节点</h3>
        ${renderNodeTimeline(p.nodes)}
        <p class="section-title" style="margin-top:16px">Kanban</p>
        <div class="kanban">${cols.map(([k, t]) =>
          `<div class="k-col"><h4>${t}</h4>${(kb[k] || []).map(x => `<div class="k-item">${esc(x)}</div>`).join("") || "<span class='muted'>—</span>"}</div>`
        ).join("")}</div>
      </div>
      <div class="detail-section">
        <h3>项目角色</h3>
        ${renderRoleChips(p)}
      </div>
      <div class="detail-section">
        <h3>里程碑</h3>
        <div class="milestone-list">${(p.milestones || []).map(m =>
          `<div class="milestone-item">${m.done ? "✓" : "○"} ${esc(m.label)} · ${esc(m.date)}</div>`
        ).join("") || "<span class='muted'>—</span>"}</div>
      </div>
    </div>

    <div id="pane-files" class="detail-pane">
      <div class="detail-section">
        <h3>项目文件 · ${(p.files || []).length} 个</h3>
        ${renderFileList(p.files, true, p.id)}
      </div>
    </div>

    <div id="pane-meetings" class="detail-pane">
      <div class="detail-section">
        <h3>关联纪要</h3>
        ${meetings.length ? meetings.map(m => `
          <div class="panel" style="margin-bottom:12px"><h4 style="margin:0 0 8px">${esc(m.title)}</h4>
          <p class="muted">${esc(m.started_at)}</p><p>${esc(m.summary)}</p>
          <ul>${(m.action_items || []).map(a => `<li>${esc(a.text)} · ${esc(a.owner)}</li>`).join("")}</ul></div>`).join("")
          : "<p class='muted'>暂无 · 会议 Tab 可推小黑板</p>"}
      </div>
    </div>

    <div id="pane-activity" class="detail-pane">
      <div class="detail-section">
        <h3>操作记录 · ${logs.length} 条</h3>
        ${renderActivityLog(logs)}
        <div class="panel detail-note-box">
          <label>写项目动态</label>
          <textarea id="noteText" rows="3" placeholder="今日进展…"></textarea>
          <button type="button" class="btn btn-primary btn-sm" id="btnSaveNote">发布</button>
          <button type="button" class="btn btn-sm" id="btnDetailSyncKb">同步知识库</button>
          <span class="muted" id="noteSaveMsg"></span>
        </div>
      </div>
      ${(p.tasks || []).length ? `<div class="detail-section"><h3>任务表</h3>${renderTaskTable(p.tasks)}</div>` : ""}
    </div>`;
}

function bindProjectDetailTabs() {
  document.querySelectorAll(".detail-tab").forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll(".detail-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".detail-pane").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`pane-${tab.dataset.pane}`)?.classList.add("active");
    };
  });
}

function bindBlackboardForm(p) {
  const btn = document.getElementById("btnSaveBlackboard");
  if (!btn) return;
  btn.onclick = async () => {
    const editor = document.getElementById("bbEditor")?.value?.trim() || "";
    localStorage.setItem("ssc_editor_name", editor);
    const progress_summary = document.getElementById("bbSummary")?.value || "";
    const raw = document.getElementById("bbReminders")?.value || "";
    const reminders = raw.split("\n").filter(Boolean).map(line => {
      const [due, ...rest] = line.split("|");
      return { due: rest.length ? due.trim() : "", text: (rest.join("|") || due).trim(), level: "medium" };
    });
    const msg = document.getElementById("bbSaveMsg");
    try {
      const res = await fetch(`${API}/api/projects/${p.id}/blackboard`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editor, progress_summary, reminders }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "保存失败");
      if (msg) msg.textContent = "已保存";
      await openProjectDetail(p.id);
    } catch (e) {
      if (msg) msg.textContent = e.message || "保存失败";
    }
  };
}

function parseProjectsHash() {
  const m = location.hash.match(/^#projects\/([^/]+)/);
  return m ? m[1] : null;
}

function getEditorName() {
  return localStorage.getItem("ssc_editor_name") || getCurrentUser();
}

function getCurrentUser() {
  const picked = normalizeUser(
    document.getElementById("currentUser")?.value ||
      document.getElementById("qaCurrentUser")?.value ||
      localStorage.getItem("ssc_user_name") ||
      ""
  );
  if (picked) return picked;
  const sessUser = sessionIdentity?.user;
  if (sessUser && !looksLikeToken(sessUser)) return normalizeUser(sessUser);
  return "";
}

function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user) {
    alert("请先在右上角选择操作人。");
    document.getElementById("currentUser")?.focus();
    return null;
  }
  return user;
}

function operatorHintHtml() {
  const u = getCurrentUser();
  return u
    ? `<span class="operator-hint">操作人：<strong>${esc(u)}</strong>（permissions.json）</span>`
    : `<span class="operator-hint warn">未选操作人 · 写操作不可用</span>`;
}

function canDeleteFiles(projectId) {
  const user = getCurrentUser();
  if (!user || !userPermissions?.registered) return userPermissions?.role === "admin";
  const scope = userPermissions.can_delete_files || [];
  return userPermissions.role === "admin" || scope.includes("*") || scope.includes(projectId);
}

async function deleteProjectFile(projectId, filePath, btn, msgEl) {
  const editor = requireCurrentUser();
  if (!editor) return;
  if (!confirm("确定从项目中移除此文件？（uploads 目录下的物理文件会删除）")) return;
  const orig = btn?.textContent;
  if (btn) btn.textContent = "…";
  if (msgEl) msgEl.textContent = "删除中…";
  try {
    const qs = new URLSearchParams({ path: filePath, editor });
    const res = await fetch(`${API}/api/projects/${encodeURIComponent(projectId)}/files?${qs}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.detail || "删除失败");
    if (msgEl) msgEl.textContent = "已删除 · 知识库已更新";
    await loadProjectsView();
    if (selectedProjectId === projectId) await openProjectDetail(projectId);
    await loadKnowledge();
  } catch (e) {
    if (msgEl) msgEl.textContent = e.message || "失败";
    if (btn) btn.textContent = orig || "删除";
  }
}

function setCurrentUser(name) {
  const n = normalizeUser(name) || String(name || "").trim();
  if (n) {
    localStorage.setItem("ssc_user_name", n);
    localStorage.setItem("ssc_editor_name", n);
  } else {
    localStorage.removeItem("ssc_user_name");
    localStorage.removeItem("ssc_editor_name");
  }
  const el = document.getElementById("currentUser");
  if (el) el.value = n || "";
  const qaEl = document.getElementById("qaCurrentUser");
  if (qaEl && qaEl !== el) qaEl.value = n || "";
}

async function loadUserPermissions() {
  const user = getCurrentUser();
  if (!user) {
    userPermissions = { registered: false, role: "guest", tabs: ["home", "admin-access"] };
    return userPermissions;
  }
  if (sessionIdentity?.user === user && sessionIdentity?.registered !== undefined) {
    userPermissions = sessionIdentity;
    renderUserBadge(sessionIdentity);
    return userPermissions;
  }
  try {
    userPermissions = await fetch(`${API}/api/permissions/me?user=${encodeURIComponent(user)}`).then((r) => r.json());
    renderUserBadge(userPermissions?.user ? userPermissions : null);
    return userPermissions;
  } catch { userPermissions = null; return null; }
}

function tabsAllowedForCurrentUser() {
  const user = getCurrentUser();
  if (!user) return new Set(["home", "admin-access"]);
  if (!userPermissions?.registered) {
    return new Set(userPermissions?.tabs || ["home", "knowledge", "admin-access"]);
  }
  const tabs = userPermissions.tabs || [];
  if (tabs.includes("*")) return null;
  return new Set([...tabs, "admin-access"]);
}

function isViewAllowed(id) {
  if (!id) return true;
  if (id === "agents" || (id.startsWith("admin-") && id !== "admin-access")) {
    return isAdminUser();
  }
  const allowed = tabsAllowedForCurrentUser();
  if (allowed === null) return true;
  return allowed.has(id)
    || (id === "tools-americas" && allowed.has("tools"))
    || (id === "tools-sg" && (allowed.has("tools") || allowed.has("tools-non-americas")))
    || (id === "tools-non-americas" && allowed.has("tools"));
}

function updateOperatorGateBanner(blockedView) {
  const el = document.getElementById("operatorGateBanner");
  if (!el) return;
  const user = getCurrentUser();
  const safeUser = user && !looksLikeToken(user) ? user : "";
  if (!safeUser) {
    el.hidden = false;
    el.innerHTML = "<p>请从右上角<strong>选择操作人</strong> · 未选择时仅可浏览<strong>全局总览</strong>与<strong>权限申请</strong>。</p>";
    return;
  }
  if (!userPermissions?.registered) {
    el.hidden = false;
    el.innerHTML = `<p><strong>${esc(safeUser)}</strong> 未在 permissions.json 登记 · 仅可浏览首页、知识库、权限申请 · 写操作与业务 Tab 需 admin 审批</p>`;
    return;
  }
  if (blockedView && !isViewAllowed(blockedView)) {
    el.hidden = false;
    el.innerHTML = `<p>当前账号无权访问「${esc(TITLES[blockedView] || blockedView)}」 · 请走<strong>权限申请</strong>或联系 admin</p>`;
    return;
  }
  el.hidden = true;
  el.innerHTML = "";
}

function isAdminUser() {
  return userPermissions?.role === "admin";
}

function canScheduleMeeting() {
  if (!userPermissions?.registered) return false;
  if (userPermissions?.can_schedule_meeting !== undefined) return !!userPermissions.can_schedule_meeting;
  const tabs = userPermissions?.tabs || [];
  const hasMeetingTab = tabs.includes("*") || tabs.includes("meetings");
  return hasMeetingTab && userPermissions?.role !== "viewer";
}

function applyMeetingEntryPermissions() {
  const allow = canScheduleMeeting();
  ["btnTencentMeetingEntry", "btnWecomCalendarEntry"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = allow ? "" : "none";
  });
}

function applyNavPermissions() {
  document.querySelectorAll("[data-admin-only]").forEach(el => {
    el.style.display = isAdminUser() ? "" : "none";
  });
  document.querySelectorAll("[data-registered-only]").forEach(el => {
    el.style.display = userPermissions?.registered ? "" : "none";
  });
  const allRegistered = userPermissions?.registered && (userPermissions.tabs || []).includes("*");
  document.querySelectorAll(".sub-rail .console-tab[data-view]").forEach(btn => {
    const v = btn.dataset.view;
    if (!v) return;
    if (btn.hasAttribute("data-admin-only") && !isAdminUser()) {
      btn.style.display = "none";
      btn.hidden = true;
      return;
    }
    if (btn.hasAttribute("data-registered-only") && !userPermissions?.registered) {
      btn.style.display = "none";
      btn.hidden = true;
      return;
    }
    if (allRegistered) {
      if (v.startsWith("admin-") && v !== "admin-access" && !isAdminUser()) {
        btn.style.display = "none";
        btn.hidden = true;
        return;
      }
      if (v === "agents" && !isAdminUser()) {
        btn.style.display = "none";
        btn.hidden = true;
        return;
      }
      btn.style.display = "";
      btn.hidden = false;
      return;
    }
    const ok = isViewAllowed(v);
    btn.style.display = ok ? "" : "none";
    btn.hidden = !ok;
  });
  document.querySelectorAll(".nav-sub-item[data-view], .nav-btn[data-view]").forEach(btn => {
    const v = btn.dataset.view;
    if (!v) return;
    if (btn.hasAttribute("data-admin-only") && !isAdminUser()) {
      btn.style.display = "none";
      return;
    }
    if (btn.hasAttribute("data-registered-only") && !userPermissions?.registered) {
      btn.style.display = "none";
      return;
    }
    if (allRegistered) {
      if (v.startsWith("admin-") && v !== "admin-access" && !isAdminUser()) {
        btn.style.display = "none";
        return;
      }
      if (v === "agents" && !isAdminUser()) {
        btn.style.display = "none";
        return;
      }
      btn.style.display = "";
      return;
    }
    btn.style.display = isViewAllowed(v) ? "" : "none";
  });
  applyMeetingEntryPermissions();
  updateOperatorGateBanner();
  const activeView = document.querySelector(".view.active")?.id?.replace(/^view-/, "") || viewFromHash();
  syncNavActive(activeView);
}

function renderPermMatrixTable(users, tabsAll) {
  return `<table class="perm-table"><thead><tr>
      <th>登录名</th><th>姓名</th><th>权限档</th><th>职级/岗位</th><th>可见项目</th><th>可见 Tab</th><th>小黑板</th><th>写动态</th><th>上传</th><th>同步</th><th>可约会</th>
    </tr></thead><tbody>${(users || []).map(u => `<tr>
      <td class="mono">${esc(u.login_id || "—")}</td>
      <td><strong>${esc(u.name)}</strong></td><td>${esc(u.role)}</td><td>${esc(u.job_title || "—")}</td>
      <td>${esc((u.projects || []).join(", "))}</td>
      <td>${esc((u.tabs || []).join(", "))}</td>
      <td>${esc((u.can_blackboard || []).join(", ") || "—")}</td>
      <td>${esc((u.can_write_notes || []).join(", ") || "—")}</td>
      <td>${esc((u.can_upload_files || []).join(", ") || "—")}</td>
      <td>${esc((u.can_sync_progress || []).join(", ") || "—")}</td>
      <td>${u.can_schedule_meeting ? "是" : "否"}</td>
    </tr>`).join("")}</tbody></table>
    <p class="muted" style="margin-top:8px">Tab 全集：<code>${esc((tabsAll || []).join(", "))}</code> · 编辑 <code>bot-gateway/config/permissions.json</code></p>`;
}

function showAdminGate(gateId, blocked) {
  const el = document.getElementById(gateId);
  if (!el) return blocked;
  if (blocked) {
    el.hidden = false;
    el.innerHTML = `<p><strong>需要 admin 权限</strong></p><p class="muted">请用管理员账号（如 刘微 / vvvliu）登录后刷新 · 其他人走「权限申请」</p>`;
  } else {
    el.hidden = true;
    el.innerHTML = "";
  }
  return blocked;
}

async function fetchPageContext(viewKey) {
  const user = getCurrentUser();
  const qs = new URLSearchParams({ view: viewKey });
  if (user) qs.set("user", user);
  const res = await fetch(`${API}/api/page-context?${qs}`);
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.detail || "无法加载页面上下文");
  return d.context || "";
}

async function askPageWithAI(viewKey, question, btn) {
  const user = requireCurrentUser();
  if (!user) return null;
  const liveEl = document.getElementById(`agentLive-${viewKey}`);
  const orig = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = "AI 思考中…"; }
  if (liveEl) {
    liveEl.innerHTML = `<div class="live-label">AI · ${esc(TITLES[viewKey] || viewKey)}</div><pre>正在拉取本页上下文并请求 QA…</pre>`;
    liveEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  try {
    const pageContext = await fetchPageContext(viewKey);
    const res = await fetch(`${API}/api/qa/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: question,
        user,
        page_context: pageContext,
        use_llm: true,
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.detail || `HTTP ${res.status}`);
    const mode = d.llm ? `Gateway LLM · ${d.llm_model || "model"}` : "检索模式（未配 LLM · 见下方原文）";
    const body = d.message || JSON.stringify(d, null, 2);
    if (liveEl) {
      liveEl.innerHTML = `<div class="live-label">AI 解答 · ${esc(mode)}</div>
        <p class="page-agent-hint">${d.llm ? "基于本页上下文 + 权限内知识库" : esc(d.llm_hint || "配置 LLM 后可智能归纳")}</p>
        <pre>${esc(body)}</pre>
        <div class="page-ai-foot">
          <button type="button" class="btn btn-sm" data-page-knot="${esc(viewKey)}" data-agent-q="${esc(question)}">在 Knot 继续问</button>
        </div>`;
      bindPageAiButtons(liveEl);
      liveEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    return d;
  } catch (e) {
    const msg = e.message || String(e);
    if (liveEl) {
      liveEl.innerHTML = `<div class="live-label">AI · 失败</div><pre>${esc(msg)}</pre>
        <p class="muted">可点「在 Knot 问」或配置 LLM 后重试</p>`;
    }
    return null;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = orig || "AI 解答"; }
  }
}

function openKnotWithContext(viewKey, question) {
  const user = getCurrentUser();
  if (!user) { alert("请先选择右上角操作人"); return; }
  fetchPageContext(viewKey).then(ctx => {
    localStorage.setItem("ssc_knot_ask", JSON.stringify({
      q: question,
      ctx,
      user,
      view: viewKey,
      t: Date.now(),
    }));
    window.open(`${API.replace(/\/$/, "")}/qa.html?knot=1`, "_blank", "noopener");
  }).catch(e => alert(e.message || "无法打开 Knot"));
}

function bindPageAiButtons(root) {
  (root || document).querySelectorAll("[data-page-ai]").forEach(btn => {
    if (btn.dataset.pageAiBound) return;
    btn.dataset.pageAiBound = "1";
    btn.addEventListener("click", () => {
      askPageWithAI(btn.dataset.pageAi, btn.dataset.agentQ || "", btn);
    });
  });
  (root || document).querySelectorAll("[data-page-knot]").forEach(btn => {
    if (btn.dataset.pageKnotBound) return;
    btn.dataset.pageKnotBound = "1";
    btn.addEventListener("click", () => {
      openKnotWithContext(btn.dataset.pageKnot, btn.dataset.agentQ || "请结合本页上下文回答");
    });
  });
}

let adminUsersCache = [];
let adminPanelMatrixCache = null;
let adminStaffFilter = "formal";

function pwCellClass(lv) {
  if (lv === "SA") return "sa";
  if (lv === "W" || lv === "M") return "w";
  if (lv === "R") return "r";
  return "none";
}

function pwCellLabel(lv) {
  if (lv === "SA") return "SUPER ADMIN";
  if (lv === "M") return "M";
  return lv || "-";
}

function accessStatusBadge(status) {
  const s = status || "Active";
  const cls = s === "Active" ? "access-active" : "access-pending";
  return `<span class="console-status-badge ${cls}">${esc(s === "Active" ? "可访问 · Active" : s)}</span>`;
}

function bindStaffFilterTabs(containerId, onChange) {
  document.querySelectorAll(`#${containerId} .console-perm-tab`).forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(`#${containerId} .console-perm-tab`).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      adminStaffFilter = btn.dataset.staffFilter || "formal";
      onChange();
    };
  });
}

function filterByStaffType(users) {
  return (users || []).filter(u => (u.staff_type || "formal") === adminStaffFilter);
}

function renderConsoleUsersTable(users) {
  const rows = filterByStaffType(users);
  if (!rows.length) {
    return `<p class="muted">当前 Tab 下无用户 · 切换「正式人员 / 实习生」或编辑 permissions.json</p>`;
  }
  return `<table class="perm-table console-user-table"><thead><tr>
      <th>用户 · User</th><th>角色 · Role</th><th>板块/领域 · Domain</th><th>准入状态 · Access</th><th>操作 · Actions</th>
    </tr></thead><tbody>${rows.map(u => `<tr>
      <td><strong>${esc(u.display || u.login_id || u.name)}</strong><div class="muted mono" style="font-size:11px">${esc(u.name)}</div></td>
      <td><span class="console-role-badge">${esc(u.console_role || u.role || "—")}</span></td>
      <td>${esc(u.domain || "—")}</td>
      <td>${accessStatusBadge(u.access_status)}</td>
      <td><button type="button" class="btn btn-sm" disabled title="v1 请编辑 permissions.json 后 git pull">编辑</button></td>
    </tr>`).join("")}</tbody></table>
    <p class="muted" style="margin-top:10px">共 ${rows.length} 人 · 与总工作台「用户管理」字段对齐 · 业务 Tab/项目见下方权限矩阵明细</p>`;
}

function renderPanelMatrixGrid(data) {
  const box = document.getElementById("panelMatrixGrid");
  if (!box || !data?.panels?.length) return;
  adminPanelMatrixCache = data;
  const users = filterByStaffType(data.users || []);
  const panels = data.panels.filter(p => /^P\d+$/.test(p.id));
  if (!users.length) {
    box.innerHTML = "<p class='muted'>当前 Tab 下无用户</p>";
    return;
  }
  const head = `<tr><th class="pm-sticky">用户 · User</th><th>角色 · Role</th>${panels.map(p =>
    `<th title="${esc(p.name)}"><span class="pm-id">${esc(p.id)}</span><span class="pm-name">${esc(p.short || p.name)}</span></th>`
  ).join("")}</tr>`;
  const body = users.map(u => `<tr>
    <td class="pm-sticky"><strong>${esc(u.display || u.name)}</strong><div class="muted" style="font-size:11px">${esc(u.domain || "")}</div></td>
    <td><span class="console-role-badge">${esc(u.console_role || u.role || "—")}</span></td>
    ${panels.map(p => {
      const lv = (u.cells || {})[p.id] || "-";
      const cls = pwCellClass(lv);
      return `<td><span class="pw-cell pw-${cls}">${esc(pwCellLabel(lv))}</span></td>`;
    }).join("")}
  </tr>`).join("");
  box.innerHTML = `<div class="panel-matrix-scroll"><table class="panel-matrix-table console-matrix-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

async function loadPanelMatrix() {
  const box = document.getElementById("panelMatrixGrid");
  if (!box) return;
  const user = getCurrentUser();
  if (!isAdminUser()) {
    box.innerHTML = "<p class='muted'>板块矩阵仅 admin 可见</p>";
    return;
  }
  try {
    const qs = new URLSearchParams({ all_users: "true", user: user || "刘微" });
    const data = await fetch(`${API}/api/permissions/panel-matrix?${qs}`).then(async r => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || "加载失败");
      return j;
    });
    renderPanelMatrixGrid(data);
    bindStaffFilterTabs("adminPermTabs", () => {
      if (adminPanelMatrixCache) renderPanelMatrixGrid(adminPanelMatrixCache);
    });
  } catch (e) {
    box.innerHTML = `<p class="muted">${esc(e.message || "加载失败")}</p>`;
  }
}

function seedPageAgentPanel(viewKey, label) {
  const el = document.getElementById(`agentLive-${viewKey}`);
  if (!el || el.querySelector("pre")) return;
  el.innerHTML = `<div class="live-label">${esc(label)} · AI 助手</div>
    <p class="page-agent-hint">点「AI 解答」= 本页上下文 + QA（有 LLM 则智能回答）；「在 Knot 问」= 新标签页 Knot 对话</p>`;
}

async function loadAdminUsers() {
  await loadUserPermissions();
  applyNavPermissions();
  await loadRegistry();
  const blocked = showAdminGate("adminUsersGate", !isAdminUser());
  const box = document.getElementById("adminUsersTable");
  if (blocked || !box) return;
  try {
    const user = getCurrentUser();
    const data = await fetch(`${API}/api/admin/users?user=${encodeURIComponent(user)}`).then(async r => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || "加载失败");
      return j;
    });
    adminUsersCache = data.users || [];
    const boxEl = document.getElementById("adminUsersTable");
    boxEl.innerHTML = renderConsoleUsersTable(adminUsersCache);
    bindStaffFilterTabs("adminUsersTabs", () => {
      boxEl.innerHTML = renderConsoleUsersTable(adminUsersCache);
    });
    refreshTabAgentLive("admin-users");
    seedPageAgentPanel("admin-users", "用户管理");
  } catch (e) {
    box.innerHTML = `<p class="muted">${esc(e.message || "加载失败")}</p>`;
  }
}

async function loadAdminPerm() {
  await loadUserPermissions();
  applyNavPermissions();
  await loadRegistry();
  const blocked = showAdminGate("adminPermGate", !isAdminUser());
  const box = document.getElementById("adminPermMatrix");
  if (blocked || !box) return;
  try {
    const data = await fetch(`${API}/api/permissions/matrix`).then(r => r.json());
    box.innerHTML = renderPermMatrixTable(data.users, data.tabs_all)
      + `<p class="muted">编辑后 <code>git pull</code> 生效 · 批准权限申请后人工追加 users 条目</p>`;
    refreshTabAgentLive("admin-perm");
    await loadPanelMatrix();
    seedPageAgentPanel("admin-perm", "权限矩阵");
  } catch (e) {
    box.innerHTML = `<p class="muted">${esc(e.message || "加载失败")}</p>`;
  }
}

async function loadAdminAudit() {
  await loadUserPermissions();
  applyNavPermissions();
  await loadRegistry();
  const blocked = showAdminGate("adminAuditGate", !isAdminUser());
  const body = document.getElementById("adminAuditBody");
  if (blocked || !body) return;
  try {
    const user = getCurrentUser();
    const view = document.getElementById("adminAuditFilter")?.value || "";
    const qs = new URLSearchParams({ user, limit: "100" });
    if (view) qs.set("view", view);
    const data = await fetch(`${API}/api/admin/audit?${qs}`).then(async r => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || "加载失败");
      return j;
    });
    const items = data.items || [];
    body.innerHTML = items.length ? items.map(r => `<tr>
      <td class="mono">${esc(fmtDateTime(r.at))}</td>
      <td>${esc(r.actor || "—")}</td>
      <td><span class="badge logic">${esc(r.kind || "—")}</span></td>
      <td>${esc(r.view || "—")}</td>
      <td>${esc(r.text || r.action || "")}</td>
    </tr>`).join("") : `<tr><td colspan="5" class="muted">暂无日志</td></tr>`;
    refreshTabAgentLive("admin-audit");
    seedPageAgentPanel("admin-audit", "操作日志");
  } catch (e) {
    body.innerHTML = `<tr><td colspan="5">${esc(e.message || "加载失败")}</td></tr>`;
  }
}

async function loadAdminAccess() {
  await loadUserPermissions();
  applyNavPermissions();
  await loadRegistry();
  const list = document.getElementById("adminAccessList");
  const user = getCurrentUser();
  if (!user) {
    if (list) list.innerHTML = "<p class='muted'>请先在右上角填写姓名</p>";
    return;
  }
  try {
    const data = await fetch(`${API}/api/admin/access-requests?user=${encodeURIComponent(user)}`).then(r => r.json());
    const items = data.items || [];
    list.innerHTML = items.length ? items.map(req => {
      const actions = isAdminUser() && req.status === "pending" ? `
        <div class="admin-req-actions">
          <button type="button" class="btn btn-sm btn-primary" data-approve-req="${esc(req.id)}">批准</button>
          <button type="button" class="btn btn-sm" data-reject-req="${esc(req.id)}">驳回</button>
        </div>` : "";
      return `<div class="admin-req-card status-${esc(req.status)}">
        <div class="admin-req-top"><strong>${esc(req.requester)}</strong>
          <span class="badge ${req.status === "pending" ? "script" : req.status === "approved" ? "logic" : "external"}">${esc(req.status)}</span></div>
        <p class="muted">${esc(req.desired_role)} · 项目 ${esc(req.desired_projects)} · Tab ${esc(req.desired_tabs)}</p>
        <p>${esc(req.reason || "")}</p>
        <p class="muted" style="font-size:11px">${esc(fmtDateTime(req.created_at))}${req.reviewer ? ` · ${esc(req.reviewer)}: ${esc(req.review_note || "")}` : ""}</p>
        ${actions}
      </div>`;
    }).join("") : "<p class='muted'>暂无申请</p>";
    list.querySelectorAll("[data-approve-req]").forEach(btn => {
      btn.onclick = () => reviewAccessRequest(btn.dataset.approveReq, "approve");
    });
    list.querySelectorAll("[data-reject-req]").forEach(btn => {
      btn.onclick = () => reviewAccessRequest(btn.dataset.rejectReq, "reject");
    });
    refreshTabAgentLive("admin-access");
    seedPageAgentPanel("admin-access", "权限申请");
  } catch (e) {
    if (list) list.innerHTML = `<p class="muted">${esc(e.message || "加载失败")}</p>`;
  }
}

function mgmtLevelLabel(level) {
  if (level === "ok") return "良好";
  if (level === "warn") return "待加强";
  return "需改进";
}

function mgmtRoadmapBadge(status) {
  if (status === "done") return "logic";
  if (status === "partial") return "script";
  return "external";
}

function renderManagementIndicators(items) {
  return (items || []).map(ind => `
    <article class="mgmt-indicator-card mgmt-level-${esc(ind.level)}">
      <div class="mgmt-indicator-head">
        <div>
          <span class="mgmt-domain">${esc(ind.domain || "")}</span>
          <strong>${esc(ind.name)}</strong>
        </div>
        <span class="mgmt-score">${ind.score}<small>/100</small></span>
      </div>
      <p class="muted mgmt-q">${esc(ind.question || "")}</p>
      <ul class="mgmt-evidence">${(ind.evidence || []).map(e => `<li>${esc(e)}</li>`).join("")}</ul>
      <p class="mgmt-action"><span class="badge ${esc(ind.level === "ok" ? "logic" : "script")}">${mgmtLevelLabel(ind.level)}</span> ${esc(ind.action || "")}</p>
    </article>`).join("");
}

function renderManagementRoadmap(items) {
  return (items || []).map(r => `
    <div class="mgmt-roadmap-row">
      <span class="badge ${mgmtRoadmapBadge(r.status)}">${esc(r.priority)}</span>
      <span class="mgmt-roadmap-status mgmt-rs-${esc(r.status)}">${esc(r.status)}</span>
      <strong>${esc(r.title)}</strong>
      <span class="muted">${esc(r.status_note || "")}</span>
      <p class="muted mgmt-road-detail">${esc(r.detail || "")}</p>
    </div>`).join("");
}

function renderManagementPipelines(pipes) {
  return (pipes || []).map(p => `
    <details class="mgmt-pipe">
      <summary><strong>${esc(p.domain || p.id)}</strong> · ${(p.steps || []).length} 步</summary>
      <ol class="mgmt-pipe-steps">${(p.steps || []).map(s =>
        `<li><code>${s.no}</code> ${esc(s.name)} <span class="muted">→ ${esc(s.entry)}</span></li>`
      ).join("")}</ol>
    </details>`).join("");
}

function renderOrgMemoryMap(rows) {
  if (!rows?.length) return "<p class='muted'>无映射</p>";
  return `<table class="data-table mgmt-memory-table"><thead><tr>
    <th>标签</th><th>路径</th><th>书架</th><th>MCP / API</th>
  </tr></thead><tbody>${rows.map(r => `<tr>
    <td>${esc(r.label)}</td>
    <td class="mono">${esc(r.path)}</td>
    <td>${esc(r.shelf_id)}</td>
    <td class="mono">${esc(r.mcp_hook)}</td>
  </tr>`).join("")}</tbody></table>`;
}

async function loadManagementBoard() {
  const summaryEl = document.getElementById("mgmtSummaryRow");
  const grid = document.getElementById("mgmtIndicatorGrid");
  const road = document.getElementById("mgmtRoadmap");
  const pipes = document.getElementById("mgmtPipelines");
  const mem = document.getElementById("mgmtOrgMemory");
  if (summaryEl) summaryEl.innerHTML = "<p class='muted'>加载中…</p>";
  try {
    const data = await fetch(`${API}/api/management/board`).then(r => r.json());
    const titleEl = document.getElementById("mgmtBoardTitle");
    const subEl = document.getElementById("mgmtBoardSubtitle");
    if (titleEl && data.board_title) titleEl.textContent = data.board_title;
    if (subEl && data.board_subtitle) subEl.textContent = data.board_subtitle;
    const s = data.summary || {};
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="mgmt-kpi">
          <div class="mgmt-kpi-item"><span class="l">综合得分</span><span class="v mgmt-level-${esc(s.level)}">${s.avg_score ?? "—"}</span></div>
          <div class="mgmt-kpi-item"><span class="l">指标</span><span class="v">${s.indicators_ok ?? 0} 良 · ${s.indicators_warn ?? 0} 待加强 · ${s.indicators_bad ?? 0} 需改进</span></div>
          <div class="mgmt-kpi-item"><span class="l">路线图</span><span class="v">${s.roadmap_done ?? 0} 完成 · ${s.roadmap_partial ?? 0} 进行中 · ${s.roadmap_todo ?? 0} 待做</span></div>
          <div class="mgmt-kpi-item"><span class="l">监控告警</span><span class="v">${s.alerts_count ?? 0}</span></div>
        </div>
        <p class="muted" style="margin:8px 0 0;font-size:11px">更新 ${esc(fmtDateTime(data.generated_at))}${data.reference ? ` · ${esc(data.reference)}` : ""}</p>`;
    }
    if (grid) grid.innerHTML = renderManagementIndicators(data.indicators);
    if (road) road.innerHTML = renderManagementRoadmap(data.roadmap);
    if (pipes) pipes.innerHTML = renderManagementPipelines(data.pipelines);
    if (mem) mem.innerHTML = renderOrgMemoryMap(data.org_memory_map);
    bindPageAiButtons(document.getElementById("view-admin-mgmt"));
  } catch (e) {
    const msg = esc(e.message || "加载失败");
    if (summaryEl) summaryEl.innerHTML = `<p class="muted">${msg}</p>`;
    if (grid) grid.innerHTML = "";
  }
}

async function runMorningBrief() {
  const user = getCurrentUser();
  const panel = document.getElementById("mgmtMorningBriefPanel");
  const pre = document.getElementById("mgmtMorningBriefPre");
  const link = document.getElementById("mgmtMorningBriefLink");
  const btn = document.getElementById("btnMorningBrief");
  if (btn) { btn.disabled = true; btn.textContent = "汇总中…"; }
  try {
    const res = await fetch(`${API}/api/management/morning-brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: user || "" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "失败");
    const brief = data.brief || {};
    if (panel) panel.hidden = false;
    if (pre) pre.textContent = String(brief.message || "");
    if (link) {
      const wl = brief.web_link || "";
      link.innerHTML = wl ? `WEB_LINK: <a href="${esc(wl)}" target="_blank" rel="noopener">${esc(wl)}</a>` : "";
    }
  } catch (e) {
    alert(e.message || "汇总生成失败");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "生成工作台汇总"; }
  }
}

async function reviewAccessRequest(requestId, action) {
  const note = prompt(action === "approve" ? "批准备注（可选）" : "驳回原因（可选）") || "";
  const user = getCurrentUser();
  const path = action === "approve" ? "approve" : "reject";
  const res = await fetch(`${API}/api/admin/access-requests/${requestId}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewer: user, note }),
  });
  const d = await res.json();
  if (!res.ok) { alert(d.detail || "操作失败"); return; }
  loadAdminAccess();
}

async function submitAccessRequest(e) {
  e.preventDefault();
  const msg = document.getElementById("accessFormMsg");
  const user = getCurrentUser();
  if (!user) { if (msg) msg.textContent = "请先填写右上角姓名"; return; }
  const payload = {
    requester: user,
    desired_role: document.getElementById("accessDesiredRole")?.value,
    desired_projects: document.getElementById("accessDesiredProjects")?.value,
    desired_tabs: document.getElementById("accessDesiredTabs")?.value,
    reason: document.getElementById("accessReason")?.value,
  };
  try {
    const res = await fetch(`${API}/api/admin/access-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "提交失败");
    if (msg) msg.textContent = "已提交 · 等待 admin 审批";
    document.getElementById("accessReason").value = "";
    loadAdminAccess();
    askPageWithAI("admin-access", "刚提交了一条权限申请，接下来怎么处理？", null);
  } catch (err) {
    if (msg) msg.textContent = err.message || "失败";
  }
}

function renderOrchestrator(reg, compact) {
  const dep = reg.deployment || {};
  const orch = reg.orchestrator || {};
  return `
    <p><strong>形式</strong> · ${esc(orch.form)}</p>
    <p><strong>功能</strong> · ${esc(orch.function)}</p>
    <p><strong>Prompt</strong> · <code class="mono">${esc(dep.prompt_file || orch.prompt_file)}</code></p>
    <div class="webhook-box">
      <span class="method">POST</span> <span class="url">/api/orchestrate</span> · 网页总助手对话<br>
      <span class="method">POST</span> <span class="url">/api/webhook/knotbot</span> · Knot Client 工具<br>
      {"text": "{{user_input}}"} 或 {"agent_id":"project","text":"项目进展"}
    </div>
    <div class="chip-row">${(orch.test_phrases || []).map(k => `<span class="chip-kw">${esc(k)}</span>`).join("")}</div>
    ${compact ? "" : `<p class="muted" style="margin-top:12px">${esc(dep.note)}</p>`}
  `;
}

function renderAgentCard(a, interactive) {
  const badge = formBadge(a.form);
  const conn = agentConnectMeta(a);
  const btns = interactive ? `
    <div class="agent-actions">
      <button class="btn btn-primary" data-agent-run="${esc(a.id)}">试运行</button>
      <button class="btn" data-agent-config="${esc(a.id)}">看配置</button>
      ${a.web_tab ? `<button class="btn" data-agent-tab="${esc(a.web_tab === "qa" ? "knowledge" : a.web_tab)}">打开 Tab</button>` : ""}
      ${a.id === "qa" ? `<a class="btn" href="qa.html">qa.html</a>` : ""}
    </div>` : "";
  return `<div class="agent-card" data-agent-id="${esc(a.id)}">
    <div class="agent-top"><h4>${esc(a.name)}</h4><span class="badge ${badge}">${esc(conn.type)}</span></div>
    <dl>
      <dt>接入</dt><dd>${esc(conn.path)}</dd>
      <dt>功能</dt><dd>${esc(a.function || a.message || "—")}</dd>
      <dt>API</dt><dd class="mono">${esc(conn.api || "POST /api/orchestrate")}</dd>
      <dt>触发词</dt><dd><div class="chip-row">${(a.keywords || []).slice(0, 5).map(k => `<span class="chip-kw">${esc(k)}</span>`).join("")}</div></dd>
    </dl>${btns}
  </div>`;
}

function bindAgentButtons(root) {
  root.querySelectorAll("[data-agent-run]").forEach(btn => {
    btn.onclick = () => invokeAgent(btn.dataset.agentRun);
  });
  root.querySelectorAll("[data-agent-config]").forEach(btn => {
    btn.onclick = () => showAgentDetail(btn.dataset.agentConfig);
  });
  root.querySelectorAll("[data-agent-tab]").forEach(btn => {
    btn.onclick = () => switchView(btn.dataset.agentTab);
  });
}

function showAgentLive(agentId, message, viewKey) {
  const tab = viewKey || getAgentById(agentId)?.web_tab || "agents";
  const elKey = viewKey || (tab === "meetings" ? "meeting" : tab);
  const el = document.getElementById(`agentLive-${elKey}`);
  if (!el) return;
  agentLiveCache[agentId] = message;
  el.innerHTML = `<div class="live-label">${esc(getAgentById(agentId)?.name || agentId)} · 实时输出</div><pre>${esc(message)}</pre>`;
}

function getAgentById(id) {
  if (!registryCache) return null;
  if (id === "orchestrator") return registryCache.orchestrator;
  return (registryCache.agents || []).find(a => a.id === id);
}

async function invokeAgent(agentId, text, viewKey) {
  const cfg = getAgentById(agentId);
  const phrase = text || (cfg?.test_phrases || [])[0] || "";
  const view = viewKey || cfg?.web_tab || agentId;
  const res = await fetch(`${API}/api/agents/${agentId}/invoke`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: phrase, user: getCurrentUser(), view }),
  });
  const d = await res.json();
  const elKey = viewKey || (cfg?.web_tab === "qa" ? "knowledge" : (cfg?.web_tab === "meetings" ? "meeting" : cfg?.web_tab));
  showAgentLive(agentId, d.message || JSON.stringify(d), elKey);
  return d;
}

async function orchestrate(text, agentId) {
  const body = agentId ? { agent_id: agentId, text } : { text };
  const res = await fetch(`${API}/api/orchestrate`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function showAgentDetail(agentId) {
  selectedAgentId = agentId;
  const a = getAgentById(agentId);
  if (!a) return;
  switchView("agents");
  const panel = document.getElementById("agentDetailPanel");
  panel.style.display = "block";
  document.getElementById("agentDetailTitle").textContent = a.name + " · 配置";
  document.getElementById("agentDetailPrompt").textContent = a.prompt_content || "（无 Prompt 文件）";
  document.getElementById("agentDetailResult").textContent = "";
  panel.scrollIntoView({ behavior: "smooth" });
}

function switchView(id) {
  const requested = id;
  if (!isViewAllowed(id)) {
    updateOperatorGateBanner(requested);
    id = "home";
  } else {
    updateOperatorGateBanner();
  }
  updateTopbarDate();
  syncNavActive(id);
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + id)?.classList.add("active");
  syncPageHead(id);
  if (id === "home") {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  } else {
    const want = `#${id}`;
    if (location.hash !== want) history.replaceState(null, "", want);
  }
  if (id === "home") loadHome();
  if (id === "projects") loadProjectsView();
  if (id === "agents") loadAgents();
  if (id === "issues") loadIssues();
  if (id === "knowledge") loadKnowledge();
  if (id === "meetings") loadMeetings();
  if (id === "admin-users") loadAdminUsers();
  if (id === "admin-perm") loadAdminPerm();
  if (id === "admin-audit") loadAdminAudit();
  if (id === "admin-access") loadAdminAccess();
  if (id === "admin-mgmt") loadManagementBoard();
  if (id === "tools-americas" || id === "tools-non-americas") refreshTabAgentLive(id);
  else refreshTabAgentLive(id);
}

function firstVisibleSubTab(panelId) {
  const tabs = [...document.querySelectorAll(`#subRail [data-panel="${panelId}"]`)];
  return tabs.find(t => t.style.display !== "none" && !t.hidden) || tabs[0];
}

function syncNavActive(viewId) {
  const panel = VIEW_PANEL[viewId] || "home";
  document.querySelectorAll(".panel-rail-btn[data-panel]").forEach(el => {
    const on = el.dataset.panel === panel;
    el.classList.toggle("active", on);
    el.setAttribute("aria-selected", on ? "true" : "false");
  });
  const subRail = document.getElementById("subRail");
  let visibleSubCount = 0;
  document.querySelectorAll("#subRail [data-panel]").forEach(el => {
    const show = el.dataset.panel === panel;
    el.hidden = !show;
    if (show && el.style.display !== "none") visibleSubCount += 1;
  });
  document.querySelectorAll("#subRail .console-tab[data-view]").forEach(el => {
    el.classList.toggle("active", el.dataset.view === viewId);
  });
  if (subRail) subRail.hidden = panel === "home" || visibleSubCount === 0;

  document.querySelectorAll(".nav-top[data-view]").forEach(el => {
    el.classList.toggle("active", el.dataset.view === viewId);
  });
  document.querySelectorAll(".nav-sub-item[data-view]").forEach(el => {
    el.classList.toggle("active", el.dataset.view === viewId);
  });
}

function initPanelRail() {
  document.querySelectorAll(".panel-rail-btn[data-panel]").forEach(btn => {
    btn.addEventListener("click", () => {
      const panel = btn.dataset.panel;
      if (panel === "home") {
        switchView("home");
        return;
      }
      const tab = firstVisibleSubTab(panel);
      if (tab?.dataset.view) switchView(tab.dataset.view);
      else if (PANEL_DEFAULT_VIEW[panel]) switchView(PANEL_DEFAULT_VIEW[panel]);
    });
  });
  document.querySelectorAll("#subRail .console-tab[data-view]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(el.dataset.view);
    });
  });
}

function initNavAccordion() {
  initPanelRail();
  document.querySelectorAll(".nav-group-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".nav-group");
      if (!group) return;
      const willOpen = !group.classList.contains("open");
      group.classList.toggle("open", willOpen);
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });
  document.querySelectorAll(".nav-top[data-view], .nav-sub-item[data-view]").forEach(el => {
    el.addEventListener("click", () => switchView(el.dataset.view));
  });
}

function domainStatusLevel(key, ctx) {
  const k = ctx.kpi || {};
  if (key === "projects") {
    const overdue = (ctx.milestones || []).some(m => m.days_left < 0);
    if ((k.alerts_count || 0) > 0 || overdue) return "warn";
    return "ok";
  }
  if (key === "knowledge") {
    if (!ctx.indexOk) return "warn";
    return (ctx.docCount || 0) > 0 ? "ok" : "warn";
  }
  if (key === "issues") {
    return (k.issues_open || 0) > 3 ? "warn" : "ok";
  }
  if (key === "americas") return ctx.gatewayOk ? "ok" : "err";
  if (key === "agents") return ctx.gatewayOk ? "ok" : "err";
  return "ok";
}

function domainStatusText(key, ctx) {
  const k = ctx.kpi || {};
  if (key === "projects") {
    return `${k.projects_active ?? "—"} 项目在跟 · 均进度 ${k.avg_progress ?? "—"}%`;
  }
  if (key === "knowledge") {
    return `${ctx.docCount ?? "—"} 篇索引 · ${ctx.shelfCount ?? "—"} 书架`;
  }
  if (key === "issues") {
    const bb = ctx.bbPending || 0;
    return `${k.issues_open ?? "—"} 开放 Issue · 小黑板 ${bb} 待确认`;
  }
  if (key === "americas") {
    return "美洲工具 · 自动分摊 · 提单 · 人工核对点";
  }
  if (key === "agents") {
    return `${ctx.agentCount ?? "—"} 专科 + 总助手 · Knot`;
  }
  return "—";
}

function renderAiInsight(ctx) {
  const body = document.getElementById("aiInsightBody");
  const timeEl = document.getElementById("aiInsightTime");
  if (!body) return;
  const k = ctx.kpi || {};
  const bb = ctx.bbPending || 0;
  const overdue = (ctx.milestones || []).filter(m => m.days_left < 0).length;
  const alertN = k.alerts_count || 0;
  let tone = "";
  if (overdue || alertN > 0 || bb > 0) {
    tone = `需关注：<em>${overdue ? overdue + " 个里程碑逾期 · " : ""}${alertN ? alertN + " 条监控 · " : ""}${bb ? bb + " 条小黑板待确认" : ""}</em>。`;
  }
  body.innerHTML =
    `在跟 <b>${k.projects_active ?? "—"}</b> 个项目，平均进度 <b>${k.avg_progress ?? "—"}%</b>；` +
    `开放 Issue <b>${k.issues_open ?? "—"}</b>；知识库 <b>${ctx.docCount ?? "—"}</b> 篇已索引。` +
    (tone ? ` ${tone}` : " 各板块运行正常。") +
    ` 算数走脚本，问答走 Knot Agent。`;
  if (timeEl) timeEl.textContent = fmtDateTime(new Date().toISOString());
}

function renderDomainStatusGrid(ctx) {
  const box = document.getElementById("domainStatusGrid");
  if (!box) return;
  box.innerHTML = DOMAIN_PANELS.map(p => {
    const level = domainStatusLevel(p.key, ctx);
    const sub = domainStatusText(p.key, ctx);
    return `<button type="button" class="domain-card" data-view="${esc(p.view)}">
      <div class="domain-card-top">
        <span class="domain-card-icon">${p.icon}</span>
        <span class="domain-status-dot ${level}"></span>
      </div>
      <strong>${esc(p.name)}</strong>
      <span>${esc(sub)}</span>
    </button>`;
  }).join("");
  box.querySelectorAll(".domain-card").forEach(btn => {
    btn.onclick = () => switchView(btn.dataset.view);
  });
}

let homeKpiTab = "overview";
let homeLaneTab = "ops";

function initHomeKpiTabs() {
  const tabs = document.getElementById("homeKpiTabs");
  if (!tabs) return;
  tabs.querySelectorAll("[data-home-tab]").forEach(btn => {
    btn.addEventListener("click", () => switchHomeKpiTab(btn.dataset.homeTab));
  });
}

function initHomeLaneTabs() {
  const tabs = document.getElementById("homeLaneTabs");
  if (!tabs) return;
  tabs.querySelectorAll("[data-home-lane-tab]").forEach(btn => {
    btn.addEventListener("click", () => switchHomeLaneTab(btn.dataset.homeLaneTab));
  });
}

function updateHomeSectionVisibility() {
  document.querySelectorAll("#view-home [data-home-section], #view-home [data-home-lane]").forEach(el => {
    const sections = (el.dataset.homeSection || "").split(/\s+/).filter(Boolean);
    const lanes = (el.dataset.homeLane || "").split(/\s+/).filter(Boolean);
    const sectionVisible = !sections.length || sections.includes(homeKpiTab);
    const laneVisible = !lanes.length || lanes.includes(homeLaneTab);
    el.classList.toggle("home-section-hidden", !sectionVisible);
    el.classList.toggle("home-lane-hidden", !laneVisible);
  });
}

function switchHomeKpiTab(id) {
  homeKpiTab = id || "overview";
  document.querySelectorAll("#homeKpiTabs [data-home-tab]").forEach(btn => {
    const on = btn.dataset.homeTab === homeKpiTab;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".home-kpi-panel").forEach(panel => {
    const on = panel.dataset.homePanel === homeKpiTab;
    panel.classList.toggle("active", on);
    panel.hidden = !on;
  });
  updateHomeSectionVisibility();
}

function switchHomeLaneTab(id) {
  homeLaneTab = id || "ops";
  document.querySelectorAll("#homeLaneTabs [data-home-lane-tab]").forEach(btn => {
    const on = btn.dataset.homeLaneTab === homeLaneTab;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  updateHomeSectionVisibility();
}

function setKpiText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? "—";
}

function updateHomeKpiPanels(dash, bb) {
  const k = dash?.kpi || {};
  const milestones = dash?.upcoming_milestones || [];
  const alerts = dash?.alerts || [];
  const overdueMs = milestones.filter(m => m.days_left < 0).length;
  const bbPending = (bb?.messages || []).filter(m => !(m.ack_status || {}).complete).length;
  const todoPct = dash?.gauge?.todo_completion;
  const critical = alerts.filter(a => (a.level || a.severity) === "critical" || a.level === "error").length;

  setKpiText("kpiProjects", k.projects_active);
  setKpiText("kpiProgress", (k.avg_progress ?? "—") + (k.avg_progress != null ? "%" : ""));
  setKpiText("kpiIssues", k.issues_open);
  setKpiText("kpiAlerts", k.alerts_count);

  setKpiText("kpiProjActive", k.projects_active);
  setKpiText("kpiProjProgress", (k.avg_progress ?? "—") + (k.avg_progress != null ? "%" : ""));
  setKpiText("kpiMilestones", milestones.length);
  setKpiText("kpiMilestonesOverdue", overdueMs);

  setKpiText("kpiCollabIssues", k.issues_open);
  setKpiText("kpiMeetingTodos", k.meeting_todos_open);
  setKpiText("kpiBbPending", bbPending);
  setKpiText("kpiTodoPct", todoPct != null ? `${todoPct}%` : "—");

  setKpiText("kpiMonAlerts", k.alerts_count);
  setKpiText("kpiMonCritical", critical || "0");
  setKpiText("kpiJobsTotal", k.jobs_total);
  setKpiText("kpiRecentOps", (dash?.recent_operations || []).length);

  switchHomeKpiTab(homeKpiTab);
}

function renderTechCapabilityStrip(ctx) {
  const jobsEl = document.getElementById("techStatJobs");
  const agentsEl = document.getElementById("techStatAgents");
  const portalUrl = document.getElementById("demoPortalUrl");
  if (portalUrl) portalUrl.textContent = `${API.replace(/\/$/, "")}/portal.html`;
  if (jobsEl) {
    jobsEl.textContent = ctx.jobCount != null
      ? `${ctx.jobCount} 条 jobs · 最近 ${ctx.recentOps || 0} 次操作`
      : "jobs 留痕 · 报告入库";
  }
  if (agentsEl) {
    agentsEl.textContent = ctx.agentCount != null
      ? `${ctx.agentCount} 专科 + 总助手 · Knot 执行命令`
      : "Knot 执行命令 · /api/orchestrate";
  }
  document.querySelectorAll(".demo-showcase [data-view]").forEach(btn => {
    btn.onclick = () => switchView(btn.dataset.view);
  });
}

function renderAgentConnectPanel(reg) {
  const dep = reg?.deployment || {};
  const ws = dep.workspace_path || "/data/workspace";
  const el = document.getElementById("agentConnectPanel");
  if (!el) return;
  el.innerHTML = `
    <div class="panel-head"><h3>Agent 怎么接入服务</h3><span class="badge">架构一览</span></div>
    <div class="agent-topology">
      <div class="topo-lane">
        <span class="topo-label">入口</span>
        <div class="topo-nodes">
          <span class="topo-node">网页对话 / Tab 试运行</span>
          <span class="topo-node accent">Knot · 执行命令</span>
          <span class="topo-node">curl / Webhook</span>
        </div>
      </div>
      <div class="topo-arrow">↓</div>
      <div class="topo-lane highlight">
        <span class="topo-label">Gateway :18180</span>
        <code class="mono">POST /api/orchestrate</code>
        <span class="muted">{"text":"…"} 或 {"agent_id":"project","text":"…"}</span>
      </div>
      <div class="topo-arrow">↓ 路由 handler</div>
      <div class="topo-handlers">
        <span>projects / issues / meetings</span>
        <span>leave → 脚本</span>
        <span>fpp → 外链</span>
        <span>knowledge / qa → 知识库</span>
        <span>admin-* → 系统管理四页</span>
        <span>monitor → 内部告警</span>
      </div>
    </div>
    <div class="agent-connect-grid">
      <div class="connect-card">
        <h4>总助手 · Bot #1</h4>
        <p class="muted">编排 + 汇总 · 一个 Bot 覆盖运营域</p>
        ${cmdBlock("Knot 执行命令", `bash ${ws}/knot-chat/run_agent.sh {{user_input}}`)}
        <p class="muted">Client Webhook Body：<code>{"text":"{{user_input}}"}</code></p>
      </div>
      <div class="connect-card">
        <h4>知识问答 · Bot #2</h4>
        <p class="muted">只读 · 权限书架上下文 → Knot 平台模型作答</p>
        ${cmdBlock("Knot 执行命令", `bash ${ws}/knot-chat/run_qa.sh {{user_input}}`)}
        <p class="muted">Body：<code>{"agent_id":"qa","text":"{{user_input}}","user":"操作人"}</code></p>
        <a class="btn btn-sm" href="qa.html">打开 qa.html →</a>
      </div>
      <div class="connect-card">
        <h4>专科 Agent · 无需单独建 Bot</h4>
        <p class="muted">网页 Tab「试运行」或 orchestrate 带 agent_id</p>
        <div class="webhook-box">
          <span class="method">POST</span> <span class="url">/api/agents/project/invoke</span><br>
          <span class="method">POST</span> <span class="url">/api/agents/leave/invoke</span> · 脚本<br>
          <span class="method">GET</span> <span class="url">/api/health</span> · 现场验活
        </div>
      </div>
    </div>`;
  bindCopyButtons(el);
}

function renderQaAgentSetup(reg) {
  const dep = reg?.deployment || {};
  const qa = (reg?.agents || []).find(a => a.id === "qa") || {};
  const ws = dep.workspace_path || "/data/workspace";
  return `
    <p><strong>Agent ID</strong> · <code class="mono">${esc(dep.qa_knot_agent_id || qa.knot_agent_id || "—")}</code>
      <a href="${esc(dep.qa_knot_agent_url || qa.knot_agent_url || "#")}" target="_blank" rel="noopener">Knot 配置页</a></p>
    <p><strong>网页</strong> · <a href="qa.html">qa.html</a> launchpad 模式（独立标签页登录 Knot）</p>
    ${cmdBlock("执行命令", `bash ${ws}/knot-chat/run_qa.sh {{user_input}}`)}
    <p class="muted">Prompt · <code class="mono">${esc(dep.qa_prompt_file || qa.prompt_file || "knot-agent/PROMPT_问答Agent.md")}</code></p>
    <div class="chip-row">${(qa.test_phrases || []).map(k => `<span class="chip-kw">${esc(k)}</span>`).join("")}</div>`;
}

async function loadGlobalOverviewLayer(dash, bb, extras = {}) {
  const ctx = {
    kpi: dash?.kpi || {},
    milestones: dash?.upcoming_milestones || [],
    bbPending: (bb?.messages || []).filter(m => !(m.ack_status || {}).complete).length,
    docCount: extras.docCount,
    shelfCount: extras.shelfCount,
    indexOk: extras.indexOk !== false,
    jobCount: extras.jobCount,
    recentOps: (dash?.recent_operations || []).length,
    agentCount: extras.agentCount,
    gatewayOk: extras.gatewayOk !== false,
  };
  renderAiInsight(ctx);
  renderDomainStatusGrid(ctx);
  renderTechCapabilityStrip(ctx);
}

function refreshTabAgentLive(viewId) {
  const agentId = TAB_AGENT[viewId];
  if (agentId && agentLiveCache[agentId]) {
    showAgentLive(agentId, agentLiveCache[agentId], viewId);
  }
}

async function loadRegistry() {
  registryCache = await fetch(`${API}/api/agents`).then(r => r.json());
  return registryCache;
}

function bindDetailUploadForm(p) {
  const form = document.getElementById("detailUploadForm");
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const editor = requireCurrentUser();
    if (!editor) return;
    const input = document.getElementById("detailFileInput");
    const cat = document.getElementById("detailFileCategory");
    const msg = document.getElementById("detailUploadMsg");
    const file = input?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("editor", editor);
    fd.append("category", cat?.value || "上传");
    fd.append("file", file);
    if (msg) msg.textContent = "上传中…";
    try {
      const res = await fetch(`${API}/api/projects/${p.id}/files/upload`, { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "上传失败");
      const synced = d.knowledge_sync?.ok !== false ? " · 知识库已同步" : "";
      if (msg) msg.textContent = `已上传 · 操作人 ${editor}${synced}`;
      await openProjectDetail(p.id);
      await loadProjectsData();
      await loadKnowledge();
    } catch (err) {
      if (msg) msg.textContent = err.message || "上传失败";
    }
  };
  document.querySelectorAll(".detail-del-file").forEach(btn => {
    btn.onclick = () => deleteProjectFile(p.id, btn.dataset.path, btn, document.getElementById("detailUploadMsg"));
  });
}

async function saveBlackboardFromCard(projectId, summaryEl, remindersEl, msgEl) {
  const editor = getCurrentUser();
  const progress_summary = summaryEl?.value || "";
  const raw = remindersEl?.value || "";
  const reminders = raw.split("\n").filter(Boolean).map(line => {
    const [due, ...rest] = line.split("|");
    return { due: rest.length ? due.trim() : "", text: (rest.join("|") || due).trim(), level: "medium" };
  });
  try {
    const res = await fetch(`${API}/api/projects/${projectId}/blackboard`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor, progress_summary, reminders }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "保存失败");
    if (msgEl) msgEl.textContent = "已发布";
    await loadProjectsView();
  } catch (e) {
    if (msgEl) msgEl.textContent = e.message || "保存失败";
  }
}

async function syncProgressFromCard(projectId, slider, btn, msgEl) {
  const editor = getCurrentUser();
  if (!editor) {
    const msg = "请先在右上角填写姓名";
    if (msgEl) msgEl.textContent = msg;
    else alert(msg);
    return;
  }
  const block = btn?.closest(".rich-progress-block");
  let progress = parseInt(slider?.value || "", 10);
  if (Number.isNaN(progress)) {
    const label = block?.querySelector(".pct-label")?.textContent || "0";
    progress = parseInt(String(label).replace(/[^\d]/g, ""), 10) || 0;
  }
  if (btn) btn.textContent = "同步中…";
  if (msgEl) msgEl.textContent = "";
  try {
    const res = await fetch(`${API}/api/projects/${encodeURIComponent(projectId)}/progress`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor, progress }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "失败");
    const ring = btn?.closest(".rich-progress-block")?.querySelector(".pct-label");
    if (ring) ring.textContent = `${progress}%`;
    const ringEl = btn?.closest(".rich-progress-block")?.querySelector(".progress-ring-sm");
    if (ringEl) ringEl.style.setProperty("--pct", progress);
    if (btn) btn.textContent = "已同步 ✓";
    if (msgEl) msgEl.textContent = "已同步";
    setTimeout(() => { if (btn) btn.textContent = "同步进度"; }, 2000);
  } catch (e) {
    const err = e.message || "同步失败";
    if (btn) btn.textContent = "同步失败";
    if (msgEl) msgEl.textContent = err;
    else alert(err);
    setTimeout(() => { if (btn) btn.textContent = "同步进度"; }, 2500);
  }
}

function bindDetailProgressSync(p, canSync) {
  const btn = document.getElementById("btnDetailSyncProgress");
  const slider = document.getElementById("detailProgressSlider");
  if (!btn || !canSync) return;
  slider?.addEventListener("input", () => {
    const v = slider.value;
    document.getElementById("detailPctLabel") && (document.getElementById("detailPctLabel").textContent = `${v}%`);
    document.getElementById("detailProgressRing")?.style.setProperty("--pct", v);
    const ringSpan = document.querySelector("#detailProgressRing span");
    if (ringSpan) ringSpan.textContent = `${v}%`;
  });
  btn.onclick = () => syncProgressFromCard(
    p.id, slider, btn, document.getElementById("detailSyncMsg"),
  );
}

function bindRichCardEvents() {
  document.querySelectorAll(".project-rich-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button, a, input, textarea, details, summary, form, select")) return;
      openProjectDetail(card.dataset.id);
    });
  });
  document.querySelectorAll(".btn-detail").forEach(btn => {
    btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openProjectDetail(btn.dataset.id); };
  });
  document.querySelectorAll(".bb-save-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const card = btn.closest(".project-rich-card");
      saveBlackboardFromCard(
        btn.dataset.id,
        card?.querySelector(".bb-edit-summary"),
        card?.querySelector(".bb-edit-reminders"),
        card?.querySelector(".bb-save-msg"),
      );
    };
  });
  document.querySelectorAll(".sync-progress-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const block = btn.closest(".rich-progress-block");
      const card = btn.closest(".project-rich-card");
      const msg = card?.querySelector(".sync-msg") || (() => {
        const s = document.createElement("span");
        s.className = "sync-msg muted";
        block?.appendChild(s);
        return s;
      })();
      syncProgressFromCard(btn.dataset.id, block?.querySelector(".progress-slider"), btn, msg);
    };
  });
  document.querySelectorAll(".progress-slider").forEach(slider => {
    slider.oninput = (e) => {
      e.stopPropagation();
      const block = slider.closest(".rich-progress-block");
      const pct = slider.value;
      block?.querySelector(".pct-label") && (block.querySelector(".pct-label").textContent = `${pct}%`);
      block?.querySelector(".progress-ring-sm")?.style.setProperty("--pct", pct);
    };
    slider.onclick = (e) => e.stopPropagation();
  });
  document.querySelectorAll(".card-upload-form").forEach(form => {
    form.onclick = (e) => e.stopPropagation();
    form.onsubmit = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = requireCurrentUser();
      if (!editor) return;
      const pid = form.dataset.projectId;
      const input = form.querySelector(".card-file-input");
      const msg = form.querySelector(".upload-msg");
      const file = input?.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("editor", editor);
      fd.append("category", form.querySelector(".card-file-cat")?.value || "上传");
      fd.append("file", file);
      if (msg) msg.textContent = "上传中…";
      try {
        const res = await fetch(`${API}/api/projects/${pid}/files/upload`, { method: "POST", body: fd });
        const d = await res.json();
        if (!res.ok) throw new Error(d.detail || "上传失败");
        if (msg) msg.textContent = `已上传 · ${editor} · 知识库已同步`;
        await loadProjectsView();
        await loadKnowledge();
      } catch (err) {
        if (msg) msg.textContent = err.message || "失败";
      }
    };
  });
  document.querySelectorAll(".card-del-file").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const card = btn.closest(".project-rich-card");
      deleteProjectFile(btn.dataset.id, btn.dataset.path, btn, card?.querySelector(".upload-msg"));
    };
  });
  document.querySelectorAll(".card-note-btn").forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const editor = requireCurrentUser();
      if (!editor) return;
      const card = btn.closest(".project-rich-card");
      const text = card?.querySelector(".card-note-input")?.value?.trim();
      const msg = card?.querySelector(".write-msg");
      if (!text) { if (msg) msg.textContent = "请先填写动态内容"; return; }
      if (msg) msg.textContent = "发布中…";
      try {
        const res = await fetch(`${API}/api/projects/${btn.dataset.id}/write`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editor, action: "ingest", text }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.detail || "发布失败");
        if (msg) msg.textContent = "已发布 · 已同步知识库";
        card?.querySelector(".card-note-input") && (card.querySelector(".card-note-input").value = "");
        await loadProjectsView();
      } catch (err) {
        if (msg) msg.textContent = err.message || "失败";
      }
    };
  });
  document.querySelectorAll(".card-sync-kb-btn").forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const card = btn.closest(".project-rich-card");
      const msg = card?.querySelector(".write-msg");
      const orig = btn.textContent;
      btn.textContent = "同步中…";
      if (msg) msg.textContent = "";
      try {
        const d = await apiSyncKnowledge(btn.dataset.id);
        btn.textContent = "已同步 ✓";
        if (msg) msg.textContent = `知识库已更新 · ${d.synced_at || ""}`;
        setTimeout(() => { btn.textContent = orig; }, 2000);
      } catch (err) {
        btn.textContent = "同步失败";
        if (msg) msg.textContent = err.message || "失败";
        setTimeout(() => { btn.textContent = orig; }, 2500);
      }
    };
  });
  document.querySelectorAll(".bb-inline-edit, .card-section, .rich-progress-block").forEach(el => {
    el.onclick = (e) => e.stopPropagation();
  });
}

async function fetchGatewayHealth() {
  try {
    const res = await fetch(`${API}/api/health`);
    const raw = await res.text();
    let h = {};
    try { h = JSON.parse(raw); } catch {
      return { ok: false, api: API, error: "返回不是 JSON（可能 API 地址错误或 Gateway 未启动）", raw: raw.slice(0, 120) };
    }
    if (!res.ok) return { ok: false, api: API, error: `HTTP ${res.status}`, health: h };
    return { ok: true, api: API, health: h };
  } catch (e) {
    return { ok: false, api: API, error: e.message || "网络不可达" };
  }
}

async function apiSyncKnowledge(projectId) {
  const probe = await fetchGatewayHealth();
  if (!probe.ok) {
    throw new Error(
      `网页连不上 Gateway 主体（不是 Knot 智能体的问题）\n` +
      `当前 API：${probe.api}\n` +
      `原因：${probe.error}\n\n` +
      `请在 Knot 工作区终端执行：\n` +
      `  cd /data/workspace && git pull origin main\n` +
      `  pkill -9 -f 'uvicorn main:app'\n` +
      `  bash knot-chat/start_web.sh\n` +
      `  curl -s http://127.0.0.1:18180/api/health\n\n` +
      `网页请用 Gateway 同一地址打开，例如：http://<Knot-preview>:18180/index.html`
    );
  }
  const health = probe.health || {};
  const ver = Number(health.api_version || 0);
  const syncOk = health.features?.sync_kb_get_post === true;
  if (ver < 3 || !syncOk) {
    const commit = health.git_commit || "unknown";
    throw new Error(
      `Gateway 代码偏旧 (api_version=${ver || "?"} · commit ${commit})\n` +
      `API：${probe.api}\n\n` +
      `需要 pull 到 76b695a 及以上，然后重启：\n` +
      `  cd /data/workspace && git pull origin main && bash knot-chat/start_web.sh`
    );
  }

  const urls = projectId
    ? [`${API}/api/projects/${encodeURIComponent(projectId)}/knowledge/sync`]
    : [
        `${API}/api/knowledge/sync`,
        `${API}/api/projects/sync-knowledge`,
        `${API}/api/mcp/project/sync`,
      ];
  let lastErr = "同步失败";
  for (const url of urls) {
    for (const method of ["GET", "POST"]) {
      try {
        const opts = { method };
        if (method === "POST") {
          opts.headers = { "Content-Type": "application/json" };
          opts.body = "{}";
        }
        const res = await fetch(url, opts);
        const raw = await res.text();
        let d = {};
        try { d = JSON.parse(raw); } catch { d = {}; }
        if (res.ok && d.ok === true) return d;
        if (res.status === 405) {
          lastErr = `405 Method Not Allowed · ${method} ${url}\n旧进程或未 git pull，请 bash knot-chat/start_web.sh`;
          continue;
        }
        lastErr = d.detail || d.error || `HTTP ${res.status} · ${raw.slice(0, 80)}`;
      } catch (e) {
        lastErr = e.message || lastErr;
      }
    }
  }
  throw new Error(lastErr);
}

async function syncProjectKnowledge(btn) {
  const orig = btn?.textContent;
  if (btn) btn.textContent = "同步中…";
  try {
    const d = await apiSyncKnowledge(null);
    if (btn) btn.textContent = `已同步 ${d.count ?? "✓"}`;
    setTimeout(() => { if (btn) btn.textContent = orig || "⟳ 同步知识库"; }, 2000);
  } catch (e) {
    if (btn) btn.textContent = "同步失败";
    alert(e.message || "同步失败");
    setTimeout(() => { if (btn) btn.textContent = orig || "⟳ 同步知识库"; }, 2500);
  }
}

function bindCreateProjectModal() {
  const modal = document.getElementById("createProjectModal");
  const btnNew = document.getElementById("btnNewProject");
  const btnCancel = document.getElementById("btnCancelProject");
  const btnSubmit = document.getElementById("btnSubmitProject");
  if (btnNew) {
    btnNew.style.display = canCreateProject() ? "" : "none";
    btnNew.onclick = () => {
      if (!canCreateProject()) { alert("无新建权限 · 请在 permissions.json 配置 can_create_projects"); return; }
      modal.hidden = false;
      document.getElementById("newProjectOwner").value = getCurrentUser() || "Core PM";
    };
  }
  btnCancel?.addEventListener("click", () => { modal.hidden = true; });
  modal?.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });
  btnSubmit?.addEventListener("click", async () => {
    const msg = document.getElementById("createProjectMsg");
    const payload = {
      editor: getCurrentUser(),
      name: document.getElementById("newProjectName")?.value?.trim(),
      id: document.getElementById("newProjectId")?.value?.trim(),
      owner: document.getElementById("newProjectOwner")?.value?.trim(),
      summary: document.getElementById("newProjectSummary")?.value?.trim(),
      due: document.getElementById("newProjectDue")?.value?.trim(),
    };
    if (msg) msg.textContent = "创建中…";
    try {
      const res = await fetch(`${API}/api/projects`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "创建失败");
      modal.hidden = true;
      if (msg) msg.textContent = "";
      await loadProjectsView();
      if (d.project?.id) openProjectDetail(d.project.id);
    } catch (e) {
      if (msg) msg.textContent = e.message || "失败";
    }
  });
}

function bindNoteForm(p) {
  const btn = document.getElementById("btnSaveNote");
  if (!btn) return;
  btn.onclick = async () => {
    const editor = requireCurrentUser();
    if (!editor) return;
    const text = document.getElementById("noteText")?.value || "";
    const msg = document.getElementById("noteSaveMsg");
    if (msg) msg.textContent = "发布中…";
    try {
      const res = await fetch(`${API}/api/projects/${p.id}/write`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editor, action: "ingest", text }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "失败");
      if (msg) msg.textContent = "已发布 · 已同步知识库";
      await openProjectDetail(p.id);
    } catch (e) {
      if (msg) msg.textContent = e.message || "失败";
    }
  };
  const syncBtn = document.getElementById("btnDetailSyncKb");
  if (syncBtn) {
    syncBtn.onclick = async () => {
      const msg = document.getElementById("noteSaveMsg");
      syncBtn.textContent = "同步中…";
      try {
        const d = await apiSyncKnowledge(p.id);
        if (msg) msg.textContent = `知识库已更新 · ${d.synced_at || ""}`;
        syncBtn.textContent = "已同步 ✓";
        setTimeout(() => { syncBtn.textContent = "同步本项目到知识库"; }, 2000);
      } catch (e) {
        if (msg) msg.textContent = e.message || "失败";
        syncBtn.textContent = "同步失败";
        setTimeout(() => { syncBtn.textContent = "同步本项目到知识库"; }, 2500);
      }
    };
  }
}

async function loadProjectsData() {
  const user = getCurrentUser();
  const qs = user ? `?user=${encodeURIComponent(user)}` : "";
  const data = await fetch(`${API}/api/projects${qs}`).then(r => r.json());
  projectsCache = data.items || [];
  return projectsCache;
}

let teamBlackboardRoster = [];
let teamBlackboardDefaults = [];
let homeAlertsCache = [];

function renderAlertList(alerts) {
  homeAlertsCache = alerts || [];
  const box = document.getElementById("alertList");
  if (!box) return;
  if (!homeAlertsCache.length) {
    box.innerHTML = "<span class='muted'>暂无告警</span>";
    return;
  }
  box.innerHTML = homeAlertsCache.map(a => {
    const key = esc(a.alert_key || `${a.type}:${a.ref}`);
    const acks = (a.suggested_acks || []).map(u => esc(u)).join("、");
    return `<div class="alert-row alert-item ${esc(a.level || "info")}" data-key="${key}">
      <div class="alert-row-main">
        <span class="alert-type-tag">${esc(a.type || "alert")}</span>
        <strong>${esc(a.title)}</strong>
        ${a.detail ? `<span class="muted alert-detail">${esc(a.detail)}</span>` : ""}
        ${acks ? `<span class="muted alert-acks-hint">需确认：${acks}</span>` : ""}
      </div>
      <button type="button" class="btn btn-sm btn-push-alert" data-key="${key}">推小黑板</button>
    </div>`;
  }).join("");
  box.querySelectorAll(".btn-push-alert").forEach(btn => {
    btn.onclick = () => pushMonitorAlerts([btn.dataset.key], false, btn);
  });
}

async function pushMonitorAlerts(refs, force = false, btn) {
  const editor = requireCurrentUser();
  if (!editor) return;
  const msg = document.getElementById("alertPushMsg");
  const orig = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = "推送中…"; }
  if (msg) msg.textContent = "推送中…";
  try {
    const body = { editor, force: !!force };
    if (refs && refs.length) body.refs = refs;
    const res = await fetch(`${API}/api/monitor/push-blackboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "推送失败");
    if (msg) msg.textContent = d.message || `已推送 ${d.pushed || 0} 条`;
    const bb = await fetch(`${API}/api/team-blackboard`).then(r => r.json());
    renderTeamBlackboard(bb.messages || []);
    const liveEl = document.getElementById("agentLive-home");
    if (liveEl && d.pushed) {
      liveEl.innerHTML = `<div class="live-label">监控 → 团队小黑板</div><pre>${esc(d.message || "")}\n${(d.items?.pushed || []).map(x => `- ${x.title}`).join("\n")}</pre>`;
    }
  } catch (e) {
    if (msg) msg.textContent = e.message || "失败";
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = orig || "推小黑板"; }
  }
}

function renderTeamBlackboardRecipients() {
  const box = document.getElementById("teamBlackboardRecChips");
  if (!box) return;
  const roster = teamBlackboardRoster.length ? teamBlackboardRoster : teamBlackboardDefaults;
  if (!roster.length) {
    box.innerHTML = "<span class='muted'>加载名单…</span>";
    return;
  }
  const defaults = new Set((teamBlackboardDefaults.length ? teamBlackboardDefaults : roster).map(normalizeUser));
  box.innerHTML = roster.map(name => {
    const checked = defaults.has(normalizeUser(name)) ? "checked" : "";
    return `<label class="team-bb-rec-chip"><input type="checkbox" name="bb-rec" value="${esc(name)}" ${checked} /> ${esc(name)}</label>`;
  }).join("");
}

function getSelectedBlackboardRecipients() {
  return [...document.querySelectorAll('#teamBlackboardRecChips input[name="bb-rec"]:checked')].map(el => el.value);
}

function vvReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function vvWriteJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function vvIsoNow() {
  return new Date().toISOString();
}

function vvAsDate(iso) {
  const d = new Date(iso || "");
  return Number.isNaN(d.getTime()) ? null : d;
}

function vvNextReviewDate(lastReviewAt, reviewDays) {
  const base = vvAsDate(lastReviewAt) || new Date();
  const days = Math.max(1, Number(reviewDays) || 30);
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

function vvDefaultSops() {
  const now = vvIsoNow();
  return [
    {
      id: "sop-payroll-quality-gate",
      name: "月结质量复核 SOP",
      owner: "COE 负责人",
      source: "Master Sheet · 月结质量页",
      review_days: 30,
      last_review_at: now,
      next_review_at: vvNextReviewDate(now, 30),
    },
    {
      id: "sop-leave-reconcile",
      name: "US 假期对账 SOP",
      owner: "Hub 运营负责人",
      source: "Leave Reconcile Runbook",
      review_days: 14,
      last_review_at: now,
      next_review_at: vvNextReviewDate(now, 14),
    },
  ];
}

function vvLoadState() {
  return {
    announcements: vvReadJson(VV_STORAGE_KEYS.announcements, []),
    demands: vvReadJson(VV_STORAGE_KEYS.demands, []),
    notes: vvReadJson(VV_STORAGE_KEYS.notes, []),
    sops: vvReadJson(VV_STORAGE_KEYS.sops, vvDefaultSops()),
    quality: vvReadJson(VV_STORAGE_KEYS.quality, {
      master_sheet_url: "",
      monthly_report_url: "",
      quality_score: "",
      editor: "",
      updated_at: "",
    }),
  };
}

function vvCountDueDays(nextReviewAt) {
  const next = vvAsDate(nextReviewAt);
  if (!next) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((next.getTime() - start.getTime()) / dayMs);
}

function renderVvAnnouncements(items) {
  const box = document.getElementById("vvAnnouncementList");
  if (!box) return;
  if (!items.length) {
    box.innerHTML = "<p class='muted'>暂无公告 · 建议先发布 COE 当月执行口径</p>";
    return;
  }
  box.innerHTML = items.slice(0, 8).map((item) => `
    <article class="vv-list-item">
      <div class="vv-list-head">
        <strong>${esc(item.title)}</strong>
        <span class="muted">${fmtDateTime(item.posted_at)}</span>
      </div>
      <p>${esc(item.body || "")}</p>
      <span class="muted">发布人：${esc(item.author || "—")}</span>
    </article>
  `).join("");
}

function renderVvDemands(items) {
  const box = document.getElementById("vvDemandList");
  if (!box) return;
  if (!items.length) {
    box.innerHTML = "<p class='muted'>暂无需求 · 运营/Hub 问题会在这里沉淀</p>";
    return;
  }
  box.innerHTML = items.slice(0, 10).map((item) => {
    const done = item.status === "closed";
    return `
      <article class="vv-list-item">
        <div class="vv-list-head">
          <strong>${esc(item.topic)}</strong>
          <span class="vv-status ${done ? "done" : "open"}">${done ? "已闭环" : "待处理"}</span>
        </div>
        <p>${esc(item.body || "")}</p>
        ${item.linked_issue_id ? `<p class="muted">已联动 Issue：<code>${esc(item.linked_issue_id)}</code></p>` : ""}
        <div class="vv-list-foot">
          <span class="muted">${esc(item.from || "未知来源")} · ${fmtDateTime(item.created_at)}</span>
          <div class="vv-list-actions">
            <button type="button" class="btn btn-sm" data-vv-demand-issue="${esc(item.id)}">转 Issue</button>
            <button type="button" class="btn btn-sm" data-vv-demand-toggle="${esc(item.id)}">${done ? "重新打开" : "标记闭环"}</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderVvNotes(items) {
  const box = document.getElementById("vvNotebookList");
  if (!box) return;
  if (!items.length) {
    box.innerHTML = "<p class='muted'>暂无记事 · 建议沉淀会议决策与分工依据</p>";
    return;
  }
  box.innerHTML = items.slice(0, 10).map((item) => `
    <article class="vv-list-item">
      <div class="vv-list-head">
        <strong>${esc(item.topic)}</strong>
        <span class="muted">${fmtDateTime(item.created_at)}</span>
      </div>
      <p>${esc(item.body || "")}</p>
      ${item.linked_meeting_hint ? `<p class="muted">已关联会议：${esc(item.linked_meeting_hint)}</p>` : ""}
      ${item.linked_project_id ? `<p class="muted">已关联项目：<code>${esc(item.linked_project_id)}</code></p>` : ""}
      <div class="vv-list-actions">
        <button type="button" class="btn btn-sm" data-vv-note-link-meeting="${esc(item.id)}">关联会议</button>
        <button type="button" class="btn btn-sm" data-vv-note-link-project="${esc(item.id)}">关联项目</button>
      </div>
      <span class="muted">记录人：${esc(item.author || "—")}</span>
    </article>
  `).join("");
}

function renderVvSops(items) {
  const box = document.getElementById("vvSopList");
  const reminder = document.getElementById("vvSopReminderBar");
  if (!box || !reminder) return;
  if (!items.length) {
    box.innerHTML = "<p class='muted'>暂无 SOP 条目</p>";
    reminder.innerHTML = "<span class='muted'>SOP 提醒已关闭（无条目）</span>";
    return;
  }
  const overdue = [];
  const dueSoon = [];
  box.innerHTML = items.map((item) => {
    const days = vvCountDueDays(item.next_review_at);
    if (days != null && days < 0) overdue.push(item);
    else if (days != null && days <= 7) dueSoon.push(item);
    const cls = days == null ? "unknown" : (days < 0 ? "overdue" : (days <= 7 ? "soon" : "ok"));
    const dueText = days == null
      ? "未设置"
      : (days < 0 ? `逾期 ${Math.abs(days)} 天` : (days === 0 ? "今天到期" : `${days} 天后`));
    return `
      <article class="vv-list-item">
        <div class="vv-list-head">
          <strong>${esc(item.name)}</strong>
          <span class="vv-status ${cls}">${esc(dueText)}</span>
        </div>
        <p class="muted">负责人：${esc(item.owner)} · 周期：${esc(String(item.review_days || 30))} 天</p>
        <p class="muted">唯一信息源：${esc(item.source || "未设置")}</p>
        <div class="vv-list-foot">
          <span class="muted">上次复核 ${fmtDateTime(item.last_review_at)} · 下次 ${fmtDateTime(item.next_review_at)}</span>
          <button type="button" class="btn btn-sm" data-vv-sop-review="${esc(item.id)}">完成 Review</button>
        </div>
      </article>
    `;
  }).join("");
  if (!overdue.length && !dueSoon.length) {
    reminder.innerHTML = "<span class='vv-ok'>SOP 复核正常，无待提醒项。</span>";
  } else {
    reminder.innerHTML = `
      <span class="vv-warn">待提醒：逾期 ${overdue.length} 项，7 天内到期 ${dueSoon.length} 项。</span>
      <span class="muted">建议推送提醒给对应负责人，确保 SOP 保持实时有效。</span>
    `;
  }
}

function renderVvProjectSync(projects) {
  const box = document.getElementById("vvProjectSync");
  if (!box) return;
  if (!projects.length) {
    box.innerHTML = "<p class='muted'>暂无项目数据</p>";
    return;
  }
  const top = [...projects]
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 5);
  box.innerHTML = top.map((p) => `
    <article class="vv-list-item">
      <div class="vv-list-head">
        <strong>${esc(p.name || p.id)}</strong>
        <span class="vv-status ${(p.progress || 0) >= 80 ? "done" : "open"}">${esc(String(p.progress || 0))}%</span>
      </div>
      <p>${esc(p.summary || "—")}</p>
      <div class="vv-list-foot">
        <span class="muted">负责人：${esc(p.owner || "—")} · 截止：${esc(p.due || "—")}</span>
        <button type="button" class="btn btn-sm" data-vv-open-project="${esc(p.id)}">打开项目</button>
      </div>
    </article>
  `).join("");
}

function renderVvQuality(quality) {
  const box = document.getElementById("vvQualityBoard");
  if (!box) return;
  const score = quality.quality_score;
  box.innerHTML = `
    <article class="vv-list-item">
      <div class="vv-list-head">
        <strong>运营质量快照</strong>
        <span class="vv-status ${(score !== "" && Number(score) >= 90) ? "done" : "open"}">${score !== "" ? `${esc(String(score))} / 100` : "未评分"}</span>
      </div>
      <p class="muted">主数据源：${quality.master_sheet_url ? `<a href="${esc(quality.master_sheet_url)}" target="_blank" rel="noopener">Master Sheet</a>` : "未配置"}</p>
      <p class="muted">质量月报：${quality.monthly_report_url ? `<a href="${esc(quality.monthly_report_url)}" target="_blank" rel="noopener">打开月报</a>` : "未配置"}</p>
      <span class="muted">最近更新：${quality.updated_at ? `${fmtDateTime(quality.updated_at)} · ${esc(quality.editor || "—")}` : "尚未保存"}</span>
      ${quality.last_sync_message ? `<p class="muted">管理看板同步：${esc(quality.last_sync_message)}</p>` : ""}
    </article>
  `;
}

function renderVvDemoPanel(projects = []) {
  const root = document.getElementById("vvAnnouncementList");
  if (!root) return;
  const st = vvLoadState();
  renderVvAnnouncements(st.announcements);
  renderVvDemands(st.demands);
  renderVvNotes(st.notes);
  renderVvSops(st.sops);
  renderVvProjectSync(projects);
  renderVvQuality(st.quality);
  const masterEl = document.getElementById("vvQualityMasterSheet");
  const reportEl = document.getElementById("vvQualityMonthlyReport");
  const scoreEl = document.getElementById("vvQualityScore");
  if (masterEl && !masterEl.value) masterEl.value = st.quality.master_sheet_url || "";
  if (reportEl && !reportEl.value) reportEl.value = st.quality.monthly_report_url || "";
  if (scoreEl && !scoreEl.value && st.quality.quality_score !== "") scoreEl.value = String(st.quality.quality_score);
}

function vvSetActionMsg(text, isError = false) {
  const box = document.getElementById("vvActionMsg");
  if (!box) return;
  box.textContent = text || "";
  box.classList.toggle("vv-error", !!isError);
}

async function vvConvertDemandToIssue(demandId) {
  const editor = requireCurrentUser();
  if (!editor) return;
  const st = vvLoadState();
  const demand = st.demands.find((item) => item.id === demandId);
  if (!demand) {
    vvSetActionMsg("未找到需求条目", true);
    return;
  }
  vvSetActionMsg("正在转 Issue…");
  try {
    const res = await fetch(`${API}/api/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editor,
        title: `[需求] ${demand.topic}`,
        country: "Global",
        severity: "medium",
        owner: demand.from || editor,
        summary: demand.body || "",
        category: "运营协同需求收集箱",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "转 Issue 失败");
    const issueId = data.issue?.id || "";
    st.demands = st.demands.map((item) => item.id === demandId
      ? { ...item, linked_issue_id: issueId, status: "closed" }
      : item);
    vvWriteJson(VV_STORAGE_KEYS.demands, st.demands);
    renderVvDemoPanel(projectsCache);
    vvSetActionMsg(`已转 Issue：${issueId || "创建成功"}，正在跳转 Issue 板块`);
    switchView("issues");
    await loadIssues();
  } catch (err) {
    vvSetActionMsg(err.message || "转 Issue 失败", true);
  }
}

function vvLinkNoteToMeeting(noteId) {
  const st = vvLoadState();
  const note = st.notes.find((item) => item.id === noteId);
  if (!note) {
    vvSetActionMsg("未找到记事条目", true);
    return;
  }
  switchView("meetings");
  const input = document.getElementById("meetingPasteText");
  if (input) {
    input.value = `# ${note.topic}\n\n${note.body || ""}\n\n## 关键决策\n- `;
  }
  st.notes = st.notes.map((item) => item.id === noteId
    ? { ...item, linked_meeting_hint: "已预填到会议解析区" }
    : item);
  vvWriteJson(VV_STORAGE_KEYS.notes, st.notes);
  vvSetActionMsg("已跳转会议板块，并预填记事内容到“上传/粘贴会议纪要”区域");
}

function vvLinkNoteToProject(noteId) {
  const st = vvLoadState();
  const note = st.notes.find((item) => item.id === noteId);
  if (!note) {
    vvSetActionMsg("未找到记事条目", true);
    return;
  }
  const target = (projectsCache || []).find((p) => {
    const t = `${p.name || ""} ${p.id || ""}`.toLowerCase();
    return t.includes(String(note.topic || "").toLowerCase());
  }) || (projectsCache || [])[0];
  if (!target) {
    vvSetActionMsg("当前没有可关联项目，请先创建项目", true);
    return;
  }
  st.notes = st.notes.map((item) => item.id === noteId
    ? { ...item, linked_project_id: target.id }
    : item);
  vvWriteJson(VV_STORAGE_KEYS.notes, st.notes);
  renderVvDemoPanel(projectsCache);
  vvSetActionMsg(`已关联项目 ${target.id}，正在跳转项目板块`);
  switchView("projects");
  openProjectDetail(target.id);
}

async function vvSyncQualityToMgmt() {
  const editor = requireCurrentUser();
  if (!editor) return;
  const st = vvLoadState();
  vvSetActionMsg("正在同步到管理看板指标区…");
  try {
    const res = await fetch(`${API}/api/management/vv-quality-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editor,
        quality_score: st.quality.quality_score,
        master_sheet_url: st.quality.master_sheet_url,
        monthly_report_url: st.quality.monthly_report_url,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "同步失败");
    st.quality.last_sync_message = data.message || "已同步（占位）";
    vvWriteJson(VV_STORAGE_KEYS.quality, st.quality);
    renderVvDemoPanel(projectsCache);
    vvSetActionMsg(st.quality.last_sync_message);
    switchView("admin-mgmt");
    await loadManagementBoard();
  } catch (err) {
    vvSetActionMsg(err.message || "同步失败", true);
  }
}

async function vvIngestKnowledgePlaceholder() {
  const editor = requireCurrentUser();
  if (!editor) return;
  vvSetActionMsg("知识入库中…");
  try {
    const st = vvLoadState();
    const res = await fetch(`${API}/api/vv/knowledge-ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor, payload: st }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "知识入库失败");
    vvSetActionMsg(data.message || "知识入库占位调用成功");
  } catch (err) {
    vvSetActionMsg(err.message || "知识入库失败", true);
  }
}

async function vvTriggerAgentPlaceholder() {
  const editor = requireCurrentUser();
  if (!editor) return;
  vvSetActionMsg("触发协同 Agent…");
  try {
    const st = vvLoadState();
    const res = await fetch(`${API}/api/vv/agent-trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editor,
        mode: "coordination",
        summary: {
          demands_open: st.demands.filter((d) => d.status !== "closed").length,
          sop_due_7d: st.sops.filter((s) => {
            const days = vvCountDueDays(s.next_review_at);
            return days != null && days <= 7;
          }).length,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "触发失败");
    vvSetActionMsg(data.message || "协同 Agent 占位触发成功");
  } catch (err) {
    vvSetActionMsg(err.message || "触发失败", true);
  }
}

function bindVvDemoForms() {
  const annForm = document.getElementById("vvAnnouncementForm");
  annForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const editor = requireCurrentUser();
    if (!editor) return;
    const titleEl = document.getElementById("vvAnnouncementTitle");
    const bodyEl = document.getElementById("vvAnnouncementBody");
    const msg = document.getElementById("vvAnnouncementMsg");
    const title = titleEl?.value?.trim();
    const body = bodyEl?.value?.trim();
    if (!title) { if (msg) msg.textContent = "请填写公告标题"; return; }
    const st = vvLoadState();
    st.announcements.unshift({ id: `ann-${Date.now()}`, title, body, author: editor, posted_at: vvIsoNow() });
    vvWriteJson(VV_STORAGE_KEYS.announcements, st.announcements);
    if (titleEl) titleEl.value = "";
    if (bodyEl) bodyEl.value = "";
    if (msg) msg.textContent = "已发布";
    renderVvDemoPanel(projectsCache);
  });

  const demandForm = document.getElementById("vvDemandForm");
  demandForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const editor = requireCurrentUser();
    if (!editor) return;
    const from = document.getElementById("vvDemandFrom")?.value?.trim() || "运营/Hub";
    const topicEl = document.getElementById("vvDemandTopic");
    const bodyEl = document.getElementById("vvDemandBody");
    const msg = document.getElementById("vvDemandMsg");
    const topic = topicEl?.value?.trim();
    const body = bodyEl?.value?.trim();
    if (!topic) { if (msg) msg.textContent = "请填写问题主题"; return; }
    const st = vvLoadState();
    st.demands.unshift({ id: `dem-${Date.now()}`, from, topic, body, status: "open", author: editor, created_at: vvIsoNow() });
    vvWriteJson(VV_STORAGE_KEYS.demands, st.demands);
    if (topicEl) topicEl.value = "";
    if (bodyEl) bodyEl.value = "";
    if (msg) msg.textContent = "已收集";
    renderVvDemoPanel(projectsCache);
  });

  const notebookForm = document.getElementById("vvNotebookForm");
  notebookForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const editor = requireCurrentUser();
    if (!editor) return;
    const topicEl = document.getElementById("vvNotebookTopic");
    const bodyEl = document.getElementById("vvNotebookBody");
    const msg = document.getElementById("vvNotebookMsg");
    const topic = topicEl?.value?.trim();
    const body = bodyEl?.value?.trim();
    if (!topic) { if (msg) msg.textContent = "请填写主题"; return; }
    const st = vvLoadState();
    st.notes.unshift({ id: `note-${Date.now()}`, topic, body, author: editor, created_at: vvIsoNow() });
    vvWriteJson(VV_STORAGE_KEYS.notes, st.notes);
    if (topicEl) topicEl.value = "";
    if (bodyEl) bodyEl.value = "";
    if (msg) msg.textContent = "已记录";
    renderVvDemoPanel(projectsCache);
  });

  const sopForm = document.getElementById("vvSopForm");
  sopForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const editor = requireCurrentUser();
    if (!editor) return;
    const nameEl = document.getElementById("vvSopName");
    const ownerEl = document.getElementById("vvSopOwner");
    const sourceEl = document.getElementById("vvSopSource");
    const daysEl = document.getElementById("vvSopReviewDays");
    const msg = document.getElementById("vvSopMsg");
    const name = nameEl?.value?.trim();
    const owner = ownerEl?.value?.trim();
    if (!name || !owner) {
      if (msg) msg.textContent = "请填写 SOP 名称与负责人";
      return;
    }
    const reviewDays = Math.max(1, Number(daysEl?.value) || 30);
    const now = vvIsoNow();
    const st = vvLoadState();
    st.sops.unshift({
      id: `sop-${Date.now()}`,
      name,
      owner,
      source: sourceEl?.value?.trim() || "",
      review_days: reviewDays,
      last_review_at: now,
      next_review_at: vvNextReviewDate(now, reviewDays),
      editor,
    });
    vvWriteJson(VV_STORAGE_KEYS.sops, st.sops);
    if (nameEl) nameEl.value = "";
    if (ownerEl) ownerEl.value = "";
    if (sourceEl) sourceEl.value = "";
    if (daysEl) daysEl.value = "30";
    if (msg) msg.textContent = "已新增 SOP";
    renderVvDemoPanel(projectsCache);
  });

  const qualityForm = document.getElementById("vvQualityForm");
  qualityForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const editor = requireCurrentUser();
    if (!editor) return;
    const msg = document.getElementById("vvQualityMsg");
    const scoreRaw = document.getElementById("vvQualityScore")?.value?.trim();
    const score = scoreRaw === "" ? "" : Math.max(0, Math.min(100, Number(scoreRaw) || 0));
    const quality = {
      master_sheet_url: document.getElementById("vvQualityMasterSheet")?.value?.trim() || "",
      monthly_report_url: document.getElementById("vvQualityMonthlyReport")?.value?.trim() || "",
      quality_score: score,
      editor,
      updated_at: vvIsoNow(),
    };
    vvWriteJson(VV_STORAGE_KEYS.quality, quality);
    if (msg) msg.textContent = "质量看板已保存";
    renderVvDemoPanel(projectsCache);
  });

  const listRoot = document.getElementById("view-home");
  listRoot?.addEventListener("click", async (e) => {
    const demandIssueBtn = e.target.closest("[data-vv-demand-issue]");
    if (demandIssueBtn) {
      await vvConvertDemandToIssue(demandIssueBtn.dataset.vvDemandIssue);
      return;
    }
    const demandBtn = e.target.closest("[data-vv-demand-toggle]");
    if (demandBtn) {
      const st = vvLoadState();
      st.demands = st.demands.map((item) => item.id === demandBtn.dataset.vvDemandToggle
        ? { ...item, status: item.status === "closed" ? "open" : "closed" }
        : item);
      vvWriteJson(VV_STORAGE_KEYS.demands, st.demands);
      renderVvDemoPanel(projectsCache);
      return;
    }
    const sopBtn = e.target.closest("[data-vv-sop-review]");
    if (sopBtn) {
      const editor = requireCurrentUser();
      if (!editor) return;
      const now = vvIsoNow();
      const st = vvLoadState();
      st.sops = st.sops.map((item) => {
        if (item.id !== sopBtn.dataset.vvSopReview) return item;
        return {
          ...item,
          last_review_at: now,
          next_review_at: vvNextReviewDate(now, item.review_days),
          editor,
        };
      });
      vvWriteJson(VV_STORAGE_KEYS.sops, st.sops);
      renderVvDemoPanel(projectsCache);
      const msg = document.getElementById("vvSopMsg");
      if (msg) msg.textContent = "已记录本次 Review";
      return;
    }
    const linkMeetingBtn = e.target.closest("[data-vv-note-link-meeting]");
    if (linkMeetingBtn) {
      vvLinkNoteToMeeting(linkMeetingBtn.dataset.vvNoteLinkMeeting);
      return;
    }
    const linkProjectBtn = e.target.closest("[data-vv-note-link-project]");
    if (linkProjectBtn) {
      vvLinkNoteToProject(linkProjectBtn.dataset.vvNoteLinkProject);
      return;
    }
    const openProjectBtn = e.target.closest("[data-vv-open-project]");
    if (openProjectBtn) {
      switchView("projects");
      openProjectDetail(openProjectBtn.dataset.vvOpenProject);
    }
  });

  const reminderBtn = document.getElementById("vvSopPushReminder");
  reminderBtn?.addEventListener("click", async () => {
    const editor = requireCurrentUser();
    if (!editor) return;
    const msg = document.getElementById("vvSopMsg");
    const st = vvLoadState();
    const dueItems = st.sops.filter((item) => {
      const days = vvCountDueDays(item.next_review_at);
      return days != null && days <= 7;
    });
    if (!dueItems.length) {
      if (msg) msg.textContent = "当前无需要提醒的 SOP";
      return;
    }
    const required_acks = (teamBlackboardDefaults.length ? teamBlackboardDefaults : teamBlackboardRoster)
      .map((u) => String(u || "").trim())
      .filter(Boolean);
    if (!required_acks.length) {
      if (msg) msg.textContent = "暂无默认提醒名单，请先在团队小黑板勾选确认名单";
      return;
    }
    const text = `SOP Review 提醒：${dueItems.map((item) => {
      const days = vvCountDueDays(item.next_review_at);
      const due = days < 0 ? `逾期${Math.abs(days)}天` : `${days}天后到期`;
      return `${item.name}(${item.owner} · ${due})`;
    }).join("；")}`;
    if (msg) msg.textContent = "推送提醒中…";
    try {
      const res = await fetch(`${API}/api/team-blackboard/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editor, text, required_acks }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "推送失败");
      if (msg) msg.textContent = "已推送至团队小黑板";
      const bb = await fetch(`${API}/api/team-blackboard`).then((r) => r.json()).catch(() => null);
      if (bb?.messages) renderTeamBlackboard(bb.messages || []);
    } catch (err) {
      if (msg) msg.textContent = err.message || "推送失败";
    }
  });

  document.getElementById("vvDemandToIssueBtn")?.addEventListener("click", async () => {
    const st = vvLoadState();
    const latest = st.demands.find((item) => item.status !== "closed") || st.demands[0];
    if (!latest) {
      vvSetActionMsg("暂无可转 Issue 的需求", true);
      return;
    }
    await vvConvertDemandToIssue(latest.id);
  });

  document.getElementById("vvNotebookToMeetingBtn")?.addEventListener("click", () => {
    const st = vvLoadState();
    const latest = st.notes[0];
    if (!latest) {
      vvSetActionMsg("暂无可关联的记事条目", true);
      return;
    }
    vvLinkNoteToMeeting(latest.id);
  });

  document.getElementById("vvNotebookToProjectBtn")?.addEventListener("click", () => {
    const st = vvLoadState();
    const latest = st.notes[0];
    if (!latest) {
      vvSetActionMsg("暂无可关联的记事条目", true);
      return;
    }
    vvLinkNoteToProject(latest.id);
  });

  document.getElementById("vvQualityToMgmtBtn")?.addEventListener("click", vvSyncQualityToMgmt);
  document.getElementById("vvIngestKnowledge")?.addEventListener("click", vvIngestKnowledgePlaceholder);
  document.getElementById("vvTriggerAgent")?.addEventListener("click", vvTriggerAgentPlaceholder);
}

async function loadHome() {
  try {
    updateTopbarDate();
    const user = getCurrentUser();
    const qs = user ? `?user=${encodeURIComponent(user)}` : "";
    const [dash, projects, bb, idxSt, jobs, agents] = await Promise.all([
      fetch(`${API}/api/dashboard`).then(r => r.json()),
      loadProjectsData(),
      fetch(`${API}/api/team-blackboard`).then(r => r.json()).catch(() => ({ messages: [] })),
      fetch(`${API}/api/library/index-status`).then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API}/api/jobs?limit=100`).then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API}/api/agents`).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    const libData = await fetch(`${API}/api/library/shelves${qs}`).then(r => r.json()).catch(() => ({ shelves: [] }));
    await loadGlobalOverviewLayer(dash, bb, {
      docCount: idxSt?.document_count,
      shelfCount: (libData.shelves || []).length,
      indexOk: !!idxSt,
      jobCount: jobs?.total ?? jobs?.items?.length,
      agentCount: agents?.agents?.length,
      gatewayOk: true,
    });
    teamBlackboardRoster = bb.ack_roster || bb.default_required_ack_users || [];
    teamBlackboardDefaults = bb.default_required_ack_users || teamBlackboardRoster;
    renderTeamBlackboardRecipients();
    renderTeamBlackboard(bb.messages || []);
    renderActivityHeatmap(dash.activity_heatmap || [], dash.week_pulse || []);
    renderRecentOps(dash.recent_operations || []);
    updateHomeKpiPanels(dash, bb);
    renderAlertList(dash.alerts || []);
    renderVvDemoPanel(projects || []);
    document.getElementById("milestoneCards").innerHTML = (dash.upcoming_milestones || []).map(m => {
      const dl = m.days_left < 0 ? `逾期 ${-m.days_left}d` : m.days_left === 0 ? "今天" : `${m.days_left}d`;
      return `<div class="milestone-item"><strong>${esc(m.label)}</strong> · ${esc(m.project)} · ${dl} · 截止 ${esc(m.date || "—")}</div>`;
    }).join("") || "<span class='muted'>—</span>";
    setOnline();
    refreshTabAgentLive("home");
  } catch (e) {
    setOffline();
    await loadGlobalOverviewLayer({}, { messages: [] }, { gatewayOk: false });
    renderVvDemoPanel(projectsCache || []);
  }
}

function renderTeamBlackboard(messages) {
  const box = document.getElementById("teamBlackboardList");
  if (!box) return;
  const user = getCurrentUser();
  if (!messages.length) {
    box.innerHTML = "<p class='muted'>暂无消息 · 发布第一条跨部门通知</p>";
    return;
  }
  box.innerHTML = messages.map(m => {
    const required = m.required_acks || [];
    const reqNorm = new Set(required.map(normalizeUser));
    const userNorm = normalizeUser(user);
    const mustAck = !reqNorm.size || reqNorm.has(userNorm);
    const acked = (m.acks || []).some(a => normalizeUser(a.user) === userNorm);
    const st = m.ack_status || {};
    const ackList = (m.acks || []).map(a => `${esc(a.user)} ${fmtDateTime(a.at)}`).join(" · ");
    const pending = (st.pending_users || []).map(u => esc(u)).join("、");
    const requiredLabel = required.map(u => esc(u)).join("、");
    const ratio = st.ratio || "—";
    const complete = st.complete;
    const progressCls = complete ? "ack-complete" : "ack-partial";
    let ackBtn = "";
    if (!mustAck) {
      ackBtn = `<span class="muted" style="font-size:11px">无需您确认</span>`;
    } else if (acked) {
      ackBtn = `<button type="button" class="btn btn-sm team-bb-ack-btn" disabled>已收到 ✓</button>`;
    } else {
      ackBtn = `<button type="button" class="btn btn-sm team-bb-ack-btn" data-id="${esc(m.id)}">收到</button>`;
    }
    return `
    <div class="team-bb-item ${complete ? "team-bb-done" : ""} ${m.source === "monitor" ? "team-bb-monitor" : ""}" data-id="${esc(m.id)}">
      <div class="team-bb-meta">${fmtDateTime(m.posted_at)} · <strong>${esc(m.author)}</strong>
        ${m.source === "monitor" ? `<span class="team-bb-source-tag">监控预警</span>` : ""}
        <span class="ack-ratio ${progressCls}">已收到 ${esc(ratio)}</span>
      </div>
      <div class="team-bb-text">${esc(m.text)}</div>
      ${requiredLabel ? `<div class="team-bb-required">需确认：${requiredLabel}</div>` : ""}
      <div class="team-bb-acks">
        ${complete
          ? `<span class="ack-done">指定同事已全部收到 ✓</span>`
          : pending
            ? `<span class="ack-pending">待确认：${pending}</span>`
            : "<span class='muted'>待确认</span>"}
        ${ackList ? `<span class="ack-list">记录：${ackList}</span>` : ""}
        ${ackBtn}
      </div>
    </div>`;
  }).join("");
  box.querySelectorAll(".team-bb-ack-btn:not([disabled])").forEach(btn => {
    btn.onclick = () => ackTeamBlackboard(btn.dataset.id);
  });
}

async function postTeamBlackboard(text) {
  const editor = requireCurrentUser();
  if (!editor) return;
  const required_acks = getSelectedBlackboardRecipients();
  if (!required_acks.length) {
    alert("请至少勾选一位需确认的同事");
    return;
  }
  const msg = document.getElementById("teamBlackboardMsg");
  if (msg) msg.textContent = "发布中…";
  try {
    const res = await fetch(`${API}/api/team-blackboard/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor, text, required_acks }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "发布失败");
    if (msg) msg.textContent = "已发布 · 已同步知识库";
    document.getElementById("teamBlackboardInput").value = "";
    const bb = await fetch(`${API}/api/team-blackboard`).then(r => r.json());
    renderTeamBlackboard(bb.messages || []);
  } catch (e) {
    if (msg) msg.textContent = e.message || "失败";
  }
}

async function ackTeamBlackboard(messageId) {
  const editor = requireCurrentUser();
  if (!editor) return;
  try {
    const res = await fetch(`${API}/api/team-blackboard/messages/${messageId}/ack`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "失败");
    const bb = await fetch(`${API}/api/team-blackboard`).then(r => r.json());
    renderTeamBlackboard(bb.messages || []);
  } catch (e) {
    alert(e.message || "确认失败");
  }
}

function renderActivityHeatmap(cells, weekPulse) {
  const box = document.getElementById("activityHeatmap");
  if (!box) return;
  const max = Math.max(1, ...cells.map(c => c.count || 0));
  const WEEK_DAYS = ["一", "二", "三", "四", "五", "六", "日"];
  const PULSE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (!cells.length) {
    box.innerHTML = "<p class='muted'>暂无操作数据</p>";
  } else {
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    const grid = rows.map((row, ri) => {
      const label = rows.length > 1
        ? `<div class="heat-row-label">${ri === 0 ? "近 7 天" : "前 7 天"}</div>`
        : "";
      const cellsHtml = row.map(c => {
        const lvl = c.count === 0 ? 0 : Math.min(4, Math.ceil((c.count / max) * 4));
        return `<div class="heat-cell lvl-${lvl}" title="${esc(c.date)} · ${c.count} 次">
          <span class="heat-count">${c.count || ""}</span>
          <span class="heat-date">${esc(c.date.slice(5))}</span>
        </div>`;
      }).join("");
      return `${label}<div class="heat-grid">${cellsHtml}</div>`;
    }).join("");

    box.innerHTML = `${grid}<div class="heat-legend"><span>少</span><div class="heat-legend-scale">
      ${[0, 1, 2, 3, 4].map(n => `<span class="heat-legend-cell lvl-${n}"></span>`).join("")}
    </div><span>多</span></div>`;
  }

  const wp = document.getElementById("weekPulseChart");
  if (wp) {
    if (!weekPulse?.length) {
      wp.innerHTML = "";
    } else {
      const wmax = Math.max(1, ...weekPulse);
      wp.innerHTML = `<p class="week-pulse-title">本周脚本执行 · Weekly Jobs</p><div class="pulse-row">${weekPulse.map((n, i) =>
        `<div class="pulse-bar" title="${PULSE_DAYS[i] || ""} · ${n} 次">
          <div class="pulse-bar-inner" style="height:${Math.max(8, (n / wmax) * 56)}px">${n ? `<span>${n}</span>` : ""}</div>
          <span class="pulse-bar-label">${WEEK_DAYS[i] || ""}</span>
        </div>`
      ).join("")}</div>`;
    }
  }
}

function renderRecentOps(ops) {
  const box = document.getElementById("recentOpsList");
  if (!box) return;
  if (!ops.length) {
    box.innerHTML = "<p class='muted'>暂无 · 上传文件或发布动态后会出现在此</p>";
    return;
  }
  box.innerHTML = ops.map(o => `
    <div class="recent-op-item">
      <span class="recent-op-time">${fmtDateTime(o.at)}</span>
      <span class="recent-op-user">${esc(o.by || "—")}</span>
      <span class="recent-op-proj">${esc(o.project || "")}</span>
      <span class="recent-op-text">${esc(o.text || "")}</span>
    </div>`).join("");
}

async function loadProjectsView() {
  try {
    await loadUserPermissions();
    applyNavPermissions();
    await loadRegistry();
    await loadProjectsData();
    const sorted = sortProjectsByBlackboard(projectsCache);
    const hero = document.getElementById("blackboardHero");
    if (hero) hero.innerHTML = renderBlackboardHero(sorted);
    const empty = document.getElementById("projectsEmpty");
    const cards = document.getElementById("projectCards");
    if (!sorted.length) {
      if (empty) {
        empty.style.display = "block";
        empty.innerHTML = `暂无可见项目。请检查：① 右上角填写姓名 ② 工作区 <code>git pull && bash knot-chat/start_web.sh</code> ③ <a href="${API}/api/projects" target="_blank">/api/projects</a>`;
      }
      if (cards) cards.innerHTML = "";
    } else {
      if (empty) empty.style.display = "none";
      cards.innerHTML = sorted.map(p => projectRichCard(p)).join("");
      bindRichCardEvents();
    }
    bindCreateProjectModal();
    document.getElementById("btnNewProject") && (document.getElementById("btnNewProject").style.display = canCreateProject() ? "" : "none");
    const hashId = parseProjectsHash();
    if (hashId) {
      await openProjectDetail(hashId);
    } else if (!selectedProjectId) {
      showProjectsList();
    }
    setOnline();
    refreshTabAgentLive("projects");
  } catch (e) { setOffline(); }
}

async function loadAgents() {
  try {
    const [reg, meta] = await Promise.all([
      loadRegistry(),
      fetch(`${API}/api/meta`).then(r => r.json()).catch(() => ({})),
    ]);

    applyPortalLinks(meta, reg);
    if (typeof window.initRegionalTools === "function") window.initRegionalTools(meta);

    const dep = reg.deployment || {};
    document.getElementById("deployBanner").innerHTML = `
      <h3>Knot 建 2 个 Bot · 网页 + Knot 共用 Gateway API</h3>
      <p>${esc(dep.note)} · 工蜂 <code style="color:#e0e7ff">${esc(dep.git_repo_https || "")}</code></p>
      <div class="deploy-stats">
        <div class="deploy-stat"><div class="num">${dep.knot_bots_required ?? 2}</div><div class="lbl">Knot Bot</div></div>
        <div class="deploy-stat"><div class="num">${(reg.agents || []).length + 1}</div><div class="lbl">逻辑 Agent</div></div>
        <div class="deploy-stat"><div class="num">:${dep.port ?? 18180}</div><div class="lbl">端口</div></div>
        <div class="deploy-stat"><div class="num" style="font-size:14px;padding-top:8px">${esc(dep.workspace_path || "/data/workspace")}</div><div class="lbl">工作区路径</div></div>
      </div>`;
    renderAgentConnectPanel(reg);
    const guideEl = document.getElementById("workstationGuide");
    guideEl.innerHTML = renderWorkstationGuide(reg, meta);
    bindCopyButtons(guideEl);
    const testBtn = document.getElementById("btnTestMainMenu");
    if (testBtn) testBtn.onclick = () => { openChat(); sendChat("主菜单"); };
    document.getElementById("knotSetup").innerHTML = renderOrchestrator(reg, false);
    const qaSetup = document.getElementById("qaAgentSetup");
    if (qaSetup) qaSetup.innerHTML = renderQaAgentSetup(reg);
    bindCopyButtons(qaSetup);
    const grid = document.getElementById("agentRegistry");
    grid.innerHTML = (reg.agents || []).filter(a => a.id !== "qa" && !a.id?.startsWith("admin-")).map(a => renderAgentCard(a, true)).join("");
    bindAgentButtons(grid);
    const adminGrid = document.getElementById("adminAgentRegistry");
    if (adminGrid) {
      adminGrid.innerHTML = (reg.agents || []).filter(a => a.id?.startsWith("admin-")).map(a => renderAgentCard(a, true)).join("");
      bindAgentButtons(adminGrid);
    }
    setupChatChips(reg);
    setOnline();
  } catch (e) { setOffline(); }
}

let issuesCache = [];
let selectedIssueId = null;

function closeIssueDrawer() {
  document.getElementById("issueDrawer")?.setAttribute("hidden", "");
  document.getElementById("issueNewModal")?.setAttribute("hidden", "");
}

function openIssueNewModal() {
  document.getElementById("issueNewModal")?.removeAttribute("hidden");
  document.getElementById("issueNewMsg").textContent = "";
}

function fillIssueDrawer(issue) {
  if (!issue) return;
  selectedIssueId = issue.id;
  document.getElementById("issueEditId").value = issue.id || "";
  document.getElementById("issueDrawerTitle").textContent = issue.title || issue.id;
  document.getElementById("issueEditTitle").value = issue.title || "";
  document.getElementById("issueEditCountry").value = issue.country || "Global";
  document.getElementById("issueEditSeverity").value = issue.severity || "medium";
  document.getElementById("issueEditStatus").value = issue.status || "open";
  document.getElementById("issueEditOwner").value = issue.owner || "";
  document.getElementById("issueEditRaiseDate").value = String(issue.raise_date || "").slice(0, 10);
  document.getElementById("issueEditCategory").value = issue.category || "";
  document.getElementById("issueEditProjects").value = (issue.project_ids || []).join(", ");
  document.getElementById("issueEditSummary").value = issue.summary || "";
  document.getElementById("issueEditImpact").value = issue.impact || "";
  document.getElementById("issueEditMsg").textContent = "";
  document.getElementById("issueDrawer")?.removeAttribute("hidden");
}

async function loadIssues() {
  const country = document.getElementById("issueFilterCountry")?.value || "";
  const status = document.getElementById("issueFilterStatus")?.value || "";
  const params = currentUserQueryParams(new URLSearchParams());
  if (country) params.set("country", country);
  if (status) params.set("status", status);
  const qs = params.toString() ? `?${params}` : "";
  const data = await fetch(`${API}/api/issues${qs}`).then(r => r.json());
  issuesCache = data.items || [];
  const meta = document.getElementById("issueListMeta");
  if (meta) meta.textContent = `共 ${issuesCache.length} 条`;
  document.getElementById("issueTableBody").innerHTML = issuesCache.map(i => `
    <tr data-iid="${esc(i.id)}">
      <td><span class="sev ${esc(i.severity)}">${esc(i.severity)}</span></td>
      <td>${esc(i.country)}</td>
      <td><strong>${esc(i.title)}</strong><br><span class="muted">${esc((i.summary || "").slice(0, 100))}</span></td>
      <td><span class="issue-status-tag status-${esc(i.status)}">${esc(i.status)}</span></td>
      <td>${esc(i.owner || "—")}</td>
      <td class="issue-row-actions">
        <button type="button" class="btn btn-sm issue-btn-detail" data-iid="${esc(i.id)}">详情</button>
        <button type="button" class="btn btn-sm issue-btn-push" data-iid="${esc(i.id)}">推小黑板</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="6" class="muted" style="padding:16px">暂无 Issue</td></tr>`;
  document.querySelectorAll(".issue-btn-detail").forEach(btn => {
    btn.onclick = () => {
      const issue = issuesCache.find(x => x.id === btn.dataset.iid);
      fillIssueDrawer(issue);
    };
  });
  document.querySelectorAll(".issue-btn-push").forEach(btn => {
    btn.onclick = () => pushIssueBlackboard(btn.dataset.iid);
  });
  refreshTabAgentLive("issues");
}

async function saveIssueFromDrawer(e) {
  e?.preventDefault();
  const editor = requireCurrentUser();
  if (!editor) return;
  const id = document.getElementById("issueEditId")?.value;
  const msg = document.getElementById("issueEditMsg");
  const pids = (document.getElementById("issueEditProjects")?.value || "").split(",").map(s => s.trim()).filter(Boolean);
  const body = {
    editor,
    title: document.getElementById("issueEditTitle")?.value,
    country: document.getElementById("issueEditCountry")?.value,
    severity: document.getElementById("issueEditSeverity")?.value,
    status: document.getElementById("issueEditStatus")?.value,
    owner: document.getElementById("issueEditOwner")?.value,
    raise_date: document.getElementById("issueEditRaiseDate")?.value,
    category: document.getElementById("issueEditCategory")?.value,
    summary: document.getElementById("issueEditSummary")?.value,
    impact: document.getElementById("issueEditImpact")?.value,
    project_ids: pids,
  };
  try {
    const res = await fetch(`${API}/api/issues/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "保存失败");
    if (msg) msg.textContent = "已保存 · 状态变更已记 audit";
    await loadIssues();
    fillIssueDrawer(d.issue);
  } catch (err) {
    if (msg) msg.textContent = err.message || "失败";
  }
}

async function createIssueFromForm(e) {
  e?.preventDefault();
  const editor = requireCurrentUser();
  if (!editor) return;
  const msg = document.getElementById("issueNewMsg");
  const body = {
    editor,
    title: document.getElementById("issueNewTitle")?.value,
    country: document.getElementById("issueNewCountry")?.value,
    severity: document.getElementById("issueNewSeverity")?.value,
    owner: document.getElementById("issueNewOwner")?.value,
    summary: document.getElementById("issueNewSummary")?.value,
  };
  try {
    const res = await fetch(`${API}/api/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "创建失败");
    closeIssueDrawer();
    document.getElementById("issueNewForm")?.reset();
    await loadIssues();
    fillIssueDrawer(d.issue);
  } catch (err) {
    if (msg) msg.textContent = err.message || "失败";
  }
}

async function pushIssueBlackboard(issueId) {
  const editor = requireCurrentUser();
  if (!editor) return;
  const msg = document.getElementById("issueEditMsg");
  try {
    const res = await fetch(`${API}/api/issues/${encodeURIComponent(issueId)}/push-blackboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "推送失败");
    if (msg) msg.textContent = "已推团队小黑板 · 首页可点「收到」";
    else alert("已推团队小黑板");
  } catch (err) {
    if (msg) msg.textContent = err.message || "失败";
    else alert(err.message || "失败");
  }
}

async function syncIssueProjects(issueId) {
  const editor = requireCurrentUser();
  if (!editor) return;
  const msg = document.getElementById("issueEditMsg");
  try {
    const res = await fetch(`${API}/api/issues/${encodeURIComponent(issueId)}/sync-projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "同步失败");
    if (msg) msg.textContent = d.message || "已同步项目小黑板";
  } catch (err) {
    if (msg) msg.textContent = err.message || "失败";
  }
}

async function syncIssuesKnowledge() {
  const msg = document.getElementById("issueImportMsg");
  try {
    const res = await fetch(`${API}/api/issues/sync-knowledge`, { method: "POST" });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "失败");
    if (msg) msg.textContent = `已同步 ${d.count ?? 0} 条 → docs/knowledge/issues.md`;
    else alert(`已同步 ${d.count ?? 0} 条到知识库`);
  } catch (err) {
    if (msg) msg.textContent = err.message || "失败";
  }
}

let selectedLibraryShelfId = null;
let libraryShelvesCache = [];
let libraryDocsCache = [];
let libraryAllDocsMode = false;

const LIBRARY_PALETTE = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

const SHELF_ICONS = {
  "kb-global-index": "📋",
  "kb-apac-sop": "🇸🇬",
  "kb-apac-check": "✅",
  "kb-apac-ref": "📎",
  "kb-emea-sop": "🇪🇺",
  "kb-emea-check": "✅",
  "kb-emea-ref": "📎",
  "kb-amer": "🌎",
  "kb-global-sop": "🌐",
  "kb-global-check": "✅",
  "kb-global-ref": "📊",
  "kb-global-log": "📒",
  "sop-public": "📘",
  "ops-internal": "🔐",
  "amer-tools": "🌎",
  "team-blackboard": "📌",
  default: "📁",
};

function shelfVisual(shelf) {
  const id = shelf.id || "";
  const vis = String(shelf.visibility || "authenticated").toLowerCase();
  const icon = SHELF_ICONS[id] || (vis === "project" ? "🗂️" : SHELF_ICONS.default);
  const visLabel = { public: "公开", authenticated: "登录可见", restricted: "受限", project: "项目" }[vis] || vis;
  const idx = Math.abs(hashStr(id)) % LIBRARY_PALETTE.length;
  const color = LIBRARY_PALETTE[idx];
  return { icon, visLabel, color, visClass: `library-vis-${vis === "authenticated" ? "authenticated" : vis}` };
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return h;
}

function docTypeClass(ext) {
  const e = String(ext || "").toLowerCase().replace(/^\./, "");
  if (["online", "link", "url"].includes(e)) return "html";
  if (["md", "markdown"].includes(e)) return "md";
  if (e === "pdf") return "pdf";
  if (["html", "htm"].includes(e)) return "html";
  if (["csv", "xlsx", "xls"].includes(e)) return "csv";
  return "file";
}

function docTypeLabel(ext) {
  const c = docTypeClass(ext);
  const e = String(ext || "").toLowerCase().replace(/^\./, "");
  if (["online", "link", "url"].includes(e)) return "LINK";
  if (c === "md") return "MD";
  if (c === "pdf") return "PDF";
  if (c === "html") return "HTML";
  if (c === "csv") return "CSV";
  return "FILE";
}

function renderLibraryCharts(shelves) {
  const barBox = document.getElementById("libraryBarChart");
  const donut = document.getElementById("libraryDonutChart");
  const legend = document.getElementById("libraryDonutLegend");
  if (!barBox) return;

  const items = shelves.filter(s => (s.document_count ?? 0) > 0);
  const max = Math.max(1, ...items.map(s => s.document_count ?? 0));
  const total = shelves.reduce((n, s) => n + (s.document_count ?? 0), 0);

  if (!items.length) {
    barBox.innerHTML = "<p class='muted' style='font-size:12px;margin:0'>暂无文献 · 上传或同步后显示分布</p>";
    if (donut) { donut.style.background = "#f1f5f9"; donut.dataset.total = "0"; }
    if (legend) legend.innerHTML = "";
    return;
  }

  barBox.innerHTML = items.map(s => {
    const v = shelfVisual(s);
    const cnt = s.document_count ?? 0;
    const pct = Math.round((cnt / max) * 100);
    return `<div class="library-bar-row">
      <span class="library-bar-label" title="${esc(s.name)}">${esc(s.name)}</span>
      <div class="library-bar-track"><div class="library-bar-fill" style="width:${pct}%;background:${v.color}"></div></div>
      <span class="library-bar-count">${cnt}</span>
    </div>`;
  }).join("");

  if (donut && legend) {
    let acc = 0;
    const segs = items.map((s, i) => {
      const cnt = s.document_count ?? 0;
      const start = (acc / total) * 100;
      acc += cnt;
      const end = (acc / total) * 100;
      const color = shelfVisual(s).color;
      return `${color} ${start}% ${end}%`;
    });
    donut.style.background = `conic-gradient(${segs.join(", ")})`;
    donut.dataset.total = String(total);
    legend.innerHTML = items.slice(0, 6).map(s => {
      const v = shelfVisual(s);
      return `<li><span class="dot" style="background:${v.color}"></span>${esc(s.name)} · ${s.document_count ?? 0}</li>`;
    }).join("");
  }
}

function renderLibraryStats(shelves, opsCount, indexMeta) {
  const totalDocs = shelves.reduce((n, s) => n + (s.document_count ?? 0), 0);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("libStatDocs", totalDocs);
  set("libStatShelves", shelves.length);
  set("libStatOps", opsCount);
  if (indexMeta?.updated_at) {
    const d = indexMeta.updated_at.slice(0, 10);
    set("libStatIndex", d);
  } else {
    set("libStatIndex", "—");
  }
}

function renderLibraryShelfNav(shelves, filter = "") {
  const nav = document.getElementById("libraryShelvesNav");
  if (!nav) return;
  const q = filter.trim().toLowerCase();
  const list = q ? shelves.filter(s =>
    String(s.name || "").toLowerCase().includes(q) ||
    String(s.id || "").toLowerCase().includes(q) ||
    String(s.shelf_group || "").toLowerCase().includes(q)
  ) : shelves;

  if (!list.length) {
    nav.innerHTML = `<p class='muted' style='font-size:12px'>${shelves.length ? "无匹配书架" : "无可见书架 · 请填写操作人"}</p>`;
    return;
  }

  let lastGroup = "";
  const parts = [];
  list.forEach(s => {
    const grp = s.shelf_group || "其他";
    if (!q && grp !== lastGroup) {
      lastGroup = grp;
      parts.push(`<div class="library-shelf-group-label">${esc(grp)}</div>`);
    }
    const v = shelfVisual(s);
    const active = selectedLibraryShelfId === s.id ? " active" : "";
    parts.push(`<button type="button" class="library-shelf-card${active}" data-shelf="${esc(s.id)}">
      <span class="library-shelf-icon" style="background:${v.color}22;color:${v.color}">${v.icon}</span>
      <span class="library-shelf-card-body">
        <span class="shelf-name">${esc(s.name)}${s.locked ? " 🔒" : ""}</span>
        <span class="shelf-meta">
          <span class="library-vis-tag ${v.visClass}">${esc(v.visLabel)}</span>
          <span>${s.document_count ?? 0} 篇</span>
        </span>
      </span>
    </button>`);
  });
  nav.innerHTML = parts.join("");

  nav.querySelectorAll(".library-shelf-card").forEach(btn => {
    btn.onclick = () => {
      selectedLibraryShelfId = btn.dataset.shelf;
      loadKnowledge();
      loadLibraryShelfDetail(selectedLibraryShelfId);
    };
  });
}

function renderLibraryDocs(docs, filter = "", showShelf = false) {
  const q = filter.trim().toLowerCase();
  const list = q ? docs.filter(d =>
    String(d.title || "").toLowerCase().includes(q) ||
    String(d.path || "").toLowerCase().includes(q) ||
    String(d.shelf_name || "").toLowerCase().includes(q)
  ) : docs;

  if (!list.length) {
    return `<p class="muted">${docs.length ? "无匹配文献" : "暂无文献 · 点「重建索引」或「同步项目知识」"}</p>`;
  }

  return `<div class="library-docs-grid">${list.map(d => {
    const tc = docTypeClass(d.ext);
    const openUrl = d.open_url || d.download_url || fileUrl(d.path);
    const editBtn = d.edit_url
      ? `<a class="btn btn-sm" href="${esc(d.edit_url)}" target="_blank" rel="noopener">在线修改</a>`
      : "";
    return `<div class="library-doc-card">
      <div class="library-doc-card-top">
        <span class="library-doc-type ${tc}">${docTypeLabel(d.ext)}</span>
        <a href="${esc(openUrl)}" target="_blank" rel="noopener">${esc(d.title)}</a>
      </div>
      <span class="doc-meta">${showShelf && d.shelf_name ? esc(d.shelf_name) + " · " : ""}${esc(d.path || "")}</span>
      <span class="doc-meta">${esc(d.ext || "file")} · 更新 ${fmtDateTime(d.updated_at)}${d.provider ? ` · ${esc(d.provider)}` : ""}</span>
      ${editBtn}
    </div>`;
  }).join("")}</div>`;
}

async function loadLibraryAllDocsView() {
  const user = getCurrentUser();
  if (!user) {
    alert("请先在右上角选择操作人，才能查看权限内全部文献");
    return;
  }
  libraryAllDocsMode = true;
  selectedLibraryShelfId = null;
  document.querySelectorAll(".library-shelf-card").forEach(c => c.classList.remove("active"));
  const box = document.getElementById("libraryShelfDetail");
  const toolbar = document.getElementById("libraryDocToolbar");
  if (!box) return;
  box.innerHTML = "<p class='muted'>加载全部文献…</p>";
  try {
    const qs = `?user=${encodeURIComponent(user)}`;
    const data = await fetch(`${API}/api/library/documents-all${qs}`).then(r => r.json());
    if (!data.ok) throw new Error(data.detail || "加载失败");
    libraryDocsCache = data.documents || [];
    if (toolbar) toolbar.hidden = false;
    const docFilter = document.getElementById("libraryDocSearch")?.value || "";
    box.innerHTML = `
      <div class="library-shelf-head">
        <h3>📋 全部文献</h3>
        <p class="muted" style="font-size:12px;margin:0">共 ${libraryDocsCache.length} 篇 · 含项目 docs/projects · 书架索引 · 选操作人后按权限过滤</p>
      </div>
      <div id="libraryDocsMount">${renderLibraryDocs(libraryDocsCache, docFilter, true)}</div>`;
    const docSearch = document.getElementById("libraryDocSearch");
    if (docSearch && !docSearch.dataset.boundAll) {
      docSearch.dataset.boundAll = "1";
      docSearch.addEventListener("input", () => {
        const mount = document.getElementById("libraryDocsMount");
        if (mount && libraryAllDocsMode) {
          mount.innerHTML = renderLibraryDocs(libraryDocsCache, docSearch.value, true);
        }
      });
    }
  } catch (e) {
    box.innerHTML = `<p class="muted">${esc(e.message || "加载失败")}</p>`;
  }
}

let wecomAuthStatusCache = null;

function closeWecomAuthModal() {
  const modal = document.getElementById("wecomAuthModal");
  if (modal) modal.hidden = true;
}

function openWecomAuthModal() {
  const modal = document.getElementById("wecomAuthModal");
  const data = wecomAuthStatusCache;
  const msgEl = document.getElementById("wecomModalMsg");
  const agree = document.getElementById("wecomModalAgree");
  const btnConfirm = document.getElementById("btnWecomModalConfirm");
  if (!modal) return;

  if (!data?.can_consent) {
    alert(data?.message || "请先通过 iOA 入口打开并选择操作人");
    return;
  }

  const ioa = data.ioa_authenticated;
  const badge = document.getElementById("wecomModalIoaBadge");
  if (badge) {
    badge.className = "wecom-auth-badge " + (ioa ? "ok" : "warn");
    badge.textContent = ioa ? "iOA 已识别 ✓" : "未走 iOA";
  }
  const userEl = document.getElementById("wecomModalUser");
  if (userEl) userEl.textContent = data.display || data.user || "—";
  const srcEl = document.getElementById("wecomModalSource");
  if (srcEl) {
    srcEl.textContent = data.identity_source === "smartgate" ? "Smartgate / iOA" : (data.identity_source || "—");
  }
  const folder = document.getElementById("wecomModalFolderHint");
  const inlineFolder = document.getElementById("wecomFolderHint");
  if (folder) {
    folder.value = inlineFolder?.value || data.consent?.folder_hint || "";
  }
  if (agree) agree.checked = false;
  if (btnConfirm) btnConfirm.disabled = true;
  if (msgEl) {
    msgEl.textContent = ioa
      ? "身份验证通过后可确认授权。"
      : "建议通过 iOA Preview 正式入口打开；本地开发可设 ALLOW_PICKER_WECOM_CONSENT=1。";
  }
  modal.hidden = false;
}

async function loadWecomDocsAuth() {
  const user = getCurrentUser();
  const qs = user ? `?user=${encodeURIComponent(user)}` : "";
  const statusEl = document.getElementById("wecomAuthStatus");
  const badgeEl = document.getElementById("wecomAuthBadge");
  const idEl = document.getElementById("wecomAuthIdentity");
  const btnConsent = document.getElementById("btnWecomDocsConsent");
  const btnRevoke = document.getElementById("btnWecomDocsRevoke");
  const folder = document.getElementById("wecomFolderHint");
  if (!statusEl) return;
  try {
    const data = await fetch(`${API}/api/wecom/docs/auth/status${qs}`).then(r => r.json());
    wecomAuthStatusCache = data;
    const ioa = data.ioa_authenticated;
    const consent = data.consent;
    const consented = consent?.consented_at && !consent?.revoked_at;

    if (badgeEl) {
      badgeEl.className = "wecom-auth-badge " + (ioa ? "ok" : "warn");
      badgeEl.textContent = ioa ? "iOA 已识别" : "未走 iOA（Preview 请用正式入口）";
    }
    if (idEl) {
      const who = data.display || data.user || "未选择操作人";
      const src = data.identity_source === "smartgate" ? "Smartgate / iOA" : data.identity_source || "—";
      idEl.innerHTML = `<strong>${esc(who)}</strong> · 身份来源：${esc(src)}${data.login_id ? ` · ${esc(data.login_id)}` : ""}`;
    }
    if (folder && consent?.folder_hint && !folder.value) folder.value = consent.folder_hint;
    if (btnConsent) {
      btnConsent.disabled = !data.can_consent || consented;
      btnConsent.textContent = consented ? "已授权" : "打开授权验证";
    }
    if (btnRevoke) {
      btnRevoke.hidden = !consented;
      btnRevoke.disabled = !consented;
    }
    const btnSync = document.getElementById("btnWecomDocsSync");
    if (btnSync) {
      btnSync.hidden = !consented;
      btnSync.disabled = !consented;
    }
    let msg = data.message || "";
    if (consent?.last_sync_at) {
      msg += ` · 上次同步 ${consent.last_sync_at}`;
      if (consent.last_sync_status?.linked_count != null) {
        msg += `（${consent.last_sync_status.linked_count} 篇）`;
      }
    }
    if (consented && consent.consented_at) {
      msg += ` · 授权时间 ${esc(consent.consented_at)}`;
    }
    if (data.corp_api_ready) msg += " · 企业 API 已配置，可发起同步任务";
    else if (consented) msg += " · 待 IT 配置 WECOM_DOCS_CORP_SECRET";
    statusEl.textContent = msg;

    if (
      !consented && data.can_consent && user
      && !sessionStorage.getItem("wecom_auth_modal_dismissed")
    ) {
      setTimeout(() => openWecomAuthModal(), 400);
    }
  } catch (e) {
    statusEl.textContent = "授权状态加载失败：" + (e.message || e);
  }
}

function initWecomDocsAuthActions() {
  const btnConsent = document.getElementById("btnWecomDocsConsent");
  const btnRevoke = document.getElementById("btnWecomDocsRevoke");
  const modal = document.getElementById("wecomAuthModal");
  const btnCancel = document.getElementById("btnWecomModalCancel");
  const btnConfirm = document.getElementById("btnWecomModalConfirm");
  const agree = document.getElementById("wecomModalAgree");

  if (btnConsent && !btnConsent.dataset.bound) {
    btnConsent.dataset.bound = "1";
    btnConsent.addEventListener("click", () => openWecomAuthModal());
  }

  if (agree && btnConfirm && !agree.dataset.bound) {
    agree.dataset.bound = "1";
    agree.addEventListener("change", () => {
      btnConfirm.disabled = !agree.checked;
    });
  }

  if (btnCancel && !btnCancel.dataset.bound) {
    btnCancel.dataset.bound = "1";
    btnCancel.addEventListener("click", () => {
      sessionStorage.setItem("wecom_auth_modal_dismissed", "1");
      closeWecomAuthModal();
    });
  }

  if (modal && !modal.dataset.bound) {
    modal.dataset.bound = "1";
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        sessionStorage.setItem("wecom_auth_modal_dismissed", "1");
        closeWecomAuthModal();
      }
    });
  }

  if (btnConfirm && !btnConfirm.dataset.bound) {
    btnConfirm.dataset.bound = "1";
    btnConfirm.addEventListener("click", async () => {
      const user = getCurrentUser();
      if (!user) { alert("请先选择操作人"); return; }
      if (!document.getElementById("wecomModalAgree")?.checked) {
        alert("请先勾选授权确认");
        return;
      }
      const fd = new FormData();
      fd.append("user", user);
      fd.append("scopes", "read_doc_list,read_doc_content,index_for_qa");
      const hint = document.getElementById("wecomModalFolderHint")?.value
        || document.getElementById("wecomFolderHint")?.value || "";
      fd.append("folder_hint", hint);
      const msgEl = document.getElementById("wecomModalMsg");
      btnConfirm.disabled = true;
      if (msgEl) msgEl.textContent = "正在提交授权…";
      try {
        const res = await fetch(`${API}/api/wecom/docs/auth/consent`, { method: "POST", body: fd });
        const d = await res.json();
        if (!res.ok) throw new Error(d.detail || d.error || "授权失败");
        if (msgEl) msgEl.textContent = "✓ 授权成功，可关闭弹窗并点击「立即同步文档」";
        sessionStorage.removeItem("wecom_auth_modal_dismissed");
        await loadWecomDocsAuth();
        setTimeout(() => closeWecomAuthModal(), 800);
      } catch (e) {
        if (msgEl) msgEl.textContent = "授权失败：" + (e.message || e);
        btnConfirm.disabled = !document.getElementById("wecomModalAgree")?.checked;
      }
    });
  }

  if (btnRevoke && !btnRevoke.dataset.bound) {
    btnRevoke.dataset.bound = "1";
    btnRevoke.addEventListener("click", async () => {
      if (!confirm("确定撤销企业微信文档同步授权？")) return;
      const user = getCurrentUser();
      const fd = new FormData();
      if (user) fd.append("user", user);
      const res = await fetch(`${API}/api/wecom/docs/auth/revoke`, { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { alert(d.detail || "撤销失败"); return; }
      await loadWecomDocsAuth();
    });
  }
  const btnSync = document.getElementById("btnWecomDocsSync");
  if (btnSync && !btnSync.dataset.bound) {
    btnSync.dataset.bound = "1";
    btnSync.addEventListener("click", async () => {
      const user = getCurrentUser();
      if (!user) { alert("请先选择操作人"); return; }
      const qs = user ? `?user=${encodeURIComponent(user)}` : "";
      btnSync.disabled = true;
      const statusEl = document.getElementById("wecomAuthStatus");
      if (statusEl) statusEl.textContent = "同步执行中…";
      try {
        const res = await fetch(`${API}/api/wecom/docs/sync${qs}`, { method: "POST" });
        const d = await res.json();
        if (!res.ok) throw new Error(d.detail || d.error || "同步失败");
        if (statusEl) statusEl.textContent = d.message || "同步完成";
        await loadWecomDocsAuth();
        await loadKnowledge();
      } catch (e) {
        alert(e.message || String(e));
        await loadWecomDocsAuth();
      } finally {
        btnSync.disabled = false;
      }
    });
  }
}

async function loadKnowledge() {
  const user = getCurrentUser();
  const qs = user ? `?user=${encodeURIComponent(user)}` : "";
  const [libData, knowData, idxSt] = await Promise.all([
    fetch(`${API}/api/library/shelves${qs}`).then(r => r.json()).catch(() => ({ shelves: [] })),
    fetch(`${API}/api/knowledge${qs}`).then(r => r.json()),
    fetch(`${API}/api/library/index-status`).then(r => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  const shelves = libData.shelves || [];
  libraryShelvesCache = shelves;

  const shelfFilter = document.getElementById("libraryShelfSearch")?.value || "";
  renderLibraryShelfNav(shelves, shelfFilter);
  renderLibraryCharts(shelves);

  const opsItems = knowData.items || [];
  renderLibraryStats(shelves, opsItems.length, idxSt);

  if (!selectedLibraryShelfId && shelves.length) {
    selectedLibraryShelfId = shelves[0].id;
  } else if (selectedLibraryShelfId && !shelves.find(s => s.id === selectedLibraryShelfId)) {
    selectedLibraryShelfId = shelves[0]?.id || null;
  }
  libraryAllDocsMode = false;
  if (selectedLibraryShelfId) {
    loadLibraryShelfDetail(selectedLibraryShelfId);
  } else {
    const box = document.getElementById("libraryShelfDetail");
    if (box) {
      box.innerHTML = `<div class="library-empty-state"><div class="library-empty-icon">📚</div><p>填写操作人后选择书架</p></div>`;
    }
    const toolbar = document.getElementById("libraryDocToolbar");
    if (toolbar) toolbar.hidden = true;
  }

  const opsBox = document.getElementById("opsList");
  const wfBanner = document.getElementById("libraryWorkflowBanner");
  const workflow = (knowData.sop_links || []).find(l =>
    String(l.title || "").includes("福利并薪运营梳理") || String(l.path || "").includes("ops-internal/海外HRSSC")
  );
  if (wfBanner) {
    if (workflow && workflow.status === "indexed") {
      const xlsx = workflow.path || "";
      const md = workflow.md_path || "";
      const u = getCurrentUser();
      const uqs = u ? `&user=${encodeURIComponent(u)}` : "";
      const fileHref = (p) => p ? `${API}/api/files?path=${encodeURIComponent(p)}${uqs}` : "";
      wfBanner.hidden = false;
      wfBanner.innerHTML = `
        <div class="library-workflow-inner">
          <div>
            <strong>2026 福利&并薪运营工作流</strong>
            <p class="muted" style="margin:4px 0 0;font-size:12px">${esc(workflow.note || "承接清单 · 人力 · KPI · 分工")}</p>
          </div>
          <div class="library-workflow-actions">
            ${xlsx ? `<a class="btn btn-sm" href="${esc(fileHref(xlsx))}" download target="_blank" rel="noopener">下载 Excel</a>` : ""}
            ${md ? `<a class="btn btn-sm" href="${esc(fileHref(md))}" target="_blank" rel="noopener">查看 MD</a>` : ""}
            <button type="button" class="btn btn-sm btn-primary" id="btnOpenOpsShelf">打开运营内部书架</button>
            <a class="btn btn-sm" href="qa.html">问工作流</a>
          </div>
        </div>`;
      document.getElementById("btnOpenOpsShelf")?.addEventListener("click", () => {
        selectedLibraryShelfId = "ops-internal";
        libraryAllDocsMode = false;
        renderLibraryShelfNav(libraryShelvesCache, document.getElementById("libraryShelfSearch")?.value || "");
        loadLibraryShelfDetail("ops-internal");
        document.getElementById("libraryShelfDetail")?.scrollIntoView({ behavior: "smooth" });
      });
    } else {
      wfBanner.hidden = true;
      wfBanner.innerHTML = "";
    }
  }
  if (opsBox) {
    opsBox.innerHTML = opsItems.length
      ? opsItems.map(o => `<div class="library-ops-item"><span class="library-ops-no">${o.no}</span><span>${esc(o.name)}</span></div>`).join("")
      : "<p class='muted' style='font-size:12px;grid-column:1/-1'>—</p>";
  }

  const projKb = knowData.project_knowledge?.entries || [];
  const syncedAt = knowData.project_knowledge?.synced_at || knowData.project_knowledge_synced_at || "—";
  const statusEl = document.getElementById("knowledgeSyncStatus");
  if (statusEl) {
    statusEl.textContent = projKb.length
      ? `项目知识已同步 · ${syncedAt} · 索引 ${idxSt?.document_count ?? "—"} 篇`
      : `尚未同步项目知识 · 索引 ${idxSt?.document_count ?? "—"} 篇`;
  }
  refreshTabAgentLive("knowledge");
  initWecomDocsAuthActions();
  await loadWecomDocsAuth();
}

async function loadLibraryShelfDetail(shelfId) {
  const user = getCurrentUser();
  const qs = user ? `?user=${encodeURIComponent(user)}` : "";
  const box = document.getElementById("libraryShelfDetail");
  const toolbar = document.getElementById("libraryDocToolbar");
  if (!box || !shelfId) return;
  try {
    const data = await fetch(`${API}/api/library/shelves/${encodeURIComponent(shelfId)}${qs}`).then(r => r.json());
    if (!data.ok) throw new Error(data.detail || "加载失败");
    const s = data.shelf || {};
    const docs = data.documents || [];
    libraryDocsCache = docs;
    const v = shelfVisual(s);
    const canUp = s.can_manage && !s.virtual;
    const docFilter = document.getElementById("libraryDocSearch")?.value || "";

    if (toolbar) toolbar.hidden = false;

    box.innerHTML = `
      <div class="library-shelf-head">
        <h3>
          <span class="library-shelf-head-icon" style="background:${v.color}22">${v.icon}</span>
          ${esc(s.name)}
        </h3>
        <p class="muted" style="font-size:12px;margin:0;line-height:1.5">${esc(s.description || "")}</p>
        <div class="library-shelf-meta-row">
          <span class="library-vis-tag ${v.visClass}">${esc(v.visLabel)}</span>
          <span>${docs.length} 篇文献</span>
          <span>管理员：${esc((s.librarians || []).join("、") || "—")}</span>
        </div>
      </div>
      <div id="libraryDocsMount">${renderLibraryDocs(docs, docFilter)}</div>
      ${canUp ? `<form class="library-upload-form" data-shelf="${esc(shelfId)}">
        <input type="file" name="file" required />
        <button type="submit" class="btn btn-primary btn-sm">上传并关联在线文档</button>
        <span class="muted library-upload-msg"></span>
      </form>` : ""}`;

    const docSearch = document.getElementById("libraryDocSearch");
    if (docSearch && !docSearch.dataset.bound) {
      docSearch.dataset.bound = "1";
      docSearch.addEventListener("input", () => {
        const mount = document.getElementById("libraryDocsMount");
        if (mount) mount.innerHTML = renderLibraryDocs(libraryDocsCache, docSearch.value);
      });
    }

    box.querySelectorAll(".library-upload-form").forEach(form => {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const editor = requireCurrentUser();
        if (!editor) return;
        const fd = new FormData(form);
        fd.set("editor", editor);
        const msg = form.querySelector(".library-upload-msg");
        if (msg) msg.textContent = "上传中…";
        try {
          const res = await fetch(`${API}/api/library/shelves/${encodeURIComponent(shelfId)}/upload`, { method: "POST", body: fd });
          const d = await res.json();
          if (!res.ok) throw new Error(d.detail || "失败");
          if (msg) {
            const openUrl = d.document?.open_url;
            msg.innerHTML = openUrl
              ? `已上传并关联在线文档 · <a href="${esc(openUrl)}" target="_blank" rel="noopener">打开</a>`
              : "已上传并关联在线文档";
          }
          loadKnowledge();
        } catch (err) {
          if (msg) msg.textContent = err.message || "失败";
        }
      };
    });
  } catch (e) {
    box.innerHTML = `<p class="muted">${esc(e.message || "无法加载书架")}</p>`;
    if (toolbar) toolbar.hidden = true;
  }
}

async function loadMeetings() {
  await loadUserPermissions();
  applyNavPermissions();
  await loadRegistry();
  const listEl = document.getElementById("meetingList");
  const countEl = document.getElementById("meetingListCount");
  try {
    const params = currentUserQueryParams(new URLSearchParams());
    const qs = params.toString() ? `?${params}` : "";
    const data = await fetch(`${API}/api/meetings${qs}`).then(r => r.json());
    meetingsCache = data.items || [];
    if (countEl) countEl.textContent = `${meetingsCache.length} 场`;
    if (!meetingsCache.length) {
      if (listEl) listEl.innerHTML = "<p class='muted' style='padding:12px'>暂无 · 放 JSON 到 bot-gateway/data/meetings/</p>";
      document.getElementById("meetingDetail").innerHTML = "<div class='panel muted' style='padding:24px'>暂无会议数据</div>";
      return;
    }
    const sel = selectedMeetingId && meetingsCache.some(m => m.id === selectedMeetingId)
      ? selectedMeetingId : meetingsCache[0].id;
    if (listEl) {
      listEl.innerHTML = meetingsCache.map(m => renderMeetingListItem(m, m.id === sel)).join("");
      listEl.querySelectorAll(".meeting-list-item").forEach(btn => {
        btn.onclick = () => renderMeetingDetail(btn.dataset.mid);
      });
    }
    await renderMeetingDetail(sel);
    seedPageAgentPanel("meetings", "会议");
    bindPageAiButtons(document.getElementById("view-meetings") || document);
    refreshTabAgentLive("meetings");
  } catch (e) {
    if (listEl) listEl.innerHTML = `<p class='muted' style='padding:12px'>${esc(e.message || "加载失败")}</p>`;
  }
}

let meetingsCache = [];
let selectedMeetingId = null;

function countOpenMeetingTodos(m) {
  return (m?.action_items || []).filter(a => a.status === "open").length;
}

function renderMeetingListItem(m, active) {
  const open = countOpenMeetingTodos(m);
  const projN = (m.project_ids || []).length;
  return `<button type="button" class="meeting-list-item${active ? " active" : ""}" data-mid="${esc(m.id)}">
    <span class="meeting-list-date">${esc(String(m.started_at || "").slice(0, 10))}</span>
    <strong class="meeting-list-title">${esc(m.title)}</strong>
    <span class="meeting-list-meta">${open} 待办 · ${projN} 项目</span>
  </button>`;
}

function meetingTodoBadge(ai) {
  if (ai.status === "escalated") return `<span class="todo-badge done">已升 Issue</span>`;
  if (ai.status !== "open") return `<span class="todo-badge done">已完成</span>`;
  const due = String(ai.due || "");
  const today = new Date().toISOString().slice(0, 10);
  if (due && due < today) return `<span class="todo-badge overdue">逾期 ${esc(due)}</span>`;
  if (due) return `<span class="todo-badge due">截止 ${esc(due)}</span>`;
  return `<span class="todo-badge open">开放</span>`;
}

async function pushMeetingTeamBlackboard(meetingId) {
  const editor = requireCurrentUser();
  if (!editor) return;
  const msg = document.getElementById("meetingPushMsg");
  if (msg) msg.textContent = "推团队小黑板…";
  try {
    const res = await fetch(`${API}/api/meetings/${encodeURIComponent(meetingId)}/push-team-blackboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "推送失败");
    if (msg) msg.textContent = "已推团队小黑板 · 首页可点「收到」";
  } catch (e) {
    if (msg) msg.textContent = e.message || "失败";
  }
}

async function parseMeetingTodos(meetingId) {
  const msg = document.getElementById("meetingPushMsg");
  if (msg) msg.textContent = "解析待办…";
  try {
    const res = await fetch(`${API}/api/meetings/${encodeURIComponent(meetingId)}/parse-todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "解析失败");
    if (msg) msg.textContent = `已解析 ${d.action_items_count ?? 0} 条待办`;
    await renderMeetingDetail(meetingId);
    return d;
  } catch (e) {
    if (msg) msg.textContent = e.message || "失败";
    throw e;
  }
}

async function pushMeetingBlackboard(meetingId) {
  const editor = requireCurrentUser();
  if (!editor) return;
  const msg = document.getElementById("meetingPushMsg");
  if (msg) msg.textContent = "推送中…";
  try {
    const res = await fetch(`${API}/api/meetings/${encodeURIComponent(meetingId)}/push-blackboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editor }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.detail || "推送失败");
    if (msg) msg.textContent = `${d.message || "已推送"} · 可在项目看板查看小黑板`;
    const liveEl = document.getElementById("agentLive-meetings");
    if (liveEl) {
      liveEl.innerHTML = `<div class="live-label">会议 → 项目小黑板</div><pre>${esc(d.message || "已推送")}\n${(d.results || []).map(r => `- ${r.project_id}: ${r.ok ? "OK" : r.error || "失败"}`).join("\n")}</pre>`;
    }
  } catch (e) {
    if (msg) msg.textContent = e.message || "失败";
  }
}

async function renderMeetingDetail(meetingId) {
  const box = document.getElementById("meetingDetail");
  if (!box) return;
  selectedMeetingId = meetingId;
  box.innerHTML = `<div class="panel muted" style="padding:24px">加载中…</div>`;
  try {
    const params = currentUserQueryParams(new URLSearchParams());
    const qs = params.toString() ? `?${params}` : "";
    const data = await fetch(`${API}/api/meetings/${encodeURIComponent(meetingId)}${qs}`).then(async r => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || "加载失败");
      return j;
    });
    const m = data.meeting;
    const projects = data.linked_projects || [];
    const openTodos = (m.action_items || []).filter(a => a.status === "open");
    const projectChips = projects.length
      ? projects.map(p =>
          `<button type="button" class="meeting-proj-chip" data-pid="${esc(p.id)}">${esc(p.name)} · ${p.progress ?? 0}%</button>`
        ).join("")
      : `<span class="muted">未关联项目 · 编辑 meetings JSON 的 project_ids</span>`;
    const canPush = (m.project_ids || []).length > 0;
    box.innerHTML = `
      <div class="panel meeting-detail-panel">
        <div class="meeting-detail-head">
          <div>
            <h3 style="margin:0 0 6px">${esc(m.title)}</h3>
            <span class="muted">${esc(m.started_at || "")}</span>
            ${(m.tags || []).map(t => `<span class="meeting-tag">${esc(t)}</span>`).join("")}
          </div>
        </div>
        <p class="meeting-summary">${esc(m.summary || "")}</p>
        <div class="meeting-detail-actions">
          ${canPush ? `<button type="button" class="btn btn-primary" id="btnPushMeetingBb">推项目小黑板（${(m.project_ids || []).length} 项）</button>` : `<span class="muted">无 project_ids · 无法推项目板</span>`}
          <button type="button" class="btn" id="btnPushMeetingTeam">推团队小黑板</button>
          <button type="button" class="btn" id="btnParseMeetingTodos">一键解析待办</button>
          ${canPush ? `<button type="button" class="btn" id="btnPushMeetingBoth">解析 + 双推送</button>` : ""}
          <button type="button" class="btn" data-page-ai="meetings" data-agent-q="${esc(`会议「${m.title}」有哪些开放待办？关联哪些项目？`)}">AI 解答</button>
          <button type="button" class="btn" data-page-knot="meetings" data-agent-q="${esc(`${m.title} 待办和决策`)}">在 Knot 问</button>
        </div>
        <span class="muted" id="meetingPushMsg" style="font-size:12px"></span>
        <p class="section-title">关联项目</p>
        <div class="meeting-proj-chips">${projectChips}</div>
        <p class="section-title">待办 · 开放 ${openTodos.length} / ${(m.action_items || []).length}</p>
        <ul class="meeting-todo-list">${(m.action_items || []).map((ai, idx) => `
          <li class="meeting-todo-item">
            ${meetingTodoBadge(ai)}
            <span>${esc(ai.text)}</span>
            <span class="muted"> · ${esc(ai.owner || "—")}</span>
            ${ai.issue_id ? `<span class="muted"> → Issue ${esc(ai.issue_id)}</span>` : `<button type="button" class="btn btn-sm meeting-escalate-btn" data-idx="${idx}">升级为 Issue</button>`}
          </li>`).join("") || "<li class='muted'>无</li>"}</ul>
        ${(m.key_decisions || []).length ? `<p class="section-title">关键决策</p><ul class="meeting-bullets">${m.key_decisions.map(d => `<li>${esc(typeof d === "string" ? d : d.text || JSON.stringify(d))}</li>`).join("")}</ul>` : ""}
        ${(m.risks || []).length ? `<p class="section-title">风险</p><ul class="meeting-risks">${m.risks.map(r => `<li class="risk-${esc(r.severity || "medium")}">${esc(r.text || r)} <span class="muted">(${esc(r.severity || "—")})</span></li>`).join("")}</ul>` : ""}
        <p class="muted meeting-id-hint">ID: <code>${esc(m.id)}</code></p>
      </div>`;
    bindPageAiButtons(box);
    document.getElementById("btnPushMeetingBb")?.addEventListener("click", () => pushMeetingBlackboard(m.id));
    document.getElementById("btnPushMeetingTeam")?.addEventListener("click", () => pushMeetingTeamBlackboard(m.id));
    document.getElementById("btnParseMeetingTodos")?.addEventListener("click", () => parseMeetingTodos(m.id));
    document.getElementById("btnPushMeetingBoth")?.addEventListener("click", async () => {
      await parseMeetingTodos(m.id);
      await pushMeetingBlackboard(m.id);
      await pushMeetingTeamBlackboard(m.id);
    });
    box.querySelectorAll(".meeting-proj-chip").forEach(btn => {
      btn.onclick = () => { switchView("projects"); openProjectDetail(btn.dataset.pid); };
    });
    box.querySelectorAll(".meeting-escalate-btn").forEach(btn => {
      btn.onclick = async () => {
        const editor = requireCurrentUser();
        if (!editor) return;
        const todoIndex = Number(btn.dataset.idx);
        const msg = document.getElementById("meetingPushMsg");
        if (msg) msg.textContent = "升级为 Issue…";
        try {
          const res = await fetch(`${API}/api/meetings/${encodeURIComponent(m.id)}/escalate-issue`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ editor, todo_index: todoIndex }),
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.detail || "升级失败");
          if (msg) msg.textContent = `已升级 Issue：${d.issue?.id || ""}`;
          await renderMeetingDetail(m.id);
        } catch (err) {
          if (msg) msg.textContent = err.message || "失败";
        }
      };
    });
    document.querySelectorAll(".meeting-list-item").forEach(el => {
      el.classList.toggle("active", el.dataset.mid === meetingId);
    });
  } catch (e) {
    box.innerHTML = `<div class="panel muted" style="padding:24px">${esc(e.message || "加载失败")}</div>`;
  }
}

function setOnline() {
  const chip = document.getElementById("healthChip");
  fetchGatewayHealth().then(probe => {
    if (!chip) return;
    if (probe.ok) {
      const v = probe.health?.api_version ?? "?";
      const c = (probe.health?.git_commit || "").slice(0, 8);
      chip.textContent = `在线 v${v}${c ? " · " + c : ""}`;
      chip.title = `Gateway API: ${probe.api}`;
      chip.className = "status ok";
    } else {
      chip.textContent = "Gateway 未连接";
      chip.title = `${probe.api} · ${probe.error}`;
      chip.className = "status err";
    }
  });
  document.getElementById("offlineBanner")?.remove();
}

function setOffline() {
  const chip = document.getElementById("healthChip");
  chip.textContent = "离线";
  chip.className = "status err";
  if (!document.getElementById("offlineBanner")) {
    const b = document.createElement("div");
    b.id = "offlineBanner";
    b.className = "offline-banner";
    b.innerHTML = `无法连接 <code>${esc(API)}</code>。双击 <strong>一键启动.command</strong> 后刷新。`;
    document.querySelector("main")?.prepend(b);
  }
}

function appendChatMsg(role, text, route) {
  const box = document.getElementById("chatMsgs");
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  div.innerHTML = route ? `<div class="route">→ ${esc(route)}</div>${esc(text)}` : esc(text);
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function setupChatChips(reg) {
  const chips = document.getElementById("chatChips");
  const items = [
    { label: "主菜单", text: "主菜单" },
    ...(reg.orchestrator?.test_phrases || []).map(t => ({ label: t, text: t })),
    ...(reg.agents || []).flatMap(a => (a.test_phrases || []).slice(0, 1).map(t => ({ label: t, text: t, agent: a.id }))),
  ];
  chips.innerHTML = items.slice(0, 10).map(c =>
    `<button type="button" class="chat-chip" data-text="${esc(c.text)}" data-agent="${esc(c.agent || "")}">${esc(c.label)}</button>`
  ).join("");
  chips.querySelectorAll(".chat-chip").forEach(btn => {
    btn.onclick = () => sendChat(btn.dataset.text, btn.dataset.agent || null);
  });
}

async function sendChat(text, agentId) {
  if (!text?.trim()) return;
  appendChatMsg("user", text);
  document.getElementById("chatInput").value = "";
  try {
    const d = await orchestrate(text, agentId || undefined);
    appendChatMsg("bot", d.message || "（无回复）", d.agent);
    if (d.agent) showAgentLive(d.agent, d.message, getAgentById(d.agent)?.web_tab);
  } catch (e) {
    appendChatMsg("bot", "请求失败，请确认 Gateway 已启动。");
  }
}

function openChat() {
  document.getElementById("chatDock").classList.add("open");
  document.getElementById("chatFab").classList.add("hidden");
}

function closeChat() {
  document.getElementById("chatDock").classList.remove("open");
  document.getElementById("chatFab").classList.remove("hidden");
}

async function runLeaveDemo() {
  const out = document.getElementById("toolLeaveResult");
  out.textContent = "运行中…";
  const d = await invokeAgent("leave", "US假期演示");
  out.textContent = d.message || JSON.stringify(d, null, 2);
}

document.addEventListener("DOMContentLoaded", async () => {
  await initSessionIdentity();
  applyNavPermissions();
  document.getElementById("currentUser")?.addEventListener("change", async () => {
    sessionIdentity = null;
    setCurrentUser(getCurrentUser());
    await loadUserPermissions();
    await loadEmployeeProfile();
    applyNavPermissions();
    applyMeetingEntryPermissions();
    const v = document.querySelector("#subRail .console-tab.active[data-view], .nav-sub-item.active[data-view], .nav-top.active[data-view]")?.dataset.view || viewFromHash();
    switchView(v);
  });

  initNavAccordion();
  initHomeKpiTabs();
  initHomeLaneTabs();
  switchHomeKpiTab(homeKpiTab);
  switchHomeLaneTab(homeLaneTab);
  window.addEventListener("hashchange", () => switchView(viewFromHash()));
  switchView(viewFromHash());

  fetch(`${API}/api/meta`).then(r => r.json()).then(meta => {
    applyPortalLinks(meta, null);
    if (typeof window.initRegionalTools === "function") window.initRegionalTools(meta);
  }).catch(() => {});
  document.getElementById("btnMorningBrief")?.addEventListener("click", runMorningBrief);
  document.getElementById("btnRefresh")?.addEventListener("click", () =>
    switchView(document.querySelector(".nav-sub-item.active[data-view], .nav-top.active[data-view]")?.dataset.view || viewFromHash()));
  document.getElementById("issueFilterCountry")?.addEventListener("change", loadIssues);
  document.getElementById("issueFilterStatus")?.addEventListener("change", loadIssues);
  document.getElementById("btnIssueNew")?.addEventListener("click", openIssueNewModal);
  document.getElementById("btnIssueSyncKb")?.addEventListener("click", syncIssuesKnowledge);
  document.getElementById("issueNewClose")?.addEventListener("click", closeIssueDrawer);
  document.getElementById("issueNewBackdrop")?.addEventListener("click", closeIssueDrawer);
  document.getElementById("issueDrawerClose")?.addEventListener("click", closeIssueDrawer);
  document.getElementById("issueDrawerBackdrop")?.addEventListener("click", closeIssueDrawer);
  document.getElementById("issueEditForm")?.addEventListener("submit", saveIssueFromDrawer);
  document.getElementById("issueNewForm")?.addEventListener("submit", createIssueFromForm);
  document.getElementById("btnIssuePushBb")?.addEventListener("click", () => {
    const id = document.getElementById("issueEditId")?.value;
    if (id) pushIssueBlackboard(id);
  });
  document.getElementById("btnIssueSyncProj")?.addEventListener("click", () => {
    const id = document.getElementById("issueEditId")?.value;
    if (id) syncIssueProjects(id);
  });
  document.getElementById("btnIssueClose")?.addEventListener("click", async () => {
    document.getElementById("issueEditStatus").value = "closed";
    await saveIssueFromDrawer(new Event("submit"));
  });
  document.getElementById("issueImportForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editor = requireCurrentUser();
    if (!editor) return;
    const file = document.getElementById("issueImportFile")?.files?.[0];
    const msg = document.getElementById("issueImportMsg");
    if (!file) { alert("请选择 CSV 文件"); return; }
    const fd = new FormData();
    fd.append("editor", editor);
    fd.append("file", file);
    if (document.getElementById("issueImportPushBb")?.checked) {
      fd.append("push_blackboard", "true");
    }
    if (msg) msg.textContent = "导入中…";
    try {
      const res = await fetch(`${API}/api/issues/import`, { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || d.message || "导入失败");
      let txt = d.message || `成功 ${d.created || 0} 条`;
      if (d.blackboard_pushed) txt += ` · 小黑板 ${d.blackboard_pushed} 条`;
      if (msg) msg.textContent = txt;
      if (d.blackboard_pushed) {
        const bb = await fetch(`${API}/api/team-blackboard`).then(r => r.json()).catch(() => null);
        if (bb?.messages) renderTeamBlackboard(bb.messages);
      }
      await loadIssues();
    } catch (err) {
      if (msg) msg.textContent = err.message || "失败";
    }
  });
  document.getElementById("btnLeaveDemo")?.addEventListener("click", runLeaveDemo);
  document.getElementById("btnPushAllAlerts")?.addEventListener("click", (e) => {
    pushMonitorAlerts(null, false, e.currentTarget);
  });
  document.getElementById("teamBlackboardForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    postTeamBlackboard(document.getElementById("teamBlackboardInput")?.value || "");
  });
  bindVvDemoForms();
  updateTopbarDate();
  document.getElementById("btnBackProjects")?.addEventListener("click", () => {
    showProjectsList();
    document.getElementById("pageTitle").textContent = TITLES.projects;
    loadProjectsView();
  });
  document.getElementById("btnProjectAgentRun")?.addEventListener("click", () => invokeAgent("project", "项目进展"));
  document.getElementById("btnSyncKnowledge")?.addEventListener("click", function () { syncProjectKnowledge(this); });
  document.getElementById("accessRequestForm")?.addEventListener("submit", submitAccessRequest);
  document.getElementById("adminAuditFilter")?.addEventListener("change", loadAdminAudit);
  bindPageAiButtons(document);
  document.getElementById("btnKnowledgeSync")?.addEventListener("click", async function () {
    const status = document.getElementById("knowledgeSyncStatus");
    await syncProjectKnowledge(this, status);
    loadKnowledge();
  });
  document.getElementById("btnLibraryReindex")?.addEventListener("click", async function () {
    const user = requireCurrentUser();
    if (!user) return;
    const status = document.getElementById("knowledgeSyncStatus");
    if (status) status.textContent = "重建索引…";
    try {
      const res = await fetch(`${API}/api/library/reindex?user=${encodeURIComponent(user)}`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "失败");
      if (status) status.textContent = `索引 ${d.count ?? 0} 篇`;
      loadKnowledge();
    } catch (e) {
      if (status) status.textContent = e.message || "失败";
    }
  });
  document.getElementById("libraryShelfSearch")?.addEventListener("input", (e) => {
    renderLibraryShelfNav(libraryShelvesCache, e.target.value);
  });
  document.getElementById("btnLibraryAllDocs")?.addEventListener("click", loadLibraryAllDocsView);
  document.getElementById("btnIssuesToHome")?.addEventListener("click", () => {
    location.hash = "home";
    switchView("home");
    document.querySelector(".alert-monitor-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("meetingUploadForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editor = requireCurrentUser();
    if (!editor) return;
    const input = document.getElementById("meetingUploadFile");
    const paste = document.getElementById("meetingPasteText");
    const msg = document.getElementById("meetingUploadMsg");
    const file = input?.files?.[0];
    const text = (paste?.value || "").trim();
    if (!file && !text) {
      alert("请选择文件或粘贴纪要正文");
      return;
    }
    const fd = new FormData();
    fd.append("editor", editor);
    fd.append("project_ids", document.getElementById("meetingUploadProjects")?.value || "");
    fd.append("auto_push_project", document.getElementById("meetingAutoPushProject")?.checked ? "true" : "false");
    fd.append("auto_push_team", document.getElementById("meetingAutoPushTeam")?.checked ? "true" : "false");
    if (file) {
      fd.append("file", file);
    } else {
      const blob = new Blob([text], { type: "text/markdown" });
      fd.append("file", blob, "pasted-meeting.md");
    }
    if (msg) msg.textContent = "上传并解析…";
    try {
      const res = await fetch(`${API}/api/meetings/upload`, { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "上传失败");
      const parts = [`已入库 · ${d.action_items_count ?? 0} 条待办`];
      if (d.push_project?.message) parts.push(d.push_project.message);
      if (d.push_team?.ok) parts.push("团队小黑板已推送");
      if (msg) msg.textContent = parts.join(" · ");
      if (input) input.value = "";
      if (paste) paste.value = "";
      selectedMeetingId = d.id || null;
      loadMeetings();
    } catch (err) {
      if (msg) msg.textContent = err.message || "失败";
    }
  });
  document.getElementById("btnMeetingParsePreview")?.addEventListener("click", async () => {
    const text = document.getElementById("meetingPasteText")?.value?.trim();
    const msg = document.getElementById("meetingUploadMsg");
    if (!text) { alert("请先在下方粘贴纪要"); return; }
    if (msg) msg.textContent = "预览解析…";
    try {
      const res = await fetch(`${API}/api/meetings/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          project_ids: (document.getElementById("meetingUploadProjects")?.value || "").split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "失败");
      const m = d.meeting || {};
      const todos = (m.action_items || []).map(a => `· ${a.text} (${a.owner || "?"})`).join("\n");
      if (msg) msg.textContent = `预览：${d.action_items_count ?? 0} 条待办 · ${m.title || ""}`;
      alert(`【${m.title}】\n待办 ${d.action_items_count ?? 0} 条：\n${todos || "（无）"}\n\n确认后点「上传并解析」`);
    } catch (err) {
      if (msg) msg.textContent = err.message || "失败";
    }
  });
  bindCreateProjectModal();

  document.getElementById("chatFab")?.addEventListener("click", openChat);
  document.getElementById("chatMinimize")?.addEventListener("click", (e) => { e.stopPropagation(); closeChat(); });
  document.getElementById("chatSend")?.addEventListener("click", () =>
    sendChat(document.getElementById("chatInput").value));
  document.getElementById("chatInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChat(e.target.value);
  });

  document.getElementById("agentDetailRun")?.addEventListener("click", async () => {
    if (!selectedAgentId) return;
    const d = await invokeAgent(selectedAgentId);
    document.getElementById("agentDetailResult").textContent = d.message || JSON.stringify(d, null, 2);
  });
  document.getElementById("agentDetailTab")?.addEventListener("click", () => {
    const tab = getAgentById(selectedAgentId)?.web_tab;
    if (tab) switchView(tab);
  });
  document.getElementById("agentDetailCopy")?.addEventListener("click", () => {
    const t = document.getElementById("agentDetailPrompt").textContent;
    navigator.clipboard?.writeText(t);
  });

  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#projects/")) {
      const id = parseProjectsHash();
      if (id) openProjectDetail(id);
    } else if (location.hash === "#projects") {
      if (document.querySelector(".nav-btn[data-view].active")?.dataset.view === "projects") showProjectsList();
    }
  });

  appendChatMsg("bot", "我是 SSC 工作台总助手。网页与 Knot 共用 /api/orchestrate。", "orchestrator");
  loadRegistry().then(setupChatChips).catch(() => {});
});
