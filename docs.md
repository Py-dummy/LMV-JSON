# AI Video DSL Documentation

## Overview
You generate a JSON object describing a video. The JSON is parsed by a renderer that draws everything on a canvas and animates with GSAP. The root object contains a `video` key.

## Root Object
```json
{
  "video": {
    "title": "optional string",
    "resolution": { "width": 1920, "height": 1080 },
    "scenes": [ ... ]
  }
}
```
`resolution` defines canvas dimensions. All coordinates use these dimensions.

## Scene
Each scene is an object in `scenes` array.

| Field        | Type   | Description |
|--------------|--------|-------------|
| name         | string | Scene identifier (optional) |
| duration     | number | Scene length in seconds. Mandatory. All animations run inside this window; anything beyond is clamped. |
| background   | string | CSS color (e.g., "#1a1a2e", "black") |
| elements     | array  | List of element objects drawn at scene start |
| animations   | array  | Animation objects that modify element properties over time |

## Elements
Every element has:
- `id` (string, unique within scene)
- `type` (string) – one of: `"text"`, `"shape"`, `"image"`
- `x`, `y` (number) – position. Default unit is pixels unless `unit` is specified.
- `unit` (optional, `"px"` or `"percent"`). If `"percent"`, `x` and `y` are fractions of canvas width/height (0.5 = center). Defaults to `"px"`.
- `opacity` (number, 0–1, default 1)

### Text Element (`"type": "text"`)
Additional properties:

| Property   | Type   | Description |
|------------|--------|-------------|
| content    | string | Text to display. `\n` creates line breaks. |
| font       | string | CSS `font-family` (e.g., `"Arial, sans-serif"`) |
| fontSize   | number | Font size in pixels |
| color      | string | CSS color (e.g., `"#ffffff"`) |
| align      | string | Horizontal alignment: `"left"`, `"center"`, `"right"`. Default `"left"`. Works within `maxWidth`. |
| maxWidth   | number | Optional. Maximum width in pixels before wrapping. If omitted, text is not wrapped. |
| lineHeight | number | Optional. Multiplier for line spacing. Default ~1.2. Used only when text wraps. |

### Shape Element (`"type": "shape"`)
Draws either a polygon from points or an SVG path. Use exactly one of:

- `points`: Array of `{x, y, unit?}`. Polygon vertices connected in order and closed automatically.
- `path`: SVG path data string. Use only absolute commands (M, L, C, Q, Z). Example: `"M 200 800 L 600 800 L 350 300 Z"`.

Other shape properties:

| Property       | Type   | Description |
|----------------|--------|-------------|
| fill           | string | CSS color or `"transparent"`. Default `"transparent"`. |
| stroke         | string | CSS color for outline. |
| strokeWidth    | number | Width of outline in pixels. |
| strokeDasharray| string | Optional dash pattern like `"8 4"` (dash length, gap). |

### Image Element (`"type": "image"`)
| Property   | Type   | Description |
|------------|--------|-------------|
| src        | string | URL of the image |
| width      | number | Optional display width in pixels (native if omitted) |
| height     | number | Optional display height (native if omitted) |
| scaleMode  | string | How to fit image: `"fill"` (default, stretches to given width/height), `"contain"` (fit inside preserving ratio), `"cover"` (cover area, cropping excess). If no width/height given, native size is used. |

## Coordinates Detail
- For elements, `x,y` with `unit: "percent"` uses canvas dimensions (e.g., `x:0.5, y:0.5` = exact center). `unit: "px"` is pixel from top-left.
- For shape points, each point can have its own `unit`; if omitted, inherits from shape’s default (pixel) or can be set per point. Example: `{"x": 50, "y": 50, "unit": "px"}`.
- Animations tweening `x` or `y` may also specify `unit` to convert. If `unit` not given, value interpreted as the element's coordinate unit.

## Animations
Array of animation objects. Each defines a tween for one element property.

| Field      | Type   | Description |
|------------|--------|-------------|
| target     | string | Element `id` to animate |
| property   | string | Property name to tween: `"x"`, `"y"`, `"opacity"`, `"fontSize"`, `"color"`, `"stroke"`, `"fill"`, `"strokeWidth"`, `"width"`, `"height"`, etc. |
| from       | any    | Optional. Starting value. If omitted, uses element’s current value. |
| to         | any    | Required. End value. |
| unit       | string | For positional properties (`x`,`y`), can be `"px"` or `"percent"` to convert from/to values relative to canvas. Defaults to element’s unit. |
| startDelay | number | Seconds after scene start before animation begins. |
| duration   | number | How long the animation takes in seconds. |
| easing     | string | GSAP easing name. See below. |

All animations run concurrently based on `startDelay`. They start at their delay and last for `duration`. If an animation exceeds the scene `duration`, it is clipped.

Properties that are not numeric (like `color`, `stroke`, `fill`) still tween if both values are valid CSS colors; GSAP interpolates them.

## Easing Reference
Common GSAP easing strings:
- `"none"` (linear)
- `"power1.out"`, `"power2.inOut"`, `"power3.in"`
- `"elastic.out(1,0.3)"`
- `"bounce.out"`
- `"back.out(1.7)"`
- `"circ.inOut"`

Full list: https://gsap.com/docs/v3/Eases/

## Timing Model
- Scene starts at time 0. All elements are drawn immediately with their initial properties.
- Animations begin after `startDelay` from scene start.
- Scene length is fixed by `duration`. After scene duration, the next scene replaces it.
- Plan animations so they complete within scene duration.

## Full Example (Single Scene)
```json
{
  "video": {
    "title": "Demo",
    "resolution": { "width": 1920, "height": 1080 },
    "scenes": [
      {
        "name": "Hello",
        "duration": 3,
        "background": "#0a0a14",
        "elements": [
          {
            "id": "title",
            "type": "text",
            "content": "Hello World",
            "x": 0.5, "y": 0.5, "unit": "percent",
            "font": "Arial",
            "fontSize": 72,
            "color": "#ffffff",
            "align": "center"
          },
          {
            "id": "box",
            "type": "shape",
            "points": [
              { "x": 800, "y": 600 },
              { "x": 1000, "y": 600 },
              { "x": 1000, "y": 800 },
              { "x": 800, "y": 800 }
            ],
            "fill": "rgba(233,69,96,0.3)",
            "stroke": "#e94560",
            "strokeWidth": 2
          }
        ],
        "animations": [
          {
            "target": "title",
            "property": "y",
            "to": 0.4,
            "unit": "percent",
            "startDelay": 0.2,
            "duration": 1.5,
            "easing": "power2.out"
          },
          {
            "target": "box",
            "property": "fill",
            "from": "transparent",
            "to": "rgba(233,69,96,0.5)",
            "startDelay": 1,
            "duration": 0.5
          }
        ]
      }
    ]
  }
}
```

## Notes
- All colors use CSS syntax (hex, rgb, rgba, named colors).
- Multi-line text: use `\n` in the `content` string.
- For shapes, `points` creates a closed polygon; `path` gives exact control.
- `unit` can be mixed: text with `"percent"`, shapes with `"px"`.
- GSAP is used under the hood; any GSAP-compatible easing string works.