import EmberObject from '@ember/object';
import Process from 'spam/models/process/object';
import PageTable from 'spam/models/page-table/object';
import MemoryPage from 'spam/models/memory-page/object';

export default EmberObject.extend({
	pageSize: null,
	processControlList: null,
	masterPageTable: null,
	secondaryPageTable: null,
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
		let pageSize = os.get('pageSize');

		let process = Process.create({
			id: id
		});

		// create process page table
		// stores all other page table
		let pageTable = os.createPageTable(id, 'Master');

		// create a page table to store location of all code pages
		let codePageTable = os.createPageTable(id, 'Code');
		// reserve code frames
		if(codeSize > 0) {
			let frames = system.reserveMemory(codeSize);

			// if null frames could not be allocated / system out of memory
			if(frames === null) {
				os.set("error", "System out of Memory");
			} else {
				let size = codeSize;
				frames.forEach((frame) => {
					frame.set('processId', process.id);
					frame.set('type', 'Code');
					frame.set('size', size - pageSize > 0 ? pageSize : size);
					size -= pageSize;
					updatePageTable(codePageTable, frame);
				});
			}
		}

		// create a page table to store location of all data pages
		let dataPageTable = os.createPageTable(id, 'Data');
		// reserve frames for data section
		if(dataSize > 0) {
			let frames = system.reserveMemory(dataSize);

			// if null frames could not be allocated / system out of memory
			if(frames === null) {
				os.set("error", "System out of Memory");
			} else {
				let size = dataSize;
				frames.forEach((frame) => {
					frame.set('processId', process.id);
					frame.set('type', 'Data');
					frame.set('size', size - pageSize > 0 ? pageSize : size);
					size -= pageSize;
					updatePageTable(dataPageTable, frame);
				});
			}
		}


		let codePageTableFrame = system.reserveMemory(pageSize);
		codePageTableFrame[0].set('data', codePageTable);
		codePageTableFrame[0].set('size', pageSize);
		codePageTableFrame[0].set('processId', process.get('id'));
		codePageTableFrame[0].set('type', 'CPT');
		updatePageTable(pageTable, codePageTableFrame[0]);

		let dataPageTableFrame = system.reserveMemory(pageSize);
		dataPageTableFrame[0].set('data', dataPageTable);
		dataPageTableFrame[0].set('size', pageSize);
		dataPageTableFrame[0].set('processId', process.get('id'));
		dataPageTableFrame[0].set('type', 'DPT');
		updatePageTable(pageTable, dataPageTableFrame[0]);

		let masterPageTableFrame = system.reserveMemory(pageSize);
		masterPageTableFrame[0].set('data', pageTable);
		masterPageTableFrame[0].set('type', 'MPT');
		masterPageTableFrame[0].set('processId', process.get('id'));
		masterPageTableFrame[0].set('size', pageSize);

		os.set('masterPageTable', pageTable);

		for (let i = 0; i < processControlList.length; i++) {
			if(processControlList[i].get('id') === null) {
				processControlList[i].set('id', process.id);
				processControlList[i].set('frameId', masterPageTableFrame[0].get('id'));
				break;
			}
		}

		return process;
	},
	createPageTable(processId, type) {
		let table = PageTable.create({
			processId: processId,
			type: type,
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