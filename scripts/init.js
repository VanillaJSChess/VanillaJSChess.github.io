function init() {
  for (i = 0; i < 8; i++) {
    getSquare(i,0).style.borderLeft = '1px solid black';
    getSquare(i,7).style.borderRight = '3px solid black';
  }
  document.querySelectorAll('.gameRow')[7].style.borderBottom = '3px solid black';
  document.querySelectorAll('.gameRow')[0].style.borderTop = '1px solid black';

  for (i = 0; i < p1pieces.length; i++) {
    dragElement(p1pieces[i]);
    dragElement(p2pieces[i]);
  }

  promotionPieces.forEach(piece=>{
    piece.addEventListener('click',()=>{
      promotionSelected(piece);
    })
  })
  reset.addEventListener('click', callFuncIfNotThinking.bind(null,resetAll));
  newGameButton.addEventListener('click', callFuncIfNotThinking.bind(null,newMatch));
  toggleComputer.addEventListener('click', callFuncIfNotThinking.bind(null,toggleComputerPlayer));
  toPrevMove.addEventListener('click',showPrevMove);
  toNextMove.addEventListener('click',showNextMove);
  
  function toggleComputerPlayer(){
    playingComputer = !playingComputer;
    if (toggleComputer.innerText.indexOf('Off') > 0){
      toggleComputer.innerText = 'Turn Computer On';
    } else {
      changeToggleText().then(()=>{
        window.requestAnimationFrame(()=>{
          if (!turn) {
            doNormalComputerMove();
          }
        });
      });
    }
  }
  ffyes.addEventListener('click', (event)=>{
    winner();
    forfeit.classList.remove('forfeit-color')
    forfeit.classList.add('new-game-color')
    forfeit.innerText = 'Play Again';
  });
  forfeitBanner.addEventListener('click', function(event){
    this.classList.add('hidden');
  });
  forfeit.addEventListener('click', function(event){
    if (winnerBool || drawBool){
      newMatch();
    } else {
      forfeitBanner.classList.remove('hidden'); 
    }
  });

  toggleFirst.addEventListener('click', callFuncIfNotThinking.bind(null,()=>{
    flipKingAndQueen();
    firstMove = !firstMove;
    switchSides();
    newMatch();
  }));
  resetAll();
  createPieceLists();


  document.addEventListener('click',registerClicks);
}

function callFuncIfNotThinking(func){
  if (!thinkingInProg){
    func()
  }
}

function registerClicks(e){
    //e.stopPropagation();
    e.preventDefault();
    let clickedSqaure = document.elementsFromPoint(e.clientX, e.clientY).find(item=>item.classList.contains('square'));
    if (clickedSqaure === undefined) { //not a square 
      hideAvailableMoveIcons();
    } else { //a square was clicked 
//       if (onMobile){
        if (!clickedSqaure.children[0].classList.contains('hidden')){ //check for a legal move 
          completeMove(activePiece.parentElement,activePiece,clickedSqaure);
          hideAvailableMoveIcons();
        }
//       }
    }
  }

function createPieceLists(){
  //creates a class for each piece on board 
  let pieces = [['.pawn',Pawn],['.knight',Knight], ['.bishop',Bishop], 
                ['.rook',Rook], ['.queen',Queen], ['.king',King]];
  pieces.forEach(pieceType=>{
    document.querySelectorAll(pieceType[0]).forEach(piece=>new pieceType[1](piece))
  });
}

function algebraicNotation(){
  // add + for check ++ for mate, and named cols when 2 peices can move 

  
  let colNotation = 'abcdefgh'.split('');
  let pieceShorthand, move, moveNotation;
  let notationLog = []
  for (let i=0;i<moveHistory.length;i+=2){
    moveNotation = ''
    for (let j=0;j<2;j++){
      move = moveHistory[i+j].move;
      if(move[2] === "Pawn") {
        pieceShorthand = '';
      } else if (move[2] === "Knight"){
        pieceShorthand = 'N'
      } else {
        pieceShorthand = move[2][0];  
      }
      if (moveHistory[i+j].castle){
        moveNotation += '0-0';
      } else if (moveHistory[i+j].capture) {
        if (pieceShorthand === '') {
          pieceShorthand = colNotation[move[0][1]]
//           debugger
        }
        moveNotation += pieceShorthand + 'x' + colNotation[move[1][1]] +String(8-move[1][0]);
      } else {
        moveNotation += pieceShorthand+colNotation[move[1][1]]+String(8-move[1][0]);
      }
      if (i+1 >= moveHistory.length){
        break
      }
      moveNotation+= ' '
    }
    notationLog.push(String(i/2+1)+'. '+ moveNotation)
  }
  return notationLog;
}











init();


