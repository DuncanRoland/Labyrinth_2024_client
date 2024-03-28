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
            generateRandomTilesImg(square);
            square.setAttribute('data-target', `${columns},${rows}`);
            column.appendChild(square);
        }
    }
    const boardBackground = document.querySelector('#boardBackground');
    const slideIndicators = `
        <div class="slide-indicator slide-indicator-top-left"></div>
        <div class="slide-indicator slide-indicator-top-mid"></div>
        <div class="slide-indicator slide-indicator-top-right"></div>
        <div class="slide-indicator slide-indicator-left-top"></div>
        <div class="slide-indicator slide-indicator-left-mid"></div>
        <div class="slide-indicator slide-indicator-left-bottom"></div>
        <div class="slide-indicator slide-indicator-bottom-left"></div>
        <div class="slide-indicator slide-indicator-bottom-mid"></div>
        <div class="slide-indicator slide-indicator-bottom-right"></div>
        <div class="slide-indicator slide-indicator-right-top"></div>
        <div class="slide-indicator slide-indicator-right-mid"></div>
        <div class="slide-indicator slide-indicator-right-bottom"></div>
    `;
    boardBackground.insertAdjacentHTML('beforeend', slideIndicators);
}

function generateRandomTilesImg(element) {
    const randomIndex = Math.floor(Math.random() * 6);
    element.insertAdjacentHTML('beforeend', `<img src="assets/media/tiles/${randomIndex}.png">`);

}

function createEventListeners() {
    const button = document.querySelector('button');
    const allBoardPieces = document.querySelectorAll('.square img');
    button.addEventListener('click', () => navigate("index.html"));
    allBoardPieces.forEach(boardPiece => boardPiece.addEventListener('click', (e) => getBoardPiece(e)));
}

function getBoardPiece(e) {
    e.preventDefault();
    console.log(e.currentTarget.parentElement.dataset.target);
}

async function createTreasureObjectives(maxObjectives = 3) {
    const treasures = await CommunicationAbstractor.fetchFromServer('/treasures', 'GET').catch(ErrorHandler.handleError);
    const objectives = [];

    const $treasureList = document.querySelector("#treasureList");
    $treasureList.innerHTML = "";

    getObjectiveList(objectives, treasures, maxObjectives);

    objectives.forEach(objective => {
        const objectiveNameFromAPI = objective.replace(/ /g, '_');

        const li = `<li>
                    <img src="assets/media/treasures_cards/${objectiveNameFromAPI}.JPG">
                </li>`;
        $treasureList.insertAdjacentHTML("beforeend", li);
    });
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

