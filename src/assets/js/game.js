import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
init();


function init() {
    generateBoard();
    createEventListeners();
    createTreasureObjectives();
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
            square.setAttribute('data-target', `${columns},${rows}`);
            column.appendChild(square);
        }
    }
}


//TODO: update button event listener with navigate function from universal.js
function createEventListeners() {
    const button = document.querySelector('button');
    const allBoardPieces = document.querySelectorAll('.square');
    button.addEventListener('click', () => window.location.href = "index.html");
    allBoardPieces.forEach(boardPiece => boardPiece.addEventListener('click', (e) => getBoardPiece(e)));
}

function getBoardPiece(e) {
    e.preventDefault();
    console.log(e.target);
}

async function createTreasureObjectives(maxObjectives = 3) {
    const treasures = await CommunicationAbstractor.fetchFromServer('/treasures', 'GET').catch(ErrorHandler.handleError);
    const objectives = [];
    for (let i = 0; i < maxObjectives; i++) {
        const randomTreasure = treasures.treasures[Math.floor(Math.random() * treasures.treasures.length)];
        objectives.push(randomTreasure);
    }
    objectives.forEach(objective => { createDiv('li', objective, document.querySelector(`#treasureList`)) });
}

function createDiv(elementName, inner, container) {
    const element = document.createElement(elementName);
    element.innerHTML = inner;
    container.appendChild(element);
}