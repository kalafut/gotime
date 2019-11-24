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

function cleared() {
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
      newRow('Shower etc.', 20),
      newRow('Eat', 10),
      newRow('Drive to airport', 50),
      newRow('Board', 30),
      newRow('Depart'),
    ],
    endTime: '8:00',
    noFocus: false,
  };
}

let state = demo();

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('c') !== null) {
  state = cleared();
}


function renderTime(seconds) {
  let d = 0;
  let s = seconds;

  // normalize s into a positive range if necessary
  if (s < 0) {
    d = 1 + Math.floor(-(s + 1) / 1440);
    s += d * 1440;
  }

  const h = Math.floor(s / 60);
  const m = s % 60;

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
        m('td', (first || last) ? null : m('img.trash', {
          src: 'trash.svg',
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
            onkeyup: (e) => {
              if (!last && e.keyCode === 13) {
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
      const input = !(first || last) ? 'input.duration' : 'input.hidden';
      cols.push(
        m('td.duration',
          m(input, {

            // special handling for Enter
            onkeyup: (e) => {
              if (!last && e.keyCode === 13) {
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
            type: 'text',
            inputmode: 'numeric',
          }),
      ));

      // Time
      if (last) {
        cols.push(m('td.time.last-time',
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

function URL() {
  return {
    view: () => {
      const out = {
        sv: state.sv,
        rowData: [],
        endTime: state.endTime,
      };

      for (const row of state.rows) {
        out.rowData.push(row.label);
        out.rowData.push(row.duration);
      }
      const encodedState = { state: btoa(JSON.stringify(out)) };

      const url = `${window.location.pathname}?${m.buildQueryString(encodedState)}`;
      return m('a.table-link', { href: url }, 'Permalink');
    },
  };
}

function unmarshalURL() {
  const object = m.parseQueryString(window.location.search);
  if (object.state !== undefined) {
    let o;
    try {
      o = JSON.parse(atob(object.state));
    } catch (e) {
      console.error(e);
      return;
    }

    o.rows = [];
    for (let i = 0; i < o.rowData.length; i += 2) {
      o.rows.push(newRow(o.rowData[i], o.rowData[i + 1]));
    }
    delete o.rowData;

    state = o;
  }
}

function LinkRow() {
  return {
    view: () => {
      return m('div.link-row', [
        m('div.left.bottom-link', m('a[href=/?c=1]','Clear')),
        m('div.right.bottom-link', m(URL)),
      ]);
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
              m('img.trash.hidden', { src: 'trash.svg' })),
            m('th.description', 'Step'),
            m('th.duration', 'Duration'),
            m('th.time', 'Time'),
          ])),
        m('tbody', rows),
      ]);

      state.noFocus = false;

      return m('div', [
        m('div', table),
        m(LinkRow),
      ]);
    },
  };
}

// Load saved state, if present
unmarshalURL();

const root = document.getElementById('dest');
m.mount(root, Main);
