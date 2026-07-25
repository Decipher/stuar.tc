<?php

namespace Drupal\Tests\stuartc_tests\Functional;

use Drupal\config_pages\Entity\ConfigPages;
use Drupal\config_pages\Entity\ConfigPagesType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;
use Drupal\user\RoleInterface;

/**
 * Tests the `config_pages--druxt_settings` JSON:API endpoint — matches the
 * real site's config_pages.type.druxt_settings.yml (site_name, social links).
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiConfigPagesTest extends JsonApiFunctionalTestBase {

  /**
   * Tests that config_pages--druxt_settings returns 200 with site_name.
   */
  public function testDruxtSettingsEndpoint() {
    // context/menu are required mapping keys per config_pages' own config
    // schema (config_pages.type.*) — omitting them fails config validation
    // rather than defaulting to empty, so mirror the real site's
    // config/sync/config_pages.type.druxt_settings.yml shape here.
    ConfigPagesType::create([
      'id' => 'druxt_settings',
      'label' => 'Druxt settings',
      'context' => [
        'show_warning' => FALSE,
        'group' => [],
        'fallback' => ['language' => ''],
      ],
      'menu' => [
        'path' => '',
        'weight' => 0,
        'description' => '',
      ],
    ])->save();

    FieldStorageConfig::create([
      'field_name' => 'field_site_name',
      'entity_type' => 'config_pages',
      'type' => 'string',
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_site_name',
      'entity_type' => 'config_pages',
      'bundle' => 'druxt_settings',
      'label' => 'Site name',
    ])->save();

    // Grants the same permission the real anonymous role has for this
    // specific config page type (config_pages generates one permission per
    // type: "view <type> config page entity").
    user_role_grant_permissions(RoleInterface::ANONYMOUS_ID, [
      'view druxt_settings config page entity',
    ]);

    $config_page = ConfigPages::create([
      'type' => 'druxt_settings',
      // The content entity's own 'context' base field (distinct from the
      // config_pages_type's context mapping above) has a NOT NULL DB column
      // with no default. An empty string doesn't satisfy that: Drupal's
      // FieldItemList::preSave() runs filterEmptyItems() before save, and an
      // empty string is "empty" for a string_long item, so it gets stripped
      // to no value (NULL) regardless of what's assigned here. Real saves go
      // through ConfigPagesType::getContextData(), which serializes an empty
      // context array to 'a:0:{}' when no context plugins are enabled —
      // mirror that exact value.
      'context' => serialize([]),
      'field_site_name' => 'stuar.tc',
    ]);
    $config_page->save();

    $result = $this->getJsonApi('/jsonapi/config_pages/druxt_settings');
    $this->assertEquals(200, $result['status']);
    $this->assertNotEmpty($result['body']['data']);
    $this->assertEquals('config_pages--druxt_settings', $result['body']['data'][0]['type']);
    $this->assertEquals('stuar.tc', $result['body']['data'][0]['attributes']['field_site_name']);
  }

}
