import { navigate } from './universal.js';
import { GAMEPREFIX } from './config.js';
import { loadFromStorage, saveToStorage } from './data-connector/local-storage-abstractor.js';
import *  as CommunicationAbstractor from './data-connector/api-communication-abstractor.js';

let GAME = {
    prefix: GAMEPREFIX,
    playerName: 'test',
    gameMode: 'simple',
    gameName: 'testGame',
    minPlayers: 2,
    maxPlayers: 4,
};

function init() {
    document.querySelector('#back').addEventListener('click', () => navigate('createOrJoin.html'));
    document.querySelector('form').addEventListener('submit', (e) => createGame(e));
}

function createGame(e) {
    e.preventDefault();
    const playerName = localStorage.getItem('playerName');
    GAME.playerName = playerName;
    GAME.gameMode = document.querySelector('input[name="game-mode"]:checked').value
    GAME.gameName = document.querySelector('#gameName').value;
    GAME.maxPlayers = parseInt(document.querySelector('#max-players').value)
    postGame(GAME);
    //navigate('game.html');
}

function postGame(game) {
    CommunicationAbstractor.fetchFromServer('/games', 'POST', game)
        .then(response => {
            saveToStorage("playerToken", response.playerToken);
            saveToStorage("gameId", response.gameId);
        }).catch((error) => console.error(error));
}

init();