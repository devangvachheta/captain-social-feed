(function (blocks, element, components, i18n, wpServerSideRender, blockEditor) {
	var el                = element.createElement;
	var Fragment          = element.Fragment;
	var SelectControl     = components.SelectControl;
	var PanelBody         = components.PanelBody;
	var PanelRow          = components.PanelRow;
	var Spinner           = components.Spinner;
	var Notice            = components.Notice;
	var __                = i18n.__;
	var InspectorControls = blockEditor && blockEditor.InspectorControls;
	var ServerSideRender  = (wpServerSideRender && wpServerSideRender.default) || wpServerSideRender || (components && components.ServerSideRender);

	// ── Block registration ────────────────────────────────────────────────
	blocks.registerBlockType(
		'captain-social-feed/feed',
		{
			title: __( 'Captain Social Feed', 'captain-social-feed' ),
			icon: 'video-alt3',
			category: 'captain-social-feed',
			attributes: {
				feedId: { type: 'number', default: 0 },
			},

			edit: function (props) {
				var attrs   = props.attributes;
				var setAttr = props.setAttributes;
				var feeds   = window.capsfBlockFeeds || {};

				var feedOptions = [
				{ label: __( 'None', 'captain-social-feed' ), value: 0 }
				].concat(
					Object.keys( feeds ).map(
						function (id) {
							return { label: feeds[id], value: parseInt( id, 10 ) };
						}
					)
				);

				// Preview area
				var previewElement = attrs.feedId
				? (ServerSideRender ? el( ServerSideRender, { block : 'captain-social-feed/feed', attributes : attrs } ) : null)
				: el(
					'div',
					{
						style: { padding: '40px', textAlign: 'center', background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '12px', maxWidth: '450px', margin: '20px auto' }
					},
					el(
						'div',
						{ style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: '#e0e7ff', borderRadius: '50%', marginBottom: '16px' } },
						el( 'svg', { viewBox: '0 0 24 24', width: '34', height: '34', dangerouslySetInnerHTML: { __html: '<path fill="#4f46e5" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z"/><path fill="#ffffff" d="M9.6 15.5v-7l6.4 3.5-6.4 3.5z"/>' } } )
					),
					el( 'h3', { style: { fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px' } }, __( 'Captain Social Feed', 'captain-social-feed' ) ),
					el( 'p',  { style: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 20px' } }, __( 'Select a Feed from the block settings panel on the right.', 'captain-social-feed' ) ),
					el( 'a',  { href: window.capsfCreateFeedUrl || '#', target: '_blank', style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#4f46e5', color: '#ffffff', fontWeight: '600', fontSize: '13px', textDecoration: 'none', padding: '10px 18px', borderRadius: '6px' } }, __( 'Create a Feed', 'captain-social-feed' ) )
				);

				// Sidebar inspector panels
				var inspectorControls = InspectorControls ? el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Feed Settings', 'captain-social-feed' ), initialOpen: true },
						el(
							SelectControl,
							{
								label:    __( 'Feed', 'captain-social-feed' ),
								value:    attrs.feedId,
								options:  feedOptions,
								onChange: function (val) {
									setAttr( { feedId: parseInt( val, 10 ) || 0 } );
								}
							}
						)
					),
					el(
						PanelBody,
						{ title: __( 'Documentation', 'captain-social-feed' ), initialOpen: false },
						el(
							'p',
							{ style: { fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 12px' } },
							__( "If you haven't created any feeds yet, create one first from the plugin dashboard.", 'captain-social-feed' )
						),
						el(
							'a',
							{ href: window.capsfCreateFeedUrl || '#', target: '_blank', rel: 'noopener noreferrer', style: { display: 'inline-flex', alignItems: 'center', background: '#4f46e5', color: '#fff', fontWeight: '600', fontSize: '13px', textDecoration: 'none', padding: '9px 14px', borderRadius: '5px' } },
							__( 'Create a Feed', 'captain-social-feed' )
						)
					)
				) : null;

				// Block toolbar feed selector (also visible inline in editor)
				var inlineFeedControl = el(
					SelectControl,
					{
						label:    __( 'Feed', 'captain-social-feed' ),
						value:    attrs.feedId,
						options:  feedOptions,
						onChange: function (val) {
							setAttr( { feedId: parseInt( val, 10 ) || 0 } ); }
					}
				);

				return el(
					Fragment,
					{},
					inspectorControls,
					el(
						'div',
						{ className: 'capsf-gutenberg-feed-block' },
						inlineFeedControl,
						previewElement
					)
				);
			},

			save: function () {
				return null; }
		}
	);

})(
	window.wp.blocks,
	window.wp.element,
	window.wp.components,
	window.wp.i18n,
	window.wp.serverSideRender,
	window.wp.blockEditor
);
