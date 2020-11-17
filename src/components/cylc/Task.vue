<!--
Copyright (C) NIWA & British Crown (Met Office) & Contributors.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->

<!--
  Task - The task status icon implemented as an inline-block level object
         which can sit in text.
-->
<script>
export default {
  name: 'Task',
  functional: true,
  props: {
    status: {
      type: String,
      required: true
    },
    isHeld: {
      type: Boolean,
      require: true
    },
    progress: {
      type: Number,
      required: false,
      default: 0
    }
  },
  render: function (createElement, context) {
    const taskIconSvgChildren = []
    // Status indicator - the status portion of the task state.
    const statusIndicator = createElement(
      'g',
      {
        attrs: {
          id: 'status'
        }
      },
      [
        // progress pie chart:
        // * position in the middle
        // * let radius = 25% radius
        // * let stroke-width = 100% - (2*radius) = 50%
        // * let stroke-dasharray ~= 2 * pi * radius
        // * use dashes as the line style to turn this into a pie chart
        createElement(
          'circle',
          {
            attrs: {
              id: 'progress',
              cx: '50',
              cy: '50',
              r: '25',
              'stroke-width': '50',
              'stroke-dasharray': '157',
              style: `stroke-dashoffset: ${157 - (157 * (context.props.progress / 100))}`
            }
          }
        ),
        // dot in the middle (small hub)
        // * position in the middle
        // * radius can be changed independently
        // * we can't just change the radius with CSS (SVG2 only).
        createElement(
          'circle',
          {
            attrs: {
              id: 'dot',
              cx: '50',
              cy: '50',
              r: '8'
            }
          }
        ),
        // circle in the middle (hub)
        // * position in the middle
        // * radius can be changed independently
        createElement(
          'circle',
          {
            attrs: {
              id: 'hub',
              cx: '50',
              cy: '50',
              r: '15'
            }
          }
        ),
        // outer circle
        // * position in the middle
        // * let radius = 50% - (stroke-width/2)
        createElement(
          'circle',
          {
            attrs: {
              id: 'outline',
              cx: '50',
              cy: '50',
              r: '46',
              'stroke-width': '8'
            }
          }
        ),
        // cross (failure)
        // * create a plus and rotate it 45 deg around the origin
        // * let rx ~= max(width, height) * 0.1
        createElement(
          'g',
          {
            attrs: {
              id: 'cross',
              transform: 'rotate(45, 50, 50)'
            }
          },
          [
            createElement(
              'rect',
              {
                attrs: {
                  x: 15,
                  y: 45,
                  width: '70',
                  height: '10',
                  rx: '7',
                  ry: '7'
                }
              }
            ),
            createElement(
              'rect',
              {
                attrs: {
                  x: 45,
                  y: 15,
                  width: '10',
                  height: '70',
                  rx: '7',
                  ry: '7'
                }
              }
            )
          ]
        )
      ]
    )
    taskIconSvgChildren.push(statusIndicator)

    // isHeld - the isHeld portion of the task state.
    const isHeld = createElement(
      'g',
      {
        attrs: {
          id: 'held',
          transform: 'scale(0.45)'
        }
      },
      [
        createElement(
          'circle',
          {
            cx: '50',
            cy: '50',
            r: '46',
            'stroke-width': '8'
          }
        ),
        createElement(
          'rect',
          {
            attrs: {
              x: 32.5,
              y: 25,
              width: '10',
              height: '50',
              rx: '5',
              ry: '5'
            }
          }
        ),
        createElement(
          'rect',
          {
            attrs: {
              x: 52.5,
              y: 25,
              width: '10',
              height: '50',
              rx: '5',
              ry: '5'
            }
          }
        )
      ]
    )
    taskIconSvgChildren.push(isHeld)

    // Warning icon.
    const warningIcon = createElement(
      'g',
      {
        attrs: {
          id: 'warning',
          transform: 'scale(0.45) translate(125, 0)'
        }
      },
      [
        createElement(
          'circle',
          {
            attrs: {
              cx: '50',
              cy: '50',
              r: '46',
              'stroke-width': '10'
            }
          }
        ),
        createElement(
          'rect',
          {
            attrs: {
              x: 45,
              y: 25,
              width: '10',
              height: '35',
              rx: '5',
              ry: '5'
            }
          }
        ),
        createElement(
          'rect',
          {
            attrs: {
              x: 45,
              y: 65,
              width: '10',
              height: '10',
              rx: '5',
              ry: '5'
            }
          }
        )
      ]
    )
    taskIconSvgChildren.push(warningIcon)

    // Clockface.
    const clockface = createElement(
      'g',
      {
        attrs: {
          id: 'clockface'
        }
      },
      [
        createElement(
          'circle',
          {
            attrs: {
              cx: '50',
              cy: '50',
              r: '7.5'
            }
          }
        ),
        createElement(
          'rect',
          {
            attrs: {
              x: '47.5',
              y: '12.5',
              width: '5',
              height: '37.5'
            }
          }
        ),
        createElement(
          'rect',
          {
            attrs: {
              x: '47.5',
              y: '25',
              width: '5',
              height: '25',
              transform: 'rotate(135, 50, 50)'
            }
          }
        )
      ]
    )
    taskIconSvgChildren.push(clockface)

    // Unknown status.
    const unknownStatus = createElement(
      'g',
      {
        attrs: {
          transform: 'scale(0.5)'
        }
      },
      [
        createElement(
          'path',
          {
            attrs: {
              id: 'question-mark',
              fill: 'none',
              d: 'm 101.47,34.062 c -5.45,0.03 -10.653,0.737 -15.282,2.063 -4.699,1.346 -9.126,3.484 -12.876,6.219 -3.238,2.362 -6.333,5.391 -8.687,8.531 -4.159,5.549 -6.461,11.651 -7.063,18.687 -0.04,0.468 -0.07,0.868 -0.062,0.876 0.016,0.016 21.702,2.687 21.812,2.687 0.053,0 0.113,-0.234 0.282,-0.937 1.941,-8.085 5.486,-13.521 10.968,-16.813 4.32,-2.594 9.808,-3.612 15.778,-2.969 2.74,0.295 5.21,0.96 7.38,2 2.71,1.301 5.18,3.361 6.94,5.813 1.54,2.156 2.46,4.584 2.75,7.312 0.08,0.759 0.05,2.48 -0.03,3.219 -0.23,1.826 -0.7,3.378 -1.5,4.969 -0.81,1.597 -1.48,2.514 -2.76,3.812 -2.03,2.077 -5.18,4.829 -10.78,9.407 -3.6,2.944 -6.04,5.156 -8.12,7.343 -4.943,5.179 -7.191,9.069 -8.564,14.719 -0.905,3.72 -1.256,7.55 -1.156,13.19 0.025,1.4 0.062,2.73 0.062,2.97 v 0.43 h 21.598 l 0.03,-2.4 c 0.03,-3.27 0.21,-5.37 0.56,-7.41 0.57,-3.27 1.43,-5 3.94,-7.81 1.6,-1.8 3.7,-3.76 6.93,-6.47 4.77,-3.991 8.11,-6.99 11.26,-10.125 4.91,-4.907 7.46,-8.26 9.28,-12.187 1.43,-3.092 2.22,-6.166 2.46,-9.532 0.06,-0.816 0.07,-3.03 0,-3.968 -0.45,-7.043 -3.1,-13.253 -8.15,-19.032 -0.8,-0.909 -2.78,-2.887 -3.72,-3.718 -4.96,-4.394 -10.69,-7.353 -17.56,-9.094 -4.19,-1.062 -8.23,-1.6 -13.35,-1.75 -0.78,-0.023 -1.59,-0.036 -2.37,-0.032 z m -10.908,103.6 v 22 h 21.998 v -22 z'
            }
          }
        )
      ]
    )
    taskIconSvgChildren.push(unknownStatus)

    // the task icon SVG
    // * comments prefixed `let` are instructions for changing style
    // * contain in a 100x100 viewBox so pixels and percent are equal
    // * bind the task status here, respond to styling in the CSS
    const taskIconSvgCssClasses = ['task']
    if (context.props.isHeld) {
      taskIconSvgCssClasses.push('held')
    }
    if (['waiting', 'preparing', 'ready', 'expired', 'submitted', 'running', 'succeeded', 'failed', 'submit-failed'].includes(context.props.status)) {
      taskIconSvgCssClasses.push(context.props.status)
    } else {
      taskIconSvgCssClasses.push('unknown')
    }
    const taskIconSvg = createElement(
      'svg',
      {
        attrs: {
          class: taskIconSvgCssClasses.join(' '),
          viewBox: '0 0 100 100'
        }
      },
      taskIconSvgChildren
    )
    // NOTE: context.data MUST be passed to ensure directives are
    //       passed down to the functional components
    //       https://github.com/vuejs/vue-loader/issues/1433
    const attrs = Object.assign(context.data, {
      attrs: {
        class: 'c-task',
        style: 'display:inline-block; vertical-align:middle'
      }
    })
    return createElement(
      'span',
      attrs,
      [taskIconSvg])
  }
}
</script>
