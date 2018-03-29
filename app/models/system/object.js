import EmberObject, { computed } from '@ember/object';
import MemoryPage from 'spam/models/memory-page/object';
import MemoryFrame from 'spam/models/memory-frame/object';

export default EmberObject.extend({
	memory: null,
	frameSize: null,
	memoryManagementUnit: null,
	operatingSystem: null
});
