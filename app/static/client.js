import createGame from "./utils/game.js";
import session from "./utils/session.js";

const game = createGame();
const socket = io();
const ses = session();

let id = null;
let username = null;

socket.on("connect", () => {
  id = ses.getId();
  username = ses.getName();

  console.log(`-> "new_user" "${username}"`);
  socket.emit("new_user", { id: id, username: username });

  const cards = ses.getCards();
  game.setCardsHand({ id: id, cards: cards });
  console.log(`-> "set_cards" "${cards}"`);
  socket.emit("set_cards", { id: id, cards: cards });
  game.render(id);
});

socket.on("set_cards", (command) => {
  console.log(`<- "set_cards" "${JSON.stringify(command)}"`);
  game.setCardsHand(command);
  ses.storeCards(game.getMyCards(id));
});

socket.on("setup", (state) => {
  console.log(`<- setup: ${JSON.stringify(state)}`);
  game.setState(state);
});

socket.on("new_user", (command) => {
  console.log(`<- "new_user" "${JSON.stringify(command)}"`);
  game.addPlayer(command);
  game.setOwnerRound(command);
  game.render(id);
});

socket.on("remove_user", (command) => {
  console.log(`<- "remove_user" "${JSON.stringify(command)}"`);
  game.removePlayer(command);
  game.render(id);
});

socket.on("finish_round", (command) => {
  console.log(`<- "finish_round" "${JSON.stringify(command)}"`);
  game.finishRound(command);
  game.render(id);
});

socket.on("next_turn", (command) => {
  console.log(`<- "next_turn" "${JSON.stringify(command)}"`);
  game.setWinnerSetupNextTurn(command);
  ses.storeCards(game.getMyCards(id));
  swal(
    `O vencedor foi ${game.getPlayerName(command.winner)}\n\n${
      command.answer
    }\n\n${command.cards}`
  );
  game.render(id);
});

// Select card
function cardSelected(game) {
  if (game.isBlocked(id)) {
    swal("Espera sua vez caraio.");
    return;
  }

  const elCards = document.getElementsByClassName("selected");
  const round = game.getRound();

  const cards = Array.from(elCards).map((elem) => elem.innerHTML);
  const command = { id: id, cards: cards };
  if (game.yourTurn(id)) {
    if (elCards.length != 1) {
      swal("Selecione uma carta como vencedora, jumento.");
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

document.getElementById("finish").addEventListener("click", () => {
  cardSelected(game);
});

document.getElementById("disconnect").addEventListener("click", () => {
  ses.clear();
});
