import shuffle from "./shuffle.js";

const null_state = {
  players: {},
  round: {
    current: null,
    card: null,
    qtdSpaces: 0,
  },
};

export default function createGame() {
  let state = JSON.parse(JSON.stringify(null_state));
  let hand = {};
  let wins = {};

  // Set owner round
  function setOwnerRound(command) {
    if (command.round) {
      state.round.current = command.round.player;
      state.round.card = command.round.card.card;
      state.round.qtdSpaces = command.round.card.qtdSpaces;
    }
  }

  // Add a player
  function addPlayer(command) {
    const id = command.id;
    const name = command.username;

    state.players[id] = {
      name: command.username,
      round: {
        finished: false,
        card: null,
      },
    };
    wins[id] = [];
    console.log(
      `= new client connected: "${name}(${id})", have ${qtdPlayers()} players.`
    );
  }

  // Set cards
  function setCardsHand(command) {
    hand[command.id] = command.cards;
  }

  // Remove the player
  function removePlayer(command) {
    const id = command.id;
    console.log(`Client ${id} disconnected`);
    if (yourTurn(command.id)) {
      console.log("remove_current_owner");
      setNextOwnerPlayer();
    }
    delete state.players[id];

    // If remove all player clean workspace
    if (qtdPlayers() == 0) {
      state = JSON.parse(JSON.stringify(null_state));
      wins = {};
      hand = {};
    }
  }

  // Get list of players
  function getPlayers() {
    return Object.keys(state.players);
  }

  // Set state on setup
  function setState(newState) {
    Object.assign(state, newState);
  }

  // Check if all players finished
  function allPlayersFinished() {
    let finished = true;
    for (const check_id of getPlayers()) {
      finished =
        finished &&
        (yourTurn(check_id) || state.players[check_id].round.finished);
    }
    return finished;
  }

  // Check is blocked
  function isBlocked(id) {
    let check;
    if (yourTurn(id)) {
      if (qtdPlayers() == 1) {
        check = true;
      } else {
        check = !allPlayersFinished();
      }
    } else {
      check = youFinished(id);
    }
    console.log(`= is blocked ${id}? ${check}`);
    return check;
  }

  // Check if is your turn
  function yourTurn(id) {
    if (state.players[id] != undefined) {
      return state.round.current == id;
    }
    return false;
  }

  // Check if the user finish the round
  function youFinished(id) {
    if (state.players[id] != undefined) {
      return state.players[id].round.finished;
    }
    return false;
  }

  // Finish round and prepare next round
  function finishRound(command) {
    state.players[command.id].round.finished = true;
    state.players[command.id].round.cards = command.cards;
    state.players[command.id].round.nextCard = command.nextCard;
  }

  // Buy card
  function buyCard(command) {
    const id = command.id;
    const cards = state.players[id].round.cards;

    if (hand[id] == undefined) {
      return;
    }

    for (const [i, card] of cards.entries()) {
      const index = positionCard({ id: id, card: card });
      const nextCard = state.players[id].round.nextCard[i];
      console.log(`Change ${index}("${card}") -> "${nextCard}"`);
      hand[id][index] = nextCard;
    }
  }

  // Get selected cards
  function getSelectedCards() {
    const selectedCards = {};
    for (const id of shuffle(getPlayers())) {
      if (state.players[id].round.cards != undefined) {
        selectedCards[id] = state.players[id].round.cards;
      } else {
        selectedCards[id] = "espera os doentes escolherem as cartas";
      }
    }
    return selectedCards;
  }

  // Get position of selected card
  function positionCard(command) {
    return hand[command.id].indexOf(command.card);
  }

  // Get possible cards
  function getMyCards(id) {
    if (state.players[id] != undefined) {
      return hand[id];
    }
  }

  // # players
  function qtdPlayers() {
    return Object.keys(state.players).length;
  }

  // # where the player wins
  function qtdWins(id) {
    const w = wins[id];
    if (w == undefined) {
      return 0;
    }
    return w.length;
  }

  // Get next owner of turn
  function getNextOwnerPlayer() {
    const players = getPlayers();
    const currentPosition = players.indexOf(state.round.current);
    let newPosition = currentPosition + 1;
    if (currentPosition >= qtdPlayers() - 1) {
      newPosition = 0;
    }

    const newPlayerTurn = players[newPosition];
    console.log(
      `Turn pass from "${state.round.current}(position: ${currentPosition})" to "${newPlayerTurn}(position: ${newPosition})"`
    );
    return newPlayerTurn;
  }

  function setNextOwnerPlayer() {
    const players = getPlayers();
    const currentPosition = players.indexOf(state.round.current);
    let newPosition = currentPosition + 1;
    if (currentPosition >= qtdPlayers() - 1) {
      newPosition = 0;
    }

    const newPlayerTurn = players[newPosition];
    console.log(
      `Turn pass from "${state.round.current}(position: ${currentPosition})" to "${newPlayerTurn}(position: ${newPosition})"`
    );
    state.round.current = newPlayerTurn;
  }

  // Set winner and setup the next round
  function setWinnerSetupNextTurn(command) {
    const winner = command.winner;

    wins[winner] = wins[winner].concat([
      { cards: command.cards, answer: command.answer },
    ]);

    for (const id of getPlayers()) {
      if (yourTurn(id)) {
        continue;
      }
      buyCard({ id: id });
      state.players[id].round = { finished: false, card: null };
    }

    const commandNextTurn = {
      round: {
        player: getNextOwnerPlayer(),
        card: {
          card: command.newRound.card,
          qtdSpaces: command.newRound.qtdSpaces,
        },
      },
    };
    setOwnerRound(commandNextTurn);
  }

  // Get player name
  function getPlayerName(id) {
    return state.players[id].name;
  }

  // Get current round
  function getRound() {
    return state.round;
  }

  function render(OwnerUsername) {
    console.log(`= rendering page for ${OwnerUsername}`);
    renderListPlayers(this, OwnerUsername);
    renderCards(this, OwnerUsername);
  }

  return {
    render,
    state,
    hand,
    wins,
    setState,

    addPlayer,
    removePlayer,

    getPlayerName,
    getRound,
    setOwnerRound,
    getPlayers,

    isBlocked,
    finishRound,
    yourTurn,
    youFinished,

    getSelectedCards,
    setCardsHand,
    getMyCards,
    qtdPlayers,
    allPlayersFinished,
    setWinnerSetupNextTurn,
    qtdWins,
  };
}

function renderListPlayers(game, OwnerUsername) {
  const div = document.getElementById("users");
  div.innerHTML = "";

  for (const player of game.getPlayers()) {
    const username = game.getPlayerName(player);
    const li = document.createElement("div");
    const qtdWins = game.qtdWins(player);

    li.appendChild(document.createTextNode(`${username}(${qtdWins})`));
    li.classList.add("user");

    if (game.youFinished(player)) {
      li.classList.add("finished");
    }
    if (game.yourTurn(player)) {
      li.classList.add("turn");
    }
    if (player == OwnerUsername) {
      li.classList.add("you");
    }
    div.appendChild(li);
  }
}

function renderCards(game, OwnerUsername) {
  const yourTurn = game.yourTurn(OwnerUsername);
  const cards = document.getElementById("cards");
  const isBlocked = game.isBlocked(OwnerUsername);
  cards.innerHTML = "";

  document.querySelector("#principal_card").innerHTML = game.getRound().card;

  if (yourTurn) {
    const selectedCards = game.getSelectedCards();
    const finished = game.allPlayersFinished();

    for (const selected in selectedCards) {
      if (selected == OwnerUsername) {
        continue;
      }
      const card = document.createElement("div");
      card.className = "card";
      if (finished) {
        card.innerHTML = selectedCards[selected].join("<br />|+|<br />");
        const att = document.createAttribute("id");
        card.setAttributeNode(att);
        att.value = selected;
        addEventListenerCards(card);
      }
      cards.appendChild(card);
    }
  } else {
    const myCards = game.getMyCards(OwnerUsername);
    for (const i in myCards) {
      const card = document.createElement("div");
      const badge = document.createElement("div");
      badge.className = "badge";

      card.className = "card";
      card.innerHTML = myCards[i];
      // card.appendChild(badge);
      if (!isBlocked) {
        addEventListenerCards(card);
      }
      cards.appendChild(card);
    }
  }
}

// Make the card is clickable
function addEventListenerCards(card) {
  card.style.cursor = "pointer";
  card.addEventListener("click", (el) => {
    el.target.classList.toggle("selected");
  });
}
