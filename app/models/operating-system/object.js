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

		switch(instruction.get('type')) {
			case 0:
				return createProcess(os, instruction.get('processId'), instruction.get('codeSize'), instruction.get('dataSize'));
			case 1:
				let process = os.get('processControlList').findBy('id', instruction.get('processId'));
				console.log(instruction.get('processId'));
				process.set('id', null);
				process.set('frameId', null);
				os.set('_masterPageTable', null);
				os.set('_secondaryPageTable', null);
				return system.releaseMemory(instruction.get('processId'));
			case 2:
				system.get('log').pushObject(EmberObject.create({
					message: `OS loads code frames for process ${instruction.get('processId')}`,
					type: 'info'
				}));
				return useCode(os, instruction.get('processId'));
			case 3:
				system.get('log').pushObject(EmberObject.create({
					message: `OS loads data frames for process ${instruction.get('processId')}`,
					type: 'info'
				}));
				return useData(os, instruction.get('processId'));
			case 4:
				system.get('log').pushObject(EmberObject.create({
					message: `OS loads stack frames for process ${instruction.get('processId')}`,
					type: 'info'
				}));
				return useStack(os, instruction.get('processId'), instruction.get('stackSize'));
			case 5:
				system.get('log').pushObject(EmberObject.create({
					message: `OS loads heap frames for process ${instruction.get('processId')}`,
					type: 'info'
				}));
				return useHeap(os, instruction.get('processId'), instruction.get('heapSize'));
			default:
				break;

		}
	},
	requestMasterPageTable(frameId) {
		let os = this;
		let system = os.get('system');

		os.set('_tempMasterPageTable', requestMemoryFrame(system, frameId).get('data'));
	},
	requestSecondaryPageTable(frameId) {
		let os = this;
		let system = os.get('system');

		os.set('_tempSecondaryPageTable', requestMemoryFrame(system, frameId).get('data'));
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

	system.get('log').pushObject(EmberObject.create({
		message: `OS requested ${frames.length} frames from memory for Process ${process.id} code`,
		type: 'info'
	}));

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

	system.get('log').pushObject(EmberObject.create({
		message: `OS requested ${frames.length} frames from memory for Process ${process.id} data`,
		type: 'info'
	}));

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

	system.get('log').pushObject(EmberObject.create({
		message: `OS requested ${frames.length} frames from memory for Process ${process.id} stack`,
		type: 'info'
	}));

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

const createHeapPageTable = function(process, system, os, heapSize) {
	let heapPageTable = createPageTable(os, process.get('id'), 'Heap');
	let frames = reserveMemory(system, os, heapSize);
	let pageSize = os.get('pageSize');

	system.get('log').pushObject(EmberObject.create({
		message: `OS requested ${frames.length} frames from memory for Process ${process.id} heap`,
		type: 'info'
	}));

	// if null frames could not be allocated / system out of memory
	if(frames !== null) {
		let tempSize = heapSize;
		frames.forEach((frame) => {
			frame.set('processId', process.id);
			frame.set('type', 'Heap');
			frame.set('size', tempSize - pageSize > 0 ? pageSize : tempSize);
			tempSize -= pageSize;
			updatePageTable(heapPageTable, frame);
		});
	} else {
		return null;
	}

	return heapPageTable;
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

		system.get('log').pushObject(EmberObject.create({
			message: `Process ${id} code page table created`,
			type: 'info'
		}));
	}

	// reserve frames for data section
	if(dataSize > 0) {
		dataPageTable = createDataPageTable(process, system, os, dataSize);

		if(!dataPageTable) {
			return null;
		}

		system.get('log').pushObject(EmberObject.create({
			message: `Process ${id} data page table created`,
			type: 'info'
		}));
	}

	let codePageTableFrame = reserveMemory(system, os, pageSize);
	if(codePageTableFrame) {
		system.get('log').pushObject(EmberObject.create({
			message: `OS requested a frame to store code page table`,
			type: 'info'
		}));

		codePageTableFrame[0].set('data', codePageTable);
		codePageTableFrame[0].set('size', pageSize);
		codePageTableFrame[0].set('processId', process.get('id'));
		codePageTableFrame[0].set('type', 'Code PT');
		updatePageTable(pageTable, codePageTableFrame[0], 'Code');
	} else {
		return null;
	}

	let dataPageTableFrame = reserveMemory(system, os, pageSize);
	if(dataPageTableFrame) {
		system.get('log').pushObject(EmberObject.create({
			message: `OS requested a frame to store data page table`,
			type: 'info'
		}));

		dataPageTableFrame[0].set('data', dataPageTable);
		dataPageTableFrame[0].set('size', pageSize);
		dataPageTableFrame[0].set('processId', process.get('id'));
		dataPageTableFrame[0].set('type', 'Data PT');
		updatePageTable(pageTable, dataPageTableFrame[0], 'Data');
	} else {
		return null;
	}

	let masterPageTableFrame = reserveMemory(system, os, pageSize);
	if(masterPageTableFrame) {
		system.get('log').pushObject(EmberObject.create({
			message: `OS requested a frame to store master page table`,
			type: 'info'
		}));

		masterPageTableFrame[0].set('data', pageTable);
		masterPageTableFrame[0].set('type', 'Master PT');
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
		let masterPageTableFrame = requestMemoryFrame(system, process.get('frameId'));

		if(masterPageTableFrame) {
			os.set('masterPageTable', masterPageTableFrame.get('data'));
			let codePageTablePage = masterPageTableFrame.get('data.pages').findBy('type', 'Code');
			let codePageTableFrame = null;

			if(codePageTablePage) {
				codePageTableFrame = requestMemoryFrame(system, codePageTablePage.get('frameId'));
			}

			if(codePageTableFrame) {
				os.set('secondaryPageTable', codePageTableFrame.get('data'));
				codePageTableFrame.get('data.pages').forEach((page) => {
					if(page.get('frameId') !== null) {
						requestMemoryFrame(system, page.get('frameId'));
					}
				});
			}
		}
	}
}

const useData = function(os, processId) {
	let system = os.get('system');
	let pcb = os.get('processControlList');

	let process = pcb.findBy('id', processId);

	if(process) {
		let masterPageTableFrame = requestMemoryFrame(system, process.get('frameId'));

		if(masterPageTableFrame) {
			os.set('masterPageTable', masterPageTableFrame.get('data'));
			let dataPageTablePage = masterPageTableFrame.get('data.pages').findBy('type', 'Data');
			let dataPageTableFrame = null;

			if(dataPageTablePage) {
				dataPageTableFrame = requestMemoryFrame(system, dataPageTablePage.get('frameId'));
			}
			if(dataPageTableFrame) {
				os.set('secondaryPageTable', dataPageTableFrame.get('data'));
				dataPageTableFrame.get('data.pages').forEach((page) => {
					if(page.get('frameId') !== null) {
						requestMemoryFrame(system, page.get('frameId'));
					}
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
		let masterPageTableFrame = requestMemoryFrame(system, process.get('frameId'));

		if(masterPageTableFrame) {
			os.set('masterPageTable', masterPageTableFrame.get('data'));
			let stackPageTablePage = masterPageTableFrame.get('data.pages').findBy('type', 'Stack');
			let stackPageTableFrame = null;

			if(stackPageTablePage) {
				stackPageTableFrame = requestMemoryFrame(system, stackPageTablePage.get('frameId'));
			}
			
			if(stackPageTableFrame) {
				os.set('secondaryPageTable', stackPageTableFrame.get('data'));
				stackPageTableFrame.get('data.pages').forEach((page) => {
					if(page.get('frameId') !== null) {
						requestMemoryFrame(system, page.get('frameId'));
					}
				});
			} else {
				// allocate stack
				let stackPageTable = createStackPageTable(process, system, os, size);

				stackPageTableFrame = reserveMemory(system, os, os.get('pageSize'));
				if(stackPageTableFrame) {
					stackPageTableFrame[0].set('data', stackPageTable);
					stackPageTableFrame[0].set('size', os.get('pageSize'));
					stackPageTableFrame[0].set('processId', process.get('id'));
					stackPageTableFrame[0].set('type', 'Stack PT');
					updatePageTable(masterPageTableFrame.get('data'), stackPageTableFrame[0], 'Stack');
				} else {
					return null;
				}

			}
		}
	}
}

const useHeap = function(os, processId, size) {
	let system = os.get('system');
	let pcb = os.get('processControlList');

	let process = pcb.findBy('id', processId);

	if(process) {
		let masterPageTableFrame = requestMemoryFrame(system, process.get('frameId'));

		if(masterPageTableFrame) {
			os.set('masterPageTable', masterPageTableFrame.get('data'));
			let heapPageTablePage = masterPageTableFrame.get('data.pages').findBy('type', 'Heap');
			let heapPageTableFrame = null;

			if(heapPageTablePage) {
				heapPageTableFrame = requestMemoryFrame(system, heapPageTablePage.get('frameId'));
			}
			
			if(heapPageTableFrame) {
				os.set('secondaryPageTable', heapPageTableFrame.get('data'));
				heapPageTableFrame.get('data.pages').forEach((page) => {
					if(page.get('frameId') !== null) {
						requestMemoryFrame(system, page.get('frameId'));
					}
				});
			} else {
				// allocate heap
				let heapPageTable = createHeapPageTable(process, system, os, size);

				heapPageTableFrame = reserveMemory(system, os, os.get('pageSize'));
				if(heapPageTableFrame) {
					heapPageTableFrame[0].set('data', heapPageTable);
					heapPageTableFrame[0].set('size', os.get('pageSize'));
					heapPageTableFrame[0].set('processId', process.get('id'));
					heapPageTableFrame[0].set('type', 'Heap PT');
					updatePageTable(masterPageTableFrame.get('data'), heapPageTableFrame[0], 'Heap');
				} else {
					return null;
				}

			}
		}
	}
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

const requestMemoryFrame = function(system, frameId) {
	system.get('log').pushObject(EmberObject.create({
		message: `OS requests frame ${frameId} from RAM`,
		type: 'info'
	}));

	let frame = system.requestMemoryFrameFromRam(frameId);

	if(frame !== null) {
		system.get('log').pushObject(EmberObject.create({
			message: `OS recieved frame ${frameId}`,
			type: 'info'
		}));
		return frame;	// No Page Fault
	} else {
		frame = system.requestMemoryFrameFromSwap(frameId); // handle page fault by check for page in swap space

		system.get('log').pushObject(EmberObject.create({
			message: `OS requests frame ${frameId} from SWAP space`,
			type: 'info'
		}));

		if(frame !== null) {
			return frame; // page swapped into ram and returned to os
		} else {
			system.get('log').pushObject(EmberObject.create({
				message: `We have a serious problem`,
				type: 'error'
			}));

			return null;
		}
	}
}