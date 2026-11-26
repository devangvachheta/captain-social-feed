<?php
/**
 * Template: Social Post 1 - image on top, then the caption (Show More /
 * scroll), the author row and the likes / comments / shares row.
 *
 * Rendered once per post by Capsf_Shortcode; expects $capsf_card,
 * $item_class, $item_attrs and the loop's link variables.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$capsf_sc_item_cl = ! empty( $capsf_item_class ) ? $capsf_item_class : ( ! empty( $item_class ) ? $item_class : '' );
$capsf_sc_idx     = isset( $capsf_item_index ) ? absint( $capsf_item_index ) : ( isset( $index ) ? absint( $index ) : 0 );
$capsf_sc_class   = 'capsf-sc-card capsf-sc-card--media-top' . ( '' === $capsf_card['image'] ? ' capsf-sc-card--text' : '' ) . ( ! empty( $capsf_sc_item_cl ) ? ' ' . $capsf_sc_item_cl : '' );
?>
<article class="<?php echo esc_attr( $capsf_sc_class ); ?>" data-capsf-item data-capsf-index="<?php echo absint( $capsf_sc_idx ); ?>">
	<?php require CAPSF_PATH . 'includes/layouts/partials/media.php'; ?>

	<div class="capsf-sc-body">
		<?php require CAPSF_PATH . 'includes/layouts/partials/caption.php'; ?>
		<?php require CAPSF_PATH . 'includes/layouts/partials/author.php'; ?>
	</div>

	<?php require CAPSF_PATH . 'includes/layouts/partials/stats.php'; ?>
</article>
