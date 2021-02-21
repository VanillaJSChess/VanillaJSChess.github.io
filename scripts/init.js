//make pieces draggable
for (i = 0; i < p1pieces.length; i++) {
  dragElement(p1pieces[i]);
  dragElement(p2pieces[i]);
}
resetAll();
createPieceLists();
//pgn menu
dragBox(document.querySelector('#move-pgn-menu'));
resizeBox(document.querySelector('#resize-pgn-menu'));
pgnMove.addEventListener('mousedown',()=>{
  pgnMenu.classList.add('grabbing');
  pgnMove.classList.add('grabbing');
})

//promotions
promotionPieces.forEach(piece=>{
  piece.addEventListener('click',()=>{
    promotionSelected(piece);
  })
})

//menu buttons
newGameButton.addEventListener('click', callFuncIfNotThinking.bind(null,newMatch));
toggleComputer.addEventListener('click', callFuncIfNotThinking.bind(null,toggleComputerPlayer));
let holdingToPrevMove = false;
let holdingToNextMove = false;
let keepMoving;
let unstickCount = 0;
toPrevMove.addEventListener('mousedown',callFuncIfNotThinking.bind(null,async ()=>{
  holdingToPrevMove = true;
  movesOwed = -1
  await showPrevMove(); 
  while (holdingToPrevMove && movesOwed !== 0 && unstickCount < 1000){
    unstickCount +=1    
    await showPrevMove();
  }
}));
toNextMove.addEventListener('mousedown',callFuncIfNotThinking.bind(null,async ()=>{
  holdingToNextMove = true;
  movesOwed = 1
  await showNextMove();  
  while (holdingToNextMove && movesOwed !== 0 && unstickCount < 1000){
    unstickCount +=1
    await showNextMove();
  }
}));
document.addEventListener('mouseup',()=>{
  holdingToPrevMove = false
  holdingToNextMove = false
});
mainContainer.addEventListener('mouseleave',()=>{
  holdingToPrevMove = false
  holdingToNextMove = false
});
toPrevMove.addEventListener('mouseleave',()=>{
  holdingToPrevMove = false
  holdingToNextMove = false
});
toNextMove.addEventListener('mouseleave',()=>{
  holdingToPrevMove = false
  holdingToNextMove = false
});


//graveyard
resizeGraveyard()
window.addEventListener('resize',resizeGraveyard);
//menu
resizeMenu()
window.addEventListener('resize',resizeMenu);

document.querySelectorAll('.close-alert-menu').forEach(close=>{
  close.addEventListener('click',()=>{
    close.parentElement.classList.add('hidden');
  })  
})
alertNewGame.addEventListener('click',()=>{
  newMatch();
  alertMenu.classList.add('hidden');
})

window.addEventListener('keydown',event=>{
  if (event.keyCode===27) {
    unhighlightAllSquares();
    hideAvailableMoveIcons();
    document.querySelectorAll('.close-alert-menu').forEach(close=>{
      close.parentElement.classList.add('hidden');
    })
  }
})

//forfeit 
ffyes.addEventListener('click', ()=>{
  winner();
  ffMenu.classList.add('hidden'); 
});
ffno.addEventListener('click', ()=>{
  ffMenu.classList.add('hidden'); 
});
forfeit.addEventListener('click', ()=>{
    ffMenu.classList.toggle('hidden'); 
    ffName.innerText = turn ? "Player 1 Forfeit?" : "Player 2 Forfeit?";
});

//pgn
pgn.addEventListener('click',()=>{
  pgnMenu.classList.remove('hidden');
  if (!onMobile) {
    pgnText.focus()    
  }
})
document.querySelector('#close-pgn').addEventListener('click',()=>{
  pgnMenu.classList.add('hidden');
})
pgnSave.addEventListener('click', ()=>{
  pgnText.value = algebraicNotation(moveHistory).join(', ')
});
pgnLoad.addEventListener('click', async ()=>{
  if (pgnText.value === "") return
  await newMatch()
  await readPGN()
  pgnMenu.classList.add('hidden');
});

toggleFirst.addEventListener('click', callFuncIfNotThinking.bind(null,doToggleFirst));

document.addEventListener('mousedown',registerClicks);
//disables the doubletap to move on mobile 
document.querySelectorAll(".square").forEach(square=>{
  square.addEventListener("click", event => {});
})
document.addEventListener('keydown',(e)=>{
  if (e.keyCode === 27) {
    ffMenu.classList.add('hidden');
    pgnMenu.classList.add('hidden');
  }
});

async function toggleComputerPlayer(){
  playingComputer = !playingComputer;
  if (toggleComputer.innerText.indexOf('Off') > 0){
    toggleComputer.innerText = 'Turn Computer On';
  } else {
    await changeToggleText()
    window.requestAnimationFrame(()=>{
      if (!turn) doNormalComputerMove();
    });
  }
}



async function doToggleFirst(){
  requestAnimationFrame(async ()=>{
    flipKingAndQueen();
    firstMove = !firstMove;
    switchSides();
    await newMatch()
  });
}

function callFuncIfNotThinking(func){
  if (!thinkingInProg) func()
}

function registerClicks(e){
    let clickedElements = document.elementsFromPoint(e.clientX, e.clientY);
    checkForBoardMoves(clickedElements);
    checkForfeit(clickedElements);
    checkPGN(clickedElements);
    checkSidebar(clickedElements);

    function checkForBoardMoves(clickedElements){
      let clickedSqaure = clickedElements.find(item=>item.classList.contains('square'));
      if (clickedSqaure === undefined) { //not a square 
        hideAvailableMoveIcons();
      } else { //a square was clicked 
        if (!clickedSqaure.children[0].classList.contains('hidden')){ //check for a legal move 
          completeMove({
            startParent:activePiece.parentElement,
            piece:activePiece,
            square:clickedSqaure,
            testingLine});
          hideAvailableMoveIcons();
        }
      }
    }

    function checkPGN(clickedElements){
      let selectedPgnMenu = Array.from(clickedElements).some(el=>(el.id==="pgn-menu" || el.id==="menu-tab"))
      if (!selectedPgnMenu){
        pgnMenu.classList.add('hidden');
      }
    }
    function checkForfeit(clickedElements){
      let selectedFF = Array.from(clickedElements).some(el=>(el.id==='ff-menu'|| el.id==="forfeit"))
      if (!selectedFF){
        ffMenu.classList.add('hidden');
      }
    }
    function checkSidebar(clickedElements){
      let selectedSidebar = Array.from(clickedElements).some(el=>(el.id==='menu-container'|| el.id==="forfeit"))
      if (!selectedSidebar){
        if ((window.innerWidth-mainContainer.offsetWidth)/2 < menuContainer.offsetWidth){
          hideSidebar();        
        }
      }
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





