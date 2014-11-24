$(function()
{
	console.log('starting...');

	var renderTemplate = function(name, data)
	{
		data = data || {};

		data.include = data.include || function(value)
		{
			return value == name ? '' : renderTemplate(value, data);
		};			

		return new EJS({url: '/templates/' + name + '.ejs'}).render(data);
	}

	function api(method, data, callback)
	{
		$.post('/api/' + method, JSON.stringify(data), callback, 'json');
	}

	function showGamesPage(system)
	{
		$('.ajax-loader').replaceWith(renderTemplate('main', {system:system}));

		api('games-list', {system:system}, function(list)
		{
			$('.ajax-loader').replaceWith(renderTemplate('games-list', {system:system, list:list}));
		});
	}

	function showGamePage(system, index, rom)
	{
		$('.ajax-loader').replaceWith(renderTemplate('game', {system:system, game:index}));

		api('game-url', {system:system, index:index, rom:rom}, function(data)
		{
			if(data.status == 'downloaded')
			{
		 		$('#game-downloader').replaceWith(renderTemplate('emulator', data));
			}
			else
			{
				console.log(data.status, data.url);	
			}
		});
	}

	var onHashChange = function()
	{
		var hash = window.location.hash;

		$('.main-container').replaceWith('<div class="ajax-loader">');

		hash = hash == '' ? '' : hash.slice(1);

		var parts = hash.split('/');

		if(parts.length == 2)
		{
			showGamesPage(parts[1]);
		}
		else if(parts.length == 3)
		{
			showGamePage(parts[1], parts[2]);	
		}
		else if(parts.length == 4)
		{
			showGamePage(parts[1], parts[2], parts[3]);
		}
		else
			showGamesPage('nes');
	}

	$(window).bind('hashchange', onHashChange);

	onHashChange();
});
