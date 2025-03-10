// Firebase Configuration (Replace with your config)

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyC2okm5V197hGjjQKFeQ3BrdUjLzvvMKVU",
    authDomain: "chess-e4d59.firebaseapp.com",
    projectId: "chess-e4d59",
    storageBucket: "chess-e4d59.firebasestorage.app",
    messagingSenderId: "401784754450",
    appId: "1:401784754450:web:91994ce77bcfaba9e823cb",
    measurementId: "G-MC7VE0SDJZ"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let game = null;
let board = null;
let roomId = null;
let playerColor = 'white';
let currentTurn = 'white';
let gameOver = false;

function createRoom() {
    roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    playerColor = 'white';
    initializeGame();
    document.getElementById('status').textContent = `Room Code: ${roomId} - Waiting for opponent...`;
    db.collection('games').doc(roomId).set({
        fen: 'start',
        turn: 'white',
        players: { white: true, black: false },
        gameOver: false
    });
    listenForUpdates();
}

function joinRoom() {
    roomId = document.getElementById('roomCode').value.trim().toUpperCase();
    if (!roomId) return;
    
    const roomRef = db.collection('games').doc(roomId);
    roomRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.players.black) {
                alert('Room is full!');
                return;
            }
            playerColor = 'black';
            roomRef.update({ 'players.black': true });
            initializeGame();
            document.getElementById('status').textContent = `Joined Room: ${roomId}`;
            listenForUpdates();
        } else {
            alert('Room not found!');
        }
    });
}

function initializeGame() {
    game = new Chess();
    board = Chessboard('board', {
        position: 'start',
        draggable: true,
        orientation: playerColor,
        onDragStart: (source, piece) => {
            return !gameOver && game.turn() === playerColor[0] && 
                   piece.startsWith(playerColor[0]);
        },
        onDrop: (source, target) => {
            try {
                const move = game.move({
                    from: source,
                    to: target,
                    promotion: 'q'
                });
                
                if (move === null) return 'snapback';
                updateGameState();
                return true;
            } catch (e) {
                return 'snapback';
            }
        }
    });
    
    document.getElementById('resignBtn').disabled = false;
}

function updateGameState() {
    const fen = game.fen();
    currentTurn = game.turn();
    
    db.collection('games').doc(roomId).update({
        fen: fen,
        turn: currentTurn,
        gameOver: gameOver
    });
    
    updateTurnDisplay();
}

function listenForUpdates() {
    db.collection('games').doc(roomId).onSnapshot((doc) => {
        const data = doc.data();
        if (!data) return;
        
        game.load(data.fen);
        board.position(data.fen);
        currentTurn = data.turn;
        gameOver = data.gameOver;
        
        if (gameOver) {
            handleGameOver(data.winner);
        }
        
        updateTurnDisplay();
    });
}

function updateTurnDisplay() {
    const turn = game.turn() === 'w' ? 'White' : 'Black';
    document.getElementById('turnInfo').textContent = 
        `${turn}'s turn - You are ${playerColor}`;
}

function resignGame() {
    const winner = playerColor === 'white' ? 'Black' : 'White';
    db.collection('games').doc(roomId).update({
        gameOver: true,
        winner: `${winner} (Resignation)`
    });
}

function handleGameOver(winner) {
    gameOver = true;
    document.getElementById('status').textContent = winner ? 
        `Game Over! Winner: ${winner}` : 'Game Drawn!';
    document.getElementById('resignBtn').disabled = true;
}

// Initialize the board with basic position
Chessboard('board', 'start');
