import { navigate } from "./universal.js";

init();

function init() {
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        checkUsername();
        createUser(e);
    });
}

function createUser(e) {
    e.preventDefault();
    const playerName = document.querySelector('input').value;

    if (!document.querySelector('#error').classList.contains('hidden')) {
        return;
    }

    localStorage.setItem('playerName', playerName);
    navigate('createOrJoin.html');
}

function checkUsername() {
    let username = document.querySelector('#username').value;
    let error = document.querySelector('#error');

    let maxCharacters = 15;

    switch (true) {
        case username === "":
            displayError('Please enter a username');
            break;
        case username.length > maxCharacters:
            displayError('Username cannot exceed ' + maxCharacters + ' characters');
            console.log("Max characters exceeded");
            break;
        default:
            hideError();
            break;
    }
    function displayError(message) {
        error.textContent = message;
        error.classList.remove('hidden');
    }
    function hideError() {
        error.textContent = '';
        error.classList.add('hidden');
    }
}
