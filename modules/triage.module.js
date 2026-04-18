(function initTriageModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    function calcularTriage() {
        const name = document.getElementById("triageName").value.trim();
        const age = parseInt(document.getElementById("triageAge").value, 10) || 0;
        const sex = document.getElementById("triageSex").value;
        const reason = document.getElementById("triageReason").value.trim();
        const notes = document.getElementById("triageNotes").value.trim();
        if (!name || !age || !reason) {
            global.showToast("Completa nombre, edad y motivo.", "error");
            return;
        }

        const vitals = {
            FC: parseInt(document.getElementById("triageFC").value, 10) || null,
            FR: parseInt(document.getElementById("triageFR").value, 10) || null,
            TAS: parseInt(document.getElementById("triageTAS").value, 10) || null,
            TAD: parseInt(document.getElementById("triageTAD").value, 10) || null,
            temp: parseFloat(document.getElementById("triageTemp").value) || null,
            spo2: parseInt(document.getElementById("triageSpo2").value, 10) || null,
            gluc: parseInt(document.getElementById("triageGluc").value, 10) || null,
            dolor: parseInt(document.getElementById("triageDolor").value, 10) || 0
        };

        let score = 0;
        const flags = [];
        if (document.getElementById("sym_inconsciencia").checked) { score += 100; flags.push("Inconsciencia"); }
        if (document.getElementById("sym_paro").checked) { score += 100; flags.push("Paro cardiorrespiratorio"); }
        if (document.getElementById("sym_dificultad_resp").checked) { score += 50; flags.push("Dificultad respiratoria severa"); }
        if (document.getElementById("sym_dolor_toracico").checked) { score += 50; flags.push("Dolor torácico intenso"); }
        if (document.getElementById("sym_convulsiones").checked) { score += 50; flags.push("Convulsiones"); }
        if (document.getElementById("sym_sangrado_mayor").checked) { score += 50; flags.push("Sangrado mayor"); }
        if (vitals.FC !== null && (vitals.FC < 40 || vitals.FC > 150)) { score += 50; flags.push("FC crítica"); }
        if (vitals.spo2 !== null && vitals.spo2 < 90) { score += 50; flags.push("SpO₂ <90%"); }
        if (vitals.TAS !== null && (vitals.TAS < 80 || vitals.TAS > 200)) { score += 40; flags.push("TA crítica"); }
        if (vitals.FR !== null && (vitals.FR < 8 || vitals.FR > 30)) { score += 40; flags.push("FR anormal"); }
        if (vitals.temp !== null && vitals.temp >= 40) { score += 30; flags.push("Hipertermia ≥40°C"); }
        if (document.getElementById("sym_alteracion_consciencia").checked) { score += 25; flags.push("Alteración consciencia"); }
        if (document.getElementById("sym_vomito_persistente").checked) { score += 20; flags.push("Vómito persistente"); }
        if (document.getElementById("sym_fiebre_alta").checked) { score += 20; flags.push("Fiebre alta"); }
        if (document.getElementById("sym_trauma").checked) { score += 20; flags.push("Trauma"); }
        if (vitals.spo2 !== null && vitals.spo2 >= 90 && vitals.spo2 < 94) { score += 25; flags.push("SpO₂ 90–94%"); }
        if (vitals.FC !== null && (vitals.FC < 50 || vitals.FC > 120)) { score += 15; flags.push("FC alterada"); }
        if (vitals.dolor >= 8) { score += 35; flags.push("Dolor severo"); } else if (vitals.dolor >= 5) { score += 20; flags.push("Dolor moderado"); } else if (vitals.dolor >= 3) { score += 5; }
        if (age < 2 || age > 80) score += 10;
        if (document.getElementById("sym_dolor_moderado").checked) score += 10;
        if (document.getElementById("sym_infeccion_leve").checked) score += 2;

        let nivel;
        if (score >= 100) nivel = { number: 1, label: "Reanimación", color: "rojo", icon: "🔴", wait: "Atención inmediata", description: "Riesgo vital inmediato. Requiere intervención de reanimación." };
        else if (score >= 50) nivel = { number: 2, label: "Emergencia", color: "naranja", icon: "🟠", wait: "≤ 10 minutos", description: "Situación de riesgo vital. Evaluación médica urgente." };
        else if (score >= 25) nivel = { number: 3, label: "Urgencia", color: "amarillo", icon: "🟡", wait: "≤ 30 minutos", description: "Condición grave pero estable. Atención prioritaria." };
        else if (score >= 10) nivel = { number: 4, label: "Urgencia menor", color: "verde", icon: "🟢", wait: "≤ 60 minutos", description: "Condición no urgente. Puede esperar sin riesgo." };
        else nivel = { number: 5, label: "No urgente", color: "azul", icon: "🔵", wait: "≤ 120 minutos", description: "Sin urgencia. Puede ser referido a consulta externa." };

        const entry = { id: Date.now(), name, age, sex, reason, notes, vitals, level: nivel.number, levelLabel: nivel.label, levelColor: nivel.color, score, flags, timestamp: new Date().toISOString(), registeredBy: app().currentUser?.displayName || "Enfermero/a", active: true };
        app().triageQueue.push(entry);
        global.saveTriageQueue();

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
            ${flags.length > 0 ? `<div class="triage-flags"><div class="flags-title">Hallazgos detectados:</div><div class="flags-list">${flags.map((flag) => `<span class="flag-tag">${flag}</span>`).join("")}</div></div>` : ""}
            <div class="triage-vitals-summary">
                ${vitals.FC ? `<span>FC: <b>${vitals.FC}</b> lpm</span>` : ""}
                ${vitals.TAS ? `<span>TA: <b>${vitals.TAS}/${vitals.TAD}</b> mmHg</span>` : ""}
                ${vitals.FR ? `<span>FR: <b>${vitals.FR}</b> rpm</span>` : ""}
                ${vitals.spo2 ? `<span>SpO₂: <b>${vitals.spo2}</b>%</span>` : ""}
                ${vitals.temp ? `<span>Temp: <b>${vitals.temp}</b>°C</span>` : ""}
                ${vitals.gluc ? `<span>Glucemia: <b>${vitals.gluc}</b> mg/dL</span>` : ""}
            </div>
            <div class="triage-result-actions">
                <button class="btn-secondary" onclick="clearTriageForm()">Nuevo triage</button>
                <button class="btn-primary" onclick="navigate('triageList')">Ver fila de urgencias</button>
            </div>`;
        resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function clearTriageForm() {
        ["triageName","triageAge","triageSex","triageReason","triageFC","triageFR","triageTAS","triageTAD","triageTemp","triageSpo2","triageGluc","triageDolor","triageNotes"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        document.querySelectorAll(".symptom-check input").forEach((checkbox) => { checkbox.checked = false; });
        document.getElementById("triageResult").classList.add("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderTriageList() {
        const container = document.getElementById("triageQueue");
        if (!container) return;
        const active = app().triageQueue.filter((entry) => entry.active).sort((a, b) => a.level - b.level || new Date(a.timestamp) - new Date(b.timestamp));
        if (active.length === 0) {
            container.innerHTML = `<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><p>No hay pacientes en fila de urgencias</p></div>`;
            return;
        }
        container.innerHTML = active.map((entry) => `
            <div class="triage-queue-card triage-queue-${entry.levelColor}">
                <div class="triage-queue-left"><div class="triage-level-circle triage-circle-${entry.levelColor}">${entry.level}</div></div>
                <div class="triage-queue-body">
                    <div class="triage-queue-name">${entry.name}</div>
                    <div class="triage-queue-meta">${entry.age} años · ${entry.sex || "—"} · ${entry.reason}</div>
                    <div class="triage-queue-label triage-${entry.levelColor}">${entry.levelLabel}</div>
                </div>
                <div class="triage-queue-right">
                    <div class="triage-queue-time">${global.formatTime(entry.timestamp)}</div>
                    ${(global.can("canWriteMedicalNotes") || global.can("canWriteNursingNotes")) ? `<button class="btn-attend" onclick="attendTriage(${entry.id})">Atender</button>` : ""}
                    <button class="btn-dismiss" onclick="dismissTriage(${entry.id})">Alta</button>
                </div>
            </div>`).join("");
    }

    function attendTriage(triageId) {
        const entry = app().triageQueue.find((item) => item.id === triageId);
        if (!entry) return;
        let patient = app().patients.find((candidate) => candidate.name.toLowerCase() === entry.name.toLowerCase());
        if (!patient) {
            patient = {
                id: Date.now(),
                expediente: global.generatePatientExpediente(),
                name: entry.name,
                age: entry.age,
                sex: entry.sex || "No especificado",
                address: "Urgencias",
                phone: "",
                dob: "",
                birthPlace: "",
                nationality: "",
                curp: "",
                rfc: "",
                nss: "",
                email: "",
                occupation: "",
                emergencyContact: "",
                ethnicGroup: "",
                allergies: "",
                chronicConditions: "",
                alerts: "",
                currentTreatment: "",
                createdAt: new Date().toISOString(),
                createdBy: app().currentUser?.username
            };
            app().patients.push(patient);
            global.savePatients();
        }
        app().currentPatient = patient;
        const consultation = global.createEmptyConsultation(patient.id, {
            createdBy: app().currentUser?.displayName || "Sistema",
            tipoNota: "urgencias",
            urg_tas: entry.vitals?.TAS?.toString() || "",
            urg_tad: entry.vitals?.TAD?.toString() || "",
            urg_fc: entry.vitals?.FC?.toString() || "",
            urg_fr: entry.vitals?.FR?.toString() || "",
            urg_temp: entry.vitals?.temp?.toString() || "",
            urg_spo2: entry.vitals?.spo2?.toString() || "",
            urg_glucemia: entry.vitals?.gluc?.toString() || "",
            urg_motivo: entry.reason || "",
            urg_exploracion: entry.notes || "",
            triageLevel: `Nivel ${entry.level}`,
            triageData: { ...entry.vitals, number: entry.level, label: entry.levelLabel, color: entry.levelColor, reason: entry.reason }
        });
        app().consultations.push(consultation);
        global.saveConsultations();
        app().currentConsultation = consultation;
        entry.active = false;
        global.saveTriageQueue();
        global.navigate("medicalRecord");
        global.renderMedicalRecord();
    }

    function dismissTriage(triageId) {
        const entry = app().triageQueue.find((item) => item.id === triageId);
        if (entry) {
            entry.active = false;
            global.saveTriageQueue();
            renderTriageList();
        }
    }

    registry.triage = { calcularTriage, clearTriageForm, renderTriageList, attendTriage, dismissTriage };
})(window);
