/* global m */

let _rowid = 0;

function nextId() {
  _rowid += 1;
  return _rowid;
}

function newRow(label, duration) {
  return {
    label: label || '',
    duration: duration || '',
    id: nextId(),
  };
}

function defaults() {
  return {
    sv: 1,
    rows: [
      newRow('Start'),
      newRow(''),
      newRow('End'),
    ],
    endTime: '13:00',
    noFocus: false,
  };
}

function demo() {
  return {
    sv: 1,
    rows: [
      newRow('Wake up'),
      newRow('Shower', 10),
      newRow('Eat', 10),
      newRow('Drive to airport', 50),
      newRow('Board', 30),
      newRow('Depart'),
    ],
    endTime: '13:00',
    noFocus: false,
  };
}

let state = demo();

function renderTime(s) {
  let d = 0;
  let h = Math.floor(s / 60);
  let m = s % 60;

  // handle wrapping into previous day(s)
  if (h < 0) {
    d = Math.floor(-h / 24) + 1;
    h += d * 24;
  }
  m += (m < 0) ? 60 : 0;

  let mStr = m.toString();
  if (mStr.length < 2) {
    mStr = `0${mStr}`;
  }
  let str = `${h}:${mStr}`;
  if (d > 0) {
    str += `<br>(-${d}d)`;
  }

  return str;
}

function DurationRow() {
  return {
    view: (vnode) => {
      const first = vnode.attrs.row === 0;
      const last = (vnode.attrs.row >= state.rows.length - 1);
      const row = state.rows[vnode.attrs.row];

      let timeStr = '';
      const cols = [];

      // Prepare time string
      if (last) {
        timeStr = state.endTime;
      } else if (vnode.attrs.end >= 0) {
        timeStr = renderTime(vnode.attrs.end - vnode.attrs.total);
      }

      // Delete
      cols.push(
        m('td', (first || last) ? null : m('i.icon-trash-empty.delete', {
          onclick: () => { state.rows.splice(vnode.attrs.row, 1); },
          title: 'Delete row',
        })),
      );

      cols.push(
        m('td.description',
          m('input', {
            type: 'text',
            oncreate: (v) => {
              if (!vnode.attrs.noFocus) {
                v.dom.focus();
              }
            },
            onkeydown: (e) => {
              if (!last && e.code === 'Enter') {
                state.rows.splice(vnode.attrs.row + 1, 0, newRow());
              }
            },
            oninput: (e) => {
              row.label = e.target.value;
            },
            value: row.label,
          })),
      );

      // Duration
      let input = !(first || last) ? 'input.duration' : 'input.hidden';
      cols.push(
        m('td.duration',
          m(input, {

            // special handling for Enter
            onkeydown: (e) => {
              if (e.code === 'Enter') {
                state.rows.splice(vnode.attrs.row + 1, 0, newRow());
              }
            },

            oninput: (e) => {
              let v = e.target.value.trim();
              duration = parseInt(v, 10);
              if (Number.isNaN(duration) || duration < 0) {
                duration = '';
              }
              row.duration = duration;
            },
            value: row.duration,
            type: 'number',
            min: 0,
          })
      ));

      // Time
      if (last) {
        cols.push(m('td.time',
          m('input.time', {
            type: 'text',
            value: state.endTime,
            oninput: (e) => { state.endTime = e.target.value.trim(); },
          })));
      } else {
        cols.push(m('td.time',
          m('span', { class: (first || last) ? 'start-time-text' : 'time-text' }, m.trust(timeStr))));
      }
      return m('tr', cols);
    },
  };
}

function marshalState() {
  const clone = Object.assign({}, state);
  clone.rows = [];
  for (const row of state.rows) {
    const rClone = Object.assign({}, row);
    delete rClone.id;
    clone.rows.push(rClone);
  }

  const url = `${window.location.pathname}?${m.buildQueryString(clone)}`;
  return url;
}

function URL() {
  return {
    view: () => {
      const clone = Object.assign({}, state);
      clone.rows = [];
      for (const row of state.rows) {
        const rClone = Object.assign({}, row);
        delete rClone.id;
        clone.rows.push(rClone);
      }

      const url = `${window.location.pathname}?${m.buildQueryString(clone)}`;
      return m('a.table-link', { href: url }, 'Permalink');
    },
  };
}


function Main() {
  state.noFocus = true;

  return {
    view: () => {
      const rows = [];
      let total = -1;
      let end = -1;

      const parts = state.endTime.split(':');
      if (parts.length === 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);

        if (!Number.isNaN(h) && !Number.isNaN(m) && (h >= 0 && h <= 23) && (m >= 0 && m <= 59)) {
          end = 60 * h + m;
        }
        total = 0;
      }

      // Populate the rows in reverse
      for (let i = state.rows.length - 1; i >= 0; i -= 1) {
        const row = state.rows[i];
        const duration = parseInt(row.duration, 10);

        rows.unshift(m(DurationRow, {
          key: row.id, row: i, total, end, noFocus: state.noFocus,
        }));

        if (end >= 0 && !Number.isNaN(duration)) {
          total += duration;
        }
      }

      const table = m('table', [
        m('thead',
          m('tr', [
            m('th',
              m('i.icon-trash-empty.delete.hidden')
            ),
            m('th.description', 'Step'),
            m('th.duration', 'Duration'),
            m('th.time', 'Time'),
          ])),
        m('tbody', rows),
      ]);

      state.noFocus = false;

      return m('div',[
        m('div', table),
        m('div', { style: 'text-align: center; margin-top: 2em;' }, [
          m('a.table-link', {
            onclick: () => {
              state = defaults();
              state.noFocus = true;
            }
          }, "Reset"),
          m(URL),
        ]),
      ]);
    },
  };
}

// handle permalink URLs
const object = m.parseQueryString(window.location.search);
if (Object.prototype.hasOwnProperty.call(object, 'rows')) {
  for (const row of object.rows) {
    row.id = nextId();
  }
  object.rows[0].duration = 0;
  object.rows[object.rows.length - 1].duration = 0;
  state = object;
}


const root = document.getElementById('dest');
m.mount(root, Main);
