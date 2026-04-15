(function initExportModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    function highlightText(text) {
        const isAbbrForm = typeof global.abrevEsFormularioAbreviaturas === "function" ? global.abrevEsFormularioAbreviaturas() : false;
        return String(text || "").split(/\s+/).map((raw) => {
            const upper = raw.toUpperCase();
            if (isAbbrForm) {
                if (global.COMMON_UPPER_NOT_ABBR?.has(upper) || /^[0-9]+$/.test(upper)) return raw;
                if (global.abbreviations?.[upper]) return `<span class="abbr-valid" title="${global.abbreviations[upper]}">${raw}</span>`;
                return `<span class="abbr-invalid" title="Abreviatura no reconocida">${raw}</span>`;
            }
            return raw;
        }).join(" ");
    }

    function expandAbbreviations(text, mode = "patient") {
        if (!text) return "";
        return text.split(" ").map((raw) => {
            const key = raw.toUpperCase();
            if (key.length <= global.ABBR_MAX_LENGTH && global.abbreviations?.[key]) {
                return mode === "patient" ? global.abbreviations[key] : `${global.abbreviations[key]} (${key})`;
            }
            return raw;
        }).join(" ");
    }

    function exportPDF(type) {
        const currentConsultation = app().currentConsultation;
        const currentPatient = app().currentPatient;
        if (!currentConsultation || !currentPatient) return;
        if (!window.jspdf || !window.jspdf.jsPDF) {
            openPrintableRecord(type);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 15;
        const margin = 15;
        const pageW = 210;
        const contentW = pageW - margin * 2;

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, 24, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("ClinData — Expediente Clínico", margin, 14);
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        doc.text("NOM-004-SSA3-2012", margin, 20);
        doc.text(type === "patient" ? "Versión para paciente" : "Versión para médico / equipo de salud", pageW - margin, 14, { align: "right" });

        y = 32;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(13);
        doc.setFont(undefined, "bold");
        doc.text(`Paciente: ${currentPatient.name}`, margin, y); y += 7;
        doc.setFontSize(9.5);
        doc.setFont(undefined, "normal");
        if (currentPatient.expediente) { doc.text(`Expediente: ${currentPatient.expediente}`, margin, y); y += 5.5; }
        doc.text(`Edad: ${currentPatient.age} años  |  Sexo: ${currentPatient.sex}  |  Fecha: ${global.formatDateFull(currentConsultation.date)}`, margin, y); y += 5.5;
        if (currentPatient.dob || currentPatient.birthPlace) { doc.text(`Nacimiento: ${currentPatient.dob ? global.formatDate(currentPatient.dob) : "—"}  |  Lugar: ${currentPatient.birthPlace || "—"}`, margin, y); y += 5.5; }
        if (currentPatient.nationality || currentPatient.curp || currentPatient.rfc || currentPatient.nss) { doc.text(`Nacionalidad: ${currentPatient.nationality || "—"}  |  CURP: ${currentPatient.curp || "—"}  |  RFC: ${currentPatient.rfc || "—"}  |  NSS: ${currentPatient.nss || "—"}`, margin, y); y += 5.5; }
        if (currentPatient.address) { doc.text(`Domicilio: ${currentPatient.address || "—"}`, margin, y); y += 5.5; }
        if (currentPatient.occupation || currentPatient.phone) { doc.text(`Ocupación: ${currentPatient.occupation || "—"}  |  Tel: ${currentPatient.phone || "—"}`, margin, y); y += 5.5; }
        if (currentPatient.allergies) { doc.setTextColor(180, 0, 0); doc.text(`⚠ Alergias: ${currentPatient.allergies}`, margin, y); doc.setTextColor(0, 0, 0); y += 5.5; }
        if (currentPatient.chronicConditions) { doc.text(`Padecimientos crónicos: ${currentPatient.chronicConditions}`, margin, y); y += 5.5; }
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageW - margin, y); y += 6;

        function addSection(title, text) {
            if (!text || text.trim() === "") return;
            if (y > 255) { doc.addPage(); y = 15; }
            doc.setFontSize(10.5); doc.setFont(undefined, "bold"); doc.setTextColor(14, 165, 233);
            doc.text(title, margin, y); y += 5.5;
            doc.setTextColor(0, 0, 0); doc.setFont(undefined, "normal"); doc.setFontSize(9.5);
            const lines = doc.splitTextToSize(expandAbbreviations(text, type), contentW);
            lines.forEach((line) => {
                if (y > 270) { doc.addPage(); y = 15; }
                doc.text(line, margin, y); y += 5;
            });
            y += 3;
        }

        const c = currentConsultation;
        const tipoNota = c.tipoNota || "historia";
        if (tipoNota === "historia") {
            doc.setFontSize(11); doc.setFont(undefined, "bold"); doc.text("HISTORIA CLÍNICA / NOTA DE INGRESO", margin, y); y += 7;
            addSection("Antecedentes Heredofamiliares (AHF)", c.ahf);
            addSection("Antecedentes Personales No Patológicos (APNP)", [c.apnp_otros].filter(Boolean).join("\n"));
            addSection("Antecedentes Personales Patológicos (APP)", [c.app_enfermedades, c.app_cirugias, c.app_traumatismos, c.app_alergias, c.app_transfusiones, c.app_medicamentos].filter(Boolean).join("\n"));
            addSection("Padecimiento Actual", [(c.padecimiento_inicio ? "Inicio: " + c.padecimiento_inicio : ""), (c.padecimiento_sintomas ? "Síntomas: " + c.padecimiento_sintomas : "")].filter(Boolean).join("\n"));
            addSection("Signos Vitales y Somatometría", `TA: ${c.sv_tas || "—"}/${c.sv_tad || "—"} mmHg | FC: ${c.sv_fc || "—"} lpm | FR: ${c.sv_fr || "—"} rpm | Temp: ${c.sv_temp || "—"}°C | SpO₂: ${c.sv_spo2 || "—"}% | Peso: ${c.sv_peso || "—"} kg | Talla: ${c.sv_talla || "—"} cm | Glucemia: ${c.sv_glucemia || "—"} mg/dL | Dolor: ${c.sv_dolor || "—"}/10`);
            addSection("Exploración Física", [c.exp_cabeza && "Cabeza/cuello: " + c.exp_cabeza, c.exp_torax && "Tórax: " + c.exp_torax, c.exp_abdomen && "Abdomen: " + c.exp_abdomen, c.exp_extremidades && "Extremidades: " + c.exp_extremidades, c.exp_neurologico && "Neurológico: " + c.exp_neurologico, c.exp_otros && "Otros: " + c.exp_otros].filter(Boolean).join("\n"));
            addSection("Estudios de Laboratorio y Gabinete", c.estudios_previos);
            addSection("Diagnóstico Principal", c.diagnostico);
            addSection("Diagnósticos Secundarios / Diferenciales", c.diagnostico_secundario);
            addSection("Pronóstico", (c.pronostico_radio ? c.pronostico_radio + ": " : "") + c.pronostico_detalle);
            const medsTxt = (c.medicamentos || []).map((med, i) => `${i + 1}. ${med.nombre || ""} ${med.concentracion || ""} — ${med.dosis || ""} ${med.via || ""} ${med.frecuencia || ""} por ${med.duracion || ""}`).join("\n");
            addSection("Medicamentos Prescritos", medsTxt || c.tratamiento || "");
            addSection("Indicaciones al Paciente", [c.indicaciones_reposo && "Reposo: " + c.indicaciones_reposo, c.indicaciones_dieta && "Dieta: " + c.indicaciones_dieta, c.indicaciones_cita && "Seguimiento: " + c.indicaciones_cita, c.indicaciones_referencia && "Referencia: " + c.indicaciones_referencia].filter(Boolean).join("\n"));
            if (c.notaImportante) addSection("Nota Importante", c.notaImportante);
        } else if (tipoNota === "evolucion") {
            doc.setFontSize(11); doc.setFont(undefined, "bold"); doc.text("NOTA MÉDICA", margin, y); y += 7;
            addSection("Evolución del cuadro clínico", c.evolucion_clinica);
            if (c.evol_ta || c.evol_fc) addSection("Signos Vitales", `TA: ${c.evol_ta || "—"} | FC: ${c.evol_fc || "—"} lpm | FR: ${c.evol_fr || "—"} rpm | Temp: ${c.evol_temp || "—"}°C | SpO₂: ${c.evol_spo2 || "—"}%`);
            addSection("Nuevos Resultados de Estudios", c.evolucion_resultados);
            addSection("Diagnóstico Actualizado", c.evolucion_diagnostico);
            addSection("Tratamiento e Indicaciones", c.evolucion_tratamiento);
            if (c.evolucion_nota) addSection("Nota Importante", c.evolucion_nota);
        } else {
            doc.setFontSize(11); doc.setFont(undefined, "bold"); doc.text("NOTA INICIAL DE URGENCIAS", margin, y); y += 7;
            addSection("Signos Vitales al Ingreso", `TA: ${c.urg_tas || "—"}/${c.urg_tad || "—"} mmHg | FC: ${c.urg_fc || "—"} lpm | FR: ${c.urg_fr || "—"} rpm | Temp: ${c.urg_temp || "—"}°C | SpO₂: ${c.urg_spo2 || "—"}% | Glucemia: ${c.urg_glucemia || "—"} mg/dL | Glasgow: ${c.urg_glasgow || "—"}`);
            addSection("Motivo de Atención en Urgencias", c.urg_motivo);
            addSection("Resumen Interrogatorio y Exploración", c.urg_exploracion);
            addSection("Resultados de Estudios Iniciales", c.urg_estudios);
            addSection("Diagnóstico en Urgencias", c.urg_diagnostico);
            addSection("Tratamiento y Pronóstico", c.urg_tratamiento);
        }

        if (c.firma_medico) {
            y += 8;
            if (y > 255) { doc.addPage(); y = 15; }
            doc.setFontSize(10.5); doc.setFont(undefined, "bold"); doc.setTextColor(14, 165, 233);
            doc.text("AUTORÍA Y FIRMA ELECTRÓNICA", margin, y); y += 5.5;
            doc.setTextColor(0, 0, 0); doc.setFont(undefined, "normal"); doc.setFontSize(9.5);
            const firmaInfo = [`Médico responsable: ${c.firma_medico}`, `Tipo de firma: ${c.firma_tipo || "electrónica"}`, `Fecha y hora: ${c.firma_fecha || global.formatDate(currentConsultation.date)}`];
            if (c.firma_cedula) firmaInfo.push(`Cédula profesional: ${c.firma_cedula}`);
            firmaInfo.forEach((line) => {
                if (y > 270) { doc.addPage(); y = 15; }
                doc.text(line, margin, y); y += 5;
            });
            y += 3;
        }

        const pages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(150);
            doc.text(`ClinData — NOM-004-SSA3-2012 — ${new Date().toLocaleDateString("es-MX")} — Página ${i}/${pages}`, pageW / 2, 290, { align: "center" });
        }
        doc.save(`expediente_${currentPatient.name.replace(/\s/g, "_")}_${tipoNota}_${type}.pdf`);
    }

    function getExpandedPrintableText(text, type, replacements = {}) {
        let output = String(text || "");
        Object.entries(replacements || {}).forEach(([source, target]) => {
            output = output.replace(new RegExp(`\\b${global.escapeRegExp(source)}\\b`, "gi"), target);
        });
        if (typeof global.abrevExpandir === "function") return global.abrevExpandir(output, type);
        return expandAbbreviations(output, type);
    }

    function getPrintableSections(type = "patient", replacements = {}) {
        const c = app().currentConsultation;
        const tipoNota = c.tipoNota || "historia";
        const sections = [];
        const add = (title, text) => {
            if (text && String(text).trim()) sections.push({ title, text: getExpandedPrintableText(text, type, replacements) });
        };
        if (tipoNota === "historia") {
            add("Antecedentes heredofamiliares", c.ahf);
            add("Antecedentes personales no patológicos", c.apnp_otros);
            add("Antecedentes personales patológicos", [c.app_enfermedades, c.app_cirugias, c.app_traumatismos, c.app_alergias, c.app_transfusiones, c.app_medicamentos].filter(Boolean).join("\n"));
            add("Padecimiento actual", [c.padecimiento_inicio, c.padecimiento_sintomas].filter(Boolean).join("\n"));
            add("Exploración física", [c.exp_cabeza, c.exp_torax, c.exp_abdomen, c.exp_extremidades, c.exp_neurologico, c.exp_genitourinario, c.exp_otros].filter(Boolean).join("\n"));
            add("Estudios", [c.estudios_previos, c.estudios_imagen, c.estudios_solicitados].filter(Boolean).join("\n"));
            add("Diagnóstico principal", c.diagnostico);
            add("Diagnósticos secundarios", c.diagnostico_secundario);
            add("Pronóstico", [c.pronostico_radio, c.pronostico_detalle].filter(Boolean).join(" "));
            add("Tratamiento", c.tratamiento);
            add("Indicaciones", [c.indicaciones_reposo, c.indicaciones_dieta, c.indicaciones_cita, c.indicaciones_referencia].filter(Boolean).join("\n"));
            add("Nota importante", c.notaImportante);
        } else if (tipoNota === "evolucion") {
            add("Evolución del cuadro clínico", c.evolucion_clinica);
            add("Resultados de estudios", c.evolucion_resultados);
            add("Diagnóstico actualizado", c.evolucion_diagnostico);
            add("Tratamiento e indicaciones", c.evolucion_tratamiento);
            add("Nota importante", c.evolucion_nota);
        } else {
            add("Motivo de atención en urgencias", c.urg_motivo);
            add("Resumen de interrogatorio y exploración", c.urg_exploracion);
            add("Resultados de estudios iniciales", c.urg_estudios);
            add("Diagnóstico en urgencias", c.urg_diagnostico);
            add("Tratamiento y pronóstico", c.urg_tratamiento);
            add("Destino del paciente", [c.destino_urg, c.urg_destino_detalle].filter(Boolean).join(" — "));
        }
        return { tipoNota, sections };
    }

    function openPrintableRecord(type = "patient", extras = {}, replacements = {}) {
        const currentConsultation = app().currentConsultation;
        const currentPatient = app().currentPatient;
        if (!currentConsultation || !currentPatient) return;
        const printable = getPrintableSections(type, replacements);
        const win = window.open("about:blank", "_blank", "noopener,noreferrer");
        if (!win) {
            global.showToast("No se pudo abrir la vista imprimible. Revisa el bloqueador de ventanas.", "error");
            return;
        }
        const signatureHtml = currentConsultation.firma_medico ? `
            <section class="print-section">
                <h3>Autoría y firma</h3>
                <p><strong>Médico:</strong> ${global.escapeHtml(currentConsultation.firma_medico)}</p>
                <p><strong>Tipo:</strong> ${global.escapeHtml(currentConsultation.firma_tipo || "electrónica")}</p>
                <p><strong>Fecha:</strong> ${global.escapeHtml(currentConsultation.firma_fecha || "")}</p>
                ${currentConsultation.firma_cedula ? `<p><strong>Cédula:</strong> ${global.escapeHtml(currentConsultation.firma_cedula)}</p>` : ""}
            </section>` : "";

        win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>ClinData - Vista imprimible</title><style>
            body{font-family:Segoe UI,Tahoma,sans-serif;background:#f3f6fb;color:#102033;margin:0;padding:32px}
            .sheet{max-width:920px;margin:0 auto;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(15,23,42,.12);overflow:hidden}
            .hero{background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;padding:28px 32px}
            .hero h1{margin:0 0 6px;font-size:24px}.hero p{margin:0;font-size:14px;opacity:.9}
            .meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:24px 32px;border-bottom:1px solid #dbe4f0}
            .meta-card{background:#f8fbff;border:1px solid #d7e3f4;border-radius:12px;padding:12px 14px}
            .meta-card strong{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#4f647f;margin-bottom:4px}
            .content{padding:24px 32px 32px}.print-section{border:1px solid #dbe4f0;border-radius:14px;padding:16px 18px;margin-bottom:16px;background:#fff}
            .print-section h3{margin:0 0 10px;color:#174a8b;font-size:16px}.print-section p{margin:0;white-space:pre-wrap;line-height:1.55}
            @media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border-radius:0}.print-section{break-inside:avoid}}
        </style></head><body><div class="sheet"><div class="hero"><h1>ClinData · Vista imprimible</h1><p>${global.escapeHtml(type === "patient" ? "Versión para paciente" : "Versión para médico")} · ${global.escapeHtml(printable.tipoNota)}</p></div>
        <div class="meta"><div class="meta-card"><strong>Paciente</strong>${global.escapeHtml(currentPatient.name)}</div><div class="meta-card"><strong>Expediente</strong>${global.escapeHtml(currentPatient.expediente || "Pendiente")}</div><div class="meta-card"><strong>Edad / Sexo</strong>${global.escapeHtml(`${currentPatient.age} años · ${currentPatient.sex}`)}</div><div class="meta-card"><strong>Fecha</strong>${global.escapeHtml(global.formatDateFull(currentConsultation.date))}</div><div class="meta-card"><strong>Alergias</strong>${global.escapeHtml(currentPatient.allergies || "No refiere")}</div></div>
        <div class="content">${printable.sections.map((section) => `<section class="print-section"><h3>${global.escapeHtml(section.title)}</h3><p>${global.escapeHtml(section.text)}</p></section>`).join("")}${signatureHtml}</div></div></body></html>`);
        win.document.close();
        global.showToast("No se detectó la librería PDF. Se abrió una versión imprimible para guardar como PDF desde el navegador.", "info");
        setTimeout(() => { try { win.focus(); win.print(); } catch (error) {} }, 350);
    }

    registry.exporter = { highlightText, expandAbbreviations, exportPDF, getExpandedPrintableText, getPrintableSections, openPrintableRecord };
})(window);
