import EmberObject, { computed } from '@ember/object';
// import MemoryPage from 'spam/models/memory-page/object';
// import MemoryFrame from 'spam/models/memory-frame/object';

export default EmberObject.extend({
	memory: null,
	frameSize: null,
	memoryUnit: null,
	operatingSystem: null,
	instructions: null,
	// stores a global log for the simulation
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
	// a reversed log so newest entrys are at the top.
	logView: computed('log.[]', function() {
		return this.get('_log').slice().reverseObjects();
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
	requestMemoryFrameFromRam(id) {
		let memoryUnit = this.get('memoryUnit');

		return memoryUnit.requestMemoryFrameFromRam(id);
	},
	requestMemoryFrameFromSwap(id) {
		let memoryUnit = this.get('memoryUnit');

		return memoryUnit.requestMemoryFrameFromSwap(id);
	}
});

/**
 * Non-destructive array reverse function
 * @param  {array} a [description]
 * @return {array}   [description]
 */
const reverseArray = function(a) {
	let temp = [];
	let len = a.length;

	for (var i = (len - 1); i >= 0; i--) {
		temp.push(a[i]);
	}
	return temp;
}