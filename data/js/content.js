var Core = function() {
	var $this = this;
	var image = false;
	var config = [];

	var lastEvent = false;

	var host = false;
	var hosts = ['vk', 'twitter', 'tumblr', 'deviantart', 'flickr', 'pinterest', 'instagram'];

	$this.config = function() {
		chrome.storage.sync.get(['combo'], function(result) { config = result.combo; });
	}
	$this.init = function() {
		$this.config();

		for (var i in hosts) {
			if (window.location.hostname.match(hosts[i])) { host = hosts[i]; }
		}

		var selector = false;
		switch(host) {
			case 'vk':
				selector = 'a[onclick*="showPhoto"]';
				break;
			case 'twitter':
				selector = 'div.AdaptiveMedia-photoContainer';
				break;
			case 'tumblr':
				selector = 'img[src*="media.tumblr"]';
				break;
			case 'deviantart':
				selector = '*[data-super-full-img],*[data-super-img]';
				break;
			case 'flickr':
				selector = 'a.overlay, div.photo-notes-scrappy-view';
				break;
			case 'pinterest':
				selector = 'div.pinWrapper, div.simpleImageMargin';
				break;
			case 'instagram':
				selector = 'div._si7dy';
				break;
		}
		if (typeof selector == 'string') {
			$(document).on('mouseover', selector, function(e) {
				image = $(this);
				lastEvent = false;
				$this.events();
			});
		}
	};
	$this.events = function(pass) {
		if (pass == undefined) { pass = 0; }
		if (pass >= 2) { $this.exec(image); return; }

		$(window).on('mousedown keydown', {pass: pass}, $this.eventHandler);
	};
	$this.eventHandler = function(event) {
		event.stopPropagation();
		for (var j in config) {
			if (event.originalEvent.code) {
				if (config[j].type === 'keyboard' && config[j].code === event.originalEvent.which && lastEvent !== 'keyboard'+event.originalEvent.which) {
					lastEvent = 'keyboard'+event.originalEvent.which;
					$(window).off('mousedown keydown', $this.eventHandler);
					event.data.pass++; $this.events(event.data.pass); break;
				}
			} else {
				if (config[j].type === 'mouse' && config[j].code === event.originalEvent.which && lastEvent !== 'mouse'+event.originalEvent.which) {
					lastEvent = 'mouse'+event.originalEvent.which;
					$(window).off('mousedown keydown', $this.eventHandler);
					event.data.pass++; $this.events(event.data.pass); break;
				}
			}
		}
		return;
	};
	$this.exec = function(image) {
		if (typeof image !== 'object') { return false; }
		var message = false;

		switch(host) {
			case 'vk':
				var data = image.attr('onclick');
				var temp = JSON.parse('{'+data.match(/\{(.*?)\},/)[1]+'}}');
				var tmp = [];
				for (var i in temp.temp) { tmp.push(temp.temp[i]); }
				var biggest = tmp[tmp.length-1];
				if (biggest[0].match(/http/)) { 
					message = {url: biggest[0]+'.jpg'};
				} else { message = {url: temp.temp.base+biggest[0]+'.jpg'}; }
				break;
			case 'twitter':
				message = {url: image.attr('data-image-url')+':large'};
				break;
			case 'tumblr':
				message = {url: image.attr('src').replace(/([0-9]{3,4})\./, '1280.')};
				break;
			case 'deviantart':
				var superfull = image.attr('data-super-full-img');
				var notsuper = image.attr('data-super-img');
				message = {url: superfull?superfull:notsuper};
				break;
			case 'flickr':
				var path = false;
				if (image.attr('href')) {
					path = image.attr('href').split('/');
				} else {
					path = window.location.pathname.split('/');
				}
				message = {
					action: 'tab',
					host: host,
					url: window.location.protocol+'//'+window.location.host+'/'+path[1]+'/'+path[2]+'/'+path[3]+'/sizes/t/'
				};
				break;
			case 'pinterest':
				if (image.hasClass('simpleImageMargin')) {
					message = {url: image.find('img:last-child').attr('src')};
				} else {
					path = image.find('a:first-child').attr('href');
					message = {
						action: 'tab',
						host: host,
						url: window.location.protocol+'//'+window.location.host+path
					};
				}
				break;
			case 'instagram':
				if (image.parents('a:first').attr('href')) {
					path = image.parents('a:first').attr('href');
					message = {
						action: 'tab',
						host: host,
						url: window.location.protocol+'//'+window.location.host+path
					};
				} else {
					message = {url: $(document).find('meta[property="og:image"]').attr('content')};
				}
				break;
		}
		$this.send(message, function(e) {
			setTimeout(function() { lastEvent = false; image = false; }, 100);
		});
	};
	$this.send = function(message, callback) {
		chrome.runtime.sendMessage(message, callback);
	};
};

new Core().init();