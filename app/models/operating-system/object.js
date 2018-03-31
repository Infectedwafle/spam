import EmberObject from '@ember/object';
import Process from 'spam/models/process/object';

export default EmberObject.extend({
	pageSize: null,
	processControlList: null,
	currentPageTable: null,
	runInstruction(instruction) {
		let system = this.get('system');
		let processControlList = this.get('processControlList');

		let process = processControlList.find((existingProcess) => {
			if(existingProcess && existingProcess.id === instruction.processId) {
				return existingProcess;
			}
		});
		
		// If the process does not exist create it
		if(!process) {
			process = this.createProcess(instruction.processId);

			if(instruction.codeSize > 0) {
				// This should probably be made as multiple calls instead of asking for all frames at once to be more accurate
				// reserve memory for code, data and each page table as well one for code, data, and page file itself
				// totalFrames = (codePageTable + (codeSize / frameSize)) + (dataPageTable + (dataSize / frameSize)) + pageTable					
				let size = instruction.codeSize + instruction.dataSize + this.get('pageSize');
				let frames = system.reserveMemory(size);

				frames.forEach((frame) => {
					frame.set('processId', process.id);
				});
			}

			for (let i = 0; i < processControlList.length; i++) {
				if(processControlList[i].get('id') === null) {
					processControlList[i].set('id', process.id);
					break;
				}
			}
		} else {
			system.releaseMemory(process.id);
			process.set('id', null);
		}
	},
	createProcess(id) {
		return Process.create({
			id: id
		})
	}
});
