const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const size = 8;
const cellSize = canvas.width / size;

let board = [];
let currentPlayer = 1; // 1: White, 2: Black
let selectedPiece = null;
let gameMode = 'pvp';
let gameOver = false;
let history = [];

const PIECES = {
    WHITE: { K: 1, Q: 2, R: 3, B: 4, N: 5, P: 6 },
    BLACK: { K: 7, Q: 8, R: 9, B: 10, N: 11, P: 12 }
};

const PIECE_SYMBOLS = {
    1: '♔', 2: '♕', 3: '♖', 4: '♗', 5: '♘', 6: '♙',
    7: '♚', 8: '♛', 9: '♜', 10: '♝', 11: '♞', 12: '♟'
};

function initBoard() {
    board = Array(size).fill(0).map(() => Array(size).fill(0));
    const backRank = [PIECES.WHITE.R, PIECES.WHITE.N, PIECES.WHITE.B, PIECES.WHITE.Q, PIECES.WHITE.K, PIECES.WHITE.B, PIECES.WHITE.N, PIECES.WHITE.R];
    const blackBackRank = backRank.map(p => p + 6);

    board[0] = blackBackRank;
    board[1] = Array(size).fill(PIECES.BLACK.P);
    board[6] = Array(size).fill(PIECES.WHITE.P);
    board[7] = backRank;

    currentPlayer = 1;
    selectedPiece = null;
    gameOver = false;
    history = [];
    drawBoard();
    updateStatus();
}

function drawBoard() {
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#eeeed2' : '#769656';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

            if (board[r][c] !== 0) {
                ctx.fillStyle = '#000';
                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(PIECE_SYMBOLS[board[r][c]], c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
            }
        }
    }

    if (selectedPiece) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 4;
        ctx.strokeRect(selectedPiece.c * cellSize, selectedPiece.r * cellSize, cellSize, cellSize);
    }
}

function updateStatus() {
    if (gameOver) return;
    statusEl.textContent = `当前回合: ${currentPlayer === 1 ? '白方' : '黑方'} (${gameMode === 'pve' && currentPlayer === 2 ? 'AI思考中...' : '玩家'})`;
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    if (gameMode === 'pve' && currentPlayer === 2) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);

    handleSelect(r, c);
});

function handleSelect(r, c) {
    const piece = board[r][c];
    const isWhite = piece > 0 && piece <= 6;
    const isBlack = piece > 6;

    if (selectedPiece) {
        if ((currentPlayer === 1 && isWhite) || (currentPlayer === 2 && isBlack)) {
            selectedPiece = { r, c };
        } else {
            if (isValidMove(selectedPiece.r, selectedPiece.c, r, c)) {
                makeMove(selectedPiece.r, selectedPiece.c, r, c);
                selectedPiece = null;
            }
        }
    } else {
        if ((currentPlayer === 1 && isWhite) || (currentPlayer === 2 && isBlack)) {
            selectedPiece = { r, c };
        }
    }
    drawBoard();
}

function isValidMove(r1, c1, r2, c2) {
    const type = board[r1][c1];
    const target = board[r2][c2];
    if (target !== 0 && ((type <= 6 && target <= 6) || (type > 6 && target > 6))) return false;

    const dr = r2 - r1;
    const dc = c2 - c1;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    switch (type % 6 || 6) {
        case 1: // King
            return absDr <= 1 && absDc <= 1;
        case 2: // Queen
            if (dr !== 0 && dc !== 0 && absDr !== absDc) return false;
            return isPathClear(r1, c1, r2, c2);
        case 3: // Rook
            if (dr !== 0 && dc !== 0) return false;
            return isPathClear(r1, c1, r2, c2);
        case 4: // Bishop
            if (absDr !== absDc) return false;
            return isPathClear(r1, c1, r2, c2);
        case 5: // Knight
            return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
        case 6: // Pawn
            const dir = type === PIECES.WHITE.P ? -1 : 1;
            const startRow = type === PIECES.WHITE.P ? 6 : 1;
            if (dc === 0) {
                if (target !== 0) return false;
                if (dr === dir) return true;
                if (r1 === startRow && dr === 2 * dir && board[r1 + dir][c1] === 0) return true;
            } else if (absDc === 1 && dr === dir) {
                return target !== 0;
            }
            return false;
    }
    return false;
}

function isPathClear(r1, c1, r2, c2) {
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    let r = r1 + dr;
    let c = c1 + dc;
    while (r !== r2 || c !== c2) {
        if (board[r][c] !== 0) return false;
        r += dr;
        c += dc;
    }
    return true;
}

function makeMove(r1, c1, r2, c2) {
    const captured = board[r2][c2];
    history.push({ r1, c1, r2, c2, p1: board[r1][c1], p2: captured });
    board[r2][c2] = board[r1][c1];
    board[r1][c1] = 0;

    if (captured === PIECES.WHITE.K || captured === PIECES.BLACK.K) {
        gameOver = true;
        statusEl.textContent = `游戏结束! ${currentPlayer === 1 ? '白方' : '黑方'} 获胜!`;
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
    1: 10000, 2: 900, 3: 500, 4: 330, 5: 320, 6: 100,
    7: 10000, 8: 900, 9: 500, 10: 330, 11: 320, 12: 100
};

function evaluateBoard(currentBoard) {
    let score = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const p = currentBoard[r][c];
            if (p === 0) continue;
            if (p <= 6) score += PIECE_VALUES[p];
            else score -= PIECE_VALUES[p];
        }
    }
    return score;
}

function getAllMoves(currentBoard, player) {
    const moves = [];
    for (let r1 = 0; r1 < size; r1++) {
        for (let c1 = 0; c1 < size; c1++) {
            const p = currentBoard[r1][c1];
            if (p === 0) continue;
            if ((player === 1 && p <= 6) || (player === 2 && p > 6)) {
                for (let r2 = 0; r2 < size; r2++) {
                    for (let c2 = 0; c2 < size; c2++) {
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
    localStorage.setItem('chess_save', JSON.stringify({ board, currentPlayer, gameMode, history }));
    alert('已保存');
};

document.getElementById('load').onclick = () => {
    const data = JSON.parse(localStorage.getItem('chess_save'));
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
    statusEl.textContent = `${currentPlayer === 1 ? '白方' : '黑方'} 投降!`;
};

initBoard();
