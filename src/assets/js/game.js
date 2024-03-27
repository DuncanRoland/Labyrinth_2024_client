import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import { navigate } from "./universal.js";
init();


function init() {
    generateBoard(7, 7);
    createEventListeners();
    createTreasureObjectives();
    
}

function generateBoard(maxColumns, maxRows) {
    const board = document.querySelector('#board');
    for (let columns = 0; columns < maxColumns; columns++) {
        const column = document.createElement('div');
        column.classList.add('column');
        board.appendChild(column);
        for (let rows = 0; rows < maxRows; rows++) {
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
    button.addEventListener('click', () => navigate("index.html"));
    allBoardPieces.forEach(boardPiece => boardPiece.addEventListener('click', (e) => getBoardPiece(e)));
}

function getBoardPiece(e) {
    e.preventDefault();
    console.log(e.target.getAttribute('data-target'));
}

async function createTreasureObjectives(maxObjectives = 3) {
    const treasures = await CommunicationAbstractor.fetchFromServer('/treasures', 'GET').catch(ErrorHandler.handleError);
    const objectives = [];
    getObjectiveList(objectives, treasures, maxObjectives);
    objectives.forEach(objective => { createDiv('li', objective, document.querySelector(`#treasureList`)) });
}
function getObjectiveList(objectives, treasures, maxObjectives) {
    while (objectives.length < maxObjectives) {
        const randomObj = getRandomObjective(treasures);
        if (!objectives.includes(randomObj)) {
            objectives.push(randomObj);
        }
    }
    return objectives;
}
function getRandomObjective(treasures) {
    const randomIndex = Math.floor(Math.random() * treasures.treasures.length);
    return treasures.treasures[randomIndex];
}

function createDiv(elementName, inner, container) {
    const element = document.createElement(elementName);
    element.innerHTML = inner;
    container.appendChild(element);
}