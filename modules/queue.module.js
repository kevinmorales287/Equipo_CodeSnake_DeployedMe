(function initQueueModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    function addPatientToQueue(patientId, reason, isNew = false) {
        app().consultQueue.push({
            id: Date.now(),
            patientId,
            reason,
            isNewPatient: isNew,
            addedAt: new Date().toISOString(),
            addedBy: app().currentUser?.displayName,
            status: "waiting"
        });
        global.saveConsultQueue();
    }

    function openAddToQueueModal(patientId) {
        const patient = app().patients.find((entry) => entry.id === patientId);
        if (!patient) return;
        app().addToQueuePatientId = patientId;
        document.getElementById("queueModalPatientName").textContent = patient.name;
        document.getElementById("queueModalReason").value = "";
        document.getElementById("addToQueueModal").classList.remove("hidden");
    }

    function confirmAddToQueue() {
        const reason = document.getElementById("queueModalReason").value.trim();
        if (!reason) {
            global.showToast("Ingresa el motivo de consulta.", "error");
            return;
        }
        addPatientToQueue(app().addToQueuePatientId, reason, false);
        global.closeModal("addToQueueModal");
        global.showToast("Paciente agregado a la fila de consulta.", "success");
    }

    function renderConsultQueue() {
        const container = document.getElementById("consultQueue");
        if (!container) return;

        const actions = document.getElementById("consultQueueActions");
        if (actions && global.can("canAddToQueue")) {
            actions.innerHTML = `<button class="btn-secondary" onclick="navigate('patients')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar paciente existente</button>`;
        }

        const waiting = app().consultQueue.filter((entry) => entry.status === "waiting").sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
        if (waiting.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>No hay pacientes en la fila de consulta</p>
            </div>`;
            return;
        }

        container.innerHTML = waiting.map((entry, idx) => {
            const patient = app().patients.find((item) => item.id === entry.patientId) || { name: "Paciente", age: "—", sex: "—" };
            const initials = patient.name.split(" ").slice(0, 2).map((chunk) => chunk[0]).join("").toUpperCase();
            const isNew = entry.isNewPatient ? `<span class="new-badge">Primera visita</span>` : `<span class="return-badge">Seguimiento</span>`;
            const consultorioBadge = patient.consultorio ? `<span class="consultorio-tag">🏥 ${patient.consultorio}</span>` : "";
            const attendBtn = global.can("canWriteMedicalNotes") ? `<button class="btn-attend" onclick="attendFromQueue(${entry.id})">Atender</button>` : `<span class="waiting-tag">En espera</span>`;
            const dismissBtn = global.can("canAddToQueue") || global.can("canWriteMedicalNotes") ? `<button class="btn-dismiss" onclick="dismissFromConsultQueue(${entry.id})">Retirar</button>` : "";
            return `<div class="consult-queue-card">
                <div class="queue-number">${idx + 1}</div>
                <div class="queue-patient-avatar">${initials}</div>
                <div class="queue-body">
                    <div class="queue-name">${patient.name}</div>
                    <div class="queue-meta">${patient.age} años · ${patient.sex} · ${isNew} ${consultorioBadge}</div>
                    <div class="queue-reason">${entry.reason}</div>
                </div>
                <div class="queue-right">
                    <div class="queue-time">${global.formatTime(entry.addedAt)}</div>
                    ${attendBtn}
                    ${dismissBtn}
                </div>
            </div>`;
        }).join("");
    }

    function attendFromQueue(queueId) {
        const queueEntry = app().consultQueue.find((entry) => entry.id === queueId);
        if (!queueEntry) return;
        const patient = app().patients.find((entry) => entry.id === queueEntry.patientId);
        if (!patient) return;

        app().currentPatient = patient;
        const consultation = global.createEmptyConsultation(patient.id, {
            createdBy: app().currentUser?.displayName || "Sistema",
            queueReason: queueEntry.reason,
            isNewPatient: queueEntry.isNewPatient
        });
        global.copyAntecedentsFromPreviousConsultation(consultation);
        app().consultations.push(consultation);
        global.saveConsultations();
        app().currentConsultation = consultation;

        queueEntry.status = "attended";
        global.saveConsultQueue();
        app().selectedDiagnosticos = [];
        global.navigate("medicalRecord");
        global.renderMedicalRecord();
    }

    function dismissFromConsultQueue(queueId) {
        const entry = app().consultQueue.find((item) => item.id === queueId);
        if (entry) {
            entry.status = "dismissed";
            global.saveConsultQueue();
            renderConsultQueue();
        }
    }

    registry.queue = { addPatientToQueue, openAddToQueueModal, confirmAddToQueue, renderConsultQueue, attendFromQueue, dismissFromConsultQueue };
})(window);
