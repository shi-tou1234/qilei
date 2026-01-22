const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const cols = 7;
const rows = 9;
const cellSize = 50;

let board = [];
let currentPlayer = 1; // 1: Red, 2: Blue
let selectedPiece = null;
let gameMode = 'pvp';
let gameOver = false;
let history = [];

const PIECE_NAMES = {
    1: '象', 2: '狮', 3: '虎', 4: '豹', 5: '狼', 6: '狗', 7: '猫', 8: '鼠',
    9: '象', 10: '狮', 11: '虎', 12: '豹', 13: '狼', 14: '狗', 15: '猫', 16: '鼠'
};

const RIVER = [[3,1],[3,2],[4,1],[4,2],[5,1],[5,2],[3,4],[3,5],[4,4],[4,5],[5,4],[5,5]];
const DENS = [[0,3], [8,3]];

function initBoard() {
    board = Array(rows).fill(0).map(() => Array(cols).fill(0));
    // Red (Bottom) - Pieces 1-8
    board[8][6] = 1; board[8][0] = 2; board[6][0] = 3; board[6][4] = 4;
    board[6][2] = 5; board[7][5] = 6; board[7][1] = 7; board[6][6] = 8;
    // Blue (Top) - Pieces 9-16
    board[0][0] = 9; board[0][6] = 10; board[2][6] = 11; board[2][2] = 12;
    board[2][4] = 13; board[1][1] = 14; board[1][5] = 15; board[2][0] = 16;

    currentPlayer = 1;
    selectedPiece = null;
    gameOver = false;
    history = [];
    drawBoard();
    updateStatus();
}

function isRiver(r, c) {
    return RIVER.some(([rr, cc]) => rr === r && cc === c);
}

function isTrap(r, c) {
    // Blue traps (around Blue den at 0,3)
    if ((r === 0 && c === 2) || (r === 0 && c === 4) || (r === 1 && c === 3)) return 2;
    // Red traps (around Red den at 8,3)
    if ((r === 8 && c === 2) || (r === 8 && c === 4) || (r === 7 && c === 3)) return 1;
    return 0;
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const trapOwner = isTrap(r, c);
            if (isRiver(r, c)) ctx.fillStyle = '#add8e6';
            else if (r === 0 && c === 3) ctx.fillStyle = '#4444ff'; // Blue Den
            else if (r === 8 && c === 3) ctx.fillStyle = '#ff4444'; // Red Den
            else if (trapOwner === 1) ctx.fillStyle = '#ffcccc'; // Red Trap
            else if (trapOwner === 2) ctx.fillStyle = '#ccccff'; // Blue Trap
            else ctx.fillStyle = '#c2e5a0';
            
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

            if (board[r][c] !== 0) {
                const type = board[r][c];
                const isRed = type <= 8;
                ctx.beginPath();
                ctx.arc(c * cellSize + cellSize/2, r * cellSize + cellSize/2, 20, 0, Math.PI*2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = isRed ? 'red' : 'blue';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = isRed ? 'red' : 'blue';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(PIECE_NAMES[type], c * cellSize + cellSize/2, r * cellSize + cellSize/2);
            }
        }
    }
    if (selectedPiece) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.strokeRect(selectedPiece.c * cellSize, selectedPiece.r * cellSize, cellSize, cellSize);
    }
}

function updateStatus() {
    if (gameOver) return;
    statusEl.textContent = `当前回合: ${currentPlayer === 1 ? '红方' : '蓝方'}`;
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / cellSize);
    const r = Math.floor((e.clientY - rect.top) / cellSize);
    handleSelect(r, c);
});

function handleSelect(r, c) {
    const piece = board[r][c];
    const isRed = piece > 0 && piece <= 8;
    const isBlue = piece > 8;

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
    const dr = r2 - r1;
    const dc = c2 - c1;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    if (absDr + absDc !== 1) {
        // Lion and Tiger jump
        if ((type % 8 === 2 || type % 8 === 3) && ((absDr === 3 && dc === 0) || (absDc === 3 && dr === 0))) {
            // Check if jumping over river and no rat in between
            if (isRiver(r1 + Math.sign(dr), c1 + Math.sign(dc))) {
                for (let i = 1; i < Math.max(absDr, absDc); i++) {
                    if (board[r1 + Math.sign(dr)*i][c1 + Math.sign(dc)*i] !== 0) return false;
                }
                // Continue to target check
            } else return false;
        } else return false;
    }

    if (isRiver(r2, c2) && type % 8 !== 0) return false; // Only rat in river (type 8 or 16)
    if ((currentPlayer === 1 && r2 === 8 && c2 === 3) || (currentPlayer === 2 && r2 === 0 && c2 === 3)) return false; // Cannot enter own den

    if (target !== 0) {
        const rank1 = type % 8 || 8;
        const rank2 = target % 8 || 8;
        const targetTrapOwner = isTrap(r2, c2);
        
        // If target is in opponent's trap, it can be eaten by any piece
        if (targetTrapOwner !== 0 && targetTrapOwner !== (target <= 8 ? 1 : 2)) return true;
        
        if (rank1 === 8 && rank2 === 1) return !isRiver(r1, c1); // Rat eats Elephant (if not in river)
        if (rank1 === 1 && rank2 === 8) return false; // Elephant cannot eat Rat
        return rank1 <= rank2;
    }
    return true;
}

function makeMove(r1, c1, r2, c2) {
    const captured = board[r2][c2];
    history.push({ r1, c1, r2, c2, p1: board[r1][c1], p2: captured });
    board[r2][c2] = board[r1][c1];
    board[r1][c1] = 0;

    if ((r2 === 0 && c2 === 3 && currentPlayer === 1) || (r2 === 8 && c2 === 3 && currentPlayer === 2)) {
        gameOver = true;
        statusEl.textContent = `游戏结束! ${currentPlayer === 1 ? '红方' : '蓝方'} 获胜!`;
    }

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
    1: 80, 2: 70, 3: 60, 4: 50, 5: 40, 6: 30, 7: 20, 8: 10,
    9: 80, 10: 70, 11: 60, 12: 50, 13: 40, 14: 30, 15: 20, 16: 10
};

function evaluateBoard(currentBoard) {
    let score = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const p = currentBoard[r][c];
            if (p === 0) continue;
            const isRed = p <= 8;
            const val = PIECE_VALUES[p];
            
            // Distance to opponent's den
            const targetDen = isRed ? [0, 3] : [8, 3];
            const dist = Math.abs(r - targetDen[0]) + Math.abs(c - targetDen[1]);
            const positionalBonus = (12 - dist) * 10;

            // Trap penalties/bonuses
            const trapOwner = isTrap(r, c);
            let trapBonus = 0;
            if (trapOwner !== 0) {
                if (trapOwner === (isRed ? 1 : 2)) trapBonus = -val * 0.5; // In own trap
                else trapBonus = val * 0.2; // In opponent's trap (risky but aggressive)
            }

            if (isRed) score += val + positionalBonus + trapBonus;
            else score -= val + positionalBonus + trapBonus;
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
            if ((player === 1 && p <= 8) || (player === 2 && p > 8)) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (Math.abs(dr) + Math.abs(dc) !== 1) continue;
                        const r2 = r1 + dr, c2 = c1 + dc;
                        if (r2 >= 0 && r2 < rows && c2 >= 0 && c2 < cols) {
                            if (isValidMove(r1, c1, r2, c2)) moves.push({ r1, c1, r2, c2 });
                        }
                    }
                }
                // Lion/Tiger jumps
                if (p % 8 === 2 || p % 8 === 3) {
                    const jumps = [[3,0],[-3,0],[0,3],[0,-3]];
                    for (const [jr, jc] of jumps) {
                        const r2 = r1 + jr, c2 = c1 + jc;
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
    drawBoard();
    updateStatus();
};

document.getElementById('save').onclick = () => {
    localStorage.setItem('animal_save', JSON.stringify({ board, currentPlayer, gameMode, history }));
    alert('已保存');
};

document.getElementById('load').onclick = () => {
    const data = JSON.parse(localStorage.getItem('animal_save'));
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

initBoard();
