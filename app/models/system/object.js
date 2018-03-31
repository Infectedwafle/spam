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

		let instruction = instructions[instructionIndex];

		operatingSystem.runInstruction(instruction);
	},
	reserveMemory(amount) {
		let memoryUnit = this.get('memoryUnit');

		return memoryUnit.reserveMemory(amount)
	},
	releaseMemory(processId) {
		let memoryUnit = this.get('memoryUnit');

		memoryUnit.releaseMemory(processId);
	},
	requestFrame(id) {
		let memoryUnit = this.get('memoryUnit');

		memoryUnit.requestFrame(id);
	}
});
