import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import './create_page.scss';
import Form_field from '../../modules/form_field/form_field.jsx';

const Create_page = () => {

    const [selected_platform, setSelectedPlatform] = useState('instagram');
    const [active_step, setActiveStep] = useState(1);
    const [form_error, setFormError] = useState('');
    const [creating, setCreating] = useState(false);

    const navigate = useNavigate();

    const fieldOneRef = useRef(null);
    const fieldTwoRef = useRef(null);

    const PLATFORM_LOGO_URL = ( typeof capsf_data !== 'undefined' ? capsf_data.plugin_url : '' ) + 'assets/svg/social/'

    const content_array = [
        {
            icon: <img src={ PLATFORM_LOGO_URL + 'instagram.svg' } alt="Instagram" width="22" height="22" />,
            title: __('Instagram', 'captain-social-feed'),
            description: __('Display your latest posts, reels, and photos from an Instagram Business or Creator account.', 'captain-social-feed'),
            value: 'instagram',
        },
        {
            icon: <img src={ PLATFORM_LOGO_URL + 'facebook.svg' } alt="Facebook" width="22" height="22" />,
            title: __('Facebook', 'captain-social-feed'),
            description: __('Display recent posts from a Facebook Page - photos, updates, and links.', 'captain-social-feed'),
            value: 'facebook',
        },
        {
            icon: <img src={ PLATFORM_LOGO_URL + 'twitter.svg' } alt="Twitter / X" width="22" height="22" />,
            title: __('Twitter / X', 'captain-social-feed'),
            description: __('Display recent posts from any public Twitter (X) account by @username.', 'captain-social-feed'),
            value: 'twitter',
        },
        {
            icon: <img src={ PLATFORM_LOGO_URL + 'threads.svg' } alt="Threads" width="22" height="22" />,
            title: __('Threads', 'captain-social-feed'),
            description: __('Display recent threads/posts from a Threads account.', 'captain-social-feed'),
            value: 'threads',
        },
        {
            icon: <img src={ PLATFORM_LOGO_URL + 'pinterest.svg' } alt="Pinterest" width="22" height="22" />,
            title: __('Pinterest', 'captain-social-feed'),
            description: __('Display pins from any public Pinterest board.', 'captain-social-feed'),
            value: 'pinterest',
        },
    ]

    const PLATFORM_FIELDS = {
        instagram: {
            label: __('Connect Instagram', 'captain-social-feed'),
            desc: __('Connect your Instagram Business or Creator account', 'captain-social-feed'),
            one: { key: 'access_token', label: __('ACCESS TOKEN', 'captain-social-feed'), placeholder: __('Enter your long-lived Access Token', 'captain-social-feed') },
            two: { key: 'account_id', label: __('INSTAGRAM BUSINESS ACCOUNT ID', 'captain-social-feed'), placeholder: __('e.g. 17841400000000000', 'captain-social-feed') },
            doc: 'instagram-access-token',
            help: __('How to get an Instagram Access Token?', 'captain-social-feed'),
        },
        facebook: {
            label: __('Connect Facebook', 'captain-social-feed'),
            desc: __('Connect your Facebook Page', 'captain-social-feed'),
            one: { key: 'access_token', label: __('PAGE ACCESS TOKEN', 'captain-social-feed'), placeholder: __('Enter your Page Access Token', 'captain-social-feed') },
            two: { key: 'page_id', label: __('FACEBOOK PAGE ID', 'captain-social-feed'), placeholder: __('e.g. 100000000000000', 'captain-social-feed') },
            doc: 'facebook-access-token',
            help: __('How to get a Facebook Page Access Token?', 'captain-social-feed'),
        },
        twitter: {
            label: __('Connect Twitter / X', 'captain-social-feed'),
            desc: __('Connect a public Twitter (X) account', 'captain-social-feed'),
            one: { key: 'bearer_token', label: __('BEARER TOKEN', 'captain-social-feed'), placeholder: __('Enter your API v2 Bearer Token', 'captain-social-feed') },
            two: { key: 'username', label: __('@USERNAME', 'captain-social-feed'), placeholder: __('e.g. wordpress', 'captain-social-feed') },
            doc: 'twitter-bearer-token',
            help: __('How to get a Twitter/X Bearer Token?', 'captain-social-feed'),
        },
        threads: {
            label: __('Connect Threads', 'captain-social-feed'),
            desc: __('Connect your Threads account', 'captain-social-feed'),
            one: { key: 'access_token', label: __('ACCESS TOKEN', 'captain-social-feed'), placeholder: __('Enter your long-lived Access Token', 'captain-social-feed') },
            two: { key: 'account_id', label: __('THREADS USER ID', 'captain-social-feed'), placeholder: __('e.g. 17841400000000000', 'captain-social-feed') },
            doc: 'threads-access-token',
            help: __('How to get a Threads Access Token?', 'captain-social-feed'),
        },
        pinterest: {
            label: __('Connect Pinterest', 'captain-social-feed'),
            desc: __('Connect a Pinterest board', 'captain-social-feed'),
            one: { key: 'access_token', label: __('ACCESS TOKEN', 'captain-social-feed'), placeholder: __('Enter your Access Token', 'captain-social-feed') },
            two: { key: 'board_id', label: __('BOARD ID', 'captain-social-feed'), placeholder: __('e.g. 549755885175', 'captain-social-feed') },
            doc: 'pinterest-access-token',
            help: __('How to get a Pinterest Access Token?', 'captain-social-feed'),
        },
    };

    const footerRef = useRef(null);
    useEffect(() => {
        const positionFooter = () => {
            const footer = footerRef.current;
            if (!footer) return;
            const contentEl = document.getElementById('wpcontent') || document.body;
            const rect = contentEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            footer.style.left = centerX + 'px';
            footer.style.transform = 'translateX(-50%)';
        };

        positionFooter();

        let resizeTimer;
        const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(positionFooter, 100); };
        window.addEventListener('resize', onResize);

        const observer = new MutationObserver(positionFooter);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => {
            window.removeEventListener('resize', onResize);
            clearTimeout(resizeTimer);
            observer.disconnect();
        };
    }, []);

    const update_step = async (stepType) => {

        if (1 === active_step && 'minus' === stepType) {
            navigate('/');
            return;
        }

        if (2 === active_step && 'minus' === stepType) {
            setFormError('');
            setActiveStep(1);
            return;
        }

        if (1 === active_step && 'plus' === stepType) {
            setActiveStep(2);
            return;
        }

        if (2 === active_step && 'plus' === stepType) {
            handleConnect();
            return;
        }
    }

    const step_one = () => {
        return (
            <>
                <div className='capsf-wp-header'>
                    <div className='capsf-wp-badge'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" /><line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
                        </svg>
                        {__('Social Feed', 'captain-social-feed')}
                    </div>
                    <span className='capsf-wp-heading'>{__('Create a New Feed', 'captain-social-feed')}</span>
                    <span className='capsf-wp-sub-heading'>{__('Choose a platform to get started. You\'ll connect your account on the next screen.', 'captain-social-feed')}</span>
                    <div className='capsf-wp-steps'>
                        <div className={`capsf-wp-step ${active_step >= 1 ? 'active' : ''}`}>
                            <span className='capsf-wp-step-dot'></span>
                            <span className='capsf-wp-step-label'>{__('Platform', 'captain-social-feed')}</span>
                        </div>
                        <span className='capsf-wp-step-line'></span>
                        <div className={`capsf-wp-step ${active_step >= 2 ? 'active' : ''}`}>
                            <span className='capsf-wp-step-dot'></span>
                            <span className='capsf-wp-step-label'>{__('Connect', 'captain-social-feed')}</span>
                        </div>
                    </div>
                </div>
                <div className='capsf-wp-content'>
                    {content_array?.map((data, index) => {
                        return (
                            <div
                                className={`capsf-wp-content-item ${selected_platform === data?.value ? 'capsf-wp-content-item-active' : ''}`}
                                key={index}
                                role="button"
                                tabIndex={0}
                                aria-pressed={selected_platform === data?.value}
                                onClick={() => setSelectedPlatform(data?.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPlatform(data?.value); } }}
                            >
                                {selected_platform === data?.value &&
                                    <span className='capsf-wp-content-item-checked'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style={{ height: '9px', width: '9px' }}>
                                            <path d="M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z" fill='white' />
                                        </svg>
                                    </span>
                                }
                                <span className='capsf-wp-content-item-icon'>
                                    {data?.icon}
                                </span>
                                <span className='capsf-wp-content-item-title'>{data?.title}</span>
                                <span className='capsf-wp-content-item-description'>{data?.description}</span>
                            </div>
                        )
                    })}
                </div>
            </>
        )
    }

    const handleConnect = async (e) => {
        if (e) e.preventDefault();
        setFormError('');

        const fieldOne = fieldOneRef.current?.value;
        const fieldTwo = fieldTwoRef.current?.value;

        if (!fieldOne || !fieldTwo) {
            setFormError(__('Please fill in all required fields.', 'captain-social-feed'));
            return;
        }

        if (creating) return;
        setCreating(true);

        const fields = PLATFORM_FIELDS[selected_platform];
        const feedName = selected_platform + '-' + Date.now();
        const settings = {
            feed_name: feedName,
            platform: selected_platform,
            status: 'active',
            [fields.one.key]: fieldOne,
            [fields.two.key]: fieldTwo,
        };

        try {
            const formData = new FormData();
            formData.append('action', 'capsf_dashboard_ajax_call');
            formData.append('nonce', capsf_data.capsf_nonce);
            formData.append('type', 'save_feed');
            formData.append('feed_name', feedName);
            formData.append('feed_type', selected_platform);
            formData.append('status', 'active');
            formData.append('settings', JSON.stringify(settings));

            const response = await fetch(capsf_data.ajax_url, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                navigate('/edit?id=' + result.data.feed_id);
            } else {
                setFormError(result.message || __('Something went wrong while saving.', 'captain-social-feed'));
            }
        } catch (err) {
            setFormError(__('Network error. Please try again.', 'captain-social-feed'));
        } finally {
            setCreating(false);
        }
    };

    const step_two = () => {
        const fields = PLATFORM_FIELDS[selected_platform];
        return (
            <>
                <div className='capsf-wp-header'>
                    <div className='capsf-wp-badge'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" /><line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
                        </svg>
                        {content_array.find(c => c.value === selected_platform)?.title}
                    </div>
                    <span className='capsf-wp-heading'>{fields.label}</span>
                    <span className='capsf-wp-sub-heading'>{__('Enter your credentials to start pulling in posts.', 'captain-social-feed')}</span>
                    <div className='capsf-wp-steps'>
                        <div className={`capsf-wp-step ${active_step >= 1 ? 'active' : ''}`}>
                            <span className='capsf-wp-step-dot'></span>
                            <span className='capsf-wp-step-label'>{__('Platform', 'captain-social-feed')}</span>
                        </div>
                        <span className='capsf-wp-step-line'></span>
                        <div className={`capsf-wp-step ${active_step >= 2 ? 'active' : ''}`}>
                            <span className='capsf-wp-step-dot'></span>
                            <span className='capsf-wp-step-label'>{__('Connect', 'captain-social-feed')}</span>
                        </div>
                    </div>
                </div>
                <form className='capsf-yt-form' onSubmit={handleConnect}>
                    <div className='capsf-yt-form-top'>
                        <div className='capsf-yt-form-icon-wrap'>
                            {content_array.find(c => c.value === selected_platform)?.icon}
                        </div>
                        <span className='capsf-yt-form-title'>{__('Add Source', 'captain-social-feed')}</span>
                        <span className='capsf-yt-form-desc'>{fields.desc}</span>
                    </div>

                    {form_error && (
                        <div className='capsf-yt-form-error-box'>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            <span>{form_error}</span>
                        </div>
                    )}

                    <div className='capsf-yt-form-fields'>
                        <div className='capsf-yt-field-wrap'>
                            <Form_field label={fields.one.label} name={fields.one.key} placeholder={fields.one.placeholder} htmlFor='capsf-field-one' required={true} type='password' ref={fieldOneRef} />
                            <a href={`#/docs/${fields.doc}`} className='capsf-yt-help-tag' target='_blank' rel='noopener noreferrer'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                {fields.help}
                            </a>
                        </div>

                        <div className='capsf-yt-field-wrap'>
                            <Form_field label={fields.two.label} name={fields.two.key} placeholder={fields.two.placeholder} htmlFor='capsf-field-two' required={true} ref={fieldTwoRef} />
                        </div>
                    </div>

                    <div className='capsf-yt-form-notice'>
                        <div className='capsf-yt-form-notice-header'>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                            </svg>
                            <span className='capsf-yt-form-notice-title'>{__('Need help connecting?', 'captain-social-feed')}</span>
                        </div>
                        <ul className='capsf-yt-form-notice-list'>
                            <li><span className='capsf-yt-notice-dot'></span><span>{fields.help} <a href={`#/docs/${fields.doc}`} className='capsf-yt-notice-doc-link'>{__('Learn more →', 'captain-social-feed')}</a></span></li>
                        </ul>
                    </div>
                </form>
            </>
        )
    }

    const create_content = () => {
        if (2 == active_step) {
            return step_two();
        }
        return step_one();
    }

    return (
        <div className='capsf-wp-wrapper'>
            {create_content()}
            <div className='capsf-wp-footer' ref={footerRef}>
                <span
                    className={`capsf-wp-footer-back`}
                    role="button"
                    tabIndex={0}
                    onClick={() => { update_step('minus') }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update_step('minus'); } }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                        <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                    </svg>
                    {__('Back', 'captain-social-feed')}
                </span>
                <div className='capsf-wp-footer-right'>
                    <span className='capsf-wp-footer-step-info'>{__('Step', 'captain-social-feed')} {active_step} {__('of', 'captain-social-feed')} 2</span>
                    <span
                        className='capsf-wp-footer-next'
                        role="button"
                        tabIndex={0}
                        onClick={() => { update_step('plus') }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update_step('plus'); } }}
                    >
                        {active_step === 2 ? (creating ? __('Creating…', 'captain-social-feed') : __('Create Feed', 'captain-social-feed')) : __('Continue', 'captain-social-feed')}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                    </span>
                </div>
            </div>
        </div>
    )
}

export default Create_page;
