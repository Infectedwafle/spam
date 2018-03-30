import Controller from '@ember/controller';
import EmberObject, { computed } from '@ember/object';
import System from 'spam/models/system/object';
import OperatingSystem from 'spam/models/operating-system/object';
import MemoryUnit from 'spam/models/memory-unit/object';
import Instruction from 'spam/models/instruction/object';
import InstructionGenerator from 'spam/utils/instruction-generator';

export default Controller.extend({
	_system: null,
	system: computed('_system', function() {
		return this.get('_system');
	}),
	_pageFrameSize: 512,
	pageFrameSize: computed('_pageFrameSize', 'system.pageFrameSize', {
		get() {
			return this.get('_pageFrameSize');
		},
		set(key, val) {
			this.set('_pageFrameSize', val);
			return this.get('_pageFrameSize');
		}
	}),
	_memorySize: 8192,
	memorySize: computed('_memorySize', 'system.memorySize', {
		get() {
			return this.get('_memorySize');
		},
		set(key, val) {
			this.set('_memorySize', val);
			return this.get('_memorySize');
		}
	}),
	_numberOfProcesses: 5,
	numberOfProcesses: computed('_numberOfProcesses', {
		get() {
			return this.get('_numberOfProcesses');
		},
		set(key, val) {
			this.set('_numberOfProcesses', val);
			return this.get('_numberOfProcesses');
		}
	}),
	instructionSize: computed('memorySize', {
		get() {
			return Math.log2(this.get('memorySize'));
		},
		set(key, val) {
			this.set('memorySize', Math.pow(2, val));
			return Math.log2(this.get('memorySize'));
		}
	}),
	instructionCounter: 0,
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
		loadConfig() {
			this.set('instructionCounter', 0);
			let frameCount = Number(this.get('memorySize')) / Number(this.get('pageFrameSize'));

			let system = System.create({
				frameSize: this.get('pageFrameSize'),
				memorySize: this.get('memorySize'),
			});

			let operatingSystem = OperatingSystem.create({
				pageSize: system.get('frameSize'),
				processControlList: new Array(frameCount),
				currentPageTable: new Array(frameCount)
			});

			let memoryUnit = MemoryUnit.create({
				frameSize: system.get('frameSize'),
				frameList: new Array(frameCount),
				swapList: new Array(frameCount * 2)
			});

			system.set('operatingSystem', operatingSystem);
			system.set('memoryUnit', memoryUnit);

			if(this.get('instructions')) {
				let instructionList = this.get('instructions').split("\n").map((instruction) => {
					let instructionParts = instruction.split(" ");

					if(instructionParts.length === 2) {
						return Instruction.create({
							processId: instructionParts[0],
							codeSize: instructionParts[1]
						});
					} else if(instructionParts.length === 3) {
						return Instruction.create({
							processId: instructionParts[0],
							codeSize: instructionParts[1],
							dataSize: instructionParts[2]
						});
					}
				});

				system.set('instructions', instructionList);
			}

			this.set('_system', system);
		},
		generateInstructions(pageFrameSize, numberOfProcesses) {
			let instructions = InstructionGenerator.generate(pageFrameSize, numberOfProcesses);
			this.set('instructions', instructions);
		},
		loadInstruction(counter) {
			let system = this.get('system');
			system.loadInstruction(counter);

			this.set('instructionCounter', counter + 1);
		}
	}
});
