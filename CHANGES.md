# Selected Cylc UI Changes

Internal changes that do not directly affect users may not be listed here.  For
all changes see the [closed
milestones](https://github.com/cylc/cylc-ui/milestones?state=closed) for each
release.

-------------------------------------------------------------------------------
## __cylc-ui-0.3  (<span actions:bind='release-date'>Released 2021-02-12</span>)__

Release 0.3 of Cylc UI.

### Backward incompatible changes

None or N/A.

### Enhancements

[#577](https://github.com/cylc/cylc-ui/pull/577) - Improve how GScan behaves
in responsive mode (smaller viewports).

[#560](https://github.com/cylc/cylc-ui/pull/560) - Make job-details a node
in the tree, expand/collapse control, align tree-leaf-triangle. Also align
job icons vertically in the middle of the HTML element.

[#504](https://github.com/cylc/cylc-ui/pull/504) - Add mutations to the tree
view to allow interacting with tasks, families and cycles.

[#499](https://github.com/cylc/cylc-ui/pull/499) - Add search and
filter functionalities to GScan.

[#503](https://github.com/cylc/cylc-ui/pull/503) - Add configurable
colour themes for Cylc job icons.

[#498](https://github.com/cylc/cylc-ui/pull/498) - Sort GScan workflows
by type (first running, then held, then stopped), and then by name.

[#493](https://github.com/cylc/cylc-ui/pull/493) - async updates to the
UI, adding support to stopped workflows.

[#497](https://github.com/cylc/cylc-ui/pull/497) - Add a global error
catcher to the Default layout, to show uncaught errors.

[#491](https://github.com/cylc/cylc-ui/pull/491) - Update apollo-client
to @apollo/client (different package ID, also from 2.x to 3.x).

[#492](https://github.com/cylc/cylc-ui/pull/492) - Sort tree view
by cyclepoints and task names.

[#458](https://github.com/cylc/cylc-ui/pull/458) - Add CylcTree and
use deltas for the Tree view and component.

[#481](https://github.com/cylc/cylc-ui/pull/481) - Update dependencies,
most important ones were Vue/React, Apollo GraphQL libraries, GraphQL,
and the development libraries.

[#483](https://github.com/cylc/cylc-ui/pull/458) - Filter tree item
by tasks name and tasks states.

[#505](https://github.com/cylc/cylc-ui/pull/505) - Use cycle point ID
in the tree view structure.

[#522](https://github.com/cylc/cylc-ui/pull/522) - Improve v-select of task state filter in responsive

### Fixes

[#584](https://github.com/cylc/cylc-ui/pull/584) - Avoid NaN task progress, showing correct progress & icon.

[#552](https://github.com/cylc/cylc-ui/pull/552) - Move to next route before adding a new tree widget.

[#554](https://github.com/cylc/cylc-ui/pull/554) - Fix icons in the Dashboard.

### Documentation

None.

### Security issues

None.

-------------------------------------------------------------------------------
## __cylc-ui-0.2 (2020-07-14)__

Release 0.2 of Cylc UI.

### Backward incompatible changes

None or N/A.

### Enhancements

[#266](https://github.com/cylc/cylc-ui/pull/266) - Color cylc logo.

[#257](https://github.com/cylc/cylc-ui/pull/257) - Display toolbar for
workflows only.

[#283](https://github.com/cylc/cylc-ui/pull/283) - Load user information
on application startup.

[#285](https://github.com/cylc/cylc-ui/pull/285) - Update Vuetify to 2.1,
along with other dependencies with updates available.

[#291](https://github.com/cylc/cylc-ui/pull/291) - Add families to Tree
view and component.

[#301](https://github.com/cylc/cylc-ui/pull/301) - Add GScan component.

[#327](https://github.com/cylc/cylc-ui/pull/327) - Use live data for the
dashboard workflows summary.

[#307](https://github.com/cylc/cylc-ui/pull/307) - Invoke mutations to
hold, release, and stop workflows.

[#280](https://github.com/cylc/cylc-ui/pull/280) - Add WebSockets client
for GraphQL subscriptions.

[#325](https://github.com/cylc/cylc-ui/pull/325) - Create Workflow
component with Lumino.

[#355](https://github.com/cylc/cylc-ui/pull/355) - Use wss when page
protocol is http:

[#379](https://github.com/cylc/cylc-ui/pull/379) - Add ConnectionStatus
component.

[#446](https://github.com/cylc/cylc-ui/pull/446) - Allow users to
increase, decrease, and reset UI font size.

[#457](https://github.com/cylc/cylc-ui/pull/457) - Add a GraphiQL
view using graphiql.js that sends queries to the backend graphiql
endpoint.

### Fixes

[#275](https://github.com/cylc/cylc-ui/pull/275) - Fix size of dashboard
links on hover.

[#254](https://github.com/cylc/cylc-ui/pull/254) -  Keep cache in sync,
and use a global event bus.

[#284](https://github.com/cylc/cylc-ui/pull/284) -  Use data from
JupyterHub to create the Hub URL (handling base_url).

[#297](https://github.com/cylc/cylc-ui/pull/297) - Support IE and Safari

[#306](https://github.com/cylc/cylc-ui/pull/306) - Dismissing alerts leave
a blank space in the page

[#341](https://github.com/cylc/cylc-ui/pull/341) - Fix toolbar (responsive
mode and drawer)

[#361](https://github.com/cylc/cylc-ui/pull/361) - Remove the unneeded footer
component

[#370](https://github.com/cylc/cylc-ui/pull/370) - Fix up the old gscan table
view and move access to the dashboard.

[#396](https://github.com/cylc/cylc-ui/pull/396) - Fix leaf and other tree
nodes layout.

[#432](https://github.com/cylc/cylc-ui/pull/432) - Add loading state to
Lumino widgets with skeleton loaders, preventing it from displaying the
data of other workflows for a brief moment.

### Documentation

[#215](https://github.com/cylc/cylc-ui/pull/215) - guide: add beginnings
of a user guide.

### Security issues

None.

-------------------------------------------------------------------------------
## __cylc-ui-0.1 (2019-09-18)__

Initial release of Cylc UI.
