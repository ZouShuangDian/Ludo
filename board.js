// board.js - Functions for drawing the Ludo board.
import { 
    COLORS, BOARD_SIZE, SQUARE_SIZE, PATH_WIDTH, START_BOX_AREA_SIZE, 
    START_CIRCLE_RADIUS, MAIN_TRACK_COORDS, HOME_PATH_COORDS 
} from './config.js';

// Helper to get canvas center of a grid cell - specific to board drawing, keep local or import if needed elsewhere
function getSquareCenter(gridX, gridY) {
    return {
        x: gridX * SQUARE_SIZE + SQUARE_SIZE / 2,
        y: gridY * SQUARE_SIZE + SQUARE_SIZE / 2,
    };
}

function drawOuterBorder(ctx) {
    ctx.strokeStyle = COLORS.BLACK;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, BOARD_SIZE, BOARD_SIZE);
}

function drawStartingArea(ctx, color, x, y) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, START_BOX_AREA_SIZE, START_BOX_AREA_SIZE);
    ctx.strokeStyle = COLORS.BLACK;
    ctx.strokeRect(x, y, START_BOX_AREA_SIZE, START_BOX_AREA_SIZE);

    const circleOffset = START_BOX_AREA_SIZE / 4;
    const positions = [
        { cx: x + circleOffset, cy: y + circleOffset },
        { cx: x + 3 * circleOffset, cy: y + circleOffset },
        { cx: x + circleOffset, cy: y + 3 * circleOffset },
        { cx: x + 3 * circleOffset, cy: y + 3 * circleOffset },
    ];

    ctx.fillStyle = COLORS.WHITE;
    positions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.cx, pos.cy, START_CIRCLE_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    });
}

function drawMainTrack(ctx) {
    ctx.strokeStyle = COLORS.BLACK;
    ctx.lineWidth = 1;
    const trackSquareColor = COLORS.LIGHT_GRAY;

    const drawArmSquares = (startX, startY, isHorizontal) => {
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = trackSquareColor;
            let currentX = startX + (isHorizontal ? i * SQUARE_SIZE : 0);
            let currentY = startY + (isHorizontal ? 0 : i * SQUARE_SIZE);
            ctx.fillRect(currentX, currentY, SQUARE_SIZE, SQUARE_SIZE);
            ctx.strokeRect(currentX, currentY, SQUARE_SIZE, SQUARE_SIZE);
        }
    };

    // Top arm
    drawArmSquares(START_BOX_AREA_SIZE, SQUARE_SIZE, true); // Row 1 (center part)
    drawArmSquares(START_BOX_AREA_SIZE + SQUARE_SIZE, 0, false); // Column 1 (vertical part leading to center)
    drawArmSquares(START_BOX_AREA_SIZE, 0, true); // Row 0 (center part) - This seems to overlap, let's verify Ludo layout.
                                                // A Ludo path is typically 3 squares wide.
                                                // The path is 6 squares long in each of the 4 directions, then 3 squares wide.
                                                // The central column for each arm is 6 squares long.
                                                // The side rows are 6 squares long.

    // Corrected drawing logic for main track based on typical Ludo:
    // Each arm of the cross has 3 rows/columns of squares.
    // The middle row/column of each arm is colored (home path).
    // The outer two rows/columns form the main track.

    // Example for Red's arm (Top)
    // Squares from (6,0) to (6,5) - Red's home path is (7,0) to (7,5)
    // Track: (6,0) to (6,5) [left side of red home path], (8,0) to (8,5) [right side of red home path]
    // This was already handled by MAIN_TRACK_COORDS for piece movement.
    // The visual drawing needs to match.

    // Simplified: draw all 15x15 grid squares that are part of the track with LIGHT_GRAY
    // then color the specific start squares and safe squares.
    // MAIN_TRACK_COORDS gives the center of the squares. We need their top-left.
    
    MAIN_TRACK_COORDS.forEach(center => {
        ctx.fillStyle = trackSquareColor;
        ctx.fillRect(center.x - SQUARE_SIZE / 2, center.y - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
        ctx.strokeRect(center.x - SQUARE_SIZE / 2, center.y - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
    });
    
    // Color specific start squares (these are part of MAIN_TRACK_COORDS)
    const startSquareColors = [COLORS.RED, COLORS.GREEN, COLORS.YELLOW, COLORS.BLUE];
    const startSquareIndices = [0, 13, 26, 39]; // Indices in MAIN_TRACK_COORDS

    startSquareIndices.forEach((trackIndex, playerIdx) => {
        const center = MAIN_TRACK_COORDS[trackIndex];
        ctx.fillStyle = startSquareColors[playerIdx];
        ctx.fillRect(center.x - SQUARE_SIZE / 2, center.y - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
        ctx.strokeRect(center.x - SQUARE_SIZE / 2, center.y - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
    });
    
    // Mark safe squares (stars) - these are also part of MAIN_TRACK_COORDS
    // SAFE_SQUARE_GLOBALS defined in config.js holds the center coords of these squares
    const safeSquarePattern = (x, y) => { // x, y are center of the square
        // The square itself is already drawn gray or player color. Just add star.
        // To avoid drawing over colored start squares, check if it's a start square.
        let isStartSquare = false;
        for(const startIndex of startSquareIndices){
            if(MAIN_TRACK_COORDS[startIndex].x === x && MAIN_TRACK_COORDS[startIndex].y === y){
                isStartSquare = true;
                break;
            }
        }
        if(!isStartSquare){ // Only draw white box if not a start square
            ctx.fillStyle = COLORS.WHITE; 
            ctx.fillRect(x - SQUARE_SIZE / 2 + SQUARE_SIZE * 0.1, y - SQUARE_SIZE / 2 + SQUARE_SIZE * 0.1, SQUARE_SIZE * 0.8, SQUARE_SIZE * 0.8);
        }

        ctx.fillStyle = COLORS.BLACK;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${SQUARE_SIZE * 0.6}px Arial`;
        ctx.fillText('★', x, y);
    };
    
    // SAFE_SQUARE_GLOBALS contains the center coordinates
    SAFE_SQUARE_GLOBALS.forEach(coords => {
        safeSquarePattern(coords.x, coords.y);
    });
}

function drawHomePaths(ctx) {
    const homePathColors = {
        red: COLORS.HOME_PATH_RED,
        green: COLORS.HOME_PATH_GREEN,
        yellow: COLORS.HOME_PATH_YELLOW,
        blue: COLORS.HOME_PATH_BLUE,
    };

    for (const color in HOME_PATH_COORDS) {
        ctx.fillStyle = homePathColors[color];
        // Draw the 5 squares leading to center, but not the final center square itself (which is part of drawCentralHomeArea)
        for(let i=0; i < 5; i++) { 
            const center = HOME_PATH_COORDS[color][i];
            ctx.fillRect(center.x - SQUARE_SIZE / 2, center.y - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
            ctx.strokeRect(center.x - SQUARE_SIZE / 2, center.y - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
        }
    }
}

function drawCentralHomeArea(ctx) {
    // The HOME_PATH_COORDS[color][5] is the center square for each color.
    // These form the segments of the central home area.
    const homeX = START_BOX_AREA_SIZE + SQUARE_SIZE; 
    const homeY = START_BOX_AREA_SIZE + SQUARE_SIZE; 

    // Red Triangle (points towards top)
    ctx.beginPath();
    ctx.moveTo(homeX, homeY + PATH_WIDTH); 
    ctx.lineTo(homeX + PATH_WIDTH, homeY + PATH_WIDTH); 
    ctx.lineTo(homeX + PATH_WIDTH / 2, homeY); 
    ctx.closePath();
    ctx.fillStyle = COLORS.HOME_PATH_RED;
    ctx.fill();
    ctx.stroke();

    // Green Triangle (points towards right)
    ctx.beginPath();
    ctx.moveTo(homeX, homeY); 
    ctx.lineTo(homeX, homeY + PATH_WIDTH); 
    ctx.lineTo(homeX + PATH_WIDTH, homeY + PATH_WIDTH / 2); 
    ctx.closePath();
    ctx.fillStyle = COLORS.HOME_PATH_GREEN;
    ctx.fill();
    ctx.stroke();

    // Yellow Triangle (points towards bottom)
    ctx.beginPath();
    ctx.moveTo(homeX, homeY); 
    ctx.lineTo(homeX + PATH_WIDTH, homeY); 
    ctx.lineTo(homeX + PATH_WIDTH / 2, homeY + PATH_WIDTH); 
    ctx.closePath();
    ctx.fillStyle = COLORS.HOME_PATH_YELLOW;
    ctx.fill();
    ctx.stroke();

    // Blue Triangle (points towards left)
    ctx.beginPath();
    ctx.moveTo(homeX + PATH_WIDTH, homeY); 
    ctx.lineTo(homeX + PATH_WIDTH, homeY + PATH_WIDTH); 
    ctx.lineTo(homeX, homeY + PATH_WIDTH / 2); 
    ctx.closePath();
    ctx.fillStyle = COLORS.HOME_PATH_BLUE;
    ctx.fill();
    ctx.stroke();
}

export function drawBoard(ctx) {
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE); 
    drawOuterBorder(ctx);
    drawStartingArea(ctx, COLORS.RED, 0, 0);
    drawStartingArea(ctx, COLORS.GREEN, BOARD_SIZE - START_BOX_AREA_SIZE, 0);
    drawStartingArea(ctx, COLORS.BLUE, 0, BOARD_SIZE - START_BOX_AREA_SIZE);
    drawStartingArea(ctx, COLORS.YELLOW, BOARD_SIZE - START_BOX_AREA_SIZE, BOARD_SIZE - START_BOX_AREA_SIZE);
    drawMainTrack(ctx); // SAFE_SQUARE_GLOBALS will be used here via import from config.js
    drawHomePaths(ctx);
    drawCentralHomeArea(ctx);
}
