Nesbox Time
===============

Experimental service which allows you to play retro games with Nesbox emulator. It's decentralized, crossplatform and works with torrents.

Based on [torrent-stream](https://github.com/mafintosh/torrent-stream).

## Usage

1. Download and install Node.JS [http://nodejs.org/download/](http://nodejs.org/download/)
1. `npm install -g nesbox-time`
1. `nesbox-time`
1. Open your browser at [http://localhost:9000/](http://localhost:9000/)
1. Enjoy!

> On Debian an Ubuntu install the `p7zip-full` package.

> On Mac OSX use Homebrew `brew install p7zip`

## Configuration

You can configure the service using `config.json` file. Here's an example that overrides the defaults, port and magnet links:

```json
{
	"port":9000,
	"nes":"70A279D49E559C075174990F87526D6531C41383",
	"snes":"12386954C55C81AD6091C122F422A6F20958F380",
	"sega":"A86BEDB7EB319BB72EAD1C7ED905D593A5098763",
	"gb":"FCEF86795FCEDBF0291814E5F5EAF1E5C34C6C72",
	"gba":"49E40259BA6C9F2B60AD05151800D231AF6D896B"
}
```
