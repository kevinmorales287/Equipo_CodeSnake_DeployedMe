// =============================================
//  ClinData — script.js
//  Sistema de Expediente Clínico Electrónico
// =============================================

// ===== USUARIOS DEL SISTEMA =====
// En producción esto debe venir de un backend seguro con hashing
const USERS = [
    { username: "medico",    password: "clindata2026", role: "medico",    displayName: "Dr. Administrador" },
    { username: "enfermero", password: "clindata2026", role: "enfermero", displayName: "Enf. Administrador" }
];

// ===== ESTADO GLOBAL =====
let currentUser    = null;
let currentPatient = null;
let currentConsultation = null;
let autoSaveTimer  = null;

// ===== DATOS PERSISTENTES =====
let patients      = JSON.parse(localStorage.getItem("cd_patients"))  || [];
let consultations = JSON.parse(localStorage.getItem("cd_consults"))  || [];
let triageQueue   = JSON.parse(localStorage.getItem("cd_triage"))    || [];

function savePatients()      { localStorage.setItem("cd_patients", JSON.stringify(patients)); }
function saveConsultations() { localStorage.setItem("cd_consults",  JSON.stringify(consultations)); }
function saveTriageQueue()   { localStorage.setItem("cd_triage",    JSON.stringify(triageQueue)); }

// =============================================
//  AUTENTICACIÓN
// =============================================
function handleLogin() {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value;

    const user = USERS.find(x => x.username === u && x.password === p);
    if (!user) {
        document.getElementById("loginError").classList.remove("hidden");
        document.getElementById("loginPass").value = "";
        return;
    }

    currentUser = user;
    sessionStorage.setItem("cd_session", JSON.stringify(user));

    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appShell").classList.remove("hidden");

    document.getElementById("userDisplayName").textContent = user.displayName;
    document.getElementById("userRoleBadge").textContent = user.role === "medico" ? "Médico" : "Enfermero";
    document.getElementById("userAvatar").textContent = user.displayName.charAt(0).toUpperCase();

    navigate("patients");
}

function handleLogout() {
    sessionStorage.removeItem("cd_session");
    currentUser = null;
    currentPatient = null;
    currentConsultation = null;
    stopAutoSave();

    document.getElementById("appShell").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginError").classList.add("hidden");
}

function togglePassword() {
    const input = document.getElementById("loginPass");
    input.type = input.type === "password" ? "text" : "password";
}

// Verificar sesión al cargar
window.addEventListener("DOMContentLoaded", () => {
    const saved = sessionStorage.getItem("cd_session");
    if (saved) {
        currentUser = JSON.parse(saved);
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("appShell").classList.remove("hidden");
        document.getElementById("userDisplayName").textContent = currentUser.displayName;
        document.getElementById("userRoleBadge").textContent = currentUser.role === "medico" ? "Médico" : "Enfermero";
        document.getElementById("userAvatar").textContent = currentUser.displayName.charAt(0).toUpperCase();
        navigate("patients");
    }

    document.getElementById("loginPass").addEventListener("keydown", e => {
        if (e.key === "Enter") handleLogin();
    });
    document.getElementById("loginUser").addEventListener("keydown", e => {
        if (e.key === "Enter") document.getElementById("loginPass").focus();
    });
    document.getElementById("search").addEventListener("input", function() {
        searchPatients(this.value.toLowerCase());
    });
});

// =============================================
//  NAVEGACIÓN
// =============================================
function navigate(section) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    stopAutoSave();

    const map = {
        patients:           "patientsSection",
        newPatient:         "newPatientSection",
        consultationHistory:"consultationHistorySection",
        medicalRecord:      "medicalRecordSection",
        triage:             "triageSection",
        triageList:         "triageListSection"
    };

    const navMap = {
        patients:           "nav-patients",
        newPatient:         "nav-newPatient",
        consultationHistory:"nav-patients",
        medicalRecord:      "nav-patients",
        triage:             "nav-triage",
        triageList:         "nav-triageList"
    };

    if (map[section]) document.getElementById(map[section]).classList.add("active");
    if (navMap[section]) {
        const btn = document.getElementById(navMap[section]);
        if (btn) btn.classList.add("active");
    }

    if (section === "patients")           renderPatients();
    if (section === "consultationHistory") renderConsultationHistory();
    if (section === "triageList")         renderTriageList();
}

// =============================================
//  PACIENTES
// =============================================
function submitPatient() {
    const name    = document.getElementById("name").value.trim();
    const age     = document.getElementById("age").value;
    const sex     = document.getElementById("sex").value;
    const address = document.getElementById("address").value.trim();
    const phone   = document.getElementById("phone").value.trim();
    const dob     = document.getElementById("dob").value;

    if (!name || !age || !sex || !address) {
        showToast("Completa los campos obligatorios.", "error");
        return;
    }

    const patient = {
        id: Date.now(),
        name, age, sex, address, phone, dob,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.username
    };

    patients.push(patient);
    savePatients();
    showToast("Paciente registrado correctamente.", "success");

    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("sex").value = "";
    document.getElementById("address").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("dob").value = "";

    navigate("patients");
}

function renderPatients(customList = null) {
    const container = document.getElementById("patientList");
    const list = customList !== null ? customList : patients;

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <p>${customList !== null ? "No se encontraron resultados" : "No hay pacientes registrados"}</p>
                ${customList === null ? `<button class="btn-primary" onclick="navigate('newPatient')">Registrar primer paciente</button>` : ""}
            </div>`;
        return;
    }

    container.innerHTML = list.map(p => {
        const initials = p.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
        const age = p.age;
        const consults = consultations.filter(c => c.patientId === p.id).length;
        const lastConsult = consultations.filter(c => c.patientId === p.id).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
        const lastDate = lastConsult ? formatDate(lastConsult.date) : "Sin consultas";

        return `
        <div class="patient-card" onclick="openPatientRecord(${p.id})">
            <div class="patient-avatar">${initials}</div>
            <div class="patient-info">
                <div class="patient-name">${p.name}</div>
                <div class="patient-meta">
                    <span>${p.age} años</span>
                    <span class="dot">·</span>
                    <span>${p.sex}</span>
                    <span class="dot">·</span>
                    <span>${p.address}</span>
                </div>
            </div>
            <div class="patient-stats">
                <div class="stat-item">
                    <span class="stat-value">${consults}</span>
                    <span class="stat-label">consultas</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value last-date">${lastDate}</span>
                    <span class="stat-label">última visita</span>
                </div>
            </div>
            <div class="patient-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
        </div>`;
    }).join("");
}

function searchPatients(query) {
    if (!query) { renderPatients(); return; }
    const results = patients.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.age.toString().includes(query) ||
        p.sex.toLowerCase().includes(query)
    );
    renderPatients(results);
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
    document.getElementById("historyPatientInfo").textContent =
        `${currentPatient.age} años · ${currentPatient.sex} · ${currentPatient.address}`;

    // Patient summary
    const patientConsults = consultations.filter(c => c.patientId === currentPatient.id);
    document.getElementById("patientSummaryCard").innerHTML = `
        <div class="summary-item">
            <div class="summary-icon">🎂</div>
            <div>
                <div class="summary-label">Edad</div>
                <div class="summary-value">${currentPatient.age} años</div>
            </div>
        </div>
        <div class="summary-item">
            <div class="summary-icon">⚧</div>
            <div>
                <div class="summary-label">Sexo biológico</div>
                <div class="summary-value">${currentPatient.sex}</div>
            </div>
        </div>
        <div class="summary-item">
            <div class="summary-icon">📅</div>
            <div>
                <div class="summary-label">Fecha de nacimiento</div>
                <div class="summary-value">${currentPatient.dob ? formatDate(currentPatient.dob) : "No registrada"}</div>
            </div>
        </div>
        <div class="summary-item">
            <div class="summary-icon">📞</div>
            <div>
                <div class="summary-label">Teléfono</div>
                <div class="summary-value">${currentPatient.phone || "No registrado"}</div>
            </div>
        </div>
        <div class="summary-item">
            <div class="summary-icon">📊</div>
            <div>
                <div class="summary-label">Total de consultas</div>
                <div class="summary-value">${patientConsults.length}</div>
            </div>
        </div>
    `;

    document.getElementById("consultCount").textContent =
        `${patientConsults.length} consulta${patientConsults.length !== 1 ? "s" : ""}`;

    const sorted = [...patientConsults].sort((a, b) => new Date(b.date) - new Date(a.date));
    const container = document.getElementById("consultationList");

    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                <p>Este paciente aún no tiene consultas registradas</p>
                <button class="btn-primary" onclick="createNewConsultation()">Registrar primera consulta</button>
            </div>`;
        return;
    }

    container.innerHTML = sorted.map((c, idx) => {
        const num = sorted.length - idx;
        const diagPreview = c.diagnostico
            ? c.diagnostico.substring(0, 80) + (c.diagnostico.length > 80 ? "..." : "")
            : "Sin diagnóstico registrado";
        const tratPreview = c.tratamiento
            ? c.tratamiento.substring(0, 60) + (c.tratamiento.length > 60 ? "..." : "")
            : "Sin tratamiento registrado";
        const hasTriage = c.triageLevel ? `<span class="triage-badge triage-${c.triageLevel.toLowerCase()}">${c.triageLevel}</span>` : "";

        return `
        <div class="consult-card" onclick="openConsultation(${c.id})">
            <div class="consult-card-left">
                <div class="consult-number">Consulta ${num}</div>
                <div class="consult-date">${formatDateFull(c.date)}</div>
                ${hasTriage}
            </div>
            <div class="consult-card-body">
                <div class="consult-field">
                    <span class="consult-field-label">Diagnóstico</span>
                    <span class="consult-field-value">${diagPreview}</span>
                </div>
                <div class="consult-field">
                    <span class="consult-field-label">Tratamiento</span>
                    <span class="consult-field-value">${tratPreview}</span>
                </div>
            </div>
            <div class="consult-card-right">
                <div class="consult-author">${c.createdBy || "Sistema"}</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
        </div>`;
    }).join("");
}

function createNewConsultation() {
    if (!currentPatient) return;

    const consult = {
        id: Date.now(),
        patientId: currentPatient.id,
        date: new Date().toISOString(),
        createdBy: currentUser?.displayName || "Sistema",
        interrogatorio: "",
        antecedentes: "",
        padecimiento: "",
        exploracion: "",
        diagnostico: "",
        tratamiento: "",
        triageLevel: null,
        triageData: null
    };

    consultations.push(consult);
    saveConsultations();
    currentConsultation = consult;
    navigate("medicalRecord");
    renderMedicalRecord();
}

function openConsultation(consultId) {
    currentConsultation = consultations.find(c => c.id === consultId);
    if (!currentConsultation) return;
    navigate("medicalRecord");
    renderMedicalRecord();
}

// =============================================
//  EXPEDIENTE / CONSULTA
// =============================================
function renderMedicalRecord() {
    if (!currentConsultation || !currentPatient) return;

    document.getElementById("patientName").textContent = currentPatient.name;
    document.getElementById("consultationDateLabel").textContent =
        "Consulta del " + formatDateFull(currentConsultation.date);

    document.getElementById("interrogatorio").value = currentConsultation.interrogatorio || "";
    document.getElementById("antecedentes").value   = currentConsultation.antecedentes   || "";
    document.getElementById("padecimiento").value   = currentConsultation.padecimiento   || "";
    document.getElementById("exploracion").value    = currentConsultation.exploracion    || "";
    document.getElementById("diagnostico").value    = currentConsultation.diagnostico    || "";
    document.getElementById("tratamiento").value    = currentConsultation.tratamiento    || "";

    // Mostrar banner si hay triage
    const banner = document.getElementById("triageAlertBanner");
    if (currentConsultation.triageLevel && currentConsultation.triageData) {
        const td = currentConsultation.triageData;
        banner.className = `triage-alert-banner triage-banner-${td.color}`;
        banner.classList.remove("hidden");
        banner.innerHTML = `
            <strong>Triage:</strong> Nivel ${td.number} — ${td.label}
            &nbsp;·&nbsp; Motivo: ${td.reason || "—"}
            &nbsp;·&nbsp; FC: ${td.vitals?.FC || "—"} lpm &nbsp; TA: ${td.vitals?.TAS || "—"}/${td.vitals?.TAD || "—"} mmHg &nbsp; SpO₂: ${td.vitals?.spo2 || "—"}%
        `;
    } else {
        banner.classList.add("hidden");
    }

    setupAutocomplete();
    setupAbbreviationDetection();
    startAutoSave();
    setupAutoSaveEvents();
}

function saveRecord() {
    if (!currentConsultation) return;

    currentConsultation.interrogatorio = document.getElementById("interrogatorio").value;
    currentConsultation.antecedentes   = document.getElementById("antecedentes").value;
    currentConsultation.padecimiento   = document.getElementById("padecimiento").value;
    currentConsultation.exploracion    = document.getElementById("exploracion").value;
    currentConsultation.diagnostico    = document.getElementById("diagnostico").value;
    currentConsultation.tratamiento    = document.getElementById("tratamiento").value;

    saveConsultations();
    showToast("Consulta guardada correctamente.", "success");
    showAutoSave();
}

// ===== AUTOGUARDADO =====
function startAutoSave() {
    stopAutoSave();
    autoSaveTimer = setInterval(saveCurrentRecord, 30000);
}

function stopAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
}

function saveCurrentRecord() {
    if (!currentConsultation) return;
    currentConsultation.interrogatorio = document.getElementById("interrogatorio").value;
    currentConsultation.antecedentes   = document.getElementById("antecedentes").value;
    currentConsultation.padecimiento   = document.getElementById("padecimiento").value;
    currentConsultation.exploracion    = document.getElementById("exploracion").value;
    currentConsultation.diagnostico    = document.getElementById("diagnostico").value;
    currentConsultation.tratamiento    = document.getElementById("tratamiento").value;
    saveConsultations();
    showAutoSave();
}

function setupAutoSaveEvents() {
    ["interrogatorio","antecedentes","padecimiento","exploracion","diagnostico","tratamiento"].forEach(id => {
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
    setTimeout(() => {
        el.textContent = "Guardado";
        if (dot) dot.style.background = "#22c55e";
    }, 800);
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

    if (!name || !age || !reason) {
        showToast("Completa nombre, edad y motivo de consulta.", "error");
        return;
    }

    // ===== ALGORITMO DE TRIAGE (Manchester adaptado) =====
    let score = 0;
    let flags = [];

    // Síntomas críticos (ROJO)
    if (document.getElementById("sym_inconsciencia").checked) { score += 100; flags.push("Inconsciencia"); }
    if (document.getElementById("sym_paro").checked)          { score += 100; flags.push("Paro cardiorrespiratorio"); }

    // Síntomas urgentes (NARANJA)
    if (document.getElementById("sym_dificultad_resp").checked)  { score += 50; flags.push("Dificultad respiratoria severa"); }
    if (document.getElementById("sym_dolor_toracico").checked)   { score += 50; flags.push("Dolor torácico intenso"); }
    if (document.getElementById("sym_convulsiones").checked)     { score += 50; flags.push("Convulsiones"); }
    if (document.getElementById("sym_sangrado_mayor").checked)   { score += 50; flags.push("Sangrado mayor"); }

    // Signos vitales críticos
    if (vitals.FC !== null && (vitals.FC < 40 || vitals.FC > 150))  { score += 50; flags.push("FC crítica"); }
    if (vitals.spo2 !== null && vitals.spo2 < 90)                   { score += 50; flags.push("SpO₂ <90%"); }
    if (vitals.TAS !== null && (vitals.TAS < 80 || vitals.TAS > 200)){ score += 40; flags.push("TA crítica"); }
    if (vitals.FR !== null && (vitals.FR < 8 || vitals.FR > 30))    { score += 40; flags.push("FR anormal"); }
    if (vitals.temp !== null && vitals.temp >= 40)                   { score += 30; flags.push("Hipertermia ≥40°C"); }

    // Síntomas urgentes menores (AMARILLO)
    if (document.getElementById("sym_alteracion_consciencia").checked) { score += 25; flags.push("Alteración consciencia"); }
    if (document.getElementById("sym_vomito_persistente").checked)    { score += 20; flags.push("Vómito persistente"); }
    if (document.getElementById("sym_fiebre_alta").checked)           { score += 20; flags.push("Fiebre alta"); }
    if (document.getElementById("sym_trauma").checked)                { score += 20; flags.push("Trauma"); }

    if (vitals.spo2 !== null && vitals.spo2 >= 90 && vitals.spo2 < 94) { score += 25; flags.push("SpO₂ 90–94%"); }
    if (vitals.FC !== null && (vitals.FC < 50 || vitals.FC > 120))  { score += 15; flags.push("FC alterada"); }

    // Dolor
    if (vitals.dolor >= 8)       { score += 35; flags.push("Dolor severo"); }
    else if (vitals.dolor >= 5)  { score += 20; flags.push("Dolor moderado"); }
    else if (vitals.dolor >= 3)  { score += 5;  }

    // Edad extrema
    if (age < 2 || age > 80) { score += 10; }

    // Síntomas leves
    if (document.getElementById("sym_dolor_moderado").checked) { score += 10; }
    if (document.getElementById("sym_infeccion_leve").checked) { score += 2; }

    // ===== CLASIFICACIÓN =====
    let nivel = {};
    if (score >= 100) {
        nivel = { number: 1, label: "Reanimación", color: "rojo", icon: "🔴", wait: "Atención inmediata", description: "Riesgo vital inmediato. Requiere intervención de reanimación." };
    } else if (score >= 50) {
        nivel = { number: 2, label: "Emergencia", color: "naranja", icon: "🟠", wait: "≤ 10 minutos", description: "Situación de riesgo vital. Evaluación médica urgente." };
    } else if (score >= 25) {
        nivel = { number: 3, label: "Urgencia", color: "amarillo", icon: "🟡", wait: "≤ 30 minutos", description: "Condición grave pero estable. Atención prioritaria." };
    } else if (score >= 10) {
        nivel = { number: 4, label: "Urgencia menor", color: "verde", icon: "🟢", wait: "≤ 60 minutos", description: "Condición no urgente. Puede esperar sin riesgo." };
    } else {
        nivel = { number: 5, label: "No urgente", color: "azul", icon: "🔵", wait: "≤ 120 minutos", description: "Sin urgencia. Puede ser referido a consulta externa." };
    }

    const triageEntry = {
        id: Date.now(),
        name, age, sex, reason, notes, vitals,
        level: nivel.number,
        levelLabel: nivel.label,
        levelColor: nivel.color,
        score,
        flags,
        timestamp: new Date().toISOString(),
        registeredBy: currentUser?.displayName || "Enfermero",
        active: true
    };

    triageQueue.push(triageEntry);
    saveTriageQueue();

    // Renderizar resultado
    const resultDiv = document.getElementById("triageResult");
    resultDiv.className = `triage-result triage-result-${nivel.color}`;
    resultDiv.classList.remove("hidden");
    resultDiv.innerHTML = `
        <div class="triage-result-header">
            <div class="triage-level-badge triage-${nivel.color}">
                <span>${nivel.icon}</span>
                <div>
                    <div class="triage-level-num">Nivel ${nivel.number}</div>
                    <div class="triage-level-label">${nivel.label}</div>
                </div>
            </div>
            <div class="triage-wait">
                <div class="triage-wait-label">Tiempo de espera máximo</div>
                <div class="triage-wait-time">${nivel.wait}</div>
            </div>
        </div>
        <p class="triage-description">${nivel.description}</p>
        ${flags.length > 0 ? `
        <div class="triage-flags">
            <div class="flags-title">Hallazgos detectados:</div>
            <div class="flags-list">${flags.map(f => `<span class="flag-tag">${f}</span>`).join("")}</div>
        </div>` : ""}
        <div class="triage-vitals-summary">
            ${vitals.FC   ? `<span>FC: <b>${vitals.FC}</b> lpm</span>` : ""}
            ${vitals.TAS  ? `<span>TA: <b>${vitals.TAS}/${vitals.TAD}</b> mmHg</span>` : ""}
            ${vitals.FR   ? `<span>FR: <b>${vitals.FR}</b> rpm</span>` : ""}
            ${vitals.spo2 ? `<span>SpO₂: <b>${vitals.spo2}</b>%</span>` : ""}
            ${vitals.temp ? `<span>Temp: <b>${vitals.temp}</b>°C</span>` : ""}
            ${vitals.gluc ? `<span>Glucemia: <b>${vitals.gluc}</b> mg/dL</span>` : ""}
        </div>
        <div class="triage-result-actions">
            <button class="btn-secondary" onclick="clearTriageForm()">Nuevo triage</button>
            <button class="btn-primary" onclick="navigate('triageList')">Ver cola de urgencias</button>
        </div>
    `;

    resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearTriageForm() {
    ["triageName","triageAge","triageSex","triageReason","triageFC","triageFR",
     "triageTAS","triageTAD","triageTemp","triageSpo2","triageGluc","triageDolor","triageNotes"]
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
    document.querySelectorAll(".symptom-check input").forEach(c => c.checked = false);
    document.getElementById("triageResult").classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTriageList() {
    const container = document.getElementById("triageQueue");
    const active = triageQueue
        .filter(t => t.active)
        .sort((a, b) => a.level - b.level || new Date(a.timestamp) - new Date(b.timestamp));

    if (active.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <p>No hay pacientes en espera actualmente</p>
            </div>`;
        return;
    }

    container.innerHTML = active.map(t => `
        <div class="triage-queue-card triage-queue-${t.levelColor}">
            <div class="triage-queue-left">
                <div class="triage-level-circle triage-circle-${t.levelColor}">${t.level}</div>
            </div>
            <div class="triage-queue-body">
                <div class="triage-queue-name">${t.name}</div>
                <div class="triage-queue-meta">${t.age} años · ${t.sex || "—"} · ${t.reason}</div>
                <div class="triage-queue-label triage-${t.levelColor}">${t.levelLabel}</div>
            </div>
            <div class="triage-queue-right">
                <div class="triage-queue-time">${formatTime(t.timestamp)}</div>
                <button class="btn-attend" onclick="attendTriage(${t.id})">Atender</button>
                <button class="btn-dismiss" onclick="dismissTriage(${t.id})">Alta</button>
            </div>
        </div>
    `).join("");
}

function attendTriage(triageId) {
    const entry = triageQueue.find(t => t.id === triageId);
    if (!entry) return;

    // Buscar si ya existe el paciente
    let patient = patients.find(p => p.name.toLowerCase() === entry.name.toLowerCase());

    if (!patient) {
        patient = {
            id: Date.now(),
            name: entry.name,
            age: entry.age,
            sex: entry.sex || "No especificado",
            address: "Urgencias",
            phone: "",
            dob: "",
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.username
        };
        patients.push(patient);
        savePatients();
    }

    currentPatient = patient;

    const consult = {
        id: Date.now(),
        patientId: patient.id,
        date: new Date().toISOString(),
        createdBy: currentUser?.displayName || "Sistema",
        interrogatorio: `Motivo de urgencia: ${entry.reason}\n${entry.notes ? "Notas: " + entry.notes : ""}`,
        antecedentes: "",
        padecimiento: "",
        exploracion: `FC: ${entry.vitals.FC || "—"} lpm | FR: ${entry.vitals.FR || "—"} rpm | TA: ${entry.vitals.TAS || "—"}/${entry.vitals.TAD || "—"} mmHg | Temp: ${entry.vitals.temp || "—"}°C | SpO₂: ${entry.vitals.spo2 || "—"}% | Glucemia: ${entry.vitals.gluc || "—"} mg/dL`,
        diagnostico: "",
        tratamiento: "",
        triageLevel: `Nivel ${entry.level}`,
        triageData: { ...entry.vitals, number: entry.level, label: entry.levelLabel, color: entry.levelColor, reason: entry.reason }
    };

    consultations.push(consult);
    saveConsultations();
    currentConsultation = consult;
    navigate("medicalRecord");
    renderMedicalRecord();
}

function dismissTriage(triageId) {
    const entry = triageQueue.find(t => t.id === triageId);
    if (entry) { entry.active = false; saveTriageQueue(); renderTriageList(); }
}

// =============================================
//  AUTOCOMPLETADO Y ABREVIATURAS
// =============================================
const suggestionsDB = [
    "diabetes mellitus tipo 2","diabetes mellitus tipo 1","diabetes gestacional",
    "hipertensión arterial sistémica","hipertensión arterial","insuficiencia renal crónica",
    "insuficiencia renal aguda","dolor torácico","fiebre sin foco aparente","cefalea tensional",
    "infección respiratoria aguda","gastritis crónica","asma bronquial","neumonía adquirida en la comunidad",
    "infección urinaria","apendicitis aguda","fractura","enfermedad pulmonar obstructiva crónica",
    "hipotiroidismo","hipertiroidismo","anemia","insuficiencia cardíaca"
];

const abbreviations = {
    "DM":  "diabetes mellitus",
    "HTA": "hipertensión arterial",
    "FC":  "frecuencia cardiaca",
    "TA":  "tensión arterial",
    "FR":  "frecuencia respiratoria",
    "ICC": "insuficiencia cardíaca congestiva",
    "ERC": "enfermedad renal crónica",
    "IRA": "insuficiencia renal aguda",
    "IAM": "infarto agudo de miocardio",
    "ACV": "accidente cerebrovascular",
    "EVC": "evento vascular cerebral",
    "IVU": "infección de vías urinarias",
    "ITU": "infección del tracto urinario",
    "PCR": "proteína C reactiva",
    "BH":  "biometría hemática",
    "QS":  "química sanguínea",
    "EGO": "examen general de orina",
    "Tx":  "tratamiento",
    "Dx":  "diagnóstico",
    "Rx":  "radiografía",
    "Hb":  "hemoglobina",
    "Ht":  "hematocrito",
    "VO":  "vía oral",
    "IV":  "vía intravenosa",
    "SC":  "vía subcutánea",
    "IM":  "vía intramuscular",
    "c/8h":"cada 8 horas",
    "c/12h":"cada 12 horas",
    "c/24h":"cada 24 horas",
    "EPOC":"enfermedad pulmonar obstructiva crónica",
    "SpO2":"saturación de oxígeno",
    "TAS": "tensión arterial sistólica",
    "TAD": "tensión arterial diastólica"
};

function getLastWord(text) {
    const words = text.split(" ");
    return words[words.length - 1].toLowerCase();
}

function getSuggestions(word) {
    if (word.length < 2) return [];
    return suggestionsDB.filter(item => item.toLowerCase().includes(word)).slice(0, 6);
}

function setupAutocomplete() {
    const input = document.getElementById("diagnostico");
    const box   = document.getElementById("suggestionsBox");
    if (!input || !box) return;

    input.removeEventListener("input", input._autocompleteHandler);
    input._autocompleteHandler = () => {
        const suggestions = getSuggestions(getLastWord(input.value));
        box.innerHTML = "";
        if (!suggestions.length) return;
        suggestions.forEach(s => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.textContent = s;
            div.onclick = () => { applySuggestion(input, s); box.innerHTML = ""; };
            box.appendChild(div);
        });
    };
    input.addEventListener("input", input._autocompleteHandler);

    document.addEventListener("click", e => {
        if (!box.contains(e.target) && e.target !== input) box.innerHTML = "";
    });
}

function applySuggestion(input, suggestion) {
    const words = input.value.split(" ");
    words.pop();
    words.push(suggestion);
    input.value = words.join(" ") + " ";
    input.focus();
}

function highlightText(text) {
    return text.split(" ").map(word => {
        if (word === word.toUpperCase() && word.length >= 2 && word.length <= 6 && /^[A-ZÁÉÍÓÚ]+$/.test(word)) {
            if (abbreviations[word]) return `<span class="abbr-valid" title="${abbreviations[word]}">${word}</span>`;
            return `<span class="abbr-invalid" title="Abreviatura no reconocida">${word}</span>`;
        }
        return word;
    }).join(" ");
}

function setupAbbreviationDetection() {
    const input   = document.getElementById("diagnostico");
    const preview = document.getElementById("diagnosticoPreview");
    if (!input || !preview) return;

    input.removeEventListener("input", input._abbrevHandler);
    input._abbrevHandler = () => {
        const text = input.value;
        const hasAbbrev = /\b[A-ZÁÉÍÓÚ]{2,6}\b/.test(text);
        if (hasAbbrev && text.length > 0) {
            preview.style.display = "block";
            preview.innerHTML = `<span class="preview-label">Vista previa con abreviaturas:</span> ` + highlightText(text);
        } else {
            preview.style.display = "none";
        }
    };
    input.addEventListener("input", input._abbrevHandler);
}

function expandAbbreviations(text, mode = "patient") {
    if (!text) return "";
    return text.split(" ").map(word => {
        if (abbreviations[word]) {
            return mode === "patient" ? abbreviations[word] : `${abbreviations[word]} (${word})`;
        }
        return word;
    }).join(" ");
}

// =============================================
//  EXPORTAR PDF
// =============================================
function exportPDF(type) {
    if (!currentConsultation || !currentPatient) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 15;
    const margin = 15;
    const pageW = 210;
    const contentW = pageW - margin * 2;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("ClinData — Expediente Clínico", margin, 14);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(type === "patient" ? "Versión para paciente" : "Versión para médico", pageW - margin, 14, { align: "right" });

    y = 30;
    doc.setTextColor(0, 0, 0);

    // Patient info
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(`Paciente: ${currentPatient.name}`, margin, y); y += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Edad: ${currentPatient.age} años  |  Sexo: ${currentPatient.sex}  |  Fecha: ${formatDateFull(currentConsultation.date)}`, margin, y); y += 10;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y); y += 7;

    function addSection(title, text) {
        if (y > 260) { doc.addPage(); y = 15; }
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.setTextColor(14, 165, 233);
        doc.text(title, margin, y); y += 5;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(text || "Sin información registrada.", contentW);
        lines.forEach(line => {
            if (y > 270) { doc.addPage(); y = 15; }
            doc.text(line, margin, y); y += 5.5;
        });
        y += 4;
    }

    addSection("Interrogatorio",      expandAbbreviations(currentConsultation.interrogatorio, type));
    addSection("Antecedentes",        expandAbbreviations(currentConsultation.antecedentes,   type));
    addSection("Padecimiento actual", expandAbbreviations(currentConsultation.padecimiento,   type));
    addSection("Exploración física",  expandAbbreviations(currentConsultation.exploracion,    type));
    addSection("Diagnóstico",         expandAbbreviations(currentConsultation.diagnostico,    type));
    addSection("Tratamiento",         expandAbbreviations(currentConsultation.tratamiento,    type));

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`ClinData — Documento generado el ${new Date().toLocaleDateString("es-MX")} — Página ${i}/${pages}`, pageW / 2, 290, { align: "center" });
    }

    doc.save(`expediente_${currentPatient.name.replace(/\s/g,"_")}_${type}.pdf`);
}

// =============================================
//  UTILIDADES
// =============================================
function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateFull(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function showToast(message, type = "info") {
    const existing = document.getElementById("toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("toast-show"), 10);
    setTimeout(() => { toast.classList.remove("toast-show"); setTimeout(() => toast.remove(), 300); }, 3000);
}