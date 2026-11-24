import React from 'react'
import './secondary_button.scss';
import Loader from '../../loader/loader.jsx';
import { Link } from 'react-router-dom';

const Secondary_button = ({ text = '', loader = false, onClick, disabled = false, type = 'button', link = '', target = '_self', rel = 'noopener noreferrer', icon = null }) => {

    const content = (
        <>
            {icon && <span className="capsf-secondary-btn-icon">{icon}</span>}
            {text}
            {loader && <Loader />}
        </>
    );

    if (type === 'link') {
        return (
            <Link to={link} className='capsf-secondary-button' target={target} rel={rel}>
                {content}
            </Link>
        )
    }

    return (
        <button className='capsf-secondary-button' onClick={() => { if (onClick) onClick() }} disabled={disabled || loader}>
            {content}
        </button>
    );
};

export default Secondary_button;
