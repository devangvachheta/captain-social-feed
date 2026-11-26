import React from 'react';
import { __ } from '@wordpress/i18n';
import './help.scss';

const Help = () => {
    const faqs = [
        {
            question: __('How do I create a feed?', 'captain-social-feed'),
            answer: __('Go to "Create Feed" from the sidebar, choose a platform (Instagram, Facebook, Twitter/X, Threads, or Pinterest), enter that platform\'s Access Token and account/page/board ID, configure the display settings and click Save.', 'captain-social-feed'),
        },
        {
            question: __('Where do I get my Access Token and account ID?', 'captain-social-feed'),
            answer: __('Each platform has its own setup guide linked right from the Connect step - see the Documentation page for step-by-step instructions for Instagram, Facebook, Twitter/X, Threads, and Pinterest.', 'captain-social-feed'),
        },
        {
            question: __('How do I use the shortcode?', 'captain-social-feed'),
            answer: __('Copy the shortcode from the Dashboard listing (e.g. [captain-social-feed id="1"]) and paste it into any page, post, or Feed area on your site.', 'captain-social-feed'),
        },
        {
            question: __('Why is my feed showing as INACTIVE?', 'captain-social-feed'),
            answer: __('An INACTIVE status means the feed has been disabled. Go to the edit screen for that feed and toggle the status to Active to start displaying it on your site.', 'captain-social-feed'),
        },
    ];

    return (
        <div className='capsf-help-wrapper'>
            <div className='capsf-help-header'>
                <h1 className='capsf-help-title'>{__('Help & Support', 'captain-social-feed')}</h1>
                <p className='capsf-help-subtitle'>{__('Find answers to common questions and get started quickly.', 'captain-social-feed')}</p>
            </div>

            <div className='capsf-help-cards'>
                <div className='capsf-help-card'>
                    <div className='capsf-help-card-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    </div>
                    <h3>{__('Documentation', 'captain-social-feed')}</h3>
                    <p>{__('Read our full plugin documentation to learn all available features.', 'captain-social-feed')}</p>
                    <a href="https://wordpress.org/plugins/captain-social-feed/" target="_blank" rel="noopener noreferrer" className='capsf-help-link'>{__('View Docs →', 'captain-social-feed')}</a>
                </div>

                <div className='capsf-help-card'>
                    <div className='capsf-help-card-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <h3>{__('Support', 'captain-social-feed')}</h3>
                    <p>{__('Open a support ticket and our team will get back to you quickly.', 'captain-social-feed')}</p>
                    <a href="https://wordpress.org/support/plugin/captain-social-feed/" target="_blank" rel="noopener noreferrer" className='capsf-help-link'>{__('Get Support →', 'captain-social-feed')}</a>
                </div>

                <div className='capsf-help-card'>
                    <div className='capsf-help-card-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </div>
                    <h3>{__('Rate Us', 'captain-social-feed')}</h3>
                    <p>{__('Enjoying the plugin? Leave us a 5-star review on WordPress.org!', 'captain-social-feed')}</p>
                    <a href="https://wordpress.org/support/plugin/captain-social-feed/reviews/" target="_blank" rel="noopener noreferrer" className='capsf-help-link'>{__('Rate Plugin →', 'captain-social-feed')}</a>
                </div>
            </div>

            <div className='capsf-help-faq'>
                <h2 className='capsf-help-faq-title'>{__('Frequently Asked Questions', 'captain-social-feed')}</h2>
                <div className='capsf-help-faq-list'>
                    {faqs.map((faq, index) => (
                        <div className='capsf-help-faq-item' key={index}>
                            <h4 className='capsf-help-faq-q'>{faq.question}</h4>
                            <p className='capsf-help-faq-a'>{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Help;
