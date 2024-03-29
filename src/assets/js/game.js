import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import { loadFromStorage } from "./data-connector/local-storage-abstractor.js";
import { navigate } from "./universal.js";
const GAMEMAXTREASURES = await getDescription(loadFromStorage('gameId')).then(response => response.description.numberOfTreasuresPerPlayer).catch(ErrorHandler.handleError);
const PLAYERNAME = localStorage.getItem('playerName');
const GAMEID = loadFromStorage('gameId');
init();


function init() {
    generateBoard(7, 7);
    createEventListeners();
    createTreasureObjectives(GAMEMAXTREASURES);
    fillInPlayerList();
    console.log(PLAYERNAME);
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
}

function generateRandomTilesImg(element) {
    const randomIndex = Math.floor(Math.random() * 6);
    element.insertAdjacentHTML('beforeend', `<img src="assets/media/tiles/${randomIndex}.png">`);

}

function createEventListeners() {
    const button = document.querySelector('button');
    const allBoardPieces = document.querySelectorAll('.square img');
    button.addEventListener('click', () => leaveGame());
    allBoardPieces.forEach(boardPiece => boardPiece.addEventListener('click', (e) => getBoardPiece(e)));
}

function getBoardPiece(e) {
    e.preventDefault();
    console.log(e.currentTarget.parentElement.dataset.target);
}

async function createTreasureObjectives(maxObjectives = 5) {
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

//TODO: implement polling until max players are reached
async function fillInPlayerList() {
    const playerList = document.querySelector("#playerList");
    const players = await getDescription(GAMEID).then(response => response.description.players);
    players.forEach(player => { playerList.insertAdjacentHTML('beforeend', `<li>${player}</li>`) });
}

async function getDescription(gameId) {
    return await CommunicationAbstractor.fetchFromServer(`/games/${gameId}?description=true`, 'GET').catch(ErrorHandler.handleError);
}

async function leaveGame(){
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`, 'DELETE')
    .then(response => {
        console.log(response);
        navigate('createOrJoin.html');
    }).catch(ErrorHandler.handleError);
}