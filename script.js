// =============================================
//  ClinData — script.js  v3
//  Sistema de Expediente Clínico Electrónico
//  NOM-004-SSA3-2012
// =============================================

// ===== PERMISOS POR ROL =====
const ROLE_PERMISSIONS = {
    medico: {
        canViewPatients: true,
        canRegisterPatients: false,
        canWriteMedicalNotes: true,
        canWriteNursingNotes: false,
        canUseTriage: true,
        canViewQueue: true,
        canAddToQueue: false,
        canManageUsers: false,
        canManageConsultorios: false,
        sidebarLabel: "Médico/a"
    },
    enfermero: {
        canViewPatients: true,
        canRegisterPatients: false,
        canWriteMedicalNotes: false,
        canWriteNursingNotes: true,
        canUseTriage: true,
        canViewQueue: true,
        canAddToQueue: false,
        canManageUsers: false,
        canManageConsultorios: false,
        sidebarLabel: "Enfermero/a"
    },
    recepcion: {
        canViewPatients: true,
        canRegisterPatients: true,
        canWriteMedicalNotes: false,
        canWriteNursingNotes: false,
        canUseTriage: false,
        canViewQueue: true,
        canAddToQueue: true,
        canManageUsers: false,
        canManageConsultorios: false,
        sidebarLabel: "Recepción"
    },
    admin: {
        canViewPatients: false,
        canRegisterPatients: false,
        canWriteMedicalNotes: false,
        canWriteNursingNotes: false,
        canUseTriage: false,
        canViewQueue: false,
        canAddToQueue: false,
        canManageUsers: true,
        canManageConsultorios: true,
        sidebarLabel: "Administrador"
    }
};

function can(permission) { return requireClinDataModule("auth").can(permission); }

// ===== USUARIOS POR DEFECTO =====
const DEFAULT_USERS = [
    { id: 1, username: "dr.garcia",  password: "Medico#2026",     role: "medico",    displayName: "Dr. García",    consultorio: "Consultorio 1" },
    { id: 2, username: "enf.lopez",  password: "Enfermero#2026",  role: "enfermero", displayName: "Enf. López",    consultorio: "" },
    { id: 3, username: "recep.ruiz", password: "Recepcion#2026",  role: "recepcion", displayName: "Recep. Ruiz",   consultorio: "" },
    { id: 4, username: "admin.sys",  password: "Admin#2026",      role: "admin",     displayName: "Administrador", consultorio: "" }
];

// ===== ESTADO GLOBAL =====
let currentUser         = null;
let currentPatient      = null;
let currentConsultation = null;
let autoSaveTimer       = null;
let addToQueuePatientId = null;
let currentTab          = "historia";
let selectedDiagnosticos = [];  // Array para diagnósticos CIE-10 seleccionados

window.ClinDataApp = window.ClinDataApp || {};
Object.defineProperties(window.ClinDataApp, {
    patients: { get: () => patients },
    consultations: { get: () => consultations },
    triageQueue: { get: () => triageQueue },
    consultQueue: { get: () => consultQueue },
    systemUsers: { get: () => systemUsers },
    rolePermissions: { get: () => ROLE_PERMISSIONS },
    defaultUsers: { get: () => DEFAULT_USERS },
    currentUser: { get: () => currentUser, set: (value) => { currentUser = value; } },
    currentPatient: { get: () => currentPatient, set: (value) => { currentPatient = value; } },
    currentConsultation: { get: () => currentConsultation, set: (value) => { currentConsultation = value; } },
    autoSaveTimer: { get: () => autoSaveTimer, set: (value) => { autoSaveTimer = value; } },
    addToQueuePatientId: { get: () => addToQueuePatientId, set: (value) => { addToQueuePatientId = value; } },
    currentTab: { get: () => currentTab, set: (value) => { currentTab = value; } },
    consultorios: { get: () => consultorios },
    selectedDiagnosticos: { get: () => selectedDiagnosticos, set: (value) => { selectedDiagnosticos = value; } }
});

const CONSULT_ANTECEDENT_FIELDS = [
    "ahf","hf-madre","hf-padre","hf-abp","hf-abpa","hf-abm","hf-abma","hf-hijos","hf-herm","hf-otros",
    "pnp-ocu","pnp-esc","pnp-ec","pnp-emb","pnp-mac","pnp-vac","apnp_otros",
    "tabaquismo_detalle","alcoholismo_detalle","toxicomanias_detalle","actfisica_detalle",
    "app_enfermedades","app_cirugias","app_traumatismos","app_alergias","app_transfusiones","app_medicamentos",
    "pp-deg","pp-neo","pp-ets"
];
const CONSULT_ANTECEDENT_RADIOS = ["tabaquismo","alcoholismo","toxicomanias","actfisica"];

// ===== DATOS PERSISTENTES =====

let patients      = JSON.parse(localStorage.getItem("cd_patients"))  || [];
let consultations = JSON.parse(localStorage.getItem("cd_consults"))  || [];
let triageQueue   = JSON.parse(localStorage.getItem("cd_triage"))    || [];
let consultQueue  = JSON.parse(localStorage.getItem("cd_cqueue"))    || [];
let systemUsers   = JSON.parse(localStorage.getItem("cd_users"))     || DEFAULT_USERS;
const HOSPITAL_CODE = "HGR";

function requireClinDataModule(name) {
    const module = window.ClinDataModules?.[name];
    if (!module) throw new Error(`Módulo ClinData no disponible: ${name}`);
    return module;
}

function savePatients()      { localStorage.setItem("cd_patients", JSON.stringify(patients)); }
function saveConsultations() { localStorage.setItem("cd_consults",  JSON.stringify(consultations)); }
function saveTriageQueue()   { localStorage.setItem("cd_triage",    JSON.stringify(triageQueue)); }
function saveConsultQueue()  { localStorage.setItem("cd_cqueue",    JSON.stringify(consultQueue)); }
function saveSystemUsers()   { localStorage.setItem("cd_users",     JSON.stringify(systemUsers)); }

function getRecordYear(date = new Date()) { return requireClinDataModule("patients").getRecordYear(date); }
function getLastExpedienteSequence(hospitalCode = HOSPITAL_CODE, year = getRecordYear()) { return requireClinDataModule("patients").getLastExpedienteSequence(hospitalCode, year); }
function generatePatientExpediente(hospitalCode = HOSPITAL_CODE, date = new Date()) { return requireClinDataModule("patients").generatePatientExpediente(hospitalCode, date); }
function updateNewPatientExpedientePreview() { return requireClinDataModule("patients").updateNewPatientExpedientePreview(); }

function formatMedicationSummary(med = {}, format = "html") {
    const parts = [
        med.nombre || "",
        med.concentracion ? `(${med.concentracion})` : "",
        med.dosis || "",
        med.via || "",
        med.frecuencia || "",
        med.duracion ? `por ${med.duracion}` : ""
    ].filter(Boolean);
    const text = parts.join(" - ");
    return format === "html" ? escapeHtml(text) : text;
}

function getMedicationSummary(medicamentos = [], format = "html") {
    if (!Array.isArray(medicamentos) || medicamentos.length === 0) return "";
    const items = medicamentos
        .map(med => formatMedicationSummary(med, format))
        .filter(Boolean);

    if (!items.length) return "";
    if (format === "html") return items.map(item => `<div>${item}</div>`).join("");
    return items.join("\n");
}

function copyAntecedentsFromPreviousConsultation(consult) {
    if (!consult || !currentPatient) return;
    const prev = consultations
        .filter(c => c.patientId === currentPatient.id && c.id !== consult.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!prev) return;

    CONSULT_ANTECEDENT_FIELDS.forEach(field => {
        consult[field] = prev[field] || "";
    });

    CONSULT_ANTECEDENT_RADIOS.forEach(name => {
        consult["radio_" + name] = prev["radio_" + name] || (name === "actfisica" ? "Sedentario" : "Negativo");
    });
}

// =============================================
//  AUTH
// =============================================
function handleLogin() { return requireClinDataModule("auth").handleLogin(); }
function bootApp() { return requireClinDataModule("auth").bootApp(); }
function handleLogout() { return requireClinDataModule("auth").handleLogout(); }
function togglePassword() { return requireClinDataModule("auth").togglePassword(); }

function setupSelectableRadioCards() {
    const radioCards = document.querySelectorAll(".pronostico-opt");
    if (!radioCards.length) return;

    const syncRadioCards = () => {
        radioCards.forEach(card => {
            const input = card.querySelector('input[type="radio"]');
            card.classList.toggle("is-selected", Boolean(input?.checked));
        });
    };

    radioCards.forEach(card => {
        const input = card.querySelector('input[type="radio"]');
        if (!input || input.dataset.cardBound === "true") return;
        input.dataset.cardBound = "true";
        input.addEventListener("change", syncRadioCards);
    });

    syncRadioCards();
}

window.addEventListener("DOMContentLoaded", () => {
    const saved = sessionStorage.getItem("cd_session");
    if (saved) {
        currentUser = JSON.parse(saved);
        const fresh = systemUsers.find(u => u.id === currentUser.id);
        if (fresh) currentUser = fresh;
        bootApp();
    }
    document.getElementById("loginPass").addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });
    document.getElementById("loginUser").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("loginPass").focus(); });
    const s = document.getElementById("search");
    if (s) s.addEventListener("input", function() { searchPatients(this.value.toLowerCase()); });
    updateNewPatientExpedientePreview();
    setupSelectableRadioCards();
});

// =============================================
//  LISTENER HASHCHANGE — Botón Atrás/Adelante
// =============================================
window.addEventListener("hashchange", () => {
    // Si el cambio de hash lo hizo navigate(), no hacer nada doble
    if (_navigating) return;

    // Si no hay sesión activa, volver al login
    if (!currentUser) {
        document.getElementById("appShell").classList.add("hidden");
        document.getElementById("loginScreen").classList.remove("hidden");
        window.location.hash = "";
        return;
    }

    const hash    = window.location.hash || "";
    const section = HASH_TO_SECTION[hash];

    if (!section) {
        // Hash desconocido → home del rol
        const homeSection = currentUser.role === "admin"      ? "admin"
                          : currentUser.role === "medico"     ? "consultQueue"
                          : currentUser.role === "recepcion"  ? "patients"
                          : "triage";
        _activateSection(homeSection);
        return;
    }

    // Auto-guardar expediente si se estaba editando
    if (section !== "medicalRecord" && currentConsultation && can("canWriteMedicalNotes")) {
        collectRecordFieldsSafe();
    }

    document.title = ROUTE_TITLE[section] || "ClinData";
    _activateSection(section);
});

// =============================================
//  SIDEBAR DINÁMICA
// =============================================
function renderSidebar() { return requireClinDataModule("auth").renderSidebar(); }

// =============================================
//  NAVEGACIÓN
// =============================================
// =============================================
//  ROUTER DE HASH — compatible con file:// y http://
//  Usa window.location.hash (#/patients, #/queue…)
//  para que el botón Atrás funcione sin servidor.
// =============================================

const HASH_MAP = {
    patients:            "#/patients",
    newPatient:          "#/patients/new",
    consultQueue:        "#/queue",
    consultationHistory: "#/patient/history",
    medicalRecord:       "#/patient/record",
    triage:              "#/triage",
    triageList:          "#/triage/queue",
    admin:               "#/admin",
    consultorios:        "#/consultorios",
};

const HASH_TO_SECTION = {
    "#/patients":        "patients",
    "#/patients/new":    "newPatient",
    "#/queue":           "consultQueue",
    "#/patient/history": "consultationHistory",
    "#/patient/record":  "medicalRecord",
    "#/triage":          "triage",
    "#/triage/queue":    "triageList",
    "#/admin":           "admin",
    "#/consultorios":    "consultorios",
};

const ROUTE_TITLE = {
    patients:            "Pacientes · ClinData",
    newPatient:          "Nuevo Paciente · ClinData",
    consultQueue:        "Fila de Consulta · ClinData",
    consultationHistory: "Expediente · ClinData",
    medicalRecord:       "Consulta · ClinData",
    triage:              "Triage · ClinData",
    triageList:          "Fila de Urgencias · ClinData",
    admin:               "Administración · ClinData",
    consultorios:        "Consultorios · ClinData",
};

// navigate() — punto de entrada público.
// Cambia el hash y activa la sección. El cambio de hash
// dispara hashchange, pero lo ignoramos si viene de aquí
// usando la bandera _navigating.
let _navigating = false;

function navigate(section) {
    // Auto-guardar expediente al salir de esa vista
    if (section !== "medicalRecord" && currentConsultation && can("canWriteMedicalNotes")) {
        collectRecordFieldsSafe();
    }

    const hash  = HASH_MAP[section] || "#/patients";
    const title = ROUTE_TITLE[section] || "ClinData";

    _navigating = true;
    window.location.hash = hash;
    _navigating = false;

    document.title = title;
    _activateSection(section);
}

function _activateSection(section) {
    const map = {
        patients:            "patientsSection",
        newPatient:          "newPatientSection",
        consultQueue:        "consultQueueSection",
        consultationHistory: "consultationHistorySection",
        medicalRecord:       "medicalRecordSection",
        triage:              "triageSection",
        triageList:          "triageListSection",
        admin:               "adminSection",
        consultorios:        "consultoriosSection"
    };
    const navMap = {
        patients:            "nav-patients",
        newPatient:          "nav-newPatient",
        consultQueue:        "nav-consultQueue",
        consultationHistory: "nav-patients",
        medicalRecord:       "nav-patients",
        triage:              "nav-triage",
        triageList:          "nav-triageList",
        admin:               "nav-admin",
        consultorios:        "nav-consultorios"
    };

    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    stopAutoSave();

    const sectionEl = map[section] ? document.getElementById(map[section]) : null;
    if (sectionEl) sectionEl.classList.add("active");
    const navEl = navMap[section] ? document.getElementById(navMap[section]) : null;
    if (navEl) navEl.classList.add("active");

    window.scrollTo({ top: 0, behavior: "instant" });

    if (section === "patients")            renderPatients();
    if (section === "newPatient")          renderNewPatientConsultorioSelect();
    if (section === "consultQueue")        renderConsultQueue();
    if (section === "consultationHistory") renderConsultationHistory();
    if (section === "triageList")          renderTriageList();
    if (section === "admin")               renderUserTable();
    if (section === "consultorios")        renderConsultorios();
    if (section === "medicalRecord")       renderMedicalRecord();
    if (section === "triage" && typeof abrevInit === "function") abrevInit();
}

// Versión segura de collectRecordFields (no lanza si el DOM no está listo)
function collectRecordFieldsSafe() {
    try { collectRecordFields(); saveConsultations(); } catch(e) { /* silencioso */ }
}

// =============================================
//  TABS DE TIPO DE NOTA
// =============================================
function switchRecordTab(tabName, btn) {
    currentTab = tabName;
    document.querySelectorAll(".record-tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".record-tab").forEach(b => b.classList.remove("active"));
    const tabEl = document.getElementById("tab-" + tabName);
    if (tabEl) tabEl.classList.add("active");
    if (btn) btn.classList.add("active");
    // Store tab selection in consultation
    if (currentConsultation) {
        currentConsultation.tipoNota = tabName;
        saveConsultations();
    }
}

// =============================================
//  PACIENTES
// =============================================
function submitPatient() { return requireClinDataModule("patients").submitPatient(); }
function renderPatients(customList = null) { return requireClinDataModule("patients").renderPatients(customList); }
function searchPatients(query) { return requireClinDataModule("patients").searchPatients(query); }

// =============================================
//  FILA DE CONSULTA
// =============================================
function addPatientToQueue(patientId, reason, isNew = false) { return requireClinDataModule("queue").addPatientToQueue(patientId, reason, isNew); }
function openAddToQueueModal(patientId) { return requireClinDataModule("queue").openAddToQueueModal(patientId); }
function confirmAddToQueue() { return requireClinDataModule("queue").confirmAddToQueue(); }
function renderConsultQueue() { return requireClinDataModule("queue").renderConsultQueue(); }
function attendFromQueue(queueId) { return requireClinDataModule("queue").attendFromQueue(queueId); }
function dismissFromConsultQueue(queueId) { return requireClinDataModule("queue").dismissFromConsultQueue(queueId); }

// =============================================
//  HISTORIAL DE CONSULTAS
// =============================================
function openPatientRecord(patientId) {
    currentPatient = patients.find(p => p.id === patientId);
    navigate("consultationHistory");
}

function renderConsultationHistory() { return requireClinDataModule("patients").renderConsultationHistory(); }
function renderPatientFullCard() { return requireClinDataModule("patients").renderPatientFullCard(); }

function createEmptyConsultation(patientId, overrides = {}) { return requireClinDataModule("consultation").createEmptyConsultation(patientId, overrides); }
function createNewConsultation() { return requireClinDataModule("consultation").createNewConsultation(); }

function openConsultation(consultId) { return requireClinDataModule("consultation").openConsultation(consultId); }

// =============================================
//  EXPEDIENTE / CONSULTA  (NOM-004-SSA3-2012)
// =============================================
function renderMedicalRecord() {
    if (!currentConsultation || !currentPatient) return;

    document.getElementById("patientName").textContent = currentPatient.name;
    document.getElementById("consultationDateLabel").textContent = "Consulta del " + formatDateFull(currentConsultation.date);

    // Triage banner
    const banner = document.getElementById("triageAlertBanner");
    let vitals = {};
    if (currentConsultation.triageLevel && currentConsultation.triageData) {
        const td = currentConsultation.triageData;
        vitals = td.vitals || td;
        banner.className = `triage-alert-banner triage-banner-${td.color}`;
        banner.classList.remove("hidden");
        banner.setAttribute("data-fc", vitals.FC || "");
        banner.setAttribute("data-triage-summary", `${vitals.FC || "-"}|${vitals.TAS || "-"}|${vitals.TAD || "-"}|${vitals.spo2 || "-"}`);
        banner.innerHTML = `<strong>Triage:</strong> Nivel ${td.number} — ${td.label} &nbsp;·&nbsp; Motivo: ${td.reason||"—"} &nbsp;·&nbsp; FC: ${td.vitals?.FC||"—"} lpm &nbsp; TA: ${td.vitals?.TAS||"—"}/${td.vitals?.TAD||"—"} mmHg &nbsp; SpO₂: ${td.vitals?.spo2||"—"}%`;
    } else {
        banner.classList.add("hidden");
    }
    if (!banner.classList.contains("hidden")) {
        banner.innerHTML = `<strong>Triage:</strong> Nivel ${currentConsultation.triageData.number} - ${currentConsultation.triageData.label} &nbsp;|&nbsp; Motivo: ${currentConsultation.triageData.reason || "-"} &nbsp;|&nbsp; FC: ${vitals.FC || "-"} lpm &nbsp; TA: ${vitals.TAS || "-"}/${vitals.TAD || "-"} mmHg &nbsp; SpO2: ${vitals.spo2 || "-"}%`;
    }

    if (!banner.classList.contains("hidden")) {
        banner.innerHTML = `<strong>Triage:</strong> Nivel ${currentConsultation.triageData.number} - ${currentConsultation.triageData.label} &nbsp;|&nbsp; Motivo: ${currentConsultation.triageData.reason || "-"} &nbsp;|&nbsp; FC: ${vitals.FC || "-"} lpm &nbsp; TA: ${vitals.TAS || "-"}/${vitals.TAD || "-"} mmHg &nbsp; SpO2: ${vitals.spo2 || "-"}%`;
    }

    // Summary bar
    const allConsults = consultations.filter(c => c.patientId === currentPatient.id && c.id !== currentConsultation.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const summaryBar = document.getElementById("recordSummaryBar");
    if (allConsults.length > 0) {
        const prev = allConsults[0];
        const p = currentPatient;
        const prevMedsHtml = getMedicationSummary(prev.medicamentos, "html");
        summaryBar.classList.remove("hidden");
        summaryBar.innerHTML = `
            <div class="rsb-label">Resumen del paciente</div>
            <div class="rsb-items">
                ${p.allergies ? `<div class="rsb-item rsb-warn"><span>⚠</span><div><b>Alergias:</b> ${p.allergies}</div></div>` : ""}
                ${p.chronicConditions ? `<div class="rsb-item rsb-warn"><span>🩺</span><div><b>Crónicos:</b> ${p.chronicConditions}</div></div>` : ""}
                ${p.alerts ? `<div class="rsb-item rsb-warn"><span>🚨</span><div><b>Alertas:</b> ${p.alerts}</div></div>` : ""}
                ${prev.diagnostico ? `<div class="rsb-item"><span>🧾</span><div><b>Último Dx:</b> ${prev.diagnostico.substring(0,80)}</div></div>` : ""}
                ${prev.tratamiento ? `<div class="rsb-item"><span>💊</span><div><b>Tratamiento previo:</b> ${prev.tratamiento.substring(0,80)}</div></div>` : ""}
                ${prevMedsHtml ? `<div class="rsb-item"><span>💉</span><div><b>Medicamentos previos:</b> ${prevMedsHtml}</div></div>` : ""}
                ${(prev.notaImportante||prev.evolucion_nota) ? `<div class="rsb-item rsb-nota"><span>📌</span><div><b>Nota anterior:</b> ${(prev.notaImportante||prev.evolucion_nota)}</div></div>` : ""}
            </div>`;
    } else {
        summaryBar.classList.add("hidden");
    }

    // Restore tab
    const tipoNota = currentConsultation.tipoNota || "historia";
    currentTab = tipoNota;
    document.querySelectorAll(".record-tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".record-tab").forEach(b => b.classList.remove("active"));
    const tabEl = document.getElementById("tab-" + tipoNota);
    if (tabEl) tabEl.classList.add("active");
    const tabBtn = document.querySelector(`.record-tab[data-tab="${tipoNota}"]`);
    if (tabBtn) tabBtn.classList.add("active");

    // Fill all fields
    fillRecordFields();

    // Read-only if enfermero
    const isReadOnly = !can("canWriteMedicalNotes");
    setRecordReadOnly(isReadOnly);
    const dropZone = document.getElementById("attachDropZone");
    if (dropZone) dropZone.style.display = isReadOnly ? "none" : "";

    // IMC auto-calc
    setupIMCCalc();
    setupNursingIMCCalc();
    setupRecordActions();
    renderAttachments();
    setupAttachments();
    setupAbbreviationDetection();
    renderMedicamentos();
    initDiagnosticoAutocomplete();
    if (typeof abrevInit === "function") abrevInit();
    if (!isReadOnly) { startAutoSave(); setupAutoSaveEvents(); }
}

// Lista de todos los campos del expediente
const ALL_RECORD_FIELDS = [
    // Antecedentes heredofamiliares (Estructura nueva + legacy)
    "ahf","hf-madre","hf-padre","hf-abp","hf-abpa","hf-abm","hf-abma","hf-hijos","hf-herm","hf-otros",
    // Antecedentes personales no patológicos
    "pnp-ocu","pnp-esc","pnp-ec","pnp-emb","pnp-mac","pnp-vac","apnp_otros",
    "tabaquismo_detalle","alcoholismo_detalle","toxicomanias_detalle","actfisica_detalle",
    // Antecedentes personales patológicos / APP extendido
    "app_enfermedades","app_cirugias","app_traumatismos","app_alergias","app_transfusiones","app_medicamentos",
    "pp-deg","pp-neo","pp-ets",
    // Padecimiento actual
    "padecimiento_inicio","padecimiento_sintomas",
    // Revisión por sistemas
    "sis_cardiovascular","sis_respiratorio","sis_digestivo","sis_neurologico","sis_urinario",
    "sis_musculoesqueletico","sis_piel","sis_endocrino","sis_genitoreproductivo","sis_psiquiatrico",
    // Signos vitales
    "sv_tas","sv_tad","sv_fc","sv_fr","sv_temp","sv_spo2","sv_glucemia","sv_peso","sv_talla","sv_dolor","sv_habitus",
    // Exploración física
    "exp_cabeza","exp_torax","exp_abdomen","exp_extremidades","exp_neurologico","exp_genitourinario","exp_otros",
    // Estudios
    "estudios_previos","estudios_imagen","estudios_solicitados",
    // Diagnóstico y pronóstico
    "diagnostico","diagnostico_secundario","pronostico_detalle",
    // Tratamiento e indicaciones
    "tratamiento","indicaciones_reposo","indicaciones_dieta","indicaciones_cita","indicaciones_referencia",
    // Evolución
    "evolucion_clinica","evol_ta","evol_fc","evol_fr","evol_temp","evol_spo2","evol_peso",
    "evolucion_resultados","evolucion_diagnostico","evolucion_tratamiento","evolucion_nota",
    // Urgencias
    "urg_tas","urg_tad","urg_fc","urg_fr","urg_temp","urg_spo2","urg_glucemia","urg_glasgow",
    "urg_motivo","urg_exploracion","urg_estudios","urg_diagnostico","urg_tratamiento",
    // Notas adicionales
    "notaImportante"
];

function fillRecordFields() {
    ALL_RECORD_FIELDS.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = currentConsultation[f] || "";
    });
    // Radios APNP
    ["tabaquismo","alcoholismo","toxicomanias","actfisica"].forEach(name => {
        const val = currentConsultation["radio_" + name] || (name === "actfisica" ? "Sedentario" : "Negativo");
        const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
        if (radio) radio.checked = true;
    });
    // Radio pronóstico
    if (currentConsultation.pronostico_radio) {
        const r = document.querySelector(`input[name="pronostico"][value="${currentConsultation.pronostico_radio}"]`);
        if (r) r.checked = true;
    }
    // Radio destino urgencias
    if (currentConsultation.destino_urg) {
        const r = document.querySelector(`input[name="destino_urg"][value="${currentConsultation.destino_urg}"]`);
        if (r) r.checked = true;
    }
    const ddEl = document.getElementById("urg_destino_detalle");
    if (ddEl) ddEl.value = currentConsultation.urg_destino_detalle || "";

    // Detalles APNP
    ["tabaquismo","alcoholismo","toxicomanias","actfisica"].forEach(name => {
        const el = document.getElementById(name + "_detalle");
        if (el) el.value = currentConsultation[name + "_detalle"] || "";
    });
    // IMC
    calcIMC();
    
    // Fill nursing fields
    const nursingFields = [
        "enf_evolucion_clinica","enf_sv_tas","enf_sv_tad","enf_sv_fc","enf_sv_fr",
        "enf_sv_temp","enf_sv_spo2","enf_sv_glucemia","enf_sv_peso","enf_sv_talla",
        "enf_sv_dolor","enf_sv_habitus",
        "enf_exp_cabeza","enf_exp_torax","enf_exp_abdomen","enf_exp_extremidades",
        "enf_exp_neurologico","enf_exp_genitourinario","enf_exp_otros",
        "enf_observaciones","enf_procedimientos","enf_nota_imp"
    ];
    nursingFields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = currentConsultation[f] || "";
    });
    const enfImcEl = document.getElementById("enf_sv_imc");
    if (enfImcEl) enfImcEl.value = currentConsultation.enf_sv_imc || "";

    // Show/hide tabs based on role
    const tabHistoria = document.querySelector('.record-tab[data-tab="historia"]');
    const tabEvolucion = document.querySelector('.record-tab[data-tab="evolucion"]');
    const tabUrgencias = document.querySelector('.record-tab[data-tab="urgencias"]');
    if (tabEvolucion) {
        // Nursing tab always visible, but only enfermero navigates there by default
        tabEvolucion.style.display = "";
    }
    if (tabHistoria && tabUrgencias) {
        // Enfermero can still VIEW other tabs (read-only), but starts on enfermería
        if (can("canWriteNursingNotes") && !can("canWriteMedicalNotes")) {
            // Switch to nursing tab by default
            document.querySelectorAll(".record-tab-content").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".record-tab").forEach(b => b.classList.remove("active"));
            const tab = document.getElementById("tab-evolucion");
            if (tab) tab.classList.add("active");
            if (tabEvolucion) tabEvolucion.classList.add("active");
            currentTab = "evolucion";
        }
    }
    
    // Cargar diagnósticos CIE-10 seleccionados
    selectedDiagnosticos = (currentConsultation.diagnosticos_cie10 || []).map(d => ({...d}));
    renderDiagBadges();
    
    // Cargar información de firma
    const medEl = document.getElementById("firma_medico");
    if (medEl) medEl.value = currentConsultation.firma_medico || "";
    const cedulaEl = document.getElementById("firma_cedula");
    if (cedulaEl) cedulaEl.value = currentConsultation.firma_cedula || "";
    const tipoEl = document.getElementById("firma_tipo");
    if (tipoEl) tipoEl.value = currentConsultation.firma_tipo || "electronica";
    const fechaEl = document.getElementById("firma_fecha");
    if (fechaEl) fechaEl.value = currentConsultation.firma_fecha || "";
    
    // Mostrar/ocultar info de firma
    const firmaInfo = document.getElementById("firmaInfo");
    const btnFirmar = document.querySelector("button[onclick='firmarExpediente()']");
    const btnLimpiar = document.getElementById("btnLimpiarFirma");
    if (currentConsultation.firma_medico && currentConsultation.firma_fecha) {
        if (firmaInfo) {
            firmaInfo.style.display = "block";
            const infoText = document.getElementById("firmaInfoText");
            if (infoText) {
                infoText.innerHTML = `<div>Médico: ${currentConsultation.firma_medico}</div>
                <div>Firma: ${currentConsultation.firma_tipo || "electrónica"}</div>
                <div>Fecha: ${currentConsultation.firma_fecha}</div>`;
            }
        }
        if (btnFirmar) btnFirmar.style.display = "none";
        if (btnLimpiar) btnLimpiar.style.display = "block";
    } else {
        if (firmaInfo) firmaInfo.style.display = "none";
        if (btnFirmar) btnFirmar.style.display = "block";
        if (btnLimpiar) btnLimpiar.style.display = "none";
    }
}

function setRecordReadOnly(isReadOnly) {
    ALL_RECORD_FIELDS.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.disabled = isReadOnly;
    });
    document.querySelectorAll(".apnp-radios input, .pronostico-radios input, .destino-radios input").forEach(el => el.disabled = isReadOnly);
    document.querySelectorAll(".apnp-detail").forEach(el => el.disabled = isReadOnly);
    const addMedBtn = document.getElementById("btnAgregarMed");
    if (addMedBtn) addMedBtn.style.display = isReadOnly ? "none" : "";

    // Si es enfermero, habilitar sólo la pestaña de Nota de Enfermería
    if (can("canWriteNursingNotes") && !can("canWriteMedicalNotes")) {
        const nursingFields = [
            "enf_evolucion_clinica","enf_sv_tas","enf_sv_tad","enf_sv_fc","enf_sv_fr",
            "enf_sv_temp","enf_sv_spo2","enf_sv_glucemia","enf_sv_peso","enf_sv_talla",
            "enf_sv_dolor","enf_sv_habitus","enf_sv_imc",
            "enf_exp_cabeza","enf_exp_torax","enf_exp_abdomen","enf_exp_extremidades",
            "enf_exp_neurologico","enf_exp_genitourinario","enf_exp_otros",
            "enf_observaciones","enf_procedimientos","enf_nota_imp"
        ];
        nursingFields.forEach(f => {
            const el = document.getElementById(f);
            if (el) el.disabled = false;
        });
    }
}

function setupIMCCalc() {
    const peso = document.getElementById("sv_peso");
    const talla = document.getElementById("sv_talla");
    if (!peso || !talla) return;
    const handler = () => calcIMC();
    peso.removeEventListener("input", peso._imcHandler);
    talla.removeEventListener("input", talla._imcHandler);
    peso._imcHandler = handler;
    talla._imcHandler = handler;
    peso.addEventListener("input", handler);
    talla.addEventListener("input", handler);
}

function setupNursingIMCCalc() {
    const peso = document.getElementById("enf_sv_peso");
    const talla = document.getElementById("enf_sv_talla");
    if (!peso || !talla) return;
    const handler = () => {
        const p = parseFloat(peso.value);
        const t = parseFloat(talla.value);
        const imcEl = document.getElementById("enf_sv_imc");
        if (!imcEl) return;
        if (p && t) {
            const tm = t / 100;
            const imc = (p / (tm * tm)).toFixed(1);
            let cat = imc < 18.5 ? "Bajo peso" : imc < 25 ? "Normal" : imc < 30 ? "Sobrepeso" : "Obesidad";
            imcEl.value = `${imc} (${cat})`;
        } else { imcEl.value = ""; }
    };
    peso.removeEventListener("input", peso._enfImcHandler);
    talla.removeEventListener("input", talla._enfImcHandler);
    peso._enfImcHandler = handler;
    talla._enfImcHandler = handler;
    peso.addEventListener("input", handler);
    talla.addEventListener("input", handler);
}

function calcIMC() {
    const peso = parseFloat(document.getElementById("sv_peso")?.value);
    const talla = parseFloat(document.getElementById("sv_talla")?.value);
    const imcEl = document.getElementById("sv_imc");
    if (!imcEl) return;
    if (peso && talla) {
        const tallaM = talla / 100;
        const imc = (peso / (tallaM * tallaM)).toFixed(1);
        let cat = "";
        if (imc < 18.5) cat = "Bajo peso";
        else if (imc < 25) cat = "Normal";
        else if (imc < 30) cat = "Sobrepeso";
        else cat = "Obesidad";
        imcEl.value = `${imc} (${cat})`;
    } else {
        imcEl.value = "";
    }
}

// ===== MEDICAMENTOS =====
function agregarMedicamento() {
    if (!currentConsultation) return;
    if (!currentConsultation.medicamentos) currentConsultation.medicamentos = [];
    const med = { id: Date.now(), nombre: "", concentracion: "", dosis: "", via: "", frecuencia: "", duracion: "" };
    currentConsultation.medicamentos.push(med);
    saveConsultations();
    renderMedicamentos();
}

function renderMedicamentos() {
    const list = document.getElementById("medicamentosList");
    if (!list || !currentConsultation) return;
    const meds = currentConsultation.medicamentos || [];
    const isReadOnly = !can("canWriteMedicalNotes");

    if (meds.length === 0) {
        list.innerHTML = `<div class="med-empty">Sin medicamentos prescritos. Use el botón "Agregar medicamento" o el campo de texto libre abajo.</div>`;
        return;
    }

    list.innerHTML = meds.map((m, idx) => `
        <div class="med-row" data-id="${m.id}">
            <div class="med-num">${idx + 1}</div>
            <div class="med-fields">
                <input class="med-input" type="text" placeholder="Nombre del medicamento" value="${m.nombre||''}" ${isReadOnly?'disabled':''} onchange="updateMedicamento(${m.id},'nombre',this.value)">
                <input class="med-input med-conc" type="text" placeholder="Concentración" value="${m.concentracion||''}" ${isReadOnly?'disabled':''} onchange="updateMedicamento(${m.id},'concentracion',this.value)">
                <input class="med-input med-dosis" type="text" placeholder="Dosis" value="${m.dosis||''}" ${isReadOnly?'disabled':''} onchange="updateMedicamento(${m.id},'dosis',this.value)">
                <select class="med-input med-via" ${isReadOnly?'disabled':''} onchange="updateMedicamento(${m.id},'via',this.value)">
                    <option value="">Vía...</option>
                    <option ${m.via==='VO'?'selected':''}>VO</option>
                    <option ${m.via==='IV'?'selected':''}>IV</option>
                    <option ${m.via==='IM'?'selected':''}>IM</option>
                    <option ${m.via==='SC'?'selected':''}>SC</option>
                    <option ${m.via==='SL'?'selected':''}>SL</option>
                    <option ${m.via==='Tópica'?'selected':''}>Tópica</option>
                    <option ${m.via==='Inhalada'?'selected':''}>Inhalada</option>
                </select>
                <input class="med-input med-freq" type="text" placeholder="Frecuencia (ej: c/8h)" value="${m.frecuencia||''}" ${isReadOnly?'disabled':''} onchange="updateMedicamento(${m.id},'frecuencia',this.value)">
                <input class="med-input med-dur" type="text" placeholder="Duración (ej: 7 días)" value="${m.duracion||''}" ${isReadOnly?'disabled':''} onchange="updateMedicamento(${m.id},'duracion',this.value)">
            </div>
            ${!isReadOnly ? `<button class="med-delete" onclick="eliminarMedicamento(${m.id})" title="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>` : ''}
        </div>`).join("");
}

function updateMedicamento(id, field, value) {
    if (!currentConsultation) return;
    const med = (currentConsultation.medicamentos || []).find(m => m.id === id);
    if (med) { med[field] = value; saveConsultations(); }
}

function eliminarMedicamento(id) {
    if (!currentConsultation) return;
    currentConsultation.medicamentos = (currentConsultation.medicamentos || []).filter(m => m.id !== id);
    saveConsultations();
    renderMedicamentos();
}

// ===== GUARDAR RECORD =====
function setupRecordActions() {
    const el = document.getElementById("recordFormActions");
    if (!el) return;
    const headerEl = document.getElementById("recordHeaderActions");

    if (headerEl) headerEl.innerHTML = '';

    if (can("canWriteMedicalNotes")) {
        el.innerHTML = `
            <button class="btn-secondary" onclick="navigate('consultationHistory')">Cancelar</button>
            <button class="btn-secondary" onclick="abrevIniciarExport('patient')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                PDF Paciente</button>
            <button class="btn-secondary" onclick="abrevIniciarExport('doctor')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                PDF Médico</button>
            <button class="btn-secondary" onclick="saveRecord()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                Guardar</button>
            <button class="btn-primary" onclick="closeConsultation()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Marcar como Atendido</button>`;
    } else if (can("canWriteNursingNotes")) {
        el.innerHTML = `
            <button class="btn-secondary" onclick="navigate('consultationHistory')">Cancelar</button>
            <button class="btn-primary" onclick="saveNursingNote()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                Guardar Nota de Enfermería</button>`;
    } else {
        el.innerHTML = `
            <button class="btn-secondary" onclick="abrevIniciarExport('patient')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                PDF Paciente</button>
            <button class="btn-secondary" onclick="abrevIniciarExport('doctor')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                PDF Médico</button>
            <p class="readonly-note">Vista de solo lectura — Solo el médico puede editar notas clínicas.</p>`;
    }
}

function collectRecordFields() {
    if (!currentConsultation) return;
    ALL_RECORD_FIELDS.forEach(f => {
        const el = document.getElementById(f);
        if (el) currentConsultation[f] = el.value;
    });
    // Radios
    ["tabaquismo","alcoholismo","toxicomanias","actfisica"].forEach(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        if (checked) currentConsultation["radio_" + name] = checked.value;
        const detail = document.getElementById(name + "_detalle");
        if (detail) currentConsultation[name + "_detalle"] = detail.value;
    });
    const pronostico = document.querySelector('input[name="pronostico"]:checked');
    if (pronostico) currentConsultation.pronostico_radio = pronostico.value;
    const destino = document.querySelector('input[name="destino_urg"]:checked');
    if (destino) currentConsultation.destino_urg = destino.value;
    const dd = document.getElementById("urg_destino_detalle");
    if (dd) currentConsultation.urg_destino_detalle = dd.value;
    
    // Guardar datos de firma
    const cedulaEl = document.getElementById("firma_cedula");
    if (cedulaEl) currentConsultation.firma_cedula = cedulaEl.value;
    const tipoEl = document.getElementById("firma_tipo");
    if (tipoEl) currentConsultation.firma_tipo = tipoEl.value;
    
    // Guardar diagnósticos CIE-10 seleccionados
    currentConsultation.diagnosticos_cie10 = [...selectedDiagnosticos];
    
    currentConsultation.tipoNota = currentTab;
}

function saveRecord() {
    collectRecordFields();
    saveConsultations();
    showToast("Consulta guardada.", "success");
    showAutoSave();
}

function closeConsultation() {
    collectRecordFields();
    if (!currentConsultation) return;
    currentConsultation.status = "closed";
    if (currentPatient && currentConsultation.tratamiento) {
        currentPatient.currentTreatment = currentConsultation.tratamiento;
        savePatients();
    }
    saveConsultations();
    showToast("Consulta cerrada — paciente marcado como atendido.", "success");
    navigate("consultationHistory");
}

function saveNursingNote() {
    if (!currentConsultation) return;
    const nursingFields = [
        "enf_evolucion_clinica","enf_sv_tas","enf_sv_tad","enf_sv_fc","enf_sv_fr",
        "enf_sv_temp","enf_sv_spo2","enf_sv_glucemia","enf_sv_peso","enf_sv_talla",
        "enf_sv_dolor","enf_sv_habitus",
        "enf_exp_cabeza","enf_exp_torax","enf_exp_abdomen","enf_exp_extremidades",
        "enf_exp_neurologico","enf_exp_genitourinario","enf_exp_otros",
        "enf_observaciones","enf_procedimientos","enf_nota_imp"
    ];
    nursingFields.forEach(f => {
        const el = document.getElementById(f);
        if (el) currentConsultation[f] = el.value;
    });
    // Calcular IMC de enfermería
    const peso = parseFloat(document.getElementById("enf_sv_peso")?.value);
    const talla = parseFloat(document.getElementById("enf_sv_talla")?.value);
    if (peso && talla) {
        const tallaM = talla / 100;
        currentConsultation.enf_sv_imc = (peso / (tallaM * tallaM)).toFixed(1);
    }
    currentConsultation.nursingUpdatedBy = currentUser?.displayName;
    currentConsultation.nursingUpdatedAt = new Date().toISOString();
    saveConsultations();
    showToast("Nota de enfermería guardada correctamente.", "success");
    showAutoSave();
}

// ===== AUTORÍA Y FIRMA =====
function firmarExpediente() {
    if (!currentConsultation || !currentUser) return;
    if (!currentConsultation.tratamiento && !currentConsultation.diagnostico) {
        showToast("Por favor completa al menos el diagnóstico antes de firmar.", "error");
        return;
    }
    
    const tipo = document.getElementById("firma_tipo")?.value || "electronica";
    const cedula = document.getElementById("firma_cedula")?.value || "";
    const ahora = new Date().toLocaleString("es-MX", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    
    currentConsultation.firma_medico = currentUser.displayName;
    currentConsultation.firma_cedula = cedula;
    currentConsultation.firma_tipo = tipo;
    currentConsultation.firma_fecha = ahora;
    
    collectRecordFields();
    saveConsultations();
    fillRecordFields();
    showToast("Expediente firmado correctamente.", "success");
}

function limpiarFirma() {
    if (!currentConsultation) return;
    if (confirm("¿Estás seguro de que deseas remover la firma del expediente?")) {
        delete currentConsultation.firma_medico;
        delete currentConsultation.firma_cedula;
        delete currentConsultation.firma_tipo;
        delete currentConsultation.firma_fecha;
        saveConsultations();
        fillRecordFields();
        showToast("Firma removida del expediente.", "success");
    }
}

// ===== AUTOGUARDADO =====
function startAutoSave() {
    stopAutoSave();
    autoSaveTimer = setInterval(saveCurrentRecord, 30000);
}
function stopAutoSave() { if (autoSaveTimer) clearInterval(autoSaveTimer); }
function saveCurrentRecord() {
    if (!currentConsultation) return;
    collectRecordFields();
    saveConsultations();
    showAutoSave();
}
function setupAutoSaveEvents() {
    ALL_RECORD_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.removeEventListener("input", el._autosaveHandler);
        el._autosaveHandler = saveCurrentRecord;
        el.addEventListener("input", el._autosaveHandler);
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

function renderMedicalRecord() { return requireClinDataModule("consultation").renderMedicalRecord(); }
function fillRecordFields() { return requireClinDataModule("consultation").fillRecordFields(); }
function setRecordReadOnly(isReadOnly) { return requireClinDataModule("consultation").setRecordReadOnly(isReadOnly); }
function setupIMCCalc() { return requireClinDataModule("consultation").setupIMCCalc(); }
function setupNursingIMCCalc() { return requireClinDataModule("consultation").setupNursingIMCCalc(); }
function calcIMC() { return requireClinDataModule("consultation").calcIMC(); }
function agregarMedicamento() { return requireClinDataModule("consultation").agregarMedicamento(); }
function renderMedicamentos() { return requireClinDataModule("consultation").renderMedicamentos(); }
function updateMedicamento(id, field, value) { return requireClinDataModule("consultation").updateMedicamento(id, field, value); }
function eliminarMedicamento(id) { return requireClinDataModule("consultation").eliminarMedicamento(id); }
function setupRecordActions() { return requireClinDataModule("consultation").setupRecordActions(); }
function collectRecordFields() { return requireClinDataModule("consultation").collectRecordFields(); }
function saveRecord() { return requireClinDataModule("consultation").saveRecord(); }
function closeConsultation() { return requireClinDataModule("consultation").closeConsultation(); }
function saveNursingNote() { return requireClinDataModule("consultation").saveNursingNote(); }
function firmarExpediente() { return requireClinDataModule("consultation").firmarExpediente(); }
function limpiarFirma() { return requireClinDataModule("consultation").limpiarFirma(); }
function startAutoSave() { return requireClinDataModule("consultation").startAutoSave(); }
function stopAutoSave() { return requireClinDataModule("consultation").stopAutoSave(); }
function saveCurrentRecord() { return requireClinDataModule("consultation").saveCurrentRecord(); }
function setupAutoSaveEvents() { return requireClinDataModule("consultation").setupAutoSaveEvents(); }
function showAutoSave() { return requireClinDataModule("consultation").showAutoSave(); }

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
    const win = window.open("about:blank", "_blank");
    if (!win) return;
    win.document.write(`<img src="${a.data}" style="max-width:100%;height:auto;">`);
}

// =============================================
//  EDITAR DATOS DEL PACIENTE
// =============================================
function openEditPatientModal() { return requireClinDataModule("patients").openEditPatientModal(); }
function saveEditedPatient() { return requireClinDataModule("patients").saveEditedPatient(); }

// =============================================
//  TRIAGE
// =============================================
function calcularTriage() { return requireClinDataModule("triage").calcularTriage(); }
function clearTriageForm() { return requireClinDataModule("triage").clearTriageForm(); }
function renderTriageList() { return requireClinDataModule("triage").renderTriageList(); }
function attendTriage(triageId) { return requireClinDataModule("triage").attendTriage(triageId); }
function dismissTriage(triageId) { return requireClinDataModule("triage").dismissTriage(triageId); }

// =============================================
//  ADMIN DE USUARIOS
// =============================================
function renderUserTable() {
    const container = document.getElementById("userTable");
    if (!container) return;
    const roleLabels = { medico:"Médico/a", enfermero:"Enfermero/a", recepcion:"Recepción", admin:"Administrador" };
    const roleClasses = { medico:"role-medico-pill", enfermero:"role-enfermero-pill", recepcion:"role-recepcion-pill", admin:"role-admin-pill" };
    container.innerHTML = `
        <table class="user-table">
            <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Consultorio</th><th>Acciones</th></tr></thead>
            <tbody>${systemUsers.map(u=>`
                <tr>
                    <td><code class="username-code">${u.username}</code></td>
                    <td>${u.displayName}</td>
                    <td><span class="role-pill ${roleClasses[u.role]||''}">${roleLabels[u.role]||u.role}</span></td>
                    <td>${u.consultorio ? `<span class="consultorio-tag">${u.consultorio}</span>` : '<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>
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
    const consultorioEl = document.getElementById("modalConsultorio");
    if (consultorioEl) {
        const opts = consultorios.filter(c => c.activo).map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join("");
        consultorioEl.innerHTML = `<option value="">Sin asignar</option>${opts}`;
        consultorioEl.value = "";
    }
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
    const consultorioEl = document.getElementById("modalConsultorio");
    if (consultorioEl) {
        // Populate options
        const opts = consultorios.filter(c => c.activo).map(c => `<option value="${c.nombre}" ${u.consultorio === c.nombre ? 'selected' : ''}>${c.nombre}</option>`).join("");
        consultorioEl.innerHTML = `<option value="">Sin asignar</option>${opts}`;
        consultorioEl.value = u.consultorio || "";
    }
    document.getElementById("userModal").classList.remove("hidden");
}

function saveUserFromModal() {
    const id = document.getElementById("editUserId").value;
    const displayName = document.getElementById("modalDisplayName").value.trim();
    const username    = document.getElementById("modalUsername").value.trim();
    const password    = document.getElementById("modalPassword").value;
    const role        = document.getElementById("modalRole").value;
    const consultorio = document.getElementById("modalConsultorio")?.value || "";

    if (!displayName||!username||!role) { showToast("Completa todos los campos obligatorios.", "error"); return; }
    if (!id && !password) { showToast("La contraseña es obligatoria para un usuario nuevo.", "error"); return; }
    if (password && password.length < 8) { showToast("La contraseña debe tener al menos 8 caracteres.", "error"); return; }

    const duplicate = systemUsers.find(u => u.username===username && u.id != id);
    if (duplicate) { showToast("Ese nombre de usuario ya existe.", "error"); return; }

    if (id) {
        const u = systemUsers.find(x=>x.id==id);
        if (u) { u.displayName=displayName; u.username=username; u.role=role; u.consultorio=consultorio; if(password) u.password=password; }
    } else {
        systemUsers.push({ id: Date.now(), username, password, role, displayName, consultorio });
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
function closeModal(id) { return requireClinDataModule("utils").closeModal(id); }

// =============================================
//  AUTOCOMPLETADO Y ABREVIATURAS
// =============================================
const suggestionsDB = [
    "diabetes mellitus tipo 2","diabetes mellitus tipo 1","diabetes gestacional",
    "hipertensión arterial sistémica","insuficiencia renal crónica","insuficiencia renal aguda",
    "dolor torácico","fiebre sin foco aparente","cefalea tensional","infección respiratoria aguda",
    "gastritis crónica","asma bronquial","neumonía adquirida en la comunidad","infección urinaria",
    "apendicitis aguda","fractura","enfermedad pulmonar obstructiva crónica","hipotiroidismo",
    "hipertiroidismo","anemia","insuficiencia cardíaca","infarto agudo de miocardio","accidente cerebrovascular",
    "pancreatitis aguda","colecistitis aguda","apendicitis","celulitis","dermatitis","conjuntivitis",
    "otitis media aguda","faringoamigdalitis","sinusitis aguda","bronquitis aguda"
];
const ABBR_MAX_LENGTH = 4;
const COMMON_UPPER_NOT_ABBR = new Set(["TOS","MODO","SECA","CUELLO","COMIDA","CHINA","MIXTA","SIDA","FEM","RIN","PIEL","LIMA","HAYA","BIEN","PARA","CASO","SOLO","SINO","HORA","TIPO","AREA","LADO"]);

const abbreviations = {
    "DM":"diabetes mellitus","HTA":"hipertensión arterial","FC":"frecuencia cardiaca",
    "TA":"tensión arterial","FR":"frecuencia respiratoria","ICC":"insuficiencia cardíaca congestiva",
    "ERC":"enfermedad renal crónica","IRA":"insuficiencia renal aguda","IAM":"infarto agudo de miocardio",
    "ACV":"accidente cerebrovascular","EVC":"evento vascular cerebral","IVU":"infección de vías urinarias",
    "PCR":"proteína C reactiva","BH":"biometría hemática","QS":"química sanguínea","EGO":"examen general de orina",
    "TX":"tratamiento","DX":"diagnóstico","RX":"radiografía","HB":"hemoglobina","HT":"hematocrito",
    "VO":"vía oral","IV":"vía intravenosa","SC":"vía subcutánea","IM":"vía intramuscular",
    "C/8H":"cada 8 horas","C/12H":"cada 12 horas","C/24H":"cada 24 horas",
    "EPOC":"enfermedad pulmonar obstructiva crónica","SPO2":"saturación de oxígeno",
    "TAS":"tensión arterial sistólica","TAD":"tensión arterial diastólica",
    "AHF":"antecedentes heredofamiliares","APP":"antecedentes personales patológicos",
    "APNP":"antecedentes personales no patológicos","IMC":"índice de masa corporal"
};

function getLastWord(t){const w=t.split(" ");return w[w.length-1].toLowerCase();}
function getSuggestions(w){
    if(w.length<2) return [];
    const q=w.toLowerCase();
    return suggestionsDB
        .filter(i=>i.toLowerCase().startsWith(q))
        .slice(0,6);
}

function applySuggestion(input,s){const w=input.value.split(" ");w.pop();w.push(s);input.value=w.join(" ")+" ";input.focus();}

function highlightText(text){ return requireClinDataModule("exporter").highlightText(text); }

function setupAbbreviationDetection() {
    const input=document.getElementById("diagnostico"), preview=document.getElementById("diagnosticoPreview");
    if(!input||!preview) return;
    input.removeEventListener("input",input._abbrevHandler);
    input._abbrevHandler=()=>{
        const text=input.value;
        const regex = /\b([A-ZÁÉÍÓÚÜÑ0-9\/]{2,4})\b/g;
        const hasAbbr = Array.from(text.matchAll(regex)).some(m=>{
            const candidate = m[1].toUpperCase();
            return !COMMON_UPPER_NOT_ABBR.has(candidate) && !/^[0-9]+$/.test(candidate);
        });

        if(hasAbbr && text.length>0){
            preview.style.display="block";
            preview.innerHTML=`<span class="preview-label">Vista previa:</span> `+highlightText(text);
        } else {
            preview.style.display="none";
        }
    };
    input.addEventListener("input",input._abbrevHandler);
}

function expandAbbreviations(text,mode="patient"){ return requireClinDataModule("exporter").expandAbbreviations(text,mode); }

// =============================================
//  AUTOCOMPLETADO CIE-10 - DIAGNÓSTICOS
// =============================================

let cie10Cache = [];
let cie10CacheLoaded = false;
let currentAutocompleteTextarea = null;
let currentDiagSuggestions = [];
let diagAutocompleteClickBound = false;

async function loadCie10Cache() { return requireClinDataModule("diagnostics").loadCie10Cache(); }
function searchCie10Local(query) { return requireClinDataModule("diagnostics").searchCie10Local(query); }

function escapeRegExp(text) { return requireClinDataModule("utils").escapeRegExp(text); }
function escapeHtml(text) { return requireClinDataModule("utils").escapeHtml(text); }

function ensureAutocompleteUI() { return requireClinDataModule("diagnostics").ensureAutocompleteUI(); }
function getDiagSuggestionText(item) { return requireClinDataModule("diagnostics").getDiagSuggestionText(item); }
function getDiagSearchQuery(input) { return requireClinDataModule("diagnostics").getDiagSearchQuery(input); }
function upsertSelectedDiagnostico(item) { return requireClinDataModule("diagnostics").upsertSelectedDiagnostico(item); }
function applyDiagSuggestion(index) { return requireClinDataModule("diagnostics").applyDiagSuggestion(index); }
function getDiagSuggestionBox(input) { return requireClinDataModule("diagnostics").getDiagSuggestionBox(input); }
function showDiagSuggestions(results, input) { return requireClinDataModule("diagnostics").showDiagSuggestions(results, input); }
function initDiagnosticoAutocomplete() { return requireClinDataModule("diagnostics").initDiagnosticoAutocomplete(); }
function renderDiagBadges() { return requireClinDataModule("diagnostics").renderDiagBadges(); }
function removeDiag(idx) { return requireClinDataModule("diagnostics").removeDiag(idx); }
function hideSuggestions(input = null) { return requireClinDataModule("diagnostics").hideSuggestions(input); }

function debounceAutocomplete(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function handleTextareaAutocompleteKey(e) { return requireClinDataModule("diagnostics").handleTextareaAutocompleteKey(e); }
function debounce(func, wait) { return requireClinDataModule("diagnostics").debounce(func, wait); }

// =============================================
//  EXPORTAR PDF  (NOM-004-SSA3-2012)
// =============================================
function exportPDF(type) { return requireClinDataModule("exporter").exportPDF(type); }

function getExpandedPrintableText(text, type, replacements = {}) { return requireClinDataModule("exporter").getExpandedPrintableText(text, type, replacements); }

function getPrintableSections(type = "patient", replacements = {}) { return requireClinDataModule("exporter").getPrintableSections(type, replacements); }

function openPrintableRecord(type = "patient", extras = {}, replacements = {}) { return requireClinDataModule("exporter").openPrintableRecord(type, extras, replacements); }

// =============================================
//  CONSULTORIOS
// =============================================
let consultorios = JSON.parse(localStorage.getItem("cd_consultorios")) || [
    { id: 1, nombre: "Consultorio 1", descripcion: "Medicina General", activo: true },
    { id: 2, nombre: "Consultorio 2", descripcion: "Pediatría", activo: true },
    { id: 3, nombre: "Consultorio 3", descripcion: "Ginecología", activo: true },
];
function saveConsultorios() { localStorage.setItem("cd_consultorios", JSON.stringify(consultorios)); }

function renderNewPatientConsultorioSelect() { return requireClinDataModule("patients").renderNewPatientConsultorioSelect(); }

function renderConsultorios() {
    const container = document.getElementById("consultoriosSection");
    if (!container) return;

    const medicos = systemUsers.filter(u => u.role === "medico");
    const allPatients = patients;

    container.querySelector(".consultorios-content") && container.querySelector(".consultorios-content").remove();

    const div = document.createElement("div");
    div.className = "consultorios-content";
    div.innerHTML = `
        <div class="section-header">
            <div>
                <h2>Gestión de Consultorios</h2>
                <p class="section-subtitle">Asigna médicos y pacientes a cada consultorio</p>
            </div>
            <button class="btn-primary" onclick="openAddConsultorioModal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo consultorio
            </button>
        </div>
        <div class="consultorios-grid">
            ${consultorios.filter(c => c.activo).map(c => {
                const assignedMedicos = medicos.filter(m => m.consultorio === c.nombre);
                const assignedPatients = allPatients.filter(p => p.consultorio === c.nombre);
                return `
                <div class="consultorio-card">
                    <div class="consultorio-card-header">
                        <div class="consultorio-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></svg>
                        </div>
                        <div class="consultorio-info">
                            <div class="consultorio-nombre">${c.nombre}</div>
                            <div class="consultorio-desc">${c.descripcion}</div>
                        </div>
                        <button class="btn-table-delete" onclick="eliminarConsultorio(${c.id})" title="Eliminar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                        </button>
                    </div>
                    <div class="consultorio-section-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
                        Médico(s) asignado(s)
                    </div>
                    <div class="consultorio-assign-area">
                        ${assignedMedicos.length === 0 ? `<p class="consultorio-empty">Sin médico asignado</p>` : ""}
                        ${assignedMedicos.map(m => `
                            <div class="consultorio-assignee">
                                <span class="consultorio-assignee-avatar">${m.displayName.charAt(0)}</span>
                                <span>${m.displayName}</span>
                                <button class="assignee-remove" onclick="desasignarMedicoConsultorio(${m.id})" title="Remover">×</button>
                            </div>`).join("")}
                        <select class="consultorio-select" onchange="asignarMedicoConsultorio(${c.id}, this.value); this.value=''">
                            <option value="">+ Asignar médico...</option>
                            ${medicos.filter(m => m.consultorio !== c.nombre).map(m => `<option value="${m.id}">${m.displayName}</option>`).join("")}
                        </select>
                    </div>
                    <div class="consultorio-section-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        Pacientes asignados <span class="consult-count">${assignedPatients.length}</span>
                    </div>
                    <div class="consultorio-assign-area">
                        ${assignedPatients.length === 0 ? `<p class="consultorio-empty">Sin pacientes asignados</p>` : ""}
                        ${assignedPatients.slice(0,5).map(p => `
                            <div class="consultorio-assignee">
                                <span class="consultorio-assignee-avatar pat-av">${p.name.charAt(0)}</span>
                                <span>${p.name}</span>
                                <button class="assignee-remove" onclick="desasignarPacienteConsultorio(${p.id})" title="Remover">×</button>
                            </div>`).join("")}
                        ${assignedPatients.length > 5 ? `<p class="consultorio-empty">... y ${assignedPatients.length - 5} más</p>` : ""}
                        <select class="consultorio-select" onchange="asignarPacienteConsultorio(${c.id}, this.value); this.value=''">
                            <option value="">+ Asignar paciente...</option>
                            ${allPatients.filter(p => p.consultorio !== c.nombre).map(p => `<option value="${p.id}">${p.name}</option>`).join("")}
                        </select>
                    </div>
                </div>`;
            }).join("")}
        </div>
    `;
    container.appendChild(div);
}

function asignarMedicoConsultorio(consultorioId, userId) {
    if (!userId) return;
    const c = consultorios.find(x => x.id === consultorioId);
    const u = systemUsers.find(x => x.id == userId);
    if (!c || !u) return;
    u.consultorio = c.nombre;
    saveSystemUsers();
    renderConsultorios();
    showToast(`${u.displayName} asignado a ${c.nombre}`, "success");
}

function desasignarMedicoConsultorio(userId) {
    const u = systemUsers.find(x => x.id == userId);
    if (!u) return;
    u.consultorio = "";
    saveSystemUsers();
    renderConsultorios();
}

function asignarPacienteConsultorio(consultorioId, patientId) {
    if (!patientId) return;
    const c = consultorios.find(x => x.id === consultorioId);
    const p = patients.find(x => x.id == patientId);
    if (!c || !p) return;
    p.consultorio = c.nombre;
    savePatients();
    renderConsultorios();
    showToast(`${p.name} asignado a ${c.nombre}`, "success");
}

function desasignarPacienteConsultorio(patientId) {
    const p = patients.find(x => x.id == patientId);
    if (!p) return;
    p.consultorio = "";
    savePatients();
    renderConsultorios();
}

function openAddConsultorioModal() {
    const nombre = prompt("Nombre del consultorio (ej: Consultorio 4):");
    if (!nombre || !nombre.trim()) return;
    const desc = prompt("Especialidad o descripción:") || "";
    consultorios.push({ id: Date.now(), nombre: nombre.trim(), descripcion: desc.trim(), activo: true });
    saveConsultorios();
    renderConsultorios();
    showToast("Consultorio agregado.", "success");
}

function eliminarConsultorio(id) {
    const c = consultorios.find(x => x.id === id);
    if (!c) return;
    if (!confirm(`¿Eliminar ${c.nombre}? Se desasignarán médicos y pacientes.`)) return;
    c.activo = false;
    // Desasignar
    systemUsers.filter(u => u.consultorio === c.nombre).forEach(u => u.consultorio = "");
    patients.filter(p => p.consultorio === c.nombre).forEach(p => p.consultorio = "");
    saveConsultorios(); saveSystemUsers(); savePatients();
    renderConsultorios();
    showToast("Consultorio eliminado.", "success");
}

// =============================================
//  UTILIDADES
// =============================================
function formatDate(iso){ return requireClinDataModule("utils").formatDate(iso); }
function formatDateFull(iso){ return requireClinDataModule("utils").formatDateFull(iso); }
function formatTime(iso){ return requireClinDataModule("utils").formatTime(iso); }
function showToast(message,type="info"){ return requireClinDataModule("utils").showToast(message,type); }

// =============================================
//  COLLAPSIBLE SECTIONS
// =============================================
function initializeCollapsibleSections() {
    const collapsedStates = JSON.parse(localStorage.getItem("cd_collapsed_sections") || "{}");
    const sections = document.querySelectorAll(".record-section-card");
    let sectionIndex = 0;
    
    sections.forEach((section) => {
        const sectionId = `sec_${sectionIndex++}`;
        const title = section.querySelector(".record-section-title");
        if (!title || title.querySelector(".record-section-collapse-btn")) return; // Ya inicializado
        
        // Crear botón de collapse
        const btn = document.createElement("button");
        btn.className = "record-section-collapse-btn";
        btn.type = "button";
        btn.setAttribute("data-section-id", sectionId);
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            section.classList.toggle("collapsed");
            collapsedStates[sectionId] = section.classList.contains("collapsed");
            localStorage.setItem("cd_collapsed_sections", JSON.stringify(collapsedStates));
        };
        
        title.appendChild(btn);
        
        // Envolver contenido después del título en una clase record-section-body
        if (!section.querySelector(".record-section-body")) {
            const body = document.createElement("div");
            body.className = "record-section-body";
            const children = Array.from(section.children);
            children.forEach(child => {
                if (child !== title) {
                    body.appendChild(child);
                }
            });
            section.appendChild(body);
        }
        
        // Restaurar estado guardado
        if (collapsedStates[sectionId]) {
            section.classList.add("collapsed");
        }
    });
}

// Inicializar cuando se renderiza el expediente
const _origRenderMedicalRecord = window.renderMedicalRecord || function() {};
window.renderMedicalRecord = function() {
    const result = _origRenderMedicalRecord.apply(this, arguments);
    setTimeout(() => {
        initializeCollapsibleSections();
        setupSelectableRadioCards();
    }, 50);
    return result;
};
