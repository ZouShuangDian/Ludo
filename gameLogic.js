// gameLogic.js - Core game mechanics
import { 
    TOTAL_TRACK_SQUARES, HOME_PATH_LENGTH, SAFE_SQUARE_GLOBALS 
} from './config.js';
import { playSound, updatePlayerInfoDisplay, displayDiceValue, updateUITurnState } from './ui.js'; // Assuming gameMessage is handled via main.js
import { resetPieceToHomeBase } from './piece.js';

// --- Game State (will be passed from main.js) ---
// let currentDiceValue = null; (managed in main.js)
// let players = []; (managed in main.js)
// let currentPlayerIndex = 0; (managed in main.js)
// let selectedPiece = null; (managed in main.js)
// let gameOver = false; (managed in main.js)
// let gameMessage = ""; (managed in main.js)

// --- Dice Logic ---
export function rollDice(state) { // state: { currentDiceValue }
    state.currentDiceValue = Math.floor(Math.random() * 6) + 1;
    displayDiceValue(state.currentDiceValue);
    playSound('dice-roll-sound');
    console.log('Dice rolled:', state.currentDiceValue);
    return state.currentDiceValue; // Return for convenience, though state is mutated
}

// --- Piece Movement Logic ---
export function isSafeSquare(coords) { // Moved here as it's game logic
    if (!coords) return false;
    return SAFE_SQUARE_GLOBALS.some(safeCoords => safeCoords.x === coords.x && safeCoords.y === coords.y);
}

export function moveSelectedPiece(state, getStartingAreaPieceBaseCoordsFunc, executeAITurnFunc) { 
    // state: { players, currentPlayerIndex, selectedPiece, currentDiceValue, gameOver, gameMessage }
    // getStartingAreaPieceBaseCoordsFunc: function reference from main.js
    // executeAITurnFunc: function reference from main.js (for AI turns)

    if (!state.selectedPiece) {
        state.gameMessage = "No piece selected."; 
        updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage); 
        state.gameMessage = ""; // Clear message after display
        console.log("No piece selected."); return;
    }
    if (state.currentDiceValue === null || state.currentDiceValue === 0) {
        state.gameMessage = "Roll the dice first!"; 
        updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage);
        state.gameMessage = ""; 
        console.log("Roll the dice first!"); return;
    }

    const player = state.players[state.currentPlayerIndex];
    
    const originalState = state.selectedPiece.state;
    const originalPositionOnTrack = state.selectedPiece.positionOnTrack;
    const originalPositionInHomePath = state.selectedPiece.positionInHomePath;

    if (state.selectedPiece.state === 'home') {
        if (state.currentDiceValue === 6) {
            state.selectedPiece.state = 'on-track'; state.selectedPiece.positionOnTrack = 0; 
            const newCoords = player.trackPath[state.selectedPiece.positionOnTrack];
            state.selectedPiece.canvasX = newCoords.x; state.selectedPiece.canvasY = newCoords.y;
            state.gameMessage = `${player.colorName} piece out of home!`;
        } else {
            state.gameMessage = `Need a 6 to move out. Rolled ${state.currentDiceValue}.`; 
            // console.log(state.gameMessage); // Already shown via updatePlayerInfoDisplay
            state.selectedPiece.isSelected = false; state.selectedPiece = null;
            // No redrawGame() here, will be handled by main.js caller
            updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage); 
            state.gameMessage = "";
            return; // Stop further processing for this piece
        }
    } else if (state.selectedPiece.state === 'on-track') {
        let newTrackPos = state.selectedPiece.positionOnTrack + state.currentDiceValue;
        if (newTrackPos >= TOTAL_TRACK_SQUARES) { // Corrected logic for home entry threshold
            const stepsIntoHomePath = newTrackPos - TOTAL_TRACK_SQUARES; 
            if (stepsIntoHomePath < HOME_PATH_LENGTH) { // Must be < HOME_PATH_LENGTH (0-5)
                state.selectedPiece.state = 'in-home-path'; 
                state.selectedPiece.positionInHomePath = stepsIntoHomePath;
                
                const newCoords = player.homePath[state.selectedPiece.positionInHomePath];
                state.selectedPiece.canvasX = newCoords.x; state.selectedPiece.canvasY = newCoords.y;
                state.gameMessage = `${player.colorName} piece entered home path.`;
                 if (state.selectedPiece.positionInHomePath === HOME_PATH_LENGTH - 1) { 
                    state.selectedPiece.state = 'finished'; 
                    state.gameMessage = `${player.colorName} piece finished!`;
                }
            } else { 
                state.gameMessage = "Move overshoots home. Cannot move.";
                state.selectedPiece.isSelected = false; state.selectedPiece = null;
                updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage); 
                state.gameMessage = "";
                return;
            }
        } else { 
            state.selectedPiece.positionOnTrack = newTrackPos;
            const newCoords = player.trackPath[state.selectedPiece.positionOnTrack];
            state.selectedPiece.canvasX = newCoords.x; state.selectedPiece.canvasY = newCoords.y;
            state.gameMessage = `${player.colorName} piece moved on track.`;
            
            const currentSquareCoords = player.trackPath[state.selectedPiece.positionOnTrack];
            if (!isSafeSquare(currentSquareCoords)) {
                for (let oppPlayerIdx = 0; oppPlayerIdx < state.players.length; oppPlayerIdx++) {
                    if (oppPlayerIdx === state.currentPlayerIndex) continue; 
                    const opponentPlayer = state.players[oppPlayerIdx];
                    for (const opponentPiece of opponentPlayer.pieces) {
                        if (opponentPiece.state === 'on-track' && opponentPlayer.trackPath[opponentPiece.positionOnTrack]) { // Check opponentPiece.positionOnTrack is valid
                            const opponentPieceCoords = opponentPlayer.trackPath[opponentPiece.positionOnTrack];
                            if (opponentPieceCoords && currentSquareCoords.x === opponentPieceCoords.x && currentSquareCoords.y === opponentPieceCoords.y) {
                                resetPieceToHomeBase(opponentPiece, getStartingAreaPieceBaseCoordsFunc); // Pass helper
                                state.gameMessage = `${player.colorName} captured ${opponentPlayer.colorName}'s piece!`;
                                playSound('piece-capture-sound'); 
                                // console.log(state.gameMessage); // Shown via updatePlayerInfoDisplay
                                break; 
                            }
                        }
                    }
                    if (state.gameMessage.includes("captured")) break; 
                }
            }
        }
    } else if (state.selectedPiece.state === 'in-home-path') {
        let newHomePathPos = state.selectedPiece.positionInHomePath + state.currentDiceValue;
        if (newHomePathPos < HOME_PATH_LENGTH) {
            state.selectedPiece.positionInHomePath = newHomePathPos;
            const newCoords = player.homePath[state.selectedPiece.positionInHomePath];
            state.selectedPiece.canvasX = newCoords.x; state.selectedPiece.canvasY = newCoords.y;
            state.gameMessage = `${player.colorName} piece moved in home path.`;
            if (state.selectedPiece.positionInHomePath === HOME_PATH_LENGTH - 1) { 
                state.selectedPiece.state = 'finished'; 
                state.gameMessage = `${player.colorName} piece finished!`;
            }
        } else {
            state.gameMessage = "Move overshoots home. Cannot move.";
            state.selectedPiece.isSelected = false; state.selectedPiece = null;
            updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage);
            state.gameMessage = "";
            return;
        }
    } else if (state.selectedPiece.state === 'finished') {
        state.gameMessage = "This piece has finished. Select another."; 
        // console.log(state.gameMessage);
        state.selectedPiece.isSelected = false; state.selectedPiece = null;
        updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage); 
        state.gameMessage = "";
        return; 
    }

    // console.log(state.gameMessage); // Logged by main or displayed
    const pieceJustFinished = state.selectedPiece.state === 'finished';
    const pieceMoved = !pieceJustFinished && (originalState !== state.selectedPiece.state || originalPositionOnTrack !== state.selectedPiece.positionOnTrack || originalPositionInHomePath !== state.selectedPiece.positionInHomePath);

    if (state.selectedPiece) state.selectedPiece.isSelected = false; 
    // state.selectedPiece = null; // This should be done by the caller (main.js) after this function

    // Sound for movement (if not captured)
    if (pieceMoved && !state.gameMessage.toLowerCase().includes("captured")) { 
        playSound('piece-move-sound');
    }

    // Check win condition if a piece finished
    if (pieceJustFinished) {
        checkWinCondition(state, player.colorName); // This will play win sound if applicable
        if (state.gameOver) { 
            updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage); 
            state.gameMessage = "";
            // main.js will handle redraw and then return
            return;
        }
    }

    // Turn logic (roll again on 6 or next player)
    if (state.currentDiceValue === 6 && !pieceJustFinished && !state.gameOver) {
        state.currentDiceValue = null; 
        displayDiceValue('-');
        state.gameMessage = `${player.colorName} rolled a 6, gets another turn!`;
        updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage); 
        state.gameMessage = "";
        // AI might need to take another turn immediately if it's AI
        if (player.isAI) {
            setTimeout(() => executeAITurnFunc(state, getStartingAreaPieceBaseCoordsFunc), 500); // Reduced delay for consecutive AI roll
        }
    } else if (!state.gameOver) {
        nextPlayerTurn(state, executeAITurnFunc, getStartingAreaPieceBaseCoordsFunc);
    }
    // The caller (main.js) will handle selectedPiece = null and redrawGame()
}

// --- Win Condition ---
export function checkWinCondition(state, playerColorName) {
    // state: { players, gameOver, gameMessage }
    const player = state.players.find(p => p.colorName === playerColorName);
    if (!player) return;
    let finishedPiecesCount = 0;
    for (const piece of player.pieces) {
        if (piece.state === 'finished') finishedPiecesCount++;
    }
    if (finishedPiecesCount === 4) {
        state.gameOver = true;
        state.gameMessage = `Player ${player.colorName.toUpperCase()} wins the game! Congratulations!`;
        playSound('win-game-sound'); 
        console.log("Game Over:", state.gameMessage);
    }
}

// --- Turn Management ---
export function nextPlayerTurn(state, executeAITurnFunc, getStartingAreaPieceBaseCoordsFunc) {
    // state: { selectedPiece, currentDiceValue, currentPlayerIndex, players, gameOver, gameMessage }
    // executeAITurnFunc: function ref from main.js to call AI
    if (state.selectedPiece) { 
        state.selectedPiece.isSelected = false; 
        // state.selectedPiece = null; // Let main.js handle this
    }
    state.currentDiceValue = null; 
    displayDiceValue('-');
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    
    // gameMessage for next player's turn will be set by updatePlayerInfoDisplay or AI thinking message
    updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage); // gameMessage should be "" here or set by AI
    state.gameMessage = ""; // Clear any residual message
    
    updateUITurnState(state.gameOver, state.players, state.currentPlayerIndex); 

    if (state.players[state.currentPlayerIndex] && state.players[state.currentPlayerIndex].isAI && !state.gameOver) {
        state.gameMessage = `${state.players[state.currentPlayerIndex].colorName.toUpperCase()} (AI) is thinking...`;
        updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage); 
        state.gameMessage = "";
        setTimeout(() => executeAITurnFunc(state, getStartingAreaPieceBaseCoordsFunc), 1000); 
    }
}

// --- AI Move Validation (used by ai.js) ---
export function isMoveValidForPiece(piece, diceValue, player) { // player object needed for its paths
    if (piece.state === 'finished') return false;
    if (piece.state === 'home') return diceValue === 6;
    
    if (piece.state === 'on-track') {
        const newTrackPos = piece.positionOnTrack + diceValue;
        if (newTrackPos >= TOTAL_TRACK_SQUARES) { // If it enters or passes the entry to home path
            const stepsIntoHomePath = newTrackPos - TOTAL_TRACK_SQUARES;
            return stepsIntoHomePath < HOME_PATH_LENGTH; // Valid if it lands within home path
        }
        return true; // Standard move on track
    }
    
    if (piece.state === 'in-home-path') {
        const newHomePathPos = piece.positionInHomePath + diceValue;
        return newHomePathPos < HOME_PATH_LENGTH; // Must land within or exactly at end of home path
    }
    return false; 
}
