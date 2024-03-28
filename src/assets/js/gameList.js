"use strict"
import *  as CommunicationAbstractor from './data-connector/api-communication-abstractor.js';
import { GAMEPREFIX } from './config.js';
import * as ErrorHandler from './data-connector/error-handler.js';
import { navigate } from './universal.js';
import { saveToStorage } from './data-connector/local-storage-abstractor.js';

initGameListPage();

function initGameListPage() {
    loadGameList();
    createEventListeners();
}

function createEventListeners() {
    document.querySelector(".backButton").addEventListener('click', () => navigate('createOrJoin.html'));
    document.querySelector("form").addEventListener('submit', (e) => findGameId(e));

}

async function loadGameList() {
    const gameList = await getGamesList();
    const $gameList = document.querySelector("#gameList");
    gameList.games.forEach(game => {
        $gameList.insertAdjacentHTML('beforeend', `
        <li>
        <p>${game.id}</p>
        <p>${game.gameMode}</p>
        <p>${game.minPlayers}/${game.maxPlayers} players</p>
        <button class='joinButton'>Join</button>
        </li>`);
    });
    document.querySelectorAll(".joinButton").forEach(button => button.addEventListener('click', (e) => joinGame(e)));
}

async function findGameId(e) {
    e.preventDefault();
    const gameIdInput = document.querySelector("#findGameId").value;
    const list = await getGamesList();
    document.querySelector("#gameList").innerHTML = "";
    list.games.forEach(game => {
        if (game.id.includes(gameIdInput)) {
            document.querySelector("#gameList").insertAdjacentHTML('beforeend', `<li><p>${game.id}</p><p>${game.gameMode}</p><p>${game.minPlayers}/${game.maxPlayers} players</p><button class='joinButton'>Join</button></li>`);
        }
    });
}

async function joinGame(e) {
    const playerName = localStorage.getItem('playerName');
    const gameId = e.currentTarget.parentElement.querySelector("p").innerHTML;
    const response = await CommunicationAbstractor.fetchFromServer(`/games/${gameId}/players/${playerName}`, 'POST');
    saveToStorage("playerToken", response.playerToken);
    saveToStorage("gameId", response.gameId);
    navigate('game.html');
}

function getGamesList() {
    return CommunicationAbstractor.fetchFromServer(`/games?prefix=${GAMEPREFIX}&onlyAccepting=true`, 'GET').catch(ErrorHandler.handleError);
}