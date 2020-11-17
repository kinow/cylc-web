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
  Job - The job status icon implemented as an inline-block level object
        which can sit in text.
-->

<script>
export default {
  name: 'Job',
  functional: true,
  props: {
    status: {
      type: String,
      required: true
    }
  },
  render: function (createElement, context) {
    // the job status icon
    // let width = 100 - x - stroke-width
    // let height = 100 - y - stroke-width
    const jobStatusIcon = createElement('rect', {
      attrs: {
        class: context.props.status,
        x: '10',
        y: '10',
        width: '80',
        height: '80',
        rx: '20',
        ry: '20',
        'stroke-width': '10'
      }
    })
    // the job icon SVG
    // comments prefixed `let` are instructions for changing style
    // contain in a 100x100 viewBox so pixels and percent are equal
    // bind the job status here, respond to styling in the CSS
    const jobIconSvg = createElement('svg', {
      attrs: {
        class: 'job',
        viewBox: '0 0 100 100'
      }
    }, [jobStatusIcon])
    // NOTE: context.data MUST be passed to ensure directives are
    //       passed down to the functional components
    //       https://github.com/vuejs/vue-loader/issues/1433
    const attrs = Object.assign(context.data, {
      attrs: {
        class: 'c-job',
        style: 'display:inline-block; vertical-align:middle'
      }
    })
    return createElement(
      'span',
      attrs,
      [jobIconSvg]
    )
  }
}
</script>
