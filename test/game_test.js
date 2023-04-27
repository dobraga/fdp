import { assertNotEquals, assertEquals } from "assert";

import createGame from "../app/static/utils/game.js";
import createDeck from "../app/static/utils/deck.ts";

const game = createGame();
const deck = createDeck();

const user1 = {
  id: 235432623,
  username: "teste12",
  cards: deck.white(10),
  round: {
    "card": deck.black(),
    "player": 235432623,
  },
};

const user2 = {
  id: 785685685,
  username: "teste45",
  cards: deck.white(10),
};

Deno.test("Setup game", () => {
  game.setOwnerRound(user1);
  game.addPlayer(user1);
  game.setCardsHand(user1);
  assertEquals(game.hand[user1.id].length, 10);

  game.addPlayer(user2);
  game.setCardsHand(user2);
  assertEquals(game.hand[user2.id].length, 10);
});

Deno.test("Select card and set winner", () => {
  const selected_card = user2.cards.slice(0, user1.round.card.qtdSpaces)
  const command = {
    id: user2.id,
    cards: selected_card,
    nextCard: deck.white(game.state.round.qtdSpaces),
  };
  game.finishRound(command);

  const command_win = {
    winner: user2.id,
    cards: selected_card,
    answer: user1.round.card,
    newRound: deck.black()
  }
  const old_white_cards = JSON.stringify(game.hand[user2.id]);
  game.setWinnerSetupNextTurn(command_win)

  assertNotEquals(old_white_cards, JSON.stringify(game.hand[user2.id]))
});
