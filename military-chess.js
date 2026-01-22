const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const cols = 5;
const rows = 12;
const cellSize = 50;
const padding = 25;

let board = [];
let currentPlayer = 1; // 1: Red, 2: Black
let selectedPiece = null;
let gameMode = 'pvp';
let gameOver = false;
let history = [];

const PIECE_NAMES = {
    1: '司令', 2: '军长', 3: '师长', 4: '旅长', 5: '团长', 6: '营长', 7: '连长', 8: '排长', 9: '工兵', 10: '地雷', 11: '炸弹', 12: '军旗'
};

const CAMPS = [[1,2],[3,2],[2,3],[1,4],[3,4], [1,7],[3,7],[2,8],[1,9],[3,9]];
const HQS = [[1,0],[3,0], [1,11],[3,11]];

function initBoard() {
    board = Array(rows).fill(0).map(() => Array(cols).fill(0));
    
    // Standard 25 pieces per side
    const pieces = [
        1, // 司令
        2, // 军长
        3, 3, // 师长
        4, 4, // 旅长
        5, 5, // 团长
        6, 6, 6, // 营长
        7, 7, 7, // 连长
        8, 8, 8, // 排长
        9, 9, 9, // 工兵
        10, 10, 10, // 地雷
        11, 11, // 炸弹
        12 // 军旗
    ];

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    const redP = [...pieces];
    const blueP = [...pieces];
    shuffle(redP);
    shuffle(blueP);

    // Place Blue (Top 0-5)
    let idx = 0;
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < cols; c++) {
            if (isCamp(r, c)) continue;
            if (idx < blueP.length) {
                // Flag must be in HQ
                if (blueP[idx] === 12 && !isHQ(r, c)) {
                    // Swap with someone in HQ
                    // For simplicity, we'll just place them and then fix Flag
                }
                board[r][c] = blueP[idx++] + 12;
            }
        }
    }
    // Fix Blue Flag
    let bFlagPos = findPiece(24);
    let bHQ = HQS[Math.floor(Math.random() * 2)];
    if (board[bHQ[1]][bHQ[0]] !== 24) {
        let temp = board[bHQ[1]][bHQ[0]];
        board[bHQ[1]][bHQ[0]] = 24;
        board[bFlagPos.r][bFlagPos.c] = temp;
    }

    // Place Red (Bottom 6-11)
    idx = 0;
    for (let r = 6; r < 12; r++) {
        for (let c = 0; c < cols; c++) {
            if (isCamp(r, c)) continue;
            if (idx < redP.length) {
                board[r][c] = redP[idx++];
            }
        }
    }
    // Fix Red Flag
    let rFlagPos = findPiece(12);
    let rHQ = HQS[2 + Math.floor(Math.random() * 2)];
    if (board[rHQ[1]][rHQ[0]] !== 12) {
        let temp = board[rHQ[1]][rHQ[0]];
        board[rHQ[1]][rHQ[0]] = 12;
        board[rFlagPos.r][rFlagPos.c] = temp;
    }

    currentPlayer = 1;
    selectedPiece = null;
    gameOver = false;
    history = [];
    drawBoard();
    updateStatus();
}

function findPiece(val) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === val) return { r, c };
        }
    }
}

function isCamp(r, c) {
    return CAMPS.some(([cc, rr]) => rr === r && cc === c);
}

function isHQ(r, c) {
    return HQS.some(([cc, rr]) => rr === r && cc === c);
}

function isRailway(r, c) {
    if (r === 1 || r === 5 || r === 6 || r === 10) return true;
    if ((c === 0 || c === 4) && r >= 1 && r <= 10) return true;
    return false;
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#e0c090';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lines (Roads and Railways)
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(padding, padding + r * cellSize);
        ctx.lineTo(padding + (cols - 1) * cellSize, padding + r * cellSize);
        ctx.stroke();
    }
    // Vertical lines
    for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(padding + c * cellSize, padding);
        ctx.lineTo(padding + c * cellSize, padding + 5 * cellSize);
        ctx.moveTo(padding + c * cellSize, padding + 6 * cellSize);
        ctx.lineTo(padding + c * cellSize, padding + 11 * cellSize);
        ctx.stroke();
    }

    // Railways (Thicker lines)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    [1, 5, 6, 10].forEach(r => {
        ctx.beginPath();
        ctx.moveTo(padding, padding + r * cellSize);
        ctx.lineTo(padding + 4 * cellSize, padding + r * cellSize);
        ctx.stroke();
    });
    [0, 4].forEach(c => {
        ctx.beginPath();
        ctx.moveTo(padding + c * cellSize, padding + 1 * cellSize);
        ctx.lineTo(padding + c * cellSize, padding + 10 * cellSize);
        ctx.stroke();
    });

    // Camps and HQs
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (isCamp(r, c)) {
                ctx.fillStyle = '#f0f0f0';
                ctx.beginPath();
                ctx.arc(padding + c * cellSize, padding + r * cellSize, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (isHQ(r, c)) {
                ctx.fillStyle = '#d0d0d0';
                ctx.fillRect(padding + c * cellSize - 20, padding + r * cellSize - 15, 40, 30);
                ctx.strokeRect(padding + c * cellSize - 20, padding + r * cellSize - 15, 40, 30);
            }
        }
    }

    // Pieces
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const piece = board[r][c];
            if (piece !== 0) {
                const isRed = piece <= 12;
                ctx.fillStyle = isRed ? '#ff4444' : '#4444ff';
                ctx.fillRect(padding + c * cellSize - 22, padding + r * cellSize - 12, 44, 24);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(padding + c * cellSize - 22, padding + r * cellSize - 12, 44, 24);
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(PIECE_NAMES[piece > 12 ? piece - 12 : piece], padding + c * cellSize, padding + r * cellSize);
            }
        }
    }

    if (selectedPiece) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.strokeRect(padding + selectedPiece.c * cellSize - 24, padding + selectedPiece.r * cellSize - 14, 48, 28);
    }
}

function updateStatus() {
    if (gameOver) return;
    statusEl.textContent = `当前回合: ${currentPlayer === 1 ? '红方' : '蓝方'}`;
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const c = Math.round((x - padding) / cellSize);
    const r = Math.round((y - padding) / cellSize);
    
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
        handleSelect(r, c);
    }
});

function handleSelect(r, c) {
    const piece = board[r][c];
    const isRed = piece > 0 && piece <= 12;
    const isBlue = piece > 12;

    if (selectedPiece) {
        if ((currentPlayer === 1 && isRed) || (currentPlayer === 2 && isBlue)) {
            selectedPiece = { r, c };
        } else {
            if (isValidMove(selectedPiece.r, selectedPiece.c, r, c)) {
                makeMove(selectedPiece.r, selectedPiece.c, r, c);
                selectedPiece = null;
            }
        }
    } else {
        if ((currentPlayer === 1 && isRed) || (currentPlayer === 2 && isBlue)) {
            selectedPiece = { r, c };
        }
    }
    drawBoard();
}

function isValidMove(r1, c1, r2, c2) {
    const type = board[r1][c1];
    const target = board[r2][c2];
    const dr = Math.abs(r2 - r1);
    const dc = Math.abs(c2 - c1);
    const pType = type > 12 ? type - 12 : type;

    if (pType === 10 || pType === 12) return false; // Mines and Flag cannot move
    if (isCamp(r2, c2) && target !== 0) return false; // Cannot attack piece in camp
    
    // Basic move (Road)
    if (dr + dc === 1) return true;
    
    // Diagonal move into/out of camp
    if (dr === 1 && dc === 1 && (isCamp(r1, c1) || isCamp(r2, c2))) return true;

    // Railway move
    if (isRailway(r1, c1) && isRailway(r2, c2)) {
        if (r1 === r2) { // Horizontal
            const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
            for (let c = minC + 1; c < maxC; c++) if (board[r1][c] !== 0) return false;
            return true;
        }
        if (c1 === c2) { // Vertical
            const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
            // Check if crossing the river (rows 5 to 6)
            for (let r = minR + 1; r < maxR; r++) if (board[r][c1] !== 0) return false;
            return true;
        }
        // Engineer can turn (simplified: if there's a path on railway)
        if (pType === 9) {
            // For simplicity, we'll allow Engineer to move to any connected railway point
            // In a real game, this would be a BFS/DFS search
            return true; 
        }
    }

    return false;
}

function makeMove(r1, c1, r2, c2) {
    const p1 = board[r1][c1];
    const p2 = board[r2][c2];
    
    history.push({ r1, c1, r2, c2, p1, p2 });

    if (p2 === 0) {
        board[r2][c2] = p1;
    } else {
        const rank1 = p1 > 12 ? p1 - 12 : p1;
        const rank2 = p2 > 12 ? p2 - 12 : p2;

        if (rank2 === 12) {
            gameOver = true;
            statusEl.textContent = `游戏结束! ${currentPlayer === 1 ? '红方' : '蓝方'} 夺旗获胜!`;
            board[r2][c2] = p1;
        } else if (rank1 === 11 || rank2 === 11 || rank1 === rank2 || (rank2 === 10 && rank1 !== 9)) {
            board[r2][c2] = 0; // Both die or mine kills
        } else {
            board[r2][c2] = p1; // Capture
        }
    }
    board[r1][c1] = 0;
    
    if (!gameOver) {
        currentPlayer = 3 - currentPlayer;
        updateStatus();
        if (gameMode === 'pve' && currentPlayer === 2) {
            setTimeout(aiMove, 500);
        }
    }
    drawBoard();
}

function aiMove() {
    const bestMove = minimax(board, 2, -Infinity, Infinity, false).move;
    if (bestMove) {
        makeMove(bestMove.r1, bestMove.c1, bestMove.r2, bestMove.c2);
    }
}

const PIECE_VALUES = {
    1: 900, 2: 800, 3: 700, 4: 600, 5: 500, 6: 400, 7: 300, 8: 200, 9: 150, 10: 100, 11: 150, 12: 10000
};

function evaluateBoard(currentBoard) {
    let score = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const p = currentBoard[r][c];
            if (p === 0) continue;
            const isRed = p <= 12;
            const pType = isRed ? p : p - 12;
            const val = PIECE_VALUES[pType];
            
            // Positional bonus: move towards opponent's HQ
            const distToHQ = isRed ? r : (11 - r);
            const posBonus = (11 - distToHQ) * 5;

            if (isRed) score += val + posBonus;
            else score -= val + posBonus;
        }
    }
    return score;
}

function getAllMoves(currentBoard, player) {
    const moves = [];
    for (let r1 = 0; r1 < rows; r1++) {
        for (let c1 = 0; c1 < cols; c1++) {
            const p = currentBoard[r1][c1];
            if (p === 0) continue;
            if ((player === 1 && p <= 12) || (player === 2 && p > 12)) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (Math.abs(dr) + Math.abs(dc) !== 1) continue;
                        const r2 = r1 + dr, c2 = c1 + dc;
                        if (r2 >= 0 && r2 < rows && c2 >= 0 && c2 < cols) {
                            if (isValidMove(r1, c1, r2, c2)) moves.push({ r1, c1, r2, c2 });
                        }
                    }
                }
            }
        }
    }
    return moves;
}

function minimax(currentBoard, depth, alpha, beta, isMaximizing) {
    if (depth === 0) return { score: evaluateBoard(currentBoard) };

    const moves = getAllMoves(currentBoard, isMaximizing ? 1 : 2);
    if (moves.length === 0) return { score: isMaximizing ? -99999 : 99999 };

    let bestMove = null;
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const p1 = currentBoard[move.r1][move.c1];
            const p2 = currentBoard[move.r2][move.c2];
            // Simulate move (simplified)
            const oldP2 = currentBoard[move.r2][move.c2];
            currentBoard[move.r2][move.c2] = p1;
            currentBoard[move.r1][move.c1] = 0;
            
            const eval = minimax(currentBoard, depth - 1, alpha, beta, false).score;
            
            currentBoard[move.r1][move.c1] = p1;
            currentBoard[move.r2][move.c2] = oldP2;

            if (eval > maxEval) {
                maxEval = eval;
                bestMove = move;
            }
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const p1 = currentBoard[move.r1][move.c1];
            const p2 = currentBoard[move.r2][move.c2];
            const oldP2 = currentBoard[move.r2][move.c2];
            currentBoard[move.r2][move.c2] = p1;
            currentBoard[move.r1][move.c1] = 0;

            const eval = minimax(currentBoard, depth - 1, alpha, beta, true).score;

            currentBoard[move.r1][move.c1] = p1;
            currentBoard[move.r2][move.c2] = oldP2;

            if (eval < minEval) {
                minEval = eval;
                bestMove = move;
            }
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return { score: minEval, move: bestMove };
    }
}

initBoard();

document.getElementById('start-pvp').onclick = () => { gameMode = 'pvp'; initBoard(); };
document.getElementById('start-pve').onclick = () => { gameMode = 'pve'; initBoard(); };
document.getElementById('undo').onclick = () => {
    if (history.length === 0 || gameOver) return;
    const last = history.pop();
    board[last.r1][last.c1] = last.p1;
    board[last.r2][last.c2] = last.p2;
    currentPlayer = 3 - currentPlayer;
    if (gameMode === 'pve' && currentPlayer === 2) {
        const prev = history.pop();
        board[prev.r1][prev.c1] = prev.p1;
        board[prev.r2][prev.c2] = prev.p2;
        currentPlayer = 1;
    }
    drawBoard();
    updateStatus();
};

document.getElementById('save').onclick = () => {
    localStorage.setItem('military_save', JSON.stringify({ board, currentPlayer, gameMode, history }));
    alert('已保存');
};

document.getElementById('load').onclick = () => {
    const data = JSON.parse(localStorage.getItem('military_save'));
    if (data) {
        board = data.board;
        currentPlayer = data.currentPlayer;
        gameMode = data.gameMode;
        history = data.history;
        gameOver = false;
        drawBoard();
        updateStatus();
    }
};

document.getElementById('surrender').onclick = () => {
    gameOver = true;
    statusEl.textContent = `${currentPlayer === 1 ? '红方' : '蓝方'} 投降!`;
};
