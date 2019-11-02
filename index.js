function defaults() {
    return {
        v: 1,
        rows: [],
        endLabel: "End",
        endTime: "09:00",
    }
};

let state = defaults();

function renderTime(s) {
    let d = 0
    let h = Math.floor(s / 60);
    let m = s % 60;

    // handle wrapping into previous day(s)
    if (h < 0) {
        d = Math.floor(-h / 24) + 1;
        h += d*24;
    }
    m += (m < 0) ? 60 : 0;

    let mStr = m.toString();
    if (mStr.length < 2) {
        mStr = '0' + mStr;
    }
    let str = `${h}:${mStr}`;
    if (d > 0) {
        str += ` (-${d} day${d > 1 ? 's': ''})`;
    }

    return str;
}

function DurationRow() {
    function handleUpdate(e, row) {
        let entry = e.target.value.trim();
        row.duration = entry;
        state.endTime = e.target.value.trim();
    }
    function handleUpdate2(e, row) {
        state.endTime = e.target.value.trim();
    }

    return {
        view: (vnode) => {
            let last = (vnode.attrs.row >= state.rows.length);
            let row = state.rows[vnode.attrs.row];

            let timeStr ='';
            let cols = [];

            if (last) {
                timeStr = state.endTime;
            } else if (vnode.attrs.end >= 0) {
                timeStr = renderTime(vnode.attrs.end - vnode.attrs.total);
            }

            if (!last) {
                cols.push(m('td',
                    m('span.delete', {
                        onclick() {
                            state.rows.splice(vnode.attrs.row, 1);
                        }
                    }, '+'),
                    m('span','  /  '),
                    m('span.delete', {
                        onclick() {
                            state.rows.splice(vnode.attrs.row, 1);
                        }
                    }, '-'),
                ));
            } else {
                cols.push(m('td'));
            }
            //cols.push(
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
            //);

            // Description
            cols.push(
                m('td',
                    m('input', {
                        type: 'text',
                        oninput: (e)=>{
                            let v = e.target.value;
                            if (last) {
                                state.endLabel = v;
                            } else {
                                row.label = v;
                            }
                        },
                        value: last ? state.endLabel : row.label,
                    })
                )
            );

            // Duration
            cols.push(
                last ? m('td') : m('td.duration',
                    m('input', {
                        oninput: (e)=>{row.duration = e.target.value.trim()},
                        value: row.duration,
                        type: 'number',
                    })
                )
            );

            // Time
            console.log(state.endTime);
            if (last) {
                cols.push(m('td.time',
                    m('input.time', {
                        type: 'text',
                        //type: 'time',
                        value: state.endTime,
                        oninput: (e)=>{handleUpdate2(e)},
                        //required: true,
                    }),
                ));
            } else {
                cols.push(m('td.time', m('span.time-text',timeStr)));
            }
            return m('tr', cols);
        }
    }
}

function URL() {
    return {
        view: (vnode) => {
            let url = window.location.pathname + '?' + m.buildQueryString(state);
            return m('a', {href: url}, 'Link');
        }
    }
}

function AddRow() {
    return {
        view: (vnode) => {
            //return m('tr',m('td.add-row', {colspan: 5}, 'Add / Del'));
            return m('tr',m('td.add-row', {colspan: 5}, '+ / -'));
        }
    }
}


function Main() {
    return {
        onupdate: () => {
            let s = m.buildQueryString(state);
        },

        view: () => {
            let rows = [];
            let total = -1;
            let end = -1;

            let parts = state.endTime.split(':');
            if (parts.length === 2) {
                let h = parseInt(parts[0]);
                let m = parseInt(parts[1]);

                if (!isNaN(h) && !isNaN(m) && (h >= 0 && h <=23) && (m >=0 && m <=59)) {
                    end = 60*h + m;
                }
                total = 0;
            }

            rows.push(m(DurationRow, {row: state.rows.length}));

            for (let i=state.rows.length-1; i >= 0; i--) {
                let r = state.rows[i];
                let duration = parseInt(r.duration);
                if (end >= 0 && !isNaN(duration)) {
                    total += duration;
                }
                rows.unshift(m(DurationRow, {row: i, total: total, end: end}));
                rows.unshift(m(AddRow));
            }

            const table = m('table.table', [
                m('thead',
                    m('tr', [
                        m('th'),
                        m('th.description', 'Description'),
                        m('th.duration', 'Duration'),
                        m('th', 'Time'),
                    ])
                ),
                m('tbody', rows)
            ]);
            return m('div', [
                table,
                m(URL),
                m('button', {
                    onclick() {
                        state = defaults();
                    }
                }, 'Clear'),
            ]);
        }
    }
}

var object = m.parseQueryString(window.location.search);
if (object.hasOwnProperty('rows')) {
    state = object;
}


const root = document.getElementById('dest');
m.mount(root, Main);
