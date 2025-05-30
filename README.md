# Online Card Game: "Cards of Chaos" 🃏

## Description

"Cards of Chaos" is a web-based multiplayer card game inspired by the popular party game Cards Against Humanity. Players use white cards to answer questions or fill in blanks on black cards, aiming to create the funniest or most fitting combinations. A rotating judge (Card Czar) decides the winner of each round.

## Features

*   **Real-time Multiplayer Gameplay**: Connect and play with friends online.
*   **Interactive Card Selection**: Easily drag, click, or tap to choose and submit your cards.
*   **Round-Based Judging System**: One player acts as the Card Czar each round to pick the winning card combination.
*   **Dynamic Player List**: See who is currently in the game.
*   **Score Keeping**: Track wins throughout the game.

## Tech Stack

*   **Backend**:
    *   [Deno](https://deno.land/) (Runtime Environment)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [Oak](https://oakserver.github.io/oak/) (Middleware framework for Deno, similar to Koa)
    *   [Socket.io](https://socket.io/) (For real-time WebSocket communication)
*   **Frontend**:
    *   Plain JavaScript (ES6 Modules)
    *   HTML5
    *   CSS3
*   **Data**:
    *   JSON for card decks.

## Setup and Installation

### Prerequisites

*   **Deno**: You'll need Deno installed on your system. We recommend using the latest stable version.
    *   Follow the official installation guide: [Deno Installation](https://deno.land/manual@v1.x/getting_started/installation)

### Steps

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/dobraga/fdp
    ```

2.  **Navigate to the project directory**:
    ```bash
    cd cards-of-chaos 
    ```
    *(Or your chosen project directory name)*

3.  **Start the application**:
    The server will typically start on `http://localhost:8000`.
    ```bash
    deno task start
    ```
    This command uses Deno's task runner to execute the start script defined in `deno.json`, which includes auto-reloading on file changes (`--watch`).

## Project Structure

Here's a brief overview of key directories and files:

*   `app/`: Contains the main application logic.
    *   `app/routes/`: Server-side routing handlers, including HTTP (via Oak) and WebSocket event handlers (via Socket.io).
    *   `app/static/`: All frontend assets served to the client.
        *   `app/static/utils/`: Client-side JavaScript utility modules (e.g., core game logic, session management, UI rendering).
        *   `app/static/data/`: JSON files containing the black and white card decks.
    *   `app.ts`: The main entry point for the Deno application.
*   `deno.json`: Deno configuration file, specifying tasks (like `start`), import maps, etc.
*   `import_map.json`: Manages project dependencies and their URLs for Deno.
*   `test/`: Contains unit tests for the application (e.g., `game_test.js`).
*   `README.md`: This file, providing information about the project.

## How to Play

1.  **Joining the Game**: Open the game URL in your browser. Enter a username to join.
2.  **Starting a Round**: The game begins when enough players have joined.
3.  **The Card Czar**:
    *   One player is chosen as the "Card Czar" (the judge) for the round.
    *   The Card Czar is presented with a black card containing a question or fill-in-the-blank phrase.
4.  **Playing White Cards**:
    *   All other players receive a hand of white cards (typically 10).
    *   Players select the white card(s) from their hand that they think best or most humorously complete the phrase on the black card.
    *   Once selected, players submit their chosen card(s).
5.  **Judging**:
    *   After all players (or a timeout) have submitted their cards, the Card Czar is shown the submissions anonymously.
    *   The Card Czar reads out the black card combined with each submission and chooses their favorite.
6.  **Winning a Round**:
    *   The player who submitted the Card Czar's chosen white card(s) wins the round and scores a point.
7.  **Next Round**:
    *   The role of Card Czar rotates to the next player.
    *   All players draw back up to their full hand size.
    *   A new black card is drawn, and the game continues.
8.  **Winning the Game**: The game can be played for a predetermined number of rounds or until a certain score is reached.

Have fun playing "Cards of Chaos"!
