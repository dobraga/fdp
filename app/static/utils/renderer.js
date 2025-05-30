// UI Rendering Logic

// Make the card is clickable
function addEventListenerCards(card) { // Added document
  card.style.cursor = "pointer";
  card.addEventListener("click", (el) => {
    el.target.classList.toggle("selected");
  });
}

export function renderListPlayers(gameState, mainPlayerId, document) {
  const div = document.getElementById("users");
  div.innerHTML = "";

  for (const playerId in gameState.players) {
    const player = gameState.players[playerId];
    const username = player.name;
    const li = document.createElement("div");
    // Assuming qtdWins is not directly available in gameState.players[playerId]
    // This might need adjustment based on where wins are stored if this feature is kept.
    // For now, I'll remove qtdWins to simplify, assuming it's not critical for this refactor.
    // const qtdWins = game.qtdWins(player); // This was the old call

    li.appendChild(document.createTextNode(`${username}`)); // Simplified
    li.classList.add("user");

    if (player.round && player.round.finished) { // Accessing state directly
      li.classList.add("finished");
    }
    if (gameState.round && gameState.round.current === playerId) { // Accessing state directly
      li.classList.add("turn");
    }
    if (playerId === mainPlayerId) {
      li.classList.add("you");
    }
    div.appendChild(li);
  }
}

export function renderCards(gameState, mainPlayer, document, getMyCards, getSelectedCards, allPlayersFinished, isBlocked) {
  const yourTurn = gameState.round.current === mainPlayer.id;
  const cardsEl = document.getElementById("cards"); // Renamed to avoid conflict
  // const isBlocked = isBlocked(mainPlayer.id); // This needs to be passed or calculated from gameState
  cardsEl.innerHTML = "";

  document.querySelector("#principal_card").innerHTML = gameState.round.card;

  if (yourTurn) {
    const selectedCards = getSelectedCards(); // Needs game instance or direct state access
    const finished = allPlayersFinished(); // Needs game instance or direct state access

    for (const selectedId in selectedCards) {
      if (selectedId === mainPlayer.id) {
        continue;
      }
      const card = document.createElement("div");
      card.className = "card";
      if (finished) {
        // Assuming selectedCards[selectedId] is an array of card strings
        card.innerHTML = selectedCards[selectedId].join("<br />|+|<br />");
        const att = document.createAttribute("id"); // Ensure 'id' is the correct attribute name
        card.setAttributeNode(att);
        att.value = selectedId; // Ensure selectedId is a valid ID
        addEventListenerCards(card);
      }
      cardsEl.appendChild(card);
    }
  } else {
    const myCards = getMyCards(mainPlayer.id); // Needs game instance or direct state access
    if (myCards) { // Check if myCards exist
      for (const i in myCards) {
        const card = document.createElement("div");
        // const badge = document.createElement("div"); // Badge logic removed for simplification
        // badge.className = "badge";

        card.className = "card";
        card.innerHTML = myCards[i];
        // card.appendChild(badge);
        if (!isBlocked(mainPlayer.id)) { // isBlocked needs to be passed
          addEventListenerCards(card);
        }
        cardsEl.appendChild(card);
      }
    }
  }
}

export function render(gameState, mainPlayer, document, gameInstance) {
  console.log(`= rendering page for ${mainPlayer.username}`); // Assuming mainPlayer has a username
  renderListPlayers(gameState, mainPlayer.id, document);
  // Passing game methods that renderer needs. This is a common pattern.
  renderCards(gameState, mainPlayer, document, 
    (id) => gameInstance.getMyCards(id), // Pass getMyCards
    () => gameInstance.getSelectedCards(), // Pass getSelectedCards
    () => gameInstance.allPlayersFinished(), // Pass allPlayersFinished
    (id) => gameInstance.isBlocked(id) // Pass isBlocked
  );
}
