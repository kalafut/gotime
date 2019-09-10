let Arrive = 540 + 50;

let state = {
    rows: [],
    endLabel: "",
    endTime: "9:00",
};

function renderTime(s) {
    let h = Math.floor(s / 60);
    let m = s % 60;
    let mStr = m.toString();
    if (mStr.length < 2) {
        mStr = '0' + mStr;
    }

    return `${h}:${mStr}`;
}

function EndRow() {
    function handleUpdate(e, row) {
        state.endTime = e.target.value.trim();
    }
    return {
        view: (vnode) => {
            let end = vnode.attrs.endTime;
            let endTime = '';
            if (end >= 0) {
                endTime = renderTime(end);
            }

            return m('div.columns', [
                    m('div.column.col-6',
                        m('input', {
                            oninput: (e)=>{state.endLabel = e.target.value.trim()},
                            value: state.endLabel,
                        })
                    ),
                    m('div.column.col-4',
                        m('input', {oninput: (e)=>{handleUpdate(e)}, value: state.endTime}),
                    ),
                    m('div.span.col-2', endTime),
                ]
            );
        }
    }
}

function TimeRow() {
    return {
        view: (vnode) => {
            return m('div.columns', [
                    m('div.column.col-6',
                        m('input', {value: ""})
                    ),
                    m('div.column.col-4',
                        m('input', {value: ""})
                    ),
                    m('div.span.col-2', renderTime(Arrive)),
                ]
            );
        }
    }
}

function DurationRow() {
    function handleUpdate(e, row) {
        let entry = e.target.value.trim();
        row.duration = entry;
    }

    return {
        view: (vnode) => {
            let row = vnode.attrs.row;

            let timeStr = '';
            if (vnode.attrs.end >= 0) {
                timeStr = renderTime(vnode.attrs.end - vnode.attrs.total);
            }

            return m('div.columns', [
                    m('div.column.col-6',
                        m('input', {
                            oninput: (e)=>{row.label = e.target.value.trim()},
                            value: row.label,
                        })
                    ),
                    m('div.column.col-4',
                        m('input', {
                            oninput: (e)=>{row.duration = e.target.value.trim()},
                            value: row.duration,
                        })
                    ),
                    m('div.span.col-2', timeStr),
                ]
            );
        }
    }
}

function Add() {
    return {
        view: (vnode) => {
            return m('div.columns',
                m('div.column.col-12',
                    m('button.p-centered', {
                            onclick() {
                                state.rows.splice(vnode.attrs.row, 0, {
                                    "label": "",
                                    "duration": "",
                                });
                            }
                    }, '+')
                ),
            );
        }
    }
}

function URL() {
    return {
        view: (vnode) => {
            let url = window.location.pathname + '?' + m.buildQueryString(state);
            return m('div.columns',
                m('div.column.col-12',
                    m('a', {href: url}, 'Link')
                )
            );
        }
    }
}


function Main() {
    return {
        onupdate: () => {
            let s = m.buildQueryString(state);
            console.log(s);
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

            rows.push(m(Add, {row: state.rows.length}));
            rows.push(m(EndRow, {endTime: end}));

            for (let i=state.rows.length-1; i >= 0; i--) {
                let r = state.rows[i];
                let duration = parseInt(r.duration);
                if (end >= 0 && !isNaN(duration)) {
                    total += duration;
                }
                rows.unshift(m(DurationRow, {row: state.rows[i], total: total, end: end}));
                rows.unshift(m(Add, {row: i}));
            }

            rows.unshift(m(URL));
            return rows;
        }
    }
}

var object = m.parseQueryString(window.location.search);
if (object.hasOwnProperty('rows')) {
    state = object;
}


const root = document.getElementById('dest');
m.mount(root, Main);
