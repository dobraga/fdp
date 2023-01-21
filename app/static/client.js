import createGame from "/static/game.js";
import render from "/static/render.js";

var game = createGame();
var socket = io();
var username = socket.id;

socket.once("setup", function (players) {
  console.log("Receiving all players");
  game.setPlayers(players);
});

socket.on("connect", function () {
  // const username = prompt("Please enter your name")
  username = socket.id;
  socket.emit("new_user", username);
  console.log(`Player connected on Client with id: ${username}`);
  render(game, username);
});

socket.on("new_user", (command) => {
  console.log(`Receiving "new_user" -> "${command.id}"`);
  game.addPlayer({ id: command.id });
  render(game, username);
});

socket.on("remove_user", (command) => {
  console.log(`Receiving "new_user" -> "${command.id}"`);
  game.removePlayer({ id: command.id });
  render(game, username);
});

socket.on("finished_round", (command) => {
  console.log(`Receiving ${JSON.stringify(command)}`);
  game.finishRound(command);
  render(game, username);
});

// Select card
function cardSelected() {
  if (game.isBlocked(username)) {
    return;
  }
  const el = document.getElementsByClassName("selected");
  if (el.length == 0) {
    console.log("selecione uma carta");
    return;
  }

  var command = {'id': username, 'card': "texto da carta aqui"};
  console.log(`-> Sending ${JSON.stringify(command)}`);
  socket.emit("selected_card", command);
  game.finishRound(command);
}
document.getElementById("finish").addEventListener("click", cardSelected);
