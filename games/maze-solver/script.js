// ============================================
// MAZE SOLVER - STABLE IMPLEMENTATION
// ============================================

const FIXED_ROWS = 15;
const FIXED_COLS = 15;

let currentMode = 'play';
let ROWS = FIXED_ROWS;
let COLS = FIXED_COLS;

let START = { r: 0, c: 0 };
let END = { r: ROWS - 1, c: COLS - 1 };

let playMaze = [];
let solveMaze = [];

let gameState = {
    playerPos: { r: 0, c: 0 },
    moveCount: 0,
    startTime: 0,
    timerId: null,
    active: false
};

let solveState = {
    running: false,
    paused: false,
    result: null
};

const speedLabelMap = {
    1: 'Slowest',
    2: 'Slow',
    3: 'Slow',
    4: 'Medium',
    5: 'Medium',
    6: 'Fast',
    7: 'Fast',
    8: 'Very Fast',
    9: 'Very Fast',
    10: 'Max'
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getCell(containerId, r, c) {
    return document.getElementById(`${containerId}-cell-${r}-${c}`);
}

function setFixedGridSize() {
    ROWS = FIXED_ROWS;
    COLS = FIXED_COLS;
    START = { r: 0, c: 0 };
    END = { r: ROWS - 1, c: COLS - 1 };
}

function updateSpeedLabel() {
    const slider = document.getElementById('speed-slider');
    const label = document.getElementById('speed-label');
    if (!slider || !label) return;
    label.textContent = speedLabelMap[Number(slider.value)] || 'Medium';
}

function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    document.querySelectorAll('.mode-content').forEach(panel => {
        panel.classList.remove('active');
        panel.style.display = 'none';
    });

    const activePanel = document.getElementById(`${mode}-mode`);
    if (activePanel) {
        activePanel.classList.add('active');
        activePanel.style.display = 'block';
    }
}

function generateMaze() {
    const maze = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    function inBounds(r, c) {
        return r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1;
    }

    function carve(r, c) {
        visited[r][c] = true;
        maze[r][c] = 0;

        const dirs = [
            [-2, 0], [2, 0], [0, -2], [0, 2]
        ].sort(() => Math.random() - 0.5);

        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc) && !visited[nr][nc]) {
                maze[r + dr / 2][c + dc / 2] = 0;
                carve(nr, nc);
            }
        }
    }

    const startR = ROWS > 2 ? 1 : 0;
    const startC = COLS > 2 ? 1 : 0;
    carve(startR, startC);

    maze[START.r][START.c] = 0;
    maze[END.r][END.c] = 0;

    // Ensure an entry and exit corridor from borders.
    if (ROWS > 1) maze[1][0] = 0;
    if (COLS > 1) maze[0][1] = 0;
    if (ROWS > 1) maze[ROWS - 2][COLS - 1] = 0;
    if (COLS > 1) maze[ROWS - 1][COLS - 2] = 0;

    // Guarantee there is at least one route from S to E.
    if (!hasPath(maze, START, END)) {
        carveGuaranteedRoute(maze, START, END);
    }

    return maze;
}

function hasPath(maze, start, end) {
    const queue = [[start.r, start.c]];
    const visited = new Set([`${start.r},${start.c}`]);

    while (queue.length > 0) {
        const [r, c] = queue.shift();
        if (r === end.r && c === end.c) return true;

        const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
        for (const [nr, nc] of neighbors) {
            const key = `${nr},${nc}`;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
            if (maze[nr][nc] === 1 || visited.has(key)) continue;
            visited.add(key);
            queue.push([nr, nc]);
        }
    }

    return false;
}

function carveGuaranteedRoute(maze, start, end) {
    let r = start.r;
    let c = start.c;
    maze[r][c] = 0;

    // Randomize whether to go row-first or col-first for less predictable corridors.
    const rowFirst = Math.random() < 0.5;

    const walkRow = () => {
        while (r !== end.r) {
            r += r < end.r ? 1 : -1;
            maze[r][c] = 0;
        }
    };

    const walkCol = () => {
        while (c !== end.c) {
            c += c < end.c ? 1 : -1;
            maze[r][c] = 0;
        }
    };

    if (rowFirst) {
        walkRow();
        walkCol();
    } else {
        walkCol();
        walkRow();
    }
}

function renderGrid(maze, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `${containerId}-cell-${r}-${c}`;

            if (maze[r][c] === 1) {
                cell.classList.add('wall');
            }

            if (r === START.r && c === START.c) {
                cell.classList.add('start');
                cell.textContent = 'S';
            }

            if (r === END.r && c === END.c) {
                cell.classList.add('end');
                cell.textContent = 'E';
            }

            container.appendChild(cell);
        }
    }
}

function updatePlayStats(statusText = null) {
    const movesEl = document.getElementById('play-moves');
    const statusEl = document.getElementById('play-status');

    if (movesEl) movesEl.textContent = String(gameState.moveCount);

    if (statusEl) {
        const text = statusText || (gameState.active ? 'Playing' : 'Ready');
        statusEl.innerHTML = `<span class="stat-label">Status:</span> <span>${text}</span>`;
    }
}

function startPlayTimer() {
    const timeEl = document.getElementById('play-time');
    if (!timeEl) return;

    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }

    gameState.timerId = setInterval(() => {
        if (!gameState.active) return;
        const seconds = Math.floor((Date.now() - gameState.startTime) / 1000);
        timeEl.textContent = `${seconds}s`;
    }, 200);
}

function startNewGame() {
    setFixedGridSize();
    playMaze = generateMaze();

    gameState.playerPos = { ...START };
    gameState.moveCount = 0;
    gameState.startTime = Date.now();
    gameState.active = true;

    renderGrid(playMaze, 'play-grid');

    const playerCell = getCell('play-grid', START.r, START.c);
    if (playerCell) {
        playerCell.classList.add('player-current');
        playerCell.textContent = 'P';
    }

    const timeEl = document.getElementById('play-time');
    if (timeEl) timeEl.textContent = '0s';

    updatePlayStats('Playing');
    startPlayTimer();

}

function movePlayer(direction) {
    if (!gameState.active) return;

    const { r, c } = gameState.playerPos;
    let nr = r;
    let nc = c;

    if (direction === 'up') nr = r - 1;
    if (direction === 'down') nr = r + 1;
    if (direction === 'left') nc = c - 1;
    if (direction === 'right') nc = c + 1;

    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    if (playMaze[nr][nc] === 1) return;

    const oldCell = getCell('play-grid', r, c);
    const newCell = getCell('play-grid', nr, nc);
    if (!oldCell || !newCell) return;

    oldCell.classList.remove('player-current');
    oldCell.textContent = (r === START.r && c === START.c) ? 'S' : '';

    newCell.classList.add('player-current');
    newCell.textContent = 'P';

    gameState.playerPos = { r: nr, c: nc };
    gameState.moveCount += 1;

    if (nr === END.r && nc === END.c) {
        gameState.active = false;
        updatePlayStats('Hooray! You cleared the maze!');
    } else {
        updatePlayStats('Playing');
    }
}

function getNeighbors(maze, r, c) {
    const neighbors = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && maze[nr][nc] === 0) {
            neighbors.push([nr, nc]);
        }
    }

    return neighbors;
}

function reconstructPath(parentMap) {
    const path = [];
    let key = `${END.r},${END.c}`;

    if (!parentMap.has(key) && key !== `${START.r},${START.c}`) {
        return [];
    }

    while (key) {
        const [r, c] = key.split(',').map(Number);
        path.push([r, c]);
        key = parentMap.get(key);
    }

    path.reverse();
    return path;
}

function heuristic(r, c) {
    return Math.abs(r - END.r) + Math.abs(c - END.c);
}

async function bfsSolve(maze) {
    const queue = [[START.r, START.c]];
    const visited = new Set([`${START.r},${START.c}`]);
    const parent = new Map();

    while (queue.length > 0 && solveState.running) {
        if (solveState.paused) {
            await sleep(100);
            continue;
        }

        const [r, c] = queue.shift();
        solveState.result.explored += 1;

        if (!(r === START.r && c === START.c) && !(r === END.r && c === END.c)) {
            const cell = getCell('solve-grid', r, c);
            if (cell) cell.classList.add('explored');
        }

        if (r === END.r && c === END.c) {
            solveState.result.parent = parent;
            return true;
        }

        for (const [nr, nc] of getNeighbors(maze, r, c)) {
            const key = `${nr},${nc}`;
            if (visited.has(key)) continue;
            visited.add(key);
            parent.set(key, `${r},${c}`);
            queue.push([nr, nc]);
        }

        await sleep(12 - Number(document.getElementById('speed-slider')?.value || 5));
    }

    return false;
}

async function dfsSolve(maze) {
    const stack = [[START.r, START.c]];
    const visited = new Set([`${START.r},${START.c}`]);
    const parent = new Map();

    while (stack.length > 0 && solveState.running) {
        if (solveState.paused) {
            await sleep(100);
            continue;
        }

        const [r, c] = stack.pop();
        solveState.result.explored += 1;

        if (!(r === START.r && c === START.c) && !(r === END.r && c === END.c)) {
            const cell = getCell('solve-grid', r, c);
            if (cell) cell.classList.add('explored');
        }

        if (r === END.r && c === END.c) {
            solveState.result.parent = parent;
            return true;
        }

        for (const [nr, nc] of getNeighbors(maze, r, c)) {
            const key = `${nr},${nc}`;
            if (visited.has(key)) continue;
            visited.add(key);
            parent.set(key, `${r},${c}`);
            stack.push([nr, nc]);
        }

        await sleep(12 - Number(document.getElementById('speed-slider')?.value || 5));
    }

    return false;
}

async function aStarSolve(maze) {
    const open = [[heuristic(START.r, START.c), 0, START.r, START.c]];
    const visited = new Set();
    const parent = new Map();
    const gScore = new Map([[`${START.r},${START.c}`, 0]]);

    while (open.length > 0 && solveState.running) {
        if (solveState.paused) {
            await sleep(100);
            continue;
        }

        open.sort((a, b) => a[0] - b[0]);
        const [, g, r, c] = open.shift();
        const curKey = `${r},${c}`;

        if (visited.has(curKey)) continue;
        visited.add(curKey);
        solveState.result.explored += 1;

        if (!(r === START.r && c === START.c) && !(r === END.r && c === END.c)) {
            const cell = getCell('solve-grid', r, c);
            if (cell) cell.classList.add('explored');
        }

        if (r === END.r && c === END.c) {
            solveState.result.parent = parent;
            return true;
        }

        for (const [nr, nc] of getNeighbors(maze, r, c)) {
            const nKey = `${nr},${nc}`;
            const tentativeG = g + 1;
            if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
                gScore.set(nKey, tentativeG);
                parent.set(nKey, curKey);
                open.push([tentativeG + heuristic(nr, nc), tentativeG, nr, nc]);
            }
        }

        await sleep(12 - Number(document.getElementById('speed-slider')?.value || 5));
    }

    return false;
}

function updateSolveStats(pathLength = 0, elapsedMs = 0) {
    const exploredEl = document.getElementById('explored-count');
    const pathEl = document.getElementById('path-length');
    const timeEl = document.getElementById('solve-time');
    const effEl = document.getElementById('efficiency');

    if (exploredEl) exploredEl.textContent = String(solveState.result.explored);
    if (pathEl) pathEl.textContent = String(pathLength);
    if (timeEl) timeEl.textContent = `${elapsedMs}ms`;

    const efficiency = solveState.result.explored > 0
        ? Math.round((pathLength / solveState.result.explored) * 100)
        : 0;
    if (effEl) effEl.textContent = `${Math.max(0, Math.min(100, efficiency))}%`;
}

async function paintPath(path) {
    for (let i = 1; i < path.length - 1; i++) {
        const [r, c] = path[i];
        const cell = getCell('solve-grid', r, c);
        if (cell) {
            cell.classList.remove('explored');
            cell.classList.add('path');
        }
        await sleep(8);
    }
}

function startSolve() {
    setFixedGridSize();
    solveMaze = generateMaze();
    renderGrid(solveMaze, 'solve-grid');

    solveState.running = false;
    solveState.paused = false;
    solveState.result = null;
    updateSolveStats(0, 0);

    const startBtn = document.getElementById('solve-start-btn');
    const pauseBtn = document.getElementById('solve-pause-btn');
    if (startBtn) startBtn.textContent = '▶️ Solve!';
    if (pauseBtn) pauseBtn.style.display = 'none';
}

async function runSolve() {
    if (solveState.running || !solveMaze.length) return;

    solveState.running = true;
    solveState.paused = false;
    solveState.result = { explored: 0, parent: new Map() };

    const startBtn = document.getElementById('solve-start-btn');
    const pauseBtn = document.getElementById('solve-pause-btn');
    if (startBtn) startBtn.textContent = '⏳ Solving...';
    if (pauseBtn) {
        pauseBtn.style.display = 'inline-block';
        pauseBtn.textContent = '⏸️ Pause';
    }

    const algorithm = document.getElementById('algorithm-select')?.value || 'bfs';
    const t0 = performance.now();

    let found = false;
    if (algorithm === 'dfs') found = await dfsSolve(solveMaze);
    else if (algorithm === 'astar') found = await aStarSolve(solveMaze);
    else found = await bfsSolve(solveMaze);

    const elapsed = Math.round(performance.now() - t0);

    if (found) {
        const path = reconstructPath(solveState.result.parent);
        await paintPath(path);
        updateSolveStats(path.length, elapsed);
    } else {
        updateSolveStats(0, elapsed);
    }

    solveState.running = false;
    solveState.paused = false;

    if (startBtn) startBtn.textContent = '▶️ Solve!';
    if (pauseBtn) pauseBtn.style.display = 'none';
}

function pauseSolve() {
    if (!solveState.running) return;
    solveState.paused = !solveState.paused;

    const pauseBtn = document.getElementById('solve-pause-btn');
    if (pauseBtn) {
        pauseBtn.textContent = solveState.paused ? '▶️ Resume' : '⏸️ Pause';
    }
}

function resetSolve() {
    startSolve();
}

function initialize() {
    const slider = document.getElementById('speed-slider');
    if (slider) slider.addEventListener('input', updateSpeedLabel);
    updateSpeedLabel();

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (currentMode !== 'play') return;
        if (['arrowup', 'w'].includes(key)) { e.preventDefault(); movePlayer('up'); }
        if (['arrowdown', 's'].includes(key)) { e.preventDefault(); movePlayer('down'); }
        if (['arrowleft', 'a'].includes(key)) { e.preventDefault(); movePlayer('left'); }
        if (['arrowright', 'd'].includes(key)) { e.preventDefault(); movePlayer('right'); }
    });

    switchMode('play');
    startNewGame();
    startSolve();
}

window.switchMode = switchMode;
window.startNewGame = startNewGame;
window.startSolve = startSolve;
window.runSolve = runSolve;
window.pauseSolve = pauseSolve;
window.resetSolve = resetSolve;

document.addEventListener('DOMContentLoaded', initialize);
