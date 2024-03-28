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

    if (username === "") {
        error.insertAdjacentHTML('beforeend', '<p>Please enter a username</p>')
    }

    if (username === "") {
        document.querySelector('#error').classList.remove('hidden');
    } else {
        document.querySelector('#error').classList.add('hidden');
    }
}