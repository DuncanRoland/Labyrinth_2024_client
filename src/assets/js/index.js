import { navigate } from "./universal.js";

// Initialize the form
function init() {
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        checkUsername();
        index(e);
    });
}

// Function to handle form submission
function index(e) {
    e.preventDefault();
    const playerName = document.querySelector('input').value;

    if (!document.querySelector('#error').classList.contains('hidden')) {
        return;
    }

    // Save the player name to local storage
    localStorage.setItem('playerName', playerName);
    navigate('createOrJoin.html');
}

// Function to validate the username
function checkUsername() {
    let username = document.querySelector('#username').value;
    let error = document.querySelector('#error');

    let maxCharacters = 15;

    // Check if the username is empty
    switch (true) {
        case username === "":
            displayError('Please enter a username');
            break;
        // Check if the username exceeds the maximum character limit
        case username.length > maxCharacters:
            displayError('Username cannot exceed ' + maxCharacters + ' characters');
            console.log("Max characters exceeded");
            break;
        default:
            hideError();
            break;
    }
    // Function to display the error message
    function displayError(message) {
        error.textContent = message;
        error.classList.remove('hidden');
    }
    // Function to hide the error message
    function hideError() {
        error.textContent = '';
        error.classList.add('hidden');
    }
}

init();