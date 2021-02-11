//Winner logic

let checkWinner = ()=>{
  if (turn) {
    return !Array.from(p2pieces).some(piece=>piece.parentElement.id==='');
  } else {
    return !Array.from(p1pieces).some(piece=>piece.parentElement.id==='');
  }
}

function checkmateDisplayed(piecesOnBoard){
  oldMovesOutNewMovesIn(0)
  let futureMoves = piecesOnBoard[turn].filter(piece=>{ 
    let futureMoves = piece.action.legal.moves.length > 0;
    let futureCaptures = piece.action.legal.captures.length > 0;
    return (futureMoves || futureCaptures)
  });
  if (futureMoves.length === 0){
    return true
  }
}

function draw(){
  clearWinner();
  drawNode.style.visibility = 'visible';
  drawNode.style.color = 'black';
  winnerBool = true
}

function winner(player = turn) {
    clearWinner();
    winnerBool = true;
    if (undoneMoves.length < 1 && moveHistory.length > 0){ moveHistory[moveHistory.length -1].checkmate = true} 
    if (player !== computerPlayer) {
        p2s.innerText = Number(p2s.innerText) + 1;
        winner2.style.visibility = 'visible';
    } else {
        p1s.innerText = Number(p1s.innerText) + 1;
        winner1.style.visibility = 'visible';
    }
    thinking.classList.remove('visible');
    thinkingInProg = false;
}

function checkWinOrDraw(){
  let piecesOnBoard = getPiecesOnBoard(boards[0])
  if (checkmateDisplayed(piecesOnBoard)){
    let kingOfTurn = piecesOnBoard[turn].find(piece=>piece.isKing)
    if (kingOfTurn.attackedBy.length > 0){
      winner();  
    } else {
      draw(); 
    }
  } else {
    winnerBool = false;
  }
  if (drawBool) {
    //console.log("draw")
  }
}