import { loadFromStorage } from "./local-storage-abstractor.js";
import { getAPIUrl } from "../config.js";

function constructOptions(httpVerb, requestBody) {
  const options = {
    method : httpVerb,
    headers : {}
  };

  options.headers["Content-Type"] = "application/json";

  const playerToken = loadFromStorage("playerToken");

  if (playerToken !== null) {
    options.headers.Authorization = `Bearer ${playerToken}`;
  }

  // Don't forget to add data to the body when needed
  options.body = JSON.stringify(requestBody);
  return options;
}

function fetchFromServer(path, httpVerb, requestBody) {
  const options = constructOptions(httpVerb, requestBody);

  return fetch(`${getAPIUrl()}${path}`, options)
    .then(response => response.json())
    .then(jsonresponsetoparse => {
      if (jsonresponsetoparse.failure) {throw jsonresponsetoparse;}
      return jsonresponsetoparse;
    });
}

export { fetchFromServer };
