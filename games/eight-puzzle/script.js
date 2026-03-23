// --- CONFIGURATION & STATE ---
const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 represents empty
const DIFFICULTY = {
    EASY: 'easy',      // 20 shuffles
    MEDIUM: 'medium',  // 50 shuffles
    HARD: 'hard'       // 100 shuffles
};
let currentDifficulty = DIFFICULTY.HARD;
const SHUFFLE_COUNTS = {
    easy: 20,
    medium: 50,
    hard: 100
};

let boardPlay = [...GOAL_STATE];
let boardSolve = [...GOAL_STATE];
let movesCount = 0;
let isSolving = false;
let gameStats = { easy: 0, medium: 0, hard: 0, solves: { easy: 0, medium: 0, hard: 0 } };

// DOM Elements
const playPuzzle = document.getElementById('puzzle-play');
const solvePuzzle = document.getElementById('puzzle-solve');
const shuffleBtn = document.getElementById('shuffleBtn');
const solveBtn = document.getElementById('solveBtn');
const resetPlayBtn = document.getElementById('resetPlayBtn');
const resetSolveBtn = document.getElementById('resetSolveBtn');
const movesCounter = document.getElementById('movesCount');
const stepsCounter = document.getElementById('stepsCount');
const nodesCounter = document.getElementById('nodesExplored');
const algorithmExplanation = document.getElementById('algorithm-explanation');

// Algorithm explanation
const algorithmInfo = {
    title: 'A* (A-Star) Algorithm',
    description: 'A* uses a heuristic function to guide the search towards the goal. It combines actual cost (g) with estimated remaining cost (h).',
    formula: 'f(n) = g(n) + h(n)',
    where: {
        'g(n)': 'Actual cost from start to current node',
        'h(n)': 'Heuristic estimate from current to goal (Manhattan Distance)',
        'f(n)': 'Total estimated cost'
    },
    heuristic: 'Manhattan Distance: Sum of distances each tile needs to move to reach goal position',
    advantages: [
        'More efficient than BFS/DFS by using heuristics',
        'Guarantees optimal solution if heuristic is admissible',
        'Explores fewer nodes than uninformed search'
    ],
    complexity: 'Time: O(n) - varies based on heuristic quality | Space: O(n)'
};

// --- INITIALIZATION ---
function initializeGame() {
    updateAlgorithmExplanation();
    shuffleBoard();
    renderBoard('play');
    renderBoard('solve');
}

// --- UTILITIES ---

/**
 * Find empty space position
 */
function findEmpty(board) {
    return board.indexOf(0);
}

/**
 * Convert 1D index to 2D coordinates (row, col)
 */
function indexToCoords(idx) {
    return { row: Math.floor(idx / 3), col: idx % 3 };
}

/**
 * Convert 2D coordinates to 1D index
 */
function coordsToIndex(row, col) {
    return row * 3 + col;
}

/**
 * Check if two boards are equal
 */
function boardsEqual(board1, board2) {
    return board1.every((val, idx) => val === board2[idx]);
}

/**
 * Create a string representation of board (for hashing)
 */
function boardString(board) {
    return board.join(',');
}

/**
 * Clone a board
 */
function cloneBoard(board) {
    return [...board];
}

/**
 * Calculate Manhattan Distance heuristic
 */
function manhattanDistance(board) {
    let distance = 0;
    for (let i = 0; i < board.length; i++) {
        if (board[i] === 0) continue;
        
        const current = indexToCoords(i);
        const target = indexToCoords(GOAL_STATE.indexOf(board[i]));
        
        distance += Math.abs(current.row - target.row) + Math.abs(current.col - target.col);
    }
    return distance;
}

/**
 * Get valid moves from current board
 */
function getValidMoves(board) {
    const emptyIdx = findEmpty(board);
    const { row, col } = indexToCoords(emptyIdx);
    const moves = [];

    // Try all 4 directions: up, down, left, right
    const directions = [
        { dr: -1, dc: 0, dir: 'up' },
        { dr: 1, dc: 0, dir: 'down' },
        { dr: 0, dc: -1, dir: 'left' },
        { dr: 0, dc: 1, dir: 'right' }
    ];

    for (const { dr, dc, dir } of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
            const newIdx = coordsToIndex(newRow, newCol);
            moves.push({
                index: newIdx,
                direction: dir
            });
        }
    }

    return moves;
}

/**
 * Make a move: swap empty with tile
 */
function makeMove(board, tileIdx) {
    const newBoard = cloneBoard(board);
    const emptyIdx = findEmpty(newBoard);
    
    [newBoard[emptyIdx], newBoard[tileIdx]] = [newBoard[tileIdx], newBoard[emptyIdx]];
    
    return newBoard;
}

/**
 * Check if puzzle is solved
 */
function isSolved(board) {
    return boardsEqual(board, GOAL_STATE);
}

// --- RENDERING ---

/**
 * Render puzzle grid
 */
function renderBoard(type) {
    const container = type === 'play' ? playPuzzle : solvePuzzle;
    const board = type === 'play' ? boardPlay : boardSolve;
    
    container.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        
        if (board[i] === 0) {
            tile.classList.add('empty');
            tile.innerText = '';
        } else {
            tile.innerText = board[i];
            if (board[i] === i + 1) {
                tile.classList.add('correct');
            }
        }

        tile.setAttribute('data-index', i);
        tile.addEventListener('click', () => handleTileClick(i, type));

        container.appendChild(tile);
    }
}

/**
 * Handle tile click in play mode
 */
function handleTileClick(idx, type) {
    if (isSolving) return;

    const board = type === 'play' ? boardPlay : boardSolve;
    const emptyIdx = findEmpty(board);
    const { row: emptyRow, col: emptyCol } = indexToCoords(emptyIdx);
    const { row: tileRow, col: tileCol } = indexToCoords(idx);

    // Check if tile is adjacent to empty
    if (Math.abs(emptyRow - tileRow) + Math.abs(emptyCol - tileCol) === 1) {
        if (type === 'play') {
            boardPlay = makeMove(boardPlay, idx);
            movesCount++;
            movesCounter.innerText = movesCount;
        } else {
            boardSolve = makeMove(boardSolve, idx);
        }

        renderBoard(type);

        if (isSolved(board)) {
            setTimeout(() => alert('🎉 Puzzle Solved!'), 100);
        }
    }
}

/**
 * Shuffle board (Fisher-Yates shuffle + ensure solvable)
 */
function shuffleBoard() {
    let board = [...GOAL_STATE];
    const shuffleCount = SHUFFLE_COUNTS[currentDifficulty] || 100;
    
    // Make random valid moves based on difficulty to ensure solvable state
    for (let i = 0; i < shuffleCount; i++) {
        const moves = getValidMoves(board);
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        board = makeMove(board, randomMove.index);
    }

    boardPlay = board;
    movesCount = 0;
    movesCounter.innerText = '0';
    renderBoard('play');
}

/**
 * Update algorithm explanation
 */
function updateAlgorithmExplanation() {
    let html = `
        <h4>${algorithmInfo.title}</h4>
        <p><strong>How it works:</strong></p>
        <p>${algorithmInfo.description}</p>
        
        <p><strong>Formula:</strong></p>
        <div class="formula">${algorithmInfo.formula}</div>
        
        <p><strong>Where:</strong></p>
        <ul>
            ${Object.entries(algorithmInfo.where).map(([key, val]) => 
                `<li><strong>${key}:</strong> ${val}</li>`
            ).join('')}
        </ul>

        <p><strong>Heuristic:</strong></p>
        <p>${algorithmInfo.heuristic}</p>

        <p><strong>Advantages:</strong></p>
        <ul>
            ${algorithmInfo.advantages.map(adv => `<li>${adv}</li>`).join('')}
        </ul>

        <p><strong>Complexity:</strong> ${algorithmInfo.complexity}</p>
    `;

    algorithmExplanation.innerHTML = html;
}

// --- A* ALGORITHM ---

/**
 * A* Search Algorithm
 */
async function aStarSearch(startBoard) {
    const openSet = new Map(); // f-score -> Set of board strings
    const cameFrom = new Map(); // board string -> {board, move}
    const gScore = new Map(); // board string -> g value
    const fScore = new Map(); // board string -> f value

    const startStr = boardString(startBoard);
    const goalStr = boardString(GOAL_STATE);

    gScore.set(startStr, 0);
    const h = manhattanDistance(startBoard);
    fScore.set(startStr, h);

    // Initialize open set
    if (!openSet.has(h)) {
        openSet.set(h, new Set());
    }
    openSet.get(h).add(startStr);

    let nodesExplored = 0;

    while (openSet.size > 0) {
        // Find node with lowest f-score
        let current = null;
        let currentF = Infinity;
        let currentStr = null;

        for (const [f, set] of openSet) {
            if (f < currentF && set.size > 0) {
                current = set.values().next().value;
                currentF = f;
                currentStr = current;
            }
        }

        if (!current) break;

        if (currentStr === goalStr) {
            // Reconstruct path
            return await reconstructPath(cameFrom, currentStr);
        }

        openSet.get(currentF).delete(currentStr);

        // Highlight current node being explored
        boardSolve = currentStr.split(',').map(Number);
        renderBoard('solve');
        nodesExplored++;
        nodesCounter.innerText = nodesExplored;
        await sleep(50);

        const currentBoard = currentStr.split(',').map(Number);
        const moves = getValidMoves(currentBoard);
        const g = gScore.get(currentStr);

        for (const move of moves) {
            const neighborBoard = makeMove(currentBoard, move.index);
            const neighborStr = boardString(neighborBoard);
            const tentativeG = g + 1;

            if (!gScore.has(neighborStr) || tentativeG < gScore.get(neighborStr)) {
                cameFrom.set(neighborStr, { board: cloneBoard(currentBoard), move: move.index });
                gScore.set(neighborStr, tentativeG);
                
                const h = manhattanDistance(neighborBoard);
                const f = tentativeG + h;
                fScore.set(neighborStr, f);

                if (!openSet.has(f)) {
                    openSet.set(f, new Set());
                }
                openSet.get(f).add(neighborStr);
            }
        }
    }

    return null; // No solution found
}

/**
 * Reconstruct path from A* search
 */
async function reconstructPath(cameFrom, current) {
    const path = [];
    let currentStr = current;

    while (cameFrom.has(currentStr)) {
        const { board, move } = cameFrom.get(currentStr);
        path.unshift({ board, move });
        currentStr = boardString(board);
    }

    return path;
}

/**
 * Execute solution path
 */
async function executePath(path) {
    for (let i = 0; i < path.length; i++) {
        const { board, move } = path[i];
        boardSolve = cloneBoard(board);
        boardSolve = makeMove(boardSolve, move);
        renderBoard('solve');
        stepsCounter.innerText = i + 1;
        await sleep(300);
    }

    if (isSolved(boardSolve)) {
        stepsCounter.innerText = path.length;
    }
}

/**
 * Sleep helper for animations
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- EVENT HANDLERS ---

/**
 * Handle Solve button
 */
async function handleSolve() {
    if (isSolving) return;

    // Copy play board to solve board
    boardSolve = cloneBoard(boardPlay);
    renderBoard('solve');

    isSolving = true;
    solveBtn.disabled = true;
    stepsCounter.innerText = '0';
    nodesCounter.innerText = '0';

    try {
        const path = await aStarSearch(boardSolve);

        if (path) {
            await executePath(path);
        } else {
            alert('No solution found!');
        }
    } catch (err) {
        console.error('Error during solving:', err);
        alert('Error during solving: ' + err.message);
    }

    isSolving = false;
    solveBtn.disabled = false;
}

/**
 * Handle Reset Solve
 */
function handleResetSolve() {
    if (isSolving) return;
    boardSolve = [...GOAL_STATE];
    renderBoard('solve');
    stepsCounter.innerText = '0';
    nodesCounter.innerText = '0';
}

/**
 * Set game difficulty and reset board
 */
function setDifficulty(level) {
    currentDifficulty = DIFFICULTY[level.toUpperCase()];
    
    // Update UI button states
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    if (difficultyBtns.length > 0) {
        difficultyBtns.forEach(btn => {
            if (btn.dataset.level === level) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Reset game with new difficulty
    shuffleBoard();
}

/**
 * Get hint for current board state
 */
function getHint() {
    if (isSolving) return;
    
    // Use A* to find next best move
    const moves = getValidMoves(boardPlay);
    let bestMove = null;
    let bestHeuristic = Infinity;
    
    for (const move of moves) {
        const nextBoard = makeMove(boardPlay, move.index);
        const h = manhattanDistance(nextBoard);
        
        if (h < bestHeuristic) {
            bestHeuristic = h;
            bestMove = move.index;
        }
    }
    
    if (bestMove !== null) {
        boardPlay = makeMove(boardPlay, bestMove);
        movesCount++;
        movesCounter.innerText = movesCount;
        renderBoard('play');
        
        if (isSolved(boardPlay)) {
            setTimeout(() => alert('🎉 Puzzle Solved!'), 100);
        }
    }
}

// --- MODE SWITCHING ---
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const modes = ['play', 'solve', 'learn'];
        modes.forEach(mode => {
            const el = document.getElementById(`${mode}-mode`);
            if (el) el.style.display = 'none';
        });

        const modeText = e.target.innerText.toLowerCase();
        let selectedMode = 'play';
        if (modeText.includes('solve') || modeText.includes('🤖')) selectedMode = 'solve';
        if (modeText.includes('learn') || modeText.includes('📘')) selectedMode = 'learn';

        const selectedEl = document.getElementById(`${selectedMode}-mode`);
        if (selectedEl) selectedEl.style.display = 'block';
    });
});

// --- EVENT LISTENERS ---
shuffleBtn.addEventListener('click', shuffleBoard);
solveBtn.addEventListener('click', handleSolve);
resetPlayBtn.addEventListener('click', () => {
    boardPlay = [...GOAL_STATE];
    movesCount = 0;
    movesCounter.innerText = '0';
    renderBoard('play');
});
resetSolveBtn.addEventListener('click', handleResetSolve);

// Initialize on page load
initializeGame();

