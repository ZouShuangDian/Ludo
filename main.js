// --- main.js - Main game orchestration ---
import { 
    COLORS, BOARD_SIZE, SQUARE_SIZE, START_BOX_AREA_SIZE, PLAYER_DEFINITIONS, // Used by getStartingAreaPieceBaseCoordsFunc
    // Other constants are used by their respective modules directly
} from './config.js';
import { 
    displayDiceValue, updatePlayerInfoDisplay, updateUITurnState, 
    playSound, toggleBackgroundMusic, startBackgroundMusic 
} from './ui.js';
import { drawBoard } from './board.js';
import { initializePieces, drawPiece, resetPieceToHomeBase, getHomeBasePieceCoordinates } from './piece.js';
import { 
    rollDice as gameRollDice, 
    moveSelectedPiece as gameMoveSelectedPiece, 
    checkWinCondition as gameCheckWinCondition, 
    nextPlayerTurn as gameNextPlayerTurn,
    isMoveValidForPiece, // Used by AI and potentially UI for highlighting
    isSafeSquare 
} from './gameLogic.js';
import { executeAITurn as aiExecuteTurn } from './ai.js';
import { saveGameState as persistSaveGameState, loadGameState as persistLoadGameState } from './persistence.js';

// --- Canvas Setup ---
const canvas = document.getElementById('ludo-board');
const ctx = canvas.getContext('2d');
canvas.width = BOARD_SIZE; // Ensure canvas size is set from config
canvas.height = BOARD_SIZE;

// --- Game State Variables ---
let players = [];
let currentPlayerIndex = 0;
let currentDiceValue = null;
let selectedPiece = null;
let gameOver = false;
let gameMessage = ""; // Used by UI functions, managed here

// --- Game State Object (passed to modules) ---
// This object will be passed to functions in other modules that need to read or modify state.
// This helps avoid true global variables while still centralizing state management.
const gameState = {
    get players() { return players; },
    set players(newPlayers) { players = newPlayers; }, // Should ideally be immutable update
    get currentPlayerIndex() { return currentPlayerIndex; },
    set currentPlayerIndex(index) { currentPlayerIndex = index; },
    get currentDiceValue() { return currentDiceValue; },
    set currentDiceValue(value) { currentDiceValue = value; },
    get selectedPiece() { return selectedPiece; },
    set selectedPiece(piece) { selectedPiece = piece; },
    get gameOver() { return gameOver; },
    set gameOver(value) { gameOver = value; },
    get gameMessage() { return gameMessage; },
    set gameMessage(msg) { gameMessage = msg; },
    // Pass functions that modules might need to call back into main or other modules,
    // or to avoid circular dependencies if a module needs a high-level function.
    executeAITurn: () => aiExecuteTurn(gameState, getStartingAreaPieceBaseCoords, wrappedNextPlayerTurn), // Pass necessary functions
    nextPlayerTurnFunc: () => wrappedNextPlayerTurn(), // For AI to call when it has no moves
    getStartingAreaPieceBaseCoordsFunc: () => getStartingAreaPieceBaseCoords, // For piece.js and gameLogic.js
    redrawGame: () => redrawGameApp(), // For persistence.js
    displayDiceValue: (val) => displayDiceValue(val), // For persistence.js
    updatePlayerInfoDisplay: () => updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage), // For persistence.js
    updateUITurnState: () => updateUITurnState(gameOver, players, currentPlayerIndex) // For persistence.js
};

// --- Helper Functions (specific to main.js orchestration) ---
// This function is specific to how board.js and piece.js use it.
function getStartingAreaPieceBaseCoords(colorStr) {
    // This function was originally in script.js, now centralized here if modules need it.
    // It uses constants from config.js.
    switch (colorStr) {
        case 'red':    return { x: 0, y: 0 };
        case 'green':  return { x: BOARD_SIZE - START_BOX_AREA_SIZE, y: 0 };
        case 'yellow': return { x: BOARD_SIZE - START_BOX_AREA_SIZE, y: BOARD_SIZE - START_BOX_AREA_SIZE };
        case 'blue':   return { x: 0, y: BOARD_SIZE - START_BOX_AREA_SIZE };
        default:       return { x: 0, y: 0 };
    }
}

// --- Core Game Functions (orchestration layer) ---
function redrawGameApp() {
    drawBoard(ctx); // from board.js
    players.forEach(player => {
        player.pieces.forEach(piece => {
            drawPiece(ctx, piece); // from piece.js
        });
    });
}

function initializeNewGame() {
    initializePieces(players, getStartingAreaPieceBaseCoords); // from piece.js, populates 'players'
    currentPlayerIndex = 0;
    currentDiceValue = null;
    selectedPiece = null;
    gameOver = false;
    gameMessage = "New game started. Player Red's turn.";
    updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage);
    gameMessage = ""; // Clear after display
    updateUITurnState(gameOver, players, currentPlayerIndex);
    displayDiceValue('-');
    redrawGameApp();
}

function wrappedNextPlayerTurn() {
    // This wrapper ensures that after gameLogic.nextPlayerTurn updates the core state,
    // we also clear the selectedPiece in main.js and handle AI turn initiation.
    if(selectedPiece) selectedPiece.isSelected = false; // Deselect visually if any
    selectedPiece = null; // Clear selection in main.js
    
    // gameLogic.nextPlayerTurn will update currentPlayerIndex, currentDiceValue,
    // call updatePlayerInfoDisplay, updateUITurnState, and trigger AI if it's AI's turn.
    // It needs the AI execution function.
    gameNextPlayerTurn(gameState, aiExecuteTurn, getStartingAreaPieceBaseCoords);
    redrawGameApp(); // Redraw after turn possibly changed player highlight or piece state
}


// --- Event Handlers ---
function handleDiceRoll() {
    if (gameOver) {
        const winner = players.find(p => {
            let count = 0; p.pieces.forEach(pc => { if(pc.state === 'finished') count++; }); return count === 4;
        });
        gameMessage = "Game Over! Player " + (winner ? winner.colorName.toUpperCase() : "") + " has won.";
        updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
        return;
    }
    if (players[currentPlayerIndex] && players[currentPlayerIndex].isAI) {
        gameMessage = "It's AI's turn. Please wait.";
        updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
        return; 
    }
    if (currentDiceValue !== null && currentDiceValue !== 0) {
        gameMessage = "You already rolled. Move a piece or pass turn.";
        updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
        return;
    }
    
    gameRollDice(gameState); // Mutates gameState.currentDiceValue
    // gameMessage = `You rolled a ${gameState.currentDiceValue}. Select a piece.`;
    // updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
    // No need to redraw here, just dice value updated.
}

function handleCanvasClick(event) {
    if (gameOver || players.length === 0 || (players[currentPlayerIndex] && players[currentPlayerIndex].isAI)) {
        if (players[currentPlayerIndex] && players[currentPlayerIndex].isAI && !gameOver) {
            gameMessage = "It's AI's turn. Please wait.";
            updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
        }
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const currentPlayer = players[currentPlayerIndex];
    let pieceClicked = null;

    if (selectedPiece) { // Deselect previous one visually
        selectedPiece.isSelected = false;
    }
    selectedPiece = null; // Clear current selection in main state

    for (const piece of currentPlayer.pieces) {
        if (piece.state === 'finished') continue;
        const distance = Math.sqrt((clickX - piece.canvasX) ** 2 + (clickY - piece.canvasY) ** 2);
        if (distance < PIECE_RADIUS) { // PIECE_RADIUS from config.js
            pieceClicked = piece;
            break;
        }
    }

    if (pieceClicked) {
        if (pieceClicked.state === 'home' && currentDiceValue !== 6 && currentDiceValue !== null) {
            gameMessage = `Cannot select piece in home unless you roll a 6. You rolled ${currentDiceValue}.`;
            updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
            redrawGameApp(); 
            return;
        }
        if (pieceClicked.state === 'home' && currentDiceValue === null) {
            gameMessage = `Roll dice first. If you roll a 6, you can move this piece.`;
            updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
            redrawGameApp();
            return;
        }

        selectedPiece = pieceClicked; // Set main state selection
        selectedPiece.isSelected = true;
        gameMessage = `${currentPlayer.colorName} selected piece ${selectedPiece.id.split('-').pop()}.`;
        updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
        
        if (currentDiceValue !== null && currentDiceValue !== 0) {
            gameMoveSelectedPiece(gameState, getStartingAreaPieceBaseCoords, aiExecuteTurn);
            selectedPiece = null; // Clear selection after move attempt
        } else {
            gameMessage = "Piece selected. Roll the dice to move.";
            updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
        }
    }
    redrawGameApp();
}

function handleSaveGame() {
    persistSaveGameState(gameState); // Pass the centralized state
    gameMessage = "Game Saved Successfully!"; // persistence.js sets its own message, this can be a fallback
    updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); 
    gameMessage = "";
}

// --- Window Load ---
window.onload = () => {
    const persistenceCallbacks = {
        redrawGame: redrawGameApp,
        displayDiceValue: displayDiceValue,
        updatePlayerInfoDisplay: () => updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage),
        updateUITurnState: () => updateUITurnState(gameOver, players, currentPlayerIndex),
        executeAITurn: () => aiExecuteTurn(gameState, getStartingAreaPieceBaseCoords, wrappedNextPlayerTurn),
        getStartingAreaPieceBaseCoordsFunc: getStartingAreaPieceBaseCoords,
        gameMessageSetter: (msg) => { gameMessage = msg; }
    };

    if (!persistLoadGameState(gameState, persistenceCallbacks)) {
        initializeNewGame();
    } else {
        // Game loaded, ensure UI reflects the loaded state properly
        gameMessage = "Game Loaded Successfully!";
        updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage);
        gameMessage = "";
        
        // If it's AI's turn after loading, trigger AI turn.
        // persistLoadGameState might already handle some of this, but ensure it's robust.
        if (players[currentPlayerIndex] && players[currentPlayerIndex].isAI && !gameOver) {
            if (currentDiceValue === null) { // AI needs to roll
                gameMessage = `${players[currentPlayerIndex].colorName.toUpperCase()} (AI) is thinking...`;
                updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
                setTimeout(() => aiExecuteTurn(gameState, getStartingAreaPieceBaseCoords, wrappedNextPlayerTurn), 1000);
            } else { // AI has a dice value from loaded state, needs to evaluate move
                gameMessage = `${players[currentPlayerIndex].colorName.toUpperCase()} (AI) has a rolled dice: ${currentDiceValue}. Evaluating move...`;
                updatePlayerInfoDisplay(players, currentPlayerIndex, gameMessage); gameMessage = "";
                 // aiExecuteTurn should handle using an existing dice roll
                setTimeout(() => aiExecuteTurn(gameState, getStartingAreaPieceBaseCoords, wrappedNextPlayerTurn), 1000);
            }
        }
    }
    startBackgroundMusic();
};

// --- Event Listeners Setup ---
document.addEventListener('DOMContentLoaded', () => {
    const rollDiceButton = document.getElementById('roll-dice-btn');
    if (rollDiceButton) rollDiceButton.addEventListener('click', handleDiceRoll);
    else console.error('#roll-dice-btn element not found');

    const ludoBoardCanvas = document.getElementById('ludo-board');
    if (ludoBoardCanvas) ludoBoardCanvas.addEventListener('click', handleCanvasClick);
    else console.error('#ludo-board canvas element not found');

    const saveGameButton = document.getElementById('save-game-btn');
    if (saveGameButton) saveGameButton.addEventListener('click', handleSaveGame);
    else console.error('#save-game-btn element not found');

    const toggleMusicButton = document.getElementById('toggle-music-btn');
    if (toggleMusicButton) toggleMusicButton.addEventListener('click', toggleBackgroundMusic);
    else console.error('#toggle-music-btn element not found');
});
