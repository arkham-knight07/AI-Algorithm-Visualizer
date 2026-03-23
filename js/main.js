// --- NAVIGATION & GAME MANAGEMENT ---

/**
 * Launch a specific game with visual effects
 * @param {string} gameName - The name of the game to launch
 */
function launchGame(gameName) {
    // Add launch effect
    const btn = event.target.closest('.platform-btn, .game-card');
    if (btn) {
        btn.style.animation = 'launchPulse 0.6s ease-out';
        setTimeout(() => {
            btn.style.animation = '';
        }, 600);
    }

    // Track game visit using the tracking system
    if (window.algorithmQuestTracking) {
        window.algorithmQuestTracking.trackGameVisit(gameName, 'play');
    }
    
    // Load the game page with a small delay for effect
    setTimeout(() => {
        window.location.href = `games/${gameName}/index.html`;
    }, 200);
}

/**
 * Go back to the landing page
 */
function goHome() {
    window.location.href = '/';
}

/**
 * Switch between modes (Play, Solve, Learn)
 * @param {string} mode - The mode to switch to
 */
function switchMode(mode) {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Track mode change if tracking system available
    const gameName = window.location.pathname.split('/')[2];
    if (window.algorithmQuestTracking && gameName) {
        window.algorithmQuestTracking.trackModeChange(gameName, mode);
    }

    // Hide all mode contents with fade effect
    const modeContents = document.querySelectorAll('.mode-content');
    modeContents.forEach(content => {
        content.style.opacity = '0';
        setTimeout(() => {
            content.style.display = 'none';
            content.style.opacity = '1';
        }, 200);
    });

    // Show selected mode content
    const selectedContent = document.getElementById(`${mode}-mode`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
        setTimeout(() => {
            selectedContent.style.opacity = '1';
        }, 10);
    }
}

/**
 * Filter games by difficulty
 * @param {string} difficulty - 'all', 'beginner', 'intermediate', or 'advanced'
 */
function filterByDifficulty(difficulty) {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
        if (difficulty === 'all' || card.classList.contains(difficulty)) {
            card.classList.remove('hidden');
            card.style.animation = 'cardFadeIn 0.4s ease-out';
        } else {
            card.classList.add('hidden');
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set default mode buttons as active if they exist
    const firstModeBtn = document.querySelector('.mode-btn');
    if (firstModeBtn) {
        firstModeBtn.classList.add('active');
    }
});
