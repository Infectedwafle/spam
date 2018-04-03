import EmberObject from '@ember/object';

export default EmberObject.extend({
	frameSize: null,
	framesList: null,
	reserveMemory(amount) {
		let frameList = this.get('frameList');
		let neededFrames = Math.ceil(amount / this.get('frameSize'));

		let requestedFrames = [];

		frameList.some((frame) => {
			if(frame.processId === null) {
				requestedFrames.push(frame);
			}

			return requestedFrames.length === neededFrames;
		});

		if(requestedFrames.length !== neededFrames) {
			requestedFrames = null; // simulates error / page fault
		}

		return requestedFrames;
	},
	// releases all memory used by a give process
	releaseMemory(processId) {
		let frameList = this.get('frameList');

		frameList.forEach((frame) => {
			if(frame.get('processId') === processId) {
				frame.set('processId', null);
			}
		});
	},
	requestMemoryFrame(id) {
		let frameList = this.get('frameList');

		let frame = frameList.findBy('id', id);

		if(frame) {
			return frame;
		} else {
			//load frame from swap space the fetch frame
		}
	}
});