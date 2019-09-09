import m from 'mithril';

let Arrive = 540 + 50;

let Rows = [
    {
        "label": "description",
        "duration": "5",
    },
    {
        "label": "description",
        "duration": "10",
    },
];

function renderTime(s) {
    let h = Math.floor(s / 60);
    let m = s % 60;

    return `${h}:${m}`;
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

            let duration = parseInt(row.duration);

            return m('div.columns', [
                    m('div.column.col-6',
                        m('input', {value: row.label})
                    ),
                    m('div.column.col-4',
                        m('input', {oninput: (e)=>{handleUpdate(e, row)}, value: row.duration}),
                    ),
                    m('div.span.col-2', renderTime(Arrive - vnode.attrs.total)),
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
                                Rows.splice(vnode.attrs.row, 0, {
                                    "label": "description",
                                    "duration": "duration",
                                });
                            }
                    }, '+')
                ),
            );
        }
    }
}

function Main() {
    return {
        view: () => {
            let rows = [];
            let total = 0;

            rows.push(m(TimeRow));

            for (let i=0; i < Rows.length; i++) {
                let r = Rows[i];
                total += parseInt(r.duration);
                rows.push(m(DurationRow, {row: Rows[i], total: total}));
                rows.push(m(Add, {row: i}));
            }

            return rows
        }
    }
}
const root = document.getElementById('dest');
m.mount(root, Main);