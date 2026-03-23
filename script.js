// =============================================
//  ClinData — script.js  v2
//  Sistema de Expediente Clínico Electrónico
// =============================================

// ===== PERMISOS POR ROL =====
const ROLE_PERMISSIONS = {
    medico: {
        canViewPatients: true,
        canRegisterPatients: true,
        canWriteMedicalNotes: true,
        canUseTriage: true,
        canViewQueue: true,
        canAddToQueue: false,
        canManageUsers: false,
        sidebarLabel: "Médico/a"
    },
    enfermero: {
        canViewPatients: true,
        canRegisterPatients: true,
        canWriteMedicalNotes: false,
        canUseTriage: true,
        canViewQueue: true,
        canAddToQueue: true,
        canManageUsers: false,
        sidebarLabel: "Enfermero/a"
    },
    admin: {
        canViewPatients: false,
        canRegisterPatients: false,
        canWriteMedicalNotes: false,
        canUseTriage: false,
        canViewQueue: false,
        canAddToQueue: false,
        canManageUsers: true,
        sidebarLabel: "Administrador"
    }
};

function can(permission) {
    if (!currentUser) return false;
    return ROLE_PERMISSIONS[currentUser.role]?.[permission] === true;
}

// ===== USUARIOS POR DEFECTO =====
const DEFAULT_USERS = [
    { id: 1, username: "dr.garcia",  password: "Medico#2026",     role: "medico",    displayName: "Dr. García" },
    { id: 2, username: "enf.lopez",  password: "Enfermero#2026",  role: "enfermero", displayName: "Enf. López" },
    { id: 3, username: "admin.sys",  password: "Admin#2026",      role: "admin",     displayName: "Administrador" }
];

// ===== ESTADO GLOBAL =====
let currentUser         = null;
let currentPatient      = null;
let currentConsultation = null;
let autoSaveTimer       = null;
let addToQueuePatientId = null;

// ===== DATOS PERSISTENTES =====
let patients      = JSON.parse(localStorage.getItem("cd_patients"))  || [];
let consultations = JSON.parse(localStorage.getItem("cd_consults"))  || [];
let triageQueue   = JSON.parse(localStorage.getItem("cd_triage"))    || [];
let consultQueue  = JSON.parse(localStorage.getItem("cd_cqueue"))    || [];
let systemUsers   = JSON.parse(localStorage.getItem("cd_users"))     || DEFAULT_USERS;

function savePatients()      { localStorage.setItem("cd_patients", JSON.stringify(patients)); }
function saveConsultations() { localStorage.setItem("cd_consults",  JSON.stringify(consultations)); }
function saveTriageQueue()   { localStorage.setItem("cd_triage",    JSON.stringify(triageQueue)); }
function saveConsultQueue()  { localStorage.setItem("cd_cqueue",    JSON.stringify(consultQueue)); }
function saveSystemUsers()   { localStorage.setItem("cd_users",     JSON.stringify(systemUsers)); }

// =============================================
//  AUTH
// =============================================
function handleLogin() {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value;
    const user = systemUsers.find(x => x.username === u && x.password === p);
    if (!user) {
        document.getElementById("loginError").classList.remove("hidden");
        document.getElementById("loginPass").value = "";
        return;
    }
    currentUser = user;
    sessionStorage.setItem("cd_session", JSON.stringify(user));
    bootApp();
}

function bootApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appShell").classList.remove("hidden");
    document.getElementById("userDisplayName").textContent = currentUser.displayName;
    const labels = { medico: "Médico/a", enfermero: "Enfermero/a", admin: "Administrador" };
    document.getElementById("userRoleBadge").textContent = labels[currentUser.role] || currentUser.role;
    document.getElementById("userAvatar").textContent = currentUser.displayName.charAt(0).toUpperCase();
    renderSidebar();
    // Primera pantalla según rol
    if (currentUser.role === "admin") navigate("admin");
    else if (currentUser.role === "medico") navigate("consultQueue");
    else navigate("patients");
}

function handleLogout() {
    sessionStorage.removeItem("cd_session");
    currentUser = null; currentPatient = null; currentConsultation = null;
    stopAutoSave();
    document.getElementById("appShell").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginError").classList.add("hidden");
}

function togglePassword() {
    const i = document.getElementById("loginPass");
    i.type = i.type === "password" ? "text" : "password";
}

window.addEventListener("DOMContentLoaded", () => {
    const saved = sessionStorage.getItem("cd_session");
    if (saved) {
        currentUser = JSON.parse(saved);
        // Re-sync user from storage in case it was updated
        const fresh = systemUsers.find(u => u.id === currentUser.id);
        if (fresh) currentUser = fresh;
        bootApp();
    }
    document.getElementById("loginPass").addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });
    document.getElementById("loginUser").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("loginPass").focus(); });
    const s = document.getElementById("search");
    if (s) s.addEventListener("input", function() { searchPatients(this.value.toLowerCase()); });
});

// =============================================
//  SIDEBAR DINÁMICA
// =============================================
function renderSidebar() {
    const nav = document.getElementById("sidebarNav");
    if (!nav) return;
    const items = [];

    if (can("canViewPatients")) {
        items.push({ id: "nav-patients", section: "patients", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`, label: "Pacientes" });
    }
    if (can("canRegisterPatients")) {
        items.push({ id: "nav-newPatient", section: "newPatient", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`, label: "Nuevo Paciente" });
    }
    if (can("canViewQueue")) {
        items.push({ id: "nav-consultQueue", section: "consultQueue", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`, label: "Cola de Consulta" });
    }
    if (can("canUseTriage")) {
        items.push({ id: "nav-triage", section: "triage", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, label: "Triage" });
        items.push({ id: "nav-triageList", section: "triageList", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`, label: "Cola de Urgencias" });
    }
    if (can("canManageUsers")) {
        items.push({ id: "nav-admin", section: "admin", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`, label: "Gestión de Usuarios" });
    }

    nav.innerHTML = items.map(item => `
        <button class="nav-item" onclick="navigate('${item.section}')" id="${item.id}" data-section="${item.section}">
            ${item.icon}
            ${item.label}
        </button>`).join("");
}

// =============================================
//  NAVEGACIÓN
// =============================================
function navigate(section) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    stopAutoSave();

    const map = {
        patients: "patientsSection",
        newPatient: "newPatientSection",
        consultQueue: "consultQueueSection",
        consultationHistory: "consultationHistorySection",
        medicalRecord: "medicalRecordSection",
        triage: "triageSection",
        triageList: "triageListSection",
        admin: "adminSection"
    };
    const navMap = {
        patients: "nav-patients",
        newPatient: "nav-newPatient",
        consultQueue: "nav-consultQueue",
        consultationHistory: "nav-patients",
        medicalRecord: "nav-patients",
        triage: "nav-triage",
        triageList: "nav-triageList",
        admin: "nav-admin"
    };

    const sectionEl = map[section] ? document.getElementById(map[section]) : null;
    if (sectionEl) sectionEl.classList.add("active");
    const navEl = navMap[section] ? document.getElementById(navMap[section]) : null;
    if (navEl) navEl.classList.add("active");

    if (section === "patients")            renderPatients();
    if (section === "consultQueue")        renderConsultQueue();
    if (section === "consultationHistory") renderConsultationHistory();
    if (section === "triageList")          renderTriageList();
    if (section === "admin")               renderUserTable();
    if (section === "medicalRecord")       setupRecordActions();
}

// =============================================
//  PACIENTES
// =============================================
function submitPatient() {
    const name   = document.getElementById("name").value.trim();
    const age    = document.getElementById("age").value;
    const sex    = document.getElementById("sex").value;
    const address = document.getElementById("address").value.trim();
    const phone  = document.getElementById("phone").value.trim();
    const dob    = document.getElementById("dob").value;
    const allergies = document.getElementById("allergies").value.trim();
    const reason = document.getElementById("consultReason").value.trim();

    if (!name || !age || !sex || !address || !reason) {
        showToast("Completa los campos obligatorios (nombre, edad, sexo, domicilio, motivo).", "error"); return;
    }

    const patient = { id: Date.now(), name, age, sex, address, phone, dob, allergies, alerts: "", currentTreatment: "", createdAt: new Date().toISOString(), createdBy: currentUser?.username };
    patients.push(patient);
    savePatients();

    // Add to consult queue immediately
    addPatientToQueue(patient.id, reason, true);
    showToast("Paciente registrado y agregado a la cola de consulta.", "success");

    ["name","age","sex","address","phone","dob","allergies","consultReason"].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = "";
    });
    navigate("consultQueue");
}

function renderPatients(customList = null) {
    const container = document.getElementById("patientList");
    if (!container) return;
    const list = customList !== null ? customList : patients;

    // Header actions
    const ha = document.getElementById("patientsHeaderActions");
    if (ha) {
        ha.innerHTML = can("canRegisterPatients") ? `<button class="btn-primary" onclick="navigate('newPatient')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo paciente</button>` : "";
    }

    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p>${customList !== null ? "No se encontraron resultados" : "No hay pacientes registrados"}</p>
            ${customList === null && can("canRegisterPatients") ? `<button class="btn-primary" onclick="navigate('newPatient')">Registrar primer paciente</button>` : ""}
        </div>`; return;
    }

    container.innerHTML = list.map(p => {
        const initials = p.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
        const consults = consultations.filter(c => c.patientId === p.id).length;
        const last = consultations.filter(c => c.patientId === p.id).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
        const lastDate = last ? formatDate(last.date) : "Sin consultas";
        const addQueueBtn = can("canAddToQueue") ? `<button class="btn-add-queue" onclick="event.stopPropagation();openAddToQueueModal(${p.id})">+ Cola</button>` : "";
        return `<div class="patient-card" onclick="openPatientRecord(${p.id})">
            <div class="patient-avatar">${initials}</div>
            <div class="patient-info">
                <div class="patient-name">${p.name}</div>
                <div class="patient-meta"><span>${p.age} años</span><span class="dot">·</span><span>${p.sex}</span><span class="dot">·</span><span>${p.address}</span></div>
                ${p.allergies ? `<div class="patient-allergy-tag">⚠ ${p.allergies}</div>` : ""}
            </div>
            <div class="patient-stats">
                <div class="stat-item"><span class="stat-value">${consults}</span><span class="stat-label">consultas</span></div>
                <div class="stat-item"><span class="stat-value last-date">${lastDate}</span><span class="stat-label">última visita</span></div>
            </div>
            ${addQueueBtn}
            <div class="patient-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>`;
    }).join("");
}

function searchPatients(query) {
    if (!query) { renderPatients(); return; }
    renderPatients(patients.filter(p => p.name.toLowerCase().includes(query) || p.age.toString().includes(query) || p.sex.toLowerCase().includes(query)));
}

// =============================================
//  COLA DE CONSULTA
// =============================================
function addPatientToQueue(patientId, reason, isNew = false) {
    consultQueue.push({ id: Date.now(), patientId, reason, isNewPatient: isNew, addedAt: new Date().toISOString(), addedBy: currentUser?.displayName, status: "waiting" });
    saveConsultQueue();
}

function openAddToQueueModal(patientId) {
    const p = patients.find(x => x.id === patientId);
    if (!p) return;
    addToQueuePatientId = patientId;
    document.getElementById("queueModalPatientName").textContent = p.name;
    document.getElementById("queueModalReason").value = "";
    document.getElementById("addToQueueModal").classList.remove("hidden");
}

function confirmAddToQueue() {
    const reason = document.getElementById("queueModalReason").value.trim();
    if (!reason) { showToast("Ingresa el motivo de consulta.", "error"); return; }
    addPatientToQueue(addToQueuePatientId, reason, false);
    closeModal("addToQueueModal");
    showToast("Paciente agregado a la cola de consulta.", "success");
}

function renderConsultQueue() {
    const container = document.getElementById("consultQueue");
    if (!container) return;

    // Actions
    const actEl = document.getElementById("consultQueueActions");
    if (actEl && can("canAddToQueue")) {
        actEl.innerHTML = `<button class="btn-secondary" onclick="navigate('patients')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar paciente existente</button>`;
    }

    const waiting = consultQueue.filter(q => q.status === "waiting").sort((a,b)=>new Date(a.addedAt)-new Date(b.addedAt));

    if (waiting.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>No hay pacientes en la cola de consulta</p>
        </div>`; return;
    }

    container.innerHTML = waiting.map((q, idx) => {
        const p = patients.find(x => x.id === q.patientId) || { name: "Paciente", age: "—", sex: "—" };
        const initials = p.name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();
        const isNew = q.isNewPatient ? `<span class="new-badge">Primera visita</span>` : `<span class="return-badge">Seguimiento</span>`;
        const attendBtn = can("canWriteMedicalNotes") ? `<button class="btn-attend" onclick="attendFromQueue(${q.id})">Atender</button>` : `<span class="waiting-tag">En espera</span>`;
        const dismissBtn = can("canAddToQueue") || can("canWriteMedicalNotes") ? `<button class="btn-dismiss" onclick="dismissFromConsultQueue(${q.id})">Retirar</button>` : "";
        return `<div class="consult-queue-card">
            <div class="queue-number">${idx + 1}</div>
            <div class="queue-patient-avatar">${initials}</div>
            <div class="queue-body">
                <div class="queue-name">${p.name}</div>
                <div class="queue-meta">${p.age} años · ${p.sex} · ${isNew}</div>
                <div class="queue-reason">${q.reason}</div>
            </div>
            <div class="queue-right">
                <div class="queue-time">${formatTime(q.addedAt)}</div>
                ${attendBtn}
                ${dismissBtn}
            </div>
        </div>`;
    }).join("");
}

function attendFromQueue(queueId) {
    const qEntry = consultQueue.find(q => q.id === queueId);
    if (!qEntry) return;
    const p = patients.find(x => x.id === qEntry.patientId);
    if (!p) return;

    currentPatient = p;

    // Create new consultation
    const consult = {
        id: Date.now(), patientId: p.id,
        date: new Date().toISOString(),
        createdBy: currentUser?.displayName || "Sistema",
        queueReason: qEntry.reason,
        isNewPatient: qEntry.isNewPatient,
        interrogatorio: "", antecedentes: "", padecimiento: "",
        exploracion: "", diagnostico: "", tratamiento: "",
        notaImportante: "",
        triageLevel: null, triageData: null,
        status: "active",
        attachments: []
    };
    consultations.push(consult);
    saveConsultations();
    currentConsultation = consult;

    // Mark queue entry as attended
    qEntry.status = "attended";
    saveConsultQueue();

    navigate("medicalRecord");
    renderMedicalRecord();
}

function dismissFromConsultQueue(queueId) {
    const q = consultQueue.find(x => x.id === queueId);
    if (q) { q.status = "dismissed"; saveConsultQueue(); renderConsultQueue(); }
}

// =============================================
//  HISTORIAL DE CONSULTAS
// =============================================
function openPatientRecord(patientId) {
    currentPatient = patients.find(p => p.id === patientId);
    navigate("consultationHistory");
}

function renderConsultationHistory() {
    if (!currentPatient) return;

    document.getElementById("historyPatientName").textContent = currentPatient.name;
    document.getElementById("historyPatientInfo").textContent = `${currentPatient.age} años · ${currentPatient.sex}`;

    // Header actions
    const ha = document.getElementById("historyHeaderActions");
    if (ha) {
        let btns = "";
        if (can("canWriteMedicalNotes")) {
            btns += `<button class="btn-primary" onclick="createNewConsultation()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nueva consulta</button>`;
        }
        // Both roles can edit patient data
        btns += `<button class="btn-secondary" onclick="openEditPatientModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar datos</button>`;
        ha.innerHTML = btns;
    }

    renderPatientFullCard();

    const patientConsults = consultations.filter(c => c.patientId === currentPatient.id);
    document.getElementById("consultCount").textContent = `${patientConsults.length} consulta${patientConsults.length !== 1 ? "s" : ""}`;
    const sorted = [...patientConsults].sort((a,b)=>new Date(b.date)-new Date(a.date));
    const container = document.getElementById("consultationList");

    if (sorted.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>Este paciente aún no tiene consultas registradas</p>
            ${can("canWriteMedicalNotes") ? `<button class="btn-primary" onclick="createNewConsultation()">Registrar primera consulta</button>` : ""}
        </div>`; return;
    }

    container.innerHTML = sorted.map((c, idx) => {
        const num = sorted.length - idx;
        const diagPreview = c.diagnostico ? c.diagnostico.substring(0,90)+(c.diagnostico.length>90?"...":"") : "Sin diagnóstico registrado";
        const tratPreview = c.tratamiento ? c.tratamiento.substring(0,70)+(c.tratamiento.length>70?"...":"") : "Sin tratamiento registrado";
        const triageBadge = c.triageLevel ? `<span class="triage-badge triage-${(c.triageData?.color||'azul')}">${c.triageLevel}</span>` : "";
        const isNew = c.isNewPatient ? `<span class="new-badge-sm">1ª visita</span>` : "";
        const statusBadge = c.status === "closed" ? `<span class="status-closed">Atendido</span>` : `<span class="status-active">Activo</span>`;
        const attachCount = (c.attachments||[]).length;
        const attachBadge = attachCount > 0 ? `<span class="attach-count-badge">📎 ${attachCount}</span>` : "";
        return `<div class="consult-card" onclick="openConsultation(${c.id})">
            <div class="consult-card-left">
                <div class="consult-number">Consulta ${num}</div>
                <div class="consult-date">${formatDateFull(c.date)}</div>
                ${triageBadge}${isNew}${statusBadge}${attachBadge}
            </div>
            <div class="consult-card-body">
                <div class="consult-field"><span class="consult-field-label">Diagnóstico</span><span class="consult-field-value">${diagPreview}</span></div>
                <div class="consult-field"><span class="consult-field-label">Tratamiento</span><span class="consult-field-value">${tratPreview}</span></div>
                ${c.queueReason ? `<div class="consult-field"><span class="consult-field-label">Motivo</span><span class="consult-field-value">${c.queueReason}</span></div>` : ""}
            </div>
            <div class="consult-card-right">
                <div class="consult-author">${c.createdBy||"Sistema"}</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
        </div>`;
    }).join("");
}

function renderPatientFullCard() {
    if (!currentPatient) return;
    const p = currentPatient;
    const patientConsults = consultations.filter(c => c.patientId === p.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const lastConsult = patientConsults[0];
    const prevConsult = patientConsults[1]; // For nota importante

    const lastDx = lastConsult?.diagnostico ? lastConsult.diagnostico.substring(0,100)+"..." : "Sin diagnóstico previo";
    const currentTx = p.currentTreatment || lastConsult?.tratamiento || "Sin tratamiento registrado";
    const notaImp = lastConsult?.notaImportante || null;
    const alertas = p.alerts || null;

    document.getElementById("patientFullCard").innerHTML = `
        <div class="pfc-header">
            <div class="pfc-avatar">${p.name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()}</div>
            <div class="pfc-main">
                <div class="pfc-name">${p.name}</div>
                <div class="pfc-row">
                    <span class="pfc-tag">🎂 ${p.age} años</span>
                    <span class="pfc-tag">⚧ ${p.sex}</span>
                    ${p.dob ? `<span class="pfc-tag">📅 ${formatDate(p.dob)}</span>` : ""}
                    ${p.phone ? `<span class="pfc-tag">📞 ${p.phone}</span>` : ""}
                    ${p.address ? `<span class="pfc-tag">📍 ${p.address}</span>` : ""}
                </div>
            </div>
        </div>
        <div class="pfc-grid">
            <div class="pfc-item ${p.allergies && p.allergies !== 'Ninguna conocida' ? 'pfc-alert' : ''}">
                <div class="pfc-item-label">Alergias</div>
                <div class="pfc-item-value">${p.allergies || "No registradas"}</div>
            </div>
            ${alertas ? `<div class="pfc-item pfc-alert"><div class="pfc-item-label">⚠ Alertas médicas</div><div class="pfc-item-value">${alertas}</div></div>` : ""}
            <div class="pfc-item">
                <div class="pfc-item-label">Último diagnóstico</div>
                <div class="pfc-item-value">${lastDx}</div>
            </div>
            <div class="pfc-item">
                <div class="pfc-item-label">Tratamiento actual</div>
                <div class="pfc-item-value">${currentTx}</div>
            </div>
            ${notaImp ? `<div class="pfc-item pfc-nota full-span"><div class="pfc-item-label">📌 Nota de consulta anterior</div><div class="pfc-item-value">${notaImp}</div></div>` : ""}
        </div>`;
}

function createNewConsultation() {
    if (!currentPatient) return;
    const consult = { id: Date.now(), patientId: currentPatient.id, date: new Date().toISOString(), createdBy: currentUser?.displayName||"Sistema", interrogatorio:"", antecedentes:"", padecimiento:"", exploracion:"", diagnostico:"", tratamiento:"", notaImportante:"", triageLevel:null, triageData:null, status:"active", attachments:[] };
    consultations.push(consult);
    saveConsultations();
    currentConsultation = consult;
    navigate("medicalRecord");
    renderMedicalRecord();
}

function openConsultation(consultId) {
    currentConsultation = consultations.find(c => c.id === consultId);
    if (!currentConsultation) return;
    if (!currentPatient || currentPatient.id !== currentConsultation.patientId) {
        currentPatient = patients.find(p => p.id === currentConsultation.patientId);
    }
    navigate("medicalRecord");
    renderMedicalRecord();
}

// =============================================
//  EXPEDIENTE / CONSULTA
// =============================================
function renderMedicalRecord() {
    if (!currentConsultation || !currentPatient) return;

    document.getElementById("patientName").textContent = currentPatient.name;
    document.getElementById("consultationDateLabel").textContent = "Consulta del " + formatDateFull(currentConsultation.date);

    // Triage banner
    const banner = document.getElementById("triageAlertBanner");
    if (currentConsultation.triageLevel && currentConsultation.triageData) {
        const td = currentConsultation.triageData;
        banner.className = `triage-alert-banner triage-banner-${td.color}`;
        banner.classList.remove("hidden");
        banner.innerHTML = `<strong>Triage:</strong> Nivel ${td.number} — ${td.label} &nbsp;·&nbsp; Motivo: ${td.reason||"—"} &nbsp;·&nbsp; FC: ${td.vitals?.FC||"—"} lpm &nbsp; TA: ${td.vitals?.TAS||"—"}/${td.vitals?.TAD||"—"} mmHg &nbsp; SpO₂: ${td.vitals?.spo2||"—"}%`;
    } else {
        banner.classList.add("hidden");
    }

    // Summary bar for returning patients
    const allConsults = consultations.filter(c => c.patientId === currentPatient.id && c.id !== currentConsultation.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const summaryBar = document.getElementById("recordSummaryBar");
    if (allConsults.length > 0) {
        const prev = allConsults[0];
        const p = currentPatient;
        summaryBar.classList.remove("hidden");
        summaryBar.innerHTML = `
            <div class="rsb-label">Resumen del paciente</div>
            <div class="rsb-items">
                ${p.allergies ? `<div class="rsb-item rsb-warn"><span>⚠</span><div><b>Alergias:</b> ${p.allergies}</div></div>` : ""}
                ${p.alerts ? `<div class="rsb-item rsb-warn"><span>🚨</span><div><b>Alertas:</b> ${p.alerts}</div></div>` : ""}
                ${prev.diagnostico ? `<div class="rsb-item"><span>🧾</span><div><b>Último Dx:</b> ${prev.diagnostico.substring(0,80)}</div></div>` : ""}
                ${prev.tratamiento ? `<div class="rsb-item"><span>💊</span><div><b>Tratamiento previo:</b> ${prev.tratamiento.substring(0,80)}</div></div>` : ""}
                ${prev.notaImportante ? `<div class="rsb-item rsb-nota"><span>📌</span><div><b>Nota anterior:</b> ${prev.notaImportante}</div></div>` : ""}
            </div>`;
    } else {
        summaryBar.classList.add("hidden");
    }

<<<<<<< HEAD
    // Fill fields
    const fields = ["interrogatorio","antecedentes","padecimiento","exploracion","diagnostico","tratamiento","notaImportante"];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = currentConsultation[f] || "";
    });

    // Read-only if enfermero
    const isReadOnly = !can("canWriteMedicalNotes");
    fields.forEach(f => {
        const el = document.getElementById(f);
=======
    // Fill fields — nuevos campos estructurados
    const camposSimples = {
        "hf-madre": currentConsultation["hf-madre"],
        "hf-padre": currentConsultation["hf-padre"],
        "hf-abp":   currentConsultation["hf-abp"],
        "hf-abpa":  currentConsultation["hf-abpa"],
        "hf-abm":   currentConsultation["hf-abm"],
        "hf-abma":  currentConsultation["hf-abma"],
        "hf-hijos": currentConsultation["hf-hijos"],
        "hf-herm":  currentConsultation["hf-herm"],
        "hf-otros": currentConsultation["hf-otros"],
        "pp-inf": currentConsultation["pp-inf"],
        "pp-ets": currentConsultation["pp-ets"],
        "pp-deg": currentConsultation["pp-deg"],
        "pp-neo": currentConsultation["pp-neo"],
        "pp-qx":  currentConsultation["pp-qx"],
        "pp-tx":  currentConsultation["pp-tx"],
        "pp-alg": currentConsultation["pp-alg"],
        "pp-meds":currentConsultation["pp-meds"],
        "pnp-ocu":currentConsultation["pnp-ocu"],
        "pnp-esc":currentConsultation["pnp-esc"],
        "pnp-ec": currentConsultation["pnp-ec"],
        "pnp-ali":currentConsultation["pnp-ali"],
        "pnp-act":currentConsultation["pnp-act"],
        "pnp-emb":currentConsultation["pnp-emb"],
        "pnp-mac":currentConsultation["pnp-mac"],
        "pnp-vac":currentConsultation["pnp-vac"],
        "interrogatorio": currentConsultation.interrogatorio,
        "padecimiento":   currentConsultation.padecimiento,
        "pad-fac":        currentConsultation["pad-fac"],
        "sis-dig": currentConsultation["sis-dig"],
        "sis-res": currentConsultation["sis-res"],
        "sis-car": currentConsultation["sis-car"],
        "sis-gen": currentConsultation["sis-gen"],
        "sis-end": currentConsultation["sis-end"],
        "sis-hem": currentConsultation["sis-hem"],
        "sis-ner": currentConsultation["sis-ner"],
        "sis-mus": currentConsultation["sis-mus"],
        "sis-teg": currentConsultation["sis-teg"],
        "v-fc":   currentConsultation["v-fc"],
        "v-fr":   currentConsultation["v-fr"],
        "v-ta":   currentConsultation["v-ta"],
        "v-temp": currentConsultation["v-temp"],
        "v-spo2": currentConsultation["v-spo2"],
        "v-peso": currentConsultation["v-peso"],
        "v-talla":currentConsultation["v-talla"],
        "v-imc":  currentConsultation["v-imc"],
        "v-hab":  currentConsultation["v-hab"],
        "v-glas": currentConsultation["v-glas"],
        "eap-cab":currentConsultation["eap-cab"],
        "eap-tor":currentConsultation["eap-tor"],
        "eap-abd":currentConsultation["eap-abd"],
        "eap-gen":currentConsultation["eap-gen"],
        "eap-ext":currentConsultation["eap-ext"],
        "eap-neu":currentConsultation["eap-neu"],
        "eap-piel":currentConsultation["eap-piel"],
        "eap-col":currentConsultation["eap-col"],
        "exploracion":  currentConsultation.exploracion,
        "diagnostico":  currentConsultation.diagnostico,
        "lab-rx":       currentConsultation["lab-rx"],
        "lab-gb":       currentConsultation["lab-gb"],
        "tratamiento":  currentConsultation.tratamiento,
        "trat-nf":      currentConsultation["trat-nf"],
        "trat-sig":     currentConsultation["trat-sig"],
        "notaEvolucion":currentConsultation.notaEvolucion,
        "notaImportante":currentConsultation.notaImportante,
    };
    Object.entries(camposSimples).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
    });

    // Read-only si es enfermero
    const isReadOnly = !can("canWriteMedicalNotes");
    const todosLosCampos = Object.keys(camposSimples);
    todosLosCampos.forEach(id => {
        const el = document.getElementById(id);
>>>>>>> ExperimentalBranch_AzulGonzález
        if (el) el.disabled = isReadOnly;
    });
    const dropZone = document.getElementById("attachDropZone");
    if (dropZone) dropZone.style.display = isReadOnly ? "none" : "";

    setupRecordActions();
    renderAttachments();
    setupAttachments();
    setupAutocomplete();
    setupAbbreviationDetection();
    if (!isReadOnly) { startAutoSave(); setupAutoSaveEvents(); }
}

function setupRecordActions() {
    const el = document.getElementById("recordFormActions");
    if (!el) return;
    const headerEl = document.getElementById("recordHeaderActions");

    const pdfBtns = `
<<<<<<< HEAD
        <button class="btn-secondary" onclick="exportPDF('patient')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            PDF Paciente</button>
        <button class="btn-secondary" onclick="exportPDF('doctor')">
=======
        <button class="btn-secondary" onclick="abrevIniciarExport('patient')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            PDF Paciente</button>
        <button class="btn-secondary" onclick="abrevIniciarExport('doctor')">
>>>>>>> ExperimentalBranch_AzulGonzález
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            PDF Médico</button>`;

    if (headerEl) headerEl.innerHTML = pdfBtns;

    if (can("canWriteMedicalNotes")) {
        el.innerHTML = `
            <button class="btn-secondary" onclick="navigate('consultationHistory')">Cancelar</button>
            <button class="btn-secondary" onclick="saveRecord()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                Guardar</button>
            <button class="btn-primary" onclick="closeConsultation()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Marcar como Atendido</button>`;
    } else {
        el.innerHTML = `<p class="readonly-note">Vista de solo lectura — Solo el médico puede editar notas clínicas.</p>`;
    }
}

function saveRecord() {
    if (!currentConsultation) return;
<<<<<<< HEAD
    ["interrogatorio","antecedentes","padecimiento","exploracion","diagnostico","tratamiento","notaImportante"].forEach(f => {
        const el = document.getElementById(f);
        if (el) currentConsultation[f] = el.value;
    });
=======
    const ids = [
        "hf-madre","hf-padre","hf-abp","hf-abpa","hf-abm","hf-abma","hf-hijos","hf-herm","hf-otros",
        "pp-inf","pp-ets","pp-deg","pp-neo","pp-qx","pp-tx","pp-alg","pp-meds",
        "pnp-ocu","pnp-esc","pnp-ec","pnp-ali","pnp-act","pnp-emb","pnp-mac","pnp-vac",
        "interrogatorio","padecimiento","pad-fac",
        "sis-dig","sis-res","sis-car","sis-gen","sis-end","sis-hem","sis-ner","sis-mus","sis-teg",
        "v-fc","v-fr","v-ta","v-temp","v-spo2","v-peso","v-talla","v-imc","v-hab","v-glas",
        "eap-cab","eap-tor","eap-abd","eap-gen","eap-ext","eap-neu","eap-piel","eap-col",
        "exploracion","diagnostico","lab-rx","lab-gb",
        "tratamiento","trat-nf","trat-sig","notaEvolucion","notaImportante"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) currentConsultation[id] = el.value.toUpperCase();
    });
    // Mantener compatibilidad con campos legacy
    currentConsultation.antecedentes = [
        currentConsultation["pp-deg"], currentConsultation["pp-qx"],
        currentConsultation["pp-inf"], currentConsultation["pp-meds"]
    ].filter(Boolean).join(" | ") || "";
>>>>>>> ExperimentalBranch_AzulGonzález
    saveConsultations();
    showToast("Consulta guardada.", "success");
    showAutoSave();
}

function closeConsultation() {
    saveRecord();
    if (!currentConsultation) return;
    currentConsultation.status = "closed";
    // Update patient's currentTreatment from this consultation
    if (currentPatient && currentConsultation.tratamiento) {
        currentPatient.currentTreatment = currentConsultation.tratamiento;
        savePatients();
    }
    saveConsultations();
    showToast("Consulta cerrada — paciente marcado como atendido.", "success");
    navigate("consultationHistory");
}

// ===== AUTOGUARDADO =====
function startAutoSave() {
    stopAutoSave();
    autoSaveTimer = setInterval(saveCurrentRecord, 30000);
}
function stopAutoSave() { if (autoSaveTimer) clearInterval(autoSaveTimer); }
function saveCurrentRecord() {
    if (!currentConsultation) return;
<<<<<<< HEAD
    ["interrogatorio","antecedentes","padecimiento","exploracion","diagnostico","tratamiento","notaImportante"].forEach(f => {
        const el = document.getElementById(f);
        if (el) currentConsultation[f] = el.value;
    });
=======
    const ids = [
        "hf-madre","hf-padre","hf-abp","hf-abpa","hf-abm","hf-abma","hf-hijos","hf-herm","hf-otros",
        "pp-inf","pp-ets","pp-deg","pp-neo","pp-qx","pp-tx","pp-alg","pp-meds",
        "pnp-ocu","pnp-esc","pnp-ec","pnp-ali","pnp-act","pnp-emb","pnp-mac","pnp-vac",
        "interrogatorio","padecimiento","pad-fac",
        "sis-dig","sis-res","sis-car","sis-gen","sis-end","sis-hem","sis-ner","sis-mus","sis-teg",
        "v-fc","v-fr","v-ta","v-temp","v-spo2","v-peso","v-talla","v-imc","v-hab","v-glas",
        "eap-cab","eap-tor","eap-abd","eap-gen","eap-ext","eap-neu","eap-piel","eap-col",
        "exploracion","diagnostico","lab-rx","lab-gb",
        "tratamiento","trat-nf","trat-sig","notaEvolucion","notaImportante"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) currentConsultation[id] = el.value.toUpperCase();
    });
    currentConsultation.antecedentes = [
        currentConsultation["pp-deg"], currentConsultation["pp-qx"],
        currentConsultation["pp-inf"], currentConsultation["pp-meds"]
    ].filter(Boolean).join(" | ") || "";
>>>>>>> ExperimentalBranch_AzulGonzález
    saveConsultations();
    showAutoSave();
}
function setupAutoSaveEvents() {
<<<<<<< HEAD
    ["interrogatorio","antecedentes","padecimiento","exploracion","diagnostico","tratamiento","notaImportante"].forEach(id => {
=======
    const ids = [
        "hf-madre","hf-padre","hf-abp","hf-abpa","hf-abm","hf-abma","hf-hijos","hf-herm","hf-otros",
        "pp-inf","pp-ets","pp-deg","pp-neo","pp-qx","pp-tx","pp-alg","pp-meds",
        "pnp-ocu","pnp-esc","pnp-ec","pnp-ali","pnp-act","pnp-emb","pnp-mac","pnp-vac",
        "interrogatorio","padecimiento","pad-fac",
        "sis-dig","sis-res","sis-car","sis-gen","sis-end","sis-hem","sis-ner","sis-mus","sis-teg",
        "v-fc","v-fr","v-ta","v-temp","v-spo2","v-peso","v-talla","v-imc","v-hab","v-glas",
        "eap-cab","eap-tor","eap-abd","eap-gen","eap-ext","eap-neu","eap-piel","eap-col",
        "exploracion","diagnostico","lab-rx","lab-gb",
        "tratamiento","trat-nf","trat-sig","notaEvolucion","notaImportante"
    ];
    ids.forEach(id => {
>>>>>>> ExperimentalBranch_AzulGonzález
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", saveCurrentRecord);
    });
}
function showAutoSave() {
    const el = document.getElementById("autoSaveText");
    const dot = document.querySelector(".save-dot");
    if (!el) return;
    el.textContent = "Guardando…";
    if (dot) dot.style.background = "#f59e0b";
    setTimeout(() => { el.textContent = "Guardado"; if (dot) dot.style.background = "#22c55e"; }, 800);
}

// =============================================
//  ARCHIVOS ADJUNTOS
// =============================================
function setupAttachments() {
    const input = document.getElementById("attachInput");
    const zone  = document.getElementById("attachDropZone");
    if (!input || !zone || !can("canWriteMedicalNotes")) return;

    input.onchange = e => handleFiles(e.target.files);

    zone.ondragover = e => { e.preventDefault(); zone.classList.add("drag-over"); };
    zone.ondragleave = () => zone.classList.remove("drag-over");
    zone.ondrop = e => { e.preventDefault(); zone.classList.remove("drag-over"); handleFiles(e.dataTransfer.files); };
}

function handleFiles(files) {
    if (!currentConsultation) return;
    if (!currentConsultation.attachments) currentConsultation.attachments = [];
    const maxSize = 20 * 1024 * 1024;

    Array.from(files).forEach(file => {
        if (file.size > maxSize) { showToast(`${file.name} supera el límite de 20 MB.`, "error"); return; }
        const reader = new FileReader();
        reader.onload = e => {
            currentConsultation.attachments.push({ id: Date.now() + Math.random(), name: file.name, type: file.type, size: file.size, data: e.target.result, uploadedAt: new Date().toISOString() });
            saveConsultations();
            renderAttachments();
        };
        reader.readAsDataURL(file);
    });
}

function renderAttachments() {
    const list = document.getElementById("attachmentsList");
    if (!list || !currentConsultation) return;
    const attachments = currentConsultation.attachments || [];

    if (attachments.length === 0) { list.innerHTML = ""; return; }

    list.innerHTML = attachments.map(a => {
        const isImg = a.type?.startsWith("image/");
        const isPdf = a.type === "application/pdf";
        const icon = isImg ? "🖼" : isPdf ? "📄" : "📁";
        const sizeMB = (a.size / 1024 / 1024).toFixed(2);
        const canDelete = can("canWriteMedicalNotes");
        return `<div class="attach-item">
            <div class="attach-icon">${icon}</div>
            <div class="attach-info">
                <div class="attach-name">${a.name}</div>
                <div class="attach-meta">${sizeMB} MB · ${formatDate(a.uploadedAt)}</div>
            </div>
            <div class="attach-actions">
                ${isImg ? `<button class="attach-btn" onclick="previewAttachment('${a.id}')">Vista previa</button>` : ""}
                <a class="attach-btn" href="${a.data}" download="${a.name}">Descargar</a>
                ${canDelete ? `<button class="attach-btn attach-delete" onclick="deleteAttachment('${a.id}')">Eliminar</button>` : ""}
            </div>
        </div>`;
    }).join("");
}

function deleteAttachment(attachId) {
    if (!currentConsultation) return;
    currentConsultation.attachments = (currentConsultation.attachments||[]).filter(a => a.id != attachId);
    saveConsultations();
    renderAttachments();
}

function previewAttachment(attachId) {
    const a = (currentConsultation?.attachments||[]).find(x => x.id == attachId);
    if (!a) return;
    const win = window.open();
    win.document.write(`<img src="${a.data}" style="max-width:100%;height:auto;">`);
}

// =============================================
//  EDITAR DATOS DEL PACIENTE
// =============================================
function openEditPatientModal() {
    if (!currentPatient) return;
    const p = currentPatient;
    document.getElementById("editName").value = p.name || "";
    document.getElementById("editAge").value = p.age || "";
    document.getElementById("editSex").value = p.sex || "";
    document.getElementById("editAddress").value = p.address || "";
    document.getElementById("editPhone").value = p.phone || "";
    document.getElementById("editDob").value = p.dob || "";
    document.getElementById("editAllergies").value = p.allergies || "";
    document.getElementById("editCurrentTreatment").value = p.currentTreatment || "";
    document.getElementById("editAlerts").value = p.alerts || "";
    document.getElementById("editPatientModal").classList.remove("hidden");
}

function saveEditedPatient() {
    if (!currentPatient) return;
    currentPatient.name = document.getElementById("editName").value.trim() || currentPatient.name;
    currentPatient.age = document.getElementById("editAge").value || currentPatient.age;
    currentPatient.sex = document.getElementById("editSex").value || currentPatient.sex;
    currentPatient.address = document.getElementById("editAddress").value.trim() || currentPatient.address;
    currentPatient.phone = document.getElementById("editPhone").value.trim();
    currentPatient.dob = document.getElementById("editDob").value;
    currentPatient.allergies = document.getElementById("editAllergies").value.trim();
    currentPatient.currentTreatment = document.getElementById("editCurrentTreatment").value.trim();
    currentPatient.alerts = document.getElementById("editAlerts").value.trim();
    savePatients();
    closeModal("editPatientModal");
    showToast("Datos del paciente actualizados.", "success");
    renderConsultationHistory();
}

// =============================================
//  TRIAGE
// =============================================
function calcularTriage() {
    const name   = document.getElementById("triageName").value.trim();
    const age    = parseInt(document.getElementById("triageAge").value) || 0;
    const sex    = document.getElementById("triageSex").value;
    const reason = document.getElementById("triageReason").value.trim();
    const notes  = document.getElementById("triageNotes").value.trim();
    if (!name || !age || !reason) { showToast("Completa nombre, edad y motivo.", "error"); return; }

    const vitals = {
        FC:   parseInt(document.getElementById("triageFC").value)   || null,
        FR:   parseInt(document.getElementById("triageFR").value)   || null,
        TAS:  parseInt(document.getElementById("triageTAS").value)  || null,
        TAD:  parseInt(document.getElementById("triageTAD").value)  || null,
        temp: parseFloat(document.getElementById("triageTemp").value) || null,
        spo2: parseInt(document.getElementById("triageSpo2").value) || null,
        gluc: parseInt(document.getElementById("triageGluc").value) || null,
        dolor: parseInt(document.getElementById("triageDolor").value) || 0
    };

    let score = 0; let flags = [];
    if (document.getElementById("sym_inconsciencia").checked) { score+=100; flags.push("Inconsciencia"); }
    if (document.getElementById("sym_paro").checked)          { score+=100; flags.push("Paro cardiorrespiratorio"); }
    if (document.getElementById("sym_dificultad_resp").checked){ score+=50; flags.push("Dificultad respiratoria severa"); }
    if (document.getElementById("sym_dolor_toracico").checked) { score+=50; flags.push("Dolor torácico intenso"); }
    if (document.getElementById("sym_convulsiones").checked)   { score+=50; flags.push("Convulsiones"); }
    if (document.getElementById("sym_sangrado_mayor").checked) { score+=50; flags.push("Sangrado mayor"); }
    if (vitals.FC!==null && (vitals.FC<40||vitals.FC>150))      { score+=50; flags.push("FC crítica"); }
    if (vitals.spo2!==null && vitals.spo2<90)                   { score+=50; flags.push("SpO₂ <90%"); }
    if (vitals.TAS!==null && (vitals.TAS<80||vitals.TAS>200))   { score+=40; flags.push("TA crítica"); }
    if (vitals.FR!==null && (vitals.FR<8||vitals.FR>30))        { score+=40; flags.push("FR anormal"); }
    if (vitals.temp!==null && vitals.temp>=40)                  { score+=30; flags.push("Hipertermia ≥40°C"); }
    if (document.getElementById("sym_alteracion_consciencia").checked){ score+=25; flags.push("Alteración consciencia"); }
    if (document.getElementById("sym_vomito_persistente").checked)   { score+=20; flags.push("Vómito persistente"); }
    if (document.getElementById("sym_fiebre_alta").checked)          { score+=20; flags.push("Fiebre alta"); }
    if (document.getElementById("sym_trauma").checked)               { score+=20; flags.push("Trauma"); }
    if (vitals.spo2!==null && vitals.spo2>=90&&vitals.spo2<94)  { score+=25; flags.push("SpO₂ 90–94%"); }
    if (vitals.FC!==null && (vitals.FC<50||vitals.FC>120))      { score+=15; flags.push("FC alterada"); }
    if (vitals.dolor>=8) { score+=35; flags.push("Dolor severo"); } else if (vitals.dolor>=5) { score+=20; flags.push("Dolor moderado"); } else if (vitals.dolor>=3) { score+=5; }
    if (age<2||age>80) score+=10;
    if (document.getElementById("sym_dolor_moderado").checked) score+=10;
    if (document.getElementById("sym_infeccion_leve").checked) score+=2;

    let nivel;
    if (score>=100)     nivel={number:1,label:"Reanimación",color:"rojo",icon:"🔴",wait:"Atención inmediata",description:"Riesgo vital inmediato. Requiere intervención de reanimación."};
    else if (score>=50) nivel={number:2,label:"Emergencia",color:"naranja",icon:"🟠",wait:"≤ 10 minutos",description:"Situación de riesgo vital. Evaluación médica urgente."};
    else if (score>=25) nivel={number:3,label:"Urgencia",color:"amarillo",icon:"🟡",wait:"≤ 30 minutos",description:"Condición grave pero estable. Atención prioritaria."};
    else if (score>=10) nivel={number:4,label:"Urgencia menor",color:"verde",icon:"🟢",wait:"≤ 60 minutos",description:"Condición no urgente. Puede esperar sin riesgo."};
    else                nivel={number:5,label:"No urgente",color:"azul",icon:"🔵",wait:"≤ 120 minutos",description:"Sin urgencia. Puede ser referido a consulta externa."};

    const entry = { id:Date.now(), name, age, sex, reason, notes, vitals, level:nivel.number, levelLabel:nivel.label, levelColor:nivel.color, score, flags, timestamp:new Date().toISOString(), registeredBy:currentUser?.displayName||"Enfermero/a", active:true };
    triageQueue.push(entry);
    saveTriageQueue();

    const resultDiv = document.getElementById("triageResult");
    resultDiv.className = `triage-result triage-result-${nivel.color}`;
    resultDiv.classList.remove("hidden");
    resultDiv.innerHTML = `
        <div class="triage-result-header">
            <div class="triage-level-badge triage-${nivel.color}">
                <span>${nivel.icon}</span>
                <div><div class="triage-level-num">Nivel ${nivel.number}</div><div class="triage-level-label">${nivel.label}</div></div>
            </div>
            <div class="triage-wait"><div class="triage-wait-label">Tiempo de espera máximo</div><div class="triage-wait-time">${nivel.wait}</div></div>
        </div>
        <p class="triage-description">${nivel.description}</p>
        ${flags.length>0?`<div class="triage-flags"><div class="flags-title">Hallazgos detectados:</div><div class="flags-list">${flags.map(f=>`<span class="flag-tag">${f}</span>`).join("")}</div></div>`:""}
        <div class="triage-vitals-summary">
            ${vitals.FC?`<span>FC: <b>${vitals.FC}</b> lpm</span>`:""}
            ${vitals.TAS?`<span>TA: <b>${vitals.TAS}/${vitals.TAD}</b> mmHg</span>`:""}
            ${vitals.FR?`<span>FR: <b>${vitals.FR}</b> rpm</span>`:""}
            ${vitals.spo2?`<span>SpO₂: <b>${vitals.spo2}</b>%</span>`:""}
            ${vitals.temp?`<span>Temp: <b>${vitals.temp}</b>°C</span>`:""}
            ${vitals.gluc?`<span>Glucemia: <b>${vitals.gluc}</b> mg/dL</span>`:""}
        </div>
        <div class="triage-result-actions">
            <button class="btn-secondary" onclick="clearTriageForm()">Nuevo triage</button>
            <button class="btn-primary" onclick="navigate('triageList')">Ver cola de urgencias</button>
        </div>`;
    resultDiv.scrollIntoView({behavior:"smooth",block:"start"});
}

function clearTriageForm() {
    ["triageName","triageAge","triageSex","triageReason","triageFC","triageFR","triageTAS","triageTAD","triageTemp","triageSpo2","triageGluc","triageDolor","triageNotes"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
    document.querySelectorAll(".symptom-check input").forEach(c=>c.checked=false);
    document.getElementById("triageResult").classList.add("hidden");
    window.scrollTo({top:0,behavior:"smooth"});
}

function renderTriageList() {
    const container = document.getElementById("triageQueue");
    if (!container) return;
    const active = triageQueue.filter(t=>t.active).sort((a,b)=>a.level-b.level||new Date(a.timestamp)-new Date(b.timestamp));
    if (active.length===0){container.innerHTML=`<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><p>No hay pacientes en cola de urgencias</p></div>`;return;}
    container.innerHTML = active.map(t=>`
        <div class="triage-queue-card triage-queue-${t.levelColor}">
            <div class="triage-queue-left"><div class="triage-level-circle triage-circle-${t.levelColor}">${t.level}</div></div>
            <div class="triage-queue-body">
                <div class="triage-queue-name">${t.name}</div>
                <div class="triage-queue-meta">${t.age} años · ${t.sex||"—"} · ${t.reason}</div>
                <div class="triage-queue-label triage-${t.levelColor}">${t.levelLabel}</div>
            </div>
            <div class="triage-queue-right">
                <div class="triage-queue-time">${formatTime(t.timestamp)}</div>
                ${can("canWriteMedicalNotes")?`<button class="btn-attend" onclick="attendTriage(${t.id})">Atender</button>`:""}
                <button class="btn-dismiss" onclick="dismissTriage(${t.id})">Alta</button>
            </div>
        </div>`).join("");
}

function attendTriage(triageId) {
    const entry = triageQueue.find(t=>t.id===triageId);
    if(!entry) return;
    let patient = patients.find(p=>p.name.toLowerCase()===entry.name.toLowerCase());
    if(!patient){
        patient={id:Date.now(),name:entry.name,age:entry.age,sex:entry.sex||"No especificado",address:"Urgencias",phone:"",dob:"",allergies:"",alerts:"",currentTreatment:"",createdAt:new Date().toISOString(),createdBy:currentUser?.username};
        patients.push(patient); savePatients();
    }
    currentPatient=patient;
    const consult={id:Date.now(),patientId:patient.id,date:new Date().toISOString(),createdBy:currentUser?.displayName||"Sistema",interrogatorio:`Motivo de urgencia: ${entry.reason}\n${entry.notes?"Notas: "+entry.notes:""}`,antecedentes:"",padecimiento:"",exploracion:`FC: ${entry.vitals.FC||"—"} lpm | FR: ${entry.vitals.FR||"—"} rpm | TA: ${entry.vitals.TAS||"—"}/${entry.vitals.TAD||"—"} mmHg | Temp: ${entry.vitals.temp||"—"}°C | SpO₂: ${entry.vitals.spo2||"—"}% | Glucemia: ${entry.vitals.gluc||"—"} mg/dL`,diagnostico:"",tratamiento:"",notaImportante:"",triageLevel:`Nivel ${entry.level}`,triageData:{...entry.vitals,number:entry.level,label:entry.levelLabel,color:entry.levelColor,reason:entry.reason},status:"active",attachments:[]};
    consultations.push(consult); saveConsultations();
    currentConsultation=consult;
    entry.active=false; saveTriageQueue();
    navigate("medicalRecord"); renderMedicalRecord();
}

function dismissTriage(triageId) {
    const t=triageQueue.find(x=>x.id===triageId);
    if(t){t.active=false;saveTriageQueue();renderTriageList();}
}

// =============================================
//  ADMIN DE USUARIOS
// =============================================
function renderUserTable() {
    const container = document.getElementById("userTable");
    if (!container) return;
    const roleLabels = { medico:"Médico/a", enfermero:"Enfermero/a", admin:"Administrador" };
    const roleClasses = { medico:"role-medico-pill", enfermero:"role-enfermero-pill", admin:"role-admin-pill" };
    container.innerHTML = `
        <table class="user-table">
            <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Acciones</th></tr></thead>
            <tbody>${systemUsers.map(u=>`
                <tr>
                    <td><code class="username-code">${u.username}</code></td>
                    <td>${u.displayName}</td>
                    <td><span class="role-pill ${roleClasses[u.role]||''}">${roleLabels[u.role]||u.role}</span></td>
                    <td class="table-actions">
                        <button class="btn-table-edit" onclick="openEditUserModal(${u.id})">Editar</button>
                        ${u.id!==currentUser?.id?`<button class="btn-table-delete" onclick="deleteUser(${u.id})">Eliminar</button>`:"<span class='self-label'>Tú</span>"}
                    </td>
                </tr>`).join("")}
            </tbody>
        </table>`;
}

function openAddUserModal() {
    document.getElementById("modalTitle").textContent = "Nuevo Usuario";
    document.getElementById("editUserId").value = "";
    document.getElementById("modalDisplayName").value = "";
    document.getElementById("modalUsername").value = "";
    document.getElementById("modalPassword").value = "";
    document.getElementById("modalRole").value = "";
    document.getElementById("userModal").classList.remove("hidden");
}

function openEditUserModal(userId) {
    const u = systemUsers.find(x=>x.id===userId);
    if (!u) return;
    document.getElementById("modalTitle").textContent = "Editar Usuario";
    document.getElementById("editUserId").value = u.id;
    document.getElementById("modalDisplayName").value = u.displayName;
    document.getElementById("modalUsername").value = u.username;
    document.getElementById("modalPassword").value = "";
    document.getElementById("modalRole").value = u.role;
    document.getElementById("userModal").classList.remove("hidden");
}

function saveUserFromModal() {
    const id = document.getElementById("editUserId").value;
    const displayName = document.getElementById("modalDisplayName").value.trim();
    const username    = document.getElementById("modalUsername").value.trim();
    const password    = document.getElementById("modalPassword").value;
    const role        = document.getElementById("modalRole").value;

    if (!displayName||!username||!role) { showToast("Completa todos los campos obligatorios.", "error"); return; }
    if (!id && !password) { showToast("La contraseña es obligatoria para un usuario nuevo.", "error"); return; }
    if (password && password.length < 8) { showToast("La contraseña debe tener al menos 8 caracteres.", "error"); return; }

    const duplicate = systemUsers.find(u => u.username===username && u.id != id);
    if (duplicate) { showToast("Ese nombre de usuario ya existe.", "error"); return; }

    if (id) {
        const u = systemUsers.find(x=>x.id==id);
        if (u) { u.displayName=displayName; u.username=username; u.role=role; if(password) u.password=password; }
    } else {
        systemUsers.push({ id: Date.now(), username, password, role, displayName });
    }
    saveSystemUsers();
    closeModal("userModal");
    showToast("Usuario guardado.", "success");
    renderUserTable();
}

function deleteUser(userId) {
    if (userId === currentUser?.id) { showToast("No puedes eliminarte a ti mismo.", "error"); return; }
    systemUsers = systemUsers.filter(u=>u.id!==userId);
    saveSystemUsers();
    renderUserTable();
    showToast("Usuario eliminado.", "success");
}

// =============================================
//  MODALES
// =============================================
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

// =============================================
//  AUTOCOMPLETADO Y ABREVIATURAS
// =============================================
const suggestionsDB = [
    "diabetes mellitus tipo 2","diabetes mellitus tipo 1","diabetes gestacional",
    "hipertensión arterial sistémica","insuficiencia renal crónica","insuficiencia renal aguda",
    "dolor torácico","fiebre sin foco aparente","cefalea tensional","infección respiratoria aguda",
    "gastritis crónica","asma bronquial","neumonía adquirida en la comunidad","infección urinaria",
    "apendicitis aguda","fractura","enfermedad pulmonar obstructiva crónica","hipotiroidismo",
    "hipertiroidismo","anemia","insuficiencia cardíaca","infarto agudo de miocardio","accidente cerebrovascular"
];
const abbreviations = {
    "DM":"diabetes mellitus","HTA":"hipertensión arterial","FC":"frecuencia cardiaca",
    "TA":"tensión arterial","FR":"frecuencia respiratoria","ICC":"insuficiencia cardíaca congestiva",
    "ERC":"enfermedad renal crónica","IRA":"insuficiencia renal aguda","IAM":"infarto agudo de miocardio",
    "ACV":"accidente cerebrovascular","EVC":"evento vascular cerebral","IVU":"infección de vías urinarias",
    "PCR":"proteína C reactiva","BH":"biometría hemática","QS":"química sanguínea","EGO":"examen general de orina",
    "Tx":"tratamiento","Dx":"diagnóstico","Rx":"radiografía","Hb":"hemoglobina","Ht":"hematocrito",
    "VO":"vía oral","IV":"vía intravenosa","SC":"vía subcutánea","IM":"vía intramuscular",
    "c/8h":"cada 8 horas","c/12h":"cada 12 horas","c/24h":"cada 24 horas",
    "EPOC":"enfermedad pulmonar obstructiva crónica","SpO2":"saturación de oxígeno",
    "TAS":"tensión arterial sistólica","TAD":"tensión arterial diastólica"
};

function getLastWord(t){const w=t.split(" ");return w[w.length-1].toLowerCase();}
function getSuggestions(w){if(w.length<2)return[];return suggestionsDB.filter(i=>i.toLowerCase().includes(w)).slice(0,6);}

function setupAutocomplete() {
    const input=document.getElementById("diagnostico"), box=document.getElementById("suggestionsBox");
    if(!input||!box) return;
    input.removeEventListener("input",input._autocompleteHandler);
    input._autocompleteHandler=()=>{
        const s=getSuggestions(getLastWord(input.value)); box.innerHTML="";
        if(!s.length) return;
        s.forEach(sg=>{const d=document.createElement("div");d.className="suggestion-item";d.textContent=sg;d.onclick=()=>{applySuggestion(input,sg);box.innerHTML="";};box.appendChild(d);});
    };
    input.addEventListener("input",input._autocompleteHandler);
    document.addEventListener("click",e=>{if(!box.contains(e.target)&&e.target!==input)box.innerHTML="";});
}

function applySuggestion(input,s){const w=input.value.split(" ");w.pop();w.push(s);input.value=w.join(" ")+" ";input.focus();}

function highlightText(text){return text.split(" ").map(w=>{if(w===w.toUpperCase()&&w.length>=2&&w.length<=6&&/^[A-ZÁÉÍÓÚ]+$/.test(w)){return abbreviations[w]?`<span class="abbr-valid" title="${abbreviations[w]}">${w}</span>`:`<span class="abbr-invalid" title="Abreviatura no reconocida">${w}</span>`;}return w;}).join(" ");}

function setupAbbreviationDetection() {
    const input=document.getElementById("diagnostico"),preview=document.getElementById("diagnosticoPreview");
    if(!input||!preview) return;
    input.removeEventListener("input",input._abbrevHandler);
    input._abbrevHandler=()=>{const text=input.value;const has=/\b[A-ZÁÉÍÓÚ]{2,6}\b/.test(text);if(has&&text.length>0){preview.style.display="block";preview.innerHTML=`<span class="preview-label">Vista previa:</span> `+highlightText(text);}else preview.style.display="none";};
    input.addEventListener("input",input._abbrevHandler);
}

function expandAbbreviations(text,mode="patient"){if(!text)return"";return text.split(" ").map(w=>{if(abbreviations[w])return mode==="patient"?abbreviations[w]:`${abbreviations[w]} (${w})`;return w;}).join(" ");}

// =============================================
//  EXPORTAR PDF
// =============================================
function exportPDF(type) {
    if (!currentConsultation||!currentPatient) return;
    const {jsPDF}=window.jspdf; const doc=new jsPDF();
    let y=15; const margin=15, pageW=210, contentW=pageW-margin*2;
    doc.setFillColor(15,23,42); doc.rect(0,0,pageW,22,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont(undefined,"bold");
    doc.text("ClinData — Expediente Clínico",margin,14);
    doc.setFontSize(9); doc.setFont(undefined,"normal");
    doc.text(type==="patient"?"Versión para paciente":"Versión para médico",pageW-margin,14,{align:"right"});
    y=30; doc.setTextColor(0,0,0);
    doc.setFontSize(12); doc.setFont(undefined,"bold");
    doc.text(`Paciente: ${currentPatient.name}`,margin,y); y+=7;
    doc.setFontSize(10); doc.setFont(undefined,"normal");
    doc.text(`Edad: ${currentPatient.age} años  |  Sexo: ${currentPatient.sex}  |  Fecha: ${formatDateFull(currentConsultation.date)}`,margin,y); y+=7;
    if(currentPatient.allergies) {doc.text(`Alergias: ${currentPatient.allergies}`,margin,y); y+=7;}
    doc.setDrawColor(200,200,200); doc.line(margin,y,pageW-margin,y); y+=7;
    function addSection(title,text){if(y>260){doc.addPage();y=15;}doc.setFontSize(11);doc.setFont(undefined,"bold");doc.setTextColor(14,165,233);doc.text(title,margin,y);y+=5;doc.setTextColor(0,0,0);doc.setFont(undefined,"normal");doc.setFontSize(10);const lines=doc.splitTextToSize(text||"Sin información registrada.",contentW);lines.forEach(l=>{if(y>270){doc.addPage();y=15;}doc.text(l,margin,y);y+=5.5;});y+=4;}
    addSection("Interrogatorio",expandAbbreviations(currentConsultation.interrogatorio,type));
    addSection("Antecedentes",expandAbbreviations(currentConsultation.antecedentes,type));
    addSection("Padecimiento actual",expandAbbreviations(currentConsultation.padecimiento,type));
    addSection("Exploración física",expandAbbreviations(currentConsultation.exploracion,type));
    addSection("Diagnóstico",expandAbbreviations(currentConsultation.diagnostico,type));
    addSection("Tratamiento",expandAbbreviations(currentConsultation.tratamiento,type));
    const pages=doc.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(150);doc.text(`ClinData — ${new Date().toLocaleDateString("es-MX")} — Página ${i}/${pages}`,pageW/2,290,{align:"center"});}
    doc.save(`expediente_${currentPatient.name.replace(/\s/g,"_")}_${type}.pdf`);
}

// =============================================
//  UTILIDADES
// =============================================
function formatDate(iso){if(!iso)return"—";const d=new Date(iso);return d.toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"});}
function formatDateFull(iso){if(!iso)return"—";const d=new Date(iso);return d.toLocaleDateString("es-MX",{weekday:"short",day:"2-digit",month:"long",year:"numeric"});}
function formatTime(iso){if(!iso)return"—";const d=new Date(iso);return d.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});}
<<<<<<< HEAD
function showToast(message,type="info"){const ex=document.getElementById("toast");if(ex)ex.remove();const t=document.createElement("div");t.id="toast";t.className=`toast toast-${type}`;t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.classList.add("toast-show"),10);setTimeout(()=>{t.classList.remove("toast-show");setTimeout(()=>t.remove(),300);},3000);}
=======
function showToast(message,type="info"){const ex=document.getElementById("toast");if(ex)ex.remove();const t=document.createElement("div");t.id="toast";t.className=`toast toast-${type}`;t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.classList.add("toast-show"),10);setTimeout(()=>{t.classList.remove("toast-show");setTimeout(()=>t.remove(),300);},3000);}

// =============================================
//  NUEVO EXPEDIENTE: toggle secciones e IMC
// =============================================
function recTog(id) {
    const body = document.getElementById("rbody-" + id);
    const chev = document.getElementById("rchev-" + id);
    if (!body) return;
    const open = body.style.display === "none";
    body.style.display = open ? "" : "none";
    if (chev) chev.classList.toggle("rc-open", open);
}

function recCalcIMC() {
    const p = parseFloat(document.getElementById("v-peso")?.value);
    const t = parseFloat(document.getElementById("v-talla")?.value);
    const el = document.getElementById("v-imc");
    if (el) el.value = (p > 0 && t > 0) ? (p / (t * t)).toFixed(1) : "";
}
>>>>>>> ExperimentalBranch_AzulGonzález
