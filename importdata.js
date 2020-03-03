const fs = require('fs').promises;
const sqlite = require('./dbwrapper.js');

const fileName = './athlete_events.csv';
const dbName = './olympic_history.db';

const parseFile = async (file) => {
  const data = await fs.readFile(file, 'utf8');
  // split on rows
  return data.trim().split('\n').map(el => {
    const arr = el.trim().split(',');
    // concat elems splitted inside quotes
    arr.forEach((el, idx) => {
      while (arr[idx].startsWith('"') && !arr[idx].endsWith('"')) {
        arr.splice(idx, 2, arr[idx] + ',' + arr[idx + 1]);
      }
    });
    // remove quotes
    return arr.map(el => el.replace(/^"|"$/g, ''));
  });
};

const process = async (array) => {
  console.log('Prepearing data...');
  const header = array.shift();
  const table = header.reduce((curr, key, idx) => {
    return curr.set(key, array.map(val => val[idx]));
  }, new Map());

  const teams = Array.from(table.get('NOC').reduce((acc, noc, idx) => {
    // remove dash in team name
    const name = table.get('Team')[idx].replace(/[-\d]+$/g, '');
    return acc.set(noc, name);
  }, new Map())).map((elem, id) => {
    return {
      id: id + 1,
      noc_name: elem[0],
      name: elem[1]
    };
  });

  const sports = [...new Set(table.get('Sport'))].map((el, id) => {
    return {
      id: id + 1,
      name: el
    };
  });

  const events = [...new Set(table.get('Event'))].map((el, id) => {
    return {
      id: id + 1,
      name: el
    };
  });

  const games = Array.from(
    table.get('Games').reduce((acc, game, idx) => {
      const year = table.get('Year')[idx];
      const season = table.get('Season')[idx] === 'Summer' ? 0 : 1;
      const city = table.get('City')[idx];
      // handle more than one city
      if (acc.has(game) && !acc.get(game).city.includes(city)) {
        acc.set(game, {
          year: year,
          season: season,
          city: acc.get(game).city + ', ' + city
        });
      // skip 1906 Summer games
      } else if (game !== '1906 Summer' && !acc.has(game)) {
        acc.set(game, {
          year: year,
          season: season,
          city: city
        });
      }
      return acc;
    }, new Map())).map((el, id) => {
    return {
      id: id + 1,
      year: el[1].year,
      season: el[1].season,
      city: el[1].city
    };
  });

  const athletes = Array.from(
    table.get('ID').reduce((acc, id, idx) => {
      const getParams = () => {
        let params = '{';
        if (table.get('Height')[idx] !== 'NA') {
          params += ' height: ' + table.get('Height')[idx] + ',';
        }
        if (table.get('Weight')[idx] !== 'NA') {
          params += ' weight: ' + table.get('Weight')[idx] + ' ';
        }
        // remove "," in the end of the string
        return params.replace(/,$/g, ' ') + '}';
      };
      const getBirth = () => {
        if (table.get('Age')[idx] === 'NA' || table.get('Year')[idx] === 'NA') {
          return 'NULL';
        } else {
          return table.get('Year')[idx] - table.get('Age')[idx];
        }
      };
      const getTeamId = () => {
        const team = teams.find(el => el.noc_name === table.get('NOC')[idx]);
        return team && team.id;
      };
      const getName = () => {
        // remove any information in round brackets and double quotemarks
        return table.get('Name')[idx].replace(/(\s\(.+\))/g, '').replace(/(\s"".+"")/g, '');
      };
      const getSex = () => {
        return table.get('Sex')[idx] === 'NA' ? 'NULL' : table.get('Sex')[idx];
      };
      return acc.set(id, {
        name: getName(),
        sex: getSex(),
        birth: getBirth(),
        params: getParams(),
        team_id: getTeamId()
      });
    }, new Map())).map(el => {
    return {
      id: +el[0],
      full_name: el[1].name,
      year_of_birth: el[1].birth,
      sex: el[1].sex,
      params: el[1].params,
      team_id: el[1].team_id
    };
  });

  const results = table.get('ID').reduce((acc, el, idx) => {
    const getMedal = () => {
      switch (table.get('Medal')[idx]) {
      case 'Gold': return 1;
      case 'Silver':return 2;
      case 'Bronze': return 3;
      default: return 0;
      }
    };
    const getGameId = () => {
      const season = table.get('Season')[idx] === 'Summer' ? 0 : 1;
      const year = table.get('Year')[idx];
      const game = games.find(el => el.year === year && el.season === season);
      return game && game.id;
    };
    const getSportId = () => {
      const sport = sports.find(el => el.name === table.get('Sport')[idx]);
      return sport && sport.id;
    };
    const getEventId = () => {
      const event = events.find(el => el.name === table.get('Event')[idx]);
      return event && event.id;
    };
    // skip results of 1906 Summer games
    if (table.get('Games')[idx] !== '1906 Summer') {
      acc.push({
        athlete_id: +el,
        game_id: getGameId(),
        sport_id: getSportId(),
        event_id: getEventId(),
        medal: getMedal()
      });
    }
    return acc;
  }, []);

  return {
    teams: teams,
    sports: sports,
    events: events,
    games: games,
    athletes: athletes,
    results: results
  };
};

const insert = async (db, data) => {
  console.log('Inserting data...');
  Object.entries(data).forEach(table => {
    const tableName = table[0];
    const variables = table[1];
    const MAX_VARIABLES = 999;

    const varLength = variables.length;
    const keys = Object.keys(variables[0]);
    const placeholders = Array(keys.length).fill('?').join(',');
    const step = Math.floor(MAX_VARIABLES / keys.length);

    for (let i = 0; i < varLength; i += step) {
      const chunk = variables.slice(i, i + step);
      const end = chunk.map(() => `(${placeholders})`).join(',');
      const sql = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES` + end;
      const values = chunk.map(el => Object.values(el)).flat(2);
      sqlite.run(db, sql, values).catch(err => {
        if (err.code === 'SQLITE_CONSTRAINT' && i === 0) {
          console.error(`Inserting data is already in the '${tableName}' table`);
        } else if (err.code !== 'SQLITE_CONSTRAINT') {
          console.error(err);
        }
      });
    }
  });
};

const main = async () => {
  try {
    const array = await parseFile(fileName);
    const data = await process(array);
    const db = await sqlite.open(dbName);
    await insert(db, data);
    sqlite.close(db);
  } catch (err) {
    console.error(err.message);
  }
};

main();
