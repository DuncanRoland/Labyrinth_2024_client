"use strict"

// Import necessary modules and constants
import *  as CommunicationAbstractor from './data-connector/api-communication-abstractor.js';
import { GAMEPREFIX } from './config.js';
import * as ErrorHandler from './data-connector/error-handler.js';
import { navigate } from './universal.js';
import { saveToStorage } from './data-connector/local-storage-abstractor.js';

initGameListPage();

function initGameListPage() {
    loadGameList(); // Load the list of games
    createEventListeners();
}


function createEventListeners() {
    // Add event listener for the back button
    document.querySelector(".backButton").addEventListener('click', () => navigate('createOrJoin.html'));
    // Add event listener for the form submission
    document.querySelector("form").addEventListener('submit', (e) => findGameId(e));
}

// Asynchronous function to load the game list
async function loadGameList() {
    const gameList = await getGamesList(); // Get the list of games
    const $gameList = document.querySelector("#gameList"); // Select the game list element

    // Filter out games with no players
    const filteredGames = gameList.games.filter(game => game.players.length > 0);

    // Display filtered games
    filteredGames.forEach(game => {
        // Insert each game into the game list element
        $gameList.insertAdjacentHTML('beforeend', `
        <li>
        <p>${game.id}</p>
        <p>${game.gameMode}</p>
        <p>${game.players.length}/${game.maxPlayers} players</p>
        <button class='joinButton'>Join</button>
        </li>`);
    });

    // Add event listener for each join button
    document.querySelectorAll(".joinButton").forEach(button => button.addEventListener('click', (e) => joinGame(e)));
}

// Asynchronous function to find a game by ID
async function findGameId(e) {
    e.preventDefault(); // Prevent the form from submitting normally
    const gameIdInput = document.querySelector("#findGameId").value; // Get the game ID input value
    const list = await getGamesList(); // Get the list of games
    document.querySelector("#gameList").innerHTML = ""; // Clear the game list
    list.games.forEach(game => {
        // If the game ID includes the input value, insert the game into the game list
        if (game.id.includes(gameIdInput)) {
            document.querySelector("#gameList").insertAdjacentHTML('beforeend', `<li><p>${game.id}</p><p>${game.gameMode}</p><p>${game.minPlayers}/${game.maxPlayers} players</p><button class='joinButton'>Join</button></li>`);
        }
    });
}

// Asynchronous function to join a game
async function joinGame(e) {
    const playerName = localStorage.getItem('playerName'); // Get the player name from local storage
    const gameId = e.currentTarget.parentElement.querySelector("p").innerHTML; // Get the game ID from the clicked element
    // Send a POST request to the server to join the game
    const response = await CommunicationAbstractor.fetchFromServer(`/games/${gameId}/players/${playerName}`, 'POST');
    saveToStorage("playerToken", response.playerToken); // Save the player token to local storage
    saveToStorage("gameId", response.gameId); // Save the game ID to local storage
    navigate('game.html'); // Navigate to the game page
}

// Function to get the list of games
function getGamesList() {
    // Send a GET request to the server to get the list of games
    return CommunicationAbstractor.fetchFromServer(`/games?prefix=${GAMEPREFIX}&onlyAccepting=true`, 'GET').catch(ErrorHandler.handleError);
}