<?php

namespace Drupal\Tests\stuartc_tests\Functional;

use Drupal\file\Entity\File;
use Drupal\media\Entity\Media;
use Drupal\media\Entity\MediaType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

/**
 * Tests the `media--image`/`file--file` JSON:API endpoints
 * sync-content.mjs's loadFiles()/buildParagraph('media') depend on.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiMediaTest extends JsonApiFunctionalTestBase {

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    FieldStorageConfig::create([
      'field_name' => 'field_media_image',
      'entity_type' => 'media',
      'type' => 'image',
    ])->save();

    MediaType::create([
      'id' => 'image',
      'label' => 'Image',
      'source' => 'image',
      'source_configuration' => ['source_field' => 'field_media_image'],
    ])->save();

    FieldConfig::create([
      'field_name' => 'field_media_image',
      'entity_type' => 'media',
      'bundle' => 'image',
      'label' => 'Image',
    ])->save();
  }

  /**
   * Tests that file--file returns 200 with a `uri` attribute.
   */
  public function testFileEndpoint() {
    $file = File::create([
      'uri' => 'public://test.jpg',
      'filename' => 'test.jpg',
      'status' => 1,
    ]);
    $file->save();

    $result = $this->getJsonApi('/jsonapi/file/file');
    $this->assertEquals(200, $result['status']);
    $this->assertNotEmpty($result['body']['data']);
    $this->assertEquals('file--file', $result['body']['data'][0]['type']);
    $this->assertArrayHasKey('uri', $result['body']['data'][0]['attributes']);
  }

  /**
   * Tests that media--image returns 200 with the referenced file relationship.
   */
  public function testMediaImageEndpoint() {
    $file = File::create([
      'uri' => 'public://test.jpg',
      'filename' => 'test.jpg',
      'status' => 1,
    ]);
    $file->save();

    $media = Media::create([
      'bundle' => 'image',
      'name' => 'Test image',
      'field_media_image' => ['target_id' => $file->id(), 'alt' => 'Alt text'],
    ]);
    $media->save();

    $result = $this->getJsonApi('/jsonapi/media/image');
    $this->assertEquals(200, $result['status']);
    $this->assertNotEmpty($result['body']['data']);
    $this->assertEquals('media--image', $result['body']['data'][0]['type']);
    $this->assertArrayHasKey('field_media_image', $result['body']['data'][0]['relationships']);
  }

}
