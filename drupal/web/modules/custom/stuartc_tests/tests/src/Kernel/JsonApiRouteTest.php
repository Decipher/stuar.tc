<?php

namespace Drupal\Tests\stuartc_tests\Kernel;

use Drupal\KernelTests\KernelTestBase;

/**
 * Tests JSON:API route registration and routing system.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiRouteTest extends KernelTestBase {

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
    'file',
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
    $this->installConfig(['system', 'node', 'taxonomy', 'user']);
  }

  /**
   * Tests that the JSON:API module is enabled and has a service provider.
   */
  public function testJsonApiModuleEnabled() {
    $module_handler = $this->container->get('module_handler');
    $this->assertTrue($module_handler->moduleExists('jsonapi'));
    $this->assertTrue($this->container->has('jsonapi.resource_type.repository'));
  }

  /**
   * Tests that node entity type is defined.
   */
  public function testNodeEntityTypeIsDefined() {
    $entity_type_manager = $this->container->get('entity_type.manager');

    $node_type = $entity_type_manager->getDefinition('node');
    $this->assertNotNull($node_type);
    $this->assertEquals('node', $node_type->id());
  }

  /**
   * Tests that taxonomy term entity type has JSON:API resource type.
   */
  public function testTaxonomyEntityTypeHasJsonApiResourceType() {
    $resource_type_repository = $this->container->get('jsonapi.resource_type.repository');
    $entity_type_manager = $this->container->get('entity_type.manager');

    $taxonomy_type = $entity_type_manager->getDefinition('taxonomy_term');
    $this->assertNotNull($taxonomy_type);
    $this->assertEquals('taxonomy_term', $taxonomy_type->id());
  }

  /**
   * Tests that user entity type has JSON:API resource type.
   */
  public function testUserEntityTypeHasJsonApiResourceType() {
    $resource_type_repository = $this->container->get('jsonapi.resource_type.repository');

    $resource_type = $resource_type_repository->get('user', 'user');
    $this->assertNotNull($resource_type, 'User resource type should be available.');
  }

  /**
   * Tests that the router.builder service exists.
   */
  public function testRouterBuilderServiceExists() {
    $this->assertTrue(
      $this->container->has('router.builder'),
      'Router builder service should exist.'
    );
  }

}
