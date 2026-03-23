// Tracking System - Monitor User Progress Across All Games

const GAMES = ['maze-solver', 'eight-puzzle', 'tic-tac-toe', 'eight-queens'];

// Initialize tracking on page load
document.addEventListener('DOMContentLoaded', () => {
    loadGameProgress();
    updateProgressBar();
    updateAchievements();
});

/* ==================== LOCAL STORAGE HELPERS ==================== */

function getGameProgress() {
    const stored = localStorage.getItem('algorithmQuestProgress');
    return stored ? JSON.parse(stored) : {
        gamesPlayed: [],
        learnModeVisited: [],
        solveModeCompleted: [],
        lastPlayed: null
    };
}

function saveGameProgress(progress) {
    localStorage.setItem('algorithmQuestProgress', JSON.stringify(progress));
}

function trackGameVisit(gameName, mode) {
    const progress = getGameProgress();
    
    if (!progress.gamesPlayed.includes(gameName)) {
        progress.gamesPlayed.push(gameName);
    }
    
    if (mode === 'learn' && !progress.learnModeVisited.includes(gameName)) {
        progress.learnModeVisited.push(gameName);
    }
    
    if (mode === 'solve' && !progress.solveModeCompleted.includes(gameName)) {
        progress.solveModeCompleted.push(gameName);
    }
    
    progress.lastPlayed = gameName;
    saveGameProgress(progress);
    
    // Update UI
    updateProgressBar();
    updateAchievements();
}

/* ==================== PROGRESS TRACKING ==================== */

function loadGameProgress() {
    const progress = getGameProgress();
    
    // Update each game card with play status
    GAMES.forEach(game => {
        const element = document.getElementById(`${game.replace('-', '')}-played`);
        if (element) {
            if (progress.gamesPlayed.includes(game)) {
                element.textContent = '✓ Played';
                element.style.color = '#4CAF50';
            } else {
                element.textContent = 'Not played';
                element.style.color = '#999';
            }
        }
    });
}

function updateProgressBar() {
    const progress = getGameProgress();
    const totalGames = GAMES.length;
    const gamesPlayed = progress.gamesPlayed.length;
    const percentage = Math.round((gamesPlayed / totalGames) * 100);
    
    // Update progress bar
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    
    // Update progress text
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        if (percentage === 100) {
            progressText.textContent = `🎉 100% Complete - You're an Algorithm Master!`;
            progressText.style.color = '#4CAF50';
        } else {
            progressText.textContent = `${percentage}% Complete - Play ${totalGames - gamesPlayed} more game${totalGames - gamesPlayed !== 1 ? 's' : ''} to unlock Quest Master!`;
            progressText.style.color = '#666';
        }
    }
    
    // Update nav stats
    const progressBadge = document.getElementById('progress-badge');
    if (progressBadge) {
        progressBadge.textContent = `Games Played: ${gamesPlayed}/${totalGames}`;
    }
}

/* ==================== ACHIEVEMENTS SYSTEM ==================== */

const ACHIEVEMENTS = {
    'achi-first-game': {
        name: 'First Steps',
        icon: '🎮',
        condition: (progress) => progress.gamesPlayed.length >= 1
    },
    'achi-all-games': {
        name: 'Quest Master',
        icon: '🌟',
        condition: (progress) => progress.gamesPlayed.length === 5
    },
    'achi-solver': {
        name: 'Algorithm Expert',
        icon: '🧠',
        condition: (progress) => progress.solveModeCompleted.length >= 3
    },
    'achi-learn': {
        name: 'Knowledge Seeker',
        icon: '📚',
        condition: (progress) => progress.learnModeVisited.length >= 3
    }
};

function updateAchievements() {
    const progress = getGameProgress();
    let unlockedCount = 0;
    
    Object.keys(ACHIEVEMENTS).forEach(achievementId => {
        const card = document.getElementById(achievementId);
        if (card) {
            const achievement = ACHIEVEMENTS[achievementId];
            if (achievement.condition(progress)) {
                card.classList.remove('locked');
                card.classList.add('unlocked');
                unlockedCount++;
            } else {
                card.classList.add('locked');
                card.classList.remove('unlocked');
            }
        }
    });
    
    // Update achievement count
    const achievementCount = document.getElementById('achievement-count');
    if (achievementCount) {
        achievementCount.textContent = `🏆 Achievements: ${unlockedCount}/4`;
    }
}

/* ==================== DIFFICULTY FILTERING ==================== */

function filterByDifficulty(difficulty) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter cards
    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
        if (difficulty === 'all') {
            card.classList.remove('hidden');
        } else {
            if (card.classList.contains(difficulty)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        }
    });
}

/* ==================== GAME LAUNCH WITH TRACKING ==================== */

function launchGame(gameName) {
    // Record that user is playing this game
    trackGameVisit(gameName, 'play');
    
    // Navigate to game
    window.location.href = `/games/${gameName}/index.html`;
}

/* ==================== GAME MODE SWITCHING TRACKER ==================== */

// This function should be called in each game's mode switcher
function trackModeChange(gameName, mode) {
    if (mode === 'learn' || mode === 'solve') {
        trackGameVisit(gameName, mode);
    }
}

/* ==================== EXPORT FOR USE IN GAMES ==================== */

// Make tracking functions available to games
window.algorithmQuestTracking = {
    trackGameVisit: trackGameVisit,
    trackModeChange: trackModeChange,
    getGameProgress: getGameProgress
};
