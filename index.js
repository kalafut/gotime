/* global m */

function defaults() {
  return {
    v: 1,
    rows: [],
    startLabel: 'Start',
    endLabel: 'End',
    endTime: '09:00',
  };
}

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
    str += ` (-${d} day${d > 1 ? 's' : ''})`;
  }

  return str;
}

function DurationRow() {
  // function handleUpdate(e, row) {
  //   const entry = e.target.value.trim();
  //   row.duration = entry;
  //   state.endTime = e.target.value.trim();
  // }

  function handleUpdate2(e) {
    state.endTime = e.target.value.trim();
  }

  return {
    view: (vnode) => {
      const first = (vnode.attrs.row < 0);
      const last = (vnode.attrs.row >= state.rows.length);
      const row = state.rows[vnode.attrs.row];

      let timeStr = '';
      const cols = [];

      // Prepare time string
      if (last) {
        timeStr = state.endTime;
      } else if (vnode.attrs.end >= 0) {
        timeStr = renderTime(vnode.attrs.end - vnode.attrs.total);
      }

      // if (!last) {
      //    cols.push(m('td',
      //        m('span.delete', {
      //            onclick() {
      //                state.rows.splice(vnode.attrs.row, 1);
      //            }
      //        }, '+'),
      //        m('span','  /  '),
      //        m('span.delete', {
      //            onclick() {
      //                state.rows.splice(vnode.attrs.row, 1);
      //            }
      //        }, '-'),
      //    ));
      // } else {
      //    cols.push(m('td'));
      // }

      // cols.push(
      //    m('td',
      //        m('span', {
      //            onclick() {
      //                state.rows.splice(vnode.attrs.row, 0, {
      //                    "label": "",
      //                    "duration": "",
      //                });
      //            }
      //        }, 'Ins'),
      //    ),
      // );

      // Description
      let label2 = '';
      if (row !== undefined) {
        label2 = row.label;
      }
      if (first) {
        label2 = state.startLabel;
      } else if (last) {
        label2 = state.endLabel;
      }

      cols.push(
        m('td',
          m('input', {
            type: 'text',
            oninput: (e) => {
              const v = e.target.value;
              if (last) {
                state.endLabel = v;
              } else if (first) {
                state.startLabel = v;
              } else {
                row.label = v;
              }
            },
            value: label2,
          })),
      );

      // Duration
      cols.push(
        (first || last) ? m('td') : m('td.duration',
          m('input', {
            oninput: (e) => { row.duration = e.target.value.trim(); },
            value: row.duration,
            type: 'text',
          })),
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
        cols.push(m('td.time', m('span.time-text', timeStr)));
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

function AddRow() {
  return {
    view: (vnode) => {
      const add = m('span.edit', {
        onclick: () => {
          state.rows.splice(vnode.attrs.row, 0, {
            label: '',
            duration: '',
          });
        },
      }, '+');

      const del = m('span.edit', {
        onclick: () => {
          state.rows.splice(vnode.attrs.row, 1);
        },
      }, '-');
      // return m('tr',m('td.add-row', {colspan: 5}, 'Add / Del'));
      return m('tr',
        m('td.add-row', { colspan: 5 }, [
          add,
          m('span', '/'),
          del,
        ]));
      //            onclick() {
      //                state.rows.splice(vnode.attrs.row, 0, {
      //                    "label": "",
      //                    "duration": "",
      //                });
      //            }
    },
  };
}


function Main() {
  return {
    // onupdate: () => {
    //   const s = m.buildQueryString(state);
    // },

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

      // TODO: can I avoid this special case?
      rows.unshift(m(AddRow, { row: state.rows.length }));
      rows.push(m(DurationRow, { row: state.rows.length }));

      for (let i = state.rows.length - 1; i >= 0; i -= 1) {
        const r = state.rows[i];
        const duration = parseInt(r.duration, 10);
        if (end >= 0 && !Number.isNaN(duration)) {
          total += duration;
        }
        rows.unshift(m(DurationRow, { row: i, total, end }));
        rows.unshift(m(AddRow, { row: i }));
      }
      rows.unshift(m(DurationRow, { row: -1, total, end }));

      const table = m('table.table', [
        m('thead',
          m('tr', [
            m('th.description', 'Description'),
            m('th.duration', 'Duration'),
            m('th', 'Time'),
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
  state = object;
}


const root = document.getElementById('dest');
m.mount(root, Main);
