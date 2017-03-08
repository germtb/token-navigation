# token-navigation package

Grammatically meaningful code navigation. Jump from token to token, ignoring those which you consider less important in settings.

## How it looks
![](https://raw.githubusercontent.com/germtb/gifs/master/token-navigation.gif)

## Note

This package comes without keymaps, because it is really hard to adapt to everyone's workflow. To add keymaps go to your `keymap.json` (or `keymap.cson`, which in OS X are located in `~/.atom`) and add the key combination of your choice. I use vim-mode so for me this is what works best:

```
{
	"atom-text-editor": {
		"alt-l": "token-navigation:nextToken",
		"alt-h": "token-navigation:previousToken"
	}
}

```
