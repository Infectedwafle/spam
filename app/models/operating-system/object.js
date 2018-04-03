import EmberObject from '@ember/object';
import Process from 'spam/models/process/object';
import PageTable from 'spam/models/page-table/object';
import MemoryPage from 'spam/models/memory-page/object';

export default EmberObject.extend({
	pageSize: null,
	processControlList: null,
	_tempMasterPageTable: null,
	_masterPageTable: null,
	masterPageTable: Ember.computed('_tempMasterPageTable', '_masterPageTable', {
		get() {
			return this.get('_tempMasterPageTable') || this.get('_masterPageTable');
		},
		set(key, val) {
			this.set('_masterPageTable', val);
			return this.get('_masterPageTable')
		}
	}),
	_tempSecondaryPageTable: null,
	_secondaryPageTable: null,
	secondaryPageTable:  Ember.computed('_tempSecondaryPageTable', '_secondaryPageTable', {
		get() {
			return this.get('_tempSecondaryPageTable') || this.get('_secondaryPageTable');
		},
		set(key, val) {
			this.set('_secondaryPageTable', val);
			return this.get('_secondaryPageTable')
		}
	}),
	error:null,
	runInstruction(instruction) {
		let os = this;
		os.set('_tempMasterPageTable', null);
		os.set('_tempSecondaryPageTable', null);

		let system = os.get('system');
		let processControlList = os.get('processControlList');

		switch(instruction.get('type')) {
			case 0:
				createProcess(os, instruction.processId, instruction.codeSize, instruction.dataSize);
				break;
			case 1:
				system.releaseMemory(process.id);
				process.set('id', null);
				break;
			case 2:
				
				break;
			case 3:

				break;
			case 4:

				break;
			case 5:

				break;
			default:
				throw "Command not recognized";
				break;

		}
	},
	requestMasterPageTable(frameId) {
		let os = this;
		let system = os.get('system');

		os.set('_tempMasterPageTable', system.requestMemoryFrame(frameId).get('data'));
	},
	requestSecondaryPageTable(frameId) {
		let os = this;
		let system = os.get('system');

		os.set('_tempSecondaryPageTable', system.requestMemoryFrame(frameId).get('data'));
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

const createCodePageTable = function(process, system, os, codeSize) {
	let codePageTable = createPageTable(os, process.get('id'), 'Code');
	let frames = reserveMemory(system, os, codeSize);
	let pageSize = os.get('pageSize');

	// if null frames could not be allocated / system out of memory
	if(frames !== null) {
		let size = codeSize;
		frames.forEach((frame) => {
			frame.set('processId', process.id);
			frame.set('type', 'Code');
			frame.set('size', size - pageSize > 0 ? pageSize : size);
			size -= pageSize;
			updatePageTable(codePageTable, frame);
		});
	}

	return codePageTable;
}

const createDataPageTable = function(process, system, os, codeSize) {
	let dataPageTable = createPageTable(os, process.get('id'), 'Data');
	let frames = reserveMemory(system, os, codeSize);
	let pageSize = os.get('pageSize');

	// if null frames could not be allocated / system out of memory
	if(frames !== null) {
		let size = codeSize;
		frames.forEach((frame) => {
			frame.set('processId', process.id);
			frame.set('type', 'Data');
			frame.set('size', size - pageSize > 0 ? pageSize : size);
			size -= pageSize;
			updatePageTable(dataPageTable, frame);
		});
	}

	return dataPageTable;
}

const reserveMemory = function(system, os,  size) {
	let frames = system.reserveMemory(size)

	if(frames === null) {
		os.set('error', "System out of memory");
		return null;
	} else {
		return frames
	}
}

const createProcess = function(os, id, codeSize, dataSize) {
	let system = os.get('system');
	let processControlList = os.get('processControlList');
	let pageSize = os.get('pageSize');

	// create process model
	let process = Process.create({
		id: id
	});

	// create process page table
	// stores all other page table
	let pageTable = createPageTable(os, id, 'Master');
	if(!pageTable) {
		return null;
	}

	// create a page table to store location of all code pages
	let codePageTable = null;
	let dataPageTable = null;
	// reserve code frames
	if(codeSize > 0) {
		codePageTable = createCodePageTable(process, system, os, codeSize);

		if(!codePageTable) {
			return null;
		}
	}

	// reserve frames for data section
	if(dataSize > 0) {
		dataPageTable = createDataPageTable(process, system, os, dataSize);

		if(!dataPageTable) {
			return null;
		}
	}

	let codePageTableFrame = reserveMemory(system, os, pageSize);
	if(codePageTableFrame) {
		codePageTableFrame[0].set('data', codePageTable);
		codePageTableFrame[0].set('size', pageSize);
		codePageTableFrame[0].set('processId', process.get('id'));
		codePageTableFrame[0].set('type', 'CPT');
		updatePageTable(pageTable, codePageTableFrame[0]);
	} else {
		return null;
	}

	let dataPageTableFrame = reserveMemory(system, os, pageSize);
	if(dataPageTableFrame) {
		dataPageTableFrame[0].set('data', dataPageTable);
		dataPageTableFrame[0].set('size', pageSize);
		dataPageTableFrame[0].set('processId', process.get('id'));
		dataPageTableFrame[0].set('type', 'DPT');
		updatePageTable(pageTable, dataPageTableFrame[0]);
	} else {
		return null;
	}

	let masterPageTableFrame = reserveMemory(system, os, pageSize);
	if(masterPageTableFrame) {
		masterPageTableFrame[0].set('data', pageTable);
		masterPageTableFrame[0].set('type', 'MPT');
		masterPageTableFrame[0].set('processId', process.get('id'));
		masterPageTableFrame[0].set('size', pageSize);
		
		os.set('masterPageTable', pageTable);
	} else {
		return null;
	}


	for (let i = 0; i < processControlList.length; i++) {
		if(processControlList[i].get('id') === null) {
			processControlList[i].set('id', process.id);
			processControlList[i].set('frameId', masterPageTableFrame[0].get('id'));
			break;
		}
	}

	return process;
};

const createPageTable = function(os, processId, type) {
	let table = PageTable.create({
		processId: processId,
		type: type,
		pages: new Array(os.get('system.memorySize') / os.get('pageSize'))
	});

	for(let i = 0; i < table.get('pages').length; i++) {
		table.get('pages')[i] = MemoryPage.create({id: i, frameId: null});
	}

	return table;
}