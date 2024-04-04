import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import { loadFromStorage } from "./data-connector/local-storage-abstractor.js";
import { navigate } from "./universal.js";
import { TIMEOUTDELAY } from "./config.js";

const GAMEMAXTREASURES = await getDescription(loadFromStorage("gameId")).then(response => response.description.numberOfTreasuresPerPlayer).catch(ErrorHandler.handleError);
const PLAYERNAME = localStorage.getItem("playerName");
const GAMEID = loadFromStorage("gameId");

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
    generateBoard();
    createEventListeners();
    createTreasureObjectives(GAMEMAXTREASURES);
    getPlayers();
    displayObtainedTreasures();
    displayMovableTile();
}

async function generateBoard() {
    const board = document.querySelector("#board");
    const boardBackground = document.querySelector("#boardBackground");
    const maze = await getMaze();
    console.log(maze);
    for (const row of maze.maze) {
        console.log(row);
        for (const cell of row) {
            const square = document.createElement("div");
            square.classList.add("square");
            generateRandomTilesImg(square, cell.walls);
            addTreasuresToBoard(square, cell);
            board.appendChild(square);
        }
    }

    /*
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
    }*/
    boardBackground.insertAdjacentHTML("beforeend", slideIndicators);
}

function generateRandomTilesImg(element, walls) {
    const wallTile = getWallImageId(walls);
    element.insertAdjacentHTML("beforeend", `<img src="assets/media/tiles/${wallTile}.png">`);

}

function createEventListeners() {
    const button = document.querySelector("button");
    const allBoardPieces = document.querySelectorAll(".square img");
    button.addEventListener("click", () => leaveGame());
    allBoardPieces.forEach(boardPiece => boardPiece.addEventListener("click", (e) => getBoardPiece(e)));
}

function getBoardPiece(e) {
    e.preventDefault();
    console.log(e.currentTarget.parentElement.dataset.target);
}

async function createTreasureObjectives(maxObjectives = 3) {
    const treasures = await fetchTreasures().catch(ErrorHandler.handleError);
    const objectives = getObjectiveList(treasures, maxObjectives);
    displayPlayerObjectives(objectives);
}

async function fetchTreasures() {
    return CommunicationAbstractor.fetchFromServer("/treasures", "GET");
}

function getObjectiveList(treasures, maxObjectives) {
    const objectives = [];
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

// needs further implementation after board objectives work
function displayObtainedTreasures() {
    const $obtainedTreasures = document.querySelector("#obtainedTreasures");
    $obtainedTreasures.innerHTML = "";

    //static placeholder for now
    for (let i = 0; i < 3 ; i++) {
        const li = `<li>
                    <img src="assets/media/treasures_cards/Bag_of_Gold_Coins.JPG" alt="Bag of Gold Coins">
                </li>`;
        $obtainedTreasures.insertAdjacentHTML("beforeend", li);
    }

}

function displayMovableTile() {
    const $movableTile = document.querySelector("#movableTile");
    $movableTile.innerHTML = "";

    const img = `<img src="../media/scanned_tiles/Straight_tile.JPG" alt="Bag of Gold Coins">`;
    $movableTile.insertAdjacentHTML("beforeend", img);
}

/*function createDiv(elementName, inner, container) {
    const element = document.createElement(elementName);
    element.innerHTML = inner;
    container.appendChild(element);
}*/

async function getPlayers() {
    await getDescription(GAMEID)
        .then(response => {
            displayPlayers(response.description.players);
            setTimeout(getPlayers, TIMEOUTDELAY);
            console.log(`Lobby: ${response.description.players.length}/${response.description.maxPlayers}`);
        });
}

function displayPlayers(players) {
    const playerList = document.querySelector("#playerList");
    playerList.innerHTML = "";
    players.forEach(player => {
        playerList.insertAdjacentHTML("beforeend", `<li>${player}</li>`);
    });
}

async function getDescription(gameId) {
    return await getAPIResponse(gameId, "description=true", "GET");
}


async function leaveGame() {
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`, "DELETE")
        .then(response => {
            console.log(response);
            navigate("createOrJoin.html");
        }).catch(ErrorHandler.handleError);
}

async function getAPIResponse(path, parameters, method) {
    return await CommunicationAbstractor.fetchFromServer(`/games/${path}?${parameters}`, `${method}`).catch(ErrorHandler.handleError);
}

async function getMaze() {
    return await getAPIResponse(GAMEID, "description=false&maze=true", "GET");
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
        "true,false,false,false": 8 // T
    };
    return wallConfigurations[walls.toString()];
}

function addTreasuresToBoard(square, cell) {
    if (cell.treasure) {
        square.dataset.treasure = cell.treasure;
        const treasure = cell.treasure.replace(" ", "_");
        square.insertAdjacentHTML("beforeend", `<img src="assets/media/scanned_tiles/${treasure}_tile.jpg" class="treasure">`);
    }
}