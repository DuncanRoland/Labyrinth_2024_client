import {navigate} from "./universal.js";
import {fetchFromServer} from "./data-connector/api-communication-abstractor.js";

async function init() {
    const leaveButton = document.querySelector("#leaveButton");
    leaveButton.addEventListener("click", () => navigate("createOrJoin.html"));


    const rematchButton = document.querySelector("#rematchButton");
    rematchButton.addEventListener("click", () => navigate("createOrJoin.html"));

    await injectUsername();
}

await init();

async function injectUsername() {
    const header = document.querySelector("h1");
    const winner = localStorage.getItem('winner');
    const gameId = localStorage.getItem('gameId');

    try {
        await fetchFromServer(`/games/${gameId}`, "GET");
        header.insertAdjacentHTML("beforeend", ` ${winner} has won the game!`);
    } catch (error) {
        console.error('Error injecting username:', error);
        header.insertAdjacentHTML("beforeend", ' Failed to load game result');
    }
}
