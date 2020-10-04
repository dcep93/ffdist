type playerType = { id: string; name: string; imgurl: string; fpts?: number };
type teamsType = { name: string; players: playerType[] }[];

function parseHTML(): teamsType {
  console.log(arguments.callee.name, arguments[0]);
  document.title = "Parsing...";
  const managerNames = Array.from(
    document.body.getElementsByClassName("teamName")
  ).map((i) => i.getAttribute("title"));
  const teamPlayers = Array.from(
    document.body.getElementsByClassName("matchupTable")
  )
    .map((element) => element.getElementsByTagName("tbody")[0])
    .map(tableToPlayers);
  return Array.from(new Array(2)).map((_, i) => ({
    name: managerNames[i],
    players: teamPlayers[i],
  }));
}

const headshotRegexp = /\/i\/headshots\/nfl\/players\/full\/(?<id>\d+)\.png/i;
function tableToPlayers(tableElement): playerType[] {
  const ids = [];
  for (let i = 0; i < tableElement.children.length; i++) {
    let tr = tableElement.children[i];
    let id = trToId(tr);
    if (id !== null) {
      let div = tr.children[1].children[0];
      let name = div.title;
      let imgurl = div.getElementsByTagName("img")[0].src;
      const player: playerType = { id, name, imgurl };
      const fpts = tr.children[5].children[0].children[0].innerText;
      if (fpts !== "--") {
        player.fpts = parseFloat(fpts);
      }
      ids.push(player);
    }
  }
  return ids;
}

function trToId(tr): string | null {
  const innerHTML = tr.innerHTML;
  const match = innerHTML.match(headshotRegexp);
  if (match) {
    const groups = match.groups;
    if (groups) {
      return groups.id;
    }
  }
  const dst = tr.getElementsByClassName("truncate")[0];
  if (dst) {
    const teamMatch = dst.innerText.match(/(?<team>.*?) D\/ST/);
    if (teamMatch) {
      const groups = teamMatch.groups;
      if (groups) {
        const team = groups.team;
        const teamId = dstToId[team];
        if (teamId) {
          return teamId;
        }
      }
    }
    alert(teamMatch);
  }
  return null;
}

const dstToId = {
  Bills: "-16002",
  Bears: "-16003",
  Falcons: "-16001",
  Bengals: "-16004",
  Browns: "-16005",
  Cowboys: "-16006",
  Broncos: "-16007",
  Lions: "-16008",
  Packers: "-16009",
  Titans: "-16010",
  Colts: "-16011",
  Chiefs: "-16012",
  Raiders: "-16013",
  Rams: "-16014",
  Dolphins: "-16015",
  Vikings: "-16016",
  Saints: "-16018",
  Patriots: "-16017",
  Giants: "-16019",
  Jets: "-16020",
  Eagles: "-16021",
  Cardinals: "-16022",
  Steelers: "-16023",
  Chargers: "-16024",
  "49ers": "-16025",
  Washington: "-16028",
  Jaguars: "-16030",
  Seahawks: "-16026",
  Panthers: "-16029",
  Buccaneers: "-16027",
  Ravens: "-16033",
  Texans: "-16034",
};