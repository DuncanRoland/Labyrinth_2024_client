import { navigate } from "./universal.js";

function init() {
    const leaveButton = document.querySelector("#leaveButton");
    leaveButton.addEventListener("click", () => navigate("createOrJoin.html"));


    const rematchButton = document.querySelector("#rematchButton");
    rematchButton.addEventListener("click", () => navigate("createOrJoin.html"));
}

init();