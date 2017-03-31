# token-navigation package

Grammatically meaningful code navigation in javascript. Jump from token to token, ignoring those which you consider less important in settings.

## Fuzzy token navigation
Jump tokens with fuzzy searching with `alt` + `f`. Travel your code at the speed of light no matter how slow your memory is.

![](https://raw.githubusercontent.com/germtb/gifs/master/fuzzy-token-navigation.gif)

## Jumping tokens
Travel to the next (`alt` + `h`) or previous (`alt` + `l`) piece of meaningful code.

![](https://raw.githubusercontent.com/germtb/gifs/master/token-navigation.gif)

## How it works
When using the shortcut for next or previous token, the whole file will be parsed by babel and then the cursor will travel and select to the next or previous token. This could appear to be a slow process, but it actually is not. The only issue I found is that while developing we often have code that does not conform a valid abstract syntax tree. For those cases I have provided a regex based parser that, despite silly, is good enough until we can use babel for tokenizing again.

For fuzzy token jumping the behaviour is similar. Once the tokens are produced they will be fuzzy-mathed with the given pattern, allowing quick travel between them.
