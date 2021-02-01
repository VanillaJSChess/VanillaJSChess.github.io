
//new game/reset/start 
function resetAll() {
  firstMove = true; //p1 goes first 
  turn = firstMove;
  if (!p1pieces[0].classList.contains('white')){ //if this results in a side swap, flip the king and queen
   flipKingAndQueen();
  }
//   playingComputer = true;
  p1s.innerText = 0; //reset scores 
  p2s.innerText = 0;
  newMatch(); 
  switchSides(true); //ensures p1 is white and p2 is black
  setMoveIcons();
  
}

function switchSides(reset = false){
  let p1is, p2is;
  if (reset){
    p1is = 'black';
    p2is = 'white';
    turn = true;
  }else if (p1pieces[0].classList.contains('white')){
    p1is = 'white';
    p2is = 'black';
    turn = false;
  } else {
    p1is = 'black';
    p2is = 'white';
    turn = true;
  }
  p2icon.style.backgroundColor = p1is;
  p1icon.style.backgroundColor = p2is;



  Array.from(p1pieces).forEach(piece=>{
    piece.classList.remove(p1is);
    piece.classList.add(p2is);
  })
  Array.from(p2pieces).forEach(piece=>{
    piece.classList.add(p1is);
    piece.classList.remove(p2is);
  });
  setMoveIcons();
}

function newMatch() {
  return new Promise((resolve,reject)=>{
    resetDisplayedToShown(); 
    addOrRemoveThinking();
    emptyHistoryCollections();
    resetFFbutton()
    unhighlightAllSquares();
    clearWinner();
    turn = firstMove;  
    colorPlayerIcons();
    movePromises = populateBoard(); //grab all the pieces that need to move to their homeSqures 
    resetPieces();
    Promise.all(movePromises).then(()=>{
      //move all pieces then save their new squares as home squares
      if (!pieceMap.get(p1pieces[0]).homeSquare){
        getHomeSquares(); 
      }
      boards[0].state = buildDisplayedBoardArray();
      pickUpFromCurrentPosition() //gets all legal moves for current visible boardstate 
      if (!turn && playingComputer){ //if the computer moves first 
        doNormalComputerMove();
      }
      resolve();
    });
  });
  function emptyHistoryCollections(){
    //empty tracking done from last game
    prevStates = [];
    undoneMoves = [];
    moveHistory = [];
    graveyardOffsets = {true:{},false:{}}
  }

  function addOrRemoveThinking() {
    if (turn){
      thinking.classList.remove('visible');
      thinkingInProg = false;
    } else if (playingComputer) {
      thinking.classList.add('visible');
      thinkingInProg = true; 
    }
  }
  function resetFFbutton(){
    forfeit.innerText = 'Forfeit';
    forfeit.classList.add('forfeit-color')
    forfeit.classList.remove('new-game-color')
    forfeit.style.width = '90px';
  }
  function resetPieces(){
  //remove the moves and statuses of each piece 
    Array.from(pieceMap.values()).forEach(piece=>{
      piece.clearLegalMoves();
      piece.isCaptured = false;
      piece.hasCastled = false;
      piece.hasMoved = false; 
      if (piece.promoted) {
        undoPromotion(piece)
      }
    })  
  }
}

function undoPromotion(piece){
  let pieceNode = piece.piece;
  let originalHomeSquare = piece.homeSquare
  pieceNode.classList.remove(pieceNode.classList[pieceNode.classList.length-1]);
  pieceNode.classList.add("pawn");
  boards[0].state[piece.rowCol[0]][piece.rowCol[1]] = new Pawn(pieceNode);
  boards[0].state[piece.rowCol[0]][piece.rowCol[1]].homeSquare = originalHomeSquare;
}


function flipKingAndQueen(){
  let king,kingNode,queen,queenNode,spot1;
  [p1pieces,p2pieces].forEach(side=>{
    queenNode = Array.from(side).find(piece=>piece.classList.contains('queen'));
    kingNode = Array.from(side).find(piece=>piece.classList.contains('king'));
    queen = pieceMap.get(queenNode)
    king = pieceMap.get(kingNode)
    queen.homeSquare.appendChild(kingNode);
    king.homeSquare.appendChild(queenNode);
    king.homeSquare = kingNode.parentElement;
    queen.homeSquare = queenNode.parentElement;
  });
}



function populateBoard(){
  //go to homeSquare
  movePromises = [];
  let[strayP1,strayP2] = [Array.from(p1pieces),Array.from(p2pieces)];
  for (let i = 0; i < 2; i++) {
    assignPiece(i, false);
  }
  for (let i = 6; i < 8; i++) {
    assignPiece(i, true);
  }
  return movePromises
  function assignPiece(count, player) {
    let  pieceNode;
    
    for (var j = 0; j < 8; j++) {
      var square = getSquare(count,j);
      
      if (player) {
        pieceNode = strayP1.pop();
      } else {
        pieceNode = strayP2.pop();
      }
      if (pieceNode === undefined) { return }
      let piece = pieceMap.get(pieceNode);
      if(piece && piece.homeSquare){
        let currSquare = boardNode.children[piece.rowCol[0]].children[piece.rowCol[1]]
        if (piece.homeSquare !== currSquare || piece.isCaptured){
          varyPieceReturnRandom(pieceNode,piece.homeSquare,Math.floor(Math.random()*30+30))
        }
      } else { 
        varyPieceReturnRandom(pieceNode,square,Math.floor(Math.random()*50+50))
      }
    }
    function varyPieceReturnRandom(pieceNode,end,speed){
  // movePromises.push(movePiece(pieceNode, piece.homeSquare, speedFactor = 60));    
      movePromises.push(new Promise((resolve,reject)=>{
        setTimeout(async ()=>{
          await movePiece(pieceNode,end,speed)
          resolve();
        },Math.random()*1000)
      }))
    }
  }
}


function buildDisplayedBoardArray(){
  //resets the boards[0].state so that it is the opening position 
  let displayedBoard = [];
  for(let i=0; i<8;i++){
    displayedBoard.push([]);
    for(let j=0;j<8;j++){
      piece = pieceMap.get(Array.from(boardNode.children[i].children[j].children).find(child=>child.classList.contains('piece')));
      if(piece){
        displayedBoard[i].push(piece); 
      } else {
        displayedBoard[i].push(null); 
      }
    }
  }
  return displayedBoard;
}