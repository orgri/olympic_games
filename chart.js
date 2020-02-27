const draw = (array = [['Name', 'Amount']]) => {
	const RECTANGLE = '\u2588';
	const MAX_N_OF_RECTANGLES = 200;
	const header = array.shift();
	const max = Math.max(...array.flatMap(val => val[1]));

	console.log(`${header[0]}\t${header[1]}`);
	array.forEach(elem => {
		const amount = elem[1] / max * MAX_N_OF_RECTANGLES;
		const bar = RECTANGLE.repeat(amount);
		console.log(`${elem[0]}\t${bar} ${elem[1]}`);
	});
};

exports.draw = draw;
