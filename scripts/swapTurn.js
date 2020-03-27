function swapTurn(boardIndex) {
  thinking.classList.remove('visible')
  thinkingInProg = false;
  document.activeElement.blur();
  document.getElementById('game-area').click()
  if (winnerBool || drawBool || midPromotion){ return }
  prevShownRatedMove = undefined;
  turn = !turn;
  colorPlayerIcons()
  oldMovesOutNewMovesIn(boardIndex);
  if (checkRepetition()) { 
    draw(); 
    return   
  }
  if (playingComputer && !turn) {
    thinking.classList.add('visible')
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