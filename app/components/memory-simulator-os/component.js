import Component from '@ember/component';

export default Component.extend({
	os: null,
	actions: {
		selectMasterPageTable(frameId) {
			let os = this.get('os');

			os.requestMasterPageTable(frameId);
		},
		selectSecondaryPageTable(frameId) {
			let os = this.get('os');

			os.requestSecondaryPageTable(frameId);
		}
	}
});