"use client";

import { useEffect, useState } from "react";

export function PollCard({ postId, poll, onPollChange }) {
  const [votedOptionId, setVotedOptionId] = useState(poll?.votedOptionId ?? null);
  const [options, setOptions] = useState(Array.isArray(poll?.options) ? poll.options : []);
  const [totalVotes, setTotalVotes] = useState(Number(poll?.totalVotes || 0));
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [hasEnded, setHasEnded] = useState(
    poll?.endsAt ? new Date(poll.endsAt).getTime() <= Date.now() : false
  );

  useEffect(() => {
    if (!poll) return;
    setVotedOptionId(poll.votedOptionId ?? null);
    setOptions(Array.isArray(poll.options) ? poll.options : []);
    setTotalVotes(Number(poll.totalVotes || 0));
    setHasEnded(poll.endsAt ? new Date(poll.endsAt).getTime() <= Date.now() : false);
  }, [poll]);

  useEffect(() => {
    if (!poll?.endsAt) return;
    const endsAtMs = new Date(poll.endsAt).getTime();
    const delay = endsAtMs - Date.now();

    if (!Number.isFinite(endsAtMs) || delay <= 0) {
      setHasEnded(true);
      return undefined;
    }

    const timeoutId = window.setTimeout(
      () => setHasEnded(true),
      Math.min(delay, 2147483647),
    );

    return () => window.clearTimeout(timeoutId);
  }, [poll?.endsAt]);

  if (!poll) return null;

  const hasVoted = votedOptionId !== null;
  const showResults = hasVoted || hasEnded;
  const maxVotes = Math.max(...options.map((o) => Number(o.votes || 0)), 0);

  const formatTimeLeft = (endsAt) => {
    if (!endsAt) return "";
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Final results";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.ceil((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} left`;
    return `${Math.max(hours, 1)}h left`;
  };

  const applyPollSnapshot = (nextPoll) => {
    if (!nextPoll) return;
    setVotedOptionId(nextPoll.votedOptionId ?? null);
    setOptions(Array.isArray(nextPoll.options) ? nextPoll.options : []);
    setTotalVotes(Number(nextPoll.totalVotes || 0));
    setHasEnded(nextPoll.endsAt ? new Date(nextPoll.endsAt).getTime() <= Date.now() : false);
    onPollChange?.(nextPoll);
  };

  const handleVote = async (optionId) => {
    if (hasVoted || hasEnded || isSavingVote || !postId) return;

    const previousState = { votedOptionId, options, totalVotes };
    const optimisticOptions = options.map((option) =>
      option.id === optionId
        ? { ...option, votes: Number(option.votes || 0) + 1 }
        : option,
    );
    const optimisticTotalVotes = totalVotes + 1;

    setVotedOptionId(optionId);
    setOptions(optimisticOptions);
    setTotalVotes(optimisticTotalVotes);
    onPollChange?.({
      ...poll,
      options: optimisticOptions,
      totalVotes: optimisticTotalVotes,
      votedOptionId: optionId,
    });

    setIsSavingVote(true);
    try {
      const response = await fetch(`/api/posts/${postId}/poll-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data?.poll) {
          applyPollSnapshot(data.poll);
          return;
        }
        throw new Error(data?.error || "Could not save poll vote");
      }

      applyPollSnapshot(data.poll);
    } catch (error) {
      console.error(error);
      setVotedOptionId(previousState.votedOptionId);
      setOptions(previousState.options);
      setTotalVotes(previousState.totalVotes);
      onPollChange?.({
        ...poll,
        options: previousState.options,
        totalVotes: previousState.totalVotes,
        votedOptionId: previousState.votedOptionId,
      });
    } finally {
      setIsSavingVote(false);
    }
  };

  return (
    <div className="poll-card" onClick={(e) => e.stopPropagation()}>
      {options.map((option) => {
        const optionVotes = Number(option.votes || 0);
        const pct = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        const isWinner = showResults && optionVotes === maxVotes && maxVotes > 0;
        const isMyVote = votedOptionId === option.id;

        return (
          <button
            key={option.id}
            className="poll-option"
            onClick={() => handleVote(option.id)}
            disabled={showResults || isSavingVote}
            type="button"
          >
            {showResults && (
              <div
                className={`poll-option-fill ${isWinner ? "poll-fill-winner" : ""} ${isMyVote ? "poll-fill-myvote" : ""}`}
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="poll-option-content">
              <span className="poll-option-label">
                {option.text}

                {isMyVote && showResults && (
                  <svg
                    className="poll-check-icon"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              {showResults && <span className="poll-option-pct">{pct}%</span>}
            </div>
          </button>
        );
      })}
      <div className="poll-meta">
        <span>{totalVotes.toLocaleString()} votes</span>
        <span className="poll-meta-dot">·</span>
        <span>{formatTimeLeft(poll.endsAt)}</span>
      </div>
    </div>
  );
}

export default PollCard;
