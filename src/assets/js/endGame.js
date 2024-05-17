import { navigate } from "./universal.js";

function init() {
    const leaveButton = document.querySelector("#leaveButton");
    leaveButton.addEventListener("click", () => navigate("createOrJoin.html"));


    const rematchButton = document.querySelector("#rematchButton");
    rematchButton.addEventListener("click", () => navigate("createOrJoin.html"));


    injectUsername();

}

init();

async function fetchFromServer(path, httpVerb, requestBody = undefined) {
    const options = constructOptions(httpVerb, requestBody);
    return fetch(`${_config.getAPIUrl()}${path}`, options)
        .then((response) => {
            return response.json();
        })
        .then((jsonresponsetoparse) => {
            if (jsonresponsetoparse.failure) {
                throw jsonresponsetoparse;
            }
            return jsonresponsetoparse;
        });
}

async function injectUsername() {
    const header = document.querySelector("h1");
    const gameId = loadFromStorage("gameID");
    const response = await fetchFromServer(`/games/${gameId}`, "GET");
    header.innerHTML = `${response.winner} Won !`;
}