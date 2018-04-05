import Controller from '@ember/controller';
import { computed } from '@ember/object';
import System from 'spam/models/system/object';
import OperatingSystem from 'spam/models/operating-system/object';
import MemoryUnit from 'spam/models/memory-unit/object';
import Instruction from 'spam/models/instruction/object';
import InstructionGenerator from 'spam/utils/instruction-generator';
import MemoryFrame from 'spam/models/memory-frame/object';
import Process from 'spam/models/process/object';

export default Controller.extend({
	// computed property to access the system model in the component
	_system: null,
	system: computed('_system', function() {
		return this.get('_system');
	}),
	// property for storing the page frame size config option
	_pageFrameSize: 1024,
	pageFrameSize: computed('_pageFrameSize', 'system.pageFrameSize', {
		get() {
			return this.get('_pageFrameSize');
		},
		set(key, val) {
			this.set('_pageFrameSize', val);
			return this.get('_pageFrameSize');
		}
	}),
	// property for storing the memory size config option
	_memorySize: 65536,
	memorySize: computed('_memorySize', 'system.memorySize', {
		get() {
			return this.get('_memorySize');
		},
		set(key, val) {
			this.set('_memorySize', val);
			return this.get('_memorySize');
		}
	}),
	// property for storing the number of processes config option
	_numberOfProcesses: 3,
	numberOfProcesses: computed('_numberOfProcesses', {
		get() {
			return this.get('_numberOfProcesses');
		},
		set(key, val) {
			this.set('_numberOfProcesses', val);
			return this.get('_numberOfProcesses');
		}
	}),
	// property for storing the instructions per process config option
	_instructionsPerProcess: 5,
	instructionsPerProcess: computed('_instructionsPerProcess', {
		get() {
			return this.get('_instructionsPerProcess');
		},
		set(key, val) {
			this.set('_instructionsPerProcess', val);
			return this.get('_instructionsPerProcess');
		}
	}),
	// allows setting the memory size in bits (less mental math)
	memorySizeBits: computed('memorySize', {
		get() {
			return Math.log2(this.get('memorySize'));
		},
		set(key, val) {
			this.set('memorySize', Math.pow(2, val));
			return Math.log2(this.get('memorySize'));
		}
	}),
	// allows setting the page frame size in bits (less mental math)
	pageFrameSizeBits: computed('pageFrameSize', {
		get() {
			return Math.log2(this.get('pageFrameSize'));
		},
		set(key, val) {
			this.set('pageFrameSize', Math.pow(2, val));
			return Math.log2(this.get('pageFrameSize'));
		}
	}),
	// holds the value of the instruction counter for the simulator
	instructionCounter: 0,
	// holds the instructions text that will be converted into instruction objects by the load config action
	_instructions: null,
	instructions: computed('_instructions', {
		get() {
			return this.get('_instructions');
		},
		set(key, val) {
			this.set('_instructions', val);
			return this.get('_instructions')
		}
	}),
	actions: {
		// setup the simulator enviorment with default values for a blank system
		loadConfig() {
			// reset instruction counter and show the loaded simulator instructions
			this.set('instructionCounter', 0);
			this.set('showInstructions', true);

			// calculate the number of frames in memory
			let frameCount = Number(this.get('memorySize')) / Number(this.get('pageFrameSize'));

			let system = System.create({
				frameSize: Number(this.get('pageFrameSize')),
				memorySize: Number(this.get('memorySize')),
				log: []
			});

			let operatingSystem = OperatingSystem.create({
				pageSize: system.get('frameSize'),
				processControlList: new Array(frameCount),
				currentPageTable: null,
				system: system // reference to ask system to run commands
			});

			// Init PCB
			for(let i = 0; i < operatingSystem.get('processControlList').length; i++) {
				operatingSystem.get('processControlList')[i] = Process.create({id: null});
			}

			let memoryUnit = MemoryUnit.create({
				frameSize: system.get('frameSize'),
				frameList: new Array(frameCount),
				swapList: new Array(frameCount * 2),
				numberOfPageFaults: 0,
				system: system // reference to ask system to run commands
			});

			// Init Frames
			// id is set when loading pages from swap space
			// this is need to ensure references are not set to each index they all have to be individual objects
			for(let i = 0; i < memoryUnit.get('frameList').length; i++) {
				memoryUnit.get('frameList')[i] = MemoryFrame.create({id: null, processId: null});
			}

			// Init Swap Frames
			// this is need to ensure references are not set to each index they all have to be individual objects
			for(let i = 0; i < memoryUnit.get('swapList').length; i++) {
				memoryUnit.get('swapList')[i] = MemoryFrame.create({id: i, processId: null});
			}

			system.set('operatingSystem', operatingSystem);
			system.set('memoryUnit', memoryUnit);

			// if instructions exist then convert the text into command the simualtor can prcess
			if(this.get('instructions')) {
				let instructionList = this.get('instructions').split("\n").map((instruction) => {
					let instructionParts = instruction.split(" ");

					switch(Number(instructionParts[0])) {
						case 0: // Create Process
							return Instruction.create({
								type: Number(instructionParts[0]),
								processId: Number(instructionParts[1]),
								codeSize: Number(instructionParts[2]),
								dataSize: Number(instructionParts[3])
							});
						case 1: // Terminate Process
							return Instruction.create({
								type: Number(instructionParts[0]),
								processId: Number(instructionParts[1])
							});
						case 2: // use code
							return Instruction.create({
								type: Number(instructionParts[0]),
								processId: Number(instructionParts[1])
							});
						case 3: // use data
							return Instruction.create({
								type: Number(instructionParts[0]),
								processId: Number(instructionParts[1]),
								dataSize: Number(instructionParts[2])
							});
						case 4: // use stack if no stack create one
							return Instruction.create({
								type: Number(instructionParts[0]),
								processId: Number(instructionParts[1]),
								stackSize: Number(instructionParts[2])
							});
						case 5: // use heap if no heap create one
							return Instruction.create({
								type: Number(instructionParts[0]),
								processId: Number(instructionParts[1]),
								heapSize: Number(instructionParts[2])
							});
						default:
							throw "Command not recognized";
					}
				});

				// load instructions into system
				system.set('instructions', instructionList);
			}

			// load system
			this.set('_system', system);
		},
		generateInstructions(pageFrameSize, memorySize, numberOfProcesses, instructionsPerProcess) {
			let instructions = InstructionGenerator.generate(Number(pageFrameSize), Number(memorySize), Number(numberOfProcesses), Number(instructionsPerProcess));
			this.set('showInstructions', false);
			this.set('instructions', instructions);
		},
		// run button
		loadInstruction(counter) {
			let system = this.get('system');
			system.loadInstruction(counter);
			this.set('instructionCounter', Number(counter) + 1);
		},
		// run all button
		loadAllInstruction(counter) {
			let cont = this;
			let system = this.get('system');

			for(let i = counter; i <= system.get('instructions.length'); i++) {
				setTimeout(function() {
					system.loadInstruction(i);
					cont.set('instructionCounter', cont.get('instructionCounter') + 1);
				}, i * 500);
			}
		},
		// back button
		reverseInstruction(counter) {
			this.send('loadConfig');
			let system = this.get('system');

			for(let i = 0; i < counter - 1; i++) {
				system.loadInstruction(i);
			}

			this.set('instructionCounter', counter -1);
		},
		toggleEdit() {
			this.toggleProperty('showInstructions');
		}
	}
});
