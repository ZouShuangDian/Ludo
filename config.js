// --- Constants ---
// Colors
export const COLORS = {
    RED: '#FF0000',
    GREEN: '#00FF00',
    YELLOW: '#FFFF00',
    BLUE: '#0000FF',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    LIGHT_GRAY: '#D3D3D3', // For track squares
    HOME_PATH_RED: '#FFB3B3',
    HOME_PATH_GREEN: '#B3FFB3',
    HOME_PATH_YELLOW: '#FFFFB3',
    HOME_PATH_BLUE: '#B3B3FF',
};

// Dimensions
export const BOARD_SIZE = 600;
export const SQUARE_SIZE = BOARD_SIZE / 15;
export const PATH_WIDTH = 3 * SQUARE_SIZE;
export const START_BOX_AREA_SIZE = 6 * SQUARE_SIZE;
export const START_CIRCLE_RADIUS = SQUARE_SIZE * 0.8;
export const PIECE_RADIUS = SQUARE_SIZE * 0.35;

// Player Definitions
export const PLAYER_DEFINITIONS = [
    { colorName: 'red',    colorValue: COLORS.RED,    isAI: false },
    { colorName: 'green',  colorValue: COLORS.GREEN,  isAI: false },
    { colorName: 'yellow', colorValue: COLORS.YELLOW, isAI: true  },
    { colorName: 'blue',   colorValue: COLORS.BLUE,   isAI: true  }
];

// Path Definitions
// Helper to get canvas center of a grid cell (used to define paths)
function getSquareCenter(gridX, gridY) {
    return {
        x: gridX * SQUARE_SIZE + SQUARE_SIZE / 2,
        y: gridY * SQUARE_SIZE + SQUARE_SIZE / 2,
    };
}

export const MAIN_TRACK_COORDS = [
    getSquareCenter(6, 1), getSquareCenter(6, 2), getSquareCenter(6, 3), getSquareCenter(6, 4), getSquareCenter(6, 5), 
    getSquareCenter(5, 6), getSquareCenter(4, 6), getSquareCenter(3, 6), getSquareCenter(2, 6), getSquareCenter(1, 6), 
    getSquareCenter(0, 6), getSquareCenter(0, 7), getSquareCenter(0, 8), 
    getSquareCenter(1, 8), getSquareCenter(2, 8), getSquareCenter(3, 8), getSquareCenter(4, 8), getSquareCenter(5, 8), 
    getSquareCenter(6, 9), getSquareCenter(6, 10), getSquareCenter(6, 11), getSquareCenter(6, 12), getSquareCenter(6, 13), 
    getSquareCenter(6, 14), getSquareCenter(7, 14), getSquareCenter(8, 14), 
    getSquareCenter(8, 13), getSquareCenter(8, 12), getSquareCenter(8, 11), getSquareCenter(8, 10), getSquareCenter(8, 9), 
    getSquareCenter(9, 8), getSquareCenter(10, 8), getSquareCenter(11, 8), getSquareCenter(12, 8), getSquareCenter(13, 8), 
    getSquareCenter(14, 8), getSquareCenter(14, 7), getSquareCenter(14, 6), 
    getSquareCenter(13, 6), getSquareCenter(12, 6), getSquareCenter(11, 6), getSquareCenter(10, 6), getSquareCenter(9, 6), 
    getSquareCenter(8, 5), getSquareCenter(8, 4), getSquareCenter(8, 3), getSquareCenter(8, 2), getSquareCenter(8, 1), 
    getSquareCenter(8, 0), getSquareCenter(7, 0), getSquareCenter(6, 0), 
];

export const PLAYER_PATH_OFFSETS = { red: 0, green: 13, yellow: 26, blue: 39 };

export const HOME_PATH_COORDS = {
    red: [getSquareCenter(7, 1), getSquareCenter(7, 2), getSquareCenter(7, 3), getSquareCenter(7, 4), getSquareCenter(7, 5), getSquareCenter(7, 6)],
    green: [getSquareCenter(1, 7), getSquareCenter(2, 7), getSquareCenter(3, 7), getSquareCenter(4, 7), getSquareCenter(5, 7), getSquareCenter(6, 7)],
    yellow: [getSquareCenter(7, 13), getSquareCenter(7, 12), getSquareCenter(7, 11), getSquareCenter(7, 10), getSquareCenter(7, 9), getSquareCenter(7, 8)],
    blue: [getSquareCenter(13, 7), getSquareCenter(12, 7), getSquareCenter(11, 7), getSquareCenter(10, 7), getSquareCenter(9, 7), getSquareCenter(8, 7)],
};

export const TOTAL_TRACK_SQUARES = MAIN_TRACK_COORDS.length; 
export const HOME_PATH_LENGTH = 6; 

// Safe Squares
export const SAFE_SQUARE_GLOBALS = [ 
    MAIN_TRACK_COORDS[0], MAIN_TRACK_COORDS[8], MAIN_TRACK_COORDS[13], MAIN_TRACK_COORDS[21],
    MAIN_TRACK_COORDS[26], MAIN_TRACK_COORDS[34], MAIN_TRACK_COORDS[39], MAIN_TRACK_COORDS[47],
];

// Sound Paths (though the actual paths are in index.html, these are for reference or if loaded via JS)
export const SOUND_PATHS = {
    DICE_ROLL: 'sounds/dice-roll.mp3',
    PIECE_MOVE: 'sounds/piece-move.mp3',
    PIECE_CAPTURE: 'sounds/piece-capture.mp3',
    WIN_GAME: 'sounds/win-game.mp3',
    BACKGROUND_MUSIC: 'sounds/background-music.mp3',
};

// Local Storage Key
export const LUDO_GAME_STATE_KEY = 'ludoGameState';
