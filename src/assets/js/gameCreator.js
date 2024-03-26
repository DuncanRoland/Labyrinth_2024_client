import {navigate} from './universal.js';

function init() {
    const backButton = document.querySelector('#back');
    backButton.addEventListener('click', () => {
            console.log("Clicked on the button with destination index.html");
            navigate('index.html');
        }
    );

    const createGameButton = document.querySelector('#createGame');
    createGameButton.addEventListener('click', () => {
            console.log("Clicked on the button with destination gameCreated.html");
            navigate('gameCreated.html');
        }
    );
}

init();