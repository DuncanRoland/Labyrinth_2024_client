
init();


function init() {
    generateBoard();
    createEventListeners();
}

function generateBoard() {
    const board = document.querySelector('#board');
    for (let columns = 0; columns < 8; columns++) {
        const column = document.createElement('div');
        column.classList.add('column');
        board.appendChild(column);
        for (let rows = 0; rows < 8; rows++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.setAttribute('data-target', `${columns}, ${rows}`);
            column.appendChild(square);
        }
    }
}


//TODO: update button event listener with navigate function from universal.js
function createEventListeners() {
    const button = document.querySelector('button');
    button.addEventListener('click', () => window.location.href = "index.html");
}
