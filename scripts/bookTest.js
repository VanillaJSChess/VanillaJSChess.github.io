
fillBookMoves();
function fillBookMoves(){
    bookMoves = "1. Nf3 Nf6, 2. g3 g6, 3. Bg2 Bg7, 4. O-O O-O, 5. h4 g5, 6. h5 h6, 7. Nxg5 hxg5, 8. h6 Re8, 9. h7+ Kf8, 10. h8=Q+ Bxh8"
    let pgnData = splitMoveString(bookMoves);
    bookMoves = pgnData.map(x=>x.split(' ')).flat().reverse();
}