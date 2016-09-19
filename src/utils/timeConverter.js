export default function convertTime(from, time) {
	//FROM: 'sec', 'min', 'hr' : CASE INSENSITIVE
	switch(from.toLowerCase()) {
		case 'sec':
			return time * 1000;
			break;
		case 'min':
			return time * 60 * 1000;
			break;
		case 'hr':
			return time * 60 * 60 * 1000;
			break;
		default:
			return `UNSUPPORTED type of 'from' param: ${from}`;
	}

}