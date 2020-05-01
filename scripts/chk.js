var p1pieces = document.querySelectorAll(".p1piece"), 
p2pieces = document.querySelectorAll(".p2piece"), 
p1graveyard = document.querySelector("#p1graveyard"), 
p2graveyard = document.querySelector("#p2graveyard"), 
forfeitBanner = document.querySelector(".forfeit-banner"), 
ffyes = document.querySelector("#ff-yes"), 
ffno = document.querySelector("#ff-no"), 
pieces, 
placeInfo, 
pieceArea = document.querySelector("#pieces"), 
board = document.querySelector("#board"), 
p1icon = document.querySelector("#p1icon"), 
p2icon = document.querySelector("#p2icon"), 
p1color = document.querySelector("#p1color"), 
p2color = document.querySelector("#p2color"), 
p1s = document.querySelector("#p1s"), 
p2s = document.querySelector("#p2s"), 
winner1 = document.querySelector("#winner1"), 
winner2 = document.querySelector("#winner2"), 
newGame = document.querySelector("#new"), 
forfeit = document.querySelector("#forfeit"), 
reset = document.querySelector("#reset"), 
toggleFirst = document.querySelector("#toggleFirst"), 
firstMove = true, 
winnerBool = false, 
availMoveIcons = document.querySelectorAll(".avail-move"), 
trblesht = false, 
regMoves, 
hopMoves,
hopAvailable, 
turn;

function init() {
    for (i = 0; i < 8; i++) {
        board.children[i].children[0].style.borderLeft = "1px solid black";
        board.children[i].children[7].style.borderRight = "3px solid black";
    }
    document.querySelectorAll(".gameRow")[7].style.borderBottom = "3px solid black";
    document.querySelectorAll(".gameRow")[0].style.borderTop = "1px solid black";
    for (i = 0; i < p1pieces.length; i++) {
        dragElement(p1pieces[i]);
//         pieceArea.appendChild(p1pieces[i]);
        dragElement(p2pieces[i]);
//         pieceArea.appendChild(p2pieces[i]);
    }
    reset.addEventListener("click", resetAll);
    p1color.addEventListener("change", giveColor);
    p2color.addEventListener("change", giveColor);
    newGame.addEventListener("click", newMatch);
    ffyes.addEventListener("mousedown", (event)=>{
      console.log('yes', event);
      winner();
    });
    forfeitBanner.addEventListener("mousedown", function(event){
      console.log('banner', event);
      this.classList.add("hidden");
    });
    toggleFirst.addEventListener("click", function() {
      firstMove = !firstMove;
      newMatch();
    });
    document.querySelector("#force-jump").children[0].checked = true
    document.querySelector("#force-jump").addEventListener("click", newMatch);
    resetAll();
}

let freeMove = ()=>{
    trblesht = !trblesht
    getLegalMoves(pieces);
}

function resetAll() {
    firstMove = true;
    p1color.value = "#d43e3e"
    p2color.value = "#2b82ec"
    p1s.innerText = 0;
    p2s.innerText = 0;
    newMatch();
    giveColor();
}

function newMatch() {
    forceJump = document.querySelector("#force-jump").children[0].checked;
    clearWinner();
    giveColor();
    demoteKings();
    turn = !firstMove    
    movePromises = populateBoard();
    Promise.all(movePromises).then(()=>{
        swapTurn();
    })
}

function populateBoard(){
    movePromises = [];
    let[strayP1,strayP2] = collectStrayPieces();
    for (let i = 0; i < 3; i++) {
        assignPiece(i, "player2");
    }
    for (let i = 5; i < 8; i++) {
        assignPiece(i, "player1");
    }
    return movePromises
    function assignPiece(count, player) {
        var piece;
        for (var j = 0; j < 8; j++) {
            var place = board.children[count].children[j];
            if (place.classList.contains("placeD")) {
                if (!placeWithoutCorrectPiece(place, player)) {
                    continue
                }
                ;if (player === "player1") {
                    piece = strayP1.pop();
                } else {
                    piece = strayP2.pop();
                }
                movePromises.push(movePiece(piece, place, speedFactor = 30))
            }
        }
        function placeWithoutCorrectPiece(place) {
            if (place.children[1] === undefined) {
                return true
            }
            //there no piece
            if ((player === "player1") !== (place.children[1].classList.contains("p1piece"))) {
                return true
            }
            //This piece not is for the player on that side
            return false
            //otherwise it is place with a piece that matches what should be there
        }
    }
    function collectStrayPieces() {
        let strayP1 = [];
        let strayP2 = [];
        p1pieces.forEach((piece)=>{
            strayP1.push(graveyardOrWrongRow(piece));
        })
        p2pieces.forEach((piece)=>{
            strayP2.push(graveyardOrWrongRow(piece));
        })
        return [strayP1.filter(val=>val !== undefined), strayP2.filter(val=>val !== undefined)]
        function graveyardOrWrongRow(piece) {
            if (piece.parentElement.classList.contains("placeD")) {
                let[row,col] = getRowCol(piece.parentElement)
                if (piece.classList.contains("p1piece")) {
                    if (row < 5) {
                        return piece
                    }
                } else {
                    if (row > 2) {
                        return piece
                    }
                }
            } else {
                return piece
            }
        }
    }
}

function swapTurn() {
    clearIcons();
    if (turn) {
        p2icon.style.backgroundColor = p2color.value;
        p2icon.style.borderColor = "black";
        document.querySelector("#ff-name").innerText = "Player 2"
        pieces = p2pieces;
    } else {
        p1icon.style.backgroundColor = p1color.value;
        p1icon.style.borderColor = "black";
        document.querySelector("#ff-name").innerText = "Player 1"
        pieces = p1pieces;
    }
    getLegalMoves(pieces);
    turn = !turn;
}

function clearIcons() {
    p1icon.style.backgroundColor = "#ffffff";
    p1icon.style.borderColor = "#ffffff";
    p2icon.style.backgroundColor = "#ffffff";
    p2icon.style.borderColor = "#ffffff";
}

function giveColor() {
    clearIcons();
    if (turn) {
        p1icon.style.backgroundColor = p1color.value;
        p1icon.style.borderColor = "black";
    } else {
        p2icon.style.backgroundColor = p2color.value;
        p2icon.style.borderColor = "black";
    }
    p1pieces.forEach(function(piece, i) {
        piece.style.backgroundColor = p1color.value;
        p2pieces[i].style.backgroundColor = p2color.value;
    });
}

let demoteKings = ()=>{
    for (i = 0; i <= p1pieces.length - 1; i++) {
        p1pieces[i].classList.remove("king");
        p2pieces[i].classList.remove("king");
    }
}

function dragElement(elmnt) {
    var pos1 = 0
      , pos2 = 0
      , pos3 = 0
      , pos4 = 0;
    var startParent, pieceHopped, moveShown;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        let pieceInGraveyard = (elmnt.parentElement.id == "p1graveyard" || elmnt.parentElement.id == "p2graveyard")
        if (trblesht) {} else if (elmnt.classList.contains("p1piece") !== turn || pieceInGraveyard || winnerBool) {
            return
        }
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        //in case of a bad drag

        startParent = elmnt.parentElement;
        handToPieceArea(elmnt);

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        displayLegalMoves(elmnt);
        if (!moveShown) {
            highlightMovablePieces();
        }
    }

    let displayLegalMoves = (piece)=>{
        moveShown = false;
        try {
            if (hopMoves.get(piece) === undefined)
                throw "Not a chained jump"
            hopMoves.get(piece).forEach((move)=>{
                move.classList.remove("hidden");
                moveShown = true;
            }
            );
        } catch (err) {
            console.log(err)
        }
        try {
            if (regMoves.get(piece) === undefined)
                throw "Not a chained jump"
            if (!forceJump || (forceJump && !hopAvailable)) {
                regMoves.get(piece).forEach((move)=>{
                    move.classList.remove("hidden");
                    moveShown = true;
                }
                );
            }

        } catch (err) {
            console.log(err)
        }
    }

    let highlightMovablePieces = ()=>{
        pieces.forEach((piece)=>{
            //       if (piece.parentElement.id !==""){return};
            if (hopMoves.get(piece) === undefined) {
                return
            }
            ;if (hopMoves.get(piece).length > 0) {
                piece.style.boxShadow = "0 0 10px yellow";
            }
        }
        );
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        //stop moving when mouse button is released:
        placeInfo = document.elementsFromPoint(pos3, pos4);
        placeInfo.forEach((item,i)=>{
            if (item.classList.contains("avail-move")) {
                placeInfo.splice(i, 1)
            }
        }
        )
        if (trblesht) {
            placeInfo[1].appendChild(elmnt);
            kingMe(elmnt, placeInfo[1]);
        } else {
            try {
                if (!placeInfo[1].children[0].classList.contains("hidden")) {
                    placeInfo[1].appendChild(elmnt);
                    kingMe(elmnt, placeInfo[1]);
                    if (!checkJump(startParent, placeInfo[1])) {
                        swapTurn();
                    }
                } else {
                    startParent.appendChild(elmnt);
                }
            } catch (error) {
                startParent.appendChild(elmnt);
                console.log(error);
            }
        }
        endDrag(elmnt);
    }
    let endDrag = (piece)=>{
        availMoveIcons.forEach((icon)=>{
            icon.classList.add("hidden")
        }
        );
        pieces.forEach((piece)=>{
            piece.style.boxShadow = "none"
        }
        )
        elmnt.style.top = "auto";
        elmnt.style.left = "auto";
        document.onmouseup = null;
        document.onmousemove = null;
    }
    let checkJump = (fromSquare,toSquare)=>{
        const row = (getRowCol(fromSquare)[0] + getRowCol(toSquare)[0]) / 2
        const col = (getRowCol(fromSquare)[1] + getRowCol(toSquare)[1]) / 2
        if (row % 1 === 0) {
            stackPiece(board.children[row].children[col].children[1]);
            pieceHopped = true;
            getLegalMoves([elmnt]);
            return hopAvailable;
        }
    }
    let kingMe = (piece,toSquare)=>{
        if ((piece.classList.contains("p1piece") && getRowCol(toSquare)[0] === 0) || (piece.classList.contains("p2piece") && getRowCol(toSquare)[0] === 7)) {
            piece.classList.add("king");
        }
    }
}

let getLegalMoves = (pieces)=>{
    var leftOrRightMove;
    regMoves = new WeakMap();
    hopMoves = new WeakMap();
    hopAvailable = false;
    pieces.forEach((piece)=>{
        if (piece.parentElement.id !== "") {
            return
        }
        ;var rowCol = getRowCol(piece.parentElement);
        let directions = [];
        let hops = [];
        let moves = [];
        if (piece.classList.contains("king")) {
            directions.push(-1);
            directions.push(1);
        } else if (piece.classList.contains("p1piece")) {
            directions.push(-1);
        } else {
            directions.push(1);
        }
        directions.forEach((direction)=>{
            if (rowCol[0] + direction < 0 || rowCol[0] + direction > 7) {
                return
            }
            var availSpaceOccupants = [];
            if (rowCol[1] > 0) {
                //left
                availSpaceOccupants.push(board.children[rowCol[0] + direction].children[rowCol[1] - 1].children);
                leftOrRightMove = -2;
            }
            if (rowCol[1] < 7) {
                //right
                availSpaceOccupants.push(board.children[rowCol[0] + direction].children[rowCol[1] + 1].children);
                if (leftOrRightMove === undefined) {
                    leftOrRightMove = 2;
                }
            }
            availSpaceOccupants.forEach((children)=>{
                if (children.length === 1) {
                    moves.push(children[0])

                } else if (children.length === 2) {
                    if (children[1].classList.contains("p1piece") !== piece.classList.contains("p1piece")) {
                        if (rowCol[0] + 2 * direction > -1 && rowCol[0] + 2 * direction < 8 && rowCol[1] + leftOrRightMove > -1 && rowCol[1] + leftOrRightMove < 8) {
                            var hopChildren = board.children[rowCol[0] + 2 * direction].children[rowCol[1] + leftOrRightMove].children;
                            if (hopChildren.length === 1) {
                                //if there is an available move icon and no other pieces
                                hops.push(hopChildren[0]);
                                hopAvailable = true;
                            }
                        }
                    }
                }
                leftOrRightMove = 2;
            }
            );
            hopMoves.set(piece, hops);
            regMoves.set(piece, moves);
        }
        );
    }
    );
}

function getRowCol(square) {
    var rowCol = [];
    for (var i = 0; i < board.childElementCount; i++) {
        if (square.parentElement === board.children[i]) {
            rowCol.push(i);
            break
        }
    }
    for (var i = 0; i < board.childElementCount; i++) {
        if (square === board.children[rowCol[0]].children[i]) {
            rowCol.push(i);
            break
        }
    }
    return rowCol;
}

function stackPiece(hoppedPiece) {
    if (hoppedPiece.classList.contains("p1piece")) {
        var graveyard = p1graveyard;
    } else {
        var graveyard = p2graveyard;
    }
    movePiece(hoppedPiece, graveyard);
    if(checkWinner()){winner(!turn)};
}

let checkWinner = ()=>{
    if (turn) {
        return !Array.from(p2pieces).some(piece=>piece.parentElement.id==="");
    } else {
        return !Array.from(p1pieces).some(piece=>piece.parentElement.id==="");
    }
}

function winner(player = turn) {
    clearWinner();
    winnerBool = true;
    if (player) {
        p2s.innerText = Number(p2s.innerText) + 1;
        winner2.style.visibility = "visible";
        winner2.style.backgroundColor = p2color.value;
    } else {
        p1s.innerText = Number(p1s.innerText) + 1;
        winner1.style.visibility = "visible";
        winner1.style.backgroundColor = p1color.value;
    }
    newGame.innerText = "Play Again"
}

function clearWinner() {
    newGame.innerText = "New Game"
    winner1.style.visibility = "hidden";
    winner2.style.visibility = "hidden";
    clearIcons();
    winner1.style.backgroundColor = "#ffffff";
    winner2.style.backgroundColor = "#ffffff";
    winnerBool = false;
}

function movePiece(piece,loc, speedFactor=10){
    return new Promise((resolve,reject)=>{
        let locPos = loc.getBoundingClientRect();
        let piecePos = piece.getBoundingClientRect();
        let dy;
        let dx = locPos.left - piecePos.left;
        let pieceTop;
        if (loc.id === "p1graveyard" || loc.id === "p2graveyard") {
            let graveyardY = (locPos.top + locPos.height / 2) - loc.childElementCount * 5
            dy = graveyardY - piecePos.top - (1 + loc.childElementCount * 5);
            pieceTop = -loc.childElementCount * 5 + "px"
        } else {
            dy = locPos.top - piecePos.top
            pieceTop = "auto"
        }

        //set piece parent to pieceArea so that it is at the top layer, then change the top and left so the piece
        //is visually in the same place it was inside the square.
        let[posx,posy] = handToPieceArea(piece);
        let count = 0;
        window.requestAnimationFrame(step);
        function step(){
            if (count === speedFactor) {
                loc.appendChild(piece);
                piece.style.top = pieceTop;
                piece.style.left = "auto";
                resolve();
            } else {
                posx += dx / speedFactor;
                posy += dy / speedFactor;
                piece.style.top = posy + "px";
                piece.style.left = posx + "px";
                count++;
                window.requestAnimationFrame(step);
            }
        }
    });
}

function handToPieceArea(piece){
    const pieceParentLeft = piece.parentElement.offsetLeft
    const pieceParentTop = piece.parentElement.offsetTop
    pieceArea.appendChild(piece);
    piece.style.left = pieceParentLeft + 5 + "px";
    piece.style.top = pieceParentTop + 5 + "px";
    return [pieceParentLeft + 5, pieceParentTop + 5];
}

init();
