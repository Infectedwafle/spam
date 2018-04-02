import EmberObject from '@ember/object';


export default EmberObject.extend({
	id: null,
	processId: null,
	data: null, // used to store data, currently only a page table the rest of the data is arbitrary
	size: null, // how much space in the frame is used
	type: null // code, data, heap, stack, pageTable.  This is for reference in the GUI
});