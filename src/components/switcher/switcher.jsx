import { forwardRef } from 'react'
import './switcher.scss'

const Switcher = forwardRef(({ checked, onChange, uncontrolled = false, htmlFor = '' }, ref) => {

  if (uncontrolled) {

    return (
      <label className='capsf-switcher' htmlFor={htmlFor}>
        <input type='checkbox' className='capsf-switcher-input' id={htmlFor} ref={ref} />
        <span className='capsf-switcher-slider'></span>
      </label>
    )
  }

  return (
    <label className='capsf-switcher'>
      <input type='checkbox' className='capsf-switcher-input'
        checked={checked}
        onChange={onChange}
      />
      <span className='capsf-switcher-slider'></span>
    </label>
  )
})

export default Switcher;
