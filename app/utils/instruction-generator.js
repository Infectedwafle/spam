const generate = function(pageFrameSize, numberOfProcesses = 5) {
	let processes = []; // a list of process that will be turned into instructions
	let instructions = new Array(numberOfProcesses * 2); // an array of objects to turn into the instruction string

	for(let i = 0; i < numberOfProcesses; i++) {
		processes.push(generateProcess(i, pageFrameSize));
	}

	// Initialize and declare availableIndex array
	let availableIndexes = new Array(instructions.length);
	for (let i = 0; i < availableIndexes.length; i++) {
		availableIndexes[i] = i;
	}

	for(let i = 0; i < processes.length; i++) {
		let createIndex = null;
		while(createIndex === null) {
			createIndex = availableIndexes[getRandomInt(0, availableIndexes.length - 1)];
			if(createIndex !== null) {
				availableIndexes.splice(availableIndexes.indexOf(createIndex), 1);
			} else {
				createIndex = null;
			}
		}

		let terminateIndex = null;
		while(terminateIndex === null) {
			if(availableIndexes.length === 1) {
				terminateIndex = availableIndexes[0];
			} else {
				terminateIndex = availableIndexes[getRandomInt(1, availableIndexes.length + 1)];
			}
			
			if(terminateIndex !== null && terminateIndex > createIndex) {
				availableIndexes.splice(availableIndexes.indexOf(terminateIndex), 1);
			} else {
				terminateIndex = null;
			}
		}

		instructions[createIndex] = convertProcessToInstruction(processes[i]);
		instructions[terminateIndex] = createProcessTerminationInstruction(processes[i].id);
		
	}

	return instructions.join('\n');
}

const generateProcess = function(processId, pageFrameSize) {
	return {
		id: processId,
		codeSize: getRandomInt(1, pageFrameSize * 2),
		dataSize: getRandomInt(1, pageFrameSize * 2),
	}
}

const convertProcessToInstruction = function(process) {
	let instruction = `${process.id} ${process.codeSize} ${process.dataSize}`;
	return instruction;
}

const createProcessTerminationInstruction = function(processId) {
	let instruction = `${processId} -1`;
	return instruction;
}

/**
 * Generates a random integer between the min and max params
 * min is inclusive
 * max is exclusive
 * 
 * @param  {[type]} min [description]
 * @param  {[type]} max [description]
 * @return {[type]}     [description]
 */
const getRandomInt = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export { generate };