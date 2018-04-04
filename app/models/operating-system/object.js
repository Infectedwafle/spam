import EmberObject, { computed } from '@ember/object';
import Process from 'spam/models/process/object';
import PageTable from 'spam/models/page-table/object';
import MemoryPage from 'spam/models/memory-page/object';

export default EmberObject.extend({
	pageSize: null,
	processControlList: null,
	_tempMasterPageTable: null,
	_masterPageTable: null,
	masterPageTable: computed('_tempMasterPageTable', '_masterPageTable', {
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
	secondaryPageTable:  computed('_tempSecondaryPageTable', '_secondaryPageTable', {
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
		// let processControlList = os.get('processControlList');

		switch(instruction.get('type')) {
			case 0:
				return createProcess(os, instruction.processId, instruction.codeSize, instruction.dataSize);
				break;
			case 1:
				return system.releaseMemory(instruction.get('processId'));
				break;
			case 2:
				return useCode(os, instruction.processId, instruction.codeSize);
				break;
			case 3:
				return useData(os, instruction.processId, instruction.dataSize);
				break;
			case 4:
				return useStack(os, instruction.processId, instruction.stackSize);
				break;
			case 5:
				return useHeap(os, instruction.processId, instruction.heapSize);
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

const updatePageTable = function(pageTable, frame, type = null) {
	for(let i = 0; i < pageTable.get('pages').length; i++) {
		if(pageTable.get('pages')[i].get('frameId') === null) {
			pageTable.get('pages')[i].set('frameId', frame.get('id'));
			pageTable.get('pages')[i].set('type',  type);
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
		let tempSize = codeSize;
		frames.forEach((frame) => {
			frame.set('processId', process.id);
			frame.set('type', 'Code');
			frame.set('size', tempSize - pageSize > 0 ? pageSize : tempSize);
			tempSize -= pageSize;
			updatePageTable(codePageTable, frame);
		});
	} else {
		return null;
	}

	return codePageTable;
}

const createDataPageTable = function(process, system, os, dataSize) {
	let dataPageTable = createPageTable(os, process.get('id'), 'Data');
	let frames = reserveMemory(system, os, dataSize);
	let pageSize = os.get('pageSize');

	// if null frames could not be allocated / system out of memory
	if(frames !== null) {
		let tempSize = dataSize;
		frames.forEach((frame) => {
			frame.set('processId', process.id);
			frame.set('type', 'Data');
			frame.set('size', tempSize - pageSize > 0 ? pageSize : tempSize);
			tempSize -= pageSize;
			updatePageTable(dataPageTable, frame);
		});
	} else {
		return null;
	}

	return dataPageTable;
}

const createStackPageTable = function(process, system, os, stackSize) {
	let stackPageTable = createPageTable(os, process.get('id'), 'Stack');
	let frames = reserveMemory(system, os, stackSize);
	let pageSize = os.get('pageSize');

	console.log(stackSize);
	// if null frames could not be allocated / system out of memory
	if(frames !== null) {
		let tempSize = stackSize;
		frames.forEach((frame) => {
			frame.set('processId', process.id);
			frame.set('type', 'Stack');
			frame.set('size', tempSize - pageSize > 0 ? pageSize : tempSize);
			tempSize -= pageSize;
			updatePageTable(stackPageTable, frame);
		});
	} else {
		return null;
	}

	return stackPageTable;
}

const reserveMemory = function(system, os,  size) {
	let frames = system.reserveMemory(size)

	if(frames === null) {
		return null;
	} else {
		return frames
	}
}

const createProcess = function(os, id, codeSize, dataSize) {
	let system = os.get('system');
	let processControlList = os.get('processControlList');
	let pageSize = os.get('pageSize');

	system.get('log').pushObject(EmberObject.create({
		message: `Process ${id} entered the system`,
		type: 'info'
	}));

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
		updatePageTable(pageTable, codePageTableFrame[0], 'Code');
	} else {
		return null;
	}

	let dataPageTableFrame = reserveMemory(system, os, pageSize);
	if(dataPageTableFrame) {
		dataPageTableFrame[0].set('data', dataPageTable);
		dataPageTableFrame[0].set('size', pageSize);
		dataPageTableFrame[0].set('processId', process.get('id'));
		dataPageTableFrame[0].set('type', 'DPT');
		updatePageTable(pageTable, dataPageTableFrame[0], 'Data');
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

/**
 * This is a simple instruction to bring code frames from the swap space to ram
 * @param  {EmberObject} os     a reference to the Operating System object
 * @param  {Number} processId 	Unique id for a process
 * @return {null}           	No return value
 */
const useCode = function(os, processId) {
	let system = os.get('system');
	let pcb = os.get('processControlList');

	let process = pcb.findBy('id', processId);

	if(process) {
		let masterPageTableFrame = system.requestMemoryFrame(process.get('frameId'));

		if(masterPageTableFrame) {
			let codePageTablePage = masterPageTableFrame.get('data.pages').findBy('type', 'Code');
			let codePageTableFrame = null;

			if(codePageTablePage) {
				codePageTableFrame = system.requestMemoryFrame(codePageTablePage.get('frameId'));
			}

			if(codePageTableFrame) {
				let codeFrames = [];

				codePageTableFrame.get('data.pages').forEach((page) => {
					system.requestMemoryFrame(page.get('frameId'));
				});
			}	
		}
	}
}

const useData = function(os, processId, size) {
	let system = os.get('system');
	let pcb = os.get('processControlList');

	let process = pcb.findBy('id', processId);

	if(process) {
		let masterPageTableFrame = system.requestMemoryFrame(process.get('frameId'));

		if(masterPageTableFrame) {
			let dataPageTablePage = masterPageTableFrame.get('data.pages').findBy('type', 'Data');
			let dataPageTableFrame = null;

			if(dataPageTablePage) {
				dataPageTableFrame = system.requestMemoryFrame(dataPageTablePage.get('frameId'));
			}
			if(dataPageTableFrame) {
				let dataFrames = [];

				dataPageTableFrame.get('data.pages').forEach((page) => {
					system.requestMemoryFrame(page.get('frameId'));
				});
			}	
		}
	}
}

const useStack = function(os, processId, size) {
	let system = os.get('system');
	let pcb = os.get('processControlList');

	let process = pcb.findBy('id', processId);

	if(process) {
		let masterPageTableFrame = system.requestMemoryFrame(process.get('frameId'));

		if(masterPageTableFrame) {
			let stackPageTablePage = masterPageTableFrame.get('data.pages').findBy('type', 'Stack');
			let stackPageTableFrame = null;

			if(stackPageTablePage) {
				stackPageTableFrame = system.requestMemoryFrame(stackPageTablePage.get('frameId'));
			}
			
			if(stackPageTableFrame) {
				let codeFrames = [];

				stackPageTableFrame.get('data.pages').forEach((page) => {
					system.requestMemoryFrame(page.get('frameId'));
				});
			} else {
				// allocate stack
				let stackPageTable = createStackPageTable(process, system, os, size);

				stackPageTableFrame = reserveMemory(system, os, os.get('pageSize'));
				if(stackPageTableFrame) {
					stackPageTableFrame[0].set('data', stackPageTable);
					stackPageTableFrame[0].set('size', os.get('pageSize'));
					stackPageTableFrame[0].set('processId', process.get('id'));
					stackPageTableFrame[0].set('type', 'SPT');
					updatePageTable(masterPageTableFrame.get('data'), stackPageTableFrame[0], 'Stack');
				} else {
					return null;
				}

			}
		}
	}
}

const useHeap = function(os, processId, size) {
	
}

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