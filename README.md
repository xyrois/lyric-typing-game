# Lyric Typing Game

A live-synced lyric typing game built with Next.js. Pick a song, watch the embedded YouTube video, and type the lyrics in real time as they appear.

## Features

- Song selection screen
- YouTube video embed
- Synced lyric display
- Current lyric and next lyric preview
- Line-by-line typing — press space after finishing a line to start the next early
- Green/red character feedback for correct and incorrect typing
- Live score tracker
- Accuracy tracking
- Missed/wrong character penalties
- Final summary screen
- Replay song option

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MySQL](https://www.mysql.com/)
- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)

## Database Schema

The MVP uses three main tables: `songs`, `lyrics`, and `scores`.

### `songs`

Stores song metadata.

```sql
CREATE TABLE songs (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    artist           VARCHAR(255) NOT NULL,
    youtube_video_id VARCHAR(50)  NOT NULL,
    duration_seconds INT,
    difficulty       ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `lyrics`

Stores synced lyric lines.

```sql
CREATE TABLE lyrics (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    song_id    INT          NOT NULL,
    line_index INT          NOT NULL,
    start_time DECIMAL(8,3) NOT NULL,
    end_time   DECIMAL(8,3),
    text       TEXT         NOT NULL,

    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);
```

### `scores`

Stores player scores.

```sql
CREATE TABLE scores (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    display_name     VARCHAR(100)  NOT NULL,
    song_id          INT           NOT NULL,
    wpm              DECIMAL(6,2)  NOT NULL,
    accuracy         DECIMAL(5,2)  NOT NULL,
    timing_accuracy  DECIMAL(5,2)  NOT NULL,
    final_score      INT           NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);
```

## Getting Started

**1. Install dependencies**

```bash
npm install
```

**2. Create a local environment file**

```bash
touch .env.local
```

**3. Add your database credentials**

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=lyric_typing_game
```

> Do not commit `.env.local`. An `.env.example` file can be included as a reference template.

**4. Run the development server**

```bash
npm run dev
```

**5. Open the app**

```
http://localhost:3000
```

## Environment Variables

| Variable      | Description              | Example                  |
|---------------|--------------------------|--------------------------|
| `DB_HOST`     | MySQL host               | `localhost`              |
| `DB_USER`     | MySQL user               | `root`                   |
| `DB_PASSWORD` | MySQL password           | `your_mysql_password`    |
| `DB_NAME`     | MySQL database name      | `lyric_typing_game`      |

## API Routes

| Method | Route                    | Description              |
|--------|--------------------------|--------------------------|
| `GET`  | `/api/songs`             | List all songs           |
| `GET`  | `/api/songs/:id/lyrics`  | Get lyrics for a song    |

**Example**

```
GET /api/songs/1/lyrics
```

## Scoring

```
score = (correct characters × 10)
      - (incorrect characters × 5)
      - (missed characters × 3)
```

Score cannot go below zero.

```
accuracy = correct characters / total typed characters
```

## MVP Status

### Shipped

- [x] Song picker
- [x] Synced lyrics
- [x] YouTube playback
- [x] Typing input
- [x] Live scoring
- [x] Final score summary
- [x] Replay functionality

### Planned

- [ ] Save scores to the database
- [ ] Leaderboard page
- [ ] User accounts
- [ ] More songs
- [ ] WPM calculation
- [ ] Timing accuracy calculation
- [ ] Admin page for adding synced lyrics