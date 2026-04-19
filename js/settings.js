const settingsState = {
    draft: null
};
let settingsEventsBound = false;

const settingsElements = {
    presetButtons: Array.from(document.querySelectorAll("[data-preset]")),
    optionButtons: Array.from(document.querySelectorAll("[data-setting]")),
    saveSettingsBtn: document.getElementById("save-settings-btn"),
    resetSettingsBtn: document.getElementById("reset-settings-btn"),
    settingsPreview: document.getElementById("settings-preview"),
    settingsMessage: document.getElementById("settings-message")
};

document.addEventListener("DOMContentLoaded", initSettingsPage);
window.addEventListener("pageshow", syncSettingsPage);

function initSettingsPage() {
    if (!hasSettingsMarkup()) {
        return;
    }

    if (!settingsEventsBound) {
        registerSettingsEvents();
        settingsEventsBound = true;
    }

    syncSettingsPage();
}

function syncSettingsPage() {
    if (!hasSettingsMarkup()) {
        return;
    }

    const store = CacaContexto.getStore();
    settingsState.draft = { ...store.settings };
    applySkin(settingsState.draft.skin);
    renderOptionButtons();
    renderSettingsPreview();
    setSettingsMessage("As preferências atuais já estão carregadas.");
}

function registerSettingsEvents() {
    settingsElements.presetButtons.forEach((button) => {
        button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });
    settingsElements.optionButtons.forEach((button) => {
        button.addEventListener("click", () => applyOption(button.dataset.setting, button.dataset.value));
    });
    settingsElements.saveSettingsBtn.addEventListener("click", saveSettings);
    settingsElements.resetSettingsBtn.addEventListener("click", resetSettings);
}

function applyOption(setting, value) {
    if (!settingsState.draft) {
        settingsState.draft = { ...CacaContexto.DEFAULT_SETTINGS };
    }

    settingsState.draft[setting] = coerceSettingValue(setting, value);
    if (setting === "skin") {
        applySkin(settingsState.draft.skin);
    }
    renderOptionButtons();
    renderSettingsPreview();
    setSettingsMessage("Alterações prontas para salvar.");
}

function saveSettings() {
    const settings = getSettingsFromState();
    CacaContexto.setStore({ settings });
    applySkin(settings.skin);
    renderOptionButtons();
    renderSettingsPreview();
    setSettingsMessage("Configurações salvas com sucesso.");
}

function resetSettings() {
    settingsState.draft = { ...CacaContexto.DEFAULT_SETTINGS };
    CacaContexto.setStore({ settings: settingsState.draft });
    applySkin(settingsState.draft.skin);
    renderOptionButtons();
    renderSettingsPreview();
    setSettingsMessage("Configurações restauradas para o padrão.");
}

function getSettingsFromState() {
    return {
        skin: settingsState.draft.skin,
        difficulty: settingsState.draft.difficulty,
        mode: settingsState.draft.mode,
        gridSize: Number(settingsState.draft.gridSize),
        sound: settingsState.draft.sound,
        assist: settingsState.draft.assist
    };
}

function renderOptionButtons() {
    settingsElements.optionButtons.forEach((button) => {
        const setting = button.dataset.setting;
        const value = coerceSettingValue(setting, button.dataset.value);
        const active = String(settingsState.draft[setting]) === String(value);
        button.classList.toggle("is-active", active);
    });
}

function renderSettingsPreview() {
    const settings = getSettingsFromState();
    const mode = CacaContexto.MODES[settings.mode];
    settingsElements.settingsPreview.innerHTML = `
        <strong>Resumo atual</strong>
        <p>
            ${labelForSkin(settings.skin)}, dificuldade ${CacaContexto.DIFFICULTIES[settings.difficulty].name},
            modo ${mode.name}, grade ${settings.gridSize}x${settings.gridSize},
            som ${settings.sound === "on" ? "ligado" : "desligado"} e pistas ${settings.assist === "smart" ? "ligadas" : "desligadas"}.
        </p>
        <p>${mode.description}</p>
    `;
}

function applyPreset(presetId) {
    const presets = {
        focus: {
            skin: "light",
            difficulty: "medium",
            mode: "classic",
            gridSize: 12,
            sound: "on",
            assist: "smart"
        },
        speed: {
            skin: "dark",
            difficulty: "hard",
            mode: "timed",
            gridSize: 15,
            sound: "on",
            assist: "off"
        },
        calm: {
            skin: "light",
            difficulty: "easy",
            mode: "relax",
            gridSize: 10,
            sound: "off",
            assist: "smart"
        }
    };
    const preset = presets[presetId];
    if (!preset) {
        return;
    }

    settingsState.draft = { ...preset };
    applySkin(preset.skin);
    renderOptionButtons();
    renderSettingsPreview();
    setSettingsMessage("Preset aplicado. Salve para manter essa configuração.");
}

function coerceSettingValue(setting, value) {
    if (setting === "gridSize") {
        return Number(value);
    }

    return value;
}

function labelForSkin(skin) {
    return skin === "dark" ? "Modo Dark" : "Modo Claro";
}

function applySkin(skin) {
    document.body.dataset.skin = skin || "light";
}

function setSettingsMessage(message) {
    if (settingsElements.settingsMessage) {
        settingsElements.settingsMessage.textContent = message;
    }
}

function hasSettingsMarkup() {
    return Boolean(
        settingsElements.optionButtons.length
        && settingsElements.saveSettingsBtn
        && settingsElements.resetSettingsBtn
        && settingsElements.settingsPreview
        && settingsElements.settingsMessage
    );
}
