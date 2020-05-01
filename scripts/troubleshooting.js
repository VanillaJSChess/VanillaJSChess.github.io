//troubleshooting

//performance 
let t0,t1;
let performanceTrack = {true:[],false:[]};

let trblesht = false;
function freeMove() {
  trblesht = !trblesht
  return trblesht
}

let delOnClick = false;
function wrath(){
  delOnClick = !delOnClick;
  return delOnClick
}

// let ratedMoveLog = [];
// let prevmove;
let displaySimulateIndex = 0;
// let prevShownRatedMove;

// function simulateMoveOnDisplay(index, moves = ratedMoveLog){

//   if (prevShownRatedMove === undefined) { 
//     prevShownRatedMove = ratedMoveLog[ratedMoveLog[ratedMoveLog.length-1].index];
//   }

//   undoBoardMove(prevShownRatedMove).then(()=>{
//     demoMove(index)
//   })

//   function demoMove(index){
//     let move = moves[index]
//     if (move.capture){
//       let startParent = boardNode.children[move.move[0][0]].children[move.move[0][1]]
//       let p = startParent.lastElementChild;
//       let sq = boardNode.children[move.move[1][0]].children[move.move[1][1]];
//       completeMove(startParent,p,sq,false).then(()=>{
//         canAnimate = false
//         startParent = boardNode.children[move.capture.rowCol[0]].children[move.capture.rowCol[1]];
//         p = startParent.children[1]
//         sq = move.capture.color ? p1graveyard : p2graveyard;
//         completeMove(startParent,p,sq,false).then(()=>{canAnimate = true;});
//       });
//     } else if (move.castle){
//       completeMoveFromState(move.move,false);
//       completeMoveFromState(move.castle,false).then(()=>{canAnimate = true;});
//     } else {
//       completeMoveFromState(move.move,false).then(()=>{canAnimate = true;});
//     }
//     prevShownRatedMove = move;
//     console.log('--------------------------------------------',index,'--------------------------------------------------');
//     console.log('white: ',ratedMoveLog[index].posStrength[true], 'sum: ',ratedMoveLog[index].rating[0]);
//     console.log('black: ',ratedMoveLog[index].posStrength[false],'sum: ',ratedMoveLog[index].rating[1]); 
//     jumpToSim.value = index
//   }

//   function undoBoardMove(move){
//     return new Promise((resolve,reject)=>{
//       completeMoveFromState([move.move[1],move.move[0]],false).then(()=>{
//         if (move.capture){
//           canAnimate = false;
//           let startParent = move.capture.color ? p1graveyard : p2graveyard;
//           let p = startParent.lastElementChild;
//           let sq = boardNode.children[move.capture.rowCol[0]].children[move.capture.rowCol[1]];
//           completeMove(startParent,p,sq,false).then(()=>{
//             resolve();
//           });
//         } else if (move.castle){
//           canAnimate = false
//           completeMoveFromState([move.castle[1],move.castle[0]],false).then(()=>{
//             resolve();
//           });
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

// }

// function showPrevSim(){
//   if (!canAnimate || undoneMoves.length > 0) { return }
//   canAnimate = false
//   displaySimulateIndex--
//   if (displaySimulateIndex < 0) {
//     displaySimulateIndex = 0 
//   }
//   simulateMoveOnDisplay(displaySimulateIndex)
// }

// function showNextSim(){
//   if (!canAnimate || undoneMoves.length > 0) { return }
//   canAnimate = false
//   displaySimulateIndex++
//   if (displaySimulateIndex >= ratedMoveLog.length-2) {
//     displaySimulateIndex = ratedMoveLog.length-2;
//   }
//   simulateMoveOnDisplay(displaySimulateIndex)
// }
// function jumpToEnteredNumber(){
//   let val = jumpToSim.value;
//   jumpToSim.value = ''
//   if (val < 0) {
//     val = 0
//   }

//   if (val >= ratedMoveLog.length-2) {
//     val = ratedMoveLog.length-2
//   }
//   displaySimulateIndex = parseInt(val);
//   simulateMoveOnDisplay(val);
// }

function resetDisplayedToShown(){
  if (boards[0].state.length === 0){ return }
  Array.from(boardNode.children).forEach((row,i)=>{
    Array.from(row.children).forEach((square,j)=>{
      let piece = Array.from(square.children).find(child=>child.classList.contains('piece'));
      boards[0].state[i][j] = makeClassPieceFromNodePiece(piece,i,j)
    });
  });
  undoneMoves = [];
  function makeClassPieceFromNodePiece(piece,i,j){
    if (piece === undefined){return null}
    let classPiece = pieceMap.get(piece)
    classPiece.rowCol = [i,j]
    classPiece.clearAllLegalMoves
    classPiece.isCaptured=false
    let homeSquare = getRowCol(classPiece.homeSquare)
    if (classPiece.rowCol[0] === homeSquare[0] && classPiece.rowCol[1] === homeSquare[1]){
      classPiece.hasMoved = false;
    }
    return classPiece
  }
}

function pickUpFromCurrentPosition(){
  resetDisplayedToShown();
  oldMovesOutNewMovesIn(0);
}

function averagePerformanceTrack(){
  let sum = 0;
  let averages = {true:[],false:[]}
  Object.keys(performanceTrack).forEach(side=>{
    performanceTrack[side].forEach(time=>{
      sum += time;
    })
    averages[side] = sum/performanceTrack[side].length
  });
  //console.log(averages);
}

function takeOverAndRefindMoves(){
  //used to pick up manually from any boardstate
  playingComputer = false;
  piecesOnBoard = getPiecesOnBoard(boards[0])
  pickUpFromCurrentPosition()
}