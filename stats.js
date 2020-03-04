const sqlite = require('./dbwrapper.js');
const chart = require('./chart.js');

const dbFile = './olympic_history.db';

const getTopTeams = async (db, params) => {
  const medalClause = params.medal ? 'r.medal = ?' : 'r.medal > 0';
  const yearClause = params.other ? 'AND g.year = ?' : '';
  const sql =
    'SELECT\n' +
    '  t.noc_name as noc,\n' +
    `  SUM(CASE WHEN ${medalClause} THEN 1 ELSE 0 END) as total\n` +
    'FROM results r\n' +
    '  JOIN games g ON g.id = r.game_id\n' +
    '  JOIN athletes a ON a.id = r.athlete_id\n' +
    '  JOIN teams t ON t.id = a.team_id\n' +
    `WHERE g.season = ? ${yearClause}\n` +
    'GROUP BY noc ORDER BY total DESC'
    ;
  const values = [params.medal, params.season, params.other].filter(val => Boolean(val));

  const header = [['NOC', 'Amount']];
  const result = await sqlite.all(db, sql, values).then(res => {
    const avg = res.reduce((acc, el) => acc + el.total, 0) / res.length;
    res = res.filter(el => el.total > avg).map(el => [el.noc, el.total]);
    return header.concat(res);
  });

  return result;
};

const getMedalsStats = async (db, params) => {
  const medalClause = params.medal ? 'r.medal = ?' : 'r.medal > 0';
  const nocClause = params.other ? 'AND t.noc_name = ?' : '';
  const sql =
    'SELECT\n' +
    '  g.year as year,\n' +
    `  SUM(CASE WHEN ${medalClause} THEN 1 ELSE 0 END) as total\n` +
    'FROM results r\n' +
    '  JOIN games g ON g.id = r.game_id\n' +
    '  JOIN athletes a ON a.id = r.athlete_id\n' +
    '  JOIN teams t ON t.id = a.team_id\n' +
    `WHERE g.season = ? ${nocClause}\n` +
    'GROUP BY year ORDER BY year DESC'
    ;
  const values = [params.medal, params.season, params.other].filter(val => Boolean(val));

  const header = [['Year', 'Amount']];
  const result = await sqlite.all(db, sql, values).then(res => {
    return header.concat(res.map(el => [el.year, el.total]));
  });

  return result;
};

const main = async () => {
  try {
    const params = {
      type: 'top',
      season: '0',
      medal: '1',
      other: '2004'
    };
    const db = await sqlite.open(dbFile);
    let data;
    switch (params.type) {
    case 'top':
      data = await getTopTeams(db, params);
      break;
    case 'medals':
      data = await getMedalsStats(db, params);
    }
    chart.draw(data);
    sqlite.close(db);
  } catch (err) {
    console.log(err.message);
  }
};

main();
