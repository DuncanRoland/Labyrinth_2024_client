import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import { loadFromStorage } from "./data-connector/local-storage-abstractor.js";
import { navigate } from "./universal.js";
import { TIMEOUTDELAY } from "./config.js";
const GAMEMAXTREASURES = await getDescription(loadFromStorage('gameId')).then(response => response.description.numberOfTreasuresPerPlayer).catch(ErrorHandler.handleError);
const PLAYERNAME = localStorage.getItem('playerName');
const GAMEID = loadFromStorage('gameId');
const BOARDSIZE = 7;

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

init();


function init() {
    generateBoard(BOARDSIZE, BOARDSIZE);
    createEventListeners();
    createTreasureObjectives(GAMEMAXTREASURES);
    getPlayers();
    console.log(PLAYERNAME);
}

function generateBoard(maxColumns, maxRows) {
    const board = document.querySelector('#board');
    const boardBackground = document.querySelector('#boardBackground');
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
    boardBackground.insertAdjacentHTML('beforeend', slideIndicators);
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
async function getPlayers() {
    await getDescription(GAMEID)
        .then(response => {
            displayPlayers(response.description.players);
            if (response.description.players.length < response.description.maxPlayers) {
                setTimeout(getPlayers, TIMEOUTDELAY);
                console.log(`Lobby: ${response.description.players.length}/${response.description.maxPlayers}`)
            }
        });
}

function displayPlayers(players) {
    const playerList = document.querySelector("#playerList");
    playerList.innerHTML = "";
    players.forEach(player => { playerList.insertAdjacentHTML('beforeend', `<li>${player}</li>`) });
}

async function getDescription(gameId) {
    return await getAPIResponse(gameId, 'description=true', 'GET');
}

async function leaveGame() {
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`, 'DELETE')
        .then(response => {
            console.log(response);
            navigate('createOrJoin.html');
        }).catch(ErrorHandler.handleError);
}

async function getAPIResponse(path, parameters, method) {
    return await CommunicationAbstractor.fetchFromServer(`/games/${path}?${parameters}`, `${method}`).catch(ErrorHandler.handleError);
}