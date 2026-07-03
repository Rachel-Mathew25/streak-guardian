importScripts("github.js");

const CHECK_ALARM = "streak-check";

chrome.alarms.create(CHECK_ALARM, { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM) {
    runCheck();
  }
});

async function runCheck() {
  const { token, username, thresholdHour, thresholdMinute } =
    await chrome.storage.local.get(["token", "username", "thresholdHour", "thresholdMinute"]);

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

  if (count === 0) {
    chrome.notifications.create("streak-warning", {
      type: "basic",
      iconUrl: "icon.png",
      title: "No GitHub activity today",
      message: "Push something real before the day ends — code, notes, or docs."
    });
  }
}