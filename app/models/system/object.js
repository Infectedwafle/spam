import EmberObject, { computed } from '@ember/object';
// import MemoryPage from 'spam/models/memory-page/object';
// import MemoryFrame from 'spam/models/memory-frame/object';

export default EmberObject.extend({
	memory: null,
	frameSize: null,
	memoryUnit: null,
	operatingSystem: null,
	instructions: null,
	_log: null,
	log: computed('_log.[]', {
		get() {
			return this.get('_log');
		},
		set(key, val) {
			this.set('_log', val);
			return this.get('_log');
		}
	}),
	loadInstruction(instructionIndex) {
		let log = this.get('log');
		let operatingSystem = this.get('operatingSystem');
		let instructions = this.get('instructions');

		if(instructionIndex < instructions.length) {
			let instruction = instructions[instructionIndex];

			let val = operatingSystem.runInstruction(instruction);

			if(val === null) {
				log.pushObject(EmberObject.create({
					message: "Critical Failure: System out of memory!",
					type: 'error'
				}));

				console.log(log);
			}
		} else {
			log.pushObject(EmberObject.create({
				message: "Simulation Complete",
				type: 'success'
			}));
		}
	},
	reserveMemory(amount) {
		let memoryUnit = this.get('memoryUnit');

		return memoryUnit.reserveMemory(amount)
	},
	releaseMemory(processId) {
		let memoryUnit = this.get('memoryUnit');

		memoryUnit.releaseMemory(processId);
	},
	requestMemoryFrame(id) {
		let memoryUnit = this.get('memoryUnit');

		return memoryUnit.requestMemoryFrame(id);
	}
});
