#!/usr/bin/env node

const sqlite = require('./dbwrapper.js');
const query = require('./queries.js');
const chart = require('./chart.js');
const cli = require('./argsparser.js');

const DB_DEFAULT = './olympic_history.db';

const getTopTeams = async (db, params) => {
  const medalClause = params.medal ? 'r.medal = ?' : 'r.medal > 0';
  const yearClause = params.other && 'AND g.year = ?';
  const sql = await query.topTeams(medalClause, yearClause);

  const values = [params.medal, params.season, params.other].filter(val => Boolean(val));

  const header = [['NOC', 'Amount']];
  const result = await sqlite.all(db, sql, values);
  const avg = result.reduce((acc, el) => acc + el.total, 0) / result.length;

  return header.concat(result.filter(el => el.total > avg).map(el => [el.noc, el.total]));
};

const getMedalsStats = async (db, params) => {
  const medalClause = params.medal ? 'r.medal = ?' : 'r.medal > 0';
  const nocClause = params.other && 'AND t.noc_name = ?';
  const sql = await query.medalStats(medalClause, nocClause);
  const values = [params.medal, params.season, params.other].filter(val => Boolean(val));

  const header = [['Year', 'Amount']];
  const result = await sqlite.all(db, sql, values);

  return header.concat(result.map(el => [el.year, el.total]));
};

const main = async () => {
  try {
    const params = await cli.parseArgs();
    const db = await sqlite.open(DB_DEFAULT);
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
