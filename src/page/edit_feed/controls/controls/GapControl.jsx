/**
 * GapControl - used for column-gap and row-gap
 *
 * Props:
 *   value      {object} { value: 16, unit: 'px' }
 *   onChange   {fn}
 *   max        {number} default 100
 */

import React from 'react'

const UNITS = ['px', 'em', 'rem', '%']

const GapControl = ({ value = { value: 16, unit: 'px' }, onChange, max = 100 }) => {
    const val  = typeof value === 'object' ? value : { value: Number(value) || 0, unit: 'px' }

    const setVal  = (v) => onChange({ ...val, value: v })
    const setUnit = (u) => onChange({ ...val, unit: u })

    return (
        <div className='capsf-gap-control'>
            <input
                type='range'
                className='capsf-gap-slider'
                min={0}
                max={max}
                value={val.value}
                onChange={e => setVal(Number(e.target.value))}
            />
            <input
                type='number'
                className='capsf-gap-number'
                min={0}
                max={max}
                value={val.value}
                onChange={e => setVal(Number(e.target.value))}
            />
            <select className='capsf-gap-unit' value={val.unit} onChange={e => setUnit(e.target.value)}>
                { UNITS.map(u => <option key={u} value={u}>{u}</option>) }
            </select>
        </div>
    )
}

export default GapControl
