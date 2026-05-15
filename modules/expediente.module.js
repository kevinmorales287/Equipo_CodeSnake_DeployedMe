(function initExpedienteModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    // ── Permisos por rol para la vista de expediente ──────────────────────────
    const EXPEDIENTE_PERMS = {
        medico:    { canEditPatient: false, canAddRegistro: true,  canAddProtocolo: true,  canAddDocs: true,  canAddPagos: false },
        enfermero: { canEditPatient: false, canAddRegistro: true,  canAddProtocolo: false, canAddDocs: false, canAddPagos: false },
        recepcion: { canEditPatient: true,  canAddRegistro: false, canAddProtocolo: false, canAddDocs: true,  canAddPagos: true  },
        admin:     { canEditPatient: true,  canAddRegistro: false, canAddProtocolo: false, canAddDocs: true,  canAddPagos: true  },
    };

    // ── Etiquetas de tipo de documento ────────────────────────────────────────
    const DOC_CLASES = {
        'Registro inicial':    'exp-dp-rg',
        'Nota de enfermería':  'exp-dp-ne',
        'Historia clínica':    'exp-dp-hc',
        'Nota médica':         'exp-dp-hc',
        'Nota de urgencias':   'exp-dp-ur',
    };

    const ROL_CLASES = {
        medico:    'exp-rp-m',
        enfermero: 'exp-rp-e',
        recepcion: 'exp-rp-r',
        admin:     'exp-rp-r',
    };

    const ROL_LABELS = {
        medico:    'Médico',
        enfermero: 'Enfermería',
        recepcion: 'Recepción',
        admin:     'Admin',
    };

    // ── Renderiza la sección completa del expediente ──────────────────────────
    function renderExpediente() {
        const patient = app().currentPatient;
        if (!patient) return;

        const section = document.getElementById('expedienteSection');
        if (!section) return;

        const role = app().currentUser?.role || 'medico';
        const perms = EXPEDIENTE_PERMS[role] || EXPEDIENTE_PERMS.medico;
        const userName = app().currentUser?.displayName || 'Usuario';

        // Construir historial de consultas del paciente enriquecido con rol
        const consultations = (app().consultations || [])
            .filter(c => c.patientId === patient.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const histItems = buildHistItems(consultations, patient);

        section.innerHTML = buildExpedienteHTML(patient, histItems, perms, userName, role);
        attachExpedienteEvents(patient, histItems, perms, userName, role);
    }

    // ── Construye items del historial unificado ───────────────────────────────
    function buildHistItems(consultations, patient) {
        const items = [];

        // Registro inicial de recepción
        items.push({
            id: 'reg-' + patient.id,
            tipo: 'Registro inicial',
            rol: 'recepcion',
            autor: patient.createdBy || 'Recep.',
            fecha: patient.createdAt || '',
            desc: 'Datos demográficos · ' + (patient.address || ''),
            consultId: null,
        });

        consultations.forEach(c => {
            const tipo = c.tipoNota === 'evolucion' ? 'Nota de enfermería'
                : c.tipoNota === 'urgencias' ? 'Nota de urgencias'
                : c.tipoNota === 'nota-medica' ? 'Nota Médica'
                : 'Historia clínica';
            const rol = (c.tipoNota === 'evolucion') ? 'enfermero' : 'medico';
            items.push({
                id: 'cons-' + c.id,
                tipo,
                rol,
                autor: c.createdBy || 'Sistema',
                fecha: c.date || '',
                desc: c.diagnostico
                    ? 'Dx: ' + c.diagnostico.substring(0, 60)
                    : (c.nota_diagnostico || c.urg_motivo || c.enf_evolucion_clinica || 'Sin descripción').substring(0, 60),
                consultId: c.id,
            });
        });

        return items;
    }

    // ── Construye el HTML completo de la sección ──────────────────────────────
    function buildExpedienteHTML(patient, histItems, perms, userName, role) {
        const initials = patient.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
        const lastConsult = (app().consultations || [])
            .filter(c => c.patientId === patient.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        return `
        <div class="exp-topbar">
            <button class="exp-back-btn" onclick="navigate('patients')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                Volver al expediente
            </button>
            <span class="exp-topbar-title">${global.escapeHtml(patient.name)}</span>
            <span class="exp-topbar-sub">Exp. ${global.escapeHtml(patient.expediente || '—')}</span>
        </div>

        <div class="exp-body">

            <!-- Datos del paciente -->
            <div class="exp-card">
                <div class="exp-card-head">
                    <span class="exp-card-title">Datos del paciente</span>
                    ${perms.canEditPatient ? `<button class="exp-ab exp-ab-ed" style="margin-left:auto" onclick="openEditPatientModal()">editar</button>` : ''}
                </div>
                <div class="exp-card-body">
                    <div class="exp-pat-grid">
                        <div class="exp-avatar">${global.escapeHtml(initials)}</div>
                        <div>
                            <div class="exp-pat-name">${global.escapeHtml(patient.name)}</div>
                            <div class="exp-pat-meta">
                                ${patient.age ? patient.age + ' años · ' : ''}${patient.sex || ''}
                                ${patient.curp ? ' · CURP: ' + patient.curp : ''}
                                ${patient.nss  ? ' · NSS: '  + patient.nss  : ''}
                            </div>
                            <div class="exp-tags">
                                ${patient.allergies ? `<span class="exp-tag exp-tag-alert">⚠ ${global.escapeHtml(patient.allergies)}</span>` : ''}
                                ${patient.chronicConditions ? `<span class="exp-tag exp-tag-chronic">${global.escapeHtml(patient.chronicConditions)}</span>` : ''}
                                ${patient.phone ? `<span class="exp-tag">Tel: ${global.escapeHtml(patient.phone)}</span>` : ''}
                                ${patient.consultorio ? `<span class="exp-tag">${global.escapeHtml(patient.consultorio)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="exp-sum-grid">
                        <div class="exp-sum-item">
                            <div class="exp-sum-label">Último diagnóstico</div>
                            <div class="exp-sum-val">${global.escapeHtml(lastConsult?.diagnostico?.substring(0,80) || 'Sin consultas previas')}</div>
                        </div>
                        <div class="exp-sum-item">
                            <div class="exp-sum-label">Tratamiento actual</div>
                            <div class="exp-sum-val">${global.escapeHtml(patient.currentTreatment || lastConsult?.tratamiento?.substring(0,80) || '—')}</div>
                        </div>
                        <div class="exp-sum-item">
                            <div class="exp-sum-label">Última consulta</div>
                            <div class="exp-sum-val">${lastConsult ? global.formatDateFull(lastConsult.date) + ' · ' + (lastConsult.createdBy || '') : '—'}</div>
                        </div>
                        <div class="exp-sum-item">
                            <div class="exp-sum-label">Nota anterior</div>
                            <div class="exp-sum-val">${global.escapeHtml((lastConsult?.notaImportante || lastConsult?.evolucion_nota || '—').substring(0,80))}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Historial general -->
            <div class="exp-card">
                <div class="exp-card-head">
                    <span class="exp-card-title">Historial general</span>
                </div>
                <div class="exp-card-body">
                    <div class="exp-filter-row">
                        <select class="exp-fsel" id="histFilterRole" onchange="applyHistFilter()">
                            <option value="">Todos los roles</option>
                            <option value="recepcion">Recepción</option>
                            <option value="enfermero">Enfermería</option>
                            <option value="medico">Médico</option>
                        </select>
                        <div class="exp-filter-label" style="gap:4px;">
                            <span style="white-space:nowrap;">Desde</span>
                            <input class="exp-fsel" type="date" id="histFilterDateFrom" onchange="applyHistFilter()">
                        </div>
                        <div class="exp-filter-label" style="gap:4px;">
                            <span style="white-space:nowrap;">Hasta</span>
                            <input class="exp-fsel" type="date" id="histFilterDateTo" onchange="applyHistFilter()">
                        </div>
                        <button class="exp-fsel" onclick="clearHistFilter()"
                            style="cursor:pointer;max-width:80px;color:var(--text-secondary);">
                            Limpiar
                        </button>
                    </div>
                    <div class="exp-table-wrap">
                        <table class="exp-hist-table" id="expHistTable">
                            <thead><tr>
                                <th>Tipo</th><th>Rol</th><th>Autor</th><th>Fecha</th><th>Descripción</th><th>Acciones</th>
                            </tr></thead>
                            <tbody id="expHistBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Registro clínico -->
            <div class="exp-sec-card">
                <div class="exp-sec-head">
                    <span class="exp-sec-title">Registro clínico</span>
                    ${perms.canAddRegistro ? buildAddButton('expDdRegistro', buildRegistroMenu(role)) : ''}
                </div>
                <div class="exp-sec-body" id="expMiniRegistro">
                    ${buildMiniHist(histItems, userName, ['Historia clínica','Nota de enfermería','Nota de urgencias','Nota Médica'])}
                </div>
            </div>

            <!-- Protocolo quirúrgico -->
            <div id="expProtocolosSection">
                ${global.ClinDataModules?.protocolos
                    ? global.ClinDataModules.protocolos.buildExpedienteProtocolosSection(patient, perms)
                    : `<div class="exp-sec-card"><div class="exp-sec-head"><span class="exp-sec-title">Protocolo quirúrgico</span></div><div class="exp-sec-body"><div class="exp-empty">Módulo de protocolos no disponible.</div></div></div>`
                }
            </div>

            <!-- Documentación clínica -->
            <div id="expDocsSection">
                ${global.ClinDataModules?.documents
                    ? global.ClinDataModules.documents.buildExpedienteDocsSection(patient, perms)
                    : `<div class="exp-sec-card"><div class="exp-sec-head"><span class="exp-sec-title">Documentación clínica y órdenes</span></div><div class="exp-sec-body"><div class="exp-empty">Módulo de documentos no disponible.</div></div></div>`
                }
            </div>

            <!-- Pagos -->
            <div id="expPagosSection">
                ${global.ClinDataModules?.pagos
                    ? global.ClinDataModules.pagos.buildExpedientePagosSection(patient, perms)
                    : `<div class="exp-sec-card"><div class="exp-sec-head"><span class="exp-sec-title">Pagos y facturación</span></div><div class="exp-sec-body"><div class="exp-empty">Módulo de pagos no disponible.</div></div></div>`
                }
            </div>

        </div>`;
    }

    function buildAddButton(ddId, menuHTML) {
        return `<div class="exp-add-wrap" style="position:relative">
            <button class="exp-btn-add" onclick="expToggleDd('${ddId}')">+ Añadir ▾</button>
            <div class="exp-dropdown" id="${ddId}">${menuHTML}</div>
        </div>`;
    }

    function buildRegistroMenu(role) {
        const isMed = role === 'medico';
        const isEnf = role === 'enfermero';
        return `<div class="exp-dd-head">Nota clínica</div>
            ${isMed ? `<div class="exp-dd-item" onclick="expOpenFormPanel('libre-medico')">📝 Captura libre (con IA)</div>` : ''}
            ${isEnf ? `<div class="exp-dd-item" onclick="expOpenFormPanel('enfermeria')">Nota de enfermería</div>` : ''}
            ${isMed ? `<div class="exp-dd-item" onclick="expOpenFormPanel('urgencias')">Nota de urgencias</div>` : ''}`;
    }

    function buildDocsMenu() {
        return `<div class="exp-dd-head">Documentos clínicos</div>
            <div class="exp-dd-item" onclick="showExpWip('Receta médica')">Receta médica</div>
            <div class="exp-dd-item" onclick="showExpWip('Justificación médica')">Justificación médica</div>
            <div class="exp-dd-item" onclick="showExpWip('Consentimiento informado')">Consentimiento informado</div>
            <div class="exp-dd-item" onclick="showExpWip('Nota postoperatoria')">Nota postoperatoria</div>
            <div class="exp-dd-head">Administrativos</div>
            <div class="exp-dd-item" onclick="showExpWip('Aseguradoras')">Aseguradoras</div>
            <div class="exp-dd-item" onclick="showExpWip('Informe médico')">Informe médico</div>
            <div class="exp-dd-item" onclick="showExpWip('Imagenología')">Imagenología</div>
            <div class="exp-dd-head">Órdenes médicas</div>
            <div class="exp-dd-item" onclick="showExpWip('Orden de fisioterapia')">Orden de fisioterapia</div>
            <div class="exp-dd-item" onclick="showExpWip('Estudios de rayos X')">Estudios de rayos X</div>
            <div class="exp-dd-item" onclick="showExpWip('Valoración preoperatoria')">Valoración preoperatoria</div>`;
    }

    function buildMiniHist(items, userName, tipos) {
        const mine = items.filter(i => tipos.includes(i.tipo) && i.autor === userName);
        if (!mine.length) return '<div class="exp-empty">Aún no tienes registros en esta sección.</div>';
        return mine.map(i => {
            const cls = DOC_CLASES[i.tipo] || 'exp-dp-rg';
            const fecha = i.fecha ? global.formatDate(i.fecha) : '—';
            return `<div class="exp-mini-row">
                <span class="exp-dp ${cls}">${global.escapeHtml(i.tipo)}</span>
                <span class="exp-mini-date">${fecha}</span>
                <span class="exp-mini-label">${global.escapeHtml(i.desc)}</span>
                <div class="exp-acts">
                    ${i.consultId ? `<button class="exp-ab exp-ab-ed" onclick="openConsultation(${i.consultId})">editar</button>` : ''}
                    <button class="exp-ab" onclick="alert('Impresión disponible en el sistema completo')">imprimir</button>
                    ${i.consultId ? `<button class="exp-ab exp-ab-dl" onclick="expConfirmDelete(${i.consultId})">eliminar</button>` : ''}
                </div>
            </div>`;
        }).join('');
    }

    // ── Renderiza el cuerpo de la tabla del historial ─────────────────────────
    function renderHistBody(items, userName) {
        const body = document.getElementById('expHistBody');
        if (!body) return;

        if (!items.length) {
            body.innerHTML = '<tr><td colspan="6" class="exp-td-empty">Sin registros para los filtros seleccionados.</td></tr>';
            return;
        }

        body.innerHTML = items.map(i => {
            const own = i.autor === userName;
            const dpCls = DOC_CLASES[i.tipo] || 'exp-dp-rg';
            const rpCls = ROL_CLASES[i.rol]  || 'exp-rp-r';
            const rpLbl = ROL_LABELS[i.rol]  || i.rol;
            const fecha = i.fecha ? global.formatDate(i.fecha) : '—';

            const actions = own
                ? `<div class="exp-acts">
                    ${i.consultId ? `<button class="exp-ab exp-ab-ed" onclick="openConsultation(${i.consultId})">editar</button>` : ''}
                    <button class="exp-ab" onclick="alert('Imprimir')">imprimir</button>
                   </div>`
                : `<div class="exp-acts">
                    ${i.consultId ? `<button class="exp-ab exp-ab-vw" onclick="expVerConsulta(${i.consultId})">ver</button>` : ''}
                    <button class="exp-ab" onclick="alert('Imprimir')">imprimir</button>
                   </div>`;

            return `<tr>
                <td><span class="exp-dp ${dpCls}">${global.escapeHtml(i.tipo)}</span></td>
                <td><span class="exp-rp ${rpCls}">${rpLbl}</span></td>
                <td class="exp-td-sec">${global.escapeHtml(i.autor)}</td>
                <td class="exp-td-ter">${fecha}</td>
                <td class="exp-td-sec">${global.escapeHtml(i.desc)}</td>
                <td>${actions}</td>
            </tr>`;
        }).join('');
    }

    // ── Abre el formulario correcto según el tipo de nota ─────────────────────
    function expOpenFormPanel(tipo) {
        closeAllExpDropdowns();
        app().previousSection = 'expediente';
        // Si no hay consulta activa, crear una nueva con el tipo correcto
        if (!app().currentConsultation) {
            if (tipo === 'libre-medico') {
                global.createNewConsultation('libre-medico');
            } else if (tipo === 'historia') {
                global.createNewConsultation('historia');
            } else if (tipo === 'nota') {
                global.createNewConsultation('nota-medica');
            } else if (tipo === 'enfermeria') {
                global.createNewConsultation('evolucion');
            } else if (tipo === 'urgencias') {
                global.createNewConsultation('urgencias');
            } else {
                global.createNewConsultation();
            }
        } else {
            global.navigate('medicalRecord');
        }
    }

    // ── Ver consulta en modo solo lectura ─────────────────────────────────────
    function expVerConsulta(consultId) {
        const consult = (app().consultations || []).find(c => c.id === consultId);
        if (!consult) return;
        app().currentConsultation = consult;
        if (!app().currentPatient || app().currentPatient.id !== consult.patientId) {
            app().currentPatient = (app().patients || []).find(p => p.id === consult.patientId);
        }
        app().previousSection = 'expediente';
        global.navigate('medicalRecord');
        global.renderMedicalRecord();
    }

    // ── Confirmar eliminación ─────────────────────────────────────────────────
    function expConfirmDelete(consultId) {
        if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
        const idx = (app().consultations || []).findIndex(c => c.id === consultId);
        if (idx > -1) {
            app().consultations.splice(idx, 1);
            global.saveConsultations();
            global.showToast('Registro eliminado.', 'success');
            renderExpediente();
        }
    }

    // ── Módulo en desarrollo ──────────────────────────────────────────────────
    function showExpWip(nombre) {
        closeAllExpDropdowns();
        global.showToast(`"${nombre}" — aún estamos trabajando en ello.`, 'info');
    }

    // ── Dropdowns ─────────────────────────────────────────────────────────────
    function expToggleDd(id) {
        const target = document.getElementById(id);
        if (!target) return;
        const wasOpen = target.classList.contains('exp-dd-open');
        closeAllExpDropdowns();
        if (!wasOpen) target.classList.add('exp-dd-open');
    }

    function closeAllExpDropdowns() {
        document.querySelectorAll('.exp-dropdown').forEach(d => d.classList.remove('exp-dd-open'));
    }

    // ── Filtrar historial ─────────────────────────────────────────────────────
    function applyHistFilter() {
        const patient = app().currentPatient;
        if (!patient) return;
        const consultations = (app().consultations || [])
            .filter(c => c.patientId === patient.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        const allItems = buildHistItems(consultations, patient);

        const rol      = document.getElementById('histFilterRole')?.value     || '';
        const dateFrom = document.getElementById('histFilterDateFrom')?.value || '';
        const dateTo   = document.getElementById('histFilterDateTo')?.value   || '';

        let filtered = allItems.filter(i => {
            const matchRol  = !rol      || i.rol === rol;
            const iDate     = i.fecha?.substring(0, 10);
            const matchFrom = !dateFrom || iDate >= dateFrom;
            const matchTo   = !dateTo   || iDate <= dateTo;
            return matchRol && matchFrom && matchTo;
        });

        // Sin filtros activos: mostrar solo las últimas 5
        const sinFiltros = !rol && !dateFrom && !dateTo;
        if (sinFiltros) filtered = filtered.slice(0, 5);

        const userName = app().currentUser?.displayName || '';
        renderHistBody(filtered, userName);
    }

    function clearHistFilter() {
        const from = document.getElementById('histFilterDateFrom');
        const to   = document.getElementById('histFilterDateTo');
        const role = document.getElementById('histFilterRole');
        if (from) from.value = '';
        if (to)   to.value   = '';
        if (role) role.value = '';
        applyHistFilter();
    }

    // ── Attach eventos tras render ────────────────────────────────────────────
    function attachExpedienteEvents(patient, histItems, perms, userName, role) {
        // Render inicial: últimas 5 consultas (sin filtros activos)
        applyHistFilter();

        // Cerrar dropdowns al click fuera
        document.addEventListener('click', function expOutsideClick(e) {
            if (!e.target.closest('.exp-add-wrap') && !e.target.closest('.exp-btn-add')) {
                closeAllExpDropdowns();
            }
        }, { once: false, capture: false });
    }

    // ── Exponer funciones globales que necesita el HTML inline ────────────────
    global.expToggleDd          = expToggleDd;
    global.applyHistFilter      = applyHistFilter;
    global.clearHistFilter      = clearHistFilter;
    global.expOpenFormPanel     = expOpenFormPanel;
    global.expVerConsulta       = expVerConsulta;
    global.expConfirmDelete     = expConfirmDelete;
    global.showExpWip           = showExpWip;
    global.closeAllExpDropdowns = closeAllExpDropdowns;

    registry.expediente = { renderExpediente, buildHistItems };
})(window);
