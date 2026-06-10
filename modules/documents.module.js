// =============================================
//  ClinData — documents.module.js  v1
//  Módulo de Documentación Clínica y Órdenes
//  NOM-004-SSA3-2012 + RIS + NOM-006 + NOM-229
// =============================================

(function initDocumentsModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    // ── Catálogo de documentos disponibles ───────────────────────────────────
    const DOC_CATALOG = {
        clinicos: [
            { id: 'receta',          label: 'Receta médica',           icon: '💊', perms: ['medico'] },
            { id: 'justificacion',   label: 'Justificación médica',    icon: '📋', perms: ['medico'] },
            { id: 'consentimiento',  label: 'Consentimiento informado',icon: '✍️', perms: ['medico'] },
            { id: 'postoperatoria',  label: 'Nota postoperatoria',     icon: '🏥', perms: ['medico'] },
        ],
        administrativos: [
            { id: 'informe',         label: 'Informe / Referencia',    icon: '📄', perms: ['medico', 'recepcion'] },
            { id: 'imagenologia',    label: 'Orden de imagenología',   icon: '🖼',  perms: ['medico'] },
        ],
        ordenes: [
            { id: 'fisioterapia',    label: 'Orden de fisioterapia',   icon: '🦽', perms: ['medico'] },
            { id: 'laboratorio',     label: 'Orden de laboratorio',    icon: '🧪', perms: ['medico'] },
            { id: 'preoperatoria',   label: 'Valoración preoperatoria',icon: '⚕️', perms: ['medico'] },
        ],
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function fmtDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });
    }

    function fmtDateTime(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    }

    function canUseDoc(doc) {
        const role = app().currentUser?.role || '';
        return doc.perms.includes(role);
    }

    function getPatientDocs(patientId) {
        const all = JSON.parse(localStorage.getItem('cd_documents') || '[]');
        return all.filter(d => d.patientId === patientId);
    }

    function saveDocument(doc) {
        const all = JSON.parse(localStorage.getItem('cd_documents') || '[]');
        const idx = all.findIndex(d => d.id === doc.id);
        if (idx >= 0) all[idx] = doc;
        else all.push(doc);
        localStorage.setItem('cd_documents', JSON.stringify(all));
    }

    function deleteDocument(docId) {
        const all = JSON.parse(localStorage.getItem('cd_documents') || '[]');
        localStorage.setItem('cd_documents', JSON.stringify(all.filter(d => d.id !== docId)));
    }

    function getEstablecimiento() {
        return {
            nombre: 'ClinData — Clínica Médica',
            direccion: 'Mérida, Yucatán, México',
            telefono: '',
            licencia: '',
        };
    }

    // ── DRAWER (panel lateral) ────────────────────────────────────────────────
    function openDrawer(title, bodyHTML, onSave) {
        let drawer = document.getElementById('docDrawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'docDrawer';
            drawer.className = 'doc-drawer';
            drawer.innerHTML = `
                <div class="doc-drawer-overlay" onclick="closeDocDrawer()"></div>
                <div class="doc-drawer-panel">
                    <div class="doc-drawer-header">
                        <span class="doc-drawer-title" id="docDrawerTitle"></span>
                        <button class="doc-drawer-close" onclick="closeDocDrawer()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="doc-drawer-body" id="docDrawerBody"></div>
                    <div class="doc-drawer-footer" id="docDrawerFooter"></div>
                </div>`;
            document.body.appendChild(drawer);
        }
        document.getElementById('docDrawerTitle').textContent = title;
        document.getElementById('docDrawerBody').innerHTML = bodyHTML;
        document.getElementById('docDrawerFooter').innerHTML = `
            <button class="btn-secondary" onclick="closeDocDrawer()">Cancelar</button>
            <button class="btn-secondary" id="docBtnPreview" onclick="previewDocumento()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                Vista previa
            </button>
            <button class="btn-primary" id="docBtnSave" onclick="guardarDocumento()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Generar documento
            </button>`;
        drawer.classList.add('open');
        drawer._onSave = onSave;
        setTimeout(() => drawer.querySelector('.doc-drawer-panel').focus?.(), 50);
    }

    function closeDrawer() {
        const drawer = document.getElementById('docDrawer');
        if (drawer) drawer.classList.remove('open');
    }

    // ── FORMULARIOS DE CADA DOCUMENTO ────────────────────────────────────────

    function formReceta(patient, consultation) {
        // Consolidar medicamentos de historia clínica + nota médica + captura libre
        const meds = [
            ...(consultation?.medicamentos || []),
            ...(consultation?.medicamentosNota || []),
            ...(consultation?.medicamentosLibre || [])
        ].filter(m => m && (m.nombre || m.dosis || m.concentracion));
        const medRows = meds.length
            ? meds.map(m => `
                <tr>
                    <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">
                        <div style="font-weight:600;font-size:13px;">${global.escapeHtml(m.nombre || '')} ${m.concentracion ? '('+m.concentracion+')' : ''}</div>
                        <div style="font-size:12px;color:#64748b;">${[m.dosis,m.via,m.frecuencia,m.duracion ? 'por '+m.duracion : ''].filter(Boolean).join(' · ')}</div>
                    </td>
                </tr>`).join('')
            : '<tr><td style="padding:8px;color:#94a3b8;font-style:italic;">Sin medicamentos en la consulta — puede agregarlos manualmente abajo.</td></tr>';

        return `
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Expediente</label><input type="text" id="df_pac_exp" value="${patient?.expediente || ''}" readonly></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Diagnóstico</div>
                <textarea id="df_diagnostico" rows="2" placeholder="Diagnóstico del paciente...">${global.escapeHtml(consultation?.diagnostico || consultation?.nota_diagnostico || '')}</textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Medicamentos prescritos</div>
                <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:10px;">
                    <table style="width:100%;border-collapse:collapse;">${medRows}</table>
                </div>
                <div class="doc-form-label" style="margin-top:12px;">Medicamento adicional (texto libre)</div>
                <textarea id="df_meds_extra" rows="4" placeholder="Nombre genérico · Concentración · Dosis · Vía · Frecuencia · Duración&#10;Ejemplo: Paracetamol · 500 mg · 1 tableta · VO · cada 8h · por 5 días">${global.escapeHtml(consultation?.nota_tratamiento || consultation?.tratamiento || '')}</textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Indicaciones adicionales</div>
                <textarea id="df_indicaciones" rows="3" placeholder="Reposo, dieta, cita de seguimiento, observaciones...">${global.escapeHtml([consultation?.indicaciones_reposo, consultation?.indicaciones_dieta, consultation?.indicaciones_cita].filter(Boolean).join('\n') || '')}</textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Lugar de expedición</label><input type="text" id="df_lugar" value="Mérida, Yucatán"></div>
                    <div class="doc-form-field"><label>Fecha</label><input type="date" id="df_fecha" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del médico</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre del médico</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}" placeholder="Núm. cédula SEP/DGP"></div>
                    <div class="doc-form-field full"><label>Especialidad</label><input type="text" id="df_especialidad" placeholder="Medicina General / Especialidad..."></div>
                </div>
            </div>`;
    }

    function formJustificacion(patient, consultation) {
        return `
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Ocupación</label><input type="text" id="df_pac_ocu" value="${global.escapeHtml(patient?.occupation || '')}"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Motivo de la justificación</div>
                <textarea id="df_motivo" rows="3" placeholder="El paciente requiere reposo por padecimiento de...">${global.escapeHtml(consultation?.diagnostico || consultation?.nota_diagnostico || '')}</textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Periodo de reposo</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Fecha de inicio</label><input type="date" id="df_inicio" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="doc-form-field"><label>Número de días</label><input type="number" id="df_dias" value="3" min="1" max="365"></div>
                    <div class="doc-form-field"><label>Tipo de reposo</label>
                        <select id="df_tipo_reposo">
                            <option value="relativo">Relativo</option>
                            <option value="absoluto">Absoluto en cama</option>
                            <option value="laboral">Incapacidad laboral</option>
                            <option value="escolar">Justificante escolar</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Lugar de expedición</label><input type="text" id="df_lugar" value="Mérida, Yucatán"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Observaciones</div>
                <textarea id="df_observaciones" rows="2" placeholder="Signos de alarma, restricciones específicas, medicación indicada..."></textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del médico</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre del médico</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}" placeholder="Núm. cédula SEP/DGP"></div>
                    <div class="doc-form-field full"><label>Especialidad</label><input type="text" id="df_especialidad" placeholder="Medicina General / Especialidad..."></div>
                </div>
            </div>`;
    }

    function formConsentimiento(patient, consultation) {
        return `
            <div class="doc-form-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Numeral 10.1 NOM-004-SSA3-2012 — Requiere firma del paciente y dos testigos.
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Expediente</label><input type="text" id="df_pac_exp" value="${patient?.expediente || ''}" readonly></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Acto médico autorizado</div>
                <input type="text" id="df_acto" placeholder="Descripción clara del procedimiento o intervención a realizar..." style="width:100%;margin-bottom:8px;">
                <div class="doc-form-label" style="margin-top:8px;">Descripción del procedimiento</div>
                <textarea id="df_descripcion" rows="3" placeholder="Descripción detallada en lenguaje accesible para el paciente..."></textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Riesgos y beneficios</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Beneficios esperados</label><textarea id="df_beneficios" rows="2" placeholder="Beneficios terapéuticos esperados del procedimiento..."></textarea></div>
                    <div class="doc-form-field full"><label>Riesgos conocidos</label><textarea id="df_riesgos" rows="2" placeholder="Riesgos inherentes al procedimiento, complicaciones posibles..."></textarea></div>
                    <div class="doc-form-field full"><label>Alternativas terapéuticas</label><textarea id="df_alternativas" rows="2" placeholder="Otras opciones de tratamiento disponibles y sus diferencias..."></textarea></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Representante legal (si aplica)</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre del representante</label><input type="text" id="df_representante" placeholder="Dejar vacío si el paciente firma directamente"></div>
                    <div class="doc-form-field"><label>Parentesco</label><input type="text" id="df_parentesco" placeholder="Ej: Padre, Tutor legal..."></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Testigos (obligatorios)</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Testigo 1 — Nombre</label><input type="text" id="df_testigo1"></div>
                    <div class="doc-form-field"><label>Testigo 2 — Nombre</label><input type="text" id="df_testigo2"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Lugar de expedición</label><input type="text" id="df_lugar" value="Mérida, Yucatán"></div>
                    <div class="doc-form-field"><label>Fecha</label><input type="date" id="df_fecha" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del médico</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre del médico</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}" placeholder="Núm. cédula SEP/DGP"></div>
                    <div class="doc-form-field full"><label>Especialidad</label><input type="text" id="df_especialidad" placeholder="Medicina General / Especialidad..."></div>
                </div>
            </div>`;
    }

    function formPostoperatoria(patient, consultation) {
        return `
            <div class="doc-form-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Numeral 8.8 NOM-004-SSA3-2012 — La elabora el cirujano al término de la cirugía.
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Expediente</label><input type="text" id="df_pac_exp" value="${patient?.expediente || ''}" readonly></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del acto quirúrgico</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Diagnóstico preoperatorio</label><input type="text" id="df_dx_pre" value="${global.escapeHtml(consultation?.diagnostico || '')}"></div>
                    <div class="doc-form-field"><label>Diagnóstico postoperatorio</label><input type="text" id="df_dx_post"></div>
                    <div class="doc-form-field"><label>Operación planeada</label><input type="text" id="df_op_planeada"></div>
                    <div class="doc-form-field"><label>Operación realizada</label><input type="text" id="df_op_realizada"></div>
                    <div class="doc-form-field"><label>Fecha y hora de cirugía</label><input type="datetime-local" id="df_fecha_cx" value="${new Date().toISOString().slice(0,16)}"></div>
                    <div class="doc-form-field"><label>Duración (minutos)</label><input type="number" id="df_duracion" placeholder="Ej: 90"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Descripción de la técnica quirúrgica</div>
                <textarea id="df_tecnica" rows="4" placeholder="Descripción detallada de la técnica empleada..."></textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Hallazgos transoperatorios</div>
                <textarea id="df_hallazgos" rows="3" placeholder="Hallazgos relevantes durante la cirugía..."></textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Incidentes, accidentes y hemoderivados</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Incidentes y accidentes</label><textarea id="df_incidentes" rows="2" placeholder="Ninguno / describir..."></textarea></div>
                    <div class="doc-form-field"><label>Sangrado estimado (mL)</label><input type="number" id="df_sangrado" placeholder="0"></div>
                    <div class="doc-form-field"><label>Transfusiones</label><input type="text" id="df_transfusiones" placeholder="Ninguna / describir..."></div>
                    <div class="doc-form-field full"><label>Conteo de gasas e instrumental</label><input type="text" id="df_conteo" placeholder="Completo / describir diferencias..."></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Estado y plan postoperatorio</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Estado postquirúrgico inmediato</label><textarea id="df_estado_post" rows="2" placeholder="Signos vitales, estado de consciencia, condición general..."></textarea></div>
                    <div class="doc-form-field full"><label>Plan de manejo postoperatorio</label><textarea id="df_plan_post" rows="2" placeholder="Analgesia, antibióticos, fluidos, movilización, cuidados de herida..."></textarea></div>
                    <div class="doc-form-field full"><label>Pronóstico</label><input type="text" id="df_pronostico" placeholder="Bueno / Reservado / Grave..."></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Personal que intervino</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Cirujano responsable</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}"></div>
                    <div class="doc-form-field"><label>Ayudante(s)</label><input type="text" id="df_ayudantes" placeholder="Nombre(s) del ayudante quirúrgico..."></div>
                    <div class="doc-form-field"><label>Anestesiólogo</label><input type="text" id="df_anestesiologo" placeholder="Nombre del anestesiólogo..."></div>
                    <div class="doc-form-field"><label>Instrumentista</label><input type="text" id="df_instrumentista" placeholder="Nombre..."></div>
                    <div class="doc-form-field"><label>Circulante</label><input type="text" id="df_circulante" placeholder="Nombre..."></div>
                </div>
            </div>`;
    }

    function formInforme(patient, consultation) {
        return `
            <div class="doc-form-section">
                <div class="doc-form-label">Establecimiento que refiere</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Nombre del establecimiento</label><input type="text" id="df_est_refiere" value="ClinData — Clínica Médica"></div>
                    <div class="doc-form-field full"><label>Domicilio</label><input type="text" id="df_est_dir" value="Mérida, Yucatán, México"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Establecimiento receptor</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Nombre del establecimiento receptor</label><input type="text" id="df_est_receptor" placeholder="Hospital / Clínica / Consultorio receptor..."></div>
                    <div class="doc-form-field"><label>Servicio / Especialidad</label><input type="text" id="df_servicio" placeholder="Cardiología, Ortopedia..."></div>
                    <div class="doc-form-field"><label>Carácter</label>
                        <select id="df_caracter">
                            <option value="ordinaria">Ordinaria</option>
                            <option value="urgente">Urgente</option>
                            <option value="emergente">Emergente</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Expediente</label><input type="text" id="df_pac_exp" value="${patient?.expediente || ''}" readonly></div>
                    <div class="doc-form-field"><label>CURP</label><input type="text" id="df_pac_curp" value="${global.escapeHtml(patient?.curp || '')}" readonly></div>
                    <div class="doc-form-field"><label>NSS</label><input type="text" id="df_pac_nss" value="${global.escapeHtml(patient?.nss || '')}" readonly></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Resumen clínico</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Motivo de referencia</label><textarea id="df_motivo" rows="2" placeholder="Razón específica de la referencia..."></textarea></div>
                    <div class="doc-form-field full"><label>Diagnóstico(s) con CIE-10</label><textarea id="df_diagnostico" rows="2">${global.escapeHtml(consultation?.diagnostico || consultation?.nota_diagnostico || '')}</textarea></div>
                    <div class="doc-form-field full"><label>Tratamiento empleado y respuesta</label><textarea id="df_tratamiento" rows="2">${global.escapeHtml(consultation?.tratamiento || consultation?.nota_tratamiento || '')}</textarea></div>
                    <div class="doc-form-field full"><label>Estado actual del paciente</label><textarea id="df_estado_actual" rows="2" placeholder="Condición clínica al momento de la referencia..."></textarea></div>
                    <div class="doc-form-field full"><label>Pronóstico</label><input type="text" id="df_pronostico" value="${global.escapeHtml(consultation?.pronostico_radio || '')}"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Lugar de expedición</label><input type="text" id="df_lugar" value="Mérida, Yucatán"></div>
                    <div class="doc-form-field"><label>Fecha</label><input type="date" id="df_fecha" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del médico referente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre del médico</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}"></div>
                    <div class="doc-form-field full"><label>Especialidad</label><input type="text" id="df_especialidad" placeholder="Medicina General / Especialidad..."></div>
                </div>
            </div>`;
    }

    function formImagenologia(patient, consultation) {
        return `
            <div class="doc-form-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                NOM-229-SSA1-2002 — La cédula profesional y justificación clínica son obligatorias para estudios con radiación ionizante.
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Peso / Talla</label><input type="text" id="df_pac_peso" placeholder="70 kg / 170 cm (requerido para contraste)"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Estudio solicitado</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Tipo de estudio</label>
                        <select id="df_tipo_estudio">
                            <option value="Radiografía">Radiografía simple</option>
                            <option value="Ultrasonido">Ultrasonido (USG)</option>
                            <option value="TAC">Tomografía (TAC)</option>
                            <option value="RMN">Resonancia magnética (RMN)</option>
                            <option value="Mastografía">Mastografía</option>
                            <option value="Densitometría">Densitometría ósea</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Región anatómica</label><input type="text" id="df_region" placeholder="Ej: Tórax PA, Rodilla derecha, Abdomen..."></div>
                    <div class="doc-form-field"><label>Proyecciones (Rx) / Secuencias (RMN)</label><input type="text" id="df_proyecciones" placeholder="AP, lateral, oblicua / T1, T2, FLAIR..."></div>
                    <div class="doc-form-field"><label>Lateralidad</label>
                        <select id="df_lateralidad">
                            <option value="">No aplica</option>
                            <option value="Derecho">Derecho</option>
                            <option value="Izquierdo">Izquierdo</option>
                            <option value="Bilateral">Bilateral</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Medio de contraste</label>
                        <select id="df_contraste">
                            <option value="Sin contraste">Sin contraste</option>
                            <option value="Con contraste IV">Con contraste IV</option>
                            <option value="Con y sin contraste">Con y sin contraste</option>
                            <option value="Oral">Contraste oral</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Prioridad</label>
                        <select id="df_prioridad">
                            <option value="Ordinaria">Ordinaria</option>
                            <option value="Urgente">Urgente</option>
                            <option value="STAT">STAT (emergencia)</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Justificación clínica (obligatoria NOM-229)</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Diagnóstico presuntivo con CIE-10</label><input type="text" id="df_diagnostico" value="${global.escapeHtml(consultation?.diagnostico || consultation?.nota_diagnostico || '')}"></div>
                    <div class="doc-form-field full"><label>Pregunta diagnóstica específica</label><input type="text" id="df_pregunta" placeholder="Ej: Descartar fractura de radio distal. Evaluar extensión de masa..."></div>
                    <div class="doc-form-field full"><label>Resumen clínico relevante</label><textarea id="df_resumen_clinico" rows="2" placeholder="Tiempo de evolución, hallazgos físicos, estudios previos..."></textarea></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos de seguridad</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Posibilidad de embarazo / FUM</label><input type="text" id="df_embarazo" placeholder="No aplica / FUM: dd/mm/aaaa / Negativo..."></div>
                    <div class="doc-form-field"><label>Alergias a medio de contraste</label><input type="text" id="df_alergia_contraste" placeholder="Ninguna conocida / describir..."></div>
                    <div class="doc-form-field"><label>Función renal (creatinina/TFG)</label><input type="text" id="df_renal" placeholder="Para contraste IV: TFG > 30 mL/min..."></div>
                    <div class="doc-form-field"><label>Implantes metálicos / marcapasos (RMN)</label><input type="text" id="df_implantes" placeholder="Ninguno / describir..."></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Fecha de solicitud</label><input type="date" id="df_fecha" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="doc-form-field"><label>Médico solicitante</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}"></div>
                    <div class="doc-form-field"><label>Especialidad</label><input type="text" id="df_especialidad" placeholder="Medicina General / Especialidad..."></div>
                </div>
            </div>`;
    }

    function formFisioterapia(patient, consultation) {
        return `
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Expediente</label><input type="text" id="df_pac_exp" value="${patient?.expediente || ''}" readonly></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Diagnóstico clínico y funcional</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Diagnóstico clínico (CIE-10)</label><input type="text" id="df_diagnostico" value="${global.escapeHtml(consultation?.diagnostico || consultation?.nota_diagnostico || '')}"></div>
                    <div class="doc-form-field full"><label>Diagnóstico funcional (CIF — limitaciones funcionales)</label><input type="text" id="df_dx_funcional" placeholder="Ej: Limitación de ROM en rodilla derecha, debilidad de cuádriceps..."></div>
                    <div class="doc-form-field full"><label>Antecedentes relevantes</label><textarea id="df_antecedentes" rows="2" placeholder="Cirugías previas, traumatismos, comorbilidades que afecten la rehabilitación..."></textarea></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Prescripción terapéutica</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Región anatómica</label><input type="text" id="df_region" placeholder="Ej: Rodilla derecha, Columna lumbar..."></div>
                    <div class="doc-form-field"><label>Lateralidad</label>
                        <select id="df_lateralidad">
                            <option value="">No aplica</option>
                            <option value="Derecho">Derecho</option>
                            <option value="Izquierdo">Izquierdo</option>
                            <option value="Bilateral">Bilateral</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Número de sesiones</label><input type="number" id="df_sesiones" value="10" min="1"></div>
                    <div class="doc-form-field"><label>Frecuencia semanal</label>
                        <select id="df_frecuencia">
                            <option value="1 vez/semana">1 vez/semana</option>
                            <option value="2 veces/semana" selected>2 veces/semana</option>
                            <option value="3 veces/semana">3 veces/semana</option>
                            <option value="Diario">Diario</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Duración por sesión</label>
                        <select id="df_duracion">
                            <option value="30 minutos">30 minutos</option>
                            <option value="45 minutos" selected>45 minutos</option>
                            <option value="60 minutos">60 minutos</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Tipo de terapia</label>
                        <select id="df_tipo">
                            <option value="Fisioterapia">Fisioterapia general</option>
                            <option value="Terapia ocupacional">Terapia ocupacional</option>
                            <option value="Rehabilitación cardiaca">Rehabilitación cardiaca</option>
                            <option value="Rehabilitación pulmonar">Rehabilitación pulmonar</option>
                        </select>
                    </div>
                </div>
                <div class="doc-form-label" style="margin-top:8px;">Modalidades específicas</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                    ${['Ultrasonido terapéutico','TENS/Electroestimulación','Termoterapia (compresas)','Crioterapia','Hidroterapia','Ejercicio terapéutico','Masaje terapéutico','Movilización articular','Propiocepción/Equilibrio','Tracción'].map(m =>
                        `<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;">
                            <input type="checkbox" value="${m}" name="modalidades" style="accent-color:var(--accent);">
                            ${m}
                        </label>`
                    ).join('')}
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Objetivos terapéuticos</div>
                <textarea id="df_objetivos" rows="2" placeholder="Analgesia, aumento de rango de movimiento, reeducación funcional, independencia en actividades de la vida diaria..."></textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Contraindicaciones y precauciones</div>
                <textarea id="df_contraindicaciones" rows="2" placeholder="Ninguna / marcapasos, embarazo, trombosis, neoplasia activa, lesiones cutáneas abiertas..."></textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Fecha de solicitud</label><input type="date" id="df_fecha" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="doc-form-field"><label>Médico solicitante</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}"></div>
                    <div class="doc-form-field"><label>Especialidad</label><input type="text" id="df_especialidad" placeholder="Medicina General / Ortopedia..."></div>
                </div>
            </div>`;
    }

    function formLaboratorio(patient, consultation) {
        const estudiosComunes = [
            'Biometría hemática (BH)','Química sanguínea (QS 6 elementos)','Glucosa en ayunas',
            'HbA1c','Perfil de lípidos','Perfil hepático','Perfil tiroideo (TSH, T4)','Perfil renal (BUN, creatinina)',
            'Electrolitos séricos','Examen general de orina (EGO)','Urocultivo','Coprocultivo',
            'PCR cuantitativa','VSG','Tiempo de protrombina/INR','Hemocultivo',
            'Prueba de embarazo (hCG sérica)','Grupo sanguíneo y Rh','Pruebas de función tiroidea',
        ];
        return `
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Expediente</label><input type="text" id="df_pac_exp" value="${patient?.expediente || ''}" readonly></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Estudios solicitados</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
                    ${estudiosComunes.map(e =>
                        `<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;">
                            <input type="checkbox" value="${e}" name="estudios" style="accent-color:var(--accent);">
                            ${e}
                        </label>`
                    ).join('')}
                </div>
                <div class="doc-form-label" style="margin-top:8px;">Estudios adicionales (texto libre)</div>
                <textarea id="df_estudios_extra" rows="2" placeholder="Otros estudios no listados..."></textarea>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Justificación clínica</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Diagnóstico / impresión diagnóstica</label><input type="text" id="df_diagnostico" value="${global.escapeHtml(consultation?.diagnostico || consultation?.nota_diagnostico || '')}"></div>
                    <div class="doc-form-field full"><label>Indicación clínica</label><textarea id="df_indicacion" rows="2" placeholder="Razón clínica de los estudios solicitados..."></textarea></div>
                    <div class="doc-form-field"><label>Ayuno requerido</label>
                        <select id="df_ayuno">
                            <option value="No requiere">No requiere</option>
                            <option value="4 horas">4 horas</option>
                            <option value="8 horas" selected>8 horas</option>
                            <option value="12 horas">12 horas</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Prioridad</label>
                        <select id="df_prioridad">
                            <option value="Ordinaria">Ordinaria</option>
                            <option value="Urgente">Urgente</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Fecha de solicitud</label><input type="date" id="df_fecha" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="doc-form-field"><label>Médico solicitante</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}"></div>
                    <div class="doc-form-field"><label>Especialidad</label><input type="text" id="df_especialidad" placeholder="Medicina General / Especialidad..."></div>
                </div>
            </div>`;
    }

    function formPreoperatoria(patient, consultation) {
        return `
            <div class="doc-form-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Numerales 8.5 NOM-004-SSA3-2012 y NOM-006-SSA3-2011 — Nota preoperatoria y preanestésica.
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Datos del paciente</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Nombre completo</label><input type="text" id="df_pac_nombre" value="${global.escapeHtml(patient?.name || '')}" readonly></div>
                    <div class="doc-form-field"><label>Edad</label><input type="text" id="df_pac_edad" value="${patient?.age || ''}" readonly></div>
                    <div class="doc-form-field"><label>Sexo</label><input type="text" id="df_pac_sexo" value="${patient?.sex || ''}" readonly></div>
                    <div class="doc-form-field"><label>Peso / Talla / IMC</label><input type="text" id="df_pac_peso" placeholder="ej: 70 kg / 170 cm / 24.2"></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Procedimiento quirúrgico</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field full"><label>Diagnóstico</label><input type="text" id="df_diagnostico" value="${global.escapeHtml(consultation?.diagnostico || '')}"></div>
                    <div class="doc-form-field full"><label>Procedimiento quirúrgico planeado</label><input type="text" id="df_procedimiento" placeholder="Nombre completo del procedimiento..."></div>
                    <div class="doc-form-field"><label>Fecha programada de cirugía</label><input type="date" id="df_fecha_cx"></div>
                    <div class="doc-form-field"><label>Tipo de cirugía</label>
                        <select id="df_tipo_cx">
                            <option value="Electiva mayor">Electiva mayor</option>
                            <option value="Electiva menor">Electiva menor</option>
                            <option value="Urgente">Urgente</option>
                            <option value="Ambulatoria">Ambulatoria</option>
                            <option value="Alta especialidad">Alta especialidad</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Evaluación del riesgo</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Clasificación ASA</label>
                        <select id="df_asa">
                            <option value="ASA I">ASA I — Paciente sano</option>
                            <option value="ASA II">ASA II — Enfermedad sistémica leve</option>
                            <option value="ASA III">ASA III — Enfermedad sistémica grave</option>
                            <option value="ASA IV">ASA IV — Amenaza constante para la vida</option>
                            <option value="ASA V">ASA V — Moribundo, <24h sin cirugía</option>
                            <option value="ASA IE">ASA I-E (urgencia)</option>
                            <option value="ASA IIE">ASA II-E (urgencia)</option>
                            <option value="ASA IIIE">ASA III-E (urgencia)</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Riesgo quirúrgico global</label>
                        <select id="df_riesgo">
                            <option value="Bajo">Bajo</option>
                            <option value="Moderado">Moderado</option>
                            <option value="Alto">Alto</option>
                            <option value="Muy alto">Muy alto</option>
                        </select>
                    </div>
                    <div class="doc-form-field full"><label>Justificación del riesgo</label><textarea id="df_riesgo_desc" rows="2" placeholder="Factores condicionantes del riesgo (comorbilidades, estado funcional, hallazgos de laboratorio)..."></textarea></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Evaluación de vía aérea (preanestésica)</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Mallampati</label>
                        <select id="df_mallampati">
                            <option value="">Seleccionar...</option>
                            <option value="I">Clase I</option>
                            <option value="II">Clase II</option>
                            <option value="III">Clase III</option>
                            <option value="IV">Clase IV</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Apertura bucal</label><input type="text" id="df_apertura" placeholder="Ej: 3 cm, adecuada..."></div>
                    <div class="doc-form-field"><label>Distancia esternomentoniana</label><input type="text" id="df_esternomenton" placeholder="Ej: 6.5 cm..."></div>
                    <div class="doc-form-field"><label>Movilidad cervical</label><input type="text" id="df_cervical" placeholder="Adecuada / limitada..."></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Plan anestésico</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Tipo de anestesia propuesta</label>
                        <select id="df_tipo_anestesia">
                            <option value="General balanceada">General balanceada</option>
                            <option value="General TIVA">General TIVA</option>
                            <option value="Regional neuroaxial">Regional neuroaxial</option>
                            <option value="Bloqueo periférico">Bloqueo periférico</option>
                            <option value="Sedación">Sedación</option>
                            <option value="Local + sedación">Local + sedación</option>
                            <option value="Combinada">Combinada</option>
                        </select>
                    </div>
                    <div class="doc-form-field"><label>Monitorización propuesta</label>
                        <select id="df_monitoreo">
                            <option value="Estándar ASA">Estándar ASA</option>
                            <option value="Estándar + línea arterial">Estándar + línea arterial</option>
                            <option value="Estándar + catéter venoso central">Estándar + CVC</option>
                            <option value="Invasiva completa">Invasiva completa</option>
                        </select>
                    </div>
                    <div class="doc-form-field full"><label>Indicaciones preoperatorias</label><textarea id="df_indicaciones" rows="3" placeholder="Ayuno: sólidos 8h, líquidos claros 2h&#10;Medicamentos a continuar / suspender&#10;Preparación intestinal&#10;Profilaxis antibiótica&#10;Tromboprofilaxis..."></textarea></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-label">Pronóstico y observaciones</div>
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Pronóstico</label><input type="text" id="df_pronostico" placeholder="Bueno / Reservado..."></div>
                    <div class="doc-form-field full"><label>Observaciones adicionales</label><textarea id="df_observaciones" rows="2" placeholder="Consideraciones especiales, alergias, medicamentos, transfusiones previas..."></textarea></div>
                </div>
            </div>
            <div class="doc-form-section">
                <div class="doc-form-grid2">
                    <div class="doc-form-field"><label>Fecha de la valoración</label><input type="date" id="df_fecha" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="doc-form-field"><label>Médico responsable</label><input type="text" id="df_med_nombre" value="${global.escapeHtml(app().currentUser?.displayName || '')}"></div>
                    <div class="doc-form-field"><label>Cédula profesional</label><input type="text" id="df_cedula" value="${global.escapeHtml(consultation?.firma_cedula || '')}"></div>
                    <div class="doc-form-field"><label>Especialidad / Cédula de especialidad</label><input type="text" id="df_especialidad" placeholder="Cirugía General / Anestesiología..."></div>
                </div>
            </div>`;
    }

    // ── Mapeo de formularios ──────────────────────────────────────────────────
    const FORM_MAP = {
        receta:         formReceta,
        justificacion:  formJustificacion,
        consentimiento: formConsentimiento,
        postoperatoria: formPostoperatoria,
        informe:        formInforme,
        imagenologia:   formImagenologia,
        fisioterapia:   formFisioterapia,
        laboratorio:    formLaboratorio,
        preoperatoria:  formPreoperatoria,
    };

    // ── Recolector de datos del formulario ───────────────────────────────────
    function collectFormData() {
        const data = {};
        // Campos simples
        ['df_pac_nombre','df_pac_edad','df_pac_sexo','df_pac_exp','df_pac_curp','df_pac_nss',
         'df_pac_ocu','df_pac_peso','df_diagnostico','df_med_nombre','df_cedula','df_especialidad',
         'df_fecha','df_lugar','df_indicaciones','df_observaciones','df_meds_extra',
         'df_motivo','df_inicio','df_dias','df_tipo_reposo','df_descripcion','df_beneficios',
         'df_riesgos','df_alternativas','df_representante','df_parentesco','df_testigo1','df_testigo2',
         'df_acto','df_dx_pre','df_dx_post','df_op_planeada','df_op_realizada','df_fecha_cx',
         'df_duracion','df_tecnica','df_hallazgos','df_incidentes','df_sangrado','df_transfusiones',
         'df_conteo','df_estado_post','df_plan_post','df_pronostico','df_ayudantes','df_anestesiologo',
         'df_instrumentista','df_circulante','df_est_refiere','df_est_receptor','df_est_dir',
         'df_servicio','df_caracter','df_tratamiento','df_estado_actual','df_tipo_estudio',
         'df_region','df_proyecciones','df_lateralidad','df_contraste','df_prioridad',
         'df_embarazo','df_alergia_contraste','df_renal','df_implantes','df_pregunta',
         'df_resumen_clinico','df_dx_funcional','df_antecedentes','df_sesiones',
         'df_frecuencia','df_tipo','df_objetivos','df_contraindicaciones',
         'df_asa','df_riesgo','df_riesgo_desc','df_mallampati','df_apertura',
         'df_esternomenton','df_cervical','df_tipo_anestesia','df_monitoreo',
         'df_procedimiento','df_tipo_cx','df_fecha_cx','df_tipo_reposo',
         'df_ayuno','df_estudios_extra','df_indicacion','df_caracter',
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) data[id] = el.value;
        });
        // Selects
        ['df_tipo_estudio','df_lateralidad','df_contraste','df_prioridad',
         'df_tipo','df_frecuencia','df_duracion','df_asa','df_riesgo',
         'df_mallampati','df_tipo_anestesia','df_monitoreo','df_caracter',
         'df_ayuno','df_tipo_reposo','df_tipo_cx',
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) data[id] = el.value;
        });
        // Checkboxes
        const modalidades = [...document.querySelectorAll('input[name="modalidades"]:checked')].map(c => c.value);
        if (modalidades.length) data.modalidades = modalidades;
        const estudios = [...document.querySelectorAll('input[name="estudios"]:checked')].map(c => c.value);
        if (estudios.length) data.estudios_seleccionados = estudios;

        return data;
    }

    // ── GENERACIÓN DE PDF con jsPDF ──────────────────────────────────────────
    function buildPdfHeader(doc, tipo, paciente, medico) {
        const est = getEstablecimiento();
        const margin = 15;
        const pageW = doc.internal.pageSize.getWidth();
        let y = 15;

        // Encabezado establecimiento
        doc.setFillColor(14, 165, 233);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10); doc.setFont(undefined, 'bold');
        doc.text(est.nombre, margin, 11);
        doc.setFont(undefined, 'normal'); doc.setFontSize(8);
        doc.text(est.direccion, pageW - margin, 11, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        y = 24;

        // Título del documento
        doc.setFontSize(13); doc.setFont(undefined, 'bold');
        doc.setTextColor(14, 165, 233);
        doc.text(tipo.toUpperCase(), pageW / 2, y, { align: 'center' });
        y += 4;
        doc.setDrawColor(14, 165, 233);
        doc.line(margin, y, pageW - margin, y);
        y += 7;

        // Datos del paciente en dos columnas
        doc.setFontSize(8.5); doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0);
        const col1 = margin;
        const col2 = pageW / 2 + 5;
        doc.setFont(undefined, 'bold'); doc.text('PACIENTE:', col1, y);
        doc.setFont(undefined, 'normal'); doc.text(paciente.nombre || '—', col1 + 22, y);
        doc.setFont(undefined, 'bold'); doc.text('EXPEDIENTE:', col2, y);
        doc.setFont(undefined, 'normal'); doc.text(paciente.expediente || '—', col2 + 28, y);
        y += 5;
        doc.setFont(undefined, 'bold'); doc.text('EDAD:', col1, y);
        doc.setFont(undefined, 'normal'); doc.text((paciente.edad || '—') + ' años', col1 + 13, y);
        doc.setFont(undefined, 'bold'); doc.text('SEXO:', col1 + 42, y);
        doc.setFont(undefined, 'normal'); doc.text(paciente.sexo || '—', col1 + 55, y);
        if (paciente.curp) {
            doc.setFont(undefined, 'bold'); doc.text('CURP:', col2, y);
            doc.setFont(undefined, 'normal'); doc.text(paciente.curp, col2 + 14, y);
        }
        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageW - margin, y);
        y += 5;

        return y;
    }

    function addSection(doc, title, content, y, margin, contentW) {
        if (!content || !content.trim()) return y;
        if (y > 255) { doc.addPage(); y = 15; }
        doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(14, 165, 233);
        doc.text(title.toUpperCase(), margin, y); y += 5;
        doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0); doc.setFontSize(9);
        const lines = doc.splitTextToSize(content, contentW);
        lines.forEach(line => {
            if (y > 270) { doc.addPage(); y = 15; }
            doc.text(line, margin, y); y += 4.5;
        });
        y += 3;
        return y;
    }

    function addFooterFirma(doc, medico) {
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = pageH - 35;

        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
        const cx = pageW / 2;
        doc.text('____________________________', cx, y, { align: 'center' });
        y += 5;
        doc.setFont(undefined, 'normal');
        doc.text(medico.nombre || 'Médico responsable', cx, y, { align: 'center' });
        y += 4;
        if (medico.cedula) doc.text('Cédula Profesional: ' + medico.cedula, cx, y, { align: 'center' });
        y += 4;
        if (medico.especialidad) doc.text(medico.especialidad, cx, y, { align: 'center' });
        y += 4;
        doc.setTextColor(100, 100, 100); doc.setFontSize(7.5);
        doc.text('Documento generado electrónicamente · ClinData · NOM-004-SSA3-2012', cx, y, { align: 'center' });
    }

    function generatePdf(tipo, data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        const margin = 15;
        const pageW = doc.internal.pageSize.getWidth();
        const contentW = pageW - margin * 2;

        const paciente = {
            nombre: data.df_pac_nombre || '—',
            edad: data.df_pac_edad || '—',
            sexo: data.df_pac_sexo || '—',
            expediente: data.df_pac_exp || '—',
            curp: data.df_pac_curp || '',
        };
        const medico = {
            nombre: data.df_med_nombre || '—',
            cedula: data.df_cedula || '',
            especialidad: data.df_especialidad || '',
        };

        const titulos = {
            receta:         'Receta Médica',
            justificacion:  'Justificación / Certificado Médico',
            consentimiento: 'Consentimiento Informado',
            postoperatoria: 'Nota Postoperatoria',
            informe:        'Informe Médico / Referencia',
            imagenologia:   'Solicitud de Estudio de Imagen',
            fisioterapia:   'Orden de Fisioterapia',
            laboratorio:    'Orden de Laboratorio',
            preoperatoria:  'Valoración Preoperatoria',
        };

        let y = buildPdfHeader(doc, titulos[tipo] || tipo, paciente, medico);

        // Contenido por tipo
        switch (tipo) {
            case 'receta':
                y = addSection(doc, 'Diagnóstico', data.df_diagnostico, y, margin, contentW);
                y = addSection(doc, 'Medicamentos prescritos', data.df_meds_extra || '(ver medicamentos del sistema)', y, margin, contentW);
                y = addSection(doc, 'Indicaciones', data.df_indicaciones, y, margin, contentW);
                y = addSection(doc, 'Lugar y fecha', (data.df_lugar || '') + ' · ' + (data.df_fecha || ''), y, margin, contentW);
                break;
            case 'justificacion':
                y = addSection(doc, 'El suscrito médico certifica que:', data.df_motivo, y, margin, contentW);
                const tipoReposo = data.df_tipo_reposo || 'relativo';
                const dias = data.df_dias || '?';
                const inicio = data.df_inicio ? new Date(data.df_inicio + 'T00:00').toLocaleDateString('es-MX') : '?';
                y = addSection(doc, 'Periodo de reposo', `${tipoReposo.toUpperCase()} por ${dias} día(s) a partir del ${inicio}.`, y, margin, contentW);
                y = addSection(doc, 'Observaciones', data.df_observaciones, y, margin, contentW);
                y = addSection(doc, 'Lugar y fecha', (data.df_lugar || '') + ' · ' + (data.df_fecha || ''), y, margin, contentW);
                break;
            case 'consentimiento':
                y = addSection(doc, 'Acto médico autorizado', data.df_acto, y, margin, contentW);
                y = addSection(doc, 'Descripción del procedimiento', data.df_descripcion, y, margin, contentW);
                y = addSection(doc, 'Beneficios esperados', data.df_beneficios, y, margin, contentW);
                y = addSection(doc, 'Riesgos conocidos', data.df_riesgos, y, margin, contentW);
                y = addSection(doc, 'Alternativas terapéuticas', data.df_alternativas, y, margin, contentW);
                doc.setFontSize(8.5); doc.setFont(undefined, 'normal'); doc.setTextColor(0,0,0);
                y += 4;
                doc.text('El/La paciente o representante legal declara haber comprendido la información y autoriza el acto médico.', margin, y, { maxWidth: contentW });
                y += 8;
                doc.text('Nombre y firma del paciente: ________________________  CURP/ID: ________________', margin, y);
                y += 8;
                if (data.df_representante) doc.text('Representante legal: ' + data.df_representante + '  Parentesco: ' + (data.df_parentesco || ''), margin, y);
                y += 8;
                doc.text('Testigo 1: ' + (data.df_testigo1 || '__________________________'), margin, y);
                doc.text('Testigo 2: ' + (data.df_testigo2 || '__________________________'), pageW / 2, y);
                y += 8;
                y = addSection(doc, 'Lugar y fecha', (data.df_lugar || '') + ' · ' + (data.df_fecha || ''), y, margin, contentW);
                break;
            case 'postoperatoria':
                y = addSection(doc, '8.8.1 Diagnóstico preoperatorio', data.df_dx_pre, y, margin, contentW);
                y = addSection(doc, '8.8.2 Operación planeada', data.df_op_planeada, y, margin, contentW);
                y = addSection(doc, '8.8.3 Operación realizada', data.df_op_realizada, y, margin, contentW);
                y = addSection(doc, '8.8.4 Diagnóstico postoperatorio', data.df_dx_post, y, margin, contentW);
                y = addSection(doc, '8.8.5 Descripción de la técnica quirúrgica', data.df_tecnica, y, margin, contentW);
                y = addSection(doc, '8.8.6 Hallazgos transoperatorios', data.df_hallazgos, y, margin, contentW);
                y = addSection(doc, '8.8.7 Conteo de gasas e instrumental', data.df_conteo, y, margin, contentW);
                y = addSection(doc, '8.8.8 Incidentes y accidentes', data.df_incidentes, y, margin, contentW);
                y = addSection(doc, '8.8.9 Sangrado y transfusiones', `Sangrado: ${data.df_sangrado || '0'} mL · Transfusiones: ${data.df_transfusiones || 'Ninguna'}`, y, margin, contentW);
                y = addSection(doc, '8.8.10 Personal', `Cirujano: ${data.df_med_nombre || '—'} · Ayudante: ${data.df_ayudantes || '—'} · Anestesiólogo: ${data.df_anestesiologo || '—'} · Instrumentista: ${data.df_instrumentista || '—'}`, y, margin, contentW);
                y = addSection(doc, '8.8.11 Estado postquirúrgico inmediato', data.df_estado_post, y, margin, contentW);
                y = addSection(doc, '8.8.12 Plan postoperatorio', data.df_plan_post, y, margin, contentW);
                y = addSection(doc, '8.8.13 Pronóstico', data.df_pronostico, y, margin, contentW);
                break;
            case 'informe':
                y = addSection(doc, 'Establecimiento que refiere', data.df_est_refiere + ' · ' + (data.df_est_dir || ''), y, margin, contentW);
                y = addSection(doc, 'Establecimiento receptor', (data.df_est_receptor || '—') + ' · ' + (data.df_servicio || '—') + ' · Carácter: ' + (data.df_caracter || '—'), y, margin, contentW);
                y = addSection(doc, 'Motivo de referencia', data.df_motivo, y, margin, contentW);
                y = addSection(doc, 'Diagnóstico(s)', data.df_diagnostico, y, margin, contentW);
                y = addSection(doc, 'Tratamiento empleado', data.df_tratamiento, y, margin, contentW);
                y = addSection(doc, 'Estado actual', data.df_estado_actual, y, margin, contentW);
                y = addSection(doc, 'Pronóstico', data.df_pronostico, y, margin, contentW);
                break;
            case 'imagenologia':
                y = addSection(doc, 'Estudio solicitado', `${data.df_tipo_estudio || '—'} · Región: ${data.df_region || '—'} · Lateralidad: ${data.df_lateralidad || 'No aplica'}`, y, margin, contentW);
                y = addSection(doc, 'Proyecciones / Secuencias', data.df_proyecciones, y, margin, contentW);
                y = addSection(doc, 'Contraste', data.df_contraste, y, margin, contentW);
                y = addSection(doc, 'Prioridad', data.df_prioridad, y, margin, contentW);
                y = addSection(doc, 'Diagnóstico presuntivo', data.df_diagnostico, y, margin, contentW);
                y = addSection(doc, 'Pregunta diagnóstica', data.df_pregunta, y, margin, contentW);
                y = addSection(doc, 'Resumen clínico', data.df_resumen_clinico, y, margin, contentW);
                y = addSection(doc, 'Datos de seguridad', `Embarazo/FUM: ${data.df_embarazo || '—'} · Alergias contraste: ${data.df_alergia_contraste || '—'} · Función renal: ${data.df_renal || '—'} · Implantes: ${data.df_implantes || '—'}`, y, margin, contentW);
                break;
            case 'fisioterapia':
                y = addSection(doc, 'Diagnóstico clínico (CIE-10)', data.df_diagnostico, y, margin, contentW);
                y = addSection(doc, 'Diagnóstico funcional (CIF)', data.df_dx_funcional, y, margin, contentW);
                y = addSection(doc, 'Antecedentes relevantes', data.df_antecedentes, y, margin, contentW);
                y = addSection(doc, 'Prescripción terapéutica', `Región: ${data.df_region || '—'} ${data.df_lateralidad || ''} · Sesiones: ${data.df_sesiones || '—'} · Frecuencia: ${data.df_frecuencia || '—'} · Duración: ${data.df_duracion || '—'} por sesión · Tipo: ${data.df_tipo || '—'}`, y, margin, contentW);
                if (data.modalidades?.length) y = addSection(doc, 'Modalidades', data.modalidades.join(', '), y, margin, contentW);
                y = addSection(doc, 'Objetivos terapéuticos', data.df_objetivos, y, margin, contentW);
                y = addSection(doc, 'Contraindicaciones y precauciones', data.df_contraindicaciones, y, margin, contentW);
                break;
            case 'laboratorio':
                const estudiosAll = [...(data.estudios_seleccionados || [])];
                if (data.df_estudios_extra?.trim()) estudiosAll.push(data.df_estudios_extra);
                y = addSection(doc, 'Estudios solicitados', estudiosAll.join('\n') || '—', y, margin, contentW);
                y = addSection(doc, 'Diagnóstico / indicación clínica', `${data.df_diagnostico || '—'} · ${data.df_indicacion || '—'}`, y, margin, contentW);
                y = addSection(doc, 'Instrucciones para el paciente', `Ayuno requerido: ${data.df_ayuno || 'No requiere'} · Prioridad: ${data.df_prioridad || 'Ordinaria'}`, y, margin, contentW);
                break;
            case 'preoperatoria':
                y = addSection(doc, 'Diagnóstico', data.df_diagnostico, y, margin, contentW);
                y = addSection(doc, 'Procedimiento quirúrgico planeado', data.df_procedimiento, y, margin, contentW);
                y = addSection(doc, 'Tipo de cirugía', `${data.df_tipo_cx || '—'} · Fecha programada: ${data.df_fecha_cx || '—'}`, y, margin, contentW);
                y = addSection(doc, 'Clasificación ASA y riesgo', `${data.df_asa || '—'} · Riesgo: ${data.df_riesgo || '—'}\n${data.df_riesgo_desc || ''}`, y, margin, contentW);
                y = addSection(doc, 'Evaluación de vía aérea', `Mallampati: ${data.df_mallampati || '—'} · Apertura: ${data.df_apertura || '—'} · Esternomentoniana: ${data.df_esternomenton || '—'} · Cervical: ${data.df_cervical || '—'}`, y, margin, contentW);
                y = addSection(doc, 'Plan anestésico', `Tipo: ${data.df_tipo_anestesia || '—'} · Monitorización: ${data.df_monitoreo || '—'}`, y, margin, contentW);
                y = addSection(doc, 'Indicaciones preoperatorias', data.df_indicaciones, y, margin, contentW);
                y = addSection(doc, 'Pronóstico', data.df_pronostico, y, margin, contentW);
                y = addSection(doc, 'Observaciones', data.df_observaciones, y, margin, contentW);
                break;
        }

        addFooterFirma(doc, medico);
        return doc;
    }

    // ── API PÚBLICA ───────────────────────────────────────────────────────────

    // Abrir drawer para generar un documento
    function openDocument(docId, contextPatient, contextConsultation) {
        const patient = contextPatient || app().currentPatient;
        const consultation = contextConsultation || app().currentConsultation;

        const allDocs = [...DOC_CATALOG.clinicos, ...DOC_CATALOG.administrativos, ...DOC_CATALOG.ordenes];
        const docDef = allDocs.find(d => d.id === docId);
        if (!docDef) return global.showToast('Documento no disponible.', 'error');
        if (!canUseDoc(docDef)) return global.showToast('No tiene permisos para generar este documento.', 'error');

        const formFn = FORM_MAP[docId];
        if (!formFn) return global.showToast('Formulario no implementado.', 'error');

        const bodyHTML = formFn(patient, consultation);
        openDrawer(docDef.label, bodyHTML, () => guardarDocumento(docId, patient, consultation));

        // Guardar contexto en el drawer para uso en guardarDocumento
        const drawer = document.getElementById('docDrawer');
        if (drawer) { drawer._docId = docId; drawer._patient = patient; drawer._consultation = consultation; }
    }

    // Guardar y generar PDF
    function guardarDocumento() {
        const drawer = document.getElementById('docDrawer');
        if (!drawer) return;
        const docId = drawer._docId;
        const patient = drawer._patient || app().currentPatient;
        const consultation = drawer._consultation || app().currentConsultation;

        if (!docId) return global.showToast('Error: tipo de documento no identificado.', 'error');

        const data = collectFormData();
        const pdfDoc = generatePdf(docId, data);
        const pdfBlob = pdfDoc.output('datauristring');

        const record = {
            id: Date.now(),
            docId,
            patientId: patient?.id,
            consultationId: consultation?.id || null,
            generatedAt: new Date().toISOString(),
            generatedBy: app().currentUser?.displayName || 'Sistema',
            generatedByRole: app().currentUser?.role || '',
            data,
            pdfBlob,
        };

        saveDocument(record);
        global.showToast('Documento generado correctamente.', 'success');

        // Descargar automáticamente
        pdfDoc.save(`${docId}_${patient?.name?.replace(/\s+/g, '_') || 'paciente'}_${new Date().toISOString().split('T')[0]}.pdf`);
        closeDrawer();

        // Refrescar sección del expediente si está visible
        if (typeof global.refreshDocumentSection === 'function') global.refreshDocumentSection();
    }

    // Vista previa
    function previewDocumento() {
        const drawer = document.getElementById('docDrawer');
        if (!drawer) return;
        const docId = drawer._docId;
        if (!docId) return;
        const data = collectFormData();
        const pdfDoc = generatePdf(docId, data);
        pdfDoc.output('dataurlnewwindow');
    }

    // ── RENDERIZADO: bloque compacto dentro del formulario de consulta ───────
    function buildConsultaDocsBlock(consultation) {
        const patient = app().currentPatient;
        const patientDocs = patient ? getPatientDocs(patient.id).filter(d => d.consultationId === consultation?.id) : [];

        const docsByCat = (cat) => DOC_CATALOG[cat]
            .filter(canUseDoc)
            .map(d => `
                <button class="doc-quick-btn" onclick="openDocument('${d.id}')">
                    <span class="doc-quick-icon">${d.icon}</span>
                    <span class="doc-quick-label">${d.label}</span>
                </button>`).join('');

        const histHtml = patientDocs.length
            ? patientDocs.map(d => {
                const allDocs = [...DOC_CATALOG.clinicos, ...DOC_CATALOG.administrativos, ...DOC_CATALOG.ordenes];
                const def = allDocs.find(x => x.id === d.docId) || { label: d.docId };
                return `<div class="doc-hist-item">
                    <span class="doc-hist-name">${def.label}</span>
                    <span class="doc-hist-date">${fmtDateTime(d.generatedAt)}</span>
                    <div class="doc-hist-acts">
                        <button class="doc-hist-btn" onclick="reimprimirDocumento(${d.id})">PDF</button>
                    </div>
                </div>`;
            }).join('')
            : '<div class="doc-hist-empty">Sin documentos generados en esta consulta.</div>';

        return `
            <div class="record-block">
                <div class="record-block-header">
                    <span class="record-block-icon">📋</span>
                    <div>
                        <div class="record-block-title">Documentos y órdenes de esta consulta</div>
                        <div class="record-block-subtitle">Generar documentos clínicos asociados a esta consulta</div>
                    </div>
                </div>
                <div class="record-block-body">
                    <div class="doc-quick-grid">
                        ${docsByCat('clinicos')}
                        ${docsByCat('ordenes')}
                        ${DOC_CATALOG.administrativos.filter(canUseDoc).map(d =>
                            `<button class="doc-quick-btn" onclick="openDocument('${d.id}')">
                                <span class="doc-quick-icon">${d.icon}</span>
                                <span class="doc-quick-label">${d.label}</span>
                            </button>`).join('')}
                    </div>
                    <div class="doc-hist-sep">Generados en esta consulta</div>
                    <div class="doc-hist-list">${histHtml}</div>
                </div>
            </div>`;
    }

    // ── RENDERIZADO: sección completa en el expediente del paciente ──────────
    function buildExpedienteDocsSection(patient, perms) {
        const docs = getPatientDocs(patient.id);
        const role = app().currentUser?.role || '';

        const renderCat = (key, label, icon) => {
            const catDocs = DOC_CATALOG[key].filter(canUseDoc);
            const catHistory = docs.filter(d => DOC_CATALOG[key].some(x => x.id === d.docId))
                .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
                .slice(0, 5);

            const btnList = catDocs.map(d =>
                `<button class="exp-doc-item-btn" onclick="openDocument('${d.id}')">
                    <span class="exp-doc-dot exp-doc-dot-${key}"></span>${d.label}
                </button>`
            ).join('');

            const histList = catHistory.length
                ? catHistory.map(d => {
                    const def = DOC_CATALOG[key].find(x => x.id === d.docId) || { label: d.docId };
                    return `<div class="exp-doc-hist-row">
                        <span class="exp-doc-hist-name">${def.label}</span>
                        <span class="exp-doc-hist-date">${fmtDate(d.generatedAt)}</span>
                        <div class="exp-doc-hist-acts">
                            <button class="exp-hist-btn" onclick="reimprimirDocumento(${d.id})">ver</button>
                            <button class="exp-hist-btn" onclick="reimprimirDocumento(${d.id})">PDF</button>
                        </div>
                    </div>`;
                }).join('')
                : `<div class="exp-doc-hist-empty">Sin documentos</div>`;

            return `
                <div class="exp-doc-col">
                    <div class="exp-doc-col-head">
                        <div class="exp-doc-col-icon exp-doc-icon-${key}">${icon}</div>
                        <span class="exp-doc-col-title">${label}</span>
                    </div>
                    <div class="exp-doc-col-items">${btnList || '<div class="exp-doc-hist-empty">Sin acceso</div>'}</div>
                    <div class="exp-doc-col-hist">
                        <div class="exp-doc-hist-label">GENERADOS</div>
                        ${histList}
                    </div>
                </div>`;
        };

        return `
            <div class="exp-sec-card">
                <div class="exp-sec-head">
                    <span class="exp-sec-title">Documentación clínica y órdenes</span>
                </div>
                <div class="exp-sec-body">
                    <div class="exp-doc-search">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Buscar documento..." id="expDocSearch" oninput="filterExpDocs(this.value)">
                    </div>
                    <div class="exp-doc-filters" id="expDocFilters">
                        <button class="exp-doc-filter active" onclick="filterExpDocs('', this)">Todos</button>
                        <button class="exp-doc-filter" onclick="filterExpDocsCat('clinicos', this)">Clínicos</button>
                        <button class="exp-doc-filter" onclick="filterExpDocsCat('administrativos', this)">Administrativos</button>
                        <button class="exp-doc-filter" onclick="filterExpDocsCat('ordenes', this)">Órdenes</button>
                    </div>
                    <div class="exp-doc-grid" id="expDocGrid">
                        ${renderCat('clinicos', 'Documentos clínicos', '📄')}
                        ${renderCat('administrativos', 'Administrativos', '🖥')}
                        ${renderCat('ordenes', 'Órdenes médicas', '✅')}
                    </div>
                </div>
            </div>`;
    }

    function reimprimirDocumento(docId) {
        const all = JSON.parse(localStorage.getItem('cd_documents') || '[]');
        const doc = all.find(d => d.id === docId);
        if (!doc || !doc.pdfBlob) return global.showToast('No se encontró el PDF de este documento.', 'error');
        const win = window.open();
        win.document.write(`<iframe src="${doc.pdfBlob}" style="width:100%;height:100%;border:none;"></iframe>`);
    }

    function filterExpDocs(query) {
        // Implementación básica: ocultar filas del historial que no coincidan
        const q = (query || '').toLowerCase();
        document.querySelectorAll('.exp-doc-hist-row').forEach(row => {
            const name = row.querySelector('.exp-doc-hist-name')?.textContent.toLowerCase() || '';
            row.style.display = (!q || name.includes(q)) ? '' : 'none';
        });
    }

    function filterExpDocsCat(cat, btn) {
        document.querySelectorAll('.exp-doc-filter').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        document.querySelectorAll('.exp-doc-col').forEach((col, idx) => {
            const cats = ['clinicos', 'administrativos', 'ordenes'];
            col.style.display = (!cat || cats[idx] === cat) ? '' : 'none';
        });
    }

    function refreshDocumentSection() {
        const patient = app().currentPatient;
        if (!patient) return;
        const secEl = document.querySelector('.exp-doc-grid');
        if (!secEl) return;
        const perms = {};
        secEl.closest('.exp-sec-card').outerHTML; // no-op — rely on full re-render
        if (typeof global.renderExpediente === 'function') global.renderExpediente();
    }

    // ── Registro del módulo ──────────────────────────────────────────────────
    registry.documents = {
        openDocument,
        guardarDocumento,
        previewDocumento,
        closeDrawer,
        reimprimirDocumento,
        filterExpDocs,
        filterExpDocsCat,
        buildConsultaDocsBlock,
        buildExpedienteDocsSection,
        refreshDocumentSection,
        getPatientDocs,
        DOC_CATALOG,
    };

    // Exponer globalmente
    global.openDocument            = (id, p, c) => openDocument(id, p, c);
    global.guardarDocumento        = () => guardarDocumento();
    global.previewDocumento        = () => previewDocumento();
    global.closeDocDrawer          = () => closeDrawer();
    global.reimprimirDocumento     = (id) => reimprimirDocumento(id);
    global.filterExpDocs           = (q, btn) => filterExpDocs(q, btn);
    global.filterExpDocsCat        = (cat, btn) => filterExpDocsCat(cat, btn);
    global.refreshDocumentSection  = () => refreshDocumentSection();

})(window);