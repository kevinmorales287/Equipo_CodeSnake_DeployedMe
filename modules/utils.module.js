(function initUtilsModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add("hidden");
    }

    function escapeRegExp(text) {
        return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function escapeHtml(text) {
        return String(text ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatDate(iso) {
        if (!iso) return "—";
        const date = new Date(iso);
        return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    }

    function formatDateFull(iso) {
        if (!iso) return "—";
        const date = new Date(iso);
        return date.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
    }

    function formatTime(iso) {
        if (!iso) return "—";
        const date = new Date(iso);
        return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    }

    function showToast(message, type = "info") {
        const existing = document.getElementById("toast");
        if (existing) existing.remove();
        const toast = document.createElement("div");
        toast.id = "toast";
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("toast-show"), 10);
        setTimeout(() => {
            toast.classList.remove("toast-show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    registry.utils = {
        closeModal,
        escapeRegExp,
        escapeHtml,
        formatDate,
        formatDateFull,
        formatTime,
        showToast
    };
})(window);
