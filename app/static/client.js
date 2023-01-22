import createGame from "./game.js";
import render from "./render.js";

const game = createGame();
const socket = io();
let username = "";

socket.on("setup", function (state) {
  console.log(`<- State: ${JSON.stringify(state)}`);
  game.setState(state);
});

socket.on("connect", function () {
  // username = prompt("Please enter your name");
  username = socket.id;
  console.log(`-> "new_user" "${username}"`);
  socket.emit("new_user", { id: username });
});

socket.on("new_user", (command) => {
  console.log(`<- "new_user" "${JSON.stringify(command)}"`);
  game.addPlayer(command);
  game.setOwnerRound(command);
  render(game, username);
});

socket.on("set_cards", (command) => {
  console.log(`<- "set_cards" "${JSON.stringify(command)}"`);
  game.setCardsHand(command);
  render(game, username);
});

socket.on("remove_user", (command) => {
  console.log(`<- "remove_user" "${JSON.stringify(command)}"`);
  if (game.yourTurn(username)) {
    console.log("remove_current_owner");
    game.nextTurn();
  }
  game.removePlayer(command);
  render(game, username);
});

socket.on("finish_round", (command) => {
  console.log(`<- "finish_round" "${JSON.stringify(command)}"`);
  game.finishRound(command);
  render(game, username);
});

socket.on("next_turn", (command) => {
  console.log(`<-  "next_turn" "${JSON.stringify(command)}"`);
  game.setWinnerSetupNextTurn(command);
  game.nextTurn();
  render(game, username);
});

// Select card
function cardSelected() {
  const el = document.getElementsByClassName("selected");
  if (game.isBlocked(username) || el.length == 0) {
    return;
  }
  const card = el[0].innerHTML;
  const command = { id: username, card: card };
  command.index = game.positionCard(command);
  if (game.yourTurn(username)) {
    command.winner = el[0].getAttribute("id");
    command.answer = game.state.round.card;
    console.log(`-> "selected_winner" "${JSON.stringify(command)}"`);
    socket.emit("selected_winner", command);
  } else {
    console.log(`-> "selected_card" "${JSON.stringify(command)}"`);
    socket.emit("selected_card", command);
  }
}
document.getElementById("finish").addEventListener("click", cardSelected);
