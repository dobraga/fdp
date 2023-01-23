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
  render(game, username);
});

// Select card
function cardSelected(game) {
  if (game.isBlocked(username)) {
    swal("Espera sua vez caraio.");
    return;
  }
  
  const elCards = document.getElementsByClassName("selected")
  if (elCards.length != game.state.round.qtdSpaces) {
    swal(`Selecione ${game.state.round.qtdSpaces} carta(s)`);
    return;
  }

  const cards = Array.from(elCards).map((elem) => elem.innerHTML);
  const command = { id: username, cards: cards };
  if (game.yourTurn(username)) {
    command.winner = elCards[0].getAttribute("id");
    command.answer = game.state.round.card;
    console.log(`-> "selected_winner" "${JSON.stringify(command)}"`);
    socket.emit("selected_winner", command);
  } else {
    console.log(`-> "selected_card" "${JSON.stringify(command)}"`);
    socket.emit("selected_card", command);
  }
}
document.getElementById("finish").addEventListener("click", () => {cardSelected(game)});
