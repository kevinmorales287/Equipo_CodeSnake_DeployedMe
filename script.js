// ===== BASE DE DATOS (simulada) =====
let patients = JSON.parse(localStorage.getItem("patients")) || [];

// ===== NAVEGACIÓN =====
function navigate(section) {
    document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
    });

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
function renderPatients() {
    const container = document.getElementById("patientList");
    container.innerHTML = "";

    patients.forEach(p => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p><strong>${p.name}</strong> (${p.age} años)</p>
        `;
        container.appendChild(div);
    });
}