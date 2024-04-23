import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import { loadFromStorage } from "./data-connector/local-storage-abstractor.js";
import { navigate } from "./universal.js";
import { TIMEOUTDELAY } from "./config.js";

const PLAYERNAME = localStorage.getItem("playerName");
const GAMEID = loadFromStorage("gameId");
const GAMEMAXTREASURES = await getActiveGameDetails(GAMEID).then(response => response.description.numberOfTreasuresPerPlayer).catch(ErrorHandler.handleError);

const shove = {
    "destination": {
        "row": 1,
        "col": 0
    },
    "tile": null
};

init();


async function init() {
    displayWhoYouAre();
    boardEventListeners();
    await generateBoard();
    createInitialEventListeners();
    createTreasureObjectives(GAMEMAXTREASURES);
    polling();
    getAndDisplaySpareTile();
    rotateSpareTileButton();
    refreshBoard();

}

async function generateBoard() {
    const board = document.querySelector("#board");
    const maze = await getMaze();
    for (const [rowIndex, row] of maze.maze.entries()) {
        for (const [cellIndex, cell] of row.entries()) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.dataset.coordinates = `${rowIndex},${cellIndex}`;
            generateRandomTilesImg(square, cell.walls);
            addTreasuresToBoard(square, cell);
            if (cell.players !== undefined) {
                addPlayerPawn(square, cell.players[0]);
            }

            board.appendChild(square);
        }
    }
}

function generateRandomTilesImg(element, walls) {
    const wallTile = getWallImageId(walls);
    element.insertAdjacentHTML("beforeend", `<img src="assets/media/tiles/${wallTile}.webp" alt="wall tile">`);

}

function createInitialEventListeners() {
    const $leaveButton = document.querySelector("#leaveGameButton");
    $leaveButton.addEventListener("click", () => leaveGame());

    const $slideIndicators = document.querySelectorAll(".slide-indicator");
    $slideIndicators.forEach(indicator => {
        indicator.addEventListener("click", slideSpareTile);
    });

}

async function createTreasureObjectives(maxObjectives = 5) {
    const treasures = await fetchTreasures().catch(ErrorHandler.handleError);
    const objectives = getObjectiveList(treasures, maxObjectives);
    console.log(objectives);
    displayCardsOfPlayerObjectives(objectives);
    displayPlayerObjective(objectives[0]); // Display the first objective
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

// not showing correct objectives
async function displayCardsOfPlayerObjectives(objectives) {
    const $treasureList = document.querySelector("#treasureList");
    $treasureList.innerHTML = "";

    const playerDetails = await getPlayerDetails();
    const currentPlayerObjective = playerDetails.player.objective;

    // Filter objectives to only include the current objective for the player
    const currentPlayerObjectiveNameFromAPI = currentPlayerObjective.replace(/ /g, "_");

    // Display the current objective first
    const li = `<li>
            <img src="assets/media/treasures_cards/${currentPlayerObjectiveNameFromAPI}.webp" alt="${currentPlayerObjective}">
        </li>`;
    $treasureList.insertAdjacentHTML("beforeend", li);
}

function displayPlayerObjective(objective) {
    const $objective = document.querySelector("#objective");
    $objective.textContent = objective;
}

async function getObjectiveIndex() {
// Get the player's objective and display it
    const playerDetails = await getPlayerDetails();
    displayPlayerObjective(playerDetails.player.objective);
}


async function polling() {
    const gameDetails = await getActiveGameDetails(GAMEID);
    boardEventListeners();
    // Check if there are no players in the game
    if (gameDetails.description.players.length === 0) {
        // Delete the game and navigate to the create or join page
        await deleteGame();
        return;
    }
    refreshBoard();

    getObjectiveIndex();
    showTurn(gameDetails);
    displayObtainedTreasures();
    displayPlayerList(gameDetails.description.players);

    setTimeout(polling, TIMEOUTDELAY);
    console.log(`Lobby: ${gameDetails.description.players.length}/${gameDetails.description.maxPlayers}`);

}

async function deleteGame() {
    await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}`, "DELETE")
        .then(response => {
            console.log("Game deleted:", response);
        }).catch(ErrorHandler.handleError);
}

function displayPlayerList(players) {
    const playerList = document.querySelector("#playerList");
    playerList.innerHTML = "";
    players.forEach((player, index) => {
        const randomColor = pawnColors[index % pawnColors.length]; // Assign a random color to each player
        const playerListItem = `<li>${player} <img src="assets/media/player_cutouts/${randomColor}_pawn.webp" alt="${randomColor} pawn"></li>`;
        playerList.insertAdjacentHTML("beforeend", playerListItem);
    });
}

async function getActiveGameDetails(gameId) {
    return await getAPIResponse(gameId, "description=true&players=true&spareTile=true&", "GET");
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
        const treasure = cell.treasure.replaceAll(" ", "_");
        square.insertAdjacentHTML("beforeend", `<img src="assets/media/treasure_cutouts/${treasure}.webp" class="treasure">`);
    }
}

async function refreshBoard() {
    const board = document.querySelector("#board");
    const boardBackground = document.querySelector("#background");

    const maze = await getMaze();

    board.innerHTML = "";
    boardBackground.innerHTML = "";
    const locations = await getReachableLocations();
    console.log(locations.locations);
    for (const [rowIndex, row] of maze.maze.entries()) {
        for (const [cellIndex, cell] of row.entries()) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.dataset.coordinates = `${rowIndex},${cellIndex}`;
            generateRandomTilesImg(square, cell.walls);
            addTreasuresToBoard(square, cell);
            if (cell.players !== undefined) {
                await addPlayerPawn(square, cell.players[0]);
            }
            if (locations.locations.some(location => location.row === rowIndex && location.col === cellIndex)) {
                square.classList.add("reachable");
            }
            board.appendChild(square);
        }
    }
    refreshBoardEventListeners();
    const SPARETILE = await getActiveGameDetails(GAMEID).then(response => response.spareTile).catch(ErrorHandler.handleError);
    shove.tile = SPARETILE;
}

function refreshBoardEventListeners() {
    const allBoardPieces = document.querySelectorAll(".square");
    allBoardPieces.forEach(boardPiece => {
            boardPiece.addEventListener("click", (e) => getBoardPiece(e));
        }
    );
}

function showTurn(data) {
    const player = document.querySelector("#turnOrder");
    if (data.description.currentShovePlayer !== null) {
        player.innerHTML = `Current shove turn: ${data.description.currentShovePlayer}`;
    } else {
        player.innerHTML = `Current move turn: ${data.description.currentMovePlayer}`;
    }
}

function shoveTile(coordinates) {
    shove.destination.row = parseInt(coordinates[0]);
    shove.destination.col = parseInt(coordinates[1]);
    console.log(shove);
    return CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/maze`, "PATCH", shove).catch(ErrorHandler.handleError);
}

function movePlayer(row, col) {
    const destination = { row, col };
    return CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}/location`, "PATCH", { destination });
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
    const allBoardPieces = document.querySelectorAll(".square");
    console.log("Found", allBoardPieces.length, "board pieces.");
    allBoardPieces.forEach(boardPiece => {
            boardPiece.addEventListener("click", (e) => getBoardPiece(e));
        }
    );
}

function getBoardPiece(e) {
    console.log("Board piece clicked:", e.currentTarget);
    e.preventDefault();
    const coordinates = e.currentTarget.dataset.coordinates.split(","); // Extract row and column coordinates
    const row = parseInt(coordinates[0]);
    const col = parseInt(coordinates[1]);
    console.log(`Clicked coordinates: Row ${row}, Column ${col}`);

    doTurn(row, col);
}

async function doTurn(row, col){
    const gameDetails = await getActiveGameDetails(GAMEID);
    if (gameDetails.description.currentShovePlayer === PLAYERNAME) {
        shoveTile([row, col])
            .then(response => {
                console.log("Shove successful:", response);
                // Handle any further actions after successful shove
            })
            .catch(error => {
                console.error("Error shoving tile:", error);
                // Handle error if shove is unsuccessful
            });
    } else if (gameDetails.description.currentMovePlayer === PLAYERNAME) {
        movePlayer(row, col)
            .then(response => {
                console.log("Move successful:", response);
                // Handle any further actions after successful move
            })
            .catch(error => {
                console.error("Error moving player:", error);
                // Handle error if move is unsuccessful
            });
    } else {
        console.log("It's not your turn to move.");
        // Optionally, you can provide some feedback to the user indicating that it's not their turn
    }
}

async function displayObtainedTreasures() {
    const $obtainedTreasures = document.querySelector("#obtainedTreasures");
    $obtainedTreasures.innerHTML = "";
    const playerDetails = await getPlayerDetails();

    playerDetails.player.foundTreasures.forEach(treasure => {
        const treasureName = treasure.replaceAll(" ", "_");
        $obtainedTreasures.insertAdjacentHTML("beforeend", `<img src="assets/media/treasure_cutouts/${treasureName}.webp" alt="${treasure}">`);
    });
}

async function getAndDisplaySpareTile() {
    const $spareTile = document.querySelector("#spareTile");
    $spareTile.innerHTML = "";

    const gameDetails = await getActiveGameDetails(GAMEID);

    const wallTile = getWallImageId(gameDetails.spareTile.walls);

    $spareTile.insertAdjacentHTML("beforeend", `<img src="assets/media/tiles/${wallTile}.webp" alt="wall tile">`);
}

function rotateSpareTileButton() {
    const $rotateSpareTileImage = document.querySelector("#rotateSpareTileButton");
    $rotateSpareTileImage.addEventListener("click", rotateSpareTileClockwise);
}

function rotateSpareTileClockwise() {
    const $spareTile = document.querySelector("#spareTile img");
    const currentRotation = parseFloat($spareTile.dataset.rotation) || 0;
    const newRotation = (currentRotation + 90) % 360;

    $spareTile.style.transform = `rotate(${newRotation}deg)`;

    $spareTile.dataset.rotation = newRotation.toString();

    shove.tile.walls = rotateWallsClockWise(shove.tile.walls);
}

function rotateWallsClockWise(walls) {
    // Rotate the walls clockwise: [top, right, bottom, left]
    const temp = walls[0]; // Store the top wall
    walls[0] = walls[3]; // Right wall becomes top
    walls[3] = walls[2]; // Bottom wall becomes right
    walls[2] = walls[1]; // Left wall becomes bottom
    walls[1] = temp; // Top wall becomes left
    return walls;
}

function getRowAndColumn(classList) {
    const slideIndicators = {
        "slide-indicator-top-left": { row: 0, col: 1 },
        "slide-indicator-top-mid": { row: 0, col: 3 },
        "slide-indicator-top-right": { row: 0, col: 5 },
        "slide-indicator-left-top": { row: 1, col: 0 },
        "slide-indicator-left-mid": { row: 3, col: 0 },
        "slide-indicator-left-bottom": { row: 5, col: 0 },
        "slide-indicator-right-top": { row: 1, col: 6 },
        "slide-indicator-right-mid": { row: 3, col: 6 },
        "slide-indicator-right-bottom": { row: 5, col: 6 },
        "slide-indicator-bottom-left": { row: 6, col: 1 },
        "slide-indicator-bottom-mid": { row: 6, col: 3 },
        "slide-indicator-bottom-right": { row: 6, col: 5 }
    };
    const indicator = Object.keys(slideIndicators).find(key => classList.contains(key));
    if (indicator) {
        return slideIndicators[indicator];
    } else {
        return { row: -1, col: -1 }; // Invalid indicator
    }
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
        console.error("Invalid slide indicator");
    }
}

async function shiftTiles(direction, row, col) {
    if (direction === "row") {
        for (let i = 6; i > col; i--) {
            const targetCoordinates = `${row},${i}`;
            const sourceCoordinates = `${row},${i - 1}`;
            await moveTile(targetCoordinates, sourceCoordinates);
        }
    } else if (direction === "column") {
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
    const targetImg = targetSquare.querySelector("img");
    const sourceImg = sourceSquare.querySelector("img");

    targetSquare.dataset.treasure = sourceSquare.dataset.treasure;
    targetImg.src = sourceImg.src;
    sourceSquare.removeAttribute("data-treasure");
    sourceImg.remove();
}

function getClassDirection(classList) {
    if (classList.contains("slide-indicator-left") || classList.contains("slide-indicator-right")) {
        return "row";
    } else if (classList.contains("slide-indicator-top") || classList.contains("slide-indicator-bottom")) {
        return "column";
    }
}

const pawnColors = ["blue", "green", "red", "yellow"];

async function addPlayerPawn(square, playerName) {
    const playerColor = await getPlayerColor(playerName);
    //console.log(`${playerName} has color: ${playerColor}`);

    const playerPawn = document.createElement("img");
    playerPawn.src = `assets/media/player_cutouts/${playerColor}_pawn.webp`;
    playerPawn.alt = `${playerColor} pawn`;
    playerPawn.classList.add("player-pawn");
    //console.log(playerPawn);
    square.appendChild(playerPawn);
}

async function getPlayerColor(playerName) {
    return await getActiveGameDetails(GAMEID)
        .then(response => {
            const players = response.description.players;
            const playerIndex = players.findIndex(player => player === playerName);
            return pawnColors[playerIndex % pawnColors.length];
        });
}

function displayWhoYouAre() {
    const $playerName = document.querySelector("#joinedPlayer");
    $playerName.innerHTML = `${PLAYERNAME}`;
}