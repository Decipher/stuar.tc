<?php

namespace Drupal\Tests\stuartc_tests\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;

/**
 * Tests JSON:API field handling and entity serialization.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiFieldTest extends KernelTestBase {

  /**
   * Modules to enable.
   *
   * @var array
   */
  protected static $modules = [
    'system',
    'user',
    'node',
    'taxonomy',
    'jsonapi',
    'serialization',
    'field',
    'file',
    'text',
    'filter',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('node');
    $this->installEntitySchema('taxonomy_term');
    $this->installEntitySchema('user');
    $this->installConfig(['system', 'node', 'taxonomy', 'user', 'field', 'filter']);

    NodeType::create([
      'type' => 'article',
      'name' => 'Article',
    ])->save();
  }

  /**
   * Tests that node entity can be created and has the expected fields.
   */
  public function testNodeEntityFields() {
    $node = Node::create([
      'type' => 'article',
      'title' => 'Test Article',
      'status' => 1,
    ]);
    $node->save();

    $this->assertEquals('Test Article', $node->getTitle());
    $this->assertEquals('article', $node->bundle());
    $this->assertEquals(1, $node->isPublished());
  }

  /**
   * Tests that JSON:API resource type repository can get node resource types.
   */
  public function testJsonApiResourceTypeFields() {
    $resource_type_repository = $this->container->get('jsonapi.resource_type.repository');

    $resource_type = $resource_type_repository->get('node', 'article');
    $this->assertNotNull($resource_type);
    $this->assertEquals('node--article', $resource_type->getTypeName());

    $fields = $resource_type->getFields();
    $this->assertArrayHasKey('title', $fields);
    $this->assertArrayHasKey('uuid', $fields);
    $this->assertArrayHasKey('status', $fields);
  }

  /**
   * Tests that JSON:API serializer service exists.
   */
  public function testJsonApiSerializerService() {
    $this->assertTrue(
      $this->container->has('jsonapi.serializer'),
      'JSON:API serializer service should exist.'
    );
  }

  /**
   * Tests that entity field manager service exists.
   */
  public function testEntityFieldManagerService() {
    $this->assertTrue(
      $this->container->has('entity_field.manager'),
      'Entity field manager service should exist.'
    );

    $field_manager = $this->container->get('entity_field.manager');
    $base_fields = $field_manager->getBaseFieldDefinitions('node');
    $this->assertArrayHasKey('title', $base_fields);
    $this->assertArrayHasKey('uuid', $base_fields);
  }

}
