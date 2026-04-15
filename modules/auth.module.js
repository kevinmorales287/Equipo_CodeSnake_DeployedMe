(function initAuthModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    function can(permission) {
        const currentUser = app().currentUser;
        if (!currentUser) return false;
        return app().rolePermissions[currentUser.role]?.[permission] === true;
    }

    function handleLogin() {
        const username = document.getElementById("loginUser").value.trim();
        const password = document.getElementById("loginPass").value;
        const user = app().systemUsers.find((entry) => entry.username === username && entry.password === password);
        if (!user) {
            document.getElementById("loginError").classList.remove("hidden");
            document.getElementById("loginPass").value = "";
            return;
        }
        app().currentUser = user;
        sessionStorage.setItem("cd_session", JSON.stringify(user));
        bootApp();
    }

    function bootApp() {
        const currentUser = app().currentUser;
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("appShell").classList.remove("hidden");
        document.getElementById("userDisplayName").textContent = currentUser.displayName;
        const labels = { medico: "Médico/a", enfermero: "Enfermero/a", admin: "Administrador" };
        document.getElementById("userRoleBadge").textContent = labels[currentUser.role] || currentUser.role;
        document.getElementById("userAvatar").textContent = currentUser.displayName.charAt(0).toUpperCase();
        renderSidebar();

        const homeSection = currentUser.role === "admin" ? "admin"
            : currentUser.role === "medico" ? "consultQueue"
            : currentUser.role === "recepcion" ? "patients"
            : "triage";

        global.navigate(homeSection);
    }

    function handleLogout() {
        sessionStorage.removeItem("cd_session");
        app().currentUser = null;
        app().currentPatient = null;
        app().currentConsultation = null;
        global.stopAutoSave();
        document.getElementById("appShell").classList.add("hidden");
        document.getElementById("loginScreen").classList.remove("hidden");
        document.getElementById("loginUser").value = "";
        document.getElementById("loginPass").value = "";
        document.getElementById("loginError").classList.add("hidden");
        window.location.hash = "";
        document.title = "ClinData — Sistema de Expediente Clínico";
    }

    function togglePassword() {
        const input = document.getElementById("loginPass");
        input.type = input.type === "password" ? "text" : "password";
    }

    function renderSidebar() {
        const nav = document.getElementById("sidebarNav");
        if (!nav) return;
        const items = [];
        if (can("canViewPatients")) {
            items.push({ id: "nav-patients", section: "patients", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`, label: "Pacientes" });
        }
        if (can("canRegisterPatients")) {
            items.push({ id: "nav-newPatient", section: "newPatient", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`, label: "Nuevo Paciente" });
        }
        if (can("canViewQueue")) {
            items.push({ id: "nav-consultQueue", section: "consultQueue", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`, label: "Fila de Consulta" });
        }
        if (can("canUseTriage")) {
            items.push({ id: "nav-triage", section: "triage", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, label: "Triage" });
            items.push({ id: "nav-triageList", section: "triageList", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`, label: "Fila de Urgencias" });
        }
        if (can("canManageUsers")) {
            items.push({ id: "nav-admin", section: "admin", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`, label: "Gestión de Usuarios" });
        }
        if (can("canManageConsultorios")) {
            items.push({ id: "nav-consultorios", section: "consultorios", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></svg>`, label: "Consultorios" });
        }
        nav.innerHTML = items.map((item) => `
            <button class="nav-item" onclick="navigate('${item.section}')" id="${item.id}" data-section="${item.section}">
                ${item.icon}
                ${item.label}
            </button>`).join("");
    }

    registry.auth = { can, handleLogin, bootApp, handleLogout, togglePassword, renderSidebar };
})(window);
