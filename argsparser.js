exports.parseArgs = async () => {
  const params = {
    type: undefined,
    season: undefined,
    medal: undefined,
    other: undefined
  };

  const args = process.argv.slice(2).map(arg => arg.toLowerCase());

  switch (args[0]) {
  case 'medals':
    params.type = 'medals';
    break;
  case 'top-teams':
    params.type = 'top';
    break;
  default:
    params.type = 'help';
  }

  args.slice(1).forEach(arg => {
    switch (arg) {
    case 'gold':
      params.medal = '1';
      break;
    case 'silver':
      params.medal = '2';
      break;
    case 'bronze':
      params.medal = '3';
      break;
    case 'summer':
      params.season = '0';
      break;
    case 'winter':
      params.season = '1';
      break;
    default:
      params.other = arg.toUpperCase();
    }
  });

  if (params.type === 'help') {
    throw new Error(
      'Usage: ./stats chart_name other_params\n' +
      '\n' +
      'where <chart_name> is one of:\n' +
      '    medals                    Show bar chart with amount of medals\n' +
      '    top-teams                 Show amount of medals per team\n' +
      '\n' +
      '<other_params>:\n' +
      '    [winter|summer]           Season (mandatory)\n' +
      '    <noc_name>                Only for medals chart (mandatory)\n' +
      '    <year>                    Only for top-teams chart\n' +
      '    [gold|silver|bronze]      Medal type'
    );
  } else if (!params.season) {
    throw new Error('You have to specify season.');
  } else if (!params.other && params.type === 'medals') {
    throw new Error('You have to specify NOC name.');
  } else {
    return params;
  }
};
