// Import the navigate function from the universal.js module
import { navigate } from "./universal.js";
//The index.js file is a JavaScript module that handles the form submission and username validation for the index page of the application.
// Initialize the form
function init() {
    // Add an event listener to the form that triggers when the form is submitted
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the form from submitting normally
        checkUsername(); // Validate the username
        index(e); // Handle the form submission
    });
}

// Function to handle form submission
function index(e) {
    e.preventDefault(); // Prevent the form from submitting normally
    const playerName = document.querySelector('input').value; // Get the value of the input field

    // If there's an error, stop the function
    if (!document.querySelector('#error').classList.contains('hidden')) {
        return;
    }

    // Save the player name to local storage
    localStorage.setItem('playerName', playerName);
    navigate('createOrJoin.html'); // Navigate to the createOrJoin.html page
}

// Function to validate the username
function checkUsername() {
    let username = document.querySelector('#username').value; // Get the value of the username input field
    let error = document.querySelector('#error'); // Get the error element

    let maxCharacters = 15;

    // Check if the username is empty or exceeds the maximum character limit
    switch (true) {
        case username === "":
            displayError('Please enter a username'); // Display an error message
            break;
        case username.length > maxCharacters:
            displayError('Username cannot exceed ' + maxCharacters + ' characters'); // Display an error message
            console.log("Max characters exceeded"); // Log an error message to the console
            break;
        default:
            hideError(); // Hide the error message
            break;
    }

    // Function to display the error message
    function displayError(message) {
        error.textContent = message; // Set the text content of the error element
        error.classList.remove('hidden'); // Remove the 'hidden' class from the error element
    }

    // Function to hide the error message
    function hideError() {
        error.textContent = ''; // Clear the text content of the error element
        error.classList.add('hidden'); // Add the 'hidden' class to the error element
    }
}

init(); // Call the init function to initialize the form