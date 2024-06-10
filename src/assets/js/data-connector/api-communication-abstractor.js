// Import the loadFromStorage function from the local-storage-abstractor.js module
import { loadFromStorage } from "./local-storage-abstractor.js";

// Import the getAPIUrl function from the config.js module
import { getAPIUrl } from "../config.js";

// Function to construct the options object for the fetch request
function constructOptions(httpVerb, requestBody) {
  // Initialize the options object with the HTTP verb (GET, POST, etc.) and an empty headers object
  const options = {
    method : httpVerb,
    headers : {}
  };

  // Set the Content-Type header to application/json, indicating that the request body will be in JSON format
  options.headers["Content-Type"] = "application/json";

  // Load the player token from local storage
  const playerToken = loadFromStorage("playerToken");

  // If a player token exists, add it to the Authorization header
  if (playerToken !== null) {
    options.headers.Authorization = `Bearer ${playerToken}`;
  }

  // Convert the requestBody object to a JSON string and add it to the body of the request
  options.body = JSON.stringify(requestBody);

  // Return the options object
  return options;
}

// Function to send a fetch request to the server
function fetchFromServer(path, httpVerb, requestBody) {
  // Construct the options object for the fetch request
  const options = constructOptions(httpVerb, requestBody);

  // Send the fetch request to the server
  return fetch(`${getAPIUrl()}${path}`, options)
      // Parse the response as JSON
      .then(response => response.json())
      .then(jsonresponsetoparse => {
        // If the response contains a failure message, throw an error
        if (jsonresponsetoparse.failure) {throw jsonresponsetoparse;}
        // Otherwise, return the parsed JSON response
        return jsonresponsetoparse;
      });
}

// Export the fetchFromServer function for use in other modules
export { fetchFromServer };