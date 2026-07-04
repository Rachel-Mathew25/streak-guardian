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
async function commitDevlogEntry(token, owner, repo, path, note) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    "Authorization": `bearer ${token}`,
    "Accept": "application/vnd.github+json"
  };

  let existingContent = "";
  let sha;

  const getResponse = await fetch(apiUrl, { headers });

  if (getResponse.status === 200) {
    const fileData = await getResponse.json();
    sha = fileData.sha;
    existingContent = decodeURIComponent(escape(atob(fileData.content)));
    console.log("Found existing file, sha:", sha);
  } else if (getResponse.status === 404) {
    console.log("File doesn't exist yet — will create it.");
  } else {
    throw new Error(`Unexpected status checking file: ${getResponse.status}`);
  }

  const timestamp = new Date().toLocaleString();
  const newContent = existingContent + `\n\n## ${timestamp}\n${note}\n`;

  const body = {
    message: `Streak Guardian log — ${new Date().toISOString().slice(0, 10)}`,
    content: btoa(unescape(encodeURIComponent(newContent))),
    ...(sha ? { sha } : {})
  };

  const putResponse = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const result = await putResponse.json();
  console.log("Commit result:", result);
  return result;
}