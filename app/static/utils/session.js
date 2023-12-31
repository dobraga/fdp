export default function session() {
  const mapping = {
    id: "id",
    name: "name",
    cards: "cards",
  };

  function getId() {
    const key = `card-game-${mapping.id}`;
    const value = getLocalStorageWithExpiration(key);
    if (value == undefined) {
      const id = crypto.randomUUID();
      setLocalStorageWithExpiration(key, id, 60);
      return id;
    }
    return value;
  }

  function getName() {
    const key = `card-game-${mapping.name}`;
    const value = getLocalStorageWithExpiration(key);
    if (value == undefined) {
      let username = null
      while (username == null || username == undefined || username == '' || username == 0) {
        username = prompt("Please enter your name").trim();
      }
      setLocalStorageWithExpiration(key, username, 60);
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
    const value = getLocalStorageWithExpiration(key);
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
    setLocalStorageWithExpiration(key, value, 60);
  }

  function getPoints() {}
  function storePoints() {}

  return { getId, getName, clear, getCards, storeCards, getPoints, storePoints };
}


function setLocalStorageWithExpiration(key, value, expirationMinutes) {
  const now = new Date();
  const expirationTime = now.getTime() + expirationMinutes * 60 * 1000; // Convert minutes to milliseconds
  const data = {
    value: value,
    expirationTime: expirationTime,
  };
  localStorage.setItem(key, JSON.stringify(data));
}

// Function to get data from localStorage and check expiration
function getLocalStorageWithExpiration(key) {
  const storedData = localStorage.getItem(key);
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    const now = new Date();
    if (now.getTime() < parsedData.expirationTime) {
      return parsedData.value;
    } else {
      // Data has expired, remove it from localStorage
      localStorage.removeItem(key);
    }
  }
  return null;
}
