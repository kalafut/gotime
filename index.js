/* global m */

function defaults() {
  return {
    v: 1,
    rows: [
      {label:'Start', duration: 0, id:nextId()},
      {label:'End', duration: 0, id:nextId()},
      ],
    startLabel: 'Start',
    endLabel: 'End',
    endTime: '9:00',
  };
}

const nextId = (() => {
  let id = 1;
  return () => id += 1;
  }
)();

let state = defaults();

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

function newRow(label, duration) {
  return {
    label: '',
    duration: '',
    id: nextId(),
  };
}

function DurationRow() {
  function handleUpdate2(e) {
    state.endTime = e.target.value.trim();
  }

  return {
    view: (vnode) => {
      const last = (vnode.attrs.row >= state.rows.length - 1);
      const firstOrLast = vnode.attrs.row === 0 || last;
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
        m('td', firstOrLast ? null : m('i.icon-trash-empty.delete', {
          onclick: () => { state.rows.splice(vnode.attrs.row, 1) },
          title: 'Delete row',
        }))
      );

      // Step description
      cols.push(
        m('td',
          m('input', {
            type: 'text',
            oncreate: (v) => {
              if (!vnode.attrs.noFocus) {
                v.dom.focus();
              }
            },
            onkeydown: (e) => {
              if (!last && e.code === "Enter") {
                state.rows.splice(vnode.attrs.row + 1, 0, newRow());
                return;
              }
            },
            oninput: (e) => {
              row.label = e.target.value;
            },
            value: row.label,
          })),
      );

      // Duration
      cols.push(
        m('td.duration',
          !firstOrLast ? m('input', {
            onkeydown: (e) => {
              if (e.code === "Enter") {
                state.rows.splice(vnode.attrs.row + 1, 0, newRow());
                return;
              }
            },
            oninput: (e) => { row.duration = e.target.value.trim(); },
            value: row.duration,
            type: 'number',
          }) : null)
      );

      // Time
      if (last) {
        cols.push(m('td.time',
          m('input.time', {
            type: 'text',
            value: state.endTime,
            oninput: (e) => { handleUpdate2(e); },
          })));
      } else {
        cols.push(m('td.time',
          m('span', { class: firstOrLast ? 'start-time-text': 'time-text' }, m.trust(timeStr)))
        );
      }
      return m('tr', cols);
    },
  };
}

function URL() {
  return {
    view: () => {
      const url = `${window.location.pathname}?${m.buildQueryString(state)}`;
      return m('a', { href: url }, 'Link');
    },
  };
}


function Main() {
  let noFocus = true;

  return {
    oncreate: () => {
      noFocus = false;
    },

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

        rows.unshift(m(DurationRow, { key: row.id, row: i, total, end, noFocus }));

        if (end >= 0 && !Number.isNaN(duration)) {
          total += duration;
        }
      }

      const table = m('table.table', [
        m('thead',
          m('tr', [
            m('th'),
            m('th.description', 'Step'),
            m('th.duration', 'Length'),
            m('th.time', 'Time'),
          ])),
        m('tbody', rows),
      ]);
      return m('div', [
        table,
        m(URL),
        m('button', {
          onclick() {
            state = defaults();
          },
        }, 'Clear'),
      ]);
    },
  };
}

const object = m.parseQueryString(window.location.search);
if (Object.prototype.hasOwnProperty.call(object, 'rows')) {
  for (const row of object.rows) {
    row.id = nextId();
  }
  state = object;
}


const root = document.getElementById('dest');
m.mount(root, Main);
