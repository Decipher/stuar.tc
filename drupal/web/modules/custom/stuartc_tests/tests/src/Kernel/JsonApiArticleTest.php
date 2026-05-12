<?php

namespace Drupal\Tests\stuartc_tests\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\user\Entity\User;

/**
 * Tests JSON:API article resource types and serialization.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiArticleTest extends KernelTestBase {

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
    'text',
    'field',
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
   * Tests that JSON:API resource type repository has article resource type.
   */
  public function testArticleResourceTypeExists() {
    $resource_type_repository = $this->container->get('jsonapi.resource_type.repository');

    $resource_type = $resource_type_repository->get('node', 'article');
    $this->assertNotNull($resource_type);
    $this->assertEquals('node--article', $resource_type->getTypeName());
  }

  /**
   * Tests that article resource type has expected fields.
   */
  public function testArticleResourceTypeFields() {
    $resource_type_repository = $this->container->get('jsonapi.resource_type.repository');

    $resource_type = $resource_type_repository->get('node', 'article');
    $fields = $resource_type->getFields();

    $this->assertArrayHasKey('title', $fields);
    $this->assertArrayHasKey('uuid', $fields);
    $this->assertArrayHasKey('status', $fields);
    $this->assertArrayHasKey('created', $fields);
    $this->assertArrayHasKey('changed', $fields);
  }

  /**
   * Tests that node can be created and loaded.
   */
  public function testNodeCreation() {
    $user = User::create([
      'name' => 'testuser',
      'mail' => 'test@example.com',
      'status' => 1,
    ]);
    $user->save();

    $node = Node::create([
      'type' => 'article',
      'title' => 'Test Article',
      'status' => 1,
      'uid' => $user->id(),
    ]);
    $node->save();

    $loaded_node = Node::load($node->id());
    $this->assertEquals('Test Article', $loaded_node->getTitle());
    $this->assertEquals('article', $loaded_node->bundle());
  }

  /**
   * Tests that JSON:API serializer service exists.
   */
  public function testJsonApiSerializerExists() {
    $this->assertTrue($this->container->has('jsonapi.serializer'));
    $this->assertTrue($this->container->has('jsonapi.resource_type.repository'));
    $this->assertTrue($this->container->has('entity_field.manager'));
  }

}
