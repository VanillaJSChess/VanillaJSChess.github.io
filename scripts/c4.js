var board = document.querySelector("#board"),
    colsIn = document.querySelector("#cols"),
    rowsIn = document.querySelector("#rows"),
    colObjs = [],
    player1 = true,
    gameArray = [],
    p1s = document.querySelector("#p1s"),
    p2s = document.querySelector("#p2s"),
    winner1 = document.querySelector("#winner1"),
    winner2 = document.querySelector("#winner2"),
    newGame = document.querySelector("#new"),
    reset = document.querySelector("#reset"),
    toggleFirst = document.querySelector("#toggleFirst"),
    winnerBool  = false,
    firstMove = true,
    p1color = document.querySelector("#p1color"),
    p2color = document.querySelector("#p2color"),
    p1icon = document.querySelector("#p1icon"),
    p2icon = document.querySelector("#p2icon"),
    places,
    placeWidth = 40;
    

var ncols,
    nrows,
    cols;

function init(){ 
  //===================
  //Add event listeners
  //===================
  colsIn.addEventListener("click", function(){
    newMatch();
  });
  rowsIn.addEventListener("click", function(){
    newMatch();
  });
  colsIn.onkeydown = function(e){
    if(e.keyCode == 13 || e.which == 13){
      newMatch();
    }
  }
  rowsIn.onkeydown = function(e){
    if(e.keyCode == 13 || e.which == 13){
      newMatch();
    }
  }



  reset.addEventListener("click", resetAll) ;
  newGame.addEventListener("click", newMatch);
  toggleFirst.addEventListener("click", function(){
    firstMove = !firstMove;
    newMatch();
  }); 
 
  //reset all
  resetAll();

  p1color.addEventListener("change", giveColor);
  p2color.addEventListener("change", giveColor);
}

function givePlacesListener(){
  ncols = Number(colsIn.value),
  nrows = Number(rowsIn.value),
  cols = document.querySelectorAll("#board .gameCol");
  for(i=0; i<ncols;i++){
    cols[i].addEventListener("click", function(){
      var pos = nrows - 1;
      while(this.children[pos].style.backgroundColor != ""  && this.children[pos].style.backgroundColor != "grey"  && pos > 0){
        pos-=1;
      }
      var y = indexNodeList(this);
      if(gameArray[pos][y] !== true && gameArray[pos][y] !== false && winnerBool===false){
        if(gameArray[pos][y] === true ||gameArray[pos][y] === false){
          console.log("how)");
        };

        gameArray[pos][y] = player1;

        var dropColor = swapColor()
        for(let j=0; j<pos+1 ;j++){
          (function(k){setTimeout(function(){
            cols[i].children[j].style.backgroundColor = dropColor;
          },10*j);}(j));
          (function(k){setTimeout(function(){
	    if(j>0){
              cols[i].children[j-1].style.backgroundColor = "grey";
            }
          },10*j);}(j));
        }

        checkforwin(pos,y);
      }
    });
  }
}

function resetAll(){
  placeWidth = 40;
  firstMove = true;
  colsIn.value = 7;
  rowsIn.value = 6;
  p1color.value = "#ff0000"
  p2color.value = "#0000ff"
  giveColor();
  p1s.innerText = 0;
  p2s.innerText = 0;
  newMatch();
}

function newMatch(){
  clearWinner();
  newGame.innerText = "New Game";
  player1 = firstMove;
  giveColor();
  winnerBool = false; 
  buildBoard(); 
  buildGameArray();
  clearBoard();
  givePlacesListener();
}

function clearBoard(){
  cols = document.querySelectorAll("#board .gameCol"),
  ncols = Number(colsIn.value),
  nrows = Number(rowsIn.value);
  for(var i=0; i<ncols; i++){
    for(var j=0; j<nrows; j++){
      cols[i].children[j].classList.remove("red");
      cols[i].children[j].classList.remove("blue");
    }
  }
}

function indexNodeList(el){
  var children = el.parentNode.childNodes;
  for(i =0; i<children.length; i++){
   if(children[i] == el){
      //return (i-1)/2;
        return i;
    }
  }
  return -1;
}

function giveColor(){
  p1icon.style.backgroundColor = "#ffffff"
  p2icon.style.backgroundColor = "#ffffff"
  if(player1){
    p1icon.style.backgroundColor = p1color.value;
  }
  else{
    p2icon.style.backgroundColor = p2color.value;
  }
}

function swapColor(){
  p1icon.style.backgroundColor = "#ffffff"
  p2icon.style.backgroundColor = "#ffffff"
  if(player1){
    p2icon.style.backgroundColor = p2color.value;
    player1 = !player1;
    return p1color.value;
  }
  else{
   p1icon.style.backgroundColor = p1color.value;
    player1 = !player1;
    return p2color.value;
  }
}

function checkforwin(x,y){
  sumHoriz(x,y);
  sumVert(x,y);
  sumDiagL(x,y);
  sumDiagR(x,y);
}

function sumVert(x,y){
  var i = 0;
  if(gameArray[x+i+1] === undefined){return}
  var piece =  gameArray[x][y];
  while(gameArray[x+i+1][y] === piece){
    i++;
    if(gameArray[x+i+1] === undefined){ 
      break;
    }
  }
  if(i>=3){
    winner(player1); 
  }
}

function sumHoriz(x,y){
  var i = 0;
  var piece =  gameArray[x][y];
  if(gameArray[x][y+i] !== undefined){
    while(gameArray[x][y+i] === piece){
      i++;
      if(gameArray[x][y+i] === undefined){ 
        break;
      }
    }
    if(i>=4){   
      winner(player1);
    }
  }
  var j = 0;
  if(gameArray[x][y-j] !== undefined){
    while(gameArray[x][y-j] === piece){
      j++;
      if(gameArray[x][y-j] === undefined){ 
        break;
      }
    }
    if(i+j>=5){
      winner(player1);
    }
  }
}

function sumDiagL(x,y){
  var i = 0;
  var piece =  gameArray[x][y];
  if(gameArray[x+i+1] !== undefined){
    while(gameArray[x+i+1][y+i+1] === piece){
      i++;
      if(gameArray[x+i+1] === undefined){ 
        break;
      }
    }
    if(i>=3){   
      winner(player1);
    }
  }
  var j = 0;
  if(gameArray[x-j-1] !== undefined){
    while(gameArray[x-j-1][y-j-1] === piece){
      j++;
      if(gameArray[x-j-1] === undefined || x-j-1 < 0 || y-j-1 < 0){ 
        break;
      }
    }
    if(i+j>=3){
      winner(player1);
    }
  }
}

function sumDiagR(x,y){
  var i = 0;
  var piece =  gameArray[x][y];
  if(gameArray[x-i-1] !== undefined){
    while(gameArray[x-i-1][y+i+1] === piece){
      i++;
      if(gameArray[x-i-1] === undefined || x-i-1 < 0){ 
        break;
      }
    }
    if(i>=3){   
      winner(player1);
    }
  }
  var j = 0;
  if(gameArray[x+j+1] !== undefined){
    while(gameArray[x+j+1][y-j-1] === piece){
      j++;
      if(gameArray[x+j+1] === undefined || y-j-1 < 0){ 
        break;
      }
    }
    if(i+j>=3){
      winner(player1);
    }
  }
}

function buildGameArray(){
  ncols = Number(colsIn.value),
  nrows = Number(rowsIn.value);
  gameArray = [];
  for (i=0; i<nrows; i++){
    gameArray.push([])
    for (j=0; j<ncols; j++){
      gameArray[i].push([])
    }
  }
}

function winner(player1){
  console.log("win");
  clearWinner()
  winnerBool = true;
  if (player1){
    p2s.innerText = Number(p2s.innerText) + 1;
    winner2.style.opacity = 1;
    winner2.style.backgroundColor = p2color.value;
  }
  else{
    p1s.innerText = Number(p1s.innerText) + 1;
    winner1.style.opacity = 1;
    winner1.style.backgroundColor = p1color.value;
  }
  newGame.innerText = "Play Again"
} 	

function buildBoard(){
  ncols = Number(colsIn.value),
  nrows = Number(rowsIn.value);
  rowDivs =  "<span class=\"gameCol\">" + "<div class=\"empty\"></div>".repeat(nrows) + "</span>"
  board.innerHTML = rowDivs.repeat(ncols);
  places = document.querySelectorAll("#board .gameCol div");
  places.forEach(function(place){
    
place.style.height = placeWidth+"px";

    place.style.width = placeWidth+"px";

  });
  calculateCircleWidth(ncols);
}

function calculateCircleWidth(ncols){
  //places = document.querySelectorAll("#board .gameCol div");
  //placeWidth = Number(window.getComputedStyle(places[0]).width.replace('px',''));
  var boardWidth = Number(window.getComputedStyle(board).width.replace('px','')),
      colMargin = Number(window.getComputedStyle(places[0]).marginRight.replace('px',''));

  colWidth = placeWidth + colMargin*2;
  maxCols = Math.floor(boardWidth/colWidth);

  console.log(ncols, colWidth, maxCols, boardWidth, placeWidth);

  if(ncols>maxCols && placeWidth>10){
    console.log("sizeDown");
    resizePlacesDown(places, colMargin, boardWidth);
  }
  else if(ncols<maxCols && placeWidth<40 && (placeWidth + 5 + colMargin*2 )*ncols <= boardWidth){ 
    console.log("sizeUp");
    resizePlacesUp(places, colMargin, boardWidth);
  }
}

function resizePlacesDown(places, colMargin, boardWidth){
  while((placeWidth + colMargin*2 )*ncols >= boardWidth){
    placeWidth-=5;
    console.log("count")
  }
  places.forEach(function(place){
    
place.style.height = placeWidth+"px";

    place.style.width = placeWidth+"px";

  });
}

function resizePlacesUp(places, colMargin, boardWidth){
  while((placeWidth + colMargin*2 )*ncols <= boardWidth && placeWidth<40){
    placeWidth+=5;
    console.log("count")
  }
  places.forEach(function(place){
    
place.style.height = placeWidth+"px";

    place.style.width = placeWidth+"px";

  });
};

function clearWinner(){
  winner1.style.opacity = 0;
  winner2.style.opacity = 0;
  p1icon.style.backgroundColor = "#ffffff";
  p2icon.style.backgroundColor = "#ffffff";
  winner1.style.backgroundColor = "#ffffff";
  winner2.style.backgroundColor = "#ffffff";
}

var waitForFinalEvent = (function(){
  var timers = {};
  return function(callback, ms, uniqueId){
    if(!uniqueId){
      uniqueId = "123uniqueId";
    }
    if(timers[uniqueId]){
      clearTimeout(timers[uniqueId]);
    }
    timers[uniqueId] = setTimeout(callback, ms);
  };
})();



init()

 