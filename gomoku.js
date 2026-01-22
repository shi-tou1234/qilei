const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const boardSize = 15;
const cellSize = canvas.width / boardSize;
const padding = cellSize / 2;

let board = [];
let currentPlayer = 1; // 1: Black, 2: White
let gameMode = 'pvp'; // 'pvp' or 'pve'
let gameOver = false;
let history = [];

function initBoard() {
    board = Array(boardSize).fill(0).map(() => Array(boardSize).fill(0));
    history = [];
    gameOver = false;
    currentPlayer = 1;
    drawBoard();
    updateStatus();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    for (let i = 0; i < boardSize; i++) {
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(padding, padding + i * cellSize);
        ctx.lineTo(canvas.width - padding, padding + i * cellSize);
        ctx.stroke();

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(padding + i * cellSize, padding);
        ctx.lineTo(padding + i * cellSize, canvas.height - padding);
        ctx.stroke();
    }

    // Draw pieces
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (board[r][c] !== 0) {
                drawPiece(r, c, board[r][c]);
            }
        }
    }
}

function drawPiece(r, c, player) {
    ctx.beginPath();
    ctx.arc(padding + c * cellSize, padding + r * cellSize, cellSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = player === 1 ? '#000' : '#fff';
    ctx.fill();
    if (player === 2) {
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }
}

function updateStatus() {
    if (gameOver) return;
    statusEl.textContent = `当前回合: ${currentPlayer === 1 ? '黑棋' : '白棋'} (${gameMode === 'pve' && currentPlayer === 2 ? 'AI思考中...' : '玩家'})`;
}

function checkWin(r, c) {
    const player = board[r][c];
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of directions) {
        let count = 1;
        // Positive direction
        for (let i = 1; i < 5; i++) {
            const nr = r + dr * i, nc = c + dc * i;
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === player) count++;
            else break;
        }
        // Negative direction
        for (let i = 1; i < 5; i++) {
            const nr = r - dr * i, nc = c - dc * i;
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === player) count++;
            else break;
        }
        if (count >= 5) return true;
    }
    return false;
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    if (gameMode === 'pve' && currentPlayer === 2) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const c = Math.round((x - padding) / cellSize);
    const r = Math.round((y - padding) / cellSize);

    if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === 0) {
        makeMove(r, c);
    }
});

function makeMove(r, c) {
    board[r][c] = currentPlayer;
    history.push({ r, c, player: currentPlayer });
    drawBoard();

    if (checkWin(r, c)) {
        statusEl.textContent = `游戏结束! ${currentPlayer === 1 ? '黑棋' : '白棋'} 获胜!`;
        gameOver = true;
        return;
    }

    currentPlayer = 3 - currentPlayer;
    updateStatus();

    if (gameMode === 'pve' && currentPlayer === 2 && !gameOver) {
        setTimeout(aiMove, 500);
    }
}

// Improved Heuristic AI with Minimax
function aiMove() {
    const bestMove = minimax(board, 3, -Infinity, Infinity, true).move;
    if (bestMove) {
        makeMove(bestMove.r, bestMove.c);
    }
}

function minimax(currentBoard, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
        return { score: evaluateBoard(currentBoard) };
    }

    const moves = getInterestingMoves(currentBoard);
    if (moves.length === 0) return { score: 0 };

    let bestMove = null;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            currentBoard[move.r][move.c] = 2;
            const eval = minimax(currentBoard, depth - 1, alpha, beta, false).score;
            currentBoard[move.r][move.c] = 0;
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
            currentBoard[move.r][move.c] = 1;
            const eval = minimax(currentBoard, depth - 1, alpha, beta, true).score;
            currentBoard[move.r][move.c] = 0;
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

function getInterestingMoves(currentBoard) {
    const moves = [];
    const range = 2;
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (currentBoard[r][c] === 0) {
                let hasNeighbor = false;
                for (let dr = -range; dr <= range; dr++) {
                    for (let dc = -range; dc <= range; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && currentBoard[nr][nc] !== 0) {
                            hasNeighbor = true;
                            break;
                        }
                    }
                    if (hasNeighbor) break;
                }
                if (hasNeighbor) {
                    moves.push({ r, c, score: evaluateMove(r, c, 2) + evaluateMove(r, c, 1) });
                }
            }
        }
    }
    // If board is empty, play in center
    if (moves.length === 0) return [{ r: Math.floor(boardSize / 2), c: Math.floor(boardSize / 2) }];
    return moves.sort((a, b) => b.score - a.score).slice(0, 20); // Only consider top 20 moves
}

function evaluateBoard(currentBoard) {
    let totalScore = 0;
    // This is a simplified board evaluation
    // In a real Gomoku AI, we would scan the whole board for patterns
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (currentBoard[r][c] === 2) totalScore += evaluateMove(r, c, 2);
            else if (currentBoard[r][c] === 1) totalScore -= evaluateMove(r, c, 1);
        }
    }
    return totalScore;
}

function evaluateMove(r, c, player) {
    let score = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
        let count = 1;
        let block = 0;
        // Positive
        for (let i = 1; i < 5; i++) {
            const nr = r + dr * i, nc = c + dc * i;
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                if (board[nr][nc] === player) count++;
                else if (board[nr][nc] === 0) break;
                else { block++; break; }
            } else { block++; break; }
        }
        // Negative
        for (let i = 1; i < 5; i++) {
            const nr = r - dr * i, nc = c - dc * i;
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                if (board[nr][nc] === player) count++;
                else if (board[nr][nc] === 0) break;
                else { block++; break; }
            } else { block++; break; }
        }
        
        if (count >= 5) score += 100000;
        else if (count === 4) score += block === 0 ? 10000 : 1000;
        else if (count === 3) score += block === 0 ? 1000 : 100;
        else if (count === 2) score += block === 0 ? 100 : 10;
    }
    return score;
}

document.getElementById('start-pvp').onclick = () => { gameMode = 'pvp'; initBoard(); };
document.getElementById('start-pve').onclick = () => { gameMode = 'pve'; initBoard(); };
document.getElementById('undo').onclick = () => {
    if (history.length === 0 || gameOver) return;
    if (gameMode === 'pve') {
        if (history.length < 2) return;
        history.pop(); // AI move
        const last = history.pop(); // Player move
        board[last.r][last.c] = 0;
        board[history[history.length-1]?.r || 0][history[history.length-1]?.c || 0] = 0; // This is wrong, need to clear board properly
        // Correct undo for PVE:
        const m1 = history.pop(); // AI
        const m2 = history.pop(); // Player
        // Wait, history is a stack of moves.
    }
};

// Redo undo logic
document.getElementById('undo').onclick = () => {
    if (history.length === 0 || gameOver) return;
    if (gameMode === 'pve') {
        if (history.length >= 2) {
            const m1 = history.pop();
            board[m1.r][m1.c] = 0;
            const m2 = history.pop();
            board[m2.r][m2.c] = 0;
        }
    } else {
        const m = history.pop();
        board[m.r][m.c] = 0;
        currentPlayer = 3 - currentPlayer;
    }
    drawBoard();
    updateStatus();
};

document.getElementById('hint').onclick = () => {
    if (gameOver) return;
    // Use AI logic to find best move for current player
    let bestScore = -Infinity;
    let move = null;
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (board[r][c] === 0) {
                let score = evaluateMove(r, c, currentPlayer) + evaluateMove(r, c, 3 - currentPlayer) * 0.8;
                if (score > bestScore) {
                    bestScore = score;
                    move = { r, c };
                }
            }
        }
    }
    if (move) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.strokeRect(padding + move.c * cellSize - cellSize/2, padding + move.r * cellSize - cellSize/2, cellSize, cellSize);
    }
};

document.getElementById('surrender').onclick = () => {
    if (gameOver) return;
    gameOver = true;
    statusEl.textContent = `${currentPlayer === 1 ? '黑棋' : '白棋'} 投降，${currentPlayer === 1 ? '白棋' : '黑棋'} 获胜!`;
};

document.getElementById('save').onclick = () => {
    const data = { board, currentPlayer, gameMode, history };
    localStorage.setItem('gomoku_save', JSON.stringify(data));
    alert('棋局已保存');
};

document.getElementById('load').onclick = () => {
    const data = JSON.parse(localStorage.getItem('gomoku_save'));
    if (data) {
        board = data.board;
        currentPlayer = data.currentPlayer;
        gameMode = data.gameMode;
        history = data.history;
        gameOver = false;
        drawBoard();
        updateStatus();
        alert('棋局已加载');
    } else {
        alert('没有保存的棋局');
    }
};

initBoard();
