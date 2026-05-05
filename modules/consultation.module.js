(function initConsultationModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    const ALL_RECORD_FIELDS = [
        "ahf","hf-madre","hf-padre","hf-abp","hf-abpa","hf-abm","hf-abma","hf-hijos","hf-herm","hf-otros",
        "pnp-ocu","pnp-esc","pnp-ec","pnp-emb","pnp-mac","pnp-vac","apnp_otros",
        "tabaquismo_detalle","alcoholismo_detalle","toxicomanias_detalle","actfisica_detalle",
        "app_enfermedades","app_cirugias","app_traumatismos","app_alergias","app_transfusiones","app_medicamentos",
        "pp-deg","pp-neo","pp-ets",
        "padecimiento_inicio","padecimiento_sintomas",
        "sis_cardiovascular","sis_respiratorio","sis_digestivo","sis_neurologico","sis_urinario",
        "sis_musculoesqueletico","sis_piel","sis_endocrino","sis_genitoreproductivo","sis_psiquiatrico",
        "sv_tas","sv_tad","sv_fc","sv_fr","sv_temp","sv_spo2","sv_glucemia","sv_peso","sv_talla","sv_dolor","sv_habitus",
        "exp_cabeza","exp_torax","exp_abdomen","exp_extremidades","exp_neurologico","exp_genitourinario","exp_otros",
        "estudios_previos","estudios_imagen","estudios_solicitados",
        "diagnostico","diagnostico_secundario","pronostico_detalle",
        "tratamiento","indicaciones_reposo","indicaciones_dieta","indicaciones_cita","indicaciones_referencia",
        "evolucion_clinica","evol_ta","evol_fc","evol_fr","evol_temp","evol_spo2","evol_peso",
        "evolucion_resultados","evolucion_diagnostico","evolucion_tratamiento","evolucion_nota",
        "urg_tas","urg_tad","urg_fc","urg_fr","urg_temp","urg_spo2","urg_glucemia","urg_glasgow",
        "urg_motivo","urg_exploracion","urg_estudios","urg_diagnostico","urg_tratamiento",
        "nota_sv_tas","nota_sv_tad","nota_sv_fc","nota_sv_fr","nota_sv_temp","nota_sv_spo2",
        "nota_sv_glucemia","nota_sv_peso","nota_sv_talla","nota_sv_dolor","nota_sv_habitus",
        "nota_motivo_consulta",
        "nota_padecimiento_inicio","nota_padecimiento_sintomas",
        "nota_sis_cardiovascular","nota_sis_respiratorio","nota_sis_digestivo",
        "nota_sis_neurologico","nota_sis_urinario","nota_sis_musculoesqueletico",
        "nota_sis_piel","nota_sis_endocrino","nota_sis_genitoreproductivo","nota_sis_psiquiatrico",
        "nota_exp_cabeza","nota_exp_torax","nota_exp_abdomen","nota_exp_extremidades",
        "nota_exp_neurologico","nota_exp_genitourinario","nota_exp_otros",
        "nota_estudios_previos","nota_estudios_imagen","nota_estudios_solicitados",
        "nota_diagnostico","nota_diagnostico_secundario","nota_pronostico_detalle",
        "nota_tratamiento","nota_indicaciones_reposo","nota_indicaciones_dieta",
        "nota_indicaciones_cita","nota_indicaciones_referencia",
        "nota_notaImportante","nota_evolucion_nota",
        "notaImportante"
    ];

    function createEmptyConsultation(patientId, overrides = {}) {
        return Object.assign({
            id: Date.now(),
            patientId,
            date: new Date().toISOString(),
            createdBy: app().currentUser?.displayName || "Sistema",
            tipoNota: "historia",
            ahf: "", apnp_otros: "",
            app_enfermedades: "", app_cirugias: "", app_traumatismos: "",
            app_alergias: "", app_transfusiones: "", app_medicamentos: "",
            padecimiento_inicio: "", padecimiento_sintomas: "",
            sis_cardiovascular: "", sis_respiratorio: "", sis_digestivo: "",
            sis_neurologico: "", sis_urinario: "", sis_musculoesqueletico: "",
            sis_piel: "", sis_endocrino: "", sis_genitoreproductivo: "", sis_psiquiatrico: "",
            sv_tas: "", sv_tad: "", sv_fc: "", sv_fr: "", sv_temp: "",
            sv_spo2: "", sv_glucemia: "", sv_peso: "", sv_talla: "", sv_dolor: "", sv_habitus: "",
            exp_cabeza: "", exp_torax: "", exp_abdomen: "",
            exp_extremidades: "", exp_neurologico: "", exp_genitourinario: "", exp_otros: "",
            estudios_previos: "", estudios_imagen: "", estudios_solicitados: "",
            diagnostico: "", diagnostico_secundario: "", pronostico_detalle: "",
            tratamiento: "", indicaciones_reposo: "", indicaciones_dieta: "",
            indicaciones_cita: "", indicaciones_referencia: "",
            medicamentos: [],
            medicamentosNota: [],
            evolucion_clinica: "", evol_ta: "", evol_fc: "", evol_fr: "",
            evol_temp: "", evol_spo2: "", evol_peso: "",
            evolucion_resultados: "", evolucion_diagnostico: "", evolucion_tratamiento: "",
            urg_tas: "", urg_tad: "", urg_fc: "", urg_fr: "", urg_temp: "",
            urg_spo2: "", urg_glucemia: "", urg_glasgow: "",
            urg_motivo: "", urg_exploracion: "", urg_estudios: "",
            urg_diagnostico: "", urg_tratamiento: "",
            notaImportante: "", evolucion_nota: "",
            useFreeCapture: true,
            diagnosticos_libre: [],
            notas_libre_medico: "",
            triageLevel: null, triageData: null, status: "active", attachments: []
        }, overrides);
    }

    function createNewConsultation(tipoNotaOverride) {
        const patient = app().currentPatient;
        if (!patient) return;
        const overrides = tipoNotaOverride ? { tipoNota: tipoNotaOverride } : {};
        const consult = createEmptyConsultation(patient.id, overrides);
        global.copyAntecedentsFromPreviousConsultation(consult);
        app().consultations.push(consult);
        global.saveConsultations();
        app().currentConsultation = consult;
        app().selectedDiagnosticos = [];
        global.navigate("medicalRecord");
        renderMedicalRecord();
    }

    function openConsultation(consultId) {
        app().currentConsultation = app().consultations.find((consult) => consult.id === consultId);
        if (!app().currentConsultation) return;
        if (!app().currentPatient || app().currentPatient.id !== app().currentConsultation.patientId) {
            app().currentPatient = app().patients.find((patient) => patient.id === app().currentConsultation.patientId);
        }
        app().selectedDiagnosticos = [];
        global.navigate("medicalRecord");
        renderMedicalRecord();
    }

    function renderMedicalRecord() {
        const consultation = app().currentConsultation;
        const patient = app().currentPatient;
        if (!consultation || !patient) return;

        document.getElementById("patientName").textContent = patient.name;
        document.getElementById("consultationDateLabel").textContent = "Consulta del " + global.formatDateFull(consultation.date);

        const banner = document.getElementById("triageAlertBanner");
        let vitals = {};
        if (consultation.triageLevel && consultation.triageData) {
            const triageData = consultation.triageData;
            vitals = triageData.vitals || triageData;
            banner.className = `triage-alert-banner triage-banner-${triageData.color}`;
            banner.classList.remove("hidden");
            banner.setAttribute("data-fc", vitals.FC || "");
            banner.setAttribute("data-triage-summary", `${vitals.FC || "-"}|${vitals.TAS || "-"}|${vitals.TAD || "-"}|${vitals.spo2 || "-"}`);
            banner.innerHTML = `<strong>Triage:</strong> Nivel ${triageData.number} - ${triageData.label} &nbsp;|&nbsp; Motivo: ${triageData.reason || "-"} &nbsp;|&nbsp; FC: ${vitals.FC || "-"} lpm &nbsp; TA: ${vitals.TAS || "-"}/${vitals.TAD || "-"} mmHg &nbsp; SpO2: ${vitals.spo2 || "-"}%`;
        } else {
            banner.classList.add("hidden");
        }

        const allConsults = app().consultations.filter((item) => item.patientId === patient.id && item.id !== consultation.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const summaryBar = document.getElementById("recordSummaryBar");
        if (allConsults.length > 0) {
            const prev = allConsults[0];
            const prevMedsHtml = global.getMedicationSummary(prev.medicamentos, "html");
            summaryBar.classList.remove("hidden");
            summaryBar.innerHTML = `
                <div class="rsb-label">Resumen del paciente</div>
                <div class="rsb-items">
                    ${patient.allergies ? `<div class="rsb-item rsb-warn"><span>⚠</span><div><b>Alergias:</b> ${patient.allergies}</div></div>` : ""}
                    ${patient.chronicConditions ? `<div class="rsb-item rsb-warn"><span>🩺</span><div><b>Crónicos:</b> ${patient.chronicConditions}</div></div>` : ""}
                    ${patient.alerts ? `<div class="rsb-item rsb-warn"><span>🚨</span><div><b>Alertas:</b> ${patient.alerts}</div></div>` : ""}
                    ${prev.diagnostico ? `<div class="rsb-item"><span>🧾</span><div><b>Último Dx:</b> ${prev.diagnostico.substring(0,80)}</div></div>` : ""}
                    ${prev.tratamiento ? `<div class="rsb-item"><span>💊</span><div><b>Tratamiento previo:</b> ${prev.tratamiento.substring(0,80)}</div></div>` : ""}
                    ${prevMedsHtml ? `<div class="rsb-item"><span>💉</span><div><b>Medicamentos previos:</b> ${prevMedsHtml}</div></div>` : ""}
                    ${(prev.notaImportante || prev.evolucion_nota) ? `<div class="rsb-item rsb-nota"><span>📌</span><div><b>Nota anterior:</b> ${prev.notaImportante || prev.evolucion_nota}</div></div>` : ""}
                </div>`;
        } else {
            summaryBar.classList.add("hidden");
        }

        updateIdentificationCard(consultation, patient);

        // ── Determinar qué tab mostrar ─────────────────────────────────────
        // El rol del usuario tiene prioridad sobre el tipoNota guardado:
        // el enfermero siempre ve su tab sin importar qué guardó el médico,
        // y el médico nunca ve el tab de enfermería.
        let tipoNota;

        const esEnfermero = global.can("canWriteNursingNotes") && !global.can("canWriteMedicalNotes");

        if (esEnfermero) {
            // Enfermero → siempre nota de enfermería.
            // NO sobreescribimos consultation.tipoNota para no alterar el registro del médico.
            tipoNota = "evolucion";
        } else if (global.can("canWriteMedicalNotes")) {
            // Médico → usar el tipoNota guardado en la consulta, o calcularlo si es nueva.
            if (consultation.tipoNota && consultation.tipoNota !== "evolucion") {
                // Ya tiene un tipo médico guardado, respetar.
                tipoNota = consultation.tipoNota;
            } else {
                // Es nueva o solo tenía el tab de enfermería → calcular.
                const prevConsults = app().consultations.filter(
                    c => c.patientId === patient.id && c.id !== consultation.id
                );
                tipoNota = prevConsults.length === 0 ? "historia" : "nota-medica";
                consultation.tipoNota = tipoNota;
            }
        } else {
            // Cualquier otro rol (recepción, admin): solo lectura, mostrar historia.
            tipoNota = consultation.tipoNota || "historia";
        }

        // Modo captura libre: si el médico tiene useFreeCapture activado y no
        // estamos en urgencias, usar el tab libre-medico.
        if (
            consultation.useFreeCapture &&
            global.can("canWriteMedicalNotes") &&
            tipoNota !== "urgencias"
        ) {
            tipoNota = "libre-medico";
        }

        app().currentTab = tipoNota;

        // Ocultar todos los tabs y mostrar el correcto
        document.querySelectorAll(".record-tab-content").forEach((tab) => {
            tab.style.display = "none";
            tab.classList.remove("active");
        });

        const tabEl = document.getElementById("tab-" + tipoNota);
        if (tabEl) {
            tabEl.style.display = "block";
            tabEl.classList.add("active");
        }

        fillRecordFields();
        const isReadOnly = !global.can("canWriteMedicalNotes");
        setRecordReadOnly(isReadOnly);
        const dropZone = document.getElementById("attachDropZone");
        if (dropZone) dropZone.style.display = isReadOnly ? "none" : "";

        setupIMCCalc();
        setupNotaIMCCalc();
        setupNursingIMCCalc();
        setupRecordActions();
        global.renderAttachments();
        global.setupAttachments();
        global.setupAbbreviationDetection();
        renderMedicamentos();
        renderMedicamentosNota();
        // Insertar bloque de documentos clínicos (si el médico tiene permisos)
        if (global.can("canWriteMedicalNotes")) {
            const docsBlock = document.getElementById("consultaDocsBlock");
            if (docsBlock && global.ClinDataModules?.documents) {
                docsBlock.innerHTML = global.ClinDataModules.documents.buildConsultaDocsBlock(consultation);
            }
        }
        global.initDiagnosticoAutocomplete();
        if (typeof global.abrevInit === "function") global.abrevInit();
        if (!isReadOnly) {
            startAutoSave();
            setupAutoSaveEvents();
        }
        if (tipoNota === "libre-medico" && registry.freecapture) {
            registry.freecapture.load();
        }
    }

    function fillRecordFields() {
        const consultation = app().currentConsultation;
        ALL_RECORD_FIELDS.forEach((field) => {
            const el = document.getElementById(field);
            if (el) el.value = consultation[field] || "";
        });
        ["tabaquismo","alcoholismo","toxicomanias","actfisica"].forEach((name) => {
            const val = consultation["radio_" + name] || (name === "actfisica" ? "Sedentario" : "Negativo");
            const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
            if (radio) radio.checked = true;
            const detail = document.getElementById(name + "_detalle");
            if (detail) detail.value = consultation[name + "_detalle"] || "";
        });
        if (consultation.pronostico_radio) {
            const radio = document.querySelector(`input[name="pronostico"][value="${consultation.pronostico_radio}"]`);
            if (radio) radio.checked = true;
        }
        if (consultation.nota_pronostico_radio) {
            const radio = document.querySelector(`input[name="nota_pronostico"][value="${consultation.nota_pronostico_radio}"]`);
            if (radio) radio.checked = true;
        }
        if (consultation.destino_urg) {
            const radio = document.querySelector(`input[name="destino_urg"][value="${consultation.destino_urg}"]`);
            if (radio) radio.checked = true;
        }
        const destinoDetalle = document.getElementById("urg_destino_detalle");
        if (destinoDetalle) destinoDetalle.value = consultation.urg_destino_detalle || "";
        calcIMC();
        calcNotaIMC();

        const nursingFields = [
            "enf_evolucion_clinica","enf_sv_tas","enf_sv_tad","enf_sv_fc","enf_sv_fr",
            "enf_sv_temp","enf_sv_spo2","enf_sv_glucemia","enf_sv_peso","enf_sv_talla",
            "enf_sv_dolor","enf_sv_habitus",
            "enf_exp_cabeza","enf_exp_torax","enf_exp_abdomen","enf_exp_extremidades",
            "enf_exp_neurologico","enf_exp_genitourinario","enf_exp_otros",
            "enf_observaciones","enf_procedimientos","enf_nota_imp"
        ];
        nursingFields.forEach((field) => {
            const el = document.getElementById(field);
            if (el) el.value = consultation[field] || "";
        });
        const enfImcEl = document.getElementById("enf_sv_imc");
        if (enfImcEl) enfImcEl.value = consultation.enf_sv_imc || "";

        // Pre-cargar datos del paciente en Historia Clínica (solo si el campo está vacío)
        const patient = app().currentPatient;
        if (patient && consultation.tipoNota === "historia") {
            const ocupacionEl = document.getElementById("pnp-ocu");
            if (ocupacionEl && !ocupacionEl.value && patient.occupation) {
                ocupacionEl.value = patient.occupation.toUpperCase();
                if (!consultation["pnp-ocu"]) consultation["pnp-ocu"] = patient.occupation.toUpperCase();
            }
            const ecEl = document.getElementById("pnp-ec");
            if (ecEl && !ecEl.value && patient.maritalStatus) {
                ecEl.value = patient.maritalStatus.toUpperCase();
                if (!consultation["pnp-ec"]) consultation["pnp-ec"] = patient.maritalStatus.toUpperCase();
            }
            const alergiasEl = document.getElementById("app_alergias");
            if (alergiasEl && !alergiasEl.value && patient.allergies) {
                alergiasEl.value = patient.allergies.toUpperCase();
                if (!consultation["app_alergias"]) consultation["app_alergias"] = patient.allergies.toUpperCase();
            }
        }

        // Precargar motivo de consulta desde la cola si el campo está vacío
        if (consultation.tipoNota === "nota-medica") {
            const motivoEl = document.getElementById("nota_motivo_consulta");
            if (motivoEl && !motivoEl.value && consultation.queueReason) {
                motivoEl.value = consultation.queueReason.toUpperCase();
                consultation["nota_motivo_consulta"] = motivoEl.value;
            }
        }

        app().selectedDiagnosticos = (consultation.diagnosticos_cie10 || []).map((diagnostico) => ({ ...diagnostico }));
        global.renderDiagBadges();

        // ── Firma compacta ────────────────────────────────────────────────
        const user = app().currentUser;
        const avatarSm = document.getElementById("firmaAvatarSm");
        const avatarSmS = document.getElementById("firmaAvatarSmSigned");
        const nameEl = document.getElementById("firmaAuthorName");
        const nameSignedEl = document.getElementById("firmaAuthorNameSigned");
        const displayName = user?.displayName || "—";
        const initials = displayName.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();

        if (avatarSm) avatarSm.textContent = initials;
        if (avatarSmS) avatarSmS.textContent = initials;
        if (nameEl) nameEl.textContent = displayName;
        if (nameSignedEl) nameSignedEl.textContent = displayName;

        // Campo oculto legacy
        const medHidden = document.getElementById("firma_medico");
        if (medHidden) medHidden.value = consultation.firma_medico || "";

        // Cédula editable
        const cedulaEl = document.getElementById("firma_cedula");
        if (cedulaEl) cedulaEl.value = consultation.firma_cedula || "";

        // Tipo de firma
        const tipoEl = document.getElementById("firma_tipo");
        if (tipoEl) tipoEl.value = consultation.firma_tipo || "electronica";

        const isSigned = !!(consultation.firma_medico && consultation.firma_fecha);
        const stripInner = document.getElementById("firmaStripInner");
        const stripSigned = document.getElementById("firmaStripSigned");
        const btnFirmar = document.getElementById("btnFirmarCompact");
        const btnLimpiar = document.getElementById("btnLimpiarFirma");

        if (stripInner) stripInner.style.display = isSigned ? "none" : "";
        if (stripSigned) stripSigned.style.display = isSigned ? "" : "none";

        if (isSigned) {
            const cedulaS = document.getElementById("firma_cedula_signed");
            const tipoS = document.getElementById("firma_tipo_signed");
            const fechaS = document.getElementById("firma_fecha_display");
            if (cedulaS) cedulaS.value = consultation.firma_cedula || "";
            if (tipoS) tipoS.value = (consultation.firma_tipo || "electrónica");
            if (fechaS) fechaS.value = consultation.firma_fecha || "";
            if (btnLimpiar) btnLimpiar.style.display = "block";
        } else {
            if (btnLimpiar) btnLimpiar.style.display = "none";
        }
    }
    
    function updateIdentificationCard(consultation, patient) {
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = value ? String(value) : "—";
        };

        const motivo = (consultation.queueReason || consultation.nota_motivo_consulta || "").trim();
        const fechaNacimiento = global.formatDate(patient.dob);

        setText("ident_name", patient.name);
        setText("ident_nss", patient.nss);
        setText("ident_hemotipo", patient.hemotype);
        setText("ident_curp", patient.curp);
        setText("ident_sexo", patient.sex);
        setText("ident_edad", patient.age);
        setText("ident_fecha_nacimiento", fechaNacimiento);
        setText("ident_lugar_nacimiento", patient.birthPlace);
        setText("ident_escolaridad", consultation["pnp-esc"] || "");
        setText("ident_ocupacion", patient.occupation);
        setText("ident_estado_civil", patient.maritalStatus);
        setText("ident_religion", patient.religion);
        setText("ident_motivo_consulta", motivo.toUpperCase());
    }

    function setRecordReadOnly(isReadOnly) {
        ALL_RECORD_FIELDS.forEach((field) => {
            const el = document.getElementById(field);
            if (el) el.disabled = isReadOnly;
        });
        document.querySelectorAll(".apnp-radios input, .pronostico-radios input, .destino-radios input").forEach((el) => { el.disabled = isReadOnly; });
        document.querySelectorAll(".apnp-detail").forEach((el) => { el.disabled = isReadOnly; });
        const addMedBtn = document.getElementById("btnAgregarMed");
        if (addMedBtn) addMedBtn.style.display = isReadOnly ? "none" : "";
        if (global.can("canWriteNursingNotes") && !global.can("canWriteMedicalNotes")) {
            const nursingFields = [
                "enf_evolucion_clinica","enf_sv_tas","enf_sv_tad","enf_sv_fc","enf_sv_fr",
                "enf_sv_temp","enf_sv_spo2","enf_sv_glucemia","enf_sv_peso","enf_sv_talla",
                "enf_sv_dolor","enf_sv_habitus","enf_sv_imc",
                "enf_exp_cabeza","enf_exp_torax","enf_exp_abdomen","enf_exp_extremidades",
                "enf_exp_neurologico","enf_exp_genitourinario","enf_exp_otros",
                "enf_observaciones","enf_procedimientos","enf_nota_imp"
            ];
            nursingFields.forEach((field) => {
                const el = document.getElementById(field);
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
                const cat = imc < 18.5 ? "Bajo peso" : imc < 25 ? "Normal" : imc < 30 ? "Sobrepeso" : "Obesidad";
                imcEl.value = `${imc} (${cat})`;
            } else {
                imcEl.value = "";
            }
        };
        peso.removeEventListener("input", peso._enfImcHandler);
        talla.removeEventListener("input", talla._enfImcHandler);
        peso._enfImcHandler = handler;
        talla._enfImcHandler = handler;
        peso.addEventListener("input", handler);
        talla.addEventListener("input", handler);
    }

    function setupNotaIMCCalc() {
        const peso = document.getElementById("nota_sv_peso");
        const talla = document.getElementById("nota_sv_talla");
        if (!peso || !talla) return;
        const handler = () => calcNotaIMC();
        peso.removeEventListener("input", peso._notaImcHandler);
        talla.removeEventListener("input", talla._notaImcHandler);
        peso._notaImcHandler = handler;
        talla._notaImcHandler = handler;
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

    function calcNotaIMC() {
        const peso = parseFloat(document.getElementById("nota_sv_peso")?.value);
        const talla = parseFloat(document.getElementById("nota_sv_talla")?.value);
        const imcDisplay = document.getElementById("nota_sv_imc_display");
        const imcClasif = document.getElementById("nota_sv_imc_clasif");
        if (!imcDisplay || !imcClasif) return;
        if (peso && talla) {
            const tallaM = talla / 100;
            const imc = (peso / (tallaM * tallaM)).toFixed(1);
            let cat = "";
            if (imc < 18.5) cat = "Bajo peso";
            else if (imc < 25) cat = "Normal";
            else if (imc < 30) cat = "Sobrepeso";
            else cat = "Obesidad";
            imcDisplay.value = imc;
            imcClasif.textContent = cat;
        } else {
            imcDisplay.value = "—";
            imcClasif.textContent = "";
        }
    }

    function agregarMedicamento() {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        if (!consultation.medicamentos) consultation.medicamentos = [];
        consultation.medicamentos.push({ id: Date.now(), nombre: "", concentracion: "", dosis: "", via: "", frecuencia: "", duracion: "" });
        global.saveConsultations();
        renderMedicamentos();
    }

    function renderMedicamentos() {
        const list = document.getElementById("medicamentosList");
        const consultation = app().currentConsultation;
        if (!list || !consultation) return;
        const meds = consultation.medicamentos || [];
        const isReadOnly = !global.can("canWriteMedicalNotes");
        if (meds.length === 0) {
            list.innerHTML = `<div class="med-empty">Sin medicamentos prescritos. Use el botón "Agregar medicamento" o el campo de texto libre abajo.</div>`;
            return;
        }
        list.innerHTML = meds.map((med, idx) => `
            <div class="med-row" data-id="${med.id}">
                <div class="med-num">${idx + 1}</div>
                <div class="med-fields">
                    <input class="med-input" type="text" placeholder="Nombre del medicamento" value="${med.nombre || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamento(${med.id},'nombre',this.value)">
                    <input class="med-input med-conc" type="text" placeholder="Concentración" value="${med.concentracion || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamento(${med.id},'concentracion',this.value)">
                    <input class="med-input med-dosis" type="text" placeholder="Dosis" value="${med.dosis || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamento(${med.id},'dosis',this.value)">
                    <select class="med-input med-via" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamento(${med.id},'via',this.value)">
                        <option value="">Vía...</option>
                        <option ${med.via === 'VO' ? 'selected' : ''}>VO</option>
                        <option ${med.via === 'IV' ? 'selected' : ''}>IV</option>
                        <option ${med.via === 'IM' ? 'selected' : ''}>IM</option>
                        <option ${med.via === 'SC' ? 'selected' : ''}>SC</option>
                        <option ${med.via === 'SL' ? 'selected' : ''}>SL</option>
                        <option ${med.via === 'Tópica' ? 'selected' : ''}>Tópica</option>
                        <option ${med.via === 'Inhalada' ? 'selected' : ''}>Inhalada</option>
                    </select>
                    <input class="med-input med-freq" type="text" placeholder="Frecuencia (ej: c/8h)" value="${med.frecuencia || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamento(${med.id},'frecuencia',this.value)">
                    <input class="med-input med-dur" type="text" placeholder="Duración (ej: 7 días)" value="${med.duracion || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamento(${med.id},'duracion',this.value)">
                </div>
                ${!isReadOnly ? `<button class="med-delete" onclick="eliminarMedicamento(${med.id})" title="Eliminar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>` : ''}
            </div>`).join("");
    }

    function updateMedicamento(id, field, value) {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        const med = (consultation.medicamentos || []).find((item) => item.id === id);
        if (med) {
            med[field] = value;
            global.saveConsultations();
        }
    }

    function eliminarMedicamento(id) {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        consultation.medicamentos = (consultation.medicamentos || []).filter((item) => item.id !== id);
        global.saveConsultations();
        renderMedicamentos();
    }

    function agregarMedicamentoNota() {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        if (!consultation.medicamentosNota) consultation.medicamentosNota = [];
        consultation.medicamentosNota.push({ id: Date.now(), nombre: "", concentracion: "", dosis: "", via: "", frecuencia: "", duracion: "" });
        global.saveConsultations();
        renderMedicamentosNota();
    }

    function renderMedicamentosNota() {
        const list = document.getElementById("medicamentosNotaList");
        const consultation = app().currentConsultation;
        if (!list || !consultation) return;
        const meds = consultation.medicamentosNota || [];
        const isReadOnly = !global.can("canWriteMedicalNotes");
        if (meds.length === 0) {
            list.innerHTML = `<div class="med-empty">Sin medicamentos prescritos. Use el botón "Agregar medicamento" o el campo de texto libre abajo.</div>`;
            return;
        }
        list.innerHTML = meds.map((med, idx) => `
            <div class="med-row" data-id="${med.id}">
                <div class="med-num">${idx + 1}</div>
                <div class="med-fields">
                    <input class="med-input" type="text" placeholder="Nombre del medicamento" value="${med.nombre || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamentoNota(${med.id},'nombre',this.value)">
                    <input class="med-input med-conc" type="text" placeholder="Concentración" value="${med.concentracion || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamentoNota(${med.id},'concentracion',this.value)">
                    <input class="med-input med-dosis" type="text" placeholder="Dosis" value="${med.dosis || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamentoNota(${med.id},'dosis',this.value)">
                    <select class="med-input med-via" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamentoNota(${med.id},'via',this.value)">
                        <option value="">Vía...</option>
                        <option ${med.via === 'VO' ? 'selected' : ''}>VO</option>
                        <option ${med.via === 'IV' ? 'selected' : ''}>IV</option>
                        <option ${med.via === 'IM' ? 'selected' : ''}>IM</option>
                        <option ${med.via === 'SC' ? 'selected' : ''}>SC</option>
                        <option ${med.via === 'SL' ? 'selected' : ''}>SL</option>
                        <option ${med.via === 'Tópica' ? 'selected' : ''}>Tópica</option>
                        <option ${med.via === 'Inhalada' ? 'selected' : ''}>Inhalada</option>
                    </select>
                    <input class="med-input med-freq" type="text" placeholder="Frecuencia (ej: c/8h)" value="${med.frecuencia || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamentoNota(${med.id},'frecuencia',this.value)">
                    <input class="med-input med-dur" type="text" placeholder="Duración (ej: 7 días)" value="${med.duracion || ''}" ${isReadOnly ? 'disabled' : ''} onchange="updateMedicamentoNota(${med.id},'duracion',this.value)">
                </div>
                ${!isReadOnly ? `<button class="med-delete" onclick="eliminarMedicamentoNota(${med.id})" title="Eliminar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>` : ''}
            </div>`).join("");
    }

    function updateMedicamentoNota(id, field, value) {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        const med = (consultation.medicamentosNota || []).find((item) => item.id === id);
        if (med) {
            med[field] = value;
            global.saveConsultations();
        }
    }

    function eliminarMedicamentoNota(id) {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        consultation.medicamentosNota = (consultation.medicamentosNota || []).filter((item) => item.id !== id);
        global.saveConsultations();
        renderMedicamentosNota();
    }

    function setupRecordActions() {
        const el = document.getElementById("recordFormActions");
        if (!el) return;
        const headerEl = document.getElementById("recordHeaderActions");
        if (headerEl) headerEl.innerHTML = "";
        if (global.can("canWriteMedicalNotes")) {
            el.innerHTML = `
                <button class="btn-secondary" onclick="goBackFromRecord()">Cancelar</button>
                <button class="btn-secondary" onclick="abrevIniciarExport('patient')">PDF Paciente</button>
                <button class="btn-secondary" onclick="abrevIniciarExport('doctor')">PDF Médico</button>
                <button class="btn-secondary" onclick="saveRecord()">Guardar</button>
                <button class="btn-primary" onclick="closeConsultation()">Marcar como Atendido</button>`;
        } else if (global.can("canWriteNursingNotes")) {
            el.innerHTML = `
                <button class="btn-secondary" onclick="goBackFromRecord()">Cancelar</button>
                <button class="btn-primary" onclick="saveNursingNote()">Guardar Nota de Enfermería</button>`;
        } else {
            el.innerHTML = `
                <button class="btn-secondary" onclick="goBackFromRecord()">Volver</button>
                <button class="btn-secondary" onclick="abrevIniciarExport('patient')">PDF Paciente</button>
                <button class="btn-secondary" onclick="abrevIniciarExport('doctor')">PDF Médico</button>
                <p class="readonly-note">Vista de solo lectura — Solo el médico puede editar notas clínicas.</p>`;
        }
    }

    function collectRecordFields() {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        ALL_RECORD_FIELDS.forEach((field) => {
            const el = document.getElementById(field);
            if (el) consultation[field] = el.value;
        });
        ["tabaquismo","alcoholismo","toxicomanias","actfisica"].forEach((name) => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (checked) consultation["radio_" + name] = checked.value;
            const detail = document.getElementById(name + "_detalle");
            if (detail) consultation[name + "_detalle"] = detail.value;
        });
        const pronostico = document.querySelector('input[name="pronostico"]:checked');
        if (pronostico) consultation.pronostico_radio = pronostico.value;
        const destino = document.querySelector('input[name="destino_urg"]:checked');
        if (destino) consultation.destino_urg = destino.value;
        const dd = document.getElementById("urg_destino_detalle");
        if (dd) consultation.urg_destino_detalle = dd.value;
        const cedulaEl = document.getElementById("firma_cedula");
        if (cedulaEl) consultation.firma_cedula = cedulaEl.value;
        const tipoEl = document.getElementById("firma_tipo");
        if (tipoEl) consultation.firma_tipo = tipoEl.value;
        consultation.diagnosticos_cie10 = [...(app().selectedDiagnosticos || [])];
        consultation.tipoNota = app().currentTab;

        // Forzar uppercase al guardar en todos los campos de texto clínico
        ALL_RECORD_FIELDS.forEach((field) => {
            if (consultation[field] && typeof consultation[field] === "string") {
                const el = document.getElementById(field);
                if (el && el.type !== "number" && !el.readOnly && !el.disabled) {
                    consultation[field] = consultation[field].toUpperCase();
                }
            }
        });

        // Campos de enfermería también en uppercase
        const enfTextFields = [
            "enf_evolucion_clinica","enf_sv_habitus",
            "enf_exp_cabeza","enf_exp_torax","enf_exp_abdomen","enf_exp_extremidades",
            "enf_exp_neurologico","enf_exp_genitourinario","enf_exp_otros",
            "enf_observaciones","enf_procedimientos","enf_nota_imp"
        ];
        enfTextFields.forEach((field) => {
            if (consultation[field] && typeof consultation[field] === "string") {
                consultation[field] = consultation[field].toUpperCase();
            }
        });
    }

    function saveRecord() {
        collectRecordFields();
        global.saveConsultations();
        global.showToast("Consulta guardada.", "success");
        showAutoSave();
    }

    function closeConsultation() {
        collectRecordFields();
        const consultation = app().currentConsultation;
        if (!consultation) return;
        consultation.status = "closed";
        if (app().currentPatient && consultation.tratamiento) {
            app().currentPatient.currentTreatment = consultation.tratamiento;
            global.savePatients();
        }
        // Si la consulta estaba ligada a una entrada de cola, asegurarse de que quede como attended
        if (consultation.queueEntryId) {
            const queueEntry = app().consultQueue.find(e => e.id === consultation.queueEntryId);
            if (queueEntry) {
                queueEntry.status = "attended";
                global.saveConsultQueue();
            }
        }
        global.saveConsultations();
        global.showToast("Consulta cerrada — paciente marcado como atendido.", "success");
        global.navigate("expediente");
    }

    function saveNursingNote() {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        const nursingFields = [
            "enf_evolucion_clinica","enf_sv_tas","enf_sv_tad","enf_sv_fc","enf_sv_fr",
            "enf_sv_temp","enf_sv_spo2","enf_sv_glucemia","enf_sv_peso","enf_sv_talla",
            "enf_sv_dolor","enf_sv_habitus",
            "enf_exp_cabeza","enf_exp_torax","enf_exp_abdomen","enf_exp_extremidades",
            "enf_exp_neurologico","enf_exp_genitourinario","enf_exp_otros",
            "enf_observaciones","enf_procedimientos","enf_nota_imp"
        ];
        nursingFields.forEach((field) => {
            const el = document.getElementById(field);
            if (el) consultation[field] = el.value;
        });
        const peso = parseFloat(document.getElementById("enf_sv_peso")?.value);
        const talla = parseFloat(document.getElementById("enf_sv_talla")?.value);
        if (peso && talla) {
            const tallaM = talla / 100;
            consultation.enf_sv_imc = (peso / (tallaM * tallaM)).toFixed(1);
        }
        consultation.nursingUpdatedBy = app().currentUser?.displayName;
        consultation.nursingUpdatedAt = new Date().toISOString();
        global.saveConsultations();
        global.showToast("Nota de enfermería guardada correctamente.", "success");
        showAutoSave();
    }

    function firmarExpediente() {
        const consultation = app().currentConsultation;
        const currentUser = app().currentUser;
        if (!consultation || !currentUser) return;

        // Para historia clínica se requiere diagnóstico; para nota médica no
        const tipoNota = consultation.tipoNota || "historia";
        if (tipoNota === "historia" && !consultation.tratamiento && !consultation.diagnostico) {
            global.showToast("Por favor completa al menos el diagnóstico antes de firmar.", "error");
            return;
        }
        const tipo = document.getElementById("firma_tipo")?.value || "electronica";
        const cedula = document.getElementById("firma_cedula")?.value || "";
        const ahora = new Date().toLocaleString("es-MX", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
        consultation.firma_medico = currentUser.displayName;
        consultation.firma_cedula = cedula;
        consultation.firma_tipo = tipo;
        consultation.firma_fecha = ahora;
        collectRecordFields();
        global.saveConsultations();
        fillRecordFields();
        global.showToast("Expediente firmado correctamente.", "success");
    }

    function limpiarFirma() {
        const consultation = app().currentConsultation;
        if (!consultation) return;
        if (confirm("¿Estás seguro de que deseas remover la firma del expediente?")) {
            delete consultation.firma_medico;
            delete consultation.firma_cedula;
            delete consultation.firma_tipo;
            delete consultation.firma_fecha;
            global.saveConsultations();
            fillRecordFields();
            global.showToast("Firma removida del expediente.", "success");
        }
    }

    function startAutoSave() {
        stopAutoSave();
        app().autoSaveTimer = setInterval(saveCurrentRecord, 30000);
    }

    function stopAutoSave() {
        if (app().autoSaveTimer) clearInterval(app().autoSaveTimer);
    }

    function saveCurrentRecord() {
        if (!app().currentConsultation) return;
        collectRecordFields();
        global.saveConsultations();
        showAutoSave();
    }

    function setupAutoSaveEvents() {
        ALL_RECORD_FIELDS.forEach((id) => {
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
        setTimeout(() => {
            el.textContent = "Guardado";
            if (dot) dot.style.background = "#22c55e";
        }, 800);
    }

    registry.consultation = {
        ALL_RECORD_FIELDS,
        createEmptyConsultation,
        createNewConsultation,
        openConsultation,
        renderMedicalRecord,
        fillRecordFields,
        setRecordReadOnly,
        setupIMCCalc,
        setupNotaIMCCalc,
        setupNursingIMCCalc,
        calcIMC,
        calcNotaIMC,
        agregarMedicamento,
        renderMedicamentos,
        updateMedicamento,
        eliminarMedicamento,
        agregarMedicamentoNota,
        renderMedicamentosNota,
        updateMedicamentoNota,
        eliminarMedicamentoNota,
        setupRecordActions,
        collectRecordFields,
        saveRecord,
        closeConsultation,
        saveNursingNote,
        firmarExpediente,
        limpiarFirma,
        startAutoSave,
        stopAutoSave,
        saveCurrentRecord,
        setupAutoSaveEvents,
        showAutoSave
    };
})(window);
