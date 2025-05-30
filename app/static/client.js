import createGame from "./utils/game.js";
import session from "./utils/session.js";
import { render } from "./utils/renderer.js";

const game = createGame();
/** @type {import("socketio-client").Socket} */
const socket = io(); // It's good practice to type socket if possible, though io() is global here.
const ses = session();

let id = null;
let username = null;

socket.on("connect", () => {
  try {
    id = ses.getId();
    username = ses.getName();

    console.log(`-> "new_user" "${username}"`);
    socket.emit("new_user", { id: id, username: username });

    const cards = ses.getCards();
    game.setCardsHand({ id: id, cards: cards });
    console.log(`-> "set_cards" "${cards}"`);
    socket.emit("set_cards", { id: id, cards: cards });
  } catch (error) {
    console.error("Error during socket connect:", error);
  }
});

/**
 * @typedef {Object} SetCardsResponseCommand
 * @property {string} id
 * @property {string[]} new_cards
 * @property {string[]} played_cards
 */
socket.on("set_cards_response", (/** @type {SetCardsResponseCommand} */ command) => {
  try {
    console.log(`<- "set_cards_response" "${JSON.stringify(command)}"`);
    if (command.id !== id) {
      return;
    }

    let currentHand = game.getMyCards(id);
    if (!currentHand) {
      console.error("Current hand not found for player:", id);
      currentHand = [];
    }
    let mutableHand = [...currentHand]; 

    const newCards = [...command.new_cards]; 
    const playedCards = command.played_cards;

    for (const playedCard of playedCards) {
      const indexInHand = mutableHand.indexOf(playedCard);
      if (indexInHand !== -1) {
        if (newCards.length > 0) {
          mutableHand[indexInHand] = newCards.shift(); 
        } else {
          mutableHand.splice(indexInHand, 1);
          console.warn("Not enough new cards to replace all played cards. Some cards removed.");
        }
      } else {
        console.warn("Played card not found in hand:", playedCard);
      }
    }
    
    game.setCardsHand({ id: id, cards: mutableHand });
    ses.storeCards(game.getMyCards(id)); 
    render(game.state, { id: id, username: username }, document, game);

  } catch (error) {
    console.error("Error in 'set_cards_response' event handler:", error, "Command:", command);
    swal("Erro ao atualizar suas cartas. Tente recarregar a página.");
  }
});

/**
 * @typedef {Object} DealCardsCommand
 * @property {string[]} cards
 */
socket.on("deal_cards", (/** @type {DealCardsCommand} */ command) => {
  try {
    console.log(`<- "deal_cards" "${JSON.stringify(command)}"`);
    const currentCards = game.getMyCards(id) || [];
    const updatedHand = currentCards.concat(command.cards);
    
    game.setCardsHand({ id: id, cards: updatedHand });
    ses.storeCards(game.getMyCards(id)); 
    render(game.state, { id: id, username: username }, document, game);

  } catch (error) {
    console.error("Error in 'deal_cards' event handler:", error, "Command:", command);
    swal("Erro ao receber novas cartas. Tente recarregar a página.");
  }
});

/**
 * @typedef {Object} SetCardsCommand
 * @property {string} id
 * @property {string[]} cards
 */
socket.on("set_cards", (/** @type {SetCardsCommand} */ command) => {
  try {
    console.log(`<- "set_cards" "${JSON.stringify(command)}"`);
    game.setCardsHand(command);
    ses.storeCards(game.getMyCards(id));
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'set_cards' event handler:", error, "Command:", command);
  }
});

// For game.state, the structure is complex. Using Object for now.
socket.on("setup", (/** @type {Object} */ state) => { // TODO: Define a more specific type for game state
  try {
    console.log(`<- setup: ${JSON.stringify(state)}`);
    game.setState(state);
  } catch (error) {
    console.error("Error in 'setup' event handler:", error, "State:", state);
  }
});

/**
 * @typedef {Object} RoundInfo
 * @property {{card: string, qtdSpaces: number}} card
 * @property {string} player
 *
 * @typedef {Object} NewUserCommand
 * @property {string} id
 * @property {string} username
 * @property {RoundInfo} [round]
 */
socket.on("new_user", (/** @type {NewUserCommand} */ command) => {
  try {
    console.log(`<- "new_user" "${JSON.stringify(command)}"`);
    game.addPlayer(command);
    game.setOwnerRound(command);
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'new_user' event handler:", error, "Command:", command);
  }
});

/**
 * @typedef {Object} RemoveUserCommand
 * @property {string} id
 */
socket.on("remove_user", (/** @type {RemoveUserCommand} */ command) => {
  try {
    console.log(`<- "remove_user" "${JSON.stringify(command)}"`);
    game.removePlayer(command);
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'remove_user' event handler:", error, "Command:", command);
  }
});

/**
 * @typedef {Object} FinishRoundCommand
 * @property {string} id
 * @property {string[]} cards
 */
socket.on("finish_round", (/** @type {FinishRoundCommand} */ command) => {
  try {
    console.log(`<- "finish_round" "${JSON.stringify(command)}"`);
    game.finishRound(command); // game.finishRound was updated to expect {id, cards}
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'finish_round' event handler:", error, "Command:", command);
  }
});

/**
 * @typedef {Object} NextTurnCommand
 * @property {string} winner
 * @property {string[]} cards - winning cards
 * @property {string} answer - black card text
 * @property {RoundInfo} newRound
 * @property {string} [id] - judge's id, often part of command from server
 */
socket.on("next_turn", (/** @type {NextTurnCommand} */ command) => {
  try {
    console.log(`<- "next_turn" "${JSON.stringify(command)}"`);
    game.setWinnerSetupNextTurn(command);
    ses.storeCards(game.getMyCards(id));
    swal(
      `O vencedor foi ${game.getPlayerName(command.winner)}\n\n${
        command.answer
      }\n\n${command.cards.join(", ")}` // Ensure cards are nicely formatted
    );
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'next_turn' event handler:", error, "Command:", command);
  }
});

// Select card
function cardSelected(game) {
  try {
    if (game.isBlocked(id)) {
      swal("Espera sua vez caraio.");
      return;
    }

    const elCards = document.getElementsByClassName("selected");
    const round = game.getRound();

    const cards = Array.from(elCards).map((elem) => elem.innerHTML);
    const command = { id: id, cards: cards }; 
    if (game.yourTurn(id)) {
      if (elCards.length !== 1) { // Use !==
        swal("Selecione uma carta como vencedora, jumento.");
        return;
      }

      command.winner = elCards[0].getAttribute("id");
      command.answer = round.card;
      console.log(`-> "selected_winner" "${JSON.stringify(command)}"`);
      socket.emit("selected_winner", command);
    } else {
      if (elCards.length !== round.qtdSpaces) { // Use !==
        swal(`Selecione ${round.qtdSpaces} carta(s), jumento.`);
        return;
      }

      console.log(`-> "selected_card" "${JSON.stringify(command)}"`);
      socket.emit("selected_card", command);
    }
  } catch (error) {
    console.error("Error in cardSelected function:", error);
    swal("Ocorreu um erro ao selecionar o card. Tente novamente.");
  }
}

document.getElementById("finish").addEventListener("click", () => {
  try {
    cardSelected(game);
  } catch (error) {
    console.error("Error in 'finish' button click listener:", error);
    swal("Ocorreu um erro. Tente novamente.");
  }
});

document.getElementById("disconnect").addEventListener("click", () => {
  try {
    ses.clear();
    swal("Você foi desconectado.");
  } catch (error) {
    console.error("Error in 'disconnect' button click listener:", error);
  }
});
