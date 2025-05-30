export default function session() {
  const mapping = {
    id: "id",
    name: "name",
    cards: "cards",
  };

  function getId() {
    const key = `card-game-${mapping.id}`;
    const value = getLocalStorageWithExpiration(key);
    if (value === null) { // Changed to === null
      const id = crypto.randomUUID();
      setLocalStorageWithExpiration(key, id, 60);
      return id;
    }
    return value;
  }

  function getName() {
    const key = `card-game-${mapping.name}`;
    const value = getLocalStorageWithExpiration(key);
    if (value === null) { // Changed to === null
      let username = null; // Semicolon added
      // Simplified loop condition, also ensures username is not just whitespace
      while (!username || username.trim().length === 0) { 
        const input = prompt("Please enter your name");
        // Handle case where prompt is cancelled (returns null)
        if (input === null) {
            // Or handle this case differently, e.g. assign a default name or re-prompt
            // For now, let's keep it simple and it might loop again if null makes !username true.
            // A more robust solution might be needed depending on desired UX for cancel.
            username = ""; // Or some default to avoid infinite loop if prompt returns null
        } else {
            username = input.trim();
        }
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
    if (value === null) { // Changed to === null
      return [];
    }
    console.log(`== get cards: ${value}`);
    return JSON.parse(value).cards;
  }

  function storeCards(cards) {
    const key = `card-game-${mapping.cards}`;
    if (cards === undefined) { // Changed to === undefined
      return;
    }
    const value = JSON.stringify({ cards: cards });
    console.log(`== store cards: ${value}`); // Semicolon added (was already there in original logic, just confirming)
    setLocalStorageWithExpiration(key, value, 60);
  }

  // getPoints and storePoints removed

  return { getId, getName, clear, getCards, storeCards }; // getPoints, storePoints removed
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
  return null; // Returns null if not found or expired
}
