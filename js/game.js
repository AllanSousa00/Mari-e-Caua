const gameStore = CacaContexto.getStore();

const gameState = {
    settings: { ...gameStore.settings },
    subjectId: gameStore.selectedSubject,
    themeId: gameStore.selectedTheme,
    subject: null,
    theme: null,
    board: [],
    boardSize: 12,
    roundWords: [],
    positions: {},
    found: new Set(),
    foundPaths: [],
    discovered: [],
    activeHint: [],
    currentSelection: [],
    selectionStart: null,
    selecting: false,
    activePointerId: null,
    appliedStateKey: "",
    points: 0,
    elapsed: 0,
    timeLeft: null,
    timerId: null,
    paused: false,
    finished: false,
    ctx: null,
    audioContext: null
};

const gameElements = {
    subjectName: document.getElementById("subject-name"),
    themeName: document.getElementById("theme-name"),
    themeSummary: document.getElementById("theme-summary"),
    wordList: document.getElementById("word-list"),
    timerDisplay: document.getElementById("timer-display"),
    scoreDisplay: document.getElementById("score-display"),
    progressDisplay: document.getElementById("progress-display"),
    roundModeName: document.getElementById("round-mode-name"),
    roundMeta: document.getElementById("round-meta"),
    progressBarFill: document.getElementById("progress-bar-fill"),
    progressCaption: document.getElementById("progress-caption"),
    hintBtn: document.getElementById("hint-btn"),
    restartBtn: document.getElementById("restart-btn"),
    canvas: document.getElementById("wordsearch-canvas"),
    selectionFeedback: document.getElementById("selection-feedback"),
    archiveList: document.getElementById("archive-list"),
    finishCard: document.getElementById("finish-card"),
    finishTitle: document.getElementById("finish-title"),
    finishCopy: document.getElementById("finish-copy"),
    finishStats: document.getElementById("finish-stats"),
    playAgainBtn: document.getElementById("play-again-btn"),
    archiveCounter: document.getElementById("archive-counter"),
    unlockModal: document.getElementById("unlock-modal"),
    unlockModalBody: document.getElementById("unlock-modal-body"),
    closeModalBtn: document.getElementById("close-modal-btn")
};

const HIGHLIGHTS = [
    "rgba(255, 126, 95, 0.34)",
    "rgba(80, 186, 255, 0.34)",
    "rgba(94, 232, 170, 0.34)",
    "rgba(255, 206, 86, 0.34)",
    "rgba(181, 120, 255, 0.34)"
];
let gameEventsBound = false;

document.addEventListener("DOMContentLoaded", initGamePage);
window.addEventListener("pageshow", handleGamePageShow);

function initGamePage() {
    if (!hasGameMarkup()) {
        return;
    }

    gameState.ctx = gameElements.canvas.getContext("2d");
    if (!gameEventsBound) {
        registerGameEvents();
        gameEventsBound = true;
    }

    syncGamePage();
}

function syncGamePage() {
    if (!hasGameMarkup()) {
        return;
    }

    clearTimer();
    startRound();
}

function handleGamePageShow(event) {
    if (event.persisted && shouldRefreshGameState()) {
        syncGamePage();
    }
}

function shouldRefreshGameState() {
    return createAppliedStateKey() !== gameState.appliedStateKey;
}

function createAppliedStateKey() {
    const store = CacaContexto.getStore();
    return JSON.stringify({
        subjectId: store.selectedSubject,
        themeId: store.selectedTheme,
        settings: store.settings
    });
}

function registerGameEvents() {
    gameElements.restartBtn.addEventListener("click", startRound);
    gameElements.playAgainBtn.addEventListener("click", startRound);
    gameElements.hintBtn.addEventListener("click", useHint);
    gameElements.archiveList.addEventListener("click", handleArchiveClick);
    gameElements.closeModalBtn.addEventListener("click", () => closeUnlockModal());
    gameElements.unlockModal.addEventListener("click", handleModalOverlayClick);
    gameElements.canvas.addEventListener("pointerdown", startSelection);
    gameElements.canvas.addEventListener("pointermove", updateSelection);
    gameElements.canvas.addEventListener("pointerup", finishSelection);
    gameElements.canvas.addEventListener("pointercancel", cancelSelection);
    gameElements.canvas.addEventListener("lostpointercapture", cancelSelection);
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", () => {
        if (gameState.board.length) {
            adjustCanvas();
            renderBoard();
        }
    });
}

function startRound(options = {}) {
    const store = CacaContexto.getStore();
    gameState.settings = { ...store.settings };
    gameState.subjectId = store.selectedSubject;
    gameState.themeId = store.selectedTheme;
    gameState.subject = CacaContexto.getSubject(gameState.subjectId);
    const forcedThemeId = options.themeId || null;

    if (forcedThemeId) {
        gameState.theme = CacaContexto.getTheme(gameState.subjectId, forcedThemeId);
    } else if (gameState.settings.mode === "surprise") {
        const randomTheme = gameState.subject.themes[Math.floor(Math.random() * gameState.subject.themes.length)];
        gameState.theme = randomTheme;
    } else {
        gameState.theme = CacaContexto.getTheme(gameState.subjectId, gameState.themeId);
    }

    gameState.themeId = gameState.theme.id;
    CacaContexto.setStore({
        selectedSubject: gameState.subject.id,
        selectedTheme: gameState.theme.id
    });
    gameState.appliedStateKey = createAppliedStateKey();

    gameState.found = new Set();
    gameState.foundPaths = [];
    gameState.discovered = [];
    gameState.activeHint = [];
    gameState.currentSelection = [];
    gameState.selectionStart = null;
    gameState.selecting = false;
    gameState.activePointerId = null;
    gameState.paused = false;
    gameState.points = 0;
    gameState.elapsed = 0;
    gameState.timeLeft = gameState.settings.mode === "timed" ? getModeTime() : null;
    gameState.finished = false;
    closeUnlockModal({ silent: true });

    clearTimer();
    applySkin(gameState.settings.skin);
    gameState.boardSize = Number(gameState.settings.gridSize);
    gameState.roundWords = getRoundWords();
    renderHeader();
    try {
        buildBoard();
    } catch (error) {
        handleBoardError();
        return;
    }
    renderWordList();
    renderArchive();
    renderRoundPanel();
    updateStats();
    adjustCanvas();
    renderBoard();
    startTimer();
    gameElements.finishCard.hidden = true;
    setFeedback("Arraste em linha reta ou diagonal para achar a primeira palavra.");
}

function handleBoardError() {
    gameState.board = [];
    gameState.positions = {};
    clearTimer();
    updateStats();
    gameElements.wordList.innerHTML = `<div class="status-card status-card--small">Falha ao montar o tabuleiro. Tente gerar um novo.</div>`;
    gameElements.archiveList.innerHTML = `<div class="status-card status-card--small">Nenhum conteúdo foi desbloqueado.</div>`;
    gameElements.finishCard.hidden = true;
    setFeedback("O tabuleiro falhou ao carregar. Clique em Novo tabuleiro.");
}

function renderHeader() {
    gameElements.subjectName.textContent = `${gameState.subject.icon} ${gameState.subject.name}`;
    gameElements.themeName.textContent = gameState.theme.name;
    const omittedWords = Math.max(0, gameState.theme.words.length - gameState.roundWords.length);
    gameElements.themeSummary.textContent = omittedWords
        ? `${gameState.theme.summary} Esta rodada usa ${gameState.roundWords.length} palavra(s) para respeitar a grade escolhida.`
        : gameState.theme.summary;
}

function renderRoundPanel() {
    const difficulty = CacaContexto.DIFFICULTIES[gameState.settings.difficulty];
    const mode = CacaContexto.MODES[gameState.settings.mode];

    if (gameElements.roundModeName) {
        gameElements.roundModeName.textContent = mode.name;
    }

    if (gameElements.roundMeta) {
        gameElements.roundMeta.innerHTML = `
            <span class="tag">${difficulty.name}</span>
            <span class="tag">Grade ${gameState.boardSize}x${gameState.boardSize}</span>
            <span class="tag">${gameState.roundWords.length} palavras</span>
        `;
    }
}

function buildBoard() {
    const words = gameState.roundWords.map((item) => item.term);

    if (!words.length) {
        throw new Error("Nenhuma palavra disponivel para esta grade.");
    }

    for (let attempt = 0; attempt < 120; attempt += 1) {
        const grid = Array.from({ length: gameState.boardSize }, () =>
            Array.from({ length: gameState.boardSize }, () => "")
        );
        const positions = {};
        let success = true;

        for (const word of [...words].sort((a, b) => b.length - a.length)) {
            if (!placeWord(grid, word, positions)) {
                success = false;
                break;
            }
        }

        if (success) {
            fillEmptyCells(grid);
            gameState.board = grid;
            gameState.positions = positions;
            return;
        }
    }

    throw new Error("Não foi possível gerar o tabuleiro.");
}

function getRoundWords() {
    const limitByDifficulty = {
        easy: 4,
        medium: 5,
        hard: 5,
        expert: 5
    };
    const allowedLength = Number(gameState.settings.gridSize);
    const fittingWords = gameState.theme.words.filter((word) => word.term.length <= allowedLength);
    const limit = limitByDifficulty[gameState.settings.difficulty] || 5;
    const selected = fittingWords.slice(0, limit);

    if (selected.length) {
        return selected;
    }

    return [...gameState.theme.words]
        .sort((left, right) => left.term.length - right.term.length)
        .slice(0, 3)
        .filter((word) => word.term.length <= allowedLength);
}

function placeWord(grid, word, positions) {
    const directions = getDirections();

    for (let attempt = 0; attempt < 200; attempt += 1) {
        const directionId = directions[Math.floor(Math.random() * directions.length)];
        const direction = CacaContexto.VECTORS[directionId];
        const start = getRandomStart(word.length, direction);

        if (!start || !canPlace(grid, word, start.row, start.col, direction)) {
            continue;
        }

        const path = [];

        for (let index = 0; index < word.length; index += 1) {
            const row = start.row + direction.row * index;
            const col = start.col + direction.col * index;
            grid[row][col] = word[index];
            path.push({ row, col });
        }

        positions[word] = path;
        return true;
    }

    return false;
}

function getDirections() {
    const base = [...CacaContexto.DIFFICULTIES[gameState.settings.difficulty].directions];
    if (gameState.settings.mode === "progressive" && !base.includes("left")) {
        base.push("left", "up", "diag-back", "diag-back-up");
    }
    return base;
}

function getRandomStart(length, direction) {
    const minRow = direction.row === -1 ? length - 1 : 0;
    const maxRow = direction.row === 1 ? gameState.boardSize - length : gameState.boardSize - 1;
    const minCol = direction.col === -1 ? length - 1 : 0;
    const maxCol = direction.col === 1 ? gameState.boardSize - length : gameState.boardSize - 1;

    if (maxRow < minRow || maxCol < minCol) {
        return null;
    }

    return {
        row: randomBetween(minRow, maxRow),
        col: randomBetween(minCol, maxCol)
    };
}

function canPlace(grid, word, row, col, direction) {
    for (let index = 0; index < word.length; index += 1) {
        const nextRow = row + direction.row * index;
        const nextCol = col + direction.col * index;
        const current = grid[nextRow][nextCol];
        if (current && current !== word[index]) {
            return false;
        }
    }
    return true;
}

function fillEmptyCells(grid) {
    const letters = "AAAABCDEEEFGHIIJLMNNOPQRSTUUVXZ";
    for (let row = 0; row < grid.length; row += 1) {
        for (let col = 0; col < grid.length; col += 1) {
            if (!grid[row][col]) {
                grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

function renderWordList() {
    gameElements.wordList.innerHTML = gameState.roundWords.map((word) => {
        const found = gameState.found.has(word.term) ? "is-found" : "";
        return `
            <div class="word-item ${found}">
                <strong>${word.label}</strong>
                <span>${gameState.found.has(word.term) ? "ok" : word.category}</span>
            </div>
        `;
    }).join("");
}

function renderArchive() {
    if (gameElements.archiveCounter) {
        gameElements.archiveCounter.textContent = String(gameState.discovered.length);
    }

    if (!gameState.discovered.length) {
        gameElements.archiveList.innerHTML = `<div class="status-card status-card--small">Nada desbloqueado ainda.</div>`;
        return;
    }

    gameElements.archiveList.innerHTML = gameState.discovered.map((word) => `
        <button class="archive-item" type="button" data-word-term="${word.term}">
            <strong>${word.label}</strong>
            <span>${word.category}</span>
        </button>
    `).join("");
}

function handleArchiveClick(event) {
    const button = event.target.closest("[data-word-term]");
    if (!button) {
        return;
    }

    const word = gameState.discovered.find((item) => item.term === button.dataset.wordTerm);
    if (word) {
        openUnlockModal(word);
    }
}

function updateStats() {
    const total = gameState.roundWords.length;
    const progressRatio = total ? gameState.found.size / total : 0;
    gameElements.scoreDisplay.textContent = `${gameState.points} pts`;
    gameElements.progressDisplay.textContent = `${gameState.found.size}/${total}`;
    if (gameElements.progressBarFill) {
        gameElements.progressBarFill.style.width = `${Math.round(progressRatio * 100)}%`;
    }
    if (gameElements.progressCaption) {
        gameElements.progressCaption.textContent = `${Math.round(progressRatio * 100)}% do dossiê concluído.`;
    }

    if (gameState.settings.mode === "timed") {
        gameElements.timerDisplay.textContent = `Tempo ${CacaContexto.formatTime(gameState.timeLeft)}`;
    } else {
        gameElements.timerDisplay.textContent = `Tempo ${CacaContexto.formatTime(gameState.elapsed)}`;
    }
}

function startTimer() {
    if (gameState.settings.mode === "timed") {
        gameState.timeLeft = gameState.timeLeft ?? getModeTime();
        updateStats();
        gameState.timerId = setInterval(() => {
            if (gameState.paused || gameState.finished) {
                return;
            }

            gameState.timeLeft -= 1;
            updateStats();
            if (gameState.timeLeft <= 0) {
                clearTimer();
                finishRound(false);
            }
        }, 1000);
        return;
    }

    gameState.timerId = setInterval(() => {
        if (gameState.paused || gameState.finished) {
            return;
        }

        gameState.elapsed += 1;
        updateStats();
    }, 1000);
}

function clearTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

function getModeTime() {
    const timeByDifficulty = {
        easy: 240,
        medium: 210,
        hard: 180,
        expert: 150
    };
    return timeByDifficulty[gameState.settings.difficulty];
}

function useHint() {
    if (gameState.finished || gameState.paused || !gameState.board.length) {
        return;
    }

    if (gameState.settings.assist === "off") {
        setFeedback("As pistas estão desligadas nas configurações.");
        return;
    }

    const remaining = gameState.roundWords.filter((word) => !gameState.found.has(word.term));
    if (!remaining.length) {
        return;
    }

    const target = remaining.sort((a, b) => a.term.length - b.term.length)[0];
    const path = gameState.positions[target.term] || [];
    gameState.activeHint = path.slice(0, Math.min(2, path.length));
    gameState.points = Math.max(0, gameState.points - 15);
    updateStats();
    renderBoard();
    playTone("hint");
    setFeedback(`Pista ligada para ${target.label}.`);
}

function startSelection(event) {
    if (gameState.finished || gameState.paused || !gameState.board.length) {
        return;
    }

    const cell = getCellFromEvent(event);
    if (!cell) {
        return;
    }

    gameState.selecting = true;
    gameState.activePointerId = event.pointerId;
    gameState.selectionStart = cell;
    gameState.currentSelection = [cell];
    try {
        gameElements.canvas.setPointerCapture(event.pointerId);
    } catch (error) {
        // Pointer capture may fail in some environments; the selection can continue without it.
    }
    renderBoard();
}

function updateSelection(event) {
    if (!gameState.selecting || !gameState.selectionStart || event.pointerId !== gameState.activePointerId) {
        return;
    }

    const cell = getCellFromEvent(event);
    if (!cell) {
        return;
    }

    const path = buildPath(gameState.selectionStart, cell);
    if (!path.length) {
        setFeedback("Selecione em linha reta ou diagonal.");
        return;
    }

    gameState.currentSelection = path;
    renderBoard();
}

function finishSelection(event) {
    if (!gameState.selecting || !gameState.selectionStart || event.pointerId !== gameState.activePointerId) {
        return;
    }

    const finalCell = getCellFromEvent(event) || gameState.currentSelection[gameState.currentSelection.length - 1];
    const path = finalCell ? buildPath(gameState.selectionStart, finalCell) : [];

    gameState.selecting = false;
    gameState.selectionStart = null;
    gameState.activePointerId = null;

    if (gameElements.canvas.hasPointerCapture(event.pointerId)) {
        gameElements.canvas.releasePointerCapture(event.pointerId);
    }

    if (path.length < 2) {
        gameState.currentSelection = [];
        renderBoard();
        setFeedback("Seleção curta demais.");
        return;
    }

    if (gameState.finished) {
        gameState.currentSelection = [];
        renderBoard();
        setFeedback("A rodada já foi encerrada.");
        return;
    }

    validateSelection(path);
    gameState.currentSelection = [];
    renderBoard();
}

function cancelSelection() {
    if (!gameState.selecting) {
        return;
    }

    const pointerId = gameState.activePointerId;
    gameState.selecting = false;
    gameState.selectionStart = null;
    gameState.activePointerId = null;
    gameState.currentSelection = [];

    if (pointerId !== null && gameElements.canvas.hasPointerCapture(pointerId)) {
        gameElements.canvas.releasePointerCapture(pointerId);
    }

    renderBoard();
}

function validateSelection(path) {
    if (gameState.finished) {
        return;
    }

    const selectedTerm = path.map((cell) => gameState.board[cell.row][cell.col]).join("");
    const reversed = selectedTerm.split("").reverse().join("");
    const word = gameState.roundWords.find((item) => item.term === selectedTerm || item.term === reversed);

    if (!word) {
        setFeedback("Essa sequência não pertence ao tema.");
        return;
    }

    if (gameState.found.has(word.term)) {
        setFeedback(`${word.label} já foi encontrada.`);
        return;
    }

    gameState.found.add(word.term);
    gameState.activeHint = [];
    gameState.foundPaths.push({
        term: word.term,
        color: HIGHLIGHTS[gameState.foundPaths.length % HIGHLIGHTS.length],
        path
    });
    unlockWord(word);
}

function unlockWord(word) {
    gameState.discovered.push(word);
    gameState.points += calculatePoints(word);
    renderWordList();
    renderArchive();
    updateStats();
    saveDiscovery(word);
    playTone("success");
    setFeedback(`${word.label} desbloqueada.`);
    openUnlockModal(word);

    if (gameState.found.size === gameState.roundWords.length) {
        finishRound(true);
    }
}

function calculatePoints(word) {
    const base = word.term.length * 10 * CacaContexto.DIFFICULTIES[gameState.settings.difficulty].multiplier;
    const modeBonus = gameState.settings.mode === "progressive" ? 30 : gameState.settings.mode === "timed" ? 20 : 0;
    const timeBonus = gameState.settings.mode === "timed" ? Math.max(0, gameState.timeLeft) * 0.15 : 0;
    return Math.round(base + modeBonus + timeBonus);
}

function finishRound(completed) {
    if (gameState.finished) {
        return;
    }

    gameState.finished = true;
    clearTimer();
    updateStats();
    playTone(completed ? "win" : "fail");
    saveResult(completed);
    gameElements.finishCard.hidden = false;
    gameElements.finishTitle.textContent = completed ? "Tema concluído" : "Tempo encerrado";
    gameElements.finishCopy.textContent = completed
        ? `Você fechou ${gameState.theme.name} e revisou ${gameState.roundWords.map((item) => item.label).join(", ")}.`
        : `O tempo acabou antes do arquivo completo, mas suas descobertas ficaram registradas.`;
    if (gameElements.finishStats) {
        gameElements.finishStats.innerHTML = `
            <div class="finish-stat">
                <strong>${gameState.found.size}/${gameState.roundWords.length}</strong>
                <span>palavras encontradas</span>
            </div>
            <div class="finish-stat">
                <strong>${gameState.points}</strong>
                <span>pontos da rodada</span>
            </div>
            <div class="finish-stat">
                <strong>${CacaContexto.formatTime(gameState.settings.mode === "timed" ? getModeTime() - gameState.timeLeft : gameState.elapsed)}</strong>
                <span>tempo registrado</span>
            </div>
        `;
    }
}

function saveDiscovery(word) {
    const store = CacaContexto.getStore();
    const key = `${gameState.theme.id}:${word.term}`;
    if (!store.discovered.some((item) => item.key === key)) {
        store.discovered.push({
            key,
            subject: gameState.subject.name,
            theme: gameState.theme.name,
            label: word.label
        });
    }
    CacaContexto.setStore({ discovered: store.discovered });
}

function saveResult(completed) {
    const store = CacaContexto.getStore();
    store.results.push({
        subject: gameState.subject.id,
        theme: gameState.theme.id,
        completed,
        points: gameState.points,
        time: gameState.settings.mode === "timed" ? getModeTime() - gameState.timeLeft : gameState.elapsed,
        date: new Date().toISOString()
    });
    CacaContexto.setStore({ results: store.results.slice(-20) });
}

function adjustCanvas() {
    const side = Math.floor(gameElements.canvas.parentElement.clientWidth) || 320;
    const ratio = window.devicePixelRatio || 1;
    gameElements.canvas.width = side * ratio;
    gameElements.canvas.height = side * ratio;
    gameElements.canvas.style.width = `${side}px`;
    gameElements.canvas.style.height = `${side}px`;
    gameState.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function renderBoard() {
    if (!gameState.ctx || !gameState.board.length) {
        return;
    }

    const ctx = gameState.ctx;
    const size = Math.floor(gameElements.canvas.clientWidth) || 320;
    const cellSize = size / gameState.boardSize;
    const colors = getBoardColors();

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, size, size);
    ctx.font = `800 ${Math.max(12, cellSize * 0.38)}px Nunito`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let row = 0; row < gameState.boardSize; row += 1) {
        for (let col = 0; col < gameState.boardSize; col += 1) {
            const x = col * cellSize;
            const y = row * cellSize;
            const selected = gameState.currentSelection.some((item) => item.row === row && item.col === col);
            const foundColor = getFoundColor(row, col);
            const hinted = gameState.activeHint.some((item) => item.row === row && item.col === col);

            ctx.fillStyle = foundColor || (hinted ? colors.hint : selected ? colors.selection : colors.cell);
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = foundColor ? colors.foundBorder : hinted ? colors.hintBorder : selected ? colors.selectionBorder : colors.line;
            ctx.lineWidth = foundColor || hinted || selected ? 2 : 1;
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.fillStyle = colors.ink;
            ctx.fillText(gameState.board[row][col], x + cellSize / 2, y + cellSize / 2 + 1);
        }
    }
}

function getBoardColors() {
    const style = getComputedStyle(document.body);
    return {
        paper: style.getPropertyValue("--board-paper").trim() || "#fffaf5",
        cell: style.getPropertyValue("--board-cell").trim() || "#fff2e8",
        ink: style.getPropertyValue("--board-ink").trim() || "#23130c",
        line: style.getPropertyValue("--board-line").trim() || "rgba(54, 31, 20, 0.14)",
        selection: "rgba(255, 180, 92, 0.38)",
        selectionBorder: "#ff9d3f",
        hint: "rgba(120, 200, 255, 0.28)",
        hintBorder: "#4caeff",
        foundBorder: "#ff734b"
    };
}

function getFoundColor(row, col) {
    for (const found of gameState.foundPaths) {
        if (found.path.some((item) => item.row === row && item.col === col)) {
            return found.color;
        }
    }
    return null;
}

function getCellFromEvent(event) {
    const rect = gameElements.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        return null;
    }

    const cellSize = rect.width / gameState.boardSize;
    return {
        row: clamp(Math.floor(y / cellSize), 0, gameState.boardSize - 1),
        col: clamp(Math.floor(x / cellSize), 0, gameState.boardSize - 1)
    };
}

function buildPath(start, end) {
    const deltaRow = end.row - start.row;
    const deltaCol = end.col - start.col;
    const absRow = Math.abs(deltaRow);
    const absCol = Math.abs(deltaCol);
    const aligned = deltaRow === 0 || deltaCol === 0 || absRow === absCol;

    if (!aligned) {
        return [];
    }

    const length = Math.max(absRow, absCol) + 1;
    const rowStep = deltaRow === 0 ? 0 : deltaRow / absRow;
    const colStep = deltaCol === 0 ? 0 : deltaCol / absCol;

    return Array.from({ length }, (_, index) => ({
        row: start.row + rowStep * index,
        col: start.col + colStep * index
    }));
}

function setFeedback(message) {
    gameElements.selectionFeedback.textContent = message;
}

function applySkin(skin) {
    document.body.dataset.skin = skin || "light";
}

function buildWordContentMarkup(word) {
    return `
        <h3>${word.title}</h3>
        <p>${word.curiosity}</p>
        <div class="tag-list">
            ${word.enem.map((item) => `<span class="tag">${item}</span>`).join("")}
        </div>
        <div class="content-meta">
            <strong>Palavra</strong>
            <p>${word.label}</p>
        </div>
        <div class="content-meta">
            <strong>Tema relacionado</strong>
            <p>${word.category}</p>
        </div>
    `;
}

function openUnlockModal(word) {
    if (!word || !gameElements.unlockModal || !gameElements.unlockModalBody) {
        return;
    }

    gameState.paused = true;
    document.body.classList.add("modal-open");
    gameElements.unlockModalBody.innerHTML = buildWordContentMarkup(word);
    gameElements.unlockModal.hidden = false;
    if (gameElements.closeModalBtn) {
        gameElements.closeModalBtn.focus();
    }
}

function closeUnlockModal(options = {}) {
    if (!gameElements.unlockModal) {
        return;
    }

    const silent = typeof options === "object" && options !== null && options.silent;
    gameElements.unlockModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (gameElements.unlockModalBody) {
        gameElements.unlockModalBody.innerHTML = "";
    }
    gameState.paused = false;

    if (!silent && !gameState.finished) {
        setFeedback("Continue a busca pelas palavras restantes.");
    }
}

function handleModalOverlayClick(event) {
    if (
        event.target === gameElements.unlockModal
        || event.target.classList.contains("unlock-modal__backdrop")
    ) {
        closeUnlockModal();
    }
}

function handleKeydown(event) {
    if (event.key === "Escape" && gameElements.unlockModal && !gameElements.unlockModal.hidden) {
        closeUnlockModal();
    }
}

function playTone(type) {
    if (gameState.settings.sound !== "on") {
        return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return;
    }

    if (!gameState.audioContext) {
        gameState.audioContext = new AudioContextClass();
    }

    if (gameState.audioContext.state === "suspended") {
        gameState.audioContext.resume();
    }

    const notes = {
        success: [440, 660],
        hint: [320, 380],
        win: [392, 523, 659],
        fail: [240, 180]
    };

    const sequence = notes[type] || notes.success;
    const now = gameState.audioContext.currentTime;

    sequence.forEach((frequency, index) => {
        const oscillator = gameState.audioContext.createOscillator();
        const gain = gameState.audioContext.createGain();
        oscillator.type = type === "fail" ? "triangle" : "sine";
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.0001;
        oscillator.connect(gain);
        gain.connect(gameState.audioContext.destination);
        const start = now + index * 0.08;
        gain.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
        oscillator.start(start);
        oscillator.stop(start + 0.16);
    });
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function hasGameMarkup() {
    return Boolean(
        gameElements.subjectName
        && gameElements.themeName
        && gameElements.themeSummary
        && gameElements.wordList
        && gameElements.timerDisplay
        && gameElements.scoreDisplay
        && gameElements.progressDisplay
        && gameElements.roundModeName
        && gameElements.roundMeta
        && gameElements.progressBarFill
        && gameElements.progressCaption
        && gameElements.hintBtn
        && gameElements.restartBtn
        && gameElements.canvas
        && gameElements.selectionFeedback
        && gameElements.archiveList
        && gameElements.finishCard
        && gameElements.finishTitle
        && gameElements.finishCopy
        && gameElements.finishStats
        && gameElements.playAgainBtn
        && gameElements.archiveCounter
        && gameElements.unlockModal
        && gameElements.unlockModalBody
        && gameElements.closeModalBtn
    );
}
