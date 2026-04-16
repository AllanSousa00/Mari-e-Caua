const menuState = {
    selectedSubject: CacaContexto.getStore().selectedSubject,
    selectedTheme: CacaContexto.getStore().selectedTheme
};
let menuEventsBound = false;

const menuElements = {
    subjectGrid: document.getElementById("subject-grid"),
    startGameBtn: document.getElementById("start-game-btn"),
    menuSummary: document.getElementById("menu-summary"),
    menuMetrics: document.getElementById("menu-metrics"),
    subjectSpotlight: document.getElementById("subject-spotlight"),
    menuThemeList: document.getElementById("menu-theme-list"),
    menuThemeSummary: document.getElementById("menu-theme-summary")
};

document.addEventListener("DOMContentLoaded", initMenuPage);
window.addEventListener("pageshow", syncMenuPage);

function initMenuPage() {
    if (!menuElements.subjectGrid || !menuElements.startGameBtn || !menuElements.menuSummary) {
        return;
    }

    if (!menuEventsBound) {
        registerMenuEvents();
        menuEventsBound = true;
    }

    syncMenuPage();
}

function syncMenuPage() {
    if (!menuElements.subjectGrid || !menuElements.menuSummary) {
        return;
    }

    const store = CacaContexto.getStore();
    const subject = CacaContexto.getSubject(store.selectedSubject);
    const theme = CacaContexto.getTheme(subject.id, store.selectedTheme);

    menuState.selectedSubject = subject.id;
    menuState.selectedTheme = theme.id;
    applySkin(store.settings.skin);
    renderSubjectGrid();
    renderMenuSummary();
    renderMenuMetrics(store);
    renderSubjectSpotlight();
    renderThemeList();
    renderThemeSummary();
}

function registerMenuEvents() {
    menuElements.subjectGrid.addEventListener("click", handleSubjectClick);
    if (menuElements.menuThemeList) {
        menuElements.menuThemeList.addEventListener("click", handleThemeClick);
    }
    menuElements.startGameBtn.addEventListener("click", startGame);
}

function handleSubjectClick(event) {
    const button = event.target.closest("[data-subject-id]");
    if (!button) {
        return;
    }

    menuState.selectedSubject = button.dataset.subjectId;
    const subject = CacaContexto.getSubject(menuState.selectedSubject);
    menuState.selectedTheme = subject.themes[0].id;
    CacaContexto.setStore({
        selectedSubject: subject.id,
        selectedTheme: subject.themes[0].id
    });
    renderSubjectGrid();
    renderMenuSummary();
    renderMenuMetrics(CacaContexto.getStore());
    renderSubjectSpotlight();
    renderThemeList();
    renderThemeSummary();
}

function handleThemeClick(event) {
    const button = event.target.closest("[data-theme-id]");
    if (!button) {
        return;
    }

    menuState.selectedTheme = button.dataset.themeId;
    CacaContexto.setStore({
        selectedSubject: menuState.selectedSubject,
        selectedTheme: menuState.selectedTheme
    });
    renderThemeList();
    renderThemeSummary();
    renderMenuSummary();
}

function startGame() {
    const subject = CacaContexto.getSubject(menuState.selectedSubject);
    const theme = CacaContexto.getTheme(subject.id, menuState.selectedTheme);
    CacaContexto.setStore({
        selectedSubject: subject.id,
        selectedTheme: theme.id
    });
    window.location.href = "jogo.html";
}

function renderSubjectGrid() {
    menuElements.subjectGrid.innerHTML = CacaContexto.SUBJECTS.map((subject) => {
        const active = subject.id === menuState.selectedSubject ? "is-active" : "";
        return `
            <button class="subject-card ${active}" type="button" data-subject-id="${subject.id}">
                <span class="subject-card__icon">${subject.icon}</span>
                <div class="subject-card__body">
                    <strong>${subject.name}</strong>
                    <p>${subject.description}</p>
                </div>
            </button>
        `;
    }).join("");
}

function renderMenuSummary() {
    const store = CacaContexto.getStore();
    const subject = CacaContexto.getSubject(menuState.selectedSubject);
    const theme = CacaContexto.getTheme(subject.id, menuState.selectedTheme);
    const mode = CacaContexto.MODES[store.settings.mode];
    menuElements.menuSummary.innerHTML = `
        <strong>${subject.name} · ${theme.name}</strong>
        <p>
            ${CacaContexto.DIFFICULTIES[store.settings.difficulty].name}, ${mode.name} e grade
            ${store.settings.gridSize}x${store.settings.gridSize}.
        </p>
    `;
}

function applySkin(skin) {
    document.body.dataset.skin = skin || "coral";
}

function renderMenuMetrics(store) {
    if (!menuElements.menuMetrics) {
        return;
    }

    const completed = store.results.filter((result) => result.completed).length;
    const lastResult = store.results[store.results.length - 1];
    menuElements.menuMetrics.innerHTML = `
        <div class="metric-card">
            <strong>${store.discovered.length}</strong>
            <span>palavras guardadas no arquivo</span>
        </div>
        <div class="metric-card">
            <strong>${completed}</strong>
            <span>rodadas concluídas</span>
        </div>
        <div class="metric-card">
            <strong>${lastResult ? lastResult.points : 0}</strong>
            <span>última pontuação registrada</span>
        </div>
    `;
}

function renderSubjectSpotlight() {
    if (!menuElements.subjectSpotlight) {
        return;
    }

    const subject = CacaContexto.getSubject(menuState.selectedSubject);
    const featuredThemes = subject.themes
        .slice(0, 3)
        .map((theme) => `<span class="tag">${theme.name}</span>`)
        .join("");

    menuElements.subjectSpotlight.innerHTML = `
        <div class="subject-spotlight__title">
            <span class="subject-card__icon">${subject.icon}</span>
            <div>
                <p class="eyebrow">Destaque atual</p>
                <strong>${subject.name}</strong>
            </div>
        </div>
        <p class="subject-spotlight__copy">${subject.description}</p>
        <div class="tag-list">${featuredThemes}</div>
    `;
}

function renderThemeList() {
    if (!menuElements.menuThemeList) {
        return;
    }

    const subject = CacaContexto.getSubject(menuState.selectedSubject);
    menuElements.menuThemeList.innerHTML = subject.themes.map((theme) => {
        const active = theme.id === menuState.selectedTheme ? "is-active" : "";
        return `
            <button class="theme-pill ${active}" type="button" data-theme-id="${theme.id}">
                ${theme.name}
            </button>
        `;
    }).join("");
}

function renderThemeSummary() {
    if (!menuElements.menuThemeSummary) {
        return;
    }

    const subject = CacaContexto.getSubject(menuState.selectedSubject);
    const theme = CacaContexto.getTheme(subject.id, menuState.selectedTheme);
    menuElements.menuThemeSummary.innerHTML = `
        <strong>${theme.name}</strong>
        <p>${theme.summary}</p>
        <p>${theme.words.length} palavra(s) nesse dossiê.</p>
    `;
}
