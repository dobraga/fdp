import createGame from "./game.js";
import render from "./render.js";

const game = createGame();
const socket = io();
let id = "";
let username = "";

socket.on("setup", function (state) {
  console.log(`<- State: ${JSON.stringify(state)}`);
  game.setState(state);
});

socket.on("connect", function () {
  id = socket.id;
  username = socket.id;
  username = prompt("Please enter your name");
  console.log(`-> "new_user" "${username}"`);
  socket.emit("new_user", { id: socket.id, username: username });
});

socket.on("new_user", (command) => {
  console.log(`<- "new_user" "${JSON.stringify(command)}"`);
  game.addPlayer(command);
  game.setOwnerRound(command);
  render(game, id);
});

socket.on("set_cards", (command) => {
  console.log(`<- "set_cards" "${JSON.stringify(command)}"`);
  game.setCardsHand(command);
  render(game, id);
});

socket.on("remove_user", (command) => {
  console.log(`<- "remove_user" "${JSON.stringify(command)}"`);
  game.removePlayer(command);
  render(game, id);
});

socket.on("finish_round", (command) => {
  console.log(`<- "finish_round" "${JSON.stringify(command)}"`);
  game.finishRound(command);
  render(game, id);
});

socket.on("next_turn", (command) => {
  console.log(`<- "next_turn" "${JSON.stringify(command)}"`);
  game.setWinnerSetupNextTurn(command);
  swal(
    `O vencedor foi ${game.getPlayerName(command.winner)}\n\n${command.answer}\n\n${command.cards}`
  );
  render(game, id);
});

// Select card
function cardSelected(game) {
  if (game.isBlocked(id)) {
    swal("Espera sua vez caraio.");
    return;
  }
  
  const elCards = document.getElementsByClassName("selected");
  const round = game.getRound()
  
  const cards = Array.from(elCards).map((elem) => elem.innerHTML);
  const command = { id: id, cards: cards };
  if (game.yourTurn(id)) {
    if (elCards.length != 1) {
      swal('Selecione uma carta como vencedora, jumento.');
      return;
    }

    command.winner = elCards[0].getAttribute("id");
    command.answer = round.card;
    console.log(`-> "selected_winner" "${JSON.stringify(command)}"`);
    socket.emit("selected_winner", command);
  } else {
    if (elCards.length != round.qtdSpaces) {
      swal(`Selecione ${round.qtdSpaces} carta(s), jumento.`);
      return;
    }

    console.log(`-> "selected_card" "${JSON.stringify(command)}"`);
    socket.emit("selected_card", command);
  }
}
document.getElementById("finish").addEventListener("click", () => {cardSelected(game)});
