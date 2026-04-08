(function initPatientsModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const HOSPITAL_CODE = "HGR";
    const app = () => global.ClinDataApp;

    function getPatients() { return app().patients || []; }
    function getConsultations() { return app().consultations || []; }
    function getCurrentPatient() { return app().currentPatient; }
    function getCurrentUser() { return app().currentUser; }

    function getRecordYear(date = new Date()) {
        return new Date(date).getFullYear();
    }

    function getLastExpedienteSequence(hospitalCode = HOSPITAL_CODE, year = getRecordYear()) {
        const prefix = `${hospitalCode}-${year}-`;
        return getPatients().reduce((max, patient) => {
            if (!patient?.expediente || !String(patient.expediente).startsWith(prefix)) return max;
            const sequence = parseInt(String(patient.expediente).slice(prefix.length), 10);
            return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
        }, 0);
    }

    function generatePatientExpediente(hospitalCode = HOSPITAL_CODE, date = new Date()) {
        const year = getRecordYear(date);
        const nextSequence = getLastExpedienteSequence(hospitalCode, year) + 1;
        return `${hospitalCode}-${year}-${String(nextSequence).padStart(6, "0")}`;
    }

    function updateNewPatientExpedientePreview() {
        const preview = document.getElementById("patientFileNumberPreview");
        if (!preview) return;
        preview.value = generatePatientExpediente();
    }

    function submitPatient() {
        const name = document.getElementById("name").value.trim();
        const age = document.getElementById("age").value;
        const sex = document.getElementById("sex").value;
        const address = document.getElementById("address").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const dob = document.getElementById("dob").value;
        const birthPlace = document.getElementById("birthPlace")?.value.trim() || "";
        const nationality = document.getElementById("nationality")?.value.trim() || "";
        const curp = (document.getElementById("curp")?.value || "").trim().toUpperCase();
        const rfc = (document.getElementById("rfc")?.value || "").trim().toUpperCase();
        const nss = (document.getElementById("nss")?.value || "").trim();
        const email = document.getElementById("email")?.value.trim() || "";
        const occupation = document.getElementById("occupation")?.value.trim() || "";
        const emergencyContact = document.getElementById("emergencyContact")?.value.trim() || "";
        const ethnicGroup = document.getElementById("ethnicGroup")?.value.trim() || "";
        const allergies = document.getElementById("allergies").value.trim();
        const chronicConditions = document.getElementById("chronicConditions")?.value.trim() || "";
        const reason = document.getElementById("consultReason").value.trim();
        const consultorioAsignado = document.getElementById("newPatientConsultorio")?.value || "";

        if (!name || !age || !sex || !address || !reason) {
            global.showToast("Completa los campos obligatorios (nombre, edad, sexo, domicilio, motivo).", "error");
            return;
        }

        const expediente = generatePatientExpediente();
        const patient = {
            id: Date.now(),
            expediente,
            name,
            age,
            sex,
            address,
            phone,
            dob,
            birthPlace,
            nationality,
            curp,
            rfc,
            nss,
            email,
            occupation,
            emergencyContact,
            ethnicGroup,
            allergies,
            chronicConditions,
            alerts: "",
            currentTreatment: "",
            consultorio: consultorioAsignado,
            createdAt: new Date().toISOString(),
            createdBy: getCurrentUser()?.username
        };

        getPatients().push(patient);
        global.savePatients();
        global.addPatientToQueue(patient.id, reason, true);
        global.showToast(`Paciente registrado con expediente ${expediente} y agregado a la fila de consulta.`, "success");

        ["name","age","sex","address","phone","dob","birthPlace","nationality","curp","rfc","nss","email","occupation","emergencyContact","ethnicGroup","allergies","chronicConditions","consultReason"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        updateNewPatientExpedientePreview();
        const consultorioSelect = document.getElementById("newPatientConsultorio");
        if (consultorioSelect) consultorioSelect.value = "";
        global.navigate("consultQueue");
    }

    function renderPatients(customList = null) {
        const container = document.getElementById("patientList");
        if (!container) return;

        const list = customList !== null ? customList : getPatients();
        const headerActions = document.getElementById("patientsHeaderActions");
        if (headerActions) {
            headerActions.innerHTML = global.can("canRegisterPatients") ? `<button class="btn-primary" onclick="navigate('newPatient')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo paciente</button>` : "";
        }

        if (list.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <p>${customList !== null ? "No se encontraron resultados" : "No hay pacientes registrados"}</p>
                ${customList === null && global.can("canRegisterPatients") ? `<button class="btn-primary" onclick="navigate('newPatient')">Registrar primer paciente</button>` : ""}
            </div>`;
            return;
        }

        container.innerHTML = list.map((patient) => {
            const initials = patient.name.split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();
            const consults = getConsultations().filter((consult) => consult.patientId === patient.id).length;
            const lastConsult = getConsultations().filter((consult) => consult.patientId === patient.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            const lastDate = lastConsult ? global.formatDate(lastConsult.date) : "Sin consultas";
            const addQueueBtn = global.can("canAddToQueue") ? `<button class="btn-add-queue" onclick="event.stopPropagation();openAddToQueueModal(${patient.id})">+ Cola</button>` : "";

            return `<div class="patient-card" onclick="openPatientRecord(${patient.id})">
                <div class="patient-avatar">${initials}</div>
                <div class="patient-info">
                    <div class="patient-name">${patient.name}</div>
                    <div class="patient-meta">
                        ${patient.expediente ? `<span>${patient.expediente}</span><span class="dot">·</span>` : ""}
                        <span>${patient.age} años</span><span class="dot">·</span><span>${patient.sex}</span><span class="dot">·</span><span>${patient.address}</span>
                    </div>
                    ${patient.allergies ? `<div class="patient-allergy-tag">⚠ ${patient.allergies}</div>` : ""}
                    ${patient.consultorio ? `<div style="display:inline-block;margin-top:3px;"><span class="consultorio-tag">🏥 ${patient.consultorio}</span></div>` : ""}
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
        if (!query) {
            renderPatients();
            return;
        }

        renderPatients(getPatients().filter((patient) =>
            patient.name.toLowerCase().includes(query) ||
            patient.age.toString().includes(query) ||
            patient.sex.toLowerCase().includes(query) ||
            (patient.expediente || "").toLowerCase().includes(query) ||
            (patient.curp || "").toLowerCase().includes(query) ||
            (patient.rfc || "").toLowerCase().includes(query) ||
            (patient.nss || "").toLowerCase().includes(query)
        ));
    }

    function renderConsultationHistory() {
        const patient = getCurrentPatient();
        if (!patient) return;

        document.getElementById("historyPatientName").textContent = patient.name;
        document.getElementById("historyPatientInfo").textContent = `${patient.expediente ? patient.expediente + " · " : ""}${patient.age} años · ${patient.sex}`;

        const headerActions = document.getElementById("historyHeaderActions");
        if (headerActions) {
            let buttons = "";
            if (global.can("canWriteMedicalNotes")) {
                buttons += `<button class="btn-primary" onclick="createNewConsultation()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nueva consulta</button>`;
            }
            buttons += `<button class="btn-secondary" onclick="openEditPatientModal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar datos</button>`;
            headerActions.innerHTML = buttons;
        }

        renderPatientFullCard();

        const patientConsults = getConsultations().filter((consult) => consult.patientId === patient.id);
        document.getElementById("consultCount").textContent = `${patientConsults.length} consulta${patientConsults.length !== 1 ? "s" : ""}`;
        const sorted = [...patientConsults].sort((a, b) => new Date(b.date) - new Date(a.date));
        const container = document.getElementById("consultationList");

        if (sorted.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p>Este paciente aún no tiene consultas registradas</p>
                ${global.can("canWriteMedicalNotes") ? `<button class="btn-primary" onclick="createNewConsultation()">Registrar primera consulta</button>` : ""}
            </div>`;
            return;
        }

        const tipoLabels = { historia: "Historia Clínica", evolucion: "Nota de Evolución", urgencias: "Nota de Urgencias" };
        container.innerHTML = sorted.map((consult, idx) => {
            const num = sorted.length - idx;
            const diagPreview = consult.diagnostico ? consult.diagnostico.substring(0, 90) + (consult.diagnostico.length > 90 ? "..." : "") : "Sin diagnóstico registrado";
            const tratPreview = consult.tratamiento ? consult.tratamiento.substring(0, 70) + (consult.tratamiento.length > 70 ? "..." : "") : "Sin tratamiento registrado";
            const triageBadge = consult.triageLevel ? `<span class="triage-badge triage-${(consult.triageData?.color || "azul")}">${consult.triageLevel}</span>` : "";
            const isNew = consult.isNewPatient ? `<span class="new-badge-sm">1ª visita</span>` : "";
            const statusBadge = consult.status === "closed" ? `<span class="status-closed">Atendido</span>` : `<span class="status-active">Activo</span>`;
            const attachCount = (consult.attachments || []).length;
            const attachBadge = attachCount > 0 ? `<span class="attach-count-badge">📎 ${attachCount}</span>` : "";
            const tipoLabel = tipoLabels[consult.tipoNota] || "Historia Clínica";
            const tipoBadge = `<span class="tipo-nota-badge">${tipoLabel}</span>`;

            return `<div class="consult-card" onclick="openConsultation(${consult.id})">
                <div class="consult-card-left">
                    <div class="consult-number">Consulta ${num}</div>
                    <div class="consult-date">${global.formatDateFull(consult.date)}</div>
                    ${tipoBadge}${triageBadge}${isNew}${statusBadge}${attachBadge}
                </div>
                <div class="consult-card-body">
                    <div class="consult-field"><span class="consult-field-label">Diagnóstico</span><span class="consult-field-value">${diagPreview}</span></div>
                    <div class="consult-field"><span class="consult-field-label">Tratamiento</span><span class="consult-field-value">${tratPreview}</span></div>
                    ${consult.queueReason ? `<div class="consult-field"><span class="consult-field-label">Motivo</span><span class="consult-field-value">${consult.queueReason}</span></div>` : ""}
                </div>
                <div class="consult-card-right">
                    <div class="consult-author">${consult.createdBy || "Sistema"}</div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </div>`;
        }).join("");
    }

    function renderPatientFullCard() {
        const patient = getCurrentPatient();
        if (!patient) return;

        const patientConsults = getConsultations().filter((consult) => consult.patientId === patient.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastConsult = patientConsults[0];
        const lastDx = lastConsult?.diagnostico ? lastConsult.diagnostico.substring(0, 100) + "..." : "Sin diagnóstico previo";
        const currentTx = patient.currentTreatment || lastConsult?.tratamiento || "Sin tratamiento registrado";
        const notaImp = lastConsult?.notaImportante || lastConsult?.evolucion_nota || null;
        const alertas = patient.alerts || null;
        const medsHtml = global.getMedicationSummary(lastConsult?.medicamentos, "html") || "Sin medicamentos registrados";

        document.getElementById("patientFullCard").innerHTML = `
            <div class="pfc-header">
                <div class="pfc-avatar">${patient.name.split(" ").slice(0,2).map((chunk) => chunk[0]).join("").toUpperCase()}</div>
                <div class="pfc-main">
                    <div class="pfc-name">${patient.name}</div>
                    <div class="pfc-row">
                        ${patient.expediente ? `<span class="pfc-tag">🗂 ${patient.expediente}</span>` : ""}
                        <span class="pfc-tag">🎂 ${patient.age} años</span>
                        <span class="pfc-tag">⚧ ${patient.sex}</span>
                        ${patient.dob ? `<span class="pfc-tag">📅 ${global.formatDate(patient.dob)}</span>` : ""}
                        ${patient.birthPlace ? `<span class="pfc-tag">🌎 ${patient.birthPlace}</span>` : ""}
                        ${patient.nationality ? `<span class="pfc-tag">🪪 ${patient.nationality}</span>` : ""}
                        ${patient.phone ? `<span class="pfc-tag">📞 ${patient.phone}</span>` : ""}
                        ${patient.occupation ? `<span class="pfc-tag">💼 ${patient.occupation}</span>` : ""}
                        ${patient.address ? `<span class="pfc-tag">📍 ${patient.address}</span>` : ""}
                    </div>
                </div>
            </div>
            <div class="pfc-grid">
                ${patient.curp ? `<div class="pfc-item"><div class="pfc-item-label">CURP</div><div class="pfc-item-value">${patient.curp}</div></div>` : ""}
                ${patient.rfc ? `<div class="pfc-item"><div class="pfc-item-label">RFC</div><div class="pfc-item-value">${patient.rfc}</div></div>` : ""}
                ${patient.nss ? `<div class="pfc-item"><div class="pfc-item-label">NSS</div><div class="pfc-item-value">${patient.nss}</div></div>` : ""}
                <div class="pfc-item ${patient.allergies && patient.allergies !== "Ninguna conocida" ? "pfc-alert" : ""}">
                    <div class="pfc-item-label">Alergias</div>
                    <div class="pfc-item-value">${patient.allergies || "No registradas"}</div>
                </div>
                ${patient.chronicConditions ? `<div class="pfc-item pfc-alert"><div class="pfc-item-label">🩺 Padecimientos crónicos</div><div class="pfc-item-value">${patient.chronicConditions}</div></div>` : ""}
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
                <div class="pfc-item full-span">
                    <div class="pfc-item-label">💊 Medicamentos preescritos</div>
                    <div class="pfc-item-value">${medsHtml}</div>
                </div>
            </div>`;
    }

    function openEditPatientModal() {
        const patient = getCurrentPatient();
        if (!patient) return;

        document.getElementById("editExpediente").value = patient.expediente || "";
        document.getElementById("editName").value = patient.name || "";
        document.getElementById("editAge").value = patient.age || "";
        document.getElementById("editSex").value = patient.sex || "";
        document.getElementById("editAddress").value = patient.address || "";
        document.getElementById("editPhone").value = patient.phone || "";
        document.getElementById("editDob").value = patient.dob || "";
        document.getElementById("editBirthPlace").value = patient.birthPlace || "";
        document.getElementById("editNationality").value = patient.nationality || "";
        document.getElementById("editCurp").value = patient.curp || "";
        document.getElementById("editRfc").value = patient.rfc || "";
        document.getElementById("editNss").value = patient.nss || "";
        document.getElementById("editEmail").value = patient.email || "";
        document.getElementById("editOccupation").value = patient.occupation || "";
        document.getElementById("editEmergencyContact").value = patient.emergencyContact || "";
        document.getElementById("editAllergies").value = patient.allergies || "";
        document.getElementById("editChronicConditions").value = patient.chronicConditions || "";
        document.getElementById("editCurrentTreatment").value = patient.currentTreatment || "";
        document.getElementById("editAlerts").value = patient.alerts || "";
        document.getElementById("editPatientModal").classList.remove("hidden");
    }

    function saveEditedPatient() {
        const patient = getCurrentPatient();
        if (!patient) return;

        patient.name = document.getElementById("editName").value.trim() || patient.name;
        patient.age = document.getElementById("editAge").value || patient.age;
        patient.sex = document.getElementById("editSex").value || patient.sex;
        patient.address = document.getElementById("editAddress").value.trim() || patient.address;
        patient.phone = document.getElementById("editPhone").value.trim();
        patient.dob = document.getElementById("editDob").value;
        patient.birthPlace = document.getElementById("editBirthPlace").value.trim();
        patient.nationality = document.getElementById("editNationality").value.trim();
        patient.curp = document.getElementById("editCurp").value.trim().toUpperCase();
        patient.rfc = document.getElementById("editRfc").value.trim().toUpperCase();
        patient.nss = document.getElementById("editNss").value.trim();
        patient.email = document.getElementById("editEmail").value.trim();
        patient.occupation = document.getElementById("editOccupation").value.trim();
        patient.emergencyContact = document.getElementById("editEmergencyContact").value.trim();
        patient.allergies = document.getElementById("editAllergies").value.trim();
        patient.chronicConditions = document.getElementById("editChronicConditions").value.trim();
        patient.currentTreatment = document.getElementById("editCurrentTreatment").value.trim();
        patient.alerts = document.getElementById("editAlerts").value.trim();

        global.savePatients();
        global.closeModal("editPatientModal");
        global.showToast("Datos del paciente actualizados.", "success");
        renderConsultationHistory();
    }

    function renderNewPatientConsultorioSelect() {
        updateNewPatientExpedientePreview();
        const select = document.getElementById("newPatientConsultorio");
        if (!select) return;

        const options = (app().consultorios || [])
            .filter((consultorio) => consultorio.activo)
            .map((consultorio) => `<option value="${consultorio.nombre}">${consultorio.nombre} — ${consultorio.descripcion}</option>`)
            .join("");
        select.innerHTML = `<option value="">Sin asignar</option>${options}`;
    }

    registry.patients = {
        getRecordYear,
        getLastExpedienteSequence,
        generatePatientExpediente,
        updateNewPatientExpedientePreview,
        submitPatient,
        renderPatients,
        searchPatients,
        renderConsultationHistory,
        renderPatientFullCard,
        openEditPatientModal,
        saveEditedPatient,
        renderNewPatientConsultorioSelect
    };
})(window);
