export default function session() {
  const mapping = {
    id: "id",
    cards: "cards",
  };

  function connect() {
    const key = `card-game-${mapping.id}`;
    const value = localStorage.getItem(key);
    if (value == undefined) {
      const id = crypto.randomUUID();
      localStorage.setItem(key, id);
      return id;
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

  return { connect, clear, getCards, storeCards, getPoints, storePoints };
}
