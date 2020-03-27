let prevStates = [];
function checkRepetition(){
  let repetitionCount = 0;
  let simplifiedBoard = makeSimplifiedBoardstate(boards[0].state);
  if (moveHistory.length === 0 || moveHistory[moveHistory.length-1].capture 
  || moveHistory[moveHistory.length-1].castle || moveHistory[moveHistory.length-1].move[2] === "Pawn"){
    repetitionCount = 0;
    prevStates = [simplifiedBoard]
    return 
  } else 
  prevStates.push(simplifiedBoard);
  if (prevStates.length < 8){ return } 

  prevState = JSON.parse(JSON.stringify(simplifiedBoard));

  let lastMove;
  
  prevStates.forEach((state,i)=>{
    lastMove = moveHistory[moveHistory.length-1-i].move;
    prevState[lastMove[1][0]][lastMove[1][1]] = null;
    prevState[lastMove[0][0]][lastMove[0][1]] = lastMove[2];
    checkSimilarity(simplifiedBoard,prevState)
  })  
  if (repetitionCount >=2) {
    prevStates = [];
    return true
  }

  function checkSimilarity(board1,board2){
    for (let i=0;i<8;i++){
      for (let j=0;j<8;j++){
        if (board1[i][j] !== board2[i][j]){
          return;
        }
      }
    }
    repetitionCount +=1;
  }
}