var Core = function() {
	var $this = this;
	var image = false;
	var config = [];

	$this.config = function() {
		chrome.storage.sync.get(['conflict', 'combo', 'file', 'list', 'links'], function(result) {
			config = result;
		});
	};
	$this.init = function() {
		$this.config();

		chrome.runtime.onMessage.addListener(function(request) {
			switch(request.action) {
				case 'tab':
					$this.parseTab(request.url, request.host);
					break;
				default:
					if (config.file) { $this.download(request.url); }
					if (config.list) { $this.saveList(request.url); }
					break;
			}
		});
	};
	$this.download = function(url) {
		var filename = url.match(/\/([0-9A-Za-z\_\-]+)\.(jpg|jpeg|png)/);
		chrome.downloads.download({
			url: url,
			filename: 'goodshit/'+filename[1]+'.'+filename[2],
			conflictAction: config.conflict
		});
	};
	$this.saveList = function(url) {
		if (config.links === undefined) { config.links = ''; }
		chrome.storage.sync.set({links: request.url+"\n"+config.links}, function(e) {});
	};
	$this.parseTab = function(url, host) {
		chrome.tabs.create({url: url, active: false}, function(tab) {
			switch(host) {
				case 'flickr':
					$this.parseFlickr(tab.id);
					break;
				case 'pinterest':
					$this.parsePinterest(tab.id);
					break;
				case 'instagram':
					$this.parseInstagram(tab.id);
					break;
			}
		});
	};
	$this.parseFlickr = function(tab_id) {
		chrome.tabs.executeScript(tab_id, {
			runAt: 'document_end',
			code: `
			var list = document.getElementsByClassName('sizes-list')[0].getElementsByTagName('a'); 
			var biggest = list[list.length-1].href;
			biggest`,
		}, function(result) {
			chrome.tabs.update(tab_id, {url: result[0]});
			chrome.tabs.onUpdated.addListener(function(ntab_id, info, updated) {
				if (ntab_id === tab_id && updated.url == result[0]) {
					chrome.tabs.executeScript(tab_id, {
						runAt: 'document_start',
						code: `var image = document.getElementById('allsizes-photo').getElementsByTagName('img')[0].src; image`,
					}, function(image) {
						if (typeof image[0] === 'string') {
							chrome.tabs.remove(tab_id);
							if (config.file) { $this.download(image[0]); }
							if (config.list) { $this.saveList(image[0]); }
						}
					});
				}
			});
		});
	};
	$this.parsePinterest = function(tab_id) {
		chrome.tabs.executeScript(tab_id, {
			runAt: 'document_end',
			code: `
			var list = document.getElementsByClassName('simpleImageMargin')[0].getElementsByTagName('img');
			var image = list[list.length-1].src;
			image`,
		}, function(image) {
			if (typeof image[0] === 'string') {
				chrome.tabs.remove(tab_id);
				if (config.file) { $this.download(image[0]); }
				if (config.list) { $this.saveList(image[0]); }
			}
		});
	};
	$this.parseInstagram = function(tab_id) {
		chrome.tabs.executeScript(tab_id, {
			runAt: 'document_end',
			code: `var image = false;
				var list = document.getElementsByTagName('meta');
				for (var i in list) {
					if (list[i].attributes !== undefined) {
						if (list[i].attributes[0].value == 'og:image') {
							var image = list[i].content;
						}
					}
				}
				image`,
		}, function(image) {
			if (typeof image[0] === 'string') {
				chrome.tabs.remove(tab_id);
				if (config.file) { $this.download(image[0]); }
				if (config.list) { $this.saveList(image[0]); }
			}
		});
	};
}

new Core().init();