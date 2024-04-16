import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import { loadFromStorage } from "./data-connector/local-storage-abstractor.js";
import { navigate } from "./universal.js";
import { TIMEOUTDELAY } from "./config.js";
const GAMEMAXTREASURES = await getActiveGameDetails(loadFromStorage('gameId')).then(response => response.description.numberOfTreasuresPerPlayer).catch(ErrorHandler.handleError);
const PLAYERNAME = localStorage.getItem('playerName');
const GAMEID = loadFromStorage('gameId');

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

let shove = {
    "destination": {
        "row": 1,
        "col": 0
    },
    "tile": {
        "walls": [
            true,
            false,
            true,
            false
        ],
        "treasure": null
    }
}

let move ={
    "destination": {
        "row": 0,
        "col": 0
    }
}

init();


function init() {
    generateBoard();
    createInitialEventListeners();
    createTreasureObjectives(GAMEMAXTREASURES);
    polling();
}

async function generateBoard() {
    const board = document.querySelector('#board');
    const boardBackground = document.querySelector('#background');
    const maze = await getMaze();
    for (const [rowIndex, row] of maze.maze.entries()) {
        for (const [cellIndex, cell] of row.entries()) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.coordinates =  `${rowIndex},${cellIndex}`;
            generateRandomTilesImg(square, cell.walls);
            addTreasuresToBoard(square, cell);
            board.appendChild(square);
        }
    }
    boardBackground.insertAdjacentHTML('beforeend', slideIndicators);
}

function generateRandomTilesImg(element, walls) {
    const wallTile = getWallImageId(walls);
    element.insertAdjacentHTML('beforeend', `<img src="assets/media/tiles/${wallTile}.png">`);

}

function createInitialEventListeners() {
    const button = document.querySelector('#leaveGameButton');
    button.addEventListener('click', () => leaveGame());
}

function getBoardPiece(e) {
    e.preventDefault();
    console.log(e.currentTarget.dataset.coordinates);
    shoveTile(e.currentTarget.dataset.coordinates)
}

async function createTreasureObjectives(maxObjectives = 5) {
    const treasures = await fetchTreasures().catch(ErrorHandler.handleError);
    const objectives = getObjectiveList(treasures, maxObjectives);
    console.log(objectives);
    displayPlayerObjectives(objectives);
}

async function fetchTreasures() {
    return CommunicationAbstractor.fetchFromServer("/treasures", "GET");
}

function getObjectiveList(treasures, maxObjectives) {
    const objectives = [];
    // when using the maxObjectives, the player will only have 3 objectives regardless of the value given to maxObjectives for some reason
    while (objectives.length < 5) {
        const randomObj = getRandomObjective(treasures);
        if (!objectives.includes(randomObj)) {
            objectives.push(randomObj);
        }
        /*if (objectives.length >= maxObjectives) {
            break;
        }*/
    }
    return objectives;
}

function getRandomObjective(treasures) {
    const randomIndex = Math.floor(Math.random() * treasures.treasures.length);
    return treasures.treasures[randomIndex];
}

/*function createDiv(elementName, inner, container) {
    const element = document.createElement(elementName);
    element.innerHTML = inner;
    container.appendChild(element);
}*/

function displayPlayerObjectives(objectives) {
    const $treasureList = document.querySelector("#treasureList");
    $treasureList.innerHTML = "";

    objectives.forEach(objective => {
        const objectiveNameFromAPI = objective.replace(/ /g, '_');
        const li = `<li>
                <img src="assets/media/treasures_cards/${objectiveNameFromAPI}.JPG" alt="${objective}">
            </li>`;
        $treasureList.insertAdjacentHTML("beforeend", li);
    });
}

async function polling() {
    await getActiveGameDetails(GAMEID)
        .then(response => {
            //setTimeout(refreshBoard, TIMEOUTDELAY);
            boardEventListeners();
            showTurn(response);
            DisplayObtainedTreasures();
            displayPlayers(response.description.players);
            //setTimeout(polling, TIMEOUTDELAY);
            console.log(`Lobby: ${response.description.players.length}/${response.description.maxPlayers}`);
        });
    const a = await getReachableLocations();
}

function displayPlayers(players) {
    const playerList = document.querySelector("#playerList");
    playerList.innerHTML = "";
    players.forEach(player => { playerList.insertAdjacentHTML('beforeend', `<li>${player}</li>`) });
}

async function getActiveGameDetails(gameId) {
    return await getAPIResponse(gameId, 'description=true&players=true&spareTile=true', 'GET');
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

async function getMaze() {
    return await getAPIResponse(GAMEID, 'description=false&maze=true', 'GET');
}

function getWallImageId(walls) {
    const wallConfigurations = {
        "true,false,false,true": 5, // left top corner
        "true,true,false,false": 6, // right top corner
        "false,false,true,true": 3, // left bottom corner
        "false,true,true,false": 4, // right bottom corner
        "true,false,true,false": 2, // straight horizontal
        "false,true,false,true": 0, // straight vertical
        "false,false,false,true": 7, // left side T
        "false,true,false,false": 9, // right side T
        "false,false,true,false": 1, // upside down T
        "true,false,false,false": 8, // T
    };
    return wallConfigurations[walls.toString()];
}

function addTreasuresToBoard(square, cell) {
    if (cell.treasure) {
        square.dataset.treasure = cell.treasure;
        const treasure = cell.treasure.replaceAll(' ', '_');
        square.insertAdjacentHTML('beforeend', `<img src="assets/media/treasure_cutouts/${treasure}.png" class="treasure">`);
    }
}

function refreshBoard() {
    const board = document.querySelector('#board');
    const boardBackground = document.querySelector('#background');
    board.innerHTML = "";
    boardBackground.innerHTML = "";
    generateBoard();
}

function showTurn(data) {
    const player = document.querySelector('#turnOrder');
    if (data.description.currentShovePlayer !== null) {
        player.innerHTML = `Current shove turn: ${data.description.currentShovePlayer}`;
    } else if (data.description.currentMovePlayer !== null){
        player.innerHTML = `Current move turn: ${data.description.currentMovePlayer}`;
    }
}

async function shoveTile(coordinates) {
    const gameDetails = await getActiveGameDetails(GAMEID);
    shove.destination.row = parseInt(coordinates[0]);
    shove.destination.col = parseInt(coordinates[2]);
    shove.tile = gameDetails.spareTile;
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/maze`, 'PATCH', shove).catch(ErrorHandler.handleError);
}

async function movePlayer(coordinates) {
    move.destination.row = coordinates[0];
    move.destination.col = coordinates[2];
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`, 'PATCH', move).catch(ErrorHandler.handleError);
}

async function getReachableLocations(){
    const playerDetails = await getPlayerDetails();
    const playerRow = playerDetails.player.location.row;
    const playerCol = playerDetails.player.location.col;
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/maze/locations/${playerRow}/${playerCol}`);
}

async function getPlayerDetails(){
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`);
}

function boardEventListeners(){
    const allBoardPieces = document.querySelectorAll('.square');
    allBoardPieces.forEach(boardPiece => {
            boardPiece.addEventListener('click', (e) => getBoardPiece(e));
        }
    );
}

async function DisplayObtainedTreasures(){
    const $obtainedTreasures = document.querySelector("#obtainedTreasures");
    $obtainedTreasures.innerHTML = "";
    const playerDetails = await getPlayerDetails();
    // playerDetails.player.foundTreasures.forEach(treasure => $obtainedTreasure.insertAdjacentHTML("beforeend", `<li>${treasure}</li>`))
    // playerDetails.player.foundTreasures.forEach(treasure => $obtainedTreasure.insertAdjacentHTML("beforeend", `<img src="assets/media/treasures_cards/${treasure}.JPG" alt="${treasure}"`))


    //static placeholder for now
    for (let i = 0; i < 5 ; i++) {
        const li = `<li>
                    <img src="assets/media/treasures_cards/Bag_of_Gold_Coins.JPG" alt="Bag of Gold Coins">
                </li>`;
        $obtainedTreasures.insertAdjacentHTML("beforeend", li);
    }
}