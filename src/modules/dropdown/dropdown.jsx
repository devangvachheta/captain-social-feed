import React, { useState, useRef } from 'react';
import './dropdown.scss';

const Dropdown = ({ title = '', content, className = '' }) => {
    const [contentWidth, setContentWidth] = useState(0);
    const [contentPosition, setContentPosition] = useState({ top: 0 });

    const headerRef = useRef(null);
    const contentRef = useRef(null);

    const getContentStyle = () => {

        if (!headerRef.current || !contentRef.current) return;

        setContentWidth(headerRef.current.getBoundingClientRect().width);

        const headerRect = headerRef.current.getBoundingClientRect();
        const topPosition = headerRect.top + headerRect.height + 5;
        const contentHeight = contentRef.current.getBoundingClientRect().height;
        const windowHeight = window.innerHeight - 5;
        const bottomPosition = topPosition + contentHeight;
        var newPosition = { ...contentPosition };

        if (bottomPosition > windowHeight) {
            newPosition.top = headerRect.top - contentHeight - 10;
        } else {
            newPosition.top = topPosition;
        }

        setContentPosition(newPosition);

        const handleResize = () => {
            getContentStyle();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    };

    const toggleDropdown = (e) => {
        const dropdownContainer = e.target.closest('.capsf-dropdown-container');

        if (!dropdownContainer) return;

        dropdownContainer.classList.toggle('capsf-dropdown-content-show');

        getContentStyle();
    };

    const handleHeaderKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown(e);
        }
    };

    return (
        <div className={`capsf-dropdown-container ${className}`} ref={headerRef} onClick={toggleDropdown}>
            <div
                className='capsf-dropdown-header'
                role="button"
                tabIndex={0}
                aria-haspopup="true"
                onKeyDown={handleHeaderKeyDown}
            >
                {title}
                <span className='capsf-dropdown-header-icon'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style={{ height: '16px', width: '16px' }}>
                        <path d="M297.4 470.6C309.9 483.1 330.2 483.1 342.7 470.6L534.7 278.6C547.2 266.1 547.2 245.8 534.7 233.3C522.2 220.8 501.9 220.8 489.4 233.3L320 402.7L150.6 233.4C138.1 220.9 117.8 220.9 105.3 233.4C92.8 245.9 92.8 266.2 105.3 278.7L297.3 470.7z" />
                    </svg>                </span>
            </div>
            <div
                className='capsf-dropdown-content'
                ref={contentRef}
                style={{ width: contentWidth, top: contentPosition.top }}
            >
                {content}
            </div>
        </div>
    );
};

export default Dropdown;
