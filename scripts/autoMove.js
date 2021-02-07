//automove

function resizeGraveyard(){
    let squareWidth = document.querySelector('.square').offsetWidth;
    p1graveyard.style.left = -squareWidth + 'px'
    p2graveyard.style.right = -squareWidth + 'px'
}

function stackPiece(piece) {
  //console.log('try to capture piece')
  return new Promise((resolve,reject)=>{
    let graveyard;
    if (isp1(piece)) {
      graveyard = p1graveyard;
    } else {
      graveyard = p2graveyard;
    }
    movePiece(piece, graveyard,15).then(resolve);
  })
}

graveyardOffsets = {true:{},false:{}}
function movePiece(piece,loc,speedFactor=30){
  return new Promise((resolve,reject)=>{
//     console.log('movepiece started', piece.classList)
    if (piece.parentElement.id === "piece-area"){
      changePieceParent(piece,loc);
      window.requestAnimationFrame(resolve);
      return
    }
    let squareWidth = document.querySelector('.square').offsetWidth;
    let locPos = loc.getBoundingClientRect();
    let piecePos = piece.getBoundingClientRect();
    []
    let dy;
    let dx = locPos.left - piecePos.left;
    let pieceTop;
    if (loc.id === 'p1graveyard' || loc.id === 'p2graveyard') {
      let side = isp1(piece)
      if (graveyardOffsets[side][piece.classList] === undefined){
        graveyardOffsets[side][piece.classList] = {};
        if (side) {
          graveyardOffsets[side][piece.classList]['offset'] = Object.keys(graveyardOffsets[side]).length -1
        } else {
          graveyardOffsets[side][piece.classList]['offset'] = -Object.keys(graveyardOffsets[side]).length + 1
        }
        graveyardOffsets[side][piece.classList]['count'] = 0;
      } else {
        graveyardOffsets[side][piece.classList]['count'] += 1
      }
      let graveyardY = (locPos.top + locPos.height / 2)// - loc.childElementCount * 5
      dy = graveyardY - piecePos.top// - (1 + loc.childElementCount * 5);
      pieceTop = squareWidth * graveyardOffsets[side][piece.classList]['offset'] -graveyardOffsets[side][piece.classList]['count'] * 5// + 'px'
      dy = dy + pieceTop;
      pieceTop = pieceTop + 'px'
    } else {
      dy = locPos.top - piecePos.top
      pieceTop = 'auto'
    }
    //set piece parent to pieceArea so that it is at the top layer, then change the top and left so the piece
    //is visually in the same position it was inside the square.
    handToPieceArea(piece,piece.parentElement.offsetLeft,piece.parentElement.offsetTop);
    let pieceAreaLoc = pieceArea.getBoundingClientRect();
    let posx = piecePos.x - pieceAreaLoc.x;
    let posy = piecePos.y - pieceAreaLoc.y;
    let count = 0;
    window.requestAnimationFrame(step);
    //console.log('step started', piece.classList)
    function step(){
      if (count === speedFactor) {
        window.requestAnimationFrame(()=>{
          loc.appendChild(piece);
          piece.style.top = pieceTop;
          piece.style.left = 'auto';
          resolve();
        });
      } else {
        posx += dx / speedFactor;
        posy += dy / speedFactor;
        piece.style.top = posy + 'px';
        piece.style.left = posx + 'px';
        count++;
        window.requestAnimationFrame(step);
      }
    }
  });   
  
  function changePieceParent(piece,square){
    square.appendChild(piece);
    if (square !== pieceArea){
      Array.from(square.children).find(child=>child.classList.contains('piece')).style.zIndex = '1';
      square.children[0].style.zIndex = '0';
    }  
  } 
}