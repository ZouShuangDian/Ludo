// tests.js - Unit tests for Ludo Game
import * as config from './config.js';
import * as gameLogic from './gameLogic.js';
// import * as ai from './ai.js'; // Not focusing on AI tests for now as per instructions
// import * as piece from './piece.js'; // Not focusing on piece.js tests for now

let passCount = 0;
let failCount = 0;

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        console.log(`%cPASS: ${message}`, 'color: green;');
        passCount++;
    } else {
        console.error(`FAIL: ${message} | Expected: ${expected}, Actual: ${actual}`);
        failCount++;
    }
}

function describe(suiteName, fn) {
    console.log(`\n--- ${suiteName} ---`);
    fn();
}

function it(testName, fn) {
    // console.log(`  Running: ${testName}`); // Can be verbose
    try {
        fn();
    } catch (error) {
        console.error(`ERROR in test "${testName}": ${error}`);
        failCount++;
    }
}

function runAllTests() {
    console.log("Running Ludo Game Unit Tests...");
    passCount = 0;
    failCount = 0;

    describe('gameLogic.js tests', () => {
        
        describe('isMoveValidForPiece()', () => {
            // Mock player and piece objects
            // Simplified trackPath and homePath for testing purposes.
            // Actual paths are complex, but for unit testing movement logic,
            // we only need to know the length and boundaries.
            const mockPlayer = {
                colorName: 'Red',
                trackPath: new Array(config.TOTAL_TRACK_SQUARES), // Length matters
                homePath: new Array(config.HOME_PATH_LENGTH),    // Length matters
            };

            it('Piece at home, roll != 6, should be invalid', () => {
                const mockPiece = { state: 'home', positionOnTrack: -1, positionInHomePath: -1 };
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 5, mockPlayer),
                    false,
                    "Piece at home, roll 5"
                );
            });

            it('Piece at home, roll == 6, should be valid', () => {
                const mockPiece = { state: 'home', positionOnTrack: -1, positionInHomePath: -1 };
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 6, mockPlayer),
                    true,
                    "Piece at home, roll 6"
                );
            });

            it('Piece on track, normal move, should be valid', () => {
                const mockPiece = { state: 'on-track', positionOnTrack: 5, positionInHomePath: -1 };
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 3, mockPlayer),
                    true,
                    "Piece on track (pos 5), roll 3 (to 8)"
                );
            });
            
            it('Piece on track, move exactly to home path entry, should be valid', () => {
                //TOTAL_TRACK_SQUARES for Red is 52 (0-51). Entry to home path is after completing square 51.
                const mockPiece = { state: 'on-track', positionOnTrack: config.TOTAL_TRACK_SQUARES - 2, positionInHomePath: -1 }; // e.g. pos 50
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 2, mockPlayer), // Moves to pos 52 (index 0 of home path)
                    true,
                    "Piece on track (pos 50), roll 2 (to home path index 0)"
                );
            });

            it('Piece on track, move would overshoot home path entry significantly, should be invalid', () => {
                const mockPiece = { state: 'on-track', positionOnTrack: config.TOTAL_TRACK_SQUARES - 3, positionInHomePath: -1 }; // e.g. pos 49
                // If HOME_PATH_LENGTH is 6, max steps into home path is 5 (0-indexed)
                // Rolling a 10 would mean 49+10 = 59. 59 - 52 = 7 steps into home. Invalid.
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 10, mockPlayer), 
                    false,
                    "Piece on track (pos 49), roll 10 (overshoots home path)"
                );
            });
            
            it('Piece on track, move lands within home path, should be valid', () => {
                const mockPiece = { state: 'on-track', positionOnTrack: config.TOTAL_TRACK_SQUARES - 1, positionInHomePath: -1 }; // e.g. pos 51
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 3, mockPlayer), // Lands on homePath[2]
                    true,
                    "Piece on track (pos 51), roll 3 (to home path index 2)"
                );
            });

            it('Piece in home path, normal move, should be valid', () => {
                const mockPiece = { state: 'in-home-path', positionOnTrack: -1, positionInHomePath: 1 };
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 2, mockPlayer), // moves to homePath[3]
                    true,
                    "Piece in home path (pos 1), roll 2 (to pos 3)"
                );
            });

            it('Piece in home path, move exactly to final spot, should be valid', () => {
                const mockPiece = { state: 'in-home-path', positionOnTrack: -1, positionInHomePath: config.HOME_PATH_LENGTH - 2 }; // one before last
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 1, mockPlayer), // moves to last spot homePath[5]
                    true,
                    "Piece in home path (pos 4), roll 1 (to final spot pos 5)"
                );
            });
            
            it('Piece in home path, move overshoots final spot, should be invalid', () => {
                const mockPiece = { state: 'in-home-path', positionOnTrack: -1, positionInHomePath: config.HOME_PATH_LENGTH - 2 }; // e.g. pos 4 (0-5)
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 3, mockPlayer), // 4+3=7, max is 5
                    false,
                    "Piece in home path (pos 4), roll 3 (overshoots final spot)"
                );
            });

            it('Finished piece, any roll, should be invalid', () => {
                const mockPiece = { state: 'finished', positionOnTrack: -1, positionInHomePath: -1 };
                assertEquals(
                    gameLogic.isMoveValidForPiece(mockPiece, 4, mockPlayer),
                    false,
                    "Finished piece, roll 4"
                );
            });
        });

        describe('isSafeSquare()', () => {
            it('Known safe square should return true', () => {
                // MAIN_TRACK_COORDS[0] is defined as a safe square in config.js via SAFE_SQUARE_GLOBALS
                const safeCoords = config.MAIN_TRACK_COORDS[0]; 
                assertEquals(
                    gameLogic.isSafeSquare(safeCoords),
                    true,
                    "isSafeSquare: Red's start square (a safe square)"
                );
            });

            it('Known non-safe square should return false', () => {
                // MAIN_TRACK_COORDS[1] is typically not a starred safe square (unless it's also a start for another player, which it isn't)
                const nonSafeCoords = config.MAIN_TRACK_COORDS[1]; 
                // Ensure this coord is not in SAFE_SQUARE_GLOBALS for the test to be valid
                let isActuallySafe = config.SAFE_SQUARE_GLOBALS.some(sc => sc.x === nonSafeCoords.x && sc.y === nonSafeCoords.y);
                if (isActuallySafe) {
                    console.warn("Test skipped: MAIN_TRACK_COORDS[1] is unexpectedly a defined safe square. Pick another non-safe square.");
                } else {
                    assertEquals(
                        gameLogic.isSafeSquare(nonSafeCoords),
                        false,
                        "isSafeSquare: Red's second square (a non-safe square)"
                    );
                }
            });

            it('Undefined coordinates should return false', () => {
                assertEquals(
                    gameLogic.isSafeSquare(undefined),
                    false,
                    "isSafeSquare: Undefined coordinates"
                );
            });
        });

    });

    // --- Add more describe blocks for other modules (ai.js, piece.js) as needed ---

    console.log(`\nTests Complete. Passed: ${passCount}, Failed: ${failCount}`);
    if (failCount > 0) {
        console.warn("Some tests failed. Check the console for details.");
    } else {
        console.log("%cAll tests passed!", "color: green; font-weight: bold;");
    }
}

// To run in console: import('./tests.js').then(module => module.runAllTests());
// Or, for easier manual triggering in some environments:
// window.runLudoTests = runAllTests; 
// Then just type runLudoTests() in console after importing this module.

export { runAllTests };
