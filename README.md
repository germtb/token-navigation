# token-navigation package

Grammatically meaningful code navigation in javascript. Jump from token to token, ignoring those which you consider less important in settings.

## Jumping tokens
Travel to the next (`alt` + `h`) or previous (`alt` + `l`) piece of meaningful code.

![](https://raw.githubusercontent.com/germtb/gifs/master/token-navigation.gif)

## Fuzzy search!
Jump tokens with fuzzy searching with `alt` + `f`. Travel your code at the speed of light no matter how slow your memory is. Once there are results:
- `enter` to select next one
- `shift` + `enter` to select previous one
- `alt` + `enter` to select all

![](https://raw.githubusercontent.com/germtb/gifs/master/fuzzy-token-navigation.gif)

## View written in react
Just because it was exciting to implement it doesn't mean that it's good. Anyway it makes it much easier to handle state compared to `document.createElement`. And leaves room for more view work if needs extension.

## How it works
When using the shortcut for next or previous token, the whole file will be parsed by babel and then the cursor will travel and select to the next or previous token. This could appear to be a slow process, but it actually is not. The only issue I found is that while developing we often have code that does not conform a valid abstract syntax tree. For those cases I have provided a regex based parser that, despite silly, is good enough until we can use babel for tokenizing again.

For fuzzy token jumping the behaviour is similar. Once the tokens are produced they will be fuzzy-mathed with the given pattern, allowing quick travel between them.
