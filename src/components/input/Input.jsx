import React, { forwardRef } from 'react'
import './Input.scss';

const Input = forwardRef(({
    placeholder = '',
    id = '',
    name = '',
    value = '',
    defaultValue = '',
    onChange = () => {},
    onKeyDown = () => {},
    onFocus = () => {},
    onBlur = () => {},
    uncontrolled = false,
    type = 'text',
    onClick = () => {},
    required = false,
    readOnly = false },
    ref) => {
    if (uncontrolled) {
        return (
            <input
                className='capsf-input-field'
                id={id}
                type={type}
                name={name}
                placeholder={placeholder}
                defaultValue={defaultValue ?? ''}
                ref={ref}
                onClick={(e) => { if (onClick) onClick(e) }}
                onKeyDown={(e) => { if (onKeyDown) onKeyDown(e) }}
                onFocus={(e) => { if (onFocus) onFocus(e) }}
                onBlur={(e) => { if (onBlur) onBlur(e) }}
                required={required}
                readOnly={readOnly}
                step='any'
            />
        )
    } else {
        return (
            <input
                className='capsf-input-field'
                id={id}
                type={type}
                placeholder={placeholder}
                name={name}
                value={value}
                required={required}
                onClick={(e) => { if (onClick) onClick(e) }}
                onChange={(e) => { if (onChange) onChange(e) }}
                onKeyDown={(e) => { if (onKeyDown) onKeyDown(e) }}
                onFocus={(e) => { if (onFocus) onFocus(e) }}
                onBlur={(e) => { if (onBlur) onBlur(e) }}
                step='any'
            />
        )
    }
})

export default Input;
