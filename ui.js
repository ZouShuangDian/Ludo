// This module will handle UI updates and interactions.
// It will need access to game state variables from main.js (e.g., gameMessage, players, currentPlayerIndex, gameOver)
// and config constants from config.js.

// For now, we define the functions. Imports and state access will be resolved
// when main.js is structured.

export let gameMessage = ""; // This will be managed by main.js eventually, placeholder for now

/**
 * Displays the given dice value in the UI.
 * @param {number | string} value - The value to display (number or initial string).
 */
export function displayDiceValue(value) {
    const diceArea = document.getElementById('dice-area');
    if (diceArea) {
        diceArea.textContent = `Dice: ${value}`;
    } else {
        // console.error('#dice-area element not found');
    }
}

/**
 * Updates the player info div to show the current player and game messages.
 * Needs: players, currentPlayerIndex, gameMessage (from main.js)
 */
export function updatePlayerInfoDisplay(players, currentPlayerIndex, currentMessage) {
    const playerInfoDiv = document.getElementById('player-info');
    if (playerInfoDiv && players && players[currentPlayerIndex]) {
        playerInfoDiv.innerHTML = `Player: ${players[currentPlayerIndex].colorName.toUpperCase()}${players[currentPlayerIndex].isAI ? ' (AI)' : ''} <br> ${currentMessage}`;
    } else if (playerInfoDiv) {
        playerInfoDiv.innerHTML = currentMessage; // For general messages when player context might be missing
    }
}

/**
 * Updates UI elements based on whose turn it is (human or AI).
 * Needs: gameOver, players, currentPlayerIndex (from main.js)
 */
export function updateUITurnState(gameOver, players, currentPlayerIndex) {
    const rollDiceButton = document.getElementById('roll-dice-btn');
    if (!rollDiceButton) return;

    if (gameOver) {
        rollDiceButton.disabled = true;
        return;
    }
    if (players && players[currentPlayerIndex]) {
        const isHumanTurn = !players[currentPlayerIndex].isAI;
        rollDiceButton.disabled = !isHumanTurn;
    } else {
        rollDiceButton.disabled = true; // Disable if player data is not available
    }
}


// --- Sound Effects and Music ---

/**
 * Plays a sound effect given its HTML element ID.
 * @param {string} soundId - The ID of the <audio> element.
 */
export function playSound(soundId) {
    try {
        const soundElement = document.getElementById(soundId);
        if (soundElement && typeof soundElement.play === 'function') {
            soundElement.currentTime = 0; // Rewind to start
            const playPromise = soundElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Autoplay was prevented or other error
                    // console.warn(`Playback prevented for ${soundId}:`, error.message);
                });
            }
        } else {
            // console.warn(`Sound element not found or not playable: ${soundId}`);
        }
    } catch (e) {
        // console.error(`Error playing sound ${soundId}:`, e);
    }
}

export function toggleBackgroundMusic() {
    const musicElement = document.getElementById('background-music');
    const toggleBtn = document.getElementById('toggle-music-btn');
    if (musicElement && typeof musicElement.play === 'function') {
        if (musicElement.paused) {
            const playPromise = musicElement.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    if (toggleBtn) toggleBtn.textContent = 'Mute Music';
                }).catch(error => { /* console.warn('Background music autoplay prevented:', error.message); */ });
            }
        } else {
            musicElement.pause();
            if (toggleBtn) toggleBtn.textContent = 'Play Music';
        }
    } else { /* console.warn('Background music element not found or not playable.'); */ }
}

/**
 * Attempts to play background music. Called after game init/load.
 */
export function startBackgroundMusic() {
    const musicElement = document.getElementById('background-music');
    const toggleBtn = document.getElementById('toggle-music-btn');
    if (musicElement && musicElement.paused) {
        const playPromise = musicElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (toggleBtn) toggleBtn.textContent = 'Mute Music';
            }).catch(error => {
                if (toggleBtn) toggleBtn.textContent = 'Play Music';
            });
        }
    } else if (musicElement && !musicElement.paused && toggleBtn) {
        toggleBtn.textContent = 'Mute Music';
    } else if (toggleBtn) {
         toggleBtn.textContent = 'Play Music'; 
    }
}
