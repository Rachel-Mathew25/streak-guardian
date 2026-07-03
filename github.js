async function fetchTodayContributionCount(token, username) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 2); // small buffer, we only need today

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      variables: { login: username, from: from.toISOString(), to: to.toISOString() }
    })
  });

  const data = await response.json();
  const days = data.data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap(w => w.contributionDays);

  const todayStr = to.toISOString().slice(0, 10);
  const todayEntry = days.find(d => d.date === todayStr);

  console.log("All recent days:", days);
  console.log("Matched today as:", todayStr, "→ count:", todayEntry?.contributionCount);

  return todayEntry ? todayEntry.contributionCount : 0;
}