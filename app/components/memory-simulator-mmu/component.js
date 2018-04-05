import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
	mmu: null,
	// computed property to calculate % used memory
	memoryUsed: computed('mmu.frameList.@each.id', function() {
		let mmu = this.get('mmu');
		if(mmu) {
			let frameList = mmu.get('frameList');

			let count = 0;
			frameList.forEach((frame) => {
				if(frame.get('id') !== null) {
					count++;
				}
			});

			return (count / frameList.length) * 100;
		} else {
			return 0;
		}
	}),
	// computed property to calculate % used swap memory
	virtualUsed: computed('mmu.swapList.@each.processId', function() {
		let mmu = this.get('mmu');
		if(mmu) {
			let swapList = mmu.get('swapList');

			let count = 0;
			swapList.forEach((frame) => {
				if(frame.get('processId') !== null) {
					count++;
				}
			});

			return (count / swapList.length) * 100;
		} else {
			return 0
		}
	}),
	actions: {
		
	}
});