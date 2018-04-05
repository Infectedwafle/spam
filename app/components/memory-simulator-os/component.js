import Component from '@ember/component';

export default Component.extend({
	os: null,
	actions: {
		// allows dynamic loading of master page table
		selectMasterPageTable(frameId) {
			let os = this.get('os');

			os.requestMasterPageTable(frameId);
		},
		// allows dynamic loading of secondary page tables
		selectSecondaryPageTable(frameId) {
			let os = this.get('os');

			os.requestSecondaryPageTable(frameId);
		}
	}
});