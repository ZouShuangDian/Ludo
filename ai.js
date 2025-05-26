// ai.js - AI-specific logic
import { rollDice, moveSelectedPiece, isMoveValidForPiece } from './gameLogic.js';
import { updatePlayerInfoDisplay } from './ui.js';

export function executeAITurn(state, getStartingAreaPieceBaseCoordsFunc) {
    // state: { players, currentPlayerIndex, currentDiceValue, gameOver, gameMessage, selectedPiece }
    // getStartingAreaPieceBaseCoordsFunc: function reference for moveSelectedPiece if needed via resetPieceToHomeBase
    
    if (state.gameOver || !state.players[state.currentPlayerIndex] || !state.players[state.currentPlayerIndex].isAI) {
        // updateUITurnState(state.gameOver, state.players, state.currentPlayerIndex); // Should be called by main.js if something goes wrong
        return;
    }

    const aiPlayer = state.players[state.currentPlayerIndex];
    state.gameMessage = `${aiPlayer.colorName.toUpperCase()} (AI) is rolling...`;
    updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage);
    state.gameMessage = ""; // Clear after displaying

    // AI rolls the dice - rollDice mutates state.currentDiceValue
    rollDice(state); 

    // Delay after roll for observability
    setTimeout(() => {
        state.gameMessage = `${aiPlayer.colorName.toUpperCase()} (AI) rolled a ${state.currentDiceValue}.`;
        updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage);
        state.gameMessage = "";

        const validMoves = [];
        aiPlayer.pieces.forEach(piece => {
            // isMoveValidForPiece needs the player object for its paths
            if (isMoveValidForPiece(piece, state.currentDiceValue, aiPlayer)) {
                validMoves.push(piece);
            }
        });

        let chosenPiece = null;

        if (validMoves.length > 0) {
            if (state.currentDiceValue === 6) {
                const homePieces = validMoves.filter(p => p.state === 'home');
                if (homePieces.length > 0) {
                    chosenPiece = homePieces[0]; 
                }
            }
            if (!chosenPiece) {
                const nonHomeMoves = validMoves.filter(p => p.state !== 'home');
                if (nonHomeMoves.length > 0) {
                    chosenPiece = nonHomeMoves[0];
                } else { // Only home moves were valid (e.g. only home pieces, rolled 6)
                    chosenPiece = validMoves[0];
                }
            }
        }

        if (chosenPiece) {
            state.gameMessage = `${aiPlayer.colorName.toUpperCase()} (AI) chose to move piece ${chosenPiece.id.split('-').pop()}.`;
            updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage);
            state.gameMessage = "";
            
            setTimeout(() => {
                state.selectedPiece = chosenPiece; 
                // AI doesn't need piece.isSelected = true visually
                moveSelectedPiece(state, getStartingAreaPieceBaseCoordsFunc, executeAITurn); // Pass executeAITurn for "roll again on 6"
                // main.js will handle redrawGame() and selectedPiece = null after moveSelectedPiece completes or if turn passes
            }, 1000);
        } else {
            state.gameMessage = `${aiPlayer.colorName.toUpperCase()} (AI) has no valid moves. Passing turn.`;
            updatePlayerInfoDisplay(state.players, state.currentPlayerIndex, state.gameMessage);
            state.gameMessage = "";
            
            setTimeout(() => {
                // Ensure the turn passes to the next player.
                // moveSelectedPiece with null selectedPiece won't advance the turn.
                // gameLogic.nextPlayerTurn handles this.
                // We need to call the main nextPlayerTurn function from main.js
                // For now, this will be handled by the fact that moveSelectedPiece won't do anything
                // and the AI's turn will effectively end, then main.js should ensure nextPlayerTurn is called
                // if no move was made.
                // However, moveSelectedPiece's current structure calls nextPlayerTurn if not a 6.
                // If AI rolls, has no moves, currentDiceValue is set. 
                // If moveSelectedPiece is NOT called, nextPlayerTurn is NOT called.
                // So, AI needs to explicitly call a "pass" function or nextPlayerTurn.
                // The nextPlayerTurn function from gameLogic.js is suitable here.
                
                // Re-evaluating: nextPlayerTurn is called by moveSelectedPiece if it's not a "roll again" scenario.
                // If chosenPiece is null, moveSelectedPiece is not called.
                // So, we must call nextPlayerTurn here.
                // The nextPlayerTurn function in gameLogic.js needs the executeAITurn reference.
                // This creates a slight circular dependency in terms of function calls, but is manageable.
                // Let's assume main.js orchestrates this: if executeAITurn returns "no move", main.js calls nextPlayerTurn.
                // For now, let main.js handle the "no move" pass.
                // No, gameLogic.nextPlayerTurn should be called.
                // The `moveSelectedPiece` function in `gameLogic.js` calls `nextPlayerTurn` if the dice roll is not 6.
                // If AI has no valid moves, `chosenPiece` is null, `moveSelectedPiece` is not called, thus `nextPlayerTurn` is not called.
                // So, AI must explicitly trigger `nextPlayerTurn`.

                // Simplification: Let main.js handle the call to nextPlayerTurn if executeAITurn
                // indicates no move was made (e.g., by returning a status).
                // For now, we'll assume moveSelectedPiece handles turn progression,
                // and if no piece is chosen, the turn implicitly ends and main.js should handle it.
                // This is a bit messy. Let's ensure nextPlayerTurn is called.
                // The `nextPlayerTurn` function in `gameLogic.js` is what we need.
                state.selectedPiece = null; // Ensure no piece is selected
                // gameLogic.nextPlayerTurn(state, executeAITurn, getStartingAreaPieceBaseCoordsFunc);
                // The above line if uncommented would require gameLogic.js to export nextPlayerTurn, and ai.js to import it.
                // For now, the design is that moveSelectedPiece handles calling nextPlayerTurn.
                // If AI has no moves, we need a clean way to pass the turn.
                // The current structure of moveSelectedPiece expects selectedPiece to be non-null.
                // So, the pass must be handled by calling nextPlayerTurn directly.
                // Let's make main.js responsible for calling nextPlayerTurn if executeAITurn doesn't result in a move.
                // This means executeAITurn should signal back to main.js.
                // For now, we'll just log and let the timeout end. Main.js will need to be robust.
                // This means that if AI has no moves, after the thinking/rolling message, nothing happens and it's stuck.
                // This needs to be fixed in main.js integration by calling nextPlayerTurn.
                // For now, I will assume gameLogic.nextPlayerTurn is available and can be called.
                // However, to avoid import cycle if gameLogic also imports ai (it shouldn't directly),
                // main.js should pass nextPlayerTurn to executeAITurn.
                // For now, let's assume main.js will handle this.
                // The provided plan says `gameLogic.js` has `nextPlayerTurn`.
                // The `moveSelectedPiece` already calls `nextPlayerTurn` if it's not a "roll again on 6" situation.
                // The issue is if `chosenPiece` is null, `moveSelectedPiece` is never called.
                // So, AI needs to call `nextPlayerTurn` itself.
                // This means `ai.js` needs to import `nextPlayerTurn` from `gameLogic.js`.
                
                // Correct approach: if no chosenPiece, call the nextPlayerTurn function.
                // This requires nextPlayerTurn to be passed or imported.
                // Let's assume it's passed via state or as a separate param for now by main.js
                if (state.nextPlayerTurnFunc) {
                    state.nextPlayerTurnFunc(); // Call the main orchestrator for next turn
                } else {
                    console.error("AI: nextPlayerTurnFunc not provided to executeAITurn. Turn cannot pass automatically.");
                }

            }, 1000);
        }
    }, 1000); 
}
