<?php

namespace Drupal\Tests\stuartc_tests\Functional;

/**
 * Tests the `taxonomy_term--article_type`/`taxonomy_term--article_category`
 * JSON:API endpoints sync-content.mjs's resolveRelationships() depends on.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiTaxonomyTest extends JsonApiFunctionalTestBase {

  /**
   * Tests both article vocabularies' collection endpoints.
   */
  public function testTaxonomyCollections() {
    $this->createArticleVocabularies();
    $this->createTerm('article_type', 'Blog post');
    $this->createTerm('article_category', 'Drupal');

    foreach (['article_type', 'article_category'] as $vid) {
      $result = $this->getJsonApi("/jsonapi/taxonomy_term/$vid");
      $this->assertEquals(200, $result['status'], "GET /jsonapi/taxonomy_term/$vid should return 200.");
      $this->assertNotEmpty($result['body']['data'], "Expected at least one $vid term.");
      $this->assertEquals("taxonomy_term--$vid", $result['body']['data'][0]['type']);
      $this->assertArrayHasKey('name', $result['body']['data'][0]['attributes']);
    }
  }

}
