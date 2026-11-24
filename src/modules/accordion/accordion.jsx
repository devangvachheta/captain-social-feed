import React, { useEffect, useState } from 'react'
import './accordion.scss'

const Accordion = ({ header, content, open = false, delay = 500, onClick }) => {

    const [accordion_open, setAccordionOpen] = useState(open);

    const toggle_accordion = (e) => {

        if (onClick) {
            onClick();
        }

        let accordion_content = e.target.closest('.capsf-accordion-container');

        if (accordion_content.classList.contains('capsf-accordion-content-show')) {
            accordion_content.classList.remove('capsf-accordion-content-show');
            setTimeout(() => {
                setAccordionOpen(false);
            }, delay);
        } else {
            setAccordionOpen(true);
            setTimeout(() => {
                accordion_content.classList.add('capsf-accordion-content-show');
            }, 50);
        }
    }

    const handleHeaderKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle_accordion(e);
        }
    };

    return (
        <div className={`capsf-accordion-container ${open ? 'capsf-accordion-content-show' : ''}`}>
            <div
                className='capsf-accordion-header'
                role="button"
                tabIndex={0}
                aria-expanded={accordion_open}
                onClick={(e) => { toggle_accordion(e) }}
                onKeyDown={handleHeaderKeyDown}
            >
                {header}
                <span className='capsf-accordion-header-icon' style={{ transition: `all ${delay}ms linear` }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style={{ height: '20px', width: '20px' }}>
                        <path d="M297.4 470.6C309.9 483.1 330.2 483.1 342.7 470.6L534.7 278.6C547.2 266.1 547.2 245.8 534.7 233.3C522.2 220.8 501.9 220.8 489.4 233.3L320 402.7L150.6 233.4C138.1 220.9 117.8 220.9 105.3 233.4C92.8 245.9 92.8 266.2 105.3 278.7L297.3 470.7z" />
                    </svg>
                </span>
            </div>
            <div className='capsf-accordion-content' style={{ display: accordion_open ? 'block' : 'none' }}>
                {content}
            </div>
        </div>
    )
}

export default Accordion;
