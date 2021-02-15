//automove

function resizeGraveyard(){
    let squareWidth = document.querySelector('.square').offsetWidth;
    // p1graveyard.style.left = -squareWidth + 'px'
    // p2graveyard.style.right = -squareWidth + 'px'
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
    if (onMobile) speedFactor=speedFactor/2;
    if (piece.parentElement.id === "piece-area"){
      changePieceParent(piece,loc);
      window.requestAnimationFrame(resolve);
      return
    }
    let squareWidth = document.querySelector('.square').offsetWidth;
    let locPos = loc.getBoundingClientRect();
    let piecePos = piece.getBoundingClientRect();
    let dy;
    let dx = locPos.left - piecePos.left;
    let pieceTop;
    let toGraveyard;
    if (loc.id === 'p1graveyard' || loc.id === 'p2graveyard') {
      toGraveyard=true;
      let side = isp1(piece)
      let pieceType = pieceMap.get(piece).constructor.name.toLowerCase();
      if (graveyardOffsets[side][piece.classList] === undefined){
        graveyardOffsets[side][piece.classList] = {};
        graveyardOffsets[side][piece.classList]['offset'] = Object.keys(graveyardOffsets[side]).length -1
        graveyardOffsets[side][piece.classList]['count'] = 0;
        let graveyard = side ? p1graveyard : p2graveyard;
        graveyardOffsets[side][piece.classList]['slot'] = Array.from(graveyard.children).find(slot=>slot.children.length===0)
      } else {
        graveyardOffsets[side][piece.classList]['count'] += 1;
      }
      loc = graveyardOffsets[side][piece.classList]['slot'];
      locPos = loc.getBoundingClientRect();
      let graveyardY = (locPos.top + locPos.height / 2);
      dy = graveyardY - piecePos.top;
      dx = locPos.left - piecePos.left;
      pieceLeft = graveyardOffsets[side][piece.classList]['count'] * (squareWidth/8)
      loc.style.width = `calc(${pieceLeft}px + 100vw / 15)`;
      loc.style.maxWidth = `calc(${pieceLeft}px + var(--board-vh-limit) / 15)`;
      dx += pieceLeft;
      pieceLeft = pieceLeft + 'px';
    } else {
      dy = locPos.top - piecePos.top
      pieceLeft = 'auto'
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
          piece.style.top = 'auto';
          piece.style.left = pieceLeft;
          resolve();
        });
      } else {
        let divideFactor = toGraveyard ? 8 + 7*(count/speedFactor) : 8;
        posx += dx / speedFactor;
        posy += dy / speedFactor;
        piece.style.top = posy + 'px';
        piece.style.left = posx + 'px';
        piece.style.width = `calc(100vw / ${divideFactor})`;
        piece.style.height = `calc(100vw / ${divideFactor})`;
        piece.style.maxWidth = `calc(var(--board-vh-limit) / ${divideFactor})`;
        piece.style.maxHeight = `calc(var(--board-vh-limit) / ${divideFactor})`;
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