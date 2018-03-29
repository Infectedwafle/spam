import EmberObject, { computed } from '@ember/object';
import MemoryPage from 'spam/models/memory-page/object';
import MemoryFrame from 'spam/models/memory-frame/object';

export default EmberObject.extend({
	frames: computed('numberOfPagesandFrames', function() {
		let frames = [];
		let memory = this.get('memory');
		let pageFrameSize = this.get('pageFrameSize');

		let numberOfPages = memorySize / pageFrameSize;

		if(numberOfPages > 0) {
			for(let i = 0; i < numberOfPages; i++) {
				frames.pushObject(MemoryFrame.create({
					processId: -1,
				}))
			}
		}

		return frames;
	}),
});
