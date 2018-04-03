import EmberObject from '@ember/object';
// import MemoryPage from 'spam/models/memory-page/object';
// import MemoryFrame from 'spam/models/memory-frame/object';

export default EmberObject.extend({
	memory: null,
	frameSize: null,
	memoryUnit: null,
	operatingSystem: null,
	instructions: null,
	loadInstruction(instructionIndex) {
		let operatingSystem = this.get('operatingSystem');
		let instructions = this.get('instructions');

		if(instructionIndex < instructions.length) {
			let instruction = instructions[instructionIndex];

			let val = operatingSystem.runInstruction(instruction);

			if(val === null) {
				// show System Failure
			}
		} else {
			// end simulation
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
