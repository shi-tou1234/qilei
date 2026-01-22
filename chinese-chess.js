const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const cols = 9;
const rows = 10;
const cellSize = 50;
const padding = 25;

let board = [];
let currentPlayer = 1; // 1: Red, 2: Black
let selectedPiece = null;
let gameMode = 'pvp';
let gameOver = false;
let history = [];

const PIECES = {
    RED: { K: 1, A: 2, E: 3, H: 4, C: 5, N: 6, S: 7 },
    BLACK: { K: 8, A: 9, E: 10, H: 11, C: 12, N: 13, S: 14 }
};

const PIECE_NAMES = {
    1: '帅', 2: '仕', 3: '相', 4: '马', 5: '车', 6: '炮', 7: '兵',
    8: '将', 9: '士', 10: '象', 11: '马', 12: '车', 13: '炮', 14: '卒'
};

function initBoard() {
    board = Array(rows).fill(0).map(() => Array(cols).fill(0));
    // Initial positions
    const setup = [
        [PIECES.BLACK.C, PIECES.BLACK.H, PIECES.BLACK.E, PIECES.BLACK.A, PIECES.BLACK.K, PIECES.BLACK.A, PIECES.BLACK.E, PIECES.BLACK.H, PIECES.BLACK.C],
        [],
        [0, PIECES.BLACK.N, 0, 0, 0, 0, 0, PIECES.BLACK.N, 0],
        [PIECES.BLACK.S, 0, PIECES.BLACK.S, 0, PIECES.BLACK.S, 0, PIECES.BLACK.S, 0, PIECES.BLACK.S],
        [], [],
        [PIECES.RED.S, 0, PIECES.RED.S, 0, PIECES.RED.S, 0, PIECES.RED.S, 0, PIECES.RED.S],
        [0, PIECES.RED.N, 0, 0, 0, 0, 0, PIECES.RED.N, 0],
        [],
        [PIECES.RED.C, PIECES.RED.H, PIECES.RED.E, PIECES.RED.A, PIECES.RED.K, PIECES.RED.A, PIECES.RED.E, PIECES.RED.H, PIECES.RED.C]
    ];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            board[r][c] = setup[r][c] || 0;
        }
    }
    currentPlayer = 1;
    selectedPiece = null;
    gameOver = false;
    history = [];
    drawBoard();
    updateStatus();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // Grid lines
    for (let i = 0; i < rows; i++) {
        ctx.beginPath();
        ctx.moveTo(padding, padding + i * cellSize);
        ctx.lineTo(padding + (cols - 1) * cellSize, padding + i * cellSize);
        ctx.stroke();
    }
    for (let i = 0; i < cols; i++) {
        ctx.beginPath();
        ctx.moveTo(padding + i * cellSize, padding);
        if (i === 0 || i === cols - 1) {
            ctx.lineTo(padding + i * cellSize, padding + (rows - 1) * cellSize);
        } else {
            ctx.lineTo(padding + i * cellSize, padding + 4 * cellSize);
            ctx.moveTo(padding + i * cellSize, padding + 5 * cellSize);
            ctx.lineTo(padding + i * cellSize, padding + (rows - 1) * cellSize);
        }
        ctx.stroke();
    }

    // Palaces
    ctx.beginPath();
    ctx.moveTo(padding + 3 * cellSize, padding); ctx.lineTo(padding + 5 * cellSize, padding + 2 * cellSize);
    ctx.moveTo(padding + 5 * cellSize, padding); ctx.lineTo(padding + 3 * cellSize, padding + 2 * cellSize);
    ctx.moveTo(padding + 3 * cellSize, padding + 7 * cellSize); ctx.lineTo(padding + 5 * cellSize, padding + 9 * cellSize);
    ctx.moveTo(padding + 5 * cellSize, padding + 7 * cellSize); ctx.lineTo(padding + 3 * cellSize, padding + 9 * cellSize);
    ctx.stroke();

    // River text
    ctx.font = '20px Microsoft YaHei';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText('楚 河', padding + 2 * cellSize, padding + 4.6 * cellSize);
    ctx.fillText('汉 界', padding + 6 * cellSize, padding + 4.6 * cellSize);

    // Pieces
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] !== 0) {
                drawPiece(r, c, board[r][c]);
            }
        }
    }

    // Selection highlight
    if (selectedPiece) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.strokeRect(padding + selectedPiece.c * cellSize - 22, padding + selectedPiece.r * cellSize - 22, 44, 44);
    }
}

function drawPiece(r, c, type) {
    const isRed = type <= 7;
    ctx.beginPath();
    ctx.arc(padding + c * cellSize, padding + r * cellSize, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = isRed ? 'red' : 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '24px Microsoft YaHei';
    ctx.fillStyle = isRed ? 'red' : 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PIECE_NAMES[type], padding + c * cellSize, padding + r * cellSize);
}

function updateStatus() {
    if (gameOver) return;
    statusEl.textContent = `当前回合: ${currentPlayer === 1 ? '红方' : '黑方'} (${gameMode === 'pve' && currentPlayer === 2 ? 'AI思考中...' : '玩家'})`;
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    if (gameMode === 'pve' && currentPlayer === 2) return;

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
    const isRed = piece > 0 && piece <= 7;
    const isBlack = piece > 7;

    if (selectedPiece) {
        if ((currentPlayer === 1 && isRed) || (currentPlayer === 2 && isBlack)) {
            selectedPiece = { r, c };
        } else {
            if (isValidMove(selectedPiece.r, selectedPiece.c, r, c)) {
                makeMove(selectedPiece.r, selectedPiece.c, r, c);
                selectedPiece = null;
            }
        }
    } else {
        if ((currentPlayer === 1 && isRed) || (currentPlayer === 2 && isBlack)) {
            selectedPiece = { r, c };
        }
    }
    drawBoard();
}

function isValidMove(r1, c1, r2, c2) {
    const type = board[r1][c1];
    const target = board[r2][c2];
    if (target !== 0 && ((type <= 7 && target <= 7) || (type > 7 && target > 7))) return false;

    const dr = r2 - r1;
    const dc = c2 - c1;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    switch (type % 7 || 7) {
        case 1: // King
            if (absDr + absDc !== 1) return false;
            if (c2 < 3 || c2 > 5) return false;
            if (type <= 7) { if (r2 < 7) return false; }
            else { if (r2 > 2) return false; }
            break;
        case 2: // Advisor
            if (absDr !== 1 || absDc !== 1) return false;
            if (c2 < 3 || c2 > 5) return false;
            if (type <= 7) { if (r2 < 7) return false; }
            else { if (r2 > 2) return false; }
            break;
        case 3: // Elephant
            if (absDr !== 2 || absDc !== 2) return false;
            if (board[r1 + dr/2][c1 + dc/2] !== 0) return false; // Eye blocked
            if (type <= 7) { if (r2 < 5) return false; }
            else { if (r2 > 4) return false; }
            break;
        case 4: // Horse
            if (!((absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2))) return false;
            if (absDr === 2) { if (board[r1 + dr/2][c1] !== 0) return false; }
            else { if (board[r1][c1 + dc/2] !== 0) return false; }
            break;
        case 5: // Chariot
            if (dr !== 0 && dc !== 0) return false;
            if (countBetween(r1, c1, r2, c2) !== 0) return false;
            break;
        case 6: // Cannon
            if (dr !== 0 && dc !== 0) return false;
            const count = countBetween(r1, c1, r2, c2);
            if (target === 0) { if (count !== 0) return false; }
            else { if (count !== 1) return false; }
            break;
        case 7: // Soldier
            if (type <= 7) { // Red
                if (dr > 0) return false;
                if (r1 >= 5) { if (dr !== -1 || dc !== 0) return false; }
                else { if (absDr + absDc !== 1 || dr === 1) return false; }
            } else { // Black
                if (dr < 0) return false;
                if (r1 <= 4) { if (dr !== 1 || dc !== 0) return false; }
                else { if (absDr + absDc !== 1 || dr === -1) return false; }
            }
            break;
    }
    return true;
}

function countBetween(r1, c1, r2, c2) {
    let count = 0;
    if (r1 === r2) {
        const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
        for (let c = minC + 1; c < maxC; c++) if (board[r1][c] !== 0) count++;
    } else {
        const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
        for (let r = minR + 1; r < maxR; r++) if (board[r][c1] !== 0) count++;
    }
    return count;
}

function makeMove(r1, c1, r2, c2) {
    const captured = board[r2][c2];
    history.push({ r1, c1, r2, c2, p1: board[r1][c1], p2: captured });
    board[r2][c2] = board[r1][c1];
    board[r1][c1] = 0;

    if (captured === PIECES.RED.K || captured === PIECES.BLACK.K) {
        gameOver = true;
        statusEl.textContent = `游戏结束! ${currentPlayer === 1 ? '红方' : '黑方'} 获胜!`;
        drawBoard();
        return;
    }

    currentPlayer = 3 - currentPlayer;
    updateStatus();
    drawBoard();

    if (gameMode === 'pve' && currentPlayer === 2 && !gameOver) {
        setTimeout(aiMove, 500);
    }
}

function aiMove() {
    const bestMove = minimax(board, 3, -Infinity, Infinity, false).move;
    if (bestMove) {
        makeMove(bestMove.r1, bestMove.c1, bestMove.r2, bestMove.c2);
    }
}

const PIECE_VALUES = {
    1: 10000, 2: 200, 3: 200, 4: 400, 5: 1000, 6: 450, 7: 100,
    8: 10000, 9: 200, 10: 200, 11: 400, 12: 1000, 13: 450, 14: 100
};

function evaluateBoard(currentBoard) {
    let score = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const p = currentBoard[r][c];
            if (p === 0) continue;
            const val = PIECE_VALUES[p];
            if (p <= 7) score += val;
            else score -= val;
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
            if ((player === 1 && p <= 7) || (player === 2 && p > 7)) {
                for (let r2 = 0; r2 < rows; r2++) {
                    for (let c2 = 0; c2 < cols; c2++) {
                        if (isValidMove(r1, c1, r2, c2)) {
                            const target = currentBoard[r2][c2];
                            let score = 0;
                            if (target !== 0) score = PIECE_VALUES[target] * 10 - PIECE_VALUES[p];
                            moves.push({ r1, c1, r2, c2, score });
                        }
                    }
                }
            }
        }
    }
    return moves.sort((a, b) => b.score - a.score);
}

function minimax(currentBoard, depth, alpha, beta, isMaximizing) {
    if (depth === 0) return { score: evaluateBoard(currentBoard) };

    const moves = getAllMoves(currentBoard, isMaximizing ? 1 : 2);
    if (moves.length === 0) return { score: isMaximizing ? -99999 : 99999 };

    let bestMove = null;
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const captured = currentBoard[move.r2][move.c2];
            currentBoard[move.r2][move.c2] = currentBoard[move.r1][move.c1];
            currentBoard[move.r1][move.c1] = 0;
            const eval = minimax(currentBoard, depth - 1, alpha, beta, false).score;
            currentBoard[move.r1][move.c1] = currentBoard[move.r2][move.c2];
            currentBoard[move.r2][move.c2] = captured;
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
            const captured = currentBoard[move.r2][move.c2];
            currentBoard[move.r2][move.c2] = currentBoard[move.r1][move.c1];
            currentBoard[move.r1][move.c1] = 0;
            const eval = minimax(currentBoard, depth - 1, alpha, beta, true).score;
            currentBoard[move.r1][move.c1] = currentBoard[move.r2][move.c2];
            currentBoard[move.r2][move.c2] = captured;
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
    localStorage.setItem('cchess_save', JSON.stringify({ board, currentPlayer, gameMode, history }));
    alert('已保存');
};

document.getElementById('load').onclick = () => {
    const data = JSON.parse(localStorage.getItem('cchess_save'));
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
    statusEl.textContent = `${currentPlayer === 1 ? '红方' : '黑方'} 投降!`;
};

initBoard();
