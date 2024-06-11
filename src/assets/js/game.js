// Import necessary modules and constants
import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import { loadFromStorage } from "./data-connector/local-storage-abstractor.js";
import { navigate } from "./universal.js";
import { TIMEOUTDELAY } from "./config.js";

// Retrieve player name and game ID from local storage
const PLAYERNAME = localStorage.getItem("playerName");
const GAMEID = loadFromStorage("gameId");

// Define the initial shove object
const shove = {
    "destination": {
        "row": 1,
        "col": 0
    },
    "tile": null
};


init();

// Asynchronous function to initialize the game
async function init() {
    displayWhoYouAre(); // Display the current player's name
    boardEventListeners(); // Add event listeners to the board
    await polling(); // Start polling for game updates
    rotateSpareTileButton(); // Add event listener to the rotate spare tile button
    createInitialEventListeners(); // Add initial event listeners
}

// Function to generate a random tile image
function generateRandomTilesImg(element, walls) {
    const wallTile = getWallImageId(walls); // Get the wall image ID based on the wall configuration
    element.insertAdjacentHTML("beforeend", `<img src="assets/media/tiles/${wallTile}.webp" alt="wall tile">`);
}

// Function to create initial event listeners
function createInitialEventListeners() {
    const $leaveButton = document.querySelector("#leaveGameButton"); // Select the leave game button
    $leaveButton.addEventListener("click", () => leaveGame()); // Add event listener to the leave game button

    const $slideIndicators = document.querySelectorAll(".slide-indicator"); // Select all slide indicators
    $slideIndicators.forEach(indicator => {
        indicator.addEventListener("click", slideSpareTile); // Add event listener to each slide indicator
    });
}

// Asynchronous function to display the cards of the player's objectives
async function displayCardsOfPlayerObjectives() {
    const $treasureList = document.querySelector("#treasureList"); // Select the treasure list element
    $treasureList.innerHTML = ""; // Clear the treasure list

    const playerDetails = await getPlayerDetails(); // Get the player details
    const currentPlayerObjective = playerDetails.player.objective; // Get the current player's objective

    // Filter objectives to only include the current objective for the player
    const currentPlayerObjectiveNameFromAPI = currentPlayerObjective.replace(/ /g, "_");

    // Display the current objective first
    const li = `<li>
            <img src="assets/media/treasures_cards/${currentPlayerObjectiveNameFromAPI}.webp" alt="${currentPlayerObjective}">
        </li>`;
    $treasureList.insertAdjacentHTML("beforeend", li);
}

// Function to display the player's objective
function displayPlayerObjective(objective) {
    const $objective = document.querySelector("#objective"); // Select the objective element
    $objective.innerHTML = objective; // Set the objective element's inner HTML to the objective
}

// Asynchronous function to get the index of the player's objective
async function getObjectiveIndex() {
    const playerDetails = await getPlayerDetails(); // Get the player details
    displayPlayerObjective(playerDetails.player.objective); // Display the player's objective
}

// Asynchronous function to start polling for game updates
async function polling() {
    const gameDetails = await getActiveGameDetails(GAMEID); // Get the active game details
    boardEventListeners(); // Add event listeners to the board

    // Check if there are no players in the game
    if (gameDetails.description.players.length === 0) {
        // Delete the game and navigate to the create or join page
        await deleteGame();
        return;
    }

    // Check if the game has started
    if (gameDetails.description.started === false) {
        waitingForPlayers(); // Display a waiting for players message
        setTimeout(polling, TIMEOUTDELAY); // Continue polling after a delay
    } else {
        removePopUp(); // Remove the pop-up
        refreshBoard(); // Refresh the board
        getObjectiveIndex(); // Get the index of the player's objective
        showTurn(gameDetails); // Show whose turn it is
        displayObtainedTreasures(); // Display the obtained treasures
        displayPlayerList(gameDetails.description.players); // Display the player list
        displayCardsOfPlayerObjectives(); // Display the cards of the player's objectives
        checkForWinner(gameDetails.description.players); // Check for a winner
        setTimeout(polling, TIMEOUTDELAY); // Continue polling after a delay
        console.log(`Lobby: ${gameDetails.description.players.length}/${gameDetails.description.maxPlayers}`);
    }
}

// Asynchronous function to delete the game
async function deleteGame() {
    await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}`, "DELETE")
        .then(response => {
            console.log("Game deleted:", response);
        }).catch(ErrorHandler.handleError);
}

// Function to display the player list
function displayPlayerList(players) {
    const playerList = document.querySelector("#playerList"); // Select the player list element
    playerList.innerHTML = ""; // Clear the player list
    players.forEach((player, index) => {
        const randomColor = pawnColors[index % pawnColors.length]; // Assign a random color to each player
        const playerListItem = `<li>${player} <img src="assets/media/player_cutouts/${randomColor}_pawn.webp" alt="${randomColor} pawn"></li>`;
        playerList.insertAdjacentHTML("beforeend", playerListItem); // Add each player to the player list
    });
}

// Asynchronous function to get the active game details
async function getActiveGameDetails(gameId) {
    return await getAPIResponse(gameId, "description=true&players=true&spareTile=true", "GET");
}

// Asynchronous function to leave the game
async function leaveGame() {
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`, "DELETE")
        .then(response => {
            console.log(response);
            navigate("createOrJoin.html");
        }).catch(ErrorHandler.handleError);
}

// Asynchronous function to get the API response
async function getAPIResponse(path, parameters, method) {
    return await CommunicationAbstractor.fetchFromServer(`/games/${path}?${parameters}`, `${method}`).catch(ErrorHandler.handleError);
}

// Asynchronous function to get the maze
async function getMaze() {
    return await getAPIResponse(GAMEID, "description=false&maze=true", "GET");
}

// Function to add treasures to the board
function addTreasuresToBoard(square, cell) {
    if (cell.treasure) {
        square.dataset.treasure = cell.treasure; // Add the treasure data to the square
        const treasure = cell.treasure.replaceAll(" ", "_");
        square.insertAdjacentHTML("beforeend", `<img src="assets/media/treasure_cutouts/${treasure}.webp" class="treasure" alt="treasure">`); // Add the treasure image to the square
    }
}

// Asynchronous function to refresh the board
async function refreshBoard() {
    const board = document.querySelector("#board"); // Select the board element
    const maze = await getMaze(); // Get the maze
    const locations = await getReachableLocations(); // Get the reachable locations

    updateBoard(board, maze, locations); // Update the board
    removeObsoleteTiles(board, maze); // Remove obsolete tiles

    const SPARETILE = await getActiveGameDetails(GAMEID)
        .then(response => response.spareTile)
        .catch(ErrorHandler.handleError);
    shove.tile = SPARETILE; // Set the spare tile
}

// Function to update the board
function updateBoard(board, maze, locations) {
    const existingBoardPieces = document.querySelectorAll(".square"); // Select all existing board pieces

    maze.maze.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const existingTile = findExistingTile(existingBoardPieces, rowIndex, cellIndex); // Find the existing tile

            if (existingTile) {
                updateTile(existingTile, cell, locations, rowIndex, cellIndex); // Update the existing tile
            } else {
                createNewTile(board, cell, locations, rowIndex, cellIndex); // Create a new tile
            }
        });
    });
}

// Function to find an existing tile
function findExistingTile(existingTiles, rowIndex, cellIndex) {
    return Array.from(existingTiles).find(tile => {
        const [tileRowIndex, tileColIndex] = tile.dataset.coordinates.split(",").map(Number);
        return tileRowIndex === rowIndex && tileColIndex === cellIndex;
    });
}

// Function to update an existing tile on the board
function updateTile(tile, cell, locations, rowIndex, cellIndex) {
    tile.innerHTML = ""; // Clear the tile's inner HTML
    generateRandomTilesImg(tile, cell.walls); // Generate a random tile image based on the cell's walls
    addTreasuresToBoard(tile, cell); // Add treasures to the tile if the cell has any
    if (cell.players) {
        addPlayerPawn(tile, cell.players[0]); // If the cell has players, add a pawn for the first player
    } else {
        const playerPawn = tile.querySelector(".player-pawn"); // Select the player pawn element
        if (playerPawn) playerPawn.remove(); // If a player pawn exists, remove it
    }
    updateReachableClass(tile, locations, rowIndex, cellIndex); // Update the 'reachable' class of the tile
}

// Function to create a new tile on the board
function createNewTile(board, cell, locations, rowIndex, cellIndex) {
    const square = document.createElement("div"); // Create a new div element for the square
    square.classList.add("square"); // Add the 'square' class to the square
    square.dataset.coordinates = `${rowIndex},${cellIndex}`; // Set the square's data-coordinates attribute to the row and column indices

    generateRandomTilesImg(square, cell.walls); // Generate a random tile image based on the cell's walls
    addTreasuresToBoard(square, cell); // Add treasures to the square if the cell has any
    if (cell.players) {
        addPlayerPawn(square, cell.players[0]); // If the cell has players, add a pawn for the first player
    }
    if (isLocationReachable(locations, rowIndex, cellIndex)) {
        square.classList.add("reachable"); // If the location is reachable, add the 'reachable' class to the square
    }
    board.appendChild(square); // Append the square to the board
}

// Function to update the 'reachable' class of a tile
function updateReachableClass(tile, locations, rowIndex, cellIndex) {
    if (isLocationReachable(locations, rowIndex, cellIndex)) {
        tile.classList.add("reachable"); // If the location is reachable, add the 'reachable' class to the tile
    } else {
        tile.classList.remove("reachable"); // If the location is not reachable, remove the 'reachable' class from the tile
    }
}

// Function to check if a location is reachable
function isLocationReachable(locations, rowIndex, cellIndex) {
    // Check if any of the locations in the locations array match the row and column indices
    return locations.locations.some(location => location.row === rowIndex && location.col === cellIndex);
}

// Function to remove obsolete tiles from the board
function removeObsoleteTiles(board, maze) {
    const existingBoardPieces = document.querySelectorAll(".square"); // Select all existing board pieces
    existingBoardPieces.forEach(existingPiece => {
        const [rowIndex, colIndex] = existingPiece.dataset.coordinates.split(",").map(Number); // Extract the row and column indices from the existing piece's data-coordinates attribute
        if (!maze.maze[rowIndex] || !maze.maze[rowIndex][colIndex]) {
            existingPiece.remove(); // If the corresponding cell in the maze does not exist, remove the existing piece
        }
    });
}

// Function to refresh the board event listeners
function refreshBoardEventListeners() {
    const allBoardPieces = document.querySelectorAll(".square"); // Select all board pieces
    allBoardPieces.forEach(boardPiece => {
            boardPiece.addEventListener("click", (e) => getBoardPiece(e)); // Add a click event listener to each board piece
        }
    );
}

// Function to show whose turn it is
function showTurn(data) {
    const player = document.querySelector("#turnOrder"); // Select the turn order element
    if (data.description.currentShovePlayer !== null) {
        player.innerHTML = `Current shove turn: ${data.description.currentShovePlayer}`; // If it's currently a shove turn, display the current shove player
    } else {
        player.innerHTML = `Current move turn: ${data.description.currentMovePlayer}`; // If it's currently a move turn, display the current move player
    }
}

// Function to shove a tile
function shoveTile(coordinates) {
    shove.destination.row = parseInt(coordinates[0]); // Set the shove destination row to the first coordinate
    shove.destination.col = parseInt(coordinates[1]); // Set the shove destination column to the second coordinate
    console.log(shove);
    // Send a PATCH request to the server to shove the tile and return the response
    return CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/maze`, "PATCH", shove).catch(ErrorHandler.handleError);
}

// Function to move a player
function movePlayer(row, col) {
    const destination = { row, col }; // Set the destination to the row and column
    // Send a PATCH request to the server to move the player and return the response
    return CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}/location`, "PATCH", { destination });
}

// Asynchronous function to get the reachable locations
async function getReachableLocations() {
    const playerDetails = await getPlayerDetails(); // Get the player details
    const playerRow = playerDetails.player.location.row; // Get the player's row
    const playerCol = playerDetails.player.location.col; // Get the player's column
    // Send a GET request to the server to get the reachable locations and return the response
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/maze/locations/${playerRow}/${playerCol}`);
}

// Asynchronous function to get the player details
async function getPlayerDetails() {
    // Send a GET request to the server to get the player details and return the response
    return await CommunicationAbstractor.fetchFromServer(`/games/${GAMEID}/players/${PLAYERNAME}`);
}

// Function to add event listeners to the board pieces
function boardEventListeners() {
    const allBoardPieces = document.querySelectorAll(".square"); // Select all board pieces
    console.log("Found", allBoardPieces.length, "board pieces.");
    allBoardPieces.forEach(boardPiece => {
            boardPiece.addEventListener("click", (e) => getBoardPiece(e)); // Add a click event listener to each board piece
        }
    );
}

// Function to get a board piece when it's clicked
function getBoardPiece(e) {
    console.log("Board piece clicked:", e.currentTarget);
    e.preventDefault();
    const coordinates = e.currentTarget.dataset.coordinates.split(","); // Extract row and column coordinates
    const row = parseInt(coordinates[0]);
    const col = parseInt(coordinates[1]);
    console.log(`Clicked coordinates: Row ${row}, Column ${col}`);

    doTurn(row, col);
}

// Asynchronous function to do a turn
async function doTurn(row, col){
    const gameDetails = await getActiveGameDetails(GAMEID); // Get the active game details
    if (gameDetails.description.currentShovePlayer === PLAYERNAME) {
        shoveTile([row, col]) // Shove a tile
            .then(response => {
                console.log("Shove successful:", response); // Log the response if the shove is successful
            })
            .catch(error => {
                console.error("Error shoving tile:", error); // Log the error if the shove is unsuccessful
            });
    } else if (gameDetails.description.currentMovePlayer === PLAYERNAME) {
        movePlayer(row, col) // Move a player
            .then(response => {
                console.log("Move successful:", response); // Log the response if the move is successful
            })
            .catch(log => {
                console.log("Error moving player:", log); // Log the error if the move is unsuccessful
            });
    } else {
        console.log("It's not your turn to move."); // Log a message if it's not the player's turn to move
    }
}

// Asynchronous function to display the treasures that the player has obtained
async function displayObtainedTreasures() {
    // Select the HTML element where the obtained treasures will be displayed
    const $obtainedTreasures = document.querySelector("#obtainedTreasures");
    // Clear any existing content in the element
    $obtainedTreasures.innerHTML = "";
    // Get the details of the current player
    const playerDetails = await getPlayerDetails();

    // For each treasure that the player has found
    playerDetails.player.foundTreasures.forEach(treasure => {
        // Replace spaces in the treasure name with underscores
        const treasureName = treasure.replaceAll(" ", "_");
        // Add an image of the treasure to the obtained treasures element
        $obtainedTreasures.insertAdjacentHTML("beforeend", `<img src="assets/media/treasures_cards/${treasureName}.webp" alt="${treasure}">`);
    });
}

// Asynchronous function to get and display the spare tile
async function getAndDisplaySpareTile() {
    // Select the HTML element where the spare tile will be displayed
    const $spareTile = document.querySelector("#spareTile");
    // Clear any existing content in the element
    $spareTile.innerHTML = "";

    // Get the details of the current game
    const gameDetails = await getActiveGameDetails(GAMEID);

    // Get the image ID of the wall on the spare tile
    const wallTile = getWallImageId(gameDetails.spareTile.walls);

    // Add an image of the spare tile to the spare tile element
    $spareTile.insertAdjacentHTML("beforeend", `<img src="assets/media/tiles/${wallTile}.webp" alt="wall tile">`);
}

// Function to add an event listener to the rotate spare tile button
function rotateSpareTileButton() {
    // Select the rotate spare tile button
    const $rotateSpareTileImage = document.querySelector("#rotateSpareTileButton");
    // Add a click event listener to the button that calls the rotateSpareTileClockwise function
    $rotateSpareTileImage.addEventListener("click", rotateSpareTileClockwise);
}

// Function to rotate the spare tile clockwise
function rotateSpareTileClockwise() {
    // Select the image of the spare tile
    const $spareTile = document.querySelector("#spareTile img");
    // Get the current rotation of the spare tile, or 0 if it's not set
    const currentRotation = parseFloat($spareTile.dataset.rotation) || 0;
    // Calculate the new rotation by adding 90 degrees to the current rotation and taking the remainder when divided by 360
    const newRotation = (currentRotation + 90) % 360;

    // Apply the new rotation to the spare tile
    $spareTile.style.transform = `rotate(${newRotation}deg)`;

    // Store the new rotation in the spare tile's dataset
    $spareTile.dataset.rotation = newRotation.toString();

    // Rotate the walls of the spare tile
    shove.tile.walls = rotateWallsClockWise(shove.tile.walls);
}

// Function to rotate the walls of a tile clockwise
function rotateWallsClockWise(walls) {
    // Store the top wall
    const temp = walls[0];
    // Move the right wall to the top
    walls[0] = walls[3];
    // Move the bottom wall to the right
    walls[3] = walls[2];
    // Move the left wall to the bottom
    walls[2] = walls[1];
    // Move the top wall to the left
    walls[1] = temp;
    // Return the rotated walls
    return walls;
}

// Function to get the row and column of a slide indicator
function getRowAndColumn(classList) {
    // Define the row and column for each slide indicator
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
    // Find the slide indicator in the class list
    const indicator = Object.keys(slideIndicators).find(key => classList.contains(key));
    // If the slide indicator is found, return its row and column
    if (indicator) {
        return slideIndicators[indicator];
    } else {
        // If the slide indicator is not found, return -1 for both row and column
        return { row: -1, col: -1 };
    }
}

// Asynchronous function to slide the spare tile
async function slideSpareTile(e) {
    // Get the class list of the clicked element
    const classList = e.currentTarget.classList;
    // Get the row and column of the slide indicator
    const { row, col } = getRowAndColumn(classList);
    // Get the direction of the slide indicator
    const direction = getClassDirection(classList);
    // If the row and column are valid
    if (row !== -1 && col !== -1) {
        // Shove the tile
        await shoveTile([row, col]);
        // Shift the tiles
        await shiftTiles(direction, [row, col]);
        // Get and display the spare tile
        await getAndDisplaySpareTile();
        // Refresh the board
        await refreshBoard();
    } else {
        // If the row and column are not valid, log an error
        console.error("Invalid slide indicator");
    }
}

// Asynchronous function to shift the tiles
async function shiftTiles(direction, row, col) {
    // If the direction is row
    if (direction === "row") {
        // For each column from 6 to the given column
        for (let i = 6; i > col; i--) {
            // Define the target and source coordinates
            const targetCoordinates = `${row},${i}`;
            const sourceCoordinates = `${row},${i - 1}`;
            // Move the tile from the source coordinates to the target coordinates
            await moveTile(targetCoordinates, sourceCoordinates);
        }
    } else if (direction === "column") {
        // If the direction is column
        // For each row from 6 to the given row
        for (let i = 6; i > row; i--) {
            // Define the target and source coordinates
            const targetCoordinates = `${i},${col}`;
            const sourceCoordinates = `${i - 1},${col}`;
            // Move the tile from the source coordinates to the target coordinates
            await moveTile(targetCoordinates, sourceCoordinates);
        }
    }
}

// Asynchronous function to move a tile
async function moveTile(targetCoordinates, sourceCoordinates) {
    // Select the target and source squares
    const targetSquare = document.querySelector(`.square[data-coordinates="${targetCoordinates}"]`);
    const sourceSquare = document.querySelector(`.square[data-coordinates="${sourceCoordinates}"]`);
    // Select the images in the target and source squares
    const targetImg = targetSquare.querySelector("img");
    const sourceImg = sourceSquare.querySelector("img");

    // Move the treasure data from the source square to the target square
    targetSquare.dataset.treasure = sourceSquare.dataset.treasure;
    // Move the image source from the source image to the target image
    targetImg.src = sourceImg.src;
    // Remove the treasure data from the source square
    sourceSquare.removeAttribute("data-treasure");
    // Remove the source image
    sourceImg.remove();
}

// Function to determine the direction of a slide based on the class list of the slide indicator
function getClassDirection(classList) {
    // If the class list contains "slide-indicator-left" or "slide-indicator-right", the direction is "row"
    if (classList.contains("slide-indicator-left") || classList.contains("slide-indicator-right")) {
        return "row";
    }
    // If the class list contains "slide-indicator-top" or "slide-indicator-bottom", the direction is "column"
    else if (classList.contains("slide-indicator-top") || classList.contains("slide-indicator-bottom")) {
        return "column";
    }
}

// Array of pawn colors
const pawnColors = ["blue", "green", "red", "yellow"];

// Asynchronous function to add a player pawn to a square
async function addPlayerPawn(square, playerName) {
    // Get the color of the player
    const playerColor = await getPlayerColor(playerName);

    // Create a new image element for the player pawn
    const playerPawn = document.createElement("img");
    // Set the source of the image to the player pawn image
    playerPawn.src = `assets/media/player_cutouts/${playerColor}_pawn.webp`;
    // Set the alt text of the image to the player color
    playerPawn.alt = `${playerColor} pawn`;
    // Add the "player-pawn" class to the image
    playerPawn.classList.add("player-pawn");

    // Append the player pawn image to the square
    square.appendChild(playerPawn);
}

// Asynchronous function to get the color of a player
async function getPlayerColor(playerName) {
    // Get the details of the active game
    return await getActiveGameDetails(GAMEID)
        .then(response => {
            // Get the list of players
            const players = response.description.players;
            // Find the index of the player
            const playerIndex = players.findIndex(player => player === playerName);
            // Return the color of the player based on their index
            return pawnColors[playerIndex % pawnColors.length];
        });
}

// Function to display the name of the current player
function displayWhoYouAre() {
    // Select the element to display the player name
    const $playerName = document.querySelector("#joinedPlayer");
    // Set the inner HTML of the element to the player name
    $playerName.innerHTML = `${PLAYERNAME}`;
}

// Function to display a waiting for players message
function waitingForPlayers() {
    // Select the waiting for players element
    const $waitingForPlayers = document.querySelector("#popUp");
    // Clear the inner HTML of the element
    $waitingForPlayers.innerHTML = "";
    // Add a message to the element
    $waitingForPlayers.insertAdjacentHTML("beforeend", `
        <div id="popUpContent">
        <h2 id="popUpTitle">Game is not ready</h2>
        <p id="popUpText">Waiting for players</p
        </div>`);
}

// Function to remove the pop-up
function removePopUp(){
    // Select the pop-up element
    const $popUp = document.querySelector("#popUp");
    // If the pop-up has content, clear it
    if ($popUp.innerHTML !== ""){
        $popUp.innerHTML = "";
    }
}

// Asynchronous function to check for a winner
async function checkForWinner(players) {
    // Log a message indicating that the function is checking for a winner
    console.log("Checking for winner...");
    // For each player
    for (const player of players) {
        // Log a message indicating the number of treasures the player has found
        console.log(`Player ${player.name} has found ${player.foundTreasures.length} treasures.`);
        // If the player has found the maximum number of treasures
        if (player.foundTreasures.length === GAMEMAXTREASURES) {
            // Set the winner in local storage to the player name
            localStorage.setItem("winner", player.name);
            // Log a message indicating that the player is the winner
            console.log(`Player ${player.name} is the winner!`);
            // Navigate to the end game page
            navigate("endGame.html");
            break;
        }
    }
}