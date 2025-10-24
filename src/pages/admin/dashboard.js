// src/pages/user/dashboard.js
import { logout, getCurrentUser } from "../util/auth.js";

const STORAGE_KEY = "hc_admin_demo";

function loadState(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {users:[],projects:[],tasks:[]}; }
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function byId(arr, id){ return arr.find(x => x.id === id); }
function uid(p){ return `${p}-${Math.random().toString(36).slice(2,8)}`; }

/* ---------------- Identify current user ---------------- */
function ensureCurrentUserInState(state){
  const u = getCurrentUser(); // { username: email, role }
  const email = u?.username;
  if (!email) return null;

  // Try map by email
  let user = state.users.find(x => x.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Create a shadow profile so the UI works even si no está en seed/admin
    user = { id: uid("u"), name: email.split("@")[0], email, role: "user", area: "—" };
    state.users.push(user);
    saveState(state);
  }
  return user;
}

/* ---------------- Render helpers ---------------- */
function renderIdentity(user){
  const el = document.getElementById("current-identity");
  if (el) el.textContent = `${user.name} • ${user.email}`;
}

function kpi(label, value, sub){
  return `
    <div class="stat">
      <div class="pill">${label}</div>
      <div class="kpi">${value}</div>
      <div class="sub">${sub || ''}</div>
    </div>
  `;
}

function renderStats(state, user, projectFilterId){
  const myTasks = state.tasks.filter(t => t.assignee === user.id && (!projectFilterId || t.project === projectFilterId));
  const total = myTasks.length;
  const todo = myTasks.filter(t=>t.status==='todo').length;
  const doing = myTasks.filter(t=>t.status==='doing').length;
  const done = myTasks.filter(t=>t.status==='done').length;

  const el = document.getElementById("stats-user");
  if (!el) return;
  el.innerHTML = [
    kpi("Mis tareas", total, "Asignadas"),
    kpi("En progreso", doing, "Activas"),
    kpi("Completadas", done, "Último período"),
  ].join("");
}

function taskCard(state, t){
  const p = byId(state.projects, t.project);
  return `
    <div class="task">
      <div class="t-head">
        <strong>${t.title}</strong>
        <span class="badge">${p ? p.name : "Proyecto"}</span>
      </div>
      <div class="meta">${t.desc || ''}</div>
    </div>
  `;
}

function renderKanban(state, user, projectFilterId){
  const mine = state.tasks.filter(t => t.assignee === user.id && (!projectFilterId || t.project === projectFilterId));

  const todo = document.getElementById("u-col-todo");
  const doing = document.getElementById("u-col-doing");
  const done = document.getElementById("u-col-done");
  if (!todo || !doing || !done) return;

  todo.innerHTML  = mine.filter(t=>t.status==='todo').map(t=>taskCard(state,t)).join("");
  doing.innerHTML = mine.filter(t=>t.status==='doing').map(t=>taskCard(state,t)).join("");
  done.innerHTML  = mine.filter(t=>t.status==='done').map(t=>taskCard(state,t)).join("");
}

/* ---------------- Charts ---------------- */
function donutChart(containerId, percent, colors){
  // Clamp
  const pct = Math.max(0, Math.min(100, percent));
  const size = 180, stroke = 16, r = (size - stroke) / 2, c = Math.PI * 2 * r;

  const fg = (pct/100) * c;
  const bg = c - fg;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colors[0]}"/>
          <stop offset="100%" stop-color="${colors[1]}"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-90 ${size/2} ${size/2})">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="${stroke}" />
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#grad1)" stroke-width="${stroke}"
          stroke-dasharray="${fg} ${bg}" stroke-linecap="round" />
      </g>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="26" fill="#e6e9f5" font-weight="800">${pct}%</text>
    </svg>
  `;
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = svg;
}

function renderProjectProgress(state, user, projectId){
  const target = byId(state.projects, projectId);
  const legendG = document.getElementById("legend-general");
  const legendU = document.getElementById("legend-user");
  if (!target){
    donutChart("chart-project-progress", 0, ["#7c5cff","#4ae3b5"]);
    donutChart("chart-user-progress", 0, ["#4ae3b5","#7c5cff"]);
    if (legendG) legendG.innerHTML = "";
    if (legendU) legendU.innerHTML = "";
    return;
  }

  const allTasks = state.tasks.filter(t=>t.project === projectId);
  const doneAll  = allTasks.filter(t=>t.status === "done").length;
  const pctAll   = allTasks.length ? Math.round((doneAll / allTasks.length) * 100) : 0;

  const myTasks  = allTasks.filter(t=>t.assignee === user.id);
  const doneMine = myTasks.filter(t=>t.status === "done").length;
  const pctMine  = myTasks.length ? Math.round((doneMine / myTasks.length) * 100) : 0;

  donutChart("chart-project-progress", pctAll, ["#7c5cff","#4ae3b5"]);
  donutChart("chart-user-progress", pctMine, ["#4ae3b5","#7c5cff"]);

  if (legendG){
    legendG.innerHTML = `
      <span><span class="legend-dot" style="background:#7c5cff"></span><b>${doneAll}</b> hechas</span>
      <span><span class="legend-dot" style="background:#4ae3b5"></span><b>${allTasks.length - doneAll}</b> pendientes</span>
      <span><b>Total:</b> ${allTasks.length} tareas</span>
    `;
  }
  if (legendU){
    legendU.innerHTML = `
      <span><span class="legend-dot" style="background:#4ae3b5"></span><b>${doneMine}</b> hechas</span>
      <span><span class="legend-dot" style="background:#7c5cff"></span><b>${myTasks.length - doneMine}</b> pendientes</span>
      <span><b>Tuyas:</b> ${myTasks.length} tareas</span>
    `;
  }
}

/* ---------------- Selects / Filters ---------------- */
function fillProjectFilter(state, user, selectedId){
  const sel = document.getElementById("user-project-filter");
  if (!sel) return;

  const myProjectIds = new Set(state.tasks.filter(t=>t.assignee===user.id).map(t=>t.project));
  const myProjects = state.projects.filter(p=>myProjectIds.has(p.id));

  sel.innerHTML = `<option value="">Todos</option>` + 
    myProjects.map(p=>`<option value="${p.id}" ${selectedId===p.id?'selected':''}>${p.name}</option>`).join("");
}

/* ---------------- Wire & update ---------------- */
function updateAll(state, user, projectFilterId){
  renderIdentity(user);
  renderStats(state, user, projectFilterId);
  renderKanban(state, user, projectFilterId);

  // si hay proyecto seleccionado, grafica su progreso; si no, usa el primero de la lista del filtro
  let pid = projectFilterId;
  if (!pid){
    const sel = document.getElementById("user-project-filter");
    if (sel && sel.value) pid = sel.value;
  }
  // fallback: primer proyecto con tareas mías
  if (!pid){
    const myP = state.tasks.filter(t=>t.assignee===user.id).map(t=>t.project);
    pid = myP[0];
  }
  renderProjectProgress(state, user, pid);
}

function wire(state, user, navigateTo){
  const btnLogout = document.getElementById("btn-logout-user");
  if (btnLogout){
    btnLogout.addEventListener("click", ()=>{
      logout();
      navigateTo('/login');
    });
  }

  const sel = document.getElementById("user-project-filter");
  if (sel){
    sel.addEventListener("change", ()=>{
      updateAll(state, user, sel.value || "");
    });
  }
}

export default function UserDashboard(navigateTo){
  const state = loadState();
  const user = ensureCurrentUserInState(state);
  if (!user){
    // si por alguna razón no hay usuario, regresar a login
    navigateTo('/login');
    return;
  }

  fillProjectFilter(state, user, "");
  wire(state, user, navigateTo);
  updateAll(state, user, "");
}
