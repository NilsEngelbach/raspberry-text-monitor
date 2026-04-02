# Song Lyrics Format Specification

Format for `.md` lyric files used by **raspberry-text-monitor**.

Files are standard Markdown processed by [Showdown.js](https://showdownjs.com/) with custom extensions.

---

## Line Breaks

Each non-empty lyric line automatically gets a `<br>` appended server-side, so single
newlines in the source render as line-breaks on screen. No trailing spaces needed.
Blank lines produce paragraph spacing.

---

## Section Tags

Wrap sections in tilde-tags. The tag name becomes the CSS class.

```
~refrain~
Chorus line one
Chorus line two
~/refrain~

~bridge~
Bridge section
~/bridge~
```

| Tag | CSS class | Default color |
|-----|-----------|---------------|
| `~refrain~…~/refrain~` | `.refrain` | yellow |
| `~bridge~…~/bridge~` | `.bridge` | orange |
| `~anything~…~/anything~` | `.anything` | (inherits) |

Colors are configurable via `.env`: `REFRAIN_COLOR`, `BRIDGE_COLOR`.

---

## Inline Color Spans

Apply any named CSS color inline:

```
=gold=The snow glows white on the mountain tonight=/gold=
=red=Don't let them in, don't let them see=/red=
```

Syntax: `=colorname=text=/colorname=`

- Can span multiple lines
- Any valid CSS color name works (e.g. `gold`, `red`, `cyan`, `hotpink`)
- Hex values are **not** supported — named colors only

---

## Multi-Column Layout

These two features are always used together: `flex: true` front matter enables the flex
container, and `##col##` dividers create the columns. Neither is useful without the other.

```markdown
---
flex: true
---
##left##
Left column content
##/left##

##right##
Right column content
##/right##
```

| Syntax | Renders as |
|--------|-----------|
| `##left##…##/left##` | Div with class `.left` |
| `##right##…##/right##` | Div with class `.right` |
| `##anything##…##/anything##` | Div with class `.anything` |

The `flex: true` front matter must be at the very top of the file, enclosed in `---` lines.
It switches the `#lyrics` container to `display: flex`, placing the column divs side by side.

---

## Standard Markdown

All standard Markdown is supported. Most commonly used:

- `**bold text**` — emphasis on lyrics or section titles

---

## Annotations & Stage Notes

Use square brackets for notes that should appear as plain text:

```
Come on come on [6x]
[REFRAIN]
[8 Takte Pause]
```

---

## Full Example

```markdown
---
flex: false
---
Verse line one
Verse line two

~refrain~
Chorus line A
Chorus line B
~/refrain~

~bridge~
Bridge section
~/bridge~

=gold=Solo part A=/gold= =red=Solo part B=/red=

**Outro** [4x]
```

---

## Two-Column Example

```markdown
---
flex: true
---
##left##
~bridge~
Left heading
~/bridge~

Left column lyrics
##/left##

##right##
~bridge~
Right heading
~/bridge~

Right column lyrics
##/right##
```
