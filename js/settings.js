const settingsElements = {
    presetButtons: Array.from(document.querySelectorAll("[data-preset]")),
    skinSelect: document.getElementById("skin-select"),
    difficultySelect: document.getElementById("difficulty-select"),
    modeSelect: document.getElementById("mode-select"),
    gridSizeSelect: document.getElementById("grid-size-select"),
    soundSelect: document.getElementById("sound-select"),
    assistSelect: document.getElementById("assist-select"),
    saveSettingsBtn: document.getElementById("save-settings-btn"),
    resetSettingsBtn: document.getElementById("reset-settings-btn"),
    settingsPreview: document.getElementById("settings-preview"),
    settingsMessage: document.getElementById("settings-message")
};
let settingsEventsBound = false;

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
    fillSettingsFormFrom(store.settings);
    applySkin(store.settings.skin);
    renderSettingsPreview();
    setSettingsMessage("As preferências atuais já estão carregadas.");
}

function registerSettingsEvents() {
    settingsElements.presetButtons.forEach((button) => {
        button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });
    settingsElements.skinSelect.addEventListener("change", handlePreviewChange);
    settingsElements.difficultySelect.addEventListener("change", handleFieldChange);
    settingsElements.modeSelect.addEventListener("change", handleFieldChange);
    settingsElements.gridSizeSelect.addEventListener("change", handleFieldChange);
    settingsElements.soundSelect.addEventListener("change", handleFieldChange);
    settingsElements.assistSelect.addEventListener("change", handleFieldChange);
    settingsElements.saveSettingsBtn.addEventListener("click", saveSettings);
    settingsElements.resetSettingsBtn.addEventListener("click", resetSettings);
}

function handlePreviewChange() {
    applySkin(settingsElements.skinSelect.value);
    renderSettingsPreview();
    setSettingsMessage("Alterações prontas para salvar.");
}

function handleFieldChange() {
    renderSettingsPreview();
    setSettingsMessage("Alterações prontas para salvar.");
}

function saveSettings() {
    const settings = getSettingsFromForm();
    CacaContexto.setStore({ settings });
    applySkin(settings.skin);
    renderSettingsPreview();
    setSettingsMessage("Configurações salvas com sucesso.");
}

function resetSettings() {
    const defaults = { ...CacaContexto.DEFAULT_SETTINGS };
    CacaContexto.setStore({ settings: defaults });
    fillSettingsFormFrom(defaults);
    applySkin(defaults.skin);
    renderSettingsPreview();
    setSettingsMessage("Configurações restauradas para o padrão.");
}

function fillSettingsFormFrom(settings) {
    settingsElements.skinSelect.value = settings.skin;
    settingsElements.difficultySelect.value = settings.difficulty;
    settingsElements.modeSelect.value = settings.mode;
    settingsElements.gridSizeSelect.value = String(settings.gridSize);
    settingsElements.soundSelect.value = settings.sound;
    settingsElements.assistSelect.value = settings.assist;
}

function getSettingsFromForm() {
    return {
        skin: settingsElements.skinSelect.value,
        difficulty: settingsElements.difficultySelect.value,
        mode: settingsElements.modeSelect.value,
        gridSize: Number(settingsElements.gridSizeSelect.value),
        sound: settingsElements.soundSelect.value,
        assist: settingsElements.assistSelect.value
    };
}

function renderSettingsPreview() {
    const settings = getSettingsFromForm();
    const mode = CacaContexto.MODES[settings.mode];
    settingsElements.settingsPreview.innerHTML = `
        <strong>Resumo atual</strong>
        <p>
            Visual ${labelForSkin(settings.skin)}, dificuldade ${CacaContexto.DIFFICULTIES[settings.difficulty].name},
            modo ${mode.name}, grade ${settings.gridSize}x${settings.gridSize},
            som ${settings.sound === "on" ? "ligado" : "desligado"} e pistas ${settings.assist === "smart" ? "ligadas" : "desligadas"}.
        </p>
        <p>${mode.description}</p>
    `;
}

function labelForSkin(skin) {
    const labels = {
        coral: "Coral",
        oceano: "Oceano",
        jade: "Jade"
    };

    return labels[skin] || "Coral";
}

function applySkin(skin) {
    document.body.dataset.skin = skin || "coral";
}

function setSettingsMessage(message) {
    if (settingsElements.settingsMessage) {
        settingsElements.settingsMessage.textContent = message;
    }
}

function applyPreset(presetId) {
    const presets = {
        focus: {
            skin: "coral",
            difficulty: "medium",
            mode: "classic",
            gridSize: 12,
            sound: "on",
            assist: "smart"
        },
        speed: {
            skin: "oceano",
            difficulty: "hard",
            mode: "timed",
            gridSize: 15,
            sound: "on",
            assist: "off"
        },
        calm: {
            skin: "jade",
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

    fillSettingsFormFrom(preset);
    applySkin(preset.skin);
    renderSettingsPreview();
    setSettingsMessage("Preset aplicado. Salve para manter essa configuração.");
}

function hasSettingsMarkup() {
    return Boolean(
        settingsElements.skinSelect
        && settingsElements.difficultySelect
        && settingsElements.modeSelect
        && settingsElements.gridSizeSelect
        && settingsElements.soundSelect
        && settingsElements.assistSelect
        && settingsElements.saveSettingsBtn
        && settingsElements.resetSettingsBtn
        && settingsElements.settingsPreview
    );
}
