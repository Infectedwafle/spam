import EmberObject from '@ember/object';

export default EmberObject.extend({
	frameSize: null,
	frameList: null,
	swapList: null,
	reserveMemory(amount) {
		let swapList = this.get('swapList');
		let neededFrames = Math.ceil(amount / this.get('frameSize'));

		let requestedFrames = [];

		swapList.some((frame) => {
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
		let swapList = this.get('swapList');
		let frameList = this.get('frameList');

		swapList.forEach((frame) => {
			if(frame.get('processId') === processId) {
				frame.set('processId', null);
			}
		});

		frameList.forEach((frame) => {
			if(frame.get('processId') === processId) {
				frame.set('processId', null);
			}
		});
	},
	/**
	 * requests a specfic frame
	 * @param  {[type]} id [description]
	 * @return {[type]}    [description]
	 */
	requestMemoryFrame(id) {
		let frameList = this.get('frameList');

		let ramFrame = frameList.findBy('id', id);

		if(ramFrame) {
			return ramFrame;
		} else {
			//load frame from swap space the fetch frame
			let swapList = this.get('swapList');

			let swapFrame = swapList.findBy('id', id);

			if(swapFrame) {
				//copy frames to memory then return the memory frame
				return copyFrameToRam(frameList, swapFrame);
			} else {
				return null; // the frame does not exist, this is a problem
			}
		}
	}
});

const copyFrameToRam = function(frameList, frame) {
	// check for empty frames
	for(let i = 0; i < frameList.length; i++) {
		if(frameList[i].get('id') === null) {
			frameList[i].set('id', frame.get('id'));
			frameList[i].set('processId', frame.get('processId'));
			frameList[i].set('data', frame.get('data'));
			frameList[i].set('size', frame.get('size'));
			frameList[i].set('type', frame.get('type'));
			// timestamps are easy needed more time to use a more accurrate depiction of how this works
			frameList[i].set('timeStamp', new Date());
			return frameList[i];
		}
	}

	let ramFrame = frameList[0];
	// if no ram frames are open use lru
	for(let i = 1; i < frameList.length; i++) {
		if(frameList[i].get('timeStamp') < ramFrame.get('timeStamp')) {
			ramFrame = frameList[i];
		}
	}

	ramFrame.set('id', frame.get('id'));
	ramFrame.set('processId', frame.get('processId'));
	ramFrame.set('data', frame.get('data'));
	ramFrame.set('size', frame.get('size'));
	ramFrame.set('type', frame.get('type'));
	ramFrame.set('timeStamp', new Date());
	return ramFrame;
}