import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import {loadFromStorage} from "./data-connector/local-storage-abstractor.js";
import {navigate} from "./universal.js";
import {TIMEOUTDELAY} from "./config.js";

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

let move = {
    "destination": {
        "row": 0,
        "col": 0
    }
}

init();


async function init() {
    await generateBoard();
    createInitialEventListeners();
    createTreasureObjectives(GAMEMAXTREASURES);
    polling();
    getAndDisplaySpareTile();
    rotateSpareTileButton();
}

async function generateBoard() {
    const board = document.querySelector('#board');
    //const boardBackground = document.querySelector('#background');
    const maze = await getMaze();
    for (const [rowIndex, row] of maze.maze.entries()) {
        for (const [cellIndex, cell] of row.entries()) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.coordinates = `${rowIndex},${cellIndex}`;
            generateRandomTilesImg(square, cell.walls);
            addTreasuresToBoard(square, cell);
            if (cell.players != undefined) {
                addPlayerPawn(square, cell.players[0]);
            }

            board.appendChild(square);
        }
    }
    //boardBackground.insertAdjacentHTML('beforeend', slideIndicators);
}

function generateRandomTilesImg(element, walls) {
    const wallTile = getWallImageId(walls);
    element.insertAdjacentHTML('beforeend', `<img src="assets/media/tiles/${wallTile}.png" alt="wall tile">`);

}

function createInitialEventListeners() {
    const $leaveButton = document.querySelector('#leaveGameButton');
    $leaveButton.addEventListener('click', () => leaveGame());

    const $slideIndicators = document.querySelectorAll('.slide-indicator');
    $slideIndicators.forEach(indicator => {
        indicator.addEventListener('click', slideSpareTile);
    });

}

function getBoardPiece(e) {
    e.preventDefault();
    const coordinates = e.currentTarget.dataset.coordinates.split(','); // Extract row and column coordinates
    const row = parseInt(coordinates[0]);
    const col = parseInt(coordinates[1]);
    console.log(`Clicked coordinates: Row ${row}, Column ${col}`);

    // Call getPlayerNameAtCoordinates with the row and column coordinates
    getPlayerNameAtCoordinates(row, col)
        .then(playerName => {
            if (playerName) {
                console.log(`Player name at coordinates [${row},${col}]: ${playerName}`);
            } else {
                console.log(`No player found at coordinates [${row},${col}]`);
            }
        })
        .catch(error => {
            console.error("Error retrieving player name:", error);
        });
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
    while (objectives.length < maxObjectives) {
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
            displayPlayerList(response.description.players);
            //setTimeout(polling, TIMEOUTDELAY);
            console.log(`Lobby: ${response.description.players.length}/${response.description.maxPlayers}`);
        });
    const a = await getReachableLocations();
}

function displayPlayerList(players) {
    const playerList = document.querySelector("#playerList");
    playerList.innerHTML = "";
    players.forEach((player, index) => {
        const randomColor = pawnColors[index % pawnColors.length]; // Assign a random color to each player
        //const playerListItem = `<li>${player} <img src="assets/media/player_cutouts/${randomColor}_pawn.png" alt="${randomColor} pawn"></li>`;
        const playerListItem = `<li>${player} <img src="assets/media/player_cutouts/${randomColor}_pawn.png" alt="${randomColor} pawn"></li>`;
        playerList.insertAdjacentHTML('beforeend', playerListItem);
    });
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

async function refreshBoard() {
    const board = document.querySelector('#board');
    const boardBackground = document.querySelector('#background');
    board.innerHTML = "";
    boardBackground.innerHTML = "";
    await generateBoard();
}

function showTurn(data) {
    const player = document.querySelector('#turnOrder');
    if (data.description.currentShovePlayer !== null) {
        player.innerHTML = `Current shove turn: ${data.description.currentShovePlayer}`;
    } else if (data.description.currentMovePlayer !== null) {
        player.innerHTML = `Current move turn: ${data.description.currentMovePlayer}`;
    }
}

async function shoveTile(coordinates) {
    const gameDetails = await getActiveGameDetails(GAMEID);
    shove.destination.row = parseInt(coordinates[0]);
    shove.destination.col = parseInt(coordinates[1]);
    shove.tile = gameDetails.spareTile;
    console.log(shove);
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/maze`, 'PATCH', shove).catch(ErrorHandler.handleError);
}

async function movePlayer(coordinates) {
    move.destination.row = coordinates[0];
    move.destination.col = coordinates[1];
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`, 'PATCH', move).catch(ErrorHandler.handleError);
}

async function getReachableLocations() {
    const playerDetails = await getPlayerDetails();
    const playerRow = playerDetails.player.location.row;
    const playerCol = playerDetails.player.location.col;
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/maze/locations/${playerRow}/${playerCol}`);
}

async function getPlayerDetails() {
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`);
}

function boardEventListeners() {
    const allBoardPieces = document.querySelectorAll('.square');
    allBoardPieces.forEach(boardPiece => {
            boardPiece.addEventListener('click', (e) => getBoardPiece(e));
        }
    );
}

async function DisplayObtainedTreasures() {
    const $obtainedTreasures = document.querySelector("#obtainedTreasures");
    $obtainedTreasures.innerHTML = "";
    const playerDetails = await getPlayerDetails();
    // playerDetails.player.foundTreasures.forEach(treasure => $obtainedTreasure.insertAdjacentHTML("beforeend", `<li>${treasure}</li>`))
    // playerDetails.player.foundTreasures.forEach(treasure => $obtainedTreasure.insertAdjacentHTML("beforeend", `<img src="assets/media/treasures_cards/${treasure}.JPG" alt="${treasure}"`))


    //static placeholder for now
    for (let i = 0; i < 5; i++) {
        const li = `<li>
                    <img src="/src/assets/media/treasures_cards/Bat.JPG" alt="Bag of Gold Coins">
                </li>`;
        $obtainedTreasures.insertAdjacentHTML("beforeend", li);
    }
}

async function getAndDisplaySpareTile() {
    const $spareTile = document.querySelector('#spareTile');
    $spareTile.innerHTML = "";

    const gameDetails = await getActiveGameDetails(GAMEID);

    const wallTile = getWallImageId(gameDetails.spareTile.walls);

    $spareTile.insertAdjacentHTML('beforeend', `<img src="assets/media/tiles/${wallTile}.png" alt="wall tile">`);

    console.log(gameDetails);
}

function rotateSpareTileButton() {
    const $rotateSpareTileImage = document.querySelector('#rotateSpareTileButton');
    $rotateSpareTileImage.addEventListener('click', rotateSpareTileClockwise);
}

function rotateSpareTileClockwise() {
    const $spareTile = document.querySelector('#spareTile img');
    const currentRotation = parseFloat($spareTile.dataset.rotation) || 0;
    const newRotation = (currentRotation + 90) % 360;

    $spareTile.style.transform = `rotate(${newRotation}deg)`;

    $spareTile.dataset.rotation = newRotation.toString();
}

function getRowAndColumn(classList) {
    if(classList.contains('slide-indicator-top-left')) {
        return {row: 0, col: 1};
    }
    if(classList.contains('slide-indicator-top-mid')) {
        return {row: 0, col: 3};
    }
    if(classList.contains('slide-indicator-top-right')) {
        return {row: 0, col: 5};
    }
    if(classList.contains('slide-indicator-left-top')) {
        return {row: 1, col: 0};
    }
    if(classList.contains('slide-indicator-left-mid')) {
        return {row: 3, col: 0};
    }
    if(classList.contains('slide-indicator-left-bottom')) {
        return {row: 5, col: 0};
    }
    if(classList.contains('slide-indicator-right-top')) {
        return {row: 1, col: 6};
    }
    if(classList.contains('slide-indicator-right-mid')) {
        return {row: 3, col: 6};
    }
    if(classList.contains('slide-indicator-right-bottom')) {
        return {row: 5, col: 6};
    }
    if(classList.contains('slide-indicator-bottom-left')) {
        return {row: 6, col: 1};
    }
    if(classList.contains('slide-indicator-bottom-mid')) {
        return {row: 6, col: 3};
    }
    if(classList.contains('slide-indicator-bottom-right')) {
        return {row: 6, col: 5};
    }
    return { row: -1, col: -1 }; // Invalid indicator
}

async function slideSpareTile(e) {
    const classList = e.currentTarget.classList;
    const { row, col } = getRowAndColumn(classList);
    const direction = getClassDirection(classList);
    if (row !== -1 && col !== -1) {
        await shoveTile([row, col]);
        await shiftTiles(direction, [row, col]);
        await getAndDisplaySpareTile();
        await refreshBoard();
    } else {
        console.error('Invalid slide indicator');
    }
}

async function shiftTiles(direction, row, col) {
    if (direction === 'row') {
        for (let i = 6; i > col; i--) {
            const targetCoordinates = `${row},${i}`;
            const sourceCoordinates = `${row},${i - 1}`;
            await moveTile(targetCoordinates, sourceCoordinates);
        }
    } else if (direction === 'column') {
        for (let i = 6; i > row; i--) {
            const targetCoordinates = `${i},${col}`;
            const sourceCoordinates = `${i - 1},${col}`;
            await moveTile(targetCoordinates, sourceCoordinates);
        }
    }
}

async function moveTile(targetCoordinates, sourceCoordinates) {
    const targetSquare = document.querySelector(`.square[data-coordinates="${targetCoordinates}"]`);
    const sourceSquare = document.querySelector(`.square[data-coordinates="${sourceCoordinates}"]`);
    const targetImg = targetSquare.querySelector('img');
    const sourceImg = sourceSquare.querySelector('img');

    targetSquare.dataset.treasure = sourceSquare.dataset.treasure;
    targetImg.src = sourceImg.src;
    sourceSquare.removeAttribute('data-treasure');
    sourceImg.remove();
}

function getClassDirection(classList) {
    if (classList.contains('slide-indicator-left') || classList.contains('slide-indicator-right')) {
        return 'row';
    } else if (classList.contains('slide-indicator-top') || classList.contains('slide-indicator-bottom')) {
        return 'column';
    }
}


const pawnColors = ['blue', 'green', 'red', 'yellow'];

async function addPlayerPawn(square, playerName) {
    const playerColor = await getPlayerColor(playerName);
    console.log(`${playerName} has color: ${playerColor}`);
    const playerPawn = document.createElement('img');
    playerPawn.src = `assets/media/player_cutouts/${playerColor}_pawn.png`;
    playerPawn.alt = `${playerColor} pawn`;
    playerPawn.classList.add('player-pawn');
    console.log(playerPawn);
    square.appendChild(playerPawn);
}

async function getPlayerColor(playerName) {
    return await getActiveGameDetails(GAMEID)
        .then(response => {
            const playerIndex = Object.keys(response.players).indexOf(playerName);
            console.log(pawnColors[playerIndex]);
            return pawnColors[playerIndex];
        })
}

async function getPlayerNameAtCoordinates(row, col) {
    const gameDetails = await getActiveGameDetails(GAMEID);
    const players = gameDetails.description.playerName;

    for (const player of players) {
        const playerDetails = await getPlayerDetails(player);
        const playerRow = playerDetails.location.row;
        const playerCol = playerDetails.location.col;

        if (playerRow === row && playerCol === col) {
            return playerDetails.name;
        }
    }
    return null;
}