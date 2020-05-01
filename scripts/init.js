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
  dragBox(document.querySelector('#move-pgn-menu'));
  resizeBox(document.querySelector('#resize-pgn-menu'));

  promotionPieces.forEach(piece=>{
    piece.addEventListener('click',()=>{
      promotionSelected(piece);
    })
  })
//   reset.addEventListener('click', callFuncIfNotThinking.bind(null,resetAll));
  newGameButton.addEventListener('click', callFuncIfNotThinking.bind(null,newMatch));
  toggleComputer.addEventListener('click', callFuncIfNotThinking.bind(null,toggleComputerPlayer));
  toPrevMove.addEventListener('click',callFuncIfNotThinking.bind(null,showPrevMove));
  toNextMove.addEventListener('click',callFuncIfNotThinking.bind(null,showNextMove));
  
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
    forfeit.style.width = 'auto';

  });
  forfeitBanner.addEventListener('click', function(event){
    hideForfeit();
  });
  forfeit.addEventListener('click', function(event){
    if (winnerBool || drawBool){
      newMatch();
    } else {
      forfeitBanner.classList.remove('hidden'); 
      ffName.classList.remove('hidden');
      ffYesNo.classList.remove('hidden')
      forfeitBanner.classList.add('visible');
      forfeit.classList.add('clicked')
    }
  });
  pgn.addEventListener('click',()=>{
    pgnMenu.classList.remove('hidden');
  })
  document.querySelector('#close-pgn').addEventListener('click',()=>{
    pgnMenu.classList.add('hidden');
  })
  pgnSave.addEventListener('click', ()=>{
    pgnText.value = algebraicNotation().join(', ')
  });
  pgnLoad.addEventListener('click', ()=>{
    if (pgnText.value === "") {
      return
    }
    newMatch().then(()=>{
      readPGN().then(()=>{
        setPGN();
        pgnMenu.classList.add('hidden');
      })
    })
  });

  toggleFirst.addEventListener('click', callFuncIfNotThinking.bind(null,doToggleFirst));
  resetAll();
  createPieceLists();


  //maybe should be 'click' for mobile bug?
  document.addEventListener('mousedown',registerClicks);
  document.addEventListener('keydown',(e)=>{
    if (e.keyCode === 27) {
      hideForfeit();
      pgnMenu.classList.add('hidden');
      hideOptions();
    }
  });
}

function doToggleFirst(){
  return new Promise((resolve,reject)=>{
    requestAnimationFrame(()=>{
      flipKingAndQueen();
      firstMove = !firstMove;
      switchSides();
      newMatch().then(resolve)
    });
  })
}

function callFuncIfNotThinking(func){
  if (!thinkingInProg){
    func()
  }
}

function hideForfeit(){
  forfeitBanner.classList.add('hidden');
  ffName.classList.add('hidden');
  ffYesNo.classList.add('hidden')
  forfeitBanner.classList.remove('visible');
  forfeit.classList.remove('clicked');
}

function registerClicks(e){
    let clickedElements = document.elementsFromPoint(e.clientX, e.clientY);
    checkForBoardMoves(clickedElements);
    checkForfeit(clickedElements);
    checkPGN(clickedElements);
    buttonAnimation(clickedElements);

    function checkForBoardMoves(clickedElements){
      let clickedSqaure = clickedElements.find(item=>item.classList.contains('square'));
      if (clickedSqaure === undefined) { //not a square 
        hideAvailableMoveIcons();
      } else { //a square was clicked 
        if (!clickedSqaure.children[0].classList.contains('hidden')){ //check for a legal move 
          completeMove(activePiece.parentElement,activePiece,clickedSqaure);
          hideAvailableMoveIcons();
        }
      }
    }

    function checkPGN(clickedElements){
      let selectedPgnMenu = Array.from(clickedElements).some(el=>(el.id==="pgn-menu"))
      if (!selectedPgnMenu){
        pgnMenu.classList.add('hidden');
      }
    }
    function checkForfeit(clickedElements){
      let forfeitOrFFBanner = Array.from(clickedElements).some(el=>(el.classList.contains('forfeit-banner') || el.id==="forfeit"))
      if (!forfeitOrFFBanner){
        hideForfeit() 
      }
    }

    function buttonAnimation(clickedElements){
      hideOptions();
      let button = clickedElements[0] 
      if (button === undefined || button.localName !== "button"){
        return
      }
      
      if (button.id==='options'){
        let buttonOptions = button.parentElement.children;
        showOptions(buttonOptions)
      }

      function showOptions(buttonOptions){

        buttonOptions[0].classList.add('clicked')
        if (buttonOptions[1]){
          buttonOptions[1].classList.remove('centered');  
          buttonOptions[1].classList.add('left');
        }
        if (buttonOptions[2]){
          buttonOptions[2].classList.remove('centered');
          buttonOptions[2].classList.add('right');  
        }
      }


    }


  }
      function hideOptions(){
        Array.from(options).map(buttons=>{
          buttons.children[0].classList.remove('clicked');
          Array.from(buttons.children).map(button=>{
            button.classList.add('centered')
            button.classList.remove('left');
            button.classList.remove('right');
          })
        });
      }
function createPieceLists(){
  //creates a class for each piece on board 
  let pieces = [['.pawn',Pawn],['.knight',Knight], ['.bishop',Bishop], 
                ['.rook',Rook], ['.queen',Queen], ['.king',King]];
  pieces.forEach(pieceType=>{
    document.querySelectorAll(pieceType[0]).forEach(piece=>new pieceType[1](piece))
  });
}

init();


