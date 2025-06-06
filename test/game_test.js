import {
  assertEquals,
  assertExists,
  assertFalse,
} from "jsr:@std/assert";

import createGame from "../app/static/utils/game.js";

// Re-define null_state for comparison as it's not exported from game.js
const NULL_STATE = {
  players: {},
  round: {
    current: null,
    card: null,
    qtdSpaces: 0,
  },
};

Deno.test("Game Initialization", () => {
  const game = createGame();
  assertEquals(game.state, NULL_STATE, "Initial state should match NULL_STATE");
  assertEquals(game.hand, {}, "Initial hand should be an empty object");
  assertEquals(game.wins, {}, "Initial wins should be an empty object");
});

Deno.test("Player Management", async (t) => {
  await t.step("addPlayer", () => {
    const game = createGame();
    const player1 = { id: "p1", username: "Player One" };
    game.addPlayer(player1);

    assertExists(
      game.state.players[player1.id],
      "Player should be added to state.players"
    );
    assertEquals(
      game.state.players[player1.id].name,
      player1.username,
      "Player name should match"
    );
    assertEquals(
      game.state.players[player1.id].round,
      { finished: false, card: null },
      "Player round state should be initial"
    );
    assertEquals(
      game.wins[player1.id],
      [],
      "Player wins should be an empty array"
    );
    assertEquals(game.qtdPlayers(), 1, "Quantity of players should be 1");
  });

  await t.step("setCardsHand", () => {
    const game = createGame();
    const player1 = { id: "p1", username: "Player One" };
    game.addPlayer(player1); // Player needs to exist for hand
    const cards = ["c1", "c2", "c3"];
    game.setCardsHand({ id: player1.id, cards: cards });
    assertEquals(
      game.hand[player1.id],
      cards,
      "Should set cards for the player"
    );
    assertEquals(
      game.getMyCards(player1.id),
      cards,
      "getMyCards should return the set cards"
    );
  });

  await t.step("addCardsToHand", () => {
    const game = createGame();
    const player1 = { id: "p1", username: "Player One" };
    game.addPlayer(player1);

    // Test adding to non-existent hand
    const cards1 = ["c1", "c2"];
    game.addCardsToHand(player1.id, cards1);
    assertEquals(
      game.getMyCards(player1.id),
      cards1,
      "Should add cards to a new hand"
    );

    // Test adding to existing hand
    const cards2 = ["c3", "c4"];
    game.addCardsToHand(player1.id, cards2);
    assertEquals(
      game.getMyCards(player1.id),
      ["c1", "c2", "c3", "c4"],
      "Should append cards to existing hand"
    );
  });

  await t.step("removePlayer - non-owner", () => {
    const game = createGame();
    const p1 = { id: "p1", username: "Player One" };
    const p2 = { id: "p2", username: "Player Two" };
    game.addPlayer(p1);
    game.setCardsHand({ id: p1.id, cards: ["p1c1"] });
    game.addPlayer(p2);
    game.setCardsHand({ id: p2.id, cards: ["p2c1"] });
    game.setOwnerRound({
      round: { player: p1.id, card: { card: "Black Card", qtdSpaces: 1 } },
    });

    game.removePlayer({ id: p2.id });
    assertEquals(game.qtdPlayers(), 1, "Should have 1 player left");
    assertFalse(
      p2.id in game.state.players,
      "Player p2 should be removed from state.players"
    );
    assertFalse(p2.id in game.hand, "Player p2 should be removed from hand");
    assertFalse(p2.id in game.wins, "Player p2 should be removed from wins");
    assertEquals(
      game.getRound().current,
      p1.id,
      "p1 should still be the owner"
    );
  });

  await t.step("removePlayer - owner, others remain", () => {
    const game = createGame();
    const p1 = { id: "p1", username: "Player One" };
    const p2 = { id: "p2", username: "Player Two" };
    const p3 = { id: "p3", username: "Player Three" };
    game.addPlayer(p1);
    game.addPlayer(p2);
    game.addPlayer(p3);
    game.setOwnerRound({
      round: { player: p1.id, card: { card: "Black Card", qtdSpaces: 1 } },
    });

    game.removePlayer({ id: p1.id });
    assertEquals(game.qtdPlayers(), 2, "Should have 2 players left");
    assertFalse(p1.id in game.state.players, "Player p1 should be removed");
    assertEquals(game.getRound().current, p2.id, "Ownership should pass to p2");
  });

  await t.step("removePlayer - owner, last player", () => {
    const game = createGame();
    const p1 = { id: "p1", username: "Player One" };
    game.addPlayer(p1);
    game.setOwnerRound({
      round: { player: p1.id, card: { card: "Black Card", qtdSpaces: 1 } },
    });

    game.removePlayer({ id: p1.id });
    assertEquals(game.qtdPlayers(), 0, "Should have 0 players left");
    // Check if state is reset to null_state (or parts of it)
    assertEquals(game.state.players, {}, "Players should be empty");
    assertEquals(
      game.state.round.current,
      null,
      "Current round owner should be null"
    );
    assertEquals(game.hand, {}, "Hand should be empty");
    assertEquals(game.wins, {}, "Wins should be empty");
    // Check deep reset for state
    assertEquals(
      game.state,
      NULL_STATE,
      "Full state should be reset to NULL_STATE"
    );
  });
});

Deno.test("Round and Turn Management", async (t) => {
  await t.step("setOwnerRound", () => {
    const game = createGame();
    const p1 = { id: "p1" };
    const roundInfo = {
      player: p1.id,
      card: { card: "Test Black Card", qtdSpaces: 2 },
    };
    game.addPlayer({ id: p1.id, username: "P1" }); // Player must exist
    game.setOwnerRound({ round: roundInfo });

    assertEquals(game.getRound().current, p1.id);
    assertEquals(game.getRound().card, "Test Black Card");
    assertEquals(game.getRound().qtdSpaces, 2);
  });

  await t.step("yourTurn", () => {
    const game = createGame();
    const p1 = { id: "p1", username: "P1" };
    const p2 = { id: "p2", username: "P2" };
    game.addPlayer(p1);
    game.addPlayer(p2);
    game.setOwnerRound({
      round: { player: p1.id, card: { card: "BC", qtdSpaces: 1 } },
    });

    assertFalse(!game.yourTurn(p1.id), "Should be p1's turn");
    assertFalse(game.yourTurn(p2.id), "Should not be p2's turn");
  });

  await t.step("getPlayers & qtdPlayers", () => {
    const game = createGame();
    assertEquals(game.getPlayers(), [], "Should be empty initially");
    assertEquals(game.qtdPlayers(), 0, "Should be 0 initially");

    game.addPlayer({ id: "p1", username: "P1" });
    game.addPlayer({ id: "p2", username: "P2" });
    assertEquals(
      game.getPlayers().sort(),
      ["p1", "p2"].sort(),
      "Should return list of player IDs"
    );
    assertEquals(game.qtdPlayers(), 2, "Should be 2 after adding players");
  });

  // Removed direct test for setNextOwnerPlayer as it's an internal function.
  // Testing its behavior indirectly via removePlayer and setWinnerSetupNextTurn.

  await t.step(
    "setNextOwnerPlayer behavior - owner removed, 3 players (p1 -> p2)",
    () => {
      const game = createGame();
      const p1 = { id: "p1", username: "P1" };
      const p2 = { id: "p2", username: "P2" };
      const p3 = { id: "p3", username: "P3" };
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.addPlayer(p3);
      game.setOwnerRound({
        round: { player: p1.id, card: { card: "BC", qtdSpaces: 1 } },
      });

      game.removePlayer({ id: p1.id }); // p1 (owner) removed
      assertEquals(game.getRound().current, p2.id, "Owner should cycle to p2");
    }
  );

  await t.step(
    "setNextOwnerPlayer behavior - owner removed, 2 players (p2 -> p1 after p2 removed)",
    () => {
      const game = createGame();
      const p1 = { id: "p1", username: "P1" };
      const p2 = { id: "p2", username: "P2" };
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.setOwnerRound({
        round: { player: p2.id, card: { card: "BC", qtdSpaces: 1 } },
      });

      game.removePlayer({ id: p2.id }); // p2 (owner) removed
      assertEquals(
        game.getRound().current,
        p1.id,
        "Owner should be p1 (the only one left)"
      );
    }
  );

  await t.step(
    "setNextOwnerPlayer behavior - after round win, 3 players (p1 judge, p2 wins -> p2 new judge)",
    () => {
      const game = createGame();
      const p1 = { id: "p1", username: "P1" }; // Initial Judge
      const p2 = { id: "p2", username: "P2" };
      const p3 = { id: "p3", username: "P3" };
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.addPlayer(p3);
      game.setOwnerRound({
        round: { player: p1.id, card: { card: "Black Card 1", qtdSpaces: 1 } },
      });
      // Simulate p2 playing a card (needed for wins array)
      game.finishRound({ id: p2.id, cards: ["p2_card"] });

      // p2 wins the round judged by p1
      game.setWinnerSetupNextTurn({
        winner: p2.id,
        cards: ["p2_card"],
        answer: "Black Card 1",
        newRound: { card: "Black Card 2", qtdSpaces: 1 },
      });
      // getNextOwnerPlayer is called from p1 (previous owner), so it should return p2.
      assertEquals(game.getRound().current, p2.id, "New judge should be p2");
    }
  );

  await t.step(
    "setNextOwnerPlayer behavior - after round win, 3 players (p2 judge, p3 wins -> p3 new judge)",
    () => {
      const game = createGame();
      const p1 = { id: "p1", username: "P1" };
      const p2 = { id: "p2", username: "P2" }; // Initial Judge
      const p3 = { id: "p3", username: "P3" };
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.addPlayer(p3);
      game.setOwnerRound({
        round: { player: p2.id, card: { card: "Black Card 1", qtdSpaces: 1 } },
      });
      game.finishRound({ id: p3.id, cards: ["p3_card"] });

      game.setWinnerSetupNextTurn({
        winner: p3.id,
        cards: ["p3_card"],
        answer: "Black Card 1",
        newRound: { card: "Black Card 2", qtdSpaces: 1 },
      });
      assertEquals(game.getRound().current, p3.id, "New judge should be p3");
    }
  );

  await t.step(
    "setNextOwnerPlayer behavior - after round win, 3 players (p3 judge, p1 wins -> p1 new judge, wrap around)",
    () => {
      const game = createGame();
      const p1 = { id: "p1", username: "P1" };
      const p2 = { id: "p2", username: "P2" };
      const p3 = { id: "p3", username: "P3" }; // Initial Judge
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.addPlayer(p3);
      game.setOwnerRound({
        round: { player: p3.id, card: { card: "Black Card 1", qtdSpaces: 1 } },
      });
      game.finishRound({ id: p1.id, cards: ["p1_card"] });

      game.setWinnerSetupNextTurn({
        winner: p1.id,
        cards: ["p1_card"],
        answer: "Black Card 1",
        newRound: { card: "Black Card 2", qtdSpaces: 1 },
      });
      assertEquals(
        game.getRound().current,
        p1.id,
        "New judge should be p1 (wrap around)"
      );
    }
  );
});

Deno.test("Game State & Actions", async (t) => {
  await t.step("finishRound", () => {
    const game = createGame();
    const p1 = { id: "p1", username: "P1" };
    game.addPlayer(p1);
    const playedCards = ["white_card1", "white_card2"];
    game.finishRound({ id: p1.id, cards: playedCards });

    assertFalse(
      !game.state.players[p1.id].round.finished,
      "Player's round should be marked finished"
    );
    assertEquals(
      game.state.players[p1.id].round.cards,
      playedCards,
      "Played cards should be stored"
    );
  });

  await t.step("setWinnerSetupNextTurn - new version", () => {
    const game = createGame();
    const p1 = { id: "p1", username: "P1" };
    const p2 = { id: "p2", username: "P2" };
    game.addPlayer(p1);
    game.addPlayer(p2);

    // p1 is initial owner/judge
    game.setOwnerRound({
      round: { player: p1.id, card: { card: "Old Black Card", qtdSpaces: 1 } },
    });

    // p2 plays a card
    const p2PlayedCard = "p2_white_card";
    game.finishRound({ id: p2.id, cards: [p2PlayedCard] });

    const winnerCommand = {
      winner: p2.id, // p2 wins
      cards: [p2PlayedCard], // p2's winning card
      answer: "Old Black Card", // The black card for that round
      newRound: { card: "New Black Card", qtdSpaces: 1 }, // New black card for next round
    };

    game.setWinnerSetupNextTurn(winnerCommand);

    // Check wins
    assertEquals(game.wins[p2.id].length, 1, "p2 should have 1 win");
    assertEquals(
      game.wins[p2.id][0],
      { cards: [p2PlayedCard], answer: "Old Black Card" },
      "Win details should be correct"
    );

    // Check round reset for all players
    assertFalse(
      !(game.state.players[p1.id].round.finished === false &&
        game.state.players[p1.id].round.cards === null),
      "p1 round state should be reset"
    );
    assertFalse(
      !(game.state.players[p2.id].round.finished === false &&
        game.state.players[p2.id].round.cards === null),
      "p2 round state should be reset"
    );

    // Check new round owner (should be p2 as p1 was judge, p2 wins and becomes next judge)
    // The getNextOwnerPlayer logic is: current judge -> next player in list.
    // If p1 was judge, p2 is next. So p2 becomes new judge.
    assertEquals(
      game.getRound().current,
      p2.id,
      "New round owner should be p2"
    );

    // Check new black card
    assertEquals(
      game.getRound().card,
      "New Black Card",
      "New black card should be set"
    );
    assertEquals(game.getRound().qtdSpaces, 1, "New qtdSpaces should be set");
  });
});
