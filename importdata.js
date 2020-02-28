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

  return {
    teams: teams
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
