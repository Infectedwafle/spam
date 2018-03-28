import EmberObject, { computed } from '@ember/object';
import MemoryPage from 'spam/models/memory-page/object';
import MemoryFrame from 'spam/models/memory-frame/object';

export default EmberObject.extend({
	memorySize: null,
	pageFrameSize: null,
	numberOfPagesandFrames: computed('memorySize', 'pageFrameSize', function() {
		if(this.get('pageFrameSize') > 0) {
			return this.get('memorySize') / this.get('pageFrameSize');
		} else {
			return 0;
		}
	}),
	pages: computed('numberOfPagesandFrames', function() {
		let pages = [];
		let numberOfPages = this.get('numberOfPagesandFrames');

		if(numberOfPages > 0) {
			for(let i = 0; i < numberOfPages; i++) {
				pages.pushObject(MemoryPage.create({
					processId: -1,
				}));
			}
		}

		return pages;
	}),
	frames: computed('numberOfPagesandFrames', function() {
		let frames = [];
		let memorySize = this.get('memorySize');
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
	})
});
