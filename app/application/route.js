import Route from '@ember/routing/route';
import System from 'spam/models/system/object';

export default Route.extend({
	model: function() {
		return System.create({
			memorySize: 8192,
			pageFrameSize: 512
		});
	}
});