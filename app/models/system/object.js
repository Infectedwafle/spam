import EmberObject, { computed } from '@ember/object';
import MemoryPage from 'spam/models/memory-page/object';
import MemoryFrame from 'spam/models/memory-frame/object';

export default EmberObject.extend({
	memory: null,
	frameSize: null,
	memoryUnit: null,
	operatingSystem: null,
	loadInstruction(instruction) {
		let operatingSystem = this.get('operatingSystem');
		operatingSystem.runInstruction();
	},
	reserveMemory(amount) {
		let memoryUnit = this.get('memoryUnit');
		let frameSize = this.get('frameSize');

	},
	releaseMemory(amount) {

	},
	requestFrame(id) {

	}
});
