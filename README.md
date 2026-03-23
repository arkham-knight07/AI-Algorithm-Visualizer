# AI Algorithm Visualizer

AI Algorithm Visualizer is an interactive web project that teaches classic algorithms through playable mini-games.

Built with pure HTML, CSS, and JavaScript, the project combines gameplay with visualization and learning modes.

## Highlights

- 4 algorithm-based games
- Play, Solve/Analyze, and Learn modes
- Real-time board/path visualization
- No external dependencies
- Static-hosting friendly (GitHub Pages / Vercel / Netlify)

## Games

### Maze Solver

- Algorithms: BFS, DFS, A*
- Play mode: keyboard navigation (Arrow keys / WASD)
- Solve mode: animated path exploration and final route
- Maze size: fixed 15x15

### 8 Puzzle

- Algorithm: A* (Manhattan distance)
- Manual play and AI solve flow
- Learn mode with heuristic explanation

### Tic-Tac-Toe

- Algorithm: Minimax with Alpha-Beta pruning
- Play mode vs AI
- Analyze mode to inspect best moves and scores
- Difficulty levels: Easy, Medium, Hard
- Stats tracking (wins, losses, draws, win rate)

### 8 Queens

- Algorithm: Backtracking
- Play mode for manual queen placement
- Solve mode with solution visualization
- Learn mode with strategy explanation

## Algorithm Summary

| Game | Core Algorithm | Purpose |
| --- | --- | --- |
| Maze Solver | BFS / DFS / A* | Pathfinding |
| 8 Puzzle | A* | Optimal state search |
| Tic-Tac-Toe | Minimax + Alpha-Beta | Adversarial decision making |
| 8 Queens | Backtracking | Constraint satisfaction |

## Project Structure

```text
AI-Algorithm-Visualizer/
├── index.html
├── README.md
├── css/
│   └── main.css
├── js/
│   ├── main.js
│   ├── tracking.js
│   ├── algorithms/
│   └── games/
└── games/
    ├── maze-solver/
    ├── eight-puzzle/
    ├── tic-tac-toe/
    └── eight-queens/
```

## Run Locally

From the project root, run one of the following:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

Open in browser:

```text
http://localhost:8000
```

## Deploy

Because this is a static frontend project, deployment is straightforward:

1. Push the project to GitHub.
1. Import the repository in your hosting provider.
1. Keep build settings empty/default for static hosting.
1. Deploy.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

## Author

Made by me.
