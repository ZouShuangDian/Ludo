// piece.js - Functions related to game pieces.
import { 
    PLAYER_DEFINITIONS, PLAYER_PATH_OFFSETS, MAIN_TRACK_COORDS, TOTAL_TRACK_SQUARES, 
    HOME_PATH_COORDS, START_BOX_AREA_SIZE, PIECE_RADIUS, COLORS 
} from './config.js';

// This function will be called from main.js, which will own the 'players' array.
// It populates the passed-in players array.
export function initializePieces(players, getStartingAreaPieceBaseCoords) {
    players.length = 0; // Clear existing players
    PLAYER_DEFINITIONS.forEach(playerDef => {
        const pathOffset = PLAYER_PATH_OFFSETS[playerDef.colorName];
        const playerTrackPath = [];
        for (let i = 0; i < TOTAL_TRACK_SQUARES; i++) {
            playerTrackPath.push(MAIN_TRACK_COORDS[(pathOffset + i) % TOTAL_TRACK_SQUARES]);
        }
        const playerData = {
            colorName: playerDef.colorName, colorValue: playerDef.colorValue, isAI: playerDef.isAI, pieces: [],
            startAreaCoords: getStartingAreaPieceBaseCoords(playerDef.colorName), // Use passed-in helper
            trackPath: playerTrackPath, homePath: HOME_PATH_COORDS[playerDef.colorName], startTrackIndex: pathOffset
        };
        for (let i = 0; i < 4; i++) {
            const pieceId = `${playerDef.colorName}-piece-${i}`;
            const startCirclePositions = [
                { dx: START_BOX_AREA_SIZE / 4, dy: START_BOX_AREA_SIZE / 4 }, { dx: 3 * START_BOX_AREA_SIZE / 4, dy: START_BOX_AREA_SIZE / 4 },
                { dx: START_BOX_AREA_SIZE / 4, dy: 3 * START_BOX_AREA_SIZE / 4 }, { dx: 3 * START_BOX_AREA_SIZE / 4, dy: 3 * START_BOX_AREA_SIZE / 4 },
            ];
            playerData.pieces.push({
                id: pieceId, playerColorName: playerDef.colorName, colorValue: playerDef.colorValue, state: 'home',
                positionOnTrack: -1, positionInHomePath: -1, homeBaseIndex: i,
                canvasX: playerData.startAreaCoords.x + startCirclePositions[i].dx, canvasY: playerData.startAreaCoords.y + startCirclePositions[i].dy,
                isSelected: false,
            });
        }
        players.push(playerData);
    });
    // console.log("Players initialized with paths:", players);
}

// This helper is specific to piece initialization and reset, so keep it here or in config if used more broadly.
// For now, it's used by initializePieces (via getStartingAreaPieceBaseCoords param) and resetPieceToHomeBase.
// Let's make it internal to piece.js and pass it to initializePieces from main.js if needed, or make it part of config.
// For simplicity, main.js will define getStartingAreaPieceBaseCoords and pass it.
export function getHomeBasePieceCoordinates(playerColorName, homeBaseIndex, getStartingAreaPieceBaseCoordsFunc) {
    const baseCoords = getStartingAreaPieceBaseCoordsFunc(playerColorName);
    const startCirclePositions = [
        { dx: START_BOX_AREA_SIZE / 4, dy: START_BOX_AREA_SIZE / 4 }, { dx: 3 * START_BOX_AREA_SIZE / 4, dy: START_BOX_AREA_SIZE / 4 },
        { dx: START_BOX_AREA_SIZE / 4, dy: 3 * START_BOX_AREA_SIZE / 4 }, { dx: 3 * START_BOX_AREA_SIZE / 4, dy: 3 * START_BOX_AREA_SIZE / 4 },
    ];
    return { x: baseCoords.x + startCirclePositions[homeBaseIndex].dx, y: baseCoords.y + startCirclePositions[homeBaseIndex].dy };
}

export function resetPieceToHomeBase(piece, getStartingAreaPieceBaseCoordsFunc) {
    piece.state = 'home'; piece.positionOnTrack = -1; piece.positionInHomePath = -1;
    const homeCoords = getHomeBasePieceCoordinates(piece.playerColorName, piece.homeBaseIndex, getStartingAreaPieceBaseCoordsFunc);
    piece.canvasX = homeCoords.x; piece.canvasY = homeCoords.y;
}

export function drawPiece(ctx, piece) {
    // players and currentPlayerIndex would be needed if error logging depends on them.
    // For now, removing that part of the console.error to avoid direct dependency.
    if (!piece || typeof piece.canvasX !== 'number' || typeof piece.canvasY !== 'number') {
        console.error('Invalid piece data for drawing:', piece); return;
    }
    ctx.beginPath(); ctx.arc(piece.canvasX, piece.canvasY, PIECE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = piece.colorValue; ctx.fill();
    ctx.strokeStyle = piece.isSelected ? COLORS.BLACK : COLORS.BLACK; 
    ctx.lineWidth = piece.isSelected ? 3 : 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(piece.canvasX, piece.canvasY, PIECE_RADIUS * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = piece.isSelected ? COLORS.LIGHT_GRAY : COLORS.WHITE; ctx.fill();
}
