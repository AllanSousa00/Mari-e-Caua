const menuState = {
    selectedSubject: CacaContexto.getStore().selectedSubject,
    selectedTheme: CacaContexto.getStore().selectedTheme,
    currentScreen: "home"
};
let menuEventsBound = false;

const menuElements = {
    menuScreen: document.getElementById("menu-screen"),
    subjectScreen: document.getElementById("subject-screen"),
    openSubjectsBtn: document.getElementById("open-subjects-btn"),
    backToMainBtn: document.getElementById("back-to-main-btn"),
    playSelectedBtn: document.getElementById("play-selected-btn"),
    exitBtn: document.getElementById("exit-btn"),
    subjectGrid: document.getElementById("subject-grid"),
    menuSummary: document.getElementById("menu-summary"),
    menuFeedback: document.getElementById("menu-feedback"),
    menuThemeList: document.getElementById("menu-theme-list"),
    menuThemeSummary: document.getElementById("menu-theme-summary"),
    selectedSubjectName: document.getElementById("selected-subject-name"),
    selectedSubjectCopy: document.getElementById("selected-subject-copy")
};

document.addEventListener("DOMContentLoaded", initMenuPage);
window.addEventListener("pageshow", syncMenuPage);

function initMenuPage() {
    if (!hasMenuMarkup()) {
        return;
    }

    if (!menuEventsBound) {
        registerMenuEvents();
        menuEventsBound = true;
    }

    syncMenuPage();
}

function syncMenuPage() {
    if (!hasMenuMarkup()) {
        return;
    }

    const store = CacaContexto.getStore();
    const subject = CacaContexto.getSubject(store.selectedSubject);
    const theme = CacaContexto.getTheme(subject.id, store.selectedTheme);

    menuState.selectedSubject = subject.id;
    menuState.selectedTheme = theme.id;
    applySkin(store.settings.skin);
    renderMenuSummary();
    renderSubjectGrid();
    renderSubjectSpotlight();
    renderThemeList();
    renderThemeSummary();
    showScreen(menuState.currentScreen);
}

function registerMenuEvents() {
    menuElements.openSubjectsBtn.addEventListener("click", () => showScreen("subjects"));
    menuElements.backToMainBtn.addEventListener("click", () => showScreen("home"));
    menuElements.playSelectedBtn.addEventListener("click", startGame);
    menuElements.exitBtn.addEventListener("click", handleExit);
    menuElements.subjectGrid.addEventListener("click", handleSubjectClick);
    menuElements.menuThemeList.addEventListener("click", handleThemeClick);
}

function showScreen(screen) {
    menuState.currentScreen = screen === "subjects" ? "subjects" : "home";
    menuElements.menuScreen.hidden = menuState.currentScreen !== "home";
    menuElements.subjectScreen.hidden = menuState.currentScreen !== "subjects";
    setMenuFeedback(
        menuState.currentScreen === "home"
            ? "Use Jogar para escolher a matéria e abrir a seleção de temas."
            : "Escolha a matéria, selecione um tema e siga para a partida."
    );
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

function handleExit() {
    window.close();
    setTimeout(() => {
        if (!window.closed) {
            setMenuFeedback("O navegador não deixou fechar a aba. Se quiser sair, basta fechá-la manualmente.");
        }
    }, 80);
}

function renderSubjectGrid() {
    menuElements.subjectGrid.innerHTML = CacaContexto.SUBJECTS.map((subject) => {
        const active = subject.id === menuState.selectedSubject ? "is-active" : "";
        return `
            <button class="subject-card ${active}" type="button" data-subject-id="${subject.id}">
                <span class="subject-card__icon" aria-hidden="true">${subject.icon}</span>
                <div class="subject-card__body">
                    <strong>${subject.name}</strong>
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
        <strong>Rodada pronta</strong>
        <p>
            ${subject.name}, tema ${theme.name}, dificuldade ${CacaContexto.DIFFICULTIES[store.settings.difficulty].name},
            modo ${mode.name} e grade ${store.settings.gridSize}x${store.settings.gridSize}.
        </p>
    `;
}

function renderSubjectSpotlight() {
    const subject = CacaContexto.getSubject(menuState.selectedSubject);
    menuElements.selectedSubjectName.textContent = subject.name;
    menuElements.selectedSubjectCopy.textContent = subject.description;
}

function renderThemeList() {
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
    const subject = CacaContexto.getSubject(menuState.selectedSubject);
    const theme = CacaContexto.getTheme(subject.id, menuState.selectedTheme);
    menuElements.menuThemeSummary.innerHTML = `
        <strong>${theme.name}</strong>
        <p>${theme.summary}</p>
        <p>${theme.words.length} palavra(s) disponíveis para este tema.</p>
    `;
}

function applySkin(skin) {
    document.body.dataset.skin = skin || "light";
}

function setMenuFeedback(message) {
    if (menuElements.menuFeedback) {
        menuElements.menuFeedback.textContent = message;
    }
}

function hasMenuMarkup() {
    return Boolean(
        menuElements.menuScreen
        && menuElements.subjectScreen
        && menuElements.openSubjectsBtn
        && menuElements.backToMainBtn
        && menuElements.playSelectedBtn
        && menuElements.exitBtn
        && menuElements.subjectGrid
        && menuElements.menuSummary
        && menuElements.menuFeedback
        && menuElements.menuThemeList
        && menuElements.menuThemeSummary
        && menuElements.selectedSubjectName
        && menuElements.selectedSubjectCopy
    );
}
