// client.js

var socket = io();
var username = "";
var typing = false;
var timeout = undefined;

var authContainer = document.getElementById("authContainer");
var chatContainer = document.getElementById("chatContainer");
var usernameForm = document.getElementById("usernameForm");
var sidebar = document.getElementById("sidebar");
var head = document.getElementById("head");
var form = document.getElementById("form");
var input = document.getElementById("input");
var recipientSelect = document.getElementById("recipient"); // Select element for choosing recipient
var activeUsersList = document.getElementById("activeUsers");
var usernameError = document.getElementById("usernameError");

usernameForm.addEventListener("submit", function (e) {
    e.preventDefault();
    username = document.getElementById("username").value;
    if (username) {
        socket.emit("join", username);
    }
});

form.addEventListener("submit", function (e) {
    e.preventDefault();
    const message = input.value;
    const recipient = recipientSelect.value; // Get the selected recipient
    if (message && recipient) {
        socket.emit("private message", { recipient, message }); // Emit private message event
        input.value = "";
    } else if (message) {
        socket.emit("chat message", {
            username: username,
            message: input.value,
        });
        input.value = "";
    }
});

socket.on("chat message", function (data) {
    var item = document.createElement("li");
    item.textContent = `[${new Date().toLocaleTimeString()}] ${data.username}: ${data.message}`;
    document.getElementById("messages").appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("user joined", function (username) {
    authContainer.style.display = "none"; // Hide the authentication form
    chatContainer.style.display = "block"; // Show the chat container
    sidebar.style.display = "block";
    head.style.display = "block";
    var item = document.createElement("li");
    item.textContent = username + " joined the chat";
    document.getElementById("messages").appendChild(item);
    updateActiveUsersList(); // Update the active users list
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("user left", function (username) {
    var item = document.createElement("li");
    item.textContent = `${username} left the chat`;
    document.getElementById("messages").appendChild(item);
    updateActiveUsersList();
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("authentication failed", function () {
    usernameError.textContent = "Authentication failed. Please choose a different username.";
    usernameError.style.display = "block";
});

input.addEventListener("input", function () {
    if (input.value.trim() !== "") { // Check if input value is not empty
        socket.emit("typing", { username: username, typing: true });
    } else {
        socket.emit("typing", { username: username, typing: false });
    }
});

socket.on("typing", function (data) {
    if (data.typing) {
        document.getElementById("typingIndicator").textContent = data.username + " is typing...";
    } else {
        document.getElementById("typingIndicator").textContent = "";
    }
});

function updateActiveUsersList() {
    activeUsersList.innerHTML = "";
    socket.emit("get active users", function (activeUsers) {
        activeUsers.forEach(function (user) {
            var item = document.createElement("li");
            item.textContent = user;
            activeUsersList.appendChild(item);
        });
    });
}

// Populate the recipient dropdown menu with active users
socket.on("update active users", function (activeUsers) {
    recipientSelect.innerHTML = "<option value=''>Select recipient</option>"; // Clear previous options
    activeUsers.forEach(function (user) {
        if (user !== username) { // Exclude the current user from the recipient list
            var option = document.createElement("option");
            option.textContent = user;
            option.value = user;
            recipientSelect.appendChild(option);
        }
    });
});

// Handle private messages
// Update the event listener for receiving private messages
socket.on("private message", function (data) {
    var item = document.createElement("li");
    item.textContent = `[${new Date().toLocaleTimeString()}] ${data.sender} (to ${data.recipient}): ${data.message}`;
    document.getElementById("messages").appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});


