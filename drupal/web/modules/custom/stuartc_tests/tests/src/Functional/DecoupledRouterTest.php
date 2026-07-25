<?php

namespace Drupal\Tests\stuartc_tests\Functional;

/**
 * Tests `/router/translate-path`, the decoupled_router endpoint the Nuxt
 * frontend's historical Druxt-based routing relied on and which underlies
 * path-alias resolution for decoupled consumers generally.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class DecoupledRouterTest extends JsonApiFunctionalTestBase {

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->createArticleContentType();
    // field_article_category/field_article_type target these bundles —
    // JSON:API's resource type repository (which decoupled_router relies on
    // to resolve entity.jsonapi.resourceName) refuses to build if a
    // referenced target bundle doesn't exist yet.
    $this->createArticleVocabularies();
  }

  /**
   * Tests that a real article path alias resolves to the correct entity.
   */
  public function testTranslatePathResolvesArticle() {
    $node = $this->createArticleNode(['title' => 'Hello world']);

    $alias_storage = \Drupal::entityTypeManager()->getStorage('path_alias');
    $alias_storage->create([
      'path' => '/node/' . $node->id(),
      'alias' => '/writing/hello-world',
    ])->save();

    $result = $this->getJsonApi('/router/translate-path?path=' . rawurlencode('/writing/hello-world'));
    $this->assertEquals(200, $result['status']);
    $this->assertEquals('node', $result['body']['entity']['type']);
    $this->assertEquals('article', $result['body']['entity']['bundle']);
    $this->assertEquals($node->uuid(), $result['body']['entity']['uuid']);
    $this->assertArrayHasKey('jsonapi', $result['body']);
    $this->assertEquals('node--article', $result['body']['jsonapi']['resourceName']);
  }

  /**
   * Tests that an unknown path returns a 404.
   */
  public function testTranslatePathUnknownReturns404() {
    $result = $this->getJsonApi('/router/translate-path?path=' . rawurlencode('/no-such-page'));
    $this->assertEquals(404, $result['status']);
  }

}
