// =============================================
//  AUTOCOMPLETADO DE DIAGNÓSTICOS CIE-10
//  Script independiente para sugerencias de diagnósticos
// =============================================

let diagnosticosDB = [];
let diagnosticosIndice = new Map();
let diagnosticoCargado = false;

// Cargar la base de datos de diagnósticos CIE-10
async function cargarDiagnosticosCIE10() {
    if (diagnosticoCargado) return;
    
    try {
        const response = await fetch('database/conceptos.json');
        if (!response.ok) throw new Error('No se pudo cargar la BD de diagnósticos');
        
        diagnosticosDB = await response.json();
        
        // Crear índice de búsqueda para búsquedas rápidas
        diagnosticosDB.forEach((diag, idx) => {
            const termino = (diag.termino || '').toLowerCase();
            const codigo = (diag.cie10_code || '').toLowerCase();
            
            if (termino) diagnosticosIndice.set(termino, idx);
            if (codigo) diagnosticosIndice.set(codigo, idx);
        });
        
        diagnosticoCargado = true;
        console.log(`✓ Base de diagnósticos CIE-10 cargada: ${diagnosticosDB.length} registros`);
    } catch (error) {
        console.error('Error al cargar diagnósticos:', error);
    }
}

// Buscar diagnósticos que coincidan con el texto ingresado
function buscarDiagnosticos(texto) {
    if (!diagnosticoCargado || !texto || texto.length < 2) return [];
    
    const textoBuscado = texto.toLowerCase().trim();
    const resultados = [];
    const maxSugerencias = 5;
    
    // Búsqueda por coincidencia de término o código
    for (let i = 0; i < diagnosticosDB.length && resultados.length < maxSugerencias; i++) {
        const diag = diagnosticosDB[i];
        const termino = (diag.termino || '').toLowerCase();
        const codigo = (diag.cie10_code || '').toLowerCase();
        
        if (termino.includes(textoBuscado) || codigo.includes(textoBuscado)) {
            resultados.push(diag);
        }
    }
    
    return resultados;
}

// Mostrar sugerencias de diagnósticos
function mostrarSugerenciasDiagnostico(textarea) {
    const texto = textarea.value;
    const ultimaLinea = texto.split('\n').pop();
    
    if (!ultimaLinea || ultimaLinea.trim().length < 2) {
        ocultarSugerenciasDiagnostico();
        return;
    }
    
    const sugerencias = buscarDiagnosticos(ultimaLinea.trim());
    const container = document.getElementById('diagnosticoSugerencias');
    
    if (!sugerencias.length) {
        ocultarSugerenciasDiagnostico();
        return;
    }
    
    // Generar HTML de sugerencias
    container.innerHTML = sugerencias.map((diag, idx) => `
        <div class="suggestion-item" data-idx="${idx}" onclick="seleccionarDiagnostico(${idx})">
            <div class="suggestion-text">
                <div class="suggestion-nombre">${diag.termino || 'Sin nombre'}</div>
                <div class="suggestion-code">${diag.cie10_code || '—'} ${diag.chapter_name ? '• ' + diag.chapter_name : ''}</div>
            </div>
            <div class="suggestion-chapter">${diag.chapter || 'N/A'}</div>
        </div>
    `).join('');
    
    container.style.display = 'block';
}

// Ocultar sugerencias de diagnósticos
function ocultarSugerenciasDiagnostico() {
    const container = document.getElementById('diagnosticoSugerencias');
    if (container) container.style.display = 'none';
}

// Seleccionar un diagnóstico
function seleccionarDiagnostico(idx) {
    const sugerencias = buscarDiagnosticos(
        document.getElementById('diagnostico').value.split('\n').pop().trim()
    );
    
    if (idx >= 0 && idx < sugerencias.length) {
        const diag = sugerencias[idx];
        const textarea = document.getElementById('diagnostico');
        const lineas = textarea.value.split('\n');
        
        // Reemplazar la última línea con la selección
        lineas[lineas.length - 1] = `${diag.termino} (${diag.cie10_code})`;
        textarea.value = lineas.join('\n');
        
        // Enfocar el textarea
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        ocultarSugerenciasDiagnostico();
    }
}

// Inicializar autocompletado cuando se abre una consulta
function inicializarAutocompletadoDiagnostico() {
    cargarDiagnosticosCIE10();
    
    const textarea = document.getElementById('diagnostico');
    if (!textarea) return;
    
    // Remover listeners previos para evitar duplicados
    textarea.removeEventListener('input', mostrarSugerenciasDiagnostico);
    
    // Evento al escribir
    textarea.addEventListener('input', function() {
        mostrarSugerenciasDiagnostico(this);
    });
    
    // Evento al perder foco
    textarea.addEventListener('blur', function() {
        setTimeout(() => ocultarSugerenciasDiagnostico(), 200);
    });
    
    // Evento al presionar teclas
    textarea.addEventListener('keydown', function(e) {
        const container = document.getElementById('diagnosticoSugerencias');
        const items = container ? container.querySelectorAll('.suggestion-item') : [];
        
        if (items.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            let current = Array.from(items).findIndex(i => i.classList.contains('highlighted'));
            if (current < items.length - 1) {
                if (current >= 0) items[current].classList.remove('highlighted');
                items[current + 1].classList.add('highlighted');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            let current = Array.from(items).findIndex(i => i.classList.contains('highlighted'));
            if (current > 0) {
                items[current].classList.remove('highlighted');
                items[current - 1].classList.add('highlighted');
            }
        } else if (e.key === 'Enter') {
            let current = Array.from(items).findIndex(i => i.classList.contains('highlighted'));
            if (current >= 0) {
                e.preventDefault();
                seleccionarDiagnostico(current);
            }
        } else if (e.key === 'Escape') {
            ocultarSugerenciasDiagnostico();
        }
    });
}

// Hook para inicializar cuando se abre un expediente
if (typeof window.openConsultation === 'function') {
    const _origOpenConsult = window.openConsultation;
    window.openConsultation = function() {
        const result = _origOpenConsult.apply(this, arguments);
        setTimeout(() => inicializarAutocompletadoDiagnostico(), 100);
        return result;
    };
} else {
    // Si openConsultation aún no existe, esperar a que se defina
    let attemptCount = 0;
    const verificarOpenConsultation = setInterval(() => {
        if (typeof window.openConsultation === 'function') {
            clearInterval(verificarOpenConsultation);
            const _origOpenConsult = window.openConsultation;
            window.openConsultation = function() {
                const result = _origOpenConsult.apply(this, arguments);
                setTimeout(() => inicializarAutocompletadoDiagnostico(), 100);
                return result;
            };
        }
        attemptCount++;
        if (attemptCount > 50) clearInterval(verificarOpenConsultation); // 5 segundos máximo
    }, 100);
}
