const Contest = require("../models/Contest");

/**
 * Computes the dynamic, server-authoritative state of a contest based on Date.now().
 */
const computeContestState = (contest) => {
  // If explicitly archived or draft, keep it
  if (contest.status === "draft" || contest.status === "archived") {
    return contest.status;
  }

  const now = Date.now();
  const startTime = new Date(contest.startTime).getTime();
  const endTime = new Date(contest.endTime).getTime();
  const regStart = contest.registrationStartTime
    ? new Date(contest.registrationStartTime).getTime()
    : null;
  const regEnd = contest.registrationEndTime
    ? new Date(contest.registrationEndTime).getTime()
    : startTime;

  if (now < startTime) {
    if (regStart && now >= regStart && now <= regEnd) {
      return "registration_open";
    }
    return "scheduled";
  }

  if (now >= startTime && now <= endTime) {
    return "live";
  }

  if (now > endTime) {
    if (contest.status === "evaluated") return "evaluated";
    return "ended";
  }

  return contest.status;
};

/**
 * Returns server-authoritative clock and contest time remaining.
 */
const getContestTimeInfo = (contest) => {
  const now = Date.now();
  const currentServerState = computeContestState(contest);
  const startTime = new Date(contest.startTime).getTime();
  const endTime = new Date(contest.endTime).getTime();

  let timeRemainingSeconds = 0;
  let isLive = false;

  if (now >= startTime && now <= endTime && currentServerState === "live") {
    isLive = true;
    timeRemainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
  } else if (now < startTime) {
    timeRemainingSeconds = Math.max(0, Math.floor((startTime - now) / 1000));
  }

  return {
    serverTime: new Date(now),
    serverTimestampMs: now,
    startTime: contest.startTime,
    endTime: contest.endTime,
    status: currentServerState,
    isLive,
    timeRemainingSeconds,
  };
};

module.exports = {
  computeContestState,
  getContestTimeInfo,
};
