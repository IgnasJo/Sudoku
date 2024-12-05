async function fetchJson(url) {
  const response = await fetch(url);
  return await response.json();
}

function parseBoard({width, height, board}) {
  console.log(board, width, height);
  const rows = board.match(new RegExp(`.{${width}}`, "g"));
  if (rows.length != height) {
    console.log(rows);
    throw new Error(`Parsed width = ${rows.length} didn't match height = ${height}`);
  }
  const rowBoard = rows.map((row) => row.replace(/x/g, " ").split(""));
  console.log(rowBoard);
  return rowBoard;
}

function onKeyUpSquare(e, square, keyboardState, caller) {
  square.removeClass("scale-up");
  square.addClass("return-scale-up");
  const intKey = parseInt(e.key);
  const info = $("#info");
  if ((intKey != NaN) && (intKey > 0) && (intKey < 10)) {
    $("#problem-board").children().removeClass("highlight");
    square.html(e.key);
    square.addClass("highlight");
    square.removeClass("error-bg");
    console.log(e.code, e.key);
    info.addClass("hidden");
  }
  else {
    const inputCanceledMessage = `Invalid key: ${e.key}`;
    info.html(inputCanceledMessage);
    info.addClass("error-bg");
    setTimeout(() => {
      if (info.html() === inputCanceledMessage) {
        info.addClass("hidden");
        info.removeClass("error-bg");
      }
    }, 2000);
  }
  document.removeEventListener("keyup", caller);
  keyboardState.occupied = false;
}

function applySudokuLogic(board, keyboardState) {
  board.children().on("click", function() {
    const square = $(this); 
    if (keyboardState.occupied == true) {
      return;
    }
    keyboardState.occupied = true;
    const info = $("#info");
    info.removeClass("hidden");
    info.removeClass("error-bg");
    info.html("Press key 0-9");
    square.removeClass("return-scale-up");
    square.addClass("scale-up");
    const onKeyUp = (e) => onKeyUpSquare(e, square, keyboardState, onKeyUp);
    document.addEventListener("keyup", onKeyUp);
  });
}

function showBoard(rowBoard, boardContainer) {
  boardContainer.empty();
   for (let row of rowBoard) {
    for (let char of row) {
      const square = $(`<div>${char}</div>`);
      boardContainer.append(square);
    }
   }
  return boardContainer;
}

function isStringEmpty(str) {
  return (str === null) || (str.length === 0) || (str === "") || /^\s+$/.test(str);
}

function checkBoard(answerRowBoard) {
  const answerBoard = answerRowBoard.flat();
  console.log(answerBoard);
  let matchedIncorrect = false;
  const problemBoardChildren = $("#problem-board").children();
  const info = $("#info");
  problemBoardChildren.each((i, child) => {
    const childText = child.innerHTML;
    if (!isStringEmpty(childText) && (childText !== answerBoard[i])) {
      info.html("Mistakes were found");
      info.addClass("error-bg");
      info.removeClass("hidden");
      child.classList.add("error-bg");
      matchedIncorrect = true;
    }
    else {
      child.classList.remove("error-bg");
    }
    if (isStringEmpty(childText)) {
      matchedIncorrect = true;
    }
  });
  if (matchedIncorrect == false) {
    problemBoardChildren.addClass("correct-bg");
    info.removeClass("hidden");
    info.html("Yay, Sudoku solved!");
  }
}

function main() {
  const PROBLEM_BOARD_URL = "https://6550e0cc7d203ab6626e476a.mockapi.io/api/v1/SudokuBoard/1";
  const SOLUTION_BOARD_URL = "https://6550e0cc7d203ab6626e476a.mockapi.io/api/v1/SudokuSolutions/1";
  let height = 0;
  let width = 0;
  let keyboardState = {occupied: false};
  fetchJson(PROBLEM_BOARD_URL)
    .then((data) => {
      height = data.height;
      width = data.width;
      return parseBoard(data);
    })
    .then((board) => showBoard(board, $("#problem-board")))
    .then((visibleBoard) => applySudokuLogic(visibleBoard, keyboardState)
  );
  $("#check-answer").on("click", () => fetchJson(SOLUTION_BOARD_URL)
    .then((data) => parseBoard({board: data.solution, height: height, width: width}))
    .then((board) => checkBoard(board))
  );
  const onShowAnswer = () => fetchJson(SOLUTION_BOARD_URL)
  .then((data) => parseBoard({board: data.solution, height: height, width: width}))
  .then((board) => {
    const answerButton = $("#show-answer");
    answerButton.off("click");
    const visibleBoard = showBoard(board, $("#solution-board"));
    const answerButtonStartText = answerButton.html();
    answerButton.html("Hide answer");
    answerButton.on("click", () => {
      visibleBoard.empty();
      answerButton.html(answerButtonStartText);
      answerButton.on("click", onShowAnswer);
    });
  })
  $("#show-answer").on("click", onShowAnswer);
}

window.addEventListener("load", main);