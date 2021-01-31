//physically moving pieces
function dragElement(elmnt) {
  let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
  let startParent;
  let squareWidth = document.querySelector('.square').offsetWidth;
  if (onMobile){
    elmnt.addEventListener('click',dragMouseDown);
  } else {
    elmnt.onmousedown = dragMouseDown; 
  }
  function dragMouseDown(e) {
    e = e || window.event;

    if (delOnClick){
      stackPiece(elmnt)
      return
    }
    let elmntBounds, leftBoundElmnt,topBoundElmnt;
    let squareBounds, leftBoundSquare;
    let rowBounds,leftBoundRow;
    let rowCol,newX,newY;

    let pieceInGraveyard = (elmnt.parentElement.id == 'p1graveyard' || elmnt.parentElement.id == 'p2graveyard')
    if (trblesht) {} else if (isp1(elmnt) !== turn || midPromotion || pieceInGraveyard || winnerBool 
    || undoneMoves.length>0 || pieceArea.childElementCount > 0 ||  (playingComputer && !isp1(elmnt)) || thinkingInProg) {
      return
    }

    let clickedSqaure = document.elementsFromPoint(e.clientX, e.clientY).find(item=>item.classList.contains('square'))
    if (clickedSqaure){  
      if (!clickedSqaure.children[0].classList.contains('hidden')){
        completeMove(activePiece.parentElement,activePiece,clickedSqaure)
        endDrag(elmnt);
      } 
    }

    if (activePiece !== elmnt){ //if it is a new piece, hide old shown moves 
      hideAvailableMoveIcons(); 
    }

    activePiece = elmnt;
    pieceMap.get(elmnt).displayMoves(); //then display the moves 
    //console.log('moves displayed');

    handleSquareHighlightsClick(elmnt);
    
    // get the mouse cursor position at startup:
    if (!onMobile) {
      pos1 = e.clientX;
      pos2 = e.clientY;
      //in case of a bad drag
      startParent = elmnt.parentElement;

      elmntBounds = elmnt.getBoundingClientRect();
      leftBoundElmnt = elmntBounds.x;
      topBoundElmnt = elmntBounds.y;

      squareBounds = elmnt.parentElement.getBoundingClientRect();
      leftBoundSquare = squareBounds.x;

      rowBounds = elmnt.parentElement.parentElement.getBoundingClientRect();
      leftBoundRow = rowBounds.x;

      rowCol = getRowCol(elmnt.parentElement);
      newX = pos1 - leftBoundElmnt + leftBoundSquare - leftBoundRow;
      newY = pos2- window.scrollY - topBoundElmnt + elmntBounds.height*rowCol[0];
    
      document.onmouseup = closeDragElement;
      handToPieceArea(elmnt,newX,newY,false);
      document.onmousemove = elementDrag
    }
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;    
      elmnt.style.left = (pos3 - leftBoundElmnt + leftBoundSquare - leftBoundRow - squareWidth/2) + 'px';
      elmnt.style.top = (pos4 - topBoundElmnt + elmntBounds.height*rowCol[0]- squareWidth/2) + 'px';
      handleSquareHighlightsDrag(document.elementsFromPoint(pos3,pos4).find(div=>div.classList.contains('square')));
    }
  }

  function closeDragElement(e) {
    //stop moving when mouse button is released:
    let squareInfo = document.elementsFromPoint(e.clientX, e.clientY);
    let square = squareInfo.find(item=>item.classList.contains('square'));

    if (trblesht) {
        square.appendChild(elmnt);
        endDrag(elmnt);
    } else {
      try {
        if (!square.children[0].classList.contains('hidden')) {
          endDrag(elmnt);
          completeMove(startParent,elmnt,square)
        } else {
          startParent.appendChild(elmnt);
          endDrag(elmnt,startParent === square);
          handleSquareHighlightsDrag();
        }
      } catch (error) {
        startParent.appendChild(elmnt);
        endDrag(elmnt);
      }
    }
  }

  function endDrag(piece,keepIcons=false){
    elmnt.style.top = 'auto';
    elmnt.style.left = 'auto';
    document.onmouseup = null;
    document.onmousemove = null;

    if (keepIcons) {return}
    hideAvailableMoveIcons();
  }
}

//physically moving pieces
function dragBox(elmnt) {
  let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
  let initGrab;
  elmnt.onmousedown = dragMouseDown; 
  function dragMouseDown(e) {
    e = e || window.event;
    initGrab = true;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag
  }
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    if (!initGrab) {
      pgnMenu.style.left = pgnMenu.offsetLeft +150- pos1 + 'px';
      pgnMenu.style.top = pgnMenu.offsetTop + 150 - pos2 + 'px';
    }
    initGrab = false;
  }

  function closeDragElement(e) {
    if (pgnMenu.offsetLeft < 0){
      pgnMenu.style.left = "150px"
    }

    if (pgnMenu.offsetTop < 0){
      pgnMenu.style.top = "150px"
    }

    document.onmouseup = null;
    document.onmousemove = null;
  }
}


//physically moving pieces
function resizeBox(elmnt) {
  let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
      let initGrab;
  elmnt.onmousedown = dragMouseDown; 
  function dragMouseDown(e) {
    document.body.style.cursor = 'nwse-resize';
    e = e || window.event;
    initGrab = true;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag
  }
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    if (!initGrab) {
      if (pos3> pgnMenu.offsetLeft + pgnText.offsetLeft + pgnText.offsetWidth ||
      pgnText.offsetWidth-6 >= 91 ){
        pgnMenu.style.width = 8 + pos3 - pgnMenu.offsetLeft +'px'
        pgnText.style.width = pgnMenu.offsetWidth-30 + 'px'
      }
      
      if (pos4> pgnMenu.offsetTop + pgnText.offsetTop + pgnText.offsetHeight ||
      pgnText.offsetHeight-6 >= 73 ){
        pgnMenu.style.height = 5 + pos4 - pgnMenu.offsetTop +'px'
        pgnText.style.height = pgnMenu.offsetHeight-96 + 'px'
      }
    }
    initGrab = false;
  }

  function closeDragElement(e) {
    document.onmouseup = null;
    document.onmousemove = null;
    document.body.style.cursor = 'auto';
  }
}