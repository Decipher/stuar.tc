<?php

namespace Drupal\Tests\stuartc_tests\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\paragraphs\Entity\ParagraphsType;

/**
 * Tests that every paragraph bundle nuxt/scripts/sync-content.mjs's
 * buildParagraph() switch statement handles is actually registered as a
 * JSON:API resource type — catches drift if Drupal's field_content
 * target_bundles ever grows a bundle the sync script doesn't handle
 * (mirrors sync-content.mjs's own checkParagraphSchema() from the other
 * direction).
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiParagraphTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'field',
    'text',
    'filter',
    'file',
    'entity_reference_revisions',
    'paragraphs',
    'jsonapi',
    'serialization',
  ];

  /**
   * Bundles nuxt/scripts/sync-content.mjs's buildParagraph() handles.
   *
   * @see nuxt/scripts/sync-content.mjs SUPPORTED_PARAGRAPH_BUNDLES
   */
  const SUPPORTED_BUNDLES = [
    'text_formatted',
    'code',
    'repository',
    'media',
    'section',
    'card',
    'card_group',
    'jumbotron',
    'link',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('user');
    $this->installEntitySchema('paragraph');
    $this->installConfig(['system', 'field', 'filter']);

    foreach (self::SUPPORTED_BUNDLES as $bundle) {
      ParagraphsType::create(['id' => $bundle, 'label' => $bundle])->save();
    }
  }

  /**
   * Tests that each bundle sync-content.mjs handles has a JSON:API resource type.
   */
  public function testEachSupportedBundleHasResourceType() {
    $resource_type_repository = $this->container->get('jsonapi.resource_type.repository');

    foreach (self::SUPPORTED_BUNDLES as $bundle) {
      $resource_type = $resource_type_repository->get('paragraph', $bundle);
      $this->assertNotNull($resource_type, "paragraph--$bundle should be a registered JSON:API resource type.");
      $this->assertEquals("paragraph--$bundle", $resource_type->getTypeName());
    }
  }

}
