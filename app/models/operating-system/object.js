import EmberObject from '@ember/object';
import Process from 'spam/models/process/object';
import PageTable from 'spam/models/page-table/object';
import MemoryPage from 'spam/models/memory-page/object';

export default EmberObject.extend({
	pageSize: null,
	processControlList: null,
	currentPageTable: null,
	error:null,
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
			process = this.createProcess(instruction.processId, instruction.codeSize, instruction.dataSize);

		} else {
			system.releaseMemory(process.id);
			process.set('id', null);
		}
	},
	createProcess(id, codeSize, dataSize) {
		let os = this;
		let system = os.get('system');
		let processControlList = os.get('processControlList');

		let process = Process.create({
			id: id
		});

		let pageTable = os.createProcessPageTable(id);

		if(codeSize > 0) {
			let frames = system.reserveMemory(codeSize);

			// if null frames could not be allocated / system out of memory
			if(frames === null) {
				os.set("error", "System out of Memory");
			} else {
				let size = codeSize;
				frames.forEach((frame) => {
					frame.set('processId', process.id);
					frame.set('size', size - os.get('pageSize') > 0 ? os.get('pageSize') : size);
					size -= os.get('pageSize');
					updatePageTable(pageTable, frame);
				});
			}
		}

		for (let i = 0; i < processControlList.length; i++) {
			if(processControlList[i].get('id') === null) {
				processControlList[i].set('id', process.id);
				break;
			}
		}

		os.set('currentPageTable', pageTable);

		return process;
	},
	createProcessPageTable(processId) {
		let table = PageTable.create({
			processId: processId,
			pages: new Array(this.get('system.memorySize') / this.get('pageSize'))
		});

		for(let i = 0; i < table.get('pages').length; i++) {
			table.get('pages')[i] = MemoryPage.create({id: i, frameId: null});
		}

		return table;
	}
});


const updatePageTable = function(pageTable, frame) {
	for(let i = 0; i < pageTable.get('pages').length; i++) {
		if(pageTable.get('pages')[i].get('frameId') === null) {
			pageTable.get('pages')[i].set('frameId', frame.get('id'));
			break;
		}
	}
}