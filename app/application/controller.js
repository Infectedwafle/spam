import Controller from '@ember/controller';
import EmberObject, { computed } from '@ember/object';
import System from 'spam/models/system/object';
import OperatingSystem from 'spam/models/operating-system/object';
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
	maxNumberOfPages: 8096,
	actions: {
		loadConfig() {
			let system = System.create({
				frameSize: this.get('pageFrameSize'),
				memorySize: this.get('memorySize'),
				operatingSystem: OperatingSystem.create({
					pageTableLookup: [],
					currentPageTable: [],
					virtualMemoryTable:[] // not sure how to use this
				})
			});

			if(this.get('instructions')) {
				// load instruction into system
			}

			this.set('_system', system);
		},
		generateInstructions(pageFrameSize, numberOfProcesses) {
			let instructions = InstructionGenerator.generate(pageFrameSize, numberOfProcesses);
			this.set('instructions', instructions);
		},
		setInstructionSize(size) {
			this.set('_instructionSize', size);
		}
	}
});
