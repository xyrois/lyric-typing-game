"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

function compareText(expected, typed) {
  let correct = 0;
  let incorrect = 0;

  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === expected[i]) {
      correct++;
    } else {
      incorrect++;
    }
  }

  return {
    correct,
    incorrect,
    totalTyped: typed.length,
  };
}

function calculateScore(correct, incorrect, missed) {
  const score = correct * 10 - incorrect * 5 - missed * 3;
  return Math.max(score, 0);
}

function splitTypedTextForLine(line, typedText) {
  if (!line) {
    return {
      currentTyped: "",
      nextTyped: "",
    };
  }

  const newlineIndex = typedText.indexOf("\n");

  if (newlineIndex !== -1) {
    return {
      currentTyped: typedText.slice(0, newlineIndex),
      nextTyped: typedText.slice(newlineIndex + 1),
    };
  }

  return {
    currentTyped: typedText.slice(0, line.text.length),
    nextTyped: typedText.slice(line.text.length),
  };
}

function formatTypedTextForLine(line, value) {
  if (!line) return value;

  // If the user already moved to the next line, keep the newline.
  if (value.includes("\n")) {
    return value;
  }

  const expectedLength = line.text.length;

  // User has not finished the current lyric yet.
  if (value.length <= expectedLength) {
    return value;
  }

  const currentTyped = value.slice(0, expectedLength);
  const extraTyped = value.slice(expectedLength);

  // Only move to the next line if the first extra character is a space.
  if (extraTyped.startsWith(" ")) {
    const nextTyped = extraTyped.slice(1);
    return `${currentTyped}\n${nextTyped}`;
  }

  // Prevent typing past the current lyric unless they press space.
  return currentTyped;
}

function HighlightedLyric({ expected, typed }) {
  if (!expected) return null;

  return (
    <div className="text-3xl font-black leading-relaxed tracking-tight md:text-4xl">
      {expected.split("").map((char, index) => {
        const typedChar = typed[index];

        let colorClass = "text-white";

        if (typedChar !== undefined) {
          colorClass = typedChar === char ? "text-green-300" : "text-red-300";
        }

        return (
          <span key={index} className={colorClass}>
            {char}
          </span>
        );
      })}
    </div>
  );
}

function HighlightedNextLyric({ expected, typed }) {
  if (!expected) return null;

  return (
    <div className="text-xl font-semibold leading-relaxed md:text-2xl">
      {expected.split("").map((char, index) => {
        const typedChar = typed[index];

        let colorClass = "text-gray-400";

        if (typedChar !== undefined) {
          colorClass = typedChar === char ? "text-green-300" : "text-red-300";
        }

        return (
          <span key={index} className={colorClass}>
            {char}
          </span>
        );
      })}
    </div>
  );
}

export default function PlayPage() {
  const params = useParams();
  const songId = params.id;

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const [songs, setSongs] = useState([]);
  const [lyrics, setLyrics] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [activeLineIndex, setActiveLineIndex] = useState(-1);

  const [completedLines, setCompletedLines] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    async function loadData() {
      const songsRes = await fetch("/api/songs");
      const songsData = await songsRes.json();
      setSongs(songsData);

      const lyricsRes = await fetch(`/api/songs/${songId}/lyrics`);
      const lyricsData = await lyricsRes.json();
      setLyrics(lyricsData);
    }

    if (songId) {
      loadData();
    }
  }, [songId]);

  const song = songs.find((s) => String(s.id) === String(songId));

  useEffect(() => {
    if (!song) return;

    function createPlayer() {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: song.youtube_video_id,
        playerVars: {
          controls: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            intervalRef.current = setInterval(() => {
              if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);
              }
            }, 100);
          },
          onStateChange: (event) => {
            // 0 means the YouTube video ended
            if (event.data === 0) {
              setIsFinished(true);
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      if (!document.getElementById("youtube-iframe-api")) {
        const script = document.createElement("script");
        script.id = "youtube-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [song]);

  const activeIndex = lyrics.findIndex(
    (line) =>
      currentTime >= Number(line.start_time) &&
      currentTime < Number(line.end_time)
  );

  const activeLine = activeIndex >= 0 ? lyrics[activeIndex] : null;

  const nextLine =
    activeIndex >= 0 && activeIndex + 1 < lyrics.length
      ? lyrics[activeIndex + 1]
      : null;

  const { currentTyped, nextTyped } = splitTypedTextForLine(
    activeLine,
    typedText
  );

  useEffect(() => {
    if (activeIndex !== activeLineIndex) {
      if (activeLineIndex >= 0) {
        const previousLine = lyrics[activeLineIndex];

        if (previousLine) {
          const {
            currentTyped: previousTyped,
            nextTyped: carriedNextTyped,
          } = splitTypedTextForLine(previousLine, typedText);

          const comparison = compareText(previousLine.text, previousTyped);

          const missed = Math.max(
            previousLine.text.length - comparison.totalTyped,
            0
          );

          setCompletedLines((prev) => [
            ...prev,
            {
              lineIndex: activeLineIndex,
              text: previousLine.text,
              typedText: previousTyped,
              correct: comparison.correct,
              incorrect: comparison.incorrect,
              missed,
            },
          ]);

          setTypedText(carriedNextTyped);
        }
      } else {
        setTypedText("");
      }

      setActiveLineIndex(activeIndex);
    }
  }, [activeIndex, activeLineIndex, lyrics, typedText]);

  const currentComparison = activeLine
    ? compareText(activeLine.text, currentTyped)
    : { correct: 0, incorrect: 0, totalTyped: 0 };

  const nextComparison = nextLine
    ? compareText(nextLine.text, nextTyped)
    : { correct: 0, incorrect: 0, totalTyped: 0 };

  const currentMissed = activeLine
    ? Math.max(activeLine.text.length - currentComparison.totalTyped, 0)
    : 0;

  const completedTotals = completedLines.reduce(
    (totals, line) => {
      return {
        correct: totals.correct + line.correct,
        incorrect: totals.incorrect + line.incorrect,
        missed: totals.missed + line.missed,
      };
    },
    { correct: 0, incorrect: 0, missed: 0 }
  );

  const totalCorrect =
    completedTotals.correct +
    currentComparison.correct +
    nextComparison.correct;

  const totalIncorrect =
    completedTotals.incorrect +
    currentComparison.incorrect +
    nextComparison.incorrect;

  const totalMissed = completedTotals.missed + currentMissed;

  const totalTyped = totalCorrect + totalIncorrect;

  const accuracy = totalTyped === 0 ? 100 : (totalCorrect / totalTyped) * 100;

  const liveScore = calculateScore(totalCorrect, totalIncorrect, totalMissed);

  const totalPossibleCharacters = lyrics.reduce(
    (sum, line) => sum + line.text.length,
    0
  );

  const finalSummary = {
    score: liveScore,
    correct: totalCorrect,
    incorrect: totalIncorrect,
    missed: totalMissed,
    accuracy,
    totalPossibleCharacters,
  };

  function handleTypingChange(e) {
    const value = e.target.value;

    if (!activeLine) {
      setTypedText(value);
      return;
    }

    setTypedText(formatTypedTextForLine(activeLine, value));
  }

  function handleReplay() {
    setTypedText("");
    setCompletedLines([]);
    setActiveLineIndex(-1);
    setIsFinished(false);
    setCurrentTime(0);

    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
    }
  }

  if (!song) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#581c87_0%,#111827_42%,#020617_100%)] px-6 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-300">
            Loading
          </p>
          <h1 className="text-3xl font-black">Getting your song ready...</h1>
          <p className="mt-2 text-gray-400">
            Syncing the video, lyrics, and typing game.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#581c87_0%,#111827_42%,#020617_100%)] px-5 py-8 text-white">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-6">
            <Link
              href="/"
              className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-gray-200 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:border-fuchsia-300/60 hover:bg-white/15 hover:text-white"
            >
              ← Back to songs
            </Link>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-300">
              Now playing
            </p>

            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              {song.title}
            </h1>

            <p className="mt-2 text-lg text-gray-300">{song.artist}</p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 p-3 shadow-2xl backdrop-blur">
            <div
              id="youtube-player"
              className="aspect-video w-full overflow-hidden rounded-[1.5rem]"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
              Current time:{" "}
              <span className="font-bold text-gray-100">
                {currentTime.toFixed(1)}s
              </span>
            </div>

            <div className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-4 py-2 text-fuchsia-100">
              Live synced typing
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 shadow-xl backdrop-blur">
              <p className="text-sm font-medium text-yellow-100/80">Score</p>
              <p className="mt-1 text-4xl font-black text-yellow-300">
                {liveScore}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
              <p className="text-sm font-medium text-gray-300">Accuracy</p>
              <p className="mt-1 text-4xl font-black">
                {accuracy.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-3xl border border-green-400/20 bg-green-400/10 p-5 shadow-xl backdrop-blur">
              <p className="text-sm font-medium text-green-100/80">Correct</p>
              <p className="mt-1 text-4xl font-black text-green-300">
                {totalCorrect}
              </p>
            </div>

            <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5 shadow-xl backdrop-blur">
              <p className="text-sm font-medium text-red-100/80">
                Missed/Wrong
              </p>
              <p className="mt-1 text-4xl font-black text-red-300">
                {totalMissed + totalIncorrect}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:pt-24">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
                  Lyrics
                </p>
                <h2 className="mt-1 text-2xl font-black">Type the line</h2>
              </div>

              <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-gray-300">
                Live
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5 md:p-6">
              <p className="mb-3 text-sm font-medium text-gray-400">
                Current lyric
              </p>

              {activeLine ? (
                <HighlightedLyric
                  expected={activeLine.text}
                  typed={currentTyped}
                />
              ) : (
                <h2 className="text-3xl font-bold text-gray-400">
                  Waiting for lyrics...
                </h2>
              )}
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="mb-2 text-sm font-medium text-gray-500">
                Next lyric
              </p>

              {nextLine ? (
                <HighlightedNextLyric
                  expected={nextLine.text}
                  typed={nextTyped}
                />
              ) : (
                <p className="text-xl text-gray-500">No next line</p>
              )}
            </div>

            <textarea
              value={typedText}
              onChange={handleTypingChange}
              placeholder="Type the current lyric. Press space after finishing the line to start the next one."
              disabled={isFinished}
              className="mt-5 h-40 w-full resize-none rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-lg leading-relaxed text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-300/60 focus:ring-4 focus:ring-fuchsia-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <p className="mt-3 text-sm text-gray-400">
              Finish the current line, then press{" "}
              <span className="rounded-md bg-white/10 px-2 py-1 font-bold text-white">
                space
              </span>{" "}
              to begin typing the next lyric early.
            </p>
          </div>

          {isFinished && (
            <div className="mt-6 rounded-[2rem] border border-fuchsia-300/20 bg-fuchsia-300/10 p-5 shadow-2xl backdrop-blur md:p-6">
              <h2 className="mb-5 text-3xl font-black">Final Summary</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-black/20 p-5">
                  <p className="text-gray-400">Final Score</p>
                  <p className="text-5xl font-black text-yellow-300">
                    {finalSummary.score}
                  </p>
                </div>

                <div className="rounded-3xl bg-black/20 p-5">
                  <p className="text-gray-400">Accuracy</p>
                  <p className="text-5xl font-black">
                    {finalSummary.accuracy.toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-3xl bg-black/20 p-5">
                  <p className="text-gray-400">Correct Characters</p>
                  <p className="text-3xl font-black text-green-300">
                    {finalSummary.correct}
                  </p>
                </div>

                <div className="rounded-3xl bg-black/20 p-5">
                  <p className="text-gray-400">Incorrect Characters</p>
                  <p className="text-3xl font-black text-red-300">
                    {finalSummary.incorrect}
                  </p>
                </div>

                <div className="rounded-3xl bg-black/20 p-5">
                  <p className="text-gray-400">Missed Characters</p>
                  <p className="text-3xl font-black text-red-300">
                    {finalSummary.missed}
                  </p>
                </div>

                <div className="rounded-3xl bg-black/20 p-5">
                  <p className="text-gray-400">Total Lyric Characters</p>
                  <p className="text-3xl font-black">
                    {finalSummary.totalPossibleCharacters}
                  </p>
                </div>
              </div>

              <button
                onClick={handleReplay}
                className="mt-6 rounded-2xl bg-white px-6 py-3 font-black text-gray-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-fuchsia-100"
              >
                Replay Song
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}