function todayKey() {
  const d = new Date();
  return `logs_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function renderLogs() {
  const key = todayKey();
  const stored = await chrome.storage.local.get([key]);
  const entries = stored[key] || [];

  const list = document.getElementById("logList");
  list.innerHTML = "";
  entries.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.time} — ${entry.text}`;
    list.appendChild(li);
  });
}

async function addNote() {
  const input = document.getElementById("noteInput");
  const text = input.value.trim();
  if (!text) return;

  const key = todayKey();
  const stored = await chrome.storage.local.get([key]);
  const entries = stored[key] || [];

  entries.push({ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text });

  await chrome.storage.local.set({ [key]: entries });
  input.value = "";
  renderLogs();
}

document.getElementById("addNote").addEventListener("click", addNote);
document.getElementById("noteInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addNote();
});

window.addEventListener("DOMContentLoaded", async () => {
  renderLogs();

  const s = await chrome.storage.local.get(["token", "username", "thresholdHour", "thresholdMinute"]);

  if (!s.token || !s.username) {
    document.getElementById("status").textContent = "Not set up yet — open settings.";
    return;
  }

  document.getElementById("status").textContent = "Checking today's activity...";
  const count = await fetchTodayContributionCount(s.token, s.username);

  document.getElementById("status").textContent =
    count > 0
      ? `✅ ${count} contribution${count === 1 ? "" : "s"} today.`
      : `⚠️ Nothing logged yet today. Check-in at ${s.thresholdHour}:${String(s.thresholdMinute).padStart(2, "0")}.`;
});