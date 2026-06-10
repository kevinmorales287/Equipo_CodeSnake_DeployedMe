(function initDiagnosticsModule(global) {
    const registry = global.ClinDataModules || (global.ClinDataModules = {});
    const app = () => global.ClinDataApp;

    const state = {
        cie10Cache: [],
        cie10CacheLoaded: false,
        currentAutocompleteTextarea: null,
        currentDiagSuggestions: [],
        clickBound: false
    };

    async function loadCie10Cache() {
        if (state.cie10CacheLoaded) return;
        const isFileProtocol = window.location.protocol === "file:";

        if (Array.isArray(window.CIE10_INDEX) && window.CIE10_INDEX.length > 0) {
            state.cie10Cache = window.CIE10_INDEX;
            state.cie10CacheLoaded = true;
            console.log(`CIE-10 cargado desde índice local (${state.cie10Cache.length} registros)`);
            return;
        }

        if (isFileProtocol) {
            state.cie10CacheLoaded = true;
            console.warn("No hay índice CIE-10 embebido para modo file://.");
            return;
        }

        const candidates = [
            "database/conceptos.json",
            "/database/conceptos.json",
            "programa_CIE10/database/conceptos.json",
            "./database/conceptos.json"
        ];

        for (const path of candidates) {
            try {
                const response = await fetch(path);
                if (!response.ok) continue;
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    state.cie10Cache = data;
                    state.cie10CacheLoaded = true;
                    console.log(`✅ CIE-10 cargado localmente desde ${path} (${data.length} registros)`);
                    return;
                }
            } catch (error) {
                // Seguimos con el siguiente candidato.
            }
        }

        state.cie10CacheLoaded = true;
        console.warn("⚠️ No se pudo cargar conceptos.json localmente; se usará API /api/conceptos si está disponible.");
    }

    function searchCie10Local(query) {
        if (!state.cie10Cache.length) return [];
        const term = query.toLowerCase();
        return state.cie10Cache
            .filter((item) =>
                (item.cie10_code || "").toLowerCase().startsWith(term) ||
                (item.termino || "").toLowerCase().includes(term)
            )
            .slice(0, 5)
            .map((item) => ({ codigo: item.cie10_code, descripcion: item.termino, tipo: "CIE-10" }));
    }

    function ensureAutocompleteUI() {
        const legacyTools = document.getElementById("diagnosticoAutocompleteTools");
        if (legacyTools) legacyTools.remove();
    }

    function getDiagSuggestionText(item) {
        if (!item) return "";
        if (item.isAbrev) return item.descripcion || item.codigo || "";
        return [item.descripcion, item.codigo ? `(${item.codigo})` : ""].filter(Boolean).join(" ").trim();
    }

    function getDiagSearchQuery(input) {
        if (!input) return "";
        return String(input.value || "").split("\n").pop().trim();
    }

    function renderDiagBadges() {
        const container = document.getElementById("diagnosticosSeleccionados");
        if (!container) return;

        const selectedDiagnosticos = app().selectedDiagnosticos || [];
        container.innerHTML = selectedDiagnosticos.map((diagnostico, index) => `
            <div class="pfc-tag">
                <b>${diagnostico.codigo}</b> ${diagnostico.descripcion}
                <span style="cursor:pointer;margin-left:5px" onclick="removeDiag(${index})">×</span>
            </div>
        `).join("");
    }

    function upsertSelectedDiagnostico(item) {
        if (!item || !item.codigo || !item.descripcion) return;
        const selectedDiagnosticos = app().selectedDiagnosticos || [];
        const exists = selectedDiagnosticos.some((diagnostico) => diagnostico.codigo === item.codigo);
        if (!exists) {
            selectedDiagnosticos.push({ codigo: item.codigo, descripcion: item.descripcion, tipo: item.tipo || "CIE-10" });
            app().selectedDiagnosticos = selectedDiagnosticos;
            renderDiagBadges();
        }
    }

    function removeDiag(index) {
        const selectedDiagnosticos = app().selectedDiagnosticos || [];
        selectedDiagnosticos.splice(index, 1);
        app().selectedDiagnosticos = selectedDiagnosticos;
        renderDiagBadges();
    }

    function getDiagSuggestionBox(input) {
        if (!input) return null;
        const explicitId = input.id === "diagnostico" ? "diagnosticoSugerencias" : `${input.id}Sugerencias`;
        let box = document.getElementById(explicitId);
        if (box) return box;

        box = document.createElement("div");
        box.id = explicitId;
        box.className = "diagnostico-suggestions";
        box.style.display = "none";
        const formGroup = input.closest(".form-group");
        if (formGroup) {
            if (getComputedStyle(formGroup).position === "static") {
                formGroup.style.position = "relative";
            }
            formGroup.appendChild(box);
        } else {
            document.body.appendChild(box);
        }
        return box;
    }

    function hideSuggestions(input = null) {
        const targetInput = input || state.currentAutocompleteTextarea;
        const box = getDiagSuggestionBox(targetInput);
        if (box) {
            box.style.display = "none";
            box.innerHTML = "";
        }
        state.currentDiagSuggestions = [];
        if (!input || targetInput === state.currentAutocompleteTextarea) state.currentAutocompleteTextarea = null;
    }

    function applyDiagSuggestion(index) {
        const item = state.currentDiagSuggestions[index];
        if (!item || !state.currentAutocompleteTextarea) return;

        const targetInput = state.currentAutocompleteTextarea;
        const suggestionText = getDiagSuggestionText(item);

        if (targetInput.id === "diagnostico") {
            targetInput.value = suggestionText;
        } else {
            const existingLines = targetInput.value.split("\n");
            existingLines[existingLines.length - 1] = suggestionText;
            targetInput.value = existingLines
                .map((line) => line.trim())
                .filter(Boolean)
                .join("\n");
        }

        if (!item.isAbrev) upsertSelectedDiagnostico(item);

        targetInput.dispatchEvent(new Event("input", { bubbles: true }));
        targetInput.focus();
        hideSuggestions();
    }

    function showDiagSuggestions(results, input) {
        const box = getDiagSuggestionBox(input);
        if (!box || !results.length || !input) {
            hideSuggestions();
            return;
        }

        state.currentAutocompleteTextarea = input;
        state.currentDiagSuggestions = results.slice(0, 5);
        box.innerHTML = state.currentDiagSuggestions.map((item, index) => {
            const code = global.escapeHtml(item.codigo || "CIE-10");
            const description = global.escapeHtml(item.descripcion || "");
            return `
                <button type="button" class="suggestion-item" data-index="${index}" onclick="applyDiagSuggestion(${index})">
                    <span class="sugg-code sugg-cie">${code}</span>
                    <span class="sugg-text">${description}</span>
                </button>
            `;
        }).join("");

        // Si el box está fuera del form-group (fallback en body), aún necesita coords
        if (box.parentNode === document.body) {
            const rect = input.getBoundingClientRect();
            box.style.position = "fixed";
            box.style.top = `${Math.round(rect.bottom + 6)}px`;
            box.style.left = `${Math.round(rect.left)}px`;
            box.style.width = `${Math.round(rect.width)}px`;
            box.style.zIndex = "20000";
        }
        box.style.display = "block";
    }

    function handleTextareaAutocompleteKey(event) {
        const targetInput = event.target;
        const box = getDiagSuggestionBox(targetInput);
        if (!box || box.style.display === "none") return;

        const items = box.querySelectorAll(".suggestion-item");
        let current = Array.from(items).findIndex((item) => item.classList.contains("active"));

        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (current < items.length - 1) {
                if (current >= 0) items[current].classList.remove("active");
                items[current + 1].classList.add("active");
                items[current + 1].scrollIntoView({ block: "nearest" });
            }
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (current > 0) {
                items[current].classList.remove("active");
                items[current - 1].classList.add("active");
                items[current - 1].scrollIntoView({ block: "nearest" });
            }
        } else if (event.key === "Enter" && current >= 0) {
            event.preventDefault();
            items[current].click();
        } else if (event.key === "Escape") {
            hideSuggestions();
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function debounced(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function initDiagnosticoAutocomplete() {
        // Campos de historia clínica Y nota médica
        const fields = [
            "diagnostico",
            "diagnostico_secundario",
            "nota_diagnostico",
            "nota_diagnostico_secundario"
        ];

        loadCie10Cache();

        fields.forEach((id) => {
            const input = document.getElementById(id);
            if (!input) return;

            getDiagSuggestionBox(input);

            const handler = debounce(async (event) => {
                const query = getDiagSearchQuery(event.target);
                if (query.length < 2) {
                    hideSuggestions(input);
                    return;
                }

                let cieResults = searchCie10Local(query);
                if (!cieResults.length && window.location.protocol !== "file:") {
                    try {
                        const response = await fetch(`/api/conceptos?q=${encodeURIComponent(query)}`);
                        if (response.ok) cieResults = await response.json();
                    } catch (error) {
                        console.error("Error CIE-10 API:", error);
                    }
                }

                showDiagSuggestions(cieResults, input);
            }, 180);

            input.removeEventListener("input", input._autocompleteHandler);
            input._autocompleteHandler = handler;
            input.addEventListener("input", handler);

            input.removeEventListener("keydown", handleTextareaAutocompleteKey);
            input.addEventListener("keydown", handleTextareaAutocompleteKey);

            input.removeEventListener("blur", input._autocompleteBlurHandler);
            input._autocompleteBlurHandler = () => setTimeout(() => hideSuggestions(input), 150);
            input.addEventListener("blur", input._autocompleteBlurHandler);
        });

        if (!state.clickBound) {
            document.addEventListener("click", (event) => {
                const activeBox = state.currentAutocompleteTextarea
                    ? getDiagSuggestionBox(state.currentAutocompleteTextarea)
                    : null;
                if (!activeBox) return;
                if (!activeBox.contains(event.target) && event.target !== state.currentAutocompleteTextarea) {
                    hideSuggestions();
                }
            });
            window.addEventListener("scroll", () => hideSuggestions(), true);
            window.addEventListener("resize", () => hideSuggestions());
            state.clickBound = true;
        }
    }

    registry.diagnostics = {
        loadCie10Cache,
        searchCie10Local,
        ensureAutocompleteUI,
        getDiagSuggestionText,
        getDiagSearchQuery,
        upsertSelectedDiagnostico,
        applyDiagSuggestion,
        getDiagSuggestionBox,
        showDiagSuggestions,
        initDiagnosticoAutocomplete,
        renderDiagBadges,
        removeDiag,
        hideSuggestions,
        handleTextareaAutocompleteKey,
        debounce
    };
})(window);
