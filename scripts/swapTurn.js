function swapTurn(boardIndex) {
  ////revamp
//   thinking.classList.remove('visible')
  thinkingInProg = false;
  document.activeElement.blur();
  document.getElementById('game-area').click()
  if (winnerBool || drawBool || midPromotion){ return }
  prevShownRatedMove = undefined;
  turn = !turn;
  colorPlayerIcons()
  oldMovesOutNewMovesIn(boardIndex);
  addInfoForAlgebraicNotation();
  if (checkRepetition()) { 
    draw(); 
    return   
  }
  if (playingComputer && !turn) {
    ////revamp
//     thinking.classList.add('visible')
    thinkingInProg = true;
    window.requestAnimationFrame(()=>{
      if (winnerBool || drawBool || midPromotion){ return }
      t0 = performance.now()
      let nextMove = computerMove(0,4,6);
      lastDitchEffortAttempted = false;
      t1 = performance.now();
//       console.log(t1-t0);
      if (nextMove){
        completeMoveFromState([nextMove.from,nextMove.to])
      } else {
        winner(!turn)
      }
    });
  }
  checkWinOrDraw();
}

function addInfoForAlgebraicNotation() {

  //if the king is in check 
  if (Array.from(pieceMap.values()).find(x=>x.constructor.name === "King" && x.color === turn).attackedBy.length > 0) {
    moveHistory[moveHistory.length -1].check = true;
  }
  
  //if the piece could come from different columns 
  let prevMoveTo = moveHistory[moveHistory.length -1].move[1];
  let prevMovePiece = boards[0].state[prevMoveTo[0]][prevMoveTo[1]];
  if (prevMovePiece.constructor.name === "Pawn") { return }
  prevMovePiece.action.legal.defends.forEach(defend=>{
    if (prevMovePiece.constructor.name === boards[0].state[defend[0]][defend[1]].constructor.name){
      if (defend[1] === moveHistory[moveHistory.length -1].move[0][1]){
        moveHistory[moveHistory.length -1].double = 'row';
      } else {
        moveHistory[moveHistory.length -1].double = 'column';
      }
    }
  })

}