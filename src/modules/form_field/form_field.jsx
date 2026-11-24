'use client';

import React, { forwardRef } from 'react'
import './form_field.scss'
import Input from '../../components/input/Input.jsx';

const Form_field = forwardRef(({ label = '', placeholder = '', htmlFor = '', name = '', required = false, defaultValue = '', type = 'text' }, ref) => {

    return (
        <div className="capsf-form-field">
            <label className="capsf-form-field-label" htmlFor={htmlFor}>{label}</label>
            <Input id={htmlFor} placeholder={placeholder} uncontrolled={true} ref={ref} name={name} required={required} defaultValue={defaultValue} type={type} />
        </div>
    );
});

export default Form_field;
