<?php
/**
 * B2B Pricing for WooCommerce (ACF Field Override)
 * 
 * Add this code to your child theme's functions.php or a custom plugin.
 */

// Define the ACF field key for B2B price
define('BOUWBESLAG_B2B_PRICE_KEY', 'crucial_data_b2b_and_b2c_sales_price_b2b');

/**
 * Override Product Price for B2B Users
 */
function bouwbeslag_b2b_price_override($price, $product) {
    // 1. Check if user is logged in
    if (!is_user_logged_in()) {
        return $price;
    }

    // 2. Check if user has B2B or Admin role
    $user = wp_get_current_user();
    $allowed_roles = array('b2b_customer', 'administrator');
    $is_b2b = array_intersect($allowed_roles, $user->roles);

    if (empty($is_b2b)) {
        return $price;
    }

    // 3. Get the ACF B2B Price
    $product_id = $product->get_id();
    $b2b_price = get_post_meta($product_id, BOUWBESLAG_B2B_PRICE_KEY, true);

    // 4. Return B2B price if valid
    if (!empty($b2b_price) && is_numeric($b2b_price)) {
        return (float) $b2b_price;
    }

    return $price;
}

// Hook into price filters
add_filter('woocommerce_product_get_price', 'bouwbeslag_b2b_price_override', 10, 2);
add_filter('woocommerce_product_get_regular_price', 'bouwbeslag_b2b_price_override', 10, 2);
add_filter('woocommerce_product_variation_get_price', 'bouwbeslag_b2b_price_override', 10, 2);
add_filter('woocommerce_product_variation_get_regular_price', 'bouwbeslag_b2b_price_override', 10, 2);

// NOTE: Caching plugins might cache the price HTML. 
// If using caching, ensure you have logic to vary cache by user role.
