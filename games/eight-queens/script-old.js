// --- CONFIGURATION & STATE ---
const BOARD_SIZE = 8;
const QUEEN = '👑';
const EMPTY = '';

let boardPlay = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
let boardSolve = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
let allSolutions = [];
let currentSolutionIndex = 0;
let backtrackCount = 0;
let algorithmSteps = [];
let isSolving = false;

// DOM Elements
const boardPlayElement = document.getElementById('board-play');
const boardSolveElement = document.getElementById('board-solve');
const playStatus = document.getElementById('playStatus');
const playStatusMessage = document.getElementById('playStatus');
const queenCounter = document.getElementById('queenCounter');
const conflictInfo = document.getElementById('conflictInfo');
const resetPlayBtn = document.getElementById('resetPlayBtn');
const checkPlayBtn = document.getElementById('checkPlayBtn');
const solveBtn = document.getElementById('solveBtn');
const showAllBtn = document.getElementById('showAllBtn');
const resetSolveBtn = document.getElementById('resetSolveBtn');
const stepsList = document.getElementById('stepsList');
const algorithmStepsDiv = document.getElementById('algorithmSteps');
const solutionNumberEl = document.getElementById('solutionNumber');
const totalSolutionsEl = document.getElementById('totalSolutions');
const backtrackCountEl = document.getElementById('backtrackCount');
const algorithmExplanation = document.getElementById('algorithm-explanation');

// Algorithm explanation
const algorithmInfo = {
    title: 'Backtracking Algorithm',
    description: 'Backtracking is a recursive algorithm that builds a solution incrementally, one piece at a time. It removes solutions that fail to satisfy constraints without testing all possible solutions.',
    howItWorks: [
        'Place first queen in first column, first row',
        'Move to next column and find safe row for next queen',
        'Check if position is safe (no conflicts with previous queens)',
        'If safe, place queen and move to next column',
        'If no safe position found, backtrack to previous column',
        'Remove queen from previous column and try next row',
        'Continue until all 8 queens are placed or all possibilities exhausted'
    ],
    pseudocode: `function solveQueens(board, col):
    if col >= 8:
        return true  // All queens placed
    
    for row in 0 to 7:
        if isSafe(board, row, col):
            place queen at [row, col]
            
            if solveQueens(board, col + 1):
                return true
            
            // Backtrack
            remove queen from [row, col]
    
    return false  // No solution found

function isSafe(board, row, col):
    // Check same row
    for i in 0 to col-1:
        if board[row][i] == queen:
            return false
    
    // Check upper diagonal
    for i, j in diagonal:
        if board[i][j] == queen:
            return false
    
    // Check lower diagonal
    for i, j in diagonal:
        if board[i][j] == queen:
            return false
    
    return true`,
    advantages: [
        'Efficient for constraint satisfaction problems',
        'Finds all solutions, not just one',
        'Prunes search space by eliminating invalid branches early',
        'Memory efficient - only stores current solution'
    ],
    complexity: 'Time: O(N!) worst case | Space: O(N) for recursion stack | Best case: Much faster with pruning',
    realWorld: 'Used in: Sudoku solvers, puzzle games, scheduling problems, graph coloring'
};

// --- INITIALIZATION ---
function initializeGame() {
    updateAlgorithmExplanation();
    renderBoard('play');
    renderBoard('solve');
    totalSolutionsEl.innerText = '92'; // There are exactly 92 solutions for 8 Queens
}

// --- UTILITIES ---

/**
 * Create empty board
 */
function createEmptyBoard() {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
}

/**
 * Clone board
 */
function cloneBoard(board) {
    return board.map(row => [...row]);
}

/**
 * Check if position is safe (no attacking queens)
 */
function isSafe(board, row, col) {
    // Check same row
    for (let i = 0; i < col; i++) {
        if (board[row][i]) return false;
    }
    
    // Check upper left diagonal
    for (let i = row, j = col; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j]) return false;
    }
    
    // Check lower left diagonal
    for (let i = row, j = col; i < BOARD_SIZE && j >= 0; i++, j--) {
        if (board[i][j]) return false;
    }
    
    return true;
}

/**
 * Count conflicts for a given board
 */
function countConflicts(board) {
    let conflicts = 0;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (!board[r][c]) continue;
            
            // Check same row
            for (let i = c + 1; i < BOARD_SIZE; i++) {
                if (board[r][i]) conflicts++;
            }
            
            // Check diagonals
            for (let i = r + 1, j = c + 1; i < BOARD_SIZE && j < BOARD_SIZE; i++, j++) {
                if (board[i][j]) conflicts++;
            }
            
            for (let i = r + 1, j = c - 1; i < BOARD_SIZE && j >= 0; i++, j--) {
                if (board[i][j]) conflicts++;
            }
        }
    }
    
    return conflicts;
}

/**
 * Count placed queens
 */
function countQueens(board) {
    let count = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c]) count++;
        }
    }
    return count;
}

/**
 * Get all attacking positions for a queen
 */
function getAttackingPositions(board, row, col) {
    const attacking = [];
    
    // Same row
    for (let c = 0; c < BOARD_SIZE; c++) {
        if (c !== col) attacking.push([row, c]);
    }
    
    // Diagonals
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if ((i === row || j === col) && !(i === row && j === col)) continue;
            if (Math.abs(i - row) === Math.abs(j - col)) {
                attacking.push([i, j]);
            }
        }
    }
    
    return attacking;
}

// --- BACKTRACKING ALGORITHM ---

/**
 * Backtracking solver
 */
function solveQueensHelper(board, col, solutions, steps) {
    if (col >= BOARD_SIZE) {
        solutions.push(cloneBoard(board));
        return;
    }
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (isSafe(board, row, col)) {
            board[row][col] = true;
            steps.push({ type: 'place', row, col });
            solveQueensHelper(board, col + 1, solutions, steps);
            board[row][col] = false;
            steps.push({ type: 'backtrack', row, col });
        }
    }
}

/**
 * Find one solution using backtracking
 */
function solveQueens(board) {
    algorithmSteps = [];
    const solutions = [];
    const testBoard = cloneBoard(board);
    solveQueensHelper(testBoard, 0, solutions, algorithmSteps);
    return solutions.length > 0 ? solutions[0] : null;
}

/**
 * Find all solutions
 */
function findAllSolutions() {
    algorithmSteps = [];
    const solutions = [];
    const board = createEmptyBoard();
    solveQueensHelper(board, 0, solutions, algorithmSteps);
    return solutions;
}

// --- RENDERING ---

/**
 * Render chessboard
 */
function renderBoard(type) {
    const container = type === 'play' ? boardPlayElement : boardSolveElement;
    const board = type === 'play' ? boardPlay : boardSolve;
    
    container.innerHTML = '';
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            square.setAttribute('data-row', r);
            square.setAttribute('data-col', c);
            
            if (board[r][c]) {
                const queen = document.createElement('span');
                queen.classList.add('queen');
                queen.innerText = QUEEN;
                square.appendChild(queen);
            }
            
            if (type === 'play') {
                square.addEventListener('click', () => handleSquareClick(r, c));
            }
            
            container.appendChild(square);
        }
    }
}

/**
 * Update algorithm explanation
 */
function updateAlgorithmExplanation() {
    let html = `
        <h4>${algorithmInfo.title}</h4>
        <p><strong>What it does:</strong></p>
        <p>${algorithmInfo.description}</p>
        
        <p><strong>How it works (8 Queens Problem):</strong></p>
        <ul>
            ${algorithmInfo.howItWorks.map(step => `<li>${step}</li>`).join('')}
        </ul>
        
        <p><strong>Pseudocode:</strong></p>
        <div class="code-block">${algorithmInfo.pseudocode}</div>
        
        <p><strong>Advantages:</strong></p>
        <ul>
            ${algorithmInfo.advantages.map(adv => `<li>${adv}</li>`).join('')}
        </ul>
        
        <p><strong>Complexity:</strong> ${algorithmInfo.complexity}</p>
        
        <p><strong>Real-World Applications:</strong> ${algorithmInfo.realWorld}</p>
    `;
    
    algorithmExplanation.innerHTML = html;
}

/**
 * Highlight attacking squares
 */
function highlightAttackingSquares(type) {
    const container = type === 'play' ? boardPlayElement : boardSolveElement;
    const board = type === 'play' ? boardPlay : boardSolve;
    const squares = container.querySelectorAll('.square');
    
    squares.forEach(sq => sq.classList.remove('attacking', 'conflict'));
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c]) {
                const attacking = getAttackingPositions(board, r, c);
                for (const [ar, ac] of attacking) {
                    if (board[ar][ac] && !(ar === r && ac === c)) {
                        const idx = ar * BOARD_SIZE + ac;
                        squares[idx].classList.add('conflict');
                    } else if (!board[ar][ac]) {
                        const idx = ar * BOARD_SIZE + ac;
                        squares[idx].classList.add('attacking');
                    }
                }
            }
        }
    }
}

// --- GAME LOGIC ---

/**
 * Handle square click in play mode
 */
function handleSquareClick(row, col) {
    if (isSolving) return;
    
    if (boardPlay[row][col]) {
        boardPlay[row][col] = false;
    } else {
        boardPlay[row][col] = true;
    }
    
    renderBoard('play');
    updatePlayStatus();
    highlightAttackingSquares('play');
}

/**
 * Update play mode status
 */
function updatePlayStatus() {
    const queens = countQueens(boardPlay);
    const conflicts = countConflicts(boardPlay);
    
    queenCounter.innerText = queens;
    conflictInfo.innerText = `${conflicts} conflicts detected`;
    
    if (conflicts > 0) {
        conflictInfo.style.color = '#e74c3c';
    } else if (queens === 8) {
        conflictInfo.style.color = '#2ecc71';
        conflictInfo.innerText = '✓ Valid solution!';
    } else {
        conflictInfo.style.color = '#e74c3c';
    }
}

/**
 * Check play solution
 */
function checkSolution() {
    const queens = countQueens(boardPlay);
    const conflicts = countConflicts(boardPlay);
    
    if (queens === 8 && conflicts === 0) {
        playStatusMessage.innerText = '🎉 Correct Solution!';
        playStatusMessage.className = 'game-status success';
    } else if (queens === 8) {
        playStatusMessage.innerText = `❌ Invalid! ${conflicts} conflicts found`;
        playStatusMessage.className = 'game-status error';
    } else {
        playStatusMessage.innerText = `❌ Not complete! ${queens}/8 queens placed`;
        playStatusMessage.className = 'game-status error';
    }
}

/**
 * Solve using backtracking
 */
async function handleSolve() {
    if (isSolving) return;
    
    isSolving = true;
    solveBtn.disabled = true;
    
    boardSolve = createEmptyBoard();
    const solution = solveQueens(boardSolve);
    
    if (solution) {
        boardSolve = solution;
        backtrackCountEl.innerText = algorithmSteps.filter(s => s.type === 'backtrack').length;
        displaySteps();
        renderBoard('solve');
    } else {
        alert('No solution found!');
    }
    
    isSolving = false;
    solveBtn.disabled = false;
}

/**
 * Show all solutions
 */
async function handleShowAll() {
    if (isSolving) return;
    
    isSolving = true;
    showAllBtn.disabled = true;
    
    allSolutions = findAllSolutions();
    currentSolutionIndex = 0;
    
    if (allSolutions.length > 0) {
        totalSolutionsEl.innerText = allSolutions.length;
        displaySolution(0);
    }
    
    isSolving = false;
    showAllBtn.disabled = false;
}

/**
 * Display a specific solution
 */
function displaySolution(index) {
    if (index < 0 || index >= allSolutions.length) return;
    
    currentSolutionIndex = index;
    boardSolve = cloneBoard(allSolutions[index]);
    solutionNumberEl.innerText = index + 1;
    renderBoard('solve');
    stepsList.innerHTML = '';
    algorithmStepsDiv.style.display = 'none';
}

/**
 * Display backtracking steps
 */
function displaySteps() {
    stepsList.innerHTML = '';
    let backtrackNum = 0;
    
    algorithmSteps.forEach((step, idx) => {
        const item = document.createElement('div');
        item.classList.add('step-item');
        
        if (step.type === 'place') {
            item.classList.add('place');
            item.innerText = `▶ Place queen at [Row ${step.row + 1}, Col ${step.col + 1}]`;
        } else {
            item.classList.add('backtrack');
            backtrackNum++;
            item.innerText = `◀ Backtrack from [Row ${step.row + 1}, Col ${step.col + 1}] (${backtrackNum})`;
        }
        
        stepsList.appendChild(item);
    });
    
    algorithmStepsDiv.style.display = 'block';
}

// --- EVENT LISTENERS ---
resetPlayBtn.addEventListener('click', () => {
    boardPlay = createEmptyBoard();
    renderBoard('play');
    updatePlayStatus();
    playStatusMessage.className = 'game-status';
    playStatusMessage.innerText = 'Queens placed: 0/8';
});

checkPlayBtn.addEventListener('click', checkSolution);

solveBtn.addEventListener('click', handleSolve);
showAllBtn.addEventListener('click', handleShowAll);

resetSolveBtn.addEventListener('click', () => {
    boardSolve = createEmptyBoard();
    allSolutions = [];
    currentSolutionIndex = 0;
    backtrackCountEl.innerText = '0';
    stepsList.innerHTML = '';
    algorithmStepsDiv.style.display = 'none';
    renderBoard('solve');
});

// Mode switching
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

// Initialize on page load
initializeGame();
