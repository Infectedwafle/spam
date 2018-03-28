import Controller from '@ember/controller';
import { computed } from '@ember/object';
import InstructionGenerator from 'spam/utils/instruction-generator';

export default Controller.extend({
	system: computed.alias('model'),
	_pageFrameSize: null,
	pageFrameSize: computed('_pageFrameSize', 'system.pageFrameSize', {
		get() {
			// If config is null load data from the default system setup
			// this is only used for load of the application
			if(this.get('_pageFrameSize') === null && this.get('system.pageFrameSize') !== null) {
				this.set('_pageFrameSize', this.get('system.pageFrameSize'));
			}

			return this.get('_pageFrameSize');
		},
		set(key, val) {
			this.set('_pageFrameSize', val);
			return this.get('_pageFrameSize');
		}
	}),
	_memorySize: null,
	memorySize: computed('_memorySize', 'system.memorySize', {
		get() {
			// If config is null load data from the default system setup
			// this is only used for load of the application
			if(this.get('_memorySize') === null && this.get('system.memorySize') !== null) {
				this.set('_memorySize', this.get('system.memorySize'));
			}

			return this.get('_memorySize');
		},
		set(key, val) {
			this.set('_memorySize', val);
			return this.get('_memorySize');
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
	actions: {
		loadConfig() {
			this.set('system.pageFrameSize', this.get('pageFrameSize'));
			this.set('system.memorySize', this.get('memorySize'));
		},
		generateInstructions(pageFrameSize) {
			let instructions = InstructionGenerator.generate(pageFrameSize, 5000);
			console.log(instructions);
			this.set('instructions', instructions);
		}
	}
});
