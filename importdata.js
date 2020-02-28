const fs = require('fs').promises;

const fileName = './athlete_events.csv';

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
  console.log('Processing...');
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

  return {
    teams: teams,
    sports: sports,
    events: events,
    games: games
  };
};

const main = async () => {
  try {
    const array = await parseFile(fileName);
    const data = await process(array);
  } catch (err) {
    console.error(err);
  }
};

main();
