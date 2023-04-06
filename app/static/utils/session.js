export default function session() {
  const mapping = {
    id: "id",
    name: "name",
    cards: "cards",
  };

  function getId() {
    const key = `card-game-${mapping.id}`;
    const value = localStorage.getItem(key);
    if (value == undefined) {
      const id = crypto.randomUUID();
      localStorage.setItem(key, id);
      return id;
    }
    return value;
  }

  function getName() {
    const key = `card-game-${mapping.name}`;
    const value = localStorage.getItem(key);
    if (value == undefined) {
      let username = null
      while (username == null || username == undefined || username == '') {
        username = prompt("Please enter your name").trim();
      }
      localStorage.setItem(key, username);
      return username;
    }
    return value;
  }

  function clear() {
    for (const k of Object.keys(mapping)) {
      const key = `card-game-${k}`;
      console.log(`Removing "${key}"`);
      localStorage.removeItem(key);
    }
    window.location.reload();
  }

  function getCards() {
    const key = `card-game-${mapping.cards}`;
    const value = localStorage.getItem(key);
    if (value == undefined) {
      return [];
    }
    console.log(`== get cards: ${value}`);
    return JSON.parse(value).cards;
  }
  function storeCards(cards) {
    const key = `card-game-${mapping.cards}`;
    if (cards == undefined) {
      return;
    }
    const value = JSON.stringify({ cards: cards });
    console.log(`== store cards: ${value}`)
    localStorage.setItem(key, value);
  }

  function getPoints() {}
  function storePoints() {}

  return { getId, getName, clear, getCards, storeCards, getPoints, storePoints };
}
