// persistence.js - Save and Load game state
import { LUDO_GAME_STATE_KEY } from './config.js';
// UI and game functions will be passed by main.js or explicitly imported if static
// For now, assuming they are passed as part of 'callbacks' or 'mainGameFunctions' object

export function saveGameState(state) {
    // state: { players, currentPlayerIndex, currentDiceValue, gameOver }
    // uiCallbacks: { updatePlayerInfoDisplay, gameMessageSetter }
    
    if (state.players.length === 0) {
        // uiCallbacks.gameMessageSetter("Cannot save an uninitialized game.");
        // uiCallbacks.updatePlayerInfoDisplay(); // This needs full state or separate message display
        console.log("Cannot save an uninitialized game."); // Simpler for now
        return;
    }
    const gameStateToSave = {
        players: JSON.parse(JSON.stringify(state.players)), 
        currentPlayerIndex: state.currentPlayerIndex,
        currentDiceValue: state.currentDiceValue,
        gameOver: state.gameOver,
    };

    try {
        localStorage.setItem(LUDO_GAME_STATE_KEY, JSON.stringify(gameStateToSave));
        // uiCallbacks.gameMessageSetter("Game Saved Successfully!");
        console.log("Game state saved.");
    } catch (e) {
        // uiCallbacks.gameMessageSetter("Failed to save game. Storage might be full or unavailable.");
        console.error("Error saving game state:", e);
    }
    // uiCallbacks.updatePlayerInfoDisplay();
}

export function loadGameState(state, callbacks) {
    // state: (object to be populated) { players, currentPlayerIndex, currentDiceValue, gameOver, selectedPiece }
    // callbacks: { 
    //    redrawGame, displayDiceValue, updatePlayerInfoDisplay, 
    //    updateUITurnState, executeAITurn, getStartingAreaPieceBaseCoordsFunc,
    //    gameMessageSetter (or pass gameMessage ref in state)
    // }
    try {
        const savedStateJSON = localStorage.getItem(LUDO_GAME_STATE_KEY);
        if (!savedStateJSON) {
            console.log("No saved game state found.");
            return false; 
        }

        const savedState = JSON.parse(savedStateJSON);

        state.players.length = 0; // Clear current players array in the passed state object
        savedState.players.forEach(playerData => state.players.push(playerData));
        
        state.currentPlayerIndex = savedState.currentPlayerIndex;
        state.currentDiceValue = savedState.currentDiceValue; 
        state.gameOver = savedState.gameOver;
        state.selectedPiece = null; // Always reset selected piece on load

        callbacks.redrawGame();
        callbacks.displayDiceValue(state.currentDiceValue !== null ? state.currentDiceValue : '-');
        // updatePlayerInfoDisplay needs the full state, or gameMessage needs to be handled via a setter in callbacks
        // For now, main.js will call updatePlayerInfoDisplay after this function.
        callbacks.updateUITurnState(state.gameOver, state.players, state.currentPlayerIndex);       

        console.log("Game state loaded.");

        if (state.players[state.currentPlayerIndex] && state.players[state.currentPlayerIndex].isAI && !state.gameOver) {
            // Pass the full state object to executeAITurn
            // gameMessage will be set within executeAITurn or by main.js before calling updatePlayerInfoDisplay
            const currentMessage = state.currentDiceValue === null ? 
                `${state.players[state.currentPlayerIndex].colorName.toUpperCase()} (AI) is thinking...` :
                `${state.players[state.currentPlayerIndex].colorName.toUpperCase()} (AI) has a rolled dice: ${state.currentDiceValue}. Evaluating move...`;
            
            // Let main.js handle setting gameMessage and calling updatePlayerInfoDisplay before AI turn
            // This function's responsibility is just loading the core state.
            // The AI turn execution after load should be orchestrated by main.js
        }
        return true; 
    } catch (e) {
        console.error("Error loading game state:", e);
        localStorage.removeItem(LUDO_GAME_STATE_KEY); 
        // Callbacks.gameMessageSetter("Failed to load game. Starting new game.");
        // Callbacks.updatePlayerInfoDisplay();
        return false; 
    }
}
