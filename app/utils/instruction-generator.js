const generate = function(pageFrameSize, memorySize, numberOfProcesses = 5, commandsPerProcess = 5) {
	let processes = []; // a list of process that will be turned into instructions
	let instructions = new Array((numberOfProcesses * 2) + (numberOfProcesses * commandsPerProcess)); // an array of objects to turn into the instruction string

	for(let i = 0; i < numberOfProcesses; i++) {
		processes.push(generateProcess(i, memorySize, pageFrameSize));
	}

	// Initialize and declare availableIndex array
	let availableIndexes = new Array(instructions.length);
	for (let i = 0; i < availableIndexes.length; i++) {
		availableIndexes[i] = i;
	}

	for(let i = 0; i < processes.length; i++) {
		let createIndex = getCreateProcessIndex(availableIndexes, commandsPerProcess);
		instructions[createIndex] = convertProcessToInstruction(processes[i]);

		let commandIndexes = [];
		for(let j = 0; j < commandsPerProcess; j++) {
			let commandIndex = getProcessCommandIndex(availableIndexes, createIndex);
			instructions[commandIndex] = createProcessCommandInstruction(processes[i].id, memorySize, pageFrameSize);
			commandIndexes.push(commandIndex);
		}
		
		let terminateIndex = getTerminateProcessIndex(availableIndexes, Math.max(createIndex, ...commandIndexes));
		instructions[terminateIndex] = createProcessTerminationInstruction(processes[i].id);	
	}

	return instructions.join('\n');
}

const generateProcess = function(processId, memorySize, pageFrameSize) {
	return {
		id: processId,
		codeSize: getRandomInt(1, pageFrameSize * Math.min(10, memorySize / pageFrameSize)),
		dataSize: getRandomInt(1, pageFrameSize * Math.min(10, memorySize / pageFrameSize)),
	}
}

const convertProcessToInstruction = function(process) {
	let instruction = `0 ${process.id} ${process.codeSize} ${process.dataSize}`;
	return instruction;
}

const createProcessTerminationInstruction = function(processId) {
	let instruction = `1 ${processId}`;
	return instruction;
}

const createProcessCommandInstruction = function(processId, memorySize, pageFrameSize) {
	let commandId = getRandomInt(2, 5);
	let randomDataSize = getRandomInt(1, pageFrameSize * Math.min(10, memorySize / pageFrameSize));
	let instruction = `${commandId} ${processId} ${randomDataSize}`;
	
	if(commandId === 2) {
		instruction = `${commandId} ${processId}`;
	}
	
	return instruction;
}

const getCreateProcessIndex = function(availableIndexes, commandsPerProcess) {
	let createIndex = null;

	while(createIndex === null) {
		createIndex = availableIndexes[getRandomInt(0, availableIndexes.length - (commandsPerProcess + 1))];
		if(createIndex !== null) {
			availableIndexes.splice(availableIndexes.indexOf(createIndex), 1);
		} else {
			createIndex = null;
		}
	}

	return createIndex;
}

const getProcessCommandIndex = function(availableIndexes, createIndex) {
	let commandIndex = null;
	while(commandIndex === null) {
		commandIndex = availableIndexes[getRandomInt(0, availableIndexes.length - 1)];
		if(commandIndex !== null && commandIndex > createIndex) {
			availableIndexes.splice(availableIndexes.indexOf(commandIndex), 1);
		} else {
			commandIndex = null;
		}
	}

	return commandIndex;
}

const getTerminateProcessIndex = function(availableIndexes, minIndex) {
	let terminateIndex = null;
	while(terminateIndex === null) {
		if(availableIndexes.length === 1) {
			terminateIndex = availableIndexes[0];
		} else {
			terminateIndex = availableIndexes[getRandomInt(1, availableIndexes.length + 1)];
		}
		
		if(terminateIndex !== null && terminateIndex > minIndex) {
			availableIndexes.splice(availableIndexes.indexOf(terminateIndex), 1);
		} else {
			terminateIndex = null;
		}
	}

	return terminateIndex;
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