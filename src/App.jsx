import { useState, useEffect } from "react";

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const MODES = [
  {
    id: "easy",
    label: "Easy",
    emoji: "😊",
    desc: "AI plays randomly",
    color: "#4ade80",
    glow: "rgba(74,222,128,0.3)",
    randomChance: 1.0,   // 100% random
  },
  {
    id: "hard",
    label: "Hard",
    emoji: "😤",
    desc: "AI plays smart sometimes",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.3)",
    randomChance: 0.4,   // 40% random, 60% optimal
  },
  {
    id: "impossible",
    label: "Impossible",
    emoji: "💀",
    desc: "AI never loses",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.3)",
    randomChance: 0,     // pure minimax
  },
];

const X_COLOR = "#38bdf8";
const O_COLOR = "#f472b6";

function checkWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  if (board.every(Boolean)) return { winner: "draw", line: [] };
  return null;
}

function minimax(board, isMax, depth = 0) {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === "O") return 10 - depth;
    if (result.winner === "X") return depth - 10;
    return 0;
  }
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "O";
        best = Math.max(best, minimax(board, false, depth + 1));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "X";
        best = Math.min(best, minimax(board, true, depth + 1));
        board[i] = null;
      }
    }
    return best;
  }
}

function getAIMove(board, randomChance) {
  const empty = board.map((v,i) => v ? null : i).filter(i => i !== null);
  if (empty.length === 0) return -1;
  if (Math.random() < randomChance) {
    return empty[Math.floor(Math.random() * empty.length)];
  }
  let bestVal = -Infinity, bestMove = empty[0];
  for (const i of empty) {
    board[i] = "O";
    const val = minimax(board, false);
    board[i] = null;
    if (val > bestVal) { bestVal = val; bestMove = i; }
  }
  return bestMove;
}

export default function TicTacToe() {
  const [screen, setScreen] = useState("menu"); // "menu" | "game"
  const [mode, setMode] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [playerTurn, setPlayerTurn] = useState(true);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });
  const [aiThinking, setAiThinking] = useState(false);
  const [winLine, setWinLine] = useState([]);
  const [justPlayed, setJustPlayed] = useState(null);

  function startGame(m) {
    setMode(m);
    setBoard(Array(9).fill(null));
    setPlayerTurn(true);
    setResult(null);
    setWinLine([]);
    setJustPlayed(null);
    setScores({ player: 0, ai: 0, draws: 0 });
    setScreen("game");
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setPlayerTurn(true);
    setResult(null);
    setWinLine([]);
    setJustPlayed(null);
  }

  useEffect(() => {
    if (screen !== "game" || !mode) return;
    if (!playerTurn && !result) {
      setAiThinking(true);
      const delay = mode.id === "easy" ? 300 : mode.id === "hard" ? 500 : 650;
      const t = setTimeout(() => {
        const copy = [...board];
        const move = getAIMove(copy, mode.randomChance);
        if (move !== -1) {
          copy[move] = "O";
          setBoard(copy);
          setJustPlayed(move);
          const res = checkWinner(copy);
          if (res) {
            setResult(res);
            setWinLine(res.line);
            setScores(s => ({
              ...s,
              ai: res.winner === "O" ? s.ai + 1 : s.ai,
              draws: res.winner === "draw" ? s.draws + 1 : s.draws,
            }));
          }
          setPlayerTurn(true);
        }
        setAiThinking(false);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [playerTurn, board, result, screen, mode]);

  function handleClick(i) {
    if (!playerTurn || board[i] || result || aiThinking) return;
    const copy = [...board];
    copy[i] = "X";
    setBoard(copy);
    setJustPlayed(i);
    const res = checkWinner(copy);
    if (res) {
      setResult(res);
      setWinLine(res.line);
      setScores(s => ({
        ...s,
        player: res.winner === "X" ? s.player + 1 : s.player,
        draws: res.winner === "draw" ? s.draws + 1 : s.draws,
      }));
    } else {
      setPlayerTurn(false);
    }
  }

  const modeObj = mode ? MODES.find(m => m.id === mode.id) : null;

  const statusMsg = result
    ? result.winner === "draw"
      ? "It's a Draw! 🤝"
      : result.winner === "X"
      ? "You Win! 🎉"
      : "AI Wins! 🤖"
    : aiThinking
    ? "AI is thinking…"
    : playerTurn
    ? "Your turn  ✕"
    : "AI's turn  ○";

  // ── MENU SCREEN ──
  if (screen === "menu") {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f172a",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 12, letterSpacing: 5, textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>Classic</span>
          <h1 style={{ margin: "6px 0 6px", fontSize: "clamp(2.2rem, 9vw, 3.6rem)", fontWeight: 900, color: "#f1f5f9", letterSpacing: -1 }}>
            Tic<span style={{ color: X_COLOR }}>-</span>Tac<span style={{ color: O_COLOR }}>-</span>Toe
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Choose your difficulty to begin</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 340 }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => startGame(m)}
              style={{
                background: "#1e293b",
                border: `2px solid #334155`,
                borderRadius: 18,
                padding: "18px 24px",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 18,
                transition: "border-color 0.2s, background 0.2s, transform 0.15s, box-shadow 0.2s",
                textAlign: "left",
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = m.color;
                e.currentTarget.style.background = "#263040";
                e.currentTarget.style.boxShadow = `0 0 20px ${m.glow}`;
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.background = "#1e293b";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span style={{ fontSize: 36 }}>{m.emoji}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color, letterSpacing: 0.5 }}>{m.label}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── GAME SCREEN ──
  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "clamp(1.6rem, 6vw, 2.6rem)", fontWeight: 900, color: "#f1f5f9", letterSpacing: -1 }}>
          Tic<span style={{ color: X_COLOR }}>-</span>Tac<span style={{ color: O_COLOR }}>-</span>Toe
        </h1>
        {/* Mode badge */}
        <span style={{
          display: "inline-block",
          background: modeObj ? `${modeObj.glow}` : "#1e293b",
          border: `1.5px solid ${modeObj ? modeObj.color : "#334155"}`,
          color: modeObj ? modeObj.color : "#94a3b8",
          borderRadius: 999,
          padding: "3px 14px",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}>
          {modeObj?.emoji} {modeObj?.label}
        </span>
      </div>

      {/* Scores */}
      <div style={{ display: "flex", gap: 16, margin: "16px 0 20px", background: "#1e293b", borderRadius: 14, padding: "10px 28px" }}>
        {[
          { label: "You", val: scores.player, color: X_COLOR },
          { label: "Draw", val: scores.draws, color: "#94a3b8" },
          { label: "AI", val: scores.ai, color: O_COLOR },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ textAlign: "center", minWidth: 52 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div style={{
        height: 36, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700, marginBottom: 16,
        color: result
          ? result.winner === "X" ? X_COLOR : result.winner === "O" ? O_COLOR : "#94a3b8"
          : "#e2e8f0",
        transition: "color 0.3s",
      }}>
        {statusMsg}
      </div>

      {/* Board */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
        {board.map((cell, i) => {
          const isWin = winLine.includes(i);
          const isNew = justPlayed === i;
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              style={{
                width: "clamp(80px, 20vw, 108px)",
                height: "clamp(80px, 20vw, 108px)",
                background: isWin
                  ? cell === "X" ? "rgba(56,189,248,0.15)" : "rgba(244,114,182,0.15)"
                  : "#1e293b",
                border: isWin
                  ? `2px solid ${cell === "X" ? X_COLOR : O_COLOR}`
                  : "2px solid #334155",
                borderRadius: 16,
                cursor: (!cell && playerTurn && !result && !aiThinking) ? "pointer" : "default",
                fontSize: "clamp(2rem, 8vw, 3rem)",
                fontWeight: 900,
                color: cell === "X" ? X_COLOR : O_COLOR,
                transition: "background 0.2s, border-color 0.2s, transform 0.12s",
                transform: isNew ? "scale(1.08)" : "scale(1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                outline: "none",
              }}
            >
              {cell === "X" ? "✕" : cell === "O" ? "○" : ""}
            </button>
          );
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
            color: "#0f172a", border: "none", borderRadius: 12,
            padding: "11px 28px", fontSize: 14, fontWeight: 800,
            cursor: "pointer", letterSpacing: 0.5,
            boxShadow: "0 4px 20px rgba(56,189,248,0.2)",
          }}
          onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
          onMouseOut={e => e.currentTarget.style.opacity = "1"}
        >
          New Game
        </button>
        <button
          onClick={() => setScreen("menu")}
          style={{
            background: "#1e293b", color: "#94a3b8",
            border: "2px solid #334155", borderRadius: 12,
            padding: "11px 20px", fontSize: 14, fontWeight: 700,
            cursor: "pointer",
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "#64748b"; e.currentTarget.style.color = "#e2e8f0"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94a3b8"; }}
        >
          ← Modes
        </button>
      </div>
    </div>
  );
}
