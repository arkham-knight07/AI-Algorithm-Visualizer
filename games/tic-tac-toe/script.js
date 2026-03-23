// --- CONFIGURATION & STATE ---
const PLAYER = 'X';
const AI = 'O';
const EMPTY = ' ';

// Difficulty levels
const DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

let boardPlay = Array(9).fill(EMPTY);
let boardAnalyze = Array(9).fill(EMPTY);
let gameOver = false;
let isAIThinking = false;
let moveEvaluations = [];
let currentDifficulty = DIFFICULTY.HARD;
let analyzeMarker = PLAYER;
let moveHistory = [];
let gameStartTime = 0;

// Stats
let stats = {
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
    winRate: 0,
    avgMoveTime: 0
};

// Performance tracking
let moveTimings = [];

// Load stats from localStorage
function loadStats() {
    const saved = localStorage.getItem('tictactoe-stats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStatsDisplay();
    }
}

function saveStats() {
    localStorage.setItem('tictactoe-stats', JSON.stringify(stats));
}

// DOM Elements
const boardPlayElement = document.getElementById('board-play');
const boardAnalyzeElement = document.getElementById('board-analyze');
const gameStatus = document.getElementById('gameStatus');
const resetPlayBtn = document.getElementById('resetPlayBtn');
const resetStatsBtn = document.getElementById('resetStatsBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetAnalyzeBtn = document.getElementById('resetAnalyzeBtn');
const moveAnalysisElement = document.getElementById('moveAnalysis');
const algorithmExplanation = document.getElementById('algorithm-explanation');
const winCountElement = document.getElementById('winCount');
const lossCountElement = document.getElementById('lossCount');
const drawCountElement = document.getElementById('drawCount');

// Algorithm explanation
const algorithmInfo = {
    title: 'Minimax Algorithm',
    description: 'Minimax is a decision-making algorithm used in game theory. It assumes both players play optimally and chooses the move that minimizes the opponent\'s maximum advantage.',
    howItWorks: [
        'Recursively explore all possible game states',
        'Assign scores: +10 (AI wins), -10 (Player wins), 0 (Draw)',
        'Maximizing layer: AI chooses move with highest score',
        'Minimizing layer: Player assumed to choose move with lowest score',
        'Return the best move for current player'
    ],
    pseudocode: `function minimax(board, isMaximizing):
    if game is over:
        return score
    
    if isMaximizing (AI turn):
        bestScore = -infinity
        for each empty cell:
            place AI mark
            score = minimax(board, false)
            undo move
            bestScore = max(bestScore, score)
        return bestScore
    else (Player turn):
        bestScore = +infinity
        for each empty cell:
            place Player mark
            score = minimax(board, true)
            undo move
            bestScore = min(bestScore, score)
        return bestScore`,
    advantages: [
        'Guarantees optimal play for both players',
        'Unbeatable when implemented correctly',
        'Explores all possibilities to find best move',
        'Works perfectly for games with finite moves'
    ],
    complexity: 'Time: O(9!) ≈ O(362,880) for Tic-Tac-Toe | Space: O(depth)',
    optimization: 'Alpha-Beta Pruning can reduce complexity by 70-90% by eliminating unnecessary branches'
};

// --- INITIALIZATION ---
function initializeGame() {
    loadStats();
    updateAlgorithmExplanation();
    resetPlayGame();
    renderBoard('play');
    renderBoard('analyze');
}

// --- UTILITIES ---

/**
 * Check if board has winning position
 */
function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]              // diagonals
    ];

    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] !== EMPTY && board[a] === board[b] && board[b] === board[c]) {
            return { winner: board[a], line };
        }
    }
    return null;
}

/**
 * Check if board is full
 */
function isBoardFull(board) {
    return board.every(cell => cell !== EMPTY);
}

/**
 * Get available moves
 */
function getAvailableMoves(board) {
    return board.map((cell, idx) => cell === EMPTY ? idx : null).filter(idx => idx !== null);
}

/**
 * Clone board
 */
function cloneBoard(board) {
    return [...board];
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- MINIMAX ALGORITHM ---

/**
 * Evaluate board state
 */
function evaluate(board) {
    const result = checkWinner(board);
    
    if (result) {
        return result.winner === AI ? 10 : -10;
    }
    
    if (isBoardFull(board)) {
        return 0;
    }
    
    return null; // Game is not over
}

/**
 * Minimax algorithm with move tracking
 */
function minimax(board, isMaximizing) {
    const score = evaluate(board);
    
    // Terminal states
    if (score !== null) {
        return { score, move: null };
    }

    const moves = getAvailableMoves(board);
    
    if (isMaximizing) {
        // AI's turn - maximize score
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (const move of moves) {
            board[move] = AI;
            const result = minimax(board, false);
            board[move] = EMPTY;
            
            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
        }
        
        return { score: bestScore, move: bestMove };
    } else {
        // Player's turn - minimize score
        let bestScore = Infinity;
        let bestMove = null;
        
        for (const move of moves) {
            board[move] = PLAYER;
            const result = minimax(board, true);
            board[move] = EMPTY;
            
            if (result.score < bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
        }
        
        return { score: bestScore, move: bestMove };
    }
}

/**
 * Get AI move with difficulty consideration
 */
function getAIMove(board) {
    const startTime = performance.now();
    
    let move;
    if (currentDifficulty === DIFFICULTY.EASY) {
        move = getRandomMove(board);
    } else if (currentDifficulty === DIFFICULTY.MEDIUM) {
        // 70% optimal, 30% random
        move = Math.random() < 0.7 ? minimaxAlphaBeta(board, true, -Infinity, Infinity).move : getRandomMove(board);
    } else {
        // Hard - always optimal with alpha-beta pruning
        move = minimaxAlphaBeta(board, true, -Infinity, Infinity).move;
    }
    
    const endTime = performance.now();
    moveTimings.push(endTime - startTime);
    
    return move;
}

/**
 * Get random valid move (for Easy difficulty)
 */
function getRandomMove(board) {
    const moves = getAvailableMoves(board);
    return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Minimax with Alpha-Beta Pruning for optimization
 */
function minimaxAlphaBeta(board, isMaximizing, alpha, beta) {
    const score = evaluate(board);
    
    // Terminal states
    if (score !== null) {
        return { score, move: null };
    }

    const moves = getAvailableMoves(board);
    
    if (isMaximizing) {
        // AI's turn - maximize score
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (const move of moves) {
            board[move] = AI;
            const result = minimaxAlphaBeta(board, false, alpha, beta);
            board[move] = EMPTY;
            
            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
            
            alpha = Math.max(alpha, bestScore);
            if (beta <= alpha) break; // Beta cutoff - prune this branch
        }
        
        return { score: bestScore, move: bestMove };
    } else {
        // Player's turn - minimize score
        let bestScore = Infinity;
        let bestMove = null;
        
        for (const move of moves) {
            board[move] = PLAYER;
            const result = minimaxAlphaBeta(board, true, alpha, beta);
            board[move] = EMPTY;
            
            if (result.score < bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
            
            beta = Math.min(beta, bestScore);
            if (beta <= alpha) break; // Alpha cutoff - prune this branch
        }
        
        return { score: bestScore, move: bestMove };
    }
}

/**
 * Regular minimax without pruning
 */
function minimax(board, isMaximizing) {
    const score = evaluate(board);
    
    // Terminal states
    if (score !== null) {
        return { score, move: null };
    }

    const moves = getAvailableMoves(board);
    
    if (isMaximizing) {
        // AI's turn - maximize score
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (const move of moves) {
            board[move] = AI;
            const result = minimax(board, false);
            board[move] = EMPTY;
            
            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
        }
        
        return { score: bestScore, move: bestMove };
    } else {
        // Player's turn - minimize score
        let bestScore = Infinity;
        let bestMove = null;
        
        for (const move of moves) {
            board[move] = PLAYER;
            const result = minimax(board, true);
            board[move] = EMPTY;
            
            if (result.score < bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
        }
        
        return { score: bestScore, move: bestMove };
    }
}

// --- RENDERING ---

/**
 * Render game board
 */
function renderBoard(type) {
    const container = type === 'play' ? boardPlayElement : boardAnalyzeElement;
    const board = type === 'play' ? boardPlay : boardAnalyze;
    
    container.innerHTML = '';
    
    const winResult = checkWinner(board);
    const winningLine = winResult ? winResult.line : [];
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        
        if (board[i] === PLAYER) {
            cell.classList.add('x');
            cell.innerText = 'X';
        } else if (board[i] === AI) {
            cell.classList.add('o');
            cell.innerText = 'O';
        }
        
        if (winningLine.includes(i)) {
            cell.classList.add('winning');
        }
        
        if (board[i] !== EMPTY) {
            cell.classList.add('occupied');
        } else if (type === 'play') {
            cell.addEventListener('click', () => handlePlayerMove(i));
        } else if (type === 'analyze') {
            cell.addEventListener('click', () => handleAnalyzeCellClick(i));
        }
        
        container.appendChild(cell);
    }
}

/**
 * In Analyze mode, click cells to place markers and build a board state.
 * Click cycles marker X -> O -> empty.
 */
function handleAnalyzeCellClick(index) {
    if (boardAnalyze[index] === EMPTY) {
        boardAnalyze[index] = analyzeMarker;
        analyzeMarker = analyzeMarker === PLAYER ? AI : PLAYER;
    } else if (boardAnalyze[index] === PLAYER) {
        boardAnalyze[index] = AI;
    } else {
        boardAnalyze[index] = EMPTY;
    }

    moveEvaluations = [];
    moveAnalysisElement.innerHTML = '';
    renderBoard('analyze');
}

/**
 * Evaluate every legal AI move from the current analyze board.
 */
function analyzeAllMoves(board) {
    moveEvaluations = [];

    const result = checkWinner(board);
    if (result || isBoardFull(board)) {
        return;
    }

    const available = getAvailableMoves(board);
    for (const move of available) {
        const temp = cloneBoard(board);
        temp[move] = AI;
        const evalResult = minimaxAlphaBeta(temp, false, -Infinity, Infinity);
        moveEvaluations.push({
            move,
            score: evalResult.score
        });
    }

    moveEvaluations.sort((a, b) => b.score - a.score);
}

/**
 * Update algorithm explanation
 */
function updateAlgorithmExplanation() {
    let html = `
        <h4>${algorithmInfo.title}</h4>
        <p><strong>What it does:</strong></p>
        <p>${algorithmInfo.description}</p>
        
        <p><strong>How it works:</strong></p>
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
        
        <p><strong>Optimization:</strong> ${algorithmInfo.optimization}</p>
    `;
    
    algorithmExplanation.innerHTML = html;
}

/**
 * Update stats display with win rate calculation
 */
function updateStatsDisplay() {
    winCountElement.innerText = stats.wins;
    lossCountElement.innerText = stats.losses;
    drawCountElement.innerText = stats.draws;
    
    // Calculate and display win rate
    const winRateElement = document.getElementById('winRate');
    if (winRateElement) {
        const totalGames = stats.wins + stats.losses + stats.draws;
        const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;
        winRateElement.innerText = `${winRate}%`;
    }
}

/**
 * Set game difficulty and update UI
 */
function setDifficulty(level) {
    currentDifficulty = DIFFICULTY[level.toUpperCase()];
    
    // Update UI button states
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    difficultyBtns.forEach(btn => {
        if (btn.dataset.level === level) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reset game for new difficulty
    resetPlayGame();
}

/**
 * Update game status
 */
function updateGameStatus() {
    const result = checkWinner(boardPlay);
    
    if (result) {
        if (result.winner === PLAYER) {
            gameStatus.innerText = '🎉 You Won!';
            gameStatus.className = 'game-status game-won';
            stats.wins++;
            saveStats();
            updateStatsDisplay();
        } else {
            gameStatus.innerText = '🤖 AI Won!';
            gameStatus.className = 'game-status game-lost';
            stats.losses++;
            saveStats();
            updateStatsDisplay();
        }
        gameOver = true;
    } else if (isBoardFull(boardPlay)) {
        gameStatus.innerText = '🤝 It\'s a Draw!';
        gameStatus.className = 'game-status game-draw';
        stats.draws++;
        saveStats();
        updateStatsDisplay();
        gameOver = true;
    } else if (isAIThinking) {
        gameStatus.innerText = '🤖 AI is thinking...';
        gameStatus.className = 'game-status ai-turn';
    } else {
        gameStatus.innerText = 'Your turn (X)';
        gameStatus.className = 'game-status player-turn';
    }
}

// --- GAME LOGIC ---

/**
 * Handle player move
 */
async function handlePlayerMove(index) {
    if (gameOver || isAIThinking || boardPlay[index] !== EMPTY) {
        return;
    }
    
    // Player move
    boardPlay[index] = PLAYER;
    renderBoard('play');
    updateGameStatus();
    
    if (gameOver) return;
    
    // AI move
    await sleep(500);
    isAIThinking = true;
    updateGameStatus();
    
    await sleep(500);
    const aiMove = getAIMove(boardPlay);
    boardPlay[aiMove] = AI;
    isAIThinking = false;
    
    renderBoard('play');
    updateGameStatus();
}

/**
 * Reset play game
 */
function resetPlayGame() {
    boardPlay = Array(9).fill(EMPTY);
    gameOver = false;
    isAIThinking = false;
    moveEvaluations = [];
    updateGameStatus();
    renderBoard('play');
}

/**
 * Reset all tracked statistics and persist the cleared values.
 */
function resetStatistics() {
    stats = {
        wins: 0,
        losses: 0,
        draws: 0,
        totalGames: 0,
        winRate: 0,
        avgMoveTime: 0
    };

    moveTimings = [];
    saveStats();
    updateStatsDisplay();
}

/**
 * Reset analyze game
 */
function resetAnalyzeGame() {
    boardAnalyze = Array(9).fill(EMPTY);
    analyzeMarker = PLAYER;
    moveEvaluations = [];
    moveAnalysisElement.innerHTML = '';
    renderBoard('analyze');
}

/**
 * Handle analyze button
 */
function handleAnalyze() {
    analyzeAllMoves(boardAnalyze);

    const terminal = checkWinner(boardAnalyze);
    if (terminal) {
        moveAnalysisElement.innerHTML = `<p style="color:#999;">Game already won by ${terminal.winner}. Reset or edit the board.</p>`;
        renderBoard('analyze');
        return;
    }

    displayMoveAnalysis();
    highlightBestMove();
}

/**
 * Display move analysis
 */
function displayMoveAnalysis() {
    if (moveEvaluations.length === 0) {
        moveAnalysisElement.innerHTML = '<p style="color: #999;">No moves available. Game is over!</p>';
        return;
    }
    
    let html = '<h4>Move Evaluations (Minimax Scores):</h4>';
    
    moveEvaluations.forEach((eval, idx) => {
        const row = Math.floor(eval.move / 3) + 1;
        const col = (eval.move % 3) + 1;
        const className = idx === 0 ? 'move-item best' : 'move-item';
        
        html += `
            <div class="${className}">
                <span class="move-position">Position [${row},${col}]</span>
                <span class="move-score">${eval.score > 0 ? '+' + eval.score : eval.score}</span>
            </div>
        `;
    });
    
    html += '<p style="color: #999; font-size: 0.9em; margin-top: 15px;">Positive scores favor AI, negative scores favor Player.</p>';
    
    moveAnalysisElement.innerHTML = html;
}

/**
 * Highlight best move on board
 */
function highlightBestMove() {
    if (moveEvaluations.length === 0) return;
    
    const bestMoveIdx = moveEvaluations[0].move;
    const cells = boardAnalyzeElement.querySelectorAll('.cell');
    cells[bestMoveIdx].classList.add('best-move');
}

/**
 * Switch between play/analyze/learn modes.
 */
function switchMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        const buttonMode = (btn.textContent || '').toLowerCase();
        const isActive =
            (mode === 'play' && buttonMode.includes('play')) ||
            (mode === 'analyze' && buttonMode.includes('analyze')) ||
            (mode === 'learn' && buttonMode.includes('learn'));
        btn.classList.toggle('active', isActive);
    });

    ['play', 'analyze', 'learn'].forEach(name => {
        const panel = document.getElementById(`${name}-mode`);
        if (!panel) return;
        panel.style.display = name === mode ? 'block' : 'none';
    });
}

// --- EVENT LISTENERS ---
resetPlayBtn.addEventListener('click', resetPlayGame);
if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', resetStatistics);
}
analyzeBtn.addEventListener('click', handleAnalyze);
resetAnalyzeBtn.addEventListener('click', resetAnalyzeGame);

// Initialize on page load
initializeGame();

// Make mode switch available for inline HTML handlers.
window.switchMode = switchMode;
