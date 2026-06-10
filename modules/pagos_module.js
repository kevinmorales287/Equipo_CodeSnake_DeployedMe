// =============================================
//  ClinData — pagos_module.js  v1
//  Módulo de Pagos y Facturación (HU #6)
//  Persistencia: localStorage cd_pagos
//  Botones de envío por correo/WhatsApp son
//  representativos (decisión del cliente).
// =============================================

(function initPagosModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    const IVA_OPTS = ['16%', '8%', '0%', 'Exento'];

    function ivaRate(iva) {
        if (iva === '16%') return 0.16;
        if (iva === '8%')  return 0.08;
        return 0;
    }

    function fmtMXN(n) {
        const x = Number(n) || 0;
        return x.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    }

    function lineSubtotal(item) {
        const cant = Number(item.cantidad) || 0;
        const costo = Number(item.costo) || 0;
        return cant * costo * (1 + ivaRate(item.iva));
    }

    function lineIva(item) {
        const cant = Number(item.cantidad) || 0;
        const costo = Number(item.costo) || 0;
        return cant * costo * ivaRate(item.iva);
    }

    function lineBase(item) {
        const cant = Number(item.cantidad) || 0;
        const costo = Number(item.costo) || 0;
        return cant * costo;
    }

    // ── Storage helpers ──────────────────────────────────────────────────────
    function getAll() {
        try { return JSON.parse(localStorage.getItem('cd_pagos') || '{}'); }
        catch { return {}; }
    }
    function saveAll(obj) {
        localStorage.setItem('cd_pagos', JSON.stringify(obj));
    }
    function getPatientRecord(patientId) {
        const all = getAll();
        return all[String(patientId)] || { patientId: Number(patientId), items: [] };
    }
    function getPatientPagos(patientId) {
        return getPatientRecord(patientId).items || [];
    }
    function savePatientRecord(rec) {
        const all = getAll();
        all[String(rec.patientId)] = rec;
        saveAll(all);
    }

    // ── Sección del expediente ───────────────────────────────────────────────
    function buildExpedientePagosSection(patient, perms) {
        const items = getPatientPagos(patient.id);
        const canEdit = !!perms.canAddPagos;

        const addBtn = canEdit
            ? `<button class="exp-btn-add" onclick="openPagoItem(${patient.id})">+ Añadir concepto</button>`
            : '';

        if (!items.length) {
            return `
                <div class="exp-sec-card">
                    <div class="exp-sec-head">
                        <span class="exp-sec-title">Pagos y facturación</span>
                        ${addBtn}
                    </div>
                    <div class="exp-sec-body">
                        <div class="exp-empty">Sin conceptos de pago registrados.</div>
                    </div>
                </div>`;
        }

        const subtotal = items.reduce((s, it) => s + lineBase(it), 0);
        const ivaTotal = items.reduce((s, it) => s + lineIva(it), 0);
        const total    = subtotal + ivaTotal;

        const rows = items.map((it, idx) => `
            <tr>
                <td class="num">${idx + 1}</td>
                <td class="num">${Number(it.cantidad) || 0}</td>
                <td>${global.escapeHtml(it.descripcion || '')}</td>
                <td class="num">${fmtMXN(it.costo)}</td>
                <td>${global.escapeHtml(it.iva || '—')}</td>
                <td class="num">${fmtMXN(lineSubtotal(it))}</td>
                <td class="col-acts">
                    ${canEdit ? `
                        <button class="exp-ab exp-ab-ed" onclick="openPagoItem(${patient.id}, ${it.id})" title="Editar">editar</button>
                        <button class="exp-ab exp-ab-dl" onclick="deletePagoItem(${patient.id}, ${it.id})" title="Eliminar">eliminar</button>
                    ` : ''}
                </td>
            </tr>`).join('');

        return `
            <div class="exp-sec-card">
                <div class="exp-sec-head">
                    <span class="exp-sec-title">Pagos y facturación</span>
                    ${addBtn}
                </div>
                <div class="exp-sec-body">
                    <table class="pago-tbl">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Cant.</th>
                                <th>Descripción</th>
                                <th>P. unit.</th>
                                <th>IVA</th>
                                <th>Subtotal</th>
                                <th class="col-acts"></th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="pago-totales">
                        <div class="row"><span>Subtotal:</span><span class="v">${fmtMXN(subtotal)}</span></div>
                        <div class="row"><span>IVA total:</span><span class="v">${fmtMXN(ivaTotal)}</span></div>
                        <div class="row total"><span>Total:</span><span class="v">${fmtMXN(total)}</span></div>
                    </div>
                    <div class="pago-send-bar">
                        <button class="exp-ab" onclick="enviarEstadoCuenta('correo')">📧 Enviar por correo</button>
                        <button class="exp-ab" onclick="enviarEstadoCuenta('whatsapp')">💬 Enviar por WhatsApp</button>
                        <button class="exp-ab" onclick="imprimirEstadoCuenta()">🖨 Imprimir estado de cuenta</button>
                    </div>
                </div>
            </div>`;
    }

    // ── Drawer ───────────────────────────────────────────────────────────────
    let DRAWER_STATE = { patientId: null, itemId: null };

    function ensureDrawerDom() {
        let drawer = document.getElementById('pagoDrawer');
        if (drawer) return drawer;
        drawer = document.createElement('div');
        drawer.id = 'pagoDrawer';
        drawer.className = 'doc-drawer';
        drawer.innerHTML = `
            <div class="doc-drawer-overlay" onclick="closePagoDrawer()"></div>
            <div class="doc-drawer-panel">
                <div class="doc-drawer-header">
                    <span class="doc-drawer-title" id="pagoDrawerTitle"></span>
                    <button class="doc-drawer-close" onclick="closePagoDrawer()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="doc-drawer-body" id="pagoDrawerBody"></div>
                <div class="doc-drawer-footer" id="pagoDrawerFooter"></div>
            </div>`;
        document.body.appendChild(drawer);
        return drawer;
    }

    function openPagoItem(patientId, itemId) {
        const role = app().currentUser?.role || '';
        if (role !== 'recepcion' && role !== 'admin' && role !== 'medico') {
            return global.showToast('No tienes permiso para registrar pagos.', 'error');
        }

        DRAWER_STATE = { patientId: Number(patientId), itemId: itemId || null };
        ensureDrawerDom();

        const items = getPatientPagos(patientId);
        const item = itemId ? items.find(i => i.id === itemId) : null;
        const isEdit = !!item;

        document.getElementById('pagoDrawerTitle').textContent = isEdit ? 'Editar concepto de pago' : 'Nuevo concepto de pago';

        const ivaOpts = IVA_OPTS.map(o => {
            const sel = (item?.iva || '16%') === o ? 'selected' : '';
            return `<option value="${o}" ${sel}>${o}</option>`;
        }).join('');

        document.getElementById('pagoDrawerBody').innerHTML = `
            <div class="doc-form-section">
                <div class="doc-form-grid2">
                    <div class="doc-form-field">
                        <label>Cantidad</label>
                        <input type="number" id="pago_cantidad" min="1" step="1" value="${item?.cantidad ?? 1}">
                    </div>
                    <div class="doc-form-field">
                        <label>IVA</label>
                        <select id="pago_iva">${ivaOpts}</select>
                    </div>
                    <div class="doc-form-field full">
                        <label>Descripción</label>
                        <input type="text" id="pago_descripcion" value="${global.escapeHtml(item?.descripcion || '')}" placeholder="Consulta médica, procedimiento, material…">
                    </div>
                    <div class="doc-form-field">
                        <label>Costo unitario (MXN)</label>
                        <input type="number" id="pago_costo" min="0" step="0.01" value="${item?.costo ?? ''}">
                    </div>
                    <div class="doc-form-field">
                        <label>Subtotal</label>
                        <input type="text" id="pago_subtotal" readonly tabindex="-1" style="background:var(--bg-surface-2);color:var(--text-secondary);">
                    </div>
                </div>
            </div>`;

        document.getElementById('pagoDrawerFooter').innerHTML = `
            <button class="btn-secondary" onclick="closePagoDrawer()">Cancelar</button>
            <button class="btn-primary" onclick="guardarPagoItem()">${isEdit ? 'Guardar cambios' : 'Agregar concepto'}</button>`;

        // Listeners para cálculo en vivo
        ['pago_cantidad','pago_costo','pago_iva'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', recalcularSubtotal);
            if (el) el.addEventListener('change', recalcularSubtotal);
        });
        recalcularSubtotal();

        document.getElementById('pagoDrawer').classList.add('open');
        setTimeout(() => document.getElementById('pago_descripcion')?.focus(), 80);
    }

    function recalcularSubtotal() {
        const cant = Number(document.getElementById('pago_cantidad')?.value) || 0;
        const costo = Number(document.getElementById('pago_costo')?.value) || 0;
        const iva = document.getElementById('pago_iva')?.value || '0%';
        const sub = cant * costo * (1 + ivaRate(iva));
        const out = document.getElementById('pago_subtotal');
        if (out) out.value = fmtMXN(sub);
    }

    function closePagoDrawer() {
        const d = document.getElementById('pagoDrawer');
        if (d) d.classList.remove('open');
        DRAWER_STATE = { patientId: null, itemId: null };
    }

    function guardarPagoItem() {
        const { patientId, itemId } = DRAWER_STATE;
        if (!patientId) return;

        const cantidad = Number(document.getElementById('pago_cantidad').value);
        const descripcion = (document.getElementById('pago_descripcion').value || '').trim();
        const costo = Number(document.getElementById('pago_costo').value);
        const iva = document.getElementById('pago_iva').value;

        if (!descripcion) return global.showToast('Falta la descripción del concepto.', 'error');
        if (!cantidad || cantidad < 1) return global.showToast('La cantidad debe ser al menos 1.', 'error');
        if (isNaN(costo) || costo < 0) return global.showToast('Costo unitario inválido.', 'error');

        const user = app().currentUser || {};
        const rec = getPatientRecord(patientId);

        if (itemId) {
            const idx = rec.items.findIndex(i => i.id === itemId);
            if (idx >= 0) {
                rec.items[idx] = {
                    ...rec.items[idx],
                    cantidad, descripcion, costo, iva,
                };
            }
        } else {
            rec.items.push({
                id: Date.now(),
                cantidad, descripcion, costo, iva,
                createdAt: new Date().toISOString(),
                createdBy: user.displayName || 'Usuario',
                createdByRole: user.role || '',
            });
        }
        rec.updatedAt = new Date().toISOString();
        rec.updatedBy = user.displayName || 'Usuario';

        savePatientRecord(rec);
        global.showToast(itemId ? 'Concepto actualizado.' : 'Concepto agregado.', 'success');
        closePagoDrawer();
        refreshPagosSection();
    }

    function deletePagoItem(patientId, itemId) {
        const role = app().currentUser?.role || '';
        if (role !== 'recepcion' && role !== 'admin' && role !== 'medico') {
            return global.showToast('No tienes permiso para eliminar pagos.', 'error');
        }
        if (!confirm('¿Eliminar este concepto de pago?')) return;
        const rec = getPatientRecord(patientId);
        rec.items = rec.items.filter(i => i.id !== itemId);
        rec.updatedAt = new Date().toISOString();
        rec.updatedBy = app().currentUser?.displayName || 'Usuario';
        savePatientRecord(rec);
        global.showToast('Concepto eliminado.', 'success');
        refreshPagosSection();
    }

    function refreshPagosSection() {
        if (typeof global.renderExpediente === 'function') global.renderExpediente();
    }

    // ── Registro ─────────────────────────────────────────────────────────────
    registry.pagos = {
        buildExpedientePagosSection,
        openPagoItem,
        deletePagoItem,
        getPatientPagos,
        refreshPagosSection,
    };

    global.openPagoItem        = (...a) => openPagoItem(...a);
    global.deletePagoItem      = (...a) => deletePagoItem(...a);
    global.refreshPagosSection = ()     => refreshPagosSection();
    global.closePagoDrawer     = ()     => closePagoDrawer();
    global.guardarPagoItem     = ()     => guardarPagoItem();
    global.enviarEstadoCuenta  = (canal) =>
        global.showToast(`Función de envío por ${canal} no disponible en este prototipo.`, 'info');
    global.imprimirEstadoCuenta = () =>
        global.showToast('Generación de PDF pendiente para esta versión.', 'info');

})(window);
