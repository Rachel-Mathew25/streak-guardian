importScripts("github.js");

const CHECK_ALARM = "streak-check";

chrome.alarms.create(CHECK_ALARM, { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM) {
    runCheck();
  }
});

function todayKey() {
  const d = new Date();
  return `logs_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function compileTodayNote() {
  const key = todayKey();
  const stored = await chrome.storage.local.get([key]);
  const entries = stored[key] || [];

  if (entries.length === 0) {
    return "No notes were logged today, and no other GitHub activity was recorded. This is an automated placeholder — nothing meaningful to report.";
  }

  const lines = entries.map((e) => `- **${e.time}** ${e.text}`);
  return `Today's logged activity:\n\n${lines.join("\n")}`;
}

async function runCheck() {
  const { token, username, thresholdHour, thresholdMinute, autoCommitOwner, autoCommitRepo } =
    await chrome.storage.local.get([
      "token",
      "username",
      "thresholdHour",
      "thresholdMinute",
      "autoCommitOwner",
      "autoCommitRepo"
    ]);

  if (!token || !username) {
    console.log("No token/username set yet.");
    return;
  }

  const hour = thresholdHour ?? 23;
  const minute = thresholdMinute ?? 30;

  const now = new Date();
  const pastThreshold =
    now.getHours() > hour ||
    (now.getHours() === hour && now.getMinutes() >= minute);

  if (!pastThreshold) {
    console.log("Not past threshold yet, skipping check.");
    return;
  }

  const count = await fetchTodayContributionCount(token, username);
  console.log("Threshold check — today's count:", count);

  if (count > 0) return; // real activity already exists today, nothing to do

  if (!autoCommitOwner || !autoCommitRepo) {
    console.log("Auto-commit not configured — just notifying instead.");
    chrome.notifications.create("streak-warning", {
      type: "basic",
      iconUrl: "icon.png",
      title: "No GitHub activity today",
      message: "Push something real before the day ends — code, notes, or docs."
    });
    return;
  }

  const note = await compileTodayNote();
  await commitDevlogEntry(token, autoCommitOwner, autoCommitRepo, "devlog.md", note);

  chrome.notifications.create("streak-committed", {
    type: "basic",
    iconUrl: "icon.png",
    title: "Streak Guardian committed for you",
    message: "No other activity was found, so today's notes were pushed to your devlog."
  });
}
