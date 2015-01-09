#!/usr/bin/env node

console.log('Starting Nesbox.Time...');

var torrentStream = require('torrent-stream');
var fs = require('fs');
var zip = require('node-7z');
var connect = require('connect');
var serveStatic = require('serve-static');
var ejs = require('ejs');
var openurl = require('openurl');

process.chdir(__dirname);

var systems = ['nes', 'snes', 'sega', 'gb', 'gba'];

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var engines = {};

var romstoreFolder = 'website/romstore';

if(!fs.existsSync(romstoreFolder))
	fs.mkdirSync(romstoreFolder);

console.log('!!! Initializing romstores, please wait (0-5 min)...');

systems.forEach(function(system)
{
	var engine = torrentStream('magnet:?xt=urn:btih:' + config[system]);

	engine.on('ready', function()
	{
		engine.files.sort(function(a, b)
		{
			return a.name > b.name ? 1 : -1;
		});

		engines[system] = engine;

		var systemFolder = [romstoreFolder, system].join('/');

		if(!fs.existsSync(systemFolder))
			fs.mkdirSync(systemFolder);

		console.log(system + ' romstore is ready!');

		if(Object.keys(engines).length == systems.length)
			startWebSrever();
	});

});

function writeJson(response, value)
{
	response.writeHead(200, {'Content-Type': 'application/json'});
	response.end(JSON.stringify(value));
}

function processPost(request, callback)
{
	if(request.method == 'POST')
	{
		var buffer = '';
		request.on('data', function(chunk)
		{
			buffer += chunk;
		});

		request.on('end', function()
		{
			callback(JSON.parse(buffer));
		});
	}
}

function getRomName(name)
{
	name = name.split('..').join('.');
	return name.split('.7z').join('');
}

function startWebSrever()
{
	// systems.forEach(function(system)
	// {
	// 	var engine = engines[system];

	// 	engine.on('download', function(index)
	// 	{
	// 		console.log('on engine download', index);
	// 	});
	// 	engine.on('upload', function(index, offset, length)
	// 	{
	// 		console.log('on engine upload', index, offset, length);
	// 	});
	// });

	console.log('!!! Open [http://localhost:' + config.port + '] in your browser and enjoy!');

	openurl.open('http://localhost:' + config.port);

	connect()
		.use('/api/games-list', function(request, response, next)
		{
			processPost(request, function(data)
			{
				var engine = engines[data.system];

				if(!engine) writeJson(response, []);

				var list = engine.files.map(function(file, index)
				{
					return {name:getRomName(file.name), index:index};
				});

				writeJson(response, list);
			});
		})
		.use('/api/game-url', function(request, response, next)
		{
			processPost(request, function(data)
			{
				var engine = engines[data.system];
				var game = engine.files[data.index];

				var gameName = getRomName(game.name);
				var romZip = [romstoreFolder, data.system, game.name].join('/');
				var romFolder = [romstoreFolder, data.system, gameName].join('/');
				var romUrlFolder = ['romstore', data.system, gameName].join('/');

				var selectRom = function(roms)
				{
					var found = null;

					if(!data.rom)
					{
						roms.forEach(function(rom)
						{
							if(rom.indexOf('[!]') != -1)
								found = rom;
						});

						if(!found)
						{
							found = roms[0];
						}						
					}
					else
					{
						found = roms[data.rom];
					}


					writeJson(response, 
						{
							status:'downloaded', 
							system:data.system,
							url:[romUrlFolder, found].join('/'), 
							name:getRomName(found),
							roms:roms.map(function(rom, index)
							{
								return {name:rom, url:'#/' + data.system + '/' + data.index + '/' + index};
							})
						}
					);
				}

				if(fs.existsSync(romZip) && fs.existsSync(romFolder))
				{
					var roms = fs.readdirSync(romFolder);

					selectRom(roms);
				}
				else
				{
					var stream = game.createReadStream();
					var buffer = new Buffer(game.length);
					var offset = 0;

					stream.on('data', function(chunk)
					{
						chunk.copy(buffer, offset);
						offset += chunk.length;

						console.log('downloaded', offset, 'of', game.length, Math.round(offset * 100 / game.length), '%');
					});

					stream.on('end', function()
					{
						console.log('game downloaded:', game.name);

						fs.writeFileSync(romZip, buffer, 'binary');

						if(!fs.existsSync(romFolder))
							fs.mkdirSync(romFolder);

						var zipTask = new zip();

						zipTask.extractFull(romZip, romFolder)

							.progress(function(files)
							{
								console.log(files);
							})

							.then(function () 
							{
								console.log('Zip extracted:', romZip);

								var roms = fs.readdirSync(romFolder);
								selectRom(roms);
							})

							.catch(function (err) 
							{
								console.error(err);
							});
					});
				}
			});
		})
		.use(serveStatic('website')).listen(config.port);
}
