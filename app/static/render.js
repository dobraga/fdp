export default function render(game, username) {
  renderListPlayers(game, username);
  renderCards(game, username);
}

function renderListPlayers(game, username) {
  const ul = document.querySelector("#users");
  ul.innerHTML = "";

  for (const player in game.state.players) {
    const li = document.createElement("li");
    const qtdWins = game.qtdWins(player);
    li.appendChild(document.createTextNode(`${player}(${qtdWins})`));

    if (game.youFinished(player)) {
      li.classList.add("finished");
    }
    if (game.yourTurn(player)) {
      li.classList.add("turn");
    }
    if (player == username) {
      li.classList.add("you");
    }
    ul.appendChild(li);
  }
}

function renderCards(game, username) {
  const cards = document.querySelector("#cards");
  const isBlocked = game.isBlocked(username);
  cards.innerHTML = "";

  document.querySelector("#principal_card").innerHTML = game.state.round.card;

  if (game.yourTurn(username)) {
    const selectedCards = game.getSelectedCards();
    const finished = game.allPlayersFinished();

    for (const selected in selectedCards) {
      if (selected == username) {
        continue
      }
      const card = document.createElement("div");
      card.className = "card";
      if (finished) {
        card.innerHTML = selectedCards[selected];
        const att = document.createAttribute('id');
        card.setAttributeNode(att);
        att.value = selected;
        addEventListenerCards(card);
      }
      cards.appendChild(card);
    }
  } else {
    const myCards = game.getMyCards(username);
    for (const i in myCards) {
      const card = document.createElement("div");

      card.className = "card";
      card.innerHTML = myCards[i];
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
    const allCards = Array.from(document.getElementsByClassName("card"));

    allCards.forEach((newel) => {
      newel.classList.remove("selected");
    });

    el.target.classList.add("selected");
  });
}
