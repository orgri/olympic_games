exports.topTeams = async (medalClause = '', yearClause = '') => {
  return (
    'SELECT\n' +
    '  t.noc_name as noc,\n' +
    `  SUM(CASE WHEN ${medalClause} THEN 1 ELSE 0 END) as total\n` +
    'FROM results r\n' +
    '  JOIN games g ON g.id = r.game_id\n' +
    '  JOIN athletes a ON a.id = r.athlete_id\n' +
    '  JOIN teams t ON t.id = a.team_id\n' +
    `WHERE g.season = ? ${yearClause}\n` +
    'GROUP BY noc ORDER BY total DESC'
  );
};

exports.medalStats = async (medalClause = '', nocClause = '') => {
  return (
    'SELECT\n' +
    '  g.year as year,\n' +
    `  SUM(CASE WHEN ${medalClause} THEN 1 ELSE 0 END) as total\n` +
    'FROM results r\n' +
    '  JOIN games g ON g.id = r.game_id\n' +
    '  JOIN athletes a ON a.id = r.athlete_id\n' +
    '  JOIN teams t ON t.id = a.team_id\n' +
    `WHERE g.season = ? ${nocClause}\n` +
    'GROUP BY year ORDER BY year DESC'
  );
};