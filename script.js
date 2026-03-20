// ===== VARIABLES DE CONTROL =====
let autoSaveTimer = null;

// ===== BASE DE EXPEDIENTES =====
let records = JSON.parse(localStorage.getItem("records")) || [];
let currentPatient = null;
function saveRecords() {
    localStorage.setItem("records", JSON.stringify(records));
}
//===== AUTOGUARDADO =====
function saveCurrentRecord() {
    if (!currentPatient) return;

    let record = getMedicalRecord(currentPatient.id);

    record.interrogatorio = document.getElementById("interrogatorio").value;
    record.antecedentes = document.getElementById("antecedentes").value;
    record.padecimiento = document.getElementById("padecimiento").value;
    record.exploracion = document.getElementById("exploracion").value;
    record.diagnostico = document.getElementById("diagnostico").value;
    record.tratamiento = document.getElementById("tratamiento").value;

    saveRecords();

    console.log("Autoguardado ejecutado");
}
//===== AUTOGUARDADO POR INTERVALO =====
function startAutoSave() {
    stopAutoSave(); // evitar duplicados

    autoSaveTimer = setInterval(() => {
        saveCurrentRecord();
    }, 30000); // cada 30 segundos
}

function stopAutoSave() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
}

// ===== AUTOGUARDADO POR EVENTO =====
function setupAutoSaveEvents() {
    const fields = [
        "interrogatorio",
        "antecedentes",
        "padecimiento",
        "exploracion",
        "diagnostico",
        "tratamiento"
    ];

    fields.forEach(id => {
        const el = document.getElementById(id);

        el.addEventListener("input", () => {
            saveCurrentRecord();
        });
    });
}

// Obtener o crear expediente
function getMedicalRecord(patientId) {
    let record = records.find(r => r.patientId === patientId);

    if (!record) {
        record = {
            patientId,
            interrogatorio: "",
            antecedentes: "",
            padecimiento: "",
            exploracion: "",
            diagnostico: "",
            tratamiento: ""
        };
        records.push(record);
        saveRecords();
    }

    return record;
}

// ===== BASE DE DATOS (simulada) =====
let patients = JSON.parse(localStorage.getItem("patients")) || [];

// ===== NAVEGACIÓN =====
function navigate(section) {
    document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
    });

    stopAutoSave(); // detener autoguardado al cambiar de sección

    if (section === "patients") {
        document.getElementById("patientsSection").classList.add("active");
        renderPatients();
    }

    if (section === "newPatient") {
        document.getElementById("newPatientSection").classList.add("active");
    }

    if (section === "medicalRecord") {
        document.getElementById("medicalRecordSection").classList.add("active");
    }
}

// ===== GUARDAR EN LOCALSTORAGE =====
function savePatients() {
    localStorage.setItem("patients", JSON.stringify(patients));
}

// ===== CREAR PACIENTE =====
document.getElementById("patientForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const patient = {
        id: Date.now(),
        name: document.getElementById("name").value,
        age: document.getElementById("age").value,
        sex: document.getElementById("sex").value,
        address: document.getElementById("address").value
    };

    patients.push(patient);
    savePatients();

    alert("Paciente guardado");

    this.reset();
});

// ===== MOSTRAR PACIENTES =====
function renderPatients(customList = null) {
    const container = document.getElementById("patientList");
    container.innerHTML = "";

    const list = customList || patients;

    if (list.length === 0) {
        container.innerHTML = "<p>No se encontraron pacientes</p>";
        return;
    }

    list.forEach(p => {
        const div = document.createElement("div");

        div.innerHTML = `
            <p><strong>${p.name}</strong> (${p.age} años)</p>
            <button onclick="openRecord(${p.id})">Abrir expediente</button>
        `;

        container.appendChild(div);
    });

    div.innerHTML = `
    <p><strong>${highlightMatch(p.name, document.getElementById("search").value)}</strong> (${p.age} años)</p>
    <button onclick="openRecord(${p.id})">Abrir expediente</button>
`;
}

// ===== ABRIR EXPEDIENTE =====
function openRecord(patientId) {
    currentPatient = patients.find(p => p.id === patientId);

    navigate("medicalRecord");

    renderMedicalRecord();

    startAutoSave();
    setupAutoSaveEvents();

    setupAutocomplete(); // Auctivación del autocompletado
    setupAbbreviationDetection(); // Activación de la detección de abreviaturas
}

// ===== RENDERIZAR EXPEDIENTE =====
function renderMedicalRecord() {
    if (!currentPatient) return;

    const record = getMedicalRecord(currentPatient.id);

    document.getElementById("patientName").innerText =
        currentPatient.name + " (" + currentPatient.age + " años)";

    document.getElementById("interrogatorio").value = record.interrogatorio;
    document.getElementById("antecedentes").value = record.antecedentes;
    document.getElementById("padecimiento").value = record.padecimiento;
    document.getElementById("exploracion").value = record.exploracion;
    document.getElementById("diagnostico").value = record.diagnostico;
    document.getElementById("tratamiento").value = record.tratamiento;
}

// ===== GUARDAR EXPEDIENTE =====
document.getElementById("recordForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!currentPatient) return;

    let record = getMedicalRecord(currentPatient.id);

    record.interrogatorio = document.getElementById("interrogatorio").value;
    record.antecedentes = document.getElementById("antecedentes").value;
    record.padecimiento = document.getElementById("padecimiento").value;
    record.exploracion = document.getElementById("exploracion").value;
    record.diagnostico = document.getElementById("diagnostico").value;
    record.tratamiento = document.getElementById("tratamiento").value;

    saveRecords();

    alert("Expediente guardado");
});

// ===== FUNCIÓN PARA EXPORTAR PDF =====
function exportPDF(type) {
    if (!currentPatient) return;

    const record = getMedicalRecord(currentPatient.id);

    let content = generateDocument(record, type);

    createPDF(content, type);
}

// ===== GENERAR CONTENIDO PARA PDF =====
function generateDocument(record, type) {
    return {
        interrogatorio: expandAbbreviations(record.interrogatorio, type),
        antecedentes: expandAbbreviations(record.antecedentes, type),
        padecimiento: expandAbbreviations(record.padecimiento, type),
        exploracion: expandAbbreviations(record.exploracion, type),
        diagnostico: expandAbbreviations(record.diagnostico, type),
        tratamiento: expandAbbreviations(record.tratamiento, type)
    };
}

// ===== CREAR PDF =====
function createPDF(data, type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;

    // Título
    doc.setFontSize(16);
    doc.text("Expediente Clínico", 10, y);

    y += 10;

    // Paciente
    doc.setFontSize(12);
    doc.text(`Paciente: ${currentPatient.name}`, 10, y);
    y += 10;

    // Función para secciones
    function addSection(title, text) {
        doc.setFont(undefined, "bold");
        doc.text(title, 10, y);
        y += 5;

        doc.setFont(undefined, "normal");

        const lines = doc.splitTextToSize(text || "Sin información", 180);
        doc.text(lines, 10, y);

        y += lines.length * 7 + 5;
    }

    addSection("Interrogatorio", data.interrogatorio);
    addSection("Antecedentes", data.antecedentes);
    addSection("Padecimiento actual", data.padecimiento);
    addSection("Exploración física", data.exploracion);
    addSection("Diagnóstico", data.diagnostico);
    addSection("Tratamiento", data.tratamiento);

    // Guardar
    doc.save(`expediente_${type}.pdf`);
}

// ===== BÚSQUEDA EN TIEMPO REAL =====
document.getElementById("search").addEventListener("input", function() {
    const query = this.value.toLowerCase();
    searchPatients(query);
});

// ===== FUNCION DE BÚSQUEDA =====
function searchPatients(query) {
    const results = patients.filter(p => {
        return (
            p.name.toLowerCase().includes(query) ||
            p.age.toString().includes(query) ||
            p.sex.toLowerCase().includes(query)
        );
    });

    renderPatients(results);
}

// ===== RESALTADO PARA BÚSQUEDA =====
function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<span class='highlight'>$1</span>");
}

// ===== AUTOCOMPLETADO (ALGORITMO INICIAL) =====
//Base de datos simulada para sugerencias
const suggestionsDB = [
    "diabetes mellitus",
    "hipertensión arterial",
    "insuficiencia renal",
    "dolor torácico",
    "fiebre",
    "cefalea",
    "infección respiratoria",
    "gastritis",
    "asma",
    "neumonía"
];
// Catálogo de abreviaturas
const abbreviations = {
    "DM": "diabetes mellitus",
    "HTA": "hipertensión arterial",
    "FC": "frecuencia cardiaca",
    "TA": "tensión arterial",
    "FR": "frecuencia respiratoria"
};
//Detección de posibles abreviaturas
function detectAbbreviations(text) {
    const words = text.split(/\s+/);

    return words.filter(word => {
        return word.length <= 5 && word === word.toUpperCase();
    });
}
//Validación de abreviaturas
function findInvalidAbbreviations(text) {
    const detected = detectAbbreviations(text);

    return detected.filter(abbr => !abbreviations[abbr]);
}
//Detectar última palabra
function getLastWord(text) {
    const words = text.split(" ");
    return words[words.length - 1].toLowerCase();
}
//Filtrar sugerencias
function getSuggestions(word) {
    if (word.length < 2) return [];

    return suggestionsDB.filter(item =>
        item.toLowerCase().includes(word)
    );
}
//Sugerencias en tiempo real
function setupAutocomplete() {
    const input = document.getElementById("diagnostico");
    const box = document.getElementById("suggestionsBox");

    input.addEventListener("input", () => {
        const text = input.value;
        const lastWord = getLastWord(text);

        const suggestions = getSuggestions(lastWord);

        box.innerHTML = "";

        if (suggestions.length === 0) return;

        suggestions.forEach(s => {
            const div = document.createElement("div");
            div.classList.add("suggestion-item");
            div.innerText = s;

            div.onclick = () => {
                applySuggestion(input, s);
                box.innerHTML = "";
            };

            box.appendChild(div);
        });
    });
}
// Insertar sugerencia
function applySuggestion(input, suggestion) {
    let text = input.value;
    let words = text.split(" ");

    words.pop(); // quitar última palabra
    words.push(suggestion);

    input.value = words.join(" ") + " ";
}
//Renderizar texto con validación de abreviaturas
function highlightText(text) {
    const words = text.split(" ");

    return words.map(word => {
        if (
            word === word.toUpperCase() &&
            word.length <= 5 &&
            !abbreviations[word]
        ) {
            return `<span class="invalid">${word}</span>`;
        }
        return word;
    }).join(" ");
}
// Actualización en tiempo real
function setupAbbreviationDetection() {
    const input = document.getElementById("diagnostico");
    const preview = document.getElementById("diagnosticoPreview");

    input.addEventListener("input", () => {
        const text = input.value;

        preview.innerHTML = highlightText(text);
    });
}
//Expansión de abreviaturas
function expandAbbreviations(text, mode = "patient") {
    let words = text.split(" ");

    return words.map(word => {
        if (abbreviations[word]) {
            if (mode === "patient") {
                return abbreviations[word];
            } else {
                return `${abbreviations[word]} (${word})`;
            }
        }
        return word;
    }).join(" ");
}