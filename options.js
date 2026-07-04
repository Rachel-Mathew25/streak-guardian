window.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(
    ["token", "username", "thresholdHour", "thresholdMinute", "autoCommitOwner", "autoCommitRepo"],
    (s) => {
      if (s.token) document.getElementById("token").value = s.token;
      if (s.username) document.getElementById("username").value = s.username;

      const hour = s.thresholdHour ?? 23;
      const minute = s.thresholdMinute ?? 30;
      document.getElementById("threshold").value =
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      if (s.autoCommitOwner) document.getElementById("autoOwner").value = s.autoCommitOwner;
      if (s.autoCommitRepo) document.getElementById("autoRepo").value = s.autoCommitRepo;
    }
  );
});

document.getElementById("save").addEventListener("click", () => {
  const token = document.getElementById("token").value;
  const username = document.getElementById("username").value;
  const [thresholdHour, thresholdMinute] = document
    .getElementById("threshold").value
    .split(":")
    .map(Number);
  const autoCommitOwner = document.getElementById("autoOwner").value.trim();
  const autoCommitRepo = document.getElementById("autoRepo").value.trim();

  chrome.storage.local.set(
    { token, username, thresholdHour, thresholdMinute, autoCommitOwner, autoCommitRepo },
    () => {
      document.getElementById("status").textContent = "Saved!";
    }
  );
});