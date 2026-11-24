/**
 * Captain Social Feed - Elementor widget panel script.
 *
 * Handles:
 * 1. Auto-loading current feed settings (type + style) when a feed is selected.
 * 2. Saving feed_type / card_style changes to the DB via AJAX.
 *
 * Uses capsfElementorData (localised by wp_localize_script):
 *   ajaxUrl, nonce, createUrl
 */
/* global capsfElementorData, elementor */
( function () {
	'use strict';

	var cfg     = ( typeof capsfElementorData !== 'undefined' ) ? capsfElementorData : {};
	var ajaxUrl = cfg.ajaxUrl || '/wp-admin/admin-ajax.php';
	var nonce   = cfg.nonce   || '';
	var saving  = false;

	/**
	 * Make an AJAX call to the plugin endpoint.
	 *
	 * @param {string} type Action type for the AJAX handler.
	 * @param {Object} data Extra FormData entries.
	 * @returns {Promise<Object>} Parsed JSON response.
	 */
	function capsfAjax( type, data ) {
		var fd = new FormData();
		fd.append( 'action', 'capsf_dashboard_ajax_call' );
		fd.append( 'nonce',  nonce );
		fd.append( 'type',   type );
		Object.keys( data ).forEach( function ( k ) { fd.append( k, data[ k ] ); } );
		return fetch( ajaxUrl, { method: 'POST', body: fd } ).then( function ( r ) { return r.json(); } );
	}

	/**
	 * Update the save-status element text.
	 *
	 * @param {string} text   Message to display.
	 * @param {string} colour Optional CSS colour.
	 */
	function setStatus( text, colour ) {
		var el = document.getElementById( 'capsf-el-save-status' );
		if ( ! el ) { return; }
		el.textContent = text;
		el.style.color = colour || '#64748b';
	}

	/**
	 * Save feed_type and/or card_style to the database.
	 *
	 * @param {number|string} feedId    Feed post ID.
	 * @param {string}        feedType  New feed type (empty = skip).
	 * @param {string}        cardStyle New card style (empty = skip).
	 */
	function capsfSavePartial( feedId, feedType, cardStyle ) {
		if ( ! feedId || saving ) { return; }
		saving = true;
		setStatus( 'Saving\u2026', '#64748b' );

		var data = { feed_id: feedId };
		if ( feedType )  { data.feed_type  = feedType;  }
		if ( cardStyle ) { data.card_style = cardStyle; }

		capsfAjax( 'save_feed_partial', data )
			.then( function ( res ) {
				if ( res.success ) {
					setStatus( '\u2713 Saved to database.', '#16a34a' );
				} else {
					setStatus( '\u2717 ' + ( res.message || 'Save failed' ), '#dc2626' );
				}
			} )
			.catch( function () { setStatus( '\u2717 Network error', '#dc2626' ); } )
			.finally( function () { saving = false; } );
	}

	/**
	 * Fetch the current feed_type and card_style from the database and
	 * update the dropdown selects in the Elementor panel accordingly.
	 *
	 * @param {number|string} feedId Feed post ID.
	 */
	function capsfLoadSettings( feedId ) {
		if ( ! feedId ) { return; }

		capsfAjax( 'get_feed_settings', { feed_id: feedId } )
			.then( function ( res ) {
				if ( ! res.success || ! res.data ) { return; }

				var data = res.data;

				// Update Feed Type dropdown.
				var ftSel = document.querySelector( '.elementor-control-feed_type_override select' );
				if ( ftSel && data.feed_type ) { ftSel.value = data.feed_type; }

				// Update Layout / Style dropdown.
				var csSel = document.querySelector( '.elementor-control-card_style_override select' );
				if ( csSel && data.card_style ) { csSel.value = data.card_style; }

				setStatus(
					'Current: ' + ( data.feed_type || '\u2014' ) + ' / ' + ( data.card_style || '\u2014' ),
					'#64748b'
				);
			} )
			.catch( function () {} );
	}

	/**
	 * Bind Elementor editor channel listeners.
	 * Retries until elementor is available.
	 */
	function capsfBind() {
		if ( typeof elementor === 'undefined' || ! elementor.channels || ! elementor.channels.editor ) {
			setTimeout( capsfBind, 1500 );
			return;
		}

		elementor.channels.editor.on( 'change', function ( model ) {
			var changed = model.changed || {};
			var s       = model.toJSON ? model.toJSON() : ( model.attributes || {} );

			// Feed ID changed → load current settings from DB.
			if ( 'feed_id' in changed ) {
				capsfLoadSettings( s.feed_id );
				return;
			}

			// Feed Type or Style changed → save to DB.
			if ( ! ( 'feed_type_override' in changed ) && ! ( 'card_style_override' in changed ) ) {
				return;
			}

			var feedId    = s.feed_id;
			var feedType  = s.feed_type_override  || '';
			var cardStyle = s.card_style_override || '';

			if ( feedId && ( feedType || cardStyle ) ) {
				capsfSavePartial( feedId, feedType, cardStyle );
			}
		} );

		// If a widget is already selected and has a feedId, load its settings immediately.
		var selected = elementor.selection && elementor.selection.getElements &&
			elementor.selection.getElements().first && elementor.selection.getElements().first();
		if ( selected && selected.model ) {
			var initialFeedId = selected.model.getSetting && selected.model.getSetting( 'feed_id' );
			if ( initialFeedId ) { capsfLoadSettings( initialFeedId ); }
		}
	}

	// Initialise when Elementor fires its ready event.
	if ( typeof elementor !== 'undefined' ) {
		elementor.on( 'document:loaded', capsfBind );
	}
	// Fallback: run on DOMContentLoaded and also retry.
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', capsfBind );
	} else {
		capsfBind();
	}
} )();
