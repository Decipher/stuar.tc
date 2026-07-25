<?php

namespace Drupal\Tests\stuartc_tests\Functional;

use Drupal\block_content\Entity\BlockContent;
use Drupal\block_content\Entity\BlockContentType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

/**
 * Tests the `block_content--basic_block` JSON:API endpoint.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiBlockContentTest extends JsonApiFunctionalTestBase {

  /**
   * Tests that block_content--basic_block returns 200 with body content.
   */
  public function testBasicBlockEndpoint() {
    BlockContentType::create(['id' => 'basic_block', 'label' => 'Basic block'])->save();

    // Core no longer ships a default 'body' field storage for block_content
    // (block_content_add_body_field() is deprecated in drupal:11.3.0 with no
    // replacement, and its own config/install/field.storage.block_content.body.yml
    // is gone) — the real site's basic_block config already has its own
    // exported 'body' field from when it was created, so only this test
    // fixture needs to create it explicitly now.
    FieldStorageConfig::create([
      'field_name' => 'body',
      'entity_type' => 'block_content',
      'type' => 'text_with_summary',
    ])->save();
    FieldConfig::create([
      'field_name' => 'body',
      'entity_type' => 'block_content',
      'bundle' => 'basic_block',
      'label' => 'Body',
    ])->save();

    $block = BlockContent::create([
      'type' => 'basic_block',
      'info' => 'Test block',
      'body' => ['value' => '<p>Block body</p>', 'format' => 'basic_html'],
    ]);
    $block->save();

    $result = $this->getJsonApi('/jsonapi/block_content/basic_block');
    $this->assertEquals(200, $result['status']);
    $this->assertNotEmpty($result['body']['data']);
    $this->assertEquals('block_content--basic_block', $result['body']['data'][0]['type']);
    $this->assertArrayHasKey('body', $result['body']['data'][0]['attributes']);
  }

}
