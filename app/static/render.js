export default function render(game, OwnerUsername) {
  console.log(`Rendering page for ${OwnerUsername}`);
  renderListPlayers(game, OwnerUsername);
  renderCards(game, OwnerUsername);
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

  console.log(`Your turn? ${yourTurn}`);
  document.querySelector("#principal_card").innerHTML = game.getRound().card;

  if (yourTurn) {
    const selectedCards = game.getSelectedCards();
    const finished = game.allPlayersFinished();
    console.log(`Others players finished? ${finished}`);

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
