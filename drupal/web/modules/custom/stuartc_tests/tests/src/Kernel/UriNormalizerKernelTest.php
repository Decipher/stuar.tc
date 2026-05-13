<?php

namespace Drupal\Tests\stuartc_tests\Kernel;

use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\KernelTests\KernelTestBase;
use Drupal\link\LinkItemInterface;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\tome_sync\Normalizer\UriNormalizer;

/**
 * Tests tome_sync URI normalizer handles non-string values.
 *
 * The UriNormalizer::normalize() calls strpos() on the value returned by
 * parent::normalize(). When that value is an array instead of a string,
 * PHP 8.3 throws a TypeError. This test verifies the is_string() guard.
 *
 * @see https://www.drupal.org/project/tome/issues/3527948
 *
 * @group tome_sync
 * @group stuartc_tests
 */
class UriNormalizerKernelTest extends KernelTestBase {

  protected $strictConfigSchema = FALSE;

  protected static $modules = [
    'system',
    'user',
    'node',
    'field',
    'text',
    'serialization',
    'link',
    'tome',
    'tome_sync',
    'tome_base',
    'file',
  ];

  protected function setUp(): void {
    parent::setUp();

    $this->installConfig('system');
    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installConfig(['user', 'node']);
    $this->installEntitySchema('file');
    $this->installSchema('node', 'node_access');
    $this->installSchema('file', 'file_usage');
    $this->installSchema('system', 'sequences');
    $this->installSchema('tome_sync', ['tome_sync_content_hash']);

    NodeType::create(['type' => 'article', 'name' => 'Article'])->save();
  }

  public function testNormalizeEntityUri() {
    $serializer = \Drupal::service('serializer');

    FieldStorageConfig::create([
      'entity_type' => 'node',
      'field_name' => 'field_link',
      'type' => 'link',
    ])->save();
    FieldConfig::create([
      'entity_type' => 'node',
      'field_name' => 'field_link',
      'bundle' => 'article',
      'settings' => ['link_type' => LinkItemInterface::LINK_GENERIC],
    ])->save();

    $target = Node::create(['type' => 'article', 'title' => 'Target']);
    $target->save();

    $source = Node::create([
      'type' => 'article',
      'title' => 'Source',
      'field_link' => ['uri' => 'entity:node/' . $target->id()],
    ]);
    $source->save();

    $normalized = $serializer->normalize($source, 'json');
    $this->assertSame(
      'entity:node/' . $target->uuid(),
      $normalized['field_link'][0]['uri']
    );
  }

  public function testNormalizeExternalUri() {
    $serializer = \Drupal::service('serializer');

    FieldStorageConfig::create([
      'entity_type' => 'node',
      'field_name' => 'field_link',
      'type' => 'link',
    ])->save();
    FieldConfig::create([
      'entity_type' => 'node',
      'field_name' => 'field_link',
      'bundle' => 'article',
      'settings' => ['link_type' => LinkItemInterface::LINK_GENERIC],
    ])->save();

    $entity = Node::create([
      'type' => 'article',
      'title' => 'Source',
      'field_link' => ['uri' => 'https://example.com'],
    ]);
    $entity->save();

    $normalized = $serializer->normalize($entity, 'json');
    $this->assertSame('https://example.com', $normalized['field_link'][0]['uri']);
  }

  public function testNormalizeWithArrayUriValueDoesNotThrow() {
    $entity_type_manager = $this->container->get('entity_type.manager');
    $entity_repository = $this->container->get('entity.repository');
    $normalizer = new UriNormalizer($entity_type_manager, $entity_repository);

    $array_value = [
      'uri' => 'entity:node/1',
      'options' => [],
    ];

    $uri_data = $this->createMock(\Drupal\Core\TypedData\Plugin\DataType\Uri::class);
    $uri_data->method('getValue')->willReturn($array_value);
    $uri_data->method('getCastedValue')->willReturn($array_value);
    $uri_data->method('getParent')->willReturn(NULL);

    $result = $normalizer->normalize($uri_data, 'json');
    $this->assertIsArray($result);
  }

}
