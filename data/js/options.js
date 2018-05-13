var config = {
	conflict: 'overwrite',
	combo: [
		{code: 17, text: "ControlLeft", type: "keyboard"},
		{code: 1, text: "Mouse 1", type: "mouse"}
	],
	file: true,
	list: null,
	links: ''
};

chrome.storage.sync.get(['conflict', 'combo', 'file', 'list', 'links'], function(result) {
	for (var i in result) { config[i] = result[i]; }
	for (var i in config) {
		switch(i) {
			case 'combo':
				var title = [];
				for (var j in config[i]) {
					title.push(config[i][j].text);
				}
				$(document).find('div[data-name="area"]').attr('data-text', title.join(' + '));
				break;
			case 'links':
				$(document).find('textarea').val(config[i]);
				break;
			default:
				if (typeof config[i] == 'boolean' && config[i] == true) {
					$(document).find('input[name="'+i+'"]').attr('checked', 'checked');
				} else {
					$(document).find('input[name="'+i+'"][value="'+config[i]+'"]').attr('checked', 'checked').val(config[i]);
				}
				break;
		}
	}
});


$(document).on('click', 'input[type="checkbox"]', function(e) {
	var data = {};
	if ($(this).is(':checked')) { data[$(this).attr('name')] = true; } else { data[$(this).attr('name')] = null; }
	chrome.storage.sync.set(data, function(e) {});	
})
$(document).on('click', 'input[type="radio"]', function(e) {
	var data = {};
	data[$(this).attr('name')] = $(this).val();
	chrome.storage.sync.set(data, function(e) {});
})
var element = false;
$(document).on('click', 'div[data-name="area"]', function(e) {
	if (typeof element === 'boolean') {
		$(this).attr('data-text', 'Запись комбанации...').attr('data-active', 1);
		element = $(this);
		config.combo = [];
		$(document).on('mousedown keydown', saveCombo);
	}
});
$(document).on('keyup', 'textarea', function(e) {
	chrome.storage.sync.set({links: $(this).val()}, function(e) {});	
});
function saveCombo(e) {
	if (e.originalEvent.code) {
		config.combo.push({type: 'keyboard', code: e.originalEvent.which, text: e.originalEvent.code});
	} else {
		config.combo.push({type: 'mouse', code: e.originalEvent.which, text: 'Mouse '+e.originalEvent.which});
	}
	var title = [];
	for (var i in config.combo) {
		title.push(config.combo[i].text);
	}
	element.attr('data-text', title.join(' + '));
	e.preventDefault();
	if (title.length >= 2) {
		chrome.storage.sync.set(config, function(e) {});
		$(document).off('mousedown keydown', saveCombo);
		setTimeout(function() {
			element = false;
		}, 200);
	}
	return false;
}