import React from 'react';
import './attention_tooltip.scss';

/**
 * Floating "look here" tooltip bubble - purely presentational, driven by
 * the global attention-ping system (src/context/AttentionPingContext.jsx).
 * There's exactly one of these mounted for the whole app.
 */
const AttentionTooltip = ( { message, top, left, placement = 'top' } ) => {
    if ( ! message ) return null;

    return (
        <div
            className={ `capsf-attn-tooltip capsf-attn-tooltip--${ placement }` }
            style={ { top, left } }
        >
            { message }
            <span className="capsf-attn-tooltip-arrow" />
        </div>
    );
};

export default AttentionTooltip;
