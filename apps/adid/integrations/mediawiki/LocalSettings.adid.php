<?php
// Include from private LocalSettings.php on a compatible PluggableAuth/OpenIDConnect installation.
if ( !defined( 'MEDIAWIKI' ) || getenv( 'ADID_WIKI_ENABLED' ) !== 'true' ) {
    return;
}
$adidIssuer = getenv( 'ADID_AUTH0_ISSUER' );
$adidId = getenv( 'ADID_WIKI_CLIENT_ID' );
$adidSecret = getenv( 'ADID_WIKI_CLIENT_SECRET' );
if ( !$adidIssuer || !preg_match( '~^https://[a-z0-9.-]+/?$~iD', $adidIssuer ) || !$adidId || !$adidSecret ) {
    // Keep established login methods available if the optional connection is incomplete.
    return;
}
wfLoadExtension( 'PluggableAuth' );
wfLoadExtension( 'OpenIDConnect' );
$wgPluggableAuth_EnableLocalLogin = true;
$wgOpenIDConnect_MigrateUsersByEmail = false;
$wgOpenIDConnect_MigrateUsersByUserName = false;
$wgPluggableAuth_Config['Sign in with AD.iD'] = [
    'plugin' => 'OpenIDConnect',
    'data' => [
        'providerURL' => rtrim( $adidIssuer, '/' ) . '/',
        'clientID' => $adidId,
        'clientsecret' => $adidSecret,
    ],
];
