import EmberObject from '@ember/object';

export default EmberObject.extend({
	frameSize: null,
	framesList: null,
	reserveMemory(amount) {
		let frameList = this.get('frameList');
		let numberOfFrames = Math.ceil(amount / this.get('frameSize'));

		let requestedFrames = [];

		frameList.some((frame) => {
			if(frame.processId === null) {
				requestedFrames.push(frame);
			}

			return requestedFrames.length === numberOfFrames;
		});

		return requestedFrames;
	},
	// releases all memory used by a give process
	releaseMemory(processId) {
		let frameList = this.get('frameList');

		frameList.forEach((frame) => {
			console.log(frame.get('processId'), processId);
			if(frame.get('processId') === processId) {
				frame.set('processId', null);
			}
		});
	},
	requestFrame(id) {

	}
});