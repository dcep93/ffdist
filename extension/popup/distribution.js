const key = "distribution_v0.1";

const num_points = 10000;
const num_lines = 3;

var rendered = false;

const timeout = setTimeout(
  () => render(JSON.parse(localStorage.getItem(key))),
  100
);

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  clearTimeout(timeout);
  localStorage.setItem(key, JSON.stringify(message));
  render(message);
  sendResponse(true);
});

//

function render(data) {
  console.log(data);
  if (rendered) return console.log("already rendered");
  rendered = true;
  document.title = `${document.title} v${data.version}`;
  renderTeams(data.teams);
  renderDistribution(data.dists);
}

function renderTeams(teams) {
  renderTeam(teams[0], "t1");
  renderTeam(teams[1], "t2");
}

function renderTeam(team, label) {
  document.getElementById(`summary_${label}`).innerText = team.name;
  var table = document.getElementById("table");
  var teamRow = table.insertRow(-1);
  teamRow.insertCell(-1).innerText = team.name;
  const playing = team.playerStats.filter((player) => player.active);
  const keys = ["fpts", "proj", "mean", "median", "stddev"];
  keys.forEach(
    (attr) =>
      attr !== "stddev" &&
      (teamRow.insertCell(-1).innerText = playing
        .map((player) => (((attr === "mean" || attr === "median") && player.gameProgress === undefined && player.fpts !== undefined) ? player.fpts : (player[attr] || 0)))
        .reduce((a, b) => a + b, 0)
        .toFixed(2))
  );
  teamRow.insertCell(-1).innerText = Math.pow(
    playing
      .map((player) => player.stddev || 0)
      .map((stddev) => Math.pow(stddev, 2))
      .reduce((a, b) => a + b, 0),
    0.5
  ).toFixed(2);
  team.playerStats.forEach((player) => {
    var row = table.insertRow(-1);
    var playerDiv = document.createElement("div");
    var img = document.createElement("img");
    img.src = player.imgurl;
    img.height = "35";
    playerDiv.appendChild(img);
    var nameSpan = document.createElement("span");
    nameSpan.className = "right";
    nameSpan.innerText = `${player.name} (${player.position})`;
    playerDiv.appendChild(nameSpan);
    row.insertCell(-1).appendChild(playerDiv);
    keys.forEach(
      (attr) => (row.insertCell(-1).innerText = player[attr]?.toFixed(1) || "-")
    );
    row.insertCell(-1).innerText = player.time;
  });
}

function renderDistribution(dists) {
  const t1 = cumProb(dists[0]);
  const t2 = cumProb(dists[1]);

  const upset = findUpset(t1, t2);
  document.getElementById("summary_upset").innerText = upset.toFixed(2);

  const diff = cumProb(dists[2]);

  plot("#teams", { green: t1, purple: t2 }, upset);
  plot("#diff", { green: diff }, null);
}

function cumProb(dist) {
  const low = dist[0].v;
  const high = dist[dist.length - 1].v;
  if (high === low) {
    return [[dist[0].v, 1]];
  }
  const size = (high - low) / (num_points - 1);
  const scoreMap = {};
  dist.forEach((i) => {
    var score = Math.floor((i.v - low) / size) * size + low;
    scoreMap[score] = i.p + (scoreMap[score] || 0);
  });
  var prob = 0;
  return Object.keys(scoreMap)
    .map((i) => [parseFloat(i), scoreMap[i]])
    .sort((a, b) => a[0] - b[0])
    .map((i) => {
      prob += i[1];
      return [i[0], prob];
    });
}

function findUpset(t1, t2) {
  if (t1.length === 1) {
    return t1[0][0]
  }
  if (t2.length === 1) {
    return t2[0][0]
  }
  var t1IsWinning = findIntercept(0.5, 1, t1) > findIntercept(0.5, 1, t2);
  var favorite = t1IsWinning ? t1 : t2;
  var underdog = t1IsWinning ? t2 : t1;
  var upset = NaN;
  var prob = 0;
  var probQ;
  for (var i = 0; i < favorite.length; i++) {
    var f = favorite[i];
    var uProb = findIntercept(f[0], 0, underdog);
    if (uProb) {
      probQ = (1 - uProb) * f[1];
      if (probQ > prob) {
        prob = probQ;
        upset = f[0];
      }
    }
  }
  return upset;
}
