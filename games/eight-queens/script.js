// ========== 8 QUEENS GAME - CORRECTED LOGIC ==========

const BOARD_SIZE = 8;
const DIFFICULTY = {
    EASY: 'easy',      // Slower animation, shorter backtrack
    MEDIUM: 'medium',  // Normal animation
    HARD: 'hard'       // Fast animation, full backtracking
};
let currentDifficulty = DIFFICULTY.HARD;
const ANIMATION_DELAYS = {
    easy: 300,
    medium: 100,
    hard: 30
};

let playBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
let solveBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
let allSolutions = [];
let currentSolutionIndex = 0;
let isSolving = false;
let solutionCount = 0;
let backtrackCount = 0;

// ========== VALIDATION FUNCTIONS ==========

/**
 * Check if placing a queen at (row, col) is safe
 */
function isSafe(board, row, col) {
    // Check row
    for (let c = 0; c < BOARD_SIZE; c++) {
        if (c !== col && board[row][c]) return false;
    }
    
    // Check column
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (r !== row && board[r][col]) return false;
    }
    
    // Check upper-left diagonal
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0; r--, c--) {
        if (board[r][c]) return false;
    }
    
    // Check upper-right diagonal
    for (let r = row - 1, c = col + 1; r >= 0 && c < BOARD_SIZE; r--, c++) {
        if (board[r][c]) return false;
    }
    
    // Check lower-left diagonal
    for (let r = row + 1, c = col - 1; r < BOARD_SIZE && c >= 0; r++, c--) {
        if (board[r][c]) return false;
    }
    
    // Check lower-right diagonal
    for (let r = row + 1, c = col + 1; r < BOARD_SIZE && c < BOARD_SIZE; r++, c++) {
        if (board[r][c]) return false;
    }
    
    return true;
}

/**
 * Get all threatened squares for a queen at (row, col)
 */
function getThreatenedSquares(board, row, col) {
    const threatened = new Set();
    
    if (!board[row][col]) return threatened;
    
    // Row
    for (let c = 0; c < BOARD_SIZE; c++) {
        if (c !== col) threatened.add(`${row},${c}`);
    }
    
    // Column
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (r !== row) threatened.add(`${r},${col}`);
    }
    
    // Diagonals
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (Math.abs(r - row) === Math.abs(c - col) && (r !== row || c !== col)) {
                threatened.add(`${r},${c}`);
            }
        }
    }
    
    return threatened;
}

/**
 * Count conflicts on the board
 */
function countConflicts(board) {
    let conflicts = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] && !isSafe(board, r, c)) {
                conflicts++;
            }
        }
    }
    return Math.floor(conflicts / 2); // Each conflict counted twice
}

// ========== PLAY MODE ==========

function renderPlayBoard() {
    const boardElement = document.getElementById('board-play');
    boardElement.innerHTML = '';
    boardElement.className = 'chess-board';
    
    const threatened = new Set();
    
    // Collect all threatened squares
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (playBoard[r][c]) {
                getThreatenedSquares(playBoard, r, c).forEach(sq => threatened.add(sq));
            }
        }
    }
    
    // Render squares
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            square.onclick = () => toggleQueen(r, c);
            
            if (playBoard[r][c]) {
                square.classList.add('queen');
                square.innerHTML = '👑';
            } else if (threatened.has(`${r},${c}`)) {
                square.classList.add('threatened');
            }
            
            boardElement.appendChild(square);
        }
    }
    
    updatePlayStats();
}

function toggleQueen(row, col) {
    const queensCount = playBoard.flat().filter(q => q).length;
    
    if (playBoard[row][col]) {
        // Remove queen
        playBoard[row][col] = false;
    } else {
        // Can only place if 8 queens not already placed
        if (queensCount < BOARD_SIZE) {
            playBoard[row][col] = true;
        }
    }
    
    renderPlayBoard();
}

function updatePlayStats() {
    const queensCount = playBoard.flat().filter(q => q).length;
    const conflicts = countConflicts(playBoard);
    
    const queenCounter = document.getElementById('queenCounter');
    const conflictInfo = document.getElementById('conflictInfo');

    if (queenCounter) {
        queenCounter.textContent = String(queensCount);
    }

    if (conflictInfo) {
        conflictInfo.textContent = `${conflicts} conflict${conflicts === 1 ? '' : 's'} detected`;
        conflictInfo.style.color = conflicts === 0 ? '#16a34a' : '#e74c3c';
    }
}

function checkSolution() {
    const queensCount = playBoard.flat().filter(q => q).length;
    const conflicts = countConflicts(playBoard);
    const conflictInfo = document.getElementById('conflictInfo');
    
    if (queensCount !== 8) {
        if (conflictInfo) {
            conflictInfo.textContent = `Place all 8 queens first (${queensCount}/8)`;
            conflictInfo.style.color = '#e74c3c';
        }
        return;
    }
    
    if (conflicts === 0) {
        if (conflictInfo) {
            conflictInfo.textContent = 'Perfect! You found a valid solution.';
            conflictInfo.style.color = '#16a34a';
        }
        if (window.algorithmQuestTracking) {
            window.algorithmQuestTracking.trackGameVisit('eight-queens', 'play');
        }
    } else {
        if (conflictInfo) {
            conflictInfo.textContent = `${conflicts} queen${conflicts === 1 ? '' : 's'} are attacking. Try again.`;
            conflictInfo.style.color = '#e74c3c';
        }
    }
}

function resetPlayMode() {
    playBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
    renderPlayBoard();
}

// ========== SOLVE MODE - BACKTRACKING ==========

function solveQueensBacktrack(board, col, solutions) {
    if (col >= BOARD_SIZE) {
        solutions.push(board.map(row => [...row]));
        return;
    }
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (isSafe(board, row, col)) {
            board[row][col] = true;
            solveQueensBacktrack(board, col + 1, solutions);
            board[row][col] = false;
        }
    }
}

function findAllSolutions() {
    allSolutions = [];
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
    solveQueensBacktrack(board, 0, allSolutions);
    return allSolutions;
}

function renderSolveBoard() {
    const boardElement = document.getElementById('board-solve');
    if (!boardElement) return;

    boardElement.innerHTML = '';
    boardElement.className = 'chess-board';
    
    const solution = allSolutions[currentSolutionIndex] || Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            
            if (solution[r][c]) {
                square.classList.add('queen');
                square.innerHTML = '👑';
            }
            
            boardElement.appendChild(square);
        }
    }
    
    const solutionNumberEl = document.getElementById('solutionNumber');
    const totalSolutionsEl = document.getElementById('totalSolutions');

    if (solutionNumberEl) {
        solutionNumberEl.textContent = String(allSolutions.length === 0 ? 0 : currentSolutionIndex + 1);
    }

    if (totalSolutionsEl) {
        totalSolutionsEl.textContent = String(allSolutions.length);
    }
}

function startSolve() {
    if (allSolutions.length === 0) {
        allSolutions = findAllSolutions();
        currentSolutionIndex = 0;
    }
    renderSolveBoard();

    const stepsList = document.getElementById('stepsList');
    const algorithmSteps = document.getElementById('algorithmSteps');
    if (stepsList && algorithmSteps) {
        algorithmSteps.style.display = 'block';
        stepsList.innerHTML = `<div>Computed ${allSolutions.length} valid solutions using backtracking.</div>`;
    }
}

function nextSolution() {
    if (allSolutions.length === 0) return;
    currentSolutionIndex = (currentSolutionIndex + 1) % allSolutions.length;
    renderSolveBoard();
}

function resetSolveMode() {
    allSolutions = [];
    currentSolutionIndex = 0;
    const board = document.getElementById('board-solve');
    if (board) board.innerHTML = '';

    const solutionNumberEl = document.getElementById('solutionNumber');
    const totalSolutionsEl = document.getElementById('totalSolutions');
    if (solutionNumberEl) solutionNumberEl.textContent = '1';
    if (totalSolutionsEl) totalSolutionsEl.textContent = '92';

    solutionCount = 0;
    backtrackCount = 0;

    const backtrackEl = document.getElementById('backtrackCount');
    if (backtrackEl) backtrackEl.textContent = '0';

    const algorithmSteps = document.getElementById('algorithmSteps');
    const stepsList = document.getElementById('stepsList');
    if (algorithmSteps) algorithmSteps.style.display = 'none';
    if (stepsList) stepsList.innerHTML = '';
}

/**
 * Set game difficulty
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
    
    // Reset for new difficulty
    resetSolveMode();
}

// ========== MODE SWITCHING ==========

function switchMode(mode, clickedBtn = null) {
    document.querySelectorAll('.mode-content').forEach(el => el.style.display = 'none');
    document.getElementById(`${mode}-mode`).style.display = 'block';
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    if (window.algorithmQuestTracking) {
        window.algorithmQuestTracking.trackModeChange('eight-queens', mode);
    }
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    renderPlayBoard();

    const resetPlayBtn = document.getElementById('resetPlayBtn');
    const checkPlayBtn = document.getElementById('checkPlayBtn');
    const solveBtn = document.getElementById('solveBtn');
    const showAllBtn = document.getElementById('showAllBtn');
    const resetSolveBtn = document.getElementById('resetSolveBtn');

    if (resetPlayBtn) resetPlayBtn.addEventListener('click', resetPlayMode);
    if (checkPlayBtn) checkPlayBtn.addEventListener('click', checkSolution);
    if (solveBtn) solveBtn.addEventListener('click', startSolve);
    if (showAllBtn) showAllBtn.addEventListener('click', nextSolution);
    if (resetSolveBtn) resetSolveBtn.addEventListener('click', resetSolveMode);

    const explanation = document.getElementById('algorithm-explanation');
    if (explanation) {
        explanation.innerHTML = `
            <p><strong>Backtracking</strong> places one queen per column.</p>
            <p>If a queen causes a conflict, it removes that queen and tries the next row.</p>
            <p>This continues until all 8 queens are placed safely.</p>
        `;
    }

    const firstModeBtn = document.querySelector('.mode-btn');
    if (firstModeBtn) {
        switchMode('play', firstModeBtn);
    }
});
